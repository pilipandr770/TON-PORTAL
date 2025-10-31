// file: static/js/tonconnect-ui-init.js
// Ініціалізація офіційного TonConnect UI (кнопка + модал з QR та списком гаманців)

(function () {
  console.log('Initializing TonConnect UI...');
  
  // Перевіряємо наявність бібліотеки UI
  if (typeof TonConnectUI === 'undefined') {
    console.error('TonConnect UI library not loaded!');
    alert("TonConnect UI Bibliothek konnte nicht geladen werden.\nBitte laden Sie die Seite neu (F5).");
    return;
  }

  try {
    // Створюємо UI-екземпляр і "вмонтовуємо" кнопку в елемент з id=tonconnect-ui-button
    const tonConnectUI = new TonConnectUI({
      manifestUrl: window.location.origin + '/tonconnect-manifest.json',
      buttonRootId: 'tonconnect-ui-button',
      // опційно: theme: 'DARK' | 'LIGHT' | 'SYSTEM'
    });

    console.log('TonConnect UI instance created successfully');

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
    alert('Fehler beim Initialisieren von TonConnect UI:\n' + error.message);
  }
})();
