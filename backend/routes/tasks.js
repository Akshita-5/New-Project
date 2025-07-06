const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { auth, checkResourceOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get user's tasks with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  query('category').optional().isIn(['work', 'study', 'fitness', 'personal', 'health', 'creative', 'social', 'other']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('sortBy').optional().isIn(['createdAt', 'dueDate', 'priority', 'title', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
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
      category,
      priority,
      search,
      tags,
      dueDateFrom,
      dueDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      view = 'all' // all, today, week, overdue
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (tags) filter.tags = { $in: tags.split(',') };

    // Search in title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Date filters
    if (dueDateFrom || dueDateTo) {
      filter.dueDate = {};
      if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
      if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo);
    }

    // View-based filters
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (view) {
      case 'today':
        filter.dueDate = {
          $gte: today.setHours(0, 0, 0, 0),
          $lt: tomorrow.setHours(0, 0, 0, 0)
        };
        break;
      case 'week':
        filter.dueDate = {
          $gte: today.setHours(0, 0, 0, 0),
          $lt: weekFromNow.setHours(23, 59, 59, 999)
        };
        break;
      case 'overdue':
        filter.dueDate = { $lt: today };
        filter.status = { $ne: 'completed' };
        break;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // If sorting by priority, use custom order
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      // This would require aggregation for proper priority sorting
      // For simplicity, we'll sort alphabetically and handle in frontend
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('focusSessions', 'plannedDuration actualDuration status'),
      Task.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        tasks,
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
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get user's task statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalTasks,
      completedTasks,
      todayTasks,
      overdueTasks,
      weeklyStats,
      monthlyStats,
      categoryStats
    ] = await Promise.all([
      Task.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: 'completed' }),
      Task.countDocuments({
        user: userId,
        dueDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      Task.countDocuments({
        user: userId,
        dueDate: { $lt: new Date() },
        status: { $ne: 'completed' }
      }),
      Task.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startOfWeek }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Task.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Task.aggregate([
        {
          $match: { user: userId }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          completionRate,
          todayTasks,
          overdueTasks
        },
        weekly: weeklyStats,
        monthly: monthlyStats,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('focusSessions', 'plannedDuration actualDuration status createdAt');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get single task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', auth, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .isIn(['work', 'study', 'fitness', 'personal', 'health', 'creative', 'social', 'other']),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Estimated duration must be between 1 and 480 minutes'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag must be less than 30 characters')
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

    const taskData = {
      ...req.body,
      user: req.user._id
    };

    // Set default order (place at end)
    if (!taskData.order) {
      const lastTask = await Task.findOne({ user: req.user._id }).sort({ order: -1 });
      taskData.order = lastTask ? lastTask.order + 1 : 0;
    }

    const task = new Task(taskData);
    await task.save();

    // Update user stats
    req.user.stats.totalTasks += 1;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('category')
    .optional()
    .isIn(['work', 'study', 'fitness', 'personal', 'health', 'creative', 'social', 'other']),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Estimated duration must be between 1 and 480 minutes')
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

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const oldStatus = task.status;
    
    // Update task fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
      }
    });

    await task.save();

    // Update user stats if task was completed
    if (oldStatus !== 'completed' && task.status === 'completed') {
      req.user.stats.completedTasks += 1;
      
      // Add XP for task completion
      const xpGained = task.calculateCompletionXP();
      const levelResult = req.user.addXP(xpGained);
      
      await req.user.save();

      return res.json({
        success: true,
        message: 'Task completed! XP gained.',
        data: task,
        xpGained,
        levelUp: levelResult.levelUp,
        newLevel: levelResult.newLevel
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update user stats
    req.user.stats.totalTasks -= 1;
    if (task.status === 'completed') {
      req.user.stats.completedTasks -= 1;
    }
    await req.user.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
});

// @route   POST /api/tasks/:id/subtasks
// @desc    Add subtask
// @access  Private
router.post('/:id/subtasks', auth, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subtask title is required and must be less than 100 characters')
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

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.addSubtask(req.body.title, req.body.order);

    res.json({
      success: true,
      message: 'Subtask added successfully',
      data: task
    });
  } catch (error) {
    console.error('Add subtask error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding subtask'
    });
  }
});

// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @desc    Toggle subtask completion
// @access  Private
router.put('/:id/subtasks/:subtaskId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.toggleSubtask(req.params.subtaskId);

    res.json({
      success: true,
      message: 'Subtask updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Toggle subtask error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subtask'
    });
  }
});

// @route   POST /api/tasks/reorder
// @desc    Reorder tasks
// @access  Private
router.post('/reorder', auth, [
  body('tasks')
    .isArray()
    .withMessage('Tasks must be an array'),
  body('tasks.*.id')
    .isMongoId()
    .withMessage('Invalid task ID'),
  body('tasks.*.order')
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
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

    const { tasks } = req.body;
    
    // Update task orders in bulk
    const bulkOps = tasks.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, user: req.user._id },
        update: { order }
      }
    }));

    await Task.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Tasks reordered successfully'
    });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering tasks'
    });
  }
});

module.exports = router;