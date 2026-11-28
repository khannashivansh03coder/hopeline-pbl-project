# Product Requirement Document (PRD) & System Architecture Report

## Project: HopeLine — Smart Hospital Resource & Blood Donor Matching System
**Document Version:** 3.0.0  
**Status:** Implemented & Production Ready  
**Domain:** Healthcare Systems / Emergency Medical Dispatch  
**Production Portal:** [https://hopeline.parikshit07.tech](https://hopeline.parikshit07.tech)  

---

## 1. Executive Summary & Product Vision

### 1.1 Executive Summary
During multi-casualty incidents, road accidents, and peak emergency surges, hospitals face critical bottlenecks in three independent but interdependent domains:
1. **Emergency Triage Inefficiency:** Clinical delays in determining which incoming patients require immediate life-saving care versus standard admission.
2. **Resource Allocation Gaps:** Manual tracking of ICU ventilators, general ward beds, and oxygen cylinders, resulting in stranded patients or bed misallocations.
3. **Blood Transfusion Delays:** Time-consuming manual searches for compatible blood donors, exacerbated by logistical delays (distance and availability).

**HopeLine** is an integrated emergency decision-support platform that unifies real-time clinical triage indexing, automated bed allocation, and multi-criteria blood donor matching into a single high-throughput dispatch engine.

### 1.2 Product Vision
To provide emergency medical departments, triage nurses, and healthcare administrators with an automated, zero-latency clinical dashboard that eliminates triage guesswork, enforces rigorous algorithmic prioritization, and optimizes hospital capacity.

---

## 2. System Architecture & Component Design

The HopeLine platform employs a modular, event-driven architecture separating clinical decision models, data structure engines, presentation components, and cloud infrastructure:

```
+-------------------------------------------------------------------------+
|                  Presentation Layer (hopeline.parikshit07.tech)          |
|     +-------------------+ +-------------------+ +-------------------+   |
|     | Emergency Triage  | |  Ward Bed Manager | | Blood Bank Matcher|   |
|     +-------------------+ +-------------------+ +-------------------+   |
|     |                Live Dispatch Console Window                   |   |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         Core Algorithmic Engine                         |
|   +--------------------------+        +-----------------------------+   |
|   | Priority Engine (ESI)    |        | Hospital Resource Hierarchy |   |
|   | Score = (S*5)+(R*3)+(W*2)|        | ICU, General, Oxygen Units  |   |
|   +--------------------------+        +-----------------------------+   |
|   | Binary Max-Heap Queue    |        | Multi-Criteria Donor Match  |   |
|   | O(log n) Triage Enqueue  |        | Compatibility & Proximity   |   |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                         Data & State Storage                            |
|          Client-Side State Store  <--->  FastAPI & SQLite DB            |
+------------------------------------+------------------------------------+
                                     |
+------------------------------------v------------------------------------+
|                     Render Cloud Deployment & DNS                       |
|           Render Edge  --->  Custom Domain (hopeline.parikshit07.tech)   |
+-------------------------------------------------------------------------+
```

---

## 3. Core Functional Modules

### Module 1: Emergency Triage & Priority Scoring Engine

#### Mathematical Formulation
The Priority Engine implements a weighted multi-variable formulation based on the Emergency Severity Index (ESI):

$$\text{Priority Score} = (\text{Severity} \times 5) + (\text{Risk} \times 3) + (\min(\lfloor\text{Wait}/5\rfloor, 10) \times 2)$$

Where:
* **Severity ($S \in [1, 10]$):** Clinical severity upon arrival (e.g., cardiac arrest = 10, mild abrasion = 1). Multiplier: $\times 5$ (Max 50 points).
* **Risk / Comorbidity ($R \in [1, 10]$):** Underlying systemic risk factors, hypertension, age vulnerability. Multiplier: $\times 3$ (Max 30 points).
* **Wait Time Factor ($W \ge 0\text{ mins}$):** Dynamic starvation prevention term. Every 5 minutes of waiting yields $+2$ points, capped at 10 intervals (Max 20 points).
* **Total Score Range:** $[8, 100]$ points.

#### Triage Classification Tiers
| Score Range | Triage Level | Clinical Definition | Target Care Unit |
| :--- | :--- | :--- | :--- |
| **$\ge 70$ Pts** | **ESI Level 1: Resuscitation** | Immediate life threat; cardiac/trauma | ICU Ventilator Bed |
| **$50 - 69$ Pts** | **ESI Level 2: Emergent** | High risk, acute distress, critical pain | ICU or Dedicated Oxygen |
| **$35 - 49$ Pts** | **ESI Level 3: Urgent** | Serious condition; stable vitals | General Ward Bed |
| **$< 35$ Pts** | **ESI Level 4/5: Stable** | Non-urgent medical evaluation | General Ward / Outpatient |

---

### Module 2: Hospital Resource Hierarchy & Bed Management

#### Resource States & Invariants
Each hospital care unit operates as a state machine:
* `AVAILABLE`: Ready for immediate emergency admission (Green badge).
* `OCCUPIED`: Assigned to an active emergency patient with patient ID binding (Red badge).
* `MAINTENANCE`: Temporarily out of service for sterilization/technical check (Amber badge).

The baseline hospital layout monitors **15 operational units**:
* **Units 1 to 5:** ICU Beds equipped with mechanical ventilators.
* **Units 6 to 10:** General Medical Ward Beds.
* **Units 11 to 15:** High-flow Oxygen Cylinder Units (Respiratory Support).

---

### Module 3: Blood Bank & Multi-Criteria Donor Matching

#### Universal Red Blood Cell Compatibility Matrix
```
Donor ↓  /  Recipient →   O-    O+    A-    A+    B-    B+    AB-   AB+
---------------------------------------------------------------------
O-                       [✓]   [✓]   [✓]   [✓]   [✓]   [✓]   [✓]   [✓]   (Universal Donor)
O+                       [ ]   [✓]   [ ]   [✓]   [ ]   [✓]   [ ]   [✓]
A-                       [ ]   [ ]   [✓]   [✓]   [ ]   [ ]   [✓]   [✓]
A+                       [ ]   [ ]   [ ]   [✓]   [ ]   [ ]   [ ]   [✓]
B-                       [ ]   [ ]   [ ]   [ ]   [✓]   [✓]   [✓]   [✓]
B+                       [ ]   [ ]   [ ]   [ ]   [ ]   [✓]   [ ]   [✓]
AB-                      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [✓]   [✓]
AB+                      [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [✓]   (Universal Receiver)
```

#### Multi-Criteria Donor Ranking Algorithm
$$\text{Match Score} = S_{\text{comp}} + S_{\text{avail}} + \max\left(0, \min\left(20, 20 - \lfloor\text{Distance}/5\rfloor\right)\right) + \left\lfloor\frac{\min(100, U)}{10}\right\rfloor$$

Where:
* $S_{\text{comp}} = 50$ for identical blood group; $40$ for compatible cross-match; $0$ if incompatible.
* $S_{\text{avail}} = 20$ if donor is currently available; $0$ if unavailable.
* $\text{Proximity Score} = 20 - \lfloor\text{Distance}/5\rfloor$ (closer donors receive up to 20 points).
* $\text{Urgency Term} = \lfloor U / 10\rfloor$ (up to 10 bonus points for critical patients).

---

### Module 4: Automated Dispatch Engine (Option 4 Execution)

The dispatch engine executes four synchronous operations upon dispatch trigger:
1. Dequeues the root of the Max-Heap ($O(1)$ peek, $O(\log n)$ dequeue).
2. Traverses the resource catalog for the first matching `AVAILABLE` bed unit and locks it as `OCCUPIED`.
3. Evaluates all registered donors against the patient's blood type and returns the top-ranked donor.
4. Generates a clinical dispatch manifest printed to the live dispatch console.

---

## 4. Technical Stack & Infrastructure

| Layer | Component | Technology / Implementation |
| :--- | :--- | :--- |
| **Frontend UI** | Client Interface | HTML5, Tailwind CSS, FontAwesome 6 |
| **Client Engine** | Business Logic | Vanilla ES6+ JavaScript |
| **Data Structures** | Heap & Lookups | Binary Max-Heap & Hash Table emulation |
| **Backend API** | REST Microservice | Python 3.11, FastAPI, Uvicorn |
| **Persistence** | Database | SQLite 3 (`hopeline.db`) & LocalStorage |
| **Hosting** | Cloud Edge | Render Cloud Platform |
| **DNS & SSL** | Custom Domain | `hopeline.parikshit07.tech` with automated TLS/SSL |

---

## 5. Verification & Test Suite Summary

- **Priority Formula:** $\text{computePriority}(9, 8, 15) = 75$ confirmed.
- **Starvation Handling:** Dynamic wait time $+5\text{m}$ increases priority score by $+2$, moving long-waiting patients ahead of newly admitted patients with equal baseline severity.
- **Resource Mutex:** Once Bed #1 is occupied, it cannot be double-booked until an explicit discharge event.
- **Compatibility Safety:** Correctly handles universal donor (`O-`) and universal recipient (`AB+`).
