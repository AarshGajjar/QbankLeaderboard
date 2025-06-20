import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, startOfWeek, addDays, isAfter, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { calculateConsistencyAndStreak } from '@/utils/dataPreprocessing';

interface HeatmapProps {
  dailyProgress: Array<{
    date: string;
    user1Completed: number;
    user1Correct: number;
    user2Completed: number;
    user2Correct: number;
  }>;
  userNames: {
    user1: string;
    user2: string;
  };
}

const ActivityHeatmap: React.FC<HeatmapProps> = ({ dailyProgress, userNames }) => {
  const [selectedUsers, setSelectedUsers] = useState<('user1' | 'user2')[]>(['user1', 'user2']);

  const toggleUserSelection = (user: 'user1' | 'user2') => {
    setSelectedUsers(prev => 
      prev.includes(user) 
        ? prev.filter(u => u !== user)
        : [...prev, user]
    );
  };

  // Generate the grid from first activity to today
  const dateData = useMemo(() => {
    if (!dailyProgress.length) {
      return { grid: [] };
    }
  
    // Find the first activity date
    const sortedDates = [...dailyProgress]
      .filter(day => day.user1Completed > 0 || day.user2Completed > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
    const firstActivityDate = sortedDates.length > 0 
      ? parseISO(sortedDates[0].date) 
      : new Date(2025, 0, 1);
  
    const today = new Date();
    const firstDayOfCalendar = startOfWeek(firstActivityDate);
    const totalDays = Math.ceil((today.getTime() - firstDayOfCalendar.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.ceil(totalDays / 7);
  
    const grid: Array<Array<{date: Date, formattedDate: string, hasActivity: boolean}>> = [];
  
    for (let i = 0; i < 7; i++) {
      grid[i] = [];
    }
  
    let currentDate = firstDayOfCalendar;
    while (currentDate <= today) {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = addDays(weekStart, 6);
      
      // Check if this week spans two months
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        if (date > today) continue;

        const formattedDate = format(date, 'yyyy-MM-dd');
        const dayData = dailyProgress.find(d => d.date === formattedDate);
        const hasActivity = dayData ? (dayData.user1Completed > 0 || dayData.user2Completed > 0) : false;
        
        // If this is the first day of a month and it's not Sunday,
        // add empty cells for the previous month
        if (date.getDate() === 1 && i > 0) {
          // Clear the current week up to this point
          for (let j = 0; j < i; j++) {
            grid[j].pop();
          }
          // Add empty cells for the remainder of the previous month
          for (let j = 0; j < i; j++) {
            const emptyDate = addDays(date, -i + j);
            grid[j].push({
              date: emptyDate,
              formattedDate: format(emptyDate, 'yyyy-MM-dd'),
              hasActivity: false
            });
          }
        }

        grid[i].push({
          date,
          formattedDate,
          hasActivity
        });
      }

      currentDate = addDays(weekEnd, 1);
    }
  
    return { grid };
  }, [dailyProgress]);
  
  // Find max value for color intensity scaling
  const maxValue = useMemo(() => {
    if (!dailyProgress.length) return 10;
    
    let max = 0;
    dailyProgress.forEach(day => {
      if (selectedUsers.includes('user1')) {
        max = Math.max(max, day.user1Completed);
      }
      if (selectedUsers.includes('user2')) {
        max = Math.max(max, day.user2Completed);
      }
    });
    
    return max || 10; // Default to 10 if no data
  }, [dailyProgress, selectedUsers]);

  // Get intensity color with the new colors
  const getColorIntensity = (value: number, userType: 'user1' | 'user2') => {
    if (value === 0) return '#ebedf0'; // Empty cell color
    
    // Use linear scale with 20 levels
    const normalizedValue = Math.min(
      Math.floor((value / maxValue) * 19),
      19
    );
    
    // Purple for user1: #7242eb with 20 gradients
    const user1Colors = [
      '#ebedf0',
      '#f7f5fc', // Lightest purple
      '#f0ebfa',
      '#e9e2f8',
      '#e2d8f6',
      '#dbcff4',
      '#d4c5f2',
      '#cdbbf0',
      '#c6b2ee',
      '#bfa8ec',
      '#b89fea',
      '#b195e8',
      '#aa8ce6',
      '#a382e4',
      '#9c79e2',
      '#956fe0',
      '#8e66de',
      '#875cdc',
      '#8053da',
      '#794ad8',
      '#7242eb'  // Darkest purple
    ];
    
    // Blue for user2: #2563eb with 20 gradients
    const user2Colors = [
      '#ebedf0',
      '#f0f4fc', // Lightest blue
      '#e6edfb',
      '#dce6fa',
      '#d2dff9',
      '#c8d8f8',
      '#bed1f7',
      '#b4caf6',
      '#aac3f5',
      '#a0bcf4',
      '#96b5f3',
      '#8caef2',
      '#82a7f1',
      '#78a0f0',
      '#6e99ef',
      '#6492ee',
      '#5a8bed',
      '#5084ec',
      '#467deb',
      '#3c76ea',
      '#2563eb'  // Darkest blue
    ];
    
    return userType === 'user1' ? user1Colors[normalizedValue] : user2Colors[normalizedValue];
  };

  // Find activity value for a specific day
  const getDayActivity = (date: string, userType: 'user1' | 'user2') => {
    const dayData = dailyProgress.find(d => d.date === date);
    if (!dayData) return 0;
    
    return userType === 'user1' ? dayData.user1Completed : dayData.user2Completed;
  };

  // Generate tooltip text for a specific day
  const getTooltipText = (date: string) => {
    let tooltipText = format(parseISO(date), 'MMMM d, yyyy');
    
    const dayData = dailyProgress.find(d => d.date === date);
    if (!dayData) return `${tooltipText}: No activity`;
    
    if (selectedUsers.includes('user1')) {
      tooltipText += `\n${userNames.user1}: ${dayData.user1Completed} questions`;
    }
    
    if (selectedUsers.includes('user2')) {
      tooltipText += `\n${userNames.user2}: ${dayData.user2Completed} questions`;
    }
    
    return tooltipText;
  };

  // Only render days that have activity
  const weekColumns = useMemo(() => {
    if (!dateData.grid.length) return [];
    
    // Transpose the grid to get weeks as columns
    const weeks: Array<Array<{date: Date, formattedDate: string, hasActivity: boolean}>> = [];
    
    // Find the maximum length across all rows
    const maxWeeks = Math.max(...dateData.grid.map(row => row.length));
    
    for (let weekIndex = 0; weekIndex < maxWeeks; weekIndex++) {
      const week: Array<{date: Date, formattedDate: string, hasActivity: boolean}> = [];
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        if (dateData.grid[dayIndex] && dateData.grid[dayIndex][weekIndex]) {
          week.push(dateData.grid[dayIndex][weekIndex]);
        }
      }
      
      // Check if this week has any activity
      const hasActivityInWeek = week.some(day => day.hasActivity);
      
      if (hasActivityInWeek) {
        weeks.push(week);
      }
    }
    
    return weeks;
  }, [dateData]);

  // Replace the streak calculation with the utility function
  const { currentStreak, longestStreak } = useMemo(() => {
    const userData = dailyProgress.map(day => ({
      date: day.date,
      completed: selectedUsers.reduce((sum, user) => 
        sum + day[`${user}Completed` as 'user1Completed' | 'user2Completed'], 0),
      correct: selectedUsers.reduce((sum, user) => 
        sum + day[`${user}Correct` as 'user1Correct' | 'user2Correct'], 0)
    }));

    const { streak, longestStreak } = calculateConsistencyAndStreak(userData);
    return { currentStreak: streak, longestStreak };
  }, [dailyProgress, selectedUsers]);

  if (weekColumns.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No activity data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg rounded-lg overflow-hidden bg-gradient-to-br from-white/80 via-white/90 to-white/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/20">
      <CardHeader className="border-b p-4 relative z-10 bg-gradient-to-r from-purple-600/15 to-blue-600/15 dark:from-purple-900/20 dark:to-blue-900/20 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="w-5 h-5 text-amber-500" />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
            Activity Heatmap
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center gap-2 mt-2 mb-4">
          {(['user1', 'user2'] as const).map((userType) => (
        <Button
          key={userType}
          variant={selectedUsers.includes(userType) ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleUserSelection(userType)}
          className={`
            ${selectedUsers.includes(userType)
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
          : 'text-foreground hover:bg-accent'}
            ${!selectedUsers.includes(userType) && 'opacity-50'}
            transition-all duration-300
          `}
        >
          {userNames[userType]}
        </Button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[750px]">
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col mr-2 text-xs text-muted-foreground">
                <div className="h-3 mb-1">Sun</div>
                <div className="h-3 mb-1">Mon</div>
                <div className="h-3 mb-1">Tue</div>
                <div className="h-3 mb-1">Wed</div>
                <div className="h-3 mb-1">Thu</div>
                <div className="h-3 mb-1">Fri</div>
                <div className="h-3 mb-1">Sat</div>
              </div>
              
              {/* Grid */}
              <div className="flex gap-1">
                {weekColumns.map((week, weekIndex) => (
                  <div key={weekIndex}>
                    {week.map((dayData, dayIndex) => {
                      let user1Activity = getDayActivity(dayData.formattedDate, 'user1');
                      let user2Activity = getDayActivity(dayData.formattedDate, 'user2');
                      
                      let color;
                      if (selectedUsers.length === 1) {
                        const userType = selectedUsers[0];
                        const activity = userType === 'user1' ? user1Activity : user2Activity;
                        color = getColorIntensity(activity, userType);
                      } else if (selectedUsers.length === 2 && user1Activity > 0 && user2Activity > 0) {
                        color = `linear-gradient(90deg, 
                          ${getColorIntensity(user1Activity, 'user1')} 50%, 
                          ${getColorIntensity(user2Activity, 'user2')} 50%)`;
                      } else if (selectedUsers.includes('user1') && user1Activity > 0) {
                        color = getColorIntensity(user1Activity, 'user1');
                      } else if (selectedUsers.includes('user2') && user2Activity > 0) {
                        color = getColorIntensity(user2Activity, 'user2');
                      } else {
                        color = '#ebedf0';
                      }
                      
                      return (
                        <div 
                          key={dayIndex}
                          className="w-3 h-3 rounded-sm mb-1 cursor-pointer hover:ring-1 hover:ring-gray-400 transition-all"
                          style={{ background: color }}
                          title={getTooltipText(dayData.formattedDate)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Streak Information */}
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Current Streak:</span>
                <span className="font-semibold text-foreground">{currentStreak} days</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Longest Streak:</span>
                <span className="font-semibold text-foreground">{longestStreak} days</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;