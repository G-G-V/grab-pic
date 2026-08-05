import { getEventStatsService } from './analytics.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/v1/events/:eventId/stats
 */
export const getEventStats = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  const result = await getEventStatsService({ eventId, organizerId: userId });

  return sendSuccess(res, result, 200);
};
