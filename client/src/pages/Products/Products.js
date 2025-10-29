import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
} from '@mui/material';
import { Add, Business } from '@mui/icons-material';

const Products = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" gutterBottom>
            Products
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* TODO: Open create product dialog */}}
          >
            New Product
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Business sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Sample Product
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This is a sample product for demonstration purposes.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  5 locales • 12 tasks • $2,450 total cost
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Products;