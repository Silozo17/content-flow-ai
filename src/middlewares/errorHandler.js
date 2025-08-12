const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = {
    status: 500,
    message: 'Internal Server Error'
  };

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error = {
          status: 409,
          message: 'Resource already exists'
        };
        break;
      case '23503': // Foreign key violation
        error = {
          status: 400,
          message: 'Invalid reference to related resource'
        };
        break;
      case '23502': // Not null violation
        error = {
          status: 400,
          message: 'Required field is missing'
        };
        break;
      case 'PGRST116': // Table not found
        error = {
          status: 404,
          message: 'Resource not found'
        };
        break;
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      status: 400,
      message: 'Validation failed',
      details: err.details
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      status: 401,
      message: 'Invalid authentication token'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      status: 401,
      message: 'Authentication token expired'
    };
  }

  // OpenAI API errors
  if (err.response && err.response.status) {
    if (err.response.status === 429) {
      error = {
        status: 429,
        message: 'AI service rate limit exceeded. Please try again later.'
      };
    } else if (err.response.status === 401) {
      error = {
        status: 500,
        message: 'AI service configuration error'
      };
    }
  }

  // Custom application errors
  if (err.status) {
    error.status = err.status;
    error.message = err.message;
  }

  // Don't leak error details in production
  const response = {
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details;
  }

  res.status(error.status).json(response);
};

module.exports = errorHandler;