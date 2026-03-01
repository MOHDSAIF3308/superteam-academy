import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/backend/src/db'
import { PublicKey } from '@solana/web3.js'

/**
 * POST /api/enrollments/[userId]/completion
 * Get course completion status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = decodeURIComponent(params.userId)
    const courseId = request.nextUrl.searchParams.get('courseId')

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'Missing userId or courseId' },
        { status: 400 }
      )
    }

    const db = getDatabase()

    // Get enrollment info
    const { data: enrollment, error: enrollmentError } = (await db
      .from('enrollments')
      .select('id, lessons_completed, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()) as any

    if (enrollmentError) {
      console.error('Database error:', enrollmentError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!enrollment) {
      return NextResponse.json(
        {
          isCourseComplete: false,
          lessonsCompleted: 0,
          totalLessons: 0,
          completionPercentage: 0,
          courseFinalized: false,
          credentialMinted: false,
        },
        { status: 200 }
      )
    }

    // Get course info to calculate total lessons
    const { data: course, error: courseError } = (await db
      .from('courses')
      .select('id, total_lessons')
      .eq('id', courseId)
      .maybeSingle()) as any

    if (courseError) {
      console.error('Course fetch error:', courseError)
      return NextResponse.json(
        { error: 'Failed to fetch course' },
        { status: 500 }
      )
    }

    const totalLessons = course?.total_lessons || 0
    const lessonsCompleted = enrollment?.lessons_completed || 0
    const completionPercentage = totalLessons ? Math.round((lessonsCompleted / totalLessons) * 100) : 0
    const isCourseComplete = lessonsCompleted > 0 && lessonsCompleted >= totalLessons
    const courseFinalized = !!enrollment?.completed_at

    // Check if credential has been minted
    const { data: credentials } = (await db
      .from('credentials')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()) as any

    return NextResponse.json(
      {
        isCourseComplete,
        lessonsCompleted,
        totalLessons,
        completionPercentage,
        courseFinalized,
        credentialMinted: !!credentials,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching completion status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
