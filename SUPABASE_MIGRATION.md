# SQLite to Supabase Migration Guide

## Overview
This guide walks you through migrating the Solana Academy Platform backend from SQLite to Supabase PostgreSQL.

## Changes Made

### 1. Dependencies Updated
**Removed:**
- `sqlite` (^5.0.1)
- `sqlite3` (^5.1.6)

**Added:**
- `@supabase/supabase-js` (^2.38.0)

### 2. Environment Variables
Update your `.env.local` file:

```bash
# Old (SQLite)
DATABASE_URL=sqlite:./academy.db

# New (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Setup Instructions

#### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and API keys from Settings → API

#### Step 2: Create Database Tables
Run these SQL queries in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
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
);

-- Enrollments table
CREATE TABLE enrollments (
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
);

-- Lesson progress table
CREATE TABLE lesson_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, course_id, lesson_id)
);

-- Achievements table
CREATE TABLE achievements (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT CHECK(rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER DEFAULT 0,
  condition_type TEXT CHECK(condition_type IN ('xp', 'challenges', 'streak', 'course', 'social')),
  condition_value INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User achievements table
CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id),
  UNIQUE(user_id, achievement_id)
);

-- Streaks table
CREATE TABLE streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  freeze_used INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Streak history table
CREATE TABLE streak_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_date DATE NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, activity_date)
);

-- Auth providers table
CREATE TABLE auth_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);

-- XP transactions table
CREATE TABLE xp_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  course_id TEXT,
  lesson_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Step 3: Update Environment Variables
```bash
cp backend/.env.example backend/.env.local
# Edit backend/.env.local with your Supabase credentials
```

#### Step 4: Install Dependencies
```bash
cd backend
npm install
```

#### Step 5: Start Backend
```bash
npm run dev
```

## Key Differences

### Query Syntax
**SQLite (Old):**
```typescript
const user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
```

**Supabase (New):**
```typescript
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### Error Handling
Supabase returns `{ data, error }` tuples. Always check for errors:
```typescript
const { data, error } = await supabase.from('users').select('*')
if (error) throw new Error(error.message)
```

### Transactions
For complex operations, use Supabase transactions:
```typescript
const { data, error } = await supabase.rpc('your_function_name', { params })
```

## Migration Checklist

- [ ] Create Supabase project
- [ ] Copy API credentials
- [ ] Create database tables
- [ ] Update `.env.local`
- [ ] Run `npm install` in backend
- [ ] Test API endpoints
- [ ] Verify data persistence
- [ ] Update frontend API calls if needed

## Troubleshooting

### Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active
- Ensure backend can reach Supabase (firewall/VPN)

### Table Creation Errors
- Check SQL syntax in Supabase SQL Editor
- Verify table names match exactly
- Ensure foreign key references exist

### Query Errors
- Use `.single()` only when expecting one row
- Check column names match database schema
- Verify data types match (TEXT vs INTEGER)

## Performance Tips

1. **Add Indexes** for frequently queried columns:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
```

2. **Enable Row Level Security (RLS)** for production:
   - Go to Supabase Dashboard → Authentication → Policies
   - Create policies for each table

3. **Use Connection Pooling** for high traffic

## Next Steps

1. Test all API endpoints thoroughly
2. Monitor Supabase usage in dashboard
3. Set up automated backups
4. Configure RLS policies for security
5. Consider caching frequently accessed data

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
