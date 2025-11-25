import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,

  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Alert,
  IconButton,
  Tooltip,

} from '@mui/material';
import {
  Group as GroupIcon,
  Add as AddIcon,
  ExitToApp as LeaveIcon,
  PersonAdd as JoinIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  totalPoints: number;
  captain: {
    id: string;
    username: string;
  };
  members: Array<{
    id: string;
    username: string;
    totalPoints: number;
    isCaptain: boolean;
  }>;
  joinCode?: string;
  isPublic: boolean;
}

const Teams: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [teamDetailOpen, setTeamDetailOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
    if (user?.teamId) {
      fetchMyTeam();
    }
  }, [user]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('teamUpdate', (data) => {
        if (data.type === 'memberJoined' || data.type === 'memberLeft') {
          fetchTeams();
          if (user?.teamId === data.teamId) {
            fetchMyTeam();
          }
        }
      });

      return () => {
        socket.off('teamUpdate');
      };
    }
  }, [socket, user]);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(Array.isArray(data) ? data : []);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teams/${user?.teamId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyTeam(data);
      } else {
        setMyTeam(null);
      }
    } catch (error) {
      console.error('Error fetching my team:', error);
      setMyTeam(null);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Team created successfully!');
        setNewTeamName('');
        setNewTeamDescription('');
        setCreateDialogOpen(false);
        
        // Update user state
        updateUser({ ...user!, teamId: data.id });
        
        fetchTeams();
        fetchMyTeam();
      } else {
        setError(data.error || 'Failed to create team');
      }
    } catch (error) {
      setError('Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ joinCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Successfully joined team!');
        setJoinCode('');
        setJoinDialogOpen(false);
        
        // Update user state
        updateUser({ ...user!, teamId: data.teamId });
        
        fetchTeams();
        fetchMyTeam();
      } else {
        setError(data.error || 'Failed to join team');
      }
    } catch (error) {
      setError('Failed to join team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teams/leave', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Successfully left team!');
        
        // Update user state
        updateUser({ ...user!, teamId: undefined });
        setMyTeam(null);
        
        fetchTeams();
      } else {
        setError(data.error || 'Failed to leave team');
      }
    } catch (error) {
      setError('Failed to leave team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    setTeamDetailOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading teams...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Teams
        </Typography>
        
        {!user?.teamId && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Team
            </Button>
            <Button
              variant="outlined"
              startIcon={<JoinIcon />}
              onClick={() => setJoinDialogOpen(true)}
            >
              Join Team
            </Button>
          </Box>
        )}
      </Box>

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

      {/* My Team Section */}
      {myTeam && (
        <Card sx={{ mb: 3, border: '2px solid #4caf50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <GroupIcon />
                  {myTeam.name}
                  <Chip label="My Team" size="small" color="primary" />
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                  {myTeam.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip
                    label={`${myTeam.memberCount}/${myTeam.maxMembers} members`}
                    size="small"
                    color="secondary"
                  />
                  <Chip
                    label={`${myTeam.totalPoints} points`}
                    size="small"
                    color="success"
                  />
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LeaveIcon />}
                onClick={handleLeaveTeam}
                disabled={isSubmitting}
              >
                Leave Team
              </Button>
            </Box>

            {/* Team Members */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Team Members
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              {(myTeam.members || []).map((member) => (
                <Card key={member.id} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      {member.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {member.username}
                        {member.isCaptain && (
                          <Tooltip title="Team Captain">
                            <StarIcon sx={{ color: '#FFD700', ml: 1, fontSize: 16 }} />
                          </Tooltip>
                        )}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {member.totalPoints} points
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>

            {myTeam.joinCode && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Join Code (share with teammates):
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                  {myTeam.joinCode}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Teams Grid */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        All Teams
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {(teams || []).map((team) => (
          <Card
            key={team.id}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
            onClick={() => handleTeamClick(team)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf50' }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{team.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Captain: {team.captain.username}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {team.description || 'No description'}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${team.memberCount}/${team.maxMembers}`}
                    size="small"
                    color="secondary"
                  />
                  <Chip
                    label={`${team.totalPoints} pts`}
                    size="small"
                    color="primary"
                  />
                </Box>
                <Chip
                  label={team.isPublic ? 'Public' : 'Private'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {(teams || []).length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No teams found
          </Typography>
        </Box>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={newTeamDescription}
            onChange={(e) => setNewTeamDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTeam}
            variant="contained"
            disabled={!newTeamName.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Team Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Join Team</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Join Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            margin="normal"
            placeholder="Enter team join code"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleJoinTeam}
            variant="contained"
            disabled={!joinCode.trim() || isSubmitting}
          >
            {isSubmitting ? 'Joining...' : 'Join Team'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team Detail Dialog */}
      <Dialog open={teamDetailOpen} onClose={() => setTeamDetailOpen(false)} maxWidth="md" fullWidth>
        {selectedTeam && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#4caf50' }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedTeam.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedTeam.totalPoints} points • {selectedTeam.memberCount} members
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedTeam.description || 'No description provided'}
              </Typography>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Team Members
              </Typography>
              
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell align="right">Points</TableCell>
                      <TableCell align="right">Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedTeam.members || []).map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {member.username.charAt(0).toUpperCase()}
                            </Avatar>
                            {member.username}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{member.totalPoints}</TableCell>
                        <TableCell align="right">
                          {member.isCaptain ? (
                            <Chip label="Captain" size="small" color="primary" />
                          ) : (
                            <Chip label="Member" size="small" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setTeamDetailOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Teams;