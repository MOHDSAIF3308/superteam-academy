#!/bin/bash

# Solana Academy - Deployment Checklist
# Mark items as completed using: ☐ → ☑

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════╗
║           SOLANA ACADEMY - DEVNET DEPLOYMENT CHECKLIST             ║
╚════════════════════════════════════════════════════════════════════╝

SETUP PHASE (Completed ✅)
═══════════════════════════════════════════════════════════════════

☑ Generate keypairs (wallets/)
  └─ signer.json, program-keypair.json, xp-mint-keypair.json

☑ Update program ID in code
  └─ lib.rs and Anchor.toml updated

☑ Configure Anchor.toml
  └─ cluster = "devnet"
  └─ wallet = "wallets/signer.json"

☑ Create deployment scripts
  └─ generate-keypairs.js
  └─ update-program-id.js
  └─ fix-compilation.js
  └─ deploy-interactive.sh

☑ Update .env.local
  └─ NEXT_PUBLIC_ANCHOR_PROGRAM_ID
  └─ NEXT_PUBLIC_XP_TOKEN_MINT
  └─ NEXT_PUBLIC_BACKEND_SIGNER
  └─ NEXT_PUBLIC_CLUSTER
  └─ NEXT_PUBLIC_SOLANA_RPC_URL

☑ Create documentation
  └─ DEPLOYMENT_GUIDE.md
  └─ DEVNET_DEPLOYMENT.md
  └─ DEPLOYMENT_SETUP_COMPLETE.md


BUILD PHASE (Next Steps)
═══════════════════════════════════════════════════════════════════

☐ Step 1: Fix Compilation Errors
  Command: node scripts/fix-compilation.js
  Expected: Script fixes struct name mismatches
  
  Manual option: Edit programs/academy/src/instructions/close_enrollment.rs
  Change: pub struct CloseEnrollmentAccounts
  To:     pub struct CloseEnrollment

☐ Step 2: Build to WebAssembly
  Command: 
    cd programs/academy
    cargo build --target wasm32-unknown-unknown --release
  
  Expected: "Finished release [optimized] target(s) in XXs"
  
  If error: 
    cargo update -p blake3 --precise 1.7.0
    cargo update -p rmp --precise 0.8.14
    cargo update -p rmp-serde --precise 1.3.0


FUNDING PHASE
═══════════════════════════════════════════════════════════════════

☐ Step 3: Fund Your Wallet
  Need: 3-5 SOL
  Option A (CLI): solana airdrop 2  # Run 2-3 times
  Option B (Web): https://faucet.solana.com
  
  Verify:
    solana balance wallets/signer.json
    (Should show >= 2 SOL)


DEPLOYMENT PHASE
═══════════════════════════════════════════════════════════════════

☐ Step 4: Deploy Program
  Command:
    anchor deploy \
      --program-name academy \
      --provider.cluster devnet \
      --program-keypair wallets/program-keypair.json
  
  Expected Output:
    Program Id: 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
    Deploy success

☐ Step 5: Confirm Deployment
  Command: 
    solana program show 2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
  
  Expected: Program account details showing your program


INITIALIZATION PHASE
═══════════════════════════════════════════════════════════════════

☐ Step 6: Create Initialize Script
  File: scripts/initialize.ts
  Purpose: Create Config PDA and XP Token Mint
  
  Template in: DEPLOYMENT_GUIDE.md

☐ Step 7: Initialize Program
  Commands:
    export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
    export ANCHOR_WALLET=wallets/signer.json
    npx ts-node scripts/initialize.ts
  
  Expected: 
    ✓ Program initialized!
    ✓ Config PDA created
    ✓ XP Mint created


TESTING PHASE
═══════════════════════════════════════════════════════════════════

☐ Step 8: Create Mock Course
  Command: npx ts-node scripts/create-mock-course.ts
  Purpose: Test course creation functionality

☐ Step 9: Create Mock Track (Optional)
  Command: npx ts-node scripts/create-mock-track.ts
  Purpose: For credential issuance testing

☐ Step 10: Start Frontend
  Command: npm run dev
  Expected: http://localhost:3000

☐ Step 11: Test Wallet Connection
  Expected: Can connect Phantom/other wallet

☐ Step 12: Test Course Enrollment
  Expected: Can enroll, complete lessons, earn XP


VERIFICATION
═══════════════════════════════════════════════════════════════════

☐ Verify on Solana Explorer
  URL: https://explorer.solana.com/?cluster=devnet
  Search: Your program ID
  Expected: Program details, recent transactions

☐ Check Config Account
  Command: anchor account academy.Config <PDA>
  Expected: Config account data displayed

☐ Verify XP Mint
  Command: spl-token display BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4
  Expected: Mint account details


CONFIGURATION REFERENCE
═══════════════════════════════════════════════════════════════════

Program ID:       2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw
XP Mint:          BB6urY3kS15YzkM3MqRYGWZDKpB56YijHFz4q55dwXZ4
Authority/Signer: 6HJo2VY5NgAeTWcNq22qU6EKfsdcUPCEmC1fu1e3hvQ1
Network:          Devnet
RPC:              https://api.devnet.solana.com

.env.local keys:
  ✓ NEXT_PUBLIC_ANCHOR_PROGRAM_ID
  ✓ NEXT_PUBLIC_XP_TOKEN_MINT
  ✓ NEXT_PUBLIC_BACKEND_SIGNER
  ✓ NEXT_PUBLIC_CLUSTER
  ✓ NEXT_PUBLIC_SOLANA_RPC_URL


TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════

Build fails:
  → Check: rustup target list | grep wasm32
  → Fix: rustup target add wasm32-unknown-unknown

Deployment fails:
  → Check: solana balance
  → Fix: Get more SOL from faucet

Out of funds:
  → Option 1: solana airdrop 2
  → Option 2: https://faucet.solana.com
  → Option 3: Github + web faucet

Already initialized error:
  → Normal - init can only run once
  → Check on-chain: anchor account academy.Config <PDA>


DOCUMENTATION
═══════════════════════════════════════════════════════════════════

Primary Guide:    DEPLOYMENT_GUIDE.md
Reference:        DEVNET_DEPLOYMENT.md
Quick Checklist:  This file
Interactive:      ./scripts/deploy-interactive.sh

Specification:    ./SPEC.md (if available)
Integration:      ./INTEGRATION.md (if available)


═══════════════════════════════════════════════════════════════════
STATUS: Setup Complete - Ready for Build & Deploy
═══════════════════════════════════════════════════════════════════

Next Command: node scripts/fix-compilation.js

EOF
