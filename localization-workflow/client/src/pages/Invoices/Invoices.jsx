import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Invoices = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Invoices
      </Typography>
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            This page will show invoice management, creation, approval workflow, and payment tracking.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Invoices