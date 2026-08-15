export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed.',
      // details: result.error.errors.map((e) => ({
      //   field: e.path.join('.'),
      //   message: e.message,
      // })),
      details: result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Attach parsed (sanitized) data to req
  req.validatedData = result.data;
  next();
};

// // module.exports = { validate };
// export { validate };
