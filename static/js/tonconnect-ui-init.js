// file: static/js/tonconnect-ui-init.js
// Ініціалізація офіційного TonConnect UI (кнопка + модал з QR та списком гаманців)

(function () {
  console.log('[TonConnect] Starting initialization...');
  
  // Функція ініціалізації з повторними спробами
  function initTonConnectUI(attempt = 0) {
    const maxAttempts = 20; // Збільшено для повільних з'єднань
    
    // Перевірка завантаження UI бібліотеки
    const TonConnectUIClass = window.TON_CONNECT_UI?.TonConnectUI || window.TonConnectUI;
    
    if (!TonConnectUIClass) {
      if (attempt < maxAttempts) {
        console.log('[TonConnect] Waiting for library... (', attempt + 1, '/', maxAttempts, ')');
        setTimeout(() => initTonConnectUI(attempt + 1), 300);
        return;
      } else {
        console.error('[TonConnect] ❌ Library not loaded after', maxAttempts, 'attempts');
        // Показати кнопку перезавантаження замість alert
        showReloadButton();
        return;
      }
    }

    // Перевірка наявності елемента для кнопки
    const buttonContainer = document.getElementById('tonconnect-ui-button');
    if (!buttonContainer) {
      if (attempt < maxAttempts) {
        console.log('[TonConnect] Waiting for button container... (', attempt + 1, '/', maxAttempts, ')');
        setTimeout(() => initTonConnectUI(attempt + 1), 300);
        return;
      } else {
        console.error('[TonConnect] ❌ Button container not found');
        return;
      }
    }

    try {
      console.log('[TonConnect] ✅ Library found! Creating instance...');
      
      // Повний URL до маніфесту (важливо для деяких гаманців)
      const manifestUrl = window.location.origin + '/tonconnect-manifest.json';
      console.log('[TonConnect] Manifest URL:', manifestUrl);
      
      // Перевіримо доступність маніфесту
      fetch(manifestUrl)
        .then(r => {
          console.log('[TonConnect] Manifest response:', r.status, r.statusText);
          if (!r.ok) {
            throw new Error('Manifest not accessible: ' + r.status);
          }
          return r.json();
        })
        .then(manifest => {
          console.log('[TonConnect] ✅ Manifest loaded:', manifest);
        })
        .catch(err => {
          console.error('[TonConnect] ❌ Manifest error:', err);
          showReloadButton('Manifest nicht erreichbar');
        });
      
      // Ініціалізація UI
      const tonConnectUI = new TonConnectUIClass({
        manifestUrl: manifestUrl,
        buttonRootId: 'tonconnect-ui-button'
      });

      console.log('[TonConnect] ✅ Instance created successfully!');
      console.log('[TonConnect] Connected:', tonConnectUI.connected);
      
      // Показати кнопку якщо вона прихована
      buttonContainer.style.display = 'block';

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
      console.log('[TonConnect] ✅ Ready!');
      
    } catch (error) {
      console.error('[TonConnect] ❌ Error:', error);
      showReloadButton();
    }
  }
  
  // Показати кнопку перезавантаження замість alert
  function showReloadButton(message) {
    const container = document.getElementById('tonconnect-ui-button');
    if (container) {
      const errorMsg = message || 'TonConnect UI nicht geladen';
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; background: #ff4444; color: white; border-radius: 8px;">
          <p style="margin-bottom: 10px;">❌ ${errorMsg}</p>
          <button onclick="location.reload()" 
                  style="background: white; color: #ff4444; border: none; padding: 10px 20px; 
                         border-radius: 6px; cursor: pointer; font-weight: bold;">
            🔄 Seite neu laden
          </button>
        </div>
      `;
    }
  }
  
  // Запустити ініціалізацію
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTonConnectUI());
  } else {
    initTonConnectUI();
  }
})();
