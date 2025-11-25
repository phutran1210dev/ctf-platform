import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,

  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  stats: {
    totalPoints: number;
    solveCount: number;
    categoryStats: Record<string, { count: number; points: number }>;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface Solve {
  id: string;
  challenge: {
    id: string;
    name: string;
    category: string;
    points: number;
  };
  solvedAt: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [solves, setSolves] = useState<Solve[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchSolveHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolveHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/recent-solves?limit=50', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSolves(data);
      }
    } catch (error) {
      console.error('Error fetching solve history:', error);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setProfile(prev => prev ? { ...prev, ...data.user } : null);
        setEditDialogOpen(false);
        
        // Update user in auth context
        updateUser(data.user);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    return <SecurityIcon sx={{ color: getCategoryColor(category) }} />;
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
      case 'pwn':
        return '#f44336';
      default:
        return '#607d8b';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 'bold' }}>
        Profile
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

      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, fontSize: 32 }}>
              {profile.username.charAt(0).toUpperCase()}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {profile.username}
                </Typography>
                {profile.isAdmin && (
                  <Chip label="Admin" size="small" color="error" />
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialogOpen(true)}
                >
                  Edit Profile
                </Button>
              </Box>
              
              <Typography color="textSecondary" sx={{ mb: 1 }}>
                {profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : 'No name provided'}
              </Typography>
              
              <Typography color="textSecondary" sx={{ mb: 2 }}>
                {profile.email}
              </Typography>

              {profile.team && (
                <Chip
                  icon={<GroupIcon />}
                  label={`Team: ${profile.team.name}`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#4caf50' }}>
                <TrophyIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Points
                </Typography>
                <Typography variant="h5">
                  {profile.stats.totalPoints}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#2196f3' }}>
                <SecurityIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Challenges Solved
                </Typography>
                <Typography variant="h5">
                  {profile.stats.solveCount}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#ff9800' }}>
                <TimelineIcon />
              </Avatar>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Categories
                </Typography>
                <Typography variant="h5">
                  {Object.keys(profile.stats.categoryStats).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Category Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Category Breakdown
          </Typography>
          
          {Object.keys(profile.stats.categoryStats).length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              {Object.entries(profile.stats.categoryStats).map(([category, stats]) => (
                <Card key={category} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getCategoryIcon(category)}
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {category}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {stats.count} solves • {stats.points} points
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(stats.points / profile.stats.totalPoints) * 100}
                      sx={{ mt: 1, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: getCategoryColor(category) } }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary">
              No challenges solved yet. Start solving to see your progress!
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Solve History */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Solves
          </Typography>
          
          {solves.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Challenge</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Points</TableCell>
                    <TableCell align="right">Solved At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solves.map((solve) => (
                    <TableRow key={solve.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {solve.challenge.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={solve.challenge.category}
                          size="small"
                          sx={{ bgcolor: getCategoryColor(solve.challenge.category), color: 'white' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {solve.challenge.points}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(solve.solvedAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary">
              No solves yet. Start solving challenges to build your history!
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProfile}
            variant="contained"
            disabled={!email.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;