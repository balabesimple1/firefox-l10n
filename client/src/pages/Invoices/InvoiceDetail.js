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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

const InvoiceDetail = () => {
  const { id } = useParams();

  const sampleTasks = [
    {
      id: 1,
      description: 'UI Translation - French',
      wordCount: 1250,
      rate: 0.10,
      amount: 125.00,
    },
    {
      id: 2,
      description: 'Documentation Translation - French',
      wordCount: 800,
      rate: 0.12,
      amount: 96.00,
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Invoice Details
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Invoice ID: {id}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Information
                </Typography>
                
                <Box mb={3}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number: INV-2024-000001
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Period: January 2024
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Translator: Marie Dubois
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Tasks
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Word Count</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sampleTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.description}</TableCell>
                          <TableCell align="right">{task.wordCount.toLocaleString()}</TableCell>
                          <TableCell align="right">${task.rate}</TableCell>
                          <TableCell align="right">${task.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                          Total
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          $221.00
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status & Summary
                </Typography>
                <Box mb={2}>
                  <Chip label="Approved" color="success" />
                </Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Words:</strong> 2,050
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Amount:</strong> $221.00
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Submitted:</strong> Feb 1, 2024
                </Typography>
                <Typography variant="body2">
                  <strong>Approved:</strong> Feb 3, 2024
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default InvoiceDetail;