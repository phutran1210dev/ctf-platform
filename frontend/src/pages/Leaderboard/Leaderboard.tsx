import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useSocket } from '../../contexts/SocketContext';

interface User {
  id: string;
  username: string;
  score: number;
  solveCount: number;
  team?: {
    id: string;
    name: string;
  };
  lastSolveTime?: string;
  rank?: number;
}

interface Team {
  id: string;
  name: string;
  score: number;
  solveCount: number;
  lastSolveTime?: string;
  rank?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && children}
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const { socket } = useSocket();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('leaderboardUpdate', (data) => {
        if (data.type === 'user') {
          setUsers(prev => {
            const updated = [...prev];
            const index = updated.findIndex(user => user.id === data.user.id);
            if (index >= 0) {
              updated[index] = data.user;
            } else {
              updated.push(data.user);
            }
            return updated.sort((a, b) => b.score - a.score);
          });
        } else if (data.type === 'team') {
          setTeams(prev => {
            const updated = [...prev];
            const index = updated.findIndex(team => team.id === data.team.id);
            if (index >= 0) {
              updated[index] = data.team;
            } else {
              updated.push(data.team);
            }
            return updated.sort((a, b) => b.score - a.score);
          });
        }
      });

      return () => {
        socket.off('leaderboardUpdate');
      };
    }
  }, [socket]);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch user leaderboard
      const usersResponse = await fetch('/api/scores/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        setUsers([]);
      }

      // Fetch team leaderboard
      const teamsResponse = await fetch('/api/scores/teams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
      setUsers([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophyIcon sx={{ color: '#FFD700' }} />;
      case 2:
        return <TrophyIcon sx={{ color: '#C0C0C0' }} />;
      case 3:
        return <TrophyIcon sx={{ color: '#CD7F32' }} />;
      default:
        return <StarIcon sx={{ color: '#607d8b' }} />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return 'transparent';
    }
  };

  const formatLastSolve = (lastSolve?: string) => {
    if (!lastSolve) return 'Never';
    const date = new Date(lastSolve);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Box sx={{ padding: 3 }}>
        <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 'bold' }}>
          Leaderboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 'bold' }}>
        Leaderboard
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#2196f3' }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h5">
                  {users.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#4caf50' }}>
                <GroupIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Teams
                </Typography>
                <Typography variant="h5">
                  {teams.length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#ff9800' }}>
                <TrophyIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Top Score
                </Typography>
                <Typography variant="h5">
                  {users.length > 0 ? users[0]?.score || 0 : 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={<PersonIcon />}
            label="Individual"
            sx={{ minHeight: 72 }}
          />
          <Tab
            icon={<GroupIcon />}
            label="Teams"
            sx={{ minHeight: 72 }}
          />
        </Tabs>

        {/* Individual Leaderboard */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Points</TableCell>
                  <TableCell align="right">Solves</TableCell>
                  <TableCell align="right">Team</TableCell>
                  <TableCell align="right">Last Solve</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    sx={{
                      backgroundColor: getRankColor(index + 1),
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRankIcon(index + 1)}
                        <Typography variant="h6">#{index + 1}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold">
                        {user.score}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={user.solveCount}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {user.team ? (
                        <Chip
                          label={user.team.name}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="textSecondary">
                        {formatLastSolve(user.lastSolveTime)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {users.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                No users have scored yet
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Team Leaderboard */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Points</TableCell>
                  <TableCell align="right">Solves</TableCell>

                  <TableCell align="right">Last Solve</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map((team, index) => (
                  <TableRow
                    key={team.id}
                    sx={{
                      backgroundColor: getRankColor(index + 1),
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRankIcon(index + 1)}
                        <Typography variant="h6">#{index + 1}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#4caf50' }}>
                          <GroupIcon />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {team.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" fontWeight="bold">
                        {team.score}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={team.solveCount}
                        size="small"
                        color="primary"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Typography color="textSecondary">
                        {formatLastSolve(team.lastSolveTime)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {teams.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                No teams have scored yet
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Leaderboard;