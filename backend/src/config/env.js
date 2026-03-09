import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // JWT
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // AWS S3
  AWS_ACCESS_KEY_ID: requireEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: requireEnv('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION: requireEnv('AWS_REGION'),
  S3_BUCKET_NAME: requireEnv('S3_BUCKET_NAME'),

  // ML Service
  ML_SERVICE_URL: requireEnv('ML_SERVICE_URL'),

  // Redis
  REDIS_URL: requireEnv('REDIS_URL'),
};
