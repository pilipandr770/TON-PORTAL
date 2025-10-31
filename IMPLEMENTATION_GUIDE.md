# 🚀 Покрокова інструкція впровадження нових функцій

## ✅ Що вже зроблено

1. ✅ **Функція делегування через TonConnect**
   - Створено `static/js/send-delegate.js` з методом `TonDelegate.send()`
   - Додано кнопку "Делегувати" на сторінці пулів
   - Підключено скрипт в `base.html`

2. ✅ **Структура для вендорних скриптів**
   - Створено директорію `static/js/vendor/`
   - Додано README з інструкціями
   - Створено заглушки для TonConnect SDK/UI

3. ✅ **Структура офіційного пулу**
   - Створено директорію `my_pool/` з повною документацією
   - `config.json` - конфігурація пулу
   - `README.md` - опис і технічні деталі
   - `validator-info.md` - операційна інформація
   - `deploy.ps1` - скрипт деплою
   - `audit/` - директорія для аудитів

4. ✅ **Покращена CSP**
   - Додано коментарі про майбутню строгішу CSP
   - Приготовано шаблон строгої CSP для пост-вендоризації

5. ✅ **Health Check Endpoint**
   - Додано `/healthz` для моніторингу Render.com

---

## 📋 Наступні кроки (пріоритети)

### 🔴 Пріоритет 1: Завантажити TonConnect бібліотеки локально

**Мета**: Прибрати залежність від CDN (unpkg.com) для максимальної безпеки

```powershell
# Запустити скрипт завантаження
.\download-vendor-libs.ps1

# Перевірити, що файли завантажились (> 50KB кожен)
Get-ChildItem .\static\js\vendor\*.js | Select-Object Name, Length
```

**Після завантаження:**

1. Оновити `templates/base.html` - замінити CDN на локальні файли:

```html
<!-- BEFORE (CDN): -->
<script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js" defer></script>

<!-- AFTER (Local): -->
<script src="{{ url_for('static', filename='js/vendor/tonconnect-sdk.min.js') }}" defer></script>
<script src="{{ url_for('static', filename='js/vendor/tonconnect-ui.min.js') }}" defer></script>
```

2. Оновити `app.py` CSP (розкоментувати строгу версію):

```python
# Замінити поточну CSP на строгу (в app.py, функція set_security_headers)
# Видалити: https://unpkg.com https://cdn.jsdelivr.net
# Видалити: 'unsafe-inline' зі script-src
```

3. Тестування:
```powershell
flask run
# Відкрити http://localhost:5000 та перевірити:
# - DevTools → Network → немає запитів до unpkg.com
# - DevTools → Console → немає CSP помилок
# - Wallet підключається успішно
```

---

### 🟡 Пріоритет 2: Протестувати функцію делегування

**Мета**: Перевірити, що транзакції відправляються коректно

1. Запустити локально:
```powershell
flask run
```

2. Тестовий сценарій:
   - Відкрити `/dashboard`
   - Підключити Tonkeeper (testnet)
   - Перейти на `/pools`
   - Натиснути "Делегувати" на будь-якому пулі
   - Ввести тестову суму (наприклад, 1 TON)
   - Перевірити, що:
     - ✅ Wallet відкривається з транзакцією
     - ✅ Адреса пулу правильна
     - ✅ Сума правильна
     - ✅ Можна підтвердити або скасувати

3. Перевірити в консолі браузера:
```javascript
// Має бути доступний глобально
console.log(window.TonDelegate);
// Має бути об'єкт з методом send
```

---

### 🟡 Пріоритет 3: Створити testnet validator

**Мета**: Деплоїти офіційний PORTAL Pool на testnet для тестування

1. Підготовка смарт-контракту:
   - Завантажити Whales Nominator Pool код:
     ```bash
     git clone https://github.com/ton-blockchain/nominator-pool
     cd nominator-pool
     ```
   - Або використати Blueprint framework:
     ```bash
     npm create ton@latest -- portal-pool --type tact-empty
     ```

2. Налаштувати параметри в `my_pool/config.json`:
   ```json
   {
     "contract": {
       "owner_address": "0:0000...",  // Zero address!
       "validator_address": "YOUR_TESTNET_VALIDATOR_ADDRESS"
     },
     "parameters": {
       "fee_percent": 2.0,
       "min_stake_ton": 10
     }
   }
   ```

3. Деплой (приклад з tonos-cli):
   ```powershell
   # Компіляція
   tact compile contract.tact

   # Деплой в testnet
   ton-cli deploy --network testnet contract.boc

   # Верифікація
   ton-cli run-method --network testnet <CONTRACT_ADDR> get_pool_data
   ton-cli run-method --network testnet <CONTRACT_ADDR> get_owner
   # Має повернути: 0:0000...
   ```

4. Додати в `data/pools.json`:
   ```json
   {
     "name": "PORTAL Official Pool (TESTNET)",
     "type": "native",
     "address": "EQC...",  // реальна testnet адреса
     "url": "https://ton-portal.onrender.com/my_pool",
     "fee": 0.02,
     "min_stake_ton": 10,
     "description": "⭐ Official PORTAL testnet pool. Non-custodial. Owner=0.",
     "recommended": true
   }
   ```

---

### 🟢 Пріоритет 4: Покращити UX делегування

**Мета**: Замість prompt() зробити модальне вікно

1. Створити `templates/partials/delegate_modal.html`:

```html
<div id="delegate-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <h3>Делегувати в пул</h3>
    <p><strong>Pool:</strong> <span id="delegate-pool-name"></span></p>
    <p><strong>Мінімум:</strong> <span id="delegate-min-stake"></span> TON</p>
    
    <label>Сума (TON):</label>
    <input type="number" id="delegate-amount" min="1" step="0.01">
    
    <div style="margin-top: 16px; display: flex; gap: 8px;">
      <button class="btn btn-primary" onclick="executeDelegate()">Підтвердити</button>
      <button class="btn btn-secondary" onclick="closeDelegateModal()">Скасувати</button>
    </div>
  </div>
</div>
```

2. Додати стилі в `static/css/main.css`
3. Замінити `prompt()` на `openDelegateModal(pool)` в `pools.html`

---

### 🟢 Пріоритет 5: Додати аналітику (без трекінгу)

**Мета**: Простий логер подій без порушення GDPR

1. Створити `static/js/analytics.js`:
```javascript
// Non-tracking analytics (only counts, no personal data)
window.Analytics = {
  event(name, data) {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: name, data, timestamp: Date.now() })
    }).catch(() => {});
  }
};
```

2. Додати endpoint в `app.py`:
```python
@app.route("/api/analytics", methods=["POST"])
@limiter.limit("10/minute")
def analytics():
    data = request.json
    # Просто логуємо (без збереження IP/personal data)
    app.logger.info(f"Event: {data.get('event')}")
    return jsonify({"ok": True}), 200
```

3. Використовувати:
```javascript
// При підключенні wallet
Analytics.event('wallet_connected', { network: 'mainnet' });

// При делегуванні
Analytics.event('delegation_initiated', { pool: 'TON Whales', amount: 100 });
```

---

## 🧪 Тестування всієї системи

### Локальне тестування

```powershell
# 1. Встановити залежності
pip install -r requirements.txt

# 2. Запустити локально
flask run

# 3. Відкрити в браузері
Start-Process "http://localhost:5000"

# 4. Перевірити DevTools:
# - Console: немає помилок
# - Network: немає блокувань CSP
# - Application → Cookies: тільки cookie-consent
```

### Тести для перевірки

- [ ] Головна сторінка завантажується
- [ ] Пули відображаються на `/pools`
- [ ] Кнопка "Делегувати" присутня на кожному пулі
- [ ] Wallet підключається через TonConnect
- [ ] Клік на "Делегувати" відкриває prompt
- [ ] Транзакція формується з правильними параметрами
- [ ] `/healthz` повертає JSON з статусом "ok"
- [ ] Юридичні сторінки відкриваються (Impressum, AGB, Datenschutz)
- [ ] Footer містить всі посилання

---

## 📦 Commit і Deploy

### Поточний стан (що можна вже закоммітити)

```powershell
git add .
git commit -m "feat: Add delegation functionality and official pool structure

- Add TonDelegate.send() function for direct pool delegation
- Add 'Delegieren' button on pools page
- Create vendor directory structure for TonConnect libs
- Add my_pool/ directory with full documentation and config
- Add /healthz endpoint for health monitoring
- Improve CSP with comments for future strict mode
- Add deployment scripts and audit structure"

git push
```

### Після завантаження vendor libs

```powershell
# Завантажити бібліотеки
.\download-vendor-libs.ps1

# Оновити base.html та app.py CSP
# (вручну відредагувати файли)

git add static/js/vendor/*.js templates/base.html app.py
git commit -m "feat: Vendorize TonConnect libs for stricter CSP

- Download TonConnect SDK and UI locally
- Update base.html to use local scripts instead of CDN
- Enable strict CSP (remove unpkg.com, unsafe-inline)
- Improve security by eliminating external script dependencies"

git push
```

---

## 📚 Додаткові ресурси

### Документація
- TonConnect Protocol: https://docs.ton.org/develop/dapps/ton-connect/overview
- TON SDK: https://ton-community.github.io/tutorials/
- Flask CSP: https://flask.palletsprojects.com/en/latest/security/

### Інструменти для розробки
- TON Testnet Explorer: https://testnet.tonscan.org/
- TON Center API: https://toncenter.com/api/v2/
- Blueprint (TON dev framework): https://github.com/ton-org/blueprint

### Security
- CSP Evaluator: https://csp-evaluator.withgoogle.com/
- OWASP CSP Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

---

## ❓ FAQ

**Q: Чому не можна одразу використати строгу CSP?**  
A: Спочатку потрібно завантажити TonConnect бібліотеки локально. Поки вони на CDN, потрібно дозволити `https://unpkg.com`.

**Q: Як перевірити, що делегування працює?**  
A: Використай Tonkeeper testnet, підключись до Dashboard, перейди на Pools і натисни "Delegieren". Wallet має відкритися з транзакцією.

**Q: Коли запускати офіційний PORTAL Pool?**  
A: Після успішного 30-денного тестування на testnet + отримання аудиту. Не раніше грудня 2025.

**Q: Чи потрібно платити за audit?**  
A: Так, професійний audit коштує 5,000-20,000 EUR. Можна почати з testnet та community review.

---

Останнє оновлення: 2025-10-31
