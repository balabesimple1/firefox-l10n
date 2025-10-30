import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  People,
  AttachMoney,
  Work,
  CheckCircle,
  Schedule,
  Warning,
  ArrowForward,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { useQuery } from 'react-query';
import { projectsAPI, tasksAPI, invoicesAPI, reportsAPI } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch dashboard data based on user role
  const { data: projects } = useQuery('dashboard-projects', () => projectsAPI.getAll({ limit: 5 }));
  const { data: tasks } = useQuery('dashboard-tasks', () => tasksAPI.getAll({ limit: 5 }));
  const { data: invoices } = useQuery('dashboard-invoices', () => invoicesAPI.getAll({ limit: 5 }));
  const { data: localeStats } = useQuery('dashboard-locale-stats', () => 
    reportsAPI.getLocaleStatus({ time_period: 'this_month' })
  );

  const getDashboardCards = () => {
    const baseCards = [
      {
        title: 'Active Projects',
        value: projects?.length || 0,
        icon: <Work />,
        color: 'primary',
        trend: '+12%',
      },
      {
        title: 'Pending Tasks',
        value: tasks?.filter(t => t.status === 'pending').length || 0,
        icon: <Assignment />,
        color: 'warning',
        trend: '-5%',
      },
      {
        title: 'Completed Tasks',
        value: tasks?.filter(t => t.status === 'completed').length || 0,
        icon: <CheckCircle />,
        color: 'success',
        trend: '+18%',
      },
    ];

    if (user?.role === UserRole.FINANCE || user?.role === UserRole.ADMIN) {
      baseCards.push({
        title: 'Monthly Spending',
        value: '$12,450',
        icon: <AttachMoney />,
        color: 'info',
        trend: '+8%',
      });
    }

    return baseCards;
  };

  const getRecentActivity = () => {
    const activities = [];
    
    if (projects) {
      activities.push(...projects.slice(0, 3).map(project => ({
        title: `Project: ${project.name}`,
        subtitle: `Status: ${project.status}`,
        time: new Date(project.created_at).toLocaleDateString(),
        icon: <Work />,
        color: project.status === 'active' ? 'success' : 'default',
      })));
    }

    if (tasks) {
      activities.push(...tasks.slice(0, 2).map(task => ({
        title: `Task: ${task.locale} translation`,
        subtitle: `Status: ${task.status}`,
        time: new Date(task.created_at).toLocaleDateString(),
        icon: <Assignment />,
        color: task.status === 'completed' ? 'success' : 'warning',
      })));
    }

    return activities.slice(0, 5);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user?.full_name}! Here's what's happening with your localization projects.
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {getDashboardCards().map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {card.value}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUp color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                        {card.trend}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: `${card.color}.light`,
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Recent Activity</Typography>
              <IconButton size="small">
                <ArrowForward />
              </IconButton>
            </Box>
            <List>
              {getRecentActivity().map((activity, index) => (
                <ListItem key={index} divider={index < getRecentActivity().length - 1}>
                  <ListItemIcon>{activity.icon}</ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{activity.subtitle}</span>
                        <Chip
                          label={activity.color === 'success' ? 'Active' : 'Pending'}
                          size="small"
                          color={activity.color as any}
                        />
                        <span>• {activity.time}</span>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Locale Progress */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Locale Progress
            </Typography>
            {localeStats?.locale_stats?.slice(0, 5).map((locale: any, index: number) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">{locale.locale}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {Math.round(locale.completion_percentage)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={locale.completion_percentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color="textSecondary">
                    {locale.translated_strings} / {locale.total_strings} strings
                  </Typography>
                  {locale.warnings > 0 && (
                    <Box display="flex" alignItems="center">
                      <Warning color="warning" fontSize="small" />
                      <Typography variant="caption" color="warning.main" sx={{ ml: 0.5 }}>
                        {locale.warnings} warnings
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Quick Actions - Role Based */}
        {user?.role === UserRole.PRODUCT && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Work color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2">New Project</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Assignment color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2">Assign Task</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {user?.role === UserRole.TRANSLATOR && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                My Tasks
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">In Progress</Typography>
                  <Chip label="3" size="small" color="warning" />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Pending Review</Typography>
                  <Chip label="1" size="small" color="info" />
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Completed</Typography>
                  <Chip label="12" size="small" color="success" />
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {(user?.role === UserRole.FINANCE || user?.role === UserRole.ADMIN) && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Financial Overview
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Pending Invoices</Typography>
                  <Typography variant="body2" color="warning.main">$5,240</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">This Month Spending</Typography>
                  <Typography variant="body2" color="primary.main">$12,450</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Cost Savings (TM/AI)</Typography>
                  <Typography variant="body2" color="success.main">$3,120</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;