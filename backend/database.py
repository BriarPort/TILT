# Database layer using sqlite3
# Per TILT Tier 3 requirements, we'll eventually switch to pysqlcipher3 for AES-256 encryption
# For now, using standard sqlite3 to get the logic working first
# WARNING: This is unencrypted - DO NOT use in production without SQLCipher

import sqlite3
import json
import os
from pathlib import Path
from typing import Optional, Dict, List, Any

# Config tweaks
DB_PATH = Path(__file__).parent / 'tilt_data.db'
KEY_PATH = Path(__file__).parent / '.tilt_key'  # Password hash stored separately

# Global connection - will be set after unlock
_db: Optional[sqlite3.Connection] = None
_is_locked = True

def get_db() -> sqlite3.Connection:
    """Get database connection. Raises if locked."""
    if _db is None or _is_locked:
        raise Exception('Database is locked. Please unlock first.')
    return _db

def is_locked() -> bool:
    """Check if database is locked."""
    return _is_locked

def needs_password() -> bool:
    """Check if this is first-time setup (no password file exists)."""
    # First time = no password hash file exists
    # If password file doesn't exist, user needs to create one
    return not KEY_PATH.exists()

def init_db(db_conn=None):
    """Initialize database schema. Creates tables if they don't exist."""
    # Use provided connection or get from global
    # This allows init_db to work during unlock before _is_locked is set to False
    if db_conn is None:
        db = get_db()
    else:
        db = db_conn
    
    # Vendors table - stores all vendor assessment data
    db.execute('''
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            impact REAL NOT NULL,
            likelihood REAL NOT NULL,
            vulnerability INTEGER NOT NULL,
            weakness TEXT,
            strength TEXT,
            assessment_type TEXT,
            answers TEXT,
            osint_warnings TEXT,
            osint_urls TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add osint_urls column if it doesn't exist (migration)
    try:
        db.execute('ALTER TABLE vendors ADD COLUMN osint_urls TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Add data_classification column if it doesn't exist (migration)
    try:
        db.execute('ALTER TABLE vendors ADD COLUMN data_classification INTEGER')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Add cloudScores column if it doesn't exist (migration)
    try:
        db.execute('ALTER TABLE vendors ADD COLUMN cloudScores TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Questions table - stores assessment questions aligned with NIST CSF 2.0
    db.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            nist_control TEXT,
            category TEXT,
            policy_ref TEXT,
            question TEXT NOT NULL,
            weight TEXT,
            maturity_levels TEXT
        )
    ''')
    
    # Cloud criteria table
    db.execute('''
        CREATE TABLE IF NOT EXISTS cloud_criteria (
            id INTEGER PRIMARY KEY,
            category TEXT,
            criterion TEXT NOT NULL,
            description TEXT,
            criticality TEXT,
            points INTEGER,
            osint_source TEXT,
            maturity_levels TEXT
        )
    ''')
    
    # Add maturity_levels column if it doesn't exist (migration)
    try:
        db.execute('ALTER TABLE cloud_criteria ADD COLUMN maturity_levels TEXT')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Settings table
    db.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    
    db.commit()
    
    # Seed default data if empty
    seed_default_data()

def seed_default_data(db_conn=None):
    """Seed default questions and cloud criteria from JSON files."""
    # Use provided connection or get from global
    if db_conn is None:
        db = get_db()
    else:
        db = db_conn
    
    # Check if questions exist
    if db.execute('SELECT COUNT(*) FROM questions').fetchone()[0] == 0:
        questions_path = Path(__file__).parent / 'data' / 'questions_standard.json'
        if questions_path.exists():
            with open(questions_path, 'r') as f:
                questions = json.load(f)
                for q in questions:
                    db.execute('''
                        INSERT INTO questions (id, nist_control, category, policy_ref, question, weight, maturity_levels)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        q['id'], q.get('nist_control'), q.get('category'), q.get('policy_ref'),
                        q['question'], q.get('weight'), json.dumps(q.get('maturity_levels', {}))
                    ))
    
    # Check if cloud criteria exist
    criteria_path = Path(__file__).parent / 'data' / 'questions_cloud.json'
    if criteria_path.exists():
        with open(criteria_path, 'r') as f:
            criteria = json.load(f)
        
        criteria_count = db.execute('SELECT COUNT(*) FROM cloud_criteria').fetchone()[0]
        
        if criteria_count == 0:
            # First time - insert all criteria
            for c in criteria:
                maturity_json = json.dumps(c.get('maturity_levels', {}))
                db.execute('''
                    INSERT INTO cloud_criteria (id, category, criterion, description, criticality, points, osint_source, maturity_levels)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    c['id'], c.get('category'), c['criterion'], c.get('description'),
                    c.get('criticality'), c.get('points'), c.get('osint_source'), maturity_json
                ))
        else:
            # Migration: Update existing criteria with maturity_levels if missing
            for c in criteria:
                maturity_json = json.dumps(c.get('maturity_levels', {}))
                # Check if this criterion exists and needs updating
                existing = db.execute('SELECT maturity_levels FROM cloud_criteria WHERE id = ?', (c['id'],)).fetchone()
                if existing and (not existing['maturity_levels'] or existing['maturity_levels'] == '{}'):
                    # Update with new maturity_levels
                    db.execute('''
                        UPDATE cloud_criteria 
                        SET maturity_levels = ?, category = ?, criterion = ?, description = ?,
                            criticality = ?, points = ?, osint_source = ?
                        WHERE id = ?
                    ''', (
                        maturity_json, c.get('category'), c['criterion'], c.get('description'),
                        c.get('criticality'), c.get('points'), c.get('osint_source'), c['id']
                    ))
    
    # Seed default settings
    if db.execute('SELECT COUNT(*) FROM settings').fetchone()[0] == 0:
        db.execute('INSERT INTO settings (key, value) VALUES (?, ?)', ('orgName', 'Your Organisation'))
    else:
        # Migration: Update old "Your Organization" to Australian English "Your Organisation"
        existing = db.execute('SELECT value FROM settings WHERE key = ?', ('orgName',)).fetchone()
        if existing and existing['value'] == 'Your Organization':
            db.execute('UPDATE settings SET value = ? WHERE key = ?', ('Your Organisation', 'orgName'))
    
    db.commit()

def unlock_db(password: str) -> Dict[str, Any]:
    """
    Unlock database with password.
    For now, just opens sqlite3. Later will use SQLCipher with derived key.
    """
    global _db, _is_locked
    
    # Sanity check
    if not password:
        raise ValueError('Password required')
    
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    
    # Check if password file exists (existing setup)
    if KEY_PATH.exists():
        with open(KEY_PATH, 'r') as f:
            stored_hash = f.read().strip()
        
        # Verify password
        if not pwd_context.verify(password, stored_hash):
            raise ValueError('Invalid password')
    else:
        # First time - create password hash
        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters')
        
        hash_val = pwd_context.hash(password)
        with open(KEY_PATH, 'w') as f:
            f.write(hash_val)
    
    # Open database (unencrypted for now)
    # TO FIX: Switch to SQLCipher when pysqlcipher3 is installed
    _db = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    _db.row_factory = sqlite3.Row  # Return dict-like rows
    
    # Set unlocked BEFORE initializing schema
    # This allows init_db() to use get_db() without errors
    _is_locked = False
    
    # Initialize schema (pass connection to avoid get_db() call during init)
    init_db(_db)
    
    return {'success': True}

def change_password(old_password: str, new_password: str) -> Dict[str, Any]:
    """Change master password. Re-encrypts database with new key."""
    global _db
    
    # Sanity checks
    if _is_locked:
        raise Exception('Database must be unlocked first')
    if not old_password or not new_password:
        raise ValueError('Both old and new passwords required')
    if len(new_password) < 8:
        raise ValueError('New password must be at least 8 characters')
    
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    
    # Verify old password
    if KEY_PATH.exists():
        with open(KEY_PATH, 'r') as f:
            stored_hash = f.read().strip()
        if not pwd_context.verify(old_password, stored_hash):
            raise ValueError('Current password is incorrect')
    
    # Save new password hash
    new_hash = pwd_context.hash(new_password)
    with open(KEY_PATH, 'w') as f:
        f.write(new_hash)
    
    # Note: With standard sqlite3, we don't need to re-encrypt
    # When we switch to SQLCipher, we'll need to export/import all data here
    # TO FIX: Implement re-encryption when using SQLCipher
    
    return {'success': True}

