import { NextRequest, NextResponse } from 'next/server'

function emptyStats() {
  return {
    totalXP: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    achievementsUnlocked: 0,
    lessonsCompleted: 0,
    lessonsCompletedToday: 0,
    xpProgress: {
      current: 0,
      needed: 100,
      percentage: 0,
    },
  }
}

async function resolveCanonicalUser(supabase: any, rawUserId: string) {
  const candidates = Array.from(new Set([rawUserId, rawUserId.toLowerCase()]))

  for (const candidate of candidates) {
    let { data: user } = await supabase
      .from('users')
      .select('id, total_xp, level, current_streak, longest_streak')
      .eq('id', candidate)
      .maybeSingle()

    if (!user) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id, total_xp, level, current_streak, longest_streak')
        .eq('email', candidate)
        .maybeSingle()
      user = byEmail
    }

    if (!user) {
      const { data: byWallet } = await supabase
        .from('users')
        .select('id, total_xp, level, current_streak, longest_streak')
        .eq('wallet_address', candidate)
        .maybeSingle()
      user = byWallet
    }

    if (user) {
      return user
    }
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = decodeURIComponent(params.userId || '')

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

    const user = await resolveCanonicalUser(supabase, userId)

    if (!user) {
      return NextResponse.json(emptyStats(), { status: 200 })
    }
    const canonicalUserId = user.id || userId

    // Get lessons completed count
    const { data: lessons, error: lessonsError } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', canonicalUserId)

    if (lessonsError) throw lessonsError

    // Get lessons completed today
    const today = new Date().toISOString().split('T')[0]
    const { data: todayLessons, error: todayError } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('user_id', canonicalUserId)
      .gte('completed_at', `${today}T00:00:00`)

    if (todayError) throw todayError

    // Get achievements count
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', canonicalUserId)

    if (achievementsError) throw achievementsError

    // Calculate XP progress for next level
    const xpPerLevel = 100
    const currentLevelXp = user.level * user.level * xpPerLevel
    const nextLevelXp = (user.level + 1) * (user.level + 1) * xpPerLevel
    const xpInCurrentLevel = user.total_xp - currentLevelXp
    const xpNeededForNextLevel = nextLevelXp - currentLevelXp

    return NextResponse.json(
      {
        totalXP: user.total_xp || 0,
        level: user.level || 1,
        currentStreak: user.current_streak || 0,
        longestStreak: user.longest_streak || 0,
        achievementsUnlocked: achievements?.length || 0,
        lessonsCompleted: lessons?.length || 0,
        lessonsCompletedToday: todayLessons?.length || 0,
        xpProgress: {
          current: Math.max(xpInCurrentLevel, 0),
          needed: Math.max(xpNeededForNextLevel, 100),
          percentage: Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (Math.max(xpInCurrentLevel, 0) / Math.max(xpNeededForNextLevel, 100)) * 100
              )
            )
          ),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Gamification stats error:', error)
    return NextResponse.json(emptyStats(), { status: 200 })
  }
}
