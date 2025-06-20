import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    
      // Check if current time is between 7 PM and 7 AM
      const currentHour = new Date().getHours();
      const shouldBeDark = currentHour >= 19 || currentHour < 7;
      setIsDarkMode(shouldBeDark);
      localStorage.setItem('theme', shouldBeDark ? 'dark' : 'light');
    
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors dark:bg-gray-700"
      aria-label="Toggle dark mode"
    >
      <span
        className={`${
          isDarkMode ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      >
        {isDarkMode ? (
          <MoonIcon className="h-4 w-4 text-gray-800" />
        ) : (
          <SunIcon className="h-4 w-4 text-yellow-500" />
        )}
      </span>
    </button>
  );
};

export default DarkModeToggle;
