import { Router } from 'express';
import { signup, login } from './auth.controller.js';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../validators/auth.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// POST /api/v1/auth/signup
router.post('/signup', validate(signupSchema), asyncHandler(signup));

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), asyncHandler(login));

export default router;
