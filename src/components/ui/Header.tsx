import React from 'react';
import imgsrc from '@/assets/marrow.png'
import CountdownTimer from './Countdown';

const LeaderboardHeader = () => {
  return (
    <div className="block w-full p-4 transition-all duration-300 hover:scale-102 group">
      <div className="relative w-full">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-3xl animate-pulse pointer-events-none" />
        
        {/* Main container */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800/20 shadow-2xl transition-all duration-300 group-hover:shadow-purple-500/10">
          
          {/* Inner content wrapper */}
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 px-4 sm:px-8 py-6">
            {/* Center section */}
            <div className="flex items-center gap-6 flex-grow justify-center">
              {/* Logo container with enhanced hover animation */}
              <a 
                href="https://www.marrow.com/qbank" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative group/logo z-10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-full blur-xl transition-all duration-300 group-hover/logo:scale-110 pointer-events-none" />
                <img 
                  src={imgsrc}
                  alt="Marrow Logo" 
                  className="relative w-12 h-12 rounded-full shadow-lg transition-all duration-300 group-hover/logo:expand-6 group-hover/logo:scale-110"
                />
              </a>
              
              {/* Title with enhanced animation */}
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient relative">
                  QBank Challenge
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/10 to-purple-500/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </h1>
              </div>
            </div>

            
          </div>

          {/* Enhanced hover effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
          
          {/* CountdownTimer with enhanced spacing */}
          <div className="px-8 pb-6">
            <CountdownTimer />
          </div>
          
          {/* Animated bottom border gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-gradient pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardHeader;