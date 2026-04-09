#!/bin/bash

# Deployment script for Liquid Ledger smart contracts
# This script deploys the tokenized asset contracts to Stellar testnet

set -e

echo "Deploying Liquid Ledger Smart Contracts..."

# Check if stellar-cli is installed
if ! command -v stellar &> /dev/null; then
    echo "Error: stellar-cli is not installed"
    echo "Please install it with: cargo install stellar-cli"
    exit 1
fi

# Set network (testnet for development)
NETWORK="testnet"
echo "Deploying to $NETWORK"

# Build contracts
echo "Building contracts..."
cargo build --target wasm32-unknown-unknown --release

# Create deployment directory
mkdir -p deployments
DEPLOYMENT_FILE="deployments/$(date +%Y%m%d_%H%M%S)_deployment.json"

echo "Deployment started at $(date)"

# Deploy Tokenized Asset Contract
echo "Deploying TokenizedAsset contract..."
TOKEN_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/liquid_ledger_contracts.wasm \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK)

echo "TokenizedAsset contract deployed with ID: $TOKEN_CONTRACT_ID"

# Initialize Gold Token
echo "Initializing Gold Token (GLD)..."
stellar contract invoke \
    --id $TOKEN_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- initialize \
    --admin $STELLAR_PUBLIC_KEY \
    --name "Liquid Ledger Gold Token" \
    --symbol "GLD" \
    --decimals 7 \
    --total_supply 1000000000000

# Initialize US Treasury Token
echo "Initializing US Treasury Token (UST)..."
UST_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/liquid_ledger_contracts.wasm \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK)

stellar contract invoke \
    --id $UST_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- initialize \
    --admin $STELLAR_PUBLIC_KEY \
    --name "Liquid Ledger US Treasury" \
    --symbol "UST" \
    --decimals 7 \
    --total_supply 1000000000000

# Initialize Diversified Fund Token
echo "Initializing Diversified Fund Token (DIV)..."
DIV_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/liquid_ledger_contracts.wasm \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK)

stellar contract invoke \
    --id $DIV_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- initialize \
    --admin $STELLAR_PUBLIC_KEY \
    --name "Liquid Ledger Diversified Fund" \
    --symbol "DIV" \
    --decimals 7 \
    --total_supply 1000000000000

# Deploy Settlement Engine
echo "Deploying Settlement Engine..."
SETTLEMENT_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/liquid_ledger_contracts.wasm \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK)

stellar contract invoke \
    --id $SETTLEMENT_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- initialize \
    --admin $STELLAR_PUBLIC_KEY

# Add supported tokens to settlement engine
stellar contract invoke \
    --id $SETTLEMENT_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- add_supported_token \
    --token_address $TOKEN_CONTRACT_ID

stellar contract invoke \
    --id $SETTLEMENT_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- add_supported_token \
    --token_address $UST_CONTRACT_ID

stellar contract invoke \
    --id $SETTLEMENT_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- add_supported_token \
    --token_address $DIV_CONTRACT_ID

# Deploy Governance Contract
echo "Deploying Governance Contract..."
GOVERNANCE_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32-unknown-unknown/release/liquid_ledger_contracts.wasm \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK)

stellar contract invoke \
    --id $GOVERNANCE_CONTRACT_ID \
    --source $STELLAR_SECRET_KEY \
    --network $NETWORK \
    -- initialize \
    --admin $STELLAR_PUBLIC_KEY

# Create deployment manifest
cat > $DEPLOYMENT_FILE << EOF
{
  "deployment_date": "$(date)",
  "network": "$NETWORK",
  "contracts": {
    "gold_token": {
      "id": "$TOKEN_CONTRACT_ID",
      "name": "Liquid Ledger Gold Token",
      "symbol": "GLD"
    },
    "treasury_token": {
      "id": "$UST_CONTRACT_ID",
      "name": "Liquid Ledger US Treasury",
      "symbol": "UST"
    },
    "fund_token": {
      "id": "$DIV_CONTRACT_ID",
      "name": "Liquid Ledger Diversified Fund",
      "symbol": "DIV"
    },
    "settlement_engine": {
      "id": "$SETTLEMENT_CONTRACT_ID"
    },
    "governance": {
      "id": "$GOVERNANCE_CONTRACT_ID"
    }
  }
}
EOF

echo "Deployment completed successfully!"
echo "Deployment manifest saved to: $DEPLOYMENT_FILE"
echo ""
echo "Contract IDs:"
echo "Gold Token (GLD): $TOKEN_CONTRACT_ID"
echo "US Treasury (UST): $UST_CONTRACT_ID"
echo "Diversified Fund (DIV): $DIV_CONTRACT_ID"
echo "Settlement Engine: $SETTLEMENT_CONTRACT_ID"
echo "Governance: $GOVERNANCE_CONTRACT_ID"
echo ""
echo "Next steps:"
echo "1. Update your backend configuration with these contract IDs"
echo "2. Update your frontend with the correct contract addresses"
echo "3. Test the contracts using the test scripts"
