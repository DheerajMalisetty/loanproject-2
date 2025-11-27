import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from '../pages/Dashboard';
import LoanForm from '../pages/LoanForm';
import Loans from '../pages/Loans';
import Profile from '../pages/Profile';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const renderContent = () => {
    switch (location.pathname) {
      case '/dashboard':
        return <Dashboard />;
      case '/loan/new':
        return <LoanForm />;
      case '/loans':
        return <Loans />;
      case '/profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;