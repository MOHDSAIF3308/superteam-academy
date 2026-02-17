# Superteam Academy — Architecture Audit & Implementation Roadmap

**Audit Date**: February 16, 2026  
**Current Status**: Frontend MVP + Backend API (42% complete) | On-Chain: Not Started (0%)  
**Architecture Reference**: See ARCHITECTURE_REFERENCE.md

---

## Executive Summary

| Layer | Component | Status | Completion |
|-------|-----------|--------|-----------|
| **Frontend** | Pages & Components | 🟡 Partial | 70% |
| **Frontend** | Wallet Integration | 🔴 Not Started | 0% |
| **Frontend** | On-Chain Interaction | 🔴 Not Started | 0% |
| **Backend** | API Services | 🟢 Complete | 100% |
| **Backend** | TX Builder (signing) | 🔴 Not Started | 0% |
| **Backend** | Lesson Validation | 🟡 Partial | 30% |
| **On-Chain** | Anchor Program | 🔴 Not Started | 0% |
| **On-Chain** | XP Token Mint | 🔴 Not Started | 0% |
| **On-Chain** | Compressed Credentials | 🔴 Not Started | 0% |
| **Indexing** | Helius DAS Integration | 🔴 Not Started | 0% |
| **Indexing** | Photon ZK Queries | 🔴 Not Started | 0% |

**Overall**: **42% Frontend + API** | **0% On-Chain Stack** → **~21% of full architecture**

---

## What IS Implemented ✅

### 1. Frontend Core (70%)
- ✅ Next.js 14 app directory setup
- ✅ TypeScript strict mode
- ✅ Tailwind CSS + theme system
- ✅ i18n (PT-BR, ES, EN via next-intl)
- ✅ 8 main pages (dashboard, courses, profile, leaderboard, etc.)
- ✅ Code execution engine (JavaScript/TypeScript)
- ✅ Component library (Button, Card, Input, ResizablePanel)
- ✅ NextAuth.js with Google/GitHub OAuth
- ✅ @solana/wallet-adapter packages installed (but NOT integrated)

### 2. Backend API (100%)
- ✅ Express server running on port 3001
- ✅ SQLite database with migrations
- ✅ User service (signup, login, profile, JWT)
- ✅ Gamification service (XP, achievements, streaks, levels)
- ✅ CORS configured for frontend
- ✅ Auth middleware (JWT verification)
- ✅ Routes for:
  - User management (register, login, profile, update)
  - Achievements (get all, check unlock)
  - Leaderboard (get top 100, user rank)
  - XP tracking (earn, update daily)

### 3. CMS Integration (80%)
- ✅ Sanity CMS configured
- ✅ Course, Module, Lesson, Challenge schemas
- ✅ Block content support
- ✅ Sanity client setup (`lib/sanity.ts`)
- ⏳ Sample content not fully imported

---

## What is NOT Implemented (Critical Gaps) ❌

### 🔴 **Tier 1: Essential On-Chain Infrastructure** (Required for core flow)

#### 1. Anchor Program (Rust) — **0% complete**
The heart of the system. None of this exists:
```
programs/
├── academy/
│   └── src/
│       ├── lib.rs
│       ├── instructions/
│       │   ├── init.rs
│       │   ├── create_course.rs
│       │   ├── enroll.rs
│       │   ├── complete_lesson.rs
│       │   ├── finalize_course.rs
│       │   ├── issue_credential.rs
│       │   └── ...
│       └── state/
│           ├── config.rs
│           ├── course.rs
│           ├── learner_profile.rs
│           ├── enrollment.rs
│           └── credential.rs
├── Cargo.toml
└── Anchor.toml
```

**What this program defines**:
- PDAs for Config, Course, LearnerProfile, Enrollment, Credential
- XP Token Mint (Token-2022)
- 16 core instructions (initialize, create_season, enroll, complete_lesson, etc.)
- Bitmap tracking (lesson completion flags, achievements)
- Streak system (current streak, longest, freeze logic)
- Rate limiting (daily XP cap)
- Referral tracking
- ZK compression for credentials

**Estimated effort**: 2-3 weeks for experienced Anchor dev

---

#### 2. Wallet Integration (Frontend) — **0% complete**
Currently: Pages exist but NO wallet connection UI

**Missing**:
```typescript
// This doesn't exist yet:
<WalletMultiButton />  // In Header
useWallet() hook       // Provides wallet context
<WalletProviderAdapter />  // Wraps app

// TypeScript types missing:
type WalletAccount = { pubkey: PublicKey; }
type WalletContextState = { wallet, publicKey, connect(), disconnect(), sendTransaction() }
```

Files to create:
- `lib/hooks/useWallet.ts` — Custom hook for wallet state
- `components/auth/WalletConnect.tsx` — UI button
- `lib/wallet.ts` — Wallet adapter configuration
- Update `components/providers/WalletProvider.tsx` — Currently empty

**Estimated effort**: 1-2 days

---

#### 3. Anchor Client Generation & Integration — **0% complete**
After Anchor program is deployed, generate IDL and TypeScript client:

```typescript
// This doesn't exist:
import { Program, AnchorProvider } from '@project-serum/anchor'
import { AcademyProgram } from '@/lib/anchor/academy'
import IDL from '@/lib/anchor/academy.json'

// Need to create:
lib/anchor/
├── academy.json  (IDL - auto-generated from program)
├── types.ts      (Program types)
├── instructions/ 
│   ├── enroll.ts
│   ├── complete-lesson.ts
│   ├── finalize-course.ts
│   └── ...
└── utils.ts      (PDA derivation, seed helpers)
```

**Estimated effort**: 1 day (mostly codegen)

---

### 🔴 **Tier 2: Backend TX Builder** (Needed for user flow)

#### 4. Transaction Signing Service — **0% complete**
Currently: No way for backend to sign TXs on behalf of user

**Missing**:
```typescript
// backend/src/services/transaction.service.ts (doesn't exist)
class TransactionService {
  async enrollCourse(userId: string, courseId: string) {
    // 1. Derive user's Enrollment PDA
    // 2. Build enroll instruction
    // 3. Sign with backend_signer keypair
    // 4. Return signed TX + blockhash
  }
  
  async completeLessonCPI(lessonIndex: number, xpAmount: number) {
    // Similar but includes Token-2022 CPI
  }
}
```

Also need:
- Blockhash fetching (with expiry handling)
- TX versioning (v0 with address lookup tables for ZK compression)
- Error handling + retry logic
- Compute unit simulation

**Estimated effort**: 3-5 days

---

#### 5. Lesson Validation Service — **30% complete**
Currently: Code execution works, but no validation against course spec

**Missing**:
```typescript
// lib/services/lesson-validator.service.ts (partial)
async validateLessonCompletion(
  lesson: Lesson,
  userCode: string,
  courseId: string
): Promise<{ valid: boolean; xpEarned: number; errors?: string[] }>

// Should:
// 1. Get lesson from Sanity (code execution rules)
// 2. Run code through CodeExecutionService
// 3. Compare against test cases
// 4. Determine XP reward (1-1000 per course spec)
// 5. Return validation + XP amount
```

**Estimated effort**: 2-3 days

---

### 🟡 **Tier 3: On-Chain Account Queries** (For leaderboard & UI)

#### 6. Helius DAS API Integration — **0% complete**
For leaderboard (retrieve XP token balances for top users)

```typescript
// lib/services/helius.service.ts (doesn't exist)
class HeliusService {
  async getTokenBalances(mint: PublicKey): Promise<TokenBalance[]> {
    // Query Helius DAS API
    // Returns: [{ owner: pubkey, balance: number }, ...]
    // Used for leaderboard ranking
  }
}
```

**Estimated effort**: 1-2 days

---

#### 7. Photon ZK Compression Queries — **0% complete**
For credential verification

```typescript
// lib/services/photon.service.ts (doesn't exist)
class PhotonService {
  async getCompressedAccount(address: PublicKey) {
    // Query Photon indexer
    // Returns: account data OR not_found
  }
  
  async getValidityProof(address: PublicKey): Promise<ValidityProof> {
    // Get ZK proof for account state
    // Used in issue_credential instruction
  }
}
```

**Estimated effort**: 2-3 days

---

### 🟡 **Tier 4: Frontend Features** (Enhance existing pages)

#### 8. Landing Page — **0% complete**
No homepage. Users land on `/courses` or redirected to dashboard.

**Missing**:
- `app/page.tsx` — Main landing
- Hero section with call-to-action
- Feature showcase
- Social proof (student count, certificates, courses)
- Course grid preview

**Estimated effort**: 1-2 days

---

#### 9. Account Linking (OAuth + Wallet) — **0% complete**
Currently: Only NextAuth OAuth OR custom email/salt

**Missing**:
```typescript
// app/settings/page.tsx needs:
<LinkedAccounts />  // Show: Google ✅ GitHub ❌ Wallet ❌

// Need endpoints:
POST /api/auth/link-wallet   // Add wallet to existing account
POST /api/auth/link-google   // Add Google to existing account  
POST /api/auth/unlink-account // Remove account

// Smart logic:
// - Can't unlink all accounts (keep 1 minimum)
// - Wallet + Google can coexist
// - First-time wallet signup creates account
```

**Estimated effort**: 2-3 days

---

#### 10. Wallet and On-Chain UI Components — **0% complete**
Missing pieces for on-chain integration in existing pages

```typescript
// components/leaderboard/LeaderboardXP.tsx (needs rewrite)
// Currently: Shows static XP from backend SQLite
// Should: Show live XP from Helius DAS API (XP token balances)

// components/certificates/CertificateDetail.tsx (needs ZK verification)
// Currently: Mocked credential display
// Should: Query Photon for compressed account state + verify proof

// components/dashboard/OnChainStatus.tsx (new)
// Should: Show:
//   - Connected wallet
//   - Current season XP token balance
//   - XP earned this season
//   - Active enrollments (on-chain)
```

**Estimated effort**: 2-3 days

---

### 🔴 **Tier 5: Deployment & Testing** (Not started)

#### 11. Anchor Program Testing — **0% complete**
- Unit tests (Mollusk)
- Integration tests (LiteSVM)
- Fuzz tests (Trident)

**Estimated effort**: 1 week

#### 12. Program Deployment — **0% complete**
- Devnet deployment script
- Mainnet deployment (via Squads multisig)
- IDL generation & upload

**Estimated effort**: 2-3 days

#### 13. E2E Testing — **0% complete**
- Playwright tests for full flows
- integration with Anchor program
- Wallet signing flows

**Estimated effort**: 1 week

---

## Implementation Dependency Graph

```
Phase 1: Foundation (Prerequisites)
┌─────────────────────────────────────┐
│ 1. Anchor Program (Rust)            │ ← Everything uses this
│    - Define all PDAs, instructions  │
│    - Token-2022 mint logic          │
│    - Bitmap + streak tracking       │
└──────────────┬──────────────────────┘
               │
Phase 2: Backend Integration (Needs IDL from Phase 1 after deployment)
┌──────────────▼──────────────────────┐
│ 2. TX Builder Service (Backend)      │ ← Signs TXs for users
│    - Blockhash fetching             │
│    - Instruction building           │
│    - Error recovery                 │
└──────────────┬──────────────────────┘
               │
Phase 3: Frontend Integration (Needs TX Builder ready)
┌──────────────▼──────────────────────┐
│ 3a. Wallet Adapter Integration       │
│     - useWallet hook                │
│     - WalletConnect component       │
│                                     │
│ 3b. On-Chain Hooks                  │
│     - useProgram (Anchor client)   │
│     - useLessonValidator            │
│     - useXPBalance (Helius)        │
└──────────────┬──────────────────────┘
               │
Phase 4: Advanced Features (Everything working)
┌──────────────▼──────────────────────┐
│ 4a. Leaderboard (Helius DAS)        │
│ 4b. Credentials (Photon queries)    │
│ 4c. Account Linking                 │
│ 4d. Landing Page                    │
└─────────────────────────────────────┘
```

---

## File Structure to Add

```
programs/                              ← NEW
├── academy/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── instructions.rs
│   │   └── state.rs
│   ├── Cargo.toml
│   └── tests/
├── Cargo.toml
└── Anchor.toml

backend/src/services/
├── transaction.service.ts             ← NEW (TX builder)
└── (existing: user, gamification)

lib/
├── anchor/                            ← NEW
│   ├── academy.json                   (IDL, auto-gen)
│   ├── types.ts
│   └── utils.ts
├── services/
│   ├── helius.service.ts              ← NEW
│   ├── photon.service.ts              ← NEW
│   └── (existing: course, learning-progress, etc.)
├── hooks/
│   ├── useWallet.ts                   ← NEW
│   ├── useProgram.ts                  ← NEW
│   ├── useXPBalance.ts                ← NEW
│   └── (existing: useAuth, useProgress, etc.)
└── wallet.ts                          ← NEW

components/
├── auth/
│   └── WalletConnect.tsx              ← NEW
├── leaderboard/
│   └── LeaderboardXP.tsx              (NEEDS REWRITE)
└── certificates/
    └── CertificateDetail.tsx          (NEEDS REWRITE)

app/
├── page.tsx                           ← NEW (Landing Page)
└── (existing pages)
```

---

## Realistic Implementation Timeline

| Phase | Work | Duration | Prerequisites |
|-------|------|----------|---|
| **Phase 1** | Anchor Program + Devnet Deploy | 2-3 weeks | Rust knowledge, Anchor experience |
| **Phase 2** | Backend TX Builder + Error Handling | 3-5 days | Phase 1 complete + IDL |
| **Phase 3a** | Wallet Adapter + useWallet() | 1-2 days | Phase 1 complete |
| **Phase 3b** | useProgram() + Lesson Validator | 2-3 days | Phase 2 + 3a complete |
| **Phase 4a** | Helius DAS Integration | 1-2 days | Phase 3a + 3b complete |
| **Phase 4b** | Photon ZK Queries | 2-3 days | Phase 3a + 3b complete |
| **Phase 4c** | Account Linking UI + Backend | 2-3 days | Phase 3a complete |
| **Phase 4d** | Landing Page | 1-2 days | Anytime (no deps) |
| **Phase 5** | Testing + Mainnet Deploy | 2-3 weeks | Phase 4 complete |
| **TOTAL** | Full Stack | **6-8 weeks** | — |

---

## Quick Wins (Do First)

If you have limited time, prioritize in this order:

1. ✅ **Landing Page** (1-2 days) — No dependencies, instant team morale
2. ✅ **Wallet Adapter UI** (1 day) — Shows you're serious about on-chain (doesn't need backend yet)
3. 🚀 **Anchor Program Skeleton** (3-5 days) — Start with basic PDAs + enroll instruction
4. 🚀 **Local Devnet Testing** (2-3 days) — Test enroll → complete_lesson → finalize_course flow
5. ⏳ **TX Builder (Backend)** (3-5 days) — Sign TXs so frontend can submit
6. ⏳ **Frontend Integration** (2-3 days) — Wire up useProgram() hook
7. 📈 **Helius DAS** (1-2 days) — Live leaderboard
8. 🎁 **ZK Credentials** (3-5 days) — Issue credentials on-chain

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Anchor program bugs | HIGH | Write tests early, use Mollusk |
| ZK Compression complexity | HIGH | Use official Light SDK examples |
| Blockhash expiry | MEDIUM | Queue + retry mechanism in backend |
| Token-2022 CPI overhead | MEDIUM | Simulate compute units before deploy |
| Mainnet cost | MEDIUM | Test extensively on Devnet first |
| Solana RPC downtime | LOW | Use Helius redundancy + fallback |

---

## Architecture Alignment Checklist

### Frontend
- [ ] Landing page (`app/page.tsx`)
- [ ] Wallet Connect button in Header
- [ ] useWallet() hook returns { wallet, publicKey, connect(), sendTransaction() }
- [ ] useProgram() hook wraps Anchor client
- [ ] useLessonValidator() validates code + returns XP
- [ ] useXPBalance() queries Helius DAS
- [ ] Account linking UI in `/settings`
- [ ] Leaderboard rewritten to use live XP
- [ ] Certificates display compressed credential state

### Backend
- [ ] TX builder service (enroll, complete_lesson, finalize_course)
- [ ] Blockhash manager with expiry
- [ ] Lesson validation against Sanity schema
- [ ] Error recovery + event logging
- [ ] Rate limiting (per user, per IP)
- [ ] Webhook for on-chain events (future)

### On-Chain
- [ ] Anchor program compiled + deployed to Devnet
- [ ] All 16 instructions implemented
- [ ] PDA derivation matches frontend
- [ ] XP Token-2022 mint created
- [ ] Tests pass (Mollusk + integration)
- [ ] IDL uploaded to Anchor registry

### Indexing
- [ ] Helius DAS API queries working
- [ ] Photon credentials queryable
- [ ] Leaderboard updates in real-time

---

## Next Steps

1. **Review this audit** with your team
2. **Decide scope**: Full stack (6-8 weeks) or MVP with fewer features?
3. **Start Phase 1** if doing on-chain: Anchor program design
4. **Start Quick Wins** in parallel: Landing page, wallet UI
5. **Follow implementation order** in `IMPLEMENTATION_ORDER.md`

---

**Questions?** Check:
- `docs/SPECIFICATION.md` — What features do users need?
- `docs/ARCHITECTURE.md` — How do components talk to each other?
- `ARCHITECTURE_REFERENCE.md` — What's the on-chain design?
- `CLAUDE.md` — Tech stack & project structure

---

*Last Updated: February 16, 2026*  
*Architecture Version: 1.0.0*
