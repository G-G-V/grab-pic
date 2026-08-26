import { Router } from 'express';
import {
  createEvent,
  getMyEvents,
  deleteEvent,
  joinEvent,
  getJoinedEvents,
} from './events.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createEventSchema,
  joinEventSchema,
} from '../validators/events.validators.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// POST /api/v1/events — organizer only
router.post(
  '/',
  authenticate,
  requireRole('organizer'),
  validate(createEventSchema),
  asyncHandler(createEvent)
);

// GET /api/v1/events — organizer only
router.get(
  '/',
  authenticate,
  requireRole('organizer'),
  asyncHandler(getMyEvents)
);

// GET /api/v1/events/joined — attendee's joined events
router.get('/joined', authenticate, asyncHandler(getJoinedEvents));

// DELETE /api/v1/events/:eventId — organizer only
router.delete(
  '/:eventId',
  authenticate,
  requireRole('organizer'),
  asyncHandler(deleteEvent)
);

// POST /api/v1/events/join — attendee (any authenticated user)
router.post(
  '/join',
  authenticate,
  validate(joinEventSchema),
  asyncHandler(joinEvent)
);

export default router;
