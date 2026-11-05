#![no_std]

pub mod errors;
pub mod types;

#[cfg(test)]
mod test;

use errors::GovernanceError;
use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol};
use types::{DataKey, Proposal};

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {
    /// Initialize the governance protocol with voting period (in ledgers) and quorum requirements
    pub fn initialize(
        env: Env,
        admin: Address,
        voting_period_ledgers: u32,
        quorum_votes: i128,
    ) -> Result<(), GovernanceError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(GovernanceError::AlreadyInitialized);
        }

        if quorum_votes <= 0 || voting_period_ledgers == 0 {
            return Err(GovernanceError::Unauthorized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::VotingPeriodLedgers, &voting_period_ledgers);
        env.storage()
            .instance()
            .set(&DataKey::QuorumVotes, &quorum_votes);
        env.storage()
            .instance()
            .set(&DataKey::ProposalCounter, &0u32);
        env.storage().instance().extend_ttl(100_000, 500_000);

        Ok(())
    }

    /// Submit a new governance proposal for community voting
    pub fn create_proposal(
        env: Env,
        proposer: Address,
        title: String,
        description: String,
        target_contract: Address,
        action: Symbol,
    ) -> Result<u32, GovernanceError> {
        proposer.require_auth();

        let voting_period: u32 = env
            .storage()
            .instance()
            .get(&DataKey::VotingPeriodLedgers)
            .ok_or(GovernanceError::NotInitialized)?;

        let mut counter: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalCounter)
            .unwrap_or(0);
        counter += 1;

        let current_ledger = env.ledger().sequence();
        let end_ledger = current_ledger + voting_period;

        let proposal = Proposal {
            id: counter,
            proposer: proposer.clone(),
            title: title.clone(),
            description,
            target_contract,
            action: action.clone(),
            votes_for: 0,
            votes_against: 0,
            start_ledger: current_ledger,
            end_ledger,
            executed: false,
        };

        let proposal_key = DataKey::Proposal(counter);
        env.storage().persistent().set(&proposal_key, &proposal);
        env.storage()
            .persistent()
            .extend_ttl(&proposal_key, 100_000, 500_000);

        env.storage()
            .instance()
            .set(&DataKey::ProposalCounter, &counter);
        env.storage().instance().extend_ttl(100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "proposal_created"), proposer),
            (counter, action),
        );

        Ok(counter)
    }

    /// Cast a vote (for or against) on an active proposal with weighted voting power
    pub fn vote(
        env: Env,
        voter: Address,
        proposal_id: u32,
        vote_for: bool,
        voting_power: i128,
    ) -> Result<(), GovernanceError> {
        voter.require_auth();

        if voting_power <= 0 {
            return Err(GovernanceError::InvalidVotingPower);
        }

        let proposal_key = DataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&proposal_key)
            .ok_or(GovernanceError::ProposalNotFound)?;

        let current_ledger = env.ledger().sequence();

        if current_ledger > proposal.end_ledger {
            return Err(GovernanceError::VotingClosed);
        }

        if proposal.executed {
            return Err(GovernanceError::AlreadyExecuted);
        }

        let voted_key = DataKey::Voted(proposal_id, voter.clone());
        if env.storage().persistent().has(&voted_key) {
            return Err(GovernanceError::AlreadyVoted);
        }

        if vote_for {
            proposal.votes_for += voting_power;
        } else {
            proposal.votes_against += voting_power;
        }

        env.storage().persistent().set(&proposal_key, &proposal);
        env.storage().persistent().set(&voted_key, &true);

        env.storage()
            .persistent()
            .extend_ttl(&proposal_key, 100_000, 500_000);
        env.storage()
            .persistent()
            .extend_ttl(&voted_key, 100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "vote_cast"), voter),
            (proposal_id, vote_for, voting_power),
        );

        Ok(())
    }

    /// Execute a successful proposal that has passed voting and satisfied quorum
    pub fn execute_proposal(
        env: Env,
        executor: Address,
        proposal_id: u32,
    ) -> Result<(), GovernanceError> {
        executor.require_auth();

        let proposal_key = DataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&proposal_key)
            .ok_or(GovernanceError::ProposalNotFound)?;

        if proposal.executed {
            return Err(GovernanceError::AlreadyExecuted);
        }

        let current_ledger = env.ledger().sequence();
        if current_ledger <= proposal.end_ledger {
            return Err(GovernanceError::VotingStillActive);
        }

        let quorum: i128 = env
            .storage()
            .instance()
            .get(&DataKey::QuorumVotes)
            .unwrap_or(0);

        let total_votes = proposal.votes_for + proposal.votes_against;
        if total_votes < quorum {
            return Err(GovernanceError::QuorumNotReached);
        }

        if proposal.votes_for <= proposal.votes_against {
            return Err(GovernanceError::ProposalDefeated);
        }

        proposal.executed = true;
        env.storage().persistent().set(&proposal_key, &proposal);
        env.storage()
            .persistent()
            .extend_ttl(&proposal_key, 100_000, 500_000);

        env.events().publish(
            (Symbol::new(&env, "proposal_executed"), executor),
            proposal_id,
        );

        Ok(())
    }

    pub fn get_proposal(env: Env, proposal_id: u32) -> Result<Proposal, GovernanceError> {
        let key = DataKey::Proposal(proposal_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(GovernanceError::ProposalNotFound)
    }

    pub fn has_voted(env: Env, proposal_id: u32, voter: Address) -> bool {
        let key = DataKey::Voted(proposal_id, voter);
        env.storage().persistent().get(&key).unwrap_or(false)
    }
}
