# Phase 2 Implementation Guide: Backend TX Signing Service

## Overview

Phase 2 enables the backend to build, sign, and return Solana transactions that the frontend wallet can submit directly. This is a critical security pattern that:

1. **Prevents tampering**: TX is constructed server-side (trusted)
2. **Enforces rules**: Backend verifies XP caps, daily limits, course prerequisites
3. **Scales**: Wallet doesn't compute complex PDAs or instructions
4. **Safety**: Wallet only signs backend-verified TXs

## Current Status

✅ **Complete**: Backend structure and routing  
✅ **Complete**: TransactionService skeleton with connection setup  
✅ **Complete**: API endpoints (`/api/transaction/*`)  
⏳ **Pending**: Uncomment Anchor imports (requires Phase 1 IDL)  
⏳ **Pending**: Implement instruction builders

## Prerequisites

Phase 2 can ONLY proceed after Phase 1 is complete:

### Phase 1 Checklist

- [ ] Run `anchor build` → generates `target/idl/academy.json`
- [ ] Copy IDL: `cp target/idl/academy.json lib/anchor/academy.json`
- [ ] Run `anchor deploy --provider.cluster devnet` → get program ID
- [ ] Update `Anchor.toml` with deployed program ID in `[programs.devnet]`
- [ ] Create XP Token-2022 mint → get token mint address
- [ ] Set `.env` variables:
  ```
  ANCHOR_PROGRAM_ID=<deployed program ID>
  BACKEND_SIGNER_SECRET_KEY=[<byte>, <byte>, ...]  # keypair as JSON array
  XP_TOKEN_MINT=<token mint address>
  ```

### Environment Variables

Ensure these are set in `/backend/.env`:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
ANCHOR_PROGRAM_ID=<from Phase 1 deploy>
BACKEND_SIGNER_SECRET_KEY=[<secret key as JSON array>]
XP_TOKEN_MINT=<token mint address>

# Web3 Configuration
SOLANA_COMMITMENT=finalized

# Server Config
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_URL=file:./academy.db
FRONTEND_URL=http://localhost:3000
```

## Step-by-Step Implementation

### Step 1: Verify Phase 1 IDL Exists

```bash
ls -la lib/anchor/academy.json
```

Expected output: File exists, ~5KB, contains IDL JSON with program instructions.

### Step 2: Uncomment Anchor Imports

In `/backend/src/services/transaction.service.ts`, uncomment:

```typescript
// UNCOMMENT AFTER PHASE 1 IDL IS GENERATED
import IDL from '../../lib/anchor/academy.json'
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor'
```

Current state: These lines are commented with `// TODO: Uncomment after anchor build`

### Step 3: Implement `buildCompleteLessonInstruction()`

This is the most complex instruction with multiple validation steps:

```typescript
private buildCompleteLessonInstruction(
  program: Program<Idl>,
  userId: string,
  courseId: string,
  lessonIndex: number,
  xpAmount: number
): TransactionInstruction {
  // 1. Derive all PDAs
  const config = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  )[0]
  
  const course = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    program.programId
  )[0]
  
  const learner = PublicKey.findProgramAddressSync(
    [Buffer.from('learner'), new PublicKey(userId).toBuffer()],
    program.programId
  )[0]
  
  const enrollment = PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), new PublicKey(userId).toBuffer()],
    program.programId
  )[0]
  
  const xpTokenMint = new PublicKey(process.env.XP_TOKEN_MINT!)
  const learnerAta = getAssociatedTokenAddressSync(xpTokenMint, new PublicKey(userId))
  
  // 2. Build instruction accounts array
  const accounts = [
    { pubkey: config, isSigner: false, isWritable: true },
    { pubkey: course, isSigner: false, isWritable: true },
    { pubkey: learner, isSigner: false, isWritable: true },
    { pubkey: enrollment, isSigner: false, isWritable: true },
    { pubkey: xpTokenMint, isSigner: false, isWritable: true },
    { pubkey: learnerAta, isSigner: false, isWritable: true },
    { pubkey: new PublicKey(userId), isSigner: true, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]
  
  // 3. Build instruction data
  const data = program.coder.instruction.encode('completeLesson', {
    lessonIndex,
    xpAmount,
  })
  
  // 4. Return instruction
  return new TransactionInstruction({
    programId: program.programId,
    keys: accounts,
    data,
  })
}
```

### Step 4: Implement `buildEnrollInstruction()`

Simpler than complete_lesson:

```typescript
private buildEnrollInstruction(
  program: Program<Idl>,
  userId: string,
  courseId: string
): TransactionInstruction {
  // 1. Derive PDAs
  const course = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    program.programId
  )[0]
  
  const learner = PublicKey.findProgramAddressSync(
    [Buffer.from('learner'), new PublicKey(userId).toBuffer()],
    program.programId
  )[0]
  
  const enrollment = PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), new PublicKey(userId).toBuffer()],
    program.programId
  )[0]
  
  // 2. Build accounts
  const accounts = [
    { pubkey: course, isSigner: false, isWritable: false },
    { pubkey: learner, isSigner: false, isWritable: false },
    { pubkey: enrollment, isSigner: false, isWritable: true },
    { pubkey: new PublicKey(userId), isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]
  
  // 3. Build instruction
  const data = program.coder.instruction.encode('enroll', {
    courseId,
  })
  
  // 4. Return
  return new TransactionInstruction({
    programId: program.programId,
    keys: accounts,
    data,
  })
}
```

### Step 5: Implement `buildFinalizeCourseInstruction()`

Finalizes course, triggers creator reward:

```typescript
private buildFinalizeCourseInstruction(
  program: Program<Idl>,
  userId: string,
  courseId: string
): TransactionInstruction {
  // 1. Derive PDAs
  const config = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  )[0]
  
  const course = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    program.programId
  )[0]
  
  const learner = PublicKey.findProgramAddressSync(
    [Buffer.from('learner'), new PublicKey(userId).toBuffer()],
    program.programId
  )[0]
  
  const enrollment = PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), new PublicKey(userId).toBuffer()],
    program.programId
  )[0]
  
  // 2. Get course creator (requires on-chain read - see note below)
  // For now, assume it's passed or we fetch from RPC
  
  // 3. Build accounts
  const accounts = [
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: course, isSigner: false, isWritable: true },
    { pubkey: learner, isSigner: false, isWritable: true },
    { pubkey: enrollment, isSigner: false, isWritable: true },
    { pubkey: new PublicKey(userId), isSigner: true, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]
  
  // 4. Build instruction
  const data = program.coder.instruction.encode('finalizeCourse', {
    courseId,
  })
  
  // 5. Return
  return new TransactionInstruction({
    programId: program.programId,
    keys: accounts,
    data,
  })
}
```

### Step 6: Update `completeLessonTX()` Method

```typescript
public async completeLessonTX(req: TransactionRequest): Promise<SignedTransactionResponse> {
  if (!this.program) {
    throw new Error('Waiting for program IDL')
  }
  
  // 1. Build instruction
  const instruction = this.buildCompleteLessonInstruction(
    this.program,
    req.userId,
    req.courseId,
    req.lessonIndex,
    req.xpAmount
  )
  
  // 2. Build transaction
  const latestBlockhash = await this.connection.getLatestBlockhash()
  const transaction = new Transaction({
    recentBlockhash: latestBlockhash.blockhash,
    feePayer: new PublicKey(req.userId),
  })
  transaction.add(instruction)
  
  // 3. Sign with backend signer (optional, wallet will sign)
  // transaction.sign(this.backendKeypair)  // Uncomment if backend signature required
  
  // 4. Serialize and return
  const serialized = transaction.serialize({ requireAllSignatures: false })
  
  return {
    transactionBase64: serialized.toString('base64'),
    signers: [req.userId], // Wallet must sign
    blockHash: latestBlockhash.blockhash,
  }
}
```

### Step 7: Update `enrollTX()` Method

```typescript
public async enrollTX(userId: string, courseId: string): Promise<SignedTransactionResponse> {
  if (!this.program) {
    throw new Error('Waiting for program IDL')
  }
  
  const instruction = this.buildEnrollInstruction(this.program, userId, courseId)
  
  const latestBlockhash = await this.connection.getLatestBlockhash()
  const transaction = new Transaction({
    recentBlockhash: latestBlockhash.blockhash,
    feePayer: new PublicKey(userId),
  })
  transaction.add(instruction)
  
  const serialized = transaction.serialize({ requireAllSignatures: false })
  
  return {
    transactionBase64: serialized.toString('base64'),
    signers: [userId],
    blockHash: latestBlockhash.blockhash,
  }
}
```

### Step 8: Update `finalizeCourseT()` Method

Note: The current method name has a typo (`finalizeCourseT` instead of `finalizeCourseT`X). Keep for backward compatibility, or rename throughout:

```typescript
public async finalizeCourseT(userId: string, courseId: string): Promise<SignedTransactionResponse> {
  if (!this.program) {
    throw new Error('Waiting for program IDL')
  }
  
  const instruction = this.buildFinalizeCourseInstruction(this.program, userId, courseId)
  
  const latestBlockhash = await this.connection.getLatestBlockhash()
  const transaction = new Transaction({
    recentBlockhash: latestBlockhash.blockhash,
    feePayer: new PublicKey(userId),
  })
  transaction.add(instruction)
  
  const serialized = transaction.serialize({ requireAllSignatures: false })
  
  return {
    transactionBase64: serialized.toString('base64'),
    signers: [userId],
    blockHash: latestBlockhash.blockhash,
  }
}
```

## Testing Phase 2

Once Phase 1 is deployed and Phase 2 is implemented:

### Test 1: Health Check

```bash
# Should return 200 with server running status
curl http://localhost:3001/api/health
```

### Test 2: Enroll Transaction

```bash
# 1. Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Build enroll TX
curl -s -X POST http://localhost:3001/api/transaction/enroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "solana-basics"
  }' | jq '.'
```

Expected response:

```json
{
  "transactionBase64": "AgAAAAA...",
  "signers": ["<user_pubkey>"],
  "blockHash": "Ct7M..."
}
```

### Test 3: Complete Lesson Transaction

```bash
curl -s -X POST http://localhost:3001/api/transaction/complete-lesson \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "solana-basics",
    "lessonIndex": 0,
    "xpAmount": 100
  }' | jq '.'
```

### Test 4: Finalize Course Transaction

```bash
curl -s -X POST http://localhost:3001/api/transaction/finalize-course \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "solana-basics"
  }' | jq '.'
```

## Important Notes

### 1. Wallet Signature Required

Backend returns unsigned transactions. The frontend wallet MUST sign before submission:

```typescript
// Frontend: Sign TX with wallet
const signedTx = await wallet.signTransaction(decodedTx)
const txHash = await connection.sendSignedTransaction(signedTx)
```

### 2. PDA Seed Consistency

PDA seeds in backend MUST match the Anchor program exactly:

```
// Anchor program (in Rust):
Config: ["config"]
Course: ["course", course_id_bytes]
Learner: ["learner", user_pubkey_bytes]
Enrollment: ["enrollment", course_id_bytes, user_pubkey_bytes]

// Backend (TypeScript):
PublicKey.findProgramAddressSync([Buffer.from('config')], programId)
```

Mismatch = TX will fail with "Account Mismatch" error.

### 3. Daily XP Cap Enforcement

The `complete_lesson` instruction checks daily XP cap on-chain. Backend should also validate this before building TX to avoid failed submissions.

### 4. Arc: Creator Rewards

The `finalize_course` instruction mints Creator XP if course completions ≥ `min_completions_for_reward`. Ensure course creator PDA is available.

### 5. Token Extensions (Token-2022)

XP token uses Token-2022 with `NonTransferable` extension. This prevents players from selling XP.

## Debugging Common Errors

| Error | Cause | Solution |
|-------|--------|----------|
| `Waiting for program IDL` | Phase 1 not done | Run `anchor build` and copy IDL |
| `Invalid program ID` | Stale ANCHOR_PROGRAM_ID | Redeploy Phase 1, update .env |
| `Account mismatch` | PDA seeds wrong | Check seed derivation matches Anchor |
| `Signature verification failed` | Missing wallet signature | Frontend must sign before sending |
| `Insufficient funds` | Learner wallet has no SOL | Airdrop SOL: `solana airdrop 5` |

## Next Steps

After Phase 2 is complete:

1. **Phase 3a**: Implement `lib/hooks/useWallet.ts` for wallet connection
2. **Phase 3b**: Wire UI to call `/api/transaction/*` endpoints
3. **Phase 4a**: Integrate Helius DAS API for leaderboard
4. **Phase 4b**: Setup Photon for ZK credentials

---

**Phase 2 Estimated Time**: 3-5 days (coding + testing)  
**Blocker**: Phase 1 deployment (must have IDL + program ID)  
**Complexity**: Medium (PDA derivation, instruction building, transaction signing)

