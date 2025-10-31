# PORTAL Official Pool (Non-Custodial)

## Overview

**PORTAL Official Pool** is a non-custodial TON staking pool operated by the TON Staking Portal team. This pool follows best practices for security, transparency, and decentralization.

## Key Features

- **Type**: Nomination Pool (Native, non-upgradeable)
- **Owner**: `0:0000...` (Zero address - fully decentralized)
- **Code**: Open-source (fork of Whales Nominator Pool)
- **Custody**: **NON-CUSTODIAL** - User funds go directly to smart contract, NOT to operators
- **Audit**: See `./audit/` directory for PDF reports and verification links

## Technical Details

- **Validator Address**: `EQC________________________________________` (to be deployed)
- **Fee**: 2% (competitive rate)
- **Minimum Stake**: 10 TON
- **Upgradeable**: NO (immutable contract for maximum security)
- **Withdraw Lock**: Standard TON network unbonding period (2-4 days)

## Security Model

### Smart Contract Security

1. **Immutable Code**: Contract cannot be upgraded (owner=0)
2. **Open Source**: Full code available for audit
3. **Based on Battle-Tested Code**: Fork of TON Foundation's Whales Nominator Pool
4. **No Admin Keys**: Zero-address owner means no backdoors

### Operational Security

1. **Validator Monitoring**: 24/7 uptime monitoring via Grafana/Prometheus
2. **Target Uptime**: > 99%
3. **Slashing Protection**: Multiple validators for redundancy
4. **Key Management**: HSM-based key storage for validator operations

### Audit Trail

All audits and security verifications are documented in the `./audit/` directory:

- Smart contract audit report (PDF)
- On-chain verification links (tonscan.org)
- Code comparison with original Whales pool
- Get-method verification results

## How It Works (Non-Custodial Flow)

```
User Wallet → Smart Contract → Validator → Rewards → User Wallet
     ↓              ↓              ↓            ↓
  [Signs]      [Locks TON]   [Stakes]    [Compounds]
```

**Important**: At NO point do operators have access to user funds. Everything is handled by the smart contract on-chain.

## Deployment Status

- **Testnet**: Testing phase (address to be announced)
- **Mainnet**: Pending testnet validation and audit completion

## For Developers

See `./nominator-pool/` for:
- Smart contract source code
- Deployment scripts
- Testing instructions
- Get-method documentation

## Disclaimer

While we follow best practices, staking carries inherent risks:

- Market volatility (TON price fluctuations)
- Smart contract bugs (despite audits)
- Validator slashing (if validator misbehaves)
- Network risks (TON blockchain issues)

**DYOR**: Always research before staking. Only stake amounts you can afford to lose.

## Contact

- **Operator**: Andrii Pylypchuk
- **Email**: andrii.it.info@gmail.com
- **Website**: https://ton-portal.onrender.com
- **Impressum**: https://ton-portal.onrender.com/impressum

---

Last updated: 2025-10-31
