use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use errors::AcademyError;
use state::*;

declare_id!("2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw");

#[program]
pub mod academy {
    use super::*;

    /// Initialize the program - creates Config PDA
    pub fn initialize(
        ctx: Context<Initialize>,
        authority: Pubkey,
        min_completions_for_reward: u32,
    ) -> Result<()> {
        instructions::initialize(ctx, authority, min_completions_for_reward)
    }

    /// Create a new XP token season
    pub fn create_season(
        ctx: Context<CreateSeason>,
        season: u32,
        metadata_uri: String,
    ) -> Result<()> {
        instructions::create_season(ctx, season, metadata_uri)
    }

    /// Close old XP token season
    pub fn close_season(ctx: Context<CloseSeason>) -> Result<()> {
        instructions::close_season(ctx)
    }

    /// Update config (authority only)
    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_authority: Option<Pubkey>,
        new_backend_signer: Option<Pubkey>,
        min_completions_for_reward: Option<u32>,
    ) -> Result<()> {
        instructions::update_config(ctx, new_authority, new_backend_signer, min_completions_for_reward)
    }

    /// Create a new course
    pub fn create_course(
        ctx: Context<CreateCourse>,
        course_id: String,
        title: String,
        lesson_count: u8,
        xp_reward: u32,
        creator_reward_xp: u32,
        difficulty: u8,
        category: String,
        prerequisites: Vec<String>,
    ) -> Result<()> {
        instructions::create_course(
            ctx,
            course_id,
            title,
            lesson_count,
            xp_reward,
            creator_reward_xp,
            difficulty,
            category,
            prerequisites,
        )
    }

    /// Update course metadata
    pub fn update_course(
        ctx: Context<UpdateCourse>,
        title: Option<String>,
        lesson_count: Option<u8>,
        xp_reward: Option<u32>,
    ) -> Result<()> {
        instructions::update_course(ctx, title, lesson_count, xp_reward)
    }

    /// Initialize learner profile
    pub fn init_learner(ctx: Context<InitLearner>) -> Result<()> {
        instructions::init_learner(ctx)
    }

    /// Enroll in a course
    pub fn enroll(ctx: Context<Enroll>, course_id: String) -> Result<()> {
        instructions::enroll(ctx, course_id)
    }

    /// Unenroll from a course
    pub fn unenroll(ctx: Context<Unenroll>) -> Result<()> {
        instructions::unenroll(ctx)
    }

    /// Complete a lesson (backend signer)
    pub fn complete_lesson(
        ctx: Context<CompleteLesson>,
        lesson_index: u8,
        xp_amount: u32,
    ) -> Result<()> {
        instructions::complete_lesson(ctx, lesson_index, xp_amount)
    }

    /// Finalize course - verify all lessons done, reward creator
    pub fn finalize_course(ctx: Context<FinalizeCourse>) -> Result<()> {
        instructions::finalize_course(ctx)
    }

    /// Issue credential (compressed account via Light Protocol)
    pub fn issue_credential(
        ctx: Context<IssueCredential>,
        track_id: u32,
        level: u32,
    ) -> Result<()> {
        instructions::issue_credential(ctx, track_id, level)
    }

    /// Claim achievement - unlock achievement badge
    pub fn claim_achievement(
        ctx: Context<ClaimAchievement>,
        achievement_id: u8,
        xp_bonus: u32,
    ) -> Result<()> {
        instructions::claim_achievement(ctx, achievement_id, xp_bonus)
    }

    /// Award streak freeze - prevent streak loss
    pub fn award_streak_freeze(ctx: Context<AwardStreakFreeze>) -> Result<()> {
        instructions::award_streak_freeze(ctx)
    }

    /// Register referral relationship
    pub fn register_referral(ctx: Context<RegisterReferral>) -> Result<()> {
        instructions::register_referral(ctx)
    }

    /// Close enrollment account (reclaims rent)
    pub fn close_enrollment(ctx: Context<CloseEnrollmentAccounts>) -> Result<()> {
        instructions::close_enrollment(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 200,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, state::Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateSeason<'info> {
    #[account(mut)]
    pub config: Account<'info, state::Config>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = config,
    )]
    pub xp_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseSeason<'info> {
    #[account(mut)]
    pub config: Account<'info, state::Config>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub config: Account<'info, state::Config>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateCourse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 500,
        seeds = [b"course", course_id.as_bytes()],
        bump
    )]
    pub course: Account<'info, state::Course>,
    pub config: Account<'info, state::Config>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCourse<'info> {
    #[account(mut)]
    pub course: Account<'info, state::Course>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitLearner<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 300,
        seeds = [b"learner", user.key().as_ref()],
        bump
    )]
    pub learner: Account<'info, state::LearnerProfile>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Enroll<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 200,
        seeds = [b"enrollment", course_id.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub enrollment: Account<'info, state::Enrollment>,
    pub course: Account<'info, state::Course>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unenroll<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"enrollment", course_id.as_bytes(), user.key().as_ref()],
        bump = enrollment.bump
    )]
    pub enrollment: Account<'info, state::Enrollment>,
    pub course: Account<'info, state::Course>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteLesson<'info> {
    #[account(mut)]
    pub config: Account<'info, state::Config>,
    pub course: Account<'info, state::Course>,
    #[account(mut)]
    pub enrollment: Account<'info, state::Enrollment>,
    #[account(mut)]
    pub learner: Account<'info, state::LearnerProfile>,
    #[account(mut)]
    pub xp_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub user_xp_ata: Account<'info, anchor_spl::token::TokenAccount>,
    pub user: UncheckedAccount<'info>,
    pub backend_signer: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct FinalizeCourse<'info> {
    #[account(mut)]
    pub config: Account<'info, state::Config>,
    #[account(mut)]
    pub course: Account<'info, state::Course>,
    #[account(mut)]
    pub enrollment: Account<'info, state::Enrollment>,
    #[account(mut)]
    pub learner: Account<'info, state::LearnerProfile>,
    #[account(mut)]
    pub xp_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub user_xp_ata: Account<'info, anchor_spl::token::TokenAccount>,
    #[account(mut)]
    pub creator_xp_ata: Account<'info, anchor_spl::token::TokenAccount>,
    pub user: UncheckedAccount<'info>,
    pub creator: UncheckedAccount<'info>,
    pub backend_signer: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct IssueCredential<'info> {
    pub config: Account<'info, state::Config>,
    pub course: Account<'info, state::Course>,
    pub enrollment: Account<'info, state::Enrollment>,
    pub learner: Account<'info, state::LearnerProfile>,
    pub user: UncheckedAccount<'info>,
    pub backend_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimAchievement<'info> {
    #[account(mut)]
    pub config: Account<'info, state::Config>,
    #[account(mut)]
    pub learner: Account<'info, state::LearnerProfile>,
    #[account(mut)]
    pub xp_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub user_xp_ata: Account<'info, anchor_spl::token::TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct AwardStreakFreeze<'info> {
    #[account(mut)]
    pub learner: Account<'info, state::LearnerProfile>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegisterReferral<'info> {
    #[account(mut)]
    pub referrer: Account<'info, state::LearnerProfile>,
    #[account(mut)]
    pub referred: Account<'info, state::LearnerProfile>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseEnrollment<'info> {
    #[account(
        mut,
        close = user,
        seeds = [b"enrollment", course_id.as_bytes(), user.key().as_ref()],
        bump = enrollment.bump
    )]
    pub enrollment: Account<'info, state::Enrollment>,
    pub user: Signer<'info>,
}
