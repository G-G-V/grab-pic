import { apiRequest } from "./client";

export interface EventStats {
  totalPhotos: number;
  totalFacesDetected: number;
  uniqueFaces: number;
  searchCount: number;
}

interface StatsResponse {
  success: boolean;
  stats?: EventStats;

  // In case your implementation returns the fields directly.
  totalPhotos?: number;
  totalFacesDetected?: number;
  uniqueFaces?: number;
  searchCount?: number;
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  const response = await apiRequest<StatsResponse>(`/events/${eventId}/stats`, {
    method: "GET",
  });

  if (response.stats) {
    return response.stats;
  }

  return {
    totalPhotos: response.totalPhotos ?? 0,
    totalFacesDetected: response.totalFacesDetected ?? 0,
    uniqueFaces: response.uniqueFaces ?? 0,
    searchCount: response.searchCount ?? 0,
  };
}
