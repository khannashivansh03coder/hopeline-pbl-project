# HopeLine: Smart Hospital Resource Allocation & Blood Donor Matching System

[![PBL Phase](https://img.shields.io/badge/PBL-Phase%203%20Final-emerald.svg)](https://pblgeu.online)
[![Team](https://img.shields.io/badge/Team-CodePulse-blue.svg)](https://github.com/khannashivansh03coder/hopeline-pbl-project)
[![Department](https://img.shields.io/badge/GEU-Dept%20of%20CSE-red.svg)](https://geu.ac.in)

> **Team CodePulse** | **Team ID:** `DSCPP-III-2026-T225`  
> **Course:** Data Structures & Algorithms Project-Based Learning (PBL)  
> **Faculty Mentor:** Mr. Sanjeev Kukreti  
> **Institution:** Department of Computer Science & Engineering, Graphic Era (Deemed to be University), Dehradun  

---

## 👥 Team Contributors
- **Parikshit Thakur** (`@parikshit-thakur25`) — Clinical Web Platform, Dynamic Priority Triage & Emergency Donor Matching Engine
- **Piyush Srivastava** (`@PiyushSrivastava-09`) — Core Data Structures & Algorithm Optimization
- **Shivansh Khanna** (`@khannashivansh03coder`) — System Integration & Console Engine

---

## 🏥 Project Overview
HopeLine is an emergency medical triage and hospital resource management system engineered to minimize mortality by automating patient queue prioritization, ICU/Oxygen bed allocation, and geocoded exact-match blood donor dispatch.

### 🌟 Key System Modules
1. **Dynamic Priority Queue & Triage Engine** (`P = 5*S + 3*R + 2*floor(Wait/5)`): Real-time queue scoring preventing starvation of lower-severity patients.
2. **Hospital Bed & Asset Allocation**: Real-time management across ICU, General, and Oxygen beds with automated admission and discharge pipelines.
3. **Blood Donor Matching Engine**: Geocoded radius matching sorted strictly by exact blood group compatibility and nearest distance.
4. **Clinical Dispatch Console**: Instant simulation and logging of patient intake, resource binding, and emergency donor dispatch.

---

## 🚀 Running the Web Platform
Navigate to the web module and launch the local server or open directly in any modern browser:
```bash
cd parikshit_develope
# Launch with Python:
python3 -m http.server 8000
# Or double-click run.bat (Windows)
```
Live demo also available on cloud deployments: [HopeLine Portal](https://hopeline.parikshit07.tech)
