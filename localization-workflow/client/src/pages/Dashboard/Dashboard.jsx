import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp,
  Assignment,
  Receipt,
  People,
  Folder,
  AttachMoney,
  Schedule,
  CheckCircle,
  Warning,
  Refresh,
  Analytics
} from '@mui/icons-material'
import { useDashboardStats } from '../../services/queries'
import { useAuthStore } from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'

// Stat Card Component
const StatCard = ({ title, value, icon, color = 'primary', subtitle, trend, onClick }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: 4
      } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight={600}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              <Typography variant="caption" color="success.main">
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.main`,
            color: 'white',
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

// Progress Card Component
const ProgressCard = ({ title, current, total, color = 'primary' }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" fontWeight={600}>
            {current}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>
            / {total}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          color={color}
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          {percentage}% Complete
        </Typography>
      </CardContent>
    </Card>
  )
}

const Dashboard = () => {
  const [period, setPeriod] = useState('month')
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const { data: stats, isLoading, error, refetch } = useDashboardStats(period)

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value)
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    let greeting = 'Good morning'
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
    else if (hour >= 17) greeting = 'Good evening'
    
    return `${greeting}, ${user?.name}!`
  }

  const getRoleSpecificStats = () => {
    if (!stats) return []

    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            title: 'Active Projects',
            value: stats.stats.activeProjects,
            icon: <Folder />,
            color: 'primary',
            onClick: () => navigate('/projects')
          },
          {
            title: 'Total Tasks',
            value: stats.stats.totalTasks,
            icon: <Assignment />,
            color: 'info',
            onClick: () => navigate('/tasks')
          },
          {
            title: 'Total Translators',
            value: stats.stats.totalTranslators,
            icon: <People />,
            color: 'success',
            onClick: () => navigate('/users')
          },
          {
            title: 'Total Spending',
            value: `$${stats.stats.totalSpending?.toLocaleString() || 0}`,
            icon: <AttachMoney />,
            color: 'warning',
            subtitle: `This ${period}`,
            onClick: () => navigate('/reports')
          }
        ]

      case 'PRODUCT_TEAM':
        return [
          {
            title: 'Active Projects',
            value: stats.stats.activeProjects,
            icon: <Folder />,
            color: 'primary',
            onClick: () => navigate('/projects')
          },
          {
            title: 'Pending Tasks',
            value: stats.stats.tasksByStatus?.PENDING || 0,
            icon: <Schedule />,
            color: 'warning',
            onClick: () => navigate('/tasks?status=PENDING')
          },
          {
            title: 'Completed Tasks',
            value: stats.stats.tasksByStatus?.COMPLETED || 0,
            icon: <CheckCircle />,
            color: 'success',
            onClick: () => navigate('/tasks?status=COMPLETED')
          },
          {
            title: 'Translation Cost',
            value: `$${stats.stats.totalSpending?.toLocaleString() || 0}`,
            icon: <AttachMoney />,
            color: 'info',
            subtitle: `This ${period}`
          }
        ]

      case 'FINANCE_TEAM':
        return [
          {
            title: 'Recent Invoices',
            value: stats.stats.recentInvoices,
            icon: <Receipt />,
            color: 'primary',
            subtitle: `This ${period}`,
            onClick: () => navigate('/invoices')
          },
          {
            title: 'Total Spending',
            value: `$${stats.stats.totalSpending?.toLocaleString() || 0}`,
            icon: <AttachMoney />,
            color: 'success',
            subtitle: `This ${period}`
          },
          {
            title: 'Active Translators',
            value: stats.stats.totalTranslators,
            icon: <People />,
            color: 'info'
          },
          {
            title: 'Active Projects',
            value: stats.stats.activeProjects,
            icon: <Folder />,
            color: 'warning'
          }
        ]

      case 'TRANSLATOR':
        return [
          {
            title: 'My Tasks',
            value: stats.stats.myTasks || 0,
            icon: <Assignment />,
            color: 'primary',
            onClick: () => navigate('/tasks')
          },
          {
            title: 'Completed Tasks',
            value: stats.stats.completedTasks || 0,
            icon: <CheckCircle />,
            color: 'success',
            onClick: () => navigate('/tasks?status=COMPLETED')
          },
          {
            title: 'Total Earnings',
            value: `$${stats.stats.totalEarnings?.toLocaleString() || 0}`,
            icon: <AttachMoney />,
            color: 'info',
            onClick: () => navigate('/invoices')
          },
          {
            title: 'Active Projects',
            value: stats.stats.activeProjects,
            icon: <Folder />,
            color: 'warning',
            onClick: () => navigate('/projects')
          }
        ]

      default:
        return []
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load dashboard data. Please try again.
        <Button onClick={() => refetch()} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    )
  }

  const roleStats = getRoleSpecificStats()

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            {getWelcomeMessage()}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your localization projects
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={handlePeriodChange}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetch()}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {roleStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Task Status Overview */}
      {stats?.stats?.tasksByStatus && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Task Status Overview
                  </Typography>
                  <Button
                    startIcon={<Analytics />}
                    onClick={() => navigate('/reports')}
                    size="small"
                  >
                    View Reports
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  {Object.entries(stats.stats.tasksByStatus).map(([status, count]) => {
                    const getStatusColor = (status) => {
                      switch (status) {
                        case 'PENDING': return 'warning'
                        case 'IN_PROGRESS': return 'info'
                        case 'COMPLETED': return 'success'
                        case 'REVIEW_REQUIRED': return 'secondary'
                        case 'APPROVED': return 'primary'
                        case 'REJECTED': return 'error'
                        default: return 'default'
                      }
                    }

                    const getStatusIcon = (status) => {
                      switch (status) {
                        case 'PENDING': return <Schedule />
                        case 'IN_PROGRESS': return <Assignment />
                        case 'COMPLETED': return <CheckCircle />
                        case 'REVIEW_REQUIRED': return <Warning />
                        default: return <Assignment />
                      }
                    }

                    return (
                      <Grid item xs={6} sm={4} md={3} key={status}>
                        <Box
                          sx={{
                            p: 2,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              transform: 'translateY(-2px)',
                            },
                          }}
                          onClick={() => navigate(`/tasks?status=${status}`)}
                        >
                          <Box sx={{ color: `${getStatusColor(status)}.main`, mb: 1 }}>
                            {getStatusIcon(status)}
                          </Box>
                          <Typography variant="h6" fontWeight={600}>
                            {count}
                          </Typography>
                          <Chip
                            label={status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(status)}
                            variant="outlined"
                          />
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Quick Actions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {user?.role === 'TRANSLATOR' && (
                    <>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assignment />}
                        onClick={() => navigate('/tasks?assigneeId=' + user.id)}
                      >
                        View My Tasks
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Receipt />}
                        onClick={() => navigate('/invoices')}
                      >
                        Create Invoice
                      </Button>
                    </>
                  )}
                  
                  {['ADMIN', 'PRODUCT_TEAM'].includes(user?.role) && (
                    <>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Folder />}
                        onClick={() => navigate('/projects')}
                      >
                        Manage Projects
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assignment />}
                        onClick={() => navigate('/tasks')}
                      >
                        Create Task
                      </Button>
                    </>
                  )}
                  
                  {['ADMIN', 'FINANCE_TEAM'].includes(user?.role) && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Receipt />}
                      onClick={() => navigate('/invoices?status=SUBMITTED')}
                    >
                      Review Invoices
                    </Button>
                  )}
                  
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Analytics />}
                    onClick={() => navigate('/ai-assistant')}
                  >
                    AI Assistant
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default Dashboard