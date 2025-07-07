import classNames from 'classnames';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = '', 
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    red: 'text-red-600',
    green: 'text-green-600',
  };

  return (
    <div className={classNames('flex flex-col items-center justify-center', className)}>
      <div
        className={classNames(
          'animate-spin rounded-full border-2 border-t-2 border-gray-200',
          sizeClasses[size],
          colorClasses[color],
          'border-t-current'
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;