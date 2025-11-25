import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface NotificationMessage {
  type: 'solve' | 'leaderboard_update' | 'competition_update' | 'system_message' | 'admin_notification';
  message?: string;
  challengeId?: string;
  challengeTitle?: string;
  username?: string;
  points?: number;
  isFirstBlood?: boolean;
  timestamp: string;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: NotificationMessage[];
  joinChallenge: (challengeId: string) => void;
  leaveChallenge: (challengeId: string) => void;
  sendMessage: (message: string, type?: 'team' | 'global') => void;
  clearNotifications: () => void;
  removeNotification: (index: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  useEffect(() => {
    if (token && user) {
      // Initialize socket connection with authentication
      const newSocket = io(SOCKET_URL, {
        auth: {
          token,
        },
        autoConnect: true,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Connection confirmation
      newSocket.on('connected', (data) => {
        console.log('Socket connection confirmed:', data);
      });

      // Challenge solved notifications
      newSocket.on('challenge_solved', (data) => {
        const notification: NotificationMessage = {
          type: 'solve',
          challengeId: data.challengeId,
          challengeTitle: data.challengeTitle,
          username: data.username,
          points: data.points,
          isFirstBlood: data.isFirstBlood,
          timestamp: data.timestamp,
        };
        
        addNotification(notification);
      });

      // Leaderboard update notifications
      newSocket.on('leaderboard_update', (data) => {
        const notification: NotificationMessage = {
          type: 'leaderboard_update',
          message: 'Leaderboard updated',
          timestamp: data.timestamp,
        };
        
        addNotification(notification);
      });

      // Competition status updates
      newSocket.on('competition_update', (data) => {
        const notification: NotificationMessage = {
          type: 'competition_update',
          message: `Competition status: ${data.status}`,
          timestamp: data.timestamp,
        };
        
        addNotification(notification);
      });

      // System messages
      newSocket.on('system_message', (data) => {
        const notification: NotificationMessage = {
          type: 'system_message',
          message: data.message,
          timestamp: data.timestamp,
        };
        
        addNotification(notification);
      });

      // Admin notifications (only for admins)
      newSocket.on('admin_notification', (data) => {
        if (user.role === 'admin' || user.role === 'moderator') {
          const notification: NotificationMessage = {
            type: 'admin_notification',
            message: data.message || `Admin notification: ${data.type}`,
            timestamp: data.timestamp,
          };
          
          addNotification(notification);
        }
      });

      // Challenge updates
      newSocket.on('challenge_update', (data) => {
        console.log('Challenge update received:', data);
        // Handle challenge updates (e.g., refresh challenge data)
      });

      // Chat messages
      newSocket.on('chat_message', (data) => {
        console.log('Chat message received:', data);
        // Handle chat messages if implementing chat feature
      });

      // Team solve notifications
      newSocket.on('team_solve', (data) => {
        const notification: NotificationMessage = {
          type: 'solve',
          challengeId: data.challengeId,
          challengeTitle: data.challengeTitle,
          username: data.username,
          points: data.points,
          isFirstBlood: data.isFirstBlood,
          timestamp: data.timestamp,
          message: `Team member ${data.username} solved ${data.challengeTitle}!`,
        };
        
        addNotification(notification);
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        const notification: NotificationMessage = {
          type: 'system_message',
          message: error.message || 'Connection error occurred',
          timestamp: new Date().toISOString(),
        };
        
        addNotification(notification);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // Disconnect socket if no token or user
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [token, user]);

  const addNotification = (notification: NotificationMessage) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      // Keep only last 50 notifications
      return newNotifications.slice(0, 50);
    });
    
    // Auto-remove non-critical notifications after 5 seconds
    if (notification.type === 'leaderboard_update') {
      setTimeout(() => {
        removeNotificationByTimestamp(notification.timestamp);
      }, 5000);
    }
  };

  const removeNotificationByTimestamp = (timestamp: string) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
  };

  const joinChallenge = (challengeId: string) => {
    if (socket && connected) {
      socket.emit('join_challenge', challengeId);
      console.log(`Joined challenge room: ${challengeId}`);
    }
  };

  const leaveChallenge = (challengeId: string) => {
    if (socket && connected) {
      socket.emit('leave_challenge', challengeId);
      console.log(`Left challenge room: ${challengeId}`);
    }
  };

  const sendMessage = (message: string, type: 'team' | 'global' = 'global') => {
    if (socket && connected) {
      socket.emit('send_message', { message, type });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const value: SocketContextType = {
    socket,
    connected,
    notifications,
    joinChallenge,
    leaveChallenge,
    sendMessage,
    clearNotifications,
    removeNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;