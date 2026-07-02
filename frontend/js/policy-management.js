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
let currentProductType = "";
let customFieldDefs = []; // field definitions for current bank+product

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
    const res = await fetch("/api/banks", { headers: { "x-admin-id": user.id } });
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
      currentProductType = "";
      customFieldDefs = [];
      renderBankList(document.getElementById("pmBankSearch").value);
      renderRightPanel();
    });
  });
}

// ==================== Render Right Panel ====================
function renderRightPanel() {
  const right = document.getElementById("pmRight");
  right.innerHTML = `
    <div class="pm-right-header">
      <h2>${esc(selectedBankName)}</h2>
      <span class="bank-badge">🏦 ${esc(selectedBankName)}</span>
    </div>

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

    <div id="pmFormArea"></div>
    <div id="pmSavedSection"></div>
  `;

  document.getElementById("pmProductType").addEventListener("change", onProductTypeChange);
  loadSavedPolicies();
}

// ==================== Product Type Change ====================
function onProductTypeChange(e) {
  const type = e.target.value;
  currentProductType = type;
  const formArea = document.getElementById("pmFormArea");
  if (!type) { formArea.innerHTML = ""; return; }
  renderPolicyForm(type);
}

// ==================== Render Policy Form ====================
async function renderPolicyForm(productType) {
  const formArea = document.getElementById("pmFormArea");
  formArea.innerHTML = `<div class="pm-loading"><div class="spinner"></div> Loading form...</div>`;

  // Load custom field definitions for this bank+product type
  try {
    const res = await fetch(`/api/policy-fields?bankId=${selectedBankId}&productType=${encodeURIComponent(productType)}`, {
      headers: { "x-admin-id": user.id }
    });
    customFieldDefs = res.ok ? await res.json() : [];
  } catch { customFieldDefs = []; }

  formArea.innerHTML = `
    <div class="pm-form-area" id="policyForm">
      <div class="pm-form-section-title">📝 Standard Fields — ${esc(productType)}</div>

      <div class="pm-field">
        <label>1. Scheme Name <span class="req">*</span></label>
        <input type="text" id="fSchemeName" placeholder="e.g. Premium Scheme A" />
      </div>
      <div class="pm-field">
        <label>2. Loan Amount (Maximum Amt) <span class="req">*</span></label>
        <input type="number" id="fLoanAmt" placeholder="e.g. 5000000" min="0" />
      </div>
      <div class="pm-field">
        <label>3. Tenure (months) <span class="req">*</span></label>
        <input type="number" id="fTenure" placeholder="e.g. 60" min="1" max="360" />
      </div>
      <div class="pm-field">
        <label>4. OHP <span class="req">*</span></label>
        <select id="fOHP">
          <option value="">-- Select --</option>
          <option value="Applicant">Applicant</option>
          <option value="Co-Applicant">Co-Applicant</option>
          <option value="Guarantor">Guarantor</option>
        </select>
      </div>
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
      <div class="pm-income-extra-item" id="extra-Agri">
        <label>🌾 ACRE (Agri)</label>
        <input type="text" id="fAcre" placeholder="Enter Acre value" />
      </div>
      <div class="pm-income-extra-item" id="extra-ITR">
        <label>📊 ITR Income</label>
        <input type="text" id="fItrIncome" placeholder="Enter ITR Income" />
      </div>
      <div class="pm-income-extra-item" id="extra-Salaried">
        <label>💼 Net Salary (Salaried)</label>
        <input type="text" id="fNetSalary" placeholder="Enter Net Salary" />
      </div>
      <div class="pm-field">
        <label>6. Pan Aadhaar Linked <span class="req">*</span></label>
        <select id="fPanAadhar">
          <option value="">-- Select --</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>
      <div class="pm-field">
        <label>7. Minimum Age <span class="req">*</span></label>
        <input type="number" id="fMinAge" placeholder="e.g. 21" min="18" max="100" />
      </div>
      <div class="pm-field">
        <label>8. Maximum Age <span class="req">*</span></label>
        <input type="number" id="fMaxAge" placeholder="e.g. 65" min="18" max="100" />
      </div>
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
      <div class="pm-field">
        <label>10. ABB (digits) <span class="req">*</span></label>
        <input type="number" id="fABB" placeholder="e.g. 10000" min="0" />
      </div>
      <div class="pm-field">
        <label>11. LTV (%) <span class="req">*</span></label>
        <input type="number" id="fLTV" placeholder="e.g. 80" min="0" max="100" step="0.01" />
      </div>
      <div class="pm-field">
        <label>12. CIBIL Score <span class="req">*</span></label>
        <input type="number" id="fCibil" placeholder="e.g. 700" min="300" max="900" />
      </div>

      <!-- ====== CUSTOM FIELDS SECTION ====== -->
      <div class="cf-section">
        <div class="cf-section-header">
          <div class="cf-section-title">
            <span>🛠️ Custom Fields</span>
            <span class="cf-count-badge" id="cfCountBadge">${customFieldDefs.length}</span>
          </div>
          <button class="cf-add-btn" id="cfAddBtn" type="button">+ Add Field</button>
        </div>

        <!-- Custom field inputs (for filling values) -->
        <div id="cfInputsArea">
          ${renderCustomFieldInputs()}
        </div>

        <!-- Inline Field Builder (hidden by default) -->
        <div class="cf-builder" id="cfBuilder" style="display:none;">
          <div class="cf-builder-title">✏️ New Custom Field</div>
          <div class="cf-builder-grid">
            <div class="pm-field">
              <label>Field Label <span class="req">*</span></label>
              <input type="text" id="cfLabel" placeholder="e.g. Vehicle Year" maxlength="60" />
            </div>
            <div class="pm-field">
              <label>Field Type <span class="req">*</span></label>
              <select id="cfType">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="dropdown">Dropdown</option>
                <option value="date">Date</option>
                <option value="yesno">Yes / No</option>
              </select>
            </div>
            <div class="pm-field">
              <label>Required?</label>
              <select id="cfRequired">
                <option value="false">Optional</option>
                <option value="true">Required</option>
              </select>
            </div>
          </div>
          <!-- Dropdown options (shown only if type=dropdown) -->
          <div class="pm-field" id="cfOptionsRow" style="display:none;">
            <label>Dropdown Options <span style="color:var(--muted);font-weight:400;">(comma separated)</span></label>
            <input type="text" id="cfOptions" placeholder="e.g. Option A, Option B, Option C" />
          </div>
          <div class="cf-builder-actions">
            <button class="pm-btn-reset" id="cfCancelBtn" type="button">Cancel</button>
            <button class="cf-save-field-btn" id="cfSaveFieldBtn" type="button">✅ Add Field</button>
          </div>
        </div>
      </div>

      <hr class="pm-divider" />
      <div class="pm-save-row">
        <button class="pm-btn-reset" id="pmResetBtn" type="button">Reset</button>
        <button class="pm-btn-save" id="pmSaveBtn" type="button">💾 Save Policy</button>
      </div>
    </div>
  `;

  // Income Profile sub-field toggle
  document.getElementById("fIncomeProfile").addEventListener("change", function () {
    const val = this.value;
    ["Agri", "ITR", "Salaried"].forEach(p => {
      const el = document.getElementById(`extra-${p}`);
      if (el) el.classList.toggle("show", val === p);
    });
  });

  // Add Field button
  document.getElementById("cfAddBtn").addEventListener("click", () => {
    document.getElementById("cfBuilder").style.display = "block";
    document.getElementById("cfAddBtn").style.display = "none";
    document.getElementById("cfLabel").focus();
  });

  // Field type → show/hide options row
  document.getElementById("cfType").addEventListener("change", function () {
    document.getElementById("cfOptionsRow").style.display = this.value === "dropdown" ? "block" : "none";
  });

  // Cancel builder
  document.getElementById("cfCancelBtn").addEventListener("click", () => {
    document.getElementById("cfBuilder").style.display = "none";
    document.getElementById("cfAddBtn").style.display = "inline-flex";
    document.getElementById("cfLabel").value = "";
    document.getElementById("cfOptions").value = "";
    document.getElementById("cfType").value = "text";
    document.getElementById("cfRequired").value = "false";
    document.getElementById("cfOptionsRow").style.display = "none";
  });

  // Save custom field definition
  document.getElementById("cfSaveFieldBtn").addEventListener("click", () => saveCustomFieldDef(productType));

  // Save policy
  document.getElementById("pmSaveBtn").addEventListener("click", () => savePolicy(productType));

  // Reset
  document.getElementById("pmResetBtn").addEventListener("click", () => renderPolicyForm(productType));
}

// ==================== Render Custom Field Inputs ====================
function renderCustomFieldInputs() {
  if (customFieldDefs.length === 0) {
    return `<div class="cf-empty">No custom fields yet. Click <strong>+ Add Field</strong> to create one.</div>`;
  }
  return customFieldDefs.map(f => {
    const reqStar = f.is_required ? `<span class="req">*</span>` : `<span style="color:var(--muted);font-size:11px;"> (optional)</span>`;
    let input = "";
    if (f.field_type === "text") {
      input = `<input type="text" class="cf-value-input" data-field-id="${f.id}" data-required="${f.is_required}" placeholder="Enter ${esc(f.field_label)}" />`;
    } else if (f.field_type === "number") {
      input = `<input type="number" class="cf-value-input" data-field-id="${f.id}" data-required="${f.is_required}" placeholder="Enter ${esc(f.field_label)}" />`;
    } else if (f.field_type === "date") {
      input = `<input type="date" class="cf-value-input" data-field-id="${f.id}" data-required="${f.is_required}" />`;
    } else if (f.field_type === "yesno") {
      input = `<select class="cf-value-input" data-field-id="${f.id}" data-required="${f.is_required}">
        <option value="">-- Select --</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>`;
    } else if (f.field_type === "dropdown") {
      const opts = Array.isArray(f.field_options) ? f.field_options : [];
      input = `<select class="cf-value-input" data-field-id="${f.id}" data-required="${f.is_required}">
        <option value="">-- Select --</option>
        ${opts.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join("")}
      </select>`;
    }
    return `
      <div class="cf-field-row">
        <div class="pm-field" style="flex:1;">
          <label>${esc(f.field_label)} ${reqStar}</label>
          ${input}
        </div>
        <button class="cf-del-field-btn" data-id="${f.id}" title="Remove this field">🗑</button>
      </div>
    `;
  }).join("");
}

// ==================== Refresh Custom Field Inputs in DOM ====================
function refreshCustomFieldInputs() {
  const area = document.getElementById("cfInputsArea");
  const badge = document.getElementById("cfCountBadge");
  if (area) area.innerHTML = renderCustomFieldInputs();
  if (badge) badge.textContent = customFieldDefs.length;

  // Re-attach delete listeners
  area?.querySelectorAll(".cf-del-field-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteCustomFieldDef(btn.dataset.id));
  });
}

// ==================== Save Custom Field Definition ====================
async function saveCustomFieldDef(productType) {
  const label = document.getElementById("cfLabel").value.trim();
  const type  = document.getElementById("cfType").value;
  const req   = document.getElementById("cfRequired").value === "true";
  const optsRaw = document.getElementById("cfOptions").value.trim();

  if (!label) { showToast("❌ Field label is required"); return; }
  if (type === "dropdown" && !optsRaw) { showToast("❌ Please enter at least one dropdown option"); return; }

  const options = type === "dropdown"
    ? optsRaw.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const btn = document.getElementById("cfSaveFieldBtn");
  btn.textContent = "Adding...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/policy-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-id": user.id },
      body: JSON.stringify({
        bankId: selectedBankId,
        productType,
        fieldLabel: label,
        fieldType: type,
        fieldOptions: options,
        isRequired: req,
        sortOrder: customFieldDefs.length
      })
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed");
    const newField = await res.json();
    customFieldDefs.push(newField);

    // Hide builder, reset inputs
    document.getElementById("cfBuilder").style.display = "none";
    document.getElementById("cfAddBtn").style.display = "inline-flex";
    document.getElementById("cfLabel").value = "";
    document.getElementById("cfOptions").value = "";
    document.getElementById("cfType").value = "text";
    document.getElementById("cfRequired").value = "false";
    document.getElementById("cfOptionsRow").style.display = "none";

    refreshCustomFieldInputs();
    showToast(`✅ Field "${label}" added!`);
  } catch (err) {
    showToast("❌ " + err.message);
  } finally {
    btn.textContent = "✅ Add Field";
    btn.disabled = false;
  }
}

// ==================== Delete Custom Field Definition ====================
async function deleteCustomFieldDef(fieldId) {
  if (!confirm("Remove this custom field? It will also be removed from future policy forms.")) return;
  try {
    const res = await fetch(`/api/policy-fields/${fieldId}`, {
      method: "DELETE",
      headers: { "x-admin-id": user.id }
    });
    if (!res.ok) throw new Error("Failed");
    customFieldDefs = customFieldDefs.filter(f => String(f.id) !== String(fieldId));
    refreshCustomFieldInputs();
    showToast("✅ Field removed");
  } catch (err) {
    showToast("❌ Failed to remove field");
  }
}

// ==================== Save Policy ====================
async function savePolicy(productType) {
  const v = (id) => document.getElementById(id)?.value?.trim() || "";

  const schemeName = v("fSchemeName");
  const loanAmt    = v("fLoanAmt");
  const tenure     = v("fTenure");
  const ohp        = v("fOHP");
  const panAadhar  = v("fPanAadhar");
  const minAge     = v("fMinAge");
  const maxAge     = v("fMaxAge");
  const applicant  = v("fApplicant");
  const abb        = v("fABB");
  const ltv        = v("fLTV");
  const cibil      = v("fCibil");

  const incomeProfileType = v("fIncomeProfile");
  const incomeProfiles = [];
  if (incomeProfileType) {
    const entry = { type: incomeProfileType };
    if (incomeProfileType === "Agri")     entry.acre      = v("fAcre");
    if (incomeProfileType === "ITR")      entry.itrIncome = v("fItrIncome");
    if (incomeProfileType === "Salaried") entry.netSalary = v("fNetSalary");
    incomeProfiles.push(entry);
  }

  // Collect custom field values
  const customFieldValues = {};
  const cfInputs = document.querySelectorAll(".cf-value-input");
  for (const inp of cfInputs) {
    const fieldId  = inp.dataset.fieldId;
    const required = inp.dataset.required === "true";
    const val      = inp.value?.trim() || "";
    const def      = customFieldDefs.find(f => String(f.id) === String(fieldId));
    if (required && !val) {
      showToast(`❌ "${def?.field_label || "Custom field"}" is required`);
      inp.focus();
      return;
    }
    customFieldValues[fieldId] = val;
  }

  // Standard validation
  if (!schemeName)                            return showToast("❌ Scheme Name is required");
  if (!loanAmt || isNaN(Number(loanAmt)))     return showToast("❌ Loan Amount is required");
  if (!tenure  || isNaN(Number(tenure)))      return showToast("❌ Tenure is required");
  if (!ohp)                                   return showToast("❌ Please select OHP");
  if (!incomeProfileType)                     return showToast("❌ Please select an Income Profile");
  if (incomeProfileType === "Agri"     && !v("fAcre"))      return showToast("❌ ACRE value is required");
  if (incomeProfileType === "ITR"      && !v("fItrIncome")) return showToast("❌ ITR Income is required");
  if (incomeProfileType === "Salaried" && !v("fNetSalary")) return showToast("❌ Net Salary is required");
  if (!panAadhar)                             return showToast("❌ Pan Aadhaar Linked is required");
  if (!minAge)                                return showToast("❌ Minimum Age is required");
  if (!maxAge)                                return showToast("❌ Maximum Age is required");
  if (Number(minAge) >= Number(maxAge))       return showToast("❌ Max Age must be greater than Min Age");
  if (!applicant)                             return showToast("❌ Please select Applicant Type");
  if (!abb)                                   return showToast("❌ ABB is required");
  if (!ltv)                                   return showToast("❌ LTV is required");
  if (!cibil)                                 return showToast("❌ CIBIL Score is required");

  const payload = {
    bankId: selectedBankId, bankName: selectedBankName, productType,
    schemeName, loanAmt: Number(loanAmt), tenure: Number(tenure), ohp,
    incomeProfiles, panAadhar,
    minAge: Number(minAge), maxAge: Number(maxAge),
    applicant, abb: Number(abb), ltv: Number(ltv), cibil: Number(cibil),
    customFieldValues
  };

  try {
    const btn = document.getElementById("pmSaveBtn");
    btn.textContent = "Saving...";
    btn.disabled = true;

    const res = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-id": user.id },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to save policy");

    showToast("✅ Policy saved successfully!");
    document.getElementById("pmProductType").value = "";
    document.getElementById("pmFormArea").innerHTML = "";
    currentProductType = "";
    customFieldDefs = [];
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
    if (!res.ok) throw new Error("Failed");
    const policies = await res.json();
    renderSavedPolicies(policies);
  } catch {
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
      </div>`;
    return;
  }

  const cards = policies.map(p => {
    const incomeStr = Array.isArray(p.income_profiles)
      ? p.income_profiles.map(ip => ip.type).join(", ")
      : (p.income_profiles || "—");

    // Custom fields display
    let customRows = "";
    if (p.custom_field_values && typeof p.custom_field_values === "object") {
      const cfEntries = Object.entries(p.custom_field_values).filter(([, v]) => v);
      if (cfEntries.length > 0) {
        customRows = cfEntries.map(([fid, val]) => {
          // Try to find the label
          const def = customFieldDefs.find(f => String(f.id) === String(fid));
          const label = def ? def.field_label : `Field #${fid}`;
          return `<span>${esc(label)}</span><span class="dv">${esc(val)}</span>`;
        }).join("");
      }
    }

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
          <span>Age</span><span class="dv">${esc(p.min_age)}–${esc(p.max_age)} yrs</span>
          <span>ABB</span><span class="dv">${Number(p.abb || 0).toLocaleString("en-IN")}</span>
          <span>Applicant</span><span class="dv">${esc(p.applicant)}</span>
          <span>PAN-Aadhar</span><span class="dv">${esc(p.pan_aadhar)}</span>
          ${customRows}
        </div>
        <div class="pm-policy-actions">
          <button class="pm-del-btn" data-id="${p.id}">🗑 Delete</button>
        </div>
      </div>`;
  }).join("");

  section.innerHTML = `
    <div class="pm-saved-section">
      <div class="pm-saved-header">
        <span class="pm-saved-title">Saved Policies</span>
        <span class="pm-saved-count">${policies.length}</span>
      </div>
      <div class="pm-policy-cards">${cards}</div>
    </div>`;

  section.querySelectorAll(".pm-del-btn").forEach(btn => {
    btn.addEventListener("click", () => deletePolicy(btn.dataset.id));
  });
}

// ==================== Delete Policy ====================
async function deletePolicy(id) {
  if (!confirm("Delete this policy? This cannot be undone.")) return;
  try {
    const res = await fetch(`/api/policies/${id}`, {
      method: "DELETE", headers: { "x-admin-id": user.id }
    });
    if (!res.ok) throw new Error("Failed");
    showToast("✅ Policy deleted");
    loadSavedPolicies();
  } catch { showToast("❌ Failed to delete"); }
}

// ==================== Init ====================
document.addEventListener("DOMContentLoaded", () => {
  fetchBanks();
  document.getElementById("pmBankSearch").addEventListener("input", e => renderBankList(e.target.value));
});
