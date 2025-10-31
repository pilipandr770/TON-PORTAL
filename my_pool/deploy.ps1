# file: my_pool/deploy.ps1
# Deployment script for PORTAL Official Pool to TON testnet/mainnet
# This is a template - customize based on your deployment toolchain

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('testnet', 'mainnet')]
    [string]$Network = 'testnet',
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PORTAL Official Pool Deployment" -ForegroundColor Cyan
Write-Host "Network: $Network" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Configuration Validation
Write-Host "[1/7] Validating configuration..." -ForegroundColor Green
$config = Get-Content ".\my_pool\config.json" | ConvertFrom-Json

if ($config.contract.owner_address -ne "0:0000000000000000000000000000000000000000000000000000000000000000") {
    Write-Host "  ERROR: Owner address must be zero (0:0000...)" -ForegroundColor Red
    exit 1
}

if ($config.contract.upgradeable -ne $false) {
    Write-Host "  ERROR: Contract must be non-upgradeable (immutable)" -ForegroundColor Red
    exit 1
}

Write-Host "  Config validation: OK" -ForegroundColor Green
Write-Host "  - Owner: Zero address (fully decentralized)" -ForegroundColor Gray
Write-Host "  - Upgradeable: False (immutable)" -ForegroundColor Gray
Write-Host "  - Fee: $($config.parameters.fee_percent)%" -ForegroundColor Gray
Write-Host "  - Min Stake: $($config.parameters.min_stake_ton) TON`n" -ForegroundColor Gray

# Step 2: Smart Contract Compilation
Write-Host "[2/7] Compiling smart contract..." -ForegroundColor Green
Write-Host "  NOTE: Use your preferred toolchain:" -ForegroundColor Yellow
Write-Host "    - tact compiler (if using Tact)" -ForegroundColor Gray
Write-Host "    - func compiler (if using FunC)" -ForegroundColor Gray
Write-Host "    - Blueprint framework" -ForegroundColor Gray
Write-Host "  Example: tact compile ./my_pool/nominator-pool/contract.tact`n" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "  [DRY RUN] Skipping compilation`n" -ForegroundColor Yellow
} else {
    # Add your compilation command here
    # Example: & tact compile .\my_pool\nominator-pool\contract.tact
    Write-Host "  TODO: Add your compilation command here`n" -ForegroundColor Yellow
}

# Step 3: Contract Parameter Configuration
Write-Host "[3/7] Configuring contract parameters..." -ForegroundColor Green
Write-Host "  Parameters to embed:" -ForegroundColor Gray
Write-Host "    - validator_address: $($config.contract.validator_address)" -ForegroundColor Gray
Write-Host "    - fee: $($config.parameters.fee_percent)%" -ForegroundColor Gray
Write-Host "    - min_stake: $($config.parameters.min_stake_ton) TON" -ForegroundColor Gray
Write-Host "    - owner: Zero address`n" -ForegroundColor Gray

# Step 4: Testnet/Mainnet Selection
Write-Host "[4/7] Network configuration..." -ForegroundColor Green
if ($Network -eq 'testnet') {
    $endpoint = "https://testnet.toncenter.com/api/v2/jsonRPC"
    Write-Host "  Using TESTNET" -ForegroundColor Yellow
} else {
    $endpoint = "https://toncenter.com/api/v2/jsonRPC"
    Write-Host "  Using MAINNET" -ForegroundColor Red
    Write-Host "  WARNING: Mainnet deployment is permanent!" -ForegroundColor Red
}
Write-Host "  Endpoint: $endpoint`n" -ForegroundColor Gray

# Step 5: Deployment
Write-Host "[5/7] Deploying contract..." -ForegroundColor Green
if ($DryRun) {
    Write-Host "  [DRY RUN] Would deploy to $Network`n" -ForegroundColor Yellow
} else {
    Write-Host "  NOTE: Use your deployment tool:" -ForegroundColor Yellow
    Write-Host "    - tonos-cli deploy" -ForegroundColor Gray
    Write-Host "    - ton-cli deploy" -ForegroundColor Gray
    Write-Host "    - Blueprint deploy script" -ForegroundColor Gray
    Write-Host "  Example: ton-cli deploy --network $Network contract.boc`n" -ForegroundColor Gray
    
    # Add your deployment command here
    # Example: & ton-cli deploy --network $Network contract.boc
    
    Write-Host "  Enter deployed contract address:" -ForegroundColor Yellow
    $deployedAddress = Read-Host
    
    if ($deployedAddress) {
        Write-Host "  Contract deployed: $deployedAddress" -ForegroundColor Green
        
        # Update config with deployed address
        $config.contract.validator_address = $deployedAddress
        $config.contract.deployed_at = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        $config | ConvertTo-Json -Depth 10 | Set-Content ".\my_pool\config.json"
    }
}

# Step 6: Verification
Write-Host "[6/7] Post-deployment verification..." -ForegroundColor Green
Write-Host "  Verify the following get-methods:" -ForegroundColor Yellow
Write-Host "    1. get_pool_data() - returns pool configuration" -ForegroundColor Gray
Write-Host "    2. get_owner() - should return zero address" -ForegroundColor Gray
Write-Host "    3. get_fee() - should return $($config.parameters.fee_percent)%" -ForegroundColor Gray
Write-Host "    4. get_min_stake() - should return $($config.parameters.min_stake_ton) TON" -ForegroundColor Gray
Write-Host "`n  Explorer verification:" -ForegroundColor Yellow
Write-Host "    - tonscan.org (mainnet)" -ForegroundColor Gray
Write-Host "    - testnet.tonscan.org (testnet)" -ForegroundColor Gray
Write-Host "    - Verify source code matches published code`n" -ForegroundColor Gray

# Step 7: Update pools.json
Write-Host "[7/7] Updating pools database..." -ForegroundColor Green
Write-Host "  Add the following entry to data/pools.json:" -ForegroundColor Yellow

$poolEntry = @{
    name = "PORTAL Official Pool"
    type = "native"
    address = $deployedAddress ?? "EQC________________________________________"
    url = "https://ton-portal.onrender.com/my_pool"
    fee = $config.parameters.fee_percent / 100
    min_stake_ton = $config.parameters.min_stake_ton
    description = "⭐ Official PORTAL pool. Non-custodial. Owner=0, immutable contract."
    audits = @(
        "https://ton-portal.onrender.com/my_pool/audit/report.pdf"
    )
    docs_url = "https://ton-portal.onrender.com/docs"
    faq_url = "https://ton-portal.onrender.com/faq"
    tos_url = "https://ton-portal.onrender.com/agb"
    lst_token = $null
    lst_risk_note = $null
    recommended = $true
    recommended_badge = "⭐ PORTAL Official"
}

Write-Host ($poolEntry | ConvertTo-Json -Depth 10) -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify contract on explorer" -ForegroundColor Gray
Write-Host "  2. Test with small amount (1-10 TON)" -ForegroundColor Gray
Write-Host "  3. Complete security audit" -ForegroundColor Gray
Write-Host "  4. Update data/pools.json with real address" -ForegroundColor Gray
Write-Host "  5. Announce to community`n" -ForegroundColor Gray

Write-Host "Documentation: ./my_pool/README.md" -ForegroundColor Cyan
Write-Host "Config: ./my_pool/config.json" -ForegroundColor Cyan
Write-Host "Audit: ./my_pool/audit/`n" -ForegroundColor Cyan
