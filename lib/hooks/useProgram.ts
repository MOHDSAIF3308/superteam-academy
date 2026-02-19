import { useConnection } from '@solana/wallet-adapter-react'
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
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

      const programId = process.env.NEXT_PUBLIC_ANCHOR_PROGRAM_ID as any
      if (!programId) {
        console.warn('NEXT_PUBLIC_ANCHOR_PROGRAM_ID not set')
        return null
      }

      return new Program(IDL as any, programId, provider as any) as any
    } catch (error) {
      console.error('Failed to initialize program:', error)
      return null
    }
  }, [connection, publicKey, wallet])
}

export type UseProgram = ReturnType<typeof useProgram>
