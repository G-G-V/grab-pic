// const { z } = require('zod');
import { z } from 'zod';

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required.'),
  description: z.string().optional(),
});

const joinEventSchema = z.object({
  joinCode: z.string().min(1, 'Join code is required.'),
});

// module.exports = { createEventSchema, joinEventSchema };
export { createEventSchema, joinEventSchema };
