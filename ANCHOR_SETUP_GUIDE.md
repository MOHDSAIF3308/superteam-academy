# Anchor Program Setup & Deployment Guide

**Status**: Anchor program code complete ✅  
**Next Step**: Set up environment and compile

---

## Prerequisites

Before you can build the Anchor program, you need to install:

### 1. Rust & Cargo

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version
cargo --version
```

### 2. Solana CLI

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.12/install)"

# Add to PATH
export PATH="/home/username/.local/share/solana/install/active_release/bin:$PATH"

# Verify
solana --version
```

### 3. Anchor Framework

```bash
# Install Anchor CLI (requires Rust and Solana)
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.0 anchor-cli --locked

# Verify installation
anchor --version

# Should output: anchor-cli 0.30.0
```

### 4. Node.js & Yarn

```bash
# Install Node.js (if not already installed)
# Visit https://nodejs.org/ for installation

# Install Yarn (Anchor uses this)
npm install -g yarn

# Verify
node --version
yarn --version
```

---

## Build the Anchor Program

### Step 1: Navigate to Program Directory

```bash
cd /Users/saif/Desktop/solana-academy-platform
```

### Step 2: Build the Program

```bash
# Build for the first time
anchor build

# This will:
# 1. Compile Rust code
# 2. Generate TypeScript client code
# 3. Create IDL (Interface Description Language)
# 4. Output: target/deploy/academy.so
```

### Step 3: Verify Build Success

After successful build, you should see:
```
✨ Building program...

Compiling academy v0.1.0
Finished release [optimized] target(s) in ...

✏️ Generated IDL at target/idl/academy.json
```

### Step 4: Copy IDL to Frontend

```bash
# Copy the generated IDL to frontend (needed for useProgram hook)
cp target/idl/academy.json lib/anchor/academy.json
```

---

## Deploy to Devnet

### Step 1: Get Devnet Address

```bash
# Check your current keypair
solana address

# Should output something like: 4K3Dyjzvz...

# If no keypair exists:
solana-keygen new --outfile ~/.config/solana/id.json
```

### Step 2: Airdrop SOL to Pay for Deployment

```bash
# Get free SOL on Devnet
solana airdrop 5 --url devnet

# Check balance
solana balance --url devnet
```

### Step 3: Update Program ID

The program ID is derived from your deployment keypair:

```bash
# Generate deployment keypair
solana-keygen new --outfile programs/academy/target/deploy/academy-keypair.json

# Get the public key (this is your program ID)
solana-keygen pubkey programs/academy/target/deploy/academy-keypair.json

# Update Anchor.toml [programs.devnet] section
# anchor update
```

Or manually update `Anchor.toml`:
```toml
[programs.devnet]
academy = "YOUR_PROGRAM_ID_HERE"
```

And `programs/academy/src/lib.rs`:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

### Step 4: Deploy to Devnet

```bash
# Make sure you're on Devnet cluster
solana config set --url devnet

# Deploy
anchor deploy --provider.cluster devnet

# Output will show:
# Deploying cluster: https://api.devnet.solana.com
# Upgrade authority: /home/.../.config/solana/id.json
# Deployment status: ✓ Program deployed successfully
# Program ID: <YOUR_PROGRAM_ID>
```

### Step 5: Verify Deployment

```bash
# Check program on Devnet
solana program show <YOUR_PROGRAM_ID> --url devnet

# Should output program details
```

---

## Set Up Backend Configuration

After deployment, add program ID to backend environment:

### 1. Create `backend/.env`:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
ANCHOR_PROGRAM_ID=<YOUR_PROGRAM_ID>
BACKEND_SIGNER_SECRET_KEY=[1,2,3,...]  # Your keypair as array
XP_TOKEN_MINT=TokenkegQfeZyiNwAJsyFbPVwwQQftrPnb9SEcS5ZA  # Not created yet
NETWORK=devnet
```

### 2. Get Backend Signer Secret Key

```bash
# Use your Solana keypair (or create a new one for backend signer)
cat ~/.config/solana/id.json

# Format as JSON array: [1, 2, 3, ...] for BACKEND_SIGNER_SECRET_KEY

# Python one-liner to convert:
python3 -c "import json; k=json.load(open('~/.config/solana/id.json')); print(json.dumps(k))"
```

---

## Create XP Token (Token-2022)

After program deployment, create the XP token mint:

```bash
# Use SPL Token 2022 to create mint with NonTransferable extension
spl-token create-mint --program-id TokenzQdBNBrrnfSZ424NNZpmcWBVjswFLstP3gKzA --decimals 9

# Copy the mint address to backend .env as XP_TOKEN_MINT
```

---

## Build Commands Reference

```bash
# Build program
anchor build

# Build with release (optimized)
anchor build --release

# Clean build artifacts
anchor clean

# Run tests
anchor test

# Deploy to Devnet
anchor deploy --provider.cluster devnet

# Deploy to Mainnet-beta (when ready)
anchor deploy --provider.cluster mainnet-beta

# Fetch IDL from deployed program
anchor idl fetch <PROGRAM_ID> --provider.cluster devnet -o lib/anchor/academy.json
```

---

## Local Testing (Before Devnet)

### Option 1: Localnet (Fastest)

```bash
# Start local Solana validator in one terminal
solana-test-validator

# In another terminal, build and test
anchor test --skip-deploy

# This tests against local validator
```

### Option 2: Run Tests

```bash
# Run test suite (if tests exist)
anchor test --provider.cluster devnet
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `anchor: command not found` | Install Anchor CLI: `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked` |
| `error: failed to run custom build command` | Update Rust: `rustup update` |
| `Insufficient lamports` | Airdrop more SOL: `solana airdrop 5 --url devnet` |
| `Cluster RPC call failed` | Check RPC endpoint is active, try `solana ping --url devnet` |
| `Program compiled but fails to deploy` | Check keypair has write permissions on deployment binary |
| `IDL not generating` | Ensure no compilation errors, IDL only generates on successful build |

---

## Next Steps After Deployment

1. ✅ **Get Program ID** from deployment output
2. ✅ **Copy IDL** to `lib/anchor/academy.json`
3. ✅ **Create XP Token Mint** with Token-2022
4. ✅ **Update Backend Config** with program ID and token mint
5. 🚀 **Implement TX Builder** (`backend/src/services/transaction.service.ts`)
6. 🚀 **Wire Frontend** to use useProgram hook

---

## Useful Links

- **Anchor Docs**: https://coral-xyz.github.io/anchor/
- **Solana Docs**: https://docs.solana.com/
- **Explorer**: https://explorer.solana.com/?cluster=devnet
- **Solana Faucet**: https://solfaucet.com/

---

**Time to Deployment**: 30 minutes (after dependencies installed)  
**Total Setup Time**: 2-3 hours (first time, including dependency installation)
