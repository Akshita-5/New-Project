import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '../store/slices/uiSlice';
import FocusTimer from '../components/focus/FocusTimer';

const Focus = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setCurrentPage({ page: 'focus', title: 'Focus Sessions' }));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ⏰ Focus Sessions
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Boost your productivity with focused work sessions
        </p>
      </div>

      {/* Focus Timer */}
      <FocusTimer />
    </div>
  );
};

export default Focus;