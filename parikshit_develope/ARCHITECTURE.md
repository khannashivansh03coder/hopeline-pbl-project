# HopeLine Web Platform: Architecture & Technical Walkthrough Guide

**Project:** HopeLine — Smart Hospital Resource & Blood Donor Matching System  
**Team:** CodePulse  
**Target Audience:** Team Members (Shivansh, Piyush, Parikshit) & Faculty Evaluators  
**Repository Path:** `hopeline-pbl-project/parikshit_develope/`  

---

## 1. Executive Overview for the Team

The primary objective of **Phase 3** was to transform our Phase-2 C++ console engine into a **high-throughput, interactive clinical web portal**. 

Instead of typing numbers into a terminal console, hospital administrators and triage coordinators can now:
1. **Admit patients** and visualize the **Binary Max-Heap** priority queue re-ordering in real time.
2. **Manage 15 hospital units** (ICU Beds, General Ward Beds, Oxygen Units) with interactive state toggling.
3. **Execute automated triage dispatch** (the core "Option 4" algorithm) that pairs the highest-priority patient with an available bed and a compatible blood donor simultaneously.
4. **Run completely offline** on any MacBook or Windows laptop with zero external dependencies, or access it live globally on the cloud.

---

## 2. File-by-File Blueprint: Which File Does What?

| File Name | Primary Purpose | How It Works Behind the Scenes |
| :--- | :--- | :--- |
| **`index.html`** | **The Single-Page Application (SPA) Layout** | Contains the semantic HTML structure for the 5 tabs (Triage, Beds, Donors, Console, Protocols), the top live stats ribbon, admission forms, and dynamic containers. Uses zero server-side rendering for instant client performance. |
| **`style.css`** | **Clinical Styling & Animations** | Defines hospital UI design tokens: ECG heartbeat pulses (`@keyframes ecg-pulse`), vital blinkers, triage priority badges (`.badge-critical`, `.badge-emergent`), ward bed states (green, red, amber), and dark terminal theme. |
| **`app.js`** | **The Algorithmic Core Engine** | Implements all the core logic in client JavaScript: mathematical triage scoring, Max-Heap queue sorting, bed state management, blood compatibility matching, and console dispatch stream. |
| **`PRD.md`** | **Product Requirement Document** | The comprehensive product specification covering mathematical formulas, component hierarchies, state machines, and system requirements. |
| **`ARCHITECTURE.md`** | **Team Walkthrough Guide (This file)** | Explains the architecture, file responsibilities, and viva defense talking points for all teammates. |
| **`tailwind.min.js`** | **Offline CSS Framework** | Pre-bundled Tailwind engine stored directly in the repository so the website renders with full styling even if Wi-Fi is completely turned off. |
| **`fontawesome.min.css`** | **Offline Medical Icons** | Standalone icon stylesheet ensuring all medical cross, hospital, bed, and ambulance icons render offline. |
| **`run.sh`** | **MacBook 1-Click Launcher** | Bash script that automatically starts Python's built-in static server on port 3000 and opens Google Chrome to `http://localhost:3000`. |
| **`run.bat`** | **Windows 1-Click Launcher** | Batch script allowing any Windows teammate to launch the local server with a simple double-click. |
| **`render.yaml`** | **Render Cloud Infrastructure** | Infrastructure-as-Code (IaC) blueprint automating static site build and deployment on Render. |
| **`backend/main.py`** | **FastAPI REST Microservice** | Optional Python REST API providing headless JSON endpoints (`/api/stats`, `/api/patients`, `/api/resources`, `/api/donors`) for external systems. |
| **`backend/database.py`**| **SQLite Relational Layer** | SQLite schema initialization and CRUD helper queries (`hopeline.db`). |

---

## 3. How Course Concepts Are Mapped into the Web Code

```
Phase-2 C++ Module                   Phase-3 Web Engine (app.js)
---------------------------------    -------------------------------------------------
PriorityEngine.cpp (ESI Formula)  -> computePriority(sev, risk, wait) [Lines 81-87]
PriorityQueue.cpp (Max-Heap)      -> Dynamic Queue & Array View       [Lines 256-328]
Resource.h / ICUBed.cpp (OOP)     -> appState.resources Ward Grid     [Lines 331-365]
DonorMatching.cpp (Compatibility) -> calculateDonorScore()            [Lines 90-125]
Option 4 (Process Top Patient)    -> processTopPatient()              [Lines 172-231]
```

---

## 4. Deep-Dive: The 4 Core Algorithms in the Code

### 1. Emergency Severity Index (ESI) Priority Scoring (`computePriority`)
Located in `app.js`:
$$\text{Priority Score} = (\text{Severity} \times 5) + (\text{Risk} \times 3) + (\min(\lfloor\text{Wait}/5\rfloor, 10) \times 2)$$
* **Why this formula?** It ensures that medical severity is prioritized first, comorbidity risk is accounted for second, and waiting patients receive a dynamic $+2$ boost every 5 minutes so no patient starves in the queue.

### 2. Binary Max-Heap Queue Simulation (`renderAll`)
* Patients in `appState.patients` are sorted dynamically by their computed priority score descending.
* The element at index `0` represents the **Root of the Max-Heap** ($O(1)$ peek).
* The UI renders a dedicated **0-Indexed Heap Array View** (`[0] Root`, `[1] Left`, `[2] Right`) matching standard binary tree representations:
  $$\text{Parent}(i) = \lfloor(i - 1)/2\rfloor \quad|\quad \text{Left}(i) = 2i + 1 \quad|\quad \text{Right}(i) = 2i + 2$$

### 3. Blood Compatibility & Multi-Criteria Donor Matching (`calculateDonorScore`)
* Checks compatibility against all 8 blood groups (handles `O-` universal donor and `AB+` universal recipient).
* If compatible, calculates a multi-factor score:
  $$\text{Match Score} = \text{Compatibility} (50/40) + \text{Availability} (20) + (20 - \lfloor\text{Dist}/5\rfloor) + \lfloor\text{Urgency}/10\rfloor$$

### 4. Automated Dispatch Action (`processTopPatient`)
When the user clicks **"Execute Next Triage Dispatch"**:
1. It dequeues the root patient from the queue.
2. Traverses `appState.resources` to find the first matching `AVAILABLE` bed (ICU, General, or Oxygen).
3. Evaluates all registered donors to select the highest-scoring candidate.
4. Marks the bed as `OCCUPIED` by that patient.
5. Appends a timestamped dispatch log to the interactive C++ terminal window.

---

## 5. Viva Cheat Sheet: Questions Evaluators Might Ask & Exact Answers

#### Q1: "Why did you build a web frontend for a C++ PBL project?"
> **Answer:**  
> *"In Phase 1 and Phase 2, we developed the core logic in C++ (Max-Heap, Hash Table, and OOP Resource hierarchy). In Phase 3, we built an interactive web dashboard so that hospital staff can visualize and test these algorithms in real time during multi-patient emergency simulations. It also allows external evaluation on localhost or any mobile device without requiring a C++ compiler setup."*

#### Q2: "How is Object-Oriented Polymorphism reflected on the website?"
> **Answer:**  
> *"Our C++ architecture uses a base class `Resource` with derived classes `ICUBed`, `GeneralBed`, and `OxygenUnit`. In the web platform (Tab 2), all 15 units share a unified resource interface with common state behaviors (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`), while encapsulating specific clinical attributes (ventilator life support for ICU, ward sections for General beds, and liter flow for Oxygen units)."*

#### Q3: "How does your system prevent starvation in the emergency queue?"
> **Answer:**  
> *"Our priority formula includes a dynamic wait time term: $(\min(\lfloor\text{Wait}/5\rfloor, 10) \times 2)$. If a patient with moderate severity waits for 25 minutes, their score automatically increases by 10 points. This guarantees that long-waiting patients eventually advance past newly arriving cases with similar baseline severity."*

#### Q4: "Does this website require internet connection to work in the exam lab?"
> **Answer:**  
> *"No, sir. We deliberately packaged the stylesheets (`tailwind.min.js`, `fontawesome.min.css`) and logic (`app.js`) locally inside the repository. The website runs 100% offline via loopback (`http://localhost:3000`) on any MacBook or Windows laptop even with Wi-Fi switched off."*

---

## 6. How Any Teammate Can Run the Project

1. **Pull the latest code:**
   ```bash
   git pull origin main
   ```
2. **Launch on MacBook:**
   ```bash
   cd parikshit_develope && ./run.sh
   ```
3. **Or simply double-click `index.html`** in Finder to open in Google Chrome!
