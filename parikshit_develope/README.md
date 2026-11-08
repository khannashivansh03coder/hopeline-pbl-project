# HopeLine | Clinical Emergency & Hospital Resource System

**Project Title:** HopeLine: Smart Hospital Resource and Blood Donor Matching System  
**Department:** Computer Science & Engineering, Graphic Era (Deemed to be University), Dehradun  
**Course Domains:** Data Structures in C & Object-Oriented Programming with C++ (Phase-III Web Deliverable)  
**Live Production Domain:** [**parikshit07.tech**](https://parikshit07.tech)  
**Team CodePulse (T225):**
* **Shivansh Khanna** (Team Lead – Priority Engine & Patient Triage)
* **Piyush Srivastava** (Developer – Donor Hash Table & Multi-Factor Donor Matcher)
* **Parikshit Thakur** (Developer – Hospital Resource Hierarchy, Web Architecture & Domain Lead)
* **Faculty Mentor:** Mr. Sanjeev Kukreti

---

## 🏥 System Overview

HopeLine is an integrated emergency decision-support system modeling hospital beds, ICU capacity, oxygen supplies, and compatible blood donors.

```
parikshit_devlopement/
├── index.html          # Clinical Emergency UI & ESI Triage Portal
├── style.css           # Medical design system & ECG pulse animations
├── app.js              # Hospital Max-Heap triage & blood donor matching engine
├── vercel.json         # Vercel production headers & routing
├── render.yaml         # Render Blueprint for automated deployment
├── run.sh              # Local preview launcher
├── backend/            # REST API (Deployable to Render)
│   ├── main.py         # FastAPI REST endpoints & Swagger docs (/docs)
│   ├── database.py     # SQLite relational database engine
│   └── requirements.txt# Python dependencies
└── README.md
```

---

## 🌐 How to Deploy to Vercel (Connected to parikshit07.tech)

1. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository: **`khannashivansh03coder/hopeline-pbl-project`**.
3. Under **Branch**, select: **`parikshit-module`**.
4. In **Project Settings**:
   * **Root Directory:** Click Edit and set to **`parikshit_devlopement`**.
   * **Framework Preset:** Other / Static.
5. Click **Deploy**.
6. **Connect your Domain:**
   * Go to **Project Settings $\rightarrow$ Domains**.
   * Add: **`parikshit07.tech`** (and `www.parikshit07.tech`).
   * Set your DNS record at your domain registrar (A Record to `76.76.21.21` or CNAME `cname.vercel-dns.com`).
   * Vercel will automatically provision SSL (`https://parikshit07.tech`)!

---

## ⚡ How to Deploy to Render

1. Go to [render.com](https://render.com) and click **"New +"** $\rightarrow$ **"Web Service"** (or **"Blueprint"**).
2. Connect your repository: `khannashivansh03coder/hopeline-pbl-project` (branch: `parikshit-module`).
3. Set configuration:
   * **Root Directory:** `parikshit_devlopement/backend`
   * **Runtime:** Python 3
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **Create Web Service**. Your live API will be available at `https://your-service.onrender.com/docs`!

---

## 💻 How to Run Locally

```bash
cd parikshit_devlopement
./run.sh
```
Opens in your browser at `http://localhost:3000`.
