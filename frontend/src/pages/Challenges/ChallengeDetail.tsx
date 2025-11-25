import React from 'react';
import { Typography, Box } from '@mui/material';

const ChallengeDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Challenge Detail
      </Typography>
      <Typography variant="body1">
        Challenge details will be implemented here.
      </Typography>
    </Box>
  );
};

export default ChallengeDetail;