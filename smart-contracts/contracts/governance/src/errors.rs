use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GovernanceError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ProposalNotFound = 4,
    VotingClosed = 5,
    VotingStillActive = 6,
    AlreadyVoted = 7,
    QuorumNotReached = 8,
    ProposalDefeated = 9,
    AlreadyExecuted = 10,
    InvalidVotingPower = 11,
}
