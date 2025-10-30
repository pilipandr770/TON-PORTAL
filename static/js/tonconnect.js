// file: static/js/tonconnect.js
// Простий шар для підключення TonConnect у браузері.
// Використовує CDN @tonconnect/sdk у base.html (unpkg).

window.TonUI = (function () {
  let connector = null;
  let connectedAddress = null;

  function setStatus(msg) {
    const el = document.getElementById('wallet-status');
    if (el) el.textContent = msg;
  }

  function setAddr(addr) {
    const el = document.getElementById('addr');
    if (el) el.textContent = addr || '—';
  }

  function setNet(net) {
    const el = document.getElementById('net');
    if (el) el.textContent = net || '—';
  }

  function setBal(bal) {
    const el = document.getElementById('bal');
    if (el) el.textContent = typeof bal === 'number' ? bal.toFixed(4) : '—';
  }

  async function connect() {
    try {
      setStatus('Verbindung wird hergestellt...');
      
      // Перевірка наявності TON_CONNECT SDK
      if (!window.TON_CONNECT || !window.TON_CONNECT.TonConnect) {
        setStatus('TonConnect SDK wird geladen...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!window.TON_CONNECT || !window.TON_CONNECT.TonConnect) {
          setStatus('Fehler: TonConnect SDK nicht verfügbar.');
          return;
        }
      }

      const TonConnect = window.TON_CONNECT.TonConnect;
      // Використовуємо наш локальний маніфест
      connector = new TonConnect({ 
        manifestUrl: '/tonconnect-manifest.json' 
      });

      // відкриття модального вибору гаманця
      const walletsList = await connector.getWallets();
      if (!walletsList || walletsList.length === 0) {
        setStatus('Keine Wallets gefunden. Bitte installiere Tonkeeper/Tonhub.');
        return;
      }

      await connector.connect({
        universalLink: walletsList[0].universalLink,
        bridgeUrl: walletsList[0].bridgeUrl
      });

      const account = connector.account;
      connectedAddress = account?.address || null;

      if (connectedAddress) {
        setStatus('Verbunden.');
        setAddr(connectedAddress);
        
        document.getElementById('btn-disconnect')?.removeAttribute('disabled');
        document.getElementById('btn-refresh')?.removeAttribute('disabled');
        
        // Автоматично завантажити баланс
        await refreshBalance();
      } else {
        setStatus('Verbindung fehlgeschlagen.');
      }
    } catch (e) {
      console.error('TonConnect error:', e);
      setStatus('Verbindung fehlgeschlagen: ' + e.message);
    }
  }

  async function disconnect() {
    try {
      if (connector) await connector.disconnect();
    } catch (e) { 
      console.warn('Disconnect error:', e); 
    }
    
    connectedAddress = null;
    setStatus('Noch nicht verbunden.');
    setAddr('—'); 
    setNet('—'); 
    setBal('—');
    
    document.getElementById('btn-disconnect')?.setAttribute('disabled', 'true');
    document.getElementById('btn-refresh')?.setAttribute('disabled', 'true');
  }

  async function refreshBalance() {
    if (!connectedAddress) {
      setStatus('Keine Wallet verbunden.');
      return;
    }
    
    try {
      setNet('Wird geladen...');
      setBal('...');
      
      const res = await fetch(`/api/balance/${connectedAddress}`);
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setNet(data.network);
      setBal(data.balance_ton);
    } catch (e) {
      console.error('Balance fetch error:', e);
      setNet('Fehler');
      setBal('—');
      alert('Fehler beim Laden des Guthabens: ' + e.message);
    }
  }

  /**
   * Надсилає транзакцію делегування (простий внутрішній переказ TON на адресу пулу).
   * @param {string} poolAddress - адреса пулу (base64 standard або raw)
   * @param {number} amountTon - сума в TON
   * @returns {Promise<boolean>} true якщо відправлено, false якщо скасовано
   */
  async function sendStake(poolAddress, amountTon) {
    if (!connector || !connectedAddress) {
      setStatus('Verbinde zuerst dein Wallet.');
      alert('Bitte verbinde zuerst dein Wallet.');
      return false;
    }
    
    if (!poolAddress || !amountTon || amountTon <= 0) {
      alert('Ungültige Pool-Adresse oder Menge.');
      return false;
    }

    // TonConnect очікує значення в нанотонах рядком
    const amountNano = BigInt(Math.floor(amountTon * 1e9)).toString();

    try {
      console.log('Sending stake:', {
        poolAddress,
        amountTon,
        amountNano
      });

      await connector.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 хвилин
        messages: [
          {
            address: poolAddress,
            amount: amountNano
            // payload: "" // Якщо конкретний пул вимагає payload, додамо поле у pools.json і тут підставимо
          }
        ]
      });
      
      console.log('Stake transaction sent successfully');
      return true;
    } catch (e) {
      // Користувач міг скасувати або сталася помилка
      console.warn('sendStake canceled or failed:', e);
      
      // Перевірка чи це скасування користувачем
      if (e.message && e.message.includes('reject')) {
        console.log('Transaction rejected by user');
        return false;
      }
      
      // Інші помилки
      throw e;
    }
  }

  function initDashboard() {
    const btnConnect = document.getElementById('btn-connect');
    const btnDisconnect = document.getElementById('btn-disconnect');
    const btnRefresh = document.getElementById('btn-refresh');

    if (btnConnect) {
      btnConnect.addEventListener('click', connect);
    }
    
    if (btnDisconnect) {
      btnDisconnect.addEventListener('click', disconnect);
    }
    
    if (btnRefresh) {
      btnRefresh.addEventListener('click', refreshBalance);
    }
  }

  return { initDashboard, sendStake };
})();
