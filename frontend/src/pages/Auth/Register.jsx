import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { registerUser, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '../../store/slices/authSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setFocus,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Focus on name field when component mounts
  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: 'No password', color: 'bg-gray-200' };
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 5) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    return { strength: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    if (!acceptTerms) {
      return;
    }

    try {
      const { confirmPassword, ...userData } = data;
      await dispatch(registerUser(userData)).unwrap();
      // Navigation will be handled by the useEffect above
    } catch (err) {
      // Error handling is done in the slice
      console.error('Registration failed:', err);
    }
  };

  const handleGoogleRegister = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL || '/api'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Start your productivity journey with FocusMate
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full name
              </label>
              <div className="mt-1">
                <input
                  {...register('name', {
                    required: 'Name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                    maxLength: {
                      value: 50,
                      message: 'Name must be less than 50 characters',
                    },
                  })}
                  type="text"
                  autoComplete="name"
                  className="form-input"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    validate: {
                      hasLowerCase: (value) =>
                        /[a-z]/.test(value) || 'Password must contain at least one lowercase letter',
                      hasUpperCase: (value) =>
                        /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
                      hasNumber: (value) =>
                        /[0-9]/.test(value) || 'Password must contain at least one number',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input pr-10"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                I agree to the{' '}
                <a href="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                  Privacy Policy
                </a>
              </label>
            </div>
            {!acceptTerms && (
              <p className="text-sm text-red-600 dark:text-red-400">
                You must accept the terms and conditions
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="btn-primary w-full flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" color="white" className="mr-2" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Google Registration */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="mt-6 w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="text-8xl mb-8">🚀</div>
            <h1 className="text-4xl font-bold mb-4">
              Join FocusMate Today
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Transform your productivity with AI-powered insights
            </p>
            <div className="grid grid-cols-1 gap-4 text-left max-w-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  ✅
                </div>
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  🎯
                </div>
                <span>Unlimited focus sessions</span>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  📊
                </div>
                <span>Detailed analytics</span>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  🔒
                </div>
                <span>Privacy focused</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;