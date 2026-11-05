# Contributing to Liquid Ledger

Thank you for your interest in contributing to **Liquid Ledger**! Liquid Ledger is an open-source Web3 application built on the Stellar Soroban network designed to make tokenized real-world assets (RWAs) spendable at point-of-sale with instant liquidity.

We welcome contributions from developers, researchers, designers, and documentation writers.

---

## Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat others with respect and constructive professionalism.

---

## Architecture Overview

Liquid Ledger is organized as a monorepo consisting of:
- `smart-contracts/`: Soroban smart contracts written in Rust (`rwa_token`, `settlement`, `governance`).
- `backend/`: Node.js, Express, and Prisma ORM API server for asset metadata, card routing, and Stellar RPC bridge.
- `frontend/`: React 18, Vite, TypeScript, and TailwindCSS dashboard with Freighter wallet integration.
- `docs/`: System architecture and API documentation.

---

## Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Rust**: 1.80.0+ with target `wasm32-unknown-unknown`
- **Stellar CLI**: `cargo install --locked stellar-cli`
- **PostgreSQL**: Local instance or Docker container

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/ChelseaWin-Labs/Liquid-Ledger-Tokenized-Asset-Liquidity.git
cd Liquid-Ledger-Tokenized-Asset-Liquidity

# 2. Install dependencies across workspaces
npm install

# 3. Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Compile smart contracts
cd smart-contracts
cargo test
cargo build --target wasm32-unknown-unknown --release
cd ..

# 5. Run backend and frontend concurrently
npm run dev
```

---

## Pull Request Guidelines

1. **Fork and Branch**: Create a dedicated feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. **Commit Conventions**: Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(scope): add new capability`
   - `fix(scope): fix bug or issue`
   - `test(scope): add or update test suite`
   - `docs(scope): update documentation`
   - `refactor(scope): internal code cleanup`
3. **Run Checks Locally**:
   - Smart contracts: `cargo test` and `cargo fmt -- --check`
   - Backend: `cd backend && npm run build && npm test`
   - Frontend: `cd frontend && npm run build && npm test`
4. **Submit PR**: Open a pull request against `main` using our PR template. Ensure the CI check passes green.

---

## Reporting Issues

If you find a bug or have a feature suggestion:
- Check existing [GitHub Issues](https://github.com/ChelseaWin-Labs/Liquid-Ledger-Tokenized-Asset-Liquidity/issues) before submitting.
- Use our Issue templates to provide reproducible steps, expected behavior, and environment details.
- For security vulnerabilities, review [SECURITY.md](SECURITY.md) instead of creating public issues.

