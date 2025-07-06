const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const templates = {
  emailVerification: (context) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Welcome to FocusMate!</h1>
        </div>
        <div class="content">
          <h2>Hi ${context.name}!</h2>
          <p>Thank you for joining FocusMate - your AI-powered productivity companion!</p>
          <p>To get started and unlock all features, please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${context.verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Once verified, you'll be able to:</p>
          <ul>
            <li>🚀 Start focus sessions with Pomodoro technique</li>
            <li>📝 Create and manage your tasks</li>
            <li>🏆 Earn XP and unlock achievements</li>
            <li>📊 View detailed analytics and insights</li>
            <li>🤖 Get AI-powered productivity recommendations</li>
          </ul>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 FocusMate. Built to help you stay focused and productive.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (context) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${context.name}!</h2>
          <p>We received a request to reset your FocusMate password.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${context.resetUrl}" class="button">Reset Password</a>
          </p>
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password won't change until you create a new one</li>
            </ul>
          </div>
          <p>For security reasons, we recommend using a strong password that includes:</p>
          <ul>
            <li>At least 8 characters</li>
            <li>Upper and lowercase letters</li>
            <li>Numbers and special characters</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2024 FocusMate. Stay secure, stay focused.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  dailySummary: (context) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
        .achievement { background: #e8f5e8; border-left: 4px solid #27ae60; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Daily Summary</h1>
          <p>${context.date}</p>
        </div>
        <div class="content">
          <h2>Great work today, ${context.name}! 🎉</h2>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-number">${context.focusTime}m</div>
              <div>Focus Time</div>
            </div>
            <div class="stat">
              <div class="stat-number">${context.tasksCompleted}</div>
              <div>Tasks Done</div>
            </div>
            <div class="stat">
              <div class="stat-number">${context.xpEarned}</div>
              <div>XP Earned</div>
            </div>
          </div>

          ${context.achievements && context.achievements.length > 0 ? `
            <h3>🏆 New Achievements</h3>
            ${context.achievements.map(achievement => `
              <div class="achievement">
                <strong>${achievement.name}</strong> - ${achievement.description}
              </div>
            `).join('')}
          ` : ''}

          <h3>🤖 AI Insights</h3>
          <p>${context.aiInsight || 'Keep up the great work! Consistency is key to building productive habits.'}</p>

          <h3>📅 Tomorrow's Focus</h3>
          <p>You have ${context.upcomingTasks || 0} tasks scheduled for tomorrow. Start your day with a focus session!</p>
        </div>
        <div class="footer">
          <p>© 2024 FocusMate. Building better habits, one day at a time.</p>
        </div>
      </div>
    </body>
    </html>
  `
};

// Send email function
const sendEmail = async ({ to, subject, template, context, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured, skipping email send');
      return;
    }

    const transporter = createTransporter();

    // Use template if provided, otherwise use html directly
    const emailHtml = template ? templates[template](context) : html;

    const mailOptions = {
      from: {
        name: 'FocusMate',
        address: process.env.EMAIL_USER
      },
      to,
      subject,
      html: emailHtml
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: '🎯 Welcome to FocusMate - Let\'s boost your productivity!',
    template: 'emailVerification',
    context: {
      name: user.name,
      verificationUrl: `${process.env.CLIENT_URL}/verify-email/${user.emailVerificationToken}`
    }
  });
};

// Send daily summary email
const sendDailySummaryEmail = async (user, summaryData) => {
  return sendEmail({
    to: user.email,
    subject: `📊 Your Daily Summary - ${summaryData.date}`,
    template: 'dailySummary',
    context: {
      name: user.name,
      date: summaryData.date,
      focusTime: summaryData.focusTime,
      tasksCompleted: summaryData.tasksCompleted,
      xpEarned: summaryData.xpEarned,
      achievements: summaryData.achievements,
      aiInsight: summaryData.aiInsight,
      upcomingTasks: summaryData.upcomingTasks
    }
  });
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendDailySummaryEmail,
  testEmailConfig
};