const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // OAuth
  googleId: {
    type: String,
    sparse: true
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  },
  
  // Profile Settings
  timezone: {
    type: String,
    default: 'UTC'
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  colorScheme: {
    type: String,
    enum: ['blue', 'green', 'purple', 'orange', 'pink'],
    default: 'blue'
  },
  
  // Preferences
  preferences: {
    notifications: {
      breakReminder: { type: Boolean, default: true },
      hydrationAlert: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true }
    },
    focus: {
      defaultSessionDuration: { type: Number, default: 25 }, // minutes
      breakDuration: { type: Number, default: 5 },
      longBreakDuration: { type: Number, default: 15 },
      sessionsBeforeLongBreak: { type: Number, default: 4 },
      soundEnabled: { type: Boolean, default: true },
      backgroundMusic: { type: String, default: 'none' }
    },
    blocklist: [{
      url: String,
      enabled: { type: Boolean, default: true }
    }],
    allowlist: [{
      url: String,
      enabled: { type: Boolean, default: true }
    }]
  },
  
  // Gamification
  gamification: {
    level: { type: Number, default: 1 },
    totalXP: { type: Number, default: 0 },
    focusPoints: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    badges: [{
      id: String,
      name: String,
      description: String,
      earnedAt: { type: Date, default: Date.now },
      icon: String
    }]
  },
  
  // Stats
  stats: {
    totalFocusTime: { type: Number, default: 0 }, // minutes
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    perfectDays: { type: Number, default: 0 }, // days with all tasks completed
    distractionsAvoided: { type: Number, default: 0 }
  },
  
  // Account Management
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Admin
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for completion rate
userSchema.virtual('completionRate').get(function() {
  if (this.stats.totalTasks === 0) return 0;
  return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
});

// Virtual for current level progress
userSchema.virtual('levelProgress').get(function() {
  const xpForNextLevel = this.gamification.level * 1000;
  const xpForCurrentLevel = (this.gamification.level - 1) * 1000;
  const currentLevelXP = this.gamification.totalXP - xpForCurrentLevel;
  return {
    current: currentLevelXP,
    required: xpForNextLevel - xpForCurrentLevel,
    percentage: Math.round((currentLevelXP / (xpForNextLevel - xpForCurrentLevel)) * 100)
  };
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'gamification.totalXP': -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add XP and check for level up
userSchema.methods.addXP = function(amount) {
  this.gamification.totalXP += amount;
  const newLevel = Math.floor(this.gamification.totalXP / 1000) + 1;
  
  if (newLevel > this.gamification.level) {
    this.gamification.level = newLevel;
    return { levelUp: true, newLevel };
  }
  
  return { levelUp: false, newLevel: this.gamification.level };
};

// Method to update streak
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActive = new Date(this.gamification.lastActiveDate);
  
  // Check if it's a new day
  if (today.toDateString() !== lastActive.toDateString()) {
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.gamification.streakDays += 1;
      if (this.gamification.streakDays > this.gamification.longestStreak) {
        this.gamification.longestStreak = this.gamification.streakDays;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      this.gamification.streakDays = 1;
    }
    
    this.gamification.lastActiveDate = today;
  }
};

// Method to add badge
userSchema.methods.addBadge = function(badgeData) {
  const existingBadge = this.gamification.badges.find(badge => badge.id === badgeData.id);
  if (!existingBadge) {
    this.gamification.badges.push(badgeData);
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);