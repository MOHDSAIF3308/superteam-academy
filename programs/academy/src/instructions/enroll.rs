use anchor_lang::prelude::*;
use crate::state::{Course, Enrollment};

pub fn enroll(ctx: Context<EnrollAccounts>, course_id: String) -> Result<()> {
    let course = &ctx.accounts.course;
    require!(course.is_active, crate::errors::AcademyError::CourseNotActive);

    let enrollment = &mut ctx.accounts.enrollment;
    
    enrollment.course_id = course_id;
    enrollment.user = ctx.accounts.user.key();
    enrollment.lesson_flags = [0u8; 32];
    enrollment.completed_at = None;
    enrollment.enrolled_version = course.version;
    enrollment.bump = ctx.bumps.enrollment;

    msg!("✅ User enrolled in course");
    emit!(EnrolledEvent {
        user: ctx.accounts.user.key(),
        course_id: course.course_id.clone(),
    });

    Ok(())
}

pub struct Enroll;

#[derive(Accounts)]
pub struct EnrollAccounts<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 200,
        seeds = [b"enrollment", course_id.as_bytes(), user.key().as_ref()],
        bump
    )]
    pub enrollment: Account<'info, Enrollment>,
    pub course: Account<'info, Course>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct EnrolledEvent {
    pub user: Pubkey,
    pub course_id: String,
}
