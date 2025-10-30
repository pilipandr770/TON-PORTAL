# TonConnect UI Integration - Виправлення проблеми з підключенням гаманця

## Проблема
Коли користувач натискав кнопку "Підключити гаманець" (Wallet verbinden), нічого не відбувалося. QR-код для підключення не з'являвся.

## Причина
Використовувався застарілий `@tonconnect/sdk` замість `@tonconnect/ui`. SDK - це низькорівнева бібліотека без UI, а UI - це готове рішення з модальними вікнами та QR-кодами.

## Рішення

### 1. Змінено CDN бібліотеку в `templates/base.html`

**Було:**
```html
<script src="https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js"></script>
```

**Стало:**
```html
<script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"></script>
```

### 2. Переписано `static/js/tonconnect.js`

**Ключові зміни:**

#### Ініціалізація
```javascript
// Було (не працювало)
const TonConnect = window.TON_CONNECT.TonConnect;
connector = new TonConnect({ manifestUrl: '/tonconnect-manifest.json' });

// Стало (працює)
tonConnectUI = new TonConnectUI({
  manifestUrl: window.location.origin + '/tonconnect-manifest.json',
  buttonRootId: null
});
```

#### Підключення гаманця
```javascript
// Було (складна логіка з walletsList)
const walletsList = await connector.getWallets();
await connector.connect({ ... });

// Стало (просто відкрити модальне вікно)
await tonConnectUI.openModal();
```

#### Відстеження стану підключення
```javascript
// Додано onStatusChange handler
tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    // Гаманець підключено
    connectedAddress = wallet.account.address;
    // Оновити UI
  } else {
    // Гаманець відключено
    connectedAddress = null;
  }
});
```

#### Відправка транзакцій
```javascript
// Було
await connector.sendTransaction({ ... });

// Стало
await tonConnectUI.sendTransaction({ ... });
```

## Як це працює тепер

1. **Користувач натискає "Wallet verbinden"**
   - Викликається `connect()` функція
   - Відкривається модальне вікно з QR-кодом

2. **Користувач сканує QR-код в Tonkeeper/Tonhub**
   - Додаток підтверджує підключення
   - Спрацьовує `onStatusChange` callback
   - UI автоматично оновлюється

3. **Гаманець підключено**
   - Відображається адреса
   - Автоматично завантажується баланс
   - Активуються кнопки "Trennen" та "Aktualisieren"

4. **Користувач може відправити stake**
   - Обирає пул зі списку
   - Вводить суму
   - Натискає "Delegieren"
   - Підтверджує транзакцію в гаманці

## Тестування

### Локальне тестування
1. Запустіть сервер: `python -m flask run`
2. Відкрийте http://localhost:5000/dashboard
3. Натисніть "Wallet verbinden"
4. Має з'явитись модальне вікно з QR-кодом

### Тестова сторінка
Створено `test_tonconnect.html` для швидкого тестування інтеграції без повного додатку.

### Автоматичні тести
```bash
pytest tests/test_smoke.py -v
```

Всі 11 тестів мають проходити ✅

## Production Deployment

### Render.com
Після push на GitHub, Render автоматично задеплоїть нову версію:
```bash
git push origin main
```

### Перевірка на production
1. Відкрийте https://ton-portal.onrender.com/dashboard
2. Натисніть "Wallet verbinden"
3. Має з'явитись модальне вікно з QR-кодом
4. Скануйте QR-код в Tonkeeper

## Debugging

### Перевірити консоль браузера (F12)
```javascript
// Має бути доступним
typeof TonConnectUI !== 'undefined' // true

// Має бути в логах
"TonConnect UI initialized"
"Opening modal..."
"Wallet connected: EQ..."
```

### Якщо не працює
1. Перевірте що завантажився скрипт TonConnect UI:
   - Відкрийте Network tab в DevTools
   - Має бути запит до `unpkg.com/@tonconnect/ui@latest`

2. Перевірте manifest:
   - Відкрийте `/tonconnect-manifest.json`
   - Має бути коректний JSON з `url` вашого домену

3. Перевірте логи сервера:
   - Render Dashboard → Logs
   - Шукайте помилки TonConnect

## Сумісність

- ✅ Chrome/Edge/Brave (Chromium)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ✅ Mobile browsers
- ✅ Tonkeeper mobile app
- ✅ Tonhub mobile app

## Додаткові ресурси

- [TonConnect UI Documentation](https://github.com/ton-connect/sdk/tree/main/packages/ui)
- [TonConnect Protocol](https://github.com/ton-connect/docs)
- [Tonkeeper Wallet](https://tonkeeper.com/)
- [TON Center API](https://toncenter.com/)

## Версія виправлення
- Commit: d3fd209
- Date: 2025-10-30
- Branch: main
