import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Visibility,
  CheckCircle,
  Cancel,
  AttachMoney,
  Receipt,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { invoicesAPI, translatorsAPI, projectsAPI } from '../services/api';
import { Invoice, InvoiceStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | ''>('');
  const [filterMonth, setFilterMonth] = useState('');

  const { data: invoices, isLoading } = useQuery('invoices', () => invoicesAPI.getAll());
  const { data: translators } = useQuery('translators', () => translatorsAPI.getAll());
  const { data: projects } = useQuery('projects', () => projectsAPI.getAll());

  const approveInvoiceMutation = useMutation(invoicesAPI.approve, {
    onSuccess: () => {
      queryClient.invalidateQueries('invoices');
    },
  });

  const rejectInvoiceMutation = useMutation(
    ({ id, reason }: { id: number; reason: string }) => invoicesAPI.reject(id, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices');
      },
    }
  );

  const markPaidMutation = useMutation(invoicesAPI.markPaid, {
    onSuccess: () => {
      queryClient.invalidateQueries('invoices');
    },
  });

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.APPROVED:
        return 'info';
      case InvoiceStatus.SUBMITTED:
        return 'warning';
      case InvoiceStatus.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return <CheckCircle />;
      case InvoiceStatus.APPROVED:
        return <CheckCircle />;
      case InvoiceStatus.SUBMITTED:
        return <Schedule />;
      case InvoiceStatus.REJECTED:
        return <Cancel />;
      default:
        return <Receipt />;
    }
  };

  const filteredInvoices = invoices?.filter(invoice => {
    if (filterStatus && invoice.status !== filterStatus) return false;
    if (filterMonth) {
      const invoiceMonth = new Date(invoice.created_at).toISOString().substring(0, 7);
      if (invoiceMonth !== filterMonth) return false;
    }
    return true;
  });

  const invoiceStats = {
    total: invoices?.length || 0,
    draft: invoices?.filter(i => i.status === InvoiceStatus.DRAFT).length || 0,
    submitted: invoices?.filter(i => i.status === InvoiceStatus.SUBMITTED).length || 0,
    approved: invoices?.filter(i => i.status === InvoiceStatus.APPROVED).length || 0,
    paid: invoices?.filter(i => i.status === InvoiceStatus.PAID).length || 0,
    totalAmount: invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0,
  };

  const canManageInvoices = user?.role === UserRole.ADMIN || user?.role === UserRole.FINANCE;
  const isTranslator = user?.role === UserRole.TRANSLATOR;

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Invoices</Typography>
        {isTranslator && (
          <Button variant="contained" startIcon={<Add />}>
            Create Invoice
          </Button>
        )}
      </Box>

      {/* Invoice Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Invoices
                  </Typography>
                  <Typography variant="h4">{invoiceStats.total}</Typography>
                </Box>
                <Receipt color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Pending Approval
                  </Typography>
                  <Typography variant="h4">{invoiceStats.submitted}</Typography>
                </Box>
                <Schedule color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Approved
                  </Typography>
                  <Typography variant="h4">{invoiceStats.approved}</Typography>
                </Box>
                <CheckCircle color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Paid
                  </Typography>
                  <Typography variant="h4">{invoiceStats.paid}</Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Amount
                  </Typography>
                  <Typography variant="h4">
                    ${invoiceStats.totalAmount.toLocaleString()}
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as InvoiceStatus)}
                label="Filter by Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value={InvoiceStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={InvoiceStatus.SUBMITTED}>Submitted</MenuItem>
                <MenuItem value={InvoiceStatus.APPROVED}>Approved</MenuItem>
                <MenuItem value={InvoiceStatus.PAID}>Paid</MenuItem>
                <MenuItem value={InvoiceStatus.REJECTED}>Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Filter by Month"
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setFilterStatus('');
                setFilterMonth('');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Translator</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices?.map((invoice) => {
              const translator = translators?.find(t => t.id === invoice.translator_id);
              const project = projects?.find(p => p.id === invoice.project_id);

              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(invoice.status)}
                      <Box>
                        <Typography variant="subtitle2">
                          {invoice.invoice_number}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ID: {invoice.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {translator?.user.full_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{project?.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(invoice.period_start).toLocaleDateString()} - 
                      {new Date(invoice.period_end).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      ${invoice.total_amount.toLocaleString()} {invoice.currency}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewInvoice(invoice)}>
                      <Visibility />
                    </IconButton>
                    {canManageInvoices && invoice.status === InvoiceStatus.SUBMITTED && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => approveInvoiceMutation.mutate(invoice.id)}
                          color="success"
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => rejectInvoiceMutation.mutate({ 
                            id: invoice.id, 
                            reason: 'Needs review' 
                          })}
                          color="error"
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                    {canManageInvoices && invoice.status === InvoiceStatus.APPROVED && (
                      <IconButton
                        size="small"
                        onClick={() => markPaidMutation.mutate(invoice.id)}
                        color="success"
                      >
                        <AttachMoney />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invoice Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Invoice Details - {selectedInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Invoice Information
                </Typography>
                <Typography variant="body2">
                  <strong>Invoice Number:</strong> {selectedInvoice.invoice_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {selectedInvoice.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> ${selectedInvoice.total_amount} {selectedInvoice.currency}
                </Typography>
                <Typography variant="body2">
                  <strong>Created:</strong> {new Date(selectedInvoice.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Period & Dates
                </Typography>
                <Typography variant="body2">
                  <strong>Period:</strong> {new Date(selectedInvoice.period_start).toLocaleDateString()} - 
                  {new Date(selectedInvoice.period_end).toLocaleDateString()}
                </Typography>
                {selectedInvoice.submitted_at && (
                  <Typography variant="body2">
                    <strong>Submitted:</strong> {new Date(selectedInvoice.submitted_at).toLocaleDateString()}
                  </Typography>
                )}
                {selectedInvoice.approved_at && (
                  <Typography variant="body2">
                    <strong>Approved:</strong> {new Date(selectedInvoice.approved_at).toLocaleDateString()}
                  </Typography>
                )}
                {selectedInvoice.paid_at && (
                  <Typography variant="body2">
                    <strong>Paid:</strong> {new Date(selectedInvoice.paid_at).toLocaleDateString()}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Line Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Rate</TableCell>
                        <TableCell>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedInvoice.line_items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.rate}</TableCell>
                          <TableCell>${item.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              {selectedInvoice.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">{selectedInvoice.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices;