import { getDatabase } from '../db'
import { randomUUID } from 'crypto'

export interface User {
  id: string
  email: string
  displayName: string
  avatar?: string
  totalXP: number
  level: number
  currentStreak: number
  createdAt: Date
}

export class UserService {
  /**
   * Get or create user from OAuth provider
   */
  async getOrCreateUser(provider: string, providerUserId: string, profile: any): Promise<User> {
    const supabase = getDatabase()

    // Check if auth provider exists
    const { data: existing } = await supabase
      .from('auth_providers')
      .select('user_id')
      .eq('provider', provider)
      .eq('provider_user_id', providerUserId)
      .single()

    if (existing) {
      return this.getUserById(existing.user_id)
    }

    // Create new user
    const userId = randomUUID()
    const email = profile.email || `${provider}-${providerUserId}@academy.local`
    const displayName = profile.name || profile.login || 'User'

    await supabase.from('users').insert({
      id: userId,
      email,
      display_name: displayName,
      avatar_url: profile.image || profile.avatar_url,
      total_xp: 0,
      level: 1,
      current_streak: 0,
    })

    // Link auth provider
    await supabase.from('auth_providers').insert({
      id: randomUUID(),
      user_id: userId,
      provider,
      provider_user_id: providerUserId,
    })

    // Initialize streak
    await supabase.from('streaks').insert({
      id: randomUUID(),
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
    })

    return this.getUserById(userId)
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const supabase = getDatabase()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url, total_xp, level, current_streak, created_at')
      .eq('id', userId)
      .single()

    if (error || !user) throw new Error('User not found')

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar_url,
      totalXP: user.total_xp,
      level: user.level,
      currentStreak: user.current_streak,
      createdAt: new Date(user.created_at),
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const supabase = getDatabase()

    const updates: any = {}
    if (data.displayName) updates.display_name = data.displayName

    if (Object.keys(updates).length === 0) return this.getUserById(userId)

    await supabase.from('users').update(updates).eq('id', userId)

    return this.getUserById(userId)
  }

  /**
   * Get user's enrollments
   */
  async getUserEnrollments(userId: string) {
    const supabase = getDatabase()

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, course_id, lessons_completed, total_xp_earned, enrolled_at, completed_at')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    return (enrollments || []).map((e: any) => ({
      id: e.id,
      courseId: e.course_id,
      lessonsCompleted: e.lessons_completed,
      totalXPEarned: e.total_xp_earned,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
    }))
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100) {
    const supabase = getDatabase()

    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, total_xp, level')
      .order('total_xp', { ascending: false })
      .limit(limit)

    return (users || []).map((u: any) => ({
      id: u.id,
      displayName: u.display_name,
      avatar: u.avatar_url,
      totalXP: u.total_xp,
      level: u.level,
    }))
  }

  /**
   * Get user rank
   */
  async getUserRank(userId: string): Promise<number> {
    const supabase = getDatabase()

    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single()

    if (!user) throw new Error('User not found')

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', user.total_xp)

    return (count || 0) + 1
  }
}

export const userService = new UserService()
