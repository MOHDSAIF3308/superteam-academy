# Phase 3a: Wallet Connection Hooks

## Overview

Phase 3a implements React hooks for wallet connection and Solana interaction. This phase is **independent** of Phase 1 completion—it uses the existing `@solana/wallet-adapter-react` package already installed.

## Current Status

✅ **Installed**: @solana/wallet-adapter-react, wallet-adapter-wallets, wallet-adapter-base  
✅ **Existing**: WalletProvider.tsx component (wraps app)  
⏳ **Missing**: `useWallet()` hook in lib/hooks  
⏳ **Missing**: Wallet UI component wiring in Header  
⏳ **Missing**: Lesson submission flow connection  

## Architecture Overview

```
┌─────────────────────────────────────┐
│  Page Component (lesson page)         │
│  ├─ useWallet() ← hook for wallet    │
│  ├─ useProgram() ← (Phase 3b)        │
│  └─ [Complete Lesson] button click   │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Lesson Page Handler  │
    │ 1. Get signed TX     │
    │ 2. Sign with wallet  │
    │ 3. Submit to network │
    └──────────────────────┘
```

## Implementation Plan

### Step 1: Create `useWallet()` Hook

Location: `/lib/hooks/useWallet.ts`

```typescript
import { useConnection, useWallet as useWalletAdapter } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { useMemo } from 'react'

/**
 * Hook for wallet connection and Solana interaction
 *
 * @example
 * const { wallet, publicKey, connected, signTransaction, disconnect } = useWallet()
 *
 * @returns Wallet information and methods
 */
export const useWallet = () => {
  const { connection } = useConnection()
  const walletAdapter = useWalletAdapter()

  return useMemo(
    () => ({
      // Wallet info
      publicKey: walletAdapter.publicKey,
      connected: walletAdapter.connected,
      connecting: walletAdapter.connecting,
      disconnecting: walletAdapter.disconnecting,
      wallet: walletAdapter.wallet,

      // Methods
      connect: walletAdapter.connect,
      disconnect: walletAdapter.disconnect,
      signTransaction: walletAdapter.signTransaction,
      signAllTransactions: walletAdapter.signAllTransactions,
      signMessage: walletAdapter.signMessage,

      // Connection
      connection,

      // Helper: send signed TX
      sendTransaction: async (tx: Transaction): Promise<string> => {
        if (!walletAdapter.publicKey) {
          throw new Error('Wallet not connected')
        }

        const signed = await walletAdapter.signTransaction?.(tx)
        if (!signed) {
          throw new Error('Failed to sign transaction')
        }

        return connection.sendSignedTransaction(signed)
      },

      // Helper: check if wallet is ready
      isReady: walletAdapter.wallet !== null,
    }),
    [walletAdapter, connection]
  )
}

export type UseWalletReturn = ReturnType<typeof useWallet>
```

### Step 2: Update `lib/hooks/index.ts`

Add the new hook to exports:

```typescript
export { useI18n } from './useI18n'
export { useTheme } from './useTheme'
export { useAuth } from './useAuth'
export { useLearningProgress } from './useLearningProgress'
export { useProgress } from './useProgress'
export { useWallet } from './useWallet'
```

### Step 3: Create `WalletButton` Component

Location: `/components/auth/WalletButton.tsx`

```typescript
import React, { FC } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletDialogButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui'

/**
 * Wallet connection button with multi-wallet support
 * Requires WalletProvider in app layout
 */
export const WalletButton: FC = () => {
  const { connected, publicKey } = useWallet()

  if (connected && publicKey) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
      </div>
    )
  }

  return (
    <WalletDialogButton className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" />
  )
}
```

### Step 4: Update Header Component

Location: `/components/layout/Header.tsx`

Add wallet button to header:

```typescript
import { WalletButton } from '@/components/auth/WalletButton'

export const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="font-bold text-xl">Academy</div>

        {/* Right: Navigation + Wallet + Theme */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            <a href="/courses" className="hover:text-blue-600">Courses</a>
            <a href="/dashboard" className="hover:text-blue-600">Dashboard</a>
            <a href="/leaderboard" className="hover:text-blue-600">Leaderboard</a>
          </nav>

          {/* Wallet Connection Button */}
          <WalletButton />

          {/* Theme Switcher */}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
```

### Step 5: Verify WalletProvider Setup

Check `/components/providers/WalletProvider.tsx` is properly configured:

```typescript
import React from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    // Add more wallets as needed
  ]

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
```

### Step 6: Wire into App Layout

Check `/app/layout.tsx` includes WalletProvider:

```typescript
import { SolanaWalletProvider } from '@/components/providers'
import { ThemeProvider } from '@/components/providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <SolanaWalletProvider>
            {children}
          </SolanaWalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## Testing Phase 3a

### Test 1: App Loads with Wallet Button

```bash
npm run dev
# Open http://localhost:3000
# Should see "Connect Wallet" button in header
```

### Test 2: Wallet Connection Modal

```bash
# Click "Connect Wallet" button
# Modal should show Phantom, Solflare, etc.
# Click Phantom → wallet extension popup
# Sign message with Phantom
# Button should show connected pubkey
```

### Test 3: Hook Returns Correct Data

Create test file `/lib/hooks/useWallet.test.ts`:

```typescript
import { renderHook } from '@testing-library/react'
import { useWallet } from './useWallet'
import { useWallet as useWalletAdapter } from '@solana/wallet-adapter-react'

jest.mock('@solana/wallet-adapter-react')

describe('useWallet', () => {
  it('returns wallet info', () => {
    const mockUseWalletAdapter = useWalletAdapter as jest.Mock
    mockUseWalletAdapter.mockReturnValue({
      publicKey: null,
      connected: false,
      wallet: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
    })

    const { result } = renderHook(useWallet)
    expect(result.current.connected).toBe(false)
  })
})
```

### Test 4: Disconnect Flow

```bash
# Click connected pubkey (should show dropdown)
# Click "Disconnect"
# Button should revert to "Connect Wallet"
```

## Environment Variables

Add to `.env.local`:

```bash
# Solana Network Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_ANCHOR_PROGRAM_ID=<from Phase 1 deployment>
```

Note: `NEXT_PUBLIC_` prefix makes these available in browser.

## Styling Considerations

The wallet button uses `@solana/wallet-adapter-react-ui` default styles. Customize in `globals.css`:

```css
/* Wallet adapter button styling */
.wallet-adapter-button {
  background-color: rgb(37, 99, 235); /* blue-600 */
  border-radius: 0.375rem;
}

.wallet-adapter-button:hover {
  background-color: rgb(29, 78, 216); /* blue-700 */
}

.wallet-adapter-button-trigger {
  background: inherit;
  padding: 0;
}
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Wallet not found" error | WalletProvider missing | Wrap app in WalletProvider in layout.tsx |
| Button shows "Connecting..." forever | Network unreachable | Check SOLANA_RPC_URL in .env.local |
| Phantom popup doesn't appear | Wrong network | Check Phantom is set to Devnet |
| Connection persists on reload | autoConnect enabled | Set to false if unwanted, or clear storage |

## Files Created/Modified

### New Files
- [ ] `/lib/hooks/useWallet.ts` - Wallet hook implementation
- [ ] `/components/auth/WalletButton.tsx` - Wallet UI button
- [ ] `/.env.local` - Environment variables (user creates locally)
- [ ] `/lib/hooks/useWallet.test.ts` - Unit tests (optional)

### Modified Files
- [ ] `/lib/hooks/index.ts` - Add useWallet export
- [ ] `/components/layout/Header.tsx` - Wire in WalletButton
- [ ] `/components/providers/WalletProvider.tsx` - Verify setup
- [ ] `/app/layout.tsx` - Verify WalletProvider wrapping

## Next Phase Preview

After Phase 3a is complete:

- **Phase 3b** uses `useWallet()` to sign transactions
- Frontend lesson page will call:
  1. `POST /api/transaction/complete-lesson` (Phase 2)
  2. `signTransaction()` from `useWallet()` (Phase 3a)
  3. `connection.sendSignedTransaction()` (Phase 3a)

This pattern applies to all on-chain interactions.

## Timeline

- **Estimated Duration**: 1-2 days
- **No Phase 1 Dependencies**: Begin immediately
- **Complexity**: Low (mostly library configuration)

---

**Version**: 1.0.0  
**Last Updated**: February 2025  
**Depends On**: Package installations only (already done)

