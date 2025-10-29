import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Users = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            This page will show user management, translator profiles, rate management, and role assignments.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Users