import { apiRequest } from "./client";

export interface SearchMatch {
  photoId: string;
  url: string;
  similarityScore: number;
}

interface SearchResponse {
  success: boolean;
  matches: SearchMatch[];
}

export async function searchPhotos(
  eventId: string,
  imageBase64: string,
): Promise<SearchMatch[]> {
  const response = await apiRequest<SearchResponse>(`/events/${eventId}`, {
    method: "POST",
    body: JSON.stringify({
      imageBase64,
    }),
  });

  return response.matches;
}
