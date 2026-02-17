use anchor_lang::prelude::*;

/// Global program configuration
#[account]
pub struct Config {
    /// Authority that can update this config
    pub authority: Pubkey,
    /// Backend keypair that signs lesson completion TXs
    pub backend_signer: Pubkey,
    /// Current XP token mint (fungible)
    pub current_mint: Pubkey,
    /// Current season number
    pub current_season: u32,
    /// Whether current season is closed
    pub season_closed: bool,
    /// Minimum course completions before creator gets reward
    pub min_completions_for_reward: u32,
    /// Daily XP cap per learner
    pub daily_xp_cap: u32,
    /// Bump seed for PDA
    pub bump: u8,
}

/// Course information
#[account]
pub struct Course {
    /// Unique course identifier
    pub course_id: String,
    /// Course title
    pub title: String,
    /// Category/track (e.g., "solana-basics")
    pub category: String,
    /// Number of lessons in course
    pub lesson_count: u8,
    /// XP earned per learner on completion
    pub xp_reward: u32,
    /// Creator reward XP when someone completes
    pub creator_reward_xp: u32,
    /// Difficulty level (1-5)
    pub difficulty: u8,
    /// Course creator
    pub creator: Pubkey,
    /// Is course active for enrollment
    pub is_active: bool,
    /// Total learners who completed
    pub total_completions: u32,
    /// Course version (for updates)
    pub version: u32,
    /// Optional prerequisite course
    pub prerequisite: Option<Pubkey>,
    /// Bump seed
    pub bump: u8,
}

/// Learner profile - tracks XP, streaks, achievements
#[account]
pub struct LearnerProfile {
    /// Learner's wallet address
    pub user: Pubkey,
    /// Total XP earned (across all seasons)
    pub total_xp: u32,
    /// Current season XP (resets each season)
    pub season_xp: u32,
    /// XP earned today (for daily cap)
    pub xp_earned_today: u32,
    /// Last activity date (for daily reset)
    pub last_activity: i64,
    /// Current learning streak (days)
    pub current_streak: u16,
    /// Longest streak (days)
    pub longest_streak: u16,
    /// Streak freeze count (free passes)
    pub streak_freezes: u8,
    /// Bitmap of unlocked achievements (8 bytes = 64 slots)
    pub achievement_flags: u64,
    /// Total courses completed
    pub courses_completed: u32,
    /// Whether learner has referrer
    pub has_referrer: bool,
    /// Number of referrals made
    pub referral_count: u16,
    /// Account bump
    pub bump: u8,
}

/// Enrollment in a course
#[account]
pub struct Enrollment {
    /// Course enrolled in
    pub course_id: String,
    /// Learner
    pub user: Pubkey,
    /// Bitmap of completed lessons (1 bit per lesson, up to 256)
    pub lesson_flags: [u8; 32],
    /// When all lessons completed (None if incomplete)
    pub completed_at: Option<i64>,
    /// Course version when enrolled (for tracking updates)
    pub enrolled_version: u32,
    /// Bump seed
    pub bump: u8,
}

impl Enrollment {
    /// Check if lesson is completed
    pub fn is_lesson_complete(&self, index: u8) -> bool {
        let byte_index = index / 8;
        let bit_index = index % 8;
        if byte_index >= 32 {
            return false;
        }
        (self.lesson_flags[byte_index as usize] >> bit_index) & 1 == 1
    }

    /// Mark lesson as complete
    pub fn set_lesson_complete(&mut self, index: u8) -> Result<()> {
        let byte_index = index / 8;
        let bit_index = index % 8;
        if byte_index >= 32 {
            return Err(error!(crate::errors::AcademyError::InvalidLessonIndex));
        }
        self.lesson_flags[byte_index as usize] |= 1 << bit_index;
        Ok(())
    }

    /// Count completed lessons
    pub fn completed_count(&self) -> u32 {
        let mut count = 0u32;
        for byte in &self.lesson_flags {
            count += byte.count_ones();
        }
        count
    }
}

/// Compressed account placeholder for credentials (Light Protocol)
/// In production, this would be stored on Solana via Light Protocol
#[account]
pub struct Credential {
    /// Learner who earned credential
    pub learner: Pubkey,
    /// Track ID (e.g., "solana-basics" = track 1)
    pub track_id: u32,
    /// Current level of credential
    pub level: u32,
    /// When issued
    pub issued_at: i64,
    /// Metadata hash (for Arweave)
    pub metadata_hash: [u8; 32],
    /// Bump seed
    pub bump: u8,
}

#[error_code]
pub enum ProgramError {
    #[msg("Generic error")]
    Generic = 1,
}
