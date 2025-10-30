# 🎯 TON Staking Guide – Делегування через Dashboard

## Огляд функціоналу

TON Staking Portal тепер підтримує **повний цикл делегування**:

1. ✅ **Підключення гаманця** через TonConnect
2. ✅ **Вибір пулу** з каталогу
3. ✅ **Відправка TON** у вибраний пул
4. ✅ **Моніторинг транзакцій** через Tonviewer

---

## 🚀 Як делегувати TON

### Крок 1: Підключіть гаманець

1. Відкрийте [Dashboard](/dashboard)
2. Натисніть **"Wallet verbinden"**
3. Виберіть свій гаманець (Tonkeeper, Tonhub тощо)
4. Підтвердіть підключення у додатку гаманця

**Результат:** Побачите адресу та баланс свого гаманця.

### Крок 2: Виберіть пул

У розділі **"Stake in Pool"**:

1. Відкрийте випадаючий список **"Pool"**
2. Виберіть бажаний пул зі списку
3. Побачите:
   - Мінімальну суму делегування
   - Комісію пулу (fee)
   - URL пулу (якщо доступно)

**Приклад:**
```
Ton Whales Pool (10 TON min, Fee 5.0%)
```

### Крок 3: Введіть суму

1. У полі **"Menge (TON)"** введіть суму для делегування
2. Перевірте мінімальну суму (показується під полем)
3. Кнопка **"Delegieren"** стане активною при коректних даних

**Валідація:**
- ⚠️ Сума повинна бути ≥ мінімальної для пулу
- ⚠️ Сума повинна бути > 0
- ⚠️ У вас має бути достатньо TON на балансі

### Крок 4: Підпишіть транзакцію

1. Натисніть **"Delegieren"**
2. У додатку гаманця з'явиться запит на підпис транзакції
3. Перевірте:
   - Адресу отримувача (адреса пулу)
   - Суму в TON
   - Комісію мережі
4. Підтвердіть транзакцію

**Важливо:** Ми НЕ зберігаємо ваші ключі. Транзакція підписується виключно у вашому гаманці.

### Крок 5: Перевірте результат

Після успішної відправки:

1. Побачите повідомлення: **"✅ Transaktion gesendet!"**
2. Натисніть посилання **"Verlauf ansehen →"**
3. Відкриється Tonviewer з історією ваших транзакцій
4. Баланс автоматично оновиться через 3 секунди

---

## 📋 Доступні пули

Перегляньте повний каталог на сторінці [/pools](/pools).

### Структура інформації про пул:

```json
{
  "name": "Ton Whales Pool",
  "address": "EQDFvnxuyA2ogNPOoEj1lu968U8...",
  "min_stake_ton": 10,
  "fee": 0.05,
  "url": "https://tonvalidators.org/"
}
```

**Поля:**
- `name` – назва пулу
- `address` – адреса смарт-контракту пулу (base64)
- `min_stake_ton` – мінімальна сума для делегування
- `fee` – комісія пулу (0.05 = 5%)
- `url` – сайт пулу (опціонально)

---

## 🔧 Технічні деталі

### Як працює делегування?

1. **Frontend (JavaScript):**
   ```javascript
   window.TonUI.sendStake(poolAddress, amountTon)
   ```

2. **TonConnect SDK:**
   ```javascript
   connector.sendTransaction({
     validUntil: Math.floor(Date.now() / 1000) + 300,
     messages: [{
       address: poolAddress,
       amount: (amountTon * 1e9).toString() // нанотони
     }]
   })
   ```

3. **Wallet App:**
   - Показує деталі транзакції
   - Користувач підписує
   - Відправляє в TON blockchain

4. **Blockchain:**
   - Транзакція потрапляє в мемпул
   - Валідується
   - Включається в блок
   - TON надходять на адресу пулу

### Формат транзакції

```javascript
{
  validUntil: 1730000000,  // Unix timestamp + 5 хвилин
  messages: [
    {
      address: "EQDFvnxuyA2ogNPOoEj1lu968U8...",  // Адреса пулу
      amount: "10000000000"  // 10 TON у нанотонах (10 * 10^9)
    }
  ]
}
```

**Примітка:** Деякі пули можуть вимагати специфічний `payload`. Це буде додано в наступній версії через поле `payload_boc` у `pools.json`.

---

## ⚠️ Безпека

### ✅ Що ми робимо:

- Транзакції підписуються **виключно у вашому гаманці**
- Ми **НЕ зберігаємо** приватні ключі
- Ми **НЕ маємо доступу** до ваших коштів
- Всі дані передаються через **TonConnect bridge** (end-to-end encryption)

### ⚠️ Що слід перевіряти:

- **Адресу пулу** перед підписом транзакції
- **Суму** делегування
- **Комісію мережі** (зазвичай 0.01-0.05 TON)
- **Репутацію пулу** (відгуки, APR, uptime)

### 🚨 Ніколи не робіть:

- Не відправляйте TON на неперевірені адреси
- Не використовуйте підозрілі пули з нульовою комісією
- Не ділітеся seed phrase або приватними ключами

---

## 🔍 Моніторинг делегацій

### Tonviewer (рекомендовано)

Після делегування відкрийте посилання:
```
https://tonviewer.com/YOUR_ADDRESS?section=transactions
```

**Що побачите:**
- ✅ Історію всіх транзакцій
- ✅ Статус (pending/confirmed)
- ✅ Блок та час підтвердження
- ✅ Комісію мережі
- ✅ Повідомлення (message body)

### TONscan (альтернатива)

```
https://tonscan.org/address/YOUR_ADDRESS
```

**Додаткова інформація:**
- Графік балансу
- Jetton токени
- NFT колекції
- Contract code (для смарт-контрактів)

### TON API (для розробників)

```bash
curl "https://tonapi.io/v2/accounts/YOUR_ADDRESS/events"
```

---

## 📊 Часті запитання (FAQ)

### Скільки часу потрібно на підтвердження?

Зазвичай **5-15 секунд**. TON blockchain має високу швидкість (~5 сек на блок).

### Чи можу скасувати транзакцію?

**Ні**, після підпису транзакція необоротна. Перевіряйте всі дані перед підтвердженням.

### Що якщо я відправив менше мінімальної суми?

Транзакція буде **відхилена смарт-контрактом пулу**, а TON повернуться на ваш гаманець (мінус комісія).

### Коли я отримаю нарахування?

Залежить від пулу. Зазвичай:
- **Щоденно** (більшість DePools)
- **Після епохи валідації** (~18 годин)
- **Автоматично** на ваш гаманець

### Як вивести (unstake) TON?

Це буде додано в наступній версії. Поки що використовуйте інтерфейс пулу або tonos-cli.

### Чому потрібна мінімальна сума?

Для покриття **операційних витрат** пулу:
- Gas для смарт-контракту
- Overhead на обробку делегацій
- Економічна доцільність

### Чи можу делегувати з testnet?

Так, якщо ваш гаманець підключено до testnet. У Dashboard побачите `network: testnet`.

---

## 🛠️ Налаштування для адміністраторів

### Додавання нового пулу

Відредагуйте `data/pools.json`:

```json
{
  "items": [
    {
      "name": "My Custom Pool",
      "address": "EQDFvnxuyA2ogNPOoEj1lu968U8_eFpz2G9DXBPkPRjEctGF",
      "min_stake_ton": 50,
      "fee": 0.08,
      "url": "https://mypool.com",
      "description": "High APR pool with 24/7 monitoring"
    }
  ]
}
```

**Обов'язкові поля:**
- `name`, `address`, `min_stake_ton`, `fee`

**Опціональні поля:**
- `url`, `description`, `payload_boc` (майбутнє)

### Додавання payload для специфічних пулів

У майбутніх версіях:

```json
{
  "name": "Special DePool",
  "payload_boc": "te6ccgEBAQEADgAAGAAAAABzdGFrZQ=="
}
```

Буде автоматично включатися в транзакцію:

```javascript
messages: [{
  address: pool.address,
  amount: amountNano,
  payload: pool.payload_boc  // BOC-encoded
}]
```

---

## 📈 Roadmap

### Version 2.2 (наступна)

- [ ] Підтримка payload per pool
- [ ] Виведення коштів (unstake)
- [ ] Історія делегацій користувача
- [ ] Розрахунок потенційного APR

### Version 2.3

- [ ] TonAPI інтеграція (pending rewards)
- [ ] Графіки нарахувань
- [ ] Notifications (email/telegram)
- [ ] Multi-pool стратегії

### Version 3.0

- [ ] Автоматичне реінвестування
- [ ] DAO governance voting
- [ ] NFT badges для стейкерів
- [ ] Mobile app (React Native)

---

## 🎓 Корисні посилання

- [TON Whitepaper](https://ton.org/whitepaper.pdf)
- [TonConnect Documentation](https://docs.ton.org/develop/dapps/ton-connect)
- [TON Validators](https://tonvalidators.org/)
- [Ton Whales Pool](https://tonwhales.com/staking)
- [TON API Documentation](https://tonapi.io/docs)

---

## 💬 Підтримка

**Маєте питання?** Зв'яжіться з нами:

- GitHub Issues: [TON-PORTAL/issues](https://github.com/pilipandr770/TON-PORTAL/issues)
- Email: support@ton-staking-portal.com
- Telegram: @ton_staking_support

---

**Версія:** 2.2  
**Оновлено:** 30 жовтня 2025  
**Сумісність:** TonConnect SDK 2.x, TON Blockchain mainnet/testnet
