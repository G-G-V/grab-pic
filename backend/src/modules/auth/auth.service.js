import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../infrastructure/prisma.client.js';
import { env } from '../../config/env.js';

const SALT_ROUNDS = 10;

/**
 * Creates a new user, hashes the password, returns userId + JWT.
 * Duplicate email → Prisma throws P2002 → errorHandler returns 409 automatically.
 */
export const signupUser = async ({ email, password, role }) => {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, password_hash, role },
    select: { id: true }, // never return password_hash
  });

  const token = jwt.sign({ userId: user.id, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { userId: user.id, token };
};

/**
 * Validates credentials, returns a signed JWT.
 * Throws a 403 error if email not found or password does not match.
 */
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password_hash: true, role: true },
  });

  if (!user) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 403;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 403;
    throw err;
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token };
};
