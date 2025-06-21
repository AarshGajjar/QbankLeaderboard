import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfWeek, addDays, isAfter } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { calculateConsistencyAndStreak, DAILY_TARGET } from '@/utils/dataPreprocessing';
import { UserProgress as UserProgressType } from '@/types/database';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapProps {
  userProgressData: UserProgressType[];
  userName: string;
}

const ActivityHeatmapDisplay: React.FC<HeatmapProps> = ({ userProgressData, userName }) => {
  const isSameDate = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const dateData = useMemo(() => {
    if (!userProgressData || userProgressData.length === 0) {
      return { grid: [], monthLabels: [] };
    }

    const sortedProgress = [...userProgressData]
      .filter(day => day.completed_count > 0)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    const today = new Date();
    let firstActivityDate = today;
    if (sortedProgress.length > 0 && sortedProgress[0].date) {
        firstActivityDate = parseISO(sortedProgress[0].date);
    }

    const oneYearAgo = addDays(today, -364); // Ensure full 52 weeks typically
    const calendarViewStartDate = isAfter(firstActivityDate, oneYearAgo) ? firstActivityDate : oneYearAgo;
    const firstDayOfCalendar = startOfWeek(calendarViewStartDate, { weekStartsOn: 0 }); // Sunday start

    const grid: Array<Array<{ date: Date; formattedDate: string; hasActivity: boolean } | null>> = Array(7)
      .fill(null)
      .map(() => []);

    const monthLabels: { label: string, weekIndex: number }[] = [];
    let currentMonth = -1;
    let lastPushedMonthLabelForWeek = -1;

    let currentDatePointer = new Date(firstDayOfCalendar);
    // Render up to the end of the current week
    const lastDayToRenderGrid = addDays(startOfWeek(today, { weekStartsOn: 0 }), 6);

    while (currentDatePointer <= lastDayToRenderGrid) {
      const dayOfWeek = currentDatePointer.getDay();
      const formattedDate = format(currentDatePointer, 'yyyy-MM-dd');

      let dayDataForCell = null;
      // Activity is only relevant for past or current dates
      if (!isAfter(currentDatePointer, today) || isSameDate(currentDatePointer, today)) {
          const dayProgress = userProgressData.find(d => d.date === formattedDate);
          dayDataForCell = {
            date: new Date(currentDatePointer),
            formattedDate,
            hasActivity: !!dayProgress && dayProgress.completed_count > 0,
          };
      } else { // Future dates within the rendered grid
         dayDataForCell = {
            date: new Date(currentDatePointer),
            formattedDate,
            hasActivity: false,
         };
      }
      
      grid[dayOfWeek].push(dayDataForCell);

      const currentWeekIndex = grid[dayOfWeek].length - 1;
      if (currentDatePointer.getMonth() !== currentMonth) {
        if (currentWeekIndex !== lastPushedMonthLabelForWeek) {
            if (currentDatePointer.getDate() <= 7 || currentWeekIndex === 0 ) {
                 const monthStr = format(currentDatePointer, 'MMM');
                 if (!monthLabels.find(ml => ml.weekIndex === currentWeekIndex && ml.label === monthStr)) {
                    currentMonth = currentDatePointer.getMonth();
                    monthLabels.push({ label: monthStr, weekIndex: currentWeekIndex });
                    lastPushedMonthLabelForWeek = currentWeekIndex;
                 }
            }
        }
      }
      currentDatePointer = addDays(currentDatePointer, 1);
    }

    const MIN_WEEKS_DISPLAY = 12;
    let firstDisplayableWeek = 0;
    const numWeeksInGrid = grid[0]?.length || 0;

    if (numWeeksInGrid > MIN_WEEKS_DISPLAY) {
        let firstActivityWeekIndex = -1;
        for (let i = 0; i < numWeeksInGrid; i++) {
            let weekHasActivity = false;
            for (let j = 0; j < 7; j++) {
                if (grid[j][i]?.hasActivity) {
                    weekHasActivity = true;
                    break;
                }
            }
            if (weekHasActivity) {
                firstActivityWeekIndex = i;
                break;
            }
        }

        if (firstActivityWeekIndex !== -1) {
            // Try to show a bit of context before the first activity, but not too much
            firstDisplayableWeek = Math.max(0, firstActivityWeekIndex - 2);
            // Ensure we still show at least MIN_WEEKS_DISPLAY if possible
            if (numWeeksInGrid - firstDisplayableWeek < MIN_WEEKS_DISPLAY) {
                 firstDisplayableWeek = Math.max(0, numWeeksInGrid - MIN_WEEKS_DISPLAY);
            }
        } else { // No activity in the whole range, show last MIN_WEEKS_DISPLAY
            firstDisplayableWeek = Math.max(0, numWeeksInGrid - MIN_WEEKS_DISPLAY);
        }
    }

    const finalGrid = grid.map(dayRow => dayRow.slice(firstDisplayableWeek));
    const finalMonthLabels = monthLabels
        .map(ml => ({...ml, weekIndex: ml.weekIndex - firstDisplayableWeek}))
        .filter(ml => ml.weekIndex >=0 && ml.weekIndex < (finalGrid[0]?.length || 0));

    return { grid: finalGrid, monthLabels: finalMonthLabels };
  }, [userProgressData]);
  
  const maxValue = useMemo(() => {
    if (!userProgressData || userProgressData.length === 0) return DAILY_TARGET;
    const max = Math.max(...userProgressData.map(day => day.completed_count), DAILY_TARGET / 4);
    return max || DAILY_TARGET;
  }, [userProgressData]);

  const getColorIntensity = (value: number) => {
    if (value === 0) return 'hsl(var(--muted) / 0.3)';
    const intensity = Math.min(value / maxValue, 1);
    
    if (intensity <= 0) return 'hsl(var(--muted) / 0.3)';
    if (intensity < 0.25) return 'hsl(var(--primary) / 0.2)';
    if (intensity < 0.5) return 'hsl(var(--primary) / 0.4)';
    if (intensity < 0.75) return 'hsl(var(--primary) / 0.7)';
    return 'hsl(var(--primary))';
  };

  const getDayActivity = (date: string) => {
    const dayData = userProgressData.find(d => d.date === date);
    return dayData ? dayData.completed_count : 0;
  };

  const getTooltipText = (formattedDate: string) => {
    const dayData = userProgressData.find(d => d.date === formattedDate);
    const dateObj = parseISO(formattedDate);
    let tooltipText = format(dateObj, 'MMMM d, yyyy');
    
    if (!dayData || dayData.completed_count === 0) {
      if (isAfter(dateObj, new Date()) && !isSameDate(dateObj, new Date())) {
          return tooltipText;
      }
      return `${tooltipText}: No activity`;
    }
    
    tooltipText += `\n${userName}: ${dayData.completed_count} questions (${dayData.correct_count} correct)`;
    return tooltipText;
  };

  const weekColumns = useMemo(() => {
    if (!dateData.grid.length || dateData.grid[0].length === 0) return [];
    
    const numWeeks = dateData.grid[0].length;
    const transposed: Array<Array<{date: Date, formattedDate: string, hasActivity: boolean} | null>> = [];

    for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
      const week: Array<{date: Date, formattedDate: string, hasActivity: boolean} | null> = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        week.push(dateData.grid[dayIndex]?.[weekIndex] || null);
      }
      transposed.push(week);
    }
    return transposed;
  }, [dateData.grid]);

  const { streak: currentStreak, longestStreak } = useMemo(() => {
    if (!userProgressData) return { streak: 0, longestStreak: 0 };
    const preparedData = userProgressData.map(day => ({
      date: day.date,
      completed: day.completed_count,
      correct: day.correct_count,
    }));
    return calculateConsistencyAndStreak(preparedData);
  }, [userProgressData]);

  if (weekColumns.length === 0 && (!userProgressData || userProgressData.length === 0)) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No activity data available to display heatmap.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg rounded-lg overflow-hidden bg-card text-card-foreground">
      <CardHeader className="border-b p-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="w-5 h-5 text-primary" />
            Activity Heatmap for {userName}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${Math.max(20, weekColumns.length) * (12 + 4) + 30}px` }}>
            <div className="flex">
              <div className="flex flex-col mr-1 text-xs text-muted-foreground justify-around pt-5 pr-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className={`h-3 leading-3 ${i > 0 && i < 6 ? 'mb-px' : ''}`}>{day}</div>
                ))}
              </div>
              
              <div className="flex-grow">
                <div className="flex gap-1 mb-1 h-4 items-end">
                  {weekColumns.map((_, weekIndex) => {
                    const monthLabelInfo = dateData.monthLabels.find(ml => ml.weekIndex === weekIndex);
                    return (
                      <div key={`month-${weekIndex}`} className="w-3 text-xs text-muted-foreground text-center" style={{minWidth: '0.75rem'}}>
                        {monthLabelInfo ? monthLabelInfo.label : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {weekColumns.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                      {week.map((dayCell, dayIndex) => {
                        if (!dayCell) {
                          return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3 rounded-sm" style={{backgroundColor: 'hsl(var(--muted)/0.1)'}} />;
                        }
                        const activity = getDayActivity(dayCell.formattedDate);
                        const color = getColorIntensity(activity);
                        const isFutureDate = isAfter(dayCell.date, new Date()) && !isSameDate(dayCell.date, new Date());

                        return (
                          <TooltipProvider key={dayCell.formattedDate} delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="w-3 h-3 rounded-sm cursor-pointer hover:ring-1 hover:ring-ring transition-all"
                                  style={{
                                    background: isFutureDate && activity === 0 ? 'hsl(var(--muted)/0.1)' : color,
                                  }}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getTooltipText(dayCell.formattedDate)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
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

export default ActivityHeatmapDisplay;
