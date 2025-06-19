import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, User, BookOpen } from 'lucide-react'
import DarkModeToggle from '@/components/ui/DarkModeToggle'
import CountdownTimer from '@/components/ui/Countdown'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-blue-900 dark:via-gray-800 dark:to-purple-900 flex flex-col">
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent w-full">
        <div className="w-full px-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex flex-wrap items-center justify-between gap-4 py-1">
            <div className="flex-1 flex-grow">
              <div className="block w-full p-4 transition-all duration-300 hover:scale-102 group">
                <div className="relative w-full">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-3xl animate-pulse pointer-events-none" />
                  
                  {/* Main container */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800/20 shadow-2xl transition-all duration-300 group-hover:shadow-purple-500/10">
                    
                    {/* Inner content wrapper */}
                    <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 px-4 sm:px-8 py-6">
                      {/* Center section */}
                      <div className="flex items-center gap-6 flex-grow justify-center">
                        {/* Logo container with enhanced hover animation */}
                        <div className="relative group/logo z-10">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-full blur-xl transition-all duration-300 group-hover/logo:scale-110 pointer-events-none" />
                          <BookOpen className="relative w-12 h-12 text-purple-600 transition-all duration-300 group-hover/logo:scale-110" />
                        </div>
                        
                        {/* Title with enhanced animation */}
                        <div className="space-y-1">
                          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient relative">
                            QBank Tracker
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/10 to-purple-500/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          </h1>
                        </div>
                      </div>

                      {/* User info and actions */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <User className="w-4 h-4" />
                          <span>{profile?.display_name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSignOut}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </div>

                    {/* Enhanced hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
                    
                    {/* CountdownTimer with enhanced spacing */}
                    <div className="px-8 pb-6">
                      <CountdownTimer />
                    </div>
                    
                    {/* Animated bottom border gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-gradient pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex flex-col items-center py-1">
            <div className="w-full mb-4">
              <div className="block w-full p-4 transition-all duration-300 hover:scale-102 group">
                <div className="relative w-full">
                  {/* Mobile version of header */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800/20 shadow-2xl">
                    <div className="relative flex flex-col items-center gap-4 px-4 py-6">
                      <div className="flex items-center gap-4">
                        <BookOpen className="w-8 h-8 text-purple-600" />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                          QBank Tracker
                        </h1>
                      </div>
                      
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <User className="w-4 h-4" />
                          <span>{profile?.display_name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSignOut}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="px-4 pb-4">
                      <CountdownTimer />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-2 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {children}
        </div>
      </main>
      
      <div className="flex items-center justify-center">
        <span className="text-xs font-bold bg-white/90 dark:bg-slate-900/90 px-2 py-2 rounded-full shadow-sm flex items-center gap-2">
          <span className="hidden sm:inline">Toggle Theme</span> 
          <DarkModeToggle />
        </span>
      </div>
    </div>
  )
}