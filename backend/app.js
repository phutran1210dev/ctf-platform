const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const teamRoutes = require('./routes/teams');
const scoreRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const { authenticateToken } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const db = require('./models');
const SocketService = require('./services/socketService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for rate limiting and X-Forwarded-For headers
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/challenges', authenticateToken, challengeRoutes);
app.use('/api/teams', authenticateToken, teamRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/user', authenticateToken, userRoutes);

// Socket.io connection handling
const socketService = new SocketService(io);

io.on('connection', (socket) => {
  socketService.handleConnection(socket);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Skip database sync to avoid conflicts with migrations
    // Use migrations instead of sync for schema management
    logger.info('Database ready (using migrations for schema management).');

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    db.sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    db.sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

startServer();

module.exports = app;