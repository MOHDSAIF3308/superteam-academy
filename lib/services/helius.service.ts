/**
 * Helius DAS API Service
 *
 * Queries Helius (via Solana's Data Availability Service) for:
 * - NFT/Token balances
 * - Leaderboard data (XP token holders)
 * - Token metadata
 *
 * Used by: Leaderboard page, useXPBalance() hook
 */

import { PublicKey } from '@solana/web3.js'

const HELIUS_API_BASE = 'https://api.helius.xyz/v0'

interface TokenBalance {
  owner: PublicKey
  mint: PublicKey
  balance: number
  decimals: number
}

interface LeaderboardEntry {
  rank: number
  address: PublicKey
  xp: number
  username?: string
}

export class HeliusService {
  private apiKey: string

  constructor(apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '') {
    this.apiKey = apiKey
  }

  /**
   * Get all token holders for an XP mint
   * Used for: Real-time leaderboard
   *
   * @param mint - XP token mint address
   * @param limit - Top N holders (default: 100)
   * @returns Array of holders with balances
   */
  async getTokenHolders(mint: PublicKey, limit = 100): Promise<TokenBalance[]> {
    // TODO: Implement using Helius getTokenHolders endpoint
    // GET https://api.helius.xyz/v0/token/holders?api_key=...
    // Query params:
    //   - mint: {mint}
    //   - limit: {limit}
    // Returns: { result: [{owner, amount, decimals}, ...] }

    try {
      const response = await fetch(
        `${HELIUS_API_BASE}/token/holders?api_key=${this.apiKey}&mint=${mint.toBase58()}&limit=${limit}`
      )

      if (!response.ok) {
        throw new Error(`Helius DAS error: ${response.status}`)
      }

      const data = await response.json()

      // Transform response to our format
      return data.result.map((holder: any) => ({
        owner: new PublicKey(holder.owner),
        mint: mint,
        balance: BigInt(holder.amount),
        decimals: holder.decimals,
      }))
    } catch (error) {
      console.error('Failed to fetch token holders:', error)
      throw error
    }
  }

  /**
   * Get single account token balance
   * Used for: User XP display
   *
   * @param ata - Token account address
   * @returns Token balance
   */
  async getTokenBalance(ata: PublicKey): Promise<number> {
    // TODO: Implement using RPC getTokenAccountBalance
    // or Helius getAsset endpoint

    try {
      // For now, return 0 (placeholder)
      return 0
    } catch (error) {
      console.error('Failed to fetch token balance:', error)
      throw error
    }
  }

  /**
   * Get leaderboard (top N holders by XP)
   * Used by: Leaderboard page
   *
   * @param mint - XP token mint
   * @param limit - Top N (default: 100)
   * @returns Sorted leaderboard entries
   */
  async getLeaderboard(mint: PublicKey, limit = 100): Promise<LeaderboardEntry[]> {
    const holders = await this.getTokenHolders(mint, limit)

    return holders
      .map((holder, index) => ({
        rank: index + 1,
        address: holder.owner,
        xp: Number(holder.balance) / Math.pow(10, holder.decimals),
        username: undefined, // TODO: Look up username from backend
      }))
      .sort((a, b) => b.xp - a.xp)
  }
}

// Singleton instance
export const heliusService = new HeliusService()
