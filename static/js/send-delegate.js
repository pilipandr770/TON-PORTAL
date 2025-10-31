// file: static/js/send-delegate.js
// Делегація напряму в адресу пулу через TonConnect UI (non-custodial).
// Виклик: TonDelegate.send(poolAddress, amountTon, payloadBase64?)
window.TonDelegate = (function () {
  function assert(cond, msg) { if (!cond) throw new Error(msg); }

  /**
   * Надіслати транзакцію делегування у пул.
   * @param {string} poolAddress - адреса пулу (base64 стандарт або raw, як у pools.json)
   * @param {number} amountTon - сума в TON (наприклад, 10.5)
   * @param {string=} payloadBase64 - опційно: base64 BOC/payload, якщо конкретний пул вимагає
   * @returns {Promise<boolean>} true якщо користувач підписав; false якщо скасував
   */
  async function send(poolAddress, amountTon, payloadBase64) {
    const ui = window.__tonConnectUI__;
    assert(!!ui, "TonConnect UI не ініціалізовано");
    assert(typeof poolAddress === "string" && poolAddress.length > 10, "Невірна адреса пулу");
    assert(typeof amountTon === "number" && amountTon > 0, "Невірна сума");

    const amountNano = BigInt(Math.floor(amountTon * 1e9)).toString();
    const message = { address: poolAddress, amount: amountNano };
    if (payloadBase64) message.payload = payloadBase64;

    try {
      await ui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [message]
      });
      return true;
    } catch (e) {
      console.warn("[TonDelegate] Відхилено або помилка:", e);
      return false;
    }
  }

  return { send };
})();
