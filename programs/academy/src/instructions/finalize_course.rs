use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use crate::state::{Config, Course, Enrollment, LearnerProfile};

pub fn finalize_course(ctx: Context<FinalizeCourseAccounts>) -> Result<()> {
    let config = &ctx.accounts.config;
    let course = &mut ctx.accounts.course;
    let enrollment = &mut ctx.accounts.enrollment;
    let learner = &mut ctx.accounts.learner;

    // Verify backend signer
    require!(
        ctx.accounts.backend_signer.key() == config.backend_signer,
        crate::errors::AcademyError::BackendSignerMismatch
    );

    // Check all lessons completed
    let completed = enrollment.completed_count();
    require!(
        completed == course.lesson_count as u32,
        crate::errors::AcademyError::CourseNotFullyCompleted
    );

    // Check not already finalized
    require!(
        enrollment.completed_at.is_none(),
        crate::errors::AcademyError::CourseAlreadyFinalized
    );

    // Mark as completed
    enrollment.completed_at = Some(Clock::get()?.unix_timestamp);

    // Reward creator if minimum completions met
    if course.total_completions >= config.min_completions_for_reward {
        // In production, mint creator reward XP
        learner.total_xp = learner.total_xp
            .checked_add(course.creator_reward_xp)
            .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;
    }

    // Increment total completions
    course.total_completions = course.total_completions
        .checked_add(1)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;

    // Increment learner course count
    learner.courses_completed = learner.courses_completed
        .checked_add(1)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;

    msg!("✅ Course finalized for {}", ctx.accounts.user.key());

    emit!(CourseFinalizedEvent {
        user: ctx.accounts.user.key(),
        course_id: course.course_id.clone(),
    });

    Ok(())
}

pub struct FinalizeCourseAccounts<'info> {
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub course: Account<'info, Course>,
    #[account(mut)]
    pub enrollment: Account<'info, Enrollment>,
    #[account(mut)]
    pub learner: Account<'info, LearnerProfile>,
    #[account(mut)]
    pub xp_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_xp_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub creator_xp_ata: Account<'info, TokenAccount>,
    pub user: UncheckedAccount<'info>,
    pub creator: UncheckedAccount<'info>,
    pub backend_signer: Signer<'info>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[event]
pub struct CourseFinalizedEvent {
    pub user: Pubkey,
    pub course_id: String,
}

pub struct FinalizeCourse;
