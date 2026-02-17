use anchor_lang::prelude::*;
use crate::state::Config;

pub fn update_config(
    ctx: Context<UpdateConfigAccounts>,
    new_authority: Option<Pubkey>,
    new_backend_signer: Option<Pubkey>,
    min_completions_for_reward: Option<u32>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if let Some(authority) = new_authority {
        config.authority = authority;
    }
    if let Some(signer) = new_backend_signer {
        config.backend_signer = signer;
    }
    if let Some(min) = min_completions_for_reward {
        config.min_completions_for_reward = min;
    }

    msg!("✅ Config updated");
    Ok(())
}

pub struct UpdateConfig;

#[derive(Accounts)]
pub struct UpdateConfigAccounts<'info> {
    #[account(mut)]
    pub config: Account<'info, Config>,
    pub authority: Signer<'info>,
}
