import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks for task operations
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await taskAPI.getTasks(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await taskAPI.createTask(taskData);
      toast.success('Task created successfully!');
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, ...taskData }, { rejectWithValue }) => {
    try {
      const response = await taskAPI.updateTask(id, taskData);
      toast.success('Task updated successfully!');
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await taskAPI.deleteTask(id);
      toast.success('Task deleted successfully!');
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const toggleTaskComplete = createAsyncThunk(
  'tasks/toggleComplete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await taskAPI.toggleComplete(id);
      return response.data.task;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const reorderTasks = createAsyncThunk(
  'tasks/reorderTasks',
  async (taskIds, { rejectWithValue }) => {
    try {
      await taskAPI.reorderTasks(taskIds);
      return taskIds;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reorder tasks');
    }
  }
);

export const fetchTaskStats = createAsyncThunk(
  'tasks/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await taskAPI.getTaskStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task stats');
    }
  }
);

export const addSubtask = createAsyncThunk(
  'tasks/addSubtask',
  async ({ taskId, subtaskData }, { rejectWithValue }) => {
    try {
      const response = await taskAPI.addSubtask(taskId, subtaskData);
      return { taskId, subtask: response.data.subtask };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add subtask');
    }
  }
);

// Initial state
const initialState = {
  tasks: [],
  filteredTasks: [],
  currentTask: null,
  stats: {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    todayCompleted: 0,
    weekCompleted: 0,
  },
  filters: {
    category: 'all',
    priority: 'all',
    status: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  loading: false,
  error: null,
  taskFormOpen: false,
  selectedTaskId: null,
};

// Helper functions
const applyFilters = (tasks, filters) => {
  let filtered = [...tasks];

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      task.description?.toLowerCase().includes(searchTerm) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Category filter
  if (filters.category !== 'all') {
    filtered = filtered.filter(task => task.category === filters.category);
  }

  // Priority filter
  if (filters.priority !== 'all') {
    filtered = filtered.filter(task => task.priority === filters.priority);
  }

  // Status filter
  if (filters.status !== 'all') {
    if (filters.status === 'completed') {
      filtered = filtered.filter(task => task.completed);
    } else if (filters.status === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filters.status === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(task => 
        !task.completed && task.dueDate && new Date(task.dueDate) < now
      );
    }
  }

  // Sorting
  filtered.sort((a, b) => {
    let aValue = a[filters.sortBy];
    let bValue = b[filters.sortBy];

    if (filters.sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      aValue = priorityOrder[a.priority] || 0;
      bValue = priorityOrder[b.priority] || 0;
    }

    if (filters.sortBy === 'dueDate') {
      aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
      bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
    }

    if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
};

// Task slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.filteredTasks = applyFilters(state.tasks, state.filters);
    },
    clearError: (state) => {
      state.error = null;
    },
    setTaskFormOpen: (state, action) => {
      state.taskFormOpen = action.payload;
    },
    setSelectedTask: (state, action) => {
      state.selectedTaskId = action.payload;
      state.currentTask = state.tasks.find(task => task._id === action.payload) || null;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
      state.selectedTaskId = null;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredTasks = applyFilters(state.tasks, state.filters);
    },
    updateTaskLocal: (state, action) => {
      const { id, updates } = action.payload;
      const taskIndex = state.tasks.findIndex(task => task._id === id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
        state.filteredTasks = applyFilters(state.tasks, state.filters);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks || [];
        state.stats = action.payload.stats || state.stats;
        state.filteredTasks = applyFilters(state.tasks, state.filters);
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
        state.filteredTasks = applyFilters(state.tasks, state.filters);
        state.taskFormOpen = false;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
          state.filteredTasks = applyFilters(state.tasks, state.filters);
        }
        if (state.currentTask && state.currentTask._id === action.payload._id) {
          state.currentTask = action.payload;
        }
      })

      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task._id !== action.payload);
        state.filteredTasks = applyFilters(state.tasks, state.filters);
        if (state.currentTask && state.currentTask._id === action.payload) {
          state.currentTask = null;
          state.selectedTaskId = null;
        }
      })

      // Toggle complete
      .addCase(toggleTaskComplete.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
          state.filteredTasks = applyFilters(state.tasks, state.filters);
        }
      })

      // Reorder tasks
      .addCase(reorderTasks.fulfilled, (state, action) => {
        const taskIds = action.payload;
        const reorderedTasks = [];
        
        taskIds.forEach(id => {
          const task = state.tasks.find(t => t._id === id);
          if (task) reorderedTasks.push(task);
        });
        
        // Add any tasks not in the reorder list
        state.tasks.forEach(task => {
          if (!taskIds.includes(task._id)) {
            reorderedTasks.push(task);
          }
        });
        
        state.tasks = reorderedTasks;
        state.filteredTasks = applyFilters(state.tasks, state.filters);
      })

      // Fetch stats
      .addCase(fetchTaskStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })

      // Add subtask
      .addCase(addSubtask.fulfilled, (state, action) => {
        const { taskId, subtask } = action.payload;
        const taskIndex = state.tasks.findIndex(task => task._id === taskId);
        if (taskIndex !== -1) {
          if (!state.tasks[taskIndex].subtasks) {
            state.tasks[taskIndex].subtasks = [];
          }
          state.tasks[taskIndex].subtasks.push(subtask);
          state.filteredTasks = applyFilters(state.tasks, state.filters);
        }
      });
  },
});

export const {
  setFilters,
  clearError,
  setTaskFormOpen,
  setSelectedTask,
  clearCurrentTask,
  resetFilters,
  updateTaskLocal,
} = taskSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.tasks;
export const selectFilteredTasks = (state) => state.tasks.filteredTasks;
export const selectCurrentTask = (state) => state.tasks.currentTask;
export const selectTaskStats = (state) => state.tasks.stats;
export const selectTaskFilters = (state) => state.tasks.filters;
export const selectTaskLoading = (state) => state.tasks.loading;
export const selectTaskError = (state) => state.tasks.error;
export const selectTaskFormOpen = (state) => state.tasks.taskFormOpen;
export const selectSelectedTaskId = (state) => state.tasks.selectedTaskId;

export default taskSlice.reducer;