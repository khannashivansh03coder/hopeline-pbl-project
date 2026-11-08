# HopeLine - Fullstack System & Web Dashboard (Phase 3 Deliverable)

**Project Title:** HopeLine: Smart Hospital Resource and Blood Donor Matching System  
**Department:** Computer Science & Engineering, Graphic Era (Deemed to be University), Dehradun  
**Course Domains:** Data Structures in C & Object-Oriented Programming with C++ (Phase-III Fullstack Integration)  
**Team CodePulse (T225):**
* **Shivansh Khanna** (Team Lead – Priority Engine & Patient Triage)
* **Piyush Srivastava** (Developer – Donor Hash Table & Multi-Factor Donor Matcher)
* **Parikshit Thakur** (Developer – Hospital Resource Hierarchy, Fullstack Web Architecture & Relational Database)
* **Faculty Mentor:** Mr. Sanjeev Kukreti

---

## 🏗️ Fullstack System Architecture

```
modules/parikshit/website/
├── backend/
│   ├── main.py           # FastAPI REST API with Swagger OpenAPI documentation
│   ├── database.py       # SQLite connection, relational schema, seeding & SQL query helpers
│   ├── algorithms.py     # HopeLine C++ algorithms ported to Python (Max-Heap, Priority, Donor Matching)
│   └── models.py         # Pydantic schemas for request & response validation
├── database/
│   └── hopeline.db       # Relational SQLite database with 5 tables
├── frontend/
│   ├── index.html        # Single-Page Application (SPA) dashboard + SQL Explorer
│   ├── style.css         # Glassmorphism dark medical theme & animations
│   └── app.js            # Client-side state & REST API integration
├── run.sh                # 1-Click launcher script (starts Uvicorn on port 8000 & opens browser)
└── README.md             # Project documentation & viva guide
```

---

## 🗄️ Relational Database Schema (`database/hopeline.db`)

The system operates on an ACID-compliant relational **SQLite** database containing 5 structured tables:

1. **`patients`**: Stores emergency admissions (`patient_id`, `name`, `age`, `blood_group`, `severity`, `risk_level`, `waiting_time`, `priority_score`, `required_resource`, `status`).
2. **`resources`**: Tracks all 15 hospital resources (`id`, `type`, `state` [AVAILABLE/OCCUPIED/RESERVED], `assigned_patient_id`, `updated_at`).
3. **`donors`**: Registered blood donors (`donor_id`, `name`, `blood_group`, `distance`, `last_donation_date`, `available`).
4. **`blood_units`**: Blood bank storage units (`unit_id`, `blood_group`, `expiry_date`, `status`).
5. **`triage_logs`**: Permanent audit logs of emergency triage decisions (`patient_id`, `patient_name`, `priority_score`, `resource_allocated`, `donor_matched`, `processed_at`).

---

## 🚀 How to Run the Website

### Method 1: Using the Launcher Script (1-Click)
```bash
cd modules/parikshit/website
./run.sh
```

### Method 2: Manual Start
```bash
cd modules/parikshit/website
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Web Application:** [`http://localhost:8000`](http://localhost:8000)
* **Interactive Swagger API Documentation:** [`http://localhost:8000/docs`](http://localhost:8000/docs)
* **ReDoc Technical Reference:** [`http://localhost:8000/redoc`](http://localhost:8000/redoc)

---

## 🌟 Key Features for Viva & Evaluators

1. **Live SQL Database Explorer Tab**:
   * Evaluators can click on any table (`patients`, `resources`, `donors`, `blood_units`, `triage_logs`) and view real-time database rows.
   * Built-in **Interactive SQL Query Console** to execute custom `SELECT` queries with instant table rendering.
2. **Interactive Swagger REST API (`/docs`)**:
   * Fully documented OpenAPI specifications with live "Try it out" buttons for every endpoint.
3. **Real-Time Priority Queue (Max-Heap) Engine**:
   * Dynamically calculates scores using:
     $$\text{Priority} = (\text{Severity} \times 5) + (\text{Risk} \times 3) + (\min(\lfloor\text{Wait}/5\rfloor, 10) \times 2)$$
   * Displays the actual binary tree structure of the heap.
4. **Hospital Resource Module Showcase (Parikshit's Module)**:
   * Real-time allocation and state changes (`AVAILABLE`, `OCCUPIED`, `RESERVED`) for all 15 resources directly persisted to the database.
5. **Smart Blood Donor Matching Engine (Piyush's Module)**:
   * Multi-criteria donor ranking algorithm combining compatibility, availability, distance, and urgency score.
6. **Two-Way C++ JSON Sync**:
   * Real-time sync between the SQLite database and the project's root `data/*.json` files.
