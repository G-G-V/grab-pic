import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { env } from '../config/env.js';
import { env } from '../../config/env.js';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a presigned PUT URL for organizer photo upload.
 * Frontend uploads directly to S3 using this URL — backend never touches the file bytes.
 * @param {string} storageKey - The S3 object key (e.g. events/eventId/photoId.jpg)
 * @param {number} expiresIn - URL expiry in seconds (default 5 minutes)
 */
export const generatePresignedPutUrl = async (storageKey, expiresIn = 300) => {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: storageKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generates a presigned GET URL for downloading/viewing a photo.
 * Used in search results so attendee can view matched photos.
 * @param {string} storageKey - The S3 object key stored in photos.storage_key
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 */
export const generatePresignedGetUrl = async (storageKey, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: storageKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Builds the S3 storage key for a photo.
 * Keeps photos organized by event in the bucket.
 * @param {string} eventId
 * @param {string} photoId
 * @param {string} filename - original filename from organizer
 */
export const buildStorageKey = (eventId, photoId, filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  return `events/${eventId}/${photoId}.${ext}`;
};

//buildStorageKey — this is a utility that lives here because it's S3-specific. Your photos service calls this to build the storage_key before creating the photo record in DB and generating the presigned PUT URL. The key pattern events/{eventId}/{photoId}.{ext} keeps S3 organized and makes the photo retrievable by just knowing its DB record.
//Expiry times — PUT URL is 5 minutes (organizer has limited time to upload after getting the URL), GET URL is 1 hour (enough time for attendee to view/download search results). Both are configurable per call.
