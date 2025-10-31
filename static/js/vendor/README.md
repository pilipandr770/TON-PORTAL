# Vendor Scripts

This directory contains vendored (locally hosted) versions of external dependencies to reduce reliance on CDNs and improve CSP security.

## TonConnect Libraries

### Required Files:

1. **tonconnect-sdk.min.js**
   - Source: https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js
   - Version: Latest stable
   - Purpose: Core TonConnect protocol implementation

2. **tonconnect-ui.min.js**
   - Source: https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js
   - Version: Latest stable
   - Purpose: UI components for wallet connection

## Installation Instructions

### Option 1: Manual Download (Recommended)

```powershell
# Download TonConnect SDK
Invoke-WebRequest -Uri "https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js" -OutFile ".\static\js\vendor\tonconnect-sdk.min.js"

# Download TonConnect UI
Invoke-WebRequest -Uri "https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js" -OutFile ".\static\js\vendor\tonconnect-ui.min.js"
```

### Option 2: Using npm/yarn

```bash
# Install packages
npm install @tonconnect/sdk @tonconnect/ui

# Copy bundles
cp node_modules/@tonconnect/sdk/dist/tonconnect-sdk.min.js static/js/vendor/
cp node_modules/@tonconnect/ui/dist/tonconnect-ui.min.js static/js/vendor/
```

## Verification

After downloading, verify the files are not placeholders:

```powershell
# Check file sizes (should be > 50KB each)
Get-ChildItem .\static\js\vendor\*.js | Select-Object Name, Length
```

## CSP Configuration

Once vendor files are in place, update `app.py` CSP to remove CDN dependencies:

```python
"script-src 'self'; "  # Remove unpkg.com, cdn.jsdelivr.net
```

## Updating

To update to the latest versions, simply re-download the files using the commands above.

Last updated: 2025-10-31
