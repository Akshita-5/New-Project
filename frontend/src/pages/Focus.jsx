const Focus = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ⏰ Focus Sessions
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Boost your productivity with focused work sessions
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pomodoro Timer
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page will contain the Pomodoro timer with circular progress, 
            session controls, break management, and focus tracking.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300">
              🚧 Focus timer interface coming soon! This will include circular timer, session tracking, and productivity insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Focus;