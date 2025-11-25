import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
  Lock as LockIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  NotificationsActive as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

interface DashboardStats {
  totalChallenges: number;
  solvedChallenges: number;
  totalPoints: number;
  rank: number;
  teamRank?: number;
}

interface Challenge {
  id: string;
  name: string;
  category: string;
  points: number;
  solved: boolean;
  solvedAt?: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const [stats, setStats] = useState<DashboardStats>({
    totalChallenges: 0,
    solvedChallenges: 0,
    totalPoints: 0,
    rank: 0,
  });
  const [recentSolves, setRecentSolves] = useState<Challenge[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch user stats
        const statsResponse = await fetch('/api/user/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch recent solves
        const solvesResponse = await fetch('/api/user/recent-solves', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (solvesResponse.ok) {
          const solvesData = await solvesResponse.json();
          setRecentSolves(solvesData);
        }

        // Set recent notifications from socket context with proper mapping
        const mappedNotifications: Notification[] = notifications.slice(-5).map((notif, index) => ({
          id: `notif-${index}`,
          message: notif.message || 'Notification',
          type: 'info' as const,
          timestamp: notif.timestamp || new Date().toISOString(),
        }));
        setRecentNotifications(mappedNotifications);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [notifications]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'web':
        return <CodeIcon />;
      case 'crypto':
        return <LockIcon />;
      case 'reverse':
        return <SearchIcon />;
      case 'forensics':
        return <VisibilityIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'web':
        return '#2196f3';
      case 'crypto':
        return '#ff9800';
      case 'reverse':
        return '#9c27b0';
      case 'forensics':
        return '#4caf50';
      default:
        return '#607d8b';
    }
  };

  const progressPercentage = stats.totalChallenges > 0 
    ? (stats.solvedChallenges / stats.totalChallenges) * 100 
    : 0;

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 'bold' }}>
        Welcome back, {user?.username}!
      </Typography>

      {/* Stats Cards - CSS Grid Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 2,
          marginBottom: 3,
        }}
      >
        {/* Total Points Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#4caf50', marginRight: 2 }}>
                <TrophyIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Points
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.totalPoints}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Rank Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#ff9800', marginRight: 2 }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Current Rank
                </Typography>
                <Typography variant="h5" component="div">
                  #{stats.rank}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Solved Challenges Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#2196f3', marginRight: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Solved Challenges
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.solvedChallenges}/{stats.totalChallenges}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Team Rank Card (if user is in a team) */}
        {user?.teamId && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#9c27b0', marginRight: 2 }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Team Rank
                  </Typography>
                  <Typography variant="h5" component="div">
                    #{stats.teamRank || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Progress Section */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Challenge Progress
        </Typography>
        <Box sx={{ marginBottom: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {stats.solvedChallenges} of {stats.totalChallenges} challenges completed ({progressPercentage.toFixed(1)}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* Two Column Layout for Activities */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          marginBottom: 3,
        }}
      >
        {/* Recent Solves */}
        <Paper sx={{ padding: 2 }}>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Recent Solves
          </Typography>
          <List>
            {recentSolves.length > 0 ? (
              recentSolves.map((challenge) => (
                <ListItem key={challenge.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getCategoryColor(challenge.category) }}>
                      {getCategoryIcon(challenge.category)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={challenge.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={challenge.category}
                          size="small"
                          sx={{ bgcolor: getCategoryColor(challenge.category), color: 'white' }}
                        />
                        <Typography variant="caption">
                          {challenge.points} pts
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <Typography color="textSecondary" sx={{ textAlign: 'center', padding: 2 }}>
                No solves yet. Start solving challenges!
              </Typography>
            )}
          </List>
        </Paper>

        {/* Recent Notifications */}
        <Paper sx={{ padding: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <NotificationsIcon sx={{ marginRight: 1 }} />
            <Typography variant="h6">
              Recent Notifications
            </Typography>
          </Box>
          <List>
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <ListItem key={notification.id}>
                  <ListItemText
                    primary={notification.message}
                    secondary={new Date(notification.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))
            ) : (
              <Typography color="textSecondary" sx={{ textAlign: 'center', padding: 2 }}>
                No recent notifications
              </Typography>
            )}
          </List>
        </Paper>
      </Box>

      {/* Quick Actions */}
      <Paper sx={{ padding: 2 }}>
        <Typography variant="h6" sx={{ marginBottom: 2 }}>
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            startIcon={<SecurityIcon />}
            onClick={() => window.location.href = '/challenges'}
          >
            Browse Challenges
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<TrendingUpIcon />}
            onClick={() => window.location.href = '/leaderboard'}
          >
            View Leaderboard
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<GroupIcon />}
            onClick={() => window.location.href = '/teams'}
          >
            Team Management
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<VisibilityIcon />}
            onClick={() => window.location.href = '/profile'}
          >
            View Profile
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;