/**
 * tests/auth.test.ts
 *
 * Covers:
 *   - Suite: Signup
 *   - Suite: Login
 *
 * Stack : Jest + Supertest
 * Mocks : Prisma client · bcrypt · jsonwebtoken
 * DB    : ❌ no real connection
 */

import request from 'supertest';
import app from '../src/app';

// ─── Mock: Prisma Client ──────────────────────────────────────────────────────
jest.mock('../src/infrastructure/prisma.client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// ─── Mock: bcrypt ─────────────────────────────────────────────────────────────
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

// ─── Mock: jsonwebtoken ───────────────────────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked_jwt_token'),
  verify: jest.fn(),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { prisma } from '../src/infrastructure/prisma.client';
import bcrypt from 'bcrypt';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const validOrganizerPayload = {
  email: 'organizer@test.com',
  password: 'StrongPass123',
  role: 'organizer',
};

const validAttendeePayload = {
  email: 'attendee@test.com',
  password: 'StrongPass123',
  role: 'attendee',
};

const existingUserRecord = {
  id: 'user-uuid-001',
  email: 'organizer@test.com',
  password_hash: 'hashed_password',
  role: 'organizer',
  created_at: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — SIGNUP
// ─────────────────────────────────────────────────────────────────────────────
describe('Auth — Signup  POST /api/v1/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Should create user with valid email/password
  it('✅ creates user and returns userId + JWT for valid organizer input', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);          // email not taken
    mockPrismaUser.create.mockResolvedValue(existingUserRecord); // user created

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(validOrganizerPayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBe('mocked_jwt_token');
  });

  // ✅ Should return JWT token
  it('✅ returns a JWT token on successful signup', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue(existingUserRecord);

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(validAttendeePayload);

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  // ❌ Should fail if email already exists (409)
  it('❌ returns 409 when email already exists', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(existingUserRecord); // email taken

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(validOrganizerPayload);

    expect(res.status).toBe(409);
  });

  // ❌ Should fail if password missing
  it('❌ returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'user@test.com', role: 'organizer' });

    expect(res.status).toBe(400);
  });

  // ❌ Should fail if invalid role
  it('❌ returns 400 when role is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'user@test.com', password: 'Pass123', role: 'admin' });

    expect(res.status).toBe(400);
  });

  // ❌ Should hash password before saving
  it('❌ hashes the password before persisting to DB', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue(existingUserRecord);

    await request(app)
      .post('/api/v1/auth/signup')
      .send(validOrganizerPayload);

    expect(mockBcrypt.hash).toHaveBeenCalledWith(
      validOrganizerPayload.password,
      expect.any(Number),
    );

    // Ensure raw password was never passed to prisma.create
    const createCall = mockPrismaUser.create.mock.calls[0][0];
    expect(JSON.stringify(createCall)).not.toContain(validOrganizerPayload.password);
  });

  // ❌ Should not expose password_hash in response
  it('❌ does not expose password_hash in the signup response', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);
    mockPrismaUser.create.mockResolvedValue(existingUserRecord);

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(validOrganizerPayload);

    expect(res.body).not.toHaveProperty('password_hash');
    expect(res.body).not.toHaveProperty('password');
  });

  // ❌ Should fail if email is missing / malformed
  it('❌ returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ password: 'Pass123', role: 'attendee' });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — LOGIN
// ─────────────────────────────────────────────────────────────────────────────
describe('Auth — Login  POST /api/v1/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Should login with correct credentials
  it('✅ returns 200 and a JWT for valid credentials', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(existingUserRecord);
    mockBcrypt.compare.mockResolvedValue(true as never);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'organizer@test.com', password: 'StrongPass123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBe('mocked_jwt_token');
  });

  // ✅ Should return valid JWT
  it('✅ returned token is a non-empty string', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(existingUserRecord);
    mockBcrypt.compare.mockResolvedValue(true as never);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'organizer@test.com', password: 'StrongPass123' });

    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  // ❌ Should fail if email not found (403)
  it('❌ returns 403 when email is not registered', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null); // user not found

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@test.com', password: 'StrongPass123' });

    expect(res.status).toBe(403);
  });

  // ❌ Should fail if password incorrect (403)
  it('❌ returns 403 when password is incorrect', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(existingUserRecord);
    mockBcrypt.compare.mockResolvedValue(false as never); // wrong password

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'organizer@test.com', password: 'WrongPass' });

    expect(res.status).toBe(403);
  });

  // ❌ Should not expose password_hash
  it('❌ does not expose password_hash in the login response', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(existingUserRecord);
    mockBcrypt.compare.mockResolvedValue(true as never);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'organizer@test.com', password: 'StrongPass123' });

    expect(res.body).not.toHaveProperty('password_hash');
    expect(res.body).not.toHaveProperty('password');
  });

  // ❌ Missing email field
  it('❌ returns 400 when email is missing from login body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'StrongPass123' });

    expect(res.status).toBe(400);
  });

  // ❌ Missing password field
  it('❌ returns 400 when password is missing from login body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'organizer@test.com' });

    expect(res.status).toBe(400);
  });
});