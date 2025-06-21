import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, RefreshCw, List, Bell, BellOff } from 'lucide-react';
import CrossPlatformNotifications from './CrossPlatformNotifications';
import InAppNotification from './InAppNotification';
// import { ActivityLog as ActivityLogType } from '@/types/database'; // Not directly used if MappedActivityLog is complete

interface MappedActivityLog {
  id: string | number;
  user_type: string;
  completed: number;
  correct: number;
  timestamp: string;
  created_at: string;
}
interface ActivityLogsDisplayProps {
  logs: MappedActivityLog[]; // Expecting logs for a single user, mapped by QBankTracker
  userName: string; // Single user's name
  userId: string; // Single user's ID
  onRefresh: () => Promise<void>;
}

interface NotificationState {
  enabled: boolean;
  lastSeenLogId: string | number; // Can be string (UUID) or number
}

const calculateAccuracy = (correct: number, total: number): string => {
  if (total === 0) return '0.0';
  return ((correct / total) * 100).toFixed(1);
};

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  });
};

const isSameDate = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

const formatTimeRange = (slotIndex: number): string => {
  const startHour = slotIndex * 3;
  const endHour = startHour + 3;
  return `${String(startHour).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:00`;
};

const getCurrentDate = () => {
  const now = new Date();
  // Standard YYYY-MM-DD for date inputs
  return now.toISOString().split('T')[0];
};

// Email Notification Service - Commented out as it's hardcoded and needs proper user config
/*
export class EmailNotificationService {
  // ... (implementation details for two users) ...
}
*/

const ActivityLogsDisplay: React.FC<ActivityLogsDisplayProps> = ({ logs, userName, userId, onRefresh }) => {
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [dateRange, setDateRange] = useState({ start: getCurrentDate(), end: getCurrentDate() });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'clock' | 'list'>('list');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [notifications, setNotifications] = useState<NotificationState>(() => {
    const saved = localStorage.getItem(`activityLogNotifications_${userId}`);
    return saved ? JSON.parse(saved) : { enabled: false, lastSeenLogId: "0" };
  });
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<number>(Date.now());
  const MINIMUM_REFRESH_INTERVAL = 5000;

  // Define a more specific type for notificationSystem if possible, based on CrossPlatformNotifications.init()
  interface NotificationSystem {
    supported: boolean;
    type: 'pwa' | 'web' | 'fallback' | 'none';
    registration?: ServiceWorkerRegistration; // For PWA
    notify?: (title: string, options: NotificationOptions) => void; // For web/fallback
    show?: (title: string, options: NotificationOptions) => void; // For the actual display method if different
  }
  const [notificationSystem, setNotificationSystem] = useState<NotificationSystem | null>(null);
  // const [emailError, setEmailError] = useState<string | null>(null); // Email related error state removed

  useEffect(() => {
    const handleAutoRefresh = async () => {
      const now = Date.now();
      if (now - lastRefreshAttempt < MINIMUM_REFRESH_INTERVAL) return;
      setLastRefreshAttempt(now);
      try {
        setRefreshError(null); await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error); setRefreshError('Failed to refresh data.');
      }
    };
    const isViewingToday = dateRange.start === getCurrentDate() && !isRangeMode;
    let interval: NodeJS.Timeout;
    if (isViewingToday) interval = setInterval(handleAutoRefresh, 30000);
    return () => { if (interval) clearInterval(interval); };
  }, [onRefresh, dateRange.start, isRangeMode, lastRefreshAttempt]);

  const handleManualRefresh = async () => {
    const now = Date.now();
    if (now - lastRefreshAttempt < MINIMUM_REFRESH_INTERVAL) return;
    setIsRefreshing(true); setLastRefreshAttempt(now);
    try {
      setRefreshError(null); await onRefresh();
    } catch (error) {
      console.error('Manual refresh failed:', error); setRefreshError('Failed to refresh data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredLogs = useMemo(() => logs.filter(log => {
    const logDate = new Date(log.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    if (!isRangeMode) return isSameDate(log.timestamp, dateRange.start);
    endDate.setHours(23, 59, 59);
    return logDate >= startDate && logDate <= endDate;
  }), [logs, dateRange, isRangeMode]);


  const timeSlots = useMemo(() => {
    const slots = Array(8).fill(null).map(() => ({ total: 0, correct: 0, logs: [] as MappedActivityLog[] }));
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const slotIndex = Math.floor((date.getHours() + date.getMinutes() / 60) / 3);
      if (slotIndex >= 0 && slotIndex < slots.length) {
        slots[slotIndex].total += log.completed;
        slots[slotIndex].correct += log.correct;
        slots[slotIndex].logs.push(log);
      }
    });
    return slots;
  }, [filteredLogs]);
  
  const maxTotalInSlot = useMemo(() => Math.max(...timeSlots.map(slot => slot.total), 1), [timeSlots]);

  const dailyTotalStats = useMemo(() => filteredLogs.reduce((acc, log) => {
    acc.completed += log.completed;
    acc.correct += log.correct;
    return acc;
  }, { completed: 0, correct: 0 }), [filteredLogs]);

  const getLogPosition = (timestamp: string) => {
    const date = new Date(timestamp);
    const angle = (date.getHours() * 15 + date.getMinutes() * 0.25) - 90;
    const radians = angle * (Math.PI / 180);
    return { x: Math.cos(radians), y: Math.sin(radians) };
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentTimePosition = () => {
    const h = currentTime.getHours(); const m = currentTime.getMinutes(); const s = currentTime.getSeconds();
    const angle = ((h + m / 60 + s / 3600) * 15 - 90) * (Math.PI / 180);
    return { x: Math.cos(angle), y: Math.sin(angle) };
  };

  const initializeNotifications = useCallback(async () => {
    const system = await CrossPlatformNotifications.init();
    setNotificationSystem(system as NotificationSystem); // Cast to specific type
    if (system.supported && Notification.permission === 'granted') {
      setNotifications(prev => ({ ...prev, enabled: true }));
    } else {
      setNotifications(prev => ({ ...prev, enabled: false }));
    }
  }, []);

  useEffect(() => { initializeNotifications(); }, [initializeNotifications]);

  const toggleNotifications = async () => {
    if (!notificationSystem?.supported && Notification.permission !== 'denied') {
        await Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                initializeNotifications(); // Re-initialize to update system state and enable
            } else { // Permission denied or system not supported after request
                 setNotifications(prev => ({ ...prev, enabled: false }));
            }
        });
    } else if (Notification.permission === "granted" && notificationSystem?.supported) {
        // If already granted and supported, just toggle the enabled state
        setNotifications(prev => ({ ...prev, enabled: !prev.enabled }));
    }
    // If permission is denied, do nothing.
  };

  const showBrowserNotification = useCallback(async (log: MappedActivityLog) => {
    if (!notifications.enabled || !notificationSystem?.supported || Notification.permission !== 'granted') return;

    const title = `${userName} - Progress Update`;
    const body = `Completed: ${log.completed}, Correct: ${log.correct}\nTime: ${formatDate(log.timestamp)}`;
    const options: NotificationOptions = { body, icon: '/assets/qbank.png', tag: `qbank-activity-${log.id}` };

    try {
      if (notificationSystem.type === 'pwa' && notificationSystem.registration) {
        await notificationSystem.registration.showNotification(title, options);
      } else if (notificationSystem.type === 'web' && notificationSystem.notify) {
        notificationSystem.notify(title, options);
      } else if (notificationSystem.type === 'fallback' && notificationSystem.notify) {
        notificationSystem.notify(title, options); // Fallback might trigger in-app + vibrate
      }
    } catch (error) {
      console.error('Browser notification error:', error);
    }
  }, [notifications.enabled, userName, notificationSystem]);

  useEffect(() => {
    if (!notifications.enabled || !filteredLogs.length) return;
    const newLogs = filteredLogs.filter(log => {
        const logIdNum = typeof log.id === 'string' ? parseFloat(log.id) : log.id; // Attempt to parse if string
        const lastSeenIdNum = typeof notifications.lastSeenLogId === 'string'
            ? parseFloat(notifications.lastSeenLogId)
            : notifications.lastSeenLogId;
        return !isNaN(logIdNum) && !isNaN(lastSeenIdNum) && logIdNum > lastSeenIdNum;
    });

    if (newLogs.length > 0) {
      newLogs.forEach(log => showBrowserNotification(log));
      const maxId = newLogs.reduce((max, current) => {
        const currentIdNum = typeof current.id === 'string' ? parseFloat(current.id) : current.id;
        const maxIdNum = typeof max === 'string' ? parseFloat(max) : max;
        return !isNaN(currentIdNum) && !isNaN(maxIdNum) && currentIdNum > maxIdNum ? current.id : max;
      }, notifications.lastSeenLogId);
      setNotifications(prev => ({ ...prev, lastSeenLogId: maxId }));
    }
  }, [filteredLogs, notifications.enabled, notifications.lastSeenLogId, showBrowserNotification, onRefresh, userName]); // Removed onRefresh from deps as it causes loops with auto-refresh

  useEffect(() => {
    if (logs.length > 0 && (notifications.lastSeenLogId === "0")) { // Check against string "0"
        const maxId = logs.reduce((max, current) => {
            const currentIdNum = typeof current.id === 'string' ? parseFloat(current.id) : current.id;
            const maxIdNum = typeof max === 'string' ? parseFloat(max) : max;
             return !isNaN(currentIdNum) && !isNaN(maxIdNum) && currentIdNum > maxIdNum ? current.id : max;
        }, logs[0].id);
      setNotifications(prev => ({ ...prev, lastSeenLogId: maxId }));
    }
  }, [logs, notifications.lastSeenLogId]); // Removed userId dependency as it's now part of the key for localStorage

  useEffect(() => {
    localStorage.setItem(`activityLogNotifications_${userId}`, JSON.stringify(notifications));
  }, [notifications, userId]);

  const calculateDotSize = (completed: number): number => {
    const minSize = 0.01, maxSize = 0.07;
    const maxQuestionsInView = Math.max(...filteredLogs.map(log => log.completed), 1); // Avoid division by zero
    const normalizedCompletion = Math.min(1, completed / maxQuestionsInView);
    return minSize + normalizedCompletion * (maxSize - minSize);
  };

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
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="hover:bg-gradient-to-r hover:from-purple-600/5 hover:to-blue-600/5"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {refreshError && (
          <div className="mt-2 text-sm text-red-500 dark:text-red-400">
            {refreshError}
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
          
          {/* Removed user selection buttons as this component now shows logs for a single user */}
          {/* Display total stats for the current user based on filteredLogs */}
          <div className="mt-4">
            {(() => {
              const sessions = filteredLogs.length;
              const accuracy = calculateAccuracy(dailyTotalStats.correct, dailyTotalStats.completed);
              return (
              <Button
                variant="outline"
                className="w-full cursor-default bg-card text-card-foreground"
              >
                <span className="font-medium">{userName}</span>:
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">
                    {sessions} sessions
                  </span>
                  <span className="ml-auto">
                    {dailyTotalStats.completed} Qs, {accuracy}% Acc
                  </span>
              </Button>
              );
            })()}
          </div>

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
                      // const accuracy = slot.total > 0 ? slot.correct / slot.total : 0; // accuracy in slot not directly used for fill now
                      const intensity = slot.total > 0 ? (slot.total / maxTotalInSlot) : 0; // Use maxTotalInSlot
                      const slotColor = intensity > 0 ? `hsla(var(--primary-hsl), ${intensity * 0.7 + 0.3})` : 'transparent';


                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <path
                              d={`M 0 0 L ${startX} ${startY} A 0.9 0.9 0 0 1 ${endX} ${endY} Z`}
                              fill={slotColor} // Use calculated slotColor
                              // fillOpacity={intensity * 0.3} // Opacity now part of slotColor
                              stroke="hsl(var(--border))" strokeWidth="0.005"
                              className="cursor-pointer hover:opacity-80 transition-all"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-2 space-y-1 bg-background border-border">
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
                      {/* Gradient definition might not be needed if using HSL above */}
                      {/* <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary)/0.5)" />
                      </linearGradient> */}
                      {/* Removed extra </linearGradient> */}
                    </defs>

                    {/* Replace the log markers section in the clock view with this updated version */}
                    {filteredLogs.map((log) => {
                      const { x, y } = getLogPosition(log.timestamp);
                      const dotSize = calculateDotSize(log.completed);
                      // Use a single color scheme for the user, e.g., primary color
                      return (
                        <g key={log.id} transform={`translate(${x}, ${y})`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <circle
                                r={dotSize}
                                fill={'hsl(var(--primary))'}
                                stroke="hsl(var(--background))"
                                strokeWidth="0.01"
                                className="cursor-pointer"
                              />
                            </TooltipTrigger>
                            <TooltipContent className="bg-background border-border">
                              <p>{userName}</p>
                              <p>Completed: {log.completed}</p>
                              <p>Correct: {log.correct}</p>
                              <p>Time: {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour12: false })}</p>
                            </TooltipContent>
                          </Tooltip>
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
                      className="p-3 transition-colors flex justify-between items-center hover:bg-muted/30 dark:hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {/* User name can be omitted here as all logs are for the current user, title indicates this */}
                        {/* <span className="text-primary">{userName}</span> */}
                      </div>
                      <div className="text-sm text-foreground/80">
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

export default ActivityLogsDisplay;
