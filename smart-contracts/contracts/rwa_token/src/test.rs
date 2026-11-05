use super::*;
use soroban_sdk::{testutils::Address as _, Env, String, Symbol};

#[test]
fn test_initialize_and_metadata() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, RwaTokenContract);
    let client = RwaTokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let name = String::from_str(&env, "Liquid Ledger Gold");
    let symbol = String::from_str(&env, "GLD");
    let asset_type = Symbol::new(&env, "gold");

    client.initialize(
        &admin,
        &name,
        &symbol,
        &7u32,
        &10_000_000_000_000i128,
        &asset_type,
    );

    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.decimals(), 7u32);
    assert_eq!(client.asset_type(), asset_type);
    assert_eq!(client.total_supply(), 10_000_000_000_000i128);
    assert_eq!(client.balance(&admin), 10_000_000_000_000i128);
}

#[test]
fn test_transfer_and_balances() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, RwaTokenContract);
    let client = RwaTokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    client.initialize(
        &admin,
        &String::from_str(&env, "Liquid Ledger Treasury"),
        &String::from_str(&env, "UST"),
        &7u32,
        &500_000i128,
        &Symbol::new(&env, "treasury"),
    );

    client.transfer(&admin, &user1, &200_000i128);
    assert_eq!(client.balance(&admin), 300_000i128);
    assert_eq!(client.balance(&user1), 200_000i128);

    client.transfer(&user1, &user2, &50_000i128);
    assert_eq!(client.balance(&user1), 150_000i128);
    assert_eq!(client.balance(&user2), 50_000i128);
}

#[test]
fn test_mint_and_burn() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, RwaTokenContract);
    let client = RwaTokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(
        &admin,
        &String::from_str(&env, "Liquid Ledger Fund"),
        &String::from_str(&env, "DIV"),
        &7u32,
        &1_000_000i128,
        &Symbol::new(&env, "fund"),
    );

    client.mint(&user, &250_000i128);
    assert_eq!(client.balance(&user), 250_000i128);
    assert_eq!(client.total_supply(), 1_250_000i128);

    client.burn(&user, &100_000i128);
    assert_eq!(client.balance(&user), 150_000i128);
    assert_eq!(client.total_supply(), 1_150_000i128);
}

#[test]
#[should_panic]
fn test_transfer_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, RwaTokenContract);
    let client = RwaTokenContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(
        &admin,
        &String::from_str(&env, "Liquid Ledger Gold"),
        &String::from_str(&env, "GLD"),
        &7u32,
        &100i128,
        &Symbol::new(&env, "gold"),
    );

    client.transfer(&user, &admin, &500i128);
}
