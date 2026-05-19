const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
