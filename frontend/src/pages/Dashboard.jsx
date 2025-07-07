import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';

const Dashboard = () => {
  const user = useSelector(selectUser);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ready to boost your productivity with FocusMate?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📋</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tasks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your tasks</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">⏰</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Focus Timer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stay focused with Pomodoro</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📊</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;