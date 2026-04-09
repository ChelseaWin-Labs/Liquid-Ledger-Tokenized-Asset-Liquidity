# Liquid Ledger - Tokenized Asset Liquidity

## Overview

Liquid Ledger is a Web3 application that revolutionizes personal finance by allowing users to hold and spend tokenized versions of traditional assets (gold, US Treasuries, diversified funds) on the Stellar network.

## Problem Solved

Traditional finance operates on 9-to-5 market hours with multi-day settlement periods, making investments "stuck" when immediate cash is needed. Liquid Ledger transforms illiquid investments into spendable assets that can be used instantly at point-of-sale.

## Real-Life Impact

Users can spend their "Gold" or "Treasuries" at a grocery store using a debit card, with the Stellar network settling trades instantly in the background.

## Architecture

```
Liquid Ledger/
{
    frontend/          - React web application with modern UI
    backend/           - Node.js/Express API server
    smart-contracts/   - Stellar smart contracts for tokenized assets
    docs/              - Project documentation
    scripts/           - Deployment and utility scripts
}
```

## Key Features

- **Tokenized Assets**: Gold, US Treasuries, and diversified funds on Stellar
- **Instant Settlement**: Stellar network enables real-time transactions
- **Debit Card Integration**: Spend tokenized assets at any point-of-sale
- **Personal Finance Dashboard**: Track and manage all assets in one place
- **Secure Wallet Integration**: Non-custodial wallet management

## Technology Stack

### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- shadcn/ui for components
- Lucide icons
- Stellar SDK for wallet integration

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- Prisma ORM
- JWT authentication
- Stellar SDK for blockchain interactions

### Smart Contracts
- Stellar Soroban smart contracts
- Rust implementation
- Asset tokenization logic
- Settlement mechanisms

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Rust (for smart contract development)
- Stellar CLI

### Installation

1. Clone the repository
2. Install dependencies in each directory
3. Set up environment variables
4. Run database migrations
5. Start development servers

## Development

```bash
# Frontend development
cd frontend && npm run dev

# Backend development
cd backend && npm run dev

# Smart contract development
cd smart-contracts && cargo build
```

## License

MIT License
