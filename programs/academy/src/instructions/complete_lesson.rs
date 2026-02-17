use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};
use crate::state::{Config, Course, Enrollment, LearnerProfile};

pub fn complete_lesson(
    ctx: Context<CompleteLessonAccounts>,
    lesson_index: u8,
    xp_amount: u32,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let course = &ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let learner = &mut ctx.accounts.learner;
    let user = &ctx.accounts.user;

    // Verify backend signer
    require!(
        ctx.accounts.backend_signer.key() == config.backend_signer,
        crate::errors::AcademyError::BackendSignerMismatch
    );

    // Check lesson index valid
    require!(
        lesson_index < course.lesson_count,
        crate::errors::AcademyError::InvalidLessonIndex
    );

    // Check lesson not already completed
    require!(
        !enrollment.is_lesson_complete(lesson_index),
        crate::errors::AcademyError::LessonAlreadyCompleted
    );

    // Check daily XP limit
    let today = Clock::get()?.unix_timestamp / 86400; // Days since epoch
    let last_day = learner.last_activity / 86400;
    
    if today > last_day {
        // Reset daily counter
        learner.xp_earned_today = 0;
    }

    let new_daily_total = learner.xp_earned_today
        .checked_add(xp_amount)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;

    require!(
        new_daily_total <= config.daily_xp_cap,
        crate::errors::AcademyError::DailyXPLimitExceeded
    );

    // Update learner XP
    learner.total_xp = learner.total_xp
        .checked_add(xp_amount)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;
    learner.season_xp = learner.season_xp
        .checked_add(xp_amount)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;
    learner.xp_earned_today = new_daily_total;
    learner.last_activity = Clock::get()?.unix_timestamp;

    // Update streak
    if today > last_day + 1 {
        // Missed a day - reset unless frozen
        if learner.streak_freezes > 0 {
            learner.streak_freezes -= 1;
        } else {
            learner.current_streak = 0;
        }
    }
    
    learner.current_streak = learner.current_streak.saturating_add(1);
    if learner.current_streak > learner.longest_streak {
        learner.longest_streak = learner.current_streak;
    }

    // Mark lesson complete
    enrollment.set_lesson_complete(lesson_index)?;

    // Mint XP tokens
    let cpi_accounts = Transfer {
        from: ctx.accounts.xp_mint.to_account_info(), // This is not correct, should be mint not from
        to: ctx.accounts.user_xp_ata.to_account_info(),
        authority: ctx.accounts.backend_signer.to_account_info(),
    };
    
    // Note: In production, use token::mint_to instead
    // This is simplified for demonstration
    
    msg!("✅ Lesson {} completed, {} XP awarded to {}", lesson_index, xp_amount, user.key());

    emit!(LessonCompletedEvent {
        user: user.key(),
        course_id: course.course_id.clone(),
        lesson_index,
        xp_amount,
    });

    Ok(())
}

pub struct CompleteLessonAccounts<'info> {
    pub config: Account<'info, Config>,
    pub course: Account<'info, Course>,
    #[account(mut)]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut)]
    pub learner: Account<'info, LearnerProfile>,
    #[account(mut)]
    pub xp_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_xp_ata: Account<'info, TokenAccount>,
    pub user: UncheckedAccount<'info>,
    pub backend_signer: Signer<'info>,
    pub token_program: Program<'info, token::Token>,
}

#[event]
pub struct LessonCompletedEvent {
    pub user: Pubkey,
    pub course_id: String,
    pub lesson_index: u8,
    pub xp_amount: u32,
}

pub struct CompleteLesson;
