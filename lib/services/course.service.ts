import { Course, Enrollment, LearningPath } from '../types'

export interface CourseService {
  getCourses(filters?: {
    difficulty?: string
    track?: string
    search?: string
  }): Promise<Course[]>
  getCourse(slug: string): Promise<Course | null>
  getLearningPaths(): Promise<LearningPath[]>
  enrollCourse(userId: string, courseId: string): Promise<void>
  getEnrollments(userId: string): Promise<Enrollment[]>
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | null>
  submitChallenge(
    userId: string,
    courseId: string,
    lessonId: string,
    code: string
  ): Promise<{ success: boolean; xpAwarded: number; message: string }>
  getLesson(courseId: string, lessonId: string): Promise<any>
}

const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    slug: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    description:
      'Master the core concepts of Solana blockchain. Learn about accounts, programs, transactions, and how to build on Solana.',
    difficulty: 'beginner',
    duration: 180,
    track: 'Core',
    xpReward: 500,
    enrollmentCount: 1250,
    tags: ['solana', 'blockchain', 'basics', 'web3'],
    instructor: {
      name: 'Solana Academy',
      avatar: 'https://api.solana.com/logo.png',
    },
    modules: [
      {
        id: 'module-1',
        courseId: 'course-1',
        title: 'Introduction to Solana',
        description: 'Get started with Solana basics and understand the blockchain',
        order: 1,
        lessons: [
          {
            id: 'lesson-1',
            title: 'What is Solana?',
            description: 'Understanding blockchain fundamentals and Solana',
            type: 'content',
            content: `# What is Solana?

Solana is a high-performance blockchain designed for speed, security, and scalability.

## Key Features

### 1. **Speed**
- Processes up to 65,000 transactions per second
- Average block time of 400ms
- Instant finality

### 2. **Low Costs**
- Transaction fees typically $0.00025
- Affordable for all users
- Scalable for enterprise applications

### 3. **Decentralized**
- Proof of History (PoH) consensus
- 1000+ validators
- Community-driven development

## Why Solana?

Solana combines the best of both worlds:
- **Speed** of centralized systems
- **Security** of decentralized networks
- **Affordability** for mass adoption

## Getting Started

To start building on Solana, you need to understand:
1. Accounts and their structure
2. Programs (smart contracts)
3. Transactions and instructions
4. The Solana CLI and tools

Let's dive deeper into each concept!`,
            order: 1,
            xpReward: 50,
          },
          {
            id: 'lesson-2',
            title: 'Accounts & State',
            description: 'Understanding Solana accounts and how state is stored',
            type: 'content',
            content: `# Accounts & State in Solana

In Solana, everything is an account. Understanding accounts is fundamental to building on Solana.

## What is an Account?

An account is a record on the Solana blockchain that stores:
- **Lamports** (SOL balance)
- **Data** (program state)
- **Owner** (program that can modify the account)
- **Executable** (whether it's a program)

## Account Structure

\`\`\`
Account {
  lamports: u64,           // Balance in lamports (1 SOL = 1 billion lamports)
  data: Vec<u8>,          // Account data
  owner: Pubkey,          // Program that owns this account
  executable: bool,       // Is this a program?
  rent_epoch: u64,        // Rent epoch
}
\`\`\`

## Types of Accounts

### 1. **System Accounts**
- Hold SOL tokens
- Can be owned by any program
- Example: User wallets

### 2. **Program Accounts**
- Contain program code
- Executable flag is true
- Immutable after deployment

### 3. **Data Accounts**
- Store program state
- Owned by a program
- Can be modified by the program

## Account Ownership

- Only the owner program can modify an account's data
- Anyone can send lamports to an account
- Accounts must pay rent to stay on the blockchain

## Rent System

Accounts must maintain a minimum balance to avoid being garbage collected:
- Rent is calculated based on account size
- Rent-exempt accounts never pay rent
- Minimum rent-exempt balance ≈ 2 years of rent

This is a key concept for efficient Solana development!`,
            order: 2,
            xpReward: 75,
          },
          {
            id: 'lesson-3',
            title: 'Programs & Instructions',
            description: 'Learn about Solana programs and how to interact with them',
            type: 'content',
            content: `# Programs & Instructions

Programs are the smart contracts of Solana. They process instructions and modify account state.

## What is a Program?

A program is:
- Deployed on-chain code
- Stateless (state is stored in accounts)
- Executable by anyone
- Deterministic (same input = same output)

## Program Structure

\`\`\`rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    msg,
    pubkey::Pubkey,
};

#[entrypoint]
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana!");
    Ok(())
}
\`\`\`

## Instructions

An instruction tells a program what to do:
- Program ID (which program to call)
- Accounts (which accounts to use)
- Data (instruction parameters)

## Instruction Flow

1. Client creates instruction
2. Client signs transaction
3. Transaction sent to network
4. Validators execute program
5. Program modifies accounts
6. Changes are committed

## Best Practices

- Keep programs simple and focused
- Validate all inputs
- Check account ownership
- Handle errors gracefully
- Optimize for performance

Programs are the core of Solana development!`,
            order: 3,
            xpReward: 100,
          },
        ],
      },
      {
        id: 'module-2',
        courseId: 'course-1',
        title: 'Transactions & Signing',
        description: 'Master transactions and cryptographic signing',
        order: 2,
        lessons: [
          {
            id: 'lesson-4',
            title: 'Transactions Explained',
            description: 'Understanding Solana transactions',
            type: 'content',
            content: `# Transactions in Solana

Transactions are the primary way to interact with the Solana blockchain.

## Transaction Structure

A transaction contains:
- **Signatures** (cryptographic signatures from signers)
- **Message** (instructions and accounts)
- **Recent Blockhash** (prevents replay attacks)

## Message Structure

\`\`\`
Message {
  header: MessageHeader,
  account_keys: Vec<Pubkey>,
  recent_blockhash: Hash,
  instructions: Vec<CompiledInstruction>,
}
\`\`\`

## Transaction Lifecycle

1. **Creation** - Build transaction with instructions
2. **Signing** - Sign with private keys
3. **Submission** - Send to RPC node
4. **Confirmation** - Wait for validators to process
5. **Finalization** - Transaction is permanent

## Transaction Fees

- Base fee: 5,000 lamports per signature
- Compute budget: Additional fees for computation
- Priority fees: Optional, for faster processing

## Best Practices

- Always include recent blockhash
- Sign with correct keypairs
- Handle transaction failures gracefully
- Monitor transaction status

Transactions are how you interact with Solana!`,
            order: 1,
            xpReward: 75,
          },
          {
            id: 'lesson-5',
            title: 'Cryptographic Signing',
            description: 'Learn about Ed25519 signatures and key management',
            type: 'content',
            content: `# Cryptographic Signing

Solana uses Ed25519 for digital signatures. Understanding signing is crucial for security.

## Ed25519 Overview

- **Algorithm**: Edwards-curve Digital Signature Algorithm
- **Key Size**: 256-bit keys
- **Signature Size**: 64 bytes
- **Security**: Post-quantum resistant

## Key Pairs

Every Solana account has:
- **Public Key** (64 bytes) - Shared with everyone
- **Secret Key** (32 bytes) - Keep private!

## Signing Process

1. Create message to sign
2. Hash the message
3. Sign with private key
4. Produce 64-byte signature
5. Include signature in transaction

## Verification

Anyone can verify a signature:
- Public key + message + signature
- Proves the holder of private key signed it
- Cannot forge without private key

## Security Best Practices

- Never share private keys
- Use hardware wallets for large amounts
- Rotate keys periodically
- Use secure key derivation
- Enable multi-signature for important accounts

Cryptographic signing is the foundation of blockchain security!`,
            order: 2,
            xpReward: 100,
          },
        ],
      },
      {
        id: 'module-3',
        courseId: 'course-1',
        title: 'Building Your First Program',
        description: 'Create a simple Solana program',
        order: 3,
        lessons: [
          {
            id: 'lesson-6',
            title: 'Hello World Program',
            description: 'Build your first Solana program',
            type: 'challenge',
            content: `# Build Your First Program

Let's create a simple "Hello World" program on Solana!

## Challenge

Write a Solana program that:
1. Accepts an instruction
2. Logs "Hello, Solana!" to the program logs
3. Returns success

## Starter Code

\`\`\`rust
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    msg,
    pubkey::Pubkey,
    program_result::ProgramResult,
};

#[entrypoint]
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // TODO: Implement your program here
    
    Ok(())
}
\`\`\`

## Requirements

- Log "Hello, Solana!" using msg!()
- Return Ok(()) on success
- Handle any errors gracefully

## Testing

Your program will be tested with:
- Valid instruction data
- Empty accounts array
- Various input scenarios

Good luck! 🚀`,
            order: 1,
            xpReward: 150,
            challenge: {
              prompt: 'Write a Solana program that logs "Hello, Solana!"',
              starterCode: `use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    msg,
    pubkey::Pubkey,
    program_result::ProgramResult,
};

#[entrypoint]
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana!");
    Ok(())
}`,
              testCases: [
                {
                  input: '{}',
                  expectedOutput: 'Hello, Solana!',
                  description: 'Should log Hello, Solana!',
                },
              ],
              hints: [
                'Use msg!() macro to log messages',
                'Return Ok(()) for success',
                'The program should be simple and straightforward',
              ],
            },
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'course-2',
    slug: 'anchor-development',
    title: 'Anchor Development',
    description: 'Master Anchor framework for building Solana programs efficiently.',
    difficulty: 'intermediate',
    duration: 240,
    track: 'Development',
    xpReward: 1000,
    enrollmentCount: 890,
    tags: ['anchor', 'rust', 'programming'],
    instructor: {
      name: 'Solana Academy',
    },
    modules: [
      {
        id: 'module-4',
        courseId: 'course-2',
        title: 'Anchor Basics',
        order: 1,
        lessons: [
          {
            id: 'lesson-7',
            title: 'Setting up Anchor',
            type: 'content',
            content: '# Anchor Setup\n\nAnchor is a framework for Rust-based Solana programs...',
            order: 1,
            xpReward: 20,
          },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-1',
    title: 'Solana Fundamentals',
    description: 'Start your Solana journey from the basics',
    courses: ['course-1'],
    icon: '🚀',
    order: 1,
  },
  {
    id: 'path-2',
    title: 'Smart Contract Developer',
    description: 'Build production-ready programs on Solana',
    courses: ['course-1', 'course-2'],
    icon: '⚙️',
    order: 2,
  },
]

export class LocalCourseService implements CourseService {
  private enrollments = new Map<string, Enrollment[]>()
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  async getCourses(filters?: {
    difficulty?: string
    track?: string
    search?: string
  }): Promise<Course[]> {
    let courses = [...MOCK_COURSES]

    if (filters?.difficulty) {
      courses = courses.filter((c) => c.difficulty === filters.difficulty)
    }

    if (filters?.track) {
      courses = courses.filter((c) => c.track === filters.track)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
      )
    }

    return courses
  }

  async getCourse(slug: string): Promise<Course | null> {
    return MOCK_COURSES.find((c) => c.slug === slug) || null
  }

  async getLearningPaths(): Promise<LearningPath[]> {
    return LEARNING_PATHS
  }

  async enrollCourse(userId: string, courseId: string): Promise<void> {
    const userEnrollments = this.enrollments.get(userId) || []

    if (!userEnrollments.find((e) => e.courseId === courseId)) {
      userEnrollments.push({
        id: `enrollment-${userId}-${courseId}`,
        userId,
        courseId,
        enrolledAt: new Date(),
        completionPercentage: 0,
        lastAccessedAt: new Date(),
      })

      this.enrollments.set(userId, userEnrollments)
    }
  }

  async getEnrollments(userId: string): Promise<Enrollment[]> {
    return this.enrollments.get(userId) || []
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    const enrollments = await this.getEnrollments(userId)
    return enrollments.find((e) => e.courseId === courseId) || null
  }

  async submitChallenge(
    userId: string,
    courseId: string,
    lessonId: string,
    code: string
  ): Promise<{ success: boolean; xpAwarded: number; message: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, code }),
        }
      )

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      return {
        success: false,
        xpAwarded: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  async getLesson(courseId: string, lessonId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('Failed to load lesson:', error)
      return null
    }
  }
}

let courseServiceInstance: LocalCourseService | null = null

export function getCourseServiceInstance(): LocalCourseService {
  if (!courseServiceInstance) {
    courseServiceInstance = new LocalCourseService()
  }
  return courseServiceInstance
}

export async function getAllCourses(): Promise<Course[]> {
  return getCourseServiceInstance().getCourses()
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  return getCourseServiceInstance().getEnrollments(userId)
}
