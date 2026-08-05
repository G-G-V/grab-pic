import { prisma } from '../infrastructure/prisma.client.js';
import {
  generatePresignedPutUrl,
  buildStorageKey,
} from '../infrastructure/s3.service.js';
import { photoQueue } from '../infrastructure/queue.js';
import { randomUUID } from 'crypto';

/**
 * Creates photo records in DB (status='pending'),
 * generates a presigned PUT URL per photo for direct frontend → S3 upload.
 * Verifies the event exists and belongs to the organizer.
 */
export const presignPhotosService = async ({
  eventId,
  organizerId,
  filenames,
}) => {
  // Verify event exists and organizer owns it
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizer_id: true },
  });

  if (!event) {
    const err = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }

  if (event.organizer_id !== organizerId) {
    const err = new Error('Access denied. You do not own this event.');
    err.statusCode = 403;
    throw err;
  }

  // Build photo records + presigned URLs concurrently
  const results = await Promise.all(
    filenames.map(async (filename) => {
      const photoId = randomUUID();
      const storageKey = buildStorageKey(eventId, photoId, filename);

      // Create DB record first — status defaults to 'pending'
      await prisma.photo.create({
        data: {
          id: photoId,
          event_id: eventId,
          storage_key: storageKey,
        },
      });

      const uploadUrl = await generatePresignedPutUrl(storageKey);

      return { filename, photoId, uploadUrl };
    })
  );

  return { urls: results };
};

/**
 * Enqueues a BullMQ job per photoId for background ML processing.
 * Verifies each photoId belongs to the event and the organizer owns the event.
 * Returns immediately — never calls ML here.
 */
export const confirmUploadService = async ({
  eventId,
  organizerId,
  photoIds,
}) => {
  // Verify event ownership
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizer_id: true },
  });

  if (!event) {
    const err = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }

  if (event.organizer_id !== organizerId) {
    const err = new Error('Access denied. You do not own this event.');
    err.statusCode = 403;
    throw err;
  }

  // Verify all photoIds belong to this event
  const photos = await prisma.photo.findMany({
    where: {
      id: { in: photoIds },
      event_id: eventId,
    },
    select: { id: true },
  });

  if (photos.length !== photoIds.length) {
    const err = new Error(
      'One or more photo IDs are invalid or do not belong to this event.'
    );
    err.statusCode = 400;
    throw err;
  }

  // Enqueue one job per photo — non-blocking, worker handles the rest
  await Promise.all(
    photoIds.map((photoId) => photoQueue.add('process-photo', { photoId }))
  );
};
