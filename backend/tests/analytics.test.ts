/**
 * tests/analytics.test.ts
 *
 * Covers:
 *   - Suite: Get Event Stats (Organizer Analytics)
 *
 * Stack : Jest + Supertest
 * Mocks : Prisma client · jsonwebtoken
 * DB    : ❌ no real connection
 */

import request from 'supertest';
import app from '../src/app';

// ─── Mock: Prisma Client ──────────────────────────────────────────────────────
jest.mock('../src/infrastructure/prisma.client', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    photo: {
      count: jest.fn(),
    },
    face: {
      count: jest.fn(),
    },
    searchLog: {
      count: jest.fn(),
    },
  },
}));

// ─── Mock: jsonwebtoken ───────────────────────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked_jwt_token'),
  verify: jest.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { prisma } from '../src/infrastructure/prisma.client';
import jwt from 'jsonwebtoken';

// ─── Mock Helpers ─────────────────────────────────────────────────────────────
const mockEvent = prisma.event as jest.Mocked<typeof prisma.event>;
const mockPhoto = prisma.photo as jest.Mocked<typeof prisma.photo>;
const mockFace = prisma.face as jest.Mocked<typeof prisma.face>;
const mockSearchLog = prisma.searchLog as jest.Mocked<typeof prisma.searchLog>;

// ─── Shared Fixtures ──────────────────────────────────────────────────────────
const organizerPayload = { userId: 'organizer-uuid-001', role: 'organizer' };
const attendeePayload = { userId: 'attendee-uuid-002', role: 'attendee' };

const ORGANIZER_TOKEN = 'Bearer mocked_organizer_token';
const ATTENDEE_TOKEN = 'Bearer mocked_attendee_token';

const EVENT_ID = 'event-uuid-001';

const mockEventRecord = {
  id: EVENT_ID,
  name: 'Tech Fest 2026',
  description: 'Annual event',
  organizer_id: 'organizer-uuid-001',
  join_code: 'ABC123',
  created_at: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();

  (jwt.verify as jest.Mock).mockImplementation((token, _secret, cb) => {
    const payload =
      token === 'mocked_attendee_token' ? attendeePayload : organizerPayload;
    if (cb) return cb(null, payload);
    return payload;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 8 — ANALYTICS: GET EVENT STATS
// ─────────────────────────────────────────────────────────────────────────────
describe('Analytics — Get Event Stats  GET /api/v1/events/:eventId/stats', () => {
  // ✅ Should return totalPhotos
  it('✅ returns totalPhotos count for the event', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.count.mockResolvedValue(2000);
    mockFace.count.mockResolvedValue(3400);
    mockSearchLog.count.mockResolvedValue(540);

    const res = await request(app)
      .get(`/api/v1/events/${EVENT_ID}/stats`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalPhotos');
    expect(res.body.totalPhotos).toBe(2000);
  });

  // ✅ Should return totalFacesDetected
  it('✅ returns totalFacesDetected count for the event', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.count.mockResolvedValue(2000);
    mockFace.count.mockResolvedValue(3400);
    mockSearchLog.count.mockResolvedValue(540);

    const res = await request(app)
      .get(`/api/v1/events/${EVENT_ID}/stats`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.body).toHaveProperty('totalFacesDetected');
    expect(res.body.totalFacesDetected).toBe(3400);
  });

  // ✅ Should return searchCount
  it('✅ returns searchCount from search_logs for the event', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.count.mockResolvedValue(2000);
    mockFace.count.mockResolvedValue(3400);
    mockSearchLog.count.mockResolvedValue(540);

    const res = await request(app)
      .get(`/api/v1/events/${EVENT_ID}/stats`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.body).toHaveProperty('searchCount');
    expect(res.body.searchCount).toBe(540);
  });

  // ✅ All stats returned in a single response object
  it('✅ returns all stat fields in one response', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.count.mockResolvedValue(2000);
    mockFace.count.mockResolvedValue(3400);
    mockSearchLog.count.mockResolvedValue(540);

    const res = await request(app)
      .get(`/api/v1/events/${EVENT_ID}/stats`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalPhotos: expect.any(Number),
      totalFacesDetected: expect.any(Number),
      searchCount: expect.any(Number),
    });
  });

  // ✅ Prisma count queries are scoped to the correct event_id
  it('✅ all Prisma count queries are filtered by the correct event_id', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockPhoto.count.mockResolvedValue(10);
    mockFace.count.mockResolvedValue(20);
    mockSearchLog.count.mockResolvedValue(5);

    await request(app)
      .get(`/api/v1/events/${EVENT_ID}/stats`)
      .set('Authorization', ORGANIZER_TOKEN);

    // Each count call must filter by event_id
    expect(mockPhoto.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { event_id: EVENT_ID } })
    );
    expect(mockFace.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { event_id: EVENT_ID } })
    );
    expect(mockSearchLog.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { event_id: EVENT_ID } })
    );
  });

  // ❌ Non-organizer should not access stats (403)
  it('❌ returns 403 when an attendee tries to access event stats', async () => {
    const res = await request(app)
      .get(`/api/v1/events/${EVENT_ID}/stats`)
      .set('Authorization', ATTENDEE_TOKEN);

    expect(res.status).toBe(403);
  });

  // ❌ Event not found → 404
  it('❌ returns 404 when event does not exist', async () => {
    mockEvent.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/v1/events/non-existent-uuid/stats`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(404);
  });

  // ❌ Organizer cannot access another organizer's event stats (403)
  it("❌ returns 403 when organizer tries to access another organizer's event stats", async () => {
    const otherOrganizerEvent = {
      ...mockEventRecord,
      organizer_id: 'other-organizer-uuid',
    };
    mockEvent.findUnique.mockResolvedValue(otherOrganizerEvent);

    const res = await request(app)
      .get(`/api/v1/events/${EVENT_ID}/stats`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(403);
  });

  // ❌ No auth token → 401
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app).get(`/api/v1/events/${EVENT_ID}/stats`);

    expect(res.status).toBe(401);
  });
});
