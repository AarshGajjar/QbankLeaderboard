import React from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/auth/AuthForm'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import QBankTracker from '@/components/QBankTracker'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-blue-900 dark:via-gray-800 dark:to-purple-900">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <DashboardLayout>
      <div className="lg:col-span-12">
        <QBankTracker />
      </div>
    </DashboardLayout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App