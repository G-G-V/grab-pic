/**
 * tests/worker.test.ts
 *
 * Covers:
 *   - Suite: Worker Logic (Unit Only)
 *
 * Note  : Worker has no HTTP routes — tested by importing & calling
 *         the worker processor function directly.
 *
 * Stack : Jest (no Supertest needed)
 * Mocks : Prisma client · ML service · S3 service
 * DB    : ❌ no real connection
 * S3    : ❌ no real S3 calls
 * ML    : ❌ no real ML calls
 */

// ─── Mock: Prisma Client ──────────────────────────────────────────────────────
jest.mock('../src/infrastructure/prisma.client', () => ({
    prisma: {
      photo: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      face: {
        createMany: jest.fn(),
      },
    },
  }));
  
  // ─── Mock: ML Service ─────────────────────────────────────────────────────────
  jest.mock('../src/infrastructure/ml.service', () => ({
    mlService: {
      processImage: jest.fn(),
    },
  }));
  
  // ─── Mock: S3 Service ─────────────────────────────────────────────────────────
  jest.mock('../src/infrastructure/s3.service', () => ({
    s3Service: {
      generatePresignedGetUrl: jest.fn(),
    },
  }));
  
  // ─── Imports after mocks ──────────────────────────────────────────────────────
  import { prisma } from '../src/infrastructure/prisma.client';
  import { mlService } from '../src/infrastructure/ml.service';
  import { s3Service } from '../src/infrastructure/s3.service';
  
  // Import the worker processor function directly (not the BullMQ worker instance)
  // The processor should be exported separately for testability e.g:
  // export async function processPhotoJob(job: Job) { ... }
  import { processPhotoJob } from '../src/infrastructure/worker';
  
  // ─── Mock Helpers ─────────────────────────────────────────────────────────────
  const mockPhoto = prisma.photo as jest.Mocked<typeof prisma.photo>;
  const mockFace = prisma.face as jest.Mocked<typeof prisma.face>;
  const mockML = mlService as jest.Mocked<typeof mlService>;
  const mockS3 = s3Service as jest.Mocked<typeof s3Service>;
  
  // ─── Shared Fixtures ──────────────────────────────────────────────────────────
  const PHOTO_ID = 'photo-uuid-001';
  const EVENT_ID = 'event-uuid-001';
  
  const mockPhotoRecord = {
    id: PHOTO_ID,
    event_id: EVENT_ID,
    storage_key: `events/${EVENT_ID}/img1.jpg`,
    processing_status: 'pending',
    uploaded_at: new Date(),
  };
  
  // A mock BullMQ Job object — only `data` field is needed by the processor
  const mockJob = (photoId: string = PHOTO_ID) => ({
    id: 'job-001',
    data: { photoId },
  });
  
  const mockEmbedding = Array.from({ length: 512 }, () => Math.random());
  
  const mockMLResponse = {
    faces: [
      {
        embedding: mockEmbedding,
        bbox: { x: 120, y: 200, width: 90, height: 90 },
      },
    ],
  };
  
  // ─────────────────────────────────────────────────────────────────────────────
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 5 — WORKER LOGIC (Unit Only)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Worker — processPhotoJob (Unit)', () => {
  
    // ✅ Should call ML service with image URL
    it('✅ calls ML service with a signed S3 image URL', async () => {
      mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord);
      mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/img1.jpg');
      mockML.processImage.mockResolvedValue(mockMLResponse);
      mockFace.createMany.mockResolvedValue({ count: 1 });
      mockPhoto.update.mockResolvedValue({ ...mockPhotoRecord, processing_status: 'processed' });
  
      await processPhotoJob(mockJob() as any);
  
      expect(mockS3.generatePresignedGetUrl).toHaveBeenCalledWith(mockPhotoRecord.storage_key);
      expect(mockML.processImage).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrl: 'https://s3.signed.url/img1.jpg' }),
      );
    });
  
    // ✅ Should store embeddings in faces table
    it('✅ inserts face embeddings into the faces table', async () => {
      mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord);
      mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/img1.jpg');
      mockML.processImage.mockResolvedValue(mockMLResponse);
      mockFace.createMany.mockResolvedValue({ count: 1 });
      mockPhoto.update.mockResolvedValue({ ...mockPhotoRecord, processing_status: 'processed' });
  
      await processPhotoJob(mockJob() as any);
  
      expect(mockFace.createMany).toHaveBeenCalledTimes(1);
  
      const createCall = mockFace.createMany.mock.calls[0][0];
      expect(createCall.data[0]).toMatchObject({
        photo_id: PHOTO_ID,
        event_id: EVENT_ID,
      });
      // Embedding should be the 512-float array from ML response
      expect(createCall.data[0].embedding).toEqual(mockEmbedding);
    });
  
    // ✅ Should update photo status to 'processed'
    it("✅ updates photo processing_status to 'processed' on success", async () => {
      mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord);
      mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/img1.jpg');
      mockML.processImage.mockResolvedValue(mockMLResponse);
      mockFace.createMany.mockResolvedValue({ count: 1 });
      mockPhoto.update.mockResolvedValue({ ...mockPhotoRecord, processing_status: 'processed' });
  
      await processPhotoJob(mockJob() as any);
  
      expect(mockPhoto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PHOTO_ID },
          data: { processing_status: 'processed' },
        }),
      );
    });
  
    // ❌ If ML fails → status becomes 'failed'
    it("❌ updates photo processing_status to 'failed' when ML service throws", async () => {
      mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord);
      mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/img1.jpg');
      mockML.processImage.mockRejectedValue(new Error('ML service unavailable'));
      mockPhoto.update.mockResolvedValue({ ...mockPhotoRecord, processing_status: 'failed' });
  
      await processPhotoJob(mockJob() as any);
  
      expect(mockPhoto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PHOTO_ID },
          data: { processing_status: 'failed' },
        }),
      );
  
      // Embeddings must NOT be stored on failure
      expect(mockFace.createMany).not.toHaveBeenCalled();
    });
  
    // ❌ If no faces detected → still mark processed (or handle accordingly)
    it('❌ marks photo as processed even when ML returns zero faces', async () => {
      mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord);
      mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/img1.jpg');
      mockML.processImage.mockResolvedValue({ faces: [] }); // no faces found
      mockPhoto.update.mockResolvedValue({ ...mockPhotoRecord, processing_status: 'processed' });
  
      await processPhotoJob(mockJob() as any);
  
      // No face rows should be inserted
      expect(mockFace.createMany).not.toHaveBeenCalled();
  
      // Photo should still be marked as processed (not stuck in pending)
      expect(mockPhoto.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PHOTO_ID },
          data: { processing_status: 'processed' },
        }),
      );
    });
  
    // ─── Edge Cases ───────────────────────────────────────────────────────────
  
    // ❌ Photo not found in DB → should handle gracefully
    it('❌ handles gracefully when photo record is not found in DB', async () => {
      mockPhoto.findUnique.mockResolvedValue(null);
  
      await expect(processPhotoJob(mockJob() as any)).rejects.toThrow();
  
      expect(mockML.processImage).not.toHaveBeenCalled();
      expect(mockFace.createMany).not.toHaveBeenCalled();
    });
  
    // ✅ Multiple faces in one photo → all embeddings stored
    it('✅ stores all embeddings when ML detects multiple faces in one photo', async () => {
      const multiFaceResponse = {
        faces: [
          { embedding: Array(512).fill(0.1), bbox: { x: 10, y: 10, width: 80, height: 80 } },
          { embedding: Array(512).fill(0.2), bbox: { x: 200, y: 10, width: 80, height: 80 } },
          { embedding: Array(512).fill(0.3), bbox: { x: 400, y: 10, width: 80, height: 80 } },
        ],
      };
  
      mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord);
      mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/img1.jpg');
      mockML.processImage.mockResolvedValue(multiFaceResponse);
      mockFace.createMany.mockResolvedValue({ count: 3 });
      mockPhoto.update.mockResolvedValue({ ...mockPhotoRecord, processing_status: 'processed' });
  
      await processPhotoJob(mockJob() as any);
  
      const createCall = mockFace.createMany.mock.calls[0][0];
      expect(createCall.data).toHaveLength(3);
    });
  });

  //////

//   Here's the breakdown of `tests/worker.test.ts`:

// **Key design decision:** The worker processor is imported as a named export `processPhotoJob` directly — no Supertest, no HTTP. This means your `worker.ts` should export the processor function separately from the BullMQ worker instance, like:
// ```ts
// export async function processPhotoJob(job: Job) { ... }

// // then register it:
// const worker = new Worker('photos', processPhotoJob, { connection });
// ```

// **Mocks:** `prisma.photo`, `prisma.face`, `mlService.processImage`, `s3Service.generatePresignedGetUrl`

// **7 test cases:**
// | | Case |
// |---|---|
// | ✅ | ML called with signed S3 URL |
// | ✅ | Face embeddings inserted into `faces` table with correct `photo_id` + `event_id` |
// | ✅ | Photo status updated to `'processed'` on success |
// | ❌ | ML throws → status becomes `'failed'`, no embeddings stored |
// | ❌ | ML returns 0 faces → status still `'processed'`, no `createMany` called |
// | ❌ | Photo not found in DB → throws, ML never called |
// | ✅ | 3 faces detected → all 3 embeddings stored in one `createMany` call |

// ---

// Now on to `search.test.ts` — the core feature. That one has the most moving parts: ML embedding, pgvector raw query, and presigned GET URLs.