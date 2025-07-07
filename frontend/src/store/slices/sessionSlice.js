import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const createSession = createAsyncThunk(
  'sessions/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/sessions', sessionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create session');
    }
  }
);

export const startSession = createAsyncThunk(
  'sessions/startSession',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/sessions/${id}/start`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start session');
    }
  }
);

export const pauseSession = createAsyncThunk(
  'sessions/pauseSession',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/sessions/${id}/pause`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pause session');
    }
  }
);

export const completeSession = createAsyncThunk(
  'sessions/completeSession',
  async ({ id, sessionData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/sessions/${id}/complete`, sessionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete session');
    }
  }
);

const initialState = {
  currentTimer: {
    type: 'pomodoro',
    duration: 1500, // 25 minutes in seconds
    timeRemaining: 1500,
    isRunning: false,
    isPaused: false,
    progress: 0,
    formattedTime: '25:00',
  },
  activeSession: null,
  sessions: [],
  loading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    startTimer: (state) => {
      state.currentTimer.isRunning = true;
      state.currentTimer.isPaused = false;
    },
    pauseTimer: (state) => {
      state.currentTimer.isRunning = false;
      state.currentTimer.isPaused = true;
    },
    resetTimer: (state) => {
      state.currentTimer.isRunning = false;
      state.currentTimer.isPaused = false;
      state.currentTimer.timeRemaining = state.currentTimer.duration;
      state.currentTimer.progress = 0;
      state.currentTimer.formattedTime = formatTime(state.currentTimer.duration);
      state.activeSession = null;
    },
    tickTimer: (state) => {
      if (state.currentTimer.isRunning && state.currentTimer.timeRemaining > 0) {
        state.currentTimer.timeRemaining -= 1;
        state.currentTimer.progress = 
          ((state.currentTimer.duration - state.currentTimer.timeRemaining) / state.currentTimer.duration) * 100;
        state.currentTimer.formattedTime = formatTime(state.currentTimer.timeRemaining);
        
        // Auto-complete when timer reaches 0
        if (state.currentTimer.timeRemaining === 0) {
          state.currentTimer.isRunning = false;
          state.currentTimer.isPaused = false;
        }
      }
    },
    setQuickSession: (state, action) => {
      const { type, duration } = action.payload;
      state.currentTimer.type = type;
      state.currentTimer.duration = duration;
      state.currentTimer.timeRemaining = duration;
      state.currentTimer.progress = 0;
      state.currentTimer.formattedTime = formatTime(duration);
      state.currentTimer.isRunning = false;
      state.currentTimer.isPaused = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload.session || action.payload;
        state.error = null;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Start session
      .addCase(startSession.fulfilled, (state, action) => {
        state.activeSession = action.payload.session || action.payload;
      })
      .addCase(startSession.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Pause session
      .addCase(pauseSession.fulfilled, (state, action) => {
        state.activeSession = action.payload.session || action.payload;
      })
      .addCase(pauseSession.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Complete session
      .addCase(completeSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload.session || action.payload);
        state.activeSession = null;
        state.currentTimer.isRunning = false;
        state.currentTimer.isPaused = false;
      })
      .addCase(completeSession.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Helper function to format time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const {
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
  setQuickSession,
  clearError,
} = sessionSlice.actions;

// Selectors
export const selectCurrentTimer = (state) => state.sessions.currentTimer;
export const selectActiveSession = (state) => state.sessions.activeSession;
export const selectSessions = (state) => state.sessions.sessions;
export const selectSessionLoading = (state) => state.sessions.loading;
export const selectSessionError = (state) => state.sessions.error;

export default sessionSlice.reducer;