/**
 * tests/events.test.js
 *
 * Covers:
 *   - Suite: Create Event
 *   - Suite: Get My Events
 *   - Suite: Delete Event
 *   - Suite: Join Event (Attendee Flow)
 *
 * Stack : Jest + Supertest
 * Mocks : Prisma client · jsonwebtoken (auth middleware)
 * DB    : ❌ no real connection
 */

import request from 'supertest';
import app from '../src/app';


// ─── Mock: Prisma Client ──────────────────────────────────────────────────────
jest.mock('../src/infrastructure/prisma.client', () => ({
  prisma: {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    eventMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    photo: {
      count: jest.fn(),
    },
  },
}));

// ─── Mock: jsonwebtoken (so auth middleware passes without real tokens) ────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked_jwt_token'),
  verify: jest.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { prisma } from '../src/infrastructure/prisma.client';
import jwt from 'jsonwebtoken';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockEvent = prisma.event as jest.Mocked<typeof prisma.event>;
const mockEventMember = prisma.eventMember as jest.Mocked<typeof prisma.eventMember>;
const mockPhoto = prisma.photo as jest.Mocked<typeof prisma.photo>;

// Simulate valid JWT payloads that auth middleware will decode
const organizerPayload = { userId: 'organizer-uuid-001', role: 'organizer' };
const attendeePayload  = { userId: 'attendee-uuid-002',  role: 'attendee'  };

// Tokens (real values don't matter — jwt.verify is mocked)
const ORGANIZER_TOKEN = 'Bearer mocked_organizer_token';
const ATTENDEE_TOKEN  = 'Bearer mocked_attendee_token';

// Seed mock event record
const mockEventRecord = {
  id: 'event-uuid-001',
  name: 'Tech Fest 2026',
  description: 'Annual event',
  organizer_id: 'organizer-uuid-001',
  join_code: 'ABC123',
  created_at: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();

  // Default: jwt.verify resolves to organizer. Override per test when needed.
  jwt.verify.mockImplementation((token, secret, cb) => {
    if (token === 'mocked_attendee_token') {
      if (cb) return cb(null, attendeePayload);
      return attendeePayload;
    }
    if (cb) return cb(null, organizerPayload);
    return organizerPayload;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — CREATE EVENT
// ─────────────────────────────────────────────────────────────────────────────
describe('Events — Create Event  POST /api/v1/events', () => {

  // ✅ Organizer can create event
  it('✅ organizer can create an event and receives eventId + joinCode', async () => {
    mockEvent.create.mockResolvedValue(mockEventRecord);

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ name: 'Tech Fest 2026', description: 'Annual event' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('eventId');
    expect(res.body).toHaveProperty('joinCode');
  });

  // ✅ joinCode should be generated
  it('✅ joinCode in response is a non-empty string', async () => {
    mockEvent.create.mockResolvedValue(mockEventRecord);

    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ name: 'Tech Fest 2026' });

    expect(typeof res.body.joinCode).toBe('string');
    expect(res.body.joinCode.length).toBeGreaterThan(0);
  });

  // ✅ Event should belong to correct organizer
  it('✅ created event is associated with the requesting organizer', async () => {
    mockEvent.create.mockResolvedValue(mockEventRecord);

    await request(app)
      .post('/api/v1/events')
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ name: 'Tech Fest 2026' });

    const createCall = mockEvent.create.mock.calls[0][0];
    expect(createCall.data.organizer_id).toBe(organizerPayload.userId);
  });

  // ❌ Attendee cannot create event (403)
  it('❌ returns 403 when an attendee tries to create an event', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ name: 'Tech Fest 2026' });

    expect(res.status).toBe(403);
  });

  // ❌ Missing name should return 400
  it('❌ returns 400 when event name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', ORGANIZER_TOKEN)
      .send({ description: 'No name provided' });

    expect(res.status).toBe(400);
  });

  // ❌ No auth token → 401
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .send({ name: 'Tech Fest 2026' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — GET MY EVENTS
// ─────────────────────────────────────────────────────────────────────────────
describe('Events — Get My Events  GET /api/v1/events', () => {

  // ✅ Should return only events created by user
  it('✅ returns only events belonging to the authenticated organizer', async () => {
    mockEvent.findMany.mockResolvedValue([mockEventRecord]);

    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
    expect(Array.isArray(res.body.events)).toBe(true);

    // Prisma query must filter by organizer_id
    const findCall = mockEvent.findMany.mock.calls[0][0];
    expect(findCall.where.organizer_id).toBe(organizerPayload.userId);
  });

  // ✅ Should include photoCount field
  it('✅ each event in the response includes a photoCount field', async () => {
    mockEvent.findMany.mockResolvedValue([mockEventRecord]);
    mockPhoto.count.mockResolvedValue(12);

    const res = await request(app)
      .get('/api/v1/events')
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(200);
    res.body.events.forEach((event) => {
      expect(event).toHaveProperty('photoCount');
    });
  });

  // ❌ Should require authentication
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/v1/events');

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — DELETE EVENT
// ─────────────────────────────────────────────────────────────────────────────
describe('Events — Delete Event  DELETE /api/v1/events/:eventId', () => {

  // ✅ Organizer can delete own event
  it('✅ organizer can delete their own event', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord); // event exists + belongs to organizer
    mockEvent.delete.mockResolvedValue(mockEventRecord);

    const res = await request(app)
      .delete(`/api/v1/events/${mockEventRecord.id}`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(200);
  });

  // ❌ Organizer cannot delete someone else's event (403)
  it("❌ returns 403 when organizer tries to delete another organizer's event", async () => {
    const otherOrganizerEvent = { ...mockEventRecord, organizer_id: 'other-organizer-uuid' };
    mockEvent.findUnique.mockResolvedValue(otherOrganizerEvent);

    const res = await request(app)
      .delete(`/api/v1/events/${mockEventRecord.id}`)
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(403);
  });

  // ❌ Attendee cannot delete event (403)
  it('❌ returns 403 when an attendee tries to delete an event', async () => {
    const res = await request(app)
      .delete(`/api/v1/events/${mockEventRecord.id}`)
      .set('Authorization', ATTENDEE_TOKEN);

    expect(res.status).toBe(403);
  });

  // ❌ Deleting non-existent event returns 404
  it('❌ returns 404 when event does not exist', async () => {
    mockEvent.findUnique.mockResolvedValue(null); // event not found

    const res = await request(app)
      .delete('/api/v1/events/non-existent-uuid')
      .set('Authorization', ORGANIZER_TOKEN);

    expect(res.status).toBe(404);
  });

  // ❌ No auth token → 401
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .delete(`/api/v1/events/${mockEventRecord.id}`);

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — JOIN EVENT (Attendee Flow)
// ─────────────────────────────────────────────────────────────────────────────
describe('Events — Join Event  POST /api/v1/events/join', () => {

  // ✅ Should join valid event by joinCode
  it('✅ attendee can join an event with a valid joinCode', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockEventMember.create.mockResolvedValue({
      id: 'member-uuid-001',
      event_id: mockEventRecord.id,
      user_id: attendeePayload.userId,
      joined_at: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/events/join')
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ joinCode: 'ABC123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('eventId');
    expect(res.body).toHaveProperty('name');
    expect(res.body.name).toBe('Tech Fest 2026');
  });

  // ❌ Invalid joinCode returns 404
  it('❌ returns 404 when joinCode does not match any event', async () => {
    mockEvent.findUnique.mockResolvedValue(null); // no event for this code

    const res = await request(app)
      .post('/api/v1/events/join')
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ joinCode: 'INVALID' });

    expect(res.status).toBe(404);
  });

  // ❌ Duplicate join should fail (unique constraint)
  it('❌ returns error when user tries to join the same event twice', async () => {
    mockEvent.findUnique.mockResolvedValue(mockEventRecord);
    mockEventMember.create.mockRejectedValue({
      code: 'P2002', // Prisma unique constraint violation
      message: 'Unique constraint failed on (event_id, user_id)',
    });

    const res = await request(app)
      .post('/api/v1/events/join')
      .set('Authorization', ATTENDEE_TOKEN)
      .send({ joinCode: 'ABC123' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // ❌ Must require authentication
  it('❌ returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/v1/events/join')
      .send({ joinCode: 'ABC123' });

    expect(res.status).toBe(401);
  });
});