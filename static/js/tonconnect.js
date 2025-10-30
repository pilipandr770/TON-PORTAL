// file: static/js/tonconnect.js
// TonConnect UI integration для QR-кодів і модального вікна підключення
// Використовує @tonconnect/ui з CDN (base.html)

window.TonUI = (function () {
  let tonConnectUI = null;
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

  // Ініціалізація TonConnect UI
  function initTonConnect() {
    if (tonConnectUI) {
      console.log('TonConnect UI already initialized');
      return; // Вже ініціалізовано
    }
    
    console.log('Starting TonConnect UI initialization...');
    
    try {
      // Перевірка наявності TonConnect UI у глобальній області
      // @tonconnect/ui експортує TonConnectUI глобально
      if (typeof TonConnectUI === 'undefined') {
        console.error('TonConnect UI not loaded. Make sure the script is loaded.');
        console.error('Available global objects:', Object.keys(window).filter(k => k.includes('Ton') || k.includes('TON')));
        setStatus('Fehler: TonConnect UI nicht geladen.');
        return;
      }

      console.log('TonConnectUI class found, creating instance...');

      // Створити екземпляр TonConnectUI
      const manifestUrl = window.location.origin + '/tonconnect-manifest.json';
      console.log('Manifest URL:', manifestUrl);
      
      tonConnectUI = new TonConnectUI({
        manifestUrl: manifestUrl,
        buttonRootId: null // Не використовуємо вбудовану кнопку
      });
      
      console.log('TonConnectUI instance created');

      // Підписка на зміни статусу підключення
      tonConnectUI.onStatusChange(wallet => {
        if (wallet) {
          connectedAddress = wallet.account.address;
          console.log('Wallet connected:', connectedAddress);
          setStatus('Verbunden.');
          setAddr(connectedAddress);
          
          document.getElementById('btn-disconnect')?.removeAttribute('disabled');
          document.getElementById('btn-refresh')?.removeAttribute('disabled');
          
          // Автоматично завантажити баланс
          refreshBalance();
        } else {
          console.log('Wallet disconnected');
          connectedAddress = null;
          setStatus('Noch nicht verbunden.');
          setAddr('—');
          setNet('—');
          setBal('—');
          
          document.getElementById('btn-disconnect')?.setAttribute('disabled', 'true');
          document.getElementById('btn-refresh')?.setAttribute('disabled', 'true');
        }
      });

      console.log('TonConnect UI initialized successfully');
      setStatus('Bereit zum Verbinden.');
    } catch (e) {
      console.error('TonConnect UI initialization error:', e);
      console.error('Error details:', e.message, e.stack);
      setStatus('Fehler beim Laden von TonConnect: ' + e.message);
    }
  }

  async function connect() {
    console.log('Connect button clicked');
    
    try {
      if (!tonConnectUI) {
        console.log('TonConnectUI not initialized, initializing now...');
        initTonConnect();
        if (!tonConnectUI) {
          console.error('Failed to initialize TonConnectUI');
          alert('TonConnect UI konnte nicht geladen werden. Bitte Seite neu laden.');
          return;
        }
      }

      console.log('Setting status: Connecting...');
      setStatus('Verbindung wird hergestellt...');
      
      console.log('Opening modal...');
      // Відкрити модальне вікно з QR-кодом
      await tonConnectUI.openModal();
      console.log('Modal opened successfully');
      
    } catch (e) {
      console.error('TonConnect error:', e);
      console.error('Error details:', e.message, e.stack);
      setStatus('Verbindung fehlgeschlagen: ' + e.message);
    }
  }

  async function disconnect() {
    try {
      if (tonConnectUI) {
        await tonConnectUI.disconnect();
      }
    } catch (e) { 
      console.warn('Disconnect error:', e); 
    }
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
    if (!tonConnectUI || !connectedAddress) {
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

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 хвилин
        messages: [
          {
            address: poolAddress,
            amount: amountNano
            // payload: "" // Якщо конкретний пул вимагає payload, додамо поле у pools.json і тут підставимо
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('Stake transaction sent successfully:', result);
      return true;
    } catch (e) {
      // Користувач міг скасувати або сталася помилка
      console.warn('sendStake canceled or failed:', e);
      
      // Перевірка чи це скасування користувачем
      if (e.message && (e.message.includes('reject') || e.message.includes('cancel'))) {
        console.log('Transaction rejected by user');
        return false;
      }
      
      // Інші помилки
      throw e;
    }
  }

  function initDashboard() {
    // Ініціалізувати TonConnect UI
    initTonConnect();

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
