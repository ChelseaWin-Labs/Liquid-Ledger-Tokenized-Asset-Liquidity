use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Map, String};
use soroban_token_sdk::{Token, TokenInterface};

#[contract]
pub struct TokenizedAsset;

#[contractimpl]
impl TokenizedAsset {
    /// Initialize the tokenized asset contract
    /// 
    /// # Arguments
    /// * `admin` - The admin address that can manage the token
    /// * `name` - The name of the tokenized asset
    /// * `symbol` - The symbol of the tokenized asset
    /// * `decimals` - The number of decimal places
    /// * `total_supply` - The total supply of the token
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
        total_supply: i128,
    ) {
        let token = Token::new(env.clone());
        
        // Store token metadata
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        env.storage().instance().set(&Symbol::new(&env, "name"), &name);
        env.storage().instance().set(&Symbol::new(&env, "symbol"), &symbol);
        env.storage().instance().set(&Symbol::new(&env, "decimals"), &decimals);
        
        // Initialize token with total supply to admin
        token.initialize(&admin, total_supply);
        
        // Store asset type (gold, treasury, fund)
        let asset_type = Self::determine_asset_type(&symbol);
        env.storage().instance().set(&Symbol::new(&env, "asset_type"), &asset_type);
    }

    /// Determine asset type based on symbol
    fn determine_asset_type(symbol: &String) -> String {
        let symbol_str = symbol.to_string().to_lowercase();
        if symbol_str.contains("gold") || symbol_str.contains("gld") {
            String::from_str(&symbol_str.env(), "gold")
        } else if symbol_str.contains("treasury") || symbol_str.contains("ust") {
            String::from_str(&symbol_str.env(), "treasury")
        } else {
            String::from_str(&symbol_str.env(), "fund")
        }
    }

    /// Get token metadata
    pub fn metadata(env: Env) -> Map<Symbol, String> {
        let mut metadata = Map::new(&env);
        
        metadata.set(Symbol::new(&env, "name"), 
            env.storage().instance().get(&Symbol::new(&env, "name"))
                .unwrap_or(String::from_str(&env, "Unknown")));
        metadata.set(Symbol::new(&env, "symbol"), 
            env.storage().instance().get(&Symbol::new(&env, "symbol"))
                .unwrap_or(String::from_str(&env, "UNK")));
        metadata.set(Symbol::new(&env, "asset_type"), 
            env.storage().instance().get(&Symbol::new(&env, "asset_type"))
                .unwrap_or(String::from_str(&env, "fund")));
        
        let decimals: u32 = env.storage().instance()
            .get(&Symbol::new(&env, "decimals"))
            .unwrap_or(7);
        metadata.set(Symbol::new(&env, "decimals"), 
            String::from_str(&env, &decimals.to_string()));
        
        metadata
    }

    /// Mint new tokens (admin only)
    pub fn mint(env: Env, to: Address, amount: i128) {
        // Verify admin
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        admin.require_auth();
        
        let token = Token::new(env.clone());
        token.mint(&to, amount);
    }

    /// Burn tokens (admin only)
    pub fn burn(env: Env, from: Address, amount: i128) {
        // Verify admin
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        admin.require_auth();
        from.require_auth();
        
        let token = Token::new(env.clone());
        token.burn(&from, amount);
    }

    /// Transfer tokens
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        let token = Token::new(env.clone());
        token.transfer(&from, &to, amount);
    }

    /// Get balance of an address
    pub fn balance(env: Env, id: Address) -> i128 {
        let token = Token::new(env.clone());
        token.balance(&id)
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> i128 {
        let token = Token::new(env.clone());
        token.total_supply()
    }

    /// Get allowance
    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let token = Token::new(env.clone());
        token.allowance(&from, &spender)
    }

    /// Approve spending
    pub fn approve(env: Env, from: Address, spender: Address, amount: i128) {
        let token = Token::new(env.clone());
        token.approve(&from, &spender, amount);
    }

    /// Transfer from (allowance-based)
    pub fn transfer_from(env: Env, spender: Address, from: Address, to: Address, amount: i128) {
        let token = Token::new(env.clone());
        token.transfer_from(&spender, &from, &to, amount);
    }

    /// Get admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set")
    }

    /// Update admin (admin only)
    pub fn update_admin(env: Env, new_admin: Address) {
        let admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        admin.require_auth();
        
        env.storage().instance().set(&Symbol::new(&env, "admin"), &new_admin);
    }
}
