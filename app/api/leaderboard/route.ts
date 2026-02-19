import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json([], { status: 200 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, display_name, total_xp, level, current_streak')
      .order('total_xp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const leaderboard = users?.map((user, idx) => ({
      rank: offset + idx + 1,
      userId: user.id,
      username: user.username || `User ${user.id.slice(0, 4)}`,
      displayName: user.display_name || user.username || `User ${user.id.slice(0, 4)}`,
      totalXP: user.total_xp || 0,
      level: user.level || 0,
      currentStreak: user.current_streak || 0,
    })) || []

    return NextResponse.json(leaderboard, { status: 200 })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
