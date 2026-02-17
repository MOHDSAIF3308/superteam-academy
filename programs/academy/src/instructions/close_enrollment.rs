use anchor_lang::prelude::*;

pub fn close_enrollment(_ctx: Context<CloseEnrollmentAccounts>) -> Result<()> {
    msg!("✅ Enrollment closed and rent reclaimed");
    Ok(())
}

pub struct CloseEnrollmentAccounts<'info> {
    #[account(
        mut,
        close = user
    )]
    pub enrollment: Account<'info, crate::state::Enrollment>,
    pub user: Signer<'info>,
}

pub struct CloseEnrollment;
