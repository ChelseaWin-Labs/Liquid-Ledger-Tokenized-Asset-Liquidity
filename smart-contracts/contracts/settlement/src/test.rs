use super::*;
use soroban_sdk::{
    testutils::{Address as _, BytesN as _},
    token::StellarAssetClient,
    BytesN, Env,
};

#[test]
fn test_initialize_and_token_whitelist() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SettlementContract);
    let client = SettlementContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token_a = Address::generate(&env);

    client.initialize(&admin, &treasury, &10u32); // 0.1%

    assert_eq!(client.get_fee_bps(), 10u32);
    assert_eq!(client.get_fee_treasury(), treasury);
    assert!(!client.is_token_supported(&token_a));

    client.add_supported_token(&token_a);
    assert!(client.is_token_supported(&token_a));

    client.remove_supported_token(&token_a);
    assert!(!client.is_token_supported(&token_a));
}

#[test]
fn test_atomic_swap_with_fees() {
    let env = Env::default();
    env.mock_all_auths();

    // Register Settlement Contract
    let settlement_id = env.register_contract(None, SettlementContract);
    let settlement_client = SettlementContractClient::new(&env, &settlement_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let maker = Address::generate(&env);
    let taker = Address::generate(&env);

    // Register 2 tokens (SAC / stellar token mock)
    let token_a_admin = Address::generate(&env);
    let token_b_admin = Address::generate(&env);

    let token_a_id = env.register_stellar_asset_contract_v2(token_a_admin);
    let token_b_id = env.register_stellar_asset_contract_v2(token_b_admin);

    let token_a_client = token::Client::new(&env, &token_a_id.address());
    let token_b_client = token::Client::new(&env, &token_b_id.address());

    let token_a_asset = StellarAssetClient::new(&env, &token_a_id.address());
    let token_b_asset = StellarAssetClient::new(&env, &token_b_id.address());

    // Mint tokens to maker and taker
    token_a_asset.mint(&maker, &10_000i128);
    token_b_asset.mint(&taker, &20_000i128);

    // Initialize settlement with 100 bps (1%) fee
    settlement_client.initialize(&admin, &treasury, &100u32);
    settlement_client.add_supported_token(&token_a_id.address());
    settlement_client.add_supported_token(&token_b_id.address());

    let nonce = BytesN::random(&env);

    // Maker offers 1,000 Token A for 2,000 Token B
    settlement_client.atomic_swap(
        &maker,
        &taker,
        &token_a_id.address(),
        &token_b_id.address(),
        &1_000i128,
        &2_000i128,
        &nonce,
    );

    // Verify fee deductions:
    // Maker fee: 1,000 * 1% = 10 Token A to treasury
    // Taker fee: 2,000 * 1% = 20 Token B to treasury
    assert_eq!(token_a_client.balance(&treasury), 10i128);
    assert_eq!(token_b_client.balance(&treasury), 20i128);

    // Net amounts received:
    // Taker receives 1,000 - 10 = 990 Token A
    // Maker receives 2,000 - 20 = 1,980 Token B
    assert_eq!(token_a_client.balance(&taker), 990i128);
    assert_eq!(token_b_client.balance(&maker), 1_980i128);
    assert_eq!(settlement_client.get_swap_count(), 1u32);
}

#[test]
#[should_panic]
fn test_atomic_swap_replay_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let settlement_id = env.register_contract(None, SettlementContract);
    let settlement_client = SettlementContractClient::new(&env, &settlement_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let maker = Address::generate(&env);
    let taker = Address::generate(&env);

    let token_a_admin = Address::generate(&env);
    let token_b_admin = Address::generate(&env);

    let token_a_id = env.register_stellar_asset_contract_v2(token_a_admin);
    let token_b_id = env.register_stellar_asset_contract_v2(token_b_admin);

    let token_a_asset = StellarAssetClient::new(&env, &token_a_id.address());
    let token_b_asset = StellarAssetClient::new(&env, &token_b_id.address());

    token_a_asset.mint(&maker, &10_000i128);
    token_b_asset.mint(&taker, &20_000i128);

    settlement_client.initialize(&admin, &treasury, &0u32);
    settlement_client.add_supported_token(&token_a_id.address());
    settlement_client.add_supported_token(&token_b_id.address());

    let nonce = BytesN::random(&env);

    // First swap succeeds
    settlement_client.atomic_swap(
        &maker,
        &taker,
        &token_a_id.address(),
        &token_b_id.address(),
        &100i128,
        &200i128,
        &nonce,
    );

    // Replay with identical nonce must panic with ReplayNonceUsed
    settlement_client.atomic_swap(
        &maker,
        &taker,
        &token_a_id.address(),
        &token_b_id.address(),
        &100i128,
        &200i128,
        &nonce,
    );
}
