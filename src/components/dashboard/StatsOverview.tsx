import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Target, TrendingUp, Calendar } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'

interface StatsOverviewProps {
  totalStats: {
    totalCompleted: number
    totalCorrect: number
    totalSessions: number
  }
  todayStats: {
    total_completed: number
    total_correct: number
    session_count: number
  } | null
}

export default function StatsOverview({ totalStats, todayStats }: StatsOverviewProps) {
  const overallAccuracy = totalStats.totalCompleted > 0 
    ? (totalStats.totalCorrect / totalStats.totalCompleted * 100).toFixed(1)
    : '0.0'

  const todayAccuracy = todayStats && todayStats.total_completed > 0
    ? (todayStats.total_correct / todayStats.total_completed * 100).toFixed(1)
    : '0.0'

  const dailyAverage = totalStats.totalSessions > 0
    ? Math.round(totalStats.totalCompleted / totalStats.totalSessions)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Today's Progress"
        value={todayStats?.total_completed || 0}
        valueUnit="questions"
        icon={<Target className="h-4 w-4" />}
        tooltip={`${todayAccuracy}% accuracy today`}
        iconColor="#f97316"
      />
      
      <MetricCard
        title="Total Questions"
        value={totalStats.totalCompleted}
        valueUnit="completed"
        icon={<Trophy className="h-4 w-4" />}
        tooltip={`${overallAccuracy}% overall accuracy`}
        iconColor="#a855f7"
      />
      
      <MetricCard
        title="Daily Average"
        value={dailyAverage}
        valueUnit="per day"
        icon={<TrendingUp className="h-4 w-4" />}
        tooltip="Average questions per session"
        iconColor="#4ec9b0"
      />
      
      <MetricCard
        title="Total Sessions"
        value={totalStats.totalSessions}
        valueUnit="sessions"
        icon={<Calendar className="h-4 w-4" />}
        tooltip="Total study sessions recorded"
        iconColor="#06b6d4"
      />
    </div>
  )
}