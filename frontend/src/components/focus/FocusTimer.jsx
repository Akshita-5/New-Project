import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  selectCurrentTimer, 
  selectActiveSession,
  startTimer,
  pauseTimer,
  resetTimer,
  tickTimer,
  setQuickSession,
  createSession,
  startSession,
  pauseSession,
  completeSession
} from '../../store/slices/sessionSlice';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const FocusTimer = () => {
  const dispatch = useDispatch();
  const timer = useSelector(selectCurrentTimer);
  const activeSession = useSelector(selectActiveSession);

  // Timer interval
  useEffect(() => {
    let interval = null;
    
    if (timer.isRunning && timer.timeRemaining > 0) {
      interval = setInterval(() => {
        dispatch(tickTimer());
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.timeRemaining, dispatch]);

  const handleStart = async () => {
    if (!activeSession) {
      // Create new session
      const sessionData = {
        type: timer.type,
        duration: timer.duration,
        targetTasks: [], // Could be populated from task selection
      };
      
      try {
        const session = await dispatch(createSession(sessionData)).unwrap();
        await dispatch(startSession(session._id));
        dispatch(startTimer());
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    } else {
      // Resume existing session
      if (timer.isPaused) {
        dispatch(startSession(activeSession._id));
      }
      dispatch(startTimer());
    }
  };

  const handlePause = () => {
    dispatch(pauseTimer());
    if (activeSession) {
      dispatch(pauseSession(activeSession._id));
    }
  };

  const handleStop = () => {
    if (activeSession) {
      const sessionData = {
        completedAt: new Date().toISOString(),
        productivity: 8, // Could be user input
        mood: 'focused', // Could be user input
      };
      dispatch(completeSession({ id: activeSession._id, sessionData }));
    }
    dispatch(resetTimer());
  };

  const handleReset = () => {
    dispatch(resetTimer());
  };

  const handleQuickSession = (type, duration) => {
    dispatch(setQuickSession({ type, duration }));
  };

  const quickSessions = [
    { type: 'pomodoro', duration: 1500, label: '25 min', description: 'Pomodoro', color: 'bg-red-500' },
    { type: 'short-break', duration: 300, label: '5 min', description: 'Short Break', color: 'bg-green-500' },
    { type: 'long-break', duration: 900, label: '15 min', description: 'Long Break', color: 'bg-blue-500' },
    { type: 'deep-work', duration: 3000, label: '50 min', description: 'Deep Work', color: 'bg-purple-500' },
  ];

  const getTimerColor = () => {
    if (timer.timeRemaining <= 60) return '#ef4444'; // Red for last minute
    if (timer.timeRemaining <= 300) return '#f97316'; // Orange for last 5 minutes
    return '#3b82f6'; // Blue for normal
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Timer Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
        <div className="text-center">
          {/* Session Type */}
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              {timer.type.charAt(0).toUpperCase() + timer.type.slice(1).replace('-', ' ')}
            </span>
          </div>

          {/* Circular Timer */}
          <div className="w-64 h-64 mx-auto mb-6">
            <CircularProgressbar
              value={timer.progress}
              text={timer.formattedTime}
              strokeWidth={8}
              styles={buildStyles({
                pathColor: getTimerColor(),
                textColor: '#374151',
                trailColor: '#e5e7eb',
                textSize: '16px',
                pathTransitionDuration: 1,
              })}
            />
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!timer.isRunning && !timer.isPaused && (
              <button
                onClick={handleStart}
                className="flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                title="Start Timer"
              >
                <PlayIcon className="h-8 w-8 ml-1" />
              </button>
            )}

            {timer.isRunning && (
              <button
                onClick={handlePause}
                className="flex items-center justify-center w-16 h-16 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
                title="Pause Timer"
              >
                <PauseIcon className="h-8 w-8" />
              </button>
            )}

            {timer.isPaused && (
              <button
                onClick={handleStart}
                className="flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                title="Resume Timer"
              >
                <PlayIcon className="h-8 w-8 ml-1" />
              </button>
            )}

            <button
              onClick={handleStop}
              className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              title="Stop Timer"
            >
              <StopIcon className="h-6 w-6" />
            </button>

            <button
              onClick={handleReset}
              className="flex items-center justify-center w-12 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
              title="Reset Timer"
            >
              <ArrowPathIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Session Status */}
          {activeSession && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Session in progress • Started {new Date(activeSession.startedAt).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Session Presets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Quick Sessions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickSessions.map((session) => (
            <button
              key={session.type}
              onClick={() => handleQuickSession(session.type, session.duration)}
              disabled={timer.isRunning}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${timer.type === session.type 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${timer.isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
              `}
            >
              <div className={`w-3 h-3 ${session.color} rounded-full mb-2`} />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white text-sm">
                  {session.description}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {session.label}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">💡 Focus Tips</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Remove distractions from your workspace</li>
          <li>• Use the Pomodoro technique: 25 min work + 5 min break</li>
          <li>• Take longer breaks every 4 sessions</li>
          <li>• Stay hydrated and maintain good posture</li>
        </ul>
      </div>
    </div>
  );
};

export default FocusTimer;