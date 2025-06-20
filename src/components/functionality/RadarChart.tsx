import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface RadarChartProps {
  user1: {
    name: string;
    total: number;
    correct: number;
    accuracy: number;
    dailyAverage: number;
    consistency: number;  // percentage of consistent days
    streak: number;      // consecutive consistent days
  };
  user2: {
    name: string;
    total: number;
    correct: number;
    accuracy: number;
    dailyAverage: number;
    consistency: number;
    streak: number;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserStatsRadarChart: React.FC<RadarChartProps> = ({ user1, user2, isOpen, onOpenChange }) => {
  const radarData = useMemo(() => {
    const getNormalizedValue = (val1: number, val2: number) => {
      const max = Math.max(val1, val2);
      if (max === 0) return 0;
      return 100 * (val1 / max);
    };

    return [
      {
        subject: 'Total',
        [user1.name]: getNormalizedValue(user1.total, user2.total),
        [user2.name]: getNormalizedValue(user2.total, user1.total)
      },
      {
        subject: 'Correct',
        [user1.name]: getNormalizedValue(user1.correct, user2.correct),
        [user2.name]: getNormalizedValue(user2.correct, user1.correct)
      },
      {
        subject: 'Accuracy',
        [user1.name]: user1.total === 0 ? 0 : user1.accuracy,
        [user2.name]: user2.total === 0 ? 0 : user2.accuracy
      },
      {
        subject: 'Daily Avg',
        [user1.name]: getNormalizedValue(user1.dailyAverage, user2.dailyAverage),
        [user2.name]: getNormalizedValue(user2.dailyAverage, user1.dailyAverage)
      },
      {
        subject: 'Consistency',
        [user1.name]: user1.total === 0 ? 0 : user1.consistency,
        [user2.name]: user2.total === 0 ? 0 : user2.consistency
      },
      {
        subject: 'Streak',
        [user1.name]: getNormalizedValue(user1.streak, user2.streak),
        [user2.name]: getNormalizedValue(user2.streak, user1.streak)
      }
    ];
  }, [user1, user2]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-xl font-semibold text-purple-600 text-center">
            {user1.name} VS {user2.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 p-4">
          {/* Radar Chart Container */}
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radarData}
                margin={{ top: -10, right: -20, bottom: -20, left: -20 }}
              >
                <PolarGrid
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={0.5}
                  strokeDasharray="3 3"
                />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ 
                    fill: 'hsl(var(--foreground))', 
                    fontSize: 11,
                    fontWeight: 500,
                    textAnchor: 'middle',
                  }}
                  tickLine={false}
                />
                <Radar
                  name={user1.name}
                  dataKey={user1.name}
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name={user2.name}
                  dataKey={user2.name}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    const metric = props.payload.subject;
                    if (metric === 'Accuracy') return `${value.toFixed(1)}%`;
                    const originalValue = metric === 'Total' ? 
                      (name === user1.name ? user1.total : user2.total) :
                      metric === 'Correct' ?
                      (name === user1.name ? user1.correct : user2.correct) :
                      metric === 'Daily Avg' ?
                      (name === user1.name ? user1.dailyAverage : user2.dailyAverage) :
                      metric === 'Consistency' ?
                      (name === user1.name ? user1.consistency : user2.consistency) :
                      (name === user1.name ? user1.streak : user2.streak);
                    return originalValue.toFixed(1);
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-background">
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground/80 mb-2">{user1.name}</h3>
                <div className="space-y-1 text-xs text-foreground/70">
                  <p>Total: {user1.total}</p>
                  <p>Correct: {user1.correct}</p>
                  <p>Accuracy: {user1.accuracy.toFixed(1)}%</p>
                  <p>Daily Avg: {user1.dailyAverage.toFixed(1)}</p>
                  <p>Consistency: {user1.consistency.toFixed(1)}%</p>
                  <p>Streak: {user1.streak}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background">
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground/80 mb-2">{user2.name}</h3>
                <div className="space-y-1 text-xs text-foreground/70">
                  <p>Total: {user2.total}</p>
                  <p>Correct: {user2.correct}</p>
                  <p>Accuracy: {user2.accuracy.toFixed(1)}%</p>
                  <p>Daily Avg: {user2.dailyAverage.toFixed(1)}</p>
                  <p>Consistency: {user2.consistency.toFixed(1)}%</p>
                  <p>Streak: {user2.streak}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserStatsRadarChart;