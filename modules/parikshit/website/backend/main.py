"""
HopeLine Hospital REST API (FastAPI)
Backend service ready for Render deployment.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from . import database as db

app = FastAPI(
    title="HopeLine - Clinical Emergency System API",
    description="Emergency Triage & Hospital Resource Matching REST API (PBL Phase 3 - Team CodePulse)",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    db.init_hospital_db()

class PatientModel(BaseModel):
    name: str = Field(..., example="Ramesh Chandra")
    age: int = Field(..., example=48)
    blood_group: str = Field(..., example="O+")
    severity: int = Field(..., ge=1, le=10, example=8)
    risk_level: int = Field(..., ge=1, le=10, example=7)
    waiting_time: int = Field(0, ge=0, example=10)
    required_resource: str = Field(..., example="ICU")

@app.get("/")
def root():
    return {
        "hospital": "HopeLine Emergency System",
        "status": "Online",
        "team": "CodePulse (T225)",
        "domain": "parikshit07.tech",
        "docs": "/docs"
    }

@app.get("/api/stats")
def get_stats():
    conn = db.get_connection()
    queue_len = conn.execute("SELECT COUNT(*) as c FROM patients WHERE status = 'PENDING'").fetchone()["c"]
    icu_avail = conn.execute("SELECT COUNT(*) as c FROM resources WHERE type = 'ICU Bed' AND state = 'AVAILABLE'").fetchone()["c"]
    o2_avail = conn.execute("SELECT COUNT(*) as c FROM resources WHERE type = 'Oxygen Unit' AND state = 'AVAILABLE'").fetchone()["c"]
    donors_count = conn.execute("SELECT COUNT(*) as c FROM donors WHERE available = 1").fetchone()["c"]
    conn.close()

    return {
        "active_queue_patients": queue_len,
        "available_icu_beds": f"{icu_avail} / 5",
        "available_oxygen_units": f"{o2_avail} / 5",
        "ready_blood_donors": f"{donors_count} / 5"
    }

@app.get("/api/patients")
def get_patients():
    return db.get_all_patients()

@app.get("/api/resources")
def get_resources():
    return db.get_all_resources()

@app.get("/api/donors")
def get_donors():
    return db.get_all_donors()
