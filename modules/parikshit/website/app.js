/**
 * HopeLine: Smart Hospital Resource & Blood Donor Matching System
 * PBL Phase 3 - Parikshit Module Web Application
 * Team CodePulse (T225) - Graphic Era University
 */

// Initial Data matching C++ data/*.json
const INITIAL_DATA = {
  resources: [
    { id: 1, type: "ICU Bed", state: "AVAILABLE", patientId: null },
    { id: 2, type: "ICU Bed", state: "AVAILABLE", patientId: null },
    { id: 3, type: "ICU Bed", state: "AVAILABLE", patientId: null },
    { id: 4, type: "ICU Bed", state: "AVAILABLE", patientId: null },
    { id: 5, type: "ICU Bed", state: "AVAILABLE", patientId: null },
    { id: 6, type: "General Bed", state: "AVAILABLE", patientId: null },
    { id: 7, type: "General Bed", state: "AVAILABLE", patientId: null },
    { id: 8, type: "General Bed", state: "AVAILABLE", patientId: null },
    { id: 9, type: "General Bed", state: "AVAILABLE", patientId: null },
    { id: 10, type: "General Bed", state: "AVAILABLE", patientId: null },
    { id: 11, type: "Oxygen Unit", state: "AVAILABLE", patientId: null },
    { id: 12, type: "Oxygen Unit", state: "AVAILABLE", patientId: null },
    { id: 13, type: "Oxygen Unit", state: "AVAILABLE", patientId: null },
    { id: 14, type: "Oxygen Unit", state: "AVAILABLE", patientId: null },
    { id: 15, type: "Oxygen Unit", state: "AVAILABLE", patientId: null }
  ],
  donors: [
    { donorId: "D101", name: "Ravi", bloodGroup: "O+", distance: 5, lastDonationDate: "2026-06-01", available: true },
    { donorId: "D102", name: "Amit", bloodGroup: "O-", distance: 25, lastDonationDate: "2026-06-15", available: true },
    { donorId: "D103", name: "Kunal", bloodGroup: "A+", distance: 8, lastDonationDate: "2026-07-01", available: true },
    { donorId: "D104", name: "Arjun", bloodGroup: "B+", distance: 3, lastDonationDate: "2026-05-01", available: true },
    { donorId: "D105", name: "Neeraj", bloodGroup: "O-", distance: 2, lastDonationDate: "2026-04-01", available: false }
  ],
  bloodUnits: [
    { unitId: "B001", bloodGroup: "O+", expiryDate: "2026-12-01", status: "AVAILABLE" },
    { unitId: "B002", bloodGroup: "O-", expiryDate: "2026-11-15", status: "AVAILABLE" },
    { unitId: "B003", bloodGroup: "A+", expiryDate: "2026-11-20", status: "AVAILABLE" },
    { unitId: "B004", bloodGroup: "B+", expiryDate: "2026-12-10", status: "AVAILABLE" },
    { unitId: "B005", bloodGroup: "AB+", expiryDate: "2026-12-05", status: "AVAILABLE" }
  ],
  patients: [
    {
      patientId: 101,
      name: "Rahul Sharma",
      age: 45,
      bloodGroup: "O+",
      bloodRequired: "O+",
      severity: 9,
      riskLevel: 8,
      waitingTime: 15,
      requiredResource: "ICU"
    }
  ]
};

// Application State
let appState = {
  resources: [],
  donors: [],
  bloodUnits: [],
  patients: [],
  processedHistory: []
};

// -------------------------------------------------------------
// Priority Engine (matches C++ PriorityEngine.cpp)
// -------------------------------------------------------------
function calculatePriorityScore(patient) {
  const severity = parseInt(patient.severity) || 1;
  const risk = parseInt(patient.riskLevel) || 1;
  const waitTime = parseInt(patient.waitingTime) || 0;

  let waitingScore = Math.floor(waitTime / 5);
  if (waitingScore > 10) waitingScore = 10;

  // C++: priority = (severity * 5) + (risk * 3) + (waitingScore * 2)
  const priority = (severity * 5) + (risk * 3) + (waitingScore * 2);
  return {
    priority,
    severityScore: severity * 5,
    riskScore: risk * 3,
    waitScore: waitingScore * 2,
    waitingScoreRaw: waitingScore
  };
}

// -------------------------------------------------------------
// Blood Donor Matching Engine (matches C++ DonorMatching.cpp)
// -------------------------------------------------------------
function isBloodCompatible(donorGroup, patientGroup) {
  if (donorGroup === "O-") return true;
  if (donorGroup === "O+") return ["O+", "A+", "B+", "AB+"].includes(patientGroup);
  if (donorGroup === "A-") return ["A-", "A+", "AB-", "AB+"].includes(patientGroup);
  if (donorGroup === "A+") return ["A+", "AB+"].includes(patientGroup);
  if (donorGroup === "B-") return ["B-", "B+", "AB-", "AB+"].includes(patientGroup);
  if (donorGroup === "B+") return ["B+", "AB+"].includes(patientGroup);
  if (donorGroup === "AB-") return ["AB-", "AB+"].includes(patientGroup);
  if (donorGroup === "AB+") return patientGroup === "AB+";
  return false;
}

function calculateDonorMatchScore(donor, patientBloodGroup, urgencyScore) {
  let compatibilityScore = 0;
  if (isBloodCompatible(donor.bloodGroup, patientBloodGroup)) {
    compatibilityScore = (donor.bloodGroup === patientBloodGroup) ? 50 : 40;
  } else {
    return { score: 0, compatible: false, compatibilityScore: 0, availabilityScore: 0, distanceScore: 0, urgencyScoreVal: 0 };
  }

  const availabilityScore = donor.available ? 20 : 0;

  let distanceScore = 20 - Math.floor(donor.distance / 5);
  if (distanceScore < 0) distanceScore = 0;
  if (distanceScore > 20) distanceScore = 20;

  let clampedUrgency = Math.max(0, Math.min(100, urgencyScore));
  let urgencyScoreVal = Math.floor(clampedUrgency / 10);

  const totalScore = compatibilityScore + availabilityScore + distanceScore + urgencyScoreVal;
  return {
    score: totalScore,
    compatible: true,
    compatibilityScore,
    availabilityScore,
    distanceScore,
    urgencyScoreVal
  };
}

// -------------------------------------------------------------
// Hospital Resource Module (matches Parikshit's C++ Hospital/Resource)
// -------------------------------------------------------------
function getResourceCategory(resourceType) {
  const norm = (resourceType || "").toUpperCase();
  if (norm.includes("ICU")) return "ICU";
  if (norm.includes("OXYGEN")) return "OXYGEN";
  return "GENERAL";
}

function findAvailableResource(resourceType) {
  const category = getResourceCategory(resourceType);
  return appState.resources.find(r => {
    return getResourceCategory(r.type) === category && r.state === "AVAILABLE";
  }) || null;
}

function allocateHospitalResource(resourceId, patientId) {
  const res = appState.resources.find(r => r.id === resourceId);
  if (res && res.state === "AVAILABLE") {
    res.state = "OCCUPIED";
    res.patientId = patientId;
    saveState();
    return true;
  }
  return false;
}

function releaseHospitalResource(resourceId) {
  const res = appState.resources.find(r => r.id === resourceId);
  if (res) {
    res.state = "AVAILABLE";
    res.patientId = null;
    saveState();
    return true;
  }
  return false;
}

function reserveHospitalResource(resourceId) {
  const res = appState.resources.find(r => r.id === resourceId);
  if (res) {
    res.state = "RESERVED";
    saveState();
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// Persistence & State Management
// -------------------------------------------------------------
async function loadInitialState() {
  // 1. Try fetching live data from Python backend if server is active
  if (window.location.protocol.startsWith("http")) {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.resources && liveData.resources.length > 0) {
          appState.resources = liveData.resources;
          appState.donors = liveData.donors || INITIAL_DATA.donors;
          appState.bloodUnits = liveData.bloodUnits || INITIAL_DATA.bloodUnits;
          appState.patients = liveData.patients || INITIAL_DATA.patients;
          appState.processedHistory = [];
          renderAll();
          return;
        }
      }
    } catch (e) {
      // Backend not running, fall back to localStorage
    }
  }

  // 2. Fallback to LocalStorage
  const saved = localStorage.getItem("hopeline_state");
  if (saved) {
    try {
      appState = JSON.parse(saved);
      appState.resources = appState.resources || INITIAL_DATA.resources;
      appState.donors = appState.donors || INITIAL_DATA.donors;
      appState.bloodUnits = appState.bloodUnits || INITIAL_DATA.bloodUnits;
      appState.patients = appState.patients || INITIAL_DATA.patients;
      appState.processedHistory = appState.processedHistory || [];
      renderAll();
      return;
    } catch (e) {
      console.warn("Failed to parse saved state, using default data", e);
    }
  }
  resetToDefaultData();
}

function resetToDefaultData() {
  appState = JSON.parse(JSON.stringify(INITIAL_DATA));
  appState.processedHistory = [];
  saveState();
}

function saveState() {
  localStorage.setItem("hopeline_state", JSON.stringify(appState));
  renderAll();

  // Background sync with Python server if available
  if (window.location.protocol.startsWith("http")) {
    fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patients: appState.patients,
        resources: appState.resources,
        donors: appState.donors,
        bloodUnits: appState.bloodUnits
      })
    }).catch(() => {});
  }
}

// -------------------------------------------------------------
// UI Rendering
// -------------------------------------------------------------
function renderHeaderStats() {
  const availableICU = appState.resources.filter(r => r.type.includes("ICU") && r.state === "AVAILABLE").length;
  const availableO2 = appState.resources.filter(r => r.type.includes("Oxygen") && r.state === "AVAILABLE").length;
  const activePatients = appState.patients.length;
  const activeDonors = appState.donors.filter(d => d.available).length;

  document.getElementById("stat-active-patients").innerText = activePatients;
  document.getElementById("stat-icu-beds").innerText = `${availableICU} / 5`;
  document.getElementById("stat-oxygen-units").innerText = `${availableO2} / 5`;
  document.getElementById("stat-ready-donors").innerText = `${activeDonors} / ${appState.donors.length}`;
}

// Live Queue (Sorted Max-Heap / Priority Queue)
function renderEmergencyQueue() {
  const container = document.getElementById("patient-queue-list");
  if (!container) return;

  if (appState.patients.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i class="fas fa-check-circle text-4xl text-emerald-500/50 mb-3 block"></i>
        <p class="text-lg font-medium">No pending emergency patients.</p>
        <p class="text-sm text-slate-500">All registered patients have been processed or none added yet.</p>
      </div>`;
    renderHeapTree([]);
    return;
  }

  // Sort patients descending by priority score (Max-Heap order)
  const ranked = [...appState.patients].map(p => {
    const calc = calculatePriorityScore(p);
    return { ...p, ...calc };
  }).sort((a, b) => b.priority - a.priority);

  container.innerHTML = ranked.map((p, index) => {
    let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (p.priority >= 70) badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/40 pulse-badge";
    else if (p.priority >= 50) badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    else if (p.priority >= 35) badgeClass = "bg-sky-500/20 text-sky-300 border-sky-500/40";

    return `
      <div class="glass-panel p-4 glass-panel-hover border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 font-bold text-sky-400">
            <span class="text-xs uppercase text-slate-400">Rank</span>
            <span class="text-base leading-tight">#${index + 1}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-bold text-lg text-white">${p.name}</h4>
              <span class="text-xs font-semibold px-2 py-0.5 rounded border ${badgeClass}">Score: ${p.priority}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ID: #${p.patientId}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50"><i class="fas fa-tint mr-1"></i>${p.bloodGroup}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Age:</strong> ${p.age}</span>
              <span><strong>Req:</strong> <span class="text-sky-300">${p.requiredResource}</span></span>
              <span><strong>Severity:</strong> ${p.severity}/10 (pts: +${p.severityScore})</span>
              <span><strong>Risk:</strong> ${p.riskLevel}/10 (pts: +${p.riskScore})</span>
              <span><strong>Wait Time:</strong> ${p.waitingTime}m (pts: +${p.waitScore})</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end md:self-center flex-wrap">
          <button onclick="incrementWaitTime(${p.patientId})" title="Add 5m wait time to see dynamic priority shift" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
            <i class="fas fa-clock mr-1 text-amber-400"></i> +5m Wait
          </button>
          <button onclick="processSinglePatient(${p.patientId})" class="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition flex items-center gap-1.5">
            <i class="fas fa-bolt text-amber-300"></i> Process Triage
          </button>
          <button onclick="deletePatientRecord(${p.patientId})" class="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition" title="Delete Patient">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  renderHeapTree(ranked);
}

// Visual Binary Max-Heap Tree
function renderHeapTree(rankedPatients) {
  const container = document.getElementById("heap-tree-visualizer");
  if (!container) return;

  if (rankedPatients.length === 0) {
    container.innerHTML = `<p class="text-center text-slate-500 text-sm py-8">Heap is currently empty. Register emergency patients to view Max-Heap layout.</p>`;
    return;
  }

  // Display top 7 nodes in a 3-level binary heap layout
  const maxNodes = Math.min(rankedPatients.length, 7);
  let html = `<div class="flex flex-col items-center gap-6 py-4">`;

  // Level 0 (Root, index 0)
  html += `<div class="flex justify-center">
    <div class="flex flex-col items-center">
      <div class="tree-node bg-rose-600 text-white border-2 border-rose-300 shadow-rose-500/30">
        <span class="text-xs font-mono">ROOT</span>
        <span class="text-sm font-black">${rankedPatients[0].priority}</span>
      </div>
      <span class="text-[11px] text-rose-300 font-medium mt-1">${rankedPatients[0].name.split(" ")[0]}</span>
      <span class="text-[10px] text-slate-400">Idx [0]</span>
    </div>
  </div>`;

  // Level 1 (Indices 1, 2)
  if (maxNodes > 1) {
    html += `<div class="flex justify-center gap-16 md:gap-32 w-full">`;
    for (let i = 1; i <= 2 && i < maxNodes; i++) {
      html += `<div class="flex flex-col items-center">
        <div class="tree-node bg-sky-600 text-white border border-sky-300 shadow-sky-500/30">
          <span class="text-xs font-mono">P${i}</span>
          <span class="text-sm font-black">${rankedPatients[i].priority}</span>
        </div>
        <span class="text-[11px] text-sky-200 font-medium mt-1">${rankedPatients[i].name.split(" ")[0]}</span>
        <span class="text-[10px] text-slate-400">Idx [${i}]</span>
      </div>`;
    }
    html += `</div>`;
  }

  // Level 2 (Indices 3, 4, 5, 6)
  if (maxNodes > 3) {
    html += `<div class="flex justify-center gap-6 md:gap-12 w-full">`;
    for (let i = 3; i < maxNodes; i++) {
      html += `<div class="flex flex-col items-center">
        <div class="tree-node bg-slate-700 text-slate-200 border border-slate-500 shadow-slate-900/30">
          <span class="text-xs font-mono">P${i}</span>
          <span class="text-sm font-black">${rankedPatients[i].priority}</span>
        </div>
        <span class="text-[11px] text-slate-300 font-medium mt-1">${rankedPatients[i].name.split(" ")[0]}</span>
        <span class="text-[10px] text-slate-400">Idx [${i}]</span>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// Render Hospital Resources (Parikshit's Module)
function renderHospitalResources() {
  const container = document.getElementById("hospital-resources-grid");
  if (!container) return;

  container.innerHTML = appState.resources.map(res => {
    let icon = "fa-bed";
    let typeColor = "text-sky-400";
    if (res.type.includes("ICU")) {
      icon = "fa-heartbeat";
      typeColor = "text-rose-400";
    } else if (res.type.includes("Oxygen")) {
      icon = "fa-lungs";
      typeColor = "text-teal-400";
    }

    let statusBadge = "";
    let cardBorder = "border-slate-800";
    if (res.state === "AVAILABLE") {
      statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">AVAILABLE</span>`;
      cardBorder = "border-emerald-500/30";
    } else if (res.state === "OCCUPIED") {
      statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold">OCCUPIED</span>`;
      cardBorder = "border-rose-500/40";
    } else {
      statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold">RESERVED</span>`;
      cardBorder = "border-sky-500/40";
    }

    return `
      <div class="glass-panel p-4 rounded-xl border ${cardBorder} flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <i class="fas ${icon} ${typeColor} text-lg"></i>
              <span class="font-bold text-white text-base">${res.type} #${res.id}</span>
            </div>
            ${statusBadge}
          </div>
          <div class="text-xs text-slate-400 mt-2">
            ${res.patientId ? `<span class="text-sky-300 font-medium"><i class="fas fa-user-injured mr-1"></i> Patient #${res.patientId} Assigned</span>` : `<span class="text-slate-500">Ready for emergency triage</span>`}
          </div>
        </div>

        <div class="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80">
          ${res.state !== "OCCUPIED" ? `
            <button onclick="setResourceState(${res.id}, 'OCCUPIED')" class="flex-1 py-1 text-[11px] font-semibold rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition">
              Occupy
            </button>
          ` : `
            <button onclick="setResourceState(${res.id}, 'AVAILABLE')" class="flex-1 py-1 text-[11px] font-semibold rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition">
              Discharge / Release
            </button>
          `}
          <button onclick="setResourceState(${res.id}, 'RESERVED')" class="px-2.5 py-1 text-[11px] font-semibold rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition" title="Reserve for incoming emergency">
            Reserve
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Render Blood Donors & Matching Table (Piyush's Module)
function renderBloodDonors() {
  const container = document.getElementById("donors-table-body");
  if (!container) return;

  container.innerHTML = appState.donors.map(d => {
    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 text-sm">
        <td class="py-3 px-4 font-mono font-medium text-sky-400">${d.donorId}</td>
        <td class="py-3 px-4 font-semibold text-white">${d.name}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-800">
            ${d.bloodGroup}
          </span>
        </td>
        <td class="py-3 px-4 text-slate-300">${d.distance} km</td>
        <td class="py-3 px-4 text-slate-400 text-xs">${d.lastDonationDate}</td>
        <td class="py-3 px-4">
          ${d.available ?
            `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Available</span>` :
            `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">Unavailable</span>`}
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="toggleDonorAvailability('${d.donorId}')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            Toggle
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderBloodInventory();
}

function renderBloodInventory() {
  const container = document.getElementById("blood-inventory-grid");
  if (!container) return;

  container.innerHTML = appState.bloodUnits.map(unit => {
    return `
      <div class="glass-panel p-3 border border-slate-800 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-800 flex items-center justify-center font-bold text-rose-300 text-sm">
            ${unit.bloodGroup}
          </div>
          <div>
            <h5 class="text-sm font-bold text-white">${unit.unitId}</h5>
            <span class="text-[11px] text-slate-400">Exp: ${unit.expiryDate}</span>
          </div>
        </div>
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${unit.status}</span>
      </div>
    `;
  }).join("");
}

// Visual Hash Table Buckets (PBL DS demonstration)
function renderHashTableVisualizer() {
  const container = document.getElementById("hash-table-buckets");
  if (!container) return;

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const buckets = {};
  bloodGroups.forEach(bg => buckets[bg] = []);

  appState.donors.forEach(donor => {
    if (buckets[donor.bloodGroup]) {
      buckets[donor.bloodGroup].push(donor);
    }
  });

  container.innerHTML = bloodGroups.map((bg, idx) => {
    const list = buckets[bg];
    return `
      <div class="flex items-start gap-3 border-b border-slate-800/80 pb-3">
        <div class="w-20 flex-shrink-0 flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-slate-800 text-slate-400 text-xs flex items-center justify-center font-mono font-bold">[${idx}]</span>
          <span class="font-bold text-rose-300 text-sm">${bg}</span>
        </div>
        <div class="flex-1 flex flex-wrap items-center gap-2">
          ${list.length > 0 ? list.map(d => `
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs">
              <span class="font-semibold text-white">${d.name}</span>
              <span class="text-slate-400">(${d.distance}km)</span>
              <span class="w-2 h-2 rounded-full ${d.available ? 'bg-emerald-400' : 'bg-rose-400'}"></span>
            </div>
            <i class="fas fa-arrow-right text-[10px] text-slate-600 last:hidden"></i>
          `).join("") : `<span class="text-xs text-slate-600 italic">Empty Bucket (nullptr)</span>`}
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// Interactive Operations
// -------------------------------------------------------------
function registerNewPatient(event) {
  event.preventDefault();

  const name = document.getElementById("form-patient-name").value.trim();
  const age = parseInt(document.getElementById("form-patient-age").value) || 30;
  const bloodGroup = document.getElementById("form-patient-blood").value;
  const severity = parseInt(document.getElementById("form-patient-severity").value) || 5;
  const riskLevel = parseInt(document.getElementById("form-patient-risk").value) || 5;
  const waitingTime = parseInt(document.getElementById("form-patient-wait").value) || 0;
  const requiredResource = document.getElementById("form-patient-resource").value;

  const newId = appState.patients.length > 0
    ? Math.max(...appState.patients.map(p => p.patientId)) + 1
    : 101;

  const newPatient = {
    patientId: newId,
    name,
    age,
    bloodGroup,
    bloodRequired: bloodGroup,
    severity,
    riskLevel,
    waitingTime,
    requiredResource
  };

  appState.patients.push(newPatient);
  saveState();

  // Reset form
  document.getElementById("patient-form").reset();
  updateLiveScorePreview();
  showToast(`Emergency patient ${name} registered! Priority computed.`, "success");
}

function processSinglePatient(patientId) {
  const patientIndex = appState.patients.findIndex(p => p.patientId === patientId);
  if (patientIndex === -1) return;

  const patient = appState.patients[patientIndex];
  const { priority } = calculatePriorityScore(patient);

  // 1. Try finding resource
  const res = findAvailableResource(patient.requiredResource);
  let resourceOutcome = "";
  if (res) {
    allocateHospitalResource(res.id, patient.patientId);
    resourceOutcome = `Allocated ${res.type} #${res.id}`;
  } else {
    resourceOutcome = `No available ${patient.requiredResource} found (Placed on hold queue)`;
  }

  // 2. Try donor matching
  let donorOutcome = "No blood transfusion required";
  let bestDonorMatch = null;
  if (patient.bloodRequired) {
    const candidates = appState.donors.map(d => ({
      donor: d,
      ...calculateDonorMatchScore(d, patient.bloodGroup, priority)
    })).filter(c => c.compatible).sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      bestDonorMatch = candidates[0];
      donorOutcome = `Matched with donor ${bestDonorMatch.donor.name} (${bestDonorMatch.donor.bloodGroup}, ${bestDonorMatch.donor.distance}km, Score: ${bestDonorMatch.score})`;
    }
  }

  // Record History
  appState.processedHistory.unshift({
    timestamp: new Date().toLocaleTimeString(),
    patientName: patient.name,
    patientId: patient.patientId,
    priority,
    resourceOutcome,
    donorOutcome
  });

  // Remove from active queue
  appState.patients.splice(patientIndex, 1);
  saveState();

  showModalResult(patient, priority, resourceOutcome, donorOutcome, bestDonorMatch);
}

// C++ CLI Option 4: Process Highest Priority Patient
function processHighestPriorityPatient() {
  if (appState.patients.length === 0) {
    showToast("Priority Queue is empty! Admit a patient first.", "warning");
    return;
  }
  const ranked = [...appState.patients].map(p => ({
    patient: p,
    priority: calculatePriorityScore(p).priority
  })).sort((a, b) => b.priority - a.priority);

  processSinglePatient(ranked[0].patient.patientId);
}

// C++ CLI Option 2: View All Registered Patients
function openPatientsListModal() {
  const modal = document.getElementById("patients-list-modal");
  const tbody = document.getElementById("patients-modal-table-body");
  if (!modal || !tbody) return;

  if (appState.patients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-500">No patients currently registered in HopeLine.</td></tr>`;
  } else {
    tbody.innerHTML = appState.patients.map(p => {
      const calc = calculatePriorityScore(p);
      return `
        <tr class="border-b border-slate-800 text-xs">
          <td class="py-2.5 px-3 font-mono font-bold text-sky-400">#${p.patientId}</td>
          <td class="py-2.5 px-3 font-semibold text-white">${p.name}</td>
          <td class="py-2.5 px-3 text-slate-300">${p.age}</td>
          <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">${p.bloodGroup}</span></td>
          <td class="py-2.5 px-3 text-sky-300">${p.requiredResource}</td>
          <td class="py-2.5 px-3 text-slate-300">${p.severity}/10</td>
          <td class="py-2.5 px-3 text-slate-300">${p.riskLevel}/10</td>
          <td class="py-2.5 px-3 text-slate-300">${p.waitingTime}m</td>
          <td class="py-2.5 px-3 font-bold text-amber-400">${calc.priority}</td>
        </tr>
      `;
    }).join("");
  }
  modal.classList.remove("hidden");
}

function closePatientsListModal() {
  const modal = document.getElementById("patients-list-modal");
  if (modal) modal.classList.add("hidden");
}

function incrementWaitTime(patientId) {
  const p = appState.patients.find(pt => pt.patientId === patientId);
  if (p) {
    p.waitingTime = (p.waitingTime || 0) + 5;
    saveState();
    showToast(`Added +5m wait time to ${p.name}. Dynamic Priority adjusted!`, "info");
  }
}

function deletePatientRecord(patientId) {
  const idx = appState.patients.findIndex(p => p.patientId === patientId);
  if (idx !== -1) {
    const name = appState.patients[idx].name;
    appState.patients.splice(idx, 1);
    saveState();
    showToast(`Removed patient ${name}`, "warning");
  }
}

function setResourceState(resourceId, newState) {
  const res = appState.resources.find(r => r.id === resourceId);
  if (res) {
    res.state = newState;
    if (newState === "AVAILABLE") res.patientId = null;
    saveState();
  }
}

function toggleDonorAvailability(donorId) {
  const d = appState.donors.find(dn => dn.donorId === donorId);
  if (d) {
    d.available = !d.available;
    saveState();
  }
}

// Interactive Matcher Simulation in Tab 3
function testDonorMatching() {
  const bloodGroup = document.getElementById("matcher-blood-group").value;
  const urgency = parseInt(document.getElementById("matcher-urgency-score").value) || 50;

  const resultsContainer = document.getElementById("matcher-results");
  if (!resultsContainer) return;

  const matches = appState.donors.map(d => ({
    donor: d,
    ...calculateDonorMatchScore(d, bloodGroup, urgency)
  })).sort((a, b) => b.score - a.score);

  resultsContainer.innerHTML = matches.map((m, idx) => {
    const isTop = idx === 0 && m.score > 0;
    return `
      <div class="glass-panel p-3 rounded-lg border ${isTop ? 'border-amber-400/80 bg-amber-500/10' : 'border-slate-800'} flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full ${isTop ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-300'} flex items-center justify-center font-bold text-xs">
            #${idx + 1}
          </div>
          <div>
            <h5 class="text-sm font-bold text-white flex items-center gap-2">
              ${m.donor.name}
              <span class="text-xs px-2 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">${m.donor.bloodGroup}</span>
              ${isTop ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold uppercase">Best Match</span>' : ''}
            </h5>
            <div class="text-[11px] text-slate-400 flex gap-3 mt-0.5">
              <span>Dist: ${m.donor.distance} km (+${m.distanceScore} pts)</span>
              <span>Compat: +${m.compatibilityScore} pts</span>
              <span>Avail: +${m.availabilityScore} pts</span>
              <span>Urg: +${m.urgencyScoreVal} pts</span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-extrabold ${isTop ? 'text-amber-300' : 'text-slate-300'}">${m.score}</span>
          <span class="text-[10px] text-slate-500 block uppercase">Score</span>
        </div>
      </div>
    `;
  }).join("");
}

// Live Score preview inside Form
function updateLiveScorePreview() {
  const sevEl = document.getElementById("form-patient-severity");
  const riskEl = document.getElementById("form-patient-risk");
  const waitEl = document.getElementById("form-patient-wait");

  if (!sevEl || !riskEl || !waitEl) return;

  const severity = parseInt(sevEl.value) || 1;
  const riskLevel = parseInt(riskEl.value) || 1;
  const waitingTime = parseInt(waitEl.value) || 0;

  document.getElementById("label-severity").innerText = severity;
  document.getElementById("label-risk").innerText = riskLevel;

  const calc = calculatePriorityScore({ severity, riskLevel, waitingTime });
  const previewEl = document.getElementById("live-priority-score");
  if (previewEl) {
    previewEl.innerText = calc.priority;
  }
}

// -------------------------------------------------------------
// Pre-set Scenarios (For Impressing Evaluators in Viva)
// -------------------------------------------------------------
function loadScenario(type) {
  if (type === "highway-surge") {
    appState.patients = [
      { patientId: 101, name: "Vikram Malhotra", age: 34, bloodGroup: "A+", bloodRequired: "A+", severity: 10, riskLevel: 9, waitingTime: 5, requiredResource: "ICU" },
      { patientId: 102, name: "Pooja Verma", age: 28, bloodGroup: "O-", bloodRequired: "O-", severity: 9, riskLevel: 8, waitingTime: 12, requiredResource: "ICU" },
      { patientId: 103, name: "Aman Gupta", age: 52, bloodGroup: "B+", bloodRequired: "B+", severity: 6, riskLevel: 7, waitingTime: 25, requiredResource: "OXYGEN" },
      { patientId: 104, name: "Rohit Saxena", age: 22, bloodGroup: "O+", bloodRequired: "O+", severity: 4, riskLevel: 3, waitingTime: 40, requiredResource: "GENERAL" }
    ];
    saveState();
    showToast("Scenario Loaded: Multi-Vehicle Collision Surge!", "success");
  } else if (type === "rare-blood") {
    appState.patients = [
      { patientId: 201, name: "Dr. Ananya Ray", age: 38, bloodGroup: "AB-", bloodRequired: "AB-", severity: 9, riskLevel: 9, waitingTime: 10, requiredResource: "ICU" }
    ];
    saveState();
    showToast("Scenario Loaded: Rare AB- Critical Case!", "warning");
  } else if (type === "reset") {
    resetToDefaultData();
    showToast("Restored HopeLine default dataset from C++ files.", "info");
  }
}

// -------------------------------------------------------------
// Modals & Notifications
// -------------------------------------------------------------
function showModalResult(patient, priority, resourceOutcome, donorOutcome, bestDonorMatch) {
  const modal = document.getElementById("triage-result-modal");
  if (!modal) return;

  document.getElementById("modal-patient-name").innerText = patient.name;
  document.getElementById("modal-priority-score").innerText = priority;
  document.getElementById("modal-resource-result").innerText = resourceOutcome;
  document.getElementById("modal-donor-result").innerText = donorOutcome;

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("triage-result-modal");
  if (modal) modal.classList.add("hidden");
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  let border = "border-sky-500 bg-sky-950/90 text-sky-200";
  if (type === "success") border = "border-emerald-500 bg-emerald-950/90 text-emerald-200";
  if (type === "warning") border = "border-amber-500 bg-amber-950/90 text-amber-200";

  toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border ${border} shadow-2xl text-sm font-semibold transition transform duration-300 translate-y-2 flex items-center gap-2`;
  toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-2");
    toast.classList.add("translate-y-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// -------------------------------------------------------------
// Tab Switching
// -------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));

  const target = document.getElementById(`tab-${tabId}`);
  const btn = document.getElementById(`btn-tab-${tabId}`);

  if (target) target.classList.remove("hidden");
  if (btn) btn.classList.add("active");

  if (tabId === "donors") {
    testDonorMatching();
  }
}

// Render All Components
function renderAll() {
  renderHeaderStats();
  renderEmergencyQueue();
  renderHospitalResources();
  renderBloodDonors();
  renderHashTableVisualizer();
}

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  loadInitialState();
  renderAll();
  updateLiveScorePreview();
  testDonorMatching();
});
