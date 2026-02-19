'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Button, Card, CardContent, CardHeader } from '@/components/ui'
import { getCourseService } from '@/lib/services'
import { useState, useEffect } from 'react'
import { Course } from '@/lib/types'
import { useWallet } from '@/lib/hooks/useWallet'
import { useEnrollCourse, useEnrollment } from '@/lib/hooks/useOnchain'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CourseDetailPageProps {
  params: {
    slug: string
  }
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [course, setCourse] = useState<Course | null>(null)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const { connected, publicKey, openWalletModal } = useWallet()
  const { mutateAsync: enrollOnChain, isPending: enrolling } = useEnrollCourse()
  const onChainCourseId = course?.onchainCourseId || course?.slug || course?.id
  const { data: enrollment, refetch: refetchEnrollment } = useEnrollment(
    onChainCourseId,
    publicKey || undefined
  )

  useEffect(() => {
    async function fetchCourse() {
      const service = getCourseService()
      const data = await service.getCourse(params.slug)
      setCourse(data)
    }
    fetchCourse()
  }, [params.slug])

  const isEnrolled = !!enrollment
  const firstLessonId = course?.modules[0]?.lessons[0]?.id

  const handleStartCourse = async () => {
    if (!course) return

    if (!connected || !publicKey) {
      openWalletModal()
      return
    }

    const firstLessonPath = firstLessonId
      ? `/courses/${course.slug}/lessons/${firstLessonId}`
      : null

    if (isEnrolled) {
      if (firstLessonPath) {
        router.push(firstLessonPath)
      }
      return
    }

    if (!onChainCourseId) return

    try {
      await enrollOnChain({ courseId: onChainCourseId })
      await refetchEnrollment()
      if (firstLessonPath) {
        router.push(firstLessonPath)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to enroll course on-chain'
      alert(message)
    }
  }

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">{t('common.loading')}</div>
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/courses" className="text-neon-cyan hover:text-neon-cyan/70 mb-4 inline-block">
            ← {t('common.back')}
          </Link>

          <h1 className="text-4xl font-display font-bold text-white mb-4">{course.title}</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">{t('courseDetail.difficulty')}</p>
              <p className="font-semibold text-neon-cyan">{course.difficulty}</p>
            </div>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">{t('courseDetail.duration')}</p>
              <p className="font-semibold text-neon-cyan">{course.duration} min</p>
            </div>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">{t('courseDetail.students')}</p>
              <p className="font-semibold text-neon-cyan">{course.enrollmentCount.toLocaleString()}</p>
            </div>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">{t('courseDetail.xpReward')}</p>
              <p className="font-semibold text-neon-cyan">{course.xpReward} XP</p>
            </div>
          </div>

          <p className="text-gray-300 mb-6">{course.description}</p>

          <Button
            variant="primary"
            onClick={handleStartCourse}
            disabled={enrolling || (isEnrolled && !firstLessonId)}
          >
            {!connected
              ? t('common.connectWallet')
              : isEnrolled
                ? t('courseDetail.continueCourse')
                : enrolling
                  ? t('courses.enrolling')
                  : t('courseDetail.startCourse')}
          </Button>
        </div>

        {/* Modules */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-display font-bold text-white">{t('courseDetail.modules')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.modules.map((module) => (
              <div key={module.id} className="border border-terminal-border rounded-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedModule(expandedModule === module.id ? null : module.id)
                  }
                  className="w-full p-4 bg-terminal-surface hover:bg-terminal-surface/80 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                  <span className="text-neon-cyan">{expandedModule === module.id ? '▼' : '▶'}</span>
                </button>

                {expandedModule === module.id && (
                  <div className="bg-terminal-bg p-4 space-y-2 border-t border-terminal-border">
                    {module.lessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/courses/${params.slug}/lessons/${lesson.id}`}
                        className="flex items-center gap-3 p-3 rounded hover:bg-terminal-surface transition-colors group"
                      >
                        <span className="text-xl">
                          {lesson.type === 'challenge' ? '💻' : '📖'}
                        </span>
                        <div className="flex-1">
                          <p className="text-white group-hover:text-neon-cyan transition-colors">
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-500">{lesson.xpReward} XP</p>
                        </div>
                        <span className="text-xs text-neon-cyan">→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
