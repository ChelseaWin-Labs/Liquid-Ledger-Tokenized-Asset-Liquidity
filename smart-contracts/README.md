# Liquid Ledger Smart Contracts

This directory contains the production Stellar Soroban smart contracts powering Liquid Ledger. The workspace is built on **Soroban SDK v21.0.0** and partitioned into modular, isolated smart contract crates.

---

## Workspace Architecture

```
smart-contracts/
├── Cargo.toml                      # Workspace manifest
├── Cargo.lock                      # Deterministic dependency lock
├── contracts/
│   ├── rwa_token/                  # Real-World Asset (RWA) token contract
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs              # ERC-20 compliant RWA token with compliance hooks
│   │       ├── metadata.rs         # Asset class metadata, verification URI, and yields
│   │       ├── errors.rs           # Soroban contract errors
│   │       └── test.rs             # Unit & integration tests
│   ├── settlement/                 # Atomic swap and POS debit settlement engine
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs              # Replay-protected atomic swaps & fee splits
│   │       ├── errors.rs           # Settlement engine errors
│   │       └── test.rs             # Multi-asset settlement tests
│   └── governance/                 # Decentralized proposal & timelocked execution
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs              # Proposal creation, voting, and timelock
│           ├── types.rs            # Proposal state machine & voter storage
│           ├── errors.rs           # Governance errors
│           └── test.rs             # Quorum and lifecycle tests
└── scripts/
    ├── deploy.sh                   # Testnet deployment automation (Bash)
    └── deploy.ps1                  # Testnet deployment automation (PowerShell)
```

---

## Contract Modules

### 1. `rwa_token`
An institutional-grade RWA asset contract supporting:
- Standard Soroban Token interface (`initialize`, `mint`, `burn`, `transfer`, `balance`, `allowance`).
- Compliance controls: Account pause and freeze capabilities for regulatory adherence.
- Rich Asset Metadata: Asset class (`commodity`, `fixed_income`, `equity_index`, `real_estate`), verification URI, annual yield basis points, and valuation timestamps.

### 2. `settlement`
High-speed atomic multi-asset settlement:
- Nonce and expiration-based replay protection for off-chain order matching.
- Dynamic protocol fee split routed directly to the platform treasury.
- Whitelisted supported token validation.
- Cross-asset debit card POS liquidation authorization.

### 3. `governance`
Decentralized governance module:
- Proposal creation with configurable voting window and timelock delays.
- Staked voting power calculation with quorum requirements.
- Status lifecycle: `Active` -> `Passed` / `Defeated` -> `Queued` -> `Executed`.

---

## Building Contracts

Prerequisites:
- Rust toolchain (`rustup target add wasm32-unknown-unknown`)
- Soroban CLI (`cargo install --locked stellar-cli --features opt`)

```bash
# Build all contracts to WebAssembly
cargo build --target wasm32-unknown-unknown --release
```

WASM artifacts will be compiled to `smart-contracts/target/wasm32-unknown-unknown/release/`:
- `rwa_token.wasm`
- `settlement.wasm`
- `governance.wasm`

---

## Running Automated Tests

Run the full test suite across all workspace contracts:

```bash
# Test all contracts
cargo test

# Test individual contracts
cargo test --manifest-path contracts/rwa_token/Cargo.toml
cargo test --manifest-path contracts/settlement/Cargo.toml
cargo test --manifest-path contracts/governance/Cargo.toml
```

---

## Deployment to Stellar Testnet

Set your environment identity:
```bash
export STELLAR_NETWORK=testnet
export STELLAR_SOURCE_IDENTITY=alice
```

Run the deployer:
```bash
# On Linux / macOS
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# On Windows PowerShell
.\scripts\deploy.ps1 -Network testnet -SourceIdentity alice
```

The script produces a JSON manifest in `smart-contracts/deployments/` with all deployed contract IDs.
