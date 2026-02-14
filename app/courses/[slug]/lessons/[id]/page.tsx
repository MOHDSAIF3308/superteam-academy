'use client'

import { useI18n } from '@/lib/hooks/useI18n'
import { Button, Card, ResizablePanel } from '@/components/ui'
import { ProgressBar } from '@/components/dashboard'
import { ChallengeRunner } from '@/components/editor'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lesson } from '@/lib/types'

interface LessonPageProps {
  params: {
    slug: string
    id: string
  }
}

// Mock lesson data
const MOCK_LESSON: Lesson = {
  id: 'lesson-1',
  title: 'Understanding Solana Accounts',
  description: 'Learn about Solana accounts and how they work',
  type: 'challenge',
  content: `# Understanding Solana Accounts

## What is an Account?

In Solana, an account is a record that stores state on the blockchain. Everything from user balances to program data is stored in accounts.

### Key Characteristics:
- **Address**: Public key that uniquely identifies the account
- **Owner**: Program that has authority over the account
- **Lamports**: Amount of SOL (in lamports) stored in the account
- **Data**: Arbitrary data stored in the account
- **Executable**: Whether the account contains a program

## Your Challenge

Create a simple Rust program that initializes a counter account. The counter should start at 0 and have an increment function.

### Requirements:
1. Define a Counter struct with a count field
2. Add a function to increment the counter
3. Implement default initialization`,
  order: 1,
  xpReward: 50,
  videoUrl: undefined,
  challenge: {
    prompt:
      'Create a Counter program in Rust that can be incremented. Your program should compile and pass all test cases.',
    starterCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        // TODO: Implement increment logic
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
    testCases: [
      {
        input: 'Counter initialized at 0',
        expectedOutput: 'count: 0',
        description: 'Counter should initialize with count = 0',
      },
      {
        input: 'Call increment()',
        expectedOutput: 'count: 1',
        description: 'After increment, count should be 1',
      },
      {
        input: 'Call increment() twice',
        expectedOutput: 'count: 2',
        description: 'After two increments, count should be 2',
      },
    ],
    solutionCode: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count
            .checked_add(1)
            .ok_or(ProgramError::InvalidArgument)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64,
}`,
    hints: [
      'The increment function should increment the counter.count field by 1',
      'Use checked_add to safely add to a u64',
      'The counter account needs to be mutable to update its state',
      'Return Ok(()) on success or an error on failure',
    ],
  },
}

export default function LessonPage({ params }: LessonPageProps) {
  const { t } = useI18n()
  const [lesson, setLesson] = useState<Lesson>(MOCK_LESSON)
  const [completed, setCompleted] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const handleCompleteLesson = () => {
    setCompleted(true)
    // TODO: Call learning progress service
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/courses/${params.slug}`} className="text-neon-cyan hover:text-neon-cyan/70 mb-4 inline-block">
            ← {t('common.back')}
          </Link>

          <h1 className="text-3xl font-display font-bold text-white mb-2">{lesson.title}</h1>
          <p className="text-gray-400 mb-4">{lesson.description}</p>

          <ProgressBar value={40} showLabel />
        </div>

        {/* Split-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 min-h-[calc(100vh-300px)] bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden">
          {lesson.challenge ? (
            <ResizablePanel
              initialLeftWidth={50}
              minLeftWidth={35}
              minRightWidth={35}
              left={
                <div className="overflow-auto p-6 space-y-6 border-r border-terminal-border">
                  {/* Content Card */}
                  <Card>
                    <div className="prose prose-invert max-w-none">
                      <div
                        className="text-gray-300 space-y-4"
                        dangerouslySetInnerHTML={{
                          __html: lesson.content?.replace(/##/g, '<h2 class="text-xl font-bold text-neon-cyan mt-6 mb-2">').replace(/^#/gm, '<h1 class="text-2xl font-bold text-neon-cyan mt-4 mb-2">') || '',
                        }}
                      />
                    </div>

                    {/* Hints */}
                    {lesson.challenge?.hints && (
                      <div className="mt-8 border-t border-terminal-border pt-6">
                        <button
                          onClick={() => setShowHints(!showHints)}
                          className="text-neon-cyan hover:text-neon-cyan/70 font-semibold flex items-center gap-2"
                        >
                          <span>{showHints ? '▼' : '▶'}</span>
                          {t('lesson.hints')}
                        </button>
                        {showHints && (
                          <ul className="mt-4 space-y-2 text-gray-300">
                            {lesson.challenge.hints.map((hint, idx) => (
                              <li key={idx} className="flex gap-3">
                                <span className="text-neon-yellow">→</span>
                                <span>{hint}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Mark Complete */}
                    <div className="mt-8 border-t border-terminal-border pt-6">
                      <Button
                        variant={completed ? 'secondary' : 'primary'}
                        onClick={handleCompleteLesson}
                        className="w-full"
                      >
                        {completed ? '✓ ' : ''}{t('lesson.markComplete')} (+{lesson.xpReward} XP)
                      </Button>
                    </div>
                  </Card>
                </div>
              }
              right={
                <div className="overflow-auto p-6">
                  <ChallengeRunner
                    language="rust"
                    starterCode={lesson.challenge.starterCode}
                    testCases={lesson.challenge.testCases}
                    solutionCode={lesson.challenge.solutionCode}
                    onComplete={() => {
                      handleCompleteLesson();
                    }}
                  />
                </div>
              }
            />
          ) : (
            // Non-challenge lesson layout
            <div className="lg:col-span-4 p-6 overflow-auto space-y-6">
              <Card>
                <div className="prose prose-invert max-w-none">
                  <div
                    className="text-gray-300 space-y-4"
                    dangerouslySetInnerHTML={{
                      __html: lesson.content?.replace(/##/g, '<h2 class="text-xl font-bold text-neon-cyan mt-6 mb-2">').replace(/^#/gm, '<h1 class="text-2xl font-bold text-neon-cyan mt-4 mb-2">') || '',
                    }}
                  />
                </div>

                {/* Mark Complete */}
                <div className="mt-8 border-t border-terminal-border pt-6">
                  <Button
                    variant={completed ? 'secondary' : 'primary'}
                    onClick={handleCompleteLesson}
                    className="w-full"
                  >
                    {completed ? '✓ ' : ''}{t('lesson.markComplete')} (+{lesson.xpReward} XP)
                  </Button>
                </div>
              </Card>

              {/* Navigation */}
              <Card>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    {t('lesson.previousLesson')}
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    {t('lesson.nextLesson')}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
