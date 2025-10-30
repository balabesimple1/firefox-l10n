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
  Avatar,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import {
  Add,
  Edit,
  Person,
  Language,
  AttachMoney,
  Star,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { translatorsAPI } from '../services/api';
import { Translator, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Translators: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTranslator, setSelectedTranslator] = useState<Translator | null>(null);
  const [filterLocale, setFilterLocale] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const { data: translators, isLoading } = useQuery('translators', () => 
    translatorsAPI.getAll({ available_only: availableOnly, locale: filterLocale })
  );

  const updateTranslatorMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => translatorsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('translators');
        setOpenDialog(false);
      },
    }
  );

  const handleOpenDialog = (translator?: Translator) => {
    setSelectedTranslator(translator || null);
    setOpenDialog(true);
  };

  const filteredTranslators = translators?.filter(translator => {
    if (filterLocale && !translator.specializations.includes(filterLocale)) return false;
    if (availableOnly && !translator.is_available) return false;
    return true;
  });

  const allLocales = [
    'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ru-RU'
  ];

  const translatorStats = {
    total: translators?.length || 0,
    available: translators?.filter(t => t.is_available).length || 0,
    busy: translators?.filter(t => !t.is_available).length || 0,
    avgRating: 4.5, // Placeholder
  };

  const canManageTranslators = user?.role === UserRole.ADMIN;

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Translators</Typography>
        {canManageTranslators && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Translator
          </Button>
        )}
      </Box>

      {/* Translator Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Translators
                  </Typography>
                  <Typography variant="h4">{translatorStats.total}</Typography>
                </Box>
                <Person color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Available
                  </Typography>
                  <Typography variant="h4">{translatorStats.available}</Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Busy
                  </Typography>
                  <Typography variant="h4">{translatorStats.busy}</Typography>
                </Box>
                <Schedule color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Rating
                  </Typography>
                  <Typography variant="h4">{translatorStats.avgRating}</Typography>
                </Box>
                <Star color="warning" sx={{ fontSize: 40 }} />
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
              <InputLabel>Filter by Locale</InputLabel>
              <Select
                value={filterLocale}
                onChange={(e) => setFilterLocale(e.target.value)}
                label="Filter by Locale"
              >
                <MenuItem value="">All Locales</MenuItem>
                {allLocales.map((locale) => (
                  <MenuItem key={locale} value={locale}>
                    {locale}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Availability</InputLabel>
              <Select
                value={availableOnly ? 'available' : 'all'}
                onChange={(e) => setAvailableOnly(e.target.value === 'available')}
                label="Availability"
              >
                <MenuItem value="all">All Translators</MenuItem>
                <MenuItem value="available">Available Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setFilterLocale('');
                setAvailableOnly(false);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Translators Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Translator</TableCell>
              <TableCell>Specializations</TableCell>
              <TableCell>Rates</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTranslators?.map((translator) => (
              <TableRow key={translator.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {translator.user.full_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {translator.user.full_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {translator.user.email}
                      </Typography>
                      {translator.bio && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          {translator.bio.substring(0, 50)}...
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {translator.specializations.slice(0, 3).map((locale) => (
                      <Chip
                        key={locale}
                        label={locale}
                        size="small"
                        variant="outlined"
                        icon={<Language />}
                      />
                    ))}
                    {translator.specializations.length > 3 && (
                      <Chip
                        label={`+${translator.specializations.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {Object.entries(translator.rates || {}).slice(0, 2).map(([locale, rate]) => (
                      <Typography key={locale} variant="body2">
                        {locale}: ${rate}/word
                      </Typography>
                    ))}
                    {Object.keys(translator.rates || {}).length > 2 && (
                      <Typography variant="caption" color="textSecondary">
                        +{Object.keys(translator.rates || {}).length - 2} more
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={translator.is_available ? 'Available' : 'Busy'}
                    color={translator.is_available ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Star color="warning" fontSize="small" />
                    <Typography variant="body2">4.5</Typography>
                    <Typography variant="caption" color="textSecondary">
                      (23 reviews)
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => {}}>
                    <Person />
                  </IconButton>
                  {canManageTranslators && (
                    <IconButton size="small" onClick={() => handleOpenDialog(translator)}>
                      <Edit />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Translator Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTranslator ? 'Edit Translator' : 'Add New Translator'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={selectedTranslator?.user.full_name || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={selectedTranslator?.user.email || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Specializations</InputLabel>
                <Select
                  multiple
                  value={selectedTranslator?.specializations || []}
                  input={<OutlinedInput label="Specializations" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {allLocales.map((locale) => (
                    <MenuItem key={locale} value={locale}>
                      {locale}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={selectedTranslator?.bio || ''}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Rates per Locale ($/word)
              </Typography>
              <Grid container spacing={2}>
                {allLocales.slice(0, 4).map((locale) => (
                  <Grid item xs={6} key={locale}>
                    <TextField
                      fullWidth
                      label={locale}
                      type="number"
                      step="0.01"
                      value={selectedTranslator?.rates?.[locale] || ''}
                      size="small"
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained">
            {selectedTranslator ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Translators;