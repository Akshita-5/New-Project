import React from 'react';

const Profile = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            User Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page will contain user profile management, avatar upload, 
            gamification stats, badges, and account settings.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-300">
              🚧 Coming soon - Profile components are being built
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;