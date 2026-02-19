import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('id, course_id, total_xp_earned, lessons_completed, enrolled_at, completed_at')
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json(
      enrollments?.map(e => ({
        id: e.id,
        courseId: e.course_id,
        totalXPEarned: e.total_xp_earned,
        lessonsCompleted: e.lessons_completed,
        enrolledAt: e.enrolled_at,
        completedAt: e.completed_at,
      })) || [],
      { status: 200 }
    )
  } catch (error) {
    console.error('Enrollments fetch error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
