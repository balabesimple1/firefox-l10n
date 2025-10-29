import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { useParams } from 'react-router-dom'

const ProjectDetail = () => {
  const { id } = useParams()
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Project Details
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            Project ID: {id}
          </Typography>
          <Typography color="text.secondary">
            This page will show detailed project information, locale assignments, translation progress, and management tools.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ProjectDetail