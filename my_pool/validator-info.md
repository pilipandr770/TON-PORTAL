# Validator & Operations Info

## Validator Configuration

### Primary Validator
- **Address**: `EQC________________________________________` (TBD after deployment)
- **Public Key**: TBD
- **Location**: Frankfurt, Germany (low-latency EU datacenter)
- **Hardware**: 
  - CPU: 16 cores (3.0+ GHz)
  - RAM: 64 GB
  - Storage: 1 TB NVMe SSD
  - Network: 1 Gbps dedicated

### Backup Validator
- **Address**: TBD (for slashing protection)
- **Location**: Secondary EU datacenter
- **Purpose**: Automatic failover if primary validator goes offline

## Performance Targets

### Uptime
- **Target**: > 99% uptime
- **Current**: N/A (not yet deployed)
- **Historical**: Will be tracked post-deployment

### Response Time
- **Block Validation**: < 2 seconds
- **Transaction Processing**: < 5 seconds average
- **API Response**: < 500ms

## Monitoring & Alerts

### Infrastructure Monitoring
- **Tool**: Grafana + Prometheus
- **Metrics Tracked**:
  - Node uptime and sync status
  - CPU/RAM/Disk utilization
  - Network latency
  - Block production rate
  - Missed blocks count
  - Peer connection status

### Dashboard
- **URL**: TBD (private monitoring dashboard)
- **Public Status**: https://ton-portal.onrender.com/pool-status (coming soon)

### Alert Channels
1. **Critical Alerts** (downtime, slashing risk):
   - Telegram bot to operator
   - Email to andrii.it.info@gmail.com
   - SMS to +49 160 95030120

2. **Warning Alerts** (high resource usage):
   - Telegram notifications
   - Email digest (daily)

3. **Info Alerts** (routine updates):
   - Weekly report email

## Operations Schedule

### Maintenance Windows
- **Planned Maintenance**: Sundays 02:00-04:00 UTC (low-traffic period)
- **Emergency Maintenance**: As needed, with < 15 min notice on status page
- **Upgrades**: Coordinated with TON network upgrade schedule

### Update Process
1. Test updates on testnet validator (1-2 weeks)
2. Announce maintenance window to stakers (48h advance notice)
3. Execute upgrade during low-traffic period
4. Monitor for 24h post-upgrade
5. Publish post-mortem report

## Security Operations

### Key Management
- **Private Keys**: Stored in HSM (Hardware Security Module)
- **Backup Keys**: Multi-signature cold storage (3-of-5)
- **Access Control**: 2FA + IP whitelist for all admin access
- **Key Rotation**: Annual rotation schedule

### Incident Response
- **Detection**: 24/7 automated monitoring
- **Response Time**: < 15 minutes for critical issues
- **Communication**: Real-time updates on status page and Telegram
- **Post-Incident**: Public report within 48h

### DDoS Protection
- **CDN**: Cloudflare Pro (rate limiting, WAF)
- **Network**: Anti-DDoS filtering at datacenter level
- **Application**: Rate limiting on API endpoints

## Financial Operations

### Fee Collection
- **Fee Rate**: 2% of staking rewards
- **Collection**: Automatic via smart contract
- **Usage**: 
  - 60% Infrastructure costs (servers, monitoring, security)
  - 20% Development (improvements, audits)
  - 20% Operator compensation

### Reward Distribution
- **Frequency**: Every 24-48 hours (TON network cycle)
- **Method**: Automatic compounding (unless withdrawal requested)
- **Transparency**: All transactions visible on-chain

## Compliance & Legal

### Operator Information
- **Legal Entity**: Andrii Pylypchuk (Individual)
- **Location**: Bergmannweg 16, 65934 Frankfurt am Main, Germany
- **Tax ID**: DE456902445
- **Contact**: andrii.it.info@gmail.com

### Data Protection
- **GDPR Compliance**: Full compliance with EU data protection laws
- **Data Retention**: Only on-chain data (public blockchain)
- **User Privacy**: No personal data collected (non-custodial service)

### Audit Trail
- All validator operations logged
- Logs retained for 90 days
- Available upon request for security investigations

## Performance Metrics (Post-Launch)

These metrics will be published after deployment:

- **Total Value Locked (TVL)**: TBD
- **Number of Stakers**: TBD
- **Average APY (30-day)**: TBD
- **Uptime (30-day)**: TBD
- **Blocks Validated**: TBD
- **Missed Blocks**: TBD
- **Slashing Events**: 0 (target)

## Contact & Support

### For Stakers
- **General Questions**: https://ton-portal.onrender.com/faq
- **Technical Support**: andrii.it.info@gmail.com
- **Status Updates**: https://ton-portal.onrender.com/pool-status

### For Technical Issues
- **Emergency Contact**: +49 160 95030120 (24/7 for critical issues only)
- **Email**: andrii.it.info@gmail.com
- **Response Time**: < 4 hours for critical, < 24 hours for non-critical

### For Business/Partnership
- **Email**: andrii.it.info@gmail.com
- **Website**: https://www.andrii-it.de

---

**Last Updated**: 2025-10-31  
**Next Review**: 2025-11-30
