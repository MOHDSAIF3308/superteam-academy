import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { BN, AnchorProvider, Program } from '@coral-xyz/anchor';
import { PROGRAM_ID, IDL, getConfigPda } from '@/lib/anchor';

/**
 * Hook: Get on-chain config
 */
export function useConfig() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['config:onchain'],
    queryFn: async () => {
      const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
      const program = new Program<any>(IDL as any, PROGRAM_ID as any, provider as any);

      const [configPda] = getConfigPda();
      return await (program.account as any).config.fetch(configPda);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Get XP mint address from config
 */
export function useXpMint() {
  const { data: config } = useConfig();

  return {
    xpMint: config?.xpMint || null,
    authority: config?.authority || null,
    backendSigner: config?.backendSigner || null,
    isLoading: !config,
  };
}
