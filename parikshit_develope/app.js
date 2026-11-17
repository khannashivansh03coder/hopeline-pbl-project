/**
 * HopeLine - Smart Hospital Resource & Blood Donor Matching System
 * Central Emergency Healthcare & Hospital Triage Operations
 * Portal: parikshit07.tech
 */

// -------------------------------------------------------------
// 1. Initial Hospital State Data
// -------------------------------------------------------------
const INITIAL_DATA = {
  resources: [
    // 5 ICU Beds
    { id: 1, type: "ICU", label: "ICU Bed #1 (Ventilator)", state: "AVAILABLE", patient: null },
    { id: 2, type: "ICU", label: "ICU Bed #2 (Ventilator)", state: "AVAILABLE", patient: null },
    { id: 3, type: "ICU", label: "ICU Bed #3 (Ventilator)", state: "AVAILABLE", patient: null },
    { id: 4, type: "ICU", label: "ICU Bed #4 (Life Support)", state: "AVAILABLE", patient: null },
    { id: 5, type: "ICU", label: "ICU Bed #5 (Life Support)", state: "AVAILABLE", patient: null },

    // 5 General Beds
    { id: 6, type: "General", label: "General Ward Bed #1", state: "AVAILABLE", patient: null },
    { id: 7, type: "General", label: "General Ward Bed #2", state: "AVAILABLE", patient: null },
    { id: 8, type: "General", label: "General Ward Bed #3", state: "AVAILABLE", patient: null },
    { id: 9, type: "General", label: "General Ward Bed #4", state: "AVAILABLE", patient: null },
    { id: 10, type: "General", label: "General Ward Bed #5", state: "AVAILABLE", patient: null },

    // 5 Oxygen Units
    { id: 11, type: "Oxygen", label: "Oxygen Cylinder Unit #1", state: "AVAILABLE", patient: null },
    { id: 12, type: "Oxygen", label: "Oxygen Cylinder Unit #2", state: "AVAILABLE", patient: null },
    { id: 13, type: "Oxygen", label: "Oxygen Cylinder Unit #3", state: "AVAILABLE", patient: null },
    { id: 14, type: "Oxygen", label: "Oxygen Cylinder Unit #4", state: "AVAILABLE", patient: null },
    { id: 15, type: "Oxygen", label: "Oxygen Cylinder Unit #5", state: "AVAILABLE", patient: null }
  ],
  donors: [
    { id: "D101", name: "Ravi Kumar", bloodGroup: "O+", distance: 5, lastDonation: "2026-06-01", available: true },
    { id: "D102", name: "Amit Joshi", bloodGroup: "O-", distance: 25, lastDonation: "2026-06-15", available: true },
    { id: "D103", name: "Kunal Mehra", bloodGroup: "A+", distance: 8, lastDonation: "2026-07-01", available: true },
    { id: "D104", name: "Arjun Rawat", bloodGroup: "B+", distance: 3, lastDonation: "2026-05-01", available: true },
    { id: "D105", name: "Neeraj Negi", bloodGroup: "O-", distance: 2, lastDonation: "2026-04-01", available: false },
    { id: "D106", name: "Priya Verma", bloodGroup: "AB+", distance: 4, lastDonation: "2026-08-10", available: true }
  ],
  patients: [
    {
      id: 101,
      name: "Rahul Sharma",
      age: 45,
      bloodGroup: "O+",
      requiredResource: "ICU",
      severity: 9,
      risk: 8,
      waitingTime: 15
    },
    {
      id: 102,
      name: "Sunita Devi",
      age: 62,
      bloodGroup: "A+",
      requiredResource: "General",
      severity: 7,
      risk: 6,
      waitingTime: 25
    },
    {
      id: 103,
      name: "Vikram Singh",
      age: 31,
      bloodGroup: "B+",
      requiredResource: "Oxygen",
      severity: 5,
      risk: 4,
      waitingTime: 10
    }
  ]
};

let appState = {
  resources: [],
  donors: [],
  patients: [],
  nextPatientId: 104
};

// -------------------------------------------------------------
// 2. Clinical Formulas (Priority Engine & Donor Matching)
// -------------------------------------------------------------

// Triage Score: (Severity * 5) + (Risk * 3) + (min(Wait / 5, 10) * 2)
function computePriority(severity, risk, waitTime) {
  const s = parseInt(severity) || 1;
  const r = parseInt(risk) || 1;
  const w = parseInt(waitTime) || 0;
  const waitPoints = Math.min(Math.floor(w / 5), 10) * 2;
  return (s * 5) + (r * 3) + waitPoints;
}

// Blood Group Compatibility Matrix
function isCompatible(donorGroup, patientGroup) {
  if (donorGroup === "O-") return true; // Universal donor
  if (donorGroup === "O+") return ["O+", "A+", "B+", "AB+"].includes(patientGroup);
  if (donorGroup === "A-") return ["A-", "A+", "AB-", "AB+"].includes(patientGroup);
  if (donorGroup === "A+") return ["A+", "AB+"].includes(patientGroup);
  if (donorGroup === "B-") return ["B-", "B+", "AB-", "AB+"].includes(patientGroup);
  if (donorGroup === "B+") return ["B+", "AB+"].includes(patientGroup);
  if (donorGroup === "AB-") return ["AB-", "AB+"].includes(patientGroup);
  if (donorGroup === "AB+") return patientGroup === "AB+";
  return false;
}

// Multi-Criteria Donor Matching Score
function calculateDonorScore(donor, patientBloodGroup, urgencyScore) {
  if (!isCompatible(donor.bloodGroup, patientBloodGroup)) {
    return { score: 0, compatible: false };
  }
  const comp = (donor.bloodGroup === patientBloodGroup) ? 50 : 40;
  const avail = donor.available ? 20 : 0;
  const dist = Math.max(0, Math.min(20, 20 - Math.floor(donor.distance / 5)));
  const urg = Math.floor(Math.max(0, Math.min(100, urgencyScore)) / 10);
  return {
    score: comp + avail + dist + urg,
    compatible: true,
    comp,
    avail,
    dist,
    urg
  };
}

// -------------------------------------------------------------
// 3. Tab Navigation & UI Controls
// -------------------------------------------------------------
function switchTab(tabKey) {
  document.querySelectorAll(".tab-pane").forEach(el => el.classList.add("hidden"));
  document.querySelectorAll(".tab-link").forEach(btn => {
    btn.classList.remove("active", "bg-sky-600", "text-white");
    btn.classList.add("text-slate-600");
  });

  const targetPane = document.getElementById(`tab-${tabKey}`);
  const targetBtn = document.getElementById(`nav-btn-${tabKey}`);

  if (targetPane) targetPane.classList.remove("hidden");
  if (targetBtn) {
    targetBtn.classList.add("active", "bg-sky-600", "text-white");
    targetBtn.classList.remove("text-slate-600");
  }
}

function updateLiveScorePreview() {
  const sev = document.getElementById("input-severity").value;
  const risk = document.getElementById("input-risk").value;
  const wait = document.getElementById("input-wait").value;

  document.getElementById("label-severity-val").innerText = sev;
  document.getElementById("label-risk-val").innerText = risk;

  const score = computePriority(sev, risk, wait);
  document.getElementById("preview-score").innerText = score;
}

// -------------------------------------------------------------
// 4. Emergency Patient Admission & Queue Management
// -------------------------------------------------------------
function handlePatientAdmission(event) {
  event.preventDefault();
  const name = document.getElementById("input-name").value.trim();
  const age = parseInt(document.getElementById("input-age").value) || 30;
  const bloodGroup = document.getElementById("input-blood").value;
  const requiredResource = document.getElementById("input-resource").value;
  const severity = parseInt(document.getElementById("input-severity").value);
  const risk = parseInt(document.getElementById("input-risk").value);
  const waitingTime = parseInt(document.getElementById("input-wait").value) || 0;

  const newPatient = {
    id: appState.nextPatientId++,
    name,
    age,
    bloodGroup,
    requiredResource,
    severity,
    risk,
    waitingTime
  };

  appState.patients.push(newPatient);
  renderAll();

  // Reset form name
  document.getElementById("input-name").value = "";
  alert(`Patient '${name}' admitted with Emergency Triage Score: ${computePriority(severity, risk, waitingTime)} pts! Enqueued for bed allocation.`);
}

function injectPresetCase(type) {
  if (type === "cardiac") {
    document.getElementById("input-name").value = "Rajesh Verma (Cardiac Emergency)";
    document.getElementById("input-age").value = 54;
    document.getElementById("input-blood").value = "O-";
    document.getElementById("input-resource").value = "ICU";
    document.getElementById("input-severity").value = 10;
    document.getElementById("input-risk").value = 9;
    document.getElementById("input-wait").value = 15;
  } else if (type === "trauma") {
    document.getElementById("input-name").value = "Amit Negi (Accident Trauma)";
    document.getElementById("input-age").value = 28;
    document.getElementById("input-blood").value = "B+";
    document.getElementById("input-resource").value = "ICU";
    document.getElementById("input-severity").value = 9;
    document.getElementById("input-risk").value = 7;
    document.getElementById("input-wait").value = 10;
  } else if (type === "asthma") {
    document.getElementById("input-name").value = "Kavita Bisht (Acute Asthma)";
    document.getElementById("input-age").value = 39;
    document.getElementById("input-blood").value = "A+";
    document.getElementById("input-resource").value = "Oxygen";
    document.getElementById("input-severity").value = 6;
    document.getElementById("input-risk").value = 5;
    document.getElementById("input-wait").value = 20;
  }
  updateLiveScorePreview();
}

function addWaitTime(patientId, deltaMinutes) {
  const p = appState.patients.find(pt => pt.id === patientId);
  if (p) {
    p.waitingTime = Math.max(0, p.waitingTime + deltaMinutes);
    renderAll();
  }
}

function deletePatient(patientId) {
  appState.patients = appState.patients.filter(pt => pt.id !== patientId);
  renderAll();
}

// -------------------------------------------------------------
// 5. Automated Triage Dispatch Action
// -------------------------------------------------------------
function processTopPatient() {
  if (appState.patients.length === 0) {
    alert("Emergency queue is empty! No pending patients waiting.");
    return;
  }

  // Find top priority patient
  const sorted = [...appState.patients].map(p => ({
    ...p,
    score: computePriority(p.severity, p.risk, p.waitingTime)
  })).sort((a, b) => b.score - a.score);

  const topPatient = sorted[0];

  // Find available matching hospital resource
  const matchedResource = appState.resources.find(r => r.type === topPatient.requiredResource && r.state === "AVAILABLE");

  // Find best compatible blood donor
  let bestDonor = null;
  let highestDonorScore = -1;
  appState.donors.forEach(d => {
    const res = calculateDonorScore(d, topPatient.bloodGroup, topPatient.score);
    if (res.compatible && res.score > highestDonorScore) {
      highestDonorScore = res.score;
      bestDonor = { ...d, matchScore: res.score };
    }
  });

  // Allocate resource if found
  if (matchedResource) {
    matchedResource.state = "OCCUPIED";
    matchedResource.patient = `${topPatient.name} (ID: #${topPatient.id})`;
  }

  // Remove patient from queue
  appState.patients = appState.patients.filter(p => p.id !== topPatient.id);

  // Append dispatch logs
  const terminal = document.getElementById("cpp-terminal-content");
  const timestamp = new Date().toLocaleTimeString();

  const logEntry = `
<div class="pt-3 border-t border-slate-800 text-slate-300">
  <div class="text-amber-400 font-bold">[${timestamp}] >>> DISPATCH ACTION: HIGHEST PRIORITY PATIENT PROCESSED</div>
  <div class="text-slate-400 pl-3">
    --------------------------------------------------------<br>
    Patient ID         : #${topPatient.id}<br>
    Patient Name       : <span class="text-white font-bold">${topPatient.name}</span><br>
    Blood Group        : <span class="text-rose-400 font-bold">${topPatient.bloodGroup}</span><br>
    Triage Score       : <span class="text-emerald-400 font-bold">${topPatient.score} pts</span><br>
    Required Unit      : ${topPatient.requiredResource}<br>
    --------------------------------------------------------<br>
    Resource Allocation: <span class="${matchedResource ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">${matchedResource ? `${matchedResource.label} (ID: ${matchedResource.id}) [ALLOCATED]` : 'NO BEDS CURRENTLY AVAILABLE (WAITLISTED)'}</span><br>
    Blood Donor Match  : <span class="${bestDonor ? 'text-sky-400 font-bold' : 'text-amber-400'}">${bestDonor ? `${bestDonor.name} (${bestDonor.bloodGroup}, ${bestDonor.distance}km away) - Match Score: ${bestDonor.matchScore}` : 'NO COMPATIBLE DONOR FOUND'}</span><br>
    Dispatch Status    : <span class="text-emerald-400 font-bold">Successfully Dispatched & Admitted</span><br>
    --------------------------------------------------------
  </div>
</div>`;

  terminal.innerHTML += logEntry;
  terminal.scrollTop = terminal.scrollHeight;

  // Switch to console tab
  switchTab("console");
  renderAll();
}

// -------------------------------------------------------------
// 6. Ward Bed Management
// -------------------------------------------------------------
function toggleBedState(resourceId) {
  const res = appState.resources.find(r => r.id === resourceId);
  if (!res) return;

  if (res.state === "AVAILABLE") {
    res.state = "OCCUPIED";
    res.patient = "Emergency Admitted Patient";
  } else if (res.state === "OCCUPIED") {
    res.state = "MAINTENANCE";
    res.patient = null;
  } else {
    res.state = "AVAILABLE";
    res.patient = null;
  }
  renderAll();
}

function dischargeBed(resourceId) {
  const res = appState.resources.find(r => r.id === resourceId);
  if (res) {
    res.state = "AVAILABLE";
    res.patient = null;
    renderAll();
  }
}

// -------------------------------------------------------------
// 7. Blood Donor Matching Engine
// -------------------------------------------------------------
function performDonorMatch() {
  const targetBlood = document.getElementById("matcher-patient-blood").value;
  const urgency = parseInt(document.getElementById("matcher-urgency").value) || 50;

  const results = appState.donors.map(d => {
    const calc = calculateDonorScore(d, targetBlood, urgency);
    return { ...d, ...calc };
  }).sort((a, b) => b.score - a.score);

  const container = document.getElementById("matcher-results-list");
  if (!container) return;

  container.innerHTML = results.map(r => {
    if (!r.compatible) {
      return `
        <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-between opacity-60">
          <div>
            <span class="font-bold">${r.name}</span> (${r.bloodGroup}) - ${r.distance}km
          </div>
          <span class="text-[10px] font-bold text-rose-500">Incompatible Blood Group</span>
        </div>`;
    }

    return `
      <div class="p-2.5 rounded-lg bg-white border ${r.available ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900">${r.name}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">${r.bloodGroup}</span>
            <span class="text-[11px] text-slate-500">${r.distance} km away</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">
            Breakdown: Compatibility: ${r.comp} | Availability: ${r.avail} | Proximity: ${r.dist} | Urgency: ${r.urg}
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-black text-rose-600 font-mono">${r.score}</span>
          <span class="text-[9px] uppercase font-bold text-slate-400 block">Match Pts</span>
        </div>
      </div>`;
  }).join("");
}

function toggleDonorAvailability(donorId) {
  const d = appState.donors.find(item => item.id === donorId);
  if (d) {
    d.available = !d.available;
    renderAll();
    performDonorMatch();
  }
}

// -------------------------------------------------------------
// 8. Master Rendering Engine
// -------------------------------------------------------------
function renderAll() {
  // Update header counters
  const availICU = appState.resources.filter(r => r.type === "ICU" && r.state === "AVAILABLE").length;
  const availGen = appState.resources.filter(r => r.type === "General" && r.state === "AVAILABLE").length;
  const availO2 = appState.resources.filter(r => r.type === "Oxygen" && r.state === "AVAILABLE").length;

  document.getElementById("stat-queue-count").innerText = appState.patients.length;
  document.getElementById("stat-icu-count").innerText = `${availICU} / 5`;
  document.getElementById("stat-gen-count").innerText = `${availGen} / 5`;
  document.getElementById("stat-o2-count").innerText = `${availO2} / 5`;

  // Render Queue List
  const queueContainer = document.getElementById("patient-heap-container");
  if (appState.patients.length === 0) {
    queueContainer.innerHTML = `
      <div class="text-center py-10 text-slate-400">
        <i class="fas fa-check-circle text-3xl text-emerald-400 mb-2 block"></i>
        <p class="font-bold text-slate-700 text-sm">Emergency Queue Empty</p>
        <p class="text-xs text-slate-400">All emergency patients have been triaged and allocated beds.</p>
      </div>`;
  } else {
    const ranked = [...appState.patients].map(p => ({
      ...p,
      score: computePriority(p.severity, p.risk, p.waitingTime)
    })).sort((a, b) => b.score - a.score);

    queueContainer.innerHTML = ranked.map((p, idx) => {
      let badgeClass = "badge-stable";
      if (p.score >= 70) {
        badgeClass = "badge-critical";
      } else if (p.score >= 50) {
        badgeClass = "badge-emergent";
      } else if (p.score >= 35) {
        badgeClass = "badge-urgent";
      }

      return `
        <div class="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 ${idx === 0 ? 'ring-2 ring-emerald-500/30' : ''}">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-100 flex flex-col items-center justify-center font-mono font-bold text-slate-700 border border-slate-200">
              <span class="text-[8px] text-slate-400">RANK</span>
              <span class="text-xs text-sky-600">#${idx + 1}</span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-slate-900 text-sm">${p.name}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}">${p.score} pts</span>
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">ID: #${p.id}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200"><i class="fas fa-tint mr-1 text-rose-500"></i>${p.bloodGroup}</span>
              </div>
              <div class="text-[11px] text-slate-500 mt-1 flex gap-3 flex-wrap">
                <span>Age: <strong>${p.age}</strong></span>
                <span>Unit: <strong class="text-sky-700">${p.requiredResource}</strong></span>
                <span>Severity: <strong>${p.severity}/10</strong></span>
                <span>Risk: <strong>${p.risk}/10</strong></span>
                <span>Wait: <strong>${p.waitingTime}m</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end md:self-center">
            <button onclick="addWaitTime(${p.id}, 5)" title="Add 5 minutes wait time" class="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">
              +5m Wait
            </button>
            <button onclick="deletePatient(${p.id})" title="Delete patient from queue" class="px-2 py-1 text-xs text-slate-400 hover:text-rose-600">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
    }).join("");

    // Render Array Visualizer
    const arrayContainer = document.getElementById("heap-array-visualizer");
    arrayContainer.innerHTML = ranked.map((p, i) => `
      <div class="p-2 rounded bg-slate-100 border border-slate-200 text-center min-w-[70px]">
        <span class="text-[9px] text-slate-400 block font-mono">Rank #${i + 1}</span>
        <span class="text-xs font-black text-sky-700 font-mono">${p.score}</span>
        <span class="text-[9px] text-slate-500 block truncate max-w-[65px]">${p.name.split(" ")[0]}</span>
      </div>
    `).join("");
  }

  // Render Ward Beds Grid
  const bedsGrid = document.getElementById("hospital-beds-grid");
  bedsGrid.innerHTML = appState.resources.map(r => {
    let cardClass = "available";
    let icon = "fa-bed-pulse text-emerald-600";
    let statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">AVAILABLE</span>`;

    if (r.state === "OCCUPIED") {
      cardClass = "occupied";
      icon = "fa-user-injured text-rose-600";
      statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">OCCUPIED</span>`;
    } else if (r.state === "MAINTENANCE") {
      cardClass = "maintenance";
      icon = "fa-screwdriver-wrench text-amber-600";
      statusBadge = `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">MAINTENANCE</span>`;
    }

    return `
      <div class="bed-card ${cardClass} p-3.5 space-y-2">
        <div class="flex items-center justify-between">
          <i class="fas ${icon} text-lg"></i>
          ${statusBadge}
        </div>
        <div>
          <h5 class="font-bold text-slate-900 text-xs">${r.label}</h5>
          <span class="text-[10px] text-slate-500 font-mono">Unit Type: ${r.type} • ID: ${r.id}</span>
        </div>
        <div class="text-[11px] text-slate-600 min-h-[30px]">
          ${r.patient ? `Occupied by: <strong class="text-rose-700 block truncate">${r.patient}</strong>` : `<span class="text-emerald-700 font-medium">Ready for admission</span>`}
        </div>
        <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
          <button onclick="toggleBedState(${r.id})" class="text-[10px] font-semibold px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-700">
            Cycle State
          </button>
          ${r.state !== "AVAILABLE" ? `
            <button onclick="dischargeBed(${r.id})" class="text-[10px] font-bold px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white">
              Discharge
            </button>` : ''}
        </div>
      </div>`;
  }).join("");

  // Render Donors Directory Table
  const donorsTable = document.getElementById("donors-table-rows");
  donorsTable.innerHTML = appState.donors.map(d => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="py-2.5 px-3 font-mono font-bold text-slate-700">${d.id}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-900">${d.name}</td>
      <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200">${d.bloodGroup}</span></td>
      <td class="py-2.5 px-3 font-mono">${d.distance} km</td>
      <td class="py-2.5 px-3 text-slate-500">${d.lastDonation}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${d.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
          ${d.available ? 'Ready' : 'Unavailable'}
        </span>
      </td>
      <td class="py-2.5 px-3 text-right">
        <button onclick="toggleDonorAvailability('${d.id}')" class="text-[11px] font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">
          Toggle Status
        </button>
      </td>
    </tr>
  `).join("");
}

function resetToSampleData() {
  appState = JSON.parse(JSON.stringify(INITIAL_DATA));
  appState.nextPatientId = 104;
  renderAll();
  performDonorMatch();
}

// -------------------------------------------------------------
// 9. Startup Initialization
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  resetToSampleData();
  updateLiveScorePreview();
  performDonorMatch();
});
