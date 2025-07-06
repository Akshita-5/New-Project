import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sessionAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks for session operations
export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.getSessions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sessions');
    }
  }
);

export const fetchActiveSession = createAsyncThunk(
  'sessions/fetchActiveSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.getActiveSession();
      return response.data.session;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No active session
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active session');
    }
  }
);

export const createSession = createAsyncThunk(
  'sessions/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.createSession(sessionData);
      return response.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create session');
    }
  }
);

export const startSession = createAsyncThunk(
  'sessions/startSession',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.startSession(id);
      toast.success('Focus session started! 🎯');
      return response.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start session');
    }
  }
);

export const pauseSession = createAsyncThunk(
  'sessions/pauseSession',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.pauseSession(id);
      return response.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pause session');
    }
  }
);

export const resumeSession = createAsyncThunk(
  'sessions/resumeSession',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.resumeSession(id);
      return response.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resume session');
    }
  }
);

export const completeSession = createAsyncThunk(
  'sessions/completeSession',
  async ({ id, sessionData }, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.completeSession(id, sessionData);
      toast.success('Great job! Session completed! 🎉');
      return response.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete session');
    }
  }
);

export const addDistraction = createAsyncThunk(
  'sessions/addDistraction',
  async ({ id, distractionData }, { rejectWithValue }) => {
    try {
      const response = await sessionAPI.addDistraction(id, distractionData);
      return { sessionId: id, distraction: response.data.distraction };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to log distraction');
    }
  }
);

// Timer utility functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const calculateProgress = (elapsed, duration) => {
  return Math.min((elapsed / duration) * 100, 100);
};

// Initial state
const initialState = {
  sessions: [],
  activeSession: null,
  currentTimer: {
    isRunning: false,
    isPaused: false,
    timeRemaining: 0,
    duration: 1500, // 25 minutes default
    type: 'pomodoro',
    progress: 0,
    formattedTime: '25:00',
  },
  sessionSettings: {
    pomodoroMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4,
  },
  stats: {
    totalSessions: 0,
    totalFocusTime: 0,
    averageSessionLength: 0,
    todaySessions: 0,
    weekSessions: 0,
    distractions: 0,
  },
  loading: false,
  error: null,
  timerInterval: null,
  sessionFormOpen: false,
  breakModalOpen: false,
};

// Session slice
const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    // Timer controls
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
    },
    tickTimer: (state) => {
      if (state.currentTimer.isRunning && state.currentTimer.timeRemaining > 0) {
        state.currentTimer.timeRemaining -= 1;
        state.currentTimer.progress = calculateProgress(
          state.currentTimer.duration - state.currentTimer.timeRemaining,
          state.currentTimer.duration
        );
        state.currentTimer.formattedTime = formatTime(state.currentTimer.timeRemaining);
        
        // Timer completed
        if (state.currentTimer.timeRemaining === 0) {
          state.currentTimer.isRunning = false;
          state.breakModalOpen = true;
        }
      }
    },
    setTimerDuration: (state, action) => {
      const { duration, type } = action.payload;
      state.currentTimer.duration = duration;
      state.currentTimer.type = type;
      state.currentTimer.timeRemaining = duration;
      state.currentTimer.progress = 0;
      state.currentTimer.formattedTime = formatTime(duration);
      state.currentTimer.isRunning = false;
      state.currentTimer.isPaused = false;
    },
    
    // Settings
    updateSessionSettings: (state, action) => {
      state.sessionSettings = { ...state.sessionSettings, ...action.payload };
    },
    
    // UI controls
    setSessionFormOpen: (state, action) => {
      state.sessionFormOpen = action.payload;
    },
    setBreakModalOpen: (state, action) => {
      state.breakModalOpen = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Session management
    updateActiveSession: (state, action) => {
      if (state.activeSession) {
        state.activeSession = { ...state.activeSession, ...action.payload };
      }
    },
    clearActiveSession: (state) => {
      state.activeSession = null;
      state.currentTimer.isRunning = false;
      state.currentTimer.isPaused = false;
    },
    
    // Quick session presets
    setQuickSession: (state, action) => {
      const { type } = action.payload;
      const settings = state.sessionSettings;
      
      let duration;
      switch (type) {
        case 'pomodoro':
          duration = settings.pomodoroMinutes * 60;
          break;
        case 'short-break':
          duration = settings.shortBreakMinutes * 60;
          break;
        case 'long-break':
          duration = settings.longBreakMinutes * 60;
          break;
        case 'custom':
          duration = action.payload.duration || 1500;
          break;
        default:
          duration = 1500;
      }
      
      state.currentTimer = {
        ...state.currentTimer,
        duration,
        timeRemaining: duration,
        type,
        progress: 0,
        formattedTime: formatTime(duration),
        isRunning: false,
        isPaused: false,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload.sessions || [];
        state.stats = action.payload.stats || state.stats;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch active session
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        if (action.payload) {
          // Sync timer with active session
          const session = action.payload;
          const elapsed = session.timeElapsed || 0;
          const duration = session.duration || 1500;
          
          state.currentTimer = {
            ...state.currentTimer,
            duration,
            timeRemaining: Math.max(0, duration - elapsed),
            type: session.type,
            progress: calculateProgress(elapsed, duration),
            formattedTime: formatTime(Math.max(0, duration - elapsed)),
            isRunning: session.status === 'active',
            isPaused: session.status === 'paused',
          };
        }
      })
      
      // Create session
      .addCase(createSession.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.sessionFormOpen = false;
      })
      
      // Start session
      .addCase(startSession.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.currentTimer.isRunning = true;
        state.currentTimer.isPaused = false;
      })
      
      // Pause session
      .addCase(pauseSession.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.currentTimer.isRunning = false;
        state.currentTimer.isPaused = true;
      })
      
      // Resume session
      .addCase(resumeSession.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.currentTimer.isRunning = true;
        state.currentTimer.isPaused = false;
      })
      
      // Complete session
      .addCase(completeSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.activeSession = null;
        state.currentTimer = {
          ...initialState.currentTimer,
          duration: state.currentTimer.duration,
          timeRemaining: state.currentTimer.duration,
          formattedTime: formatTime(state.currentTimer.duration),
        };
        state.breakModalOpen = false;
      })
      
      // Add distraction
      .addCase(addDistraction.fulfilled, (state, action) => {
        const { sessionId, distraction } = action.payload;
        if (state.activeSession && state.activeSession._id === sessionId) {
          if (!state.activeSession.distractions) {
            state.activeSession.distractions = [];
          }
          state.activeSession.distractions.push(distraction);
        }
      });
  },
});

export const {
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
  setTimerDuration,
  updateSessionSettings,
  setSessionFormOpen,
  setBreakModalOpen,
  clearError,
  updateActiveSession,
  clearActiveSession,
  setQuickSession,
} = sessionSlice.actions;

// Selectors
export const selectSessions = (state) => state.sessions.sessions;
export const selectActiveSession = (state) => state.sessions.activeSession;
export const selectCurrentTimer = (state) => state.sessions.currentTimer;
export const selectSessionSettings = (state) => state.sessions.sessionSettings;
export const selectSessionStats = (state) => state.sessions.stats;
export const selectSessionLoading = (state) => state.sessions.loading;
export const selectSessionError = (state) => state.sessions.error;
export const selectSessionFormOpen = (state) => state.sessions.sessionFormOpen;
export const selectBreakModalOpen = (state) => state.sessions.breakModalOpen;

export default sessionSlice.reducer;