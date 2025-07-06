import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusIcon } from '@heroicons/react/24/outline';
import { fetchTasks, setTaskFormOpen } from '../store/slices/taskSlice';
import { openModal, selectModal } from '../store/slices/uiSlice';
import { setCurrentPage } from '../store/slices/uiSlice';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';

const Tasks = () => {
  const dispatch = useDispatch();
  const taskFormOpen = useSelector(selectModal('taskForm'));

  useEffect(() => {
    dispatch(setCurrentPage({ page: 'tasks', title: 'Task Management' }));
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleAddTask = () => {
    dispatch(openModal({ modalName: 'taskForm' }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📋 Task Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Organize and track your tasks with priorities, categories, and due dates.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleAddTask}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters />

      {/* Task List */}
      <TaskList onAddTask={handleAddTask} />

      {/* Task Form Modal */}
      <TaskForm isOpen={taskFormOpen} />
    </div>
  );
};

export default Tasks;