const rawUser = localStorage.getItem("user");
const user = rawUser ? JSON.parse(rawUser) : null;

if (!user) {
  window.location.href = "/index.html";
}

// Hide admin navigation options for non-admin users
const adminMenu = document.getElementById("adminUsersMenu");
const assignMenu = document.getElementById("assignEmployeesMenu");

if (user.role === "admin") {
  if (adminMenu) adminMenu.style.display = "block";
  if (assignMenu) assignMenu.style.display = "block";
} else {
  // Hide for employee and manager roles
  if (adminMenu) adminMenu.style.display = "none";
  if (assignMenu) assignMenu.style.display = "none";
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

async function loadDashboard() {
  try {
    const res = await fetch("/api/dashboard");
    if (!res.ok) throw new Error("Dashboard API failed");

    const data = await res.json();

    document.getElementById("totalAmount").innerText =
      Number(data.disbursed_amount || 0).toLocaleString("en-IN");

    document.getElementById("totalCases").innerText =
      data.disbursed_cases || 0;

  } catch (err) {
    console.error(err);
  }
}


async function loadBusinessType() {
  const res = await fetch("/api/dashboard/business-type");
  const data = await res.json();

  const bar = document.getElementById("businessTypeBar");
  bar.innerHTML = "";

  if (!data.length) {
    bar.innerHTML = "<p>No disbursed data</p>";
    return;
  }

  const max = Math.max(...data.map(d => d.count));

  data.forEach(row => {
    const div = document.createElement("div");
    div.className = "bar-fill";
    div.style.width = (row.count / max) * 100 + "%";
    div.textContent = `${row.loan_type} (${row.count})`;
    bar.appendChild(div);
  });
}


loadDashboard();
loadBusinessType();

setInterval(() => {
  loadDashboard();
  loadBusinessType();
}, 5000);


