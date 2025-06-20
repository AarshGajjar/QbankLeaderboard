import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, RefreshCw, List, Bell, BellOff } from 'lucide-react';
import marrowIcon from '@/assets/marrow.png';
import CrossPlatformNotifications from './CrossPlatformNotifications';
import InAppNotification from './InAppNotification';
import emailjs from '@emailjs/browser';

// Core interfaces defining the structure of activity logs and component props
interface ActivityLog {
  id: number;
  user_type: 'user1' | 'user2';
  completed: number;
  correct: number;
  timestamp: string;
  created_at: string;
}

interface ActivityLogProps {
  logs: ActivityLog[];
  userNames: {
    user1: string;
    user2: string;
  };
  onRefresh: () => Promise<void>;
}

interface NotificationState {
  enabled: boolean;
  lastSeenLogId: number;
}

// Helper functions for calculations and formatting
/**
 * Calculates accuracy percentage from correct answers and total questions
 * @returns Formatted string with accuracy to 1 decimal place
 */
const calculateAccuracy = (correct: number, total: number): string => {
  if (total === 0) return '0.0';
  return ((correct / total) * 100).toFixed(1);
};

/**
 * Formats timestamp to localized date-time string
 * Uses Indian locale and 24-hour format
 */
const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const isSameDate = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const formatTimeRange = (slotIndex: number): string => {
  const startHour = slotIndex * 3;
  const endHour = startHour + 3;
  return `${String(startHour).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:00`;
};

/**
 * Converts IST (UTC+5:30) to local date string
 * Handles timezone offset for consistent date display
 */
const getCurrentDate = () => {
  // Get current UTC time
  const now = new Date();
  // Add 5 hours and 30 minutes to get IST
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().split('T')[0];
};

// Email Notifications
export class EmailNotificationService {
  private lastMessageTime: number = 0;
  private minDelayBetweenMessages: number = 1000;
  
  private readonly EMAIL_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  private readonly EMAIL_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  private readonly EMAIL_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  private readonly RECIPIENT_EMAILS = ['aarshgajjar16@gmail.com', 'charaniyaaman3@gmail.com'];
  
  constructor() {
    emailjs.init(this.EMAIL_PUBLIC_KEY);
  }
  
  private async rateLimitedSend(emailData: any): Promise<void> {
    const now = Date.now();
    const timeToWait = Math.max(0, this.minDelayBetweenMessages - (now - this.lastMessageTime));
    
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
    
    this.lastMessageTime = Date.now();
    await emailjs.send(this.EMAIL_SERVICE_ID, this.EMAIL_TEMPLATE_ID, emailData);
  }
  
  formatActivityMessage(
    log: ActivityLog, 
    userNames: { user1: string; user2: string },
    todaysTotals: { user1: number; user2: number }
  ): string {
    const userName = userNames[log.user_type];
    const accuracy = calculateAccuracy(log.correct, log.completed);
    const time = new Date(log.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const leader = todaysTotals.user1 > todaysTotals.user2 ? userNames.user1 : userNames.user2;
    const difference = Math.abs(todaysTotals.user1 - todaysTotals.user2);
    const accuracyNum = parseFloat(accuracy.toString());
    
    // Compact latest activity summary
    const activitySummary = `
      <div style="margin-bottom: 15px; color: #ffffff;">
        <span style="font-size: 20px; font-weight: 500;">${userName}</span>
        <div style="margin-top: 8px; line-height: 1.4;">
          Completed <span style="font-weight: 500;">${log.completed}</span> questions with 
          <span style="font-weight: 500; color: ${accuracyNum >= 70 ? '#a5f3fc' : '#fecaca'};">${accuracy}%</span> accuracy at ${time}
        </div>
      </div>
    `;
    
    // Combined progress section
    const progressSection = `
      <div style="margin-bottom: 20px; background-color: #f9fafb; border-radius: 8px; padding: 15px;">
        <strong style="color: #4f46e5; display: block; margin-bottom: 10px; font-size: 16px;">Today's Progress</strong>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <!-- User 1 -->
          <div style="padding: 12px; background-color: #faf5ff; border-radius: 8px; text-align: center;">
            <div style="color: #9333ea; font-weight: 600; margin-bottom: 5px;">${userNames.user1}</div>
            <div style="font-size: 22px; font-weight: 700;">${todaysTotals.user1}</div>
          </div>
          
          <!-- User 2 -->
          <div style="padding: 12px; background-color: #eff6ff; border-radius: 8px; text-align: center;">
            <div style="color: #3b82f6; font-weight: 600; margin-bottom: 5px;">${userNames.user2}</div>
            <div style="font-size: 22px; font-weight: 700;">${todaysTotals.user2}</div>
          </div>
        </div>
        
        <!-- Lead status -->
        <div style="margin-top: 15px; text-align: center; padding: 10px; background-color: #f8fafc; border-radius: 6px;">
          <span style="color: ${leader === userNames.user1 ? '#9333ea' : '#3b82f6'}; font-weight: 600;">${leader}</span> 
          is leading by <span style="font-weight: 600;">${difference}</span> questions
        </div>
        
        <!-- Progress bars -->
        <div style="margin-top: 15px;">
          <!-- User 1 Progress -->
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <div style="font-size: 14px; font-weight: 500; color: #9333ea;">${userNames.user1}</div>
              <div style="font-size: 14px; color: #6b7280;">${todaysTotals.user1}</div>
            </div>
            <div style="height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${Math.min(100, Math.round((todaysTotals.user1 / Math.max(todaysTotals.user1, todaysTotals.user2)) * 100))}%; 
                    background-color: #9333ea; border-radius: 4px;"></div>
            </div>
          </div>
          
          <!-- User 2 Progress -->
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <div style="font-size: 14px; font-weight: 500; color: #3b82f6;">${userNames.user2}</div>
              <div style="font-size: 14px; color: #6b7280;">${todaysTotals.user2}</div>
            </div>
            <div style="height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${Math.min(100, Math.round((todaysTotals.user2 / Math.max(todaysTotals.user1, todaysTotals.user2)) * 100))}%; 
                    background-color: #3b82f6; border-radius: 4px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Random motivational quote generator
    const quotes = [
      "Success is the sum of small efforts repeated day in and day out.",
      "The only way to learn is to practice.",
      "The expert in anything was once a beginner.",
      "Consistency is the key to achieving results.",
      "Small daily improvements add up to big results."
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    const motivationSection = `
      <div style="background-color: #faf5ff; border-radius: 8px; padding: 15px; text-align: center;">
        <p style="color: #6d28d9; font-style: italic; margin: 0; font-size: 16px;">
          "${randomQuote}"
        </p>
      </div>
    `;
    
    return `
      ${activitySummary}
      ${progressSection}
      ${motivationSection}
    `;
  }
  
  async sendEmail(message: string): Promise<void> {
    let successCount = 0;
    
    for (const recipientEmail of this.RECIPIENT_EMAILS) {
      try {
        await this.rateLimitedSend({
          to_email: recipientEmail,
          message_html: message,
          subject: `Qbank Activity Update`,
        });
        
        successCount++;
        console.log(`Email sent successfully to ${recipientEmail}`);
      } catch (error) {
        console.error(`Failed to send email to ${recipientEmail}:`, error);
      }
    }
    
    if (successCount === 0) {
      throw new Error('Failed to send email to any recipient');
    }
  }
}

const ActivityLogs: React.FC<ActivityLogProps> = ({ logs, userNames, onRefresh }) => {
  // State management for various UI controls and features
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: getCurrentDate(),
    end: getCurrentDate()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'clock' | 'list'>('list');
  const [selectedUsers, setSelectedUsers] = useState<('user1' | 'user2')[]>(['user1', 'user2']);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<NotificationState>(() => {
    const saved = localStorage.getItem('activityLogNotifications');
    return saved ? JSON.parse(saved) : { enabled: false, lastSeenLogId: 0 };
  });
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number>(Date.now());
  const MINIMUM_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refreshes
  const [notificationSystem, setNotificationSystem] = useState<any>(null);
  const [emailService] = useState(() => new EmailNotificationService());
  const [emailError, setEmailError] = useState<string | null>(null);

  /**
   * Enhanced auto-refresh mechanism with error handling and rate limiting
   * Only refreshes when viewing today's data
   */
  useEffect(() => {
    const handleRefresh = async () => {
      const now = Date.now();
      if (now - lastRefreshAttempt < MINIMUM_REFRESH_INTERVAL) {
        return; // Skip if too soon since last attempt
      }

      setLastRefreshAttempt(now);
      try {
        setRefreshError(null);
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
        setRefreshError('Failed to refresh data. Will retry shortly.');
        // Exponential backoff could be implemented here if needed
      }
    };

    // Only set up auto-refresh if we're viewing today's data
    const isViewingToday = dateRange.start === getCurrentDate() && !isRangeMode;
    
    let interval: NodeJS.Timeout;
    if (isViewingToday) {
      interval = setInterval(handleRefresh, 30000); // Reduced to every 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [onRefresh, dateRange.start, isRangeMode, lastRefreshAttempt]);

  /**
   * Manual refresh handler with rate limiting and error handling
   * Prevents rapid consecutive refreshes
   */
  const handleRefresh = async () => {
    const now = Date.now();
    if (now - lastRefreshAttempt < MINIMUM_REFRESH_INTERVAL) {
      return; // Prevent rapid manual refreshes
    }

    setIsRefreshing(true);
    setLastRefreshAttempt(now);
    try {
      setRefreshError(null);
      await onRefresh();
    } catch (error) {
      console.error('Manual refresh failed:', error);
      setRefreshError('Failed to refresh data. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Filters logs based on selected date range and users
   * Handles both single day and date range modes
   */
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (!isRangeMode) {
      return isSameDate(log.timestamp, dateRange.start) && selectedUsers.includes(log.user_type);
    }
    
    endDate.setHours(23, 59, 59);
    return (
      logDate >= startDate &&
      logDate <= endDate &&
      selectedUsers.includes(log.user_type)
    );
  });

  /**
   * Organizes activity data into 3-hour time slots
   * Creates 8 slots covering full 24-hour period
   */
  const timeSlots = Array(8).fill(null).map(() => ({ 
    total: 0, 
    correct: 0, 
    logs: [] as ActivityLog[] 
  }));
  
  
  filteredLogs.forEach(log => {
    const date = new Date(log.timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // Calculate the slot index: each slot covers 3 hours (0–2:59, 3–5:59, …, 21–23:59)
    const slotIndex = Math.floor((hours + minutes / 60) / 3);
    
    // Ensure the slot index is within bounds (0 to 7)
    if (slotIndex >= 0 && slotIndex < timeSlots.length) {
      timeSlots[slotIndex].total += log.completed;
      timeSlots[slotIndex].correct += log.correct;
      timeSlots[slotIndex].logs.push(log);
    }
  });
  

  const maxTotal = Math.max(
    ...timeSlots.filter(slot => slot.total > 0).map(slot => slot.total),
    1 // Prevent division by zero
  );

  const dailyTotals = filteredLogs.reduce((acc, log) => {
    const userType = log.user_type as 'user1' | 'user2';
    acc[userType].completed += log.completed;
    acc[userType].correct += log.correct;
    return acc;
  }, {
    user1: { completed: 0, correct: 0 },
    user2: { completed: 0, correct: 0 }
  });
  
  /**
   * Calculates position on clock face for given timestamp
   * Returns x,y coordinates for plotting on SVG
   */
  const getLogPosition = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Adjust angle calculation for 24-hour clock (15 degrees per hour instead of 30)
    const angle = (hours * 15 + minutes * 0.25) - 90;
    const radians = angle * (Math.PI / 180);
    
    return {
      x: Math.cos(radians),
      y: Math.sin(radians)
    };
  };

  const toggleUserSelection = (user: 'user1' | 'user2') => {
    setSelectedUsers(prev => 
      prev.includes(user) 
        ? prev.filter(u => u !== user)
        : [...prev, user]
    );
  };

  // Add useEffect for updating current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    // Calculate angle (15 degrees per hour, adjusted for minutes and seconds)
    const angle = ((hours + minutes / 60 + seconds / 3600) * 15 - 90) * (Math.PI / 180);
    
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  };

  /**
   * Notification system implementation
   * Handles permission requests and notification display
   */
  const initializeNotifications = async () => {
    const system = await CrossPlatformNotifications.init();
    setNotificationSystem(system);
    setNotifications(prev => ({ ...prev, enabled: system.supported }));
  };

  // Add useEffect to request notification permission on mount
  useEffect(() => {
    initializeNotifications();
  }, []);

  const toggleNotifications = async () => {
    if (!notifications.enabled) {
      await initializeNotifications();
    } else {
      setNotifications(prev => ({ ...prev, enabled: false }));
    }
  };

  const showNotification = useCallback(async (log: ActivityLog) => {
    if (!notifications.enabled) return;

    try {
      // Show browser notification
      if (notificationSystem?.supported) {
        await CrossPlatformNotifications.showNotification(
          log,
          userNames,
          marrowIcon
        );
      }

    } catch (error) {
      console.error('Notification error:', error);
      setEmailError('Failed to send Email notification');
      
      // Clear error after 5 seconds
      setTimeout(() => setEmailError(null), 5000);
    }
  }, [notifications.enabled, userNames, notificationSystem, emailService, dailyTotals]);

  /**
   * Watches for new logs and triggers notifications
   * Updates lastSeenLogId to track newest notifications
   */
  useEffect(() => {
    if (!notifications.enabled || !logs.length) return;

    const newLogs = logs.filter(log => log.id > notifications.lastSeenLogId);
    if (newLogs.length > 0) {
      // Show notification for each new log
      newLogs.forEach(log => {
        showNotification(log);
      });
      // Update lastSeenLogId to the most recent log ID
      setNotifications(prev => ({ ...prev, lastSeenLogId: Math.max(...newLogs.map(log => log.id)) }));
    }

    // Set up polling interval for checking new logs
    const interval = setInterval(() => {
      if (document.hidden) {
        onRefresh();
      }
    }, 30000); // Check every 30 seconds when page is hidden

    return () => clearInterval(interval);
  }, [logs, notifications.enabled, notifications.lastSeenLogId, showNotification, onRefresh]);

  // Initialize lastSeenLogId more effectively
  useEffect(() => {
    if (logs.length > 0 && notifications.lastSeenLogId === 0) {
      const maxId = Math.max(...logs.map(log => log.id));
      setNotifications(prev => ({ ...prev, lastSeenLogId: maxId }));
    }
  }, [logs]);

  // Save notification state to localStorage
  useEffect(() => {
    localStorage.setItem('activityLogNotifications', JSON.stringify(notifications));
  }, [notifications]);

  const calculateDotSize = (completed: number, options: {
    minSize?: number;
    maxSize?: number;
    nonLinearExponent?: number;
  } = {}): number => {
    const {
      minSize = 0.01, 
      maxSize = 0.07,
    } = options;
  
    const maxQuestions = Math.max(...filteredLogs.map(log => log.completed));
    if (maxQuestions === 0) return minSize;
  
    const normalizedCompletion = completed / maxQuestions;
    return minSize + normalizedCompletion * (maxSize - minSize);
  };

  // UI Component rendering
  return (
    <Card className="w-full shadow-lg rounded-lg bg-gradient-to-br from-white/80 via-white/90 to-white/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/20">
      <InAppNotification />
      {/* Card Header with title and controls */}
      <CardHeader className="border-b p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Activity Log
            </span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotifications}
              className={`hover:bg-gradient-to-r hover:from-purple-600/5 hover:to-blue-600/5 ${
                notifications.enabled ? 'text-green-500' : ''
              }`}
            >
              {notifications.enabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="hover:bg-gradient-to-r hover:from-purple-600/5 hover:to-blue-600/5"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {(refreshError || emailError) && (
          <div className="mt-2 text-sm text-red-500 dark:text-red-400">
            {refreshError || emailError}
          </div>
        )}
      </CardHeader>
      
      {/* Main content area with views and controls */}
      <CardContent className="p-4 sm:p-6 flex flex-col items-stretch overflow-x-auto">
        <div className="min-w-0 w-full space-y-4">
          <div className="flex border rounded-md bg-white dark:bg-slate-900 dark:border-slate-700">
            <button
              className={`flex-1 p-2 transition-colors rounded-l-md ${
                activeTab === 'clock' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                  : 'hover:bg-gradient-to-r hover:from-purple-600/5 hover:to-blue-600/5'
              }`}
              onClick={() => setActiveTab('clock')}
            >
              <Clock className="w-4 h-4 inline-block mr-2" />
              Clock View
            </button>
            <button
              className={`flex-1 p-2 transition-colors rounded-r-md ${
                activeTab === 'list' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                  : 'hover:bg-gradient-to-r hover:from-purple-600/5 hover:to-blue-600/5'
              }`}
              onClick={() => setActiveTab('list')}
            >
              <List className="w-4 h-4 inline-block mr-2" />
              List View
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 dark:text-gray-300">Select Date</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsRangeMode(!isRangeMode);
                  if (!isRangeMode) {
                    setDateRange({ start: getCurrentDate(), end: getCurrentDate() });
                  }
                }}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                {isRangeMode ? 'Single Day' : 'Date Range'}
              </Button>
            </div>

            {isRangeMode ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border-purple-600/50 focus:ring-purple-600/50"
                    max={dateRange.end}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600 mb-1 block">End Date</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border-purple-600/50 focus:ring-purple-600/50"
                    min={dateRange.start}
                  />
                </div>
              </div>
            ) : (
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value, end: e.target.value }))}
                className="w-full border-purple-600/50 focus:ring-purple-600/50"
              />
            )}
          </div>
          
          <div className="flex gap-2 justify-center">
            {(['user1', 'user2'] as const).map((userType) => (
              <Button
                key={userType}
                variant={selectedUsers.includes(userType) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleUserSelection(userType)}
                className={`
                  ${selectedUsers.includes(userType) 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : 'text-gray-600'}
                  ${!selectedUsers.includes(userType) && 'opacity-50'}
                `}
              >
                {userNames[userType]}
              </Button>
            ))}
          </div>

          {(['user1', 'user2'] as const).map((userType) => {
            const sessions = filteredLogs.filter(log => log.user_type === userType).length;
            const accuracy = calculateAccuracy(dailyTotals[userType].correct, dailyTotals[userType].completed);
            const isUser1 = userType === 'user1';
            
            return (
              <div
                key={userType}
                className={`rounded-lg mb-4 ${!selectedUsers.includes(userType) && 'opacity-50'}`}
              >
                <div className={`flex items-center justify-between p-3 rounded-t-lg ${
                  isUser1 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
                  <span className="font-medium">{userNames[userType]}</span>
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    {sessions} sessions
                  </span>
                </div>
                
                <div className={`p-4 rounded-b-lg ${
                  isUser1
                    ? 'bg-purple-50 dark:bg-purple-900/10' 
                    : 'bg-blue-50 dark:bg-blue-900/10'
                }`}>
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold mr-2 ${
                      isUser1 ? 'text-purple-700 dark:text-purple-400' : 'text-blue-700 dark:text-blue-400'
                    }`}>
                      {accuracy}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
                    
                    <div className="ml-auto flex gap-6">
                      <div>
                        <div className="text-right font-medium">{dailyTotals[userType].completed}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                      </div>
                      
                      <div>
                        <div className="text-right font-medium">{dailyTotals[userType].correct}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Correct</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {activeTab === 'clock' && (
            <div className="p-4 flex justify-center">
              <div className="w-full aspect-square max-w-[400px]">
                <TooltipProvider>
                  <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-full h-full">
                    <circle cx="0" cy="0" r="1" fill="none" stroke="rgb(203 213 225)" strokeWidth="0.05" />
                  
                    {/* 24-hour markers */}
                    {[...Array(24)].map((_, i) => {
                      const angle = (i * 15 - 90) * (Math.PI / 180);
                      return (
                        <line
                          key={i}
                          x1={Math.cos(angle) * 0.9}
                          y1={Math.sin(angle) * 0.9}
                          x2={Math.cos(angle) * 1}
                          y2={Math.sin(angle) * 1}
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={i % 6 === 0 ? "0.04" : "0.02"}
                        />
                      );
                    })}

                    {/* Add current time indicator */}
                    {(() => {
                      const { x, y } = getCurrentTimePosition();
                      const currentTimeString = currentTime.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      });
                      return (
                        <g>
                          {/* Hour hand shadow for depth effect */}
                          <line
                            x1="0"
                            y1="0"
                            x2={x * 0.7}
                            y2={y * 0.7}
                            stroke="rgba(0, 0, 0, 0.2)"
                            strokeWidth="0.04"
                            strokeLinecap="round"
                            transform="translate(0.01, 0.01)"
                          />
                          {/* Hour hand */}
                          <line
                            x1="0"
                            y1="0"
                            x2={x * 0.7}
                            y2={y * 0.7}
                            stroke="hsl(var(--primary))"
                            strokeWidth="0.04"
                            strokeLinecap="round"
                            className="transition-transform duration-1000 ease-linear"
                          />
                          {/* Time text */}
                          <text
                            x={0}
                            y={-1.1}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            fill="hsl(var(--primary))"
                            fontSize="0.12"
                            className="font-medium"
                          >
                            {currentTimeString}
                          </text>
                          {/* Center dot overlay */}
                          <circle 
                            cx="0" 
                            cy="0" 
                            r="0.06" 
                            fill="hsl(var(--primary))"
                            className="animate-pulse"
                          />
                        </g>
                      );
                    })()}

                    {/* Dynamic heatmap calculation */}
                    {timeSlots.map((slot, index) => {
                      const startAngleDeg = index * 45 - 90; // 45° per slot
                      const endAngleDeg = (index + 1) * 45 - 90;
                      const startAngleRad = startAngleDeg * (Math.PI / 180);
                      const endAngleRad = endAngleDeg * (Math.PI / 180);

                      const startX = 0.9 * Math.cos(startAngleRad);
                      const startY = 0.9 * Math.sin(startAngleRad);
                      const endX = 0.9 * Math.cos(endAngleRad);
                      const endY = 0.9 * Math.sin(endAngleRad);

                      // Calculate the accuracy and intensity based on the slot's data
                      const accuracy = slot.total > 0 ? slot.correct / slot.total : 0;
                      const intensity = slot.total > 0 ? (slot.total / maxTotal) : 0;

                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <path
                              d={`M 0 0 L ${startX} ${startY} A 0.9 0.9 0 0 1 ${endX} ${endY} Z`}
                              fill={slot.total > 0 ? "url(#gradient)" : "transparent"}
                              fillOpacity={intensity * 0.3}
                              stroke="none"
                              className="cursor-pointer hover:fill-opacity-50 transition-all"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-2 space-y-1">
                            <p className="font-medium">{formatTimeRange(index)}</p>
                            <div className="space-y-0.5 text-sm">
                              <p>Total Questions: {slot.total}</p>
                              <p>Correct Answers: {slot.correct}</p>
                              <p>Accuracy: {calculateAccuracy(slot.correct, slot.total)}%</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}

                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(147 51 234)" />
                        <stop offset="100%" stopColor="rgb(37 99 235)" />
                      </linearGradient>
                    </defs>

                    {/* Replace the log markers section in the clock view with this updated version */}
                    {filteredLogs.map((log) => {
                      const { x, y } = getLogPosition(log.timestamp);
                      const dotSize = calculateDotSize(log.completed);
                      
                      return (
                        <g key={log.id} transform={`translate(${x}, ${y})`}>
                          <circle
                            r={dotSize}
                            fill={log.user_type === 'user1' ? 'rgb(147 51 234)' : 'rgb(37 99 235)'}
                            stroke="hsl(var(--background))"
                            strokeWidth="0.01"
                          />
                          <title>
                            {`${log.user_type === 'user1' ? userNames.user1 : userNames.user2}
                Completed: ${log.completed}
                Correct: ${log.correct}
                Time: ${new Date(log.timestamp).toLocaleTimeString('en-IN', { hour12: false })}`}
                          </title>
                        </g>
                      );
                    })}

                    <circle cx="0" cy="0" r="0.05" fill="hsl(var(--foreground))" />
                  </svg>
                </TooltipProvider>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="max-h-[350px] overflow-y-auto rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-700">
              {filteredLogs.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 transition-colors flex justify-between items-center ${
                        log.user_type === 'user1' 
                          ? 'hover:bg-purple-50 dark:hover:bg-purple-900/20' 
                          : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          log.user_type === 'user1' 
                            ? 'bg-purple-600 dark:bg-purple-500' 
                            : 'bg-blue-600 dark:bg-blue-500'
                        }`} />
                        <span className={
                          log.user_type === 'user1' 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }>
                          {userNames[log.user_type]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {log.completed} completed, {log.correct} correct 
                        {" ("}{calculateAccuracy(log.correct, log.completed)}%)
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No entries found for this date
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityLogs;
