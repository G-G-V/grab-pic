import { apiRequest } from "./client";

export interface PresignedPhoto {
  filename: string;
  photoId: string;
  uploadUrl: string;
}

interface PresignResponse {
  success: boolean;
  urls: PresignedPhoto[];
}

interface ConfirmResponse {
  success: boolean;
  message: string;
}

export async function getPresignedUrls(
  eventId: string,
  filenames: string[],
): Promise<PresignedPhoto[]> {
  const response = await apiRequest<PresignResponse>(
    `/events/${eventId}/photos/presign`,
    {
      method: "POST",
      body: JSON.stringify({ filenames }),
    },
  );

  return response.urls;
}

export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `S3 upload failed: ${response.status} ${response.statusText}`,
    );
  }
}

export async function confirmUpload(
  eventId: string,
  photoIds: string[],
): Promise<void> {
  const response = await apiRequest<ConfirmResponse>(
    `/events/${eventId}/photos/confirm`,
    {
      method: "POST",
      body: JSON.stringify({ photoIds }),
    },
  );

  if (!response.success) {
    throw new Error("Photo confirmation failed.");
  }
}

//
export interface EventPhoto {
  photoId: string;
  url: string;
  processingStatus: string;
  uploadedAt: string;
}

interface EventPhotosResponse {
  success: boolean;
  photos: EventPhoto[];
}

export async function getEventPhotos(eventId: string): Promise<EventPhoto[]> {
  const response = await apiRequest<EventPhotosResponse>(
    `/events/${eventId}/photos`,
    {
      method: "GET",
    },
  );

  return response.photos;
}
