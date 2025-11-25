const express = require('express');
const cors = require('cors');
require('dotenv').config();

const logger = require('./config/logger');
const db = require('./models');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully.');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();