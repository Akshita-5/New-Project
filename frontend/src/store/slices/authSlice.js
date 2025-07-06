import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Helper function to get initial auth state from localStorage
const getInitialAuthState = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return {
    user: user ? JSON.parse(user) : null,
    token: token || null,
    isAuthenticated: !!token,
    loading: false,
    error: null,
    isInitialized: false,
  };
};

// Async thunks for auth actions
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Registration successful! Welcome to FocusMate!');
      return { user, token };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success(`Welcome back, ${user.name}!`);
      return { user, token };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast.success('Logged out successfully');
      return null;
    } catch (error) {
      // Even if API call fails, we should still clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }
      
      const response = await authAPI.getMe();
      const user = response.data.user;
      
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      await authAPI.forgotPassword(email);
      toast.success('Password reset email sent! Check your inbox.');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      return rejectWithValue(message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password reset successful! You can now login.');
      return true;
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      return rejectWithValue(message);
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyEmail(token);
      toast.success('Email verified successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      return rejectWithValue(message);
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      
      // Initialize auth cases
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Verify email cases
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateUser, setLoading } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsInitialized = (state) => state.auth.isInitialized;

export default authSlice.reducer;