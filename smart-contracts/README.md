# Liquid Ledger Smart Contracts

This directory contains the Stellar Soroban smart contracts for the Liquid Ledger platform.

## Contracts Overview

### 1. Tokenized Asset Contract (`token.rs`)
Manages tokenized versions of traditional assets (gold, US Treasuries, diversified funds).

**Features:**
- ERC-20-like token functionality
- Asset metadata management
- Mint/burn operations (admin only)
- Transfer and allowance functions
- Asset type classification (gold/treasury/fund)

**Key Functions:**
- `initialize()` - Set up token with metadata
- `mint()` - Create new tokens (admin only)
- `burn()` - Destroy tokens (admin only)
- `transfer()` - Transfer tokens between accounts
- `approve()` / `transfer_from()` - Allowance-based transfers

### 2. Settlement Engine Contract (`settlement.rs`)
Handles multi-asset transactions and atomic swaps.

**Features:**
- Atomic swaps between different tokenized assets
- Debit card settlement processing
- Batch settlement for multiple transactions
- Settlement fee management
- Supported token management

**Key Functions:**
- `atomic_swap()` - Execute atomic token swaps
- `card_settlement()` - Process debit card transactions
- `batch_settlement()` - Process multiple settlements
- `add_supported_token()` - Add supported tokens
- `get_settlement_fee()` - Get current settlement fee

### 3. Governance Contract (`governance.rs`)
Manages contract upgrades and platform governance.

**Features:**
- Proposal creation and voting
- Contract upgrade execution
- Governance parameter management
- Quorum and voting period controls

**Key Functions:**
- `create_proposal()` - Create governance proposals
- `vote()` - Vote on active proposals
- `execute_proposal()` - Execute successful proposals
- `update_parameters()` - Modify governance settings

## Architecture

The smart contracts follow a modular architecture:

```
TokenizedAsset Contract
    |
    v
Settlement Engine
    |
    v
Governance Contract
```

- **TokenizedAsset**: Individual contracts for each asset type
- **Settlement Engine**: Central hub for all transactions
- **Governance**: Manages upgrades and platform decisions

## Deployment

### Prerequisites
- Rust toolchain
- Stellar CLI (`cargo install stellar-cli`)
- Stellar account with testnet XLM

### Build Contracts
```bash
cargo build --target wasm32-unknown-unknown --release
```

### Deploy to Testnet
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The deployment script will:
1. Build all contracts
2. Deploy separate instances for each asset type
3. Initialize contracts with proper configuration
4. Set up the settlement engine with supported tokens
5. Deploy governance contract
6. Generate deployment manifest

## Testing

### Run Tests
```bash
cargo test
```

### Integration Testing
The contracts include comprehensive tests for:
- Token operations (mint, burn, transfer)
- Atomic swaps
- Settlement processing
- Governance functions

## Configuration

### Environment Variables
```bash
STELLAR_SECRET_KEY=your_testnet_secret_key
STELLAR_PUBLIC_KEY=your_testnet_public_key
```

### Contract Parameters
- **Settlement Fee**: 0.1% (100 basis points)
- **Voting Period**: 7 days
- **Quorum**: 5000 tokens
- **Proposal Threshold**: 1000 tokens

## Security Features

### Access Control
- Admin-only functions for critical operations
- Multi-signature support for sensitive actions
- Role-based permissions

### Audit Trail
- All transactions emit events
- Comprehensive logging
- Transparent governance actions

### Economic Security
- Settlement fees to prevent spam
- Proposal thresholds to prevent governance attacks
- Time locks for critical operations

## Integration

### Backend Integration
Update your backend configuration with deployed contract IDs:

```javascript
const contracts = {
  goldToken: "G...",
  treasuryToken: "G...",
  fundToken: "G...",
  settlementEngine: "G...",
  governance: "G..."
};
```

### Frontend Integration
Use the Stellar SDK to interact with contracts:

```javascript
import { Server, TransactionBuilder, Operation } from 'stellar-sdk';

const server = new Server('https://horizon-testnet.stellar.org');
// Contract interaction code
```

## Monitoring

### Events
Contracts emit events for:
- Token transfers
- Settlement operations
- Governance actions
- Proposal lifecycle

### Metrics
Track:
- Transaction volume
- Settlement success rates
- Governance participation
- Asset liquidity

## Upgrade Process

The governance contract enables secure upgrades:

1. Create upgrade proposal
2. Community voting
3. Execute successful proposal
4. Deploy new contract version
5. Update settlement engine references

## Support

For questions or issues:
1. Check the documentation
2. Review test cases
3. Create an issue in the repository
4. Contact the development team

## License

MIT License - see LICENSE file for details.
