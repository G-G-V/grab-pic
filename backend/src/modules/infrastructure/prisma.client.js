// import { PrismaClient } from '@prisma/client';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from '../../config/env.js';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

////
// CommonJS
// const { PrismaClient } = require('@prisma/client');
// const { PrismaPg } = require('@prisma/adapter-pg');
// const pg = require('pg');

// const pool = new pg.Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// module.exports = { prisma };
