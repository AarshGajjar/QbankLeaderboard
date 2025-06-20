import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProgressDashboard from '@/components/functionality/DailyProgressGraph';

interface UserProgress {
  completed: number;
  correct: number;
  date: string;
  accuracy: number;
}

interface DailyData {
  date: string;
  user1Data: UserProgress;
  user2Data: UserProgress;
}

interface ActivityLog {
  id: number;
  user_type: 'user1' | 'user2';
  completed: number;
  correct: number;
  timestamp: string;
  created_at: string;
}

interface ProgressPopupProps {
  isOpen: boolean;
  onClose: () => void;
  dailyData: DailyData[];
  user1Name: string;
  user2Name: string;
  selectedUser: 'user1' | 'user2';
  activityLogs: ActivityLog[];
}

const ProgressPopup: React.FC<ProgressPopupProps> = ({
  isOpen,
  onClose,
  dailyData,
  user1Name,
  user2Name,
  selectedUser,
  activityLogs
}) => {
  // Add debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('ProgressPopup opened with:', {
        selectedUser,
        dailyDataLength: dailyData?.length,
        activityLogsLength: activityLogs?.length
      });
    }
  }, [isOpen, selectedUser, dailyData, activityLogs]);

  // Add data validation
  const validDailyData = React.useMemo(() => {
    if (!Array.isArray(dailyData)) return [];
    return dailyData.filter(data => 
      data && 
      data.date && 
      data.user1Data && 
      data.user2Data
    );
  }, [dailyData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
      {isOpen && (
        <>
          <DialogTitle>Progress Dashboard</DialogTitle>
          <DialogDescription>View your daily progress and activity logs</DialogDescription>
        </>
      )}
      </DialogHeader>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-7xl w-[95vw] h-[90vh] sm:h-[95vh] overflow-y-auto p-4 sm:p-6">
        {validDailyData.length > 0 ? (
          <ProgressDashboard
            dailyData={validDailyData}
            user1Name={user1Name}
            user2Name={user2Name}
            activityLogs={activityLogs}
            selectedUser={selectedUser}
            hideUserSelect
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No progress data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProgressPopup;