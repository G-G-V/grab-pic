import { apiRequest } from "./client";

export interface EventStats {
  totalPhotos: number;
  totalFacesDetected: number;
  searchCount: number;
}

interface StatsResponse {
  success: boolean;
  totalPhotos: number;
  totalFacesDetected: number;
  searchCount: number;
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  const response = await apiRequest<StatsResponse>(`/events/${eventId}/stats`, {
    method: "GET",
  });

  return {
    totalPhotos: response.totalPhotos,
    totalFacesDetected: response.totalFacesDetected,
    searchCount: response.searchCount,
  };
}
