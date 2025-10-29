import React from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  AttachMoney,
  People,
  Business,
  Translate,
  Receipt,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';

import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard-overview',
    async () => {
      const response = await axios.get('/api/dashboard/overview');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingSpinner message="Loading dashboard..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="error">
          Failed to load dashboard data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please try refreshing the page
        </Typography>
      </Box>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificContent = () => {
    switch (user.role) {
      case 'product':
        return <ProductDashboard data={dashboardData} />;
      case 'finance':
        return <FinanceDashboard data={dashboardData} />;
      case 'translator':
        return <TranslatorDashboard data={dashboardData} />;
      case 'admin':
        return <AdminDashboard data={dashboardData} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your {user.role} dashboard
        </Typography>
      </Box>

      {/* Role-specific content */}
      {getRoleSpecificContent()}
    </Box>
  );
};

// Product Team Dashboard
const ProductDashboard = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Products"
          value={data.summary.totalProducts}
          icon={<Business />}
          color="#2196f3"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Tasks"
          value={data.summary.inProgressTasks}
          icon={<Assignment />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Cost"
          value={`$${data.summary.totalCost.toLocaleString()}`}
          icon={<AttachMoney />}
          color="#ff9800"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Cost Saved"
          value={`$${(data.summary.costSavedTM + data.summary.costSavedAI).toLocaleString()}`}
          icon={<TrendingUp />}
          color="#9c27b0"
        />
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tasks by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.chartData.tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.chartData.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cost Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.chartData.costOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Tasks */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Translation Tasks
            </Typography>
            <List>
              {data.recentTasks.slice(0, 5).map((task) => (
                <ListItem key={task._id}>
                  <ListItemAvatar>
                    <Avatar>
                      <Translate />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={task.title}
                    secondary={`${task.locale.name} • ${task.translator?.firstName} ${task.translator?.lastName}`}
                  />
                  <Chip
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Finance Team Dashboard
const FinanceDashboard = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Invoices"
          value={data.summary.totalInvoices}
          icon={<Receipt />}
          color="#2196f3"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Invoices"
          value={data.summary.pendingInvoices}
          icon={<Assignment />}
          color="#ff9800"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="This Month"
          value={`$${data.summary.currentMonthTotal.toLocaleString()}`}
          icon={<AttachMoney />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Spending"
          value={`$${data.summary.totalSpending.toLocaleString()}`}
          icon={<TrendingUp />}
          color="#9c27b0"
        />
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invoices by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.chartData.invoicesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.chartData.invoicesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Spending
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.chartData.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Invoices */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Invoices
            </Typography>
            <List>
              {data.recentInvoices.slice(0, 5).map((invoice) => (
                <ListItem key={invoice._id}>
                  <ListItemAvatar>
                    <Avatar>
                      <Receipt />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={invoice.invoiceNumber}
                    secondary={`${invoice.translator?.firstName} ${invoice.translator?.lastName} • ${invoice.period}`}
                  />
                  <Box textAlign="right">
                    <Typography variant="body2">
                      ${invoice.summary.finalAmount.toLocaleString()}
                    </Typography>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Translator Dashboard
const TranslatorDashboard = ({ data }) => {
  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Tasks"
          value={data.summary.totalTasks}
          icon={<Assignment />}
          color="#2196f3"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="In Progress"
          value={data.summary.inProgressTasks}
          icon={<Translate />}
          color="#ff9800"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Earnings"
          value={`$${data.summary.totalEarnings.toLocaleString()}`}
          icon={<AttachMoney />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Quality Score"
          value={`${Math.round(data.summary.avgQualityScore)}%`}
          icon={<TrendingUp />}
          color="#9c27b0"
        />
      </Grid>

      {/* Progress Overview */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Task Progress
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Words Translated: {data.summary.totalWordsTranslated.toLocaleString()}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={75}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Tasks */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Recent Tasks
            </Typography>
            <List>
              {data.recentTasks.slice(0, 5).map((task) => (
                <ListItem key={task._id}>
                  <ListItemAvatar>
                    <Avatar>
                      <Translate />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={task.title}
                    secondary={`${task.product?.name} • ${task.locale.name}`}
                  />
                  <Box textAlign="right">
                    <Typography variant="body2">
                      {task.wordCount.translated}/{task.wordCount.total} words
                    </Typography>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Admin Dashboard
const AdminDashboard = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Users"
          value={data.summary.totalUsers}
          icon={<People />}
          color="#2196f3"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Projects"
          value={data.summary.totalProducts}
          icon={<Business />}
          color="#4caf50"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Tasks"
          value={data.summary.totalTasks}
          icon={<Assignment />}
          color="#ff9800"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Spending"
          value={`$${data.summary.totalSpending.toLocaleString()}`}
          icon={<AttachMoney />}
          color="#9c27b0"
        />
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Users by Role
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.chartData.usersByRole}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.chartData.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tasks by Product
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.chartData.tasksByProduct}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.chartData.tasksByProduct.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

// Helper function to get status colors
const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    approved: 'success',
    rejected: 'error',
    draft: 'default',
    submitted: 'info',
    under_review: 'warning',
    paid: 'success',
  };
  return colors[status] || 'default';
};

export default Dashboard;