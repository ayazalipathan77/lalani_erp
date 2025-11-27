
import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { User } from '../types';

// Lazy load dashboard components for better performance
const DashboardHome = lazy(() => import('./dashboard/Home'));
const Inventory = lazy(() => import('./dashboard/Inventory'));
const Sales = lazy(() => import('./dashboard/Sales'));
const Finance = lazy(() => import('./dashboard/Finance'));
const Partners = lazy(() => import('./dashboard/Partners'));
const Users = lazy(() => import('./dashboard/Users'));
const Reports = lazy(() => import('./dashboard/Reports'));

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface ProtectedRouteProps {
  user: User;
  children?: React.ReactNode;
  permission?: string;
}

// Permission Guard Helper moved outside to avoid re-creation on render
// Also using React.ReactNode instead of JSX.Element to fix namespace issues
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  children,
  permission
}) => {
  // If permission is provided, check it. If not, assume it's allowed or check role elsewhere.
  if (permission && user.permissions?.includes(permission)) {
    return <>{children}</>;
  }
  // Specific check for Admin-only routes if permission string isn't used
  if (!permission && user.role === 'ADMIN') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <LogOut className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
      <p className="text-slate-500 max-w-sm">You do not have the required permissions to view this module. Please contact your administrator.</p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        onLogout={onLogout}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-64 print:ml-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between print:hidden">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center w-full lg:w-96 max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-1.5 border border-slate-200 rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow"
                placeholder="Global search..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* User Profile Dropdown */}
            <div className="relative pl-6 border-l border-slate-200" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 focus:outline-none group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600 transition-colors">{user.full_name}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200 group-hover:border-brand-400 transition-colors">
                  {user.full_name.charAt(0)}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 print:p-0">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Loading...</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<DashboardHome />} />

              <Route path="/inventory" element={
                <ProtectedRoute user={user} permission="INVENTORY_VIEW">
                  <Inventory />
                </ProtectedRoute>
              } />

              <Route path="/sales" element={
                <ProtectedRoute user={user} permission="SALES_VIEW">
                  <Sales />
                </ProtectedRoute>
              } />

              <Route path="/finance" element={
                <ProtectedRoute user={user} permission="FINANCE_VIEW">
                  <Finance />
                </ProtectedRoute>
              } />

              <Route path="/partners" element={
                <ProtectedRoute user={user} permission="PARTNERS_VIEW">
                  <Partners />
                </ProtectedRoute>
              } />

              <Route path="/reports" element={
                <ProtectedRoute user={user} permission="REPORTS_VIEW">
                  <Reports />
                </ProtectedRoute>
              } />

              <Route path="/users" element={
                <ProtectedRoute user={user} permission="USERS_VIEW">
                  <Users />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
