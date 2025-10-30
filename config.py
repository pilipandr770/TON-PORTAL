# file: config.py
import os

class Settings:
    PORT = int(os.getenv("PORT", "5000"))
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    TON_MAINNET = os.getenv("TON_MAINNET", "true").lower() == "true"
    TONCENTER_API_KEY = os.getenv("TONCENTER_API_KEY", "")
