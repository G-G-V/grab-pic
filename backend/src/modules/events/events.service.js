import { prisma } from '../infrastructure/prisma.client.js';
import { generateJoinCode } from '../utils/generateJoinCode.js';
import { deleteS3Objects } from '../infrastructure/s3.service.js';

/**
 * Creates a new event for the organizer.
 * Returns eventId and the generated joinCode.
 */
export const createEventService = async ({
  name,
  description,
  organizerId,
}) => {
  const joinCode = generateJoinCode();

  const event = await prisma.event.create({
    data: {
      name,
      description,
      organizer_id: organizerId,
      join_code: joinCode,
    },
    select: {
      id: true,
      join_code: true,
    },
  });

  return { eventId: event.id, joinCode: event.join_code };
};

/**
 * Returns all events created by the organizer, each with a photo count.
 */
export const getMyEventsService = async ({ organizerId }) => {
  const events = await prisma.event.findMany({
    where: { organizer_id: organizerId },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      created_at: true,
      _count: {
        select: { photos: true },
      },
    },
  });

  return {
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      photoCount: e._count.photos,
      createdAt: e.created_at,
    })),
  };
};

/**
 * Deletes an event.
 * Verifies ownership — organizer can only delete their own events.
 * Prisma cascade handles photos + faces + event_members deletion.
 * Deletes S3 objects for all photos in the event before DB deletion.
 * Duplicate join → Prisma P2002 → errorHandler returns 409.
 * Invalid joinCode → manual 404.
 * Invalid eventId → Prisma P2025 → errorHandler returns 404.
 * Invalid ownership → manual 403.
 * P2025 (not found) is caught by errorHandler → 404.
 */
export const deleteEventService = async ({ eventId, organizerId }) => {
  // First verify the event exists and belongs to this organizer
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

  // Fetch all storage keys for this event's photos before DB cascade wipes the records
  const photos = await prisma.photo.findMany({
    where: { event_id: eventId },
    select: { storage_key: true },
  });

  const storageKeys = photos.map((p) => p.storage_key);

  // Delete search logs first — no cascade defined on this relation
  await prisma.searchLog.deleteMany({ where: { event_id: eventId } });

  // Delete from S3 first, then let Prisma cascade handle DB cleanup
  await deleteS3Objects(storageKeys);

  await prisma.event.delete({
    where: { id: eventId },
  });
};

/**
 * Joins an event by joinCode.
 * Inserts into event_members.
 * Duplicate join → Prisma P2002 → errorHandler returns 409.
 * Invalid joinCode → manual 404.
 */
export const joinEventService = async ({ joinCode, userId }) => {
  const event = await prisma.event.findUnique({
    where: { join_code: joinCode },
    select: { id: true, name: true },
  });

  if (!event) {
    const err = new Error('Invalid join code.');
    err.statusCode = 404;
    throw err;
  }

  await prisma.eventMember.create({
    data: {
      event_id: event.id,
      user_id: userId,
    },
  });

  return { eventId: event.id, name: event.name };
};

export const getJoinedEventsService = async ({ userId }) => {
  const memberships = await prisma.eventMember.findMany({
    where: { user_id: userId },
    include: {
      event: {
        select: { id: true, name: true, created_at: true },
      },
    },
    orderBy: { joined_at: 'desc' },
  });

  return {
    events: memberships.map((m) => ({
      id: m.event.id,
      name: m.event.name,
      joinedAt: m.joined_at,
      createdAt: m.event.created_at,
    })),
  };
};
