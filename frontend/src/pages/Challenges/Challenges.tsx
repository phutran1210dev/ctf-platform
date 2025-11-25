import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Code as CodeIcon,
  Lock as LockIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Flag as FlagIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

interface Challenge {
  id: string;
  name?: string;
  title?: string;
  description: string;
  category: string;
  points: number;
  difficulty: string;
  solved?: boolean;
  solves?: number;
  solveCount?: number;
  author?: {
    id: string;
    username: string;
  } | string;
  files?: string[];
  hints?: string[];
}

const CATEGORIES = ['All', 'Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn', 'Misc'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard', 'Insane'];

const Challenges: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [flag, setFlag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    const filterChallenges = () => {
      if (!Array.isArray(challenges)) {
        setFilteredChallenges([]);
        return;
      }

      let filtered = challenges;

      if (selectedCategory !== 'All') {
        filtered = filtered.filter(challenge => challenge.category === selectedCategory);
      }

      if (selectedDifficulty !== 'All') {
        filtered = filtered.filter(challenge => challenge.difficulty === selectedDifficulty);
      }

      if (searchTerm) {
        filtered = filtered.filter(challenge => {
          const name = challenge.title || challenge.name || '';
          return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
        });
      }

      setFilteredChallenges(filtered);
    };

    filterChallenges();
  }, [challenges, selectedCategory, selectedDifficulty, searchTerm]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('challengeSolved', (data) => {
        setChallenges(prev => prev.map(challenge => 
          challenge.id === data.challengeId 
            ? { 
                ...challenge, 
                solves: (challenge.solves ?? challenge.solveCount ?? 0) + 1,
                solveCount: (challenge.solves ?? challenge.solveCount ?? 0) + 1,
                solved: data.userId === user?.id ? true : challenge.solved
              }
            : challenge
        ));
      });

      return () => {
        socket.off('challengeSolved');
      };
    }
  }, [socket, user]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/challenges', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle different API response structures
        const challengesArray = Array.isArray(data) ? data : (data.challenges || []);
        setChallenges(challengesArray);
      } else {
        console.error('Failed to fetch challenges');
        setChallenges([]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };



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
      case 'pwn':
        return <SecurityIcon />;
      default:
        return <AssignmentIcon />;
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
      case 'pwn':
        return '#f44336';
      default:
        return '#607d8b';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'hard':
        return '#f44336';
      case 'insane':
        return '#9c27b0';
      default:
        return '#607d8b';
    }
  };

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsDialogOpen(true);
    setFlag('');
    setSubmitMessage(null);
  };

  const handleFlagSubmit = async () => {
    if (!flag.trim() || !selectedChallenge) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/challenges/${selectedChallenge.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ flag }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage({ type: 'success', text: data.message });
        setFlag('');
        
        setChallenges(prev => prev.map(c => 
          c.id === selectedChallenge.id 
            ? { 
                ...c, 
                solved: true, 
                solves: (c.solves ?? c.solveCount ?? 0) + 1,
                solveCount: (c.solves ?? c.solveCount ?? 0) + 1
              }
            : c
        ));

        setTimeout(() => {
          setIsDialogOpen(false);
        }, 1500);
      } else {
        setSubmitMessage({ type: 'error', text: data.error || 'Incorrect flag' });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Failed to submit flag' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading challenges...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" sx={{ marginBottom: 3, fontWeight: 'bold' }}>
        Challenges
      </Typography>

      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FilterIcon />
          <TextField
            label="Search challenges"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={selectedDifficulty}
              label="Difficulty"
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              {DIFFICULTIES.map(difficulty => (
                <MenuItem key={difficulty} value={difficulty}>
                  {difficulty}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 2,
        }}
      >
        {Array.isArray(filteredChallenges) && filteredChallenges.map((challenge) => (
          <Card
            key={challenge.id}
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              border: challenge.solved ? '2px solid #4caf50' : 'none',
            }}
            onClick={() => handleChallengeClick(challenge)}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: getCategoryColor(challenge.category), width: 32, height: 32 }}>
                    {getCategoryIcon(challenge.category)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {challenge.title || challenge.name}
                      {challenge.solved && (
                        <Tooltip title="Solved">
                          <CheckCircleIcon sx={{ color: '#4caf50', ml: 1, fontSize: 20 }} />
                        </Tooltip>
                      )}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      by {typeof challenge.author === 'object' ? challenge.author?.username : challenge.author || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {challenge.points}
                </Typography>
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {challenge.description}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={challenge.category}
                    size="small"
                    sx={{ bgcolor: getCategoryColor(challenge.category), color: 'white' }}
                  />
                  <Chip
                    label={challenge.difficulty}
                    size="small"
                    sx={{ bgcolor: getDifficultyColor(challenge.difficulty), color: 'white' }}
                  />
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {(challenge.solves ?? challenge.solveCount ?? 0)} solve{(challenge.solves ?? challenge.solveCount ?? 0) !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {Array.isArray(filteredChallenges) && filteredChallenges.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No challenges found matching your criteria
          </Typography>
        </Box>
      )}

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedChallenge && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: getCategoryColor(selectedChallenge.category) }}>
                  {getCategoryIcon(selectedChallenge.category)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedChallenge.title || selectedChallenge.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {selectedChallenge.points} points • {selectedChallenge.solves ?? selectedChallenge.solveCount ?? 0} solves
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                  <Chip
                    label={selectedChallenge.category}
                    size="small"
                    sx={{ bgcolor: getCategoryColor(selectedChallenge.category), color: 'white' }}
                  />
                  <Chip
                    label={selectedChallenge.difficulty}
                    size="small"
                    sx={{ bgcolor: getDifficultyColor(selectedChallenge.difficulty), color: 'white' }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedChallenge.description}
              </Typography>

              {selectedChallenge.files && selectedChallenge.files.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Files:</Typography>
                  {selectedChallenge.files.map((file, index) => (
                    <Button key={index} variant="outlined" size="small" sx={{ mr: 1, mb: 1 }}>
                      {file}
                    </Button>
                  ))}
                </Box>
              )}

              {!selectedChallenge.solved && (
                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    label="Flag"
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    placeholder="CTF{...}"
                    variant="outlined"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleFlagSubmit();
                      }
                    }}
                    InputProps={{
                      startAdornment: <FlagIcon sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                  />
                </Box>
              )}

              {selectedChallenge.solved && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon />
                    Challenge already solved!
                  </Box>
                </Alert>
              )}

              {submitMessage && (
                <Alert severity={submitMessage.type} sx={{ mt: 2 }}>
                  {submitMessage.text}
                </Alert>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              {!selectedChallenge.solved && (
                <Button
                  onClick={handleFlagSubmit}
                  variant="contained"
                  disabled={!flag.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Flag'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Challenges;