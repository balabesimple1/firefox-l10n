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
  Grid,
  Card,
  CardContent,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Edit,
  Upload,
  Download,
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tasksAPI, projectsAPI, translatorsAPI } from '../services/api';
import { TranslationTask, TaskStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TranslationTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterLocale, setFilterLocale] = useState('');

  const { data: tasks, isLoading } = useQuery('tasks', () => tasksAPI.getAll());
  const { data: projects } = useQuery('projects', () => projectsAPI.getAll());
  const { data: translators } = useQuery('translators', () => translatorsAPI.getAll());

  const updateTaskMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => tasksAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        setOpenDialog(false);
      },
    }
  );

  const assignTranslatorMutation = useMutation(
    ({ taskId, translatorId }: { taskId: number; translatorId: number }) =>
      tasksAPI.assignTranslator(taskId, translatorId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
      },
    }
  );

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.REVIEW:
        return 'warning';
      case TaskStatus.APPROVED:
        return 'success';
      case TaskStatus.REJECTED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
      case TaskStatus.APPROVED:
        return <CheckCircle />;
      case TaskStatus.IN_PROGRESS:
        return <Schedule />;
      case TaskStatus.REVIEW:
      case TaskStatus.REJECTED:
        return <Warning />;
      default:
        return <Assignment />;
    }
  };

  const filteredTasks = tasks?.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterLocale && task.locale !== filterLocale) return false;
    return true;
  });

  const taskStats = {
    total: tasks?.length || 0,
    pending: tasks?.filter(t => t.status === TaskStatus.PENDING).length || 0,
    inProgress: tasks?.filter(t => t.status === TaskStatus.IN_PROGRESS).length || 0,
    completed: tasks?.filter(t => t.status === TaskStatus.COMPLETED).length || 0,
    review: tasks?.filter(t => t.status === TaskStatus.REVIEW).length || 0,
  };

  const uniqueLocales = [...new Set(tasks?.map(t => t.locale) || [])];

  const canManageTasks = user?.role === UserRole.ADMIN || user?.role === UserRole.PRODUCT;
  const isTranslator = user?.role === UserRole.TRANSLATOR;

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Translation Tasks</Typography>
        {canManageTasks && (
          <Button variant="contained" startIcon={<Add />}>
            New Task
          </Button>
        )}
      </Box>

      {/* Task Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Tasks
                  </Typography>
                  <Typography variant="h4">{taskStats.total}</Typography>
                </Box>
                <Assignment color="primary" sx={{ fontSize: 40 }} />
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
                    Pending
                  </Typography>
                  <Typography variant="h4">{taskStats.pending}</Typography>
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
                    In Progress
                  </Typography>
                  <Typography variant="h4">{taskStats.inProgress}</Typography>
                </Box>
                <Schedule color="info" sx={{ fontSize: 40 }} />
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
                    In Review
                  </Typography>
                  <Typography variant="h4">{taskStats.review}</Typography>
                </Box>
                <Warning color="warning" sx={{ fontSize: 40 }} />
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
                    Completed
                  </Typography>
                  <Typography variant="h4">{taskStats.completed}</Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
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
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus)}
                label="Filter by Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value={TaskStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.COMPLETED}>Completed</MenuItem>
                <MenuItem value={TaskStatus.REVIEW}>Review</MenuItem>
                <MenuItem value={TaskStatus.APPROVED}>Approved</MenuItem>
                <MenuItem value={TaskStatus.REJECTED}>Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Locale</InputLabel>
              <Select
                value={filterLocale}
                onChange={(e) => setFilterLocale(e.target.value)}
                label="Filter by Locale"
              >
                <MenuItem value="">All Locales</MenuItem>
                {uniqueLocales.map((locale) => (
                  <MenuItem key={locale} value={locale}>
                    {locale}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="outlined" onClick={() => {
              setFilterStatus('');
              setFilterLocale('');
            }}>
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Locale</TableCell>
              <TableCell>Translator</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks?.map((task) => {
              const project = projects?.find(p => p.id === task.project_id);
              const translator = translators?.find(t => t.id === task.translator_id);
              const progress = task.translation_stats 
                ? (task.translation_stats.translated / task.translation_stats.total) * 100 
                : 0;

              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(task.status)}
                      <Box>
                        <Typography variant="subtitle2">
                          Task #{task.id}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {task.word_count} words
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{project?.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={task.locale} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {translator?.user.full_name || 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status.replace('_', ' ')}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      ${task.actual_cost || task.estimated_cost}
                    </Typography>
                    {task.tm_savings > 0 && (
                      <Typography variant="caption" color="success.main" display="block">
                        -${task.tm_savings} saved
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.deadline && (
                      <Typography variant="body2">
                        {new Date(task.deadline).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <Download />
                    </IconButton>
                    {(isTranslator && translator?.user.id === user?.id) && (
                      <IconButton size="small">
                        <Upload />
                      </IconButton>
                    )}
                    {canManageTasks && (
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Tasks;