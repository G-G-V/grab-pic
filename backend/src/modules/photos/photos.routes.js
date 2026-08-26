import { Router } from 'express';
import {
  presignPhotos,
  confirmUpload,
  downloadEventPhotos,
} from './photos.controller.js';
import { validate } from '../middleware/validate.js';
import {
  presignSchema,
  confirmUploadSchema,
} from '../validators/photos.validators.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router({ mergeParams: true }); // mergeParams to access :eventId from parent router

// POST /api/v1/events/:eventId/photos/presign — organizer only
router.post(
  '/presign',
  authenticate,
  requireRole('organizer'),
  validate(presignSchema),
  asyncHandler(presignPhotos)
);

// POST /api/v1/events/:eventId/photos/confirm — organizer only
router.post(
  '/confirm',
  authenticate,
  requireRole('organizer'),
  validate(confirmUploadSchema),
  asyncHandler(confirmUpload)
);

// GET /api/v1/events/:eventId/photos/download — attendee
router.get('/download', authenticate, asyncHandler(downloadEventPhotos));

export default router;
