# Production Deployment Guide

## 🚀 Швидкий старт

### 1. Налаштування змінних середовища

Оновіть файл `.env`:

```bash
PORT=5000
SECRET_KEY=your-super-secret-key-here-min-32-chars
TON_MAINNET=true
TONCENTER_API_KEY=your-toncenter-api-key
```

**Де отримати ключі:**
- `TONCENTER_API_KEY`: https://toncenter.com - зареєструйтесь та створіть API ключ
- `SECRET_KEY`: згенеруйте випадковий рядок (мін. 32 символи)

```python
# Генерація SECRET_KEY
import secrets
print(secrets.token_hex(32))
```

### 2. Оновлення TonConnect Manifest

Відредагуйте `static/tonconnect-manifest.json`:

```json
{
  "url": "https://your-domain.com",
  "name": "TON Staking Portal",
  "iconUrl": "https://your-domain.com/static/img/logo.svg",
  "termsOfUseUrl": "https://your-domain.com/agb",
  "privacyPolicyUrl": "https://your-domain.com/datenschutz"
}
```

### 3. Оновлення SEO файлів

**robots.txt:**
```
User-agent: *
Allow: /
Sitemap: https://your-domain.com/sitemap.xml
```

**sitemap.xml:**
Замініть `YOUR_DOMAIN` на ваш реальний домен.

### 4. Оновлення правових сторінок

Відредагуйте `templates/impressum_de.html`:
- Додайте вашу адресу
- Додайте email контакт
- Додайте USt-IdNr. (якщо є)

### 5. Каталог пулів

Оновіть `data/pools.json` з реальними TON пулами:

```json
[
  {
    "name": "Real Pool Name",
    "address": "EQxxxxx...",
    "url": "https://pool-website.com",
    "fee": 0.05,
    "min_stake_ton": 10
  }
]
```

## 📦 Деплой на Render.com

1. Push код на GitHub (вже зроблено ✅)
2. Перейдіть на https://render.com
3. Створіть новий Web Service
4. Підключіть репозиторій `pilipandr770/TON-PORTAL`
5. Render автоматично використає `render.yaml`
6. Додайте змінні середовища:
   - `SECRET_KEY` (generate value)
   - `TON_MAINNET=true`
   - `TONCENTER_API_KEY=your-key`
7. Deploy!

## 🐳 Деплой через Docker

### Локально:

```bash
# З docker-compose
docker-compose up --build

# Або окремо
docker build -t ton-staking-portal .
docker run -p 5000:5000 --env-file .env ton-staking-portal
```

### На сервері (VPS):

```bash
# Клонувати репо
git clone https://github.com/pilipandr770/TON-PORTAL.git
cd TON-PORTAL

# Створити .env
cp .env.example .env
nano .env  # Відредагувати

# Запустити
docker-compose up -d

# Nginx reverse proxy (опційно)
# Додайте конфіг для HTTPS через Let's Encrypt
```

## 🔒 Безпека Production

### 1. HTTPS обов'язковий!

HSTS заголовки працюють лише з HTTPS. На Render.com HTTPS автоматичний.

### 2. Оновіть CSP для продакшену

Якщо ви хочете видалити залежність від unpkg CDN, завантажте TonConnect SDK локально:

```bash
# Завантажити SDK
curl -o static/js/tonconnect-sdk.min.js https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js
```

Оновіть `templates/base.html`:
```html
<!-- Замість -->
<script src="https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js"></script>

<!-- Використайте -->
<script src="{{ url_for('static', filename='js/tonconnect-sdk.min.js') }}"></script>
```

Оновіть CSP в `app.py`:
```python
"script-src 'self';"  # Видалити https://unpkg.com
```

### 3. Rate Limiting

Встановіть flask-limiter:

```bash
pip install flask-limiter
```

Додайте в `app.py`:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route("/api/balance/<address>")
@limiter.limit("10 per minute")
def api_balance(address: str):
    # ...
```

### 4. Логування

Налаштуйте production логування:

```python
import logging
from logging.handlers import RotatingFileHandler

if not app.debug:
    handler = RotatingFileHandler('logs/app.log', maxBytes=10000000, backupCount=3)
    handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    handler.setLevel(logging.INFO)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
```

## 📊 Моніторинг

### Health Check

Endpoint `/healthz` готовий для моніторингу:

```bash
curl https://your-domain.com/healthz
# {"status":"ok"}
```

Налаштуйте моніторинг (Uptimerobot, Pingdom, etc.) для перевірки доступності.

### Metrics (опційно)

Додайте prometheus-flask-exporter для метрик:

```bash
pip install prometheus-flask-exporter
```

```python
from prometheus_flask_exporter import PrometheusMetrics
metrics = PrometheusMetrics(app)
```

## 🌍 Інтернаціоналізація (майбутнє)

Для підтримки DE/EN/UA:

```bash
pip install flask-babel
```

Структура:
```
translations/
├─ de/
│  └─ LC_MESSAGES/
│     └─ messages.po
├─ en/
└─ uk/
```

## 📈 Монетизація (SaaS)

### Stripe Integration

```bash
pip install stripe
```

Приклад додавання підписки:

```python
import stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@app.route("/subscribe")
def subscribe():
    # Створити Checkout Session
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{
            'price': 'price_xxxxx',  # ID вашого Price в Stripe
            'quantity': 1,
        }],
        mode='subscription',
        success_url=url_for('dashboard', _external=True),
        cancel_url=url_for('index', _external=True),
    )
    return redirect(session.url)
```

**Важливо:** Це лише за SaaS-функції (аналітика, алерти), не торкаючись коштів користувачів!

## ✅ Production Checklist

- [ ] `.env` з реальними значеннями
- [ ] `tonconnect-manifest.json` з вашим доменом
- [ ] `robots.txt` і `sitemap.xml` оновлені
- [ ] Impressum з вашими даними
- [ ] `data/pools.json` з реальними пулами
- [ ] HTTPS налаштовано
- [ ] GitHub Actions CI працює
- [ ] Health check endpoint активний
- [ ] Логування налаштоване
- [ ] Моніторинг підключено
- [ ] Backup стратегія (якщо є БД)

## 🆘 Troubleshooting

### Помилка "TonConnect SDK nicht verfügbar"

Переконайтесь що CDN доступний або завантажте SDK локально.

### API баланс повертає mock дані

Додайте `TONCENTER_API_KEY` в `.env`.

### 500 Internal Server Error

Перевірте логи:
```bash
# На Render.com
Перегляньте Logs в дашборді

# Локально
tail -f logs/app.log
```

### CORS помилки

Якщо потрібен CORS для API:

```bash
pip install flask-cors
```

```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

## 📞 Підтримка

Для питань та проблем створюйте Issue на GitHub:
https://github.com/pilipandr770/TON-PORTAL/issues

## 📄 Ліцензія

MIT License - детальніше в файлі LICENSE
