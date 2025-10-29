import React from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import { Add, Receipt } from '@mui/icons-material';

const Invoices = () => {
  const sampleInvoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-000001',
      translator: 'Marie Dubois',
      period: 'January 2024',
      amount: 1250.00,
      status: 'approved',
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-000002',
      translator: 'Hans Mueller',
      period: 'January 2024',
      amount: 890.50,
      status: 'pending',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'info',
      approved: 'success',
      rejected: 'error',
      paid: 'success',
    };
    return colors[status] || 'default';
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" gutterBottom>
            Invoices
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* TODO: Open create invoice dialog */}}
          >
            New Invoice
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Translator</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Receipt sx={{ mr: 1, color: 'primary.main' }} />
                      {invoice.invoiceNumber}
                    </Box>
                  </TableCell>
                  <TableCell>{invoice.translator}</TableCell>
                  <TableCell>{invoice.period}</TableCell>
                  <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Invoices;