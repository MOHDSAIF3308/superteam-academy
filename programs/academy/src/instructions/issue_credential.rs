use anchor_lang::prelude::*;
use crate::state::Credential;

pub fn issue_credential(
    ctx: Context<IssueCredentialAccounts>,
    track_id: u32,
    level: u32,
) -> Result<()> {
    let _config = &ctx.accounts.config;
    let _enrollment = &ctx.accounts.enrollment;

    // Verify enrollment is completed
    require!(
        _enrollment.completed_at.is_some(),
        crate::errors::AcademyError::EnrollmentNotCompleted
    );

    // In production: Use Light Protocol to create/update compressed account
    // For now: Create regular account for testing

    let credential = &mut ctx.accounts.credential;
    credential.learner = ctx.accounts.user.key();
    credential.track_id = track_id;
    credential.level = level;
    credential.issued_at = Clock::get()?.unix_timestamp;
    credential.metadata_hash = [0u8; 32];

    msg!("✅ Credential issued to {} for track {}", ctx.accounts.user.key(), track_id);

    emit!(CredentialIssuedEvent {
        user: ctx.accounts.user.key(),
        track_id,
        level,
    });

    Ok(())
}

pub struct IssueCredentialAccounts<'info> {
    pub config: Account<'info, crate::state::Config>,
    pub course: Account<'info, crate::state::Course>,
    pub enrollment: Account<'info, crate::state::Enrollment>,
    pub learner: Account<'info, crate::state::LearnerProfile>,
    pub user: UncheckedAccount<'info>,
    pub backend_signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    // In production: Add remaining_accounts for Light Protocol
}

#[event]
pub struct CredentialIssuedEvent {
    pub user: Pubkey,
    pub track_id: u32,
    pub level: u32,
}

pub struct IssueCredential;
