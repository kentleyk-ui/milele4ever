#!/usr/bin/env python3

"""
Script de restauration des données depuis une sauvegarde Supabase
"""

import os
import sys
import asyncio
from pathlib import Path

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ Error: psycopg2 not installed")
    print("Install it with: pip install psycopg2-binary")
    sys.exit(1)

# Get the scripts directory
SCRIPTS_DIR = Path(__file__).parent

# List of migration files
MIGRATIONS = [
    '001-create-tables.sql',
    '002-rls-policies.sql',
    '003-service-request-full.sql'
]

def get_connection_string():
    """Build PostgreSQL connection string from environment variables"""
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_role_key:
        print('❌ Missing environment variables')
        return None
    
    host = supabase_url.replace('https://', '').replace('http://', '').split('.')[0]
    host = f"{host}.supabase.co"
    
    conn_string = f"postgresql://postgres:{service_role_key}@{host}:5432/postgres"
    return conn_string

def execute_migration(conn, file_path):
    """Execute a single SQL migration file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print(f"\n📝 Executing: {file_path.name}")
        
        with conn.cursor() as cur:
            cur.execute(sql_content)
        
        conn.commit()
        print(f"✅ Completed: {file_path.name}")
        return True
        
    except Exception as e:
        print(f"❌ Error in {file_path.name}: {e}")
        conn.rollback()
        return False

def run_backup_restore():
    """Main function"""
    print('🔄 Starting Backup Restoration...\n')
    
    conn_string = get_connection_string()
    if not conn_string:
        sys.exit(1)
    
    try:
        print('📡 Connecting to Supabase...')
        conn = psycopg2.connect(conn_string)
        print('✅ Connected\n')
        
        success_count = 0
        
        for migration in MIGRATIONS:
            file_path = SCRIPTS_DIR / migration
            
            if not file_path.exists():
                print(f"❌ File not found: {file_path}")
                continue
            
            if execute_migration(conn, file_path):
                success_count += 1
        
        conn.close()
        
        print('\n' + '═' * 50)
        print(f'✨ Completed: {success_count}/{len(MIGRATIONS)} migrations')
        
    except Exception as e:
        print(f'❌ Error: {e}')
        sys.exit(1)

if __name__ == '__main__':
    run_backup_restore()
