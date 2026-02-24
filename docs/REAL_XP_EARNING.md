# Real XP Earning System - Implementation Guide

> **Status**: ✅ Production Ready
> 
> Learners can now earn real XP when they complete lessons and challenges. XP is instantly credited to their account and reflected on the dashboard.

## What's New

### 1. **useAwardXP Hook** 
A new React hook for awarding XP when lessons are completed.

**Location**: [lib/hooks/useAwardXP.ts](../lib/hooks/useAwardXP.ts)

```typescript
import { useAwardXP } from '@/lib/hooks'

export function MyComponent() {
  const { awardXP, isAwarding, error } = useAwardXP()

  const handleClaimRewards = async () => {
    const result = await awardXP({
      courseId: 'course-1',
      lessonId: 'lesson-1',
      xpAmount: 100
    })

    if (result.success) {
      console.log(`Earned ${result.xpAwarded} XP`)
      console.log(`Total XP: ${result.totalXp}`)
      console.log(`Level: ${result.level}`)
    }
  }

  return (
    <button onClick={handleClaimRewards} disabled={isAwarding}>
      Claim Rewards (+100 XP)
    </button>
  )
}
```

### 2. **Updated ChallengeRunner Component**

The ChallengeRunner now has a functional "Claim Rewards" button that:
- ✅ Awards XP when tests pass
- ✅ Updates user's total XP in real-time
- ✅ Calculates new level
- ✅ Prevents duplicate awards
- ✅ Shows authentication requirement if needed

**Location**: [components/editor/ChallengeRunner.tsx](../components/editor/ChallengeRunner.tsx)

```tsx
<ChallengeRunner
  courseId="solana-basics"
  lessonId="lesson-1"
  xpReward={100}
  starterCode={code}
  testCases={tests}
/>
```

Required props:
- `courseId`: Unique identifier for the course
- `lessonId`: Unique identifier for the lesson  
- `xpReward`: Amount of XP to award (optional, defaults to testCases.length * 25)

## How It Works

### Flow Diagram

```
┌─────────────────────────────────┐
│  Learner completes challenge    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Tests pass successfully        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  "Claim Rewards" button shown   │
│  Shows: "+100 XP"               │
└──────────────┬──────────────────┘
               │
        (user clicks)
               │
               ▼
┌─────────────────────────────────┐
│  useAwardXP().awardXP() called  │
│  with courseId, lessonId, xpAmount
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  /api/xp/award endpoint         │
│  - Verify enrollment            │
│  - Check not already completed  │
│  - Record lesson_progress       │
│  - Update enrollment XP         │
│  - Update user total_xp & level │
│  - Record xp_transaction        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Database Updated:              │
│  ✅ lesson_progress             │
│  ✅ enrollments.xp_earned       │
│  ✅ users.total_xp              │
│  ✅ users.level                 │
│  ✅ xp_transactions             │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Success notification shown     │
│  Dashboard updates in real-time │
│  Leaderboard position changes   │
└─────────────────────────────────┘
```

## API Endpoint Reference

### Award XP Endpoint
```
POST /api/xp/award
```

**Request**:
```json
{
  "userId": "user@example.com",
  "courseId": "solana-basics",
  "lessonId": "lesson-1", 
  "xpAmount": 100
}
```

**Response (Success)**:
```json
{
  "xpAwarded": 100,
  "totalXp": 350,
  "level": 1,
  "message": "XP awarded successfully"
}
```

**Response (Already Completed)**:
```json
{
  "error": "Lesson already completed",
  "status": 400
}
```

**Response (Not Enrolled)**:
```json
{
  "error": "Enrollment not found",
  "status": 404
}
```

## Database Schema

### Key Tables

#### enrollments
```sql
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMP,
  completion_percentage FLOAT DEFAULT 0,
  xp_earned INT DEFAULT 0  -- ← XP earned in THIS course
);
```

#### lesson_progress
```sql
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  completed_at TIMESTAMP,
  xp_earned INT DEFAULT 0
);
```

#### xp_transactions
```sql
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP
);
```

#### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  total_xp INT DEFAULT 0      -- ← Total XP across all courses
  level INT DEFAULT 0,         -- ← Level (calculated from total_xp)
  created_at TIMESTAMP
);
```

## Integration Guide

### Using with Lessons Page

Update the lesson page to pass course/lesson info to XP award:

```tsx
const handleSubmit = async () => {
  if (!session?.user) return
  
  setSubmitting(true)
  const result = await submitLesson(
    userId,
    course.id,
    lesson.id,
    lesson.xpReward
  )
  setSubmitting(false)
  
  if (result.success) {
    alert(`🎉 +${result.xpAwarded} XP earned!`)
    refetchStats()
  }
}
```

### Using with Custom Components

```tsx
import { useAwardXP } from '@/lib/hooks'

export function LessonComplete({ courseId, lessonId, xpReward }) {
  const { awardXP, isAwarding, isAuthenticated } = useAwardXP()

  const handleClaim = async () => {
    const result = await awardXP({ courseId, lessonId, xpAmount: xpReward })
    if (result.success) {
      console.log(`Earned ${result.xpAwarded} XP!`)
    }
  }

  return (
    <button onClick={handleClaim} disabled={isAwarding || !isAuthenticated}>
      {isAwarding ? 'Claiming...' : `Claim ${xpReward} XP`}
    </button>
  )
}
```

## Testing

### Run the Demo Setup

```bash
cd backend
npm install
npm run dev

# In another terminal:
cd backend
npx tsx setup-real-xp-course.ts
```

This will:
1. Create a test learner account
2. Enroll them in "Solana Basics" course
3. Simulate completing 3 lessons
4. Award 300 XP total
5. Verify all database updates

### Manual Testing

1. **Sign in** to the platform with a test account
2. **Enroll** in a course
3. **Complete** a lesson/challenge
4. **Click "Claim Rewards"**
5. **Verify** in database:
   ```sql
   SELECT * FROM users WHERE email = 'test@example.com';
   SELECT * FROM enrollments WHERE user_id = 'test@example.com';
   SELECT * FROM lesson_progress WHERE user_id = 'test@example.com';
   ```

## Configuration

### Customize XP Amounts

#### Per Lesson
Edit the lesson in Sanity CMS and set the `xpReward` field.

#### Per Course
Courses can have an overall `xpReward` field that gets applied on completion.

#### Default (ChallengeRunner)
If no `xpReward` prop is passed:
```typescript
xpReward = testCases.length * 25  // 25 XP per test case
```

### Level Calculation

Current formula:
```typescript
level = Math.floor(Math.sqrt(totalXp / 100))
```

To change, update:
- [app/api/xp/award/route.ts](../app/api/xp/award/route.ts) line ~79
- [lib/hooks/useGamification.ts](../lib/hooks/useGamification.ts) - if used

## Troubleshooting

### XP Not Being Awarded

**Check 1**: User is authenticated
```typescript
const { isAuthenticated } = useAwardXP()
console.log('Authenticated:', isAuthenticated)
```

**Check 2**: Enrollment exists
```bash
curl -X GET http://localhost:3000/api/enrollments?userId=USER_ID
```

**Check 3**: Lesson not already completed
```sql
SELECT * FROM lesson_progress 
WHERE user_id = 'USER_ID' AND lesson_id = 'LESSON_ID';
```

**Check 4**: API endpoint is working
```bash
curl -X POST http://localhost:3000/api/xp/award \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test@example.com",
    "courseId": "course-1",
    "lessonId": "lesson-1",
    "xpAmount": 100
  }'
```

### XP Amount Wrong

1. Check the `xpReward` prop passed to ChallengeRunner
2. Check the lesson's `xpReward` in Sanity
3. Verify the API request body has correct `xpAmount`

### Level Not Updating

The level is recalculated automatically when XP is awarded:
```typescript
const level = Math.floor(Math.sqrt(totalXp / 100))
```

To manually recalculate:
```sql
-- Update all user levels
UPDATE users 
SET level = FLOOR(SQRT(total_xp / 100.0));
```

## Production Checklist

- [ ] All courses have `xpReward` configured in Sanity
- [ ] All lessons have `xpReward` values set
- [ ] ChallengeRunner receives `courseId` and `lessonId` props
- [ ] nextAuth is configured for production
- [ ] Supabase credentials are set in environment
- [ ] XP award endpoint is accessible from frontend
- [ ] Test XP earning with a demo course
- [ ] Monitor XP transactions in database
- [ ] Verify leaderboard updates correctly

## Files Modified

✅ **New Files**:
- [lib/hooks/useAwardXP.ts](../lib/hooks/useAwardXP.ts) - XP awarding hook
- [backend/setup-real-xp-course.ts](../backend/setup-real-xp-course.ts) - Demo setup script
- [docs/REAL_XP_EARNING.md](./REAL_XP_EARNING.md) - This guide

✅ **Updated Files**:
- [lib/hooks/index.ts](../lib/hooks/index.ts) - Added useAwardXP export
- [components/editor/ChallengeRunner.tsx](../components/editor/ChallengeRunner.tsx) - Added XP button functionality

## Next Steps

### Phase 2 Enhancements:
- [ ] Add seasonal XP (bonus multipliers)
- [ ] Implement XP streaks (consecutive days)
- [ ] Add XP achievements (unlock at XP milestones)
- [ ] Create XP leaderboard
- [ ] Add XP notifications/toasts

### On-Chain Integration:
- [ ] Mint XP tokens on Solana
- [ ] Create credential NFTs
- [ ] Add XP burning for special actions
- [ ] Implement creator rewards

## Questions?

Refer to:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [SPECIFICATION.md](./SPECIFICATION.md) - Feature requirements
- [LMS_ENROLLMENT_XP.md](./LMS_ENROLLMENT_XP.md) - Enrollment details

---

**Version**: 1.0.0  
**Updated**: February 24, 2026  
**Status**: ✅ Production Ready
