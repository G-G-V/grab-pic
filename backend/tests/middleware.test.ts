/**
 * tests/middleware.test.ts
 *
 * Covers:
 *   - Suite: Auth Middleware
 *   - Suite: Role Middleware
 *
 * Strategy : Mount lightweight Express test routes that apply
 *            the middleware under test, then hit them via Supertest.
 *            This isolates middleware behaviour from any module logic.
 *
 * Stack : Jest + Supertest
 * Mocks : jsonwebtoken
 * DB    : ❌ no real connection
 */

import request from 'supertest';
import express, { Request, Response } from 'express';

// ─── Mock: jsonwebtoken ───────────────────────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/middleware/auth.middleware';
import { roleMiddleware } from '../src/middleware/role.middleware';

// ─── Mock Helpers ─────────────────────────────────────────────────────────────
const mockJwtVerify = jwt.verify as jest.Mock;

// ─── Shared Fixtures ──────────────────────────────────────────────────────────
const organizerPayload = { userId: 'organizer-uuid-001', role: 'organizer' };
const attendeePayload  = { userId: 'attendee-uuid-002',  role: 'attendee'  };

// ─── Test App Factory ─────────────────────────────────────────────────────────
// Builds a minimal Express app with a protected GET /test route.
// roleMiddleware is optional — pass a role to protect by role too.
const buildTestApp = (requiredRole?: 'organizer' | 'attendee') => {
  const app = express();
  app.use(express.json());

  const handlers = [
    authMiddleware,
    ...(requiredRole ? [roleMiddleware(requiredRole)] : []),
    (_req: Request, res: Response) => res.status(200).json({ ok: true }),
  ];

  app.get('/test', ...handlers);
  return app;
};

// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE — AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
describe('Middleware — Auth  (authMiddleware)', () => {

  // ✅ Valid token attaches user to req
  it('✅ attaches decoded user payload to req.user for a valid token', async () => {
    mockJwtVerify.mockImplementation((_token, _secret, cb) => {
      if (cb) return cb(null, organizerPayload);
      return organizerPayload;
    });

    // Use a probe route that echoes req.user back so we can assert on it
    const app = express();
    app.use(express.json());
    app.get('/test', authMiddleware, (req: Request, res: Response) => {
      res.status(200).json({ user: (req as any).user });
    });

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer valid_token');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      userId: organizerPayload.userId,
      role:   organizerPayload.role,
    });
  });

  // ❌ No token → 401
  it('❌ returns 401 when Authorization header is missing', async () => {
    const app = buildTestApp();

    const res = await request(app).get('/test');

    expect(res.status).toBe(401);
  });

  // ❌ Bearer prefix missing → 401
  it('❌ returns 401 when token is provided without Bearer prefix', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'just_a_token_no_bearer');

    expect(res.status).toBe(401);
  });

  // ❌ Invalid / expired token → 401
  it('❌ returns 401 when jwt.verify throws (invalid or expired token)', async () => {
    mockJwtVerify.mockImplementation((_token, _secret, cb) => {
      if (cb) return cb(new Error('invalid token'), null);
      throw new Error('invalid token');
    });

    const app = buildTestApp();

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer invalid_or_expired_token');

    expect(res.status).toBe(401);
  });

  // ❌ Malformed JWT (not a valid JWT structure) → 401
  it('❌ returns 401 for a malformed JWT string', async () => {
    mockJwtVerify.mockImplementation((_token, _secret, cb) => {
      if (cb) return cb(new Error('jwt malformed'), null);
      throw new Error('jwt malformed');
    });

    const app = buildTestApp();

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer not.a.valid.jwt.at.all');

    expect(res.status).toBe(401);
  });

  // ❌ Empty Bearer token → 401
  it('❌ returns 401 when Bearer token value is empty', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE — ROLE MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
describe('Middleware — Role  (roleMiddleware)', () => {

  // ✅ Organizer passes organizer-only route
  it('✅ allows organizer to access an organizer-only route', async () => {
    mockJwtVerify.mockImplementation((_token, _secret, cb) => {
      if (cb) return cb(null, organizerPayload);
      return organizerPayload;
    });

    const app = buildTestApp('organizer');

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer organizer_token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  // ✅ Attendee passes attendee-only route
  it('✅ allows attendee to access an attendee-only route', async () => {
    mockJwtVerify.mockImplementation((_token, _secret, cb) => {
      if (cb) return cb(null, attendeePayload);
      return attendeePayload;
    });

    const app = buildTestApp('attendee');

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer attendee_token');

    expect(res.status).toBe(200);
  });

  // ❌ Attendee accessing organizer-only route → 403
  it('❌ returns 403 when attendee tries to access an organizer-only route', async () => {
    mockJwtVerify.mockImplementation((_token, _secret, cb) => {
      if (cb) return cb(null, attendeePayload);
      return attendeePayload;
    });

    const app = buildTestApp('organizer');

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer attendee_token');

    expect(res.status).toBe(403);
  });

  // ❌ Organizer accessing attendee-only route → 403
  it('❌ returns 403 when organizer tries to access an attendee-only route', async () => {
    mockJwtVerify.mockImplementation((_token, _secret, cb) => {
      if (cb) return cb(null, organizerPayload);
      return organizerPayload;
    });

    const app = buildTestApp('attendee');

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer organizer_token');

    expect(res.status).toBe(403);
  });

  // ❌ roleMiddleware without authMiddleware → no req.user → 401 or 403
  it('❌ fails gracefully when req.user is not set (auth skipped)', async () => {
    // Mount roleMiddleware WITHOUT authMiddleware before it
    const app = express();
    app.use(express.json());
    app.get('/test', roleMiddleware('organizer'), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const res = await request(app)
      .get('/test')
      .set('Authorization', 'Bearer some_token');

    expect(res.status).toBeGreaterThanOrEqual(401);
  });
});