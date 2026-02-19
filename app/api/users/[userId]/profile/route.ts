import { NextRequest, NextResponse } from 'next/server'

function mapUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    avatar: user.avatar_url,
    totalXP: user.total_xp ?? 0,
    level: user.level ?? 1,
    currentStreak: user.current_streak ?? 0,
    createdAt: user.created_at,
  }
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

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const fields =
      'id, email, display_name, avatar_url, total_xp, level, current_streak, created_at'

    let { data: user } = await supabase
      .from('users')
      .select(fields)
      .eq('id', userId)
      .maybeSingle()

    if (!user) {
      const byEmail = await supabase.from('users').select(fields).eq('email', userId).maybeSingle()
      user = byEmail.data
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(mapUser(user), { status: 200 })
  } catch (error) {
    console.error('Profile lookup error:', error)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
