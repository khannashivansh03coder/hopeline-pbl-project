"""
HopeLine FastAPI Application
Fullstack backend with SQLite database integration, REST APIs, and Swagger documentation.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from . import database as db
from . import algorithms as algo
from .models import PatientCreate, ResourceUpdate, DonorMatchRequest, RawQueryRequest

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema and seed initial data
    db.init_db()
    yield

app = FastAPI(
    title="HopeLine API - Hospital Resource & Blood Donor Matching System",
    description="Fullstack backend with SQLite database and C++ algorithm integration for PBL Phase 3 (Team CodePulse).",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Summary Stats API
# -------------------------------------------------------------
@app.get("/api/stats", tags=["System Statistics"])
def get_system_stats():
    conn = db.get_db_connection()
    queue_count = conn.execute("SELECT COUNT(*) as c FROM patients WHERE status = 'PENDING'").fetchone()["c"]
    icu_avail = conn.execute("SELECT COUNT(*) as c FROM resources WHERE type = 'ICU Bed' AND state = 'AVAILABLE'").fetchone()["c"]
    o2_avail = conn.execute("SELECT COUNT(*) as c FROM resources WHERE type = 'Oxygen Unit' AND state = 'AVAILABLE'").fetchone()["c"]
    ready_donors = conn.execute("SELECT COUNT(*) as c FROM donors WHERE available = 1").fetchone()["c"]
    total_donors = conn.execute("SELECT COUNT(*) as c FROM donors").fetchone()["c"]
    conn.close()

    return {
        "active_queue_patients": queue_count,
        "available_icu_beds": f"{icu_avail} / 5",
        "available_oxygen_units": f"{o2_avail} / 5",
        "ready_blood_donors": f"{ready_donors} / {total_donors}"
    }

# -------------------------------------------------------------
# Patients & Triage Queue APIs (Shivansh Module)
# -------------------------------------------------------------
@app.get("/api/patients", tags=["Patients & Queue"])
def list_patients():
    return db.get_all_patients()

@app.post("/api/patients", status_code=status.HTTP_201_CREATED, tags=["Patients & Queue"])
def admit_patient(patient: PatientCreate):
    conn = db.get_db_connection()
    max_id_row = conn.execute("SELECT MAX(patient_id) as m FROM patients").fetchone()
    conn.close()
    new_patient_id = (max_id_row["m"] or 100) + 1

    payload = patient.model_dump()
    payload["patient_id"] = new_patient_id

    created = db.insert_patient(payload)
    db.export_db_to_cpp_json()
    return created

@app.post("/api/patients/{patient_id}/wait", tags=["Patients & Queue"])
def boost_wait_time(patient_id: int):
    updated = db.update_patient_wait_time(patient_id, additional_mins=5)
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.export_db_to_cpp_json()
    return updated

@app.delete("/api/patients/{patient_id}", tags=["Patients & Queue"])
def delete_patient(patient_id: int):
    success = db.remove_patient(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.export_db_to_cpp_json()
    return {"status": "success", "message": f"Patient #{patient_id} deleted"}

@app.get("/api/queue", tags=["Patients & Queue"])
def get_priority_queue():
    """Returns patients ordered by Max-Heap Priority (highest score first)."""
    patients = db.get_all_patients()
    heap = algo.MaxHeapQueue()
    for p in patients:
        heap.insert(p)

    sorted_queue = []
    while len(heap.heap) > 0:
        sorted_queue.append(heap.extract_max())
    return sorted_queue

@app.post("/api/triage/process-next", tags=["Patients & Queue"])
def process_highest_priority():
    """C++ CLI Option 4: Dequeue root of Max-Heap, allocate hospital resource, find donor, log audit."""
    patients = db.get_all_patients()
    if not patients:
        raise HTTPException(status_code=400, detail="No patients in emergency queue")

    # Patient with highest priority score is first
    top_patient = patients[0]

    # 1. Allocate hospital resource from SQLite
    resources = db.get_all_resources()
    target_category = "ICU" if "ICU" in top_patient["required_resource"].upper() else ("OXYGEN" if "OXYGEN" in top_patient["required_resource"].upper() else "GENERAL")

    allocated_res = None
    for r in resources:
        r_type = r["type"].upper()
        if target_category in r_type and r["state"] == "AVAILABLE":
            allocated_res = r
            break

    resource_outcome = ""
    if allocated_res:
        db.update_resource(allocated_res["id"], state="OCCUPIED", patient_id=top_patient["patient_id"])
        resource_outcome = f"Allocated {allocated_res['type']} #{allocated_res['id']}"
    else:
        resource_outcome = f"No {top_patient['required_resource']} available (Placed on waitlist)"

    # 2. Donor matching if blood needed
    donor_outcome = "No transfusion required"
    if top_patient["blood_required"]:
        donors = db.get_all_donors()
        best_donor, _ = algo.BloodDonorMatcher.find_best_donor(donors, top_patient["blood_group"], top_patient["priority_score"])
        if best_donor:
            donor_outcome = f"Matched: {best_donor['donor']['name']} ({best_donor['donor']['blood_group']}, {best_donor['donor']['distance']}km, Score: {best_donor['score']})"

    # 3. Log into triage audit table & remove patient
    db.log_triage(
        patient_id=top_patient["patient_id"],
        patient_name=top_patient["name"],
        priority_score=top_patient["priority_score"],
        resource_allocated=resource_outcome,
        donor_matched=donor_outcome
    )
    db.remove_patient(top_patient["patient_id"])
    db.export_db_to_cpp_json()

    return {
        "status": "success",
        "patient": top_patient,
        "priority_score": top_patient["priority_score"],
        "resource_allocation": resource_outcome,
        "blood_donor_match": donor_outcome
    }

# -------------------------------------------------------------
# Hospital Resources APIs (Parikshit Module)
# -------------------------------------------------------------
@app.get("/api/resources", tags=["Hospital Resources (Parikshit Module)"])
def list_resources():
    return db.get_all_resources()

@app.patch("/api/resources/{resource_id}/state", tags=["Hospital Resources (Parikshit Module)"])
def set_resource_state(resource_id: int, update: ResourceUpdate):
    updated = db.update_resource(resource_id, state=update.state, patient_id=update.patient_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.export_db_to_cpp_json()
    return updated

# -------------------------------------------------------------
# Blood Donors & Matching APIs (Piyush Module)
# -------------------------------------------------------------
@app.get("/api/donors", tags=["Blood Donors & Matching (Piyush Module)"])
def list_donors():
    return db.get_all_donors()

@app.post("/api/donors/{donor_id}/toggle", tags=["Blood Donors & Matching (Piyush Module)"])
def toggle_donor(donor_id: str):
    updated = db.toggle_donor_availability(donor_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Donor not found")
    db.export_db_to_cpp_json()
    return updated

@app.post("/api/donors/match", tags=["Blood Donors & Matching (Piyush Module)"])
def match_donor(req: DonorMatchRequest):
    donors = db.get_all_donors()
    best, candidates = algo.BloodDonorMatcher.find_best_donor(donors, req.blood_group, req.urgency_score)
    return {
        "target_blood_group": req.blood_group,
        "urgency_score": req.urgency_score,
        "best_match": best,
        "ranked_candidates": candidates
    }

@app.get("/api/blood-units", tags=["Blood Donors & Matching (Piyush Module)"])
def list_blood_units():
    return db.get_all_blood_units()

@app.get("/api/triage/logs", tags=["Audit & Logs"])
def get_logs():
    return db.get_triage_logs()

# -------------------------------------------------------------
# Relational Database Inspector & SQL Explorer
# -------------------------------------------------------------
@app.post("/api/database/query", tags=["Database Explorer"])
def execute_sql_query(req: RawQueryRequest):
    """Allows running read-only SELECT SQL queries to demonstrate the SQLite database schema & data during viva."""
    try:
        results = db.execute_raw_select(req.query)
        return {"status": "success", "query": req.query, "row_count": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/sync/cpp", tags=["C++ Data Sync"])
def sync_to_cpp_files():
    db.export_db_to_cpp_json()
    return {"status": "success", "message": "Exported SQLite database rows to data/*.json"}

# -------------------------------------------------------------
# Frontend Static Mount
# -------------------------------------------------------------
if os.path.exists(FRONTEND_DIR):
    @app.get("/", include_in_schema=False)
    def serve_frontend_root():
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        return FileResponse(index_path)

    app.mount("/", StaticFiles(directory=FRONTEND_DIR), name="frontend")
