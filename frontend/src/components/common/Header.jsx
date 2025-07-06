import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bars3Icon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import { selectTheme, toggleTheme, toggleSidebar } from '../../store/slices/uiSlice';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="hidden lg:block">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                🎯 FocusMate
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Level 1
                  </p>
                </div>
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;