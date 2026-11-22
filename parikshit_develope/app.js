/**
 * HopeLine - Smart Hospital Resource & Blood Donor Matching System
 * Central Emergency Healthcare & Hospital Triage Operations
 * Developed by Team CodePulse
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
    { id: "D101", name: "Ravi Kumar", bloodGroup: "O+", distance: 5.0, phone: "+91 98765 11001", lastDonation: "2026-06-01", available: true },
    { id: "D102", name: "Amit Joshi", bloodGroup: "O-", distance: 25.0, phone: "+91 98765 11002", lastDonation: "2026-06-15", available: true },
    { id: "D103", name: "Kunal Mehra", bloodGroup: "A+", distance: 8.0, phone: "+91 98765 11003", lastDonation: "2026-07-01", available: true },
    { id: "D104", name: "Arjun Rawat", bloodGroup: "B+", distance: 3.0, phone: "+91 98765 11004", lastDonation: "2026-05-01", available: true },
    { id: "D105", name: "Neeraj Negi", bloodGroup: "O-", distance: 2.0, phone: "+91 98765 11005", lastDonation: "2026-04-01", available: true },
    { id: "D106", name: "Priya Verma", bloodGroup: "AB+", distance: 4.0, phone: "+91 98765 11006", lastDonation: "2026-08-10", available: true }
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
      admittedAt: Date.now() - (15 * 60 * 1000) // Admitted 15 mins ago
    },
    {
      id: 102,
      name: "Sunita Devi",
      age: 62,
      bloodGroup: "A+",
      requiredResource: "General",
      severity: 7,
      risk: 6,
      admittedAt: Date.now() - (25 * 60 * 1000) // Admitted 25 mins ago
    },
    {
      id: 103,
      name: "Vikram Singh",
      age: 31,
      bloodGroup: "B+",
      requiredResource: "Oxygen",
      severity: 5,
      risk: 4,
      admittedAt: Date.now() - (10 * 60 * 1000) // Admitted 10 mins ago
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

// Triage Score: (Severity * 5) + (Risk * 3) + (min(floor(Wait / 5), 10) * 2)
function computePriority(severity, risk, waitTimeMinutes) {
  const s = parseInt(severity) || 1;
  const r = parseInt(risk) || 1;
  const w = parseInt(waitTimeMinutes) || 0;
  const waitPoints = Math.min(Math.floor(w / 5), 10) * 2;
  return (s * 5) + (r * 3) + waitPoints;
}

// Elapsed waiting time in integer minutes
function getPatientWaitMinutes(patient) {
  if (!patient || !patient.admittedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - patient.admittedAt) / 60000));
}

// Live elapsed waiting time formatted as string (e.g., "12s" or "3m 45s")
function getPatientWaitFormatted(patient) {
  if (!patient || !patient.admittedAt) return "Just admitted";
  const totalSeconds = Math.max(0, Math.floor((Date.now() - patient.admittedAt) / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

// Dynamic real-time patient priority score
function getPatientScore(patient) {
  const waitMins = getPatientWaitMinutes(patient);
  return computePriority(patient.severity, patient.risk, waitMins);
}

// Blood Group Compatibility Matrix (8x8)
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
  const sevInput = document.getElementById("input-severity");
  const riskInput = document.getElementById("input-risk");
  if (!sevInput || !riskInput) return;

  const sev = parseInt(sevInput.value) || 1;
  const risk = parseInt(riskInput.value) || 1;

  document.getElementById("label-severity-val").innerText = sev;
  document.getElementById("label-risk-val").innerText = risk;

  // Base score at initial intake (0m wait)
  const baseScore = (sev * 5) + (risk * 3);
  document.getElementById("preview-score").innerText = baseScore;
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

  // New patient intake with live timestamp
  const newPatient = {
    id: appState.nextPatientId++,
    name,
    age,
    bloodGroup,
    requiredResource,
    severity,
    risk,
    admittedAt: Date.now() // Live admission timestamp
  };

  appState.patients.push(newPatient);
  renderAll();

  // Reset name field
  document.getElementById("input-name").value = "";
  const initialScore = (severity * 5) + (risk * 3);
  alert(`Patient '${name}' admitted with initial Triage Score: ${initialScore} pts!\nEnqueued for bed allocation. Real-time waiting timer started.`);
}

// Fast-forward simulated waiting time (useful for viva demonstrations)
function simulateWait(patientId, extraMinutes) {
  const p = appState.patients.find(pt => pt.id === patientId);
  if (p) {
    p.admittedAt = (p.admittedAt || Date.now()) - (extraMinutes * 60 * 1000);
    renderAll();
  }
}

function deletePatient(patientId) {
  appState.patients = appState.patients.filter(pt => pt.id !== patientId);
  renderAll();
}

// -------------------------------------------------------------
// 5. Automated Triage Dispatch Action (Option 4 Execution)
// -------------------------------------------------------------
function processTopPatient() {
  if (appState.patients.length === 0) {
    alert("Emergency queue is empty! No pending patients waiting.");
    return;
  }

  // Find top priority patient by dynamic score
  const sorted = [...appState.patients].map(p => ({
    ...p,
    score: getPatientScore(p),
    waitMinutes: getPatientWaitMinutes(p),
    waitFormatted: getPatientWaitFormatted(p)
  })).sort((a, b) => b.score - a.score);

  const topPatient = sorted[0];

  // Find available matching hospital resource
  const matchedResource = appState.resources.find(r => r.type === topPatient.requiredResource && r.state === "AVAILABLE");

  // Find nearest available compatible blood donor (Exact match prioritized, then nearest distance)
  const compatibleDonors = appState.donors
    .filter(d => isCompatible(d.bloodGroup, topPatient.bloodGroup) && d.available)
    .sort((a, b) => {
      const aExact = (a.bloodGroup === topPatient.bloodGroup);
      const bExact = (b.bloodGroup === topPatient.bloodGroup);
      if (aExact !== bExact) return aExact ? -1 : 1;
      return a.distance - b.distance;
    });
  const bestDonor = compatibleDonors.length > 0 ? compatibleDonors[0] : null;

  // Allocate resource if available
  if (matchedResource) {
    matchedResource.state = "OCCUPIED";
    matchedResource.patient = `${topPatient.name} (ID: #${topPatient.id})`;
  }

  // Remove patient from queue
  appState.patients = appState.patients.filter(p => p.id !== topPatient.id);

  // Append dispatch logs to Terminal
  const terminal = document.getElementById("cpp-terminal-content");
  const timestamp = new Date().toLocaleTimeString();

  const logEntry = `
<div class="pt-3 border-t border-slate-800 text-slate-300">
  <div class="text-amber-400 font-bold">[${timestamp}] >>> OPTION 4 DISPATCH: HIGHEST PRIORITY PATIENT ALLOCATED</div>
  <div class="text-slate-400 pl-3">
    --------------------------------------------------------<br>
    Patient ID         : #${topPatient.id}<br>
    Patient Name       : <span class="text-white font-bold">${topPatient.name}</span><br>
    Blood Group        : <span class="text-rose-400 font-bold">${topPatient.bloodGroup}</span><br>
    Priority Score     : <span class="text-emerald-400 font-bold">${topPatient.score} pts</span> (Elapsed Wait: ${topPatient.waitFormatted})<br>
    Required Unit      : ${topPatient.requiredResource}<br>
    --------------------------------------------------------<br>
    Resource Allocation: <span class="${matchedResource ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">${matchedResource ? `${matchedResource.label} (ID: ${matchedResource.id}) [ALLOCATED]` : 'NO BEDS CURRENTLY AVAILABLE (WAITLISTED)'}</span><br>
    Blood Donor Match  : <span class="${bestDonor ? 'text-sky-400 font-bold' : 'text-amber-400'}">${bestDonor ? `${bestDonor.name} (${bestDonor.bloodGroup}, ${bestDonor.distance}km away, ${bestDonor.phone}) [NOTIFIED]` : 'NO COMPATIBLE DONOR NEARBY'}</span><br>
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
// 7. Blood Donor Matching & Registration Engine
// -------------------------------------------------------------

// Interactive Toast Notification
function showToastNotification(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `p-3 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2 pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 ${
    type === "success"
      ? "bg-slate-900 text-white border-emerald-500 shadow-emerald-500/30"
      : "bg-slate-900 text-white border-sky-500 shadow-sky-500/30"
  }`;

  toast.innerHTML = `
    <i class="fas ${type === "success" ? "fa-circle-check text-emerald-400" : "fa-bell text-sky-400"} text-base"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger enter animation
  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Find compatible donors sorted strictly by:
// 1. Availability (Available Now first)
// 2. Exact Match first (e.g. A+ for an A+ patient)
// 3. Nearest Distance in km (closest first)
function performDonorMatch(userClicked = false) {
  const bloodSelect = document.getElementById("matcher-patient-blood");
  if (!bloodSelect) return;
  const targetBlood = bloodSelect.value;

  // Filter for strictly compatible donors
  const compatibleDonors = appState.donors.filter(d => isCompatible(d.bloodGroup, targetBlood));

  // Smart clinical sorting:
  // Available first -> Exact Match first -> Nearest Distance first
  compatibleDonors.sort((a, b) => {
    // 1. Availability first
    if (a.available !== b.available) return a.available ? -1 : 1;
    // 2. Exact match first
    const aExact = (a.bloodGroup === targetBlood);
    const bExact = (b.bloodGroup === targetBlood);
    if (aExact !== bExact) return aExact ? -1 : 1;
    // 3. Nearest distance first
    return a.distance - b.distance;
  });

  const spotlightContainer = document.getElementById("matcher-top-spotlight");
  const listContainer = document.getElementById("matcher-results-list");

  if (!spotlightContainer || !listContainer) return;

  if (compatibleDonors.length === 0) {
    spotlightContainer.innerHTML = `
      <div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
        <i class="fas fa-triangle-exclamation text-xl text-rose-500 mb-1 block"></i>
        <h5 class="font-bold text-xs">No Compatible Donors Available for Group ${targetBlood}</h5>
        <p class="text-[11px] text-rose-600 mt-0.5">Please register new volunteer blood donors below or notify regional blood banks.</p>
      </div>`;
    listContainer.innerHTML = `<span class="text-xs text-slate-400">No other donors found.</span>`;
    return;
  }

  // The #1 Top Nearest & Most Compatible Donor
  const topDonor = compatibleDonors[0];
  const isTopExact = (topDonor.bloodGroup === targetBlood);
  const isTopUniversal = (topDonor.bloodGroup === "O-");

  let topBadge = isTopExact
    ? `<span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><i class="fas fa-check-double mr-1 text-emerald-600"></i>EXACT MATCH (${topDonor.bloodGroup})</span>`
    : (isTopUniversal
        ? `<span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300"><i class="fas fa-star mr-1 text-sky-600"></i>UNIVERSAL DONOR (O-)</span>`
        : `<span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300"><i class="fas fa-check mr-1 text-indigo-600"></i>COMPATIBLE (${topDonor.bloodGroup})</span>`);

  spotlightContainer.innerHTML = `
    <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-500 shadow-md space-y-3 relative overflow-hidden transition-all duration-300">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            <i class="fas fa-crown text-[10px] text-amber-300"></i>
          </span>
          <span class="text-xs font-black uppercase tracking-wider text-emerald-900">Top Recommended Nearest Donor</span>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${topDonor.available ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'}">
          ${topDonor.available ? '● Ready for Immediate Dispatch' : 'On-Call'}
        </span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="text-base font-black text-slate-900">${topDonor.name}</h4>
            <span class="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">${topDonor.id}</span>
            ${topBadge}
          </div>
          <div class="flex items-center gap-3 text-xs mt-1.5 flex-wrap font-semibold text-slate-600">
            <span class="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <i class="fas fa-location-dot mr-1"></i>${topDonor.distance} km away (Closest)
            </span>
            <span class="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              <i class="fas fa-phone mr-1 text-emerald-600"></i>${topDonor.phone}
            </span>
            <span class="text-slate-500 text-[11px]">
              Last Donated: <strong>${topDonor.lastDonation}</strong>
            </span>
          </div>
        </div>

        <button onclick="requestDonorDispatch('${topDonor.id}')" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-2 self-start sm:self-center whitespace-nowrap">
          <i class="fas fa-ambulance text-amber-300 text-sm"></i>
          <span>Dispatch Nearest Donor</span>
        </button>
      </div>
    </div>`;

  // Other compatible donors (index 1 and beyond)
  const otherDonors = compatibleDonors.slice(1);
  if (otherDonors.length === 0) {
    listContainer.innerHTML = `
      <div class="p-3 text-center text-slate-400 bg-slate-50 rounded-lg text-xs">
        No other compatible donors found in the network.
      </div>`;
  } else {
    listContainer.innerHTML = otherDonors.map((d) => {
      const isExact = (d.bloodGroup === targetBlood);
      const isUniversal = (d.bloodGroup === "O-");

      let badge = isExact
        ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Exact (${d.bloodGroup})</span>`
        : (isUniversal
            ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Universal (O-)</span>`
            : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Compatible (${d.bloodGroup})</span>`);

      return `
        <div class="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-slate-900">${d.name}</span>
              <span class="font-mono text-[10px] text-slate-400">${d.id}</span>
              ${badge}
              <span class="px-2 py-0.2 rounded-full text-[9px] font-bold ${d.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                ${d.available ? 'Available' : 'On-Call'}
              </span>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
              <span class="font-semibold text-slate-700"><i class="fas fa-location-dot mr-1 text-rose-500"></i>${d.distance} km</span>
              <span><i class="fas fa-phone mr-1 text-slate-400"></i>${d.phone}</span>
            </div>
          </div>
          <button onclick="requestDonorDispatch('${d.id}')" class="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold border border-slate-200 text-[11px] transition flex items-center gap-1 self-end sm:self-center">
            <i class="fas fa-paper-plane text-xs"></i>
            <span>Request</span>
          </button>
        </div>`;
    }).join("");
  }

  // Interactive Toast confirmation when explicitly clicked
  if (userClicked) {
    showToastNotification(`Nearest Donor Found: ${topDonor.name} (${topDonor.bloodGroup}) at ${topDonor.distance} km away!`, "success");
  }
}

// Register a new volunteer blood donor
function handleDonorRegistration(event) {
  event.preventDefault();
  const name = document.getElementById("new-donor-name").value.trim();
  const bloodGroup = document.getElementById("new-donor-blood").value;
  const distance = parseFloat(document.getElementById("new-donor-distance").value) || 3.0;
  const phone = document.getElementById("new-donor-phone").value.trim() || "+91 98765 43210";

  const newDonor = {
    id: "D" + (100 + appState.donors.length + 1),
    name,
    bloodGroup,
    distance,
    phone,
    lastDonation: new Date().toISOString().split("T")[0],
    available: true
  };

  // Add to top of donor list
  appState.donors.unshift(newDonor);
  saveDonorsToStorage();
  renderAll();
  performDonorMatch();

  // Reset form
  document.getElementById("new-donor-name").value = "";
  document.getElementById("new-donor-distance").value = "4.5";
  alert(`Success: Volunteer donor '${name}' (${bloodGroup}, ${distance} km) enrolled into Blood Bank!`);
}

function requestDonorDispatch(donorId) {
  const d = appState.donors.find(item => item.id === donorId);
  if (!d) return;

  const terminal = document.getElementById("cpp-terminal-content");
  const timestamp = new Date().toLocaleTimeString();

  const logEntry = `
<div class="pt-2 border-t border-slate-800 text-slate-300">
  <div class="text-sky-400 font-bold">[${timestamp}] >>> DIRECT BLOOD DONOR DISPATCH REQUEST</div>
  <div class="text-slate-400 pl-3">
    Donor ID      : ${d.id}<br>
    Donor Name    : <span class="text-white font-bold">${d.name}</span><br>
    Blood Group   : <span class="text-rose-400 font-bold">${d.bloodGroup}</span><br>
    Proximity     : ${d.distance} km away<br>
    Contact Phone : ${d.phone}<br>
    Status        : <span class="text-emerald-400 font-bold">Automated Notification SMS Sent</span>
  </div>
</div>`;

  if (terminal) {
    terminal.innerHTML += logEntry;
    terminal.scrollTop = terminal.scrollHeight;
  }

  alert(`Blood Dispatch Request sent to ${d.name} (${d.bloodGroup}) at ${d.phone}!\nDonor is ${d.distance} km away.`);
}

function toggleDonorAvailability(donorId) {
  const d = appState.donors.find(item => item.id === donorId);
  if (d) {
    d.available = !d.available;
    saveDonorsToStorage();
    renderAll();
    performDonorMatch();
  }
}

// -------------------------------------------------------------
// 8. Storage & Persistence
// -------------------------------------------------------------
function saveDonorsToStorage() {
  try {
    localStorage.setItem("hopeline_registered_donors", JSON.stringify(appState.donors));
  } catch (e) {
    console.warn("localStorage write failed:", e);
  }
}

function loadDonorsFromStorage() {
  try {
    const saved = localStorage.getItem("hopeline_registered_donors");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("localStorage read failed:", e);
  }
  return null;
}

// -------------------------------------------------------------
// 9. Master Rendering Engine
// -------------------------------------------------------------

// Render priority queue table & binary heap visualizer (runs every second)
function renderQueueOnly() {
  const queueContainer = document.getElementById("patient-heap-container");
  const arrayContainer = document.getElementById("heap-array-visualizer");
  if (!queueContainer) return;

  if (appState.patients.length === 0) {
    queueContainer.innerHTML = `
      <div class="text-center py-10 text-slate-400">
        <i class="fas fa-check-circle text-3xl text-emerald-400 mb-2 block"></i>
        <p class="font-bold text-slate-700 text-sm">Emergency Queue Empty</p>
        <p class="text-xs text-slate-400">All emergency patients have been triaged and allocated beds.</p>
      </div>`;
    if (arrayContainer) arrayContainer.innerHTML = `<span class="text-xs text-slate-400">Queue empty</span>`;
    return;
  }

  // Calculate dynamic scores and sort Max-Heap descending
  const ranked = [...appState.patients].map(p => ({
    ...p,
    waitMinutes: getPatientWaitMinutes(p),
    waitFormatted: getPatientWaitFormatted(p),
    score: getPatientScore(p)
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

    const waitAgingPts = Math.min(Math.floor(p.waitMinutes / 5), 10) * 2;

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
            <div class="text-[11px] text-slate-500 mt-1 flex gap-3 flex-wrap items-center">
              <span>Age: <strong>${p.age}</strong></span>
              <span>Unit: <strong class="text-sky-700">${p.requiredResource}</strong></span>
              <span>Severity: <strong>${p.severity}/10</strong></span>
              <span>Risk: <strong>${p.risk}/10</strong></span>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                <i class="fas fa-stopwatch mr-1 text-amber-500"></i>Wait: <strong>${p.waitFormatted}</strong> (+${waitAgingPts} pts)
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end md:self-center">
          <button onclick="simulateWait(${p.id}, 5)" title="Fast-forward wait time by 5 minutes to test aging formula" class="px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition">
            +5m Aging
          </button>
          <button onclick="deletePatient(${p.id})" title="Delete patient from queue" class="px-2 py-1 text-xs text-slate-400 hover:text-rose-600 transition">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join("");

  // Render Binary Heap Array Visualizer
  if (arrayContainer) {
    arrayContainer.innerHTML = ranked.map((p, i) => `
      <div class="p-2 rounded bg-slate-100 border border-slate-200 text-center min-w-[70px]">
        <span class="text-[9px] text-slate-400 block font-mono">Rank #${i + 1}</span>
        <span class="text-xs font-black text-sky-700 font-mono">${p.score}</span>
        <span class="text-[9px] text-slate-500 block truncate max-w-[65px]">${p.name.split(" ")[0]}</span>
      </div>
    `).join("");
  }
}

function renderAll() {
  // Update header counters
  const availICU = appState.resources.filter(r => r.type === "ICU" && r.state === "AVAILABLE").length;
  const availGen = appState.resources.filter(r => r.type === "General" && r.state === "AVAILABLE").length;
  const availO2 = appState.resources.filter(r => r.type === "Oxygen" && r.state === "AVAILABLE").length;

  const countQueue = document.getElementById("stat-queue-count");
  if (countQueue) countQueue.innerText = appState.patients.length;
  const countICU = document.getElementById("stat-icu-count");
  if (countICU) countICU.innerText = `${availICU} / 5`;
  const countGen = document.getElementById("stat-gen-count");
  if (countGen) countGen.innerText = `${availGen} / 5`;
  const countO2 = document.getElementById("stat-o2-count");
  if (countO2) countO2.innerText = `${availO2} / 5`;

  // Render Queue List & Heap Array
  renderQueueOnly();

  // Render Ward Beds Grid
  const bedsGrid = document.getElementById("hospital-beds-grid");
  if (bedsGrid) {
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
  }

  // Render Donors Directory Table
  const donorsTable = document.getElementById("donors-table-rows");
  if (donorsTable) {
    donorsTable.innerHTML = appState.donors.map(d => `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="py-2.5 px-3 font-mono font-bold text-slate-700">${d.id}</td>
        <td class="py-2.5 px-3 font-semibold text-slate-900">${d.name}</td>
        <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200">${d.bloodGroup}</span></td>
        <td class="py-2.5 px-3 font-mono font-semibold text-rose-600">${d.distance} km</td>
        <td class="py-2.5 px-3 font-mono text-slate-600">${d.phone || '+91 98765 00000'}</td>
        <td class="py-2.5 px-3 text-slate-500">${d.lastDonation}</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${d.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
            ${d.available ? 'Ready' : 'On-Call'}
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
}

function resetToSampleData() {
  const storedDonors = loadDonorsFromStorage();
  appState = JSON.parse(JSON.stringify(INITIAL_DATA));
  if (storedDonors) {
    appState.donors = storedDonors;
  }
  appState.nextPatientId = 104;
  renderAll();
  performDonorMatch();
}

// -------------------------------------------------------------
// 10. Startup Initialization
// -------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  resetToSampleData();
  updateLiveScorePreview();
  performDonorMatch();

  // Real-time ticking queue timer (updates waiting time and priority every 1 second)
  setInterval(() => {
    if (appState.patients && appState.patients.length > 0) {
      renderQueueOnly();
    }
  }, 1000);
});
