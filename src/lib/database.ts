import { supabase } from './supabase'

export interface UserSession {
  id: string
  user_id: string
  completed: number
  correct: number
  session_date: string
  created_at: string
}

export interface DailyStats {
  id: string
  user_id: string
  date: string
  total_completed: number
  total_correct: number
  session_count: number
  created_at: string
  updated_at: string
}

export class DatabaseService {
  static async addSession(completed: number, correct: number): Promise<UserSession> {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        completed,
        correct,
        session_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserSessions(limit?: number): Promise<UserSession[]> {
    let query = supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getDailyStats(startDate?: string, endDate?: string): Promise<DailyStats[]> {
    let query = supabase
      .from('daily_stats')
      .select('*')
      .order('date', { ascending: true })

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getTodayStats(): Promise<DailyStats | null> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data || null
  }

  static async getTotalStats(): Promise<{
    totalCompleted: number
    totalCorrect: number
    totalSessions: number
  }> {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('total_completed, total_correct, session_count')

    if (error) throw error

    const totals = (data || []).reduce(
      (acc, day) => ({
        totalCompleted: acc.totalCompleted + day.total_completed,
        totalCorrect: acc.totalCorrect + day.total_correct,
        totalSessions: acc.totalSessions + day.session_count,
      }),
      { totalCompleted: 0, totalCorrect: 0, totalSessions: 0 }
    )

    return totals
  }

  static async getSessionsForDateRange(startDate: string, endDate: string): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}