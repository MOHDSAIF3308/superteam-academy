import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

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

export async function POST(request: NextRequest) {
  try {
    const { provider, providerUserId, profile } = await request.json()

    if (!provider || !providerUserId || !profile) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, providerUserId, profile' },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const email = (profile.email || `${provider}-${providerUserId}@academy.local`).toLowerCase()
    const displayName = profile.name || profile.login || 'User'

    const fields =
      'id, email, display_name, avatar_url, total_xp, level, current_streak, created_at'

    // Existing by id first (id is email in this project), fallback by email.
    let { data: existing } = await supabase
      .from('users')
      .select(fields)
      .eq('id', email)
      .maybeSingle()

    if (!existing) {
      const byEmail = await supabase.from('users').select(fields).eq('email', email).maybeSingle()
      existing = byEmail.data
    }

    if (existing) {
      return NextResponse.json(mapUser(existing), { status: 200 })
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: email,
      email,
      display_name: displayName,
      avatar_url: profile.image || profile.avatar_url || null,
      total_xp: 0,
      level: 1,
      current_streak: 0,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Best-effort side tables; don't fail user creation if these inserts fail.
    try {
      await supabase.from('auth_providers').insert({
        id: randomUUID(),
        user_id: email,
        provider,
        provider_user_id: providerUserId,
      })
    } catch {
      // no-op
    }

    try {
      await supabase.from('streaks').insert({
        id: randomUUID(),
        user_id: email,
        current_streak: 0,
        longest_streak: 0,
      })
    } catch {
      // no-op
    }

    const created = await supabase.from('users').select(fields).eq('id', email).maybeSingle()
    if (!created.data) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json(mapUser(created.data), { status: 201 })
  } catch (error) {
    console.error('OAuth user creation error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
