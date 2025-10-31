// file: static/js/tonconnect.js
// TonConnect UI integration для транзакцій стейкінгу
// Використовує window.__tonConnectUI__ з tonconnect-ui-init.js

window.TonUI = (function () {
  
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



  /**
   * Надсилає транзакцію делегування через TonConnect UI
   * @param {string} poolAddress - адреса пулу (base64 standard або raw)
   * @param {number} amountTon - сума в TON
   * @returns {Promise<boolean>} true якщо відправлено, false якщо скасовано
   */
  async function sendStake(poolAddress, amountTon) {
    // Отримуємо екземпляр TonConnect UI з tonconnect-ui-init.js
    const ui = window.__tonConnectUI__;
    
    if (!ui) {
      alert("TonConnect UI ist nicht initialisiert.\nBitte laden Sie die Seite neu (F5).");
      return false;
    }
    
    // Перевірка чи підключено гаманець
    const wallet = ui.wallet;
    if (!wallet) {
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

      const result = await ui.sendTransaction(transaction);
      
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
    console.log('TonUI.initDashboard() called');
    // Ініціалізація кнопок вже не потрібна - TonConnect UI керує підключенням
  }

  return { initDashboard, sendStake };
})();
