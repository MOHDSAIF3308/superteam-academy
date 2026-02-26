import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, lessonId, xpAmount } = await request.json()

    if (!userId || !courseId || !lessonId || xpAmount === undefined || xpAmount <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Ensure user exists for FK-safe writes from wallet-only sessions.
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

    // Get enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check if lesson already completed
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Lesson already completed' }, { status: 400 })
    }

    // Record lesson completion
    const { error: lessonInsertError } = await supabase.from('lesson_progress').insert({
      id: randomUUID(),
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed: 1,
      xp_earned: xpAmount,
      completed_at: new Date().toISOString(),
    })
    if (lessonInsertError) throw lessonInsertError

    // Update enrollment XP
    const hasTotalXPEarned = Object.prototype.hasOwnProperty.call(enrollment, 'total_xp_earned')
    const hasLegacyXpEarned = Object.prototype.hasOwnProperty.call(enrollment, 'xp_earned')
    const currentEnrollmentXp = hasTotalXPEarned
      ? enrollment.total_xp_earned || 0
      : enrollment.xp_earned || 0
    const newXpEarned = currentEnrollmentXp + xpAmount

    const enrollmentUpdates: Record<string, number> = {}
    if (hasTotalXPEarned || !hasLegacyXpEarned) {
      enrollmentUpdates.total_xp_earned = newXpEarned
    }
    if (hasLegacyXpEarned) {
      enrollmentUpdates.xp_earned = newXpEarned
    }

    const { error: updateEnrollmentError } = await supabase
      .from('enrollments')
      .update(enrollmentUpdates)
      .eq('id', enrollment.id)
    if (updateEnrollmentError) throw updateEnrollmentError

    // Record XP transaction
    const { error: txInsertError } = await supabase.from('xp_transactions').insert({
      id: randomUUID(),
      user_id: userId,
      amount: xpAmount,
      reason: lessonId.startsWith('enroll-')
        ? `Enrollment bonus for course: ${courseId}`
        : `Completed lesson: ${lessonId}`,
      course_id: courseId,
      lesson_id: lessonId,
      created_at: new Date().toISOString(),
    })
    if (txInsertError) throw txInsertError

    // Update user total XP
    const { data: user } = await supabase
      .from('users')
      .select('total_xp')
      .eq('id', userId)
      .single()

    const totalXp = (user?.total_xp || 0) + xpAmount
    const level = Math.floor(Math.sqrt(totalXp / 100))

    await supabase
      .from('users')
      .update({ total_xp: totalXp, level })
      .eq('id', userId)

    return NextResponse.json(
      { xpAwarded: xpAmount, totalXp, level, message: 'XP awarded successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('XP award error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to award XP' },
      { status: 500 }
    )
  }
}
