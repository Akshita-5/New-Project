const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');
const FocusSession = require('../models/FocusSession');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/sessions
// @desc    Get user's focus sessions with filtering
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['scheduled', 'active', 'completed', 'cancelled', 'paused']),
  query('type').optional().isIn(['pomodoro', 'custom', 'deep-work', 'study', 'break']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      type,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (type) filter.type = type;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      FocusSession.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('tasks.task', 'title category priority status'),
      FocusSession.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
});

// @route   GET /api/sessions/active
// @desc    Get current active session
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const activeSession = await FocusSession.findOne({
      user: req.user._id,
      status: { $in: ['active', 'paused'] }
    }).populate('tasks.task', 'title category priority');

    res.json({
      success: true,
      data: activeSession
    });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active session'
    });
  }
});

// @route   GET /api/sessions/today
// @desc    Get today's sessions
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const sessions = await FocusSession.getTodaySessions(req.user._id);

    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalFocusTime: sessions
        .filter(s => s.status === 'completed')
        .reduce((total, s) => total + s.actualDuration, 0),
      averageFocusScore: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + s.metrics.focusScore, 0) / sessions.length)
        : 0
    };

    res.json({
      success: true,
      data: {
        sessions,
        stats
      }
    });
  } catch (error) {
    console.error('Get today sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s sessions'
    });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get single session
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('tasks.task', 'title category priority status');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session'
    });
  }
});

// @route   POST /api/sessions
// @desc    Create new focus session
// @access  Private
router.post('/', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('type')
    .optional()
    .isIn(['pomodoro', 'custom', 'deep-work', 'study', 'break']),
  body('plannedDuration')
    .isInt({ min: 1, max: 480 })
    .withMessage('Planned duration must be between 1 and 480 minutes'),
  body('tasks')
    .optional()
    .isArray()
    .withMessage('Tasks must be an array'),
  body('tasks.*.task')
    .optional()
    .isMongoId()
    .withMessage('Invalid task ID'),
  body('goals')
    .optional()
    .isArray()
    .withMessage('Goals must be an array')
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

    // Check if user has an active session
    const activeSession = await FocusSession.findOne({
      user: req.user._id,
      status: { $in: ['active', 'paused'] }
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active session. Please complete or cancel it first.',
        activeSession: activeSession._id
      });
    }

    const sessionData = {
      ...req.body,
      user: req.user._id
    };

    // Validate tasks exist and belong to user
    if (sessionData.tasks && sessionData.tasks.length > 0) {
      const taskIds = sessionData.tasks.map(t => t.task);
      const tasks = await Task.find({
        _id: { $in: taskIds },
        user: req.user._id
      });

      if (tasks.length !== taskIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more tasks not found or do not belong to you'
        });
      }
    }

    const session = new FocusSession(sessionData);
    await session.save();

    res.status(201).json({
      success: true,
      message: 'Focus session created successfully',
      data: session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating session'
    });
  }
});

// @route   PUT /api/sessions/:id/start
// @desc    Start a focus session
// @access  Private
router.put('/:id/start', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Session can only be started if it is scheduled'
      });
    }

    await session.start();

    res.json({
      success: true,
      message: 'Session started successfully',
      data: session
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting session'
    });
  }
});

// @route   PUT /api/sessions/:id/pause
// @desc    Pause a focus session
// @access  Private
router.put('/:id/pause', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active sessions can be paused'
      });
    }

    await session.pause();

    res.json({
      success: true,
      message: 'Session paused successfully',
      data: session
    });
  } catch (error) {
    console.error('Pause session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing session'
    });
  }
});

// @route   PUT /api/sessions/:id/resume
// @desc    Resume a paused session
// @access  Private
router.put('/:id/resume', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Only paused sessions can be resumed'
      });
    }

    await session.resume();

    res.json({
      success: true,
      message: 'Session resumed successfully',
      data: session
    });
  } catch (error) {
    console.error('Resume session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming session'
    });
  }
});

// @route   PUT /api/sessions/:id/complete
// @desc    Complete a focus session
// @access  Private
router.put('/:id/complete', auth, [
  body('mood.after')
    .optional()
    .isIn(['very-bad', 'bad', 'neutral', 'good', 'very-good']),
  body('mood.energy.after')
    .optional()
    .isInt({ min: 1, max: 10 }),
  body('mood.motivation.after')
    .optional()
    .isInt({ min: 1, max: 10 }),
  body('notes.after')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('After notes must be less than 500 characters'),
  body('productivity')
    .optional()
    .isIn(['very-low', 'low', 'medium', 'high', 'very-high'])
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

    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (!['active', 'paused'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only active or paused sessions can be completed'
      });
    }

    // Update session with completion data
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key.includes('.')) {
          // Handle nested properties like mood.after
          const [parent, child] = key.split('.');
          if (!session[parent]) session[parent] = {};
          session[parent][child] = req.body[key];
        } else {
          session[key] = req.body[key];
        }
      }
    });

    await session.complete();

    // Update user stats
    req.user.stats.totalSessions += 1;
    req.user.stats.totalFocusTime += session.actualDuration;

    // Add XP for session completion
    const xpGained = session.xpEarned;
    const levelResult = req.user.addXP(xpGained);

    // Update streak
    req.user.updateStreak();
    await req.user.save();

    res.json({
      success: true,
      message: 'Session completed successfully! XP gained.',
      data: session,
      xpGained,
      levelUp: levelResult.levelUp,
      newLevel: levelResult.newLevel
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing session'
    });
  }
});

// @route   PUT /api/sessions/:id/cancel
// @desc    Cancel a focus session
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Session is already completed or cancelled'
      });
    }

    session.status = 'cancelled';
    session.endTime = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      data: session
    });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling session'
    });
  }
});

// @route   POST /api/sessions/:id/distraction
// @desc    Log a distraction during session
// @access  Private
router.post('/:id/distraction', auth, [
  body('type')
    .isIn(['website', 'notification', 'manual', 'other'])
    .withMessage('Invalid distraction type'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('duration')
    .optional()
    .isInt({ min: 0, max: 3600 })
    .withMessage('Duration must be between 0 and 3600 seconds')
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

    const session = await FocusSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only log distractions for active sessions'
      });
    }

    const { type, description, duration = 0 } = req.body;
    await session.addDistraction(type, description, duration);

    // Update user stats
    req.user.stats.distractionsAvoided += 1;
    await req.user.save();

    res.json({
      success: true,
      message: 'Distraction logged successfully',
      data: session
    });
  } catch (error) {
    console.error('Log distraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging distraction'
    });
  }
});

// @route   GET /api/sessions/stats/productivity
// @desc    Get productivity statistics
// @access  Private
router.get('/stats/productivity', auth, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .toInt()
], async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await FocusSession.getProductivityStats(req.user._id, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get productivity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching productivity statistics'
    });
  }
});

module.exports = router;