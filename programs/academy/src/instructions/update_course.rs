use anchor_lang::prelude::*;
use crate::state::Course;

pub fn update_course(
    ctx: Context<UpdateCourseAccounts>,
    title: Option<String>,
    lesson_count: Option<u8>,
    xp_reward: Option<u32>,
) -> Result<()> {
    let course = &mut ctx.accounts.course;

    if let Some(t) = title {
        course.title = t;
    }
    if let Some(lc) = lesson_count {
        course.lesson_count = lc;
    }
    if let Some(xp) = xp_reward {
        course.xp_reward = xp;
    }
    
    course.version = course.version.checked_add(1)
        .ok_or(crate::errors::AcademyError::ArithmeticOverflow)?;

    msg!("✅ Course updated: {}", course.course_id);
    Ok(())
}

pub struct UpdateCourse;

#[derive(Accounts)]
pub struct UpdateCourseAccounts<'info> {
    #[account(mut)]
    pub course: Account<'info, Course>,
    pub authority: Signer<'info>,
}
