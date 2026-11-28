# HopeLine - Smart Hospital Resource & Blood Donor Matching System

**HopeLine** is a modern emergency triage, hospital bed allocation, and blood donor matching platform.

Live portal: [https://hopeline.parikshit07.tech](https://hopeline.parikshit07.tech)

---

## Key Features

1. **Emergency Triage & Queue:**
   - Real-time clinical severity evaluation using Emergency Severity Index (ESI) formulas.
   - Dynamic sorting of incoming critical patients.

2. **Hospital Bed Management:**
   - Real-time occupancy tracking for ICU beds, General ward beds, and Oxygen units.
   - One-click bed state cycling (Available, Occupied, Maintenance) and discharge.

3. **Blood Bank & Donor Matching Network:**
   - Algorithmic matching connecting patients with verified donors.
   - Compatibility scoring based on blood group, geographic proximity, and current availability.

4. **Automated Triage Dispatch:**
   - Automated allocation dequeuing top-priority patients, assigning beds, and dispatching matching blood donors.

---

## Deployment

- **Static Site:** Hosted on Render with custom domain `hopeline.parikshit07.tech`.
- **Backend API (Optional):** FastAPI service with SQLite database support (`backend/main.py`).

### Local Development
```bash
cd parikshit_develope
./run.sh
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
