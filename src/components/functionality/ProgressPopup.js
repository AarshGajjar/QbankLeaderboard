import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProgressDashboard from '@/components/functionality/DailyProgressGraph';
const ProgressPopup = ({ isOpen, onClose, dailyData, user1Name, user2Name, selectedUser, activityLogs }) => {
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
        if (!Array.isArray(dailyData))
            return [];
        return dailyData.filter(data => data &&
            data.date &&
            data.user1Data &&
            data.user2Data);
    }, [dailyData]);
    return (_jsxs(Dialog, { open: isOpen, onOpenChange: onClose, children: [_jsx(DialogHeader, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(DialogTitle, { children: "Progress Dashboard" }), _jsx(DialogDescription, { children: "View your daily progress and activity logs" })] })) }), _jsx(DialogContent, { className: "sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-7xl w-[95vw] h-[90vh] sm:h-[95vh] overflow-y-auto p-4 sm:p-6", children: validDailyData.length > 0 ? (_jsx(ProgressDashboard, { dailyData: validDailyData, user1Name: user1Name, user2Name: user2Name, activityLogs: activityLogs, selectedUser: selectedUser, hideUserSelect: true })) : (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No progress data available" })) })] }));
};
export default ProgressPopup;
