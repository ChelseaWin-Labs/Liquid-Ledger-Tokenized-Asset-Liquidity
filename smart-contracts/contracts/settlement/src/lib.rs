#![no_std]
#![allow(clippy::too_many_arguments)]

pub mod errors;

#[cfg(test)]
mod test;

use errors::SettlementError;
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, BytesN, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    FeeTreasury,
    FeeBps,
    SupportedToken(Address),
    ConsumedNonce(BytesN<32>),
    SwapCount,
}

#[contract]
pub struct SettlementContract;

#[contractimpl]
impl SettlementContract {
    /// Initialize settlement contract with admin, protocol fee treasury, and fee bps (e.g. 10 = 0.1%)
    pub fn initialize(
        env: Env,
        admin: Address,
        fee_treasury: Address,
        fee_bps: u32,
    ) -> Result<(), SettlementError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(SettlementError::AlreadyInitialized);
        }

        if fee_bps > 1000 {
            // Cap fee at max 10% (1000 bps)
            return Err(SettlementError::InvalidFee);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::FeeTreasury, &fee_treasury);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::SwapCount, &0u32);
        env.storage().instance().extend_ttl(100_000, 500_000);

        Ok(())
    }

    pub fn add_supported_token(env: Env, token: Address) -> Result<(), SettlementError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(SettlementError::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::SupportedToken(token.clone());
        env.storage().persistent().set(&key, &true);
        env.storage()
            .persistent()
            .extend_ttl(&key, 100_000, 500_000);

        env.events()
            .publish((Symbol::new(&env, "token_added"), admin), token);

        Ok(())
    }

    pub fn remove_supported_token(env: Env, token: Address) -> Result<(), SettlementError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(SettlementError::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::SupportedToken(token.clone());
        env.storage().persistent().remove(&key);

        env.events()
            .publish((Symbol::new(&env, "token_removed"), admin), token);

        Ok(())
    }

    pub fn is_token_supported(env: Env, token: Address) -> bool {
        let key = DataKey::SupportedToken(token);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    pub fn set_fee_bps(env: Env, fee_bps: u32) -> Result<(), SettlementError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(SettlementError::NotInitialized)?;
        admin.require_auth();

        if fee_bps > 1000 {
            return Err(SettlementError::InvalidFee);
        }

        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().extend_ttl(100_000, 500_000);

        Ok(())
    }

    pub fn get_fee_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0)
    }

    pub fn get_fee_treasury(env: Env) -> Result<Address, SettlementError> {
        env.storage()
            .instance()
            .get(&DataKey::FeeTreasury)
            .ok_or(SettlementError::NotInitialized)
    }

    pub fn get_swap_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::SwapCount)
            .unwrap_or(0)
    }

    /// Execute atomic swap between maker and taker across tokenized assets with replay protection
    pub fn atomic_swap(
        env: Env,
        maker: Address,
        taker: Address,
        maker_token: Address,
        taker_token: Address,
        maker_amount: i128,
        taker_amount: i128,
        nonce: BytesN<32>,
    ) -> Result<(), SettlementError> {
        maker.require_auth();
        taker.require_auth();

        if maker_amount <= 0 || taker_amount <= 0 {
            return Err(SettlementError::InvalidAmount);
        }

        // 1. Replay protection check
        let nonce_key = DataKey::ConsumedNonce(nonce.clone());
        if env.storage().persistent().has(&nonce_key) {
            return Err(SettlementError::ReplayNonceUsed);
        }

        // 2. Token whitelist validation
        if !Self::is_token_supported(env.clone(), maker_token.clone())
            || !Self::is_token_supported(env.clone(), taker_token.clone())
        {
            return Err(SettlementError::UnsupportedToken);
        }

        let fee_treasury: Address = env
            .storage()
            .instance()
            .get(&DataKey::FeeTreasury)
            .ok_or(SettlementError::NotInitialized)?;
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);

        // 3. Fee calculation
        let maker_fee = if fee_bps > 0 {
            (maker_amount * fee_bps as i128) / 10_000
        } else {
            0
        };

        let taker_fee = if fee_bps > 0 {
            (taker_amount * fee_bps as i128) / 10_000
        } else {
            0
        };

        let maker_net = maker_amount - maker_fee;
        let taker_net = taker_amount - taker_fee;

        let maker_token_client = token::Client::new(&env, &maker_token);
        let taker_token_client = token::Client::new(&env, &taker_token);

        // 4. Collect protocol fees if applicable
        if maker_fee > 0 {
            maker_token_client.transfer(&maker, &fee_treasury, &maker_fee);
        }
        if taker_fee > 0 {
            taker_token_client.transfer(&taker, &fee_treasury, &taker_fee);
        }

        // 5. Atomic exchange of principal amounts
        maker_token_client.transfer(&maker, &taker, &maker_net);
        taker_token_client.transfer(&taker, &maker, &taker_net);

        // 6. Consume nonce to prevent replay
        env.storage().persistent().set(&nonce_key, &true);
        env.storage()
            .persistent()
            .extend_ttl(&nonce_key, 100_000, 500_000);

        // 7. Update swap metrics
        let mut swaps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::SwapCount)
            .unwrap_or(0);
        swaps += 1;
        env.storage().instance().set(&DataKey::SwapCount, &swaps);
        env.storage().instance().extend_ttl(100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "swap_executed"), maker, taker),
            (maker_token, taker_token, maker_amount, taker_amount, nonce),
        );

        Ok(())
    }
}
