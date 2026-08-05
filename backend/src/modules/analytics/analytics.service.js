import { prisma } from '../infrastructure/prisma.client.js';

/**
 * Returns aggregate stats for an event.
 * Verifies event exists and belongs to the requesting organizer.
 */
export const getEventStatsService = async ({ eventId, organizerId }) => {
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

  // Run all counts concurrently — independent queries, no reason to sequence them
  const [totalPhotos, totalFacesDetected, searchCount] = await Promise.all([
    prisma.photo.count({
      where: { event_id: eventId },
    }),
    prisma.face.count({
      where: { event_id: eventId },
    }),
    prisma.searchLog.count({
      where: { event_id: eventId },
    }),
  ]);

  return {
    totalPhotos,
    totalFacesDetected,
    searchCount,
  };
};
