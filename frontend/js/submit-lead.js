
document.getElementById("leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Session expired. Please login again.");
    window.location.href = "/index.html";
    return;
  }

  const form = e.target;
  const loanType = form.dataset.loanType;

  const data = {};
  form.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.id) data[el.id] = el.value;
  });

  data.loanType = loanType;
  data.userId = user.id;
  data.role = user.role;

  console.log("Submitting lead with user:", { userId: user.id, role: user.role, loanType });

  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    window.location.href = "/view-cases.html";
  } else {
    const errorData = await res.json();
    alert(`Failed to save lead: ${errorData.error || 'Unknown error'}`);
  }
});

