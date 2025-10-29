import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  AvatarGroup
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  Visibility,
  Edit,
  People,
  Assignment,
  TrendingUp
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../services/queries'
import { useAuthStore } from '../../stores/authStore'

const ProjectCard = ({ project, onView, onEdit, canEdit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'INACTIVE': return 'warning'
      case 'ARCHIVED': return 'default'
      default: return 'default'
    }
  }

  const calculateProgress = () => {
    const totalTasks = project._count?.translationTasks || 0
    if (totalTasks === 0) return 0
    
    // This would need to be calculated from actual task data
    // For demo purposes, using a random percentage
    return Math.floor(Math.random() * 100)
  }

  const progress = calculateProgress()

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" fontWeight={600}>
            {project.name}
          </Typography>
          <Chip
            label={project.status}
            color={getStatusColor(project.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {project.description || 'No description provided'}
        </Typography>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Translation Progress
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {project.locales?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Locales
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {project._count?.translationTasks || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tasks
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Translators */}
        {project.locales && project.locales.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Translators
            </Typography>
            <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
              {project.locales
                .filter(locale => locale.translator)
                .map((locale, index) => (
                  <Tooltip key={index} title={locale.translator.user.name}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                      {locale.translator.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
            </AvatarGroup>
          </Box>
        )}

        {/* Created by */}
        <Typography variant="caption" color="text.secondary">
          Created by {project.createdBy?.name} • {new Date(project.createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>

      {/* Actions */}
      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(project.id)}
          fullWidth
        >
          View Details
        </Button>
        {canEdit && (
          <Tooltip title="Edit Project">
            <IconButton
              size="small"
              onClick={() => onEdit(project.id)}
              color="primary"
            >
              <Edit />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  )
}

const Projects = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 12
  })

  const { data, isLoading, error } = useProjects(filters)
  const canManageProjects = ['ADMIN', 'PRODUCT_TEAM'].includes(user?.role)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const handleEditProject = (projectId) => {
    navigate(`/projects/${projectId}?edit=true`)
  }

  const handleCreateProject = () => {
    navigate('/projects/new')
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            Projects
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your localization projects and track their progress
          </Typography>
        </Box>
        
        {canManageProjects && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateProject}
            size="large"
          >
            New Project
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                size="small"
              >
                More Filters
              </Button>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {data?.pagination?.total || 0} projects
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      ) : error ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Failed to load projects
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please try again later
            </Typography>
          </CardContent>
        </Card>
      ) : data?.projects?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {filters.search || filters.status 
                ? 'Try adjusting your filters to see more results'
                : 'Get started by creating your first localization project'
              }
            </Typography>
            {canManageProjects && !filters.search && !filters.status && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateProject}
              >
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {data.projects.map((project) => (
            <Grid item xs={12} sm={6} lg={4} key={project.id}>
              <ProjectCard
                project={project}
                onView={handleViewProject}
                onEdit={handleEditProject}
                canEdit={canManageProjects}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination would go here */}
      {data?.pagination && data.pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {data.pagination.page} of {data.pagination.pages} pages
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default Projects