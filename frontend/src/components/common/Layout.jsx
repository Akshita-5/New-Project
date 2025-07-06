import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { selectSidebarOpen, selectIsMobile, setScreenSize } from '../../store/slices/uiSlice';

const Layout = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const isMobile = useSelector(selectIsMobile);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      dispatch(setScreenSize(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => dispatch({ type: 'ui/setSidebarOpen', payload: false })}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;