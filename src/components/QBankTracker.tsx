import React, { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { DatabaseService, type UserSession, type DailyStats } from '@/lib/database'
import StatsOverview from '@/components/dashboard/StatsOverview'
import AddSessionForm from '@/components/dashboard/AddSessionForm'
import ProgressChart from '@/components/dashboard/ProgressChart'
import RecentSessions from '@/components/dashboard/RecentSessions'

export default function QBankTracker() {
  const [totalStats, setTotalStats] = useState({
    totalCompleted: 0,
    totalCorrect: 0,
    totalSessions: 0,
  })
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [recentSessions, setRecentSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [totalData, todayData, dailyData, sessionsData] = await Promise.all([
        DatabaseService.getTotalStats(),
        DatabaseService.getTodayStats(),
        DatabaseService.getDailyStats(),
        DatabaseService.getUserSessions(10), // Get last 10 sessions
      ])

      setTotalStats(totalData)
      setTodayStats(todayData)
      setDailyStats(dailyData)
      setRecentSessions(sessionsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSessionAdded = () => {
    fetchData() // Refresh all data when a new session is added
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

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
        <div className="w-full">
          <StatsOverview totalStats={totalStats} todayStats={todayStats} />
        </div>
        <div className="w-full">
          <AddSessionForm onSessionAdded={handleSessionAdded} />
        </div>
        <div className="w-full">
          <ProgressChart dailyStats={dailyStats} />
        </div>
        <div className="w-full">
          <RecentSessions sessions={recentSessions} />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:grid grid-rows-[auto_1fr] gap-6 w-full max-w-[1600px] mx-auto">
        <div className="row-span-1 w-full">
          <StatsOverview totalStats={totalStats} todayStats={todayStats} />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <AddSessionForm onSessionAdded={handleSessionAdded} />
          </div>
          <div className="col-span-2">
            <ProgressChart dailyStats={dailyStats} />
          </div>
        </div>
        <div className="w-full">
          <RecentSessions sessions={recentSessions} />
        </div>
      </div>
    </>
  )
}