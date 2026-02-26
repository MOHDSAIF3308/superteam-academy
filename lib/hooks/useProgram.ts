import { useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import { useWallet } from './useWallet'
import { getProgram } from '@/lib/anchor'

/**
 * Hook for interacting with Anchor program
 * Requires wallet to be connected
 *
 * @example
 * const program = useProgram()
 * if (program) {
 *   const tx = await program.methods.completeLesson(...)
 * }
 */
export const useProgram = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const { publicKey } = wallet

  return useMemo(() => {
    if (!publicKey) {
      return null
    }

    try {
      const walletAdapter = (wallet as any)
      const walletObj = {
        publicKey,
        signTransaction: walletAdapter.signTransaction,
        signAllTransactions: async (txs: any[]) => {
          return Promise.all(txs.map((tx) => walletAdapter.signTransaction?.(tx)))
        },
      } as Wallet

      const provider = new AnchorProvider(connection, walletObj, {
        commitment: 'confirmed',
      })

      return getProgram(provider) as any
    } catch (error) {
      console.error('Failed to initialize program:', error)
      return null
    }
  }, [connection, publicKey, wallet])
}

export type UseProgram = ReturnType<typeof useProgram>
