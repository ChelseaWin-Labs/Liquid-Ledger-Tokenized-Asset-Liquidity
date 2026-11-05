use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String, Symbol,
};

#[test]
fn test_governance_lifecycle_success() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, GovernanceContract);
    let client = GovernanceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let proposer = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let target = Address::generate(&env);

    // Initialize with 100 ledgers voting period, 1,000 votes quorum
    client.initialize(&admin, &100u32, &1_000i128);

    let proposal_id = client.create_proposal(
        &proposer,
        &String::from_str(&env, "Add Gold Reserves"),
        &String::from_str(&env, "Expand tokenized physical gold reserves by 500 oz"),
        &target,
        &Symbol::new(&env, "mint_reserves"),
    );

    assert_eq!(proposal_id, 1u32);

    // Voter 1 casts 800 votes FOR
    client.vote(&voter1, &proposal_id, &true, &800i128);
    assert!(client.has_voted(&proposal_id, &voter1));

    // Voter 2 casts 400 votes AGAINST
    client.vote(&voter2, &proposal_id, &false, &400i128);

    let prop = client.get_proposal(&proposal_id);
    assert_eq!(prop.votes_for, 800i128);
    assert_eq!(prop.votes_against, 400i128);
    assert!(!prop.executed);

    // Advance ledger beyond end_ledger (100 ledgers)
    env.ledger().with_mut(|li| {
        li.sequence_number += 105;
    });

    // Execute proposal
    client.execute_proposal(&admin, &proposal_id);

    let executed_prop = client.get_proposal(&proposal_id);
    assert!(executed_prop.executed);
}

#[test]
#[should_panic]
fn test_double_voting_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, GovernanceContract);
    let client = GovernanceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let proposer = Address::generate(&env);
    let voter = Address::generate(&env);
    let target = Address::generate(&env);

    client.initialize(&admin, &50u32, &100i128);

    let proposal_id = client.create_proposal(
        &proposer,
        &String::from_str(&env, "Test Prop"),
        &String::from_str(&env, "Test Desc"),
        &target,
        &Symbol::new(&env, "upgrade"),
    );

    client.vote(&voter, &proposal_id, &true, &100i128);
    // Second vote from same voter must panic with AlreadyVoted
    client.vote(&voter, &proposal_id, &true, &100i128);
}

#[test]
#[should_panic]
fn test_execute_prematurely_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, GovernanceContract);
    let client = GovernanceContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let proposer = Address::generate(&env);
    let target = Address::generate(&env);

    client.initialize(&admin, &50u32, &100i128);

    let proposal_id = client.create_proposal(
        &proposer,
        &String::from_str(&env, "Early Exec"),
        &String::from_str(&env, "Desc"),
        &target,
        &Symbol::new(&env, "action"),
    );

    // Trying to execute while voting period is still active must fail
    client.execute_proposal(&admin, &proposal_id);
}
