# Liquid Ledger Smart Contract Deployment Script for Windows PowerShell
param (
    [string]$Network = "testnet",
    [string]$SourceIdentity = "alice",
    [string]$AdminAddress = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=== Deploying Liquid Ledger Smart Contracts (PowerShell) ===" -ForegroundColor Cyan

if (-not (Get-Command stellar -ErrorAction SilentlyContinue)) {
    Write-Error "'stellar' CLI was not found on PATH. Install via: cargo install --locked stellar-cli --features opt"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($AdminAddress)) {
    try {
        $AdminAddress = (stellar keys address $SourceIdentity).Trim()
    } catch {
        Write-Error "Could not resolve address for identity '$SourceIdentity'. Provide -AdminAddress or set up keypair."
        exit 1
    }
}

Write-Host "Network: $Network" -ForegroundColor Green
Write-Host "Deployer Identity: $SourceIdentity ($AdminAddress)" -ForegroundColor Green

Write-Host "Building workspace contracts for wasm32-unknown-unknown..." -ForegroundColor Yellow
cargo build --target wasm32-unknown-unknown --release
if ($LASTEXITCODE -ne 0) {
    Write-Error "Contract build failed."
    exit 1
}

$WasmDir = "target/wasm32-unknown-unknown/release"
$RwaWasm = "$WasmDir/rwa_token.wasm"
$SettlementWasm = "$WasmDir/settlement.wasm"
$GovWasm = "$WasmDir/governance.wasm"

New-Item -ItemType Directory -Force -Path "deployments" | Out-Null
$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$DeployManifest = "deployments/${Timestamp}_deployment.json"

Write-Host "Deploying RWA GLD Token..." -ForegroundColor Yellow
$GldId = (stellar contract deploy --wasm $RwaWasm --source $SourceIdentity --network $Network).Trim()
stellar contract invoke --id $GldId --source $SourceIdentity --network $Network -- initialize --admin $AdminAddress --name "Liquid Ledger Gold Token" --symbol "GLD" --decimals 7 --asset_class "commodity"

Write-Host "Deploying RWA UST Token..." -ForegroundColor Yellow
$UstId = (stellar contract deploy --wasm $RwaWasm --source $SourceIdentity --network $Network).Trim()
stellar contract invoke --id $UstId --source $SourceIdentity --network $Network -- initialize --admin $AdminAddress --name "Liquid Ledger US Treasury" --symbol "UST" --decimals 7 --asset_class "fixed_income"

Write-Host "Deploying Settlement Engine..." -ForegroundColor Yellow
$SettlementId = (stellar contract deploy --wasm $SettlementWasm --source $SourceIdentity --network $Network).Trim()
stellar contract invoke --id $SettlementId --source $SourceIdentity --network $Network -- initialize --admin $AdminAddress --treasury $AdminAddress --fee_bps 25
stellar contract invoke --id $SettlementId --source $SourceIdentity --network $Network -- set_supported_token --token $GldId --supported true
stellar contract invoke --id $SettlementId --source $SourceIdentity --network $Network -- set_supported_token --token $UstId --supported true

Write-Host "Deploying Governance..." -ForegroundColor Yellow
$GovId = (stellar contract deploy --wasm $GovWasm --source $SourceIdentity --network $Network).Trim()
stellar contract invoke --id $GovId --source $SourceIdentity --network $Network -- initialize --admin $AdminAddress --voting_period_ledgers 100 --execution_timelock_ledgers 20 --quorum_bps 4000

$Manifest = @{
    network = $Network
    deployer = $AdminAddress
    deployed_at = (Get-Date).ToUniversalTime().ToString("o")
    contracts = @{
        gld_token = $GldId
        ust_token = $UstId
        settlement_engine = $SettlementId
        governance = $GovId
    }
} | ConvertTo-Json -Depth 4

Set-Content -Path $DeployManifest -Value $Manifest
Write-Host "=== Deployment successful! Manifest saved to $DeployManifest ===" -ForegroundColor Green

