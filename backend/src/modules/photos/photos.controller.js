import {
  presignPhotosService,
  confirmUploadService,
  downloadEventPhotosService,
} from './photos.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * POST /api/v1/events/:eventId/photos/presign
 */
export const presignPhotos = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;
  const { filenames } = req.validatedData;

  const result = await presignPhotosService({
    eventId,
    organizerId: userId,
    filenames,
  });

  return sendSuccess(res, result, 200);
};

/**
 * POST /api/v1/events/:eventId/photos/confirm
 */
export const confirmUpload = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;
  const { photoIds } = req.validatedData;

  await confirmUploadService({ eventId, organizerId: userId, photoIds });

  return sendSuccess(res, { message: 'Processing started' }, 200);
};

export const downloadEventPhotos = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;
  const { photoIds } = req.query;

  await downloadEventPhotosService({
    eventId,
    userId,
    photoIds: photoIds ? photoIds.split(',') : null,
    res, // pass res directly for streaming
  });
};
