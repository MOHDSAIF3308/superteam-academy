import { useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { AnchorProvider } from '@coral-xyz/anchor';
import { getConfigPda, getProgram } from '@/lib/anchor';

/**
 * Hook: Get on-chain config
 */
export function useConfig() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['config:onchain'],
    queryFn: async () => {
      const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
      const program = getProgram(provider);

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
