import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface GamificationStats {
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  achievementsUnlocked: number
  lessonsCompleted?: number
  lessonsCompletedToday?: number
  xpProgress: {
    current: number
    needed: number
    percentage: number
  }
}

export function useGamification(refreshTrigger?: number) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async (userId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gamification/${userId}`
      )
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch stats:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch gamification stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const userId = (session?.user as any)?.id || session?.user?.email
    if (!userId) {
      setLoading(false)
      return
    }

    fetchStats(userId)
  }, [(session?.user as any)?.id, session?.user?.email, fetchStats, refreshTrigger])

  return { stats, loading, refetch: fetchStats }
}
