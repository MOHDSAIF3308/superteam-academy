import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export interface GamificationStats {
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  achievementsUnlocked: number
  xpProgress: {
    current: number
    needed: number
    percentage: number
  }
}

export function useGamification() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/gamification/${session.user.id}`
        )
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch gamification stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [session?.user?.id])

  return { stats, loading }
}
