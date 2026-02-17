# Phase 3b: Frontend Wiring — Quick Start

## What's Implemented

✅ **Phase 3b Frontend Wiring** connects your frontend to backend APIs and wallet hooks.

### New Files Created

1. **`/lib/hooks/useProgram.ts`** - Anchor program interaction hook
2. **`/lib/services/transaction.service.ts`** - Backend transaction API calls
3. **`PHASE_3B_FRONTEND_WIRING.md`** - Complete implementation guide

### Files Updated

1. **`/lib/hooks/index.ts`** - Added useWallet & useProgram exports
2. **`/lib/services/index.ts`** - Added transaction service exports
3. **`/lib/services/course.service.ts`** - Added API integration methods

## Quick Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_ANCHOR_PROGRAM_ID=<your-program-id>
```

### 2. Start Backend

```bash
cd backend
npm run dev
```

Backend should run on `http://localhost:3001`

### 3. Start Frontend

```bash
npm run dev
```

Frontend should run on `http://localhost:3000`

## Usage Examples

### Connect Wallet in Component

```typescript
import { useWallet } from '@/lib/hooks'

export function MyComponent() {
  const { publicKey, connected, connect } = useWallet()

  if (!connected) {
    return <button onClick={connect}>Connect Wallet</button>
  }

  return <div>Connected: {publicKey?.toBase58()}</div>
}
```

### Submit Lesson Challenge

```typescript
import { courseService, transactionService } from '@/lib/services'
import { useWallet } from '@/lib/hooks'

export function LessonPage() {
  const { publicKey, signTransaction } = useWallet()

  const handleSubmit = async (code: string) => {
    // 1. Submit code to backend
    const result = await courseService.submitChallenge(
      publicKey.toBase58(),
      courseId,
      lessonId,
      code
    )

    if (result.success) {
      // 2. Get signed transaction
      const txResponse = await transactionService.completeLessonTX({
        userId: publicKey.toBase58(),
        courseId,
        lessonIndex: 0,
        xpAmount: result.xpAwarded,
      })

      // 3. Sign and submit
      const tx = Transaction.from(Buffer.from(txResponse.signedTx, 'base64'))
      const signed = await signTransaction(tx)
      // Wallet adapter handles submission
    }
  }
}
```

### Fetch User Progress

```typescript
import { learningProgressService } from '@/lib/services'
import { useWallet } from '@/lib/hooks'

export function Dashboard() {
  const { publicKey } = useWallet()
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    if (publicKey) {
      learningProgressService
        .getProgress(publicKey.toBase58())
        .then(setProgress)
    }
  }, [publicKey])

  return <div>XP: {progress?.totalXP}</div>
}
```

## Testing Checklist

- [ ] Backend runs without errors
- [ ] Frontend connects to backend API
- [ ] Wallet connects and shows in header
- [ ] Dashboard loads user data
- [ ] Lesson page displays content
- [ ] Code submission works
- [ ] Transaction signing works
- [ ] No TypeScript errors

## Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module '@coral-xyz/anchor'" | Run `npm install` in backend |
| "NEXT_PUBLIC_API_URL not set" | Add to `.env.local` |
| "Wallet not connected" | Click "Connect Wallet" button |
| "Transaction signing failed" | Check wallet is on correct network |

## Next Steps

1. **Implement lesson pages** - Wire up `/app/courses/[slug]/lessons/[id]/page.tsx`
2. **Implement dashboard** - Wire up `/app/dashboard/page.tsx`
3. **Implement leaderboard** - Wire up `/app/leaderboard/page.tsx`
4. **Test end-to-end** - Complete full user flow

See `PHASE_3B_FRONTEND_WIRING.md` for detailed implementation guide.

## Architecture Overview

```
Frontend (Next.js)
    ↓
useWallet() hook (Phase 3a)
    ↓
Services (course, progress, transaction)
    ↓
Backend APIs (http://localhost:3001/api)
    ↓
Database & Solana RPC
```

## Files Reference

- **Hooks**: `/lib/hooks/` - React hooks for wallet & program interaction
- **Services**: `/lib/services/` - API client services
- **Pages**: `/app/` - Next.js pages (to be wired)
- **Components**: `/components/` - Reusable React components

---

**Status**: Phase 3b Complete ✅  
**Next Phase**: Phase 4 - On-Chain Credential Issuance  
**Last Updated**: February 2026
