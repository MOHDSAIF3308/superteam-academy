'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCourseServiceInstance } from '@/lib/services/course.service'
import { submitLesson } from '@/lib/hooks/useLessonSubmission'
import { useGamification } from '@/lib/hooks/useGamification'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'

interface Lesson {
  id: string
  title: string
  description?: string
  type: 'content' | 'challenge'
  content: string
  order: number
  xpReward: number
  challenge?: {
    prompt: string
    starterCode: string
    testCases: Array<{
      input: string
      expectedOutput: string
      description: string
    }>
    hints: string[]
  }
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
  order: number
}

interface CourseData {
  id: string
  title: string
  slug: string
  modules: Module[]
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { stats, refetch } = useGamification(refreshTrigger)

  const courseSlug = params.slug as string
  const lessonId = params.id as string

  useEffect(() => {
    async function loadCourse() {
      const service = getCourseServiceInstance()
      const courseData = await service.getCourse(courseSlug)
      if (courseData) {
        setCourse(courseData as any)
        
        // Find the lesson
        for (const module of (courseData as any).modules) {
          const foundLesson = module.lessons.find((l: Lesson) => l.id === lessonId)
          if (foundLesson) {
            setLesson(foundLesson)
            setCode(foundLesson.challenge?.starterCode || '')
            break
          }
        }
      }
      setLoading(false)
    }

    loadCourse()
  }, [courseSlug, lessonId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    )
  }

  if (!course || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
          <Link href="/courses">
            <Button>Back to Courses</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const currentModuleIndex = course.modules.findIndex(m =>
    m.lessons.some(l => l.id === lessonId)
  )
  const currentModule = course.modules[currentModuleIndex]
  const lessonIndex = currentModule.lessons.findIndex(l => l.id === lessonId)
  const previousLesson = lessonIndex > 0 ? currentModule.lessons[lessonIndex - 1] : null
  const nextLesson = lessonIndex < currentModule.lessons.length - 1 ? currentModule.lessons[lessonIndex + 1] : null

  const handleSubmit = async () => {
    if (!session?.user) {
      alert('Please sign in to submit')
      return
    }

    const userId = (session.user as any).id || session.user.email
    if (!userId) {
      alert('Unable to get user ID')
      return
    }

    setSubmitting(true)
    const result = await submitLesson(userId, course.id, lesson.id, lesson.xpReward)
    setSubmitting(false)
    
    if (result.success) {
      alert(`✅ Challenge submitted!\n\nYou earned ${result.xpAwarded} XP!\nTotal XP: ${result.totalXp}\nLevel: ${result.level}`)
      
      // Refresh gamification stats
      setRefreshTrigger(prev => prev + 1)
      if (refetch) {
        refetch(userId)
      }
    } else {
      alert(`❌ ${result.message}`)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-inherit">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/courses" className="hover:text-neon-cyan">Courses</Link>
          <span>/</span>
          <Link href={`/courses/${courseSlug}`} className="hover:text-neon-cyan">{course.title}</Link>
          <span>/</span>
          <span className="text-neon-cyan">{lesson.title}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{currentModule.title}</p>
              <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white">
                {lesson.title}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">XP Reward</p>
              <p className="text-3xl font-bold text-neon-cyan">{lesson.xpReward}</p>
            </div>
          </div>
          {lesson.description && (
            <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3 mt-6 text-gray-900 dark:text-white" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-gray-700 dark:text-gray-300" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-2" {...props} />,
                    code: ({ node, inline, ...props }: any) => 
                      inline ? (
                        <code className="bg-gray-200 dark:bg-terminal-surface px-2 py-1 rounded text-sm font-mono" {...props} />
                      ) : (
                        <code className="block bg-gray-900 dark:bg-black text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm" {...props} />
                      ),
                    pre: ({ node, ...props }) => <pre className="mb-4" {...props} />,
                  }}
                >
                  {lesson.content}
                </ReactMarkdown>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Module Progress */}
            <Card className="p-6 mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Module Progress</h3>
              <div className="space-y-2">
                {currentModule.lessons.map((l, idx) => (
                  <Link
                    key={l.id}
                    href={`/courses/${courseSlug}/lessons/${l.id}`}
                    className={`block p-3 rounded-lg transition-colors ${
                      l.id === lessonId
                        ? 'bg-neon-cyan text-black font-semibold'
                        : 'bg-gray-100 dark:bg-terminal-surface text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-terminal-surface/80'
                    }`}
                  >
                    <p className="text-sm">{idx + 1}. {l.title}</p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Lesson Info */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Lesson Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{lesson.type}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">XP Reward</p>
                  <p className="font-semibold text-neon-cyan">{lesson.xpReward} XP</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Challenge Editor (if challenge type) */}
        {lesson.type === 'challenge' && lesson.challenge && (
          <Card className="p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Code Challenge</h2>
            
            {/* Hints */}
            {lesson.challenge.hints.length > 0 && (
              <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Hints:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
                  {lesson.challenge.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code Editor */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Your Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 p-4 bg-gray-900 dark:bg-black text-gray-100 font-mono text-sm rounded-lg border border-gray-700 focus:border-neon-cyan"
                placeholder="Write your code here..."
              />
            </div>

            {/* Submit Button */}
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : `Submit Challenge & Earn ${lesson.xpReward} XP`}
            </Button>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          {previousLesson ? (
            <Link href={`/courses/${courseSlug}/lessons/${previousLesson.id}`} className="flex-1">
              <Button variant="secondary" className="w-full">
                ← Previous: {previousLesson.title}
              </Button>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          
          {nextLesson ? (
            <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`} className="flex-1">
              <Button className="w-full">
                Next: {nextLesson.title} →
              </Button>
            </Link>
          ) : (
            <Link href={`/courses/${courseSlug}`} className="flex-1">
              <Button className="w-full">
                Back to Course
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
