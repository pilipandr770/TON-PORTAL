# TON Staking Portal (Flask)

Простий і безпечний SaaS-портал для взаємодії з TON-екосистемою:
- Підключення гаманця через TonConnect (клієнтська сторона).
- Відображення балансу через TON Center API (якщо є ключ).
- Німецькі правові сторінки: Impressum, Datenschutz, AGB.
- **Ми не зберігаємо кошти та приватні ключі.** Це лише інтерфейс.

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
ton-staking-portal/
├─ app.py                    # Основний Flask додаток
├─ config.py                 # Конфігурація
├─ requirements.txt          # Залежності Python
├─ render.yaml              # Конфігурація для Render.com
├─ .env.example             # Приклад змінних середовища
├─ README.md                # Документація
├─ templates/               # HTML шаблони
│  ├─ base.html
│  ├─ index.html
│  ├─ how.html
│  ├─ faq.html
│  ├─ dashboard.html
│  ├─ impressum_de.html
│  ├─ privacy_de.html
│  ├─ agb_de.html
│  └─ disclaimer.html
└─ static/                  # Статичні файли
   ├─ css/
   │  └─ main.css
   ├─ js/
   │  └─ tonconnect.js
   └─ img/
      └─ logo.svg
```

## Що далі?

1. **TonConnect manifest**: Створіть свій `manifest.json` на вашому домені
2. **TON Center API ключ**: Зареєструйте ключ на https://toncenter.com
3. **Пули/DePool**: Додайте каталог перевірених пулів
4. **Монетизація**: Інтеграція Stripe для Pro-режиму
5. **Локалізація**: Додайте підтримку DE/EN/UA

## Ліцензія

MIT License - використовуйте на свій розсуд, але на власний ризик.
