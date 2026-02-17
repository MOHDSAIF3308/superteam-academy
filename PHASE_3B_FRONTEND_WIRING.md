# Phase 3b: Frontend Wiring

## Overview

Phase 3b connects frontend components to backend APIs and wallet hooks. This phase integrates:
- Phase 3a wallet hooks (`useWallet()`)
- Phase 2 backend APIs (transaction service, progress endpoints)
- Frontend lesson/dashboard pages with real data flow

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Pages                           │
│  (Lesson, Dashboard, Profile, Leaderboard)                 │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Custom Hooks   │
        │ useWallet()     │
        │ useLearningProgress()
        │ useProgram()    │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────┐
        │   API Services              │
        │ course.service.ts           │
        │ learning-progress.service.ts│
        │ on-chain.service.ts         │
        └────────┬────────────────────┘
                 │
        ┌────────▼────────────────────┐
        │   Backend APIs              │
        │ POST /api/submit-challenge  │
        │ GET /api/progress           │
        │ POST /api/transaction/*     │
        └────────────────────────────┘
```

## Implementation Steps

### Step 1: Create `useProgram()` Hook

Location: `/lib/hooks/useProgram.ts`

This hook wraps Anchor program interaction for on-chain operations.

```typescript
import { useConnection } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import { useWallet } from './useWallet'
import IDL from '@/lib/anchor/academy.json'

export const useProgram = () => {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()

  return useMemo(() => {
    if (!publicKey || !signTransaction) {
      return null
    }

    try {
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any[]) => {
          return Promise.all(txs.map(tx => signTransaction(tx)))
        },
      } as Wallet

      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })

      const programId = process.env.NEXT_PUBLIC_ANCHOR_PROGRAM_ID
      if (!programId) {
        console.warn('NEXT_PUBLIC_ANCHOR_PROGRAM_ID not set')
        return null
      }

      return new Program(IDL as any, programId, provider)
    } catch (error) {
      console.error('Failed to initialize program:', error)
      return null
    }
  }, [connection, publicKey, signTransaction])
}
```

### Step 2: Update Hooks Index

Location: `/lib/hooks/index.ts`

```typescript
export { useI18n } from './useI18n'
export { useTheme } from './useTheme'
export { useAuth } from './useAuth'
export { useLearningProgress } from './useLearningProgress'
export { useProgress } from './useProgress'
export { useWallet } from './useWallet'
export { useProgram } from './useProgram'
```

### Step 3: Create Transaction Service

Location: `/lib/services/transaction.service.ts`

```typescript
import { Transaction } from '@solana/web3.js'

interface SignedTxResponse {
  signedTx: string
  blockhash: string
  backendSignature: string
}

export class TransactionService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  async completeLessonTX(
    userId: string,
    courseId: string,
    lessonIndex: number,
    xpAmount: number
  ): Promise<SignedTxResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/complete-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        courseId,
        lessonIndex,
        xpAmount,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get signed transaction: ${response.statusText}`)
    }

    return response.json()
  }

  async enrollTX(userId: string, courseId: string): Promise<SignedTxResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get enroll transaction: ${response.statusText}`)
    }

    return response.json()
  }

  async finalizeCourseT(userId: string, courseId: string): Promise<SignedTxResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/finalize-course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get finalize transaction: ${response.statusText}`)
    }

    return response.json()
  }
}

export const transactionService = new TransactionService()
```

### Step 4: Update Course Service

Location: `/lib/services/course.service.ts`

```typescript
import { transactionService } from './transaction.service'

export class CourseService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  async submitChallenge(
    userId: string,
    courseId: string,
    lessonId: string,
    code: string
  ): Promise<{ success: boolean; xpAwarded: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    })

    if (!response.ok) {
      throw new Error(`Submission failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getLesson(courseId: string, lessonId: string) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch lesson: ${response.statusText}`)
    }

    return response.json()
  }

  async getCourse(courseId: string) {
    const response = await fetch(`${this.baseUrl}/courses/${courseId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch course: ${response.statusText}`)
    }

    return response.json()
  }

  async getAllCourses() {
    const response = await fetch(`${this.baseUrl}/courses`)

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`)
    }

    return response.json()
  }
}

export const courseService = new CourseService()
```

### Step 5: Update Learning Progress Service

Location: `/lib/services/learning-progress.service.ts`

```typescript
export class LearningProgressService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  async getProgress(userId: string) {
    const response = await fetch(`${this.baseUrl}/progress/${userId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.statusText}`)
    }

    return response.json()
  }

  async updateProgress(userId: string, courseId: string, lessonId: string) {
    const response = await fetch(`${this.baseUrl}/progress/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, lessonId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update progress: ${response.statusText}`)
    }

    return response.json()
  }

  async getLeaderboard(limit: number = 100) {
    const response = await fetch(`${this.baseUrl}/leaderboard?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
    }

    return response.json()
  }

  async getUserRank(userId: string) {
    const response = await fetch(`${this.baseUrl}/leaderboard/rank/${userId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch user rank: ${response.statusText}`)
    }

    return response.json()
  }
}

export const learningProgressService = new LearningProgressService()
```

### Step 6: Wire Lesson Page

Location: `/app/courses/[slug]/lessons/[id]/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/hooks/useWallet'
import { CodeEditor, ChallengeRunner } from '@/components/editor'
import { courseService, learningProgressService } from '@/lib/services'
import { transactionService } from '@/lib/services/transaction.service'
import { Button } from '@/components/ui'

export default function LessonPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const { publicKey, connected, signTransaction } = useWallet()
  const [lesson, setLesson] = useState<any>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const data = await courseService.getLesson(params.slug, params.id)
        setLesson(data)
        setCode(data.starterCode || '')
      } catch (error) {
        console.error('Failed to load lesson:', error)
      }
    }

    fetchLesson()
  }, [params.slug, params.id])

  const handleSubmit = async () => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first')
      return
    }

    setLoading(true)
    try {
      // 1. Submit code to backend
      const submission = await courseService.submitChallenge(
        publicKey.toBase58(),
        params.slug,
        params.id,
        code
      )

      setResult(submission)

      if (submission.success) {
        // 2. Get signed transaction from backend
        const txResponse = await transactionService.completeLessonTX(
          publicKey.toBase58(),
          params.slug,
          parseInt(params.id),
          submission.xpAwarded
        )

        // 3. Sign and submit transaction
        const txBuffer = Buffer.from(txResponse.signedTx, 'base64')
        const tx = Transaction.from(txBuffer)

        const signed = await signTransaction?.(tx)
        if (!signed) {
          throw new Error('Failed to sign transaction')
        }

        // 4. Send to network (via wallet)
        // Note: Wallet adapter handles this automatically
        setSubmitted(true)

        // 5. Update local progress
        await learningProgressService.updateProgress(
          publicKey.toBase58(),
          params.slug,
          params.id
        )
      }
    } catch (error) {
      console.error('Submission failed:', error)
      setResult({ success: false, message: String(error) })
    } finally {
      setLoading(false)
    }
  }

  if (!lesson) return <div>Loading...</div>

  return (
    <div className="flex h-screen gap-4 p-4">
      {/* Left Panel: Instructions */}
      <div className="flex-1 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>
        <div className="prose dark:prose-invert max-w-none">
          {lesson.description}
        </div>

        {result && (
          <div
            className={`mt-4 p-4 rounded ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <p>{result.message}</p>
            {result.xpAwarded && (
              <p className="font-bold">+{result.xpAwarded} XP</p>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Code Editor */}
      <div className="flex-1 flex flex-col gap-4">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={lesson.language || 'javascript'}
        />

        <Button
          onClick={handleSubmit}
          disabled={loading || !connected}
          className="w-full"
        >
          {loading ? 'Submitting...' : 'Submit Solution'}
        </Button>
      </div>
    </div>
  )
}
```

### Step 7: Wire Dashboard Page

Location: `/app/dashboard/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@/lib/hooks/useWallet'
import { learningProgressService, courseService } from '@/lib/services'
import { Card, Button } from '@/components/ui'

export default function DashboardPage() {
  const { publicKey, connected } = useWallet()
  const [progress, setProgress] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey || !connected) {
        setLoading(false)
        return
      }

      try {
        const [progressData, coursesData] = await Promise.all([
          learningProgressService.getProgress(publicKey.toBase58()),
          courseService.getAllCourses(),
        ])

        setProgress(progressData)
        setCourses(coursesData)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [publicKey, connected])

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600 mb-4">
            Please connect your wallet to view your dashboard
          </p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-gray-600">Total XP</p>
          <p className="text-3xl font-bold">{progress?.totalXP || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600">Level</p>
          <p className="text-3xl font-bold">{progress?.level || 1}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600">Streak</p>
          <p className="text-3xl font-bold">{progress?.streak || 0} days</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600">Courses</p>
          <p className="text-3xl font-bold">{progress?.coursesCompleted || 0}</p>
        </Card>
      </div>

      {/* In Progress Courses */}
      <h2 className="text-2xl font-bold mb-4">In Progress</h2>
      <div className="grid grid-cols-3 gap-4">
        {courses.map((course) => (
          <Card key={course.id} className="p-4">
            <h3 className="font-bold mb-2">{course.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{course.description}</p>
            <Button href={`/courses/${course.id}`} className="w-full">
              Continue
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Step 8: Wire Leaderboard Page

Location: `/app/leaderboard/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { learningProgressService } from '@/lib/services'
import { Card } from '@/components/ui'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await learningProgressService.getLeaderboard(100)
        setLeaderboard(data)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-right">XP</th>
              <th className="px-4 py-2 text-right">Level</th>
              <th className="px-4 py-2 text-right">Courses</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user, index) => (
              <tr key={user.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-2 font-bold">#{index + 1}</td>
                <td className="px-4 py-2">{user.displayName}</td>
                <td className="px-4 py-2 text-right">{user.totalXP}</td>
                <td className="px-4 py-2 text-right">{user.level}</td>
                <td className="px-4 py-2 text-right">{user.coursesCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
```

## Environment Variables

Add to `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_ANCHOR_PROGRAM_ID=<your-program-id>
```

## Testing Checklist

- [ ] Wallet connects and shows in header
- [ ] Dashboard loads user data after wallet connection
- [ ] Lesson page displays course content
- [ ] Code submission works and returns XP
- [ ] Transaction signing works with wallet
- [ ] Leaderboard displays top users
- [ ] Progress updates after lesson completion
- [ ] No console errors or TypeScript violations

## Files Created/Modified

### New Files
- `/lib/hooks/useProgram.ts` - Anchor program hook
- `/lib/services/transaction.service.ts` - Transaction signing service

### Modified Files
- `/lib/hooks/index.ts` - Export useProgram
- `/lib/services/course.service.ts` - Add API calls
- `/lib/services/learning-progress.service.ts` - Add API calls
- `/app/courses/[slug]/lessons/[id]/page.tsx` - Wire lesson page
- `/app/dashboard/page.tsx` - Wire dashboard
- `/app/leaderboard/page.tsx` - Wire leaderboard

## Next Steps

After Phase 3b:
- Phase 4: On-chain credential issuance
- Phase 5: Advanced features (collaboration, forums, etc.)

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Depends On**: Phase 3a (wallet hooks), Phase 2 (backend APIs)
