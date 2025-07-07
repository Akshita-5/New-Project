import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tasks');
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
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, ...taskData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const toggleTaskComplete = createAsyncThunk(
  'tasks/toggleTaskComplete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const task = getState().tasks.items.find(t => t._id === id);
      const response = await api.put(`/tasks/${id}`, {
        completed: !task.completed
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle task');
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    category: 'all',
    priority: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  selectedTask: null,
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        search: '',
        category: 'all',
        priority: 'all',
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    },
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    clearError: (state) => {
      state.error = null;
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
        state.items = action.payload.tasks || action.payload;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload.task || action.payload);
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.items.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter(task => task._id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Toggle task complete
      .addCase(toggleTaskComplete.fulfilled, (state, action) => {
        const index = state.items.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleTaskComplete.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setFilters, resetFilters, setSelectedTask, clearError } = taskSlice.actions;

// Selectors
export const selectTasks = (state) => state.tasks.items;
export const selectTaskLoading = (state) => state.tasks.loading;
export const selectTaskError = (state) => state.tasks.error;
export const selectTaskFilters = (state) => state.tasks.filters;
export const selectSelectedTask = (state) => state.tasks.selectedTask;
export const selectCurrentTask = (state) => {
  if (state.tasks.selectedTask) {
    return state.tasks.items.find(task => task._id === state.tasks.selectedTask);
  }
  return null;
};

// Filtered tasks selector
export const selectFilteredTasks = (state) => {
  const { items, filters } = state.tasks;
  let filtered = [...items];

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower)
    );
  }

  // Apply category filter
  if (filters.category !== 'all') {
    filtered = filtered.filter(task => task.category === filters.category);
  }

  // Apply priority filter
  if (filters.priority !== 'all') {
    filtered = filtered.filter(task => task.priority === filters.priority);
  }

  // Apply status filter
  if (filters.status !== 'all') {
    if (filters.status === 'completed') {
      filtered = filtered.filter(task => task.completed);
    } else if (filters.status === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filters.status === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < now
      );
    }
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let aValue = a[filters.sortBy];
    let bValue = b[filters.sortBy];

    if (filters.sortBy === 'priority') {
      const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
      aValue = priorityOrder[a.priority] || 0;
      bValue = priorityOrder[b.priority] || 0;
    } else if (filters.sortBy === 'dueDate') {
      aValue = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
      bValue = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
    } else if (filters.sortBy === 'createdAt') {
      aValue = new Date(a.createdAt || a.created_at || 0);
      bValue = new Date(b.createdAt || b.created_at || 0);
    }

    if (filters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return filtered;
};

export default taskSlice.reducer;