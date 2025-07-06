import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { toggleTaskComplete, deleteTask, setSelectedTask } from '../../store/slices/taskSlice';
import { openModal } from '../../store/slices/uiSlice';
import classNames from 'classnames';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const TaskCard = ({ task, isDragging = false, dragHandleProps }) => {
  const dispatch = useDispatch();
  const [showSubtasks, setShowSubtasks] = useState(false);

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    dispatch(toggleTaskComplete(task._id));
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    dispatch(setSelectedTask(task._id));
    dispatch(openModal({ modalName: 'taskForm', data: task }));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task._id));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      work: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      study: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      fitness: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      personal: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      health: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      creative: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      social: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[category] || colors.other;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const isOverdue = task.dueDate && !task.completed && isPast(new Date(task.dueDate));
  const completedSubtasks = task.subtasks?.filter(subtask => subtask.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      className={classNames(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200',
        {
          'opacity-60': task.completed,
          'shadow-lg transform scale-105': isDragging,
          'hover:shadow-md': !isDragging,
          'border-red-300 dark:border-red-600': isOverdue,
        }
      )}
      {...dragHandleProps}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1">
            {/* Completion Toggle */}
            <button
              onClick={handleToggleComplete}
              className="flex-shrink-0 mt-0.5 transition-colors"
            >
              {task.completed ? (
                <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 text-gray-400 hover:text-green-500" />
              )}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <h3 className={classNames(
                'text-sm font-medium text-gray-900 dark:text-white truncate',
                { 'line-through text-gray-500 dark:text-gray-400': task.completed }
              )}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tags Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* Priority Badge */}
            <span className={classNames(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
              getPriorityColor(task.priority)
            )}>
              {task.priority === 'urgent' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
              {task.priority}
            </span>

            {/* Category Badge */}
            <span className={classNames(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              getCategoryColor(task.category)
            )}>
              <TagIcon className="h-3 w-3 mr-1" />
              {task.category}
            </span>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className={classNames(
              'flex items-center text-xs',
              {
                'text-red-600 dark:text-red-400': isOverdue,
                'text-orange-600 dark:text-orange-400': isToday(new Date(task.dueDate)),
                'text-gray-600 dark:text-gray-400': !isOverdue && !isToday(new Date(task.dueDate)),
              }
            )}>
              <CalendarIcon className="h-3 w-3 mr-1" />
              {formatDueDate(task.dueDate)}
            </div>
          )}
        </div>

        {/* Progress Bar (if has subtasks) */}
        {totalSubtasks > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Progress ({completedSubtasks}/{totalSubtasks})
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {Math.round((completedSubtasks / totalSubtasks) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Subtasks */}
        {totalSubtasks > 0 && (
          <div>
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="flex items-center text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-2"
            >
              {showSubtasks ? (
                <ChevronDownIcon className="h-4 w-4 mr-1" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 mr-1" />
              )}
              {totalSubtasks} subtask{totalSubtasks !== 1 ? 's' : ''}
            </button>
            
            {showSubtasks && (
              <div className="space-y-1 ml-5">
                {task.subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => {
                        // TODO: Implement subtask toggle
                        console.log('Toggle subtask:', subtask);
                      }}
                      className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className={classNames(
                      'text-xs text-gray-600 dark:text-gray-400',
                      { 'line-through': subtask.completed }
                    )}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* Time Estimate */}
            {task.estimatedTime && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-3 w-3 mr-1" />
                {task.estimatedTime}m
              </div>
            )}
          </div>

          {/* XP Reward */}
          {task.xpReward && (
            <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              +{task.xpReward} XP
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;