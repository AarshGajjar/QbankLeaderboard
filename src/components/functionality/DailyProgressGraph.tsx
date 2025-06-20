import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { Flame, Calendar, Brain } from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import TimeAnalysis from '@/components/functionality/TimeAnalysis';
import { 
  DAILY_TARGET, 
  MIN_ACCURACY_TARGET,
  getDate,
  calculateConsistencyAndStreak,
  calculateDailyAverage 
} from '@/utils/dataPreprocessing';

interface UserProgress {
  date: string;
  completed: number;
  correct: number;
  accuracy: number;
}

interface ActivityLog {
  id: number;
  user_type: 'user1' | 'user2';
  completed: number;
  correct: number;
  timestamp: string;
  created_at: string;
}

interface DailyData {
  date: string;
  user1Data: UserProgress;
  user2Data: UserProgress;
}

interface ProgressDashboardProps {
  dailyData: DailyData[];
  user1Name: string;
  user2Name: string;
  activityLogs: ActivityLog[];
  selectedUser?: 'user1' | 'user2';
  hideUserSelect?: boolean;
}

const DailyProgressGraph: React.FC<ProgressDashboardProps> = ({ 
  dailyData = [], 
  user1Name, 
  user2Name,  
  activityLogs, 
  selectedUser
}) => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('all');

  const getFilteredDataByRange = (data: DailyData[]) => {
    const today = new Date();
    const cutoffDate = new Date();
    
    switch (dateRange) {
      case 'week':
        cutoffDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(today.getMonth() - 1);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate && itemDate <= today;
    });
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(dailyData) || dailyData.length === 0) return [];
    return getFilteredDataByRange(dailyData);
  }, [dailyData, dateRange]);

  const stats = useMemo(() => {
    if (!Array.isArray(dailyData)) return { 
      currentStreak: 0, 
      dailyAverage: 0, 
      todayProgress: 0,
      studyConsistency: 0
    };

    const userData = filteredData.map(d => 
      selectedUser === 'user1' ? d?.user1Data : d?.user2Data
    ).filter(Boolean);

    const { streak: currentStreak, consistency: studyConsistency } = calculateConsistencyAndStreak(userData);
    const dailyAverage = calculateDailyAverage(userData);
    const today = getDate().split('T')[0];
    const todayData = userData.find(day => day?.date === today);
    const todayProgress = todayData?.completed || 0;

    return { 
      currentStreak, 
      dailyAverage, 
      todayProgress, 
      studyConsistency 
    };
  }, [filteredData, selectedUser, dailyData]);

  const processedData = useMemo(() => {
    if (!Array.isArray(dailyData)) return [];
    
    return filteredData
      .filter(data => data !== null && data !== undefined)
      .map(data => {
        const userData = selectedUser === 'user1' ? data.user1Data : data.user2Data;
        if (!userData) return null;
        
        return {
          date: data.date,
          completed: userData.completed || 0,
          correct: userData.correct || 0,
          accuracy: userData.completed > 0 
            ? Math.round((userData.correct / userData.completed) * 100)
            : 0
        };
      })
      .filter((day): day is NonNullable<typeof day> => day !== null)
      .filter(day => day.completed > 0);
  }, [filteredData, selectedUser]);

const trendData = useMemo(() => {
  const windowSize = 7;
  
  // Get filtered data first
  const filteredSortedData = getFilteredDataByRange([...dailyData])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate cumulative total from filtered data
  let runningTotal = 0;
  const cumulativeTotals = new Map<string, number>();
  
  filteredSortedData.forEach(data => {
    const userData = selectedUser === 'user1' ? data.user1Data : data.user2Data;
    if (userData) {
      runningTotal += (userData.completed || 0);
      cumulativeTotals.set(data.date, runningTotal);
    }
  });

  // Process data for the chart
  return filteredSortedData
    .map(data => {
      const userData = selectedUser === 'user1' ? data.user1Data : data.user2Data;
      if (!userData) return null;
      
      return {
        date: data.date,
        completed: userData.completed || 0,
        accuracy: userData.completed > 0 
          ? Math.round((userData.correct / userData.completed) * 100)
          : 0,
        cumulativeTotal: cumulativeTotals.get(data.date) || 0
      };
    })
    .filter((day): day is NonNullable<typeof day> => day !== null)
    .filter(day => day.completed > 0)
    .map((data, index, activeArray) => {
      const window = activeArray
        .slice(Math.max(0, index - windowSize + 1), index + 1);
      
      const avgCompleted = window.length > 0
        ? window.reduce((sum, d) => sum + d.completed, 0) / window.length
        : 0;
      
      const avgAccuracy = window.length > 0
        ? window.reduce((sum, d) => sum + d.accuracy, 0) / window.length
        : 0;

      return {
        date: data.date,
        avgCompleted: Math.round(avgCompleted * 10) / 10,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        totalQuestions: data.cumulativeTotal
      };
    });
}, [dailyData, selectedUser, dateRange]);

  return (
    <div className="w-full">
      <Card className="w-full dark:bg-slate-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl md:text-2xl dark:text-white">
              Stats Dashboard - {selectedUser === 'user1' ? user1Name : user2Name}
            </CardTitle>
            <Select value={dateRange} onValueChange={(value: 'week' | 'month' | 'all') => setDateRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Current Streak"
              value={stats.currentStreak}
              valueUnit="days"
              icon={<Flame className="h-4 w-4" />}
              tooltip="Days with target completed (excluding Sundays)"
              iconColor="#f97316"
            />
            <MetricCard
              title="Daily Average"
              value={stats.dailyAverage}
              valueUnit="questions"
              icon={<Calendar className="h-4 w-4" />}
              tooltip="Average questions per day (excluding Sundays)"
              iconColor="#a855f7"
            />
            <MetricCard
              title="Study Consistency"
              value={stats.studyConsistency}
              valueUnit="%"
              icon={<Brain className="h-4 w-4" />}
              tooltip="Days with at least 100 questions and 70% accuracy (last 30 days)"
              iconColor="#4ec9b0"
            />
          </div>

          <div className="w-full mt-6">
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="timeAnalysis">Time Analysis</TabsTrigger>
              </TabsList>
  
              <TabsContent value="progress">
                <div className="w-full aspect-[4/3] sm:aspect-[16/9]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processedData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="var(--grid-color)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: "var(--text-color)" }}
                        tickMargin={10}
                      />
                      <YAxis 
                        yAxisId="left"
                        label={{ value: 'Questions', angle: -90, position: 'insideLeft', offset: 0, fill: "var(--text-color)" }}
                        domain={[0, 'auto']}
                        tick={{ fontSize: 12, fill: "var(--text-color)" }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        label={{ value: 'Accuracy %', angle: 90, position: 'insideRight', offset: 0, fill: "var(--text-color)" }}
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "var(--text-color)" }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "Accuracy") {
                            return [`${value}%`, name];
                          }
                          return [value, name];
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--foreground)'
                        }}
                        labelStyle={{
                          color: 'var(--foreground)'
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="completed"
                        fill="#93c5fd"
                        name="Questions Completed"
                        opacity={0.3}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#7c3aed"
                        name="Accuracy"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="trends">
                <div className="w-full aspect-[4/3] sm:aspect-[16/9]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="var(--grid-color)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: "var(--text-color)" }}
                        tickMargin={10}
                      />
                      <YAxis 
                        yAxisId="left"
                        label={{ value: 'Avg. Questions', angle: -90, position: 'insideLeft', offset: 0, fill: "var(--text-color)" }}
                        domain={[0, 'auto']}
                        tick={{ fontSize: 12, fill: "var(--text-color)" }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        label={{ value: 'Avg. Accuracy %', angle: 90, position: 'insideRight', offset: 0, fill: "var(--text-color)" }}
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "var(--text-color)" }}
                      />
                      <YAxis 
                        yAxisId="total"
                        orientation="right"
                        label={{ value: 'Total Questions', angle: 90, position: 'insideRight', offset: 70, fill: "var(--text-color)" }}
                        domain={[0, 'auto']}
                        tick={{ fontSize: 12, fill: "var(--text-color)" }}
                        hide={true}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === "7-day Avg. Accuracy") {
                            return [`${value}%`, name];
                          }
                          if (name === "Total Completed") {
                            return [`${value} questions`, name];
                          }
                          return [value, name];
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: 'var(--foreground)'
                        }}
                        labelStyle={{
                          color: 'var(--foreground)'
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="avgCompleted"
                        stroke="#93c5fd"
                        name="7-day Avg. Completed"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgAccuracy"
                        stroke="#7c3aed"
                        name="7-day Avg. Accuracy"
                      />
                      <Line
                        yAxisId="total"
                        type="monotone"
                        dataKey="totalQuestions"
                        stroke="#f97316"
                        strokeWidth={2}
                        name="Total Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="timeAnalysis">
                <TimeAnalysis 
                  activityLogs={activityLogs} 
                  selectedUser={selectedUser || 'user1'} 
                  dateRange={dateRange}
                />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyProgressGraph;

function calculateGoalProgress(data: DailyData) {
  const selectedData = data.user1Data || data.user2Data;
  return {
    completed: selectedData?.completed || 0,
    accuracy: selectedData?.completed > 0 
      ? Math.round((selectedData.correct / selectedData.completed) * 100)
      : 0
  };
}