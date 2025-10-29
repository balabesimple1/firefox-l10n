import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';

const TranslationDetail = () => {
  const { id } = useParams();

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Translation Task Details
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Task ID: {id}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Task Information
                </Typography>
                <Typography variant="body1" gutterBottom>
                  UI Translation - French Localization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Translate all user interface elements from English to French.
                </Typography>
                
                <Box mt={3}>
                  <Typography variant="body2" gutterBottom>
                    Progress: 65%
                  </Typography>
                  <LinearProgress variant="determinate" value={65} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status & Details
                </Typography>
                <Box mb={2}>
                  <Chip label="In Progress" color="info" />
                </Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Locale:</strong> French (France)
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Translator:</strong> Marie Dubois
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Word Count:</strong> 1,250 / 2,000
                </Typography>
                <Typography variant="body2">
                  <strong>Estimated Cost:</strong> $200.00
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default TranslationDetail;