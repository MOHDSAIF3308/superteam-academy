'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { StatsCard, LevelDisplay, ProgressBar } from '@/components/dashboard'
import { CourseCard } from '@/components/courses'
import { getAllCourses, getUserEnrollments } from '@/lib/services/course.service'
import { useState, useEffect } from 'react'
import { Course, Enrollment } from '@/lib/types'

export default function DashboardPage() {
  const { t } = useI18n()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      // TODO: Get actual user ID from auth context
      const userId = 'user-1'
      const allCourses = await getAllCourses()
      const userEnrollments = await getUserEnrollments(userId)
      setCourses(allCourses)
      setEnrollments(userEnrollments)
      setLoading(false)
    }
    fetch()
  }, [])

  const currentCourses = enrollments.slice(0, 3).map((e) => courses.find((c) => c.id === e.courseId)).filter(Boolean) as Course[]

  return (
    <main className="min-h-screen py-12 bg-gray-50 dark:bg-inherit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-blue-600 dark:text-neon-cyan mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t('dashboard.welcome')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatsCard icon="⭐" label={t('dashboard.stats.xp')} value="2,450" />
          <StatsCard icon="📊" label={t('dashboard.stats.level')} value="7" />
          <StatsCard icon="🔥" label={t('dashboard.stats.streak')} value="12" />
          <StatsCard icon="🏆" label={t('dashboard.stats.coursesCompleted')} value="3" />
        </div>

        {/* Level Progress */}
        <Card className="mb-12">
          <CardContent>
            <LevelDisplay level={7} xp={2450} xpRequiredForNextLevel={6400} />
          </CardContent>
        </Card>

        {/* Current Courses */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">
            {t('dashboard.currentCourses')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCourses.map((course) => (
              <div key={course.id}>
                <CourseCard course={course} isEnrolled />
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              {t('dashboard.achievements')}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {['🚀', '🎯', '💡', '🏆', '⚡', '🔥'].map((emoji, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-terminal-bg rounded-lg border border-gray-300 dark:border-terminal-border hover:border-blue-600 dark:hover:border-neon-cyan transition-colors"
                >
                  <div className="text-3xl mb-2">{emoji}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Achievement {idx + 1}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
