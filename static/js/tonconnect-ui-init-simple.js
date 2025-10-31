// Minimal TonConnect UI initialization
console.log('TonConnect init started');

// Перевірка маніфесту на відповідність домену
fetch('/tonconnect-manifest.json')
  .then(r => r.json())
  .then(man => {
    try {
      const u = new URL(man.url);
      if (u.origin !== location.origin) {
        console.warn('[TonConnect] Manifest origin mismatch:', u.origin, 'vs', location.origin);
        alert('⚠️ Увага: tonconnect-manifest.json має інший домен. Виправте поле "url"!');
      } else {
        console.log('✅ Manifest origin OK:', man.url);
      }
    } catch (e) {
      console.error('[TonConnect] Manifest URL parse error:', e);
    }
  })
  .catch(e => console.error('[TonConnect] Failed to load manifest:', e));

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
    console.log('Creating TonConnect UI with manifest:', window.location.origin + '/tonconnect-manifest.json');
    
    const ui = new TonConnectUI({
      manifestUrl: window.location.origin + '/tonconnect-manifest.json',
      buttonRootId: 'tonconnect-ui-button'
    });
    
    console.log('✅ TonConnect UI created');
    console.log('Initial connected state:', ui.connected);
    console.log('Initial wallet:', ui.wallet);
    
    // Перевірка з'єднання кожні 5 секунд
    setInterval(() => {
      console.log('Connection check - Connected:', ui.connected, 'Wallet:', ui.wallet ? 'Yes' : 'No');
    }, 5000);
    
    ui.onStatusChange((wallet) => {
      console.log('�🔔🔔 WALLET STATUS CHANGED 🔔🔔🔔');
      console.log('Full wallet object:', JSON.stringify(wallet, null, 2));
      
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
