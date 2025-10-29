import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Settings = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            This page will show system configuration, AI settings, email templates, and administrative controls.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Settings