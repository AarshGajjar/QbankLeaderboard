import React, { useState, useEffect } from 'react';
import {Check, AlertCircle} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '../lib/supabase';
import StatsComparison from './functionality/StatsComparision';
import DualUserProgress from './functionality/EnhancedProgress';
import ActivityLogs from './functionality/ActivityLogs';
import ActivityHeatmap from './functionality/Heatmap';
import { Toaster } from 'sonner';

// Type definitions
interface UserStats {
  completed: number;
  correct: number;
  name: string;
  date?: string;
  accuracy?: number;
}

const DAILY_TARGET = 200;

type UserKey = 'user1' | 'user2';
type AlertType = 'success' | 'error';


interface SectionHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}

interface StatusAlertProps {
  message: string;
  type: AlertType;
  onClose: () => void;
}

interface DailyData {
  user1Data: UserStats;
  user2Data: UserStats;
  date: string;
}

interface ActivityLog {
  id: number;
  user_type: UserKey;
  completed: number;
  correct: number;
  timestamp: string;
  created_at: string;
}

interface DailyProgress {
  date: string;
  user1Completed: number;
  user1Correct: number;
  user2Completed: number;
  user2Correct: number;
}

interface AppState {
  stats: {
    user1: UserStats;
    user2: UserStats;
  };
  inputs: {
    user1: { completed: string; correct: string };
    user2: { completed: string; correct: string };
  };
  error: {
    user1: string;
    user2: string;
  };
  password: {
    user1: string;
    user2: string;
  };
  showPasswordInput: {
    user1: boolean;
    user2: boolean;
  };
  showInputs: {
    user1: boolean;
    user2: boolean;
  };
}

// Utility functions
const calculateAccuracy = (correct: number, total: number): string => {
  if (total === 0) return '0';
  return ((correct / total) * 100).toFixed(1);
};

const calculateMetrics = (stats: UserStats) => {
  const accuracy = parseFloat(calculateAccuracy(stats.correct, stats.completed));
  const accuracyThreshold = 80;
  const accuracyBonus = accuracy >= accuracyThreshold ? (accuracy - accuracyThreshold) * 2 : 0;
  const points = stats.completed + (accuracyBonus * stats.completed / 100);
  
  return {
    accuracy,
    points: Math.round(points),
    questionsPerDay: stats.completed,
    effectiveScore: stats.correct
  };
};


interface Comparison {
  diff: number;
  leader: UserKey;
  metric: string;
  value: string;
}

interface ComparisonResult {
  overallLeader: UserKey;
  comparisons: {
    accuracy: Comparison;
    volume: Comparison;
    points: Comparison;
    effectiveScore: Comparison;
  };
  user1Metrics: ReturnType<typeof calculateMetrics>;
  user2Metrics: ReturnType<typeof calculateMetrics>;
}


const getISTDate = () => {
  const date = new Date();
  const istTime = date.getTime() + (5.5 * 60 * 60 * 1000);
  const istDate = new Date(istTime);
  return istDate.toISOString().split('T')[0];
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


  // Section toggle component

  // Alert component
  const StatusAlert: React.FC<StatusAlertProps> = ({ message, type }) => (
    <Alert className={`${type === 'success' ? 'bg-green-50' : 'bg-red-50'} mb-4`}>
      <div className="flex items-center gap-2">
        {type === 'success' ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
        <AlertDescription>{message}</AlertDescription>
      </div>
    </Alert>
  );

// Main component
const QBankTracker: React.FC = () => {
  
  const [state, setState] = useState<AppState>({
    stats: {
      user1: { completed: 0, correct: 0, name: "Aarsh" },
      user2: { completed: 0, correct: 0, name: "Aman" }
    },
    inputs: {
      user1: { completed: '', correct: '' },
      user2: { completed: '', correct: '' }
    },
    showInputs: {
      user1: false,
      user2: false
    },
    error: {
      user1: '',
      user2: ''
    },
    password: {
      user1: '',
      user2: ''
    },
    showPasswordInput: {
      user1: false,
      user2: false
    }
  });

  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Refresh data function
  const refreshData = async () => {
    await fetchData();
    await fetchDailyProgress();
  };

  // Alerts
  const [showAlert, setShowAlert] = useState<{
    message: string;
    type: AlertType;
    visible: boolean;
  }>({ message: '', type: 'success', visible: false });

  const [expandedSections, setExpandedSections] = useState<{
    progress: boolean;
    charts: boolean;
    logs: boolean;
  }>({
    progress: true,
    charts: false,
    logs: false,
  });

  // Data fetching functions
  const fetchData = async () => {
    try {
      const [statsResponse, logsResponse] = await Promise.all([
        supabase
          .from('qbank_stats')
          .select('*')
          .eq('id', 'main')
          .single(),
        supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (statsResponse.error && statsResponse.error.code !== 'PGRST116') {
        throw statsResponse.error;
      }

      if (logsResponse.error) {
        throw logsResponse.error;
      }

      if (statsResponse.data?.stats) {
        setState(prev => ({ ...prev, stats: statsResponse.data.stats }));
      }

      if (logsResponse.data) {
        setActivityLogs(logsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchDailyProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      
      const transformedData = data?.map(entry => ({
        date: entry.date,
        user1Completed: entry.user1_completed,
        user1Correct: entry.user1_correct,
        user2Completed: entry.user2_completed,
        user2Correct: entry.user2_correct
      }));

      setDailyProgress(transformedData || []);
    } catch (error) {
      console.error('Failed to fetch daily progress:', error);
    }
  };

  // Update functions
  const updateDailyProgress = async (user: UserKey, completed: number, correct: number) => {
    const today = getISTDate();
    try {
      const { data: existingData } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      const userCompletedField = `${user}_completed`;
      const userCorrectField = `${user}_correct`;

      if (existingData) {
        await supabase
          .from('daily_progress')
          .update({
            [userCompletedField]: (existingData[userCompletedField] || 0) + completed,
            [userCorrectField]: (existingData[userCorrectField] || 0) + correct
          })
          .eq('date', today);
      } else {
        await supabase
          .from('daily_progress')
          .insert({
            date: today,
            user1_completed: user === 'user1' ? completed : 0,
            user1_correct: user === 'user1' ? correct : 0,
            user2_completed: user === 'user2' ? completed : 0,
            user2_correct: user === 'user2' ? correct : 0
          });
      }

      await fetchDailyProgress();
    } catch (error) {
      console.error('Error updating daily progress:', error);
    }
  };

  const handleSubmit = async (user: UserKey, completed: number, correct: number) => {
    
    // Validation
    if (completed === 0 || correct > completed || completed < 0 || correct < 0) {
      setState(prev => ({
        ...prev,
        error: { ...prev.error, [user]: "Invalid input values" }
      }));
      return;
    }

    try {
      const updatedStats = {
        ...state.stats,
        [user]: {
          ...state.stats[user],
          completed: state.stats[user].completed + completed,
          correct: state.stats[user].correct + correct,
        },
      };
  
      // Update stats in database
      const { error: statsError } = await supabase
        .from('qbank_stats')
        .upsert({
          id: 'main',
          stats: updatedStats,
          last_updated: new Date().toISOString(),
        });
  
      if (statsError) throw statsError;
  
      // Create activity log entry
      const { error: logError } = await supabase
        .from('activity_logs')
        .insert({
          user_type: user,
          completed: completed,
          correct: correct,
          timestamp: new Date().toISOString()
        });
  
      if (logError) throw logError;
  
      // Update daily progress
      await updateDailyProgress(user, completed, correct);
  
      // Update local state
      setState(prev => ({
        ...prev,
        stats: updatedStats
      }));
  
      // Refresh data to ensure consistency
      await fetchData();
  
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error; // This will be caught by the StatsComparison component
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    fetchDailyProgress();
  }, []);

  const getTodaysTotals = (logs: ActivityLog[]) => {
    const today = getISTDate();
    return logs.reduce((acc, log) => {
      if (isSameDate(log.timestamp, today)) {
        const userKey = log.user_type as UserKey;
        acc[userKey].completed += log.completed;
        acc[userKey].correct += log.correct;
      }
      return acc;
    }, {
      user1: { completed: 0, correct: 0 },
      user2: { completed: 0, correct: 0 }
    });
  };

  // Common alert component
  const alertComponent = showAlert.visible && (
    <StatusAlert
      message={showAlert.message}
      type={showAlert.type}
      onClose={() => setShowAlert(prev => ({ ...prev, visible: false }))}
    />
  );

  // Common content components
  const statsComparisonComponent = (
    <StatsComparison
      stats={state.stats}
      onUpdateProgress={handleSubmit}
      dailyData={dailyProgress}
      activityLogs={activityLogs}
    />
  );

  const activityLogsComponent = (
    <ActivityLogs
      logs={activityLogs}
      userNames={{
        user1: state.stats.user1.name,
        user2: state.stats.user2.name
      }}
      onRefresh={refreshData}
    />
  );

  const progressComponent = (
    <DualUserProgress
      user1={{
        name: state.stats.user1.name,
        current: getTodaysTotals(activityLogs).user1.completed,
        color: "#7242eb"
      }}
      user2={{
        name: state.stats.user2.name,
        current: getTodaysTotals(activityLogs).user2.completed,
        color: "#2563eb"
      }}
      target={DAILY_TARGET}
    />
  );

  const heatmapComponent = (
    <ActivityHeatmap
      dailyProgress={dailyProgress}
      userNames={{
        user1: state.stats.user1.name,
        user2: state.stats.user2.name
      }}
    />
  );

  return (
    <>
      <Toaster 
        position="top-center" 
        richColors 
        expand 
        closeButton 
      />
      {/* Mobile layout */}
      <div className="flex flex-col gap-6 lg:hidden">
        {alertComponent}
        <div className="w-full">{progressComponent}</div>
        <div className="w-full">{statsComparisonComponent}</div>
        <div className="w-full">{activityLogsComponent}</div>
        <div className="w-full">{heatmapComponent}</div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid grid-rows-[auto_1fr] gap-6 w-full max-w-[1600px] mx-auto">
        <div className="row-span-1 w-full">{progressComponent}</div>
        <div className="grid grid-cols-2 gap-6 justify-center items-start">
          {statsComparisonComponent}
          {activityLogsComponent}
        </div>
        <div className="w-full">{heatmapComponent}</div>
      </div>
    </>
  );
};

export default QBankTracker;