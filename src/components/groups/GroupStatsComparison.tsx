import React, { useMemo } from 'react';
import { useGroupMembersProgress } from '@/hooks/useGroupMembersProgress'; // Removed GroupMemberProgress
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateMetrics, calculateConsistencyAndStreak, calculateDailyAverage } from '@/utils/dataPreprocessing';
// import { UserProgress as UserProgressType } from '@/types/database'; // Removed UserProgressType
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, RefreshCw } from 'lucide-react'; // Removed unused icons, added RefreshCw for button

interface GroupStatsComparisonProps {
  groupId: string;
  questionBankId: string; // Assuming a default or selected question bank ID is available
}

interface MemberProcessedStats {
  profileId: string;
  name: string;
  totalCompleted: number;
  totalCorrect: number;
  overallAccuracy: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
  dailyAverage: number;
  consistency: number;
  isCurrentUser: boolean;
}

const GroupStatsComparison: React.FC<GroupStatsComparisonProps> = ({ groupId, questionBankId }) => {
  const { profile: currentUserProfile } = useUserProfile();
  const { membersProgress, loading, error, refetch } = useGroupMembersProgress(groupId, questionBankId);

  const processedStats: MemberProcessedStats[] = useMemo(() => {
    if (!membersProgress) return [];

    return membersProgress.map(mp => {
      const formattedProgress = mp.progress.map(p => ({
        date: p.date,
        completed: p.completed_count,
        correct: p.correct_count,
      }));

      const totalCompleted = formattedProgress.reduce((sum, item) => sum + item.completed, 0);
      const totalCorrect = formattedProgress.reduce((sum, item) => sum + item.correct, 0);
      const overallAccuracy = totalCompleted > 0 ? (totalCorrect / totalCompleted) * 100 : 0;

      const points = formattedProgress.reduce((sum, p) => sum + calculateMetrics(p).points, 0);
      const { streak, longestStreak, consistency } = calculateConsistencyAndStreak(formattedProgress);
      const dailyAverage = calculateDailyAverage(formattedProgress);

      return {
        profileId: mp.profile.id,
        name: mp.profile.full_name || mp.profile.username || 'Anonymous',
        totalCompleted,
        totalCorrect,
        overallAccuracy,
        points,
        currentStreak: streak,
        longestStreak,
        dailyAverage,
        consistency,
        isCurrentUser: currentUserProfile?.id === mp.profile.id,
      };
    }).sort((a, b) => b.points - a.points); // Sort by points descending by default
  }, [membersProgress, currentUserProfile]);

  if (loading) {
    return <p className="p-4 text-center">Loading group member stats...</p>;
  }

  if (error) {
    return <p className="p-4 text-red-500 text-center">Error loading group stats: {error}</p>;
  }

  if (!membersProgress || membersProgress.length === 0) {
    return <p className="p-4 text-center">No members or progress data found for this group.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" /> Group Statistics Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead className="text-right">Streak</TableHead>
              <TableHead className="text-right">Longest Strk</TableHead>
              <TableHead className="text-right">Daily Avg</TableHead>
              <TableHead className="text-right">Consistency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedStats.map((stats, index) => (
              <TableRow key={stats.profileId} className={stats.isCurrentUser ? 'bg-primary/10' : ''}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{stats.name}{stats.isCurrentUser && " (You)"}</TableCell>
                <TableCell className="text-right">{stats.points.toLocaleString()}</TableCell>
                <TableCell className="text-right">{stats.totalCompleted.toLocaleString()}</TableCell>
                <TableCell className="text-right">{stats.overallAccuracy.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{stats.currentStreak}</TableCell>
                <TableCell className="text-right">{stats.longestStreak}</TableCell>
                <TableCell className="text-right">{stats.dailyAverage.toFixed(0)}</TableCell>
                <TableCell className="text-right">{stats.consistency.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button onClick={refetch} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Stats
        </Button>
      </CardContent>
    </Card>
  );
};

export default GroupStatsComparison;
