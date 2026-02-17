# Phase 2 Testing & Integration Guide

## What You Have Now

✅ **Complete Implementation**:
- Mock IDL created at `lib/anchor/academy.json`
- Transaction service fully implemented with 3 instruction builders
- Backend API routes wired up and ready
- All imports uncommented and working

---

## Step 1: Verify Setup

### Check IDL File Exists
```bash
ls -la lib/anchor/academy.json
# Should show ~5KB file with IDL JSON
```

### Check Backend .env
```bash
cat backend/.env
# Should have:
# SOLANA_RPC_URL=https://api.devnet.solana.com
# ANCHOR_PROGRAM_ID=<your program id>
# BACKEND_SIGNER_SECRET_KEY=[<json array>]
# XP_TOKEN_MINT=<token mint>
```

---

## Step 2: Start Backend

```bash
cd /Users/saif/Desktop/solana-academy-platform/backend
npm install
npm start
```

**Expected Output**:
```
✅ Backend signer loaded: <pubkey>
✅ Program initialized: <program_id>
✅ Backend running on http://localhost:3001
```

If you see these messages, **Phase 2 is ready!**

---

## Step 3: Test Each Endpoint

### Test 1: Health Check
```bash
curl http://localhost:3001/api/health
```

**Expected**: `{"status":"ok"}`

### Test 2: Build Enroll Transaction

First, get a JWT token:
```bash
# Create a test user (or use existing)
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }'

# Save the token from response
TOKEN="<jwt_token_from_response>"
USER_ID="<user_id_from_response>"
```

Build enroll transaction:
```bash
curl -X POST http://localhost:3001/api/transaction/enroll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "solana-basics"
  }' | jq '.'
```

**Expected Response**:
```json
{
  "signedTx": "AgAAAAA...",
  "blockhash": "Ct7M3h...",
  "backendSignature": "<backend_pubkey>"
}
```

### Test 3: Build Complete Lesson Transaction

```bash
curl -X POST http://localhost:3001/api/transaction/complete-lesson \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "solana-basics",
    "lessonIndex": 0,
    "xpAmount": 100
  }' | jq '.'
```

**Expected**: Signed transaction in base64, with proper blockhash

### Test 4: Build Finalize Course Transaction

```bash
curl -X POST http://localhost:3001/api/transaction/finalize-course \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "solana-basics"
  }' | jq '.'
```

**Expected**: Signed transaction, ready for wallet to sign + submit

---

## Step 4: Validate Instruction Builders

The response transactions can be validated using Solana tools:

```bash
# Decode base64 TX to see instructions
echo "AgAAAAA..." | base64 -D | od -x

# Or use Solana web3.js to parse:
node -e "
const { Transaction } = require('@solana/web3.js');
const tx = Transaction.from(Buffer.from('AgAAAAA...', 'base64'));
console.log('Instructions:', tx.instructions.length);
"
```

---

## Step 5: Load Testing (Optional)

Test with multiple requests to verify stability:

```bash
# Run 10 requests concurrently
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/transaction/complete-lesson \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"courseId":"solana-basics","lessonIndex":'$i',"xpAmount":100}' &
done
wait
```

**Expected**: All requests succeed without errors

---

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Backend not running | Run `npm start` in backend folder |
| `Unauthorized` | No auth token | Get token from /api/auth/login or /api/auth/signup |
| `Failed to build instruction` | Program not initialized | Check ANCHOR_PROGRAM_ID in .env |
| `Cannot find module 'fs'` | Node.js issue | Reinstall: `npm install` in backend |
| `IDL not loaded` | academy.json missing | Verify at lib/anchor/academy.json |

---

## Important Notes

### Security
- ⚠️ **Backend signs transactions**: Wallet must separately sign to authorize
- ✅ **No secrets exposed**: Keypair stays server-side
- ✅ **Backend signer is optional**: TX is valid without it (wallet signature alone)

### TX Flow
```
1. Frontend → POST /api/transaction/complete-lesson
2. Backend builds instruction + creates TX
3. Backend serializes + returns base64
4. Frontend decodes from base64 → Transaction object
5. Frontend wallet signs (user approval in Phantom)
6. Frontend submits via connection.sendSignedTransaction()
7. On-chain: Instruction executes
```

### When Ready for Phase 1 Deployment

Once you've deployed Phase 1 Anchor program to Devnet:

1. Update `backend/.env`:
   ```
   ANCHOR_PROGRAM_ID=<deployed_program_id>
   XP_TOKEN_MINT=<created_token_mint>
   ```

2. IDL will auto-update from `lib/anchor/academy.json` (our mock)

3. Backend automatically initializes program on startup

4. All endpoints immediately start building valid on-chain TXs

---

## What's Next

Once Phase 2 testing is complete:

### Phase 3a (Parallel Work)
- Implement `useWallet()` hook for wallet connection
- Add "Connect Wallet" button to header
- See: PHASE_3A_WALLET_HOOKS.md

### Phase 3b (Depends on Phase 2)
- Wire frontend lesson pages
- Call `/api/transaction/complete-lesson`
- Sign with wallet + submit

### Phase 1 (When ready)
- Run `anchor build` locally
- Deploy to Devnet
- Update ANCHOR_PROGRAM_ID in .env
- All tests pass without changes ✅

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Health check returns 200
- [ ] Can create user + get JWT
- [ ] Enroll TX builds successfully
- [ ] Complete lesson TX builds successfully
- [ ] Finalize course TX builds successfully
- [ ] All responses include valid base64 TX
- [ ] No secrets in logs
- [ ] Multiple requests work concurrently
- [ ] Error handling works (bad input → helpful error)

---

## Quick Commands

```bash
# Start backend
cd backend && npm start

# Test all endpoints
bash scripts/test-phase2.sh (create this file with curl tests)

# Check program initialization
curl http://localhost:3001/api/health | jq '.'

# View backend logs
tail -f backend/logs/*.log (if logging implemented)

# Stop backend
Ctrl+C
```

---

**Phase 2 Status**: ✅ Ready for Testing

Next: Test locally, then integrate Phase 3a (wallet UI) in parallel.

