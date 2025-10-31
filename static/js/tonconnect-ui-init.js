// file: static/js/tonconnect-ui-init.js
// Ініціалізація офіційного TonConnect UI (кнопка + модал з QR та списком гаманців)

(function () {
  console.log('[TonConnect] Initializing TonConnect UI...');
  
  // Перевірка завантаження UI
  if (!window.TON_CONNECT_UI) {
    alert("TonConnect UI не завантажився. Натисніть F5.\n(перевір CDN / CSP)");
    return;
  }

  // Швидка перевірка маніфесту: origin повинен збігатися з location.origin
  fetch('/tonconnect-manifest.json')
    .then(r => r.json())
    .then(man => {
      try {
        const u = new URL(man.url);
        if (u.origin !== window.location.origin) {
          console.warn('[TonConnect] Manifest URL origin mismatch:', u.origin, 'vs', window.location.origin);
          alert("Увага: у tonconnect-manifest.json інший домен у полі 'url'. Виправте на ваш Render-домен.");
        } else {
          console.log('[TonConnect] ✅ Manifest origin matches:', u.origin);
        }
      } catch(e) { 
        console.error('[TonConnect] Error parsing manifest URL:', e);
      }
    })
    .catch(err => {
      console.error('[TonConnect] Failed to fetch manifest:', err);
    });
  
  // Функція ініціалізації з повторними спробами
  function initTonConnectUI(attempt = 0) {
    const maxAttempts = 10;

    // Перевірка наявності елемента для кнопки
    const buttonContainer = document.getElementById('tonconnect-ui-button');
    if (!buttonContainer) {
      console.warn('[TonConnect] Button container #tonconnect-ui-button not found yet, waiting...');
      if (attempt < maxAttempts) {
        setTimeout(() => initTonConnectUI(attempt + 1), 200);
        return;
      } else {
        console.error('[TonConnect] Button container not found after', maxAttempts, 'attempts');
        return;
      }
    }

    try {
      console.log('[TonConnect] Creating TonConnect UI instance...');
      
      // Ініціалізація UI
      const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: '/tonconnect-manifest.json',
        buttonRootId: 'tonconnect-ui-button'
      });

      console.log('[TonConnect] ✅ TonConnect UI instance created');
      console.log('[TonConnect] Current state - Connected:', tonConnectUI.connected);
      console.log('[TonConnect] Current wallet:', tonConnectUI.wallet);

    // Базова діагностика в консоль
    tonConnectUI.onStatusChange(async (walletInfo) => {
      console.log('[TonConnect] status change:', walletInfo);
      
      const statusEl = document.getElementById('wallet-status');
      const addrEl = document.getElementById('addr');
      const btnRefresh = document.getElementById('btn-refresh');
      const netEl = document.getElementById('net');
      const balEl = document.getElementById('bal');

      if (walletInfo) {
        const account = walletInfo.account;
        const address = account?.address || '—';
        
        console.log('[TonConnect] ✅ Wallet connected! Address:', address);
        
        statusEl && (statusEl.textContent = 'Verbunden.');
        addrEl && (addrEl.textContent = address);
        btnRefresh && btnRefresh.removeAttribute('disabled');
        
        // Автоматично завантажити баланс
        if (address && address !== '—') {
          try {
            netEl && (netEl.textContent = 'Wird geladen...');
            balEl && (balEl.textContent = '...');
            
            const res = await fetch(`/api/balance/${address}`);
            const data = await res.json();
            
            if (data && !data.error) {
              balEl && (balEl.textContent = (data.balance_ton || 0).toFixed(4));
              netEl && (netEl.textContent = data.network || 'mainnet');
              console.log('[TonConnect] Balance loaded:', data.balance_ton, 'TON');
            } else {
              netEl && (netEl.textContent = '—');
              balEl && (balEl.textContent = '—');
            }
          } catch (e) {
            console.error('[TonConnect] Error loading balance:', e);
            netEl && (netEl.textContent = '—');
            balEl && (balEl.textContent = '—');
          }
        }
      } else {
        console.log('[TonConnect] Wallet disconnected');
        
        statusEl && (statusEl.textContent = 'Noch nicht verbunden.');
        addrEl && (addrEl.textContent = '—');
        netEl && (netEl.textContent = '—');
        balEl && (balEl.textContent = '—');
        btnRefresh && btnRefresh.setAttribute('disabled', 'true');
      }
    });

    // Якщо сесія відновлена (корисно після перезавантаження)
    tonConnectUI.connectionRestored.then(restored => {
      console.log('[TonConnect] connectionRestored:', restored);
    });

    // Клік "Aktualisieren" → запит балансу через наш бекенд
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        const addr = document.getElementById('addr')?.textContent;
        const netEl = document.getElementById('net');
        const balEl = document.getElementById('bal');
        
        if (!addr || addr === '—') return;
        
        try {
          netEl && (netEl.textContent = 'Wird geladen...');
          balEl && (balEl.textContent = '...');
          
          const res = await fetch(`/api/balance/${addr}`);
          const data = await res.json();
          
          if (data && !data.error) {
            balEl && (balEl.textContent = (data.balance_ton || 0).toFixed(4));
            netEl && (netEl.textContent = data.network || 'mainnet');
          } else {
            console.error('Balance API error:', data.error);
            netEl && (netEl.textContent = '—');
            balEl && (balEl.textContent = '—');
          }
        } catch (e) {
          console.error('Error refreshing balance:', e);
          netEl && (netEl.textContent = 'Fehler');
          balEl && (balEl.textContent = '—');
        }
      });
    }

      // Експорт для відправки транзакцій
      window.__tonConnectUI__ = tonConnectUI;
      console.log('[TonConnect] ✅ Initialization complete');
      
    } catch (error) {
      console.error('[TonConnect] ❌ Failed to initialize:', error);
      alert('Fehler beim Initialisieren von TonConnect UI:\n' + error.message);
    }
  }
  
  // Запустити ініціалізацію після завантаження DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM loaded, initializing TonConnect UI...');
      initTonConnectUI();
    });
  } else {
    console.log('DOM already loaded, initializing TonConnect UI...');
    initTonConnectUI();
  }
})();
