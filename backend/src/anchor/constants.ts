import { PublicKey } from '@solana/web3.js';

// Program ID (string version)
export const PROGRAM_ID_STRING = 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf';

// Program ID (PublicKey version)
export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

// Token Standards (using valid public keys)
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export const MPL_CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');

// PDA Seed Prefixes
export const PDA_SEEDS = {
  CONFIG: 'config',
  COURSE: 'course',
  ENROLLMENT: 'enrollment',
  MINTER_ROLE: 'minter_role',
  ACHIEVEMENT_TYPE: 'achievement_type',
  ACHIEVEMENT_RECEIPT: 'achievement_receipt',
};

// XP Configuration
export const XP_DECIMALS = 0; // Non-decimal XP tokens
export const MAX_LESSONS = 256; // 4 × 64-bit slots = 256 lesson bitmap
