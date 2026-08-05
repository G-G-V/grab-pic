/**
 * Catches all unmatched routes — register after all routes in app.js
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found.`,
  });
};

// module.exports = { notFoundHandler };
export { notFoundHandler };
