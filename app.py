# file: app.py
from flask import Flask, render_template, jsonify, send_from_directory, request
from config import Settings
import requests
import logging
import os
import json

# Rate limiting & caching
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from logging.handlers import RotatingFileHandler

# Database
from database import init_database, migrate_from_json, get_all_pools

app = Flask(__name__)
app.config.from_object(Settings)

# ---- Logging (rotating file) ----
os.makedirs("logs", exist_ok=True)
file_handler = RotatingFileHandler("logs/app.log", maxBytes=2_000_000, backupCount=5)
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s %(message)s"
)
file_handler.setFormatter(file_formatter)
app.logger.addHandler(file_handler)

# базове логування (консоль)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ton-staking-portal")

# ---- Database initialization ----
# Ініціалізувати БД при старті (тільки якщо є DATABASE_URL)
if os.getenv("DATABASE_URL"):
    try:
        logger.info("Initializing database...")
        init_database()
        logger.info("Database initialized successfully")
        
        # Спробувати міграцію з JSON (якщо це перший запуск)
        try:
            migrate_from_json()
            logger.info("Data migration from JSON completed")
        except Exception as e:
            logger.warning(f"Migration skipped or failed: {e}")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        logger.info("Will use JSON fallback for pools data")
        # Продовжити роботу без БД (fallback на JSON)
else:
    logger.info("No DATABASE_URL found, using JSON file for pools")
logger = logging.getLogger("ton-staking-portal")

# ---- Rate Limiter ----
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per hour"],
    storage_uri="memory://"
)

# ---- Cache ----
cache = Cache(app, config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 30})

# Безпечні заголовки у відповідях
@app.after_request
def set_security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    resp.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # HSTS (увімкни на проді з HTTPS)
    resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # CSP: дозволяємо локальні скрипти + unpkg + ton-connect registry + bridge servers для гаманців
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https://ton-connect.github.io https://*.tonkeeper.com https://*.tonhub.com https://static.mytonwallet.io; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; "
        "connect-src 'self' "
        "https://ton-connect.github.io "
        "https://toncenter.com https://testnet.toncenter.com "
        "https://bridge.tonapi.io wss://bridge.tonapi.io "
        "https://tonconnectbridge.mytonwallet.org wss://tonconnectbridge.mytonwallet.org "
        "https://connect.mytonwallet.org "
        "https://*.tonkeeper.com wss://*.tonkeeper.com "
        "https://app.tonkeeper.com "
        "https://*.wallet.tg wss://*.wallet.tg "
        "https://*.tonhub.com wss://*.tonhub.com "
        "https://api.defillama.com;"
    )
    return resp

@app.route("/")
def index():
    return render_template("index.html", title="TON Staking Portal")

@app.route("/how")
def how():
    return render_template("how.html", title="Wie es funktioniert")

@app.route("/faq")
def faq():
    return render_template("faq.html", title="FAQ")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html", title="Dashboard")

@app.route("/pools")
def pools_page():
    return render_template("pools.html", title="TON Pools")

@app.route("/impressum")
def impressum():
    return render_template("impressum_de.html", title="Impressum")

@app.route("/datenschutz")
def datenschutz():
    return render_template("privacy_de.html", title="Datenschutzerklärung")

@app.route("/agb")
def agb():
    return render_template("agb_de.html", title="AGB")

@app.route("/disclaimer")
def disclaimer():
    return render_template("disclaimer.html", title="Disclaimer")

# ---- Health & Version ----
@app.route("/healthz")
def healthz():
    health = {
        "status": "ok",
        "database": "not_configured",
        "pools_file": "not_found"
    }
    
    # Check database connection
    if os.getenv("DATABASE_URL"):
        try:
            pools = get_all_pools()
            health["database"] = f"connected ({len(pools)} pools)"
        except Exception as e:
            health["database"] = f"error: {str(e)[:100]}"
    
    # Check pools.json file
    pools_path = os.path.join(app.root_path, "data", "pools.json")
    if os.path.exists(pools_path):
        try:
            with open(pools_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and "items" in data:
                health["pools_file"] = f"ok ({len(data['items'])} pools)"
            elif isinstance(data, list):
                health["pools_file"] = f"ok ({len(data)} pools)"
            else:
                health["pools_file"] = "invalid_format"
        except Exception as e:
            health["pools_file"] = f"error: {str(e)[:100]}"
    
    return jsonify(health)

@app.route("/version")
def version():
    git_sha = os.getenv("GIT_COMMIT_SHA", "dev")
    return jsonify({"version": git_sha})

# ---- TonConnect manifest (локальний) ----
@app.route("/tonconnect-manifest.json")
def tc_manifest():
    return send_from_directory("static", "tonconnect-manifest.json", mimetype="application/json")

# ---- API: balance (limited + cached) ----
@limiter.limit("10 per minute")
@cache.cached(timeout=30, query_string=True)
@app.route("/api/balance/<address>")
def api_balance(address: str):
    """
    Повертає баланс адреси у нанотонах (та TON), якщо налаштовано TONCENTER_API_KEY.
    Інакше — mock-відповідь для демо.
    Кеш: 30s. Rate limit: 10/min per IP.
    """
    mainnet = app.config.get("TON_MAINNET", True)
    api_key = app.config.get("TONCENTER_API_KEY", "")
    if not api_key:
        # демо-дані
        return jsonify({
            "network": "mock",
            "address": address,
            "balance_nano": 1234567890,
            "balance_ton": 1.23456789
        })

    base_url = "https://toncenter.com/api/v3" if mainnet else "https://testnet.toncenter.com/api/v3"
    try:
        r = requests.get(
            f"{base_url}/addressInformation",
            params={"address": address},
            headers={"X-API-Key": api_key},
            timeout=10
        )
        r.raise_for_status()
        data = r.json()
        balance_nano = int(data.get("balance", 0))
        balance_ton = balance_nano / 1e9
        return jsonify({
            "network": "mainnet" if mainnet else "testnet",
            "address": address,
            "balance_nano": balance_nano,
            "balance_ton": balance_ton
        })
    except Exception as e:
        logger.exception("TON Center API error")
        return jsonify({"error": "TON API error", "details": str(e)}), 502

# ---- API: pools (no limit; lightweight) ----
@app.route("/api/pools")
def api_pools():
    """
    Повертає список доступних TON пулів
    Спочатку пробує PostgreSQL, якщо немає - fallback на JSON
    """
    try:
        # Спробувати отримати з PostgreSQL
        if os.getenv("DATABASE_URL"):
            try:
                pools = get_all_pools()
                # Форматувати для API (видалити id, якщо є)
                items = []
                for pool in pools:
                    item = {
                        "name": pool["name"],
                        "address": pool["address"],
                        "url": pool.get("url", ""),
                        "fee": float(pool["fee"]),
                        "min_stake_ton": float(pool["min_stake_ton"])
                    }
                    if pool.get("description"):
                        item["description"] = pool["description"]
                    items.append(item)
                
                logger.info(f"Loaded {len(items)} pools from PostgreSQL")
                return jsonify({"items": items})
            except Exception as db_error:
                logger.warning(f"PostgreSQL error, falling back to JSON: {db_error}")
        
        # Fallback: читати з pools.json (використовуємо app.root_path для коректного шляху)
        pools_path = os.path.join(app.root_path, "data", "pools.json")
        
        if not os.path.exists(pools_path):
            logger.error(f"pools.json not found at {pools_path}")
            return jsonify({"error": "pools.json not found", "path": pools_path}), 500
        
        logger.info(f"Reading pools from {pools_path}")
        with open(pools_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Якщо формат {"items": [...]}
        if isinstance(data, dict) and "items" in data:
            logger.info(f"Loaded {len(data['items'])} pools from JSON (dict format)")
            return jsonify(data)
        # Якщо формат [...]
        elif isinstance(data, list):
            logger.info(f"Loaded {len(data)} pools from JSON (list format)")
            return jsonify({"items": data})
        else:
            logger.error(f"Invalid pools.json format: {type(data)}")
            return jsonify({"error": "Invalid pools.json format", "type": str(type(data))}), 500
            
    except json.JSONDecodeError as e:
        logger.exception(f"pools.json JSON decode error at line {e.lineno}, col {e.colno}")
        return jsonify({"error": "pools.json invalid JSON", "details": str(e)}), 500
    except Exception as e:
        logger.exception("Error loading pools")
        return jsonify({"error": "Pools not available", "details": str(e)}), 500

# ---- OpenAPI docs ----
@app.route("/docs")
def docs():
    return render_template("docs.html", title="API Docs (OpenAPI)")

@app.route("/openapi.yaml")
def openapi_yaml():
    return send_from_directory(".", "openapi.yaml", mimetype="text/yaml")

# ---- Security Check Helpers ----
def _load_pools_list():
    """Helper для завантаження pools.json"""
    pools_path = os.path.join(app.root_path, "data", "pools.json")
    with open(pools_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("items", [])

def toncenter_base(mainnet: bool) -> str:
    return "https://toncenter.com/api/v2" if mainnet else "https://testnet.toncenter.com/api/v2"

def tc_headers():
    api_key = app.config.get("TONCENTER_API_KEY", "")
    return {"X-API-Key": api_key} if api_key else {}

def tc_get_account_info(address: str) -> dict:
    """Отримати інформацію про контракт через Toncenter V2"""
    mainnet = app.config.get("TON_MAINNET", True)
    base = toncenter_base(mainnet)
    url = f"{base}/getAddressInformation"
    r = requests.get(url, params={"address": address}, headers=tc_headers(), timeout=10)
    r.raise_for_status()
    return r.json()

def tc_try_run_get_method(address: str, method: str) -> dict | None:
    """Спробувати виконати get-метод контракту"""
    mainnet = app.config.get("TON_MAINNET", True)
    base = toncenter_base(mainnet)
    url = f"{base}/runGetMethod"
    try:
        r = requests.get(url, params={"address": address, "method": method}, headers=tc_headers(), timeout=10)
        if r.status_code != 200:
            return None
        data = r.json()
        return data if data.get("ok") else None
    except Exception:
        return None

def llama_tvl(slug: str) -> float | None:
    """Отримати TVL з DeFiLlama"""
    try:
        r = requests.get(f"https://api.llama.fi/tvl/{slug}", timeout=10)
        if r.status_code == 200:
            data = r.json()
            # DeFiLlama може повертати різні формати
            if isinstance(data, list) and data:
                return float(data[-1].get("totalLiquidityUSD") or data[-1].get("tvl") or 0.0)
            if isinstance(data, (int, float)):
                return float(data)
            if isinstance(data, dict):
                return float(data.get("tvl", 0.0))
    except Exception as e:
        logger.warning(f"DeFiLlama TVL fetch failed for {slug}: {e}")
    return None

@app.route("/api/pool/<address>/security")
@cache.cached(timeout=60)
@limiter.limit("30 per minute")
def api_pool_security(address: str):
    """
    Аггрегує метадані з pools.json, ончейн-інфо з Toncenter, TVL з DeFiLlama.
    Повертає JSON для модалки безпеки.
    """
    try:
        # 1) Знайти пул у каталозі
        pool = None
        for p in _load_pools_list():
            if p.get("address") == address:
                pool = p
                break
        
        if not pool:
            return jsonify({"error": "pool_not_found"}), 404

        # 2) Ончейн-дані (balance, code_hash; власник через get-методи)
        onchain = {}
        try:
            info = tc_get_account_info(address)
            result = info.get("result", {})
            onchain["balance_nano"] = int(result.get("balance", 0))
            onchain["balance_ton"] = onchain["balance_nano"] / 1e9
            onchain["code_hash"] = result.get("code_hash") or result.get("codeHash") or None
        except Exception as e:
            onchain["error"] = "toncenter_unavailable"
            logger.warning(f"Toncenter getAddressInformation failed: {e}")

        # Спроба визначити owner/admin
        owner = {"detected": False, "method": None, "value": None}
        for method_name in ["get_owner", "owner", "get_admin", "admin", "owner_address"]:
            out = tc_try_run_get_method(address, method_name)
            if out and out.get("stack"):
                owner["detected"] = True
                owner["method"] = method_name
                owner["value"] = out.get("stack")
                break

        # 3) TVL з DeFiLlama (якщо є slug)
        tvl_usd = None
        if pool.get("defillama_slug"):
            tvl_usd = llama_tvl(pool["defillama_slug"])

        # 4) Зібрати відповідь
        import time
        res = {
            "pool": {
                "name": pool.get("name"),
                "type": pool.get("type"),
                "address": pool.get("address"),
                "url": pool.get("url"),
                "fee": pool.get("fee"),
                "min_stake_ton": pool.get("min_stake_ton"),
                "audits": pool.get("audits", []),
                "docs_url": pool.get("docs_url"),
                "faq_url": pool.get("faq_url"),
                "tos_url": pool.get("tos_url"),
                "lst_token": pool.get("lst_token"),
                "lst_risk_note": pool.get("lst_risk_note")
            },
            "onchain": onchain,
            "owner_probe": owner,
            "tvl_usd": tvl_usd,
            "generated_at": int(time.time())
        }
        return jsonify(res)
        
    except Exception as e:
        logger.exception("Security endpoint error")
        return jsonify({"error": "internal_error", "details": str(e)}), 500

# ---- Errors ----
@app.errorhandler(404)
def h_404(e):
    return render_template("404.html"), 404

@app.errorhandler(500)
def h_500(e):
    return render_template("500.html"), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=app.config["PORT"])
