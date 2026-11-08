"""
HopeLine SQLite Database Engine
Relational database management with schema creation, C++ JSON seeding, and SQL query helpers.
"""

import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
DB_PATH = os.path.join(DB_DIR, "hopeline.db")
CPP_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data"))

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Patients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        blood_group TEXT NOT NULL,
        blood_required TEXT NOT NULL,
        severity INTEGER NOT NULL,
        risk_level INTEGER NOT NULL,
        waiting_time INTEGER DEFAULT 0,
        priority_score INTEGER DEFAULT 0,
        required_resource TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Resources Table (ICU, General Bed, Oxygen)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'AVAILABLE',
        assigned_patient_id INTEGER NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Blood Donors Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        blood_group TEXT NOT NULL,
        distance INTEGER NOT NULL,
        last_donation_date TEXT NOT NULL,
        available BOOLEAN NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Blood Units Inventory Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blood_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id TEXT UNIQUE NOT NULL,
        blood_group TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Triage Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS triage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        patient_name TEXT NOT NULL,
        priority_score INTEGER NOT NULL,
        resource_allocated TEXT,
        donor_matched TEXT,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

    # Seed initial data if tables are empty
    seed_from_cpp_json()

def seed_from_cpp_json():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Seed Resources if empty
    cursor.execute("SELECT COUNT(*) as count FROM resources")
    if cursor.fetchone()["count"] == 0:
        res_file = os.path.join(CPP_DATA_DIR, "resources.json")
        if os.path.exists(res_file):
            with open(res_file, "r", encoding="utf-8") as f:
                resources = json.load(f)
                for r in resources:
                    cursor.execute("""
                    INSERT OR IGNORE INTO resources (id, type, state)
                    VALUES (?, ?, ?)
                    """, (r["id"], r["type"], r["state"]))

    # Seed Donors if empty
    cursor.execute("SELECT COUNT(*) as count FROM donors")
    if cursor.fetchone()["count"] == 0:
        donors_file = os.path.join(CPP_DATA_DIR, "donors.json")
        if os.path.exists(donors_file):
            with open(donors_file, "r", encoding="utf-8") as f:
                donors = json.load(f)
                for d in donors:
                    cursor.execute("""
                    INSERT OR IGNORE INTO donors (donor_id, name, blood_group, distance, last_donation_date, available)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (d["donorId"], d["name"], d["bloodGroup"], d["distance"], d["lastDonationDate"], 1 if d["available"] else 0))

    # Seed Blood Units if empty
    cursor.execute("SELECT COUNT(*) as count FROM blood_units")
    if cursor.fetchone()["count"] == 0:
        bu_file = os.path.join(CPP_DATA_DIR, "blood_units.json")
        if os.path.exists(bu_file):
            with open(bu_file, "r", encoding="utf-8") as f:
                blood_units = json.load(f)
                for bu in blood_units:
                    cursor.execute("""
                    INSERT OR IGNORE INTO blood_units (unit_id, blood_group, expiry_date, status)
                    VALUES (?, ?, ?, ?)
                    """, (bu["unitId"], bu["bloodGroup"], bu["expiryDate"], bu["status"]))

    # Seed Patients if empty
    cursor.execute("SELECT COUNT(*) as count FROM patients")
    if cursor.fetchone()["count"] == 0:
        pat_file = os.path.join(CPP_DATA_DIR, "patients.json")
        if os.path.exists(pat_file):
            with open(pat_file, "r", encoding="utf-8") as f:
                patients = json.load(f)
                for p in patients:
                    severity = p.get("severity", 5)
                    risk = p.get("riskLevel", 5)
                    wait = p.get("waitingTime", 0)
                    wait_score = min(wait // 5, 10)
                    score = (severity * 5) + (risk * 3) + (wait_score * 2)
                    cursor.execute("""
                    INSERT OR IGNORE INTO patients (patient_id, name, age, blood_group, blood_required, severity, risk_level, waiting_time, priority_score, required_resource, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
                    """, (p["patientId"], p["name"], p["age"], p["bloodGroup"], p["bloodRequired"], severity, risk, wait, score, p["requiredResource"]))

    conn.commit()
    conn.close()

# -------------------------------------------------------------
# Database CRUD Operations
# -------------------------------------------------------------
def get_all_patients() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM patients WHERE status = 'PENDING' ORDER BY priority_score DESC, waiting_time DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_patient_by_id(patient_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def insert_patient(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    severity = int(patient_data.get("severity", 5))
    risk = int(patient_data.get("risk_level", 5))
    wait = int(patient_data.get("waiting_time", 0))
    wait_score = min(wait // 5, 10)
    priority = (severity * 5) + (risk * 3) + (wait_score * 2)

    cursor.execute("""
    INSERT INTO patients (patient_id, name, age, blood_group, blood_required, severity, risk_level, waiting_time, priority_score, required_resource, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    """, (
        patient_data["patient_id"],
        patient_data["name"],
        patient_data["age"],
        patient_data["blood_group"],
        patient_data.get("blood_required", patient_data["blood_group"]),
        severity,
        risk,
        wait,
        priority,
        patient_data["required_resource"]
    ))
    conn.commit()
    conn.close()
    return get_patient_by_id(patient_data["patient_id"])

def update_patient_wait_time(patient_id: int, additional_mins: int = 5) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,)).fetchone()
    if not row:
        conn.close()
        return None

    new_wait = row["waiting_time"] + additional_mins
    severity = row["severity"]
    risk = row["risk_level"]
    wait_score = min(new_wait // 5, 10)
    new_priority = (severity * 5) + (risk * 3) + (wait_score * 2)

    conn.execute("""
    UPDATE patients SET waiting_time = ?, priority_score = ? WHERE patient_id = ?
    """, (new_wait, new_priority, patient_id))
    conn.commit()
    conn.close()
    return get_patient_by_id(patient_id)

def remove_patient(patient_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM patients WHERE patient_id = ?", (patient_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_all_resources() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM resources ORDER BY id ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_resource(resource_id: int, state: str, patient_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    conn.execute("""
    UPDATE resources
    SET state = ?, assigned_patient_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (state, patient_id, resource_id))
    conn.commit()
    row = conn.execute("SELECT * FROM resources WHERE id = ?", (resource_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_all_donors() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM donors ORDER BY distance ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def toggle_donor_availability(donor_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    row = conn.execute("SELECT available FROM donors WHERE donor_id = ?", (donor_id,)).fetchone()
    if not row:
        conn.close()
        return None
    new_status = 0 if row["available"] else 1
    conn.execute("UPDATE donors SET available = ? WHERE donor_id = ?", (new_status, donor_id))
    conn.commit()
    updated = conn.execute("SELECT * FROM donors WHERE donor_id = ?", (donor_id,)).fetchone()
    conn.close()
    return dict(updated) if updated else None

def get_all_blood_units() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM blood_units ORDER BY expiry_date ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def log_triage(patient_id: int, patient_name: str, priority_score: int, resource_allocated: str, donor_matched: str):
    conn = get_db_connection()
    conn.execute("""
    INSERT INTO triage_logs (patient_id, patient_name, priority_score, resource_allocated, donor_matched)
    VALUES (?, ?, ?, ?, ?)
    """, (patient_id, patient_name, priority_score, resource_allocated, donor_matched))
    conn.commit()
    conn.close()

def get_triage_logs(limit: int = 15) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM triage_logs ORDER BY processed_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def execute_raw_select(query: str) -> List[Dict[str, Any]]:
    """Allows professor/user to execute read-only SQL queries from the UI to inspect the database."""
    clean = query.strip().upper()
    if not clean.startswith("SELECT") and not clean.startswith("PRAGMA") and not clean.startswith("EXPLAIN"):
        raise ValueError("Only read-only SELECT or PRAGMA statements are permitted in raw query inspection.")
    conn = get_db_connection()
    rows = conn.execute(query).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def export_db_to_cpp_json():
    """Exports SQLite state directly back to hopeline-pbl-project/data/*.json for full compatibility."""
    conn = get_db_connection()
    patients = [dict(r) for r in conn.execute("SELECT patient_id as patientId, name, age, blood_group as bloodGroup, blood_required as bloodRequired, severity, risk_level as riskLevel, waiting_time as waitingTime, required_resource as requiredResource FROM patients WHERE status = 'PENDING'").fetchall()]
    resources = [dict(r) for r in conn.execute("SELECT id, type, state FROM resources").fetchall()]
    donors = [{"donorId": r["donor_id"], "name": r["name"], "bloodGroup": r["blood_group"], "distance": r["distance"], "lastDonationDate": r["last_donation_date"], "available": bool(r["available"])} for r in conn.execute("SELECT * FROM donors").fetchall()]
    blood_units = [{"unitId": r["unit_id"], "bloodGroup": r["blood_group"], "expiryDate": r["expiry_date"], "status": r["status"]} for r in conn.execute("SELECT * FROM blood_units").fetchall()]
    conn.close()

    os.makedirs(CPP_DATA_DIR, exist_ok=True)
    with open(os.path.join(CPP_DATA_DIR, "patients.json"), "w", encoding="utf-8") as f:
        json.dump(patients, f, indent=4)
    with open(os.path.join(CPP_DATA_DIR, "resources.json"), "w", encoding="utf-8") as f:
        json.dump(resources, f, indent=4)
    with open(os.path.join(CPP_DATA_DIR, "donors.json"), "w", encoding="utf-8") as f:
        json.dump(donors, f, indent=4)
    with open(os.path.join(CPP_DATA_DIR, "blood_units.json"), "w", encoding="utf-8") as f:
        json.dump(blood_units, f, indent=4)
