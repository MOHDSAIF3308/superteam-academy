import { PublicKey } from '@solana/web3.js';

/**
 * Credential Query Service
 * Queries Metaplex Core credentials via Helius DAS API
 */

interface DasAsset {
  id: string;
  content?: {
    metadata?: {
      name: string;
      symbol: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    };
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
}

interface CredentialAttributes {
  trackId?: string;
  level?: string;
  coursesCompleted?: string;
  totalXp?: string;
}

export interface Credential {
  assetId: string;
  name: string;
  trackId: string;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  mintedAt: string;
}

export class CredentialService {
  constructor(private heliusRpcUrl: string) {}

  /**
   * Fetch all credentials for a wallet
   * Filters by track collection if provided
   */
  async getCredentials(
    walletAddress: PublicKey,
    trackCollectionAddress?: PublicKey
  ): Promise<Credential[]> {
    try {
      const response = await fetch(this.heliusRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: '1',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: walletAddress.toString(),
            page: 1,
            limit: 100,
          },
        }),
      });

      const data = await response.json();

      if (!data.result?.items) {
        return [];
      }

      let credentials = data.result.items as DasAsset[];

      // Filter by collection if provided
      if (trackCollectionAddress) {
        credentials = credentials.filter((item) =>
          item.grouping?.some(
            (g) =>
              g.group_key === 'collection' &&
              g.group_value === trackCollectionAddress.toString()
          )
        );
      }

      // Transform to Credential format
      return credentials.map((asset) => this.parseCredential(asset));
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return [];
    }
  }

  /**
   * Get credential for a specific track
   */
  async getCredentialByTrack(
    walletAddress: PublicKey,
    trackId: string,
    trackCollectionAddress: PublicKey
  ): Promise<Credential | null> {
    const credentials = await this.getCredentials(walletAddress, trackCollectionAddress);
    return credentials.find((c) => c.trackId === trackId) || null;
  }

  /**
   * Get highest level credential in a track
   */
  async getHighestLevelCredential(
    walletAddress: PublicKey,
    trackId: string,
    trackCollectionAddress: PublicKey
  ): Promise<Credential | null> {
    const credentials = await this.getCredentials(walletAddress, trackCollectionAddress);
    const trackCredentials = credentials.filter((c) => c.trackId === trackId);

    if (trackCredentials.length === 0) return null;

    return trackCredentials.reduce((highest, current) =>
      current.level > highest.level ? current : highest
    );
  }

  /**
   * Parse DAS asset into Credential format
   */
  private parseCredential(asset: DasAsset): Credential {
    const attrs = asset.content?.metadata?.attributes || [];
    const attrMap = new Map(attrs.map((a) => [a.trait_type, a.value]));

    return {
      assetId: asset.id,
      name: asset.content?.metadata?.name || 'Unnamed Credential',
      trackId: attrMap.get('track_id') || 'unknown',
      level: parseInt(attrMap.get('level') || '0'),
      coursesCompleted: parseInt(attrMap.get('courses_completed') || '0'),
      totalXp: parseInt(attrMap.get('total_xp') || '0'),
      mintedAt: new Date().toISOString(), // Not available in DAS response
    };
  }

  /**
   * Check if wallet has credential in track
   */
  async hasCredential(
    walletAddress: PublicKey,
    trackCollectionAddress: PublicKey
  ): Promise<boolean> {
    const credentials = await this.getCredentials(walletAddress, trackCollectionAddress);
    return credentials.length > 0;
  }
}

/**
 * Factory function to create CredentialService
 */
export function createCredentialService(heliusRpcUrl?: string): CredentialService {
  const rpc = heliusRpcUrl || process.env.HELIUS_RPC_URL || 'https://devnet.helius-rpc.com';
  return new CredentialService(rpc);
}
