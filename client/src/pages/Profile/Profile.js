import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { Person, Lock, Save } from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    const result = await updateProfile(profileData);
    
    if (result.success) {
      setMessage('Profile updated successfully');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage('');
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setMessage('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setError(result.error);
    }
    
    setPasswordLoading(false);
  };

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
    <Container maxWidth="md">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>
        
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <Person sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Profile Information
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleProfileSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={profileData.email}
                        disabled
                        helperText="Email cannot be changed"
                      />
                    </Grid>
                  </Grid>

                  <Box mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={isLoading ? <LoadingSpinner size={20} /> : <Save />}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Box mt={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={3}>
                    <Lock sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Change Password
                    </Typography>
                  </Box>

                  <Box component="form" onSubmit={handlePasswordSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          name="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Grid>
                    </Grid>

                    <Box mt={3}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={passwordLoading ? <LoadingSpinner size={20} /> : <Lock />}
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Profile Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: getRoleColor(user?.role),
                      fontSize: '2rem',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Avatar>
                  
                  <Typography variant="h6" gutterBottom>
                    {user?.fullName}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: getRoleColor(user?.role),
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      mb: 1
                    }}
                  >
                    {user?.role}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Account Details
                  </Typography>
                  
                  <Typography variant="body2">
                    <strong>Member since:</strong>{' '}
                    {new Date(user?.createdAt).toLocaleDateString()}
                  </Typography>
                  
                  {user?.lastLogin && (
                    <Typography variant="body2">
                      <strong>Last login:</strong>{' '}
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile;