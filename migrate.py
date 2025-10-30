#!/usr/bin/env python3
"""
Міграційний скрипт для TON Staking Portal
Створює схему БД та переносить дані з JSON
"""
import os
import sys

# Додати поточну директорію до шляху
sys.path.insert(0, os.path.dirname(__file__))

from database import init_database, migrate_from_json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migration")

def main():
    """
    Головна функція міграції
    """
    if not os.getenv("DATABASE_URL"):
        logger.error("DATABASE_URL environment variable is not set!")
        logger.info("Please set DATABASE_URL before running migration:")
        logger.info("  export DATABASE_URL='postgresql://user:pass@host/db'")
        sys.exit(1)
    
    logger.info("Starting database migration...")
    logger.info(f"DATABASE_URL: {os.getenv('DATABASE_URL')[:30]}...")
    
    try:
        # 1. Ініціалізувати БД (створити схему і таблиці)
        logger.info("Step 1: Initializing database schema...")
        init_database()
        logger.info("✓ Database schema created successfully")
        
        # 2. Мігрувати дані з JSON
        logger.info("Step 2: Migrating data from pools.json...")
        migrate_from_json()
        logger.info("✓ Data migration completed successfully")
        
        logger.info("")
        logger.info("=" * 60)
        logger.info("Migration completed successfully! 🎉")
        logger.info("=" * 60)
        logger.info("")
        logger.info("You can now:")
        logger.info("  1. Check pools in database")
        logger.info("  2. Start the application")
        logger.info("  3. Test /api/pools endpoint")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
