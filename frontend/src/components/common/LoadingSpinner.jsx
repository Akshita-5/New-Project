import React from 'react';
import classNames from 'classnames';

const LoadingSpinner = ({ 
  size = 'medium',
  color = 'primary',
  className = '',
  text = '',
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <div className={classNames('flex flex-col items-center justify-center', className)}>
      <div
        className={classNames(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          colorClasses[color]
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;