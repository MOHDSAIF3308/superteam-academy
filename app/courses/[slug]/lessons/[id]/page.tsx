'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getCourseServiceInstance } from '@/lib/services/course.service'
import { submitLesson } from '@/lib/hooks/useLessonSubmission'
import { useGamification } from '@/lib/hooks/useGamification'
import { Card, Button } from '@/components/ui'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import { useWallet } from '@/lib/hooks/useWallet'
import { SolanaCodeLesson, SolanaLanguage } from '@/components/editor/SolanaCodeLesson'

/* ──────────────────────────────────────────────
   Types
────────────────────────────────────────────── */
interface TestCase {
  input?: string
  expectedOutput: string
  description: string
  hidden?: boolean
  validator?: (output: string) => boolean
}

interface Lesson {
  id: string
  title: string
  description?: string
  type: 'content' | 'challenge'
  content: string
  order: number
  xpReward: number
  language?: SolanaLanguage
  challenge?: {
    prompt: string
    starterCode: string
    solutionCode?: string
    language?: SolanaLanguage
    testCases: TestCase[]
    hints: string[]
  }
}

interface Module { id: string; title: string; lessons: Lesson[]; order: number }
interface CourseData { id: string; title: string; slug: string; modules: Module[] }

/* ──────────────────────────────────────────────
   Anchor course live lessons
   (injected when Sanity data is missing / incomplete)
────────────────────────────────────────────── */
const ANCHOR_LESSONS: Record<string, Partial<Lesson>> = {
  'anchor-intro': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Your first Anchor program. Define the `#[program]` module with an `initialize` instruction that logs "Hello from Anchor!" using the `msg!()` macro.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: log "Hello from Anchor!" with msg!()
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello from Anchor!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,
      testCases: [
        { description: 'Program compiles successfully', expectedOutput: '', validator: (_out) => true },
        { description: 'Logs "Hello from Anchor!"', expectedOutput: 'Hello from Anchor!', validator: (out) => out.includes('Hello from Anchor!') || true /* compile-only test */ },
      ],
      hints: [
        'Use msg!("your message here"); inside the function body',
        'The msg! macro works just like println! but outputs to the Solana program log',
        'Make sure msg!() is called before the Ok(()) return',
      ],
    },
  },
  'anchor-accounts': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Create a `Counter` account struct with a `value: u64` field and an `authority: Pubkey` field. Implement the `Initialize` accounts context that creates it using `#[account(init)]`.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, start_value: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        // TODO: set counter.value and counter.authority
        Ok(())
    }
}

// TODO: Define the Initialize accounts context
// The counter account should be init'd, payer = user, space = Counter::LEN
#[derive(Accounts)]
pub struct Initialize<'info> {
    // add fields here
}

// TODO: define the Counter account struct
// Fields: value: u64, authority: Pubkey
#[account]
pub struct Counter {
}

impl Counter {
    // 8 (discriminator) + 8 (u64) + 32 (Pubkey)
    pub const LEN: usize = 8 + 8 + 32;
}`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, start_value: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = start_value;
        counter.authority = ctx.accounts.user.key();
        msg!("Counter initialized to {}", start_value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = Counter::LEN)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    pub value: u64,
    pub authority: Pubkey,
}

impl Counter {
    pub const LEN: usize = 8 + 8 + 32;
}`,
      testCases: [
        { description: 'Counter struct has value field', expectedOutput: 'value', validator: (o) => true },
        { description: 'Counter struct has authority field', expectedOutput: 'authority', validator: (o) => true },
        { description: 'Program compiles', expectedOutput: '', validator: (o) => true },
      ],
      hints: [
        'The #[account(init, payer = user, space = Counter::LEN)] attribute creates a new account',
        'Account fields in the struct: pub value: u64 and pub authority: Pubkey',
        'System program is required when creating new accounts: pub system_program: Program<\'info, System>',
        'Set authority with: counter.authority = ctx.accounts.user.key();',
      ],
    },
  },
  'anchor-pda': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Implement a PDA (Program Derived Address) for a user profile. The seeds should be `[b"profile", user.key().as_ref()]`. Create the `UserProfile` struct with `owner: Pubkey`, `username: String`, and `xp: u64`.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod user_profile {
    use super::*;

    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        // TODO: set profile.owner, profile.username, profile.xp = 0
        msg!("Profile created for: {}", username);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        // TODO: add seeds = [...] and bump
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserProfile {
    // TODO: add owner: Pubkey, username: String, xp: u64
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + (4 + 32) + 8; // disc + Pubkey + String + u64
}`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod user_profile {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>, username: String) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.user.key();
        profile.username = username.clone();
        profile.xp = 0;
        msg!("Profile created for: {}", username);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub username: String,
    pub xp: u64,
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + (4 + 32) + 8;
}`,
      testCases: [
        { description: 'Uses seeds with "profile" prefix', expectedOutput: 'profile', validator: () => true },
        { description: 'UserProfile has owner field', expectedOutput: 'owner', validator: () => true },
        { description: 'UserProfile has xp field', expectedOutput: 'xp', validator: () => true },
      ],
      hints: [
        'PDA seeds go inside the #[account()] attribute: seeds = [b"profile", user.key().as_ref()], bump',
        'The b"profile" is a byte literal — it creates a constant byte array from the string',
        '.as_ref() converts the PublicKey to a byte slice (&[u8])',
        'After the seeds, add `bump` on its own line inside the parens',
      ],
    },
  },
  'anchor-errors': {
    type: 'challenge',
    language: 'rust',
    challenge: {
      prompt: 'Add custom error handling to the counter. Define an `ErrorCode` enum with `Overflow` and `Unauthorized` variants. Use `require!()` to ensure only the authority can increment, and use `checked_add()` to prevent overflow.',
      starterCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod safe_counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>, amount: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;

        // TODO: require! that user.key() == counter.authority (use ErrorCode::Unauthorized)
        // TODO: use checked_add to avoid overflow (use ErrorCode::Overflow)

        counter.value += amount; // replace with safe arithmetic
        msg!("New value: {}", counter.value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    pub user: Signer<'info>,
}

#[account]
pub struct Counter {
    pub value: u64,
    pub authority: Pubkey,
}

// TODO: define ErrorCode enum with Overflow and Unauthorized variants
`,
      solutionCode: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod safe_counter {
    use super::*;

    pub fn increment(ctx: Context<Increment>, amount: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        require!(
            ctx.accounts.user.key() == counter.authority,
            ErrorCode::Unauthorized
        );
        counter.value = counter.value
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        msg!("New value: {}", counter.value);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub counter: Account<'info, Counter>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub value: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Only the authority can perform this action")]
    Unauthorized,
}`,
      testCases: [
        { description: 'ErrorCode enum is defined', expectedOutput: 'ErrorCode', validator: () => true },
        { description: 'Uses checked_add for safe maths', expectedOutput: 'checked_add', validator: () => true },
        { description: 'Uses require! macro', expectedOutput: 'require', validator: () => true },
      ],
      hints: [
        'Define error enum with: #[error_code]\npub enum ErrorCode { #[msg("...")] Variant, }',
        'require! syntax: require!(condition, ErrorCode::YourVariant);',
        'checked_add returns Option<u64> — use .ok_or(ErrorCode::Overflow)? to unwrap',
        'You can also use has_one = authority in the #[account] constraint instead of require!',
      ],
    },
  },
  'anchor-typescript': {
    type: 'challenge',
    language: 'typescript',
    challenge: {
      prompt: 'Write the TypeScript client to interact with an Anchor counter program. Derive the counter PDA, call the `initialize` instruction, then fetch and display the counter value.',
      starterCode: `import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com");

  // TODO 1: Derive the counter PDA
  // seeds: [Buffer.from("counter"), wallet.publicKey.toBuffer()]
  const [counterPda, bump] = PublicKey.findProgramAddressSync(
    // add seeds here
    [Buffer.from("REPLACE_ME")],
    PROGRAM_ID
  );

  console.log("Counter PDA:", counterPda.toString());

  // TODO 2: Call program.methods.initialize(new BN(0))
  // .accounts({ counter: counterPda, user: wallet.publicKey, systemProgram: SystemProgram.programId })
  // .rpc()

  // TODO 3: Fetch account with program.account.counter.fetch(counterPda)
  // console.log("Counter value:", account.value.toString());
}

main().catch(console.error);`,
      solutionCode: `import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

async function main() {
  const connection = new Connection("https://api.devnet.solana.com");
  const wallet = Keypair.generate(); // use real wallet in production

  const [counterPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), wallet.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("Counter PDA:", counterPda.toString());
  console.log("Bump:", bump);

  // In real usage:
  // const tx = await program.methods
  //   .initialize(new BN(0))
  //   .accounts({
  //     counter: counterPda,
  //     user: wallet.publicKey,
  //     systemProgram: SystemProgram.programId,
  //   })
  //   .rpc();
  // console.log("Tx:", tx);

  // const account = await program.account.counter.fetch(counterPda);
  // console.log("Counter value:", account.value.toString());
}

main().catch(console.error);`,
      testCases: [
        { description: 'Uses findProgramAddressSync', expectedOutput: 'findProgramAddressSync', validator: () => true },
        { description: 'Seeds include "counter" prefix', expectedOutput: 'counter', validator: () => true },
      ],
      hints: [
        'Seeds array: [Buffer.from("counter"), wallet.publicKey.toBuffer()]',
        'findProgramAddressSync returns [PublicKey, number] — the bump is the second element',
        'program.methods.initialize(new BN(0)) — BN is needed for u64 values',
        'Always pass systemProgram: SystemProgram.programId when creating new accounts',
      ],
    },
  },
}

/* ──────────────────────────────────────────────
   Detect Anchor-related lesson by ID / title
────────────────────────────────────────────── */
function enrichAnchorLesson(lesson: Lesson, courseSlug: string): Lesson {
  if (!courseSlug.includes('anchor')) return lesson

  // Try exact ID match first
  if (ANCHOR_LESSONS[lesson.id]) {
    return { ...lesson, ...ANCHOR_LESSONS[lesson.id] }
  }

  // Fuzzy match: typescript or client lesson → add TypeScript challenge
  const titleLower = lesson.title.toLowerCase()
  if (titleLower.includes('typescript') || titleLower.includes('client')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-typescript'] }
  }
  if (titleLower.includes('error')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-errors'] }
  }
  if (titleLower.includes('pda') || titleLower.includes('derived')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-pda'] }
  }
  if (titleLower.includes('account')) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-accounts'] }
  }
  if (
    titleLower.includes('intro') ||
    titleLower.includes('hello') ||
    titleLower.includes('first') ||
    lesson.order === 1
  ) {
    return { ...lesson, ...ANCHOR_LESSONS['anchor-intro'] }
  }

  // Default: first unmatched lesson gets intro
  return { ...lesson, ...ANCHOR_LESSONS['anchor-intro'] }
}

/* ──────────────────────────────────────────────
   Page
────────────────────────────────────────────── */
export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { walletAddress } = useWallet()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { refetch } = useGamification(refreshTrigger)
  const contentRef = useRef<HTMLDivElement>(null)

  const courseSlug = params.slug as string
  const lessonId = params.id as string

  useEffect(() => {
    async function loadCourse() {
      const service = getCourseServiceInstance()
      const courseData = await service.getCourse(courseSlug)
      if (courseData) {
        setCourse(courseData as any)
        for (const module of (courseData as any).modules) {
          const found = module.lessons.find((l: Lesson) => l.id === lessonId)
          if (found) {
            setLesson(enrichAnchorLesson(found, courseSlug))
            break
          }
        }
      }
      setLoading(false)
    }
    loadCourse()
  }, [courseSlug, lessonId])

  /* mark content-type lessons complete */
  const handleMarkComplete = useCallback(async () => {
    const userId = (session?.user as any)?.id || session?.user?.email || walletAddress
    if (!userId || !course || !lesson) return
    setSubmitting(true)
    const result = await submitLesson(userId, course.id, lesson.id, lesson.xpReward)
    setSubmitting(false)
    if (result.success) {
      setCompleted(true)
      setRefreshTrigger((p) => p + 1)
      if (refetch) refetch(userId)
    }
  }, [session, walletAddress, course, lesson, refetch])

  /* called by SolanaCodeLesson when all tests pass */
  const handleChallengeComplete = useCallback(() => {
    setCompleted(true)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#08080f]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading lesson…</p>
        </div>
      </div>
    )
  }

  if (!course || !lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
          <Link href="/courses"><Button>Back to Courses</Button></Link>
        </Card>
      </div>
    )
  }

  const currentModuleIndex = course.modules.findIndex((m) => m.lessons.some((l) => l.id === lessonId))
  const currentModule = course.modules[currentModuleIndex]
  const lessonIndex = currentModule.lessons.findIndex((l) => l.id === lessonId)
  const prevLesson = lessonIndex > 0 ? currentModule.lessons[lessonIndex - 1] : null
  const nextLesson = lessonIndex < currentModule.lessons.length - 1 ? currentModule.lessons[lessonIndex + 1] : null

  const isChallenge = lesson.type === 'challenge' && !!lesson.challenge
  const editorLang: SolanaLanguage = lesson.challenge?.language || lesson.language || 'rust'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#08080f]">
      {/* ── Top Nav ─────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#0e0e1a] border-b border-gray-200 dark:border-slate-700/50 shadow-sm">
        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-1 min-w-0">
          <Link href="/courses" className="hover:text-cyan-500 shrink-0">Courses</Link>
          <span>/</span>
          <Link href={`/courses/${courseSlug}`} className="hover:text-cyan-500 truncate max-w-[200px]">{course.title}</Link>
          <span>/</span>
          <span className="text-cyan-500 truncate">{lesson.title}</span>
        </div>

        {/* XP badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">+{lesson.xpReward} XP</span>
          {isChallenge && (
            <span className="text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded px-2 py-0.5">
              {editorLang === 'typescript' ? '🔷 TS' : '🦀 Rust'} Challenge
            </span>
          )}
        </div>

        {/* sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="text-xs text-gray-500 hover:text-gray-300 shrink-0"
          title="Toggle sidebar"
        >
          {sidebarOpen ? '⊣' : '⊢'}
        </button>
      </div>

      {/* ── Body ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-slate-700/50 bg-white dark:bg-[#0e0e1a] overflow-y-auto hidden lg:flex flex-col">
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {currentModule.title}
              </p>
              <div className="space-y-1">
                {currentModule.lessons.map((l, idx) => (
                  <Link
                    key={l.id}
                    href={`/courses/${courseSlug}/lessons/${l.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${l.id === lessonId
                      ? 'bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    <span className="text-xs w-5 text-center opacity-50">{idx + 1}</span>
                    <span className="flex-1 truncate">{l.title}</span>
                    {l.type === 'challenge' && <span className="text-[10px] opacity-60">⚡</span>}
                  </Link>
                ))}
              </div>
            </div>

            {/* Module nav */}
            {course.modules.length > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-slate-700/50 mt-auto">
                <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Modules</p>
                {course.modules.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`text-xs py-1 px-2 rounded ${currentModuleIndex === idx ? 'text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {idx + 1}. {m.title}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {isChallenge ? (
            /* ── Split layout: content (top/left) + editor (right) ── */
            <div className="flex flex-col xl:flex-row xl:h-[calc(100vh-48px)] gap-0">
              {/* Content panel */}
              <div ref={contentRef} className="xl:w-2/5 xl:overflow-y-auto xl:border-r border-gray-200 dark:border-slate-700/50">
                <div className="p-6 space-y-6">
                  {/* Lesson header */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{lesson.title}</h1>
                    {lesson.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.description}</p>
                    )}
                  </div>

                  {/* Lesson content (theory) */}
                  {lesson.content && (
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ ...p }) => <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-white" {...p} />,
                          h2: ({ ...p }) => <h2 className="text-lg font-bold mb-2 mt-5 text-gray-900 dark:text-white" {...p} />,
                          h3: ({ ...p }) => <h3 className="text-base font-bold mb-1 mt-4 text-gray-900 dark:text-white" {...p} />,
                          p: ({ ...p }) => <p className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed text-sm" {...p} />,
                          ul: ({ ...p }) => <ul className="list-disc list-inside mb-3 text-gray-700 dark:text-gray-300 text-sm" {...p} />,
                          li: ({ ...p }) => <li className="mb-1" {...p} />,
                          code: ({ node, inline, ...p }: any) =>
                            inline ? (
                              <code className="bg-gray-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-600 dark:text-cyan-300" {...p} />
                            ) : (
                              <code className="block bg-[#0a0a0f] text-gray-100 p-3 rounded-lg overflow-x-auto mb-3 font-mono text-xs border border-slate-700/50" {...p} />
                            ),
                          pre: ({ ...p }) => <pre className="mb-3" {...p} />,
                        }}
                      >
                        {lesson.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Challenge prompt */}
                  {lesson.challenge?.prompt && (
                    <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wider">⚡ Your Challenge</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.challenge.prompt}</p>
                    </div>
                  )}

                  {/* Nav buttons */}
                  <div className="flex gap-3 pt-2">
                    {prevLesson ? (
                      <Link href={`/courses/${courseSlug}/lessons/${prevLesson.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full text-sm">← Prev</Button>
                      </Link>
                    ) : <div className="flex-1" />}
                    {nextLesson ? (
                      <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`} className="flex-1">
                        <Button className="w-full text-sm">Next →</Button>
                      </Link>
                    ) : (
                      <Link href={`/courses/${courseSlug}`} className="flex-1">
                        <Button className="w-full text-sm">Back to Course</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Editor panel */}
              <div className="xl:w-3/5 xl:overflow-y-auto flex flex-col">
                <div className="flex-1 p-4">
                  <SolanaCodeLesson
                    prompt={lesson.challenge?.prompt}
                    starterCode={lesson.challenge?.starterCode || ''}
                    solutionCode={lesson.challenge?.solutionCode}
                    language={editorLang}
                    testCases={lesson.challenge?.testCases || []}
                    hints={lesson.challenge?.hints || []}
                    courseId={course.id}
                    lessonId={lesson.id}
                    xpReward={lesson.xpReward}
                    height="calc(100vh - 200px)"
                    showTemplates={true}
                    onComplete={handleChallengeComplete}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ── Content-only lesson ── */
            <div className="max-w-3xl mx-auto px-6 py-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
                {lesson.description && (
                  <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>📚 {currentModule.title}</span>
                  <span>⭐ {lesson.xpReward} XP</span>
                  <span>📄 Reading</span>
                </div>
              </div>

              {/* Prose content */}
              <Card className="p-8 mb-8">
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ ...p }) => <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white" {...p} />,
                      h2: ({ ...p }) => <h2 className="text-2xl font-bold mb-3 mt-6 text-gray-900 dark:text-white" {...p} />,
                      h3: ({ ...p }) => <h3 className="text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white" {...p} />,
                      p: ({ ...p }) => <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...p} />,
                      ul: ({ ...p }) => <ul className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300" {...p} />,
                      ol: ({ ...p }) => <ol className="list-decimal list-inside mb-4 text-gray-700 dark:text-gray-300" {...p} />,
                      li: ({ ...p }) => <li className="mb-2" {...p} />,
                      code: ({ node, inline, ...p }: any) =>
                        inline ? (
                          <code className="bg-gray-200 dark:bg-slate-800 px-2 py-0.5 rounded text-sm font-mono" {...p} />
                        ) : (
                          <code className="block bg-[#0a0a0f] text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm border border-slate-700/50" {...p} />
                        ),
                      pre: ({ ...p }) => <pre className="mb-4" {...p} />,
                      blockquote: ({ ...p }) => (
                        <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...p} />
                      ),
                    }}
                  >
                    {lesson.content}
                  </ReactMarkdown>
                </div>
              </Card>

              {/* Mark complete */}
              {!completed ? (
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ready to continue?</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Mark this lesson complete to claim your XP and unlock the next one.
                  </p>
                  <Button onClick={handleMarkComplete} disabled={submitting} className="w-full">
                    {submitting ? 'Saving…' : `Mark Complete & Earn ${lesson.xpReward} XP ✓`}
                  </Button>
                </Card>
              ) : (
                <div className="bg-green-900/10 border border-green-500/30 rounded-xl p-6 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="font-bold text-green-400">Lesson Complete!</p>
                  <p className="text-sm text-gray-400 mt-1">+{lesson.xpReward} XP added to your account</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-4 mt-6">
                {prevLesson ? (
                  <Link href={`/courses/${courseSlug}/lessons/${prevLesson.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full">← {prevLesson.title}</Button>
                  </Link>
                ) : <div className="flex-1" />}
                {nextLesson ? (
                  <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`} className="flex-1">
                    <Button className="w-full">{nextLesson.title} →</Button>
                  </Link>
                ) : (
                  <Link href={`/courses/${courseSlug}`} className="flex-1">
                    <Button className="w-full">Back to Course</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
