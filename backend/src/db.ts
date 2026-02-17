import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export async function initializeDatabase(): Promise<SupabaseClient> {
  if (supabase) return supabase

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }

  supabase = createClient(supabaseUrl, supabaseKey)

  // Create tables if they don't exist
  await createTables()

  console.log('✅ Supabase database initialized')
  return supabase
}

async function createTables() {
  if (!supabase) throw new Error('Supabase not initialized')

  // Users table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        display_name TEXT,
        bio TEXT,
        avatar_url TEXT,
        wallet_address TEXT,
        total_xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        achievements_bitmap INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
  }).catch(() => {}) // Ignore if table already exists

  // Enrollments table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS enrollments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        progress_bitmap INTEGER DEFAULT 0,
        lessons_completed INTEGER DEFAULT 0,
        total_xp_earned INTEGER DEFAULT 0,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, course_id)
      )
    `,
  }).catch(() => {})

  // Lesson progress table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        course_id TEXT NOT NULL,
        lesson_id TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, course_id, lesson_id)
      )
    `,
  }).catch(() => {})

  // Achievements table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        rarity TEXT CHECK(rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
        xp_reward INTEGER DEFAULT 0,
        condition_type TEXT CHECK(condition_type IN ('xp', 'challenges', 'streak', 'course', 'social')),
        condition_value INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
  }).catch(() => {})

  // User achievements table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id INTEGER NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id),
        UNIQUE(user_id, achievement_id)
      )
    `,
  }).catch(() => {})

  // Streaks table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS streaks (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_activity_date DATE DEFAULT CURRENT_DATE,
        freeze_used INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
  }).catch(() => {})

  // Streak history table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS streak_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_date DATE NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, activity_date)
      )
    `,
  }).catch(() => {})

  // Auth providers table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS auth_providers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(provider, provider_user_id)
      )
    `,
  }).catch(() => {})

  // XP transactions table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS xp_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        course_id TEXT,
        lesson_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
  }).catch(() => {})

  console.log('✅ Database tables initialized')
}

export function getDatabase(): SupabaseClient {
  if (!supabase) throw new Error('Database not initialized. Call initializeDatabase() first.')
  return supabase
}

export async function closeDatabase() {
  if (supabase) {
    supabase = null
  }
}
