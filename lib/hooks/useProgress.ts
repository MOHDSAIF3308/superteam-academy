import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/api-client'
import { calculateLevel } from '@/lib/types'

export interface Progress {
  userId: string
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  achievements: number[]
}

export function useProgress(userId?: string) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setError(null)
        const data = await apiClient.getProgress()
        setProgress(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch progress'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgress()
  }, [userId])

  const completeLesson = async (courseId: string, lessonId: string, xpReward: number) => {
    try {
      const result = await apiClient.completeLesson(courseId, lessonId, xpReward)
      setProgress(result.progress)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete lesson'
      setError(message)
      throw err
    }
  }

  const refresh = async () => {
    if (!userId) return
    try {
      const data = await apiClient.getProgress()
      setProgress(data)
    } catch (err) {
      console.error('Failed to refresh progress:', err)
    }
  }

  return {
    progress,
    isLoading,
    error,
    completeLesson,
    refresh,
  }
}

export function useAchievements(userId?: string) {
  const [achievements, setAchievements] = useState<any[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setError(null)
        const data = await apiClient.getAchievements()
        setAchievements(data.allAchievements || data || [])
        setUnlockedAchievements(data.unlockedAchievements || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch achievements'
        setError(message)
        setAchievements([])
        setUnlockedAchievements([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAchievements()
  }, [userId])

  return {
    achievements: achievements || [],
    unlockedAchievements: unlockedAchievements || [],
    isLoading,
    error,
  }
}

export function useLeaderboard(limit = 50, offset = 0) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setError(null)
        const response = await fetch(`/api/leaderboard?limit=${limit}&offset=${offset}`, {
          cache: 'no-store',
        })
        if (!response.ok) {
          throw new Error(`Leaderboard request failed: ${response.status}`)
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          setLeaderboard([])
          return
        }

        setLeaderboard(
          data.map((entry: any, idx: number) => {
            const totalXP = Number(entry.totalXP ?? entry.totalXp ?? entry.xp ?? 0)
            return {
              rank: entry.rank ?? offset + idx + 1,
              userId: entry.userId ?? entry.wallet ?? `user-${idx}`,
              wallet: entry.wallet ?? entry.userId ?? '',
              username: entry.username ?? 'Unknown',
              displayName: entry.displayName ?? entry.username ?? 'Unknown',
              totalXP,
              level: entry.level ?? calculateLevel(totalXP),
              currentStreak: Number(entry.currentStreak ?? 0),
            }
          })
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch leaderboard'
        setError(message)
        setLeaderboard([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [limit, offset])

  return {
    leaderboard,
    loading,
    error,
  }
}

export function useUserRank(userId: string) {
  const [rank, setRank] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchRank = async () => {
      try {
        setError(null)
        const data = await apiClient.getUserRank(userId)
        setRank(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch rank'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchRank()
  }, [userId])

  return {
    rank,
    loading,
    error,
  }
}
