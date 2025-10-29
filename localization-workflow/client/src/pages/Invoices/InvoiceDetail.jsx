import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { useParams } from 'react-router-dom'

const InvoiceDetail = () => {
  const { id } = useParams()
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Invoice Details
      </Typography>
      <Card>
        <CardContent>
          <Typography>
            Invoice ID: {id}
          </Typography>
          <Typography color="text.secondary">
            This page will show detailed invoice information, line items, and approval controls.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default InvoiceDetail