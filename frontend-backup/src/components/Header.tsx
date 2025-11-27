import React from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Search or breadcrumb area */}
        <div className="flex-1 lg:ml-0">
          <h1 className="text-lg font-semibold text-foreground">
            Gold Loan Management
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full"></span>
          </button>

          {/* User info */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-white text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;