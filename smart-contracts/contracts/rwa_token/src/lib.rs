#![no_std]

pub mod errors;

#[cfg(test)]
mod test;

use errors::RwaTokenError;
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Symbol,
};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Decimals,
    AssetType,
    Balance(Address),
    TotalSupply,
}

#[contract]
pub struct RwaTokenContract;

#[contractimpl]
impl RwaTokenContract {
    /// Initialize the RWA token contract with metadata and initial supply allocated to admin
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
        initial_supply: i128,
        asset_type: Symbol,
    ) -> Result<(), RwaTokenError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(RwaTokenError::AlreadyInitialized);
        }

        if initial_supply < 0 {
            return Err(RwaTokenError::InvalidAmount);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().set(&DataKey::Decimals, &decimals);
        env.storage().instance().set(&DataKey::AssetType, &asset_type);
        env.storage().instance().set(&DataKey::TotalSupply, &initial_supply);

        if initial_supply > 0 {
            let admin_key = DataKey::Balance(admin.clone());
            env.storage().persistent().set(&admin_key, &initial_supply);
            env.storage().persistent().extend_ttl(&admin_key, 100_000, 500_000);
        }

        env.storage().instance().extend_ttl(100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "init"), admin),
            (symbol, initial_supply),
        );

        Ok(())
    }

    pub fn name(env: Env) -> Result<String, RwaTokenError> {
        env.storage()
            .instance()
            .get(&DataKey::Name)
            .ok_or(RwaTokenError::NotInitialized)
    }

    pub fn symbol(env: Env) -> Result<String, RwaTokenError> {
        env.storage()
            .instance()
            .get(&DataKey::Symbol)
            .ok_or(RwaTokenError::NotInitialized)
    }

    pub fn decimals(env: Env) -> Result<u32, RwaTokenError> {
        env.storage()
            .instance()
            .get(&DataKey::Decimals)
            .ok_or(RwaTokenError::NotInitialized)
    }

    pub fn asset_type(env: Env) -> Result<Symbol, RwaTokenError> {
        env.storage()
            .instance()
            .get(&DataKey::AssetType)
            .ok_or(RwaTokenError::NotInitialized)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        let key = DataKey::Balance(id);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), RwaTokenError> {
        from.require_auth();

        if amount <= 0 {
            return Err(RwaTokenError::InvalidAmount);
        }

        let from_key = DataKey::Balance(from.clone());
        let from_balance: i128 = env.storage().persistent().get(&from_key).unwrap_or(0);

        if from_balance < amount {
            return Err(RwaTokenError::InsufficientBalance);
        }

        let to_key = DataKey::Balance(to.clone());
        let to_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0);

        env.storage()
            .persistent()
            .set(&from_key, &(from_balance - amount));
        env.storage().persistent().set(&to_key, &(to_balance + amount));

        env.storage().persistent().extend_ttl(&from_key, 100_000, 500_000);
        env.storage().persistent().extend_ttl(&to_key, 100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "transfer"), from, to),
            amount,
        );

        Ok(())
    }

    pub fn mint(
        env: Env,
        to: Address,
        amount: i128,
    ) -> Result<(), RwaTokenError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RwaTokenError::NotInitialized)?;
        admin.require_auth();

        if amount <= 0 {
            return Err(RwaTokenError::InvalidAmount);
        }

        let to_key = DataKey::Balance(to.clone());
        let current_balance: i128 = env.storage().persistent().get(&to_key).unwrap_or(0);
        let current_supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);

        let new_supply = current_supply
            .checked_add(amount)
            .ok_or(RwaTokenError::InvalidAmount)?;

        env.storage()
            .persistent()
            .set(&to_key, &(current_balance + amount));
        env.storage().instance().set(&DataKey::TotalSupply, &new_supply);

        env.storage().persistent().extend_ttl(&to_key, 100_000, 500_000);
        env.storage().instance().extend_ttl(100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "mint"), to),
            (amount, new_supply),
        );

        Ok(())
    }

    pub fn burn(
        env: Env,
        from: Address,
        amount: i128,
    ) -> Result<(), RwaTokenError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RwaTokenError::NotInitialized)?;
        admin.require_auth();
        from.require_auth();

        if amount <= 0 {
            return Err(RwaTokenError::InvalidAmount);
        }

        let from_key = DataKey::Balance(from.clone());
        let current_balance: i128 = env.storage().persistent().get(&from_key).unwrap_or(0);

        if current_balance < amount {
            return Err(RwaTokenError::InsufficientBalance);
        }

        let current_supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);

        let new_supply = current_supply - amount;

        env.storage()
            .persistent()
            .set(&from_key, &(current_balance - amount));
        env.storage().instance().set(&DataKey::TotalSupply, &new_supply);

        env.storage().persistent().extend_ttl(&from_key, 100_000, 500_000);
        env.storage().instance().extend_ttl(100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "burn"), from),
            (amount, new_supply),
        );

        Ok(())
    }

    pub fn set_admin(
        env: Env,
        new_admin: Address,
    ) -> Result<(), RwaTokenError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RwaTokenError::NotInitialized)?;
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
        env.storage().instance().extend_ttl(100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "set_admin"), admin),
            new_admin,
        );

        Ok(())
    }
}
