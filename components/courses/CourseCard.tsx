'use client'

import { Course } from '@/lib/types'
import { Card, Button } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'
import Link from 'next/link'

interface CourseCardProps {
  course: Course
  isEnrolled?: boolean
}

export function CourseCard({ course, isEnrolled = false }: CourseCardProps) {
  const { t } = useI18n()

  const difficultyColors = {
    beginner: 'text-neon-green',
    intermediate: 'text-neon-yellow',
    advanced: 'text-neon-magenta',
  }

  return (
    <Card className="flex flex-col h-full">
      {/* Thumbnail */}
      <div className="mb-4 h-40 bg-gray-100 dark:bg-terminal-bg rounded border border-gray-300 dark:border-terminal-border flex items-center justify-center">
        <span className="text-4xl">📚</span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white flex-1">{course.title}</h3>
          <span className={`text-xs font-semibold ${difficultyColors[course.difficulty]}`}>
            {course.difficulty.toUpperCase()}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{course.description}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-600 dark:text-gray-400">
          <div>⏱️ {course.duration} {t('courses.minutes')}</div>
          <div>👥 {course.enrollmentCount.toLocaleString()}</div>
          <div>⭐ {course.xpReward} XP</div>
          <div className="text-blue-600 dark:text-neon-cyan">{course.track}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-4 border-t border-gray-300 dark:border-terminal-border">
        <Link href={`/courses/${course.slug}`} className="flex-1">
          <Button variant="secondary" className="w-full" size="sm">
            {t('common.edit')}
          </Button>
        </Link>
        <Button variant="primary" size="sm" className="flex-1">
          {isEnrolled ? t('courses.enrolled') : t('courses.enroll')}
        </Button>
      </div>
    </Card>
  )
}
