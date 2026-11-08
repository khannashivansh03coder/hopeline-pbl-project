/**
 * HopeLine - Hospital Emergency & Triage Frontend Engine
 * PBL Phase 3 | Team CodePulse | parikshit07.tech
 */

const INITIAL_HOSPITAL_DATA = {
  resources: [
    { id: 1, type: "ICU Bed", state: "AVAILABLE", patientId: null, floor: "Level 3 - Critical Care" },
    { id: 2, type: "ICU Bed", state: "AVAILABLE", patientId: null, floor: "Level 3 - Critical Care" },
    { id: 3, type: "ICU Bed", state: "AVAILABLE", patientId: null, floor: "Level 3 - Critical Care" },
    { id: 4, type: "ICU Bed", state: "AVAILABLE", patientId: null, floor: "Level 3 - Critical Care" },
    { id: 5, type: "ICU Bed", state: "AVAILABLE", patientId: null, floor: "Level 3 - Critical Care" },
    { id: 6, type: "General Bed", state: "AVAILABLE", patientId: null, floor: "Level 2 - General Ward" },
    { id: 7, type: "General Bed", state: "AVAILABLE", patientId: null, floor: "Level 2 - General Ward" },
    { id: 8, type: "General Bed", state: "AVAILABLE", patientId: null, floor: "Level 2 - General Ward" },
    { id: 9, type: "General Bed", state: "AVAILABLE", patientId: null, floor: "Level 2 - General Ward" },
    { id: 10, type: "General Bed", state: "AVAILABLE", patientId: null, floor: "Level 2 - General Ward" },
    { id: 11, type: "Oxygen Unit", state: "AVAILABLE", patientId: null, floor: "Level 1 - Respiratory" },
    { id: 12, type: "Oxygen Unit", state: "AVAILABLE", patientId: null, floor: "Level 1 - Respiratory" },
    { id: 13, type: "Oxygen Unit", state: "AVAILABLE", patientId: null, floor: "Level 1 - Respiratory" },
    { id: 14, type: "Oxygen Unit", state: "AVAILABLE", patientId: null, floor: "Level 1 - Respiratory" },
    { id: 15, type: "Oxygen Unit", state: "AVAILABLE", patientId: null, floor: "Level 1 - Respiratory" }
  ],
  donors: [
    { donorId: "D101", name: "Ravi Kumar", bloodGroup: "O+", distance: 5, lastDonationDate: "2026-06-01", available: true },
    { donorId: "D102", name: "Amit Joshi", bloodGroup: "O-", distance: 25, lastDonationDate: "2026-06-15", available: true },
    { donorId: "D103", name: "Kunal Mehra", bloodGroup: "A+", distance: 8, lastDonationDate: "2026-07-01", available: true },
    { donorId: "D104", name: "Arjun Rawat", bloodGroup: "B+", distance: 3, lastDonationDate: "2026-05-01", available: true },
    { donorId: "D105", name: "Neeraj Negi", bloodGroup: "O-", distance: 2, lastDonationDate: "2026-04-01", available: false }
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

let hospitalState = {
  resources: [],
  donors: [],
  bloodUnits: [],
  patients: [],
  triageLogs: []
};

// -------------------------------------------------------------
// Priority Engine (Exact C++ PriorityEngine.cpp formula)
// -------------------------------------------------------------
function calculatePriority(patient) {
  const severity = parseInt(patient.severity) || 1;
  const risk = parseInt(patient.riskLevel) || 1;
  const wait = parseInt(patient.waitingTime) || 0;

  const waitScore = Math.min(Math.floor(wait / 5), 10);
  const priority = (severity * 5) + (risk * 3) + (waitScore * 2);

  return {
    priority,
    severityPoints: severity * 5,
    riskPoints: risk * 3,
    waitPoints: waitScore * 2
  };
}

// -------------------------------------------------------------
// Donor Matching Engine (Exact C++ DonorMatching.cpp logic)
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

function calculateDonorScore(donor, patientBloodGroup, urgencyScore) {
  if (!isBloodCompatible(donor.bloodGroup, patientBloodGroup)) {
    return { score: 0, compatible: false, compScore: 0, availScore: 0, distScore: 0, urgScore: 0 };
  }

  const compScore = (donor.bloodGroup === patientBloodGroup) ? 50 : 40;
  const availScore = donor.available ? 20 : 0;
  let distScore = 20 - Math.floor(donor.distance / 5);
  distScore = Math.max(0, Math.min(20, distScore));

  const urgScore = Math.floor(Math.max(0, Math.min(100, urgencyScore)) / 10);
  const total = compScore + availScore + distScore + urgScore;

  return {
    score: total,
    compatible: true,
    compScore,
    availScore,
    distScore,
    urgScore
  };
}

// -------------------------------------------------------------
// State Management
// -------------------------------------------------------------
function loadState() {
  const saved = localStorage.getItem("hopeline_clinical_state");
  if (saved) {
    try {
      hospitalState = JSON.parse(saved);
      hospitalState.resources = hospitalState.resources || INITIAL_HOSPITAL_DATA.resources;
      hospitalState.donors = hospitalState.donors || INITIAL_HOSPITAL_DATA.donors;
      hospitalState.bloodUnits = hospitalState.bloodUnits || INITIAL_HOSPITAL_DATA.bloodUnits;
      hospitalState.patients = hospitalState.patients || INITIAL_HOSPITAL_DATA.patients;
      hospitalState.triageLogs = hospitalState.triageLogs || [];
      return;
    } catch (e) {
      console.warn("Using default dataset:", e);
    }
  }
  resetState();
}

function resetState() {
  hospitalState = JSON.parse(JSON.stringify(INITIAL_HOSPITAL_DATA));
  hospitalState.triageLogs = [];
  saveState();
}

function saveState() {
  localStorage.setItem("hopeline_clinical_state", JSON.stringify(hospitalState));
  renderAll();
}

// -------------------------------------------------------------
// UI Rendering
// -------------------------------------------------------------
function renderHeaderStats() {
  const activePatients = hospitalState.patients.length;
  const availICU = hospitalState.resources.filter(r => r.type.includes("ICU") && r.state === "AVAILABLE").length;
  const availO2 = hospitalState.resources.filter(r => r.type.includes("Oxygen") && r.state === "AVAILABLE").length;
  const readyDonors = hospitalState.donors.filter(d => d.available).length;

  document.getElementById("stat-active-patients").innerText = activePatients;
  document.getElementById("stat-icu-beds").innerText = `${availICU} / 5`;
  document.getElementById("stat-oxygen-units").innerText = `${availO2} / 5`;
  document.getElementById("stat-ready-donors").innerText = `${readyDonors} / ${hospitalState.donors.length}`;
}

// Render Emergency Queue (Sorted Max-Heap order)
function renderEmergencyQueue() {
  const container = document.getElementById("patient-queue-list");
  if (!container) return;

  if (hospitalState.patients.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i class="fas fa-clipboard-check text-4xl text-emerald-400 mb-3 block"></i>
        <h5 class="text-sm font-bold text-slate-700">Emergency Queue Clear</h5>
        <p class="text-xs text-slate-400">All emergency patients have been triaged and allocated beds.</p>
      </div>`;
    renderHeapTree([]);
    return;
  }

  // Max-Heap ordering by priority score
  const ranked = [...hospitalState.patients].map(p => {
    const calc = calculatePriority(p);
    return { ...p, ...calc };
  }).sort((a, b) => b.priority - a.priority);

  container.innerHTML = ranked.map((p, index) => {
    let badgeClass = "triage-stable";
    let priorityLabel = "ESI Level 4 - Less Urgent";
    if (p.priority >= 70) {
      badgeClass = "triage-critical";
      priorityLabel = "ESI Level 1 - Immediate Resuscitation";
    } else if (p.priority >= 50) {
      badgeClass = "triage-high";
      priorityLabel = "ESI Level 2 - Emergent";
    } else if (p.priority >= 35) {
      badgeClass = "triage-moderate";
      priorityLabel = "ESI Level 3 - Urgent";
    }

    return `
      <div class="medical-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${p.priority >= 70 ? 'border-l-rose-500' : 'border-l-sky-500'}">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-bold text-slate-800">
            <span class="text-[9px] uppercase font-bold text-slate-400">Rank</span>
            <span class="text-sm leading-tight text-sky-600 font-mono">#${index + 1}</span>
          </div>

          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h5 class="font-bold text-slate-900 text-sm">${p.name}</h5>
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass}">${p.priority} Pts</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">ID #${p.patientId}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200"><i class="fas fa-tint mr-1 text-rose-500"></i>${p.bloodGroup}</span>
            </div>
            <div class="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              <span><strong>Age:</strong> ${p.age}</span>
              <span><strong>Unit Required:</strong> <span class="text-sky-700 font-semibold">${p.requiredResource}</span></span>
              <span><strong>Severity:</strong> ${p.severity}/10</span>
              <span><strong>Risk:</strong> ${p.riskLevel}/10</span>
              <span><strong>Wait:</strong> ${p.waitingTime}m</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end md:self-center">
          <button onclick="boostWaitTime(${p.patientId})" title="Add +5m wait time to see dynamic priority shift" class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition">
            <i class="fas fa-clock text-amber-500 mr-1"></i> +5m Wait
          </button>
          <button onclick="triageSinglePatient(${p.patientId})" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition flex items-center gap-1.5">
            <i class="fas fa-bolt text-amber-300"></i> Allocate Bed
          </button>
          <button onclick="removePatient(${p.patientId})" class="px-2 py-1.5 text-xs text-slate-400 hover:text-rose-600 rounded-lg transition" title="Delete patient">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  renderHeapTree(ranked);
}

// Binary Heap Tree Visualizer
function renderHeapTree(ranked) {
  const container = document.getElementById("heap-tree-visualizer");
  if (!container) return;

  if (ranked.length === 0) {
    container.innerHTML = `<p class="text-center text-slate-400 text-xs py-6">Heap is empty. Admit a patient to generate binary tree.</p>`;
    return;
  }

  const maxNodes = Math.min(ranked.length, 7);
  let html = `<div class="flex flex-col items-center gap-4 py-2 w-full">`;

  // Level 0 (Root)
  html += `<div class="flex justify-center">
    <div class="flex flex-col items-center">
      <div class="heap-node bg-rose-600 text-white shadow-md border-2 border-rose-300">
        <span class="text-[9px] font-mono">ROOT</span>
        <span class="text-sm font-black font-mono">${ranked[0].priority}</span>
      </div>
      <span class="text-[11px] font-bold text-rose-700 mt-1">${ranked[0].name.split(" ")[0]}</span>
      <span class="text-[9px] font-mono text-slate-400">[0]</span>
    </div>
  </div>`;

  // Level 1 (Indices 1, 2)
  if (maxNodes > 1) {
    html += `<div class="flex justify-center gap-16 md:gap-28 w-full">`;
    for (let i = 1; i <= 2 && i < maxNodes; i++) {
      html += `<div class="flex flex-col items-center">
        <div class="heap-node bg-sky-600 text-white shadow-sm border border-sky-300">
          <span class="text-[9px] font-mono">P${i}</span>
          <span class="text-sm font-black font-mono">${ranked[i].priority}</span>
        </div>
        <span class="text-[11px] font-bold text-sky-800 mt-1">${ranked[i].name.split(" ")[0]}</span>
        <span class="text-[9px] font-mono text-slate-400">[${i}]</span>
      </div>`;
    }
    html += `</div>`;
  }

  // Level 2 (Indices 3, 4, 5, 6)
  if (maxNodes > 3) {
    html += `<div class="flex justify-center gap-6 md:gap-12 w-full">`;
    for (let i = 3; i < maxNodes; i++) {
      html += `<div class="flex flex-col items-center">
        <div class="heap-node bg-slate-600 text-white shadow-sm border border-slate-400">
          <span class="text-[9px] font-mono">P${i}</span>
          <span class="text-sm font-black font-mono">${ranked[i].priority}</span>
        </div>
        <span class="text-[11px] font-semibold text-slate-700 mt-1">${ranked[i].name.split(" ")[0]}</span>
        <span class="text-[9px] font-mono text-slate-400">[${i}]</span>
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

  container.innerHTML = hospitalState.resources.map(res => {
    let icon = "fa-procedures";
    let iconColor = "text-sky-600";
    if (res.type.includes("ICU")) {
      icon = "fa-heartbeat";
      iconColor = "text-rose-600";
    } else if (res.type.includes("Oxygen")) {
      icon = "fa-lungs";
      iconColor = "text-teal-600";
    }

    let statusBadge = "";
    let bedClass = "available";
    if (res.state === "AVAILABLE") {
      statusBadge = `<span class="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">AVAILABLE</span>`;
      bedClass = "available";
    } else if (res.state === "OCCUPIED") {
      statusBadge = `<span class="px-2 py-0.5 text-[10px] rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">OCCUPIED</span>`;
      bedClass = "occupied";
    } else {
      statusBadge = `<span class="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">RESERVED</span>`;
      bedClass = "reserved";
    }

    return `
      <div class="medical-card bed-card ${bedClass} p-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <i class="fas ${icon} ${iconColor} text-base"></i>
              <span class="font-bold text-slate-900 text-xs">${res.type} #${res.id}</span>
            </div>
            ${statusBadge}
          </div>
          <p class="text-[11px] text-slate-500">${res.floor}</p>
          <div class="mt-2 text-xs">
            ${res.patientId ? `<span class="font-semibold text-rose-700"><i class="fas fa-user-injured mr-1"></i> Patient #${res.patientId}</span>` : `<span class="text-slate-400 italic">Ready for admission</span>`}
          </div>
        </div>

        <div class="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200/60">
          ${res.state !== "OCCUPIED" ? `
            <button onclick="setBedState(${res.id}, 'OCCUPIED')" class="flex-1 py-1 text-[11px] font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition">
              Occupy
            </button>
          ` : `
            <button onclick="setBedState(${res.id}, 'AVAILABLE')" class="flex-1 py-1 text-[11px] font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition">
              Discharge
            </button>
          `}
          <button onclick="setBedState(${res.id}, 'RESERVED')" class="px-2 py-1 text-[11px] font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition" title="Reserve unit">
            Reserve
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// Render Blood Donors Table (Piyush's Module)
function renderBloodDonors() {
  const container = document.getElementById("donors-table-body");
  if (!container) return;

  container.innerHTML = hospitalState.donors.map(d => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 text-slate-700">
      <td class="py-2.5 px-4 font-mono font-bold text-sky-700">${d.donorId}</td>
      <td class="py-2.5 px-4 font-semibold text-slate-900">${d.name}</td>
      <td class="py-2.5 px-4">
        <span class="px-2 py-0.5 rounded font-bold bg-rose-50 text-rose-700 border border-rose-200">${d.bloodGroup}</span>
      </td>
      <td class="py-2.5 px-4 font-medium">${d.distance} km</td>
      <td class="py-2.5 px-4 text-slate-400">${d.lastDonationDate}</td>
      <td class="py-2.5 px-4">
        ${d.available ?
          `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ELIGIBLE</span>` :
          `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">UNAVAILABLE</span>`}
      </td>
      <td class="py-2.5 px-4 text-right">
        <button onclick="toggleDonor(${d.donorId})" class="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition">
          Toggle
        </button>
      </td>
    </tr>
  `).join("");

  renderBloodInventory();
}

function renderBloodInventory() {
  const container = document.getElementById("blood-inventory-grid");
  if (!container) return;

  container.innerHTML = hospitalState.bloodUnits.map(b => `
    <div class="medical-card p-3 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
          ${b.bloodGroup}
        </div>
        <div>
          <span class="text-xs font-bold text-slate-900 block">${b.unitId}</span>
          <span class="text-[10px] text-slate-400">Exp: ${b.expiryDate}</span>
        </div>
      </div>
      <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">${b.status}</span>
    </div>
  `).join("");
}

function renderHashTableVisualizer() {
  const container = document.getElementById("hash-table-buckets");
  if (!container) return;

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const buckets = {};
  bloodGroups.forEach(bg => buckets[bg] = []);

  hospitalState.donors.forEach(donor => {
    if (buckets[donor.bloodGroup]) {
      buckets[donor.bloodGroup].push(donor);
    }
  });

  container.innerHTML = bloodGroups.map((bg, idx) => {
    const list = buckets[bg];
    return `
      <div class="flex items-start gap-3 border-b border-slate-200/60 pb-2.5">
        <div class="w-20 flex-shrink-0 flex items-center gap-2">
          <span class="w-6 h-6 rounded bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-mono font-bold">[${idx}]</span>
          <span class="font-bold text-rose-700 text-sm">${bg}</span>
        </div>
        <div class="flex-1 flex flex-wrap items-center gap-2">
          ${list.length > 0 ? list.map(d => `
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 shadow-sm text-xs">
              <span class="font-semibold text-slate-900">${d.name}</span>
              <span class="text-slate-400">(${d.distance}km)</span>
              <span class="w-2 h-2 rounded-full ${d.available ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
            </div>
            <i class="fas fa-arrow-right text-[10px] text-slate-400 last:hidden"></i>
          `).join("") : `<span class="text-xs text-slate-400 italic">Empty Bucket (nullptr)</span>`}
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// Interactive Hospital Actions
// -------------------------------------------------------------
function admitPatient(event) {
  event.preventDefault();

  const name = document.getElementById("form-patient-name").value.trim();
  const age = parseInt(document.getElementById("form-patient-age").value) || 45;
  const bloodGroup = document.getElementById("form-patient-blood").value;
  const severity = parseInt(document.getElementById("form-patient-severity").value) || 8;
  const riskLevel = parseInt(document.getElementById("form-patient-risk").value) || 7;
  const waitingTime = parseInt(document.getElementById("form-patient-wait").value) || 0;
  const requiredResource = document.getElementById("form-patient-resource").value;

  const newId = hospitalState.patients.length > 0
    ? Math.max(...hospitalState.patients.map(p => p.patientId)) + 1
    : 101;

  const patient = {
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

  hospitalState.patients.push(patient);
  saveState();

  document.getElementById("patient-form").reset();
  updateLiveScorePreview();
  showToast(`Patient ${name} admitted & placed into Max-Heap Priority Queue!`, "success");
}

function processHighestPriorityPatient() {
  if (hospitalState.patients.length === 0) {
    showToast("Emergency queue is empty! No patients waiting.", "warning");
    return;
  }

  // Find root of Max-Heap (Highest priority)
  const ranked = [...hospitalState.patients].map(p => ({
    patient: p,
    priority: calculatePriority(p).priority
  })).sort((a, b) => b.priority - a.priority);

  triageSinglePatient(ranked[0].patient.patientId);
}

function triageSinglePatient(patientId) {
  const idx = hospitalState.patients.findIndex(p => p.patientId === patientId);
  if (idx === -1) return;

  const patient = hospitalState.patients[idx];
  const { priority } = calculatePriority(patient);

  // 1. Hospital Bed Allocation (Parikshit Module)
  const targetCategory = patient.requiredResource.toUpperCase();
  const res = hospitalState.resources.find(r => {
    return r.type.toUpperCase().includes(targetCategory) && r.state === "AVAILABLE";
  });

  let resourceOutcome = "";
  if (res) {
    res.state = "OCCUPIED";
    res.patientId = patient.patientId;
    resourceOutcome = `Allocated ${res.type} #${res.id} (${res.floor})`;
  } else {
    resourceOutcome = `No ${patient.requiredResource} currently available. Placed on standby.`;
  }

  // 2. Blood Donor Match (Piyush Module)
  let donorOutcome = "No blood transfusion required";
  if (patient.bloodRequired) {
    const matches = hospitalState.donors.map(d => ({
      donor: d,
      ...calculateDonorScore(d, patient.bloodGroup, priority)
    })).filter(m => m.compatible).sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
      const best = matches[0];
      donorOutcome = `Matched with Donor ${best.donor.name} (${best.donor.bloodGroup}, ${best.donor.distance}km) - Match Score: ${best.score} pts`;
    }
  }

  // Log Triage
  hospitalState.triageLogs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    patientId: patient.patientId,
    name: patient.name,
    priority,
    resourceOutcome,
    donorOutcome
  });

  // Remove from queue
  hospitalState.patients.splice(idx, 1);
  saveState();

  showModal(patient, priority, resourceOutcome, donorOutcome);
}

function boostWaitTime(patientId) {
  const p = hospitalState.patients.find(pt => pt.patientId === patientId);
  if (p) {
    p.waitingTime = (p.waitingTime || 0) + 5;
    saveState();
    showToast(`Added +5m wait time to ${p.name}. Dynamic Priority adjusted!`, "info");
  }
}

function removePatient(patientId) {
  const idx = hospitalState.patients.findIndex(p => p.patientId === patientId);
  if (idx !== -1) {
    const name = hospitalState.patients[idx].name;
    hospitalState.patients.splice(idx, 1);
    saveState();
    showToast(`Removed patient ${name} from emergency queue`, "warning");
  }
}

function setBedState(resourceId, newState) {
  const res = hospitalState.resources.find(r => r.id === resourceId);
  if (res) {
    res.state = newState;
    if (newState === "AVAILABLE") res.patientId = null;
    saveState();
  }
}

function toggleDonor(donorId) {
  const d = hospitalState.donors.find(dn => dn.donorId == donorId);
  if (d) {
    d.available = !d.available;
    saveState();
  }
}

function runDonorMatch() {
  const bloodGroup = document.getElementById("matcher-blood-group").value;
  const urgency = parseInt(document.getElementById("matcher-urgency-score").value) || 50;

  const container = document.getElementById("matcher-results");
  if (!container) return;

  const matches = hospitalState.donors.map(d => ({
    donor: d,
    ...calculateDonorScore(d, bloodGroup, urgency)
  })).sort((a, b) => b.score - a.score);

  container.innerHTML = matches.map((m, idx) => {
    const isTop = idx === 0 && m.score > 0;
    return `
      <div class="p-3 rounded-xl border ${isTop ? 'border-amber-400 bg-amber-50/60' : 'border-slate-200 bg-white'} flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full ${isTop ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-bold text-xs">
            #${idx + 1}
          </div>
          <div>
            <h5 class="text-xs font-bold text-slate-900 flex items-center gap-2">
              ${m.donor.name}
              <span class="px-2 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">${m.donor.bloodGroup}</span>
              ${isTop ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">Optimal Donor</span>' : ''}
            </h5>
            <div class="text-[10px] text-slate-500 flex gap-2.5 mt-0.5 font-medium">
              <span>Dist: ${m.donor.distance}km (+${m.distScore})</span>
              <span>Compat: +${m.compScore}</span>
              <span>Avail: +${m.availScore}</span>
              <span>Urg: +${m.urgScore}</span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-black ${isTop ? 'text-amber-700' : 'text-slate-800'} font-mono">${m.score}</span>
          <span class="text-[9px] text-slate-400 block uppercase font-bold">Pts</span>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// Database Inspector Simulation (SQLite in browser)
// -------------------------------------------------------------
function inspectTable(tableName) {
  document.getElementById("sql-query-input").value = `SELECT * FROM ${tableName} LIMIT 10;`;
  runSqlQuery();
}

function runSqlQuery() {
  const query = document.getElementById("sql-query-input").value.trim();
  const banner = document.getElementById("query-meta-banner");
  const table = document.getElementById("query-results-table");

  let tableName = "patients";
  if (query.toLowerCase().includes("from resources")) tableName = "resources";
  else if (query.toLowerCase().includes("from donors")) tableName = "donors";
  else if (query.toLowerCase().includes("from blood_units")) tableName = "blood_units";

  const data = hospitalState[tableName] || [];
  banner.innerHTML = `<span class="text-teal-700 font-bold"><i class="fas fa-check-circle mr-1"></i> Executed on SQLite (${tableName}):</span> Returned <strong class="text-slate-900">${data.length}</strong> records.`;

  if (data.length === 0) {
    table.innerHTML = `<tr><td class="p-3 text-slate-400">No records found in table ${tableName}.</td></tr>`;
    return;
  }

  const columns = Object.keys(data[0]);
  let html = `<thead><tr class="border-b border-slate-200 bg-slate-100 text-slate-700 font-bold">`;
  columns.forEach(c => html += `<th class="py-2 px-3">${c}</th>`);
  html += `</tr></thead><tbody>`;

  data.forEach(row => {
    html += `<tr class="border-b border-slate-200/60 hover:bg-slate-50">`;
    columns.forEach(c => html += `<td class="py-1.5 px-3">${row[c] !== null ? row[c] : 'NULL'}</td>`);
    html += `</tr>`;
  });
  html += `</tbody>`;
  table.innerHTML = html;
}

// -------------------------------------------------------------
// Demo Scenarios & Helper Modals
// -------------------------------------------------------------
function loadScenario(type) {
  if (type === "highway-surge") {
    hospitalState.patients = [
      { patientId: 201, name: "Vikram Malhotra (Trauma)", age: 34, bloodGroup: "A+", bloodRequired: "A+", severity: 10, riskLevel: 9, waitingTime: 5, requiredResource: "ICU" },
      { patientId: 202, name: "Pooja Verma (Fracture/Shock)", age: 28, bloodGroup: "O-", bloodRequired: "O-", severity: 9, riskLevel: 8, waitingTime: 12, requiredResource: "ICU" },
      { patientId: 203, name: "Aman Gupta (Hypoxia)", age: 52, bloodGroup: "B+", bloodRequired: "B+", severity: 6, riskLevel: 7, waitingTime: 25, requiredResource: "OXYGEN" },
      { patientId: 204, name: "Rohit Saxena (Lacerations)", age: 22, bloodGroup: "O+", bloodRequired: "O+", severity: 4, riskLevel: 3, waitingTime: 40, requiredResource: "GENERAL" }
    ];
    saveState();
    showToast("Loaded Scenario: Highway Multi-Car Collision Surge!", "success");
  } else if (type === "rare-blood") {
    hospitalState.patients = [
      { patientId: 301, name: "Dr. Ananya Ray (Hemorrhage)", age: 38, bloodGroup: "AB-", bloodRequired: "AB-", severity: 9, riskLevel: 9, waitingTime: 10, requiredResource: "ICU" }
    ];
    saveState();
    showToast("Loaded Scenario: Rare AB- Critical Case!", "warning");
  } else if (type === "reset") {
    resetState();
    showToast("Hospital beds and patient records reset to default state.", "info");
  }
}

function showModal(patient, priority, resourceOutcome, donorOutcome) {
  const modal = document.getElementById("triage-result-modal");
  if (!modal) return;

  document.getElementById("modal-patient-name").innerText = patient.name;
  document.getElementById("modal-priority-score").innerText = `${priority} pts`;
  document.getElementById("modal-resource-result").innerText = resourceOutcome;
  document.getElementById("modal-donor-result").innerText = donorOutcome;

  modal.classList.remove("hidden");
}

function closeModal() {
  const modal = document.getElementById("triage-result-modal");
  if (modal) modal.classList.add("hidden");
}

function updateLiveScorePreview() {
  const sev = parseInt(document.getElementById("form-patient-severity").value) || 1;
  const risk = parseInt(document.getElementById("form-patient-risk").value) || 1;
  const wait = parseInt(document.getElementById("form-patient-wait").value) || 0;

  document.getElementById("label-severity").innerText = sev;
  document.getElementById("label-risk").innerText = risk;

  const waitScore = Math.min(Math.floor(wait / 5), 10);
  const score = (sev * 5) + (risk * 3) + (waitScore * 2);

  const preview = document.getElementById("live-priority-score");
  if (preview) preview.innerText = score;
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach(el => {
    el.classList.remove("active", "bg-sky-600", "text-white", "shadow-sm");
    el.classList.add("text-slate-600");
  });

  const target = document.getElementById(`tab-${tabId}`);
  const btn = document.getElementById(`btn-tab-${tabId}`);

  if (target) target.classList.remove("hidden");
  if (btn) {
    btn.classList.add("active", "bg-sky-600", "text-white", "shadow-sm");
    btn.classList.remove("text-slate-600");
  }

  if (tabId === "donors") runDonorMatch();
  if (tabId === "database") runSqlQuery();
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  let border = "border-sky-300 bg-sky-50 text-sky-900";
  if (type === "success") border = "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (type === "warning") border = "border-amber-300 bg-amber-50 text-amber-900";

  toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border ${border} shadow-lg text-xs font-bold transition transform duration-300 translate-y-2 flex items-center gap-2`;
  toast.innerHTML = `<i class="fas fa-hospital-symbol"></i> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.remove("translate-y-2"), 10);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function renderAll() {
  renderHeaderStats();
  renderEmergencyQueue();
  renderHospitalResources();
  renderBloodDonors();
  renderHashTableVisualizer();
}

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderAll();
  updateLiveScorePreview();
  runDonorMatch();
});
