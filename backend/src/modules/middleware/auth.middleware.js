// const jwt = require('jsonwebtoken');
// const { asyncHandler } = require('../utils/asyncHandler');
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Verifies JWT from Authorization header and attaches user to req
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = {
    userId: decoded.userId,
    role: decoded.role,
  };

  next();
});

// module.exports = { authenticate };
export { authenticate };
