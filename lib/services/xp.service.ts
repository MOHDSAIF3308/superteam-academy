import { PublicKey, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID, XP_DECIMALS } from '@/lib/anchor/constants';

/**
 * XP Management Service
 * Handles XP balance querying from Token-2022 ATA
 */

export class XpService {
  constructor(private connection: Connection) {}

  /**
   * Get XP balance for a wallet
   * XP is stored in Token-2022 ATA with 0 decimals
   */
  async getXpBalance(walletAddress: PublicKey, xpMint: PublicKey): Promise<number> {
    try {
      const xpAta = getAssociatedTokenAddressSync(
        xpMint,
        walletAddress,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const balance = await this.connection.getTokenAccountBalance(xpAta);

      return Number(balance.value.amount);
    } catch (error) {
      // ATA doesn't exist yet (learner hasn't earned XP)
      return 0;
    }
  }

  /**
   * Get XP balance for multiple wallets
   */
  async getXpBalances(
    walletAddresses: PublicKey[],
    xpMint: PublicKey
  ): Promise<Map<string, number>> {
    const balances = new Map<string, number>();

    for (const address of walletAddresses) {
      const balance = await this.getXpBalance(address, xpMint);
      balances.set(address.toString(), balance);
    }

    return balances;
  }

  /**
   * Create XP ATA instruction if it doesn't exist
   * Used by backend before sending XP to a user
   */
  async ensureXpAccountExists(
    walletAddress: PublicKey,
    xpMint: PublicKey
  ): Promise<boolean> {
    try {
      const xpAta = getAssociatedTokenAddressSync(
        xpMint,
        walletAddress,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      await this.connection.getTokenAccountBalance(xpAta);
      return true; // Account exists
    } catch {
      return false; // Account doesn't exist
    }
  }

  /**
   * Calculate XP level from total XP
   * Can be customized with different progression curves
   */
  static calculateLevel(totalXp: number): number {
    const xpPerLevel = 1000; // Adjust progressions as needed
    return Math.floor(totalXp / xpPerLevel);
  }

  /**
   * Calculate XP needed for next level
   */
  static calculateXpForNextLevel(totalXp: number): number {
    const currentLevel = this.calculateLevel(totalXp);
    const nextLevelXp = (currentLevel + 1) * 1000;
    return nextLevelXp - totalXp;
  }

  /**
   * Format XP for display
   */
  static formatXp(xp: number): string {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    }
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }
}
