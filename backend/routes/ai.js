const express = require('express');
const { body, validationResult } = require('express-validator');
const OpenAI = require('openai');
const User = require('../models/User');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');
const { auth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Private
router.post('/chat', auth, [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('context')
    .optional()
    .isString()
    .withMessage('Context must be a string')
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured'
      });
    }

    const { message, context } = req.body;
    const user = req.user;

    // Get user context for personalization
    const userContext = await getUserContext(user._id);

    // Create system prompt with user context
    const systemPrompt = `You are FocusMate's AI productivity assistant. You help users stay focused, manage tasks, and improve productivity.

User Profile:
- Name: ${user.name}
- Level: ${user.gamification.level}
- Total XP: ${user.gamification.totalXP}
- Current streak: ${user.gamification.streakDays} days
- Completion rate: ${user.completionRate}%
- Total focus time: ${Math.round(user.stats.totalFocusTime / 60)} hours

Current Context:
${userContext}

Guidelines:
- Be encouraging and supportive
- Provide actionable productivity advice
- Reference their progress and achievements
- Suggest specific techniques like Pomodoro, time-blocking, etc.
- Keep responses concise but helpful
- Use emojis sparingly but appropriately
- Focus on practical solutions

Additional context: ${context || 'None provided'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date(),
        tokens_used: completion.usage.total_tokens
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    
    if (error.type === 'insufficient_quota') {
      return res.status(503).json({
        success: false,
        message: 'AI service quota exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error processing AI request',
      fallback: "I'm having trouble connecting right now. Try breaking your work into smaller chunks and taking regular breaks! 🎯"
    });
  }
});

// @route   POST /api/ai/suggest-tasks
// @desc    Get AI task suggestions based on user data
// @access  Private
router.post('/suggest-tasks', auth, [
  body('category')
    .optional()
    .isIn(['work', 'study', 'fitness', 'personal', 'health', 'creative', 'social', 'other'])
    .withMessage('Invalid category'),
  body('timeAvailable')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('Time available must be between 5 and 480 minutes'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
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

    if (!process.env.OPENAI_API_KEY) {
      // Provide fallback suggestions
      const fallbackSuggestions = [
        { title: 'Review and organize your workspace', category: 'work', estimatedDuration: 15, priority: 'medium' },
        { title: 'Plan tomorrow\'s priorities', category: 'personal', estimatedDuration: 10, priority: 'high' },
        { title: 'Take a 5-minute mindfulness break', category: 'health', estimatedDuration: 5, priority: 'low' },
        { title: 'Read for 20 minutes', category: 'personal', estimatedDuration: 20, priority: 'medium' }
      ];

      return res.json({
        success: true,
        data: {
          suggestions: fallbackSuggestions,
          source: 'fallback'
        }
      });
    }

    const { category, timeAvailable = 30, priority = 'medium' } = req.body;
    const user = req.user;

    // Get user's recent tasks and patterns
    const recentTasks = await Task.find({
      user: user._id,
      createdAt: { $gte: moment().subtract(30, 'days').toDate() }
    }).sort({ createdAt: -1 }).limit(20);

    const taskPatterns = analyzeTaskPatterns(recentTasks);

    const prompt = `Based on this user's productivity patterns, suggest 3-5 specific, actionable tasks:

User Info:
- Preferred categories: ${taskPatterns.preferredCategories.join(', ')}
- Average task duration: ${taskPatterns.avgDuration} minutes
- Most productive time patterns: ${taskPatterns.productiveHours.join(', ')}
- Recent focus areas: ${taskPatterns.recentTopics.join(', ')}

Request:
- Category preference: ${category || 'any'}
- Time available: ${timeAvailable} minutes
- Priority level: ${priority}
- Current time: ${moment().format('HH:mm')} (${moment().format('dddd')})}

Please suggest tasks that:
1. Match the available time
2. Fit the user's patterns
3. Are specific and actionable
4. Include estimated duration
5. Consider the current time/day

Format as JSON array with: title, description, category, estimatedDuration, priority, tags[]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.8
    });

    let suggestions;
    try {
      suggestions = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      suggestions = [
        {
          title: 'Organize your task list',
          description: 'Review and prioritize your current tasks',
          category: category || 'personal',
          estimatedDuration: Math.min(timeAvailable, 20),
          priority: priority,
          tags: ['organization', 'planning']
        }
      ];
    }

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 5), // Limit to 5 suggestions
        timeAvailable,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('AI task suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating task suggestions'
    });
  }
});

// @route   POST /api/ai/analyze-productivity
// @desc    Get AI analysis of user's productivity patterns
// @access  Private
router.post('/analyze-productivity', auth, [
  body('period')
    .optional()
    .isIn(['week', 'month', 'quarter'])
    .withMessage('Period must be week, month, or quarter')
], async (req, res) => {
  try {
    const { period = 'week' } = req.body;
    const user = req.user;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI analysis service is not configured'
      });
    }

    // Get productivity data
    const productivityData = await getProductivityData(user._id, period);

    const prompt = `Analyze this user's productivity data and provide insights:

Period: ${period}
User Level: ${user.gamification.level}
Current Streak: ${user.gamification.streakDays} days

Data:
${JSON.stringify(productivityData, null, 2)}

Provide analysis in the following format:
{
  "summary": "Brief overview of performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["area1", "area2", "area3"],
  "recommendations": ["action1", "action2", "action3"],
  "insights": ["insight1", "insight2"],
  "score": 85
}

Focus on:
- Patterns in focus time and session completion
- Task completion rates and categories
- Distraction patterns
- Optimal working hours
- Improvement opportunities
- Specific actionable recommendations`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.6
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      analysis = {
        summary: "Your productivity journey is showing great progress! Keep building on your current momentum.",
        strengths: ["Consistent daily engagement", "Good task completion rate"],
        improvements: ["Extended focus sessions", "Better time estimation"],
        recommendations: ["Try longer Pomodoro sessions", "Set specific daily goals"],
        insights: ["You're most productive in the morning", "Breaking tasks into smaller chunks helps"],
        score: 75
      };
    }

    // Store analysis for future reference
    const analysisRecord = {
      ...analysis,
      period,
      generatedAt: new Date(),
      dataSnapshot: productivityData
    };

    res.json({
      success: true,
      data: analysisRecord
    });
  } catch (error) {
    console.error('AI productivity analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing productivity data'
    });
  }
});

// @route   POST /api/ai/daily-summary
// @desc    Generate AI-powered daily summary
// @access  Private
router.post('/daily-summary', auth, [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date')
], async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    const user = req.user;

    // Get day's data
    const dayData = await getDayData(user._id, targetDate);

    if (!process.env.OPENAI_API_KEY) {
      // Generate simple summary without AI
      const simpleSummary = {
        date: targetDate,
        summary: `You completed ${dayData.completedSessions} focus sessions and ${dayData.completedTasks} tasks today! 🎉`,
        highlights: [
          `${dayData.totalFocusTime} minutes of focused work`,
          `${dayData.completedTasks}/${dayData.totalTasks} tasks completed`,
          `${dayData.avgFocusScore}% average focus score`
        ],
        insights: ['Keep up the great work!', 'Consistency is key to building productive habits.'],
        tomorrowGoals: ['Start with your most important task', 'Aim for 2+ focus sessions']
      };

      return res.json({
        success: true,
        data: simpleSummary
      });
    }

    const prompt = `Create a motivating daily summary for this productivity data:

Date: ${moment(targetDate).format('MMMM Do, YYYY')}
User: ${user.name} (Level ${user.gamification.level})

Today's Data:
- Focus sessions: ${dayData.completedSessions}/${dayData.totalSessions}
- Total focus time: ${dayData.totalFocusTime} minutes
- Average focus score: ${dayData.avgFocusScore}%
- Tasks completed: ${dayData.completedTasks}/${dayData.totalTasks}
- XP earned: ${dayData.xpEarned}
- Streak: ${user.gamification.streakDays} days

Task categories worked on: ${dayData.categories.join(', ')}
Peak focus hours: ${dayData.peakHours.join(', ')}

Generate a JSON response with:
{
  "summary": "Encouraging 2-3 sentence overview",
  "highlights": ["achievement1", "achievement2", "achievement3"],
  "insights": ["pattern or insight about today's work"],
  "mood": "positive/neutral/encouraging",
  "celebration": "specific achievement to celebrate",
  "tomorrowGoals": ["suggestion1", "suggestion2"],
  "motivationalQuote": "relevant productivity quote"
}

Be encouraging, specific, and personal. Celebrate small wins!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.7
    });

    let summary;
    try {
      summary = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      summary = {
        summary: `Great job today, ${user.name}! You've maintained your ${user.gamification.streakDays}-day streak! 🔥`,
        highlights: [
          `${dayData.totalFocusTime} minutes of focused work`,
          `${dayData.completedTasks} tasks completed`,
          `Level ${user.gamification.level} productivity warrior`
        ],
        insights: ['Every session counts towards building better habits'],
        mood: 'encouraging',
        celebration: 'Showing up consistently',
        tomorrowGoals: ['Start early with your most important task', 'Aim for quality over quantity'],
        motivationalQuote: 'Progress, not perfection.'
      };
    }

    const finalSummary = {
      ...summary,
      date: targetDate,
      stats: dayData,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: finalSummary
    });
  } catch (error) {
    console.error('AI daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating daily summary'
    });
  }
});

// @route   POST /api/ai/motivational-quote
// @desc    Get personalized motivational quote
// @access  Private
router.post('/motivational-quote', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!process.env.OPENAI_API_KEY) {
      const fallbackQuotes = [
        "Focus on progress, not perfection. 🎯",
        "Small steps lead to big achievements. 🚀",
        "Consistency beats intensity. 💪",
        "Your future self will thank you for the work you do today. ✨",
        "Every expert was once a beginner. Keep going! 🌟"
      ];

      return res.json({
        success: true,
        data: {
          quote: fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)],
          source: 'FocusMate'
        }
      });
    }

    const prompt = `Generate a personalized motivational quote for a productivity app user:

User context:
- Level: ${user.gamification.level}
- Streak: ${user.gamification.streakDays} days
- Completion rate: ${user.completionRate}%
- Current time: ${moment().format('HH:mm dddd')}

Make it:
- Encouraging and positive
- Related to productivity/focus
- Personal (use "you" language)
- Include an appropriate emoji
- 1-2 sentences max

Examples of style:
"You've got this! Every small step forward is progress worth celebrating. 🌟"
"Your consistency is your superpower. Keep building that momentum! 🚀"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.8
    });

    const quote = completion.choices[0].message.content.replace(/"/g, '');

    res.json({
      success: true,
      data: {
        quote,
        source: 'FocusMate AI',
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('AI motivational quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating motivational quote'
    });
  }
});

// Helper functions
async function getUserContext(userId) {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const [todaySessions, todayTasks, activeTasks] = await Promise.all([
    FocusSession.find({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }),
    Task.find({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }),
    Task.find({
      user: userId,
      status: { $in: ['pending', 'in-progress'] }
    }).limit(5)
  ]);

  return `Today's activity:
- ${todaySessions.length} focus sessions
- ${todayTasks.filter(t => t.status === 'completed').length} tasks completed
- ${activeTasks.length} active tasks remaining

Recent active tasks: ${activeTasks.map(t => t.title).join(', ')}`;
}

function analyzeTaskPatterns(tasks) {
  const categories = {};
  const durations = [];
  const hours = {};
  const topics = [];

  tasks.forEach(task => {
    categories[task.category] = (categories[task.category] || 0) + 1;
    if (task.actualDuration) durations.push(task.actualDuration);
    
    const hour = new Date(task.createdAt).getHours();
    hours[hour] = (hours[hour] || 0) + 1;
    
    topics.push(...(task.tags || []));
  });

  return {
    preferredCategories: Object.keys(categories).sort((a, b) => categories[b] - categories[a]).slice(0, 3),
    avgDuration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 30,
    productiveHours: Object.keys(hours).sort((a, b) => hours[b] - hours[a]).slice(0, 3),
    recentTopics: [...new Set(topics)].slice(0, 5)
  };
}

async function getProductivityData(userId, period) {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const startDate = moment().subtract(days, 'days').startOf('day').toDate();
  const endDate = moment().endOf('day').toDate();

  const [sessions, tasks] = await Promise.all([
    FocusSession.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    Task.find({
      user: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
  ]);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    totalFocusTime: completedSessions.reduce((sum, s) => sum + s.actualDuration, 0),
    avgFocusScore: completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((sum, s) => sum + s.metrics.focusScore, 0) / completedSessions.length)
      : 0,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    taskCompletionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    totalDistractions: completedSessions.reduce((sum, s) => sum + s.metrics.distractions.count, 0),
    categories: [...new Set(tasks.map(t => t.category))]
  };
}

async function getDayData(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [sessions, tasks] = await Promise.all([
    FocusSession.find({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }),
    Task.find({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
  ]);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Calculate peak hours
  const hourCounts = {};
  completedSessions.forEach(session => {
    if (session.startTime) {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const peakHours = Object.keys(hourCounts)
    .sort((a, b) => hourCounts[b] - hourCounts[a])
    .slice(0, 2)
    .map(h => `${h}:00`);

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    totalFocusTime: completedSessions.reduce((sum, s) => sum + s.actualDuration, 0),
    avgFocusScore: completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((sum, s) => sum + s.metrics.focusScore, 0) / completedSessions.length)
      : 0,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    xpEarned: completedSessions.reduce((sum, s) => sum + s.xpEarned, 0),
    categories: [...new Set(tasks.map(t => t.category))],
    peakHours
  };
}

module.exports = router;