import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gamificationAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks for gamification operations
export const fetchUserBadges = createAsyncThunk(
  'gamification/fetchUserBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getUserBadges();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch badges');
    }
  }
);

export const fetchAvailableBadges = createAsyncThunk(
  'gamification/fetchAvailableBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getBadges();
      return response.data.badges;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch available badges');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'gamification/fetchLeaderboard',
  async (type = 'xp', { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getLeaderboard(type);
      return { type, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }
);

export const checkAchievements = createAsyncThunk(
  'gamification/checkAchievements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.checkAchievements();
      const newAchievements = response.data.newAchievements || [];
      
      // Show toast for new achievements
      if (newAchievements.length > 0) {
        newAchievements.forEach(achievement => {
          toast.success(`🎉 Achievement Unlocked: ${achievement.name}!`, {
            duration: 5000,
          });
        });
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check achievements');
    }
  }
);

export const fetchXPHistory = createAsyncThunk(
  'gamification/fetchXPHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getXPHistory();
      return response.data.history;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch XP history');
    }
  }
);

export const fetchStreakInfo = createAsyncThunk(
  'gamification/fetchStreakInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getStreakInfo();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch streak info');
    }
  }
);

export const fetchLevelInfo = createAsyncThunk(
  'gamification/fetchLevelInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationAPI.getLevelInfo();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch level info');
    }
  }
);

// Helper functions
const calculateLevelProgress = (currentXP, currentLevel) => {
  const baseXP = 100;
  const currentLevelXP = baseXP * Math.pow(1.5, currentLevel - 1);
  const nextLevelXP = baseXP * Math.pow(1.5, currentLevel);
  const progressXP = currentXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  
  return {
    current: Math.max(0, progressXP),
    required: requiredXP,
    percentage: Math.min(100, (progressXP / requiredXP) * 100),
  };
};

const getBadgesByCategory = (badges) => {
  const categories = {
    milestone: [],
    streak: [],
    focus: [],
    level: [],
    achievement: [],
    special: [],
  };
  
  badges.forEach(badge => {
    const category = badge.category || 'achievement';
    if (categories[category]) {
      categories[category].push(badge);
    }
  });
  
  return categories;
};

// Initial state
const initialState = {
  // User progress
  userLevel: 1,
  userXP: 0,
  totalXP: 0,
  levelProgress: {
    current: 0,
    required: 100,
    percentage: 0,
  },
  
  // Badges and achievements
  userBadges: [],
  availableBadges: [],
  badgesByCategory: {
    milestone: [],
    streak: [],
    focus: [],
    level: [],
    achievement: [],
    special: [],
  },
  recentAchievements: [],
  
  // Streaks
  currentStreak: 0,
  longestStreak: 0,
  streakHistory: [],
  
  // Leaderboards
  leaderboards: {
    xp: [],
    level: [],
    streak: [],
    focus: [],
  },
  userRankings: {
    xp: null,
    level: null,
    streak: null,
    focus: null,
  },
  
  // XP History
  xpHistory: [],
  
  // UI state
  showLevelUpModal: false,
  showAchievementModal: false,
  selectedAchievement: null,
  
  // Loading states
  loading: false,
  leaderboardLoading: false,
  achievementsLoading: false,
  
  // Error handling
  error: null,
  
  // Stats
  stats: {
    totalTasksCompleted: 0,
    totalFocusTime: 0,
    totalSessions: 0,
    averageProductivity: 0,
    badgesEarned: 0,
    rank: null,
  },
};

const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
    // XP and Level management
    addXP: (state, action) => {
      const { amount, source } = action.payload;
      const oldLevel = state.userLevel;
      
      state.userXP += amount;
      state.totalXP += amount;
      
      // Calculate new level
      const baseXP = 100;
      let newLevel = 1;
      let totalRequired = 0;
      
      while (totalRequired <= state.userXP) {
        totalRequired += baseXP * Math.pow(1.5, newLevel - 1);
        if (totalRequired <= state.userXP) {
          newLevel++;
        }
      }
      
      state.userLevel = newLevel;
      state.levelProgress = calculateLevelProgress(state.userXP, state.userLevel);
      
      // Check for level up
      if (newLevel > oldLevel) {
        state.showLevelUpModal = true;
        toast.success(`🎉 Level Up! You're now level ${newLevel}!`, {
          duration: 5000,
        });
      }
      
      // Add to XP history
      state.xpHistory.unshift({
        amount,
        source,
        timestamp: new Date().toISOString(),
        totalXP: state.userXP,
        level: state.userLevel,
      });
      
      // Keep only last 50 entries
      if (state.xpHistory.length > 50) {
        state.xpHistory = state.xpHistory.slice(0, 50);
      }
    },
    
    // Badge management
    awardBadge: (state, action) => {
      const badge = action.payload;
      const existingBadge = state.userBadges.find(b => b.id === badge.id);
      
      if (!existingBadge) {
        state.userBadges.push({
          ...badge,
          earnedAt: new Date().toISOString(),
        });
        
        state.recentAchievements.unshift(badge);
        state.selectedAchievement = badge;
        state.showAchievementModal = true;
        
        // Update badge categories
        state.badgesByCategory = getBadgesByCategory(state.userBadges);
        
        // Keep only last 10 recent achievements
        if (state.recentAchievements.length > 10) {
          state.recentAchievements = state.recentAchievements.slice(0, 10);
        }
      }
    },
    
    // Streak management
    updateStreak: (state, action) => {
      const { current, longest } = action.payload;
      state.currentStreak = current;
      state.longestStreak = Math.max(state.longestStreak, longest);
    },
    
    incrementStreak: (state) => {
      state.currentStreak += 1;
      state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    },
    
    resetStreak: (state) => {
      state.currentStreak = 0;
    },
    
    // UI controls
    setShowLevelUpModal: (state, action) => {
      state.showLevelUpModal = action.payload;
    },
    
    setShowAchievementModal: (state, action) => {
      state.showAchievementModal = action.payload;
    },
    
    setSelectedAchievement: (state, action) => {
      state.selectedAchievement = action.payload;
    },
    
    clearRecentAchievements: (state) => {
      state.recentAchievements = [];
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    
    // Stats updates
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    
    // Bulk updates
    updateGamificationData: (state, action) => {
      const { userLevel, userXP, totalXP, currentStreak, longestStreak } = action.payload;
      
      if (userLevel !== undefined) state.userLevel = userLevel;
      if (userXP !== undefined) state.userXP = userXP;
      if (totalXP !== undefined) state.totalXP = totalXP;
      if (currentStreak !== undefined) state.currentStreak = currentStreak;
      if (longestStreak !== undefined) state.longestStreak = longestStreak;
      
      // Recalculate level progress
      state.levelProgress = calculateLevelProgress(state.userXP, state.userLevel);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user badges
      .addCase(fetchUserBadges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBadges.fulfilled, (state, action) => {
        state.loading = false;
        state.userBadges = action.payload.badges || [];
        state.badgesByCategory = getBadgesByCategory(state.userBadges);
        
        if (action.payload.user) {
          const { level, xp, totalXP, currentStreak, longestStreak } = action.payload.user;
          state.userLevel = level || 1;
          state.userXP = xp || 0;
          state.totalXP = totalXP || 0;
          state.currentStreak = currentStreak || 0;
          state.longestStreak = longestStreak || 0;
          state.levelProgress = calculateLevelProgress(state.userXP, state.userLevel);
        }
      })
      .addCase(fetchUserBadges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch available badges
      .addCase(fetchAvailableBadges.fulfilled, (state, action) => {
        state.availableBadges = action.payload;
      })
      
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.leaderboardLoading = true;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboardLoading = false;
        const { type, data } = action.payload;
        state.leaderboards[type] = data.leaderboard || [];
        if (data.userRank) {
          state.userRankings[type] = data.userRank;
        }
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.leaderboardLoading = false;
        state.error = action.payload;
      })
      
      // Check achievements
      .addCase(checkAchievements.pending, (state) => {
        state.achievementsLoading = true;
      })
      .addCase(checkAchievements.fulfilled, (state, action) => {
        state.achievementsLoading = false;
        const { newAchievements, xpGained } = action.payload;
        
        if (newAchievements && newAchievements.length > 0) {
          newAchievements.forEach(achievement => {
            const existingBadge = state.userBadges.find(b => b.id === achievement.id);
            if (!existingBadge) {
              state.userBadges.push({
                ...achievement,
                earnedAt: new Date().toISOString(),
              });
              state.recentAchievements.unshift(achievement);
            }
          });
          
          state.badgesByCategory = getBadgesByCategory(state.userBadges);
        }
        
        if (xpGained > 0) {
          state.userXP += xpGained;
          state.totalXP += xpGained;
          state.levelProgress = calculateLevelProgress(state.userXP, state.userLevel);
        }
      })
      .addCase(checkAchievements.rejected, (state, action) => {
        state.achievementsLoading = false;
        state.error = action.payload;
      })
      
      // Fetch XP history
      .addCase(fetchXPHistory.fulfilled, (state, action) => {
        state.xpHistory = action.payload;
      })
      
      // Fetch streak info
      .addCase(fetchStreakInfo.fulfilled, (state, action) => {
        const { currentStreak, longestStreak, history } = action.payload;
        state.currentStreak = currentStreak || 0;
        state.longestStreak = longestStreak || 0;
        state.streakHistory = history || [];
      })
      
      // Fetch level info
      .addCase(fetchLevelInfo.fulfilled, (state, action) => {
        const { level, xp, totalXP, progress } = action.payload;
        state.userLevel = level || 1;
        state.userXP = xp || 0;
        state.totalXP = totalXP || 0;
        state.levelProgress = progress || calculateLevelProgress(state.userXP, state.userLevel);
      });
  },
});

export const {
  addXP,
  awardBadge,
  updateStreak,
  incrementStreak,
  resetStreak,
  setShowLevelUpModal,
  setShowAchievementModal,
  setSelectedAchievement,
  clearRecentAchievements,
  clearError,
  updateStats,
  updateGamificationData,
} = gamificationSlice.actions;

// Selectors
export const selectUserLevel = (state) => state.gamification.userLevel;
export const selectUserXP = (state) => state.gamification.userXP;
export const selectTotalXP = (state) => state.gamification.totalXP;
export const selectLevelProgress = (state) => state.gamification.levelProgress;
export const selectUserBadges = (state) => state.gamification.userBadges;
export const selectAvailableBadges = (state) => state.gamification.availableBadges;
export const selectBadgesByCategory = (state) => state.gamification.badgesByCategory;
export const selectRecentAchievements = (state) => state.gamification.recentAchievements;
export const selectCurrentStreak = (state) => state.gamification.currentStreak;
export const selectLongestStreak = (state) => state.gamification.longestStreak;
export const selectStreakHistory = (state) => state.gamification.streakHistory;
export const selectLeaderboards = (state) => state.gamification.leaderboards;
export const selectUserRankings = (state) => state.gamification.userRankings;
export const selectXPHistory = (state) => state.gamification.xpHistory;
export const selectShowLevelUpModal = (state) => state.gamification.showLevelUpModal;
export const selectShowAchievementModal = (state) => state.gamification.showAchievementModal;
export const selectSelectedAchievement = (state) => state.gamification.selectedAchievement;
export const selectGamificationLoading = (state) => state.gamification.loading;
export const selectLeaderboardLoading = (state) => state.gamification.leaderboardLoading;
export const selectAchievementsLoading = (state) => state.gamification.achievementsLoading;
export const selectGamificationError = (state) => state.gamification.error;
export const selectGamificationStats = (state) => state.gamification.stats;

export default gamificationSlice.reducer;