import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { TOKEN_2022_PROGRAM_ID } from '@/lib/anchor/constants'

/**
 * Fetch XP token balance for a learner from Token-2022 ATA
 * Used for: Live XP display, leaderboard
 *
 * @param learnerAddress - Wallet address to check
 * @param xpTokenMint - XP token mint public key
 * @returns Current XP balance + refetch function
 */
export function useXPBalance(learnerAddress?: PublicKey, xpTokenMint?: PublicKey) {
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!learnerAddress || !xpTokenMint) {
      setBalance(0)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const ata = getAssociatedTokenAddressSync(
        xpTokenMint,
        learnerAddress,
        false,
        TOKEN_2022_PROGRAM_ID
      )

      const accountBalance = await connection.getTokenAccountBalance(ata, 'confirmed')
      setBalance(Number(accountBalance.value.amount))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance'
      const accountMissing =
        message.includes('could not find account') || message.includes('Invalid param: could not find account')

      if (accountMissing) {
        setBalance(0)
        setError(null)
      } else {
        setError(err instanceof Error ? err : new Error('Failed to fetch balance'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [connection, learnerAddress, xpTokenMint])

  useEffect(() => {
    void fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  }
}

export type UseXPBalanceReturn = ReturnType<typeof useXPBalance>
