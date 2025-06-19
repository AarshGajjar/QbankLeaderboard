import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { UserSession } from '@/lib/database'

interface RecentSessionsProps {
  sessions: UserSession[]
}

export default function RecentSessions({ sessions }: RecentSessionsProps) {
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const calculateAccuracy = (correct: number, total: number): string => {
    if (total === 0) return '0.0'
    return ((correct / total) * 100).toFixed(1)
  }

  return (
    <Card className="w-full shadow-lg rounded-lg bg-gradient-to-br from-white/80 via-white/90 to-white/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/20">
      <CardHeader className="border-b p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="w-5 h-5 text-amber-500" />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Recent Sessions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="max-h-[350px] overflow-y-auto rounded-lg bg-white dark:bg-slate-900 border dark:border-slate-700">
          {sessions.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="p-3 transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-500" />
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {session.completed} completed, {session.correct} correct 
                        {" ("}{calculateAccuracy(session.correct, session.completed)}%)
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(session.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No sessions recorded yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}