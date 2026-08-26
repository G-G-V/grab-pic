import {
  createEventService,
  getMyEventsService,
  deleteEventService,
  joinEventService,
  getJoinedEventsService,
} from './events.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * POST /api/v1/events
 */
export const createEvent = async (req, res) => {
  const { name, description } = req.validatedData;
  const { userId } = req.user;

  const result = await createEventService({
    name,
    description,
    organizerId: userId,
  });

  return sendSuccess(res, result, 200);
};

/**
 * GET /api/v1/events
 */
export const getMyEvents = async (req, res) => {
  const { userId } = req.user;

  const result = await getMyEventsService({ organizerId: userId });

  return sendSuccess(res, result, 200);
};

/**
 * DELETE /api/v1/events/:eventId
 */
export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  await deleteEventService({ eventId, organizerId: userId });

  return sendSuccess(res, {}, 200);
};

/**
 * POST /api/v1/events/join
 */
export const joinEvent = async (req, res) => {
  const { joinCode } = req.validatedData;
  const { userId } = req.user;

  const result = await joinEventService({ joinCode, userId });

  return sendSuccess(res, result, 200);
};

export const getJoinedEvents = async (req, res) => {
  const { userId } = req.user;
  const result = await getJoinedEventsService({ userId });
  return sendSuccess(res, result, 200);
};
