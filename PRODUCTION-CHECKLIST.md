# 🚀 Quick Start Checklist - TON Staking Portal v2.2

## ✅ Що вже працює (out of the box)

- [x] Flask додаток з 11 endpoints
- [x] TonConnect інтеграція
- [x] Делегування TON у пули
- [x] Rate limiting + Caching
- [x] Production logging
- [x] API documentation (Swagger UI)
- [x] 11 тестів (всі проходять)
- [x] Docker підтримка
- [x] GitHub Actions CI/CD
- [x] GDPR cookie consent
- [x] Німецькі правові сторінки

## 📋 Checklist для локального тестування

### 1. Перевірка коду
```powershell
# Перейти в директорію
cd c:\Users\ПК\TON

# Активувати venv (якщо ще не активовано)
.\.venv\Scripts\Activate.ps1

# Запустити тести
pytest tests/test_smoke.py -v
# Очікуваний результат: 11 passed ✅
```

### 2. Запуск сервера
```powershell
# Переконатися що .env існує
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# Запустити Flask
$env:FLASK_APP="app.py"
$env:FLASK_ENV="development"
flask run

# Відкрити в браузері: http://localhost:5000
```

### 3. Тестування функціоналу

**Основні сторінки:**
- [ ] `http://localhost:5000/` - Головна
- [ ] `http://localhost:5000/dashboard` - Dashboard з делегуванням
- [ ] `http://localhost:5000/pools` - Каталог пулів
- [ ] `http://localhost:5000/docs` - API документація
- [ ] `http://localhost:5000/version` - Версія додатку

**API endpoints:**
- [ ] `http://localhost:5000/healthz` - Health check
- [ ] `http://localhost:5000/api/pools` - JSON список пулів

**Функціонал Dashboard:**
1. [ ] Кнопка "Wallet verbinden" відображається
2. [ ] Форма "Stake in Pool" присутня
3. [ ] Dropdown список пулів завантажується
4. [ ] Поле "Menge (TON)" приймає числа
5. [ ] Кнопка "Delegieren" disabled до валідації

## 🔧 Checklist для production

### 1. Конфігурація

**static/tonconnect-manifest.json:**
```json
{
  "url": "https://YOUR-ACTUAL-DOMAIN.com",  // ⚠️ ЗАМІНИТИ!
  "name": "TON Staking Portal",
  "iconUrl": "https://YOUR-ACTUAL-DOMAIN.com/static/logo-256.png"  // ⚠️ ЗАМІНИТИ!
}
```
- [ ] Замінено `YOUR_DOMAIN` на реальний домен
- [ ] Залито логотип 256x256px
- [ ] Оновлено `termsOfUseUrl` та `privacyPolicyUrl`

**data/pools.json:**
```json
{
  "items": [
    {
      "name": "Real Pool Name",
      "address": "REAL_POOL_ADDRESS",  // ⚠️ ДОДАТИ РЕАЛЬНІ!
      "min_stake_ton": 10,
      "fee": 0.05,
      "url": "https://pool-website.com"
    }
  ]
}
```
- [ ] Додано реальні адреси пулів (base64)
- [ ] Перевірено мінімальні суми та комісії
- [ ] Додано URL сайтів пулів

**.env:**
```bash
TON_MAINNET=true
TONCENTER_API_KEY=your-api-key-here  // ⚠️ ОТРИМАТИ!
SECRET_KEY=generate-secure-key-here  // ⚠️ ЗГЕНЕРУВАТИ!
```
- [ ] `TON_MAINNET=true` для mainnet (або `false` для testnet)
- [ ] Отримано API key з https://toncenter.com/
- [ ] Згенеровано безпечний `SECRET_KEY` (мінімум 32 символи)

**templates/ (правові сторінки):**
- [ ] `impressum_de.html` - реальні дані компанії
- [ ] `privacy_de.html` - актуальна політика конфіденційності
- [ ] `agb_de.html` - умови використання

### 2. Deployment

**Docker (рекомендовано):**
```powershell
# Build образу
docker build -t ton-staking-portal .

# Запуск контейнера
docker-compose up -d

# Перевірка логів
docker-compose logs -f
```
- [ ] Docker образ збирається без помилок
- [ ] Контейнер запускається на порту 5000
- [ ] Health check `/healthz` повертає 200

**Render.com:**
```yaml
# render.yaml вже готовий
# 1. Push на GitHub
# 2. Підключити репозиторій у Render
# 3. Додати env змінні в Dashboard
```
- [ ] Репозиторій підключено до Render
- [ ] Environment variables налаштовано
- [ ] Build успішний
- [ ] Сервіс доступний за URL

**VPS (Ubuntu/Debian):**
```bash
# Клонувати репозиторій
git clone https://github.com/pilipandr770/TON-PORTAL.git
cd TON-PORTAL

# Встановити залежності
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Налаштувати .env
cp .env.example .env
nano .env  # відредагувати

# Запустити через systemd або PM2
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```
- [ ] Python 3.10+ встановлено
- [ ] Nginx налаштовано як reverse proxy
- [ ] SSL сертифікат (Let's Encrypt)
- [ ] Firewall правила (порти 80, 443)

### 3. Безпека

**HTTPS:**
- [ ] SSL сертифікат встановлено
- [ ] HSTS заголовок активний (вже в коді)
- [ ] Всі CDN ресурси через HTTPS

**Environment Variables:**
- [ ] `.env` не в Git (перевірити `.gitignore`)
- [ ] `SECRET_KEY` унікальний та складний
- [ ] `TONCENTER_API_KEY` не розкрито публічно

**Rate Limiting:**
- [ ] Redis налаштовано для production (опціонально)
- [ ] Ліміти адекватні навантаженню

### 4. Моніторинг

**Health Checks:**
```bash
# Локально
curl http://localhost:5000/healthz

# Production
curl https://your-domain.com/healthz
```
- [ ] Endpoint `/healthz` повертає `{"status": "ok"}`
- [ ] Response time < 200ms

**Logs:**
```powershell
# Локально
Get-Content logs/app.log -Tail 50

# Docker
docker-compose logs -f

# VPS
tail -f /var/log/ton-portal/app.log
```
- [ ] Логи пишуться у `logs/app.log`
- [ ] Ротація працює (max 2MB)
- [ ] Немає критичних помилок

**Metrics:**
- [ ] `/version` показує правильний Git SHA
- [ ] `/api/pools` повертає список пулів
- [ ] Dashboard завантажується < 2 сек

### 5. Тестування на production

**Після deployment:**
1. [ ] Відкрити Dashboard
2. [ ] Натиснути "Wallet verbinden"
3. [ ] Вибрати testnet гаманець (для тесту)
4. [ ] Спробувати делегувати 0.1 TON в testnet пул
5. [ ] Перевірити посилання на Tonviewer
6. [ ] Перевірити оновлення балансу

**Перевірка безпеки:**
- [ ] TonConnect підключається через ваш manifest
- [ ] Транзакція підписується у гаманці (не на сервері)
- [ ] Приватні ключі НЕ передаються на backend
- [ ] Cookie consent банер з'являється

### 6. SEO та маркетинг

**SEO:**
- [ ] `robots.txt` налаштовано
- [ ] `sitemap.xml` згенеровано
- [ ] Meta tags на всіх сторінках
- [ ] Open Graph tags для соцмереж

**Analytics (опціонально):**
- [ ] Google Analytics (з GDPR consent)
- [ ] Plausible/Fathom (privacy-friendly alternative)
- [ ] Error tracking (Sentry)

**Marketing:**
- [ ] Додати в TON ecosystem список
- [ ] Оголосити в TON Community
- [ ] Написати Medium/Twitter пост
- [ ] Створити відео-демо

## 🔄 Maintenance Checklist

### Щотижня:
- [ ] Перевірити логи на помилки
- [ ] Моніторити uptime
- [ ] Перевірити використання RAM/CPU
- [ ] Оновити `pools.json` якщо з'явилися нові пули

### Щомісяця:
- [ ] Оновити залежності Python (`pip list --outdated`)
- [ ] Перевірити security advisories
- [ ] Backup бази даних (якщо є)
- [ ] Переглянути analytics

### Щоквартально:
- [ ] Аудит коду
- [ ] Переглянути GDPR compliance
- [ ] Оновити правові сторінки
- [ ] Провести security audit

## 📊 Success Metrics

**Технічні:**
- [ ] Uptime > 99.9%
- [ ] Response time < 500ms (p95)
- [ ] Error rate < 0.1%
- [ ] Test coverage > 80%

**Бізнес:**
- [ ] X активних користувачів/день
- [ ] X TON заделеговано через портал
- [ ] X успішних транзакцій/тиждень
- [ ] User satisfaction > 4.5/5

## 🆘 Troubleshooting

**Проблема:** TonConnect не підключається
- ✅ Перевірити `manifestUrl` у `tonconnect.js`
- ✅ Переконатися що manifest доступний за `/tonconnect-manifest.json`
- ✅ Перевірити CORS headers

**Проблема:** Balance API повертає помилки
- ✅ Перевірити `TONCENTER_API_KEY` у `.env`
- ✅ Перевірити rate limits TON Center
- ✅ Спробувати з testnet адресою

**Проблема:** Транзакція не відправляється
- ✅ Перевірити адресу пулу (має бути base64 standard)
- ✅ Переконатися що користувач має достатньо TON
- ✅ Перевірити `validUntil` timestamp

**Проблема:** Тести падають
- ✅ Активувати venv: `.\.venv\Scripts\Activate.ps1`
- ✅ Переконатися що Flask app не запущено
- ✅ Перевірити що всі залежності встановлено

## 🎯 Quick Commands

```powershell
# Тести
pytest tests/test_smoke.py -v

# Запуск dev server
flask run

# Запуск production (gunicorn)
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down

# Git
git add .
git commit -m "Update config"
git push origin main

# Перевірка коду
python -m pylint app.py
python -m black app.py --check
```

## ✅ Final Checklist

Перед публічним запуском:
- [ ] Всі TODO коментарі видалено з коду
- [ ] Версія оновлена в `app.py`
- [ ] CHANGELOG.md актуалізовано
- [ ] README.md містить актуальну інформацію
- [ ] Всі placeholder значення замінено на реальні
- [ ] Тести проходять (11/11)
- [ ] Production змінні налаштовано
- [ ] Backup план готовий
- [ ] Support email налаштовано
- [ ] Terms of Service прочитано та підтверджено

---

**Готово до запуску! 🚀**

**Версія чеклисту:** 2.2  
**Дата:** 30 жовтня 2025  
**Репозиторій:** https://github.com/pilipandr770/TON-PORTAL
