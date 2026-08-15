import axios from 'axios';
import { env } from '../../config/env.js';

/**
 * Calls the ML service to detect faces and return 512-dim embeddings.
 * - Organizer flow: pass imageUrl (S3 presigned GET URL) — used by worker
 * - Attendee flow: pass imageBase64 (selfie, never stored) — used by search service
 * Only one field is sent, never both.
 * @param {{ imageUrl?: string, imageBase64?: string }} payload
 * @returns {Promise<Array<{ embedding: number[], bbox: { x, y, width, height } }>>}
 */
export const processImage = async ({ imageUrl, imageBase64 }) => {
  const payload = imageUrl ? { imageUrl } : { imageBase64 };

  const response = await axios.post(`${env.ML_SERVICE_URL}/process`, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000, // 30s — DeepFace can be slow on first inference (model load)
  });

  return response.data.faces; // array of { embedding: [...512 floats], bbox: {...} }
};

//
////
// Worth noting: the timeout of 30 seconds is intentional — DeepFace loads the Facenet512 model into memory on the first call which can be slow, subsequent calls are much faster. If the ML service is down or returns a non-2xx, axios throws automatically and asyncHandler catches it and routes it to your errorHandler as a 500.

// // (temp)
// export const processImage = async ({ imageUrl, imageBase64 }) => {
//   const payload = imageUrl ? { imageUrl } : { imageBase64 };

//   try {
//     const response = await axios.post(
//       `${env.ML_SERVICE_URL}/process`,
//       payload,
//       {
//         headers: { 'Content-Type': 'application/json' },
//         timeout: 30000,
//       }
//     );

//     return response.data.faces;
//   } catch (err) {
//     console.error('[ML SERVICE ERROR]', {
//       status: err.response?.status,
//       data: err.response?.data,
//       message: err.message,
//     });

//     throw err;
//   }
// };
