import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isAdmin?: boolean;
  isActive: boolean;
  score?: number;
  totalPoints?: number;
  solveCount?: number;
  teamId?: string;
  teamName?: string;
  team?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface Challenge {
  id: string;
  title: string;
  name?: string;
  description?: string;
  category: string;
  points: number;
  difficulty: string;
  isActive: boolean;
  isVisible?: boolean;
  author?: {
    id: string;
    username: string;
  };
  authorId?: string;
  solveCount: number;
  createdAt: string;
  updatedAt?: string;
}

interface SystemStats {
  users?: number;
  totalUsers?: number;
  teams?: number;
  totalTeams?: number;
  challenges?: number;
  totalChallenges?: number;
  submissions?: number;
  solves?: number;
  totalSolves?: number;
  activeUsers?: number;
  recentRegistrations?: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && children}
    </div>
  );
};

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  
  // Form states
  const [challengeName, setChallengeName] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeCategory, setChallengeCategory] = useState('');
  const [challengePoints, setChallengePoints] = useState('');
  const [challengeDifficulty, setChallengeDifficulty] = useState('');
  const [challengeFlag, setChallengeFlag] = useState('');
  const [challengeActive, setChallengeActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <Box sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch system stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSystemStats(statsData.stats || statsData);
      }

      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      }

      // Fetch challenges
      const challengesResponse = await fetch('/api/admin/challenges', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (challengesResponse.ok) {
        const challengesData = await challengesResponse.json();
        setChallenges(Array.isArray(challengesData) ? challengesData : challengesData.challenges || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'toggle' | 'makeAdmin' | 'delete') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined,
      });

      if (response.ok) {
        setSuccess(`User ${action} successful`);
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      setError(`Failed to ${action} user`);
    }
  };

  const handleChallengeSubmit = async () => {
    if (!challengeName.trim() || !challengeFlag.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = selectedChallenge ? `/api/admin/challenges/${selectedChallenge.id}` : '/api/admin/challenges';
      const method = selectedChallenge ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: challengeName,
          description: challengeDescription,
          category: challengeCategory.toLowerCase(),
          points: parseInt(challengePoints),
          difficulty: challengeDifficulty.toLowerCase(),
          flag: challengeFlag,
          isActive: challengeActive,
          isVisible: challengeActive,
        }),
      });

      if (response.ok) {
        setSuccess(`Challenge ${selectedChallenge ? 'updated' : 'created'} successfully`);
        setChallengeDialogOpen(false);
        resetChallengeForm();
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${selectedChallenge ? 'update' : 'create'} challenge`);
      }
    } catch (error) {
      setError(`Failed to ${selectedChallenge ? 'update' : 'create'} challenge`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetChallengeForm = () => {
    setChallengeName('');
    setChallengeDescription('');
    setChallengeCategory('');
    setChallengePoints('');
    setChallengeDifficulty('');
    setChallengeFlag('');
    setChallengeActive(true);
    setSelectedChallenge(null);
  };

  const openChallengeDialog = (challenge?: Challenge) => {
    if (challenge) {
      setSelectedChallenge(challenge);
      setChallengeName(challenge.title || challenge.name || '');
      setChallengeDescription(challenge.description || ''); // Not available in list
      setChallengeCategory(challenge.category);
      setChallengePoints(challenge.points.toString());
      setChallengeDifficulty(challenge.difficulty);
      setChallengeFlag(''); // Don't show existing flag
      setChallengeActive(challenge.isActive || challenge.isVisible || false);
    } else {
      resetChallengeForm();
    }
    setChallengeDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading admin dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 'bold' }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* System Stats */}
      {systemStats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#2196f3' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h5">
                    {systemStats.totalUsers || systemStats.users || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf50' }}>
                  <SecurityIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Challenges
                  </Typography>
                  <Typography variant="h5">
                    {systemStats.totalChallenges || systemStats.challenges || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#ff9800' }}>
                  <AssessmentIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Solves
                  </Typography>
                  <Typography variant="h5">
                    {systemStats.totalSolves || systemStats.solves || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#9c27b0' }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h5">
                    {systemStats.activeUsers || systemStats.users || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<PeopleIcon />} label="Users" />
          <Tab icon={<SecurityIcon />} label="Challenges" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Points</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(users) && users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {user.username}
                            {(user.role === 'admin' || user.isAdmin) && (
                              <Chip label="Admin" size="small" color="error" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : 'No name'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {user.score || user.totalPoints || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.solveCount || 0} solves
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.team?.name || user.teamName ? (
                        <Chip label={user.team?.name || user.teamName} size="small" variant="outlined" />
                      ) : (
                        <Typography color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(user.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleUserAction(user.id, 'toggle')}
                          color={user.isActive ? 'error' : 'success'}
                        >
                          {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                        {!user.isAdmin && (
                          <IconButton
                            size="small"
                            onClick={() => handleUserAction(user.id, 'makeAdmin')}
                            color="primary"
                          >
                            <SecurityIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Challenges Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openChallengeDialog()}
            >
              Add Challenge
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Challenge</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Points</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Solves</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(challenges) && challenges.map((challenge) => (
                  <TableRow key={challenge.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {challenge.title || challenge.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {`by ${challenge.author?.username || challenge.author || 'Unknown'}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={challenge.category}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {challenge.points}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={challenge.difficulty}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {challenge.solveCount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={challenge.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={challenge.isActive ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openChallengeDialog(challenge)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Platform Settings
          </Typography>
          <Typography color="textSecondary">
            Settings panel will be implemented based on specific requirements.
          </Typography>
        </TabPanel>
      </Paper>

      {/* Challenge Dialog */}
      <Dialog open={challengeDialogOpen} onClose={() => setChallengeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedChallenge ? 'Edit Challenge' : 'Add New Challenge'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Challenge Name"
            value={challengeName}
            onChange={(e) => setChallengeName(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={challengeDescription}
            onChange={(e) => setChallengeDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={challengeCategory}
              label="Category"
              onChange={(e) => setChallengeCategory(e.target.value)}
            >
              <MenuItem value="Web">Web</MenuItem>
              <MenuItem value="Crypto">Crypto</MenuItem>
              <MenuItem value="Reverse">Reverse</MenuItem>
              <MenuItem value="Forensics">Forensics</MenuItem>
              <MenuItem value="Pwn">Pwn</MenuItem>
              <MenuItem value="Misc">Misc</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Points"
            type="number"
            value={challengePoints}
            onChange={(e) => setChallengePoints(e.target.value)}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={challengeDifficulty}
              label="Difficulty"
              onChange={(e) => setChallengeDifficulty(e.target.value)}
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
              <MenuItem value="Insane">Insane</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Flag"
            value={challengeFlag}
            onChange={(e) => setChallengeFlag(e.target.value)}
            margin="normal"
            placeholder="CTF{...}"
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={challengeActive}
                onChange={(e) => setChallengeActive(e.target.checked)}
              />
            }
            label="Active"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChallengeDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleChallengeSubmit}
            variant="contained"
            disabled={!challengeName.trim() || !challengeFlag.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : selectedChallenge ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Admin;