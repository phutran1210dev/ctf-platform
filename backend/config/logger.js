const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ctf-platform' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Application log file
    new winston.transports.File({
      filename: process.env.LOG_FILE || path.join(logDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    })
  ],
  
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
      })
    )
  }));
}

// Create stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;