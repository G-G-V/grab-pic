import { Router } from 'express';
import { searchPhotos } from './search.controller.js';
import { validate } from '../middleware/validate.js';
import { searchSchema } from '../validators/search.validators.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true }); // access :eventId from parent

// POST /api/v1/events/:eventId/search — any authenticated user who has joined the event
router.post(
  '/',
  authenticate,
  validate(searchSchema),
  asyncHandler(searchPhotos)
);

export default router;
