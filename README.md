# 🎯 FocusMate - Complete MERN Stack Productivity Application

A modern, full-stack productivity application built with **Vite + React** frontend and **Node.js + Express** backend. FocusMate helps users manage tasks and boost productivity with focus sessions.

## ✨ Features

### 🔐 **Authentication System**
- User registration and login
- JWT-based authentication
- Protected routes
- Password validation
- Google OAuth ready

### 📋 **Task Management**
- Create, edit, delete tasks
- Priority levels (Low, Medium, High, Urgent)
- Categories (Work, Study, Fitness, Personal, etc.)
- Due dates and time estimation
- Subtasks and progress tracking
- Advanced filtering and search

### ⏰ **Focus Sessions**
- Pomodoro timer (25-minute focus sessions)
- Customizable work and break intervals
- Session tracking and analytics
- Visual progress indicators
- Productivity insights

### � **Modern UI/UX**
- Responsive design (mobile & desktop)
- Dark/Light theme toggle
- Professional interface
- Loading states and error handling
- Toast notifications

## � Tech Stack

### **Frontend (Vite + React)**
- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form handling
- **Axios** - API requests
- **React Query** - Server state management
- **Heroicons** - Beautiful icons

### **Backend (Node.js + Express)**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Multer** - File uploads
- **CORS** - Cross-origin requests

## 🚀 Quick Start

### **Prerequisites**
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd focusmate
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup:**

   **Backend (.env):**
   ```env
   MONGODB_URI=mongodb://localhost:27017/focusmate
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   PORT=5000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   OPENAI_API_KEY=your-openai-api-key
   ```

   **Frontend (.env):**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. **Start the application:**

   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm start
   ```

   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## 📁 Project Structure

```
focusmate/
├── backend/                 # Express.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── uploads/           # File uploads
│   ├── utils/             # Helper utilities
│   ├── .env.example       # Environment template
│   ├── package.json       # Backend dependencies
│   └── server.js          # Entry point
├── frontend/               # Vite + React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── common/    # Shared components
│   │   │   ├── tasks/     # Task management
│   │   │   └── focus/     # Focus timer
│   │   ├── pages/         # Page components
│   │   │   ├── auth/      # Login/Register
│   │   │   └── *.jsx      # Main pages
│   │   ├── store/         # Redux store
│   │   │   └── slices/    # Redux slices
│   │   ├── services/      # API services
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.js     # Vite configuration
│   └── tailwind.config.js # Tailwind configuration
├── README.md              # This file
└── .gitignore            # Git ignore rules
```

## 🔧 Available Scripts

### **Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### **Backend**
```bash
npm start            # Start production server
npm run dev          # Start development server with nodemon
npm test             # Run tests
```

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### **Tasks**
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### **Focus Sessions**
- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create new session
- `POST /api/sessions/:id/start` - Start session
- `POST /api/sessions/:id/pause` - Pause session
- `POST /api/sessions/:id/complete` - Complete session

## 🎯 Current Status

### **✅ Completed Features**
- ✅ Full authentication system
- ✅ Responsive layout with navigation
- ✅ Dark/Light theme support
- ✅ Redux store setup
- ✅ API integration layer
- ✅ Backend API with all endpoints
- ✅ Database models and relationships
- ✅ Form validation and error handling

### **🚧 Ready for Implementation**
- Task management interface
- Focus timer with circular progress
- Analytics dashboard
- User settings panel
- Gamification features

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting ready
- Environment variable protection

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Adaptive layouts

## 🌟 Why Vite?

- ⚡ **Lightning fast** - Instant HMR and fast builds
- 🔧 **No conflicts** - Modern dependency resolution
- 📦 **Optimized** - Tree-shaking and code splitting
- 🛠 **Better DX** - Excellent development experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## � License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with modern React and Node.js best practices
- UI inspired by modern productivity applications
- Icons provided by Heroicons
- Styling powered by Tailwind CSS

---

**Ready to boost your productivity? Get started with FocusMate!** 🚀
