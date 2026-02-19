'use client'

import { useSession } from 'next-auth/react'
import { useGamification } from '@/lib/hooks/useGamification'
import { useAchievements } from '@/lib/hooks/useAchievements'
import { Card, Button } from '@/components/ui'
import { AchievementGrid, AchievementNotification } from '@/components/achievements'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Enrollment {
  id: string
  courseId: string
  lessonsCompleted: number
  totalXPEarned: number
  enrolledAt: string
  completedAt: string | null
}

interface Course {
  id: string
  slug: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  track: string
  xpReward: number
  enrollmentCount: number
}

const MOCK_COURSES: Record<string, Course> = {
  'course-1': {
    id: 'course-1',
    slug: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    description: 'Learn the core concepts of Solana blockchain',
    difficulty: 'beginner',
    duration: 180,
    track: 'Core',
    xpReward: 500,
    enrollmentCount: 1250,
  },
  'course-2': {
    id: 'course-2',
    slug: 'anchor-development',
    title: 'Anchor Development',
    description: 'Master Anchor framework for building Solana programs',
    difficulty: 'intermediate',
    duration: 240,
    track: 'Development',
    xpReward: 1000,
    enrollmentCount: 890,
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { stats, loading: statsLoading } = useGamification()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  
  const completedCoursesCount = Array.isArray(enrollments) ? enrollments.filter(e => e.completedAt).length : 0
  
  const { unlockedAchievements, newlyUnlocked, dismissNewlyUnlocked } = useAchievements({
    userId: (session?.user as any)?.id || session?.user?.email || '',
    stats: {
      totalXp: stats?.totalXP || 0,
      totalLessonsCompleted: stats?.lessonsCompleted || 0,
      totalCoursesCompleted: completedCoursesCount,
      currentStreak: stats?.currentStreak || 0,
      lessonsCompletedToday: stats?.lessonsCompletedToday || 0,
    },
  })

  useEffect(() => {
    if (status !== 'authenticated') return
    if ((session?.user as any)?.needsProfile) {
      router.replace('/auth/complete-profile')
    }
  }, [status, session, router])

  useEffect(() => {
    if (!session?.user) return

    const userId = (session.user as any).id || session.user.email
    if (!userId) return

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/enrollments`)
      .then(r => r.json())
      .then(data => {
        setEnrollments(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Failed to fetch enrollments:', err)
        setEnrollments([])
      })
      .finally(() => setLoading(false))
  }, [session?.user?.email])

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Sign In to View Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to view your progress</p>
          <Link href="/auth/signin">
            <Button className="w-full">Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (status === 'authenticated' && (session?.user as any)?.needsProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to profile setup...</p>
        </div>
      </div>
    )
  }

  if (statsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const difficultyColors = {
    beginner: 'text-neon-green',
    intermediate: 'text-neon-yellow',
    advanced: 'text-neon-magenta',
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-inherit py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session?.user?.name || 'Learner'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Keep learning and earning XP to level up</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card className="p-6 border-l-4 border-neon-cyan">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Total XP</p>
            <p className="text-4xl font-bold text-neon-cyan">{stats?.totalXP || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Keep grinding! 🚀</p>
          </Card>

          <Card className="p-6 border-l-4 border-neon-green">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Level</p>
            <p className="text-4xl font-bold text-neon-green">{stats?.level || 1}</p>
            <p className="text-xs text-gray-500 mt-2">You're doing great! ⭐</p>
          </Card>

          <Card className="p-6 border-l-4 border-neon-magenta">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Current Streak</p>
            <p className="text-4xl font-bold text-neon-magenta">{stats?.currentStreak || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Days in a row 🔥</p>
          </Card>

          <Card className="p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Achievements</p>
            <p className="text-4xl font-bold text-blue-500">{unlockedAchievements.length}</p>
            <p className="text-xs text-gray-500 mt-2">Badges earned 🏆</p>
          </Card>
        </div>

        {/* Level Progress */}
        {stats && (
          <Card className="p-6 mb-12">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Level Progress</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level {stats.level}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.xpProgress.current} / {stats.xpProgress.needed} XP
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-terminal-surface rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-neon-cyan to-neon-green h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.xpProgress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stats.xpProgress.percentage}% to next level
              </p>
            </div>
          </Card>
        )}

        {/* In Progress Courses */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">In Progress</h2>
            <Link href="/courses">
              <Button variant="secondary" size="sm">
                Browse More Courses
              </Button>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No courses enrolled yet</p>
              <Link href="/courses">
                <Button>Start Learning</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((enrollment) => {
                const course = MOCK_COURSES[enrollment.courseId]
                if (!course) return null

                return (
                  <Card key={enrollment.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold ${difficultyColors[course.difficulty]} ml-2`}>
                        {course.difficulty.toUpperCase()}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Progress
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {enrollment.totalXPEarned} / {course.xpReward} XP
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-terminal-surface rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-neon-cyan h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min((enrollment.totalXPEarned / course.xpReward) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-600 dark:text-gray-400">
                      <div>⏱️ {course.duration} min</div>
                      <div>📚 {course.track}</div>
                      <div>⭐ {course.xpReward} XP</div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/courses/${course.slug}`} className="block">
                      <Button className="w-full" size="sm">
                        Continue Learning →
                      </Button>
                    </Link>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Achievements Section */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-12">
            <AchievementGrid
              achievements={unlockedAchievements}
              unlockedIds={new Set(unlockedAchievements.map(a => a.id))}
            />
          </div>
        )}

        {/* Streak Info */}
        {stats && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Streak Info</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-neon-magenta mb-2">{stats.currentStreak}</p>
                <p className="text-gray-600 dark:text-gray-400">Current Streak 🔥</p>
                <p className="text-xs text-gray-500 mt-2">Keep it going!</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-neon-green mb-2">{stats.longestStreak}</p>
                <p className="text-gray-600 dark:text-gray-400">Longest Streak ⭐</p>
                <p className="text-xs text-gray-500 mt-2">Your best record</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievement Notifications */}
        {newlyUnlocked.map((achievement) => (
          <AchievementNotification
            key={achievement.id}
            achievement={achievement}
            onDismiss={dismissNewlyUnlocked}
          />
        ))}
      </div>
    </main>
  )
}
