import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, lessonId, xpAmount } = await request.json()

    if (!userId || !courseId || !lessonId || !xpAmount) {
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

    // Get enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (enrollError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Check if lesson already completed
    const { data: existing } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Lesson already completed' }, { status: 400 })
    }

    // Record lesson completion
    await supabase.from('lesson_progress').insert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed_at: new Date().toISOString(),
    })

    // Update enrollment XP
    const newXpEarned = (enrollment.xp_earned || 0) + xpAmount
    await supabase
      .from('enrollments')
      .update({ xp_earned: newXpEarned })
      .eq('id', enrollment.id)

    // Record XP transaction
    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount: xpAmount,
      reason: `Completed lesson: ${lessonId}`,
      created_at: new Date().toISOString(),
    })

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
