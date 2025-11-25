const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../config/logger');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    
    // Store singleton instance
    SocketService.instance = this;
  }

  static getInstance() {
    return SocketService.instance;
  }

  async handleConnection(socket) {
    try {
      // Authenticate user
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.emit('error', { message: 'Authentication required' });
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'username', 'role', 'teamId']
      });

      if (!user) {
        socket.emit('error', { message: 'Invalid user' });
        socket.disconnect();
        return;
      }

      // Store user connection
      socket.userId = user.id;
      socket.username = user.username;
      socket.teamId = user.teamId;
      socket.role = user.role;
      
      this.connectedUsers.set(socket.id, {
        userId: user.id,
        username: user.username,
        teamId: user.teamId,
        role: user.role
      });

      logger.info(`User connected via WebSocket: ${user.username} (${socket.id})`);

      // Join user to their team room
      if (user.teamId) {
        socket.join(`team_${user.teamId}`);
      }

      // Join admin room if admin
      if (user.role === 'admin') {
        socket.join('admin');
      }

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected successfully',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      // Handle joining challenge rooms
      socket.on('join_challenge', (challengeId) => {
        this.handleJoinChallenge(socket, challengeId);
      });

      // Handle leaving challenge rooms
      socket.on('leave_challenge', (challengeId) => {
        this.handleLeaveChallenge(socket, challengeId);
      });

      // Handle chat messages (if implementing chat)
      socket.on('send_message', (data) => {
        this.handleChatMessage(socket, data);
      });

    } catch (error) {
      logger.error('Socket authentication error:', error);
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  }

  handleDisconnection(socket) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (userInfo) {
      logger.info(`User disconnected: ${userInfo.username} (${socket.id})`);
      this.connectedUsers.delete(socket.id);
    }
  }

  handleJoinChallenge(socket, challengeId) {
    if (!challengeId) return;
    
    socket.join(`challenge_${challengeId}`);
    logger.debug(`User ${socket.username} joined challenge room: ${challengeId}`);
  }

  handleLeaveChallenge(socket, challengeId) {
    if (!challengeId) return;
    
    socket.leave(`challenge_${challengeId}`);
    logger.debug(`User ${socket.username} left challenge room: ${challengeId}`);
  }

  handleChatMessage(socket, data) {
    const userInfo = this.connectedUsers.get(socket.id);
    if (!userInfo || !data.message) return;

    const messageData = {
      id: Date.now(),
      username: userInfo.username,
      message: data.message.substring(0, 500), // Limit message length
      timestamp: new Date().toISOString(),
      teamId: userInfo.teamId
    };

    // Emit to team room or global based on message type
    if (data.type === 'team' && userInfo.teamId) {
      this.io.to(`team_${userInfo.teamId}`).emit('chat_message', messageData);
    } else if (data.type === 'global') {
      this.io.emit('chat_message', messageData);
    }

    logger.debug(`Chat message from ${userInfo.username}: ${data.message}`);
  }

  // Emit solve notifications
  emitSolve(solveData) {
    try {
      const notification = {
        type: 'solve',
        challengeId: solveData.challengeId,
        challengeTitle: solveData.challengeTitle,
        username: solveData.username,
        points: solveData.points,
        isFirstBlood: solveData.isFirstBlood,
        timestamp: new Date().toISOString()
      };

      // Emit to all connected users
      this.io.emit('challenge_solved', notification);

      // Emit to challenge room
      this.io.to(`challenge_${solveData.challengeId}`).emit('challenge_update', {
        type: 'solve_count_updated',
        challengeId: solveData.challengeId
      });

      // Emit to team room
      if (solveData.teamId) {
        this.io.to(`team_${solveData.teamId}`).emit('team_solve', notification);
      }

      logger.info(`Solve notification emitted: ${solveData.challengeTitle} by ${solveData.username}`);
    } catch (error) {
      logger.error('Error emitting solve notification:', error);
    }
  }

  // Emit leaderboard updates
  emitLeaderboardUpdate(type = 'team') {
    try {
      this.io.emit('leaderboard_update', {
        type,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Leaderboard update emitted: ${type}`);
    } catch (error) {
      logger.error('Error emitting leaderboard update:', error);
    }
  }

  // Emit admin notifications
  emitAdminNotification(notification) {
    try {
      this.io.to('admin').emit('admin_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      logger.info(`Admin notification emitted: ${notification.type}`);
    } catch (error) {
      logger.error('Error emitting admin notification:', error);
    }
  }

  // Emit competition status updates
  emitCompetitionUpdate(status) {
    try {
      this.io.emit('competition_update', {
        status,
        timestamp: new Date().toISOString()
      });

      logger.info(`Competition update emitted: ${status}`);
    } catch (error) {
      logger.error('Error emitting competition update:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users in specific room
  getUsersInRoom(room) {
    const roomUsers = [];
    const sockets = this.io.sockets.adapter.rooms.get(room);
    
    if (sockets) {
      sockets.forEach(socketId => {
        const userInfo = this.connectedUsers.get(socketId);
        if (userInfo) {
          roomUsers.push(userInfo);
        }
      });
    }
    
    return roomUsers;
  }

  // Broadcast system message
  broadcastSystemMessage(message, type = 'info') {
    try {
      this.io.emit('system_message', {
        type,
        message,
        timestamp: new Date().toISOString()
      });

      logger.info(`System message broadcasted: ${message}`);
    } catch (error) {
      logger.error('Error broadcasting system message:', error);
    }
  }
}

module.exports = SocketService;