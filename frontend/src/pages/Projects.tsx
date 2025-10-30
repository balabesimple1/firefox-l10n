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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Language,
  AttachMoney,
  Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { projectsAPI } from '../services/api';
import { Project, ProjectStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Projects: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repository_url: '',
    target_locales: [] as string[],
    auto_approval_threshold: 1000,
  });

  const { data: projects, isLoading } = useQuery('projects', () => projectsAPI.getAll());

  const createProjectMutation = useMutation(projectsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      setOpenDialog(false);
      resetForm();
    },
  });

  const updateProjectMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => projectsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        setOpenDialog(false);
        resetForm();
      },
    }
  );

  const deleteProjectMutation = useMutation(projectsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      repository_url: '',
      target_locales: [],
      auto_approval_threshold: 1000,
    });
    setSelectedProject(null);
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        name: project.name,
        description: project.description || '',
        repository_url: project.repository_url || '',
        target_locales: project.target_locales,
        auto_approval_threshold: project.auto_approval_threshold,
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSubmit = () => {
    if (selectedProject) {
      updateProjectMutation.mutate({ id: selectedProject.id, data: formData });
    } else {
      createProjectMutation.mutate(formData);
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'success';
      case ProjectStatus.PAUSED:
        return 'warning';
      case ProjectStatus.COMPLETED:
        return 'info';
      default:
        return 'default';
    }
  };

  const commonLocales = [
    'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ru-RU'
  ];

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  const canCreateProject = user?.role === UserRole.ADMIN || user?.role === UserRole.PRODUCT;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projects</Typography>
        {canCreateProject && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            New Project
          </Button>
        )}
      </Box>

      {/* Project Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Projects
              </Typography>
              <Typography variant="h4">{projects?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Active Projects
              </Typography>
              <Typography variant="h4">
                {projects?.filter(p => p.status === ProjectStatus.ACTIVE).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Locales
              </Typography>
              <Typography variant="h4">
                {new Set(projects?.flatMap(p => p.target_locales)).size || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Completion Rate
              </Typography>
              <Typography variant="h4">85%</Typography>
              <LinearProgress variant="determinate" value={85} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Target Locales</TableCell>
              <TableCell>Auto Approval</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects?.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{project.name}</Typography>
                    {project.description && (
                      <Typography variant="caption" color="textSecondary">
                        {project.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {project.target_locales.slice(0, 3).map((locale) => (
                      <Chip key={locale} label={locale} size="small" variant="outlined" />
                    ))}
                    {project.target_locales.length > 3 && (
                      <Chip
                        label={`+${project.target_locales.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <AttachMoney fontSize="small" />
                    <Typography variant="body2">
                      ${project.auto_approval_threshold}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(project.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => {}}>
                    <Visibility />
                  </IconButton>
                  {canCreateProject && (
                    <>
                      <IconButton size="small" onClick={() => handleOpenDialog(project)}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteProjectMutation.mutate(project.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Project Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Repository URL"
                value={formData.repository_url}
                onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Target Locales</InputLabel>
                <Select
                  multiple
                  value={formData.target_locales}
                  onChange={(e) =>
                    setFormData({ ...formData, target_locales: e.target.value as string[] })
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {commonLocales.map((locale) => (
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
                label="Auto Approval Threshold ($)"
                type="number"
                value={formData.auto_approval_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, auto_approval_threshold: Number(e.target.value) })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects;