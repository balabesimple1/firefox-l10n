import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Tasks = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Translation Tasks
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            This page will show a list of translation tasks with filtering, status updates, and assignment management.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Tasks