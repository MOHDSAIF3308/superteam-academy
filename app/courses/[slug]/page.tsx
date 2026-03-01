'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Button, Card, CardContent, CardHeader } from '@/components/ui'
import { getCourseService } from '@/lib/services'
import { useState, useEffect } from 'react'
import { Course } from '@/lib/types'
import { useWallet } from '@/lib/hooks/useWallet'
import { useEnrollCourse, useEnrollment } from '@/lib/hooks/useOnchain'
import { useCourseCompletion, useFinalizeCourse, useIssueCredential } from '@/lib/hooks/useCourseCompletion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface CourseDetailPageProps {
  params: {
    slug: string
  }
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useI18n()
  const [course, setCourse] = useState<Course | null>(null)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [dbEnrolled, setDbEnrolled] = useState(false)
  const [isFinalizingCourse, setIsFinalizingCourse] = useState(false)
  const [isIssuingCredential, setIsIssuingCredential] = useState(false)
  const { connected, publicKey, openWalletModal } = useWallet()
  const { mutateAsync: enrollOnChain, isPending: enrolling } = useEnrollCourse()
  const onChainCourseId = course?.onchainCourseId || course?.slug || course?.id
  const { data: enrollment, refetch: refetchEnrollment } = useEnrollment(
    onChainCourseId,
    publicKey || undefined
  )

  const walletAddress = publicKey?.toBase58() || null
  const userId =
    ((session?.user as any)?.id as string | undefined) ||
    session?.user?.email ||
    walletAddress ||
    null

  // Check course completion status
  const { data: completionStatus } = useCourseCompletion(course?.id, userId || undefined)
  const { finalizeCourse } = useFinalizeCourse()
  const { issueCredential } = useIssueCredential()

  useEffect(() => {
    async function fetchCourse() {
      const service = getCourseService()
      const data = await service.getCourse(params.slug)
      setCourse(data)
    }
    fetchCourse()
  }, [params.slug])

  useEffect(() => {
    if (!course?.id || !userId) {
      setDbEnrolled(false)
      return
    }
    const currentUserId = userId
    const currentCourseId = course.id

    let cancelled = false

    async function fetchDbEnrollmentStatus() {
      try {
        const response = await fetch(`/api/users/${encodeURIComponent(currentUserId)}/enrollments`, {
          cache: 'no-store',
        })
        if (!response.ok) return

        const enrollments = await response.json()
        if (cancelled || !Array.isArray(enrollments)) return

        setDbEnrolled(enrollments.some((item: any) => String(item.courseId) === String(currentCourseId)))
      } catch (error) {
        console.warn('Failed to fetch DB enrollment status:', error)
      }
    }

    void fetchDbEnrollmentStatus()

    return () => {
      cancelled = true
    }
  }, [course?.id, userId])

  const isEnrolled = dbEnrolled || !!enrollment
  const firstLessonId = course?.modules[0]?.lessons[0]?.id

  const ensureEnrollmentAndAwardXp = async (): Promise<boolean> => {
    if (!userId || !course) return false

    const enrollResponse = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId: course.id }),
    })

    if (!enrollResponse.ok && enrollResponse.status !== 200) {
      console.warn('Failed to create enrollment row for XP tracking')
      return false
    }
    setDbEnrolled(true)

    // Award one-time bonus when learner starts a new course.
    const bonusResponse = await fetch('/api/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        courseId: course.id,
        lessonId: `enroll-${course.id}`,
        xpAmount: 25,
      }),
    })

    if (!bonusResponse.ok && bonusResponse.status !== 400) {
      console.warn('Failed to award enrollment XP bonus')
    }

    return true
  }

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
      try {
        await ensureEnrollmentAndAwardXp()
      } catch (error) {
        console.warn('Could not sync enrollment XP data:', error)
      }
      if (firstLessonPath) {
        router.push(firstLessonPath)
      }
      return
    }

    if (!onChainCourseId) return

    try {
      const synced = await ensureEnrollmentAndAwardXp()
      if (!synced) {
        alert('Failed to save enrollment status. Please try again.')
        return
      }

      try {
        await enrollOnChain({ courseId: onChainCourseId })
        await refetchEnrollment()
      } catch (error) {
        // Keep DB enrollment flow usable even if on-chain enrollment fails.
        console.warn('On-chain enrollment failed, continuing with DB enrollment:', error)
      }

      if (firstLessonPath) {
        router.push(firstLessonPath)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to enroll course on-chain'
      alert(message)
    }
  }

  const handleFinalizeCourseAndGetCertificate = async () => {
    if (!course?.id || !userId) {
      alert('Course or user information missing')
      return
    }

    setIsFinalizingCourse(true)
    try {
      // Step 1: Finalize the course
      const result = await finalizeCourse(course.id, userId)

      if (!result.success) {
        alert(`Failed to finalize course: ${result.error}`)
        return
      }

      alert(`🎉 Course finalized! You earned ${result.data?.bonusXp || 0} bonus XP!`)

      // Step 2: Issue the credential
      setIsIssuingCredential(true)
      const credResult = await issueCredential(course.id, userId, course.title)

      if (!credResult.success) {
        console.warn('Credential issuance failed, but course is finalized:', credResult.error)
      }

      // Redirect to certificates
      setTimeout(() => {
        router.push(`/certificates`)
      }, 1000)
    } catch (error) {
      console.error('Error in certificate flow:', error)
      alert('Failed to process certificate. Please try again.')
    } finally {
      setIsFinalizingCourse(false)
      setIsIssuingCredential(false)
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

          {/* Course Action - Show certificate button if complete */}
          {completionStatus?.isCourseComplete && completionStatus?.courseFinalized ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-neon-green/10 border border-neon-green rounded-lg">
                <span className="text-2xl">🎓</span>
                <div className="flex-1">
                  <p className="font-semibold text-neon-green">Course Completed!</p>
                  <p className="text-sm text-neon-green/80">
                    {completionStatus.lessonsCompleted} / {completionStatus.totalLessons} lessons done
                  </p>
                </div>
              </div>
              <Link href="/certificates" className="block w-full">
                <Button variant="primary" className="w-full">
                  📜 View Your Certificate
                </Button>
              </Link>
            </div>
          ) : completionStatus?.isCourseComplete && !completionStatus?.courseFinalized ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-neon-yellow/10 border border-neon-yellow rounded-lg">
                <span className="text-2xl">⭐</span>
                <div className="flex-1">
                  <p className="font-semibold text-neon-yellow">All Lessons Complete!</p>
                  <p className="text-sm text-neon-yellow/80">Claim your certificate now</p>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleFinalizeCourseAndGetCertificate}
                disabled={isFinalizingCourse || isIssuingCredential}
                className="w-full"
              >
                {isFinalizingCourse
                  ? 'Finalizing Course...'
                  : isIssuingCredential
                    ? 'Issuing Certificate...'
                    : '🎉 Finalize & Claim Certificate'}
              </Button>
            </div>
          ) : (
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
          )}
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
