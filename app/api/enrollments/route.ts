import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Missing userId or courseId' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local' },
        { status: 500 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ensure a user row exists so enrollment/XP writes don't fail on FK constraints.
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingUser) {
      const walletLikeId = !String(userId).includes('@')
      const { error: userInsertError } = await supabase.from('users').insert({
        id: userId,
        email: walletLikeId ? null : String(userId).toLowerCase(),
        display_name: walletLikeId ? `${String(userId).slice(0, 8)}...` : null,
        total_xp: 0,
        level: 0,
        current_streak: 0,
      })
      if (userInsertError) throw userInsertError
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, course_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(existing, { status: 200 })
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        id: randomUUID(),
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        lessons_completed: 0,
        total_xp_earned: 0,
      })
      .select()
      .single()

    if (enrollError) throw enrollError

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrollment failed' },
      { status: 500 }
    )
  }
}
