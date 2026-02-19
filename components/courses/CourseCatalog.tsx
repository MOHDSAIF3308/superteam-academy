'use client'

import { useState, useEffect } from 'react'
import { CourseCard } from './CourseCard'
import { Input } from '@/components/ui'
import { Course } from '@/lib/types'
import { useI18n } from '@/lib/hooks/useI18n'

interface CourseCatalogProps {
  courses: Course[]
}

export function CourseCatalog({ courses }: CourseCatalogProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<string>('')
  const [track, setTrack] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase())
    const matchesDifficulty = !difficulty || course.difficulty === difficulty
    const matchesTrack = !track || course.track === track

    return matchesSearch && matchesDifficulty && matchesTrack
  })

  const uniqueTracks = [...new Set(courses.map((c) => c.track))]

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder={t('courses.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-2 bg-gray-100 dark:bg-terminal-surface border-2 border-gray-300 dark:border-terminal-border rounded-lg text-gray-700 dark:text-gray-300 focus:border-blue-600 dark:focus:border-neon-cyan transition-colors"
        >
          <option value="">{t('courses.filterByDifficulty')}</option>
          <option value="beginner">{t('courses.beginnerCourses')}</option>
          <option value="intermediate">{t('courses.intermediateCourses')}</option>
          <option value="advanced">{t('courses.advancedCourses')}</option>
        </select>

        <select
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          className="px-4 py-2 bg-gray-100 dark:bg-terminal-surface border-2 border-gray-300 dark:border-terminal-border rounded-lg text-gray-700 dark:text-gray-300 focus:border-blue-600 dark:focus:border-neon-cyan transition-colors"
        >
          <option value="">{t('courses.filterByTrack')}</option>
          {uniqueTracks.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">{t('common.noData')}</p>
        </div>
      )}
    </div>
  )
}
