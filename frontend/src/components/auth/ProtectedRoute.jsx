import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectIsInitialized, selectAuthLoading, initializeAuth } from '../../store/slices/authSlice';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const loading = useSelector(selectAuthLoading);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  // Show loading spinner while initializing auth
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Initializing FocusMate...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;