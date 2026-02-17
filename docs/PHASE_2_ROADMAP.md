# Phase 2: Core Functionality — Detailed Roadmap

**Phase:** 2 of 4  
**Status:** Planning Phase  
**Last Updated:** February 15, 2026  
**Target Completion:** Q1 2026

---

## Overview

Phase 2 focuses on building the complete learning experience with interactive progress tracking, code execution, and a functional achievement system. This phase bridges Phase 1 (UI scaffolding) and Phase 3 (on-chain integration).

## Phase 2 Features

### 1. User Dashboard (Enhanced)

**Status:** 40% Complete (Basic structure exists)

#### Current Implementation
- ✅ Static stats display (XP, Level, Streak, Courses)
- ✅ Course list with enrollment status
- ✅ Level progress bar UI

#### Missing / To-Do
- [ ] **Real Progress Data Binding**
  - Connect to real learner data from backend/database
  - Pull actual XP, level, and streak from user session
  - Update stats in real-time
  
- [ ] **Dynamic Course List**
  - Show user's current in-progress courses
  - Display recent lessons completed
  - Add "Continue Learning" CTA
  
- [ ] **Quick Stats Widget**
  - Weekly XP breakdown
  - Lesson completion graph
  - Time spent on platform
  
- [ ] **Achievement Badges Preview**
  - Show recently unlocked achievements
  - Display progress toward locked achievements

**Component Updates Needed:**
- [Dashboard Page](app/dashboard/page.tsx) — Hook up real user data
- [StatsCard Component](components/dashboard/StatsCard.tsx) — Add dynamic values
- [ProgressBar Component](components/dashboard/ProgressBar.tsx) — Connect to user XP data

---

### 2. Learning Progress Tracking

**Status:** 20% Complete (Service exists, UI missing)

#### Current Implementation
- ✅ Service layer exists: `learning-progress.service.ts`
- ✅ Custom hook: `useLearningProgress()`
- ❌ No UI components for progress visualization

#### Missing / To-Do
- [ ] **Progress Dashboard**
  - Course progress timeline (lessons completed)
  - Time spent per lesson
  - Quiz/challenge scores
  - Visual progress indicators
  
- [ ] **Lesson Progress Page**
  - Current lesson title & description
  - Step-by-step progress (1 of 5)
  - Completion percentage
  - Time estimate remaining
  
- [ ] **Backend Integration**
  - Create API endpoints: `GET /api/progress/:userId`
  - Create endpoint: `POST /api/progress/:userId/lesson/:lessonId/complete`
  - Database schema for storing progress
  
- [ ] **Progress Persistence**
  - Save progress on lesson exit
  - Auto-save solution attempts
  - Sync with IndexedDB for offline access

**New Components to Create:**
- `ProgressTimeline` — Visual timeline of lessons
- `LessonProgressCard` — Current lesson status
- `ProgressStats` — Breakdown of time/attempts/score

**Updated Hooks Needed:**
- `useLessonProgress(lessonId)` — Track current lesson state
- `useProgressSync(userId)` — Sync progress with backend

---

### 3. Code Challenge Execution

**Status:** 60% Complete (Editor exists, execution missing)

#### Current Implementation
- ✅ Monaco Code Editor UI (`CodeEditor` component)
- ✅ ChallengeRunner component skeleton
- ❌ Actual code execution runtime
- ❌ Test case validation

#### Missing / To-Do
- [ ] **Challenge Execution Engine**
  - Add support for JavaScript execution (in browser)
  - Add support for Rust compilation/execution (future: via Wasm)
  - Implement code sandboxing (use iframe or Web Workers)
  
- [ ] **Test Case System**
  - Define test case structure in Sanity CMS
  - Create test runner that validates user code
  - Display test results (passed/failed)
  - Show expected vs actual output
  
- [ ] **Language Support**
  - Phase 2: JavaScript, TypeScript, Python
  - Phase 3: Rust, Move (Solana-specific)
  
- [ ] **Error Handling & Feedback**
  - Syntax error detection
  - Runtime error messages
  - Hint system for incorrect solutions
  
- [ ] **Solution Validation**
  - Compare output against expected results
  - Award XP on successful completion
  - Track attempts and hints used

**New Components to Create:**
- `TestResults` — Display test pass/fail status
- `OutputPanel` — Show console output & errors
- `HintPanel` — Progressive hints system
- `ExecutionControls` — Run, Stop, Reset buttons

**Implementation Services:**
- `CodeExecutionService` — Execute code safely
- `TestRunnerService` — Validate test cases
- `HintService` — Manage hint system and penalties

**Sanity CMS Updates:**
- Add `testCases` array to Challenge schema
- Add `hintSystem` configuration
- Add `language` field to Challenges

---

### 4. Achievement System

**Status:** 10% Complete (UI mocked in profile)

#### Current Implementation
- ✅ Achievement badges display in profile (static)
- ❌ No achievement logic or tracking

#### Missing / To-Do
- [ ] **Achievement Types**
  - **XP-Based**: Reach 1K, 5K, 10K XP milestones
  - **Challenge-Based**: Complete challenges (first challenge, 10 challenges, etc.)
  - **Streak-Based**: Maintain 7-day, 30-day, 100-day streaks
  - **Course-Based**: Complete entire courses
  - **Social-Based**: Complete courses with friends
  - **Rare/Special**: Limited-time challenges, seasonal events
  
- [ ] **Achievement Unlocking Logic**
  - Listen to progress events (XP earned, lesson completed)
  - Check achievement conditions
  - Unlock and notify user
  
- [ ] **Achievement Metadata**
  - Title, description, icon
  - Rarity level (common, rare, epic, legendary)
  - XP reward (bonus for special achievements)
  - Unlock conditions
  
- [ ] **Achievement Display**
  - Achievement toast notification on unlock
  - Achievement badge in profile
  - Achievement unlock history/timeline
  - Locked achievements with progress bar (e.g., "2/10 challenges completed")
  
- [ ] **Database Schema**
  - Track user achievements (`UserAchievement` table)
  - Define all available achievements (`Achievement` table)
  - Store unlock timestamps

**New Components to Create:**
- `AchievementCard` — Display single achievement
- `AchievementGallery` — Grid of all achievements
- `UnlockNotification` — Toast when achievement unlocked
- `AchievementProgress` — Progress toward locked achievement

**New Services:**
- `AchievementService` — Check/unlock achievements
- `AnalyticsService` — Track achievement metrics

**Database Schema (Backend):**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary'),
  xp_reward INT DEFAULT 0,
  condition_type ENUM('xp', 'challenges', 'streak', 'course', 'social'),
  condition_value INT,
  created_at TIMESTAMP
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  unlocked_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);
```

---

### 5. User Profile Page (Enhanced)

**Status:** 40% Complete (Basic structure exists)

#### Current Implementation
- ✅ Profile header with user info (mocked)
- ✅ Stats display (XP, level, lessons completed)
- ✅ Skills section (mocked)
- ✅ Basic achievements display (mocked)
- ❌ Real data integration

#### Missing / To-Do
- [ ] **User Authentication Integration**
  - Get logged-in user data from session
  - Load user profile from backend
  - Handle unauthenticated access (redirect or public profiles)
  
- [ ] **User Data Display**
  - Display actual username, bio, profile photo
  - Show actual stats from progress tracking
  - Display real achievements earned
  - Show actual skills with proficiency levels
  
- [ ] **Edit Profile Functionality**
  - Allow users to edit bio, avatar, username
  - Update profile in backend
  - Show success/error messages
  
- [ ] **Achievement Showcase**
  - Full achievement grid with tooltips
  - Achievement unlock dates
  - Achievement-specific stats (e.g., XP gained from achievements)
  
- [ ] **Learning Stats**
  - Course completion timeline graph
  - Daily/weekly learning activity heatmap
  - Estimated time to next level
  
- [ ] **Social Features** (Phase 2b)
  - Display public profile view
  - Show follower count (placeholder for Phase 3)
  - Recent activity feed

**Component Updates:**
- [Profile Page](app/profile/page.tsx) — Connect to auth & backend
- `AvatarUpload` — File upload for profile photo
- `EditProfileForm` — Profile editing modal
- `AchievementGallery` — Full achievement display
- `StatsChart` — Learning statistics graph

**Updated Hooks:**
- `useAuthUser()` — Get current user from session
- `useUserProfile(userId)` — Fetch user profile data

---

### 6. Settings & Preferences

**Status:** 30% Complete (Page exists, functionality missing)

#### Current Implementation
- ✅ Settings page structure exists
- ✅ Theme switcher exists
- ❌ Preferences not persisted

#### Missing / To-Do
- [ ] **Notification Preferences**
  - Email notifications (on/off)
  - Notification types (achievements, course updates, community)
  - Frequency settings (daily, weekly, never)
  
- [ ] **Learning Preferences**
  - Difficulty level (beginner, intermediate, advanced)
  - Preferred languages (for code challenges)
  - Daily learning goal (minutes)
  - Newsletter subscription
  
- [ ] **Accessibility Settings**
  - Font size adjustment
  - High contrast mode
  - Screen reader support toggle
  
- [ ] **Privacy Settings**
  - Profile visibility (public/private/friends-only)
  - Show XP in leaderboard (on/off)
  - Data collection opt-out
  
- [ ] **Account Management**
  - Change password
  - Connected accounts (Google, GitHub)
  - Session management (active devices)
  - Download personal data
  - Delete account
  
- [ ] **Backend Integration**
  - Create `PATCH /api/user/preferences` endpoint
  - Create `PATCH /api/user/settings` endpoint
  - Persist settings to database

**New Components to Create:**
- `NotificationSettings` — Notification preferences form
- `LearningPreferences` — Learning goal & difficulty settings
- `AccessibilitySettings` — Accessibility options
- `PrivacySettings` — Privacy & profiling options
- `AccountSettings` — Account management & security
- `SessionManager` — Manage active sessions

**Updated Hooks:**
- `useUserSettings()` — Get/update user settings
- `useNotificationPreferences()` — Manage notifications

---

## Implementation Order (Priority)

### Week 1-2: Foundation
1. **Learning Progress Service Integration**
   - Connect `useLearningProgress()` to backend
   - Create progress API endpoints
   - Store progress in database

2. **Dashboard Real Data**
   - Pull real user stats from database
   - Update stat cards dynamically
   - Add "Continue Learning" section

### Week 3-4: Code Execution
3. **Code Execution Engine**
   - Implement JavaScript/TypeScript execution
   - Create test case runner
   - Add error handling

4. **Challenge Integration**
   - Connect ChallengeRunner to backend
   - Implement solution validation
   - Award XP on completion

### Week 5-6: Achievements
5. **Achievement System**
   - Create achievement definitions
   - Implement unlock logic
   - Add achievement UI components

6. **Achievement Notifications**
   - Add toast notifications
   - Update profile achievements
   - Track in database

### Week 7: Polish
7. **Profile Enhancement**
   - Connect to real user data
   - Implement edit profile form
   - Add achievement showcase

8. **Settings & Preferences**
   - Implement preference saving
   - Add notification settings
   - Support theme persistence

---

## Technical Requirements

### Backend Endpoints Needed

```
// Learning Progress
GET /api/progress/:userId              // Get user's overall progress
GET /api/progress/:userId/courses      // Get progress per course
POST /api/progress/:userId/lesson/:lessonId/complete
PATCH /api/progress/:userId

// Code Execution
POST /api/execute                       // Execute code & run tests
GET /api/challenges/:challengeId/tests // Get test definitions

// Achievements
GET /api/achievements                   // List all achievements
GET /api/users/:userId/achievements    // Get user's achievements
POST /api/users/:userId/achievements/unlock

// User Settings
GET /api/users/:userId/settings
PATCH /api/users/:userId/settings
PATCH /api/users/:userId/preferences
```

### Database Schema Updates

- `UserProgress` table (track lesson completion)
- `Challenge` updates (add test cases, hints)
- `User` updates (timezone, preferences)
- `UserAchievement` table (track unlocked achievements)
- `Achievement` table (define all possible achievements)

### External Services

- **Code Execution**: Piston API or custom containerized service
- **Storage**: IndexedDB for offline progress

---

## Deliverables

✅ = Complete  
⚙️ = In Progress  
⏳ = Not Started

| Component | Status | Files |
|-----------|--------|-------|
| Dashboard Enhancement | ⏳ | dashboard/page.tsx, components/dashboard/* |
| Progress Tracking UI | ⏳ | components/dashboard/Progress* |
| Code Execution | ⏳ | components/editor/ChallengeRunner, services/* |
| Achievement System | ⏳ | components/achievements/*, services/achievement.service.ts |
| Profile Enhancement | ⏳ | profile/page.tsx, components/profile/* |
| Settings & Preferences | ⏳ | settings/page.tsx, components/settings/* |

---

## Success Metrics

- [ ] All dashboard stats update in real-time
- [ ] Users can complete code challenges with validation
- [ ] Achievement system unlocks correctly
- [ ] User settings persist across sessions
- [ ] No console errors or TypeScript violations
- [ ] Mobile responsive on all pages
- [ ] 90%+ Lighthouse performance score
- [ ] 100% TypeScript strict mode compliance

---

## Notes & Assumptions

- **Backend**: Assume REST API with appropriate endpoints
- **Database**: PostgreSQL or similar relational DB
- **Authentication**: NextAuth.js handles user sessions
- **Languages**: Phase 2 focuses on JS/TS, Rust support in Phase 3
- **Code Safety**: Use Web Workers or sandboxed iframe for code execution

---

**Next Step**: Review this roadmap with the team and confirm priorities. Once approved, begin with Learning Progress Service Integration (Week 1).
