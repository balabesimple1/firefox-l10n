import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { useParams } from 'react-router-dom'

const TaskDetail = () => {
  const { id } = useParams()
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Task Details
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            Task ID: {id}
          </Typography>
          <Typography color="text.secondary">
            This page will show detailed task information, translation tools, and progress tracking.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TaskDetail