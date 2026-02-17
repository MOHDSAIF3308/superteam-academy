# Backend Integration Guide

**Status**: ✅ Complete - Backend running and frontend wired to real data
**Last Updated**: February 15, 2026
**Backend Port**: 3001
**Frontend Port**: 3000

---

## Quick Start

### Start Backend (if not already running)
```bash
cd backend
npm install      # (already done)
npm run dev     # Starts on port 3001
```

### Start Frontend
```bash
npm run dev      # Starts on port 3000
```

### Verify Integration
```bash
# Backend health check
curl http://localhost:3001/api/health
# Response: {"status":"ok"}

# Frontend should automatically use http://localhost:3001/api
# (configured in .env.local)
```

---

## Architecture Overview

### Frontend → Backend Communication

```
Frontend (React Components)
    ↓
lib/hooks (useAuth, useProgress, useAchievements)
    ↓
lib/api/api-client.ts (HTTP client)
    ↓
Backend Express Server (localhost:3001)
    ↓
SQLite Database
```

### Authentication Flow

```
1. User signs up/logs in
2. Backend validates credentials & returns JWT token
3. Frontend stores token in localStorage
4. apiClient automatically includes token in all requests
5. Backend middleware verifies JWT
6. Success: Returns protected user data
```

---

## Integrated Components

### ✅ Dashboard (`app/dashboard/page.tsx`)
- Uses `useAuth()` → Gets current user + stats
- Uses `useProgress()` → Gets user progress, XP, level, streak
- Uses `useAchievements()` → Gets all achievements + unlocked status
- Displays real XP counter, level bar, achievements with unlock status
- Shows loading states while data fetches

### ✅ Profile (`app/profile/page.tsx`)
- Uses `useAuth()` → Gets current user profile
- Uses `useAchievements()` → Displays user achievements
- Can edit bio inline (persists to backend via `updateProfile()`)
- Shows member since date, XP, level, streaks
- Loading states for unauthenticated users

### ✅ Leaderboard (`app/leaderboard/page.tsx`)
- Uses `useLeaderboard()` → Gets top 100 users by XP
- Uses `useUserRank()` → Gets current user's rank
- Highlights current user in the table
- Displays real XP, level, streak for all users
- Loading states while fetching

### ✅ Providers (`components/providers/AuthProvider.tsx`)
- Wraps both NextAuth SessionProvider (OAuth) and custom BackendAuthProvider
- Enables dual auth: NextAuth (Google/GitHub) + Custom (Email/Password)
- Initializes auth state on page load from localStorage

---

## API Endpoints (Backend)

### Health & Status
- `GET /api/health` → {"status":"ok"}

### Authentication
- `POST /api/auth/signup` → Create account (email/password)
- `POST /api/auth/login` → Login (email/password)
- `POST /api/auth/oauth-signup` → Register via OAuth

### User Management
- `GET /api/user/profile` → Get current user profile
- `PATCH /api/user/profile` → Update bio, display name, avatar, wallet
- `POST /api/user/link-oauth` → Link OAuth provider to account

### Gamification & Progress
- `POST /api/lessons/:courseId/:lessonId/complete` → Complete lesson (award XP)
- `GET /api/user/progress` → Get user progress (XP, level, streak)
- `GET /api/user/achievements` → Get all achievements + unlock status

### Leaderboard
- `GET /api/leaderboard?limit=100` → Top users by XP
- `GET /api/user/:userId/rank` → Get user's rank and position

---

## Hooks Reference

### `useAuth()` (from `lib/hooks/useAuth.tsx`)
```typescript
const { user, loading, error, login, signup, logout, updateProfile, refreshUser } = useAuth()

// Usage
if (user) {
  console.log(user.totalXP)    // number
  console.log(user.level)       // number
  console.log(user.currentStreak) // number
}

// Update profile
await updateProfile({ bio: 'New bio', displayName: 'New name' })
```

### `useProgress()` (from `lib/hooks/useProgress.ts`)
```typescript
const { progress, isLoading, error } = useProgress()

// Usage
<div>XP: {progress?.totalXP}</div>
<div>Level: {progress?.level}</div>
<div>Streak: {progress?.currentStreak}</div>
```

### `useAchievements()` (from `lib/hooks/useProgress.ts`)
```typescript
const { achievements, unlockedAchievements, isLoading } = useAchievements()

// Usage
achievements.forEach((achievement) => {
  const isUnlocked = unlockedAchievements.some(a => a.achievementId === achievement.id)
  console.log(achievement.name, isUnlocked)
})
```

### `useLeaderboard()` (from `lib/hooks/useProgress.ts`)
```typescript
const { leaderboard, isLoading } = useLeaderboard()

// leaderboard is array of { userId, displayName, totalXP, level, currentStreak }
leaderboard.forEach((entry, idx) => {
  console.log(`#${idx + 1}: ${entry.displayName} - ${entry.totalXP} XP`)
})
```

### `useUserRank()` (from `lib/hooks/useProgress.ts`)
```typescript
const { userRank, isLoading } = useUserRank(userId)

// Usage
<div>Your Rank: #{userRank.rank}</div>
<div>Position: {userRank.percentileRank}% percentile</div>
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  wallet_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Achievements Table
```sql
-- 8 built-in achievements:
-- 1. First Steps (10 XP earned)
-- 2. XP Collector (500 XP earned)
-- 3. Course Completer (1 course completed)
-- 4. Week Warrior (7 day streak)
-- 5. Monthly Master (30 day streak)
-- 6. Century Seeker (100 coursesCompleted lessons)
-- 7. Challenge Master (10 challenges passed)
-- 8. XP Master (5000 XP earned)
```

### Key Relationships
```
users (1) ──→ (many) enrollments
users (1) ──→ (many) lesson_progress
users (1) ──→ (many) user_achievements
users (1) ──→ (many) streaks
```

---

## XP System

### How XP is Earned
```
Completing a lesson → +50 XP (base)
Completing a challenge → +100 XP
Completing a course → +500 XP bonus
Daily streak bonus → +10 XP per streak day
```

### Level Calculation
```
Level = floor(sqrt(totalXP / 100))

Example:
totalXP = 0     → Level 0
totalXP = 100   → Level 1
totalXP = 400   → Level 2
totalXP = 900   → Level 3
totalXP = 2500  → Level 5
```

### Streak Logic
```
- Increments on lesson completion
- Resets if user doesn't complete lesson for 2 days
- Longest streak tracked separately
- Used for achievement calculations
```

---

## Testing the Integration

### 1. Test Sign Up
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test User"}'

# Response: {"user": {...}, "token": "eyJhbG..."}
```

### 2. Test Complete Lesson (Award XP)
```bash
curl -X POST http://localhost:3001/api/lessons/course-1/lesson-1/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Response: {"newXP": 50, "levelUp": false, "newLevel": 0}
```

### 3. Test Get Leaderboard
```bash
curl http://localhost:3001/api/leaderboard?limit=10

# Response: [{"userId": "...", "displayName": "...", "totalXP": 50, ...},...]
```

### 4. Test Update Profile
```bash
curl -X PATCH http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"I love Solana","displayName":"Dev"}'

# Response: {"message": "Profile updated"}
```

---

## Troubleshooting

### Backend Not Running?
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill any process on port 3001
kill -9 <PID>

# Restart backend
cd backend && npm run dev
```

### Frontend Can't Connect to Backend?
1. Verify `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
2. Verify backend is running: `curl http://localhost:3001/api/health`
3. Check network tab in browser DevTools for failed requests
4. Restart frontend: `npm run dev`

### Auth Token Issues?
1. Clear localStorage: Press F12 → Application → Clear all cookies/storage
2. Sign out and sign in again
3. Check token in localStorage: `console.log(localStorage.getItem('token'))`

### Database Errors?
1. Database is auto-initialized on backend start
2. Check `backend/academy.db` exists
3. Reset database: `rm backend/academy.db && npm run dev` (rebuilds from scratch)

---

## Next Steps

### Phase 2 Features to Implement
1. **Wallet Integration** (2 days)
   - Add Solana wallet connection buttons
   - Link wallet address to user profile
   - Display wallet balance on profile

2. **Code Execution Hook** (1 day)
   - Create `useCodeExecution()` hook
   - Wire to lesson completion (award XP on passing tests)
   - Update gamification on code challenge completion

3. **Lesson Content from Sanity** (1 day)
   - Update `useProgress()` to read lesson data from Sanity  
   - Store lesson metadata in enrollments table
   - Track which lessons completed per course

4. **Analytics Integration** (1 day)
   - Add GA4 event tracking
   - Track: signup, login, lesson completed, achievement unlocked, level up
   - Track: code submission time, test pass rate

5. **Settings Data Persistence** (0.5 day)
   - Language preference saved to backend
   - Theme preference saved to backend
   - Sync across devices/tabs

---

## Performance Considerations

### Optimizations Implemented
- ✅ JWT tokens (stateless auth, no session storage)
- ✅ Selective achievement fetching (only unlocked displayed in some views)
- ✅ Leaderboard pagination (limit 100)
- ✅ Index on `users.total_xp` for leaderboard queries

### Future Optimizations
- Add Redis caching for leaderboard (updated daily)
- Batch achievement checks (don't check on every XP award)
- Add database query logging/profiling
- Implement rate limiting on API endpoints

---

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>
```

### Backend (`backend/.env`)
```
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

---

## Deployment Checklist

- [ ] Backend dependencies installed (`npm install`)
- [ ] Database initialized (auto on first run)
- [ ] All endpoints tested with curl
- [ ] Frontend dashboard displays real data
- [ ] Profile page shows user stats
- [ ] Leaderboard shows top users
- [ ] Can complete lessons and earn XP
- [ ] Achievements unlock and display
- [ ] No console errors in browser
- [ ] Response times under 200ms

---

## Support & Debugging

### View Backend Logs
```bash
cd backend && npm run dev
# Look for startup messages and request logs
```

### View Frontend Network Requests
```
Browser DevTools → Network Tab
Filter for XHR requests to localhost:3001
```

### Check Database Contents
```bash
# Install sqlite3: brew install sqlite3
sqlite3 backend/academy.db
> SELECT * FROM users;
> SELECT * FROM user_achievements;
```

---

**Backend Integration Completed**: ✅
**Next Session Focus**: Code execution + wallet integration
