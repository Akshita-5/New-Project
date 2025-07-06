import { createSlice } from '@reduxjs/toolkit';

// Helper functions for theme management
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

const applyTheme = (theme) => {
  document.documentElement.className = theme;
  localStorage.setItem('theme', theme);
};

// Initial state
const initialState = {
  // Theme management
  theme: getInitialTheme(),
  colorScheme: localStorage.getItem('colorScheme') || 'blue',
  
  // Layout controls
  sidebarOpen: false,
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  
  // Modal states
  modals: {
    taskForm: false,
    sessionForm: false,
    settings: false,
    profile: false,
    confirmDialog: false,
    aiChat: false,
    achievements: false,
  },
  
  // Loading states
  globalLoading: false,
  
  // Notifications
  notifications: [],
  
  // Page state
  currentPage: 'dashboard',
  pageTitle: 'Dashboard',
  
  // Mobile responsiveness
  isMobile: window.innerWidth < 768,
  screenSize: window.innerWidth,
  
  // Focus mode
  focusMode: false,
  
  // Animations
  animationsEnabled: localStorage.getItem('animationsEnabled') !== 'false',
  
  // Error handling
  globalError: null,
  
  // Confirm dialog state
  confirmDialog: {
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning', // success, warning, danger
  },
  
  // Toast notifications queue
  toastQueue: [],
  
  // Search global state
  globalSearch: {
    query: '',
    results: [],
    isSearching: false,
    showResults: false,
  },
};

// Apply initial theme
applyTheme(initialState.theme);

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action) => {
      state.theme = action.payload;
      applyTheme(action.payload);
    },
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      applyTheme(newTheme);
    },
    setColorScheme: (state, action) => {
      state.colorScheme = action.payload;
      localStorage.setItem('colorScheme', action.payload);
    },
    
    // Layout controls
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('sidebarCollapsed', action.payload);
    },
    
    // Modal management
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      state.modals[modalName] = true;
      if (data) {
        state[`${modalName}Data`] = data;
      }
    },
    closeModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = false;
      if (state[`${modalName}Data`]) {
        delete state[`${modalName}Data`];
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName] = false;
      });
    },
    
    // Loading states
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    // Notifications
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(notification);
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Page management
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload.page;
      state.pageTitle = action.payload.title || action.payload.page;
    },
    
    // Screen size management
    setScreenSize: (state, action) => {
      state.screenSize = action.payload;
      state.isMobile = action.payload < 768;
      
      // Auto-close sidebar on mobile
      if (state.isMobile && state.sidebarOpen) {
        state.sidebarOpen = false;
      }
    },
    
    // Focus mode
    setFocusMode: (state, action) => {
      state.focusMode = action.payload;
    },
    toggleFocusMode: (state) => {
      state.focusMode = !state.focusMode;
    },
    
    // Animations
    setAnimationsEnabled: (state, action) => {
      state.animationsEnabled = action.payload;
      localStorage.setItem('animationsEnabled', action.payload);
    },
    
    // Error handling
    setGlobalError: (state, action) => {
      state.globalError = action.payload;
    },
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Confirm dialog
    showConfirmDialog: (state, action) => {
      state.confirmDialog = {
        open: true,
        ...action.payload,
      };
    },
    hideConfirmDialog: (state) => {
      state.confirmDialog = {
        ...initialState.confirmDialog,
        open: false,
      };
    },
    
    // Toast queue management
    addToastToQueue: (state, action) => {
      state.toastQueue.push({
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...action.payload,
      });
    },
    removeToastFromQueue: (state, action) => {
      state.toastQueue = state.toastQueue.filter(toast => toast.id !== action.payload);
    },
    clearToastQueue: (state) => {
      state.toastQueue = [];
    },
    
    // Global search
    setGlobalSearchQuery: (state, action) => {
      state.globalSearch.query = action.payload;
    },
    setGlobalSearchResults: (state, action) => {
      state.globalSearch.results = action.payload;
    },
    setGlobalSearching: (state, action) => {
      state.globalSearch.isSearching = action.payload;
    },
    setGlobalSearchResultsVisible: (state, action) => {
      state.globalSearch.showResults = action.payload;
    },
    clearGlobalSearch: (state) => {
      state.globalSearch = {
        query: '',
        results: [],
        isSearching: false,
        showResults: false,
      };
    },
    
    // Bulk UI updates
    updateUI: (state, action) => {
      Object.keys(action.payload).forEach(key => {
        if (key in state) {
          state[key] = action.payload[key];
        }
      });
    },
    
    // Reset UI state
    resetUI: (state) => {
      Object.keys(initialState).forEach(key => {
        if (key !== 'theme' && key !== 'colorScheme' && key !== 'sidebarCollapsed' && key !== 'animationsEnabled') {
          state[key] = initialState[key];
        }
      });
    },
  },
});

export const {
  // Theme
  setTheme,
  toggleTheme,
  setColorScheme,
  
  // Layout
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  
  // Modals
  openModal,
  closeModal,
  closeAllModals,
  
  // Loading
  setGlobalLoading,
  
  // Notifications
  addNotification,
  markNotificationRead,
  removeNotification,
  clearNotifications,
  
  // Page
  setCurrentPage,
  
  // Screen
  setScreenSize,
  
  // Focus mode
  setFocusMode,
  toggleFocusMode,
  
  // Animations
  setAnimationsEnabled,
  
  // Error
  setGlobalError,
  clearGlobalError,
  
  // Confirm dialog
  showConfirmDialog,
  hideConfirmDialog,
  
  // Toast queue
  addToastToQueue,
  removeToastFromQueue,
  clearToastQueue,
  
  // Global search
  setGlobalSearchQuery,
  setGlobalSearchResults,
  setGlobalSearching,
  setGlobalSearchResultsVisible,
  clearGlobalSearch,
  
  // Bulk updates
  updateUI,
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectColorScheme = (state) => state.ui.colorScheme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectModals = (state) => state.ui.modals;
export const selectModal = (modalName) => (state) => state.ui.modals[modalName];
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadNotifications = (state) => state.ui.notifications.filter(n => !n.read);
export const selectCurrentPage = (state) => state.ui.currentPage;
export const selectPageTitle = (state) => state.ui.pageTitle;
export const selectIsMobile = (state) => state.ui.isMobile;
export const selectScreenSize = (state) => state.ui.screenSize;
export const selectFocusMode = (state) => state.ui.focusMode;
export const selectAnimationsEnabled = (state) => state.ui.animationsEnabled;
export const selectGlobalError = (state) => state.ui.globalError;
export const selectConfirmDialog = (state) => state.ui.confirmDialog;
export const selectToastQueue = (state) => state.ui.toastQueue;
export const selectGlobalSearch = (state) => state.ui.globalSearch;

export default uiSlice.reducer;