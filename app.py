# file: app.py
from flask import Flask, render_template, jsonify, send_from_directory, abort
from flask import request
from config import Settings
import requests
import logging
import os
import json

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
    # HSTS (увімкни на проді з HTTPS)
    resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # CSP: дозволяємо локальні скрипти + (за потреби) unpkg
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

# Healthcheck
@app.route("/healthz")
def healthz():
    return jsonify({"status": "ok"})

# TonConnect manifest (локальний; поки лежить у /static)
@app.route("/tonconnect-manifest.json")
def tc_manifest():
    return send_from_directory("static", "tonconnect-manifest.json", mimetype="application/json")

# API: баланс через TON Center
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

# API: каталог пулів
@app.route("/api/pools")
def api_pools():
    """
    Повертає список доступних TON пулів з data/pools.json
    """
    try:
        pools_file = os.path.join("data", "pools.json")
        with open(pools_file, "r", encoding="utf-8") as f:
            items = json.load(f)
        return jsonify({"items": items})
    except Exception as e:
        logger.exception("pools.json error")
        return jsonify({"error": "pools.json not available", "details": str(e)}), 500

# 404 / 500
@app.errorhandler(404)
def h_404(e):
    return render_template("404.html"), 404

@app.errorhandler(500)
def h_500(e):
    return render_template("500.html"), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=app.config["PORT"])
