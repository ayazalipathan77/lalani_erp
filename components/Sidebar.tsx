
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Users,
  LogOut,
  UserCog,
  FileBarChart,
  X,
  Undo2,
  Receipt,
  Building2,
  Calculator
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isMobileOpen = false, onMobileClose }) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false
  });
  // Helper to check permissions
  const hasPermission = (permission: string) => {
    // Admins implicitly have access, but we'll respect the array if present
    // For fallback/safety, if user is ADMIN and no permissions array, grant all?
    // Better to rely on the permissions array we populated.
    return user.permissions?.includes(permission);
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      exact: true,
      // Dashboard always visible
      visible: true
    },
    {
      to: '/dashboard/inventory',
      icon: Package,
      label: 'Inventory',
      visible: hasPermission('INVENTORY_VIEW')
    },
    {
      to: '/dashboard/sales',
      icon: ShoppingCart,
      label: 'Sales & Invoices',
      visible: hasPermission('SALES_VIEW')
    },
    {
      to: '/dashboard/sales-returns',
      icon: Undo2,
      label: 'Sales Returns',
      visible: hasPermission('SALES_VIEW')
    },
    {
      to: '/dashboard/finance',
      icon: Wallet,
      label: 'Finance',
      visible: hasPermission('FINANCE_VIEW')
    },
    {
      to: '/dashboard/tax-rates',
      icon: Calculator,
      label: 'Tax Rates',
      visible: hasPermission('FINANCE_VIEW')
    },
    {
      to: '/dashboard/purchase-invoices',
      icon: Receipt,
      label: 'Purchase Invoices',
      visible: hasPermission('FINANCE_VIEW')
    },
    {
      to: '/dashboard/partners',
      icon: Users,
      label: 'Customers & Vendors',
      visible: hasPermission('PARTNERS_VIEW')
    },
    {
      to: '/dashboard/reports',
      icon: FileBarChart,
      label: 'Reports & Analytics',
      visible: hasPermission('REPORTS_VIEW') || user.role === 'ADMIN'
    },
    {
      to: '/dashboard/users',
      icon: UserCog,
      label: 'User Management',
      visible: hasPermission('USERS_VIEW') || user.role === 'ADMIN' // Fallback for pure admin role check if needed
    },
    {
      to: '/dashboard/companies',
      icon: Building2,
      label: 'Company Management',
      visible: user.role === 'ADMIN' // Only admins can manage companies
    }
  ];

  return (
    <aside
      {...swipeHandlers}
      className={`w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50 print:hidden transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl shadow-lg shadow-brand-900/40">
              <div className="absolute inset-0 rounded-xl border border-white/10"></div>
              <span className="font-display font-bold text-white text-lg tracking-tight">LT</span>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white tracking-wide leading-none">LALANI</h2>
              <p className="text-[10px] text-brand-500 font-bold tracking-[0.2em] uppercase mt-0.5">Traders</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.filter(item => item.visible).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="px-4 py-3 mb-2 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
          <p className="text-xs text-brand-400 font-mono">{user.role}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center text-red-400 hover:text-red-300 transition-colors px-4 py-2 w-full text-left rounded-lg hover:bg-red-900/20"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
