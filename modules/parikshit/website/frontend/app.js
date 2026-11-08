/**
 * HopeLine Fullstack Frontend Engine
 * Communicates with FastAPI REST API & SQLite Database
 */

const API_BASE = window.location.origin;

let currentQueue = [];
let allResources = [];
let allDonors = [];
let allBloodUnits = [];

// -------------------------------------------------------------
// Core API Calls
// -------------------------------------------------------------
async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (res.ok) {
      const stats = await res.json();
      document.getElementById("stat-active-patients").innerText = stats.active_queue_patients;
      document.getElementById("stat-icu-beds").innerText = stats.available_icu_beds;
      document.getElementById("stat-oxygen-units").innerText = stats.available_oxygen_units;
      document.getElementById("stat-ready-donors").innerText = stats.ready_blood_donors;
    }
  } catch (e) {
    console.warn("Could not fetch stats:", e);
  }
}

async function fetchQueue() {
  try {
    const res = await fetch(`${API_BASE}/api/queue`);
    if (res.ok) {
      currentQueue = await res.json();
      renderEmergencyQueue(currentQueue);
      renderHeapTree(currentQueue);
    }
  } catch (e) {
    console.error("Failed to fetch queue:", e);
  }
}

async function fetchResources() {
  try {
    const res = await fetch(`${API_BASE}/api/resources`);
    if (res.ok) {
      allResources = await res.json();
      renderHospitalResources(allResources);
    }
  } catch (e) {
    console.error("Failed to fetch resources:", e);
  }
}

async function fetchDonors() {
  try {
    const res = await fetch(`${API_BASE}/api/donors`);
    if (res.ok) {
      allDonors = await res.json();
      renderBloodDonors(allDonors);
      renderHashTableVisualizer(allDonors);
    }
  } catch (e) {
    console.error("Failed to fetch donors:", e);
  }
}

async function fetchBloodUnits() {
  try {
    const res = await fetch(`${API_BASE}/api/blood-units`);
    if (res.ok) {
      allBloodUnits = await res.json();
      renderBloodInventory(allBloodUnits);
    }
  } catch (e) {
    console.error("Failed to fetch blood units:", e);
  }
}

async function refreshAll() {
  await Promise.all([
    fetchStats(),
    fetchQueue(),
    fetchResources(),
    fetchDonors(),
    fetchBloodUnits()
  ]);
}

// -------------------------------------------------------------
// Interactive UI Operations (Connected to SQLite)
// -------------------------------------------------------------
async function handlePatientSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("form-patient-name").value.trim();
  const age = parseInt(document.getElementById("form-patient-age").value) || 45;
  const blood_group = document.getElementById("form-patient-blood").value;
  const severity = parseInt(document.getElementById("form-patient-severity").value) || 8;
  const risk_level = parseInt(document.getElementById("form-patient-risk").value) || 7;
  const waiting_time = parseInt(document.getElementById("form-patient-wait").value) || 0;
  const required_resource = document.getElementById("form-patient-resource").value;

  try {
    const res = await fetch(`${API_BASE}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        age,
        blood_group,
        severity,
        risk_level,
        waiting_time,
        required_resource
      })
    });

    if (res.ok) {
      const created = await res.json();
      showToast(`Emergency patient ${created.name} inserted into SQLite database! Priority: ${created.priority_score}`, "success");
      document.getElementById("patient-form").reset();
      updateLiveScorePreview();
      refreshAll();
    } else {
      const err = await res.json();
      showToast(`Error: ${err.detail || 'Failed to admit patient'}`, "warning");
    }
  } catch (e) {
    showToast("Network error admitting patient", "warning");
  }
}

async function processHighestPriorityPatient() {
  try {
    const res = await fetch(`${API_BASE}/api/triage/process-next`, {
      method: "POST"
    });

    if (res.ok) {
      const result = await res.json();
      showModalResult(result.patient, result.priority_score, result.resource_allocation, result.blood_donor_match);
      refreshAll();
    } else {
      const err = await res.json();
      showToast(err.detail || "No patients to process", "warning");
    }
  } catch (e) {
    showToast("Error processing triage", "warning");
  }
}

async function incrementWaitTime(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}/wait`, {
      method: "POST"
    });
    if (res.ok) {
      const updated = await res.json();
      showToast(`+5m Wait added to ${updated.name}. DB Priority updated to ${updated.priority_score}`, "info");
      refreshAll();
    }
  } catch (e) {
    console.error(e);
  }
}

async function deletePatientRecord(patientId) {
  try {
    const res = await fetch(`${API_BASE}/api/patients/${patientId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      showToast(`Patient #${patientId} deleted from database`, "warning");
      refreshAll();
    }
  } catch (e) {
    console.error(e);
  }
}

async function setResourceState(resourceId, newState) {
  try {
    const res = await fetch(`${API_BASE}/api/resources/${resourceId}/state`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState })
    });
    if (res.ok) {
      refreshAll();
    }
  } catch (e) {
    console.error(e);
  }
}

async function toggleDonorAvailability(donorId) {
  try {
    const res = await fetch(`${API_BASE}/api/donors/${donorId}/toggle`, {
      method: "POST"
    });
    if (res.ok) {
      refreshAll();
    }
  } catch (e) {
    console.error(e);
  }
}

async function runDonorMatch() {
  const blood_group = document.getElementById("matcher-blood-group").value;
  const urgency_score = parseInt(document.getElementById("matcher-urgency-score").value) || 50;

  try {
    const res = await fetch(`${API_BASE}/api/donors/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blood_group, urgency_score })
    });

    if (res.ok) {
      const data = await res.json();
      renderMatcherResults(data.ranked_candidates);
    }
  } catch (e) {
    console.error("Match error:", e);
  }
}

async function syncToCppFiles() {
  try {
    const res = await fetch(`${API_BASE}/api/sync/cpp`, { method: "POST" });
    if (res.ok) {
      showToast("Successfully synchronized SQLite database with C++ data/*.json files!", "success");
    }
  } catch (e) {
    showToast("Sync failed", "warning");
  }
}

// -------------------------------------------------------------
// Relational Database Explorer
// -------------------------------------------------------------
function setQuery(sql) {
  document.getElementById("sql-query-input").value = sql;
  executeCurrentQuery();
}

function loadTableData(tableName) {
  setQuery(`SELECT * FROM ${tableName} LIMIT 25;`);
}

async function executeCurrentQuery() {
  const query = document.getElementById("sql-query-input").value.trim();
  const banner = document.getElementById("query-meta-banner");
  const table = document.getElementById("query-results-table");

  banner.innerHTML = `<span class="text-sky-400"><i class="fas fa-spinner fa-spin mr-1"></i> Executing SQL query against hopeline.db...</span>`;

  try {
    const res = await fetch(`${API_BASE}/api/database/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const result = await res.json();

    if (res.ok) {
      banner.innerHTML = `<span class="text-emerald-400 font-bold"><i class="fas fa-check-circle mr-1"></i> Success:</span> Returned <strong class="text-white">${result.row_count}</strong> rows from SQLite database.`;

      if (result.row_count === 0) {
        table.innerHTML = `<tr><td class="p-4 text-center text-slate-500 italic">No rows returned by query.</td></tr>`;
        return;
      }

      const columns = Object.keys(result.data[0]);
      let html = `<thead><tr class="border-b border-slate-700 bg-slate-800/80 text-slate-300">`;
      columns.forEach(col => {
        html += `<th class="py-2 px-3 font-mono font-bold">${col}</th>`;
      });
      html += `</tr></thead><tbody>`;

      result.data.forEach(row => {
        html += `<tr class="border-b border-slate-800/60 hover:bg-slate-800/40">`;
        columns.forEach(col => {
          let val = row[col];
          if (val === null) val = `<span class="text-slate-600">NULL</span>`;
          html += `<td class="py-1.5 px-3 font-mono">${val}</td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody>`;
      table.innerHTML = html;

    } else {
      banner.innerHTML = `<span class="text-rose-400 font-bold"><i class="fas fa-exclamation-triangle mr-1"></i> SQL Error:</span> ${result.detail}`;
      table.innerHTML = "";
    }
  } catch (e) {
    banner.innerHTML = `<span class="text-rose-400">Failed to communicate with database API.</span>`;
  }
}

// -------------------------------------------------------------
// UI Rendering Functions
// -------------------------------------------------------------
function renderEmergencyQueue(queue) {
  const container = document.getElementById("patient-queue-list");
  if (!container) return;

  if (queue.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i class="fas fa-check-circle text-4xl text-emerald-500/50 mb-3 block"></i>
        <p class="text-lg font-medium">No pending emergency patients.</p>
        <p class="text-sm text-slate-500">Database queue is empty. Admit a patient to start triage.</p>
      </div>`;
    return;
  }

  container.innerHTML = queue.map((p, index) => {
    let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (p.priority_score >= 70) badgeClass = "bg-rose-500/20 text-rose-300 border-rose-500/40 pulse-badge";
    else if (p.priority_score >= 50) badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    else if (p.priority_score >= 35) badgeClass = "bg-sky-500/20 text-sky-300 border-sky-500/40";

    return `
      <div class="glass-panel p-4 glass-panel-hover border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 font-bold text-sky-400">
            <span class="text-xs uppercase text-slate-400">Heap</span>
            <span class="text-base leading-tight">#${index + 1}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-bold text-lg text-white">${p.name}</h4>
              <span class="text-xs font-semibold px-2 py-0.5 rounded border ${badgeClass}">Score: ${p.priority_score}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">ID: #${p.patient_id}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50"><i class="fas fa-tint mr-1"></i>${p.blood_group}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span><strong>Age:</strong> ${p.age}</span>
              <span><strong>Resource:</strong> <span class="text-sky-300">${p.required_resource}</span></span>
              <span><strong>Severity:</strong> ${p.severity}/10</span>
              <span><strong>Risk:</strong> ${p.risk_level}/10</span>
              <span><strong>Wait Time:</strong> ${p.waiting_time}m</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end md:self-center flex-wrap">
          <button onclick="incrementWaitTime(${p.patient_id})" title="Add +5m wait time to see dynamic priority shift in SQLite" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
            <i class="fas fa-clock mr-1 text-amber-400"></i> +5m Wait
          </button>
          <button onclick="deletePatientRecord(${p.patient_id})" class="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition" title="Delete from SQLite">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function renderHeapTree(rankedPatients) {
  const container = document.getElementById("heap-tree-visualizer");
  if (!container) return;

  if (rankedPatients.length === 0) {
    container.innerHTML = `<p class="text-center text-slate-500 text-sm py-8">Heap is currently empty. Admit patients to view Max-Heap layout.</p>`;
    return;
  }

  const maxNodes = Math.min(rankedPatients.length, 7);
  let html = `<div class="flex flex-col items-center gap-6 py-4">`;

  // Level 0 (Root)
  html += `<div class="flex justify-center">
    <div class="flex flex-col items-center">
      <div class="tree-node bg-rose-600 text-white border-2 border-rose-300 shadow-rose-500/30">
        <span class="text-xs font-mono">ROOT</span>
        <span class="text-sm font-black">${rankedPatients[0].priority_score}</span>
      </div>
      <span class="text-[11px] text-rose-300 font-medium mt-1">${rankedPatients[0].name.split(" ")[0]}</span>
      <span class="text-[10px] text-slate-400 font-mono">[Idx 0]</span>
    </div>
  </div>`;

  // Level 1 (Indices 1, 2)
  if (maxNodes > 1) {
    html += `<div class="flex justify-center gap-16 md:gap-32 w-full">`;
    for (let i = 1; i <= 2 && i < maxNodes; i++) {
      html += `<div class="flex flex-col items-center">
        <div class="tree-node bg-sky-600 text-white border border-sky-300 shadow-sky-500/30">
          <span class="text-xs font-mono">P${i}</span>
          <span class="text-sm font-black">${rankedPatients[i].priority_score}</span>
        </div>
        <span class="text-[11px] text-sky-200 font-medium mt-1">${rankedPatients[i].name.split(" ")[0]}</span>
        <span class="text-[10px] text-slate-400 font-mono">[Idx ${i}]</span>
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
          <span class="text-sm font-black">${rankedPatients[i].priority_score}</span>
        </div>
        <span class="text-[11px] text-slate-300 font-medium mt-1">${rankedPatients[i].name.split(" ")[0]}</span>
        <span class="text-[10px] text-slate-400 font-mono">[Idx ${i}]</span>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function renderHospitalResources(resources) {
  const container = document.getElementById("hospital-resources-grid");
  if (!container) return;

  container.innerHTML = resources.map(res => {
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
            ${res.assigned_patient_id ? `<span class="text-sky-300 font-medium"><i class="fas fa-user-injured mr-1"></i> Patient #${res.assigned_patient_id} Assigned</span>` : `<span class="text-slate-500">Ready for emergency triage</span>`}
          </div>
        </div>

        <div class="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80">
          ${res.state !== "OCCUPIED" ? `
            <button onclick="setResourceState(${res.id}, 'OCCUPIED')" class="flex-1 py-1 text-[11px] font-semibold rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition">
              Occupy
            </button>
          ` : `
            <button onclick="setResourceState(${res.id}, 'AVAILABLE')" class="flex-1 py-1 text-[11px] font-semibold rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition">
              Release
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

function renderBloodDonors(donors) {
  const container = document.getElementById("donors-table-body");
  if (!container) return;

  container.innerHTML = donors.map(d => {
    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 text-sm">
        <td class="py-3 px-4 font-mono font-medium text-sky-400">${d.donor_id}</td>
        <td class="py-3 px-4 font-semibold text-white">${d.name}</td>
        <td class="py-3 px-4">
          <span class="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-950/70 text-rose-300 border border-rose-800">
            ${d.blood_group}
          </span>
        </td>
        <td class="py-3 px-4 text-slate-300">${d.distance} km</td>
        <td class="py-3 px-4 text-slate-400 text-xs">${d.last_donation_date}</td>
        <td class="py-3 px-4">
          ${d.available ?
            `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Available</span>` :
            `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">Unavailable</span>`}
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="toggleDonorAvailability('${d.donor_id}')" class="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            Toggle
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderBloodInventory(units) {
  const container = document.getElementById("blood-inventory-grid");
  if (!container) return;

  container.innerHTML = units.map(unit => {
    return `
      <div class="glass-panel p-3 border border-slate-800 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-800 flex items-center justify-center font-bold text-rose-300 text-sm">
            ${unit.blood_group}
          </div>
          <div>
            <h5 class="text-sm font-bold text-white">${unit.unit_id}</h5>
            <span class="text-[11px] text-slate-400">Exp: ${unit.expiry_date}</span>
          </div>
        </div>
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${unit.status}</span>
      </div>
    `;
  }).join("");
}

function renderMatcherResults(candidates) {
  const resultsContainer = document.getElementById("matcher-results");
  if (!resultsContainer) return;

  if (!candidates || candidates.length === 0) {
    resultsContainer.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs">No compatible donors found in database.</div>`;
    return;
  }

  resultsContainer.innerHTML = candidates.map((m, idx) => {
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
              <span class="text-xs px-2 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">${m.donor.blood_group}</span>
              ${isTop ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold uppercase">Best Match</span>' : ''}
            </h5>
            <div class="text-[11px] text-slate-400 flex gap-3 mt-0.5">
              <span>Dist: ${m.donor.distance} km (+${m.distance_score} pts)</span>
              <span>Compat: +${m.compatibility_score} pts</span>
              <span>Avail: +${m.availability_score} pts</span>
              <span>Urg: +${m.urgency_score} pts</span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="text-base font-extrabold ${isTop ? 'text-amber-300' : 'text-slate-300'}">${m.score}</span>
          <span class="text-[10px] text-slate-500 block uppercase font-mono">Score</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderHashTableVisualizer(donors) {
  const container = document.getElementById("hash-table-buckets");
  if (!container) return;

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const buckets = {};
  bloodGroups.forEach(bg => buckets[bg] = []);

  donors.forEach(donor => {
    if (buckets[donor.blood_group]) {
      buckets[donor.blood_group].push(donor);
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
// Modals & Navigation
// -------------------------------------------------------------
function openPatientsListModal() {
  const modal = document.getElementById("patients-list-modal");
  const tbody = document.getElementById("patients-modal-table-body");
  if (!modal || !tbody) return;

  fetch(`${API_BASE}/api/patients`).then(r => r.json()).then(patients => {
    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-slate-500">No patients currently registered in SQLite database.</td></tr>`;
    } else {
      tbody.innerHTML = patients.map(p => `
        <tr class="border-b border-slate-800 text-xs">
          <td class="py-2.5 px-3 font-mono font-bold text-sky-400">#${p.patient_id}</td>
          <td class="py-2.5 px-3 font-semibold text-white">${p.name}</td>
          <td class="py-2.5 px-3 text-slate-300">${p.age}</td>
          <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">${p.blood_group}</span></td>
          <td class="py-2.5 px-3 text-sky-300">${p.required_resource}</td>
          <td class="py-2.5 px-3 text-slate-300">${p.severity}/10</td>
          <td class="py-2.5 px-3 text-slate-300">${p.risk_level}/10</td>
          <td class="py-2.5 px-3 text-slate-300">${p.waiting_time}m</td>
          <td class="py-2.5 px-3 font-bold text-amber-400">${p.priority_score}</td>
        </tr>
      `).join("");
    }
  });

  modal.classList.remove("hidden");
}

function closePatientsListModal() {
  const modal = document.getElementById("patients-list-modal");
  if (modal) modal.classList.add("hidden");
}

function showModalResult(patient, priority, resourceOutcome, donorOutcome) {
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
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));

  const target = document.getElementById(`tab-${tabId}`);
  const btn = document.getElementById(`btn-tab-${tabId}`);

  if (target) target.classList.remove("hidden");
  if (btn) btn.classList.add("active");

  if (tabId === "database") {
    executeCurrentQuery();
  }
}

async function loadScenario(type) {
  const scenarios = {
    "highway-surge": [
      { name: "Vikram Malhotra", age: 34, blood_group: "A+", severity: 10, risk_level: 9, waiting_time: 5, required_resource: "ICU" },
      { name: "Pooja Verma", age: 28, blood_group: "O-", severity: 9, risk_level: 8, waiting_time: 12, required_resource: "ICU" },
      { name: "Aman Gupta", age: 52, blood_group: "B+", severity: 6, risk_level: 7, waiting_time: 25, required_resource: "OXYGEN" },
      { name: "Rohit Saxena", age: 22, blood_group: "O+", severity: 4, risk_level: 3, waiting_time: 40, required_resource: "GENERAL" }
    ],
    "rare-blood": [
      { name: "Dr. Ananya Ray", age: 38, blood_group: "AB-", severity: 9, risk_level: 9, waiting_time: 10, required_resource: "ICU" }
    ]
  };

  const toAdd = scenarios[type] || [];
  for (const pat of toAdd) {
    await fetch(`${API_BASE}/api/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pat)
    });
  }
  showToast(`Loaded scenario into SQLite database!`, "success");
  refreshAll();
}

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  refreshAll();
  updateLiveScorePreview();
  runDonorMatch();
});
