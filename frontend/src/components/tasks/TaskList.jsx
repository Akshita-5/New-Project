import React from 'react';
import { useSelector } from 'react-redux';
import { selectFilteredTasks, selectTaskLoading } from '../../store/slices/taskSlice';
import TaskCard from './TaskCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';

const TaskList = ({ onAddTask }) => {
  const tasks = useSelector(selectFilteredTasks);
  const loading = useSelector(selectTaskLoading);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" text="Loading tasks..." />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No tasks found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          You don't have any tasks yet. Create your first task to get started on your productivity journey!
        </p>
        <button
          onClick={onAddTask}
          className="btn-primary inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Your First Task
        </button>
      </div>
    );
  }

  // Group tasks by completion status
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Pending Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task._id} className="group">
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Completed Tasks ({completedTasks.length})
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              🎉 Great job!
            </span>
          </div>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div key={task._id} className="group">
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Total: {tasks.length} tasks
          </span>
          <div className="flex space-x-4">
            <span className="text-orange-600 dark:text-orange-400">
              Pending: {pendingTasks.length}
            </span>
            <span className="text-green-600 dark:text-green-400">
              Completed: {completedTasks.length}
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round((completedTasks.length / tasks.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;