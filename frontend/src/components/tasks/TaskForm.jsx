import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { XMarkIcon, CalendarIcon, ClockIcon, TagIcon, PlusIcon } from '@heroicons/react/24/outline';
import { createTask, updateTask, selectCurrentTask } from '../../store/slices/taskSlice';
import { closeModal } from '../../store/slices/uiSlice';
import LoadingSpinner from '../common/LoadingSpinner';

const TaskForm = ({ isOpen, onClose, task = null }) => {
  const dispatch = useDispatch();
  const currentTask = useSelector(selectCurrentTask);
  const isEditing = !!task || !!currentTask;
  const taskData = task || currentTask;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'work',
      priority: 'medium',
      dueDate: '',
      estimatedTime: '',
      tags: [],
      subtasks: [],
    },
  });

  // Reset form when task changes
  useEffect(() => {
    if (taskData) {
      reset({
        title: taskData.title || '',
        description: taskData.description || '',
        category: taskData.category || 'work',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
        estimatedTime: taskData.estimatedTime || '',
        tags: taskData.tags || [],
        subtasks: taskData.subtasks || [],
      });
    } else {
      reset({
        title: '',
        description: '',
        category: 'work',
        priority: 'medium',
        dueDate: '',
        estimatedTime: '',
        tags: [],
        subtasks: [],
      });
    }
  }, [taskData, reset]);

  const watchedSubtasks = watch('subtasks');

  const onSubmit = async (data) => {
    try {
      const taskPayload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime) : null,
        tags: Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (isEditing) {
        await dispatch(updateTask({ id: taskData._id, ...taskPayload })).unwrap();
      } else {
        await dispatch(createTask(taskPayload)).unwrap();
      }

      handleClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleClose = () => {
    reset();
    dispatch(closeModal('taskForm'));
    if (onClose) onClose();
  };

  const addSubtask = () => {
    const currentSubtasks = watchedSubtasks || [];
    setValue('subtasks', [...currentSubtasks, { title: '', completed: false }]);
  };

  const removeSubtask = (index) => {
    const currentSubtasks = watchedSubtasks || [];
    setValue('subtasks', currentSubtasks.filter((_, i) => i !== index));
  };

  const updateSubtask = (index, field, value) => {
    const currentSubtasks = [...(watchedSubtasks || [])];
    currentSubtasks[index] = { ...currentSubtasks[index], [field]: value };
    setValue('subtasks', currentSubtasks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className="form-input"
                  placeholder="What needs to be done?"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="form-input"
                  placeholder="Add more details about this task..."
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select {...register('category')} className="form-input">
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="fitness">Fitness</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="creative">Creative</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select {...register('priority')} className="form-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date and Estimated Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      {...register('dueDate')}
                      type="date"
                      className="form-input pl-10"
                    />
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Time (minutes)
                  </label>
                  <div className="relative">
                    <input
                      {...register('estimatedTime')}
                      type="number"
                      min="1"
                      className="form-input pl-10"
                      placeholder="30"
                    />
                    <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <div className="relative">
                  <input
                    {...register('tags')}
                    type="text"
                    className="form-input pl-10"
                    placeholder="important, urgent, project-alpha (comma separated)"
                  />
                  <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subtasks
                  </label>
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Subtask
                  </button>
                </div>

                <div className="space-y-2">
                  {(watchedSubtasks || []).map((subtask, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={subtask.title || ''}
                        onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                        className="form-input flex-1"
                        placeholder="Subtask description"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubtask(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" color="white" className="mr-2" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditing ? 'Update Task' : 'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;