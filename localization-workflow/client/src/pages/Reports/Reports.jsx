import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            This page will show comprehensive reports including cost savings, translation progress, 
            locale status, monthly payouts, and spending analysis.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Reports