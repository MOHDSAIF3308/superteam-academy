# Solana Academy Platform — Architecture Reference

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Scope:** Frontend Architecture & Data Flows

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                       │
│                   (Next.js Frontend @ academy.io)                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      React Components                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  Header  │  │CourseCard│  │CodeEditor│  │GamificationUI    │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  │                                                                    │   │
│  │  Pages: Home, Courses, Dashboard, Profile, Leaderboard           │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │              State Management & Hooks                           │   │
│  │  Zustand Stores | TanStack Query | useI18n, useProgram        │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                         │
│  ┌──────────────────────────▼──────────────────────────────────────┐   │
│  │           Services Layer (lib/services)                        │   │
│  │  CourseService | ProgressService | (Future) OnChainService    │   │
│  └──────────────────────────┬──────────────────────────────────────┘   │
│                             │                                         │
└─────────────────────────────┼─────────────────────────────────────────┘
                              │ HTTP/REST
                         ┌────▼────┐
        ┌────────────────┤ Backend  ├────────────────┐
        │                │   API    │                │
        │                └─────────┘                │
        │                                       │
┌───────▼───────┐                    ┌──────────▼──────────┐
│  Database     │                    │   Solana RPC        │
│               │                    │   (Helius)          │
│ • Courses     │                    │                     │
│ • Learners    │                    │ • Account Lookups   │
│ • Progress    │                    │ • Token Balances    │
│ • Enrollments │                    │ • TX Broadcasting   │
└───────────────┘                    └──────────────────────┘
                    (Future Integration)
                              │
                    ┌─────────▼────────────┐
                    │  Solana Blockchain   │
                    │  Mainnet/Devnet      │
                    │                      │
                    │ • XP Token Mint      │
                    │ • Credentials (PDA)  │
                    │ • User Wallets       │
                    └─────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
<RootLayout>
  ├── <Header>
  │   ├── Logo
  │   ├── Navigation
  │   ├── WalletAdapter (future)
  │   └── LanguageSwitcher
  │
  ├── <main> (page content)
  │   ├── / → <HomePage>
  │   │   ├── HeroSection
  │   │   ├── FeaturesSection
  │   │   └── FeaturedCourses
  │   │
  │   ├── /courses → <CourseCatalog>
  │   │   ├── SearchBar
  │   │   ├── FilterPanel
  │   │   └── CourseGrid
  │   │       └── CourseCard (multiple)
  │   │
  │   ├── /courses/[slug] → <CourseDetail>
  │   │   ├── CourseHeader
  │   │   ├── Tabs
  │   │   │   ├── AboutTab
  │   │   │   ├── ModulesTab
  │   │   │   └── ReviewsTab
  │   │   └── SidebarProgressWidget
  │   │
  │   ├── /courses/[slug]/lessons/[id] → <LessonPage>
  │   │   ├── ResizablePanel (left=60%)
  │   │   │   ├── LessonHeader
  │   │   │   ├── LessonContent
  │   │   │   └── SubmissionStatus
  │   │   │
  │   │   └── ResizablePanel (right=40%)
  │   │       ├── CodeEditor
  │   │       ├── ConsoleOutput
  │   │       └── ChallengeInfo
  │   │
  │   ├── /dashboard → <Dashboard>
  │   │   ├── WelcomeBanner
  │   │   ├── StatsGrid
  │   │   ├── InProgressCourses
  │   │   ├── RecentAchievements
  │   │   ├── XPGraph (future)
  │   │   └── RecommendedCourses
  │   │
  │   ├── /profile → <Profile>
  │   │   ├── ProfileHeader
  │   │   ├── StatsSection
  │   │   ├── CompletedCourses
  │   │   └── Certificates
  │   │
  │   ├── /leaderboard → <Leaderboard>
  │   │   ├── FilterBar
  │   │   └── LeaderboardTable
  │   │
  │   └── /settings → <Settings>
  │       ├── ProfileSettings
  │       ├── PreferencesSection
  │       ├── PrivacySection
  │       ├── LearningSettings
  │       └── ExportDataSection
  │
  └── <Footer>
      ├── Links
      ├── Copyright
      └── SocialLinks
```

## Data Flow Architecture

### 1. Course Browsing Flow

```
User Action: Click on /courses
    │
    ▼
<CourseCatalog> renders
    │
    ├─→ useI18n() hook
    │   └─→ Get language from localStorage/context
    │       └─→ Render translations
    │
    └─→ useQuery('courses') via TanStack Query
        │
        ├─→ Check cache (stale-while-revalidate)
        │
        ├─→ If cache miss, request FROM_BACKEND:
        │   GET /api/v1/courses?page=1&limit=24&difficulty=...&track=...
        │   │
        │   └─→ Backend queries database
        │       └─→ Returns Course[]
        │
        └─→ Store in TanStack Query cache
            └─→ Update component state
                └─→ Render CourseCard components
```

### 2. Course Enrollment Flow

```
User Action: Click "Enroll" on CourseCard
    │
    ▼
POST /api/v1/enrollments
  {
    learnerId: "user_id",
    courseId: "course_id"
  }
    │
    ▼
Backend creates Enrollment record
    │
    ▼
Response with Enrollment object
    │
    ▼
Frontend updates state:
  • Add to learner.enrollments array
  • Update course status
  • Redirect to /dashboard
    │
    ▼
Dashboard renders new "In Progress" section
```

### 3. Lesson Completion Flow

```
User Action: Click "Submit Solution" in CodeEditor
    │
    ▼
<LessonPage> collects:
  {
    lessonId: "lesson_id",
    learnerId: "user_id",
    code: "user's_code",
    language: "javascript"
  }
    │
    ▼
POST /api/v1/submissions
    │
    ▼
Backend:
  1. Sandbox executes code
  2. Runs against testCases
  3. Compares output
  4. Awards XP if successful
    │
    ▼
Response:
  {
    success: true/false,
    result: "output",
    xpAwarded: 50,
    message: "feedback_text"
  }
    │
    ▼
useProgress hook updates:
  • lessonCompleted array
  • totalXP += xpAwarded
  • achievementProgress[]
    │
    ▼
Display:
  • Success notification
  • XP toast
  • "Next Lesson" button
```

### 4. Profile Fetch Flow

```
User Action: Click on /profile/[wallet_address]
    │
    ▼
<Profile> page renders
  │
  ├─→ getServerSideProps (SSG or ISR)
  │   GET /api/v1/learners/[wallet]
  │   GET /api/v1/learners/[wallet]/achievements
  │   GET /api/v1/learners/[wallet]/leaderboard-rank
  │   │
  │   └─→ Returns learner + achievements + rank
  │
  └─→ Static/cached + revalidate every 60s
      └─→ Display profile data
```

### 5. Real-Time XP Update Flow (Future - On-Chain)

```
Learner completes lesson
    │
    ▼
Backend awards XP
    │
    ├─→ Calls on-chain program
    │   Program: XP Token Mint (Token-2022)
    │   │
    │   └─→ Backend signer sends transaction:
    │       .accounts({
    │         mint: currentSeasonMint,
    │         dest: learnerATA,
    │         authority: backendSigner,
    │         ...
    │       })
    │       .instruction(amount: 50)
    │
    └─→ Solana blockchain confirms
        │
        ├─→ Frontend subscribed to learner ATA
        │   via ws.onAccountChange()
        │
        └─→ Real-time update triggers:
            • Update XP balance in UI
            • Refetch leaderboard rank
            • Check for new achievements
```

## State Management

### Zustand Stores

```typescript
// learner.store.ts
interface LearnerStore {
  learner: Learner | null;
  isLoading: boolean;
  error: string | null;
  setLearner: (learner: Learner) => void;
  updateProgress: (courseId: string, xpDelta: number) => void;
  logout: () => void;
}

// courses.store.ts
interface CoursesStore {
  courses: Course[];
  isLoading: boolean;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

// achievements.store.ts
interface AchievementsStore {
  achievements: Achievement[];
  unlockedIds: Set<string>;
  addAchievement: (achievement: Achievement) => void;
}
```

### TanStack Query (Server State)

```typescript
// Queries
useQuery('courses', () => fetchCourses())
useQuery(['course', courseId], () => fetchCourse(courseId))
useQuery(['learner', learnerId], () => fetchLearner(learnerId))
useQuery(['leaderboard'], () => fetchLeaderboard())

// Mutations
useMutation(({ courseId }) => enrollCourse(courseId))
useMutation(({ code }) => submitLesson(code))
useMutation(({ profile }) => updateProfile(profile))
```

## Service Layer Architecture

### CourseService
```typescript
class CourseService {
  async getAllCourses(filters?: FilterOptions): Promise<Course[]>
  async getCourse(courseId: string): Promise<Course>
  async getCourseWithLessons(courseId: string): Promise<CourseWithLessons>
  async getLesson(courseId: string, lessonId: string): Promise<Lesson>
  async searchCourses(query: string): Promise<Course[]>
}
```

### LearningProgressService
```typescript
class LearningProgressService {
  async getLearnerDashboard(learnerId: string): Promise<DashboardData>
  async getProgress(learnerId: string, courseId: string): Promise<Enrollment>
  async submitLesson(submission: LessonSubmission): Promise<SubmissionResult>
  async awardXP(learnerId: string, xpAmount: number): Promise<void>
  async getAchievements(learnerId: string): Promise<Achievement[]>
}
```

### OnChainService (Future)
```typescript
class OnChainService {
  async getXPBalance(wallet: PublicKey, season?: number): Promise<number>
  async getLeaderboard(season?: number): Promise<LeaderboardEntry[]>
  async getCredentials(wallet: PublicKey): Promise<Credential[]>
  async issueCredential(learnerId: PublicKey, courseId: string): Promise<TransactionSignature>
  async verifyCredential(credentialId: string): Promise<CredentialProof>
}
```

## Routing Architecture

### Next.js App Directory Structure

```
app/
├── layout.tsx                     ← Root layout (Header, Footer)
├── page.tsx                       ← / (Home)
├── globals.css
│
├── courses/
│   ├── page.tsx                   ← /courses (Catalog)
│   ├── [slug]/
│   │   ├── page.tsx               ← /courses/[slug] (Detail)
│   │   └── lessons/
│   │       └── [id]/
│   │           └── page.tsx        ← /courses/[slug]/lessons/[id] (Lesson)
│
├── dashboard/
│   └── page.tsx                   ← /dashboard (Learner overview)
│
├── profile/
│   └── page.tsx                   ← /profile[/[wallet]] (Profile)
│
├── certificates/
│   └── [id]/
│       └── page.tsx               ← /certificates/[id] (Single cert)
│
├── leaderboard/
│   └── page.tsx                   ← /leaderboard (Rankings)
│
└── settings/
    └── page.tsx                   ← /settings (Preferences)
```

## Code Editor Architecture

### CodeEditor Component Flow

```
<CodeEditor>
  │
  ├─→ Mount Monaco Editor instance
  │   • Language: auto-detect from lesson.language
  │   • Theme: light/dark from settings
  │   • Value: lesson.starterCode
  │   • readOnly: false
  │
  ├─→ Setup editor features
  │   • Syntax highlighting
  │   • Auto-complete (IntelliSense)
  │   • Minimap
  │   • Line numbers
  │   • Bracket matching
  │
  ├─→ Custom extensions
  │   • Monaco Themes
  │   • Custom language defs (if needed)
  │
  └─→ Event handlers
      ├─→ onChange: Save to local state
      ├─→ onSave: Ctrl+S submit
      └─→ onError: Syntax error feedback
          │
          ├─→ Display error decorations
          └─→ Show problem markers
```

### Code Execution & Sandbox

```
<ChallengeRunner>
  │
  └─→ Execute code SAFELY
      │
      ├─→ Web Worker or iframe sandbox
      │  (prevents access to DOM, network, etc.)
      │
      ├─→ Import test framework
      │   (Jest, Vitest, custom)
      │
      ├─→ Run learner's code
      │   learnerCode + testCases
      │
      ├─→ Capture output & errors
      │   stdout, stderr, coverage
      │
      └─→ Report results to parent
          {
            passed: boolean,
            tests: TestResult[],
            output: string,
            executionTime: number
          }
```

## Internationalization (i18n) Architecture

### next-intl Integration

```
app/[locale]/
├── layout.tsx          ← locale provider
├── page.tsx
├── courses/
├── dashboard/
└── ...

lib/i18n/
├── locale-config.ts    ← supported locales
├── translations.ts     ← translation keys
└── hooks.tsx
    └── useI18n()       ← Hook for using translations

Usage:
const { t } = useI18n();
<h1>{t('home.title')}</h1>
```

## Performance Optimization Strategy

### Image Optimization
```typescript
// Use Next.js Image component
<Image
  src={course.thumbnail}
  alt={course.title}
  width={300}
  height={200}
  placeholder="blur"
  quality={75}
/>
```

### Code Splitting
```typescript
// Lazy load heavy components
const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  loading: () => <EditorSkeleton />,
  ssr: false
});
```

### Caching Strategy
```
Browser Cache:
  • Static assets (JS, CSS, images): 1 year
  • API responses (via TanStack Query): 5 minutes
  • Course list: 1 hour

CDN Cache (Vercel Edge):
  • HTML: 60 seconds
  • Assets: 1 year
  • API routes: Not cached (dynamic)

Stale-While-Revalidate:
  • Serve stale + fetch fresh in background
  • For non-critical data (course list)
```

## Security Considerations

### Input Validation
```typescript
// Validate before sending to backend
import { z } from 'zod';

const CourseEnrollmentSchema = z.object({
  learnerId: z.string().uuid(),
  courseId: z.string().uuid(),
});

// Use on form submit
const data = CourseEnrollmentSchema.parse(formData);
```

### XSS Prevention
```typescript
// Never use dangerouslySetInnerHTML
// Use libraries for markdown rendering
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const html = DOMPurify.sanitize(marked(lessonContent));
```

### Code Execution Sandbox
```typescript
// Execute user code safely
const worker = new Worker('/sandbox-worker.js');

worker.postMessage({
  code: userCode,
  testCases: lessonTests
});

worker.onmessage = ({ data: result }) => {
  // Display result safely
};
```

## Error Handling Architecture

### Error Boundary Component

```typescript
<ErrorBoundary
  fallback={<ErrorPage />}
  onError={(error) => {
    logToSentry(error);
    showErrorToast(error.message);
  }}
>
  <App />
</ErrorBoundary>
```

### API Error Handling

```typescript
// Service layer
try {
  const response = await fetch('/api/v1/courses');
  if (!response.ok) throw new APIError(response.status);
  return response.json();
} catch (error) {
  logError(error);
  throw error; // Propagate to UI
}

// Component layer
useQuery('courses', fetchCourses, {
  onError: (error) => {
    if (error instanceof APIError) {
      showErrorToast(error.message);
    }
  }
});
```

## Database Schema (Backend Reference)

```sql
-- Users/Learners
CREATE TABLE learners (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  track_id UUID,
  duration_minutes INT,
  xp_reward INT,
  instructor_id UUID,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP
);

-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title VARCHAR(255),
  order_index INT,
  content TEXT,
  language VARCHAR(50),
  starter_code TEXT,
  xp_reward INT,
  created_at TIMESTAMP
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES learners(id),
  course_id UUID REFERENCES courses(id),
  enrolled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  progress_percent INT DEFAULT 0,
  xp_earned INT DEFAULT 0
);

-- Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  learner_id UUID REFERENCES learners(id),
  code TEXT,
  passed BOOLEAN,
  feedback TEXT,
  submitted_at TIMESTAMP
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  icon_url VARCHAR(500),
  xp_value INT,
  rarity VARCHAR(50)
);

-- Learner Achievements (join table)
CREATE TABLE learner_achievements (
  learner_id UUID REFERENCES learners(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMP,
  PRIMARY KEY (learner_id, achievement_id)
);
```

## Monitoring & Analytics

```typescript
// Track user interactions
function trackEvent(eventName: string, properties?: Record<string, any>) {
  window.analytics?.track(eventName, properties);
}

// Usage in components
function CourseCard({ course }) {
  const handleEnroll = () => {
    trackEvent('course_enrolled', { courseId: course.id, difficulty: course.difficulty });
    // ... actual enrollment logic
  };
}

// Key metrics to monitor
- Page load time
- Code editor load time
- API response times
- Lesson submission success rate
- User engagement (lessons completed)
- Share of completed courses
- Leaderboard activity
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained By**: Superteam Academy Team
