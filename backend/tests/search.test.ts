/**
 * tests/search.test.ts
 *
 * Covers:
 *   - Suite: Search My Photos      (core feature)
 *   - Suite: Vector Search Logic   (unit-level pgvector query)
 *
 * Stack : Jest + Supertest
 * Mocks : Prisma client ($queryRaw) · ML service · S3 service · jsonwebtoken
 * DB    : ❌ no real connection
 * S3    : ❌ no real S3 calls
 * ML    : ❌ no real ML calls
 */

import request from 'supertest';
import app from '../src/app';

// ─── Mock: Prisma Client ──────────────────────────────────────────────────────
jest.mock('../src/infrastructure/prisma.client', () => ({
  prisma: {
    eventMember: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    searchLog: {
      create: jest.fn(),
    },
  },
}));

// ─── Mock: ML Service ─────────────────────────────────────────────────────────
jest.mock('../src/infrastructure/ml.service', () => ({
  mlService: {
    getEmbedding: jest.fn(),
  },
}));

// ─── Mock: S3 Service ─────────────────────────────────────────────────────────
jest.mock('../src/infrastructure/s3.service', () => ({
  s3Service: {
    generatePresignedGetUrl: jest.fn(),
  },
}));

// ─── Mock: jsonwebtoken ───────────────────────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked_jwt_token'),
  verify: jest.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { prisma } from '../src/infrastructure/prisma.client';
import { mlService } from '../src/infrastructure/ml.service';
import { s3Service } from '../src/infrastructure/s3.service';
import jwt from 'jsonwebtoken';

// Import the vector search function directly for unit-level testing
// Should be exported from search.service.ts e.g:
// export async function vectorSearch(embedding: number[], eventId: string) { ... }
import { vectorSearch } from '../src/modules/search/search.service';

// ─── Mock Helpers ─────────────────────────────────────────────────────────────
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEventMember = prisma.eventMember as jest.Mocked<typeof prisma.eventMember>;
const mockML = mlService as jest.Mocked<typeof mlService>;
const mockS3 = s3Service as jest.Mocked<typeof s3Service>;

// ─── Shared Fixtures ──────────────────────────────────────────────────────────
const organizerPayload = { userId: 'organizer-uuid-001', role: 'organizer' };
const attendeePayload  = { userId: 'attendee-uuid-002',  role: 'attendee'  };

const ORGANIZER_TOKEN = 'Bearer mocked_organizer_token';
const ATTENDEE_TOKEN  = 'Bearer mocked_attendee_token';

const EVENT_ID = 'event-uuid-001';

// Fake 512-float embedding returned by ML service
const mockEmbedding = Array.from({ length: 512 }, () => Math.random());

// Fake base64 selfie image
const MOCK_BASE64_IMAGE = Buffer.from('fake-image-bytes').toString('base64');

// Mock pgvector similarity query results
const mockVectorResults = [
  { photo_id: 'photo-uuid-001', similarity: 0.92 },
  { photo_id: 'photo-uuid-002', similarity: 0.87 },
  { photo_id: 'photo-uuid-003', similarity: 0.81 },
];

// Mock membership record (attendee is a member of the event)
const mockMembership = {
  id: 'member-uuid-001',
  event_id: EVENT_ID,
  user_id: attendeePayload.userId,
  joined_at: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  (jwt.verify as jest.Mock).mockImplementation((token, _secret, cb) => {
    const payload = token === 'mocked_attendee_token' ? attendeePayload : organizerPayload;
    if (cb) return cb(null, payload);
    return payload;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6 — SEARCH MY PHOTOS
// ─────────────────────────────────────────────────────────────────────────────
describe('Search — Search My Photos  POST /api/v1/events/:eventId/search', () => {

  // ✅ Should call ML with base64
  it('✅ calls ML service with the base64 image from the request body', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);
    mockML.getEmbedding.mockResolvedValue({ embedding: mockEmbedding });
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);
    mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/photo');

    await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(mockML.getEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({ image: MOCK_BASE64_IMAGE }),
    );
  });

  // ✅ Should run similarity query
  it('✅ runs a pgvector similarity query after receiving the embedding', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);
    mockML.getEmbedding.mockResolvedValue({ embedding: mockEmbedding });
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);
    mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/photo');

    await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  // ✅ Should return top matches
  it('✅ returns an array of matched photos in the response', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);
    mockML.getEmbedding.mockResolvedValue({ embedding: mockEmbedding });
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);
    mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/photo');

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('matches');
    expect(Array.isArray(res.body.matches)).toBe(true);
    expect(res.body.matches.length).toBeGreaterThan(0);
  });

  // ✅ Should generate presigned GET URLs for each match
  it('✅ generates a presigned GET URL for each matched photo', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);
    mockML.getEmbedding.mockResolvedValue({ embedding: mockEmbedding });
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);
    mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/photo');

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(mockS3.generatePresignedGetUrl).toHaveBeenCalledTimes(mockVectorResults.length);

    res.body.matches.forEach((match: { photoId: string; url: string; similarityScore: number }) => {
      expect(match).toHaveProperty('url');
      expect(match.url).toContain('https://');
    });
  });

  // ✅ Should return similarityScore per match
  it('✅ each match in response includes a similarityScore', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);
    mockML.getEmbedding.mockResolvedValue({ embedding: mockEmbedding });
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);
    mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/photo');

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    res.body.matches.forEach((match: { photoId: string; url: string; similarityScore: number }) => {
      expect(match).toHaveProperty('similarityScore');
      expect(typeof match.similarityScore).toBe('number');
    });
  });

  // ✅ Should log search in search_logs (optional but in API spec)
  it('✅ logs the search in search_logs table', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);
    mockML.getEmbedding.mockResolvedValue({ embedding: mockEmbedding });
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);
    mockS3.generatePresignedGetUrl.mockResolvedValue('https://s3.signed.url/photo');
    (mockPrisma.searchLog.create as jest.Mock).mockResolvedValue({});

    await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(mockPrisma.searchLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: attendeePayload.userId,
          event_id: EVENT_ID,
        }),
      }),
    );
  });

  // ❌ If ML returns no face → 400
  it('❌ returns 400 when ML service detects no face in the uploaded image', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);
    mockML.getEmbedding.mockResolvedValue({ embedding: null }); // no face detected

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(res.status).toBe(400);
  });

  // ❌ If user not a member of event → 403
  it('❌ returns 403 when user has not joined the event', async () => {
    mockEventMember.findUnique.mockResolvedValue(null); // not a member

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(res.status).toBe(403);
  });

  // ❌ Missing image field → 400
  it('❌ returns 400 when image field is missing from request body', async () => {
    mockEventMember.findUnique.mockResolvedValue(mockMembership);

    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .set('Authorization', ATTENDEE_TOKEN)
      .send({});

    expect(res.status).toBe(400);
  });

  // ❌ No auth token → 401
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${EVENT_ID}/search`)
      .send({ image: MOCK_BASE64_IMAGE });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7 — VECTOR SEARCH LOGIC (Unit-Level)
// ─────────────────────────────────────────────────────────────────────────────
describe('Search — Vector Search Logic (Unit)', () => {

  // ✅ Should call prisma.$queryRaw with correct SQL
  it('✅ calls prisma.$queryRaw with the pgvector cosine similarity SQL', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);

    await vectorSearch(mockEmbedding, EVENT_ID);

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

    // Verify the raw SQL contains the cosine distance operator and correct structure
    const rawCall = (mockPrisma.$queryRaw as jest.Mock).mock.calls[0];
    const sqlTemplate = rawCall[0];
    const sqlString = Array.isArray(sqlTemplate)
      ? sqlTemplate.join('').toLowerCase()
      : String(sqlTemplate).toLowerCase();

    expect(sqlString).toContain('faces');
    expect(sqlString).toContain('event_id');
    expect(sqlString).toContain('<=>');          // pgvector cosine distance operator
  });

  // ✅ Should filter by event_id
  it('✅ passes event_id as a parameter to filter faces by event', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);

    await vectorSearch(mockEmbedding, EVENT_ID);

    const rawCall = (mockPrisma.$queryRaw as jest.Mock).mock.calls[0];
    // event_id should appear either in the tagged template or as an interpolated value
    const callArgs = rawCall.flat().map(String);
    expect(callArgs.some((arg) => arg.includes(EVENT_ID))).toBe(true);
  });

  // ✅ Should limit results to 50
  it('✅ limits the similarity query results to 50', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);

    await vectorSearch(mockEmbedding, EVENT_ID);

    const rawCall = (mockPrisma.$queryRaw as jest.Mock).mock.calls[0];
    const sqlTemplate = rawCall[0];
    const sqlString = Array.isArray(sqlTemplate)
      ? sqlTemplate.join('').toLowerCase()
      : String(sqlTemplate).toLowerCase();

    expect(sqlString).toContain('limit');

    // Verify the limit value is 50
    const limitArg = rawCall.find((arg: unknown) => arg === 50);
    const sqlHas50 = sqlString.includes('50');
    expect(limitArg === 50 || sqlHas50).toBe(true);
  });

  // ✅ Should return results from $queryRaw
  it('✅ returns the results from the pgvector query', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockVectorResults);

    const results = await vectorSearch(mockEmbedding, EVENT_ID);

    expect(results).toEqual(mockVectorResults);
    expect(results).toHaveLength(3);
  });

  // ❌ Should propagate errors from $queryRaw
  it('❌ throws when prisma.$queryRaw fails', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(
      new Error('pgvector query failed'),
    );

    await expect(vectorSearch(mockEmbedding, EVENT_ID)).rejects.toThrow(
      'pgvector query failed',
    );
  });
});