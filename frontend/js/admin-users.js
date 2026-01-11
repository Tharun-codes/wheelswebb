console.log('admin-users.js v2 loaded');
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "admin") {
  alert("Admin access only");
  window.location.href = "/dashboard.html";
}

let allUsers = [];

/* ---------------- TOAST ---------------- */
function showToast(msg, timeout = 3000) {
  const t = document.getElementById("toast");
  if (!t) return alert(msg);
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), timeout);
}

/* ---------------- RENDER USERS ---------------- */
function renderUsers(filter = "") {
  const tbodyAdmins = document.getElementById("adminsTableBody");
  const tbodyManagers = document.getElementById("managersTableBody");
  const tbodyEmployees = document.getElementById("employeesTableBody");

  tbodyAdmins.innerHTML = "";
  tbodyManagers.innerHTML = "";
  tbodyEmployees.innerHTML = "";

  const term = filter.trim().toLowerCase();

  const filtered = allUsers.filter(u => {
    if (!term) return true;
    return (
      (u.username || "").toLowerCase().includes(term) ||
      (u.role || "").toLowerCase().includes(term)
    );
  });

  filtered.forEach(u => {
    const tr = document.createElement("tr");

    const status = u.status || "active";
    const statusClass = status === "active" ? "status-active" : "status-disabled";

    tr.innerHTML = `
      <td>${u.username}</td>
      <td>
        ${u.password ? `<span class="pw-text">••••••••</span><button type="button" class="pw-toggle" title="Show password" aria-label="Show password" style="margin-left:8px">👁️</button>` : '••••••••'}
      </td>
      <td>${formatRole(u.role)}</td>
      <td>
        <span class="status-pill ${statusClass}">
          ${status}
        </span>
      </td>
      <td>${u.last_login ? new Date(u.last_login).toLocaleString() : "-"}</td>
    `;

    // attach password toggle handler when a toggle button exists
    const pwToggle = tr.querySelector('.pw-toggle');
    if (pwToggle) {
      const pwText = tr.querySelector('.pw-text');
      let revealed = false;
      pwToggle.addEventListener('click', () => {
        revealed = !revealed;
        pwText.textContent = revealed ? (u.password || '') : '••••••••';
        pwToggle.innerHTML = revealed ? '🙈' : '👁️';
        pwToggle.title = revealed ? 'Hide password' : 'Show password';
        pwToggle.setAttribute('aria-label', revealed ? 'Hide password' : 'Show password');
      });
    }

    const actionsTd = document.createElement("td");

    const statusBtn = document.createElement("button");
    statusBtn.className = "action-btn";
    statusBtn.textContent = status === "active" ? "Disable" : "Enable";
    statusBtn.addEventListener("click", () => toggleStatus(u.id, status === "active" ? "inactive" : "active"));
    if (u.role === "admin" || u.id === user.id) {
      statusBtn.disabled = true;
      statusBtn.title = "This user cannot be disabled";
    }

    const editBtn = document.createElement("button");
    editBtn.className = "action-btn";
    editBtn.textContent = "Edit";
    editBtn.style.marginLeft = "6px";
    editBtn.addEventListener("click", () => openEdit(u.id));

    const viewBtn = document.createElement("button");
    viewBtn.className = "action-btn";
    viewBtn.textContent = "View";
    viewBtn.style.marginLeft = "6px";

    if (user.role === "admin" && (u.role === "employee" || u.role === "manager")) {
      viewBtn.addEventListener("click", () => viewEmployeeLeads(u.id, u.username, u.role || "employee"));
    } else if (user.role === "manager" && u.id === user.id) {
      viewBtn.addEventListener("click", () => viewEmployeeLeads(u.id, u.username, "manager"));
    } else {
      viewBtn.disabled = true;
      if (u.role === "admin") viewBtn.title = "Cannot view admin leads";
      else if (user.role === "manager" && u.id !== user.id) viewBtn.title = "Manager can only view their own leads";
      else viewBtn.title = "Only admin can view other users' leads";
    }

    const delBtn = document.createElement("button");
    delBtn.className = "action-btn danger";
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "6px";
    if (u.role === "admin") {
      delBtn.disabled = true;
      delBtn.title = "Admin users cannot be deleted";
    } else {
      delBtn.addEventListener("click", () => deleteUser(u.id, u.username, u.role));
    }

    actionsTd.appendChild(statusBtn);
    actionsTd.appendChild(editBtn);
    if (!viewBtn.disabled) actionsTd.appendChild(viewBtn);
    actionsTd.appendChild(delBtn);
    tr.appendChild(actionsTd);

    const role = (u.role || "employee").toLowerCase();
    if (role === "admin") tbodyAdmins.appendChild(tr);
    else if (role === "manager") tbodyManagers.appendChild(tr);
    else tbodyEmployees.appendChild(tr);
  });
}

/* ---------------- VIEW EMPLOYEE/MANAGER LEADS ---------------- */
function viewEmployeeLeads(userId, username, role) {
  // Redirect to view-cases.html with query parameters to filter by user
  window.location.href = `/view-cases.html?userId=${userId}&username=${encodeURIComponent(username)}&role=${role}`;
}

/* ---------------- LOAD USERS ---------------- */
async function loadUsers() {
  try {
    const admin = JSON.parse(localStorage.getItem("user")) || {};
    const res = await fetch("/api/admin/users", {
      headers: { "x-admin-id": admin.id }
    });
    if (!res.ok) throw new Error("Failed to fetch users");

    const users = await res.json();
    allUsers = Array.isArray(users) ? users : [];

    const search = document.getElementById("userSearch");
    renderUsers(search ? search.value : "");
  } catch (err) {
    console.error(err);
    showToast("Failed to load users");
  }
}

/* ---------------- MODAL ---------------- */
function openModal(title) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBackdrop").classList.add("show");
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("show");
  document.getElementById("modalUsername").value = "";
  document.getElementById("modalPassword").value = "";
  document.getElementById("modalRole").value = "employee";
}

function openCreate() {
  openModal("Create User");
}

function openEdit(id) {
  const u = allUsers.find(x => x.id === id);
  if (!u) return showToast("User not found");

  document.getElementById("modalUsername").value = u.username;
  document.getElementById("modalPassword").value = "";
  document.getElementById("modalRole").value = u.role || "employee";
  openModal("Edit User");
}

/* ---------------- CREATE USER ---------------- */
async function submitModal() {
  const username = document.getElementById("modalUsername").value.trim();
  const password = document.getElementById("modalPassword").value;
  const role = document.getElementById("modalRole").value;

  if (!username) return showToast("Username required");
  if (role === "admin") return showToast("Cannot create admin users");

  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    closeModal();
    loadUsers();
    showToast("User created");
  } catch (err) {
    showToast(err.message || "Error creating user");
  }
}

/* ---------------- DELETE USER ---------------- */
async function deleteUser(id, username, role) {
  if (role === "admin") return;

  const typed = prompt(
    `Type the username "${username}" to confirm deletion`
  );

  if (typed !== username) return;

  try {
    const admin = JSON.parse(localStorage.getItem("user"));

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { "x-admin-id": admin.id }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    loadUsers();
    showToast("User deleted");
  } catch (err) {
    showToast(err.message);
  }
}

/* ---------------- TOGGLE STATUS ---------------- */
async function toggleStatus(id, status) {
  try {
    const admin = JSON.parse(localStorage.getItem("user"));

    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-id": admin.id
      },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    loadUsers();
  } catch (err) {
    showToast(err.message);
  }
}

/* ---------------- ROLE FORMAT ---------------- */
function formatRole(role) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  return "Employee";
}

/* ---------------- EVENTS ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("openCreateBtn")?.addEventListener("click", openCreate);
  document.getElementById("modalCancel")?.addEventListener("click", closeModal);
  document.getElementById("modalSubmit")?.addEventListener("click", submitModal);
  document
    .getElementById("userSearch")
    ?.addEventListener("input", e => renderUsers(e.target.value));

  loadUsers();
});
