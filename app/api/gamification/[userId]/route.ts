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

    // Get user stats
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_xp, level, current_streak, longest_streak')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get lessons completed count
    const { data: lessons, error: lessonsError } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', userId)

    if (lessonsError) throw lessonsError

    // Get lessons completed today
    const today = new Date().toISOString().split('T')[0]
    const { data: todayLessons, error: todayError } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`)

    if (todayError) throw todayError

    // Get achievements count
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)

    if (achievementsError) throw achievementsError

    // Calculate XP progress for next level
    const xpPerLevel = 100
    const currentLevelXp = user.level * user.level * xpPerLevel
    const nextLevelXp = (user.level + 1) * (user.level + 1) * xpPerLevel
    const xpInCurrentLevel = user.total_xp - currentLevelXp
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp

    return NextResponse.json(
      {
        totalXP: user.total_xp,
        level: user.level,
        currentStreak: user.current_streak,
        longestStreak: user.longest_streak,
        achievementsUnlocked: achievements?.length || 0,
        lessonsCompleted: lessons?.length || 0,
        lessonsCompletedToday: todayLessons?.length || 0,
        xpProgress: {
          current: xpInCurrentLevel,
          needed: xpNeededForNextLevel,
          percentage: Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Gamification stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
