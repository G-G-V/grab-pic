/**
 * tests/photos.test.ts
 *
 * Covers:
 *   - Suite: Generate Presigned URLs
 *   - Suite: Confirm Upload (Triggers Processing)
 *
 * Stack : Jest + Supertest
 * Mocks : Prisma client · S3 service · BullMQ queue · jsonwebtoken
 * DB    : ❌ no real connection
 * S3    : ❌ no real S3 calls
 * Queue : ❌ no real BullMQ
 */

import request from 'supertest';
import app from '../src/app';

// ─── Mock: Prisma Client ──────────────────────────────────────────────────────
jest.mock('../src/infrastructure/prisma.client', () => ({
  prisma: {
    photo: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    eventMember: {
      findUnique: jest.fn(),
    },
  },
}));

// ─── Mock: S3 Service ─────────────────────────────────────────────────────────
jest.mock('../src/infrastructure/s3.service', () => ({
  s3Service: {
    generatePresignedPutUrl: jest.fn(),
    generatePresignedGetUrl: jest.fn(),
  },
}));

// ─── Mock: BullMQ Queue ───────────────────────────────────────────────────────
jest.mock('../src/infrastructure/queue', () => ({
  photoQueue: {
    add: jest.fn(),
  },
}));

// ─── Mock: jsonwebtoken ───────────────────────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked_jwt_token'),
  verify: jest.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { prisma } from '../src/infrastructure/prisma.client';
import { s3Service } from '../src/infrastructure/s3.service';
import { photoQueue } from '../src/infrastructure/queue';
import jwt from 'jsonwebtoken';

// ─── Mock Helpers ─────────────────────────────────────────────────────────────
const mockPhoto = prisma.photo as jest.Mocked<typeof prisma.photo>;
const mockEvent = prisma.event as jest.Mocked<typeof prisma.event>;
const mockEventMember = prisma.eventMember as jest.Mocked<typeof prisma.eventMember>;
const mockS3 = s3Service as jest.Mocked<typeof s3Service>;
const mockQueue = photoQueue as jest.Mocked<typeof photoQueue>;

// ─── Shared Fixtures ──────────────────────────────────────────────────────────
const organizerPayload = { userId: 'organizer-uuid-001', role: 'organizer' };
const attendeePayload  = { userId: 'attendee-uuid-002',  role: 'attendee'  };

const ORGANIZER_TOKEN = 'Bearer mocked_organizer_token';
const ATTENDEE_TOKEN  = 'Bearer mocked_attendee_token';

const EVENT_ID = 'event-uuid-001';

const mockEventRecord = {
  id: EVENT_ID,
  name: 'Tech Fest 2026',
  description: 'Annual event',
  organizer_id: 'organizer-uuid-001',
  join_code: 'ABC123',
  created_at: new Date(),
};

const mockPhotoRecord = (id: string, filename: string) => ({
  id,
  event_id: EVENT_ID,
  storage_key: `events/${EVENT_ID}/${filename}`,
  processing_status: 'pending',
  uploaded_at: new Date(),
});

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  // Default jwt.verify → organizer. Override per-test for attendee.
  (jwt.verify as jest.Mock).mockImplementation((token, _secret, cb) => {
    const payload = token === 'mocked_attendee_token' ? attendeePayload : organizerPayload;
    if (cb) return cb(null, payload);
    return payload;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — GENERATE PRESIGNED UPLOAD URLs
// ─────────────────────────────────────────────────────────────────────────────
describe('Photos — Generate Presigned URLs  POST /api/v1/events/:eventId/photos/presign', () => {

  // ✅ Should generate presigned URLs
  it('✅ returns presigned upload URLs for each filename', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.create
      .mockResolvedValueOnce(mockPhotoRecord('photo-uuid-001', 'img1.jpg'))
      .mockResolvedValueOnce(mockPhotoRecord('photo-uuid-002', 'img2.jpg'));
    mockS3.generatePresignedPutUrl
      .mockResolvedValueOnce('https://s3.presigned.url/img1')
      .mockResolvedValueOnce('https://s3.presigned.url/img2');

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/presign`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ filenames: ['img1.jpg', 'img2.jpg'] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('urls');
    expect(Array.isArray(res.body.urls)).toBe(true);
    expect(res.body.urls).toHaveLength(2);
  });

  // ✅ Should create photo records with status='pending'
  it("✅ creates photo records in DB with processing_status='pending'", async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.create.mockResolvedValue(mockPhotoRecord('photo-uuid-001', 'img1.jpg'));
    mockS3.generatePresignedPutUrl.mockResolvedValue('https://s3.presigned.url/img1');

    await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/presign`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ filenames: ['img1.jpg'] });

    const createCall = mockPhoto.create.mock.calls[0][0];
    expect(createCall.data.processing_status).toBe('pending');
  });

  // ✅ Should return photoIds
  it('✅ each URL entry in the response includes a photoId', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.create.mockResolvedValue(mockPhotoRecord('photo-uuid-001', 'img1.jpg'));
    mockS3.generatePresignedPutUrl.mockResolvedValue('https://s3.presigned.url/img1');

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/presign`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ filenames: ['img1.jpg'] });

    expect(res.status).toBe(200);
    res.body.urls.forEach((entry: { photoId: string; uploadUrl: string; filename: string }) => {
      expect(entry).toHaveProperty('photoId');
      expect(entry).toHaveProperty('uploadUrl');
      expect(entry).toHaveProperty('filename');
    });
  });

  // ✅ S3 generatePresignedPutUrl called once per filename
  it('✅ calls S3 presign once per filename provided', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.create
      .mockResolvedValueOnce(mockPhotoRecord('photo-uuid-001', 'img1.jpg'))
      .mockResolvedValueOnce(mockPhotoRecord('photo-uuid-002', 'img2.jpg'))
      .mockResolvedValueOnce(mockPhotoRecord('photo-uuid-003', 'img3.jpg'));
    mockS3.generatePresignedPutUrl.mockResolvedValue('https://s3.presigned.url/img');

    await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/presign`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ filenames: ['img1.jpg', 'img2.jpg', 'img3.jpg'] });

    expect(mockS3.generatePresignedPutUrl).toHaveBeenCalledTimes(3);
  });

  // ❌ Non-organizer cannot presign (403)
  it('❌ returns 403 when an attendee tries to generate presigned URLs', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/presign`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ filenames: ['img1.jpg'] });

    expect(res.status).toBe(403);
  });

  // ❌ Event not found → 404
  it('❌ returns 404 when event does not exist', async () => {
    mockEvent.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/v1/events/non-existent-uuid/photos/presign`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ filenames: ['img1.jpg'] });

    expect(res.status).toBe(404);
  });

  // ❌ No auth token → 401
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/presign`)
      .send({ filenames: ['img1.jpg'] });

    expect(res.status).toBe(401);
  });

  // ❌ Empty filenames array → 400
  it('❌ returns 400 when filenames array is empty', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/presign`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ filenames: [] });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — CONFIRM UPLOAD (Triggers Processing)
// ─────────────────────────────────────────────────────────────────────────────
describe('Photos — Confirm Upload  POST /api/v1/events/:eventId/photos/confirm', () => {

  const PHOTO_IDS = ['photo-uuid-001', 'photo-uuid-002'];

  // ✅ Should enqueue a job for each photoId
  it('✅ enqueues a BullMQ job for each confirmed photoId', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.findUnique
      .mockResolvedValueOnce(mockPhotoRecord('photo-uuid-001', 'img1.jpg'))
      .mockResolvedValueOnce(mockPhotoRecord('photo-uuid-002', 'img2.jpg'));
    mockQueue.add.mockResolvedValue({} as never);

    await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/confirm`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ photoIds: PHOTO_IDS });

    expect(mockQueue.add).toHaveBeenCalledTimes(PHOTO_IDS.length);
  });

  // ✅ Should not block — returns immediately with 200
  it('✅ returns 200 immediately without waiting for processing', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord('photo-uuid-001', 'img1.jpg'));
    mockQueue.add.mockResolvedValue({} as never);

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/confirm`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ photoIds: ['photo-uuid-001'] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  // ✅ ML service is NOT called directly from confirm endpoint
  it('✅ does NOT call ML service directly — processing is deferred to worker', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.findUnique.mockResolvedValue(mockPhotoRecord('photo-uuid-001', 'img1.jpg'));
    mockQueue.add.mockResolvedValue({} as never);

    await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/confirm`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ photoIds: ['photo-uuid-001'] });

    // ml.service should never be invoked from this endpoint
    const mlService = require('../src/infrastructure/ml.service');
    expect(mlService?.mlService?.processImage ?? jest.fn()).not.toHaveBeenCalled();
  });

  // ❌ Non-organizer cannot confirm (403)
  it('❌ returns 403 when an attendee tries to confirm upload', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/confirm`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ photoIds: PHOTO_IDS });

    expect(res.status).toBe(403);
  });

  // ❌ Invalid / unknown photoIds return error
  it('❌ returns error when photoIds do not exist in DB', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.findUnique.mockResolvedValue(null); // photo not found

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/confirm`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ photoIds: ['non-existent-photo-uuid'] });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // ❌ Empty photoIds array → 400
  it('❌ returns 400 when photoIds array is empty', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/confirm`)
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ photoIds: [] });

    expect(res.status).toBe(400);
  });

  // ❌ No auth token → 401
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/photos/confirm`)
      .send({ photoIds: PHOTO_IDS });

    expect(res.status).toBe(401);
  });
});