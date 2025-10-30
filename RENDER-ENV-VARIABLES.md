# 📋 Environment Variables для Render.com

Скопіюйте ці значення у **Dashboard → Environment**:

---

## 🔑 SECRET_KEY
```
[Натисніть "Generate Value" в Render]
```
**Або власне значення (мінімум 32 символи):**
```
ton-staking-portal-secret-key-2025-change-this
```

---

## 🌐 TON_MAINNET
```
true
```

---

## 🗄️ DATABASE_URL
```
postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db
```

**⚠️ ВАЖЛИВО:** 
- Проект використовує окрему схему `ton_staking_portal`
- Не конфліктує з іншими проектами у цій БД
- Схема створюється автоматично при першому запуску

---

## 🔐 TONCENTER_API_KEY
```
[Отримайте на https://toncenter.com/ та вставте тут]
```

**Без ключа:** працює з лімітами (1 req/sec)
**З ключем:** 10 req/sec

---

## 🏷️ GIT_COMMIT_SHA (опціонально)
```
$RENDER_GIT_COMMIT
```

Це спеціальна змінна Render, яка автоматично підставить Git commit hash.

---

## ✅ Швидке копіювання

Відкрийте в Render: **Dashboard → ton-staking-portal → Environment**

Натисніть **"Add Environment Variable"** для кожної:

### 1️⃣ SECRET_KEY
- Key: `SECRET_KEY`
- Value: [Generate] або `ton-staking-portal-secret-2025-random`

### 2️⃣ APP_URL
- Key: `APP_URL`
- Value: `https://ton-portal.onrender.com`

**⚠️ ВАЖЛИВО:** Вставте ваш реальний Render URL!

### 3️⃣ TON_MAINNET
- Key: `TON_MAINNET`
- Value: `true`

### 4️⃣ DATABASE_URL
- Key: `DATABASE_URL`
- Value: `postgresql://ittoken_db_user:Xm98VVSZv7cMJkopkdWRkgvZzC7Aly42@dpg-d0visga4d50c73ekmu4g-a.frankfurt-postgres.render.com/ittoken_db`

### 5️⃣ DB_SCHEMA
- Key: `DB_SCHEMA`
- Value: `ton_staking_portal`

**⚠️ ВАЖЛИВО:** Це ім'я схеми для ізоляції від інших проектів у тій же БД!

### 6️⃣ TONCENTER_API_KEY
- Key: `TONCENTER_API_KEY`
- Value: [ваш ключ]

### 7️⃣ GIT_COMMIT_SHA
- Key: `GIT_COMMIT_SHA`
- Value: `$RENDER_GIT_COMMIT`

---

## 🎯 Після додавання змінних

1. Натисніть **"Save Changes"**
2. Render автоматично перезапустить сервіс
3. При старті створиться схема `ton_staking_portal`
4. Дані з `pools.json` автоматично мігруються в БД
5. Перевірте: `https://your-app.onrender.com/healthz`

---

## 🔍 Перевірка після deploy

```bash
# Health check
curl https://your-app.onrender.com/healthz

# Pools API (має бути з БД)
curl https://your-app.onrender.com/api/pools

# Version
curl https://your-app.onrender.com/version
```

---

## 📊 Структура БД

```
ittoken_db (ваша існуюча БД)
├── public (інші проекти)
└── ton_staking_portal (цей проект) ← ОКРЕМА СХЕМА!
    └── pools
        ├── id
        ├── name
        ├── address
        ├── url
        ├── fee
        ├── min_stake_ton
        ├── description
        ├── is_active
        ├── created_at
        └── updated_at
```

**Переваги окремої схеми:**
- ✅ Не конфліктує з іншими проектами
- ✅ Легко бекапити (`pg_dump --schema=ton_staking_portal`)
- ✅ Легко видалити (`DROP SCHEMA ton_staking_portal CASCADE;`)
- ✅ Ізольовані дані

---

## 🆘 Troubleshooting

### Помилка: "DATABASE_URL environment variable not set"
➡️ Переконайтеся що додали `DATABASE_URL` у Environment

### Помилка: "schema does not exist"
➡️ Перезапустіть сервіс - схема створюється при старті

### Pools не завантажуються
1. Перевірте логи: Dashboard → Logs
2. Шукайте: `Database initialized successfully`
3. Якщо помилка з БД - перевірте DATABASE_URL

### Повільні запити
➡️ Індекси створюються автоматично, але можна додати:
```sql
CREATE INDEX IF NOT EXISTS idx_pools_custom 
ON ton_staking_portal.pools(your_field);
```

---

**Готово! Скопіюйте ці значення у Render і все запрацює! 🚀**
