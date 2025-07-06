# 🎯 FocusMate - AI-Powered Productivity Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%5E18.2.0-blue)](https://reactjs.org/)

FocusMate is a comprehensive MERN stack productivity application that helps users avoid distractions, increase focus, and manage daily work/study routines with AI-powered insights and gamification.

## 🌟 Features

### 🔐 Authentication & User Management
- **Email/Password Registration & Login** with validation
- **Google OAuth Integration** for seamless sign-in
- **Password Reset** via email with secure tokens
- **Profile Management** with avatars and preferences
- **Email Verification** system

### 🎯 Focus Sessions & Pomodoro
- **Customizable Focus Sessions** (Pomodoro, custom durations)
- **Real-time Timer** with beautiful circular progress bars
- **Session Types**: Pomodoro, Deep Work, Study, Custom
- **Break Management** with automatic notifications
- **Distraction Tracking** and logging
- **Session Analytics** with focus scores

### 📋 Advanced Task Management
- **CRUD Operations** for tasks with categories
- **Priority Levels**: Low, Medium, High, Urgent
- **Due Dates & Scheduling** with calendar integration
- **Subtasks** with progress tracking
- **Drag & Drop Reordering** with react-beautiful-dnd
- **Task Categories**: Work, Study, Fitness, Personal, Health, etc.
- **Tags & Search** functionality
- **Recurring Tasks** support

### 🤖 AI-Powered Features
- **Intelligent Chatbot** for productivity advice
- **Task Suggestions** based on user patterns
- **Productivity Analysis** with personalized insights
- **Daily Summaries** with motivational content
- **Smart Recommendations** for improving focus habits

### 🏆 Gamification System
- **XP & Leveling System** with 25+ levels
- **Achievement Badges** with multiple categories:
  - 🎯 Milestone badges (first task, 10 tasks, 50 tasks, 100 tasks)
  - 🔥 Streak badges (3-day, 7-day, 30-day streaks)
  - 🧠 Focus badges (10h, 50h, 100h focus time)
  - ⭐ Level badges (Level 5, 10, 25)
  - 🎪 Special achievements (Early Bird, Night Owl, Perfect Day)
- **Leaderboards** with multiple metrics
- **Daily Streaks** tracking and motivation
- **Progress Tracking** with visual indicators

### 📊 Analytics & Reporting
- **Dashboard Analytics** with comprehensive metrics
- **Productivity Charts** using Recharts
- **Weekly/Monthly Reports** with AI-generated insights
- **Focus Time Trends** and patterns analysis
- **Task Completion Statistics** by category
- **Exportable Reports** (PDF generation ready)

### 🎨 Modern UI/UX
- **Responsive Design** for all devices
- **Dark/Light Mode** toggle
- **Beautiful Animations** with Framer Motion
- **Tailwind CSS** with custom design system
- **Micro-interactions** and smooth transitions
- **Confetti Celebrations** for achievements
- **Toast Notifications** with react-hot-toast

### ⚙️ Settings & Personalization
- **Theme Customization** (5 color schemes)
- **Focus Preferences** (session durations, break times)
- **Notification Settings** (break reminders, daily summaries)
- **Blocklist/Allowlist** for distraction management
- **Timezone Configuration**

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── models/           # MongoDB schemas
│   ├── User.js      # User model with gamification
│   ├── Task.js      # Task model with subtasks
│   └── FocusSession.js # Session tracking
├── routes/          # API endpoints
│   ├── auth.js      # Authentication routes
│   ├── tasks.js     # Task management
│   ├── sessions.js  # Focus sessions
│   ├── user.js      # User profile
│   ├── analytics.js # Reports & charts
│   ├── ai.js        # OpenAI integration
│   └── gamification.js # XP & badges
├── middleware/      # Custom middleware
├── config/          # Configuration files
└── utils/           # Utility functions
```

### Frontend (React.js)
```
frontend/src/
├── components/      # Reusable UI components
├── pages/          # Main application pages
├── store/          # Redux Toolkit store
├── hooks/          # Custom React hooks
├── services/       # API service functions
├── utils/          # Helper functions
└── styles/         # Tailwind CSS styles
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/focusmate.git
cd focusmate
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Environment Setup**

Create `backend/.env`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/focusmate

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. **Start the application**
```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000) concurrently.

## 📱 Usage Guide

### Getting Started
1. **Sign Up** with email or Google OAuth
2. **Complete Profile** setup with preferences
3. **Create Your First Task** and start focusing!

### Focus Sessions
1. Click **"Start Focus Session"** on dashboard
2. Select **session type** and duration
3. **Add tasks** to work on during session
4. Click **"Start"** and focus!
5. Track distractions and take breaks as needed

### Task Management
- **Add Task**: Click "+" button, fill details
- **Edit Task**: Click on task to modify
- **Complete Task**: Check the checkbox
- **Drag & Drop**: Reorder tasks by dragging
- **Categories**: Organize by work, study, personal, etc.

### AI Features
- **Chat**: Ask the AI assistant for productivity tips
- **Suggestions**: Get personalized task recommendations
- **Analysis**: Receive insights on your productivity patterns

### Gamification
- **Earn XP**: Complete tasks and focus sessions
- **Level Up**: Gain levels and unlock new features
- **Badges**: Earn achievements for various milestones
- **Streaks**: Maintain daily activity streaks

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon
```

### Frontend Development
```bash
cd frontend
npm start   # Starts React dev server
```

### Database
The app uses MongoDB with Mongoose ODM. Models include:
- **User**: Authentication, preferences, gamification data
- **Task**: Todo items with categories and priorities
- **FocusSession**: Pomodoro and focus session tracking

### API Documentation
Key API endpoints:

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `POST /api/auth/forgot-password` - Password reset

**Tasks**
- `GET /api/tasks` - Get user tasks (with filtering)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

**Focus Sessions**
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id/start` - Start session
- `PUT /api/sessions/:id/complete` - Complete session

**AI Features**
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/suggest-tasks` - Get task suggestions
- `POST /api/ai/daily-summary` - Generate daily summary

## 🎨 Customization

### Themes
FocusMate supports 5 color schemes:
- **Blue** (default)
- **Green** 
- **Purple**
- **Orange**
- **Pink**

### Adding New Features
1. **Backend**: Add routes in `/routes`, models in `/models`
2. **Frontend**: Add components in `/components`, pages in `/pages`
3. **State**: Update Redux store in `/store`

## 🌐 Deployment

### Backend (Render/Railway)
1. Create new service
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`
4. Deploy

### Database (MongoDB Atlas)
1. Create cluster
2. Get connection string
3. Update `MONGODB_URI` in environment

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for AI-powered features
- **Tailwind CSS** for beautiful styling
- **React ecosystem** for amazing libraries
- **MongoDB** for flexible data storage
- **All contributors** who help improve FocusMate

## 📞 Support

- 📧 Email: support@focusmate.app
- 💬 Discord: [FocusMate Community](https://discord.gg/focusmate)
- 📖 Documentation: [docs.focusmate.app](https://docs.focusmate.app)

---

**Start your productivity journey with FocusMate today! 🚀**

*Built with ❤️ by the FocusMate team*
