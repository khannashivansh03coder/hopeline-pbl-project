"""
HopeLine Hospital Database Engine (SQLite)
Relational schema managing patients, resources, donors, and triage audit logs.
"""

import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
DB_PATH = os.path.join(DB_DIR, "hopeline.db")
CPP_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

def get_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_hospital_db():
    conn = get_connection()
    c = conn.cursor()

    # 1. Patients Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        age INTEGER,
        blood_group TEXT,
        blood_required TEXT,
        severity INTEGER,
        risk_level INTEGER,
        waiting_time INTEGER DEFAULT 0,
        priority_score INTEGER DEFAULT 0,
        required_resource TEXT,
        status TEXT DEFAULT 'PENDING',
        admitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Hospital Resources Table (ICU, General Bed, Oxygen)
    c.execute("""
    CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'AVAILABLE',
        assigned_patient_id INTEGER NULL,
        floor TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Blood Donors Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id TEXT UNIQUE,
        name TEXT NOT NULL,
        blood_group TEXT NOT NULL,
        distance INTEGER NOT NULL,
        last_donation_date TEXT,
        available BOOLEAN DEFAULT 1
    );
    """)

    # 4. Blood Units Table
    c.execute("""
    CREATE TABLE IF NOT EXISTS blood_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id TEXT UNIQUE,
        blood_group TEXT NOT NULL,
        expiry_date TEXT,
        status TEXT DEFAULT 'AVAILABLE'
    );
    """)

    # 5. Triage Audit Logs
    c.execute("""
    CREATE TABLE IF NOT EXISTS triage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        patient_name TEXT,
        priority_score INTEGER,
        resource_allocated TEXT,
        donor_matched TEXT,
        triaged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()

    # Seed resources if empty
    c.execute("SELECT COUNT(*) as c FROM resources")
    if c.fetchone()["c"] == 0:
        for i in range(1, 6):
            c.execute("INSERT INTO resources (id, type, state, floor) VALUES (?, 'ICU Bed', 'AVAILABLE', 'Level 3 - Critical Care')", (i,))
        for i in range(6, 11):
            c.execute("INSERT INTO resources (id, type, state, floor) VALUES (?, 'General Bed', 'AVAILABLE', 'Level 2 - General Ward')", (i,))
        for i in range(11, 16):
            c.execute("INSERT INTO resources (id, type, state, floor) VALUES (?, 'Oxygen Unit', 'AVAILABLE', 'Level 1 - Respiratory')", (i,))

    # Seed donors if empty
    c.execute("SELECT COUNT(*) as c FROM donors")
    if c.fetchone()["c"] == 0:
        c.executemany("""
        INSERT INTO donors (donor_id, name, blood_group, distance, last_donation_date, available)
        VALUES (?, ?, ?, ?, ?, ?)
        """, [
            ("D101", "Ravi Kumar", "O+", 5, "2026-06-01", 1),
            ("D102", "Amit Joshi", "O-", 25, "2026-06-15", 1),
            ("D103", "Kunal Mehra", "A+", 8, "2026-07-01", 1),
            ("D104", "Arjun Rawat", "B+", 3, "2026-05-01", 1),
            ("D105", "Neeraj Negi", "O-", 2, "2026-04-01", 0)
        ])

    conn.commit()
    conn.close()

def get_all_patients():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM patients WHERE status = 'PENDING' ORDER BY priority_score DESC, waiting_time DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_resources():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM resources ORDER BY id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_donors():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM donors ORDER BY distance ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]
