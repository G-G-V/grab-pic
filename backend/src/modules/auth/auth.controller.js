import { signupUser, loginUser } from './auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * POST /api/v1/auth/signup
 * Body is pre-validated and sanitized via validate(signupSchema) — use req.validatedData
 */
export const signup = async (req, res) => {
  const { email, password, role } = req.validatedData;

  const result = await signupUser({ email, password, role });

  return sendSuccess(res, result, 200);
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  const { email, password } = req.validatedData;

  const result = await loginUser({ email, password });

  return sendSuccess(res, result, 200);
};
