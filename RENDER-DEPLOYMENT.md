# 🚀 Render.com Deployment Guide

## 📋 Підготовка

### 1. PostgreSQL налаштування

**У вас вже є БД:** `ittoken_db` на Render.com

**Важливо:** Проект використовує **окрему схему** `ton_staking_portal` в цій БД.

**Connection String:**
```
postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db
```

### 2. Що додано для PostgreSQL

✅ **Нові файли:**
- `database.py` - PostgreSQL інтеграція з окремою схемою
- `migrate.py` - міграційний скрипт
- `RENDER-DEPLOYMENT.md` - цей гайд

✅ **Оновлені файли:**
- `requirements.txt` - додано `psycopg2-binary==2.9.9`
- `app.py` - інтеграція з PostgreSQL (з fallback на JSON)
- `render.yaml` - додано `DATABASE_URL`

✅ **Особливості:**
- **Окрема схема:** `ton_staking_portal` (не конфліктує з іншими проектами)
- **Автоматична ініціалізація:** при старті створює схему і таблиці
- **Міграція даних:** переносить пули з `data/pools.json` в БД
- **Fallback:** якщо немає DATABASE_URL, працює з JSON файлом

## 🗄️ Структура БД

### Схема: `ton_staking_portal`

### Таблиця: `pools`

```sql
CREATE TABLE ton_staking_portal.pools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL UNIQUE,
    url VARCHAR(500),
    fee DECIMAL(5, 4) NOT NULL,
    min_stake_ton DECIMAL(20, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Індекси:**
- `idx_pools_address` - для швидкого пошуку за адресою
- `idx_pools_active` - для фільтрації активних пулів

## 🚀 Deployment на Render.com

### Крок 1: Push на GitHub

```powershell
# Додати нові файли
git add database.py migrate.py RENDER-DEPLOYMENT.md requirements.txt render.yaml app.py

# Закомітити
git commit -m "Add PostgreSQL integration with separate schema for Render deployment"

# Push на GitHub
git push origin main
```

### Крок 2: Створити Web Service на Render

1. Відкрийте [Render Dashboard](https://dashboard.render.com/)
2. Натисніть **"New +"** → **"Web Service"**
3. Підключіть репозиторій `TON-PORTAL`
4. Налаштування:

```yaml
Name: ton-staking-portal
Region: Frankfurt (абоближчий до вас)
Branch: main
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: gunicorn -w 2 -b 0.0.0.0:$PORT app:app
Plan: Free
```

### Крок 3: Налаштувати Environment Variables

У розділі **"Environment"** додайте:

| Key | Value | Note |
|-----|-------|------|
| `DATABASE_URL` | `postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db` | Ваша PostgreSQL БД |
| `SECRET_KEY` | *auto-generate* | Для Flask sessions |
| `TON_MAINNET` | `true` | Використовувати mainnet |
| `TONCENTER_API_KEY` | *ваш ключ* | З https://toncenter.com/ |
| `GIT_COMMIT_SHA` | *auto* | Для версіонування |

### Крок 4: Deploy

1. Натисніть **"Create Web Service"**
2. Render почне build:
   - Встановить залежності
   - Запустить gunicorn
   - **Автоматично:** створить схему `ton_staking_portal`
   - **Автоматично:** мігрує дані з `data/pools.json`

### Крок 5: Перевірка

Після успішного deploy:

1. **Health Check:**
   ```
   https://your-app-name.onrender.com/healthz
   ```
   Повинно повернути: `{"status": "ok"}`

2. **Pools API:**
   ```
   https://your-app-name.onrender.com/api/pools
   ```
   Повинно повернути JSON з пулами з БД

3. **Version:**
   ```
   https://your-app-name.onrender.com/version
   ```
   Повинно показати версію

## 🔍 Перевірка БД (опціонально)

### Підключитися до PostgreSQL

```bash
# Встановити psql (якщо немає)
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql

# Підключитися
psql "postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db"
```

### Перевірити схему і дані

```sql
-- Перевірити що схема створена
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'ton_staking_portal';

-- Подивитися таблиці у схемі
SELECT table_name FROM information_schema.tables WHERE table_schema = 'ton_staking_portal';

-- Подивитися пули
SELECT * FROM ton_staking_portal.pools;

-- Порахувати кількість пулів
SELECT COUNT(*) FROM ton_staking_portal.pools WHERE is_active = TRUE;
```

## 📝 Локальне тестування з PostgreSQL

### Крок 1: Встановити psycopg2

```powershell
pip install psycopg2-binary
```

### Крок 2: Налаштувати .env

```bash
DATABASE_URL=postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db
SECRET_KEY=your-secret-key
TON_MAINNET=true
```

### Крок 3: Запустити міграцію

```powershell
python migrate.py
```

**Очікуваний вивід:**
```
INFO:migration:Starting database migration...
INFO:ton-staking-portal.db:Schema ton_staking_portal created or already exists
INFO:ton-staking-portal.db:Table ton_staking_portal.pools created or already exists
INFO:migration:✓ Database schema created successfully
INFO:ton-staking-portal.db:Pool Ton Whales Pool migrated successfully
INFO:ton-staking-portal.db:Pool LiquidStaking Pool migrated successfully
INFO:migration:✓ Data migration completed successfully
```

### Крок 4: Запустити додаток

```powershell
flask run
```

Відкрийте http://localhost:5000/api/pools - повинні бути дані з PostgreSQL!

## 🔧 Troubleshooting

### Помилка: "No module named 'psycopg2'"

```powershell
pip install psycopg2-binary
```

### Помилка: "DATABASE_URL environment variable not set"

Додайте у `.env`:
```
DATABASE_URL=postgresql://...
```

### Помилка: "schema does not exist"

Запустіть міграцію:
```powershell
python migrate.py
```

### Pools не завантажуються

1. Перевірте логи Render:
   - Dashboard → Your Service → Logs
2. Перевірте DATABASE_URL у Environment
3. Перевірте що БД доступна:
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

### Повільні запити

Перевірте індекси:
```sql
SELECT * FROM pg_indexes WHERE schemaname = 'ton_staking_portal';
```

## 📊 Моніторинг

### Render Metrics

У Render Dashboard побачите:
- CPU usage
- Memory usage
- Request rate
- Response time

### Logs

```
Dashboard → Your Service → Logs
```

Шукайте:
- `Database initialized successfully` - БД готова
- `Pool X migrated successfully` - дані перенесені
- `Error loading pools` - проблеми з БД

## 🎯 Наступні кроки

Після успішного deploy:

1. ✅ Оновити `tonconnect-manifest.json` з реальним URL
2. ✅ Додати реальні TON пули в БД
3. ✅ Налаштувати TONCENTER_API_KEY
4. ✅ Протестувати делегування з testnet
5. ✅ Запустити в mainnet

### Додавання нових пулів через SQL

```sql
INSERT INTO ton_staking_portal.pools 
(name, address, url, fee, min_stake_ton, description)
VALUES 
('New Pool', 'EQC...', 'https://...', 0.05, 10, 'Description');
```

### Або через Python

```python
from database import add_pool

add_pool(
    name="New Pool",
    address="EQC...",
    url="https://...",
    fee=0.05,
    min_stake_ton=10,
    description="Description"
)
```

## ✅ Checklist

- [ ] PostgreSQL БД готова
- [ ] `database.py` створено
- [ ] `requirements.txt` оновлено
- [ ] `render.yaml` оновлено з DATABASE_URL
- [ ] Код закомічено і push на GitHub
- [ ] Web Service створено на Render
- [ ] Environment variables налаштовано
- [ ] Build успішний
- [ ] `/healthz` повертає OK
- [ ] `/api/pools` повертає дані з БД
- [ ] Схема `ton_staking_portal` створена
- [ ] Дані з JSON мігровані

---

**Готово до deployment! 🚀**

**Документація:**
- `RENDER-DEPLOYMENT.md` - цей файл
- `README.md` - загальний огляд
- `PRODUCTION.md` - production setup
