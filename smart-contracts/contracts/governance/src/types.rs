use soroban_sdk::{contracttype, Address, String, Symbol};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Proposal {
    pub id: u32,
    pub proposer: Address,
    pub title: String,
    pub description: String,
    pub target_contract: Address,
    pub action: Symbol,
    pub votes_for: i128,
    pub votes_against: i128,
    pub start_ledger: u32,
    pub end_ledger: u32,
    pub executed: bool,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    VotingPeriodLedgers,
    QuorumVotes,
    ProposalCounter,
    Proposal(u32),
    Voted(u32, Address),
}
