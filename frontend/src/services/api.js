import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    
    // Show error toast for non-auth errors
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  googleAuth: () => api.get('/auth/google'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// Task API endpoints
export const taskAPI = {
  getTasks: (params = {}) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  toggleComplete: (id) => api.patch(`/tasks/${id}/toggle`),
  reorderTasks: (taskIds) => api.patch('/tasks/reorder', { taskIds }),
  getTaskStats: () => api.get('/tasks/stats'),
  bulkUpdate: (updates) => api.patch('/tasks/bulk', updates),
  addSubtask: (taskId, subtaskData) => api.post(`/tasks/${taskId}/subtasks`, subtaskData),
  updateSubtask: (taskId, subtaskId, subtaskData) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, subtaskData),
  deleteSubtask: (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
};

// Focus Session API endpoints
export const sessionAPI = {
  getSessions: (params = {}) => api.get('/sessions', { params }),
  getSession: (id) => api.get(`/sessions/${id}`),
  createSession: (sessionData) => api.post('/sessions', sessionData),
  startSession: (id) => api.patch(`/sessions/${id}/start`),
  pauseSession: (id) => api.patch(`/sessions/${id}/pause`),
  resumeSession: (id) => api.patch(`/sessions/${id}/resume`),
  completeSession: (id, sessionData) => api.patch(`/sessions/${id}/complete`, sessionData),
  deleteSession: (id) => api.delete(`/sessions/${id}`),
  addDistraction: (id, distractionData) => api.post(`/sessions/${id}/distractions`, distractionData),
  getSessionStats: () => api.get('/sessions/stats'),
  getActiveSession: () => api.get('/sessions/active'),
};

// User API endpoints
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (userData) => api.put('/user/profile', userData),
  updateSettings: (settings) => api.put('/user/settings', settings),
  uploadAvatar: (formData) => api.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAccount: () => api.delete('/user/account'),
  updatePassword: (passwordData) => api.put('/user/password', passwordData),
  getPreferences: () => api.get('/user/preferences'),
  updatePreferences: (preferences) => api.put('/user/preferences', preferences),
  updateBlocklist: (blocklist) => api.put('/user/blocklist', blocklist),
};

// Analytics API endpoints
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCharts: (period = '7d') => api.get(`/analytics/charts?period=${period}`),
  getProductivityReport: (period = 'week') => api.get(`/analytics/report?period=${period}`),
  getTimeStats: () => api.get('/analytics/time-stats'),
  getCategoryStats: () => api.get('/analytics/category-stats'),
  getFocusInsights: () => api.get('/analytics/focus-insights'),
  exportReport: (format = 'pdf', period = 'month') => api.get(`/analytics/export?format=${format}&period=${period}`, {
    responseType: 'blob'
  }),
};

// AI API endpoints
export const aiAPI = {
  chat: (message, context = {}) => api.post('/ai/chat', { message, context }),
  getTaskSuggestions: () => api.get('/ai/suggest-tasks'),
  getProductivityAnalysis: () => api.get('/ai/productivity-analysis'),
  getDailySummary: () => api.get('/ai/daily-summary'),
  getMotivationalQuote: () => api.get('/ai/quote'),
  analyzeProductivity: (data) => api.post('/ai/analyze-productivity', data),
};

// Gamification API endpoints
export const gamificationAPI = {
  getBadges: () => api.get('/gamification/badges'),
  getUserBadges: () => api.get('/gamification/user-badges'),
  getLeaderboard: (type = 'xp') => api.get(`/gamification/leaderboard?type=${type}`),
  checkAchievements: () => api.post('/gamification/check-achievements'),
  getXPHistory: () => api.get('/gamification/xp-history'),
  getStreakInfo: () => api.get('/gamification/streak'),
  getLevelInfo: () => api.get('/gamification/level'),
};

// Utility functions
export const uploadFile = async (file, endpoint = '/upload') => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    throw error;
  }
};

export default api;