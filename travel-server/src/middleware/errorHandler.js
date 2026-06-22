export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};

export const errorHandler = (err, req, res, _next) => {
  console.error('[ERROR]', err.message, err.stack?.split('\n')[1]?.trim() || '');

  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: Object.values(err.errors).map(e => e.message) });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: `${Object.keys(err.keyValue)[0]} already exists` });
  }
  res.status(500).json({ success: false, message: 'Internal server error' });
};
