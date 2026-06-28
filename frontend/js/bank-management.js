// Bank Management JS Module
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "admin") {
  alert("Admin access only");
  window.location.href = "/dashboard.html";
}

let allBanks = [];
let selectedBankId = null;
let editingBankId = null; // null for create mode, number for edit mode

// Toast message handler
function showToast(msg, timeout = 3000) {
  const t = document.getElementById("toast");
  if (!t) return alert(msg);
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), timeout);
}

// Load all banks from backend
async function fetchBanks() {
  try {
    const res = await fetch("/api/banks", {
      headers: { "x-admin-id": user.id }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to load banks");
    }
    allBanks = await res.json();
    renderBankList();
  } catch (err) {
    console.error("Error loading banks:", err);
    showToast(err.message || "Failed to load banks");
  }
}

// Render the banks list in left panel
function renderBankList(filter = "") {
  const listEl = document.getElementById("bankList");
  listEl.innerHTML = "";

  const term = filter.trim().toLowerCase();
  const filtered = allBanks.filter(b =>
    b.bank_name.toLowerCase().includes(term)
  );

  if (filtered.length === 0) {
    listEl.innerHTML = `<li class="pane-placeholder" style="min-height: unset; padding: 20px;">No banks found</li>`;
    return;
  }

  filtered.forEach(b => {
    const li = document.createElement("li");
    li.className = `bank-item ${selectedBankId === b.id ? "active" : ""}`;
    li.innerHTML = `
      <span>${escapeHtml(b.bank_name)}</span>
      <span style="font-size: 11px; opacity: 0.6;">id: ${b.id}</span>
    `;
    li.addEventListener("click", () => selectBank(b.id));
    listEl.appendChild(li);
  });
}

// Select a bank and render its branch details on the right panel
async function selectBank(bankId) {
  selectedBankId = bankId;
  renderBankList(document.getElementById("bankSearch").value);

  const detailsPane = document.getElementById("detailsPane");
  detailsPane.innerHTML = `
    <div class="pane-placeholder">
      <p>Loading bank details...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/banks/${bankId}`, {
      headers: { "x-admin-id": user.id }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to load bank details");
    }
    const bankDetails = await res.json();
    renderBankDetails(bankDetails);
  } catch (err) {
    console.error("Error loading bank details:", err);
    detailsPane.innerHTML = `
      <div class="pane-placeholder">
        <div class="icon" style="color: var(--error)">⚠️</div>
        <p>${escapeHtml(err.message || "Failed to load details")}</p>
      </div>
    `;
  }
}

// Render bank details in the right pane
function renderBankDetails(bank) {
  const detailsPane = document.getElementById("detailsPane");

  let branchesHtml = "";
  if (!bank.branches || bank.branches.length === 0) {
    branchesHtml = `
      <div class="pane-placeholder" style="min-height: 200px; border: 1px dashed var(--border); border-radius: 8px;">
        <p>No branches added to this bank yet.</p>
      </div>
    `;
  } else {
    branchesHtml = `
      <div class="branch-grid">
        ${bank.branches.map(br => `
          <div class="branch-card">
            <div class="branch-name">${escapeHtml(br.branch_name)}</div>
            <div class="branch-geo">📍 Geo Limit: <strong>${Number(br.geo_limit)} KM</strong></div>
            <div class="branch-loan" style="font-size: 13px; color: var(--muted); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
              💼 Loan: <strong>${br.loan_assigned ? escapeHtml(br.loan_assigned) : "None"}</strong>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  detailsPane.innerHTML = `
    <div class="pane-header">
      <div>
        <h2>${escapeHtml(bank.bank_name)}</h2>
        <div style="font-size: 12px; color: var(--muted); margin-top: 4px;">Created at: ${new Date(bank.created_at).toLocaleString()}</div>
      </div>
      <div class="pane-header-actions">
        <button class="action-btn" id="editBankBtn">Edit Bank</button>
        <button class="action-btn danger" id="deleteBankBtn">Delete Bank</button>
      </div>
    </div>
    
    <div>
      <div class="branch-list-title">Branches (${bank.branches ? bank.branches.length : 0})</div>
      ${branchesHtml}
    </div>
  `;

  // Attach button events
  document.getElementById("editBankBtn").addEventListener("click", () => openModal(bank));
  document.getElementById("deleteBankBtn").addEventListener("click", () => confirmDeleteBank(bank));
}

// Open modal for create or edit bank
function openModal(bank = null) {
  const backdrop = document.getElementById("bankModalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const bankNameInput = document.getElementById("modalBankName");
  const branchInputList = document.getElementById("branchInputList");

  branchInputList.innerHTML = "";

  if (bank) {
    // Edit mode
    editingBankId = bank.id;
    modalTitle.textContent = "Edit Bank";
    bankNameInput.value = bank.bank_name;

    if (bank.branches && bank.branches.length > 0) {
      bank.branches.forEach(br => {
        addBranchInputRow(br.branch_name, br.geo_limit, br.loan_assigned);
      });
    } else {
      addBranchInputRow();
    }
  } else {
    // Create mode
    editingBankId = null;
    modalTitle.textContent = "Create New Bank";
    bankNameInput.value = "";
    addBranchInputRow(); // Start with one empty branch row
  }

  backdrop.classList.add("show");
}

// Close the modal
function closeModal() {
  const backdrop = document.getElementById("bankModalBackdrop");
  backdrop.classList.remove("show");
}

// Add a row to branch input list in modal
function addBranchInputRow(branchName = "", geoLimit = "", loanAssigned = "") {
  const list = document.getElementById("branchInputList");
  const row = document.createElement("div");
  row.className = "branch-input-row";
  row.innerHTML = `
    <input type="text" class="branch-name-input" placeholder="Branch Name" value="${escapeHtml(branchName)}" required />
    <input type="text" class="branch-loan-input" placeholder="Loan Assigned" value="${escapeHtml(loanAssigned)}" />
    <input type="number" class="branch-geo-input" placeholder="GEO Limit (KM)" min="1" step="any" value="${geoLimit}" required />
    <button type="button" class="remove-branch-btn" title="Remove Branch">🗑️</button>
  `;

  row.querySelector(".remove-branch-btn").addEventListener("click", () => {
    // Keep at least one branch input row
    if (list.children.length > 1) {
      row.remove();
    } else {
      showToast("A bank must have at least one branch");
    }
  });

  list.appendChild(row);
}

// Submit modal data (Create or Update bank)
async function submitModal() {
  const bankNameInput = document.getElementById("modalBankName");
  const bankName = bankNameInput.value.trim();

  if (!bankName) {
    showToast("Bank Name is required");
    bankNameInput.focus();
    return;
  }

  // Client-side duplicate check against current list (case-insensitive)
  const isDuplicate = allBanks.some(b =>
    b.bank_name.toLowerCase() === bankName.toLowerCase() && b.id !== editingBankId
  );
  if (isDuplicate) {
    showToast("Bank already exists with this name");
    bankNameInput.focus();
    return;
  }

  const branchRows = document.querySelectorAll(".branch-input-row");
  const branches = [];

  for (let i = 0; i < branchRows.length; i++) {
    const row = branchRows[i];
    const nameVal = row.querySelector(".branch-name-input").value.trim();
    const loanVal = row.querySelector(".branch-loan-input").value.trim();
    const geoVal = row.querySelector(".branch-geo-input").value.trim();

    if (!nameVal) {
      showToast(`Branch Name is required at row ${i + 1}`);
      row.querySelector(".branch-name-input").focus();
      return;
    }

    const limit = Number(geoVal);
    if (!geoVal || isNaN(limit) || limit <= 0) {
      showToast(`GEO Limit must be a number greater than zero at row ${i + 1}`);
      row.querySelector(".branch-geo-input").focus();
      return;
    }

    branches.push({
      branchName: nameVal,
      geoLimit: limit,
      loanAssigned: loanVal
    });
  }

  const payload = { bankName, branches };
  const method = editingBankId ? "PUT" : "POST";
  const url = editingBankId ? `/api/banks/${editingBankId}` : "/api/banks";

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-id": user.id
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save bank");
    }

    const responseData = await res.json();
    showToast(editingBankId ? "Bank updated successfully!" : "Bank created successfully!");
    closeModal();

    // Refresh bank list and keep or select the bank
    await fetchBanks();

    if (editingBankId) {
      selectBank(editingBankId);
    } else if (responseData.bankId) {
      selectBank(responseData.bankId);
    } else {
      resetDetailsPane();
    }
  } catch (err) {
    console.error("Error saving bank:", err);
    showToast(err.message || "Failed to save bank");
  }
}

// Confirm and delete a bank
async function confirmDeleteBank(bank) {
  const confirmMsg = `Are you sure you want to delete "${bank.bank_name}" and all of its ${bank.branches ? bank.branches.length : 0} branches? This action cannot be undone.`;
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`/api/banks/${bank.id}`, {
      method: "DELETE",
      headers: { "x-admin-id": user.id }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete bank");
    }

    showToast("Bank deleted successfully!");
    selectedBankId = null;
    resetDetailsPane();
    await fetchBanks();
  } catch (err) {
    console.error("Error deleting bank:", err);
    showToast(err.message || "Failed to delete bank");
  }
}

// Reset right details pane to default placeholder
function resetDetailsPane() {
  const detailsPane = document.getElementById("detailsPane");
  detailsPane.innerHTML = `
    <div class="pane-placeholder">
      <div class="icon">🏦</div>
      <p>Select a bank from the left panel to view its branch details</p>
    </div>
  `;
}

// Utility to escape HTML and prevent XSS
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialise page on load
document.addEventListener("DOMContentLoaded", () => {
  // Load banks list
  fetchBanks();

  // Attach search filter
  document.getElementById("bankSearch").addEventListener("input", (e) => {
    renderBankList(e.target.value);
  });

  // Attach create button event
  document.getElementById("openCreateBtn").addEventListener("click", () => openModal(null));

  // Attach modal controls
  document.getElementById("modalCancel").addEventListener("click", closeModal);
  document.getElementById("modalSubmit").addEventListener("click", submitModal);
  document.getElementById("addBranchBtn").addEventListener("click", () => addBranchInputRow());

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    const backdrop = document.getElementById("bankModalBackdrop");
    if (e.target === backdrop) {
      closeModal();
    }
  });
});
