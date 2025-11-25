import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardHome from './dashboard/Home';
import Inventory from './dashboard/Inventory';
import Sales from './dashboard/Sales';
import Finance from './dashboard/Finance';
import Partners from './dashboard/Partners';
import { Bell, Search, UserCircle } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar onLogout={onLogout} />
      
      <main className="flex-1 ml-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="flex items-center w-96">
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
            <div className="flex items-center space-x-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Admin User</p>
                <p className="text-xs text-slate-500">Head Office</p>
              </div>
              <UserCircle className="w-8 h-8 text-slate-300" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;