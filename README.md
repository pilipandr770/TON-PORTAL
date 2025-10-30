# TON Staking Portal (Flask)

🚀 **Production-ready** SaaS-портал для взаємодії з TON-екосистемою:

## ✨ Версія 2.2 - Делегування TON у пули

### 🎯 Основні можливості
- 🔐 **Підключення гаманця** через TonConnect (власний manifest)
- 💰 **Відображення балансу** через TON Center API
- 📊 **Каталог TON пулів** з API
- 💎 **Делегування TON** у вибраний пул (нова функція!)
- 🔍 **Моніторинг транзакцій** через Tonviewer
- 🇩🇪 **Німецькі правові сторінки**: Impressum, Datenschutz, AGB

### 🛡️ Безпека та стабільність
- 🔒 Посилена безпека: HSTS, CSP, безпечні заголовки
- ⚡ **Rate Limiting** (10 req/min для /api/balance)
- 💾 **Кешування** (30s для balance API)
- 📝 **Production логування** (rotating files, 2MB max)
- 🍪 **GDPR Cookie Consent** (без трекерів)

### 📚 Документація та DevOps
- 📖 **API Documentation** (OpenAPI + Swagger UI)
- 🏷️ **Версіонування** (Git SHA tracking)
- 🐳 **Docker підтримка**
- ✅ **Автоматичне тестування** (11 smoke tests)
- 🤖 **GitHub Actions CI/CD**

**Ми не зберігаємо кошти та приватні ключі.** Це лише інтерфейс.

## Запуск локально (Windows PowerShell)

```powershell
# Створити та активувати віртуальне середовище
py -3 -m venv .venv
. .\.venv\Scripts\Activate.ps1

# Встановити залежності
pip install -r requirements.txt

# Створити .env файл
Copy-Item .env.example .env

# Запустити Flask сервер
$env:FLASK_APP="app.py"
$env:FLASK_ENV="development"
flask run
```

Відкрийте браузер на `http://localhost:5000`

## ENV змінні

- `TON_MAINNET=true|false` - вибір мережі (mainnet або testnet)
- `TONCENTER_API_KEY=...` - опційно, але рекомендовано для реального балансу
- `SECRET_KEY=...` - секретний ключ Flask

## Деплой на Render

Файл `render.yaml` вже підготовлено. Створіть сервіс із GitHub репо.

## Безпека та комплаєнс (DE)

- Ми — постачальник Software-Dienstleistung (UI для TON).
- Немає фіату, немає зберігання активів, немає обіцянок прибутку.
- Обов'язково тримайте актуальними сторінки Impressum, Datenschutz, AGB.

## Структура проєкту

```
TON/
├─ app.py                           # Основний Flask додаток з API
├─ config.py                        # Конфігурація (з python-dotenv)
├─ requirements.txt                 # Залежності Python
├─ Dockerfile                       # Docker контейнер
├─ docker-compose.yml               # Docker Compose конфігурація
├─ render.yaml                      # Конфігурація для Render.com
├─ .env.example                     # Приклад змінних середовища
├─ .gitignore                       # Git ignore
├─ robots.txt                       # SEO: robots.txt
├─ sitemap.xml                      # SEO: sitemap
├─ README.md                        # Документація
├─ data/
│  └─ pools.json                    # Каталог TON пулів
├─ templates/                       # HTML шаблони
│  ├─ base.html
│  ├─ index.html
│  ├─ how.html
│  ├─ faq.html
│  ├─ dashboard.html
│  ├─ pools.html                    # Сторінка пулів
│  ├─ 404.html                      # Сторінка помилки 404
│  ├─ 500.html                      # Сторінка помилки 500
│  ├─ impressum_de.html
│  ├─ privacy_de.html
│  ├─ agb_de.html
│  └─ disclaimer.html
├─ static/                          # Статичні файли
│  ├─ tonconnect-manifest.json      # Власний TonConnect manifest
│  ├─ css/
│  │  └─ main.css
│  ├─ js/
│  │  └─ tonconnect.js
│  └─ img/
│     └─ logo.svg
├─ tests/                           # Тести
│  └─ test_smoke.py                 # Smoke тести
├─ .well-known/                     # Android TWA
│  └─ assetlinks.json
└─ .github/
   └─ workflows/
      └─ ci.yml                     # GitHub Actions CI
```

## API Endpoints

### Pages
- `GET /` - Головна сторінка
- `GET /dashboard` - Dashboard з TonConnect
- `GET /pools` - Каталог TON пулів
- `GET /docs` - **API Documentation** (Swagger UI) ✨

### API
- `GET /api/balance/<address>` - Баланс TON адреси (⚡ rate limited, 💾 cached)
- `GET /api/pools` - Каталог пулів (JSON)

### System
- `GET /healthz` - Health check
- `GET /version` - Version info (Git SHA) ✨
- `GET /tonconnect-manifest.json` - TonConnect manifest
- `GET /openapi.yaml` - OpenAPI specification ✨

## Тестування

```powershell
# Запуск всіх тестів
pytest tests/ -v

# Запуск з coverage
pytest tests/ --cov=app --cov-report=html
```

## Docker

```powershell
# Білд та запуск через Docker Compose
docker-compose up --build

# Або окремо
docker build -t ton-staking-portal .
docker run -p 5000:5000 ton-staking-portal
```

## Що далі?

1. ✅ **TonConnect manifest**: Оновіть `static/tonconnect-manifest.json` з вашим доменом
2. ✅ **TON Center API ключ**: Зареєструйте ключ на https://toncenter.com і додайте в `.env`
3. ✅ **Пули/DePool**: Оновіть `data/pools.json` з реальними пулами
4. 🔄 **Монетизація**: Інтеграція Stripe для Pro-режиму
5. 🔄 **Локалізація**: flask-babel для підтримки DE/EN/UA
6. 🔄 **Rate limiting**: Додайте flask-limiter для захисту API
7. 🔄 **Локальний TonConnect SDK**: Замість CDN використайте локальний файл

## Безпека

- ✅ HSTS заголовки
- ✅ Content Security Policy
- ✅ X-Frame-Options, X-Content-Type-Options
- ✅ Безпечна обробка помилок (404/500)
- ✅ python-dotenv для змінних середовища

## Ліцензія

MIT License - використовуйте на свій розсуд, але на власний ризик.
