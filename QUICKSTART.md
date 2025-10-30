# 🚀 Quick Start Guide

## Локальний запуск (5 хвилин)

### Windows PowerShell

```powershell
# 1. Перейти в папку проєкту
cd TON

# 2. Активувати venv (якщо ще не активовано)
.\.venv\Scripts\Activate.ps1

# 3. Встановити залежності (якщо ще не встановлено)
pip install -r requirements.txt

# 4. Створити .env файл (якщо ще не створено)
Copy-Item .env.example .env

# 5. Запустити сервер
$env:FLASK_APP="app.py"
flask run

# Відкрити браузер: http://127.0.0.1:5000
```

### Docker (альтернатива)

```powershell
# Запустити через Docker Compose
docker-compose up --build

# Відкрити браузер: http://127.0.0.1:5000
```

## 🧪 Тестування

```powershell
# Запуск всіх тестів
pytest tests/ -v

# Очікуваний результат:
# ========================
# 6 passed in 0.44s ✓
# ========================
```

## 🌐 Перевірка endpoints

Після запуску сервера:

```powershell
# Health check
curl http://127.0.0.1:5000/healthz

# API пулів
curl http://127.0.0.1:5000/api/pools

# TonConnect manifest
curl http://127.0.0.1:5000/tonconnect-manifest.json
```

## 📄 Доступні сторінки

- http://127.0.0.1:5000/ - Головна
- http://127.0.0.1:5000/how - Як це працює
- http://127.0.0.1:5000/faq - FAQ
- http://127.0.0.1:5000/pools - Каталог пулів
- http://127.0.0.1:5000/dashboard - Dashboard з TonConnect
- http://127.0.0.1:5000/impressum - Impressum
- http://127.0.0.1:5000/datenschutz - Datenschutz
- http://127.0.0.1:5000/agb - AGB
- http://127.0.0.1:5000/disclaimer - Disclaimer

## ⚙️ Налаштування для production

Детальніше в `PRODUCTION.md`

### Мінімум необхідне:

1. **Оновити `.env`:**
```bash
SECRET_KEY=your-secret-key-min-32-chars
TONCENTER_API_KEY=your-api-key-from-toncenter
```

2. **Оновити `static/tonconnect-manifest.json`:**
```json
{
  "url": "https://your-domain.com",
  ...
}
```

3. **Оновити `data/pools.json`** з реальними пулами

4. **Оновити `templates/impressum_de.html`** з вашими даними

## 🚀 Деплой на Render.com

1. Код вже на GitHub ✅
2. Перейти на https://render.com
3. New → Web Service
4. Connect репозиторій `pilipandr770/TON-PORTAL`
5. Render автоматично знайде `render.yaml`
6. Додати змінні:
   - `SECRET_KEY` (generate value)
   - `TONCENTER_API_KEY` (ваш ключ)
7. Deploy!

## 📚 Документація

- `README.md` - Загальний огляд та структура
- `PRODUCTION.md` - Production deployment guide
- `CHANGELOG.md` - Список всіх змін та покращень

## 🆘 Проблеми?

### TonConnect не працює
- Перевірте що CDN доступний
- Або завантажте SDK локально (див. PRODUCTION.md)

### API повертає mock дані
- Додайте `TONCENTER_API_KEY` в `.env`

### Tests fails
- Переконайтесь що всі залежності встановлені
- Видаліть `pytest-flask` якщо є конфлікт

## ✅ Status

- ✅ Код готовий до production
- ✅ Тести проходять (6/6)
- ✅ CI/CD налаштовано
- ✅ Docker готовий
- ✅ Документація повна

## 📞 Контакт

GitHub: https://github.com/pilipandr770/TON-PORTAL
Issues: https://github.com/pilipandr770/TON-PORTAL/issues
