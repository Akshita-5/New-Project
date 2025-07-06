import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { setCurrentPage } from '../store/slices/uiSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Layout from '../components/common/Layout';

const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    dispatch(setCurrentPage({ page: 'dashboard', title: 'Dashboard' }));
  }, [dispatch]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-4xl">🎯</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Welcome back,
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📋</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Tasks Today
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">⏰</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Focus Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      0min
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🏆</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Current Streak
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      0 days
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">⭐</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Level
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      1
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button className="btn-primary">
                Start Focus Session
              </button>
              <button className="btn-secondary">
                Add New Task
              </button>
              <button className="btn-secondary">
                View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="text-xl">🚧</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Dashboard Under Construction
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <p>
                  The full dashboard with task management, focus timer, and analytics is currently being built. 
                  The backend API is complete and ready to use!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;