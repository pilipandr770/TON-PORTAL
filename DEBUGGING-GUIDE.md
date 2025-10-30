# Debugging Guide - Frontend Issues

## Проблема
- Кнопка "Підключити гаманець" не працює (нічого не відбувається при натисканні)
- Пули не відображаються на сторінці `/pools`
- Можлива проблема: фронтенд не підключений до бекенду або JavaScript не завантажується

## Діагностика

### 1. Перевірка Backend API (працює ✅)
Backend API працює коректно:
```bash
curl https://ton-portal.onrender.com/api/pools
# Має повернути JSON з 2 пулами
```

### 2. Діагностична сторінка

Створено спеціальну debug сторінку для автоматичної перевірки:

**URL:** `https://ton-portal.onrender.com/debug`

Ця сторінка автоматично перевіряє:
- ✅ `/api/pools` - чи працює API
- ✅ `TonConnectUI` - чи завантажилась бібліотека
- ✅ `window.TonUI` - чи завантажився наш модуль
- ✅ Ініціалізація TonConnect

### 3. Перевірка Console Logs

**Відкрийте браузер (F12 → Console) і перевірте логи:**

#### На сторінці `/dashboard`:
```javascript
// Має бути:
"Dashboard DOMContentLoaded"
"window.TonUI available: true"
"Initializing TonUI dashboard..."
"Starting TonConnect UI initialization..."
"TonConnectUI class found, creating instance..."
"TonConnect UI initialized successfully"
"Fetching pools from /api/pools..."
"Pools data received: {items: [...]}
"Adding 2 pools to select"
```

#### На сторінці `/pools`:
```javascript
// Має бути:
"loadPools called"
"Fetching /api/pools..."
"Response status: 200"
"Pools data: {items: [...]}"
"Found 2 pools"
```

#### Якщо НЕ працює, шукайте помилки:
```javascript
// Можливі помилки:
"TonConnect UI not loaded"
"window.TonUI not found"
"Error loading pools: ..."
"Failed to fetch"
```

## Можливі причини і рішення

### Проблема 1: TonConnect UI script не завантажується

**Симптоми в Console:**
```
TonConnect UI not loaded. Make sure the script is loaded.
typeof TonConnectUI === 'undefined'
```

**Рішення:**
1. Перевірте Network tab (F12 → Network)
2. Шукайте запит до: `unpkg.com/@tonconnect/ui@latest`
3. Якщо 404 або timeout:
   - Проблема з CDN
   - Рішення: Скачати бібліотеку локально

### Проблема 2: `tonconnect.js` не завантажується

**Симптоми в Console:**
```
window.TonUI not found
```

**Рішення:**
1. Перевірте Network tab: `/static/js/tonconnect.js`
2. Статус має бути `200 OK`
3. Якщо 404:
   - Файл не на сервері
   - Перевірте що файл є в репозиторії
   - Перевірте Render Build Logs

### Проблема 3: Pools API не відповідає

**Симптоми в Console:**
```
Error loading pools: Failed to fetch
Response status: 500
```

**Рішення:**
1. Відкрийте безпосередньо API в браузері:
   `https://ton-portal.onrender.com/api/pools`
2. Має показати JSON з пулами
3. Якщо помилка - перевірте Render Logs

### Проблема 4: CORS помилки

**Симптоми в Console:**
```
CORS policy: No 'Access-Control-Allow-Origin'
```

**Рішення:**
- Для запитів на той самий домен CORS не потрібен
- Якщо бачите CORS - можливо запит йде на інший домен
- Перевірте `APP_URL` в environment variables

### Проблема 5: Content Security Policy

**Симптоми в Console:**
```
Refused to load script from 'https://unpkg.com/...'
Content Security Policy violation
```

**Рішення:**
- Додати CSP заголовки, щоб дозволити unpkg.com

## Кроки для користувача

### Крок 1: Відкрийте Debug сторінку
```
https://ton-portal.onrender.com/debug
```

Вона автоматично запустить тести і покаже результати.

### Крок 2: Відкрийте Console (F12)
1. Натисніть F12 в браузері
2. Перейдіть на вкладку **Console**
3. Оновіть сторінку (Ctrl+R / Cmd+R)
4. Скопіюйте ВСІ логи і помилки

### Крок 3: Перевірте Network
1. F12 → вкладка **Network**
2. Оновіть сторінку
3. Перевірте чи завантажились:
   - `tonconnect-ui.min.js` (від unpkg.com)
   - `tonconnect.js` (від вашого сервера)
   - `/api/pools` (API запит)

### Крок 4: Тест на /dashboard
1. Відкрийте `https://ton-portal.onrender.com/dashboard`
2. Відкрийте Console (F12)
3. Натисніть "Wallet verbinden"
4. Дивіться в Console - що виводиться?

Якщо бачите:
```javascript
"Connect button clicked"
"Opening modal..."
"Modal opened successfully"
```
То все працює! ✅

Якщо бачите помилки - скопіюйте їх повністю.

## Локальне тестування

Якщо на Render не працює, спробуйте локально:

```powershell
# У папці проекту
python -m flask run

# Відкрийте браузер
http://localhost:5000/debug
http://localhost:5000/dashboard
http://localhost:5000/pools
```

Якщо локально працює, але на Render ні - проблема в deployment або environment.

## Що я додав для діагностики

1. **Детальне логування в `tonconnect.js`:**
   - Кожен крок ініціалізації
   - Перевірка наявності TonConnectUI
   - Логування помилок з stack trace

2. **Логування в `dashboard.html`:**
   - Завантаження сторінки
   - Завантаження пулів з API
   - Кліки по кнопкам

3. **Логування в `pools.html`:**
   - Виклик loadPools()
   - Відповідь від API
   - Обробка даних

4. **Debug сторінка `/debug`:**
   - Автоматичні тести
   - Capture всіх console logs
   - Візуальні індикатори (✅ / ❌)

## Наступні кроки

1. **Відкрийте `/debug` на Render**
2. **Скопіюйте результати тестів**
3. **Відкрийте Console і скопіюйте всі логи**
4. **Надішліть мені знімок екрану або текст**

Це дозволить точно визначити, в чому проблема! 🔍
