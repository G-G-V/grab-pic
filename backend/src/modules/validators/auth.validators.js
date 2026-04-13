// const { z } = require('zod');
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.enum(['organizer', 'attendee'], {
    errorMap: () => ({ message: 'Role must be organizer or attendee.' }),
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(1, 'Password is required.'),
});

// module.exports = { signupSchema, loginSchema };
export { signupSchema, loginSchema };
