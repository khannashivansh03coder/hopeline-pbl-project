# HopeLine - Phase 3 Web Dashboard & Visualizer
**Project Title:** HopeLine: Smart Hospital Resource and Blood Donor Matching System  
**Department:** Computer Science & Engineering, Graphic Era (Deemed to be University), Dehradun  
**Course Domains:** Data Structures in C & Object-Oriented Programming with C++  
**Team CodePulse (T225):**
* **Shivansh Khanna** (Lead – Priority Engine, Patient Triage & Max-Heap Queue)
* **Piyush Srivastava** (Developer – Donor Hash Table & Multi-Factor Donor Matcher)
* **Parikshit Thakur** (Developer – Hospital Resource Module, Web Architecture & System Integration)
* **Faculty Mentor:** Mr. Sanjeev Kukreti

---

## 🌟 Overview
This web application is built as part of **Phase-III PBL Deliverables** under `parikshit-module`. It provides an interactive visual dashboard for the HopeLine decision-support system, demonstrating the underlying C++ data structures and object-oriented architecture in real time.

---

## 🚀 How to Run the Website

### Option 1: Live Interactive Server (Recommended)
This mode connects the website directly with the C++ project's persistent JSON files (`data/patients.json`, `data/resources.json`, `data/donors.json`, `data/blood_units.json`):

```bash
cd modules/parikshit/website
./run.sh
```
*Or manually:*
```bash
python3 server.py
```
Open **`http://localhost:3000`** in your browser. Any change made in the web UI will sync directly with the C++ data store.

### Option 2: Standalone Browser Mode (Zero Setup)
Simply double-click **`index.html`** or run:
```bash
open index.html
```
The application runs offline with local storage support and instant reactivity.

---

## 🎯 Key Features for Viva & Evaluation

1. **🚑 Emergency Patient Triage & Real-Time Priority Scoring**
   * Computes priority scores live using the exact formula from `PriorityEngine.cpp`:
     $$\text{Priority} = (\text{Severity} \times 5) + (\text{Risk} \times 3) + (\min(\lfloor\text{Wait}/5\rfloor, 10) \times 2)$$
   * Dynamic Waiting-Time booster prevents patient starvation.

2. **🌲 Max-Heap Binary Tree Visualizer**
   * Renders the emergency triage priority queue as an active binary heap tree.
   * Visualizes node index relationships:
     * $\text{Parent}(i) = \lfloor (i - 1) / 2 \rfloor$
     * $\text{Left}(i) = 2i + 1$
     * $\text{Right}(i) = 2i + 2$

3. **🏥 Hospital Resource Management (Parikshit's Module)**
   * Complete visual representation of all 15 resources:
     * **ICU Beds** (IDs 1–5)
     * **General Ward Beds** (IDs 6–10)
     * **Oxygen Cylinders** (IDs 11–15)
   * Real-time state toggling (`AVAILABLE`, `OCCUPIED`, `RESERVED`) mapped directly to `Hospital.cpp` and `Resource.cpp`.

4. **🩸 Smart Blood Donor Matching (Piyush's Module)**
   * Multi-criteria donor ranking algorithm:
     $$\text{Match Score} = \text{Compatibility (50/40)} + \text{Availability (20)} + \left(20 - \left\lfloor\frac{\text{Distance}}{5}\right\rfloor\right) + \left\lfloor\frac{\text{Urgency}}{10}\right\rfloor$$
   * Interactive simulator allows selecting any blood group and urgency score to find the single best compatible donor.

5. **Hash Table Bucket Visualizer**
   * Shows how registered blood donors are distributed across blood group buckets using separate chaining for $O(1)$ lookup time.

6. **🚨 Evaluator Demo Presets**
   * One-click presets (`Highway Multi-Vehicle Collision Surge`, `Rare AB- Emergency`) to immediately demonstrate real-time queue reordering during viva presentations.
