'use client'

import { useSession } from 'next-auth/react'
import { useGamification } from '@/lib/hooks/useGamification'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { stats, loading } = useGamification()

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In to View Dashboard</h1>
          <p className="text-gray-600 mb-4">Please sign in to view your progress</p>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Total XP</p>
          <p className="text-3xl font-bold text-neon-cyan">{stats?.totalXP || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Level</p>
          <p className="text-3xl font-bold text-neon-green">{stats?.level || 1}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Current Streak</p>
          <p className="text-3xl font-bold text-neon-magenta">{stats?.currentStreak || 0} days</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Achievements</p>
          <p className="text-3xl font-bold">{stats?.achievementsUnlocked || 0}</p>
        </Card>
      </div>

      {/* XP Progress */}
      {stats && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Level Progress</h2>
          <div className="w-full bg-gray-200 dark:bg-terminal-surface rounded-full h-4">
            <div
              className="bg-neon-cyan h-4 rounded-full transition-all"
              style={{ width: `${stats.xpProgress.percentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats.xpProgress.current} / {stats.xpProgress.needed} XP to next level
          </p>
        </Card>
      )}

      {/* Streaks */}
      {stats && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Streak Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Current Streak</p>
              <p className="text-2xl font-bold">{stats.currentStreak} days 🔥</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Longest Streak</p>
              <p className="text-2xl font-bold">{stats.longestStreak} days ⭐</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
