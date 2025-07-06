const express = require('express');
const { query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const { auth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics data
// @access  Private
router.get('/dashboard', auth, [
  query('period')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period must be week, month, quarter, or year'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
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

    const { period = 'week', startDate, endDate } = req.query;
    const userId = req.user._id;

    // Calculate date range
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const now = moment();
      switch (period) {
        case 'week':
          dateRange = {
            $gte: now.clone().startOf('week').toDate(),
            $lte: now.clone().endOf('week').toDate()
          };
          break;
        case 'month':
          dateRange = {
            $gte: now.clone().startOf('month').toDate(),
            $lte: now.clone().endOf('month').toDate()
          };
          break;
        case 'quarter':
          dateRange = {
            $gte: now.clone().startOf('quarter').toDate(),
            $lte: now.clone().endOf('quarter').toDate()
          };
          break;
        case 'year':
          dateRange = {
            $gte: now.clone().startOf('year').toDate(),
            $lte: now.clone().endOf('year').toDate()
          };
          break;
      }
    }

    // Get analytics data in parallel
    const [
      focusSessionStats,
      taskStats,
      productivityTrend,
      categoryBreakdown,
      timeDistribution
    ] = await Promise.all([
      // Focus session statistics
      FocusSession.aggregate([
        {
          $match: {
            user: userId,
            createdAt: dateRange,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalFocusTime: { $sum: '$actualDuration' },
            avgSessionDuration: { $avg: '$actualDuration' },
            avgFocusScore: { $avg: '$metrics.focusScore' },
            totalXP: { $sum: '$xpEarned' },
            totalDistractions: { $sum: '$metrics.distractions.count' }
          }
        }
      ]),

      // Task statistics
      Task.aggregate([
        {
          $match: {
            user: userId,
            createdAt: dateRange
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$actualDuration' }
          }
        }
      ]),

      // Productivity trend (daily data)
      FocusSession.aggregate([
        {
          $match: {
            user: userId,
            createdAt: dateRange,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            sessions: { $sum: 1 },
            focusTime: { $sum: '$actualDuration' },
            focusScore: { $avg: '$metrics.focusScore' },
            xp: { $sum: '$xpEarned' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Task category breakdown
      Task.aggregate([
        {
          $match: {
            user: userId,
            createdAt: dateRange
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalTime: { $sum: '$actualDuration' }
          }
        }
      ]),

      // Time distribution by hour
      FocusSession.aggregate([
        {
          $match: {
            user: userId,
            createdAt: dateRange,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $hour: '$startTime' },
            sessions: { $sum: 1 },
            totalTime: { $sum: '$actualDuration' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Process the data
    const analytics = {
      summary: {
        totalSessions: focusSessionStats[0]?.totalSessions || 0,
        totalFocusTime: focusSessionStats[0]?.totalFocusTime || 0,
        avgSessionDuration: Math.round(focusSessionStats[0]?.avgSessionDuration || 0),
        avgFocusScore: Math.round(focusSessionStats[0]?.avgFocusScore || 0),
        totalXP: focusSessionStats[0]?.totalXP || 0,
        totalDistractions: focusSessionStats[0]?.totalDistractions || 0,
        tasks: {
          total: taskStats.reduce((sum, stat) => sum + stat.count, 0),
          completed: taskStats.find(s => s._id === 'completed')?.count || 0,
          pending: taskStats.find(s => s._id === 'pending')?.count || 0,
          inProgress: taskStats.find(s => s._id === 'in-progress')?.count || 0
        }
      },
      trends: {
        productivity: productivityTrend,
        categories: categoryBreakdown,
        timeDistribution: timeDistribution
      },
      period,
      dateRange: {
        start: startDate || dateRange.$gte,
        end: endDate || dateRange.$lte
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics'
    });
  }
});

// @route   GET /api/analytics/charts/focus-time
// @desc    Get focus time chart data
// @access  Private
router.get('/charts/focus-time', auth, [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Period must be 7d, 30d, 90d, or 1y'),
  query('granularity')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Granularity must be daily, weekly, or monthly')
], async (req, res) => {
  try {
    const { period = '30d', granularity = 'daily' } = req.query;
    const userId = req.user._id;

    // Calculate date range
    const days = parseInt(period.replace('d', '')) || (period === '1y' ? 365 : 30);
    const startDate = moment().subtract(days, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    // Determine grouping format based on granularity
    let groupFormat;
    switch (granularity) {
      case 'weekly':
        groupFormat = '%Y-W%V';
        break;
      case 'monthly':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const chartData = await FocusSession.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' }
          },
          focusTime: { $sum: '$actualDuration' },
          sessions: { $sum: 1 },
          avgFocusScore: { $avg: '$metrics.focusScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        chartData,
        period,
        granularity,
        dateRange: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    console.error('Get focus time chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching focus time chart data'
    });
  }
});

// @route   GET /api/analytics/charts/task-completion
// @desc    Get task completion chart data
// @access  Private
router.get('/charts/task-completion', auth, [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user._id;

    const days = parseInt(period.replace('d', '')) || (period === '1y' ? 365 : 30);
    const startDate = moment().subtract(days, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    const chartData = await Task.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          tasks: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        chartData,
        period,
        dateRange: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    console.error('Get task completion chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task completion chart data'
    });
  }
});

// @route   GET /api/analytics/reports/weekly
// @desc    Generate weekly report
// @access  Private
router.get('/reports/weekly', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfWeek = moment().startOf('week').toDate();
    const endOfWeek = moment().endOf('week').toDate();

    const [sessions, tasks, previousWeekSessions] = await Promise.all([
      FocusSession.find({
        user: userId,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek }
      }),
      Task.find({
        user: userId,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek }
      }),
      FocusSession.find({
        user: userId,
        createdAt: { 
          $gte: moment().subtract(1, 'week').startOf('week').toDate(),
          $lte: moment().subtract(1, 'week').endOf('week').toDate()
        },
        status: 'completed'
      })
    ]);

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const currentWeekStats = {
      totalSessions: completedSessions.length,
      totalFocusTime: completedSessions.reduce((sum, s) => sum + s.actualDuration, 0),
      avgFocusScore: completedSessions.length > 0 
        ? Math.round(completedSessions.reduce((sum, s) => sum + s.metrics.focusScore, 0) / completedSessions.length)
        : 0,
      tasksCompleted: completedTasks.length,
      xpEarned: completedSessions.reduce((sum, s) => sum + s.xpEarned, 0)
    };

    const previousWeekStats = {
      totalSessions: previousWeekSessions.length,
      totalFocusTime: previousWeekSessions.reduce((sum, s) => sum + s.actualDuration, 0)
    };

    // Calculate improvements
    const improvements = {
      sessions: currentWeekStats.totalSessions - previousWeekStats.totalSessions,
      focusTime: currentWeekStats.totalFocusTime - previousWeekStats.totalFocusTime
    };

    const report = {
      period: {
        start: startOfWeek,
        end: endOfWeek,
        week: moment().week()
      },
      stats: currentWeekStats,
      improvements,
      dailyBreakdown: await getDailyBreakdown(userId, startOfWeek, endOfWeek),
      insights: generateWeeklyInsights(currentWeekStats, improvements),
      recommendations: generateRecommendations(currentWeekStats)
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate weekly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating weekly report'
    });
  }
});

// @route   GET /api/analytics/reports/monthly
// @desc    Generate monthly report
// @access  Private
router.get('/reports/monthly', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    const [sessions, tasks, goals] = await Promise.all([
      FocusSession.find({
        user: userId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: 'completed'
      }),
      Task.find({
        user: userId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      // Get monthly goals (if implemented)
      []
    ]);

    const completedTasks = tasks.filter(t => t.status === 'completed');

    const monthlyStats = {
      totalSessions: sessions.length,
      totalFocusTime: sessions.reduce((sum, s) => sum + s.actualDuration, 0),
      avgSessionLength: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + s.actualDuration, 0) / sessions.length)
        : 0,
      tasksCompleted: completedTasks.length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      totalXP: sessions.reduce((sum, s) => sum + s.xpEarned, 0),
      bestDay: await getBestDay(userId, startOfMonth, endOfMonth),
      streakDays: req.user.gamification.streakDays
    };

    const report = {
      period: {
        start: startOfMonth,
        end: endOfMonth,
        month: moment().format('MMMM YYYY')
      },
      stats: monthlyStats,
      weeklyBreakdown: await getWeeklyBreakdown(userId, startOfMonth, endOfMonth),
      categoryAnalysis: await getCategoryAnalysis(userId, startOfMonth, endOfMonth),
      achievements: req.user.gamification.badges.filter(
        badge => moment(badge.earnedAt).isBetween(startOfMonth, endOfMonth)
      ),
      insights: generateMonthlyInsights(monthlyStats),
      goalsForNextMonth: generateGoalsForNextMonth(monthlyStats)
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Generate monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating monthly report'
    });
  }
});

// Helper functions
async function getDailyBreakdown(userId, startDate, endDate) {
  return await FocusSession.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        sessions: { $sum: 1 },
        focusTime: { $sum: '$actualDuration' },
        avgFocusScore: { $avg: '$metrics.focusScore' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function getBestDay(userId, startDate, endDate) {
  const dailyStats = await getDailyBreakdown(userId, startDate, endDate);
  if (dailyStats.length === 0) return null;
  
  return dailyStats.reduce((best, current) => 
    current.focusTime > (best?.focusTime || 0) ? current : best
  );
}

async function getWeeklyBreakdown(userId, startDate, endDate) {
  return await FocusSession.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-W%V', date: '$createdAt' }
        },
        sessions: { $sum: 1 },
        focusTime: { $sum: '$actualDuration' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function getCategoryAnalysis(userId, startDate, endDate) {
  return await Task.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgDuration: { $avg: '$actualDuration' }
      }
    }
  ]);
}

function generateWeeklyInsights(stats, improvements) {
  const insights = [];
  
  if (improvements.sessions > 0) {
    insights.push(`You completed ${improvements.sessions} more focus sessions than last week! 🎉`);
  }
  
  if (stats.avgFocusScore >= 80) {
    insights.push(`Excellent focus score of ${stats.avgFocusScore}%! You're in the zone! 🎯`);
  }
  
  if (stats.totalFocusTime > 300) { // 5 hours
    insights.push(`Amazing! You focused for over ${Math.round(stats.totalFocusTime / 60)} hours this week! 💪`);
  }
  
  return insights;
}

function generateMonthlyInsights(stats) {
  const insights = [];
  
  if (stats.completionRate >= 80) {
    insights.push(`Outstanding ${stats.completionRate}% task completion rate! 🏆`);
  }
  
  if (stats.streakDays >= 7) {
    insights.push(`Incredible ${stats.streakDays}-day streak! Consistency is key! 🔥`);
  }
  
  return insights;
}

function generateRecommendations(stats) {
  const recommendations = [];
  
  if (stats.avgFocusScore < 70) {
    recommendations.push('Try reducing distractions by using website blockers during focus sessions');
  }
  
  if (stats.totalSessions < 5) {
    recommendations.push('Aim for at least one focus session per day to build consistency');
  }
  
  return recommendations;
}

function generateGoalsForNextMonth(stats) {
  return [
    `Complete ${Math.ceil(stats.totalSessions * 1.2)} focus sessions`,
    `Achieve ${Math.min(stats.totalFocusTime + 120, 1200)} minutes of focus time`,
    `Maintain a focus score above ${Math.max(stats.avgFocusScore || 70, 75)}%`
  ];
}

module.exports = router;