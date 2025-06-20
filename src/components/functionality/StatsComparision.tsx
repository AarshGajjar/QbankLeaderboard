import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChartLine, Crown, Plus, Swords } from 'lucide-react';
import ProgressPopup from '@/components/functionality/ProgressPopup';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserStatsRadarChart from '@/components/functionality/RadarChart';
import { toast } from 'sonner';
import { 
  calculateMetrics,
  calculateDailyAverage,
  calculateConsistencyAndStreak 
} from '@/utils/dataPreprocessing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {EmailNotificationService} from './ActivityLogs';

type UserKey = 'user1' | 'user2';

interface UserStats {
  completed: number;
  correct: number;
  name: string;
}

interface Stats {
  user1: UserStats;
  user2: UserStats;
}

const StatsComparison: React.FC<{
  stats: Stats;
  dailyData: any[];
  activityLogs: any[];
  onUpdateProgress: (user: UserKey, completed: number, correct: number) => Promise<void>;
}> = ({ stats, dailyData, activityLogs, onUpdateProgress }) => {
  const [activeUser, setActiveUser] = useState<UserKey | null>(null);
  const [inputs, setInputs] = useState({ completed: '', correct: '' });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedProgressUser, setSelectedProgressUser] = useState<UserKey>('user1');
  const [isRadarChartOpen, setIsRadarChartOpen] = useState(false);
  const [emailService] = useState(() => new EmailNotificationService());
  const user1Metrics = calculateMetrics(stats.user1);
  const user2Metrics = calculateMetrics(stats.user2);
  const leader: UserKey = user1Metrics.points > user2Metrics.points ? 'user1' : 'user2';
  const pointsDiff = Math.abs(user1Metrics.points - user2Metrics.points);

  const user1DailyAverage = calculateDailyAverage(
    dailyData.filter(data => data.user1Completed !== undefined)
      .map(data => ({
        date: data.date,
        completed: data.user1Completed
      }))
  );

  const user2DailyAverage = calculateDailyAverage(
    dailyData.filter(data => data.user2Completed !== undefined)
      .map(data => ({
        date: data.date,
        completed: data.user2Completed
      }))
  );

  const user1ConsistencyAndStreak = calculateConsistencyAndStreak(
    dailyData.filter(data => data.user1Completed !== undefined)
      .map(data => ({
        date: data.date,
        completed: data.user1Completed,
        correct: data.user1Correct
      }))
  );

  const user2ConsistencyAndStreak = calculateConsistencyAndStreak(
    dailyData.filter(data => data.user2Completed !== undefined)
      .map(data => ({
        date: data.date,
        completed: data.user2Completed,
        correct: data.user2Correct
      }))
  );

  const handlePasswordSubmit = () => {
    if (activeUser && password === (activeUser === 'user1' ? '9696' : '6969')) {
      setIsPasswordMode(false);
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getTodaysTotals = () => {
    const today = getCurrentDate();
    return dailyData
      .filter(data => data.date === today)
      .reduce((acc, data) => ({
        user1: (data.user1Completed || 0),
        user2: (data.user2Completed || 0)
      }), { user1: 0, user2: 0 });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
  
    const completed = parseInt(inputs.completed);
    const correct = parseInt(inputs.correct);
    
    if (!activeUser || isNaN(completed) || isNaN(correct) || 
        correct > completed || completed < 0 || correct < 0) {
      toast.error('Invalid input');
      return;
    }
  
    try {
      setIsSubmitting(true);
      setError('');
      
      // Update progress
      await onUpdateProgress(activeUser, completed, correct);
      
      // Create log object for notification
      const newLog = {
        id: Date.now(),
        user_type: activeUser,
        completed,
        correct,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
  
      // Get current day's totals including the new submission
      const todaysTotals = getTodaysTotals();
      todaysTotals[activeUser] += completed; // Add the new submission to today's total
  
      // Send notification
      try {
        const message = emailService.formatActivityMessage(newLog, {
          user1: stats.user1.name,
          user2: stats.user2.name
        }, todaysTotals);
        
        await emailService.sendEmail(message);
      } catch (error) {
        console.error('Failed to send notification:', error);
        toast.error('Progress updated but notification failed to send');
      }
  
      toast.success(`${completed} questions added for ${stats[activeUser].name}`);
      
      setInputs({ completed: '', correct: '' });
      setActiveUser(null);
      setIsPasswordMode(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Progress update failed:', error);
      toast.error('Failed to update progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ComparisonBar: React.FC<{ label: string; value1: number; value2: number; unit?: string }> = ({ label, value1, value2, unit = '' }) => {
    const colors = {
      better: 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500',
      worse: 'bg-gradient-to-r from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700',
      label: 'text-slate-700 dark:text-slate-200'
    };

    const max = Math.max(value1, value2)*1.3;
    const width1 = (value1 / max) * 100;
    const width2 = (value2 / max) * 100;

    return (
      <div className="w-full p-4 rounded-lg">
      <div className="text-s font-medium text-center mb-3 text-white-700">{label}</div>
      <div className="flex items-center gap-4">
        <div className="w-16 text-right">
        <span className="font-semibold text-l text-[#7242eb] dark:text-purple-400 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 shadow-sm">
          {unit === '%' ? value1.toFixed(2) : value1}{unit}
        </span>
        </div>
        
        <div className="flex-1 h-8 rounded-lg relative">
        <div className="absolute inset-0 flex">
          <div className="w-1/2 flex justify-end">
          <div 
            className={`absolute top-0 bottom-0 right-1/2 ${value1 >= value2 ? colors.better : colors.worse} rounded-l-lg transition-all duration-300`} 
            style={{ 
            width: `${width1/2}%`,
            right: '50%'
            }}
          />
          </div>
          
          <div className="w-1/2">
          <div 
            className={`absolute top-0 bottom-0 left-1/2 ${value2 >= value1 ? colors.better : colors.worse} rounded-r-lg transition-all duration-300`} 
            style={{ 
            width: `${width2/2}%`,
            left: '50%'
            }}
          />
          </div>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-full shadow-sm">
          {Math.abs(value1 - value2).toFixed(unit === '%' ? 2 : 0)}{unit}
          </span>
        </div>
        </div>
        
        <div className="w-16 text-left">
        <span className="font-semibold text-l text-[#4287eb] dark:text-blue-400 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 shadow-sm">
          {unit === '%' ? value2.toFixed(2) : value2}{unit}
        </span>
        </div>
      </div>
      </div>
    );
    };


  return (
    <>
      <Card className="relative w-full h-full shadow-lg rounded-lg bg-gradient-to-br from-white/80 via-white/90 to-white/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/20">
        <CardHeader className="border-b p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Swords className="w-5 h-5 text-amber-500" />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Battle Arena
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 flex flex-col h-[calc(100%-73px)] overflow-auto">
          <div className="min-w-0 w-full flex flex-col flex-1">
            {/* Header section */}
            <div className="flex justify-between items-center mb-6 gap-2">
              {/* User 1 Header */}
              <div className="flex-1 min-w-[120px]">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-xl text-[#7242eb] dark:text-purple-400 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800 shadow-sm truncate">
                    {stats.user1.name}
                  </h3>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setActiveUser('user1'); setIsDialogOpen(true); }}
                      className="hover:bg-purple-50 border-purple-600/20 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1 text-purple-600" />
                      <span className="text-purple-600">Add</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setSelectedProgressUser('user1'); setShowProgress(true); }}
                      className="hover:bg-blue-50 border-blue-600/20 text-xs"
                    >
                      <ChartLine className="w-3 h-3 mr-1 text-blue-600" />
                      <span className="text-blue-600">Stats</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* VS Header */}
              <div className="w-16 flex-shrink-0">
                <div className="text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-800/50 rounded-full transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-8 sm:w-12 h-8 sm:h-12"></div>
                    <button 
                      onClick={() => setIsRadarChartOpen(true)}
                      className="text-base sm:text-lg font-semibold text-purple-600/70 relative z-10 p-2 hover:text-blue-600 transition-colors"
                    >
                      VS
                    </button>
                  </div>
                  <div className="flex justify-center mt-2">
                    <div className="relative">
                      <UserStatsRadarChart 
                        user1={{
                          name: stats.user1.name,
                          total: stats.user1.completed,
                          correct: stats.user1.correct,
                          accuracy: user1Metrics.accuracy,
                          dailyAverage: user1DailyAverage,
                          consistency: user1ConsistencyAndStreak.consistency,
                          streak: user1ConsistencyAndStreak.streak
                        }}
                        user2={{
                          name: stats.user2.name,
                          total: stats.user2.completed,
                          correct: stats.user2.correct,
                          accuracy: user2Metrics.accuracy,
                          dailyAverage: user2DailyAverage,
                          consistency: user2ConsistencyAndStreak.consistency,
                          streak: user2ConsistencyAndStreak.streak
                        }}
                        isOpen={isRadarChartOpen}
                        onOpenChange={setIsRadarChartOpen}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* User 2 Header */}
              <div className="flex-1 min-w-[120px]">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-xl text-[#4287eb] dark:text-blue-400 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 shadow-sm truncate">
                    {stats.user2.name}
                  </h3>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setActiveUser('user2'); setIsDialogOpen(true); }}
                      className="hover:bg-purple-50 border-purple-600/20 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1 text-purple-600" />
                      <span className="text-purple-600">Add</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setSelectedProgressUser('user2'); setShowProgress(true); }}
                      className="hover:bg-blue-50 border-blue-600/20 text-xs"
                    >
                      <ChartLine className="w-3 h-3 mr-1 text-blue-600" />
                      <span className="text-blue-600">Stats</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparisons */}
            <div className="space-y-4 w-full flex-1 flex flex-col justify-center">
              <ComparisonBar 
                label="Total Completed"
                value1={stats.user1.completed}
                value2={stats.user2.completed}
              />
              <ComparisonBar 
                label="Correct Answers"
                value1={stats.user1.correct}
                value2={stats.user2.correct}
              />
              <ComparisonBar 
                label="Accuracy"
                value1={user1Metrics.accuracy}
                value2={user2Metrics.accuracy}
                unit="%"
              />
            </div>

            {/* Leader Banner */}
            <div className="mt-auto mb-4 flex justify-center w-full">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger>
                    <div className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg shadow-sm cursor-help">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 dark:text-yellow-400" />
                      <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                        {stats[leader].name} leads by {pointsDiff} points
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="top">
                    <p className="text-xs sm:text-sm">Points = Questions Completed + +2% points per 1% accuracy above 80%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Dialogs */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setActiveUser(null);
                setIsPasswordMode(true);
                setError('');
                setInputs({ completed: '', correct: '' });
              }
            }}>
              <DialogContent className="sm:max-w-[325px]">
                <DialogHeader>
                  <DialogTitle>Add {activeUser === 'user1' ? stats.user1.name : stats.user2.name}'s progress</DialogTitle>
                </DialogHeader>
                {isPasswordMode ? (
                  <div className="space-y-4">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="text-lg tracking-wider"
                    />
                    <Button className="w-full" onClick={handlePasswordSubmit}>Verify</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      type="number"
                      placeholder="Questions Completed"
                      value={inputs.completed}
                      onChange={(e) => setInputs(prev => ({ ...prev, completed: e.target.value }))}
                      className="text-lg"
                    />
                    <Input
                      type="number"
                      placeholder="Correct Answers"
                      value={inputs.correct}
                      onChange={(e) => setInputs(prev => ({ ...prev, correct: e.target.value }))}
                      className="text-lg"
                    />
                    <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Add'}</Button>
                  </div>
                )}
                {error && <p className="text-sm text-rose-600 text-center">{error}</p>}
              </DialogContent>
            </Dialog>

            <ProgressPopup
              isOpen={showProgress}
              onClose={() => setShowProgress(false)}
              dailyData={dailyData.map(p => ({
                date: p.date,
                user1Data: {
                  completed: p.user1Completed,
                  correct: p.user1Correct,
                  date: p.date,
                  accuracy: p.user1Completed > 0 ? (p.user1Correct / p.user1Completed) * 100 : 0
                },
                user2Data: {
                  completed: p.user2Completed,
                  correct: p.user2Correct,
                  date: p.date,
                  accuracy: p.user2Completed > 0 ? (p.user2Correct / p.user2Completed) * 100 : 0
                }
              }))}
              user1Name={stats.user1.name}
              user2Name={stats.user2.name}
              selectedUser={selectedProgressUser}
              activityLogs={activityLogs}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default StatsComparison;
