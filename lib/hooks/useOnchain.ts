import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { IDL, PROGRAM_ID, getEnrollmentPda, getCoursePda } from '@/lib/anchor';

const PROGRAM_IDL = {
  ...(IDL as Record<string, unknown>),
  address: PROGRAM_ID.toBase58(),
};

function getProgram(provider: AnchorProvider): Program<any> {
  return new Program<any>(PROGRAM_IDL as any, provider as any);
}

/**
 * Hook: Enroll in a course
 * Learner signs the transaction
 */
export function useEnrollCourse() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async ({ courseId }: { courseId: string }) => {
      if (!wallet) throw new Error('Wallet not connected');

      const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
      const program = getProgram(provider);

      const [coursePda] = getCoursePda(courseId);
      const [enrollmentPda] = getEnrollmentPda(courseId, wallet.publicKey);

      const tx = await program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
  });
}

/**
 * Hook: Close enrollment
 * Learner signs the transaction
 * Completed courses close immediately, incomplete require 24h after enrollment
 */
export function useCloseEnrollment() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  return useMutation({
    mutationFn: async ({ courseId }: { courseId: string }) => {
      if (!wallet) throw new Error('Wallet not connected');

      const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
      const program = getProgram(provider);

      const [coursePda] = getCoursePda(courseId);
      const [enrollmentPda] = getEnrollmentPda(courseId, wallet.publicKey);

      const tx = await program.methods
        .closeEnrollment()
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: wallet.publicKey,
        })
        .rpc();

      return tx;
    },
  });
}

/**
 * Hook: Fetch enrollment data for learner in a course
 */
export function useEnrollment(courseId?: string, learnerAddress?: PublicKey) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['enrollment', courseId, learnerAddress?.toString()],
    queryFn: async () => {
      if (!courseId || !learnerAddress) return null;

      const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
      const program = getProgram(provider);

      const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);

      const enrollment = await (program.account as any).enrollment.fetchNullable(enrollmentPda);
      return enrollment;
    },
    enabled: !!courseId && !!learnerAddress,
  });
}

/**
 * Hook: Fetch all courses
 */
export function useCourses() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
      const program = getProgram(provider);

      const courses = await (program.account as any).course.all();
      return courses.filter((c: any) => c.account.isActive).map((c: any) => c.account);
    },
  });
}

/**
 * Hook: Fetch a single course
 */
export function useCourse(courseId?: string) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' });
      const program = getProgram(provider);

      const [coursePda] = getCoursePda(courseId);
      return await (program.account as any).course.fetch(coursePda);
    },
    enabled: !!courseId,
  });
}
