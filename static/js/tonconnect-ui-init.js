// file: static/js/tonconnect-ui-init.js
// Ініціалізація офіційного TonConnect UI (кнопка + модал з QR та списком гаманців)

(function () {
  console.log('Initializing TonConnect UI...');
  
  // Функція ініціалізації з повторними спробами
  function initTonConnectUI(attempt = 0) {
    const maxAttempts = 10;
    
    // Перевіряємо наявність бібліотеки UI в різних можливих місцях
    // Бібліотека може експортуватись як:
    // - window.TonConnectUI (старі версії)
    // - window.TON_CONNECT_UI.TonConnectUI (нові версії)
    let TonConnectUIClass = null;
    
    if (typeof window.TonConnectUI !== 'undefined') {
      TonConnectUIClass = window.TonConnectUI;
      console.log('Found TonConnectUI at window.TonConnectUI');
    } else if (typeof window.TON_CONNECT_UI !== 'undefined' && window.TON_CONNECT_UI.TonConnectUI) {
      TonConnectUIClass = window.TON_CONNECT_UI.TonConnectUI;
      console.log('Found TonConnectUI at window.TON_CONNECT_UI.TonConnectUI');
    }
    
    if (!TonConnectUIClass) {
      if (attempt < maxAttempts) {
        console.log(`Waiting for TonConnect UI library... (attempt ${attempt + 1}/${maxAttempts})`);
        setTimeout(() => initTonConnectUI(attempt + 1), 200);
        return;
      } else {
        console.error('TonConnect UI library not loaded after', maxAttempts, 'attempts!');
        console.error('Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('ton')));
        alert("TonConnect UI Bibliothek konnte nicht geladen werden.\nBitte laden Sie die Seite neu (F5).");
        return;
      }
    }

    // Перевірка наявності елемента для кнопки
    const buttonContainer = document.getElementById('tonconnect-ui-button');
    if (!buttonContainer) {
      console.warn('Button container #tonconnect-ui-button not found yet, waiting...');
      if (attempt < maxAttempts) {
        setTimeout(() => initTonConnectUI(attempt + 1), 200);
        return;
      } else {
        console.error('Button container not found after', maxAttempts, 'attempts');
        // Створюємо без кнопки (тільки для програмного виклику)
        createInstanceWithoutButton(TonConnectUIClass);
        return;
      }
    }

    try {
      console.log('TonConnect UI library found, creating instance with button...');
      
      // Створюємо UI-екземпляр і "вмонтовуємо" кнопку в елемент з id=tonconnect-ui-button
      const tonConnectUI = new TonConnectUIClass({
        manifestUrl: window.location.origin + '/tonconnect-manifest.json',
        buttonRootId: 'tonconnect-ui-button',
        // опційно: theme: 'DARK' | 'LIGHT' | 'SYSTEM'
      });

      console.log('TonConnect UI instance created successfully with button');

    // Коли статус з'єднання змінюється — оновлюємо інтерфейс
    tonConnectUI.onStatusChange(async (walletInfo) => {
      const statusEl = document.getElementById('wallet-status');
      const addrEl = document.getElementById('addr');
      const btnRefresh = document.getElementById('btn-refresh');
      const btnStake = document.getElementById('btn-stake');
      const netEl = document.getElementById('net');
      const balEl = document.getElementById('bal');

      if (walletInfo) {
        // Підключено
        const account = walletInfo.account;
        const address = account?.address || '—';
        
        console.log('Wallet connected:', address);
        
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
            } else {
              netEl && (netEl.textContent = '—');
              balEl && (balEl.textContent = '—');
            }
          } catch (e) {
            console.error('Error loading balance:', e);
            netEl && (netEl.textContent = '—');
            balEl && (balEl.textContent = '—');
          }
        }
      } else {
        // Відключено
        console.log('Wallet disconnected');
        
        statusEl && (statusEl.textContent = 'Noch nicht verbunden.');
        addrEl && (addrEl.textContent = '—');
        netEl && (netEl.textContent = '—');
        balEl && (balEl.textContent = '—');
        btnRefresh && btnRefresh.setAttribute('disabled', 'true');
      }
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

      // Експортуємо екземпляр, щоб TonUI.sendStake могла ним користуватись
      window.__tonConnectUI__ = tonConnectUI;
      console.log('TonConnect UI initialization complete');
      
    } catch (error) {
      console.error('Failed to initialize TonConnect UI:', error);
      console.error('Error details:', error);
      // Не показуємо alert, якщо це проблема з buttonRootId - спробуємо без кнопки
      if (error.message && error.message.includes('buttonRootId')) {
        console.warn('Button element issue, trying without button...');
        createInstanceWithoutButton(TonConnectUIClass);
      } else {
        alert('Fehler beim Initialisieren von TonConnect UI:\n' + error.message);
      }
    }
  }
  
  // Функція для створення екземпляру без кнопки (fallback)
  function createInstanceWithoutButton(TonConnectUIClass) {
    try {
      console.log('Creating TonConnect UI instance without button...');
      
      const tonConnectUI = new TonConnectUIClass({
        manifestUrl: window.location.origin + '/tonconnect-manifest.json',
        // Без buttonRootId - кнопка не створюється автоматично
      });
      
      console.log('TonConnect UI instance created without button');
      
      // Той самий код для onStatusChange
      tonConnectUI.onStatusChange(async (walletInfo) => {
        const statusEl = document.getElementById('wallet-status');
        const addrEl = document.getElementById('addr');
        const btnRefresh = document.getElementById('btn-refresh');
        const netEl = document.getElementById('net');
        const balEl = document.getElementById('bal');

        if (walletInfo) {
          const account = walletInfo.account;
          const address = account?.address || '—';
          
          console.log('Wallet connected:', address);
          
          statusEl && (statusEl.textContent = 'Verbunden.');
          addrEl && (addrEl.textContent = address);
          btnRefresh && btnRefresh.removeAttribute('disabled');
          
          if (address && address !== '—') {
            try {
              netEl && (netEl.textContent = 'Wird geladen...');
              balEl && (balEl.textContent = '...');
              
              const res = await fetch(`/api/balance/${address}`);
              const data = await res.json();
              
              if (data && !data.error) {
                balEl && (balEl.textContent = (data.balance_ton || 0).toFixed(4));
                netEl && (netEl.textContent = data.network || 'mainnet');
              } else {
                netEl && (netEl.textContent = '—');
                balEl && (balEl.textContent = '—');
              }
            } catch (e) {
              console.error('Error loading balance:', e);
              netEl && (netEl.textContent = '—');
              balEl && (balEl.textContent = '—');
            }
          }
        } else {
          console.log('Wallet disconnected');
          
          statusEl && (statusEl.textContent = 'Noch nicht verbunden.');
          addrEl && (addrEl.textContent = '—');
          netEl && (netEl.textContent = '—');
          balEl && (balEl.textContent = '—');
          btnRefresh && btnRefresh.setAttribute('disabled', 'true');
        }
      });

      // Refresh button handler
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
      
      window.__tonConnectUI__ = tonConnectUI;
      console.log('TonConnect UI ready (without button)');
      
      // Створити кастомну кнопку якщо елемент існує
      const buttonContainer = document.getElementById('tonconnect-ui-button');
      if (buttonContainer) {
        buttonContainer.innerHTML = '<button id="custom-connect-btn" class="btn" style="background: #0098EA; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">Connect Wallet</button>';
        
        document.getElementById('custom-connect-btn').addEventListener('click', async () => {
          try {
            await tonConnectUI.openModal();
          } catch (e) {
            console.error('Error opening modal:', e);
          }
        });
        
        console.log('Custom connect button created');
      }
      
    } catch (error) {
      console.error('Failed to create instance without button:', error);
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
