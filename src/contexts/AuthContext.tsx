import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService, type AuthState, type UserProfile } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'username' | 'display_name'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser()
        if (user) {
          const profile = await AuthService.getUserProfile(user.id)
          setState({ user, profile, loading: false })
        } else {
          setState({ user: null, profile: null, loading: false })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setState({ user: null, profile: null, loading: false })
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await AuthService.getUserProfile(session.user.id)
        setState({ user: session.user, profile, loading: false })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await AuthService.signIn(email, password)
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }

  const signUp = async (email: string, password: string, username: string, displayName: string) => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await AuthService.signUp(email, password, username, displayName)
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await AuthService.signOut()
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'username' | 'display_name'>>) => {
    if (!state.user) throw new Error('No user logged in')
    
    const updatedProfile = await AuthService.updateProfile(state.user.id, updates)
    setState(prev => ({ ...prev, profile: updatedProfile }))
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}