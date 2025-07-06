const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['work', 'study', 'fitness', 'personal', 'health', 'creative', 'social', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Time Management
  estimatedDuration: {
    type: Number, // in minutes
    min: [1, 'Estimated duration must be at least 1 minute'],
    max: [480, 'Estimated duration cannot exceed 8 hours']
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },
  
  // Scheduling
  dueDate: {
    type: Date
  },
  scheduledDate: {
    type: Date
  },
  reminderTime: {
    type: Date
  },
  
  // Organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  order: {
    type: Number,
    default: 0
  },
  
  // Completion Details
  completedAt: {
    type: Date
  },
  completionNotes: {
    type: String,
    maxlength: [500, 'Completion notes cannot exceed 500 characters']
  },
  
  // Recurring Tasks
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom']
    },
    interval: {
      type: Number,
      min: 1
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    endDate: Date,
    maxOccurrences: Number
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  
  // Subtasks
  subtasks: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Subtask title cannot exceed 100 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // Progress Tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Focus Sessions Associated
  focusSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FocusSession'
  }],
  
  // Gamification
  xpValue: {
    type: Number,
    default: function() {
      const priorityXP = {
        low: 10,
        medium: 20,
        high: 30,
        urgent: 50
      };
      return priorityXP[this.priority] || 20;
    }
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['manual', 'ai-suggested', 'imported'],
    default: 'manual'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion percentage based on subtasks
taskSchema.virtual('subtaskCompletion').get(function() {
  if (this.subtasks.length === 0) return 100;
  const completed = this.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for time remaining
taskSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const timeDiff = this.dueDate - now;
  
  if (timeDiff <= 0) return { overdue: true };
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, overdue: false };
});

// Indexes
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, category: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ scheduledDate: 1 });

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Update progress based on subtasks if they exist
  if (this.subtasks.length > 0) {
    const completed = this.subtasks.filter(subtask => subtask.completed).length;
    this.progress = Math.round((completed / this.subtasks.length) * 100);
    
    // Auto-complete task if all subtasks are done
    if (this.progress === 100 && this.status !== 'completed') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
  }
  
  // Set completion date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    if (this.progress < 100) this.progress = 100;
  }
  
  // Clear completion date if status changes from completed
  if (this.isModified('status') && this.status !== 'completed') {
    this.completedAt = undefined;
  }
  
  next();
});

// Method to toggle subtask completion
taskSchema.methods.toggleSubtask = function(subtaskId) {
  const subtask = this.subtasks.id(subtaskId);
  if (subtask) {
    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : undefined;
    return this.save();
  }
  return Promise.reject(new Error('Subtask not found'));
};

// Method to add subtask
taskSchema.methods.addSubtask = function(title, order = 0) {
  this.subtasks.push({
    title,
    order: order || this.subtasks.length,
    completed: false
  });
  return this.save();
};

// Method to calculate XP for completion
taskSchema.methods.calculateCompletionXP = function() {
  let baseXP = this.xpValue;
  
  // Bonus for completing on time
  if (this.dueDate && new Date() <= this.dueDate) {
    baseXP *= 1.2;
  }
  
  // Bonus for difficulty
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.2,
    hard: 1.5
  };
  baseXP *= difficultyMultiplier[this.difficulty] || 1;
  
  // Bonus for priority
  const priorityBonus = {
    low: 0,
    medium: 5,
    high: 10,
    urgent: 20
  };
  baseXP += priorityBonus[this.priority] || 0;
  
  return Math.round(baseXP);
};

// Static method to get tasks due today
taskSchema.statics.getDueToday = function(userId) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.find({
    user: userId,
    dueDate: {
      $gte: today.setHours(0, 0, 0, 0),
      $lt: tomorrow.setHours(0, 0, 0, 0)
    },
    status: { $ne: 'completed' }
  }).sort({ priority: -1, dueDate: 1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdue = function(userId) {
  return this.find({
    user: userId,
    dueDate: { $lt: new Date() },
    status: { $ne: 'completed' }
  }).sort({ dueDate: 1 });
};

module.exports = mongoose.model('Task', taskSchema);