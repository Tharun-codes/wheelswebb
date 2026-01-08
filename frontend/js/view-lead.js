
const user = JSON.parse(localStorage.getItem("user"));

// Check if admin is viewing another user's leads via query params
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('userId');
const targetUsername = urlParams.get('username');
const targetRole = urlParams.get('role');

// Security: Only admin can view other users' leads, managers can view their own leads
if (user.role !== "admin" && (user.role !== "manager" || targetUserId !== user.id.toString())) {
  alert("Access denied: Only admin can view other users' leads, managers can only view their own leads");
  window.location.href = "/dashboard.html";
}

let allLeads = [];
let filteredLeads = [];
let currentPage = 1;
const paginationEl = document.getElementById("pagination");
const tbody = document.querySelector("#leadsTable tbody");
const searchInput = document.getElementById("searchInput");
const filterStage = document.getElementById("filterStage");
const rowsPerPageSelect = document.getElementById("rowsPerPage");
const refreshBtn = document.getElementById("refreshBtn");
const emptyState = document.getElementById("emptyState");

async function fetchLeads() {
  try {
    let fetchUrl;
    
    if (user.role === "admin" && targetUserId && (targetRole === "employee" || targetRole === "manager")) {
      // Admin viewing specific employee's or manager's leads
      fetchUrl = `/api/leads?userId=${targetUserId}&role=${targetRole}`;
    } else if (user.role === "manager" && targetUserId && targetUserId === user.id.toString()) {
      // Manager viewing their own leads
      fetchUrl = `/api/leads?userId=${targetUserId}&role=${targetRole}`;
    } else {
      // Normal behavior - user viewing their own leads
      fetchUrl = `/api/leads?userId=${user.id}&role=${user.role}`;
    }

    const res = await fetch(fetchUrl);
    const leads = await res.json();
    allLeads = Array.isArray(leads) ? leads : [];
    filteredLeads = allLeads.slice();
    populateStageFilter();
    renderTable();
    
    // Update heading if viewing another user's leads
    if ((user.role === "admin" && targetUserId && (targetRole === "employee" || targetRole === "manager")) ||
        (user.role === "manager" && targetUserId && targetUserId === user.id.toString())) {
      const heading = document.getElementById("pageHeading");
      if (heading) {
        heading.textContent = `Leads created by: ${targetUsername}`;
      }
    }
  } catch (err) {
    console.error("Error loading leads:", err);
  }
}

function populateStageFilter() {
  if (!filterStage) return;
  const stages = new Set(allLeads.map(l => l.data?.loanStage).filter(Boolean));
  // clear except first option
  filterStage.querySelectorAll('option:not(:first-child)').forEach(n => n.remove());
  stages.forEach(stage => {
    const opt = document.createElement("option");
    opt.value = stage;
    opt.textContent = stage;
    filterStage.appendChild(opt);
  });
}

function renderTable() {
  tbody.innerHTML = "";
  const start = (currentPage - 1) * parseInt(rowsPerPageSelect.value);
  const end = start + parseInt(rowsPerPageSelect.value);
  const paginated = filteredLeads.slice(start, end);

  if (paginated.length === 0) {
    emptyState.classList.remove("hidden");
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">No leads found</td></tr>`;
    paginationEl.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  paginated.forEach(lead => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${lead.loan_id}</td>
      <td>${lead.data?.name || '-'}</td>
      <td>${lead.data?.mobile || '-'}</td>
      <td>₹${Number(lead.data?.loanAmount || 0).toLocaleString('en-IN')}</td>
      <td>${lead.data?.dsa || '-'}</td>
      <td>${lead.loanStage}</td>
      <td>${new Date(lead.updated_at).toLocaleString()}</td>
      <td>
        <a href="#" onclick="showDetails(${lead.id})" style="margin-right:8px;">View</a>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredLeads.length / parseInt(rowsPerPageSelect.value));
  let html = "";

  // Previous button
  if (currentPage > 1) {
    html += `<button onclick="changePage(${currentPage - 1})">Previous</button>`;
  }

  // Page info
  html += `<div>Page ${currentPage} of ${totalPages}</div>`;

  // Next button
  if (currentPage < totalPages) {
    html += `<button onclick="changePage(${currentPage + 1})">Next</button>`;
  }

  paginationEl.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderTable();
}

function showDetails(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  const modal = document.getElementById("leadModalBackdrop");
  const content = document.getElementById("modalContent");
  
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div><strong>Loan ID:</strong><br>${lead.loan_id}</div>
      <div><strong>Name:</strong><br>${lead.data?.name || '-'}</div>
      <div><strong>Mobile:</strong><br>${lead.data?.mobile || '-'}</div>
      <div><strong>Loan Amount:</strong><br>₹${Number(lead.data?.loanAmount || 0).toLocaleString('en-IN')}</div>
      <div><strong>DSA/Bank:</strong><br>${lead.data?.dsa || '-'}</div>
      <div><strong>Stage:</strong><br>${lead.loanStage}</div>
      <div><strong>Created:</strong><br>${new Date(lead.created_at).toLocaleString()}</div>
      <div><strong>Updated:</strong><br>${new Date(lead.updated_at).toLocaleString()}</div>
    </div>
  `;
  
  modal.classList.add("show");
}

function closeModal() {
  document.getElementById("leadModalBackdrop").classList.remove("show");
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  refreshBtn?.addEventListener("click", fetchLeads);
  searchInput?.addEventListener("input", () => {
    filteredLeads = allLeads.filter(lead => {
      const search = searchInput.value.toLowerCase();
      return (
        lead.loan_id.toLowerCase().includes(search) ||
        (lead.data?.name || "").toLowerCase().includes(search) ||
        (lead.data?.mobile || "").toLowerCase().includes(search)
      );
    });
    currentPage = 1;
    renderTable();
  });

  filterStage?.addEventListener("change", () => {
    const stage = filterStage.value;
    filteredLeads = stage 
      ? allLeads.filter(lead => lead.loanStage === stage)
      : allLeads.slice();
    currentPage = 1;
    renderTable();
  });

  rowsPerPageSelect?.addEventListener("change", () => {
    currentPage = 1;
    renderTable();
  });

  // Initial load
  fetchLeads();
});
