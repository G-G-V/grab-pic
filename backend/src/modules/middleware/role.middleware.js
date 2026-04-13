/**
 * Restricts route access by role
 * Usage: requireRole('organizer')
 */
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Requires role: ${role}.`,
    });
  }
  next();
};

// module.exports = { requireRole };
export { requireRole };
