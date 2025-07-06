const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Session Details
  title: {
    type: String,
    default: 'Focus Session'
  },
  type: {
    type: String,
    enum: ['pomodoro', 'custom', 'deep-work', 'study', 'break'],
    default: 'pomodoro'
  },
  
  // Time Tracking
  plannedDuration: {
    type: Number, // in minutes
    required: true,
    min: [1, 'Session must be at least 1 minute'],
    max: [480, 'Session cannot exceed 8 hours']
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled', 'paused'],
    default: 'scheduled'
  },
  
  // Timestamps
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  pausedAt: {
    type: Date
  },
  resumedAt: {
    type: Date
  },
  
  // Associated Tasks
  tasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Goals and Objectives
  goals: [{
    description: String,
    achieved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Productivity Metrics
  metrics: {
    distractions: {
      count: { type: Number, default: 0 },
      details: [{
        timestamp: Date,
        type: {
          type: String,
          enum: ['website', 'notification', 'manual', 'other']
        },
        description: String,
        duration: Number // seconds
      }]
    },
    focusScore: {
      type: Number, // 0-100
      default: 100
    },
    productivity: {
      type: String,
      enum: ['very-low', 'low', 'medium', 'high', 'very-high'],
      default: 'medium'
    }
  },
  
  // Environment & Settings
  environment: {
    backgroundMusic: String,
    soundEnabled: { type: Boolean, default: true },
    theme: String,
    blockedSites: [String],
    allowedSites: [String]
  },
  
  // Pomodoro Specific
  pomodoroConfig: {
    sessionNumber: { type: Number, default: 1 },
    totalSessions: { type: Number, default: 4 },
    isBreakSession: { type: Boolean, default: false },
    breakType: {
      type: String,
      enum: ['short', 'long'],
      default: 'short'
    }
  },
  
  // Notes and Reflection
  notes: {
    before: String, // What you plan to achieve
    during: String, // Thoughts during session
    after: String  // Reflection and learnings
  },
  
  // Mood Tracking
  mood: {
    before: {
      type: String,
      enum: ['very-bad', 'bad', 'neutral', 'good', 'very-good']
    },
    after: {
      type: String,
      enum: ['very-bad', 'bad', 'neutral', 'good', 'very-good']
    },
    energy: {
      before: { type: Number, min: 1, max: 10 },
      after: { type: Number, min: 1, max: 10 }
    },
    motivation: {
      before: { type: Number, min: 1, max: 10 },
      after: { type: Number, min: 1, max: 10 }
    }
  },
  
  // Gamification
  xpEarned: {
    type: Number,
    default: 0
  },
  achievements: [{
    id: String,
    name: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  
  // AI Analysis
  aiAnalysis: {
    summary: String,
    recommendations: [String],
    patterns: [String],
    generatedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session efficiency
focusSessionSchema.virtual('efficiency').get(function() {
  if (!this.plannedDuration || !this.actualDuration) return 0;
  return Math.round((this.actualDuration / this.plannedDuration) * 100);
});

// Virtual for focus percentage (100 - distraction impact)
focusSessionSchema.virtual('focusPercentage').get(function() {
  const distractionCount = this.metrics.distractions.count;
  const sessionMinutes = this.actualDuration || this.plannedDuration;
  
  // Calculate distraction impact (each distraction reduces focus by 2-5%)
  const distractionImpact = Math.min(distractionCount * 3, 50); // Max 50% impact
  return Math.max(100 - distractionImpact, 0);
});

// Virtual for total pause time
focusSessionSchema.virtual('totalPauseTime').get(function() {
  // This would be calculated based on pause/resume events
  // For now, return 0 - implement pause tracking in future versions
  return 0;
});

// Virtual for session rating
focusSessionSchema.virtual('rating').get(function() {
  const efficiency = this.efficiency;
  const focusPercentage = this.focusPercentage;
  const avgScore = (efficiency + focusPercentage) / 2;
  
  if (avgScore >= 90) return 'excellent';
  if (avgScore >= 75) return 'good';
  if (avgScore >= 60) return 'average';
  if (avgScore >= 40) return 'poor';
  return 'very-poor';
});

// Indexes
focusSessionSchema.index({ user: 1, createdAt: -1 });
focusSessionSchema.index({ user: 1, status: 1 });
focusSessionSchema.index({ user: 1, type: 1 });
focusSessionSchema.index({ startTime: 1, endTime: 1 });

// Pre-save middleware
focusSessionSchema.pre('save', function(next) {
  // Calculate actual duration when session ends
  if (this.isModified('endTime') && this.startTime && this.endTime) {
    this.actualDuration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  // Calculate XP when session completes
  if (this.isModified('status') && this.status === 'completed' && this.xpEarned === 0) {
    this.xpEarned = this.calculateXP();
  }
  
  // Update focus score based on distractions
  if (this.metrics.distractions.count !== undefined) {
    this.metrics.focusScore = this.focusPercentage;
  }
  
  next();
});

// Method to start session
focusSessionSchema.methods.start = function() {
  this.status = 'active';
  this.startTime = new Date();
  return this.save();
};

// Method to pause session
focusSessionSchema.methods.pause = function() {
  this.status = 'paused';
  this.pausedAt = new Date();
  return this.save();
};

// Method to resume session
focusSessionSchema.methods.resume = function() {
  this.status = 'active';
  this.resumedAt = new Date();
  this.pausedAt = undefined;
  return this.save();
};

// Method to complete session
focusSessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.endTime = new Date();
  return this.save();
};

// Method to add distraction
focusSessionSchema.methods.addDistraction = function(type, description, duration = 0) {
  this.metrics.distractions.details.push({
    timestamp: new Date(),
    type,
    description,
    duration
  });
  this.metrics.distractions.count += 1;
  return this.save();
};

// Method to calculate XP earned
focusSessionSchema.methods.calculateXP = function() {
  let baseXP = Math.round(this.plannedDuration * 2); // 2 XP per planned minute
  
  // Efficiency bonus
  const efficiency = this.efficiency;
  if (efficiency >= 100) baseXP *= 1.5;
  else if (efficiency >= 80) baseXP *= 1.2;
  else if (efficiency < 50) baseXP *= 0.7;
  
  // Focus bonus (fewer distractions = more XP)
  const focusPercentage = this.focusPercentage;
  if (focusPercentage >= 95) baseXP *= 1.3;
  else if (focusPercentage >= 80) baseXP *= 1.1;
  else if (focusPercentage < 60) baseXP *= 0.8;
  
  // Session type multiplier
  const typeMultiplier = {
    'pomodoro': 1.0,
    'custom': 1.0,
    'deep-work': 1.2,
    'study': 1.1,
    'break': 0.5
  };
  baseXP *= typeMultiplier[this.type] || 1.0;
  
  // Completion bonus
  if (this.status === 'completed') {
    baseXP += 10;
  }
  
  return Math.round(baseXP);
};

// Static method to get today's sessions
focusSessionSchema.statics.getTodaySessions = function(userId) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    user: userId,
    createdAt: {
      $gte: today.setHours(0, 0, 0, 0),
      $lt: tomorrow.setHours(0, 0, 0, 0)
    }
  }).populate('tasks.task').sort({ createdAt: -1 });
};

// Static method to get productivity stats
focusSessionSchema.statics.getProductivityStats = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalSessions: { $sum: 1 },
        totalTime: { $sum: '$actualDuration' },
        avgFocusScore: { $avg: '$metrics.focusScore' },
        totalXP: { $sum: '$xpEarned' },
        totalDistractions: { $sum: '$metrics.distractions.count' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('FocusSession', focusSessionSchema);