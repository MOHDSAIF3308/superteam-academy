# Implementation Checklist — Track Your Progress

**Use this to monitor your journey from MVP (42%) to Full Stack (100%)**

---

## 🟢 COMPLETED (Keep These Working)

- [x] Next.js app with TypeScript strict mode
- [x] Tailwind CSS + dark mode theme system
- [x] i18n setup (PT-BR, ES, EN)
- [x] 8 main pages (courses, dashboard, profile, leaderboard, etc.)
- [x] Code execution engine (JavaScript/TypeScript)
- [x] NextAuth.js with Google/GitHub OAuth
- [x] Sanity CMS integration
- [x] SQLite backend with user/XP/achievements services
- [x] Component library (Button, Card, Input, etc.)
- [x] Wallet adapter packages installed (@solana/web3.js, wallet-adapter, etc.)

---

## 🟡 IN PROGRESS (Critical Path)

### Phase 1: Anchor Program (2-3 weeks)

This BLOCKS everything else. Start here.

- [ ] **A. Program Setup**
  - [ ] Rust toolchain installed (`rustup +nightly`)
  - [ ] Anchor CLI installed (`cargo install anchor-cli`)
  - [ ] Created `programs/academy/` directory structure
  - [ ] `Anchor.toml` configured with program ID
  - [ ] `Cargo.toml` with correct dependencies

- [ ] **B. State Definitions** (`programs/academy/src/state.rs`)
  - [ ] `Config` PDA struct (authority, current_mint, backend_signer, etc.)
  - [ ] `Course` PDA struct (modules, lessons, xp_reward, etc.)
  - [ ] `LearnerProfile` PDA struct (streak, achievements, xp_earned_today, etc.)
  - [ ] `Enrollment` PDA struct (lesson_flags bitmap, completed_at, etc.)
  - [ ] `Credential` struct (ZK compressed account layout)
  - [ ] Error enum (`AcademyError` with all error codes)

- [ ] **C. Instructions** (`programs/academy/src/instructions.rs`)
  - [ ] `initialize` — Create program config
  - [ ] `create_season` — Create new XP token mint
  - [ ] `close_season` — Archive old mint
  - [ ] `create_course` — Add course to platform
  - [ ] `update_course` — Modify course (authority only)
  - [ ] `init_learner` — Create learner profile
  - [ ] `enroll` — User enrolls in course
  - [ ] `unenroll` — Remove enrollment
  - [ ] `complete_lesson` ⭐ — Mark lesson done, mint XP
  - [ ] `finalize_course` ⭐ — All lessons done, issue XP to creator
  - [ ] `issue_credential` — Create/upgrade compressed credential (Photon)
  - [ ] `claim_achievement` — Unlock achievement, mint bonus XP
  - [ ] `award_streak_freeze` — Prevent streak loss
  - [ ] `register_referral` — Track referral rewards
  - [ ] `close_enrollment` — Reclaim rent after course complete
  - [ ] `update_config` — Rotate backend signer (authority only)

- [ ] **D. Testing**
  - [ ] Unit tests (Mollusk) for each instruction
  - [ ] Integration tests (LiteSVM) for multi-step flows
  - [ ] `complete_lesson` → `finalize_course` flow works
  - [ ] XP minting works (CPI to Token-2022)
  - [ ] Bitmap tracking works (lesson flags)
  - [ ] All tests pass: `anchor test`

- [ ] **E. Deployment**
  - [ ] Deploy to Devnet: `anchor deploy --provider.cluster devnet`
  - [ ] Get program ID from output
  - [ ] Generate IDL: `anchor idl fetch ...` or check `target/idl/academy.json`
  - [ ] Save IDL to `lib/anchor/academy.json`
  - [ ] Verify with: `solana program show <PROGRAM_ID> --url devnet`

### Phase 2: Backend TX Builder (3-5 days)

Won't work until Phase 1 is done.

- [ ] **A. Load IDL**
  - [ ] IDL file exists at `backend/src/idl/academy.json`
  - [ ] Anchor Program client can be created from IDL
  - [ ] Program ID loaded from env: `ANCHOR_PROGRAM_ID`

- [ ] **B. Implement Services** (`backend/src/services/transaction.service.ts`)
  - [ ] Load backend signer keypair from `BACKEND_SIGNER_SECRET_KEY`
  - [ ] Initialize Anchor Provider (connection + wallet + options)
  - [ ] Initialize Program instance (IDL + program ID + provider)

- [ ] **C. Build Instructions**
  - [ ] `buildEnrollInstruction()` ✅ Done → returns signed TX
  - [ ] `buildCompleteLessonInstruction()` ✅ Done → mints XP
  - [ ] `buildFinalizeCourseInstruction()` ✅ Done → marks course complete
  - [ ] `buildIssueCredentialInstruction()` ✅ Done → Photon Light CPI
  - [ ] Each instruction includes all required accounts in correct order

- [ ] **D. TX Signing**
  - [ ] `signTransaction()` signs with backend_signer keypair
  - [ ] Blockhash fetched with `getLatestBlockhash()`
  - [ ] TX version set correctly (v0 for address lookup tables)
  - [ ] Returns base64-encoded signed TX to frontend

- [ ] **E. API Routes**
  - [ ] `POST /api/transaction/enroll` → calls `completeLessonTX()`
  - [ ] `POST /api/transaction/complete-lesson` → calls `completeLessonTX()`
  - [ ] `POST /api/transaction/finalize-course` → calls `finalizeCourseInstruction()`
  - [ ] Each route authenticates with JWT
  - [ ] Error handling + logging for failed TXs

- [ ] **F. Testing**
  - [ ] Backend compiles: `npm run build`
  - [ ] Can be called with curl:
    ```bash
    curl -X POST http://localhost:3001/api/transaction/complete-lesson \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"courseId":"math-101","lessonIndex":0,"xpAmount":100}'
    ```
  - [ ] Returns signed TX blob
  - [ ] TX can be submitted to Devnet

### Phase 3a: Frontend Wallet Integration (1-2 days)

Doesn't need TX builder to test, just needs wallet packages.

- [ ] **A. Wallet Adapter Setup**
  - [ ] `components/providers/WalletProvider.tsx` ✅ Already configured
  - [ ] `lib/wallet-config.ts` ✅ Already configured
  - [ ] `components/auth/WalletConnect.tsx` ✅ Already created

- [ ] **B. Implement useWallet Hook** (`lib/hooks/useWallet.ts`)
  - [ ] Wraps `@solana/wallet-adapter-react` `useWallet()`
  - [ ] Returns: `wallet`, `publicKey`, `connected`, `sendTransaction()`
  - [ ] Handle null states gracefully

- [ ] **C. Add to Header**
  - [ ] Import `WalletConnect` component
  - [ ] Add to header: `<WalletConnect />`
  - [ ] Test: Click button → wallet modal opens
  - [ ] Select Phantom/Solflare → connected address shown

- [ ] **D. Testing**
  - [ ] `npm run dev` — frontend compiles
  - [ ] Header has "Connect Wallet" button
  - [ ] Click button → no errors
  - [ ] Select wallet → shows address

### Phase 3b: Frontend On-Chain Integration (2-3 days)

Needs TX builder from Phase 2.

- [ ] **A. Implement useProgram Hook** (`lib/hooks/useProgram.ts`)
  - [ ] Load IDL from `lib/anchor/academy.json`
  - [ ] Create AnchorProvider from wallet + connection
  - [ ] Initialize Program instance
  - [ ] Provide instruction builders: `enroll()`, `completeLessonCPI()`, etc.
  - [ ] Derive PDAs correctly (match backend)

- [ ] **B. Implement useXPBalance Hook** (`lib/hooks/useXPBalance.ts`)
  - [ ] Fetch balance from Helius DAS API or RPC
  - [ ] Format with correct decimals (9)
  - [ ] Handle loading/error states

- [ ] **C. Wire Up Lesson Page** (`app/courses/[slug]/lessons/[id]/page.tsx`)
  - [ ] Add "Complete Lesson" button
  - [ ] On click:
    1. Show loading spinner
    2. Call backend: `POST /api/transaction/complete-lesson`
    3. Get signed TX from response
    4. Send to wallet for signing: `wallet.signTransaction()`
    5. Submit TX to Solana: `connection.sendTransaction()`
    6. Wait for confirmation
    7. Show success message
    8. Refresh page to show new XP

- [ ] **D. Update Dashboard** (`app/dashboard/page.tsx`)
  - [ ] Show current XP balance from Helius
  - [ ] Show level calculated from XP
  - [ ] Show current season only (filter old seasons)

- [ ] **E. Testing**
  - [ ] Frontend compiles: `npm run type-check`
  - [ ] No TypeScript errors
  - [ ] Connected wallet shows in header
  - [ ] Lesson page shows "Complete Lesson" button
  - [ ] Click → TX submitted → Devnet shows confirmed
  - [ ] XP appears in user's ATA

### Phase 4a: Helius Integration (1-2 days)

- [ ] **A. Helius Setup**
  - [ ] Sign up: https://www.helius.dev/
  - [ ] Get API key
  - [ ] Set `NEXT_PUBLIC_HELIUS_API_KEY` in `.env.local`

- [ ] **B. Implement HeliusService** (`lib/services/helius.service.ts`)
  - [ ] `getTokenHolders(mint)` → query DAS API
  - [ ] `getLeaderboard(mint)` → format + rank
  - [ ] `getTokenBalance(ata)` → single user XP

- [ ] **C. Update Leaderboard Page** (`app/leaderboard/page.tsx`)
  - [ ] Remove mock data
  - [ ] Use `useQuery()` to fetch from `heliusService.getLeaderboard()`
  - [ ] Poll every 10s for live updates
  - [ ] Show rank, address, XP, username (if available)

- [ ] **D. Testing**
  - [ ] Leaderboard page loads
  - [ ] Shows real XP data from Helius
  - [ ] Updates every 10s
  - [ ] Handles API errors gracefully

### Phase 4b: Photon ZK Queries (2-3 days)

- [ ] **A. Photon Setup**
  - [ ] Get access via Helius: https://docs.helius.xyz/guides/photon-compression
  - [ ] Set `NEXT_PUBLIC_PHOTON_API_URL` in `.env.local`

- [ ] **B. Implement PhotonService** (`lib/services/photon.service.ts`)
  - [ ] `getCompressedAccount(address)` → account state
  - [ ] `getValidityProof(address)` → ZK proof
  - [ ] `getCredentials(learner)` → list user's credentials

- [ ] **C. Update Certificate Page** (`app/certificates/[id]/page.tsx`)
  - [ ] Query Photon for compressed credential
  - [ ] Display credential level + metadata
  - [ ] Show verification status

- [ ] **D. Testing**
  - [ ] Certificate page loads
  - [ ] Shows real credential data from Photon
  - [ ] Verification works

---

## 🔴 NOT STARTED (Nice to Have)

- [ ] **Landing Page** (`app/page.tsx`)
  - [ ] Hero section
  - [ ] Feature showcase
  - [ ] CTA buttons
  - [ ] Estimate: 1-2 days

- [ ] **Account Linking** (OAuth + Wallet)
  - [ ] Settings page additions
  - [ ] Link wallet to existing OAuth account
  - [ ] Estimate: 2-3 days

- [ ] **Mainnet Deployment**
  - [ ] Deploy program to mainnet (via Squads multisig)
  - [ ] Create mainnet Season 1 token
  - [ ] Update frontend env for mainnet
  - [ ] Estimate: 1 week (security audits, etc.)

---

## 📊 Progress Tracker

Copy this and update regularly:

```
Week 1: [████░░░░░░] 40% | Anchor program design + basic instructions
Week 2: [████████░░] 80% | Finish instructions + testing
Week 3: [██████████] 100% | Deploy to Devnet + generate IDL
Week 4: [████░░░░░░] 40% | TX builder + API routes
Week 5: [███████░░░] 70% | Wallet integration + hooks
Week 5: [██████████] 100% | End-to-end flow working
Week 6: [██████████] 100% | Helius + Photon + cleanup
Week 7: [██████████] 100% | Testing + mainnet ready
```

---

## 🎯 Success Criteria (MVP)

You're done when:

- [x] Frontend pages load without wallet (graceful fallback)
- [x] Wallet connects successfully
- [x] User can enroll in course (TX to Devnet)
- [x] User can complete lesson (backend signs TX, XP mints)
- [x] XP appears on Devnet scanner
- [x] Leaderboard shows live data from Helius
- [x] No TypeScript errors: `npm run type-check`
- [x] No ESLint errors: `npm run lint`
- [x] All pages render without errors
- [x] Works on Devnet (publicly testable)

---

## 💡 Pro Tips

1. **Test each phase before moving to next**: Don't start Phase 2 until Phase 1 is fully deployed
2. **Use Devnet liberally**: Free SOL from airdrop, fast finality, easy testing
3. **Log everything**: TX signatures, account states, errors — helps debugging
4. **Start with one lesson**: Get one complete flow working, then generalize
5. **Check Devnet scanner**: https://explorer.solana.com/?cluster=devnet — see your TXs
6. **Use Solana CLI for debugging**: `solana program show`, `solana account`, `solana tx show`

---

## 📞 Getting Unstuck

| Problem | Solution |
|---------|----------|
| Anchor won't compile | Check Rust nightly: `rustup install nightly` |
| Program not deploying | Check RPC endpoint in Anchor.toml. Use Devnet airdrop. |
| IDL not generating | Run `anchor build` with no errors first, then `anchor idl fetch` |
| Backend TX fails | Check all accounts in correct order. Simulate with `simulate=true` |
| Frontend won't compile | Run `npm install`, check TypeScript with `npm run type-check` |
| Wallet won't connect | Check network is set to Devnet in wallet + frontend |
| TX shows "Account not found" | PDA derivation mismatch. Compare seeds with program. |
| XP not minting | Check Token-2022 CPI in program. Verify ATA exists. |

---

**Last Updated**: February 16, 2026  
**Next Review**: After Phase 1 (Anchor) is complete

Good luck! 🚀

