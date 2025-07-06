const express = require('express');
const { query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Define all available badges
const AVAILABLE_BADGES = {
  'first-task': {
    id: 'first-task',
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: '✅',
    category: 'milestone',
    rarity: 'common'
  },
  'first-session': {
    id: 'first-session',
    name: 'Focus Beginner',
    description: 'Complete your first focus session',
    icon: '🎯',
    category: 'milestone',
    rarity: 'common'
  },
  'streak-3': {
    id: 'streak-3',
    name: 'Consistency Builder',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common'
  },
  'streak-7': {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    category: 'streak',
    rarity: 'uncommon'
  },
  'streak-30': {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '💎',
    category: 'streak',
    rarity: 'rare'
  },
  'tasks-10': {
    id: 'tasks-10',
    name: 'Task Conqueror',
    description: 'Complete 10 tasks',
    icon: '🏆',
    category: 'milestone',
    rarity: 'common'
  },
  'tasks-50': {
    id: 'tasks-50',
    name: 'Productivity Champion',
    description: 'Complete 50 tasks',
    icon: '👑',
    category: 'milestone',
    rarity: 'uncommon'
  },
  'tasks-100': {
    id: 'tasks-100',
    name: 'Task Master',
    description: 'Complete 100 tasks',
    icon: '🌟',
    category: 'milestone',
    rarity: 'rare'
  },
  'focus-time-10': {
    id: 'focus-time-10',
    name: 'Focused Mind',
    description: 'Accumulate 10 hours of focus time',
    icon: '🧠',
    category: 'focus',
    rarity: 'common'
  },
  'focus-time-50': {
    id: 'focus-time-50',
    name: 'Deep Worker',
    description: 'Accumulate 50 hours of focus time',
    icon: '🎪',
    category: 'focus',
    rarity: 'uncommon'
  },
  'focus-time-100': {
    id: 'focus-time-100',
    name: 'Focus Legend',
    description: 'Accumulate 100 hours of focus time',
    icon: '🦅',
    category: 'focus',
    rarity: 'epic'
  },
  'perfect-day': {
    id: 'perfect-day',
    name: 'Perfect Day',
    description: 'Complete all tasks for a day',
    icon: '🌞',
    category: 'achievement',
    rarity: 'uncommon'
  },
  'early-bird': {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Start a focus session before 7 AM',
    icon: '🌅',
    category: 'achievement',
    rarity: 'uncommon'
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a focus session after 10 PM',
    icon: '🦉',
    category: 'achievement',
    rarity: 'uncommon'
  },
  'distraction-free': {
    id: 'distraction-free',
    name: 'Laser Focus',
    description: 'Complete a session with zero distractions',
    icon: '🎯',
    category: 'achievement',
    rarity: 'rare'
  },
  'level-5': {
    id: 'level-5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '⭐',
    category: 'level',
    rarity: 'common'
  },
  'level-10': {
    id: 'level-10',
    name: 'Expert',
    description: 'Reach level 10',
    icon: '💫',
    category: 'level',
    rarity: 'uncommon'
  },
  'level-25': {
    id: 'level-25',
    name: 'Productivity Guru',
    description: 'Reach level 25',
    icon: '🔮',
    category: 'level',
    rarity: 'epic'
  },
  'social-butterfly': {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Complete 10 social category tasks',
    icon: '🦋',
    category: 'category',
    rarity: 'uncommon'
  },
  'fitness-fanatic': {
    id: 'fitness-fanatic',
    name: 'Fitness Fanatic',
    description: 'Complete 20 fitness tasks',
    icon: '💪',
    category: 'category',
    rarity: 'uncommon'
  }
};

// @route   GET /api/gamification/profile
// @desc    Get user's gamification profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;

    const profile = {
      level: user.gamification.level,
      totalXP: user.gamification.totalXP,
      focusPoints: user.gamification.focusPoints,
      streakDays: user.gamification.streakDays,
      longestStreak: user.gamification.longestStreak,
      levelProgress: user.levelProgress,
      badges: user.gamification.badges,
      stats: user.stats,
      achievements: {
        totalBadges: user.gamification.badges.length,
        rareCount: user.gamification.badges.filter(b => 
          AVAILABLE_BADGES[b.id]?.rarity === 'rare' || 
          AVAILABLE_BADGES[b.id]?.rarity === 'epic'
        ).length,
        categories: {
          milestone: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.category === 'milestone'
          ).length,
          streak: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.category === 'streak'
          ).length,
          focus: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.category === 'focus'
          ).length,
          achievement: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.category === 'achievement'
          ).length
        }
      }
    };

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get gamification profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gamification profile'
    });
  }
});

// @route   GET /api/gamification/badges
// @desc    Get all available badges and user's progress
// @access  Private
router.get('/badges', auth, async (req, res) => {
  try {
    const user = req.user;
    const userBadgeIds = user.gamification.badges.map(badge => badge.id);

    // Get user's progress for badge requirements
    const progress = await calculateBadgeProgress(user._id);

    const badgesWithProgress = Object.values(AVAILABLE_BADGES).map(badge => ({
      ...badge,
      earned: userBadgeIds.includes(badge.id),
      earnedAt: user.gamification.badges.find(b => b.id === badge.id)?.earnedAt,
      progress: progress[badge.id] || { current: 0, required: 1, percentage: 0 }
    }));

    // Group badges by category
    const badgesByCategory = {
      milestone: badgesWithProgress.filter(b => b.category === 'milestone'),
      streak: badgesWithProgress.filter(b => b.category === 'streak'),
      focus: badgesWithProgress.filter(b => b.category === 'focus'),
      achievement: badgesWithProgress.filter(b => b.category === 'achievement'),
      level: badgesWithProgress.filter(b => b.category === 'level'),
      category: badgesWithProgress.filter(b => b.category === 'category')
    };

    res.json({
      success: true,
      data: {
        badges: badgesWithProgress,
        byCategory: badgesByCategory,
        summary: {
          total: Object.keys(AVAILABLE_BADGES).length,
          earned: userBadgeIds.length,
          progress: Math.round((userBadgeIds.length / Object.keys(AVAILABLE_BADGES).length) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching badges'
    });
  }
});

// @route   GET /api/gamification/leaderboard
// @desc    Get leaderboard data
// @access  Private
router.get('/leaderboard', auth, [
  query('period')
    .optional()
    .isIn(['week', 'month', 'all-time'])
    .withMessage('Period must be week, month, or all-time'),
  query('metric')
    .optional()
    .isIn(['xp', 'focus-time', 'tasks', 'streak'])
    .withMessage('Metric must be xp, focus-time, tasks, or streak'),
  query('limit')
    .optional()
    .isInt({ min: 5, max: 100 })
    .toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { period = 'week', metric = 'xp', limit = 10 } = req.query;

    let sortField, aggregateField;
    switch (metric) {
      case 'xp':
        sortField = 'gamification.totalXP';
        break;
      case 'focus-time':
        sortField = 'stats.totalFocusTime';
        break;
      case 'tasks':
        sortField = 'stats.completedTasks';
        break;
      case 'streak':
        sortField = 'gamification.streakDays';
        break;
      default:
        sortField = 'gamification.totalXP';
    }

    // For period-based leaderboards, we would need to aggregate data
    // For now, showing all-time leaderboard
    const leaderboard = await User.find({ isActive: true })
      .select('name avatar gamification stats createdAt')
      .sort({ [sortField]: -1 })
      .limit(limit);

    // Find current user's position
    const userPosition = await User.countDocuments({
      isActive: true,
      [sortField]: { $gt: req.user[sortField.split('.')[0]][sortField.split('.')[1]] }
    }) + 1;

    const leaderboardData = leaderboard.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      level: user.gamification.level,
      value: getMetricValue(user, metric),
      isCurrentUser: user._id.toString() === req.user._id.toString()
    }));

    res.json({
      success: true,
      data: {
        leaderboard: leaderboardData,
        currentUser: {
          rank: userPosition,
          value: getMetricValue(req.user, metric)
        },
        period,
        metric,
        totalParticipants: await User.countDocuments({ isActive: true })
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard'
    });
  }
});

// @route   POST /api/gamification/check-achievements
// @desc    Check and award new achievements for user
// @access  Private
router.post('/check-achievements', auth, async (req, res) => {
  try {
    const user = req.user;
    const newBadges = await checkAndAwardBadges(user._id);

    if (newBadges.length > 0) {
      // Add badges to user
      for (const badge of newBadges) {
        user.addBadge({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          earnedAt: new Date()
        });
      }

      await user.save();

      res.json({
        success: true,
        message: `Congratulations! You earned ${newBadges.length} new badge(s)!`,
        data: {
          newBadges,
          totalBadges: user.gamification.badges.length
        }
      });
    } else {
      res.json({
        success: true,
        message: 'No new badges earned',
        data: {
          newBadges: [],
          totalBadges: user.gamification.badges.length
        }
      });
    }
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking achievements'
    });
  }
});

// @route   GET /api/gamification/stats
// @desc    Get detailed gamification statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get additional statistics
    const [recentSessions, taskCategoryStats, weeklyProgress] = await Promise.all([
      FocusSession.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('xpEarned actualDuration metrics.focusScore createdAt'),
      
      Task.aggregate([
        { $match: { user: user._id, status: 'completed' } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),

      getWeeklyXPProgress(user._id)
    ]);

    const stats = {
      overview: {
        level: user.gamification.level,
        totalXP: user.gamification.totalXP,
        xpToNextLevel: user.levelProgress.required - user.levelProgress.current,
        focusPoints: user.gamification.focusPoints,
        currentStreak: user.gamification.streakDays,
        longestStreak: user.gamification.longestStreak
      },
      achievements: {
        totalBadges: user.gamification.badges.length,
        recentBadges: user.gamification.badges
          .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
          .slice(0, 3),
        badgesByRarity: {
          common: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.rarity === 'common'
          ).length,
          uncommon: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.rarity === 'uncommon'
          ).length,
          rare: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.rarity === 'rare'
          ).length,
          epic: user.gamification.badges.filter(b => 
            AVAILABLE_BADGES[b.id]?.rarity === 'epic'
          ).length
        }
      },
      productivity: {
        totalFocusTime: user.stats.totalFocusTime,
        totalSessions: user.stats.totalSessions,
        completedTasks: user.stats.completedTasks,
        completionRate: user.completionRate,
        avgSessionXP: recentSessions.length > 0 
          ? Math.round(recentSessions.reduce((sum, s) => sum + s.xpEarned, 0) / recentSessions.length)
          : 0
      },
      trends: {
        weeklyXP: weeklyProgress,
        taskCategories: taskCategoryStats,
        recentSessions: recentSessions.map(session => ({
          xp: session.xpEarned,
          duration: session.actualDuration,
          focusScore: session.metrics.focusScore,
          date: session.createdAt
        }))
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get gamification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gamification statistics'
    });
  }
});

// Helper functions
async function calculateBadgeProgress(userId) {
  const user = await User.findById(userId);
  const completedTasks = user.stats.completedTasks;
  const totalFocusTime = Math.round(user.stats.totalFocusTime / 60); // Convert to hours
  const currentLevel = user.gamification.level;
  const currentStreak = user.gamification.streakDays;

  // Get category-specific task counts
  const categoryStats = await Task.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const categoryMap = {};
  categoryStats.forEach(stat => {
    categoryMap[stat._id] = stat.count;
  });

  return {
    'first-task': { current: Math.min(completedTasks, 1), required: 1, percentage: Math.min(completedTasks * 100, 100) },
    'tasks-10': { current: Math.min(completedTasks, 10), required: 10, percentage: Math.min((completedTasks / 10) * 100, 100) },
    'tasks-50': { current: Math.min(completedTasks, 50), required: 50, percentage: Math.min((completedTasks / 50) * 100, 100) },
    'tasks-100': { current: Math.min(completedTasks, 100), required: 100, percentage: Math.min((completedTasks / 100) * 100, 100) },
    'focus-time-10': { current: Math.min(totalFocusTime, 10), required: 10, percentage: Math.min((totalFocusTime / 10) * 100, 100) },
    'focus-time-50': { current: Math.min(totalFocusTime, 50), required: 50, percentage: Math.min((totalFocusTime / 50) * 100, 100) },
    'focus-time-100': { current: Math.min(totalFocusTime, 100), required: 100, percentage: Math.min((totalFocusTime / 100) * 100, 100) },
    'streak-3': { current: Math.min(currentStreak, 3), required: 3, percentage: Math.min((currentStreak / 3) * 100, 100) },
    'streak-7': { current: Math.min(currentStreak, 7), required: 7, percentage: Math.min((currentStreak / 7) * 100, 100) },
    'streak-30': { current: Math.min(currentStreak, 30), required: 30, percentage: Math.min((currentStreak / 30) * 100, 100) },
    'level-5': { current: Math.min(currentLevel, 5), required: 5, percentage: Math.min((currentLevel / 5) * 100, 100) },
    'level-10': { current: Math.min(currentLevel, 10), required: 10, percentage: Math.min((currentLevel / 10) * 100, 100) },
    'level-25': { current: Math.min(currentLevel, 25), required: 25, percentage: Math.min((currentLevel / 25) * 100, 100) },
    'social-butterfly': { current: Math.min(categoryMap.social || 0, 10), required: 10, percentage: Math.min(((categoryMap.social || 0) / 10) * 100, 100) },
    'fitness-fanatic': { current: Math.min(categoryMap.fitness || 0, 20), required: 20, percentage: Math.min(((categoryMap.fitness || 0) / 20) * 100, 100) }
  };
}

async function checkAndAwardBadges(userId) {
  const user = await User.findById(userId);
  const existingBadgeIds = user.gamification.badges.map(badge => badge.id);
  const newBadges = [];

  // Check each badge requirement
  const completedTasks = user.stats.completedTasks;
  const totalFocusTime = Math.round(user.stats.totalFocusTime / 60);
  const currentLevel = user.gamification.level;
  const currentStreak = user.gamification.streakDays;
  const totalSessions = user.stats.totalSessions;

  // Task-based badges
  if (completedTasks >= 1 && !existingBadgeIds.includes('first-task')) {
    newBadges.push(AVAILABLE_BADGES['first-task']);
  }
  if (completedTasks >= 10 && !existingBadgeIds.includes('tasks-10')) {
    newBadges.push(AVAILABLE_BADGES['tasks-10']);
  }
  if (completedTasks >= 50 && !existingBadgeIds.includes('tasks-50')) {
    newBadges.push(AVAILABLE_BADGES['tasks-50']);
  }
  if (completedTasks >= 100 && !existingBadgeIds.includes('tasks-100')) {
    newBadges.push(AVAILABLE_BADGES['tasks-100']);
  }

  // Focus time badges
  if (totalFocusTime >= 10 && !existingBadgeIds.includes('focus-time-10')) {
    newBadges.push(AVAILABLE_BADGES['focus-time-10']);
  }
  if (totalFocusTime >= 50 && !existingBadgeIds.includes('focus-time-50')) {
    newBadges.push(AVAILABLE_BADGES['focus-time-50']);
  }
  if (totalFocusTime >= 100 && !existingBadgeIds.includes('focus-time-100')) {
    newBadges.push(AVAILABLE_BADGES['focus-time-100']);
  }

  // Session badges
  if (totalSessions >= 1 && !existingBadgeIds.includes('first-session')) {
    newBadges.push(AVAILABLE_BADGES['first-session']);
  }

  // Streak badges
  if (currentStreak >= 3 && !existingBadgeIds.includes('streak-3')) {
    newBadges.push(AVAILABLE_BADGES['streak-3']);
  }
  if (currentStreak >= 7 && !existingBadgeIds.includes('streak-7')) {
    newBadges.push(AVAILABLE_BADGES['streak-7']);
  }
  if (currentStreak >= 30 && !existingBadgeIds.includes('streak-30')) {
    newBadges.push(AVAILABLE_BADGES['streak-30']);
  }

  // Level badges
  if (currentLevel >= 5 && !existingBadgeIds.includes('level-5')) {
    newBadges.push(AVAILABLE_BADGES['level-5']);
  }
  if (currentLevel >= 10 && !existingBadgeIds.includes('level-10')) {
    newBadges.push(AVAILABLE_BADGES['level-10']);
  }
  if (currentLevel >= 25 && !existingBadgeIds.includes('level-25')) {
    newBadges.push(AVAILABLE_BADGES['level-25']);
  }

  // Category-specific badges
  const categoryStats = await Task.aggregate([
    { $match: { user: userId, status: 'completed' } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const categoryMap = {};
  categoryStats.forEach(stat => {
    categoryMap[stat._id] = stat.count;
  });

  if ((categoryMap.social || 0) >= 10 && !existingBadgeIds.includes('social-butterfly')) {
    newBadges.push(AVAILABLE_BADGES['social-butterfly']);
  }
  if ((categoryMap.fitness || 0) >= 20 && !existingBadgeIds.includes('fitness-fanatic')) {
    newBadges.push(AVAILABLE_BADGES['fitness-fanatic']);
  }

  return newBadges;
}

function getMetricValue(user, metric) {
  switch (metric) {
    case 'xp':
      return user.gamification.totalXP;
    case 'focus-time':
      return Math.round(user.stats.totalFocusTime / 60); // Convert to hours
    case 'tasks':
      return user.stats.completedTasks;
    case 'streak':
      return user.gamification.streakDays;
    default:
      return user.gamification.totalXP;
  }
}

async function getWeeklyXPProgress(userId) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const sessions = await FocusSession.find({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'completed'
    });

    const dailyXP = sessions.reduce((sum, session) => sum + session.xpEarned, 0);
    
    days.push({
      date: startOfDay,
      xp: dailyXP,
      day: startOfDay.toLocaleDateString('en', { weekday: 'short' })
    });
  }

  return days;
}

module.exports = router;