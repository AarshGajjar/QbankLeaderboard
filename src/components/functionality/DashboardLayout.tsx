import React from 'react';
import DarkModeToggle from '../functionality/DarkModeToggle';
import LeaderboardHeader from '../ui/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-blue-900 dark:via-gray-800 dark:to-purple-900 flex flex-col">
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent w-full">
        <div className="w-full px-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex flex-wrap items-center justify-between gap-4 py-1">
            <div className="flex-1 flex-grow">
              <LeaderboardHeader />
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col items-center py-1">
            <div className="w-full mb-4">
              <LeaderboardHeader />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-2 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {children}
        </div>
      </main>
      <div className="flex items-center justify-center">
              <span className="text-xs font-bold bg-white/90 dark:bg-slate-900/90 px-2 py-2 rounded-full shadow-sm flex items-center gap-2">
                <span className="hidden sm:inline">Toggle Theme</span> 
                <DarkModeToggle />
              </span>
            </div>
      </div>
    
  );
};

export default DashboardLayout;