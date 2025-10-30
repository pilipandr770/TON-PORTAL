# file: app.py
from flask import Flask, render_template, jsonify
from flask import request
from config import Settings
import requests
import logging

app = Flask(__name__)
app.config.from_object(Settings)

# базове логування
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ton-staking-portal")

# Безпечні заголовки у відповідях
@app.after_request
def set_security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    resp.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # CSP: дозволяємо CDN TonConnect та стилі
    resp.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data:; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self' https://unpkg.com; "
        "connect-src 'self' https://toncenter.com https://testnet.toncenter.com;"
    )
    return resp

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/how")
def how():
    return render_template("how.html")

@app.route("/faq")
def faq():
    return render_template("faq.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/impressum")
def impressum():
    return render_template("impressum_de.html")

@app.route("/datenschutz")
def datenschutz():
    return render_template("privacy_de.html")

@app.route("/agb")
def agb():
    return render_template("agb_de.html")

@app.route("/disclaimer")
def disclaimer():
    return render_template("disclaimer.html")

# Просте API: баланс за адресою через TON Center (якщо є API ключ)
@app.route("/api/balance/<address>")
def api_balance(address: str):
    """
    Повертає баланс адреси у нанотонах (та TON), якщо налаштовано TONCENTER_API_KEY.
    Інакше — mock-відповідь для демо.
    """
    mainnet = app.config["TON_MAINNET"]
    api_key = app.config["TONCENTER_API_KEY"]
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=app.config["PORT"])
