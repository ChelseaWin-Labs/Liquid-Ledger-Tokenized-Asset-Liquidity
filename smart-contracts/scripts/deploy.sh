#!/bin/bash

# Deployment script for Liquid Ledger Soroban smart contracts
# Deploys RWA Token, Settlement Engine, and Governance to Stellar testnet

set -euo pipefail

echo "=== Deploying Liquid Ledger Smart Contracts to Stellar Testnet ==="

if ! command -v stellar &> /dev/null; then
    echo "Error: 'stellar' CLI is not installed."
    echo "Install via: cargo install --locked stellar-cli --features opt"
    exit 1
fi

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_IDENTITY="${STELLAR_SOURCE_IDENTITY:-alice}"
ADMIN_ADDRESS="${STELLAR_ADMIN_ADDRESS:-$(stellar keys address "$SOURCE_IDENTITY" 2>/dev/null || echo "")}"

if [ -z "$ADMIN_ADDRESS" ]; then
    echo "Error: STELLAR_ADMIN_ADDRESS not set or identity '$SOURCE_IDENTITY' not found in stellar-cli keystore."
    exit 1
fi

echo "Network: $NETWORK"
echo "Deployer Identity: $SOURCE_IDENTITY ($ADMIN_ADDRESS)"

# Build workspace release contracts
echo "Building all workspace contracts for wasm32..."
cargo build --target wasm32-unknown-unknown --release

WASM_DIR="target/wasm32-unknown-unknown/release"
RWA_WASM="$WASM_DIR/rwa_token.wasm"
SETTLEMENT_WASM="$WASM_DIR/settlement.wasm"
GOVERNANCE_WASM="$WASM_DIR/governance.wasm"

for wasm in "$RWA_WASM" "$SETTLEMENT_WASM" "$GOVERNANCE_WASM"; do
    if [ ! -f "$wasm" ]; then
        echo "Error: Expected build artifact $wasm not found."
        exit 1
    fi
done

mkdir -p deployments
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOYMENT_FILE="deployments/${TIMESTAMP}_deployment.json"

echo "Deploying RWA Token contract for Gold (GLD)..."
GLD_TOKEN_ID=$(stellar contract deploy \
    --wasm "$RWA_WASM" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK")

echo "Initializing GLD Token ($GLD_TOKEN_ID)..."
stellar contract invoke \
    --id "$GLD_TOKEN_ID" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --name "Liquid Ledger Gold Token" \
    --symbol "GLD" \
    --decimals 7 \
    --asset_class "commodity"

echo "Deploying RWA Token contract for US Treasury (UST)..."
UST_TOKEN_ID=$(stellar contract deploy \
    --wasm "$RWA_WASM" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK")

echo "Initializing UST Token ($UST_TOKEN_ID)..."
stellar contract invoke \
    --id "$UST_TOKEN_ID" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --name "Liquid Ledger US Treasury" \
    --symbol "UST" \
    --decimals 7 \
    --asset_class "fixed_income"

echo "Deploying RWA Token contract for Diversified Index (DIV)..."
DIV_TOKEN_ID=$(stellar contract deploy \
    --wasm "$RWA_WASM" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK")

echo "Initializing DIV Token ($DIV_TOKEN_ID)..."
stellar contract invoke \
    --id "$DIV_TOKEN_ID" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --name "Liquid Ledger Diversified Fund" \
    --symbol "DIV" \
    --decimals 7 \
    --asset_class "equity_index"

echo "Deploying Settlement Engine..."
SETTLEMENT_ID=$(stellar contract deploy \
    --wasm "$SETTLEMENT_WASM" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK")

echo "Initializing Settlement Engine ($SETTLEMENT_ID)..."
stellar contract invoke \
    --id "$SETTLEMENT_ID" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --treasury "$ADMIN_ADDRESS" \
    --fee_bps 25

echo "Adding supported tokens to Settlement Engine..."
for token in "$GLD_TOKEN_ID" "$UST_TOKEN_ID" "$DIV_TOKEN_ID"; do
    stellar contract invoke \
        --id "$SETTLEMENT_ID" \
        --source "$SOURCE_IDENTITY" \
        --network "$NETWORK" \
        -- set_supported_token \
        --token "$token" \
        --supported true
done

echo "Deploying Governance Contract..."
GOVERNANCE_ID=$(stellar contract deploy \
    --wasm "$GOVERNANCE_WASM" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK")

echo "Initializing Governance Contract ($GOVERNANCE_ID)..."
stellar contract invoke \
    --id "$GOVERNANCE_ID" \
    --source "$SOURCE_IDENTITY" \
    --network "$NETWORK" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --voting_period_ledgers 100 \
    --execution_timelock_ledgers 20 \
    --quorum_bps 4000

cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "$NETWORK",
  "deployer": "$ADMIN_ADDRESS",
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contracts": {
    "gld_token": "$GLD_TOKEN_ID",
    "ust_token": "$UST_TOKEN_ID",
    "div_token": "$DIV_TOKEN_ID",
    "settlement_engine": "$SETTLEMENT_ID",
    "governance": "$GOVERNANCE_ID"
  }
}
EOF

echo "=== Deployment Complete ==="
echo "Manifest saved to: $DEPLOYMENT_FILE"
