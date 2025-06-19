import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { DailyStats } from '@/lib/database'

interface ProgressChartProps {
  dailyStats: DailyStats[]
}

export default function ProgressChart({ dailyStats }: ProgressChartProps) {
  const chartData = useMemo(() => {
    return dailyStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: stat.total_completed,
      accuracy: stat.total_completed > 0 
        ? Math.round((stat.total_correct / stat.total_completed) * 100)
        : 0,
      sessions: stat.session_count
    }))
  }, [dailyStats])

  return (
    <Card className="w-full shadow-lg rounded-lg bg-gradient-to-br from-white/80 via-white/90 to-white/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/20">
      <CardHeader className="border-b p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Progress Overview
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
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
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}