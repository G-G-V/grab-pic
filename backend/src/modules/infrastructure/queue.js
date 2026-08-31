import { Queue } from 'bullmq';
import { env } from '../../config/env.js';

// const connection = {
//   host: new URL(env.REDIS_URL).hostname,
//   port: parseInt(new URL(env.REDIS_URL).port) || 6379,
// };

const redisUrl = new URL(env.REDIS_URL);

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  ...(redisUrl.protocol === 'rediss:' ? { tls: {} } : {}),
  maxRetriesPerRequest: null,
};

/**
 * Single shared BullMQ queue instance for photo processing jobs.
 * Photos confirm endpoint calls photoQueue.add() to enqueue a job.
 * Worker picks it up and processes: ML → embeddings → DB update.
 */
export const photoQueue = new Queue('photo-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3, // retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // first retry after 5s, then 10s, then 20s
    },
    removeOnComplete: 100, // keep last 100 completed jobs in Redis for debugging
    removeOnFail: 200, // keep last 200 failed jobs for inspection
  },
});

//
////
// Two things to note: attempts: 3 with exponential backoff means if ML service is temporarily down or slow, the job retries automatically without any manual intervention — important since DeepFace can occasionally timeout. The removeOnComplete/Fail limits prevent Redis memory from bloating up over time as jobs accumulate.
