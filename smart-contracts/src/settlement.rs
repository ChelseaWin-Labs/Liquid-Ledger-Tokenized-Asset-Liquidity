use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Map, String, i128};
use soroban_token_sdk::TokenInterface;

#[contract]
pub struct SettlementEngine;

#[contractimpl]
impl SettlementEngine {
    /// Initialize the settlement engine
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        
        // Initialize supported tokens list
        let supported_tokens: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&Symbol::new(&env, "supported_tokens"), &supported_tokens);
        
        // Initialize settlement fee (0.1% = 100 basis points)
        env.storage().instance().set(&Symbol::new(&env, "settlement_fee_bps"), &100u32);
    }

    /// Add supported token (admin only)
    pub fn add_supported_token(env: Env, token_address: Address) {
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        admin.require_auth();
        
        let mut supported_tokens: Vec<Address> = env.storage().instance()
            .get(&Symbol::new(&env, "supported_tokens"))
            .unwrap_or(Vec::new(&env));
        
        // Check if token is already supported
        for token in supported_tokens.iter() {
            if token == token_address {
                return; // Already supported
            }
        }
        
        supported_tokens.push_back(token_address);
        env.storage().instance().set(&Symbol::new(&env, "supported_tokens"), &supported_tokens);
    }

    /// Remove supported token (admin only)
    pub fn remove_supported_token(env: Env, token_address: Address) {
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        admin.require_auth();
        
        let mut supported_tokens: Vec<Address> = env.storage().instance()
            .get(&Symbol::new(&env, "supported_tokens"))
            .unwrap_or(Vec::new(&env));
        
        // Remove token from supported list
        let mut new_tokens = Vec::new(&env);
        for token in supported_tokens.iter() {
            if token != token_address {
                new_tokens.push_back(token);
            }
        }
        
        env.storage().instance().set(&Symbol::new(&env, "supported_tokens"), &new_tokens);
    }

    /// Execute atomic swap between two tokens
    pub fn atomic_swap(
        env: Env,
        maker: Address,
        taker: Address,
        maker_token: Address,
        taker_token: Address,
        maker_amount: i128,
        taker_amount: i128,
    ) {
        // Verify tokens are supported
        self.verify_token_supported(&env, &maker_token);
        self.verify_token_supported(&env, &taker_token);

        // Authorize both parties
        maker.require_auth();
        taker.require_auth();

        // Calculate settlement fees
        let settlement_fee_bps: u32 = env.storage().instance()
            .get(&Symbol::new(&env, "settlement_fee_bps"))
            .unwrap_or(100u32);
        
        let maker_fee = (maker_amount * settlement_fee_bps as i128) / 10000;
        let taker_fee = (taker_amount * settlement_fee_bps as i128) / 10000;

        // Get token contracts
        let maker_token_contract = TokenInterface::new(&env, &maker_token);
        let taker_token_contract = TokenInterface::new(&env, &taker_token);

        // Execute the swap
        maker_token_contract.transfer(&maker, &taker, maker_amount - maker_fee);
        taker_token_contract.transfer(&taker, &maker, taker_amount - taker_fee);

        // Transfer fees to admin
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        if maker_fee > 0 {
            maker_token_contract.transfer(&maker, &admin, maker_fee);
        }
        if taker_fee > 0 {
            taker_token_contract.transfer(&taker, &admin, taker_fee);
        }

        // Emit settlement event
        env.events().publish(
            (Symbol::new(&env, "atomic_swap"), maker, taker),
            (maker_token, taker_token, maker_amount, taker_amount)
        );
    }

    /// Multi-asset settlement for debit card transactions
    pub fn card_settlement(
        env: Env,
        user: Address,
        merchant: Address,
        asset_token: Address,
        amount: i128,
        merchant_address: Address, // Stellar address for merchant
    ) {
        // Verify token is supported
        self.verify_token_supported(&env, &asset_token);

        // Authorize user
        user.require_auth();

        // Calculate settlement fee
        let settlement_fee_bps: u32 = env.storage().instance()
            .get(&Symbol::new(&env, "settlement_fee_bps"))
            .unwrap_or(100u32);
        
        let fee = (amount * settlement_fee_bps as i128) / 10000;

        // Get token contract
        let token_contract = TokenInterface::new(&env, &asset_token);

        // Transfer tokens to merchant
        token_contract.transfer(&user, &merchant_address, amount - fee);

        // Transfer fee to admin
        if fee > 0 {
            let admin: Address = env.storage().instance()
                .get(&Symbol::new(&env, "admin"))
                .expect("Admin not set");
            token_contract.transfer(&user, &admin, fee);
        }

        // Emit card settlement event
        env.events().publish(
            (Symbol::new(&env, "card_settlement"), user, merchant),
            (asset_token, amount, fee)
        );
    }

    /// Batch settlement for multiple transactions
    pub fn batch_settlement(
        env: Env,
        settlements: Vec<(Address, Address, Address, i128)>, // (user, merchant, token, amount)
    ) {
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        admin.require_auth();

        let settlement_fee_bps: u32 = env.storage().instance()
            .get(&Symbol::new(&env, "settlement_fee_bps"))
            .unwrap_or(100u32);

        for settlement in settlements.iter() {
            let (user, merchant, token_address, amount) = settlement;
            
            // Verify token is supported
            self.verify_token_supported(&env, &token_address);

            // Calculate fee
            let fee = (amount * settlement_fee_bps as i128) / 10000;

            // Get token contract
            let token_contract = TokenInterface::new(&env, &token_address);

            // Execute settlement
            token_contract.transfer(&user, &merchant, amount - fee);
            
            if fee > 0 {
                token_contract.transfer(&user, &admin, fee);
            }
        }

        // Emit batch settlement event
        env.events().publish(
            Symbol::new(&env, "batch_settlement"),
            settlements.len()
        );
    }

    /// Get supported tokens
    pub fn get_supported_tokens(env: Env) -> Vec<Address> {
        env.storage().instance()
            .get(&Symbol::new(&env, "supported_tokens"))
            .unwrap_or(Vec::new(&env))
    }

    /// Get settlement fee in basis points
    pub fn get_settlement_fee(env: Env) -> u32 {
        env.storage().instance()
            .get(&Symbol::new(&env, "settlement_fee_bps"))
            .unwrap_or(100u32)
    }

    /// Update settlement fee (admin only)
    pub fn update_settlement_fee(env: Env, new_fee_bps: u32) {
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        admin.require_auth();
        
        env.storage().instance().set(&Symbol::new(&env, "settlement_fee_bps"), &new_fee_bps);
    }

    /// Verify token is supported
    fn verify_token_supported(&self, env: &Env, token_address: &Address) {
        let supported_tokens: Vec<Address> = env.storage().instance()
            .get(&Symbol::new(env, "supported_tokens"))
            .unwrap_or(Vec::new(env));
        
        let mut is_supported = false;
        for token in supported_tokens.iter() {
            if token == token_address {
                is_supported = true;
                break;
            }
        }
        
        if !is_supported {
            panic!("Token not supported for settlement");
        }
    }
}
