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
    if (tonConnectUI) return; // Вже ініціалізовано
    
    try {
      // Перевірка наявності TonConnect UI у глобальній області
      if (typeof TonConnectUI === 'undefined') {
        console.error('TonConnect UI not loaded');
        setStatus('Fehler: TonConnect UI nicht geladen.');
        return;
      }

      // Створити екземпляр TonConnectUI
      tonConnectUI = new TonConnectUI({
        manifestUrl: window.location.origin + '/tonconnect-manifest.json',
        buttonRootId: null // Не використовуємо вбудовану кнопку
      });

      // Підписка на зміни статусу підключення
      tonConnectUI.onStatusChange(wallet => {
        if (wallet) {
          connectedAddress = wallet.account.address;
          setStatus('Verbunden.');
          setAddr(connectedAddress);
          
          document.getElementById('btn-disconnect')?.removeAttribute('disabled');
          document.getElementById('btn-refresh')?.removeAttribute('disabled');
          
          // Автоматично завантажити баланс
          refreshBalance();
        } else {
          connectedAddress = null;
          setStatus('Noch nicht verbunden.');
          setAddr('—');
          setNet('—');
          setBal('—');
          
          document.getElementById('btn-disconnect')?.setAttribute('disabled', 'true');
          document.getElementById('btn-refresh')?.setAttribute('disabled', 'true');
        }
      });

      setStatus('Bereit zum Verbinden.');
    } catch (e) {
      console.error('TonConnect error:', e);
      setStatus('Fehler: ' + e.message);
    }
  }

  async function connect() {
    try {
      if (!tonConnectUI) {
        // Спробувати ініціалізувати
        initTonConnect();
        
        // Якщо не вдалось - можливо CDN ще завантажується
        if (!tonConnectUI && typeof TonConnectUI === 'undefined') {
          setStatus('TonConnect wird geladen...');
          
          // Зачекати 2 секунди і спробувати знову
          await new Promise(resolve => setTimeout(resolve, 2000));
          initTonConnect();
          
          if (!tonConnectUI) {
            alert('TonConnect UI konnte nicht geladen werden.\n\nBitte:\n1. Prüfen Sie Ihre Internetverbindung\n2. Laden Sie die Seite neu (F5)');
            return;
          }
        } else if (!tonConnectUI) {
          // TonConnectUI є, але не вдалось створити інстанс
          alert('Fehler beim Initialisieren von TonConnect.\nBitte laden Sie die Seite neu.');
          return;
        }
      }

      setStatus('Verbindung wird hergestellt...');
      await tonConnectUI.openModal();
      
    } catch (e) {
      console.error('TonConnect error:', e);
      setStatus('Verbindung fehlgeschlagen: ' + e.message);
      alert('Verbindungsfehler: ' + e.message);
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
