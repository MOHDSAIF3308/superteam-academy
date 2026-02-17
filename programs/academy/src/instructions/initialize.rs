use anchor_lang::prelude::*;
use crate::state::Config;

pub fn initialize(
    ctx: Context<Initialize>,
    authority: Pubkey,
    min_completions_for_reward: u32,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = authority;
    config.backend_signer = authority; // Initially set to authority
    config.current_season = 0;
    config.season_closed = false;
    config.min_completions_for_reward = min_completions_for_reward;
    config.daily_xp_cap = 1000;
    config.bump = ctx.bumps.config;

    msg!("✅ Program initialized with authority: {}", authority);
    Ok(())
}

pub struct Initialize;

#[derive(Accounts)]
pub struct InitializeAccounts<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 200,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
