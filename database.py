# database.py
"""
PostgreSQL database integration для TON Staking Portal
Використовує psycopg2 для роботи з PostgreSQL
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import logging

logger = logging.getLogger("ton-staking-portal.db")

# Назва схеми для цього проекту
# Можна перевизначити через environment variable DB_SCHEMA
SCHEMA_NAME = os.getenv("DB_SCHEMA", "ton_staking_portal")


def get_db_connection():
    """
    Отримати підключення до PostgreSQL
    З DATABASE_URL environment variable
    """
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Render.com може використовувати postgres://, але psycopg2 потребує postgresql://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    conn = psycopg2.connect(database_url)
    return conn


@contextmanager
def get_db_cursor(commit=False):
    """
    Context manager для роботи з БД курсором
    
    Args:
        commit: чи робити commit після виконання (для INSERT/UPDATE/DELETE)
    
    Usage:
        with get_db_cursor(commit=True) as cur:
            cur.execute("INSERT INTO pools ...")
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Встановити schema для цього з'єднання
    cursor.execute(f"SET search_path TO {SCHEMA_NAME}, public;")
    
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def init_database():
    """
    Ініціалізація БД: створення схеми та таблиць
    Викликається при старті додатку
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Створити схему якщо не існує
        cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME};")
        logger.info(f"Schema {SCHEMA_NAME} created or already exists")
        
        # 2. Створити таблицю pools
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {SCHEMA_NAME}.pools (
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
        """)
        logger.info(f"Table {SCHEMA_NAME}.pools created or already exists")
        
        # 3. Створити індекс для швидкого пошуку
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_pools_address 
            ON {SCHEMA_NAME}.pools(address);
        """)
        
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS idx_pools_active 
            ON {SCHEMA_NAME}.pools(is_active);
        """)
        
        conn.commit()
        logger.info("Database initialization completed successfully")
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def migrate_from_json():
    """
    Міграція даних з data/pools.json в PostgreSQL
    Викликається один раз для переносу існуючих даних
    """
    import json
    
    try:
        # Прочитати pools.json
        with open("data/pools.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        
        pools = data.get("items", [])
        
        if not pools:
            logger.warning("No pools found in pools.json")
            return
        
        with get_db_cursor(commit=True) as cursor:
            for pool in pools:
                # Перевірити чи пул вже існує
                cursor.execute(
                    f"SELECT id FROM {SCHEMA_NAME}.pools WHERE address = %s",
                    (pool["address"],)
                )
                
                if cursor.fetchone():
                    logger.info(f"Pool {pool['name']} already exists, skipping")
                    continue
                
                # Вставити новий пул
                cursor.execute(f"""
                    INSERT INTO {SCHEMA_NAME}.pools 
                    (name, address, url, fee, min_stake_ton, description)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    pool["name"],
                    pool["address"],
                    pool.get("url", ""),
                    pool["fee"],
                    pool["min_stake_ton"],
                    pool.get("description", "")
                ))
                
                logger.info(f"Pool {pool['name']} migrated successfully")
        
        logger.info(f"Migration completed: {len(pools)} pools processed")
        
    except FileNotFoundError:
        logger.warning("pools.json not found, skipping migration")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise


def get_all_pools():
    """
    Отримати всі активні пули з БД
    
    Returns:
        list: Список словників з даними пулів
    """
    with get_db_cursor() as cursor:
        cursor.execute(f"""
            SELECT id, name, address, url, fee, min_stake_ton, description
            FROM {SCHEMA_NAME}.pools
            WHERE is_active = TRUE
            ORDER BY name
        """)
        
        pools = cursor.fetchall()
        return [dict(pool) for pool in pools]


def get_pool_by_address(address):
    """
    Отримати пул за адресою
    
    Args:
        address: Адреса пулу
        
    Returns:
        dict: Дані пулу або None
    """
    with get_db_cursor() as cursor:
        cursor.execute(f"""
            SELECT id, name, address, url, fee, min_stake_ton, description
            FROM {SCHEMA_NAME}.pools
            WHERE address = %s AND is_active = TRUE
        """, (address,))
        
        pool = cursor.fetchone()
        return dict(pool) if pool else None


def add_pool(name, address, url, fee, min_stake_ton, description=""):
    """
    Додати новий пул в БД
    
    Args:
        name: Назва пулу
        address: Адреса пулу
        url: URL сайту пулу
        fee: Комісія (0.05 = 5%)
        min_stake_ton: Мінімальна сума стейку
        description: Опис пулу
        
    Returns:
        int: ID нового пулу
    """
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(f"""
            INSERT INTO {SCHEMA_NAME}.pools 
            (name, address, url, fee, min_stake_ton, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (name, address, url, fee, min_stake_ton, description))
        
        pool_id = cursor.fetchone()["id"]
        logger.info(f"Pool {name} added with ID {pool_id}")
        return pool_id
