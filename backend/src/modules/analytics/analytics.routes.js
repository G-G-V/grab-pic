import { Router } from 'express';
import { getEventStats } from './analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true });

// GET /api/v1/events/:eventId/stats — organizer only
router.get(
  '/stats',
  authenticate,
  requireRole('organizer'),
  asyncHandler(getEventStats)
);

export default router;
