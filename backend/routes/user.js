const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a valid string'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be light, dark, or auto'),
  body('colorScheme')
    .optional()
    .isIn(['blue', 'green', 'purple', 'orange', 'pink'])
    .withMessage('Color scheme must be blue, green, purple, orange, or pink'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
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

    const allowedFields = ['name', 'timezone', 'theme', 'colorScheme', 'avatar'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @route   PUT /api/user/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, [
  body('notifications.breakReminder')
    .optional()
    .isBoolean()
    .withMessage('Break reminder must be a boolean'),
  body('notifications.hydrationAlert')
    .optional()
    .isBoolean()
    .withMessage('Hydration alert must be a boolean'),
  body('notifications.dailySummary')
    .optional()
    .isBoolean()
    .withMessage('Daily summary must be a boolean'),
  body('notifications.weeklyReport')
    .optional()
    .isBoolean()
    .withMessage('Weekly report must be a boolean'),
  body('focus.defaultSessionDuration')
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage('Default session duration must be between 5 and 120 minutes'),
  body('focus.breakDuration')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Break duration must be between 1 and 30 minutes'),
  body('focus.longBreakDuration')
    .optional()
    .isInt({ min: 5, max: 60 })
    .withMessage('Long break duration must be between 5 and 60 minutes'),
  body('focus.sessionsBeforeLongBreak')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Sessions before long break must be between 2 and 10'),
  body('focus.soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('Sound enabled must be a boolean'),
  body('focus.backgroundMusic')
    .optional()
    .isString()
    .withMessage('Background music must be a string')
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

    const user = req.user;
    
    // Update nested preferences
    Object.keys(req.body).forEach(key => {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (!user.preferences[parent]) {
          user.preferences[parent] = {};
        }
        user.preferences[parent][child] = req.body[key];
      } else {
        user.preferences[key] = req.body[key];
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

// @route   PUT /api/user/blocklist
// @desc    Update blocklist/allowlist
// @access  Private
router.put('/blocklist', auth, [
  body('blocklist')
    .optional()
    .isArray()
    .withMessage('Blocklist must be an array'),
  body('blocklist.*.url')
    .optional()
    .isURL()
    .withMessage('Each blocked URL must be valid'),
  body('allowlist')
    .optional()
    .isArray()
    .withMessage('Allowlist must be an array'),
  body('allowlist.*.url')
    .optional()
    .isURL()
    .withMessage('Each allowed URL must be valid')
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

    const user = req.user;

    if (req.body.blocklist !== undefined) {
      user.preferences.blocklist = req.body.blocklist;
    }

    if (req.body.allowlist !== undefined) {
      user.preferences.allowlist = req.body.allowlist;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Block/Allow lists updated successfully',
      data: {
        blocklist: user.preferences.blocklist,
        allowlist: user.preferences.allowlist
      }
    });
  } catch (error) {
    console.error('Update blocklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating block/allow lists'
    });
  }
});

// @route   GET /api/user/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = req.user;

    const stats = {
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        joinedAt: user.createdAt,
        lastActive: user.lastLogin
      },
      gamification: user.gamification,
      levelProgress: user.levelProgress,
      stats: user.stats,
      completionRate: user.completionRate,
      achievements: user.gamification.badges,
      streaks: {
        current: user.gamification.streakDays,
        longest: user.gamification.longestStreak
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, [
  body('password')
    .if(body('isGoogleUser').not().equals(true))
    .notEmpty()
    .withMessage('Password is required for non-Google users'),
  body('confirmDelete')
    .equals('DELETE')
    .withMessage('Must confirm deletion by typing DELETE')
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

    const user = req.user;

    // Verify password for non-Google users
    if (!user.isGoogleUser) {
      const userWithPassword = await User.findById(user._id).select('+password');
      const isPasswordValid = await userWithPassword.comparePassword(req.body.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    // Instead of hard delete, deactivate account
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.json({
      success: true,
      message: 'Account has been deactivated successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

// @route   POST /api/user/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
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

    if (req.user.isGoogleUser) {
      return res.status(400).json({
        success: false,
        message: 'Google users cannot change password. Please use Google account management.'
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// @route   GET /api/user/export
// @desc    Export user data
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    // This would export all user data for GDPR compliance
    const userData = {
      profile: {
        name: req.user.name,
        email: req.user.email,
        joinedAt: req.user.createdAt,
        preferences: req.user.preferences,
        stats: req.user.stats,
        gamification: req.user.gamification
      },
      // Add tasks, sessions, etc. in a real implementation
      exportedAt: new Date(),
      version: '1.0'
    };

    res.json({
      success: true,
      message: 'User data exported successfully',
      data: userData
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting user data'
    });
  }
});

module.exports = router;