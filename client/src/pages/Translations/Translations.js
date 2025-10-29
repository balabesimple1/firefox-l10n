import React from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import { Add, Translate } from '@mui/icons-material';

const Translations = () => {
  const sampleTasks = [
    {
      id: 1,
      title: 'UI Translation - French',
      product: 'Web App',
      locale: 'fr-FR',
      status: 'in_progress',
      progress: 65,
      translator: 'Marie Dubois',
    },
    {
      id: 2,
      title: 'Documentation - German',
      product: 'Mobile App',
      locale: 'de-DE',
      status: 'completed',
      progress: 100,
      translator: 'Hans Mueller',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      approved: 'success',
    };
    return colors[status] || 'default';
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" gutterBottom>
            Translation Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* TODO: Open create task dialog */}}
          >
            New Task
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Locale</TableCell>
                <TableCell>Translator</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Translate sx={{ mr: 1, color: 'primary.main' }} />
                      {task.title}
                    </Box>
                  </TableCell>
                  <TableCell>{task.product}</TableCell>
                  <TableCell>{task.locale}</TableCell>
                  <TableCell>{task.translator}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{task.progress}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Translations;