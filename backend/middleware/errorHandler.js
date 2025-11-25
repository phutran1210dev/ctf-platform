const logger = require('../config/logger');

const errorHandler = (error, req, res, next) => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map(err => err.message);
    return res.status(400).json({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: messages
    });
  }

  // Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    return res.status(409).json({
      error: `${field} already exists`,
      code: 'DUPLICATE_ERROR',
      field
    });
  }

  // Sequelize foreign key constraint errors
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference to related resource',
      code: 'FOREIGN_KEY_ERROR'
    });
  }

  // Express validator errors
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  // Multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      code: 'FILE_TOO_LARGE',
      maxSize: process.env.MAX_FILE_SIZE || '10MB'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Custom application errors
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code || 'APPLICATION_ERROR'
    });
  }

  // Default server error
  return res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

module.exports = errorHandler;