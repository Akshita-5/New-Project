import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { 
  HomeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { selectSidebarOpen, selectIsMobile } from '../../store/slices/uiSlice';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Focus', href: '/focus', icon: ClockIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
];

const Sidebar = () => {
  const location = useLocation();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const isMobile = useSelector(selectIsMobile);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 pt-5 pb-4 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="text-2xl">🎯</div>
            <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
              FocusMate
            </h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={classNames(
                      isActive
                        ? 'text-primary-500 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={classNames(
          'lg:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="text-2xl">🎯</div>
            <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
              FocusMate
            </h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={classNames(
                      isActive
                        ? 'text-primary-500 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;