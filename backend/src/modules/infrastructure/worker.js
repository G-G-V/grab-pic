import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { prisma } from './prisma.client.js';
import { generatePresignedGetUrl } from './s3.service.js';
import { processImage } from './ml.service.js';

// const connection = {
//   host: new URL(env.REDIS_URL).hostname,
//   port: parseInt(new URL(env.REDIS_URL).port) || 6379,
// };

const redisUrl = new URL(env.REDIS_URL);

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
  maxRetriesPerRequest: null,
};

/**
 * Background worker that processes photo embedding jobs.
 * Triggered when organizer confirms upload via POST /photos/confirm.
 *
 * Job data shape: { photoId: string }
 *
 * Flow per job:
 * 1. Fetch photo record from DB
 * 2. Generate S3 presigned GET URL from storage_key
 * 3. Call ML service with imageUrl → get face embeddings
 * 4. Insert each embedding into faces table
 * 5. Update photo status to 'processed' (or 'failed' on error)
 */
const worker = new Worker(
  'photo-processing',
  async (job) => {
    const { photoId } = job.data;

    // 1. Fetch photo from DB
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    // 2. Generate presigned GET URL so ML can download the image from S3
    const imageUrl = await generatePresignedGetUrl(photo.storage_key);

    //
    // console.log('[worker] imageUrl:', imageUrl); //
    //

    // 3. Call ML service — returns array of { embedding, bbox }
    const faces = await processImage({ imageUrl });

    // 4. Insert all detected face embeddings into faces table
    // Prisma does not support vector type natively — use $executeRaw per face
    for (const face of faces) {
      const embeddingStr = `[${face.embedding.join(',')}]`;
      await prisma.$executeRaw`
        INSERT INTO faces (id, photo_id, event_id, embedding, created_at)
        VALUES (
          gen_random_uuid(),
          ${photo.id}::uuid,
          ${photo.event_id}::uuid,
          ${embeddingStr}::vector(512),
          NOW()
        )
      `;
    }

    // 5. Mark photo as processed
    await prisma.photo.update({
      where: { id: photoId },
      data: { processing_status: 'processed' },
    });

    console.log(
      `[worker] Photo ${photoId} processed — ${faces.length} face(s) detected.`
    );
  },
  { connection }
);

// If all retries exhausted, mark photo as failed in DB
worker.on('failed', async (job, err) => {
  console.error(
    `[worker] Job failed for photoId ${job?.data?.photoId}:`,
    err.message
  );

  if (job?.data?.photoId) {
    await prisma.photo.update({
      where: { id: job.data.photoId },
      data: { processing_status: 'failed' },
    });
  }
});

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed successfully.`);
});

export default worker;

//
////
// Two things worth noting: the $executeRaw for face insertion is intentional and necessary — Prisma 7 still can't handle vector(512) natively so raw SQL is the only way to insert embeddings, exactly as your DB schema doc specifies. The failed event handler is important — if all 3 retry attempts are exhausted, the photo gets marked 'failed' in DB so the organizer knows processing didn't succeed rather than it being stuck on 'pending' forever.
