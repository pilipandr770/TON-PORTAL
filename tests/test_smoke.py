# file: tests/test_smoke.py
"""
Базові smoke тести для Flask додатку
"""
import sys
import os

# Додаємо батьківську директорію до шляху для імпорту app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from app import app as flask_app


@pytest.fixture
def client():
    """Створює тестовий клієнт Flask"""
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client


def test_healthz(client):
    """Тест healthcheck endpoint"""
    response = client.get('/healthz')
    assert response.status_code == 200
    assert response.is_json
    data = response.get_json()
    assert data['status'] == 'ok'


def test_index_page(client):
    """Тест головної сторінки"""
    response = client.get('/')
    assert response.status_code == 200
    assert b'TON Staking Portal' in response.data


def test_dashboard_page(client):
    """Тест сторінки dashboard"""
    response = client.get('/dashboard')
    assert response.status_code == 200
    assert b'Dashboard' in response.data


def test_pools_api(client):
    """Тест API для пулів"""
    response = client.get('/api/pools')
    assert response.status_code == 200
    assert response.is_json
    data = response.get_json()
    assert 'items' in data


def test_404_page(client):
    """Тест 404 сторінки"""
    response = client.get('/nonexistent-page')
    assert response.status_code == 404
    assert b'404' in response.data


def test_tonconnect_manifest(client):
    """Тест TonConnect manifest"""
    response = client.get('/tonconnect-manifest.json')
    assert response.status_code == 200
    assert response.content_type == 'application/json'


def test_version(client):
    """Тест version endpoint"""
    response = client.get('/version')
    assert response.status_code == 200
    assert response.is_json
    data = response.get_json()
    assert 'version' in data


def test_docs_page(client):
    """Тест сторінки документації API"""
    response = client.get('/docs')
    assert response.status_code == 200
    assert b'API Dokumentation' in response.data


def test_openapi_yaml(client):
    """Тест OpenAPI специфікації"""
    response = client.get('/openapi.yaml')
    assert response.status_code == 200
    assert 'text/yaml' in response.content_type


def test_dashboard_has_stake_form(client):
    """Тест наявності форми делегування на Dashboard"""
    response = client.get('/dashboard')
    assert response.status_code == 200
    assert b'Stake in Pool' in response.data
    assert b'pool-select' in response.data
    assert b'stake-amount' in response.data
    assert b'btn-stake' in response.data


def test_tonconnect_js_has_sendstake(client):
    """Тест наявності функції sendStake у tonconnect.js"""
    response = client.get('/static/js/tonconnect.js')
    assert response.status_code == 200
    assert b'sendStake' in response.data
    assert b'sendTransaction' in response.data
