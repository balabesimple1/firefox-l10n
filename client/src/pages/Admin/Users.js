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
  Avatar,
} from '@mui/material';
import { Add, Person } from '@mui/icons-material';

const Users = () => {
  const sampleUsers = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'product',
      isActive: true,
      lastLogin: '2024-01-15',
    },
    {
      id: 2,
      firstName: 'Marie',
      lastName: 'Dubois',
      email: 'marie.dubois@example.com',
      role: 'translator',
      isActive: true,
      lastLogin: '2024-01-14',
    },
    {
      id: 3,
      firstName: 'Hans',
      lastName: 'Mueller',
      email: 'hans.mueller@example.com',
      role: 'translator',
      isActive: false,
      lastLogin: '2024-01-10',
    },
  ];

  const getRoleColor = (role) => {
    const colors = {
      admin: '#f44336',
      product: '#2196f3',
      finance: '#4caf50',
      translator: '#ff9800',
    };
    return colors[role] || '#757575';
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" gutterBottom>
            User Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* TODO: Open create user dialog */}}
          >
            New User
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: getRoleColor(user.role),
                          width: 32,
                          height: 32,
                          mr: 2,
                        }}
                      >
                        <Person />
                      </Avatar>
                      {user.firstName} {user.lastName}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      sx={{
                        bgcolor: getRoleColor(user.role),
                        color: 'white',
                        textTransform: 'capitalize',
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell>
                    <Button size="small">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Users;