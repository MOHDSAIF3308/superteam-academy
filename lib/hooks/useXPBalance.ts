import { useCallback, useState } from 'react'
import { PublicKey } from '@solana/web3.js'

/**
 * Fetch XP token balance for a learner from Helius DAS API
 * Used for: Live XP display, leaderboard
 *
 * @param learnerAddress - Wallet address to check
 * @param xpTokenMint - XP token mint public key
 * @returns Current XP balance + refetch function
 */
export function useXPBalance(learnerAddress?: PublicKey, xpTokenMint?: PublicKey) {
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!learnerAddress || !xpTokenMint) {
      setError(new Error('Missing learnerAddress or xpTokenMint'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement Helius DAS API call
      // Steps:
      // 1. Derive token ATA for (xpTokenMint, learnerAddress)
      // 2. Call Helius getAsset(ata) or call RPC getTokenAccountBalance()
      // 3. Parse balance from response
      // 4. Return balance in human-readable form (accounting for decimals)

      // Placeholder:
      const ata = PublicKey.findProgramAddressSync(
        [learnerAddress.toBuffer(), new PublicKey('TokenkegQfeZyiNwAJsyFbPVwwQQftrPbRUKJRZnb9').toBuffer(), xpTokenMint.toBuffer()],
        new PublicKey('ATokenGPvbdGVqstVQmcLsNZAqeEgtVO3XuQ8M51oKwQn')
      )[0]

      // const response = await fetch(`https://api.helius.xyz/v0/token/accounts/${ata}`, {
      //   headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_HELIUS_API_KEY}` }
      // })
      // const data = await response.json()
      // setBalance(data.amount)

      setBalance(0) // Default: no balance fetched yet
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'))
    } finally {
      setIsLoading(false)
    }
  }, [learnerAddress, xpTokenMint])

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  }
}

export type UseXPBalanceReturn = ReturnType<typeof useXPBalance>
