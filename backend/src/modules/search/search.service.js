import { prisma } from '../infrastructure/prisma.client.js';
import { processImage } from '../infrastructure/ml.service.js';
import { generatePresignedGetUrl } from '../infrastructure/s3.service.js';

const SIMILARITY_THRESHOLD = 0.6;
const MATCH_LIMIT = 50;

/**
 * Core search flow:
 * 1. Verify user is a member of the event
 * 2. Send selfie base64 to ML service → get single embedding
 * 3. Run pgvector cosine similarity query filtered by event_id + threshold
 * 4. Generate presigned GET URLs for each matched photo
 * 5. Optionally log the search
 * 6. Return matches with similarity scores
 */
export const searchPhotosService = async ({ eventId, userId, imageBase64 }) => {
  // 1. Verify event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });

  if (!event) {
    const err = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify user has joined this event
  const membership = await prisma.eventMember.findUnique({
    where: {
      event_id_user_id: {
        event_id: eventId,
        user_id: userId,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    const err = new Error('Access denied. You have not joined this event.');
    err.statusCode = 403;
    throw err;
  }

  // 3. Call ML service with base64 only — never send imageUrl here
  const faces = await processImage({ imageBase64 });

  if (!faces || faces.length === 0) {
    const err = new Error('No face detected in the provided image.');
    err.statusCode = 400;
    throw err;
  }

  // Use the first detected face embedding (selfie = single person)
  const embedding = faces[0].embedding;
  const embeddingStr = `[${embedding.join(',')}]`;

  // 4. pgvector cosine similarity query
  // Filters by event_id + similarity threshold, ordered by closest match, capped at LIMIT
  const matches = await prisma.$queryRaw`
    SELECT
      photo_id::text,
      1 - (embedding <=> ${embeddingStr}::vector(512)) AS similarity
    FROM faces
    WHERE event_id = ${eventId}
      AND 1 - (embedding <=> ${embeddingStr}::vector(512)) >= ${SIMILARITY_THRESHOLD}
    ORDER BY embedding <=> ${embeddingStr}::vector(512)
    LIMIT ${MATCH_LIMIT}
  `;

  if (!matches || matches.length === 0) {
    return { matches: [] };
  }

  //
  const deduplicated = Object.values(
    matches.reduce((acc, match) => {
      if (
        !acc[match.photo_id] ||
        match.similarity > acc[match.photo_id].similarity
      ) {
        acc[match.photo_id] = match;
      }
      return acc;
    }, {})
  );
  //

  // 5. Fetch storage_key for each matched photo_id, generate presigned GET URLs
  // const photoIds = matches.map((m) => m.photo_id);
  const photoIds = deduplicated.map((m) => m.photo_id);

  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds } },
    select: { id: true, storage_key: true },
  });

  const photoMap = Object.fromEntries(photos.map((p) => [p.id, p.storage_key]));

  const results = await Promise.all(
    // matches.map(async (match) => {
    deduplicated.map(async (match) => {
      const storageKey = photoMap[match.photo_id];
      const url = await generatePresignedGetUrl(storageKey);
      return {
        photoId: match.photo_id,
        url,
        similarityScore: parseFloat(Number(match.similarity).toFixed(4)),
      };
    })
  );

  // 6. Log search (non-blocking, best-effort — never fail the request if this fails)
  prisma.searchLog
    .create({ data: { user_id: userId, event_id: eventId } })
    .catch((err) =>
      console.error('[search] Failed to log search:', err.message)
    );

  return { matches: results };
};
