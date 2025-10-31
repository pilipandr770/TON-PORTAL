// Minimal TonConnect UI initialization
console.log('TonConnect init started');

function waitForLibrary(attempt = 0) {
  console.log('Check attempt:', attempt);
  
  if (window.TON_CONNECT_UI || window.TonConnectUI) {
    console.log('✅ Library found!');
    initUI();
  } else if (attempt < 30) {
    setTimeout(() => waitForLibrary(attempt + 1), 500);
  } else {
    console.error('❌ Library not loaded');
    const btn = document.getElementById('tonconnect-ui-button');
    if (btn) {
      btn.innerHTML = '<button onclick="location.reload()" style="padding:10px 20px; background:#f44; color:white; border:none; border-radius:8px; cursor:pointer;">🔄 Reload Page</button>';
    }
  }
}

function initUI() {
  const TonConnectUI = window.TON_CONNECT_UI?.TonConnectUI || window.TonConnectUI;
  
  try {
    const ui = new TonConnectUI({
      manifestUrl: window.location.origin + '/tonconnect-manifest.json',
      buttonRootId: 'tonconnect-ui-button'
    });
    
    console.log('✅ TonConnect UI created');
    
    ui.onStatusChange((wallet) => {
      console.log('📱 Wallet status changed:', wallet);
      
      if (wallet && wallet.account) {
        const addr = wallet.account.address;
        console.log('✅ Connected:', addr);
        
        document.getElementById('wallet-status').textContent = 'Verbunden';
        document.getElementById('addr').textContent = addr;
        document.getElementById('btn-refresh').disabled = false;
        
        // Load balance
        fetch('/api/balance/' + addr)
          .then(r => r.json())
          .then(data => {
            if (data && !data.error) {
              document.getElementById('bal').textContent = data.balance_ton.toFixed(4);
              document.getElementById('net').textContent = data.network || 'mainnet';
            }
          })
          .catch(e => console.error('Balance error:', e));
      } else {
        console.log('❌ Disconnected');
        document.getElementById('wallet-status').textContent = 'Noch nicht verbunden';
        document.getElementById('addr').textContent = '—';
        document.getElementById('bal').textContent = '—';
        document.getElementById('net').textContent = '—';
        document.getElementById('btn-refresh').disabled = true;
      }
    });
    
    // Refresh button
    document.getElementById('btn-refresh')?.addEventListener('click', async () => {
      const addr = document.getElementById('addr').textContent;
      if (addr === '—') return;
      
      try {
        const res = await fetch('/api/balance/' + addr);
        const data = await res.json();
        if (data && !data.error) {
          document.getElementById('bal').textContent = data.balance_ton.toFixed(4);
          document.getElementById('net').textContent = data.network || 'mainnet';
        }
      } catch (e) {
        console.error('Refresh error:', e);
      }
    });
    
    window.__tonConnectUI__ = ui;
    console.log('✅ Ready!');
    
  } catch (e) {
    console.error('❌ Init error:', e);
  }
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForLibrary());
} else {
  waitForLibrary();
}
