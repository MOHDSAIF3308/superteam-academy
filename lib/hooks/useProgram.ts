import { useConnection } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { useMemo } from 'react'
import { useWallet } from './useWallet'
import IDL from '@/lib/anchor/academy.json'

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
  const { publicKey, signTransaction } = useWallet()

  return useMemo(() => {
    if (!publicKey || !signTransaction) {
      return null
    }

    try {
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions: async (txs: any[]) => {
          return Promise.all(txs.map((tx) => signTransaction(tx)))
        },
      } as Wallet

      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      })

      const programId = process.env.NEXT_PUBLIC_ANCHOR_PROGRAM_ID
      if (!programId) {
        console.warn('NEXT_PUBLIC_ANCHOR_PROGRAM_ID not set')
        return null
      }

      return new Program(IDL as any, programId, provider)
    } catch (error) {
      console.error('Failed to initialize program:', error)
      return null
    }
  }, [connection, publicKey, signTransaction])
}

export type UseProgram = ReturnType<typeof useProgram>
