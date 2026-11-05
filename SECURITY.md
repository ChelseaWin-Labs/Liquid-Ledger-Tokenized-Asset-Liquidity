# Security Policy

Liquid Ledger handles financial settlement logic, cryptographic keypairs, and tokenized real-world assets. We take the security of our smart contracts, backend services, and user funds seriously.

## Supported Versions

| Component | Supported Version |
| :--- | :--- |
| Smart Contracts (`smart-contracts/`) | `>= 0.1.0` |
| Backend API (`backend/`) | `>= 1.0.0` |
| Frontend Dashboard (`frontend/`) | `>= 0.1.0` |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a vulnerability or potential exploit in Liquid Ledger:
1. Privately disclose the issue by contacting the security team or opening a confidential GitHub Security Advisory.
2. Provide as much detail as possible:
   - A description of the vulnerability.
   - Specific contract function, route, or module affected.
   - Proof of concept (PoC) or reproduction steps.
   - Potential impact on user funds, state integrity, or ledger consensus.

### What to Expect
- **Response Window:** We will acknowledge receipt of your report within 48 hours.
- **Remediation & Patching:** Maintainers will prioritize reproducing and resolving critical issues on testnet and staging environments.
- **Responsible Disclosure:** We will coordinate a disclosure timeline once a patch is deployed.

---

## Bug Bounty & Best Practices

- Always test against Stellar Testnet before interacting with live accounts.
- Never commit private keys, master seeds, or sensitive `.env` files to git.
- Review smart contract source code and verify addresses on [StellarExpert](https://stellar.expert) prior to signing transactions.
