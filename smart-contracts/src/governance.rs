use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Map, String, u64};

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {
    /// Initialize the governance contract
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&Symbol::new(&env, "admin"), &admin);
        
        // Initialize governance parameters
        env.storage().instance().set(&Symbol::new(&env, "proposal_threshold"), &1000u64); // 1000 tokens to propose
        env.storage().instance().set(&Symbol::new(&env, "voting_period"), &604800u64); // 7 days in seconds
        env.storage().instance().set(&Symbol::new(&env, "quorum"), &5000u64); // 5000 tokens for quorum
        
        // Initialize proposal counter
        env.storage().instance().set(&Symbol::new(&env, "proposal_counter"), &0u64);
        
        // Initialize proposals map
        let proposals: Map<u64, Proposal> = Map::new(&env);
        env.storage().instance().set(&Symbol::new(&env, "proposals"), &proposals);
    }

    /// Create a new proposal
    pub fn create_proposal(
        env: Env,
        proposer: Address,
        title: String,
        description: String,
        target_contract: Address,
        action: String,
        value: String,
    ) -> u64 {
        // Verify proposer has minimum tokens (simplified - in reality would check token balance)
        let proposal_threshold: u64 = env.storage().instance()
            .get(&Symbol::new(&env, "proposal_threshold"))
            .unwrap_or(1000u64);
        
        proposer.require_auth();

        // Get proposal counter and increment
        let mut counter: u64 = env.storage().instance()
            .get(&Symbol::new(&env, "proposal_counter"))
            .unwrap_or(0u64);
        counter += 1;
        env.storage().instance().set(&Symbol::new(&env, "proposal_counter"), &counter);

        // Create proposal
        let proposal = Proposal {
            id: counter,
            proposer,
            title,
            description,
            target_contract,
            action,
            value,
            votes_for: 0,
            votes_against: 0,
            start_time: env.ledger().timestamp(),
            end_time: env.ledger().timestamp() + env.storage().instance()
                .get(&Symbol::new(&env, "voting_period"))
                .unwrap_or(604800u64),
            executed: false,
        };

        // Store proposal
        let mut proposals: Map<u64, Proposal> = env.storage().instance()
            .get(&Symbol::new(&env, "proposals"))
            .unwrap_or(Map::new(&env));
        proposals.set(counter, proposal);
        env.storage().instance().set(&Symbol::new(&env, "proposals"), &proposals);

        // Emit proposal created event
        env.events().publish(
            (Symbol::new(&env, "proposal_created"), proposer),
            (counter, title)
        );

        counter
    }

    /// Vote on a proposal
    pub fn vote(env: Env, voter: Address, proposal_id: u64, vote_for: bool, voting_power: u64) {
        voter.require_auth();

        let mut proposals: Map<u64, Proposal> = env.storage().instance()
            .get(&Symbol::new(&env, "proposals"))
            .unwrap_or(Map::new(&env));

        let mut proposal = proposals.get(proposal_id)
            .expect("Proposal not found");

        // Check if voting is still active
        if env.ledger().timestamp() > proposal.end_time {
            panic!("Voting period has ended");
        }

        if proposal.executed {
            panic!("Proposal has already been executed");
        }

        // Update vote counts
        if vote_for {
            proposal.votes_for += voting_power;
        } else {
            proposal.votes_against += voting_power;
        }

        // Store updated proposal
        proposals.set(proposal_id, proposal);
        env.storage().instance().set(&Symbol::new(&env, "proposals"), &proposals);

        // Emit vote event
        env.events().publish(
            (Symbol::new(&env, "vote_cast"), voter, proposal_id),
            (vote_for, voting_power)
        );
    }

    /// Execute a successful proposal
    pub fn execute_proposal(env: Env, executor: Address, proposal_id: u64) {
        executor.require_auth();

        let mut proposals: Map<u64, Proposal> = env.storage().instance()
            .get(&Symbol::new(&env, "proposals"))
            .unwrap_or(Map::new(&env));

        let mut proposal = proposals.get(proposal_id)
            .expect("Proposal not found");

        // Check if proposal can be executed
        if proposal.executed {
            panic!("Proposal has already been executed");
        }

        if env.ledger().timestamp() <= proposal.end_time {
            panic!("Voting period has not ended");
        }

        // Check if proposal passed (simple majority + quorum)
        let quorum: u64 = env.storage().instance()
            .get(&Symbol::new(&env, "quorum"))
            .unwrap_or(5000u64);
        
        let total_votes = proposal.votes_for + proposal.votes_against;
        if total_votes < quorum {
            panic!("Quorum not reached");
        }

        if proposal.votes_for <= proposal.votes_against {
            panic!("Proposal did not pass");
        }

        // Execute the proposal action
        // In a real implementation, this would invoke the target contract
        self.execute_proposal_action(&env, &proposal);

        // Mark as executed
        proposal.executed = true;
        proposals.set(proposal_id, proposal);
        env.storage().instance().set(&Symbol::new(&env, "proposals"), &proposals);

        // Emit execution event
        env.events().publish(
            (Symbol::new(&env, "proposal_executed"), executor),
            proposal_id
        );
    }

    /// Get proposal details
    pub fn get_proposal(env: Env, proposal_id: u64) -> Proposal {
        let proposals: Map<u64, Proposal> = env.storage().instance()
            .get(&Symbol::new(&env, "proposals"))
            .unwrap_or(Map::new(&env));

        proposals.get(proposal_id)
            .expect("Proposal not found")
    }

    /// Get all proposals
    pub fn get_all_proposals(env: Env) -> Vec<Proposal> {
        let proposals: Map<u64, Proposal> = env.storage().instance()
            .get(&Symbol::new(&env, "proposals"))
            .unwrap_or(Map::new(&env));

        let mut result = Vec::new(&env);
        for proposal in proposals.iter() {
            result.push_back(proposal);
        }
        result
    }

    /// Update governance parameters (admin only)
    pub fn update_parameters(
        env: Env,
        admin: Address,
        proposal_threshold: Option<u64>,
        voting_period: Option<u64>,
        quorum: Option<u64>,
    ) {
        let current_admin: Address = env.storage().instance()
            .get(&Symbol::new(&env, "admin"))
            .expect("Admin not set");
        
        current_admin.require_auth();

        if let Some(threshold) = proposal_threshold {
            env.storage().instance().set(&Symbol::new(&env, "proposal_threshold"), &threshold);
        }
        if let Some(period) = voting_period {
            env.storage().instance().set(&Symbol::new(&env, "voting_period"), &period);
        }
        if let Some(quorum_req) = quorum {
            env.storage().instance().set(&Symbol::new(&env, "quorum"), &quorum_req);
        }
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

    /// Execute proposal action (placeholder implementation)
    fn execute_proposal_action(&self, env: &Env, proposal: &Proposal) {
        // In a real implementation, this would:
        // 1. Parse the action and value
        // 2. Make cross-contract call to target_contract
        // 3. Handle the result
        
        // For now, just emit an event
        env.events().publish(
            Symbol::new(&env, "action_executed"),
            (proposal.target_contract, proposal.action, proposal.value)
        );
    }
}

#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub proposer: Address,
    pub title: String,
    pub description: String,
    pub target_contract: Address,
    pub action: String,
    pub value: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub executed: bool,
}
