import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Calendar, 
  FileText, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isDoctor, isPatient } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'doctor', 'patient'] },
    { path: '/patients', icon: Users, label: 'Patients', roles: ['admin'] },
    { path: '/doctors', icon: UserPlus, label: 'Doctors', roles: ['admin', 'patient'] },
    { path: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'doctor', 'patient'] },
    { path: '/billing', icon: FileText, label: 'Billing', roles: ['admin', 'patient'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => 
      role === 'admin' ? isAdmin : role === 'doctor' ? isDoctor : isPatient
    )
  );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-primary-600">
              HospitalMS
            </h1>
            <p className="text-sm text-gray-500 mt-1">Management System</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-4">
              <p className="font-medium text-gray-900">{user?.full_name || 'User'}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role || 'Guest'}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
