import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '../lib/supabase'; // Direct supabase import for upsert, can be moved to service
import { Toaster, toast } from 'sonner';
import {
  Profile,
  UserProgress as UserProgressType, // Renamed to avoid conflict with component
  ActivityLog as ActivityLogType,
  QuestionBank,
  NewActivityLogPayload,
} from '@/types/database';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { calculateDailyAverage, calculateConsistencyAndStreak, calculateMetrics, DAILY_TARGET as GLOBAL_DAILY_TARGET } from '@/utils/dataPreprocessing';


// TODO: These components need significant refactoring or replacement for single-user/group view
// import StatsComparison from './functionality/StatsComparision';
// import DualUserProgress from './functionality/EnhancedProgress'; // Will be replaced by SingleUserProgressDisplay
import ActivityLogsDisplay from './functionality/ActivityLogs'; // Assuming this can be adapted
import ActivityHeatmapDisplay from './functionality/Heatmap'; // Assuming this can be adapted

// --- Enhanced UserStatsDisplay ---
interface UserStatsDisplayProps {
  userProfile: Profile;
  userProgressData: UserProgressType[];
}
const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({ userProfile, userProgressData }) => {
  const formattedProgressForStats = useMemo(() => userProgressData.map(p => ({
    date: p.date,
    completed: p.completed_count,
    correct: p.correct_count,
  })), [userProgressData]);

  const totalCompleted = formattedProgressForStats.reduce((sum, p) => sum + p.completed, 0);
  const totalCorrect = formattedProgressForStats.reduce((sum, p) => sum + p.correct, 0);
  const overallAccuracy = totalCompleted > 0 ? (totalCorrect / totalCompleted) * 100 : 0;

  const dailyAverage = useMemo(() => calculateDailyAverage(formattedProgressForStats), [formattedProgressForStats]);
  const { consistency, streak, longestStreak } = useMemo(() => calculateConsistencyAndStreak(formattedProgressForStats), [formattedProgressForStats]);
  // Example: Calculate overall points (can be more sophisticated)
  const overallPoints = formattedProgressForStats.reduce((sum, p) => sum + calculateMetrics(p).points, 0);


  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-3">Stats for {userProfile.full_name || userProfile.username}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <p><strong>Total Completed:</strong> {totalCompleted}</p>
        <p><strong>Total Correct:</strong> {totalCorrect}</p>
        <p><strong>Overall Accuracy:</strong> {overallAccuracy.toFixed(1)}%</p>
        <p><strong>Daily Average (Non-Sunday):</strong> {dailyAverage.toFixed(0)}</p>
        <p><strong>Consistency:</strong> {consistency.toFixed(1)}%</p>
        <p><strong>Current Streak:</strong> {streak} days</p>
        <p><strong>Longest Streak:</strong> {longestStreak} days</p>
        <p><strong>Total Points:</strong> {overallPoints}</p>
      </div>
    </div>
  );
};

// --- UserProgressInput (mostly unchanged but used with hook states) ---
const UserProgressInput = ({ onSubmit, disabled }: { onSubmit: (completed: number, correct: number) => Promise<void>, disabled: boolean }) => {
  const [completed, setCompleted] = useState('');
  const [correct, setCorrect] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const completedNum = parseInt(completed, 10);
    const correctNum = parseInt(correct, 10);

    if (isNaN(completedNum) || isNaN(correctNum) || completedNum <= 0 || correctNum < 0 || correctNum > completedNum) {
      setError('Invalid input. Completed must be > 0, correct >= 0 and <= completed.');
      return;
    }
    try {
      await onSubmit(completedNum, correctNum);
      setCompleted('');
      setCorrect('');
      toast.success('Progress updated!');
    } catch (err: any) {
      setError(err.message || 'Failed to submit progress.');
      toast.error(err.message || 'Failed to submit progress.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow space-y-3">
      <h3 className="text-lg font-medium">Log New Progress</h3>
      <div>
        <label htmlFor="completed" className="block text-sm font-medium text-gray-700">Questions Completed</label>
        <input type="number" id="completed" value={completed} onChange={(e) => setCompleted(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 50" disabled={disabled} />
      </div>
      <div>
        <label htmlFor="correct" className="block text-sm font-medium text-gray-700">Questions Correct</label>
        <input type="number" id="correct" value={correct} onChange={(e) => setCorrect(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 40" disabled={disabled} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={disabled}>
        Submit
      </button>
    </form>
  );
};

// --- SingleUserProgressDisplay (replaces DualUserProgress) ---
interface SingleUserProgressDisplayProps {
  userName: string;
  currentCompleted: number;
  dailyTarget: number;
}
const SingleUserProgressDisplay: React.FC<SingleUserProgressDisplayProps> = ({ userName, currentCompleted, dailyTarget }) => {
  const progressPercentage = dailyTarget > 0 ? (currentCompleted / dailyTarget) * 100 : 0;
  return (
    <div className="p-4 border rounded-lg shadow">
      <h3 className="text-lg font-medium mb-2">Today's Goal for {userName}</h3>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span>{currentCompleted} / {dailyTarget} questions</span>
        <span>{progressPercentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
      </div>
    </div>
  );
};


// --- Utility & Main Component ---
const getUTCDateString = () => new Date().toISOString().split('T')[0];

interface StatusAlertProps { message: string; type: 'success' | 'error'; }
const StatusAlert: React.FC<StatusAlertProps> = ({ message, type }) => (
  <Alert className={`${type === 'success' ? 'bg-green-50' : 'bg-red-50'} mb-4`}>
    <div className="flex items-center gap-2">
      {type === 'success' ? <Check className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
      <AlertDescription>{message}</AlertDescription>
    </div>
  </Alert>
);

const QBankTracker: React.FC = () => {
  const { profile: currentUser, loading: userLoading, error: userError } = useUserProfile();
  const [defaultQuestionBank, setDefaultQuestionBank] = useState<QuestionBank | null>(null);
  const [isQbLoading, setIsQbLoading] = useState(true);

  // Fetch Default Question Bank
  useEffect(() => {
    async function fetchDefaultQB() {
      setIsQbLoading(true);
      try {
        const { data: qbData, error: qbError } = await supabase
          .from('question_banks')
          .select('*')
          .eq('name', 'Default QBank')
          .single();
        if (qbError) throw qbError;
        setDefaultQuestionBank(qbData);
      } catch (e: any) {
        toast.error(e.message || "Failed to load default question bank.");
        console.error("Failed to load default question bank:", e);
      } finally {
        setIsQbLoading(false);
      }
    }
    fetchDefaultQB();
  }, []);

  const { progress: userProgressData, loading: progressLoading, error: progressError, refetch: refetchUserProgress } = useUserProgress(currentUser?.id, defaultQuestionBank?.id);
  const { logs: activityLogData, loading: logsLoading, error: logsError, refetch: refetchActivityLogs } = useActivityLogs(currentUser?.id, defaultQuestionBank?.id);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitProgress = async (completedDelta: number, correctDelta: number) => {
    if (!currentUser || !defaultQuestionBank) {
      toast.error('User or question bank not loaded.');
      throw new Error('User or question bank not loaded.');
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const userId = currentUser.id;
    const questionBankId = defaultQuestionBank.id;
    const todayDate = getUTCDateString();

    try {
      const newLogPayload: NewActivityLogPayload = {
        user_id: userId, question_bank_id: questionBankId, completed_delta: completedDelta, correct_delta: correctDelta,
      };
      const { error: logError } = await supabase.from('activity_logs').insert(newLogPayload);
      if (logError) throw logError;

      const { data: existingProgress, error: fetchExistingError } = await supabase
        .from('user_progress').select('*').eq('user_id', userId).eq('question_bank_id', questionBankId).eq('date', todayDate).maybeSingle();
      if (fetchExistingError) throw fetchExistingError;

      const currentCompleted = existingProgress?.completed_count || 0;
      const currentCorrect = existingProgress?.correct_count || 0;
      const upsertData = {
        user_id: userId, question_bank_id: questionBankId, date: todayDate,
        completed_count: currentCompleted + completedDelta, correct_count: currentCorrect + correctDelta,
      };
      const { error: upsertError } = await supabase.from('user_progress').upsert(upsertData, { onConflict: 'user_id, question_bank_id, date' });
      if (upsertError) throw upsertError;

      await Promise.all([refetchUserProgress(), refetchActivityLogs()]);
    } catch (e: any) {
      console.error('Failed to submit progress:', e);
      throw e; // Re-throw for UserProgressInput to catch and display
    } finally {
      setIsSubmitting(false);
    }
  };

  const todaysTotals = useMemo(() => {
    const today = getUTCDateString();
    return activityLogData
      .filter(log => log.timestamp.startsWith(today))
      .reduce((acc, log) => {
        acc.completed += log.completed_delta;
        acc.correct += log.correct_delta;
        return acc;
      }, { completed: 0, correct: 0 });
  }, [activityLogData]);

  const isLoading = userLoading || isQbLoading || progressLoading || logsLoading;
  const overallError = userError || progressError || logsError; // Show first error encountered

  if (isLoading && !overallError) { // Show loading only if no error yet, to prevent flicker
    return <div className="flex justify-center items-center h-screen">Loading QBank Data...</div>;
  }

  if (overallError) {
    return (
      <div className="p-4">
        <StatusAlert message={overallError || "An unknown error occurred."} type="error" />
        {/* Optionally add a button to refetch all data */}
      </div>
    );
  }

  if (!currentUser) {
     return <div className="p-4 text-center">User not found. Please ensure you are logged in.</div>
  }
  if (!defaultQuestionBank) {
     return <div className="p-4 text-center">Default question bank not available.</div>
  }
  return (
    <>
      <Toaster position="top-center" richColors expand closeButton />
      {statusAlert?.visible && (
        <StatusAlert message={statusAlert.message} type={statusAlert.type} onClose={() => setStatusAlert(null)} />
      )}

      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">QBank Tracker for {currentUser.full_name || currentUser.username}</h1>

        <UserProgressInput onSubmit={handleSubmitProgress} disabled={isSubmitting} />

        <UserStatsDisplay userProfile={currentUser} userProgress={userProgress} />

        {/* TODO: Adapt or replace these components.
                  They expect two-user data structures or different props.
        */}
        {/*
        <div className="w-full">
          <h3>Today's Progress</h3>
          <p>Completed: {getTodaysTotalsForCurrentUser().completed} / {DAILY_TARGET}</p>
          <progress value={getTodaysTotalsForCurrentUser().completed} max={DAILY_TARGET} className="w-full"></progress>
        </div>
        */}

        {activityLogs.length > 0 && defaultQuestionBank && currentUser && (
          <ActivityLogsDisplay
            logs={activityLogs.map(log => ({ // Adapt to the old ActivityLog structure if necessary for the component
              id: log.id, // Assuming new id is compatible or component is adapted
              user_type: currentUser.id, // Map to a generic user identifier
              completed: log.completed_delta,
              correct: log.correct_delta,
              timestamp: log.timestamp,
              created_at: log.created_at,
            }))}
            userNames={{ [currentUser.id]: currentUser.full_name || currentUser.username || 'User' }}
            onRefresh={fetchDataForUser}
          />
        )}

        {userProgress.length > 0 && defaultQuestionBank && currentUser && (
           <ActivityHeatmapDisplay
            // This component needs significant adaptation.
            // It expects dailyProgress with user1/user2 fields.
            // We now have userProgress with single user data.
            // For now, let's try to pass what we have, it will likely break or not show correctly.
            dailyProgressData={userProgress.map(up => ({
              date: up.date,
              // These are specific to the old structure, need to adapt Heatmap component
              user1Completed: up.completed_count,
              user1Correct: up.correct_count,
              user2Completed: 0, // Placeholder
              user2Correct: 0,   // Placeholder
            }))}
            userName={currentUser.full_name || currentUser.username || 'User'} // Simplified for one user
          />
        )}

        {/* Old components that are hard to adapt directly without major rewrite or prop changes:
        <StatsComparison ... />
        <DualUserProgress ... />
        */}

      </div>
    </>
  );
};

export default QBankTracker;