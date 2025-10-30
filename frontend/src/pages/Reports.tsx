import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  AttachMoney,
  Language,
  Download,
  Refresh,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { reportsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState('locale-status');
  const [timePeriod, setTimePeriod] = useState('this_month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { data: localeStatusData, refetch: refetchLocaleStatus } = useQuery(
    ['locale-status', timePeriod],
    () => reportsAPI.getLocaleStatus({ time_period: timePeriod }),
    { enabled: selectedReport === 'locale-status' }
  );

  const { data: projectSummaryData } = useQuery(
    'project-summary',
    () => reportsAPI.getProjectSummary(),
    { enabled: selectedReport === 'project-summary' }
  );

  const { data: translatorPerformanceData } = useQuery(
    ['translator-performance', selectedYear, selectedMonth],
    () => reportsAPI.getTranslatorPerformance({ year: selectedYear, month: selectedMonth }),
    { enabled: selectedReport === 'translator-performance' }
  );

  const { data: financialSummaryData } = useQuery(
    ['financial-summary', selectedYear, selectedMonth],
    () => reportsAPI.getFinancialSummary(selectedYear, selectedMonth),
    { enabled: selectedReport === 'financial-summary' && (user?.role === UserRole.FINANCE || user?.role === UserRole.ADMIN) }
  );

  const { data: costSavingsData } = useQuery(
    ['cost-savings', selectedYear, selectedMonth],
    () => reportsAPI.getCostSavings({ year: selectedYear, month: selectedMonth }),
    { enabled: selectedReport === 'cost-savings' }
  );

  const reportOptions = [
    { value: 'locale-status', label: 'Locale Status Report', roles: [UserRole.ADMIN, UserRole.PRODUCT, UserRole.TRANSLATOR] },
    { value: 'project-summary', label: 'Project Summary Report', roles: [UserRole.ADMIN, UserRole.PRODUCT] },
    { value: 'translator-performance', label: 'Translator Performance', roles: [UserRole.ADMIN, UserRole.TRANSLATOR] },
    { value: 'financial-summary', label: 'Financial Summary', roles: [UserRole.ADMIN, UserRole.FINANCE] },
    { value: 'cost-savings', label: 'Cost Savings Report', roles: [UserRole.ADMIN, UserRole.PRODUCT, UserRole.FINANCE] },
  ].filter(option => option.roles.includes(user?.role as UserRole));

  const renderLocaleStatusReport = () => {
    if (!localeStatusData) return null;

    return (
      <Box>
        <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
          <Typography variant="h6">Locale Status Report</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              label="Time Period"
            >
              <MenuItem value="this_month">This Month</MenuItem>
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="overall">Overall</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Locales
                </Typography>
                <Typography variant="h4">{localeStatusData.total_locales}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Avg Completion
                </Typography>
                <Typography variant="h4">
                  {Math.round(
                    localeStatusData.locale_stats?.reduce((sum: number, locale: any) => 
                      sum + locale.completion_percentage, 0) / 
                    (localeStatusData.locale_stats?.length || 1)
                  )}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Cost
                </Typography>
                <Typography variant="h4">
                  ${localeStatusData.locale_stats?.reduce((sum: number, locale: any) => 
                    sum + locale.cost, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Savings
                </Typography>
                <Typography variant="h4">
                  ${localeStatusData.locale_stats?.reduce((sum: number, locale: any) => 
                    sum + locale.tm_savings + locale.ai_savings, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Locale</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Strings</TableCell>
                <TableCell>Issues</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Savings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localeStatusData.locale_stats?.map((locale: any) => (
                <TableRow key={locale.locale}>
                  <TableCell>
                    <Chip label={locale.locale} variant="outlined" icon={<Language />} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={locale.completion_percentage}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {Math.round(locale.completion_percentage)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {locale.translated_strings} / {locale.total_strings}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {locale.warnings > 0 && (
                        <Chip label={`${locale.warnings} warnings`} size="small" color="warning" />
                      )}
                      {locale.errors > 0 && (
                        <Chip label={`${locale.errors} errors`} size="small" color="error" sx={{ ml: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>${locale.cost.toLocaleString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="success.main">
                      ${(locale.tm_savings + locale.ai_savings).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      TM: ${locale.tm_savings} | AI: ${locale.ai_savings}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderFinancialSummaryReport = () => {
    if (!financialSummaryData) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Financial Summary Report</Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Spending
                </Typography>
                <Typography variant="h4">
                  ${financialSummaryData.total_spending.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Projected Spending
                </Typography>
                <Typography variant="h4">
                  ${financialSummaryData.projected_spending.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Projects
                </Typography>
                <Typography variant="h4">
                  {Object.keys(financialSummaryData.spending_by_project).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Translators
                </Typography>
                <Typography variant="h4">
                  {Object.keys(financialSummaryData.spending_by_translator).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Spending by Project
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(financialSummaryData.spending_by_project).map(([project, amount]) => (
                    <TableRow key={project}>
                      <TableCell>{project}</TableCell>
                      <TableCell align="right">${(amount as number).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Spending by Translator
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Translator</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(financialSummaryData.spending_by_translator).slice(0, 10).map(([translator, amount]) => (
                    <TableRow key={translator}>
                      <TableCell>{translator}</TableCell>
                      <TableCell align="right">${(amount as number).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderCurrentReport = () => {
    switch (selectedReport) {
      case 'locale-status':
        return renderLocaleStatusReport();
      case 'financial-summary':
        return renderFinancialSummaryReport();
      case 'project-summary':
        return (
          <Box>
            <Typography variant="h6">Project Summary Report</Typography>
            <Typography variant="body2" color="textSecondary">
              Detailed project progress and statistics will be displayed here.
            </Typography>
          </Box>
        );
      case 'translator-performance':
        return (
          <Box>
            <Typography variant="h6">Translator Performance Report</Typography>
            <Typography variant="body2" color="textSecondary">
              Translator performance metrics and statistics will be displayed here.
            </Typography>
          </Box>
        );
      case 'cost-savings':
        return (
          <Box>
            <Typography variant="h6">Cost Savings Report</Typography>
            <Typography variant="body2" color="textSecondary">
              Translation Memory and AI cost savings analysis will be displayed here.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            Export
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              label="Report Type"
            >
              {reportOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              label="Year"
            >
              {[2024, 2023, 2022].map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Month</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              label="Month"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        {renderCurrentReport()}
      </Paper>
    </Box>
  );
};

export default Reports;