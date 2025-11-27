import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  DocumentPlusIcon,
  FolderIcon,
  UserIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'New Loan', href: '/loan/new', icon: DocumentPlusIcon },
  { name: 'Loan Records', href: '/loans', icon: FolderIcon },
  { name: 'Payments', href: '/payments', icon: CurrencyDollarIcon },
  { name: 'Outsource', href: '/outsource', icon: ArrowPathIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 bg-gradient-primary">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <CurrencyDollarIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Gold Loan</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'nav-active text-primary bg-primary/5' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-white font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="flex w-full items-center px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;