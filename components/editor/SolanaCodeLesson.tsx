'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { Button } from '@/components/ui'
import { useAwardXP } from '@/lib/hooks/useAwardXP'
import { trackEvent } from '@/lib/analytics'

export type SolanaLanguage = 'rust' | 'typescript' | 'json'

export interface TestCase {
    description: string
    input?: string
    expectedOutput: string
    hidden?: boolean
    validator?: (output: string) => boolean
}

export interface RunResult {
    stdout: string
    stderr: string
    success: boolean
    compileTime?: number
    warnings?: string[]
}

export interface TestResult {
    passed: boolean
    passedCount: number
    totalCount: number
    results: Array<{
        description: string
        passed: boolean
        expected: string
        actual: string
        hidden?: boolean
    }>
}

interface SolanaCodeLessonProps {
    // Challenge data
    prompt?: string
    starterCode: string
    solutionCode?: string
    language?: SolanaLanguage
    testCases?: TestCase[]
    hints?: string[]
    // Metadata
    courseId?: string
    lessonId?: string
    xpReward?: number
    // Layout
    height?: string
    readOnly?: boolean
    showTemplates?: boolean
    onComplete?: (code: string) => void
}

/* ──────────────────────────────────────────────
   Templates for each language
────────────────────────────────────────────── */
const TEMPLATES: Record<string, Record<string, string>> = {
    rust: {
        'Hello World': `fn main() {
    println!("Hello, Solana!");
    let lamports: u64 = 1_000_000_000;
    println!("1 SOL = {} lamports", lamports);
}`,
        'Struct & Impl': `#[derive(Debug)]
struct SolanaAccount {
    pubkey: String,
    lamports: u64,
    owner: String,
}

impl SolanaAccount {
    fn new(pubkey: &str, lamports: u64) -> Self {
        Self {
            pubkey: pubkey.to_string(),
            lamports,
            owner: "11111111111111111111111111111111".to_string(),
        }
    }

    fn balance_in_sol(&self) -> f64 {
        self.lamports as f64 / 1e9
    }
}

fn main() {
    let account = SolanaAccount::new("AbcDef...", 2_000_000_000);
    println!("Account: {:?}", account);
    println!("Balance: {} SOL", account.balance_in_sol());
}`,
        Anchor: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod my_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = data;
        counter.authority = ctx.accounts.user.key();
        msg!("Counter initialized to {}", data);
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.value = counter.value.checked_add(1)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        msg!("Counter incremented to {}", counter.value);
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

impl Counter {
    pub const LEN: usize = 8 + 8 + 32;
}`,
        PDA: `use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWxTWqNLVJjAiJXPanK5Md1MFhm");

#[program]
pub mod pda_example {
    use super::*;

    pub fn create_user_profile(
        ctx: Context<CreateUserProfile>,
        username: String,
    ) -> Result<()> {
        require!(username.len() <= 32, ErrorCode::UsernameTooLong);
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.user.key();
        profile.username = username;
        profile.xp = 0;
        profile.level = 0;
        Ok(())
    }

    pub fn award_xp(ctx: Context<AwardXp>, amount: u64) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.xp = profile.xp.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        profile.level = ((profile.xp as f64 / 100.0).sqrt()) as u64;
        msg!("XP: {}, Level: {}", profile.xp, profile.level);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateUserProfile<'info> {
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

#[derive(Accounts)]
pub struct AwardXp<'info> {
    #[account(mut, has_one = owner)]
    pub profile: Account<'info, UserProfile>,
    pub owner: Signer<'info>,
}

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub username: String,
    pub xp: u64,
    pub level: u64,
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + 4 + 32 + 8 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Username must be 32 characters or less")]
    UsernameTooLong,
    #[msg("Arithmetic overflow")]
    Overflow,
}`,
    },
    typescript: {
        'Wallet Connect': `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Replace with your wallet address
  const walletAddress = new PublicKey("11111111111111111111111111111111");

  const balance = await connection.getBalance(walletAddress);
  console.log(\`Balance: \${balance / LAMPORTS_PER_SOL} SOL\`);

  const slot = await connection.getSlot();
  console.log(\`Current slot: \${slot}\`);
}

main().catch(console.error);`,
        'Send SOL': `import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

async function sendSol(
  connection: Connection,
  from: Keypair,
  to: string,
  amountInSol: number
) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: new PublicKey(to),
      lamports: amountInSol * LAMPORTS_PER_SOL,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
  console.log(\`Transaction: https://explorer.solana.com/tx/\${signature}?cluster=devnet\`);
  return signature;
}`,
        'Anchor Client': `import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";

// Example: Interact with a deployed Anchor program
async function interactWithProgram() {
  const connection = new Connection("https://api.devnet.solana.com");
  const programId = new PublicKey("YOUR_PROGRAM_ID_HERE");

  // Derive PDA for user profile
  const [profilePda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), wallet.publicKey.toBuffer()],
    programId
  );

  // Fetch account data
  const profileAccount = await program.account.userProfile.fetch(profilePda);
  console.log("Username:", profileAccount.username);
  console.log("XP:", profileAccount.xp.toString());
  console.log("Level:", profileAccount.level.toString());

  // Call increment instruction
  const tx = await program.methods
    .increment()
    .accounts({ counter: counterPda, authority: wallet.publicKey })
    .rpc();

  console.log("Transaction:", tx);
}`,
        'Token-2022 XP': `import {
  Connection,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";

async function getXPBalance(
  connection: Connection,
  walletAddress: string,
  xpMintAddress: string
): Promise<number> {
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(xpMintAddress);

  // Get the associated token account for the XP mint
  const ata = await getAssociatedTokenAddress(
    mint,
    wallet,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const account = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
  const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);

  const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
  console.log(\`XP Balance: \${balance}\`);
  console.log(\`Level: \${Math.floor(Math.sqrt(balance / 100))}\`);
  return balance;
}`,
    },
    json: {
        IDL: `{
  "version": "0.1.0",
  "name": "academy_program",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "config", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "createCourse",
      "accounts": [
        { "name": "course", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "courseId", "type": "bytes" },
        { "name": "totalLessons", "type": "u8" },
        { "name": "xpReward", "type": "u64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "xpMint", "type": "publicKey" },
          { "name": "totalCourses", "type": "u64" }
        ]
      }
    }
  ]
}`,
    },
}

/* ──────────────────────────────────────────────
   Status badge colours
────────────────────────────────────────────── */
const statusColour = (s: 'idle' | 'running' | 'success' | 'error') =>
    ({ idle: 'text-gray-400', running: 'text-yellow-400 animate-pulse', success: 'text-green-400', error: 'text-red-400' }[s])

/* ──────────────────────────────────────────────
   Main component
────────────────────────────────────────────── */
export function SolanaCodeLesson({
    prompt,
    starterCode,
    solutionCode,
    language = 'rust',
    testCases = [],
    hints = [],
    courseId,
    lessonId,
    xpReward = 50,
    height = '480px',
    readOnly = false,
    showTemplates = true,
    onComplete,
}: SolanaCodeLessonProps) {
    const editorRef = useRef<any>(null)
    const outputRef = useRef<HTMLDivElement>(null)
    const { awardXP, isAwarding, error: xpError, isAuthenticated } = useAwardXP()

    const [code, setCode] = useState(starterCode)
    const [activeLanguage, setActiveLanguage] = useState<SolanaLanguage>(language)
    const [runResult, setRunResult] = useState<RunResult | null>(null)
    const [testResult, setTestResult] = useState<TestResult | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
    const [showSolution, setShowSolution] = useState(false)
    const [hintsShown, setHintsShown] = useState(0)
    const [xpClaimed, setXpClaimed] = useState(false)
    const [activeTab, setActiveTab] = useState<'output' | 'tests'>('output')

    /* keep editor in sync when starterCode prop changes */
    useEffect(() => {
        setCode(starterCode)
        if (editorRef.current) editorRef.current.setValue(starterCode)
    }, [starterCode])

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor

        /* ── custom Solana dark theme ── */
        monaco.editor.defineTheme('solana-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '22d3ee', fontStyle: 'bold' },
                { token: 'string', foreground: '34d399' },
                { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
                { token: 'number', foreground: 'f59e0b' },
                { token: 'type', foreground: 'a78bfa' },
                { token: 'function', foreground: '60a5fa' },
                { token: 'macro', foreground: 'f472b6' },
            ],
            colors: {
                'editor.background': '#0a0a0f',
                'editor.foreground': '#e2e8f0',
                'editor.lineHighlightBackground': '#1e293b40',
                'editorGutter.background': '#0a0a0f',
                'editorLineNumber.foreground': '#374151',
                'editorLineNumber.activeForeground': '#22d3ee',
                'editor.selectionBackground': '#22d3ee30',
                'editorCursor.foreground': '#22d3ee',
            },
        })
        monaco.editor.setTheme('solana-dark')

        /* ── Rust/Anchor snippets ── */
        if (activeLanguage === 'rust') {
            monaco.languages.registerCompletionItemProvider('rust', {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                provideCompletionItems: (model: any, position: any) => {
                    const snippets = [
                        { label: 'anchor_program', insertText: '#[program]\npub mod ${1:my_program} {\n    use super::*;\n\n    pub fn ${2:initialize}(ctx: Context<${3:Initialize}>) -> Result<()> {\n        Ok(())\n    }\n}', detail: 'Anchor #[program] macro' },
                        { label: 'anchor_derive', insertText: '#[derive(Accounts)]\npub struct ${1:MyAccounts}<\'info> {\n    $0\n}', detail: 'Anchor accounts struct' },
                        { label: 'account_attr', insertText: '#[account(${1:init, payer = user, space = ${2:MyAccount::LEN}})]\npub ${3:my_account}: Account<\'info, ${4:MyAccount}>,', detail: '#[account] attribute' },
                        { label: 'pda_seeds', insertText: 'seeds = [b"${1:seed}", ${2:user}.key().as_ref()],\nbump', detail: 'PDA seeds + bump' },
                        { label: 'error_code', insertText: '#[error_code]\npub enum ${1:ErrorCode} {\n    #[msg("${2:Error message}")]\n    ${3:MyError},\n}', detail: 'Anchor error enum' },
                        { label: 'msg', insertText: 'msg!("${1:message}", ${2:value});', detail: 'Anchor logging macro' },
                        { label: 'require', insertText: 'require!(${1:condition}, ${2:ErrorCode::MyError});', detail: 'Anchor require! macro' },
                        { label: 'checked_add', insertText: '.checked_add(${1:value}).ok_or(${2:error})?', detail: 'Safe arithmetic' },
                    ]
                    return {
                        suggestions: snippets.map(s => ({
                            label: s.label,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: s.insertText,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: s.detail,
                            range: {
                                startLineNumber: position.lineNumber,
                                endLineNumber: position.lineNumber,
                                startColumn: position.column - (model.getWordAtPosition(position)?.word.length || 0),
                                endColumn: position.column,
                            },
                        })),
                    }
                },
            })
        }

        editor.updateOptions({ fontLigatures: true })
    }

    /* ── Run code ── */
    const handleRun = useCallback(async () => {
        const currentCode = editorRef.current?.getValue() || code
        if (!currentCode.trim()) return

        setIsRunning(true)
        setStatus('running')
        setRunResult(null)
        setTestResult(null)
        setActiveTab('output')

        trackEvent('challenge_run', { language: activeLanguage, courseId: courseId || '', lessonId: lessonId || '' })

        try {
            const response = await fetch('/api/code-execution/rust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: currentCode,
                    language: activeLanguage === 'rust' ? 'rust' : 'rust',
                    timeout: 30000,
                }),
            })

            const result: RunResult = await response.json()
            setRunResult(result)
            setStatus(result.success ? 'success' : 'error')

            /* Run tests if we have them */
            if (testCases.length > 0) {
                setActiveTab('tests')
                const testResults = runTestsAgainstOutput(result.stdout, testCases)
                setTestResult(testResults)

                if (testResults.passed) {
                    trackEvent('challenge_passed', { language: activeLanguage, courseId: courseId || '', lessonId: lessonId || '' })
                    if (onComplete) {
                        onComplete(currentCode)
                    }
                }
            }

            /* Scroll output into view */
            setTimeout(() => {
                outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 100)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Execution failed'
            setRunResult({ stdout: '', stderr: msg, success: false })
            setStatus('error')
            setTimeout(() => {
                outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 100)
        } finally {
            setIsRunning(false)
        }
    }, [code, activeLanguage, testCases, onComplete])

    /* ── Keyboard shortcut: Ctrl/Cmd+Enter to run ── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleRun()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [handleRun])

    const handleClaimXP = async () => {
        if (!courseId || !lessonId) return
        const result = await awardXP({ courseId, lessonId, xpAmount: xpReward })
        if (result.success) {
            setXpClaimed(true)
            trackEvent('xp_claimed', { courseId, lessonId, amount: xpReward })
        }
    }

    const insertTemplate = (name: string) => {
        const tmpl = TEMPLATES[activeLanguage]?.[name]
        if (!tmpl || !editorRef.current) return
        editorRef.current.setValue(tmpl)
        setCode(tmpl)
    }

    const resetCode = () => {
        editorRef.current?.setValue(starterCode)
        setCode(starterCode)
        setRunResult(null)
        setTestResult(null)
        setStatus('idle')
    }

    const allTestsPassed = testResult?.passed ?? false

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f] rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl">
            {/* ── Top Toolbar ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e0e18] border-b border-slate-700/50 flex-shrink-0">
                {/* Language tabs */}
                <div className="flex items-center gap-1">
                    {(['rust', 'typescript', 'json'] as SolanaLanguage[]).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setActiveLanguage(lang)}
                            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${activeLanguage === lang
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {lang === 'rust' ? '🦀 Rust/Anchor' : lang === 'typescript' ? '🔷 TypeScript' : '📄 JSON/IDL'}
                        </button>
                    ))}
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${statusColour(status)}`}>
                        {status === 'idle' ? '● ready' : status === 'running' ? '⏳ compiling…' : status === 'success' ? '✓ compiled' : '✗ error'}
                    </span>

                    <button
                        onClick={resetCode}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        title="Reset to starter code"
                    >
                        ↺ reset
                    </button>

                    {showTemplates && TEMPLATES[activeLanguage] && (
                        <select
                            onChange={(e) => { if (e.target.value) insertTemplate(e.target.value) }}
                            className="text-xs bg-slate-800 border border-slate-600 text-gray-300 rounded px-2 py-1 cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>Templates…</option>
                            {Object.keys(TEMPLATES[activeLanguage]).map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-wait text-black font-bold text-xs rounded transition-colors"
                        title="Run (Ctrl+Enter)"
                    >
                        {isRunning ? (
                            <span className="flex items-center gap-1">
                                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Running
                            </span>
                        ) : (
                            <>▶ Run<span className="opacity-60 font-normal">⌘↵</span></>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Editor + Output panel ── */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden" style={{ minHeight: height }}>
                    <Editor
                        height={height}
                        language={activeLanguage === 'rust' ? 'rust' : activeLanguage}
                        value={code}
                        onChange={(val) => setCode(val || '')}
                        onMount={handleEditorMount}
                        theme="solana-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13.5,
                            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                            fontLigatures: true,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 4,
                            insertSpaces: true,
                            readOnly,
                            wordWrap: 'off',
                            padding: { top: 16, bottom: 16 },
                            renderLineHighlight: 'gutter',
                            cursorBlinking: 'smooth',
                            smoothScrolling: true,
                            bracketPairColorization: { enabled: true },
                            guides: { bracketPairs: true, indentation: true },
                            suggest: { showKeywords: true, showSnippets: true },
                            quickSuggestions: { other: true, comments: false, strings: false },
                            scrollbar: { useShadows: false, verticalScrollbarSize: 6, horizontalScrollbarSize: 6, alwaysConsumeMouseWheel: false },
                            overviewRulerLanes: 0,
                            glyphMargin: false,
                            lineDecorationsWidth: 4,
                        }}
                    />
                </div>

                {/* ── Output / Tests Panel ── */}
                {(runResult || testResult) && (
                    <div ref={outputRef} className="border-t border-slate-700/50 bg-[#0e0e18] flex-shrink-0">
                        {/* Tab header */}
                        <div className="flex items-center gap-0 border-b border-slate-700/50 px-4">
                            {(['output', 'tests'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab
                                        ? 'border-cyan-400 text-cyan-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {tab === 'output' ? '📤 Output' : `🧪 Tests ${testResult ? `(${testResult.passedCount}/${testResult.totalCount})` : ''}`}
                                </button>
                            ))}

                            {runResult && (
                                <span className={`ml-auto text-xs font-mono ${runResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {runResult.success ? '✓ success' : '✗ failed'} {runResult.compileTime ? `(${runResult.compileTime}ms)` : ''}
                                </span>
                            )}
                        </div>

                        <div className="p-4 space-y-2">
                            {activeTab === 'output' && runResult && (
                                <>
                                    {runResult.warnings && runResult.warnings.length > 0 && (
                                        <div className="text-xs font-mono text-yellow-400 bg-yellow-900/10 border border-yellow-800/30 rounded p-3 space-y-0.5">
                                            <p className="font-semibold mb-1">⚠ Warnings</p>
                                            {runResult.warnings.map((w, i) => <p key={i}>{w}</p>)}
                                        </div>
                                    )}
                                    {runResult.stderr && (
                                        <pre className="text-xs font-mono text-red-300 bg-red-900/10 border border-red-800/30 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
                                            {runResult.stderr}
                                        </pre>
                                    )}
                                    {runResult.stdout && (
                                        <pre className="text-xs font-mono text-green-300 bg-green-900/10 border border-green-800/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                                            {runResult.stdout}
                                        </pre>
                                    )}
                                    {!runResult.stdout && !runResult.stderr && (
                                        <p className="text-xs text-gray-500 italic">(no output)</p>
                                    )}
                                </>
                            )}

                            {activeTab === 'tests' && testResult && (
                                <div className="space-y-2">
                                    {testResult.results.map((r, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-3 p-3 rounded text-xs border ${r.passed
                                                ? 'bg-green-900/10 border-green-800/30'
                                                : 'bg-red-900/10 border-red-800/30'
                                                }`}
                                        >
                                            <span className={`font-bold mt-0.5 ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                                                {r.passed ? '✓' : '✗'}
                                            </span>
                                            <div className="flex-1 space-y-1">
                                                <p className={r.passed ? 'text-green-300' : 'text-red-300'}>{r.description}</p>
                                                {!r.passed && !r.hidden && (
                                                    <>
                                                        <p className="text-gray-400">Expected: <span className="font-mono text-cyan-300">{r.expected}</span></p>
                                                        <p className="text-gray-400">Got: <span className="font-mono text-orange-300">{r.actual || '(empty)'}</span></p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Hints row ── */}
            {hints.length > 0 && (
                <div className="border-t border-slate-700/50 px-4 py-2.5 bg-[#0e0e18] flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={() => setHintsShown(Math.min(hintsShown + 1, hints.length))}
                        disabled={hintsShown >= hints.length}
                        className="text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        💡 {hintsShown < hints.length ? `Show hint (${hintsShown + 1}/${hints.length})` : 'All hints shown'}
                    </button>
                    {hintsShown > 0 && (
                        <span className="text-xs text-yellow-200 bg-yellow-900/20 border border-yellow-800/30 rounded px-3 py-1 font-mono">
                            {hints[hintsShown - 1]}
                        </span>
                    )}
                </div>
            )}

            {/* ── Success / Claim XP banner ── */}
            {allTestsPassed && !xpClaimed && (
                <div className="border-t border-green-500/30 bg-gradient-to-r from-green-900/20 to-cyan-900/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎉</span>
                        <div>
                            <p className="text-sm font-bold text-green-400">All tests passed!</p>
                            <p className="text-xs text-gray-400">Earn +{xpReward} XP for this challenge</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {solutionCode && (
                            <button
                                onClick={() => setShowSolution(!showSolution)}
                                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                {showSolution ? 'Hide' : 'View'} solution
                            </button>
                        )}
                        {isAuthenticated ? (
                            <Button
                                onClick={handleClaimXP}
                                disabled={isAwarding || xpClaimed}
                                variant="primary"
                                size="sm"
                            >
                                {isAwarding ? 'Claiming…' : `Claim +${xpReward} XP`}
                            </Button>
                        ) : (
                            <p className="text-xs text-yellow-400">Sign in to claim XP</p>
                        )}
                    </div>
                </div>
            )}

            {xpClaimed && (
                <div className="border-t border-cyan-500/30 bg-cyan-900/10 px-4 py-2 text-center flex-shrink-0">
                    <p className="text-xs text-cyan-400 font-semibold">✅ XP claimed! Keep going → next lesson</p>
                </div>
            )}

            {/* Solution viewer */}
            {showSolution && solutionCode && (
                <div className="border-t border-slate-700/50">
                    <div className="px-4 py-2 bg-slate-800/50 text-xs text-gray-400 font-semibold">Solution</div>
                    <Editor
                        height="200px"
                        language={activeLanguage}
                        value={solutionCode}
                        theme="solana-dark"
                        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false }}
                    />
                </div>
            )}

            {/* XP claim error */}
            {xpError && (
                <div className="border-t border-red-500/30 bg-red-900/10 px-4 py-2 text-xs text-red-400 flex-shrink-0">
                    ⚠ {xpError}
                </div>
            )}
        </div>
    )
}

/* ──────────────────────────────────────────────
   Test runner — checks stdout against expected
────────────────────────────────────────────── */
function runTestsAgainstOutput(stdout: string, testCases: TestCase[]): TestResult {
    const outputLines = stdout.trim().split('\n').map(l => l.trim())
    const results = testCases.map((tc, idx) => {
        const actual = outputLines[idx] ?? ''
        let passed: boolean

        if (tc.validator) {
            passed = tc.validator(stdout)
        } else {
            passed = actual.includes(tc.expectedOutput) || stdout.includes(tc.expectedOutput)
        }

        return {
            description: tc.description,
            passed,
            expected: tc.expectedOutput,
            actual,
            hidden: tc.hidden,
        }
    })

    const passedCount = results.filter(r => r.passed).length
    return {
        passed: passedCount === testCases.length,
        passedCount,
        totalCount: testCases.length,
        results,
    }
}
