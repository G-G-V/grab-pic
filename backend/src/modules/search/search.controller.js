import { searchPhotosService } from './search.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * POST /api/v1/events/:eventId/search
 */
export const searchPhotos = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;
  const { imageBase64 } = req.validatedData;

  const result = await searchPhotosService({ eventId, userId, imageBase64 });

  return sendSuccess(res, result, 200);
};
