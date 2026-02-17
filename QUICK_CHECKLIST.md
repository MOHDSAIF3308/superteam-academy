# ✅ Quick Implementation Checklist: Solana Academy DApp

Quick reference for building out all 6 phases. Print this out!

---

## PHASE 1: Anchor Program ⏳ START HERE

**Target**: Deploy to Devnet, get Program ID  
**Timeline**: 1-2 hours  
**Blocker**: None (start now!)  
**Guide**: ANCHOR_SETUP_GUIDE.md  

### Right Now (30 minutes)
- [ ] Terminal 1: `cd /Users/saif/Desktop/solana-academy-platform`
- [ ] `anchor build`
- [ ] Verify: `ls target/idl/academy.json` exists
- [ ] Copy: `cp target/idl/academy.json lib/anchor/academy.json`
- [ ] No VS Code TypeScript errors

### This Week (1-2 hours)
- [ ] Get Devnet SOL: `solana airdrop 5 --url devnet`
- [ ] Deploy: `anchor deploy --provider.cluster devnet`
- [ ] **SAVE Program ID** (you'll need this)
- [ ] Create XP Token: Follow ANCHOR_SETUP_GUIDE.md section 5
- [ ] **SAVE Token Mint** (you'll need this)

### Environment Setup
- [ ] Create `backend/.env`:
  ```
  SOLANA_RPC_URL=https://api.devnet.solana.com
  ANCHOR_PROGRAM_ID=<Program ID>
  XP_TOKEN_MINT=<Token Mint>
  BACKEND_SIGNER_SECRET_KEY=[<json array from ~/.config/solana/id.json>]
  ```
- [ ] Verify file not in git

✅ **Phase 1 COMPLETE** when backend starts without "waiting for IDL" error

---

## PHASE 3a: Wallet UI ⏳ CAN DO IN PARALLEL

**Target**: "Connect Wallet" button works  
**Timeline**: 1-2 days  
**Blocker**: None (independent!)  
**Guide**: PHASE_3A_WALLET_HOOKS.md  

### Implementation
- [ ] Create `lib/hooks/useWallet.ts` (copy from guide)
- [ ] Create `components/auth/WalletButton.tsx` (copy from guide)
- [ ] Update `lib/hooks/index.ts` - add useWallet export
- [ ] Update `components/layout/Header.tsx` - add WalletButton
- [ ] Verify `app/layout.tsx` has WalletProvider

### Testing
- [ ] App loads
- [ ] "Connect Wallet" button visible in header
- [ ] Click → Phantom popup → sign → shows pubkey ✅
- [ ] Disconnect works ✅
- [ ] No console errors

---

## PHASE 2: Backend TX Signing ⏳ AFTER Phase 1

**Target**: Backend builds & signs transactions  
**Timeline**: 3-5 days  
**Blocker**: Phase 1 IDL + .env setup  
**Guide**: PHASE_2_IMPLEMENTATION_GUIDE.md  

### When Phase 1 Done
- [ ] `lib/anchor/academy.json` exists
- [ ] `backend/.env` configured
- [ ] Backend starts: `npm start` (no IDL errors)

### Uncomment Imports
- [ ] In `backend/src/services/transaction.service.ts`:
  - [ ] Uncomment: `import IDL from '../../lib/anchor/academy.json'`
  - [ ] Uncomment: `import { Program, AnchorProvider, ... }`

### Implement Builders (Follow guide tables for detailed code)
- [ ] Implement `buildCompleteLessonInstruction()`
- [ ] Implement `buildEnrollInstruction()`
- [ ] Implement `buildFinalizeCourseInstruction()`
- [ ] Update `completeLessonTX()` to use builders
- [ ] Update `enrollTX()` to use builders
- [ ] Update `finalizeCourseT()` to use builders

### API Testing
- [ ] Terminal: `npm start` (backend running)
- [ ] `curl http://localhost:3001/api/health` → 200 ✅
- [ ] `curl -X POST http://localhost:3001/api/transaction/enroll` → TX ✅
- [ ] `curl -X POST http://localhost:3001/api/transaction/complete-lesson` → TX ✅
- [ ] `curl -X POST http://localhost:3001/api/transaction/finalize-course` → TX ✅

---

## PHASE 3b: Frontend Wiring ⏳ AFTER Phase 2

**Target**: Click button → sign & submit TX → XP updates  
**Timeline**: 2-3 days  
**Blocker**: Phase 2 complete  

### Implementation
- [ ] Create `lib/hooks/useProgram.ts`
- [ ] Update `app/courses/[slug]/lessons/[id]/page.tsx`:
  - [ ] Add "Complete Lesson" button
  - [ ] Button disabled if no wallet
  - [ ] On click: POST `/api/transaction/complete-lesson` → sign → send
  - [ ] Show loading, then success

### E2E Testing
- [ ] Connect wallet ✅
- [ ] Click "Complete Lesson" ✅
- [ ] Sign in Phantom ✅
- [ ] TX submitted (check Solana Explorer) ✅
- [ ] XP updates on chain ✅
- [ ] Button shows success ✅

---

## PHASE 4a: Helius Leaderboard ⏳ AFTER Phase 3b

**Target**: Live leaderboard with real XP  
**Timeline**: 1-2 days  
**Blocker**: Phase 3b + Helius API key  

### Setup
- [ ] Sign up: https://www.helius.dev/ (free OK)
- [ ] Get API key
- [ ] Add to `.env.local`: `NEXT_PUBLIC_HELIUS_API_KEY=<key>`

### Implementation
- [ ] Create `lib/services/helius.service.ts`
- [ ] Update `app/leaderboard/page.tsx` to fetch from Helius
- [ ] Show live token balances

### Testing
- [ ] Leaderboard loads ✅
- [ ] Shows real XP balances ✅
- [ ] Updates within 10 seconds ✅

---

## PHASE 4b: Photon ZK ⏳ AFTER Phase 3b

**Target**: Compressed credentials  
**Timeline**: 2-3 days  
**Blocker**: Phase 3b + Photon access  

### Setup
- [ ] Get Photon access (Helius Pro)
- [ ] Get Light RPC endpoint

### Implementation
- [ ] Update Anchor program `issue_credential.rs` for compression
- [ ] Create `lib/services/photon.service.ts`
- [ ] Update certificate page

### Testing
- [ ] Credentials compress ✅
- [ ] Photon retrieves data ✅
- [ ] Certificates display ✅

---

## TIMING GUIDE

```
Week 1:
├─ Phase 1: Anchor build + deploy (TODAY) ⏳
├─ Phase 3a: Wallet UI (parallel)
└─ Week end: Phase 2 implementation

Week 2:
├─ Phase 2 continued
├─ Phase 3b: Frontend wiring
└─ Phase 4a-4b: Helius + Photon

Result: Full dApp on Devnet ✨
```

---

## QUICK START

**DO THIS NOW**:

```bash
cd /Users/saif/Desktop/solana-academy-platform
anchor build
cp target/idl/academy.json lib/anchor/academy.json
```

That's it for Phase 1 code. You'll deploy this week.

---

## HELP

Stuck? Check these:
1. **Which phase?** → Find guide file
2. **Error?** → Check guide troubleshooting table
3. **Code?** → Guide has copy-paste templates
4. **Deployment?** → ANCHOR_SETUP_GUIDE.md has step-by-step

## DOCUMENTS

| Phase | Document |
|-------|----------|
| 1 | ANCHOR_SETUP_GUIDE.md |
| 2 | PHASE_2_IMPLEMENTATION_GUIDE.md |
| 3a | PHASE_3A_WALLET_HOOKS.md |
| Full status | ONCHAIN_INTEGRATION_STATUS.md |

---

Happy building! 🚀

