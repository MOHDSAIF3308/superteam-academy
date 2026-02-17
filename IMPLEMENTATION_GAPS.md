# Implementation Gaps — Quick Reference

**TL;DR**: You have a working frontend (42%) + backend (100%). Missing: Anchor program, wallet integration, on-chain TX signing.

---

## What You HAVE ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Pages | ✅ 8/9 | All except landing page |
| Code Execution | ✅ Works | JavaScript/TypeScript only |
| Backend API | ✅ Works | User, XP, achievements, leaderboard |
| CMS (Sanity) | ✅ Configured | Schemas ready, content not imported |
| Authentication | ✅ Partial | Google/GitHub OAuth only |
| Wallet Packages | ✅ Installed | @solana/web3.js, wallet-adapter (not used) |

---

## What You DON'T HAVE ❌

### Critical Missing Pieces (Block all on-chain features)

| # | Component | Why It Matters | Effort |
|---|-----------|---|---------|
| **1** | **Anchor Program (Rust)** | Defines all on-chain state (courses, enrollments, XP tokens) | 2-3 weeks |
| **2** | **TX Builder (Backend)** | Signs transactions for users after they complete lessons | 3-5 days |
| **3** | **Wallet Integration (Frontend)** | Connects user's Solana wallet to app | 1-2 days |

### Important Missing Pieces (Nice to have, don't block MVP)

| # | Component | Why It Matters | Effort |
|---|-----------|---|---------|
| **4** | **Helius Integration** | Live XP leaderboard from on-chain data | 1-2 days |
| **5** | **Photon Integration** | ZK credential verification | 2-3 days |
| **6** | **Landing Page** | Users have nowhere to land | 1-2 days |
| **7** | **Account Linking** | OAuth + wallet in same account | 2-3 days |

---

## Minimum Viable On-Chain System

To get **one lesson → XP → leaderboard** working end-to-end:

```
Phase 1 (2 weeks): Anchor Program
  ├─ create_course instruction
  ├─ enroll instruction
  ├─ complete_lesson instruction
  └─ XP Token-2022 mint + ATA logic

Phase 2 (3-5 days): Backend TX Signer
  ├─ Load backend_signer keypair
  ├─ Build + sign TX for each instruction
  └─ Return signed TX to frontend

Phase 3 (1-2 days): Frontend Wallet
  ├─ Add WalletMultiButton to Header
  ├─ Create useWallet() hook
  └─ Wire up to existing lesson page

Phase 4 (1-2 days): Submit TX + Watch
  ├─ User clicks "Complete Lesson"
  ├─ Frontend gets signed TX from backend
  ├─ Wallet signs + submits
  └─ XP appears on-chain + leaderboard updates

Result: ✨ One complete learning loop on Solana
```

---

## File Creation Checklist

### Must Create (for on-chain support)

```bash
# Anchor Program
programs/academy/src/lib.rs                 ← Main file
programs/academy/src/instructions.rs        ← All 16 instructions
programs/academy/src/state.rs               ← All PDAs
programs/Cargo.toml
programs/Anchor.toml

# Backend TX Builder
backend/src/services/transaction.service.ts ← Sign TXs for users
backend/src/config.rs                       ← Load keypairs, RPC config

# Frontend Wallet
lib/hooks/useWallet.ts                      ← Wallet state hook
lib/wallet.ts                               ← Adapter config
components/auth/WalletConnect.tsx           ← Connect button
(Update: components/providers/WalletProvider.tsx)

# Frontend On-Chain Hooks
lib/hooks/useProgram.ts                     ← Anchor client
lib/hooks/useXPBalance.ts                   ← Helius queries
lib/services/helius.service.ts              ← DAS API wrapper

# Frontend Pages
app/page.tsx                                ← Landing page (quick win)
(Update: app/courses/[slug]/lessons/[id]/page.tsx with submit button)
```

### Should Create (for full feature set)

```bash
# Services
lib/services/photon.service.ts              ← ZK credential queries
backend/src/services/lesson-validator.service.ts

# Settings
lib/wallet-config.ts                        ← RPC endpoints, program IDs
backend/.env                                ← Update with SOLANA_RPC, PROGRAM_ID

# Types
lib/types/anchor.ts                         ← Anchor-generated types (IDL)
lib/anchor/academy.json                     ← IDL from program (auto-gen)
```

---

## Integration Checklist

### Before You Start Anchor Program

- [ ] Read: `docs/SPECIFICATION.md` (Account Map section)
- [ ] Read: `ARCHITECTURE_REFERENCE.md` (PDA Derivation, Instruction Matrix)
- [ ] Set up Rust toolchain: `rustup install stable && rustup install nightly`
- [ ] Install Anchor CLI: `cargo install --git https://github.com/coral-xyz/anchor`
- [ ] Test locally: `anchor test` on Devnet

### Before You Code Frontend Wallet

- [ ] Anchor program deployed to Devnet
- [ ] IDL generated + copied to `lib/anchor/academy.json`
- [ ] TX Builder working + tested with `curl`
- [ ] Wallet Adapter UI can connect (test with `npm run dev`)

### Before You Submit Full PR

- [ ] All TypeScript errors fixed: `npm run type-check`
- [ ] ESLint passes: `npm run lint`
- [ ] No `any` types
- [ ] Each page renders without Solana connection (graceful fallback)
- [ ] Test on Devnet with real wallet

---

## Quick Implementation Order

**If you have 6 weeks** (full stack):
1. Anchor Program (weeks 1-3)
2. Backend TX Builder (days 1-5)
3. Frontend Wallet (day 1-2)
4. Full Frontend Integration (days 1-3)
5. Testing + Devnet verification (week 1)

**If you have 2 weeks** (MVP):
1. Landing Page (day 1)
2. Anchor Program — Basic (week 1)
3. Backend TX Builder — Basic (days 1-3)
4. Frontend Wallet — Minimal (day 1)
5. Wire up 1 lesson flow end-to-end (days 1-2)
6. Devnet launch (1 day)

**If you have 3 days** (bare minimum):
1. Landing Page (to show progress)
2. Wallet Connect UI (to show Solana integration)
3. Static leaderboard that reads from backend SQLite
→ Deploy frontend, announce Solana integration coming

---

## Common Pitfalls to Avoid

| Mistake | Fix |
|---------|-----|
| Anchor program uses wrong PDAs that frontend can't derive | Match seeds exactly in both places |
| Backend signs TX without correct signers array | Include all required accounts in correct order |
| Frontend tries to submit unsigned TX | Always get signed TX from backend first |
| Blockhash expires before TX submits | Implement queue + retry (5 min timeout) |
| Program doesn't compile on latest Anchor | Pin Anchor version in Cargo.toml |
| Wallet not connected when user clicks button | Check `wallet?.connected` && `publicKey` before submit |
| XP mints to wrong token ATA | Derive ATA with (mint, owner, tokenProgram) |
| Leaderboard shows stale data | Refresh every 10s from Helius DAS |

---

## Testing at Each Phase

```bash
# Phase 1: Anchor Program
cd programs/academy
anchor build          # Compiles
anchor test           # Unit + integration tests

# Phase 2: TX Builder
curl -X POST http://localhost:3001/api/transaction/enroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"math-101"}'
# Should return: { signedTx: "...", blockhash: "..." }

# Phase 3: Frontend Wallet
npm run dev
# Open http://localhost:3000
# Header should have "Connect Wallet" button
# Click it → choose wallet → shows connected address

# Phase 4: End-to-End
# 1. Connect wallet
# 2. Click "Complete Lesson"
# 3. See TX signature in console
# 4. XP appears on Devnet scanner
# 5. Refresh leaderboard → shows new XP
```

---

## Where to Get Help

| Question | File |
|----------|------|
| What should the on-chain system look like? | `ARCHITECTURE_REFERENCE.md` |
| What are users supposed to do? | `docs/SPECIFICATION.md` |
| How do components talk to each other? | `docs/ARCHITECTURE.md` |
| What's the tech stack? | `CLAUDE.md` |
| What code patterns should I follow? | `.claude/rules/typescript.md` + `.claude/rules/react.md` |
| How do I integrate Anchor? | ← YOU ARE HERE (this file) |

---

## Success Criteria

Once you finish, your system should:

- ✅ Landing page (`/`) loads
- ✅ User connects Solana wallet
- ✅ User enrolls in course (TX to Devnet)
- ✅ User completes lesson (TX signed by backend, user submits)
- ✅ XP appears on-chain in user's XP token ATA
- ✅ Leaderboard shows live XP from Helius DAS
- ✅ No TypeScript errors (`npm run type-check`)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Works on Devnet (publicly testable)

---

**Ready to start?** Begin with Phase 1 (Anchor Program) or Quick Win #1 (Landing Page).  
**Questions?** Check the files listed in "Where to Get Help" above.

