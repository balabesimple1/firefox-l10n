import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            This page will show user profile management, password changes, and translator-specific settings.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Profile