// ==================== Policy Management JS ====================
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "admin") {
  alert("Admin access only");
  window.location.href = "/dashboard.html";
}

// ---- State ----
let allBanks = [];
let selectedBankId = null;
let selectedBankName = "";

// ---- Toast ----
function showToast(msg, timeout = 3500) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), timeout);
}

// ---- Escape HTML ----
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==================== Fetch Banks ====================
async function fetchBanks() {
  try {
    const res = await fetch("/api/banks", {
      headers: { "x-admin-id": user.id }
    });
    if (!res.ok) throw new Error("Failed to load banks");
    allBanks = await res.json();
    renderBankList();
  } catch (err) {
    document.getElementById("pmBankList").innerHTML =
      `<li style="color:var(--error);padding:16px;font-size:13px;">Failed to load banks</li>`;
  }
}

// ==================== Render Bank List ====================
function renderBankList(filter = "") {
  const list = document.getElementById("pmBankList");
  const term = filter.trim().toLowerCase();
  const filtered = allBanks.filter(b => b.bank_name.toLowerCase().includes(term));

  if (filtered.length === 0) {
    list.innerHTML = `<li style="color:var(--muted);padding:16px;font-size:13px;text-align:center;">No banks found</li>`;
    return;
  }

  list.innerHTML = filtered.map(b => `
    <li class="pm-bank-item ${selectedBankId === b.id ? 'active' : ''}" data-id="${b.id}" data-name="${esc(b.bank_name)}">
      <span class="bank-icon">🏦</span>
      <span>${esc(b.bank_name)}</span>
    </li>
  `).join("");

  list.querySelectorAll(".pm-bank-item").forEach(li => {
    li.addEventListener("click", () => {
      selectedBankId = parseInt(li.dataset.id);
      selectedBankName = li.dataset.name;
      renderBankList(document.getElementById("pmBankSearch").value);
      renderRightPanel();
    });
  });
}

// ==================== Render Right Panel ====================
function renderRightPanel() {
  const right = document.getElementById("pmRight");
  right.innerHTML = `
    <!-- Header -->
    <div class="pm-right-header">
      <h2>${esc(selectedBankName)}</h2>
      <span class="bank-badge">🏦 ${esc(selectedBankName)}</span>
    </div>

    <!-- Product Type -->
    <div class="pm-product-row">
      <label for="pmProductType">Product Type <span style="color:var(--error)">*</span></label>
      <select id="pmProductType">
        <option value="">-- Select Product Type --</option>
        <option value="Repurchase">Repurchase</option>
        <option value="Refinance">Refinance</option>
        <option value="BT Topup">BT Topup</option>
        <option value="Refinance HP">Refinance HP</option>
        <option value="Refinance Without HP">Refinance Without HP</option>
        <option value="Int BT">Int BT</option>
      </select>
    </div>

    <!-- Dynamic Form Area -->
    <div id="pmFormArea"></div>

    <!-- Saved Policies -->
    <div id="pmSavedSection"></div>
  `;

  document.getElementById("pmProductType").addEventListener("change", onProductTypeChange);
  loadSavedPolicies();
}

// ==================== Product Type Change ====================
function onProductTypeChange(e) {
  const type = e.target.value;
  const formArea = document.getElementById("pmFormArea");
  if (!type) {
    formArea.innerHTML = "";
    return;
  }
  renderPolicyForm(type);
}

// ==================== Render Policy Form ====================
function renderPolicyForm(productType) {
  const formArea = document.getElementById("pmFormArea");
  formArea.innerHTML = `
    <div class="pm-form-area" id="policyForm">
      <div class="pm-form-section-title">📝 Policy Details — ${esc(productType)}</div>

      <!-- 1. Scheme Name -->
      <div class="pm-field">
        <label>1. Scheme Name <span class="req">*</span></label>
        <input type="text" id="fSchemeName" placeholder="e.g. Premium Scheme A" />
      </div>

      <!-- 2. Loan Amount (Max) -->
      <div class="pm-field">
        <label>2. Loan Amount (Maximum Amt) <span class="req">*</span></label>
        <input type="number" id="fLoanAmt" placeholder="e.g. 5000000" min="0" />
      </div>

      <!-- 3. Tenure -->
      <div class="pm-field">
        <label>3. Tenure (months) <span class="req">*</span></label>
        <input type="number" id="fTenure" placeholder="e.g. 60" min="1" max="360" />
      </div>

      <!-- 4. OHP -->
      <div class="pm-field">
        <label>4. OHP <span class="req">*</span></label>
        <select id="fOHP">
          <option value="">-- Select --</option>
          <option value="Applicant">Applicant</option>
          <option value="Co-Applicant">Co-Applicant</option>
          <option value="Guarantor">Guarantor</option>
        </select>
      </div>

      <!-- 5. Income Profile -->
      <div class="pm-field">
        <label>5. Income Profile <span class="req">*</span></label>
        <select id="fIncomeProfile">
          <option value="">-- Select Income Profile --</option>
          <option value="Agri">Agri</option>
          <option value="ITR">ITR</option>
          <option value="Self-Employed">Self-Employed</option>
          <option value="Salaried">Salaried</option>
          <option value="NIP">NIP</option>
        </select>
      </div>

      <!-- 5a. Agri → ACRE -->
      <div class="pm-income-extra-item" id="extra-Agri">
        <label>🌾 ACRE (Agri)</label>
        <input type="text" id="fAcre" placeholder="Enter Acre value" />
      </div>

      <!-- 5b. ITR → ITR Income -->
      <div class="pm-income-extra-item" id="extra-ITR">
        <label>📊 ITR Income</label>
        <input type="text" id="fItrIncome" placeholder="Enter ITR Income" />
      </div>

      <!-- 5c. Salaried → Net Salary -->
      <div class="pm-income-extra-item" id="extra-Salaried">
        <label>💼 Net Salary (Salaried)</label>
        <input type="text" id="fNetSalary" placeholder="Enter Net Salary" />
      </div>

      <!-- 6. Pan Aadhaar Linked -->
      <div class="pm-field">
        <label>6. Pan Aadhaar Linked <span class="req">*</span></label>
        <select id="fPanAadhar">
          <option value="">-- Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <!-- 7. Minimum Age -->
      <div class="pm-field">
        <label>7. Minimum Age <span class="req">*</span></label>
        <input type="number" id="fMinAge" placeholder="e.g. 21" min="18" max="100" />
      </div>

      <!-- 8. Maximum Age -->
      <div class="pm-field">
        <label>8. Maximum Age <span class="req">*</span></label>
        <input type="number" id="fMaxAge" placeholder="e.g. 65" min="18" max="100" />
      </div>

      <!-- 9. Applicant Type -->
      <div class="pm-field">
        <label>9. Applicant Type <span class="req">*</span></label>
        <select id="fApplicant">
          <option value="">-- Select --</option>
          <option value="Single Lady">Single Lady</option>
          <option value="Single Gents">Single Gents</option>
          <option value="With Co-Applicant">With Co-Applicant</option>
          <option value="With Guarantor">With Guarantor</option>
        </select>
      </div>

      <!-- 10. ABB -->
      <div class="pm-field">
        <label>10. ABB (digits) <span class="req">*</span></label>
        <input type="number" id="fABB" placeholder="e.g. 10000" min="0" />
      </div>

      <!-- 11. LTV -->
      <div class="pm-field">
        <label>11. LTV (%) <span class="req">*</span></label>
        <input type="number" id="fLTV" placeholder="e.g. 80" min="0" max="100" step="0.01" />
      </div>

      <!-- 12. CIBIL -->
      <div class="pm-field">
        <label>12. CIBIL Score <span class="req">*</span></label>
        <input type="number" id="fCibil" placeholder="e.g. 700" min="300" max="900" />
      </div>

      <hr class="pm-divider" />
      <div class="pm-save-row">
        <button class="pm-btn-reset" id="pmResetBtn" type="button">Reset</button>
        <button class="pm-btn-save" id="pmSaveBtn" type="button">💾 Save Policy</button>
      </div>
    </div>
  `;

  // Income Profile dropdown → show/hide sub-field
  document.getElementById("fIncomeProfile").addEventListener("change", function () {
    const val = this.value;
    ["Agri", "ITR", "Salaried"].forEach(p => {
      const el = document.getElementById(`extra-${p}`);
      if (el) el.classList.toggle("show", val === p);
    });
  });

  // Save btn
  document.getElementById("pmSaveBtn").addEventListener("click", () => savePolicy(productType));

  // Reset btn
  document.getElementById("pmResetBtn").addEventListener("click", () => renderPolicyForm(productType));
}


// ==================== Save Policy ====================
async function savePolicy(productType) {
  const v = (id) => document.getElementById(id)?.value?.trim() || "";

  const schemeName = v("fSchemeName");
  const loanAmt = v("fLoanAmt");
  const tenure = v("fTenure");
  const ohp = v("fOHP");
  const panAadhar = v("fPanAadhar");
  const minAge = v("fMinAge");
  const maxAge = v("fMaxAge");
  const applicant = v("fApplicant");
  const abb = v("fABB");
  const ltv = v("fLTV");
  const cibil = v("fCibil");

  // Collect income profile from dropdown
  const incomeProfileType = v("fIncomeProfile");
  const incomeProfiles = [];
  if (incomeProfileType) {
    const entry = { type: incomeProfileType };
    if (incomeProfileType === "Agri")    entry.acre      = v("fAcre");
    if (incomeProfileType === "ITR")     entry.itrIncome = v("fItrIncome");
    if (incomeProfileType === "Salaried") entry.netSalary = v("fNetSalary");
    incomeProfiles.push(entry);
  }

  // Validation — in field order 1–12
  if (!schemeName)                            return showToast("❌ Scheme Name is required");
  if (!loanAmt || isNaN(Number(loanAmt)))     return showToast("❌ Loan Amount is required and must be a number");
  if (!tenure || isNaN(Number(tenure)))       return showToast("❌ Tenure is required");
  if (!ohp)                                   return showToast("❌ Please select OHP");
  if (!incomeProfileType)                     return showToast("❌ Please select an Income Profile");
  if (incomeProfileType === "Agri"     && !v("fAcre"))      return showToast("❌ ACRE value is required for Agri");
  if (incomeProfileType === "ITR"      && !v("fItrIncome")) return showToast("❌ ITR Income is required for ITR");
  if (incomeProfileType === "Salaried" && !v("fNetSalary")) return showToast("❌ Net Salary is required for Salaried");
  if (!panAadhar)                             return showToast("❌ Pan Aadhaar Linked is required");
  if (!minAge)                                return showToast("❌ Minimum Age is required");
  if (!maxAge)                                return showToast("❌ Maximum Age is required");
  if (Number(minAge) >= Number(maxAge))       return showToast("❌ Maximum Age must be greater than Minimum Age");
  if (!applicant)                             return showToast("❌ Please select Applicant Type");
  if (!abb)                                   return showToast("❌ ABB is required");
  if (!ltv)                                   return showToast("❌ LTV is required");
  if (!cibil)                                 return showToast("❌ CIBIL Score is required");


  const payload = {
    bankId: selectedBankId,
    bankName: selectedBankName,
    productType,
    schemeName,
    loanAmt: Number(loanAmt),
    tenure: Number(tenure),
    ohp,
    incomeProfiles,
    panAadhar,
    minAge: Number(minAge),
    maxAge: Number(maxAge),
    applicant,
    abb: Number(abb),
    ltv: Number(ltv),
    cibil: Number(cibil)
  };

  try {
    const btn = document.getElementById("pmSaveBtn");
    btn.textContent = "Saving...";
    btn.disabled = true;

    const res = await fetch("/api/policies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-id": user.id
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save policy");
    }

    showToast("✅ Policy saved successfully!");
    // Reset product type dropdown and form
    const productSelect = document.getElementById("pmProductType");
    if (productSelect) productSelect.value = "";
    document.getElementById("pmFormArea").innerHTML = "";
    loadSavedPolicies();
  } catch (err) {
    showToast("❌ " + (err.message || "Failed to save policy"));
    const btn = document.getElementById("pmSaveBtn");
    if (btn) { btn.textContent = "💾 Save Policy"; btn.disabled = false; }
  }
}

// ==================== Load Saved Policies ====================
async function loadSavedPolicies() {
  const section = document.getElementById("pmSavedSection");
  if (!section) return;

  section.innerHTML = `<div class="pm-loading"><div class="spinner"></div> Loading policies...</div>`;

  try {
    const res = await fetch(`/api/policies?bankId=${selectedBankId}`, {
      headers: { "x-admin-id": user.id }
    });
    if (!res.ok) throw new Error("Failed to load policies");
    const policies = await res.json();
    renderSavedPolicies(policies);
  } catch (err) {
    section.innerHTML = `<div style="color:var(--error);font-size:13px;padding:12px;">Failed to load policies</div>`;
  }
}

// ==================== Render Saved Policies ====================
function renderSavedPolicies(policies) {
  const section = document.getElementById("pmSavedSection");
  if (!section) return;

  if (policies.length === 0) {
    section.innerHTML = `
      <div class="pm-saved-section">
        <div class="pm-saved-header">
          <span class="pm-saved-title">Saved Policies</span>
          <span class="pm-saved-count">0</span>
        </div>
        <div style="color:var(--muted);font-size:13px;padding:16px;text-align:center;border:1px dashed var(--border);border-radius:10px;">
          No policies created yet for this bank
        </div>
      </div>
    `;
    return;
  }

  const cards = policies.map(p => {
    const incomeStr = Array.isArray(p.income_profiles)
      ? p.income_profiles.map(ip => ip.type).join(", ")
      : (p.income_profiles || "—");

    return `
      <div class="pm-policy-card">
        <div class="pm-policy-card-header">
          <div class="pm-policy-name">${esc(p.scheme_name)}</div>
          <span class="pm-policy-type-badge">${esc(p.product_type)}</span>
        </div>
        <div class="pm-policy-details">
          <span>Max Loan</span><span class="dv">₹${Number(p.loan_amt || 0).toLocaleString("en-IN")}</span>
          <span>Tenure</span><span class="dv">${esc(p.tenure)} months</span>
          <span>OHP</span><span class="dv">${esc(p.ohp)}</span>
          <span>Income</span><span class="dv">${esc(incomeStr)}</span>
          <span>CIBIL</span><span class="dv">${esc(p.cibil)}</span>
          <span>LTV</span><span class="dv">${esc(p.ltv)}%</span>
          <span>Age Range</span><span class="dv">${esc(p.min_age)}–${esc(p.max_age)} yrs</span>
          <span>ABB</span><span class="dv">${Number(p.abb || 0).toLocaleString("en-IN")}</span>
          <span>Applicant</span><span class="dv">${esc(p.applicant)}</span>
          <span>PAN-Aadhar</span><span class="dv">${esc(p.pan_aadhar)}</span>
        </div>
        <div class="pm-policy-actions">
          <button class="pm-del-btn" data-id="${p.id}">🗑 Delete</button>
        </div>
      </div>
    `;
  }).join("");

  section.innerHTML = `
    <div class="pm-saved-section">
      <div class="pm-saved-header">
        <span class="pm-saved-title">Saved Policies</span>
        <span class="pm-saved-count">${policies.length}</span>
      </div>
      <div class="pm-policy-cards">${cards}</div>
    </div>
  `;

  section.querySelectorAll(".pm-del-btn").forEach(btn => {
    btn.addEventListener("click", () => deletePolicy(btn.dataset.id));
  });
}

// ==================== Delete Policy ====================
async function deletePolicy(id) {
  if (!confirm("Delete this policy? This action cannot be undone.")) return;
  try {
    const res = await fetch(`/api/policies/${id}`, {
      method: "DELETE",
      headers: { "x-admin-id": user.id }
    });
    if (!res.ok) throw new Error("Failed to delete policy");
    showToast("✅ Policy deleted");
    loadSavedPolicies();
  } catch (err) {
    showToast("❌ " + (err.message || "Failed to delete"));
  }
}

// ==================== Init ====================
document.addEventListener("DOMContentLoaded", () => {
  fetchBanks();

  document.getElementById("pmBankSearch").addEventListener("input", (e) => {
    renderBankList(e.target.value);
  });
});
