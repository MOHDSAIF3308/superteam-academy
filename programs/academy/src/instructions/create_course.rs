use anchor_lang::prelude::*;
use crate::state::Course;

pub fn create_course(
    ctx: Context<CreateCourseAccounts>,
    course_id: String,
    title: String,
    lesson_count: u8,
    xp_reward: u32,
    creator_reward_xp: u32,
    difficulty: u8,
    _category: String,
    _prerequisites: Vec<String>,
) -> Result<()> {
    let course = &mut ctx.accounts.course;
    
    course.course_id = course_id.clone();
    course.title = title;
    course.lesson_count = lesson_count;
    course.xp_reward = xp_reward;
    course.creator_reward_xp = creator_reward_xp;
    course.difficulty = difficulty;
    course.creator = ctx.accounts.authority.key();
    course.is_active = true;
    course.total_completions = 0;
    course.version = 1;
    course.bump = ctx.bumps.course;

    msg!("✅ Course created: {}", course_id);
    Ok(())
}

pub struct CreateCourse;

#[derive(Accounts)]
pub struct CreateCourseAccounts<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 500,
        seeds = [b"course", course_id.as_bytes()],
        bump
    )]
    pub course: Account<'info, Course>,
    pub config: Account<'info, crate::state::Config>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
