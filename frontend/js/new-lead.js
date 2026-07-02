
console.log("New Lead JS loaded");

/* =========================
   STEP 1 → STEP 2 FLOW
========================= */
    // viji
document.getElementById("nextBtn").addEventListener("click", () => {
  const loanType = document.getElementById("loanType").value;

  if (!loanType) {
    alert("Please select a loan type");
    return;
  }

  // Only Used Car Loan is available; others are coming soon
  if (loanType !== "used-car-loan") {
    showComingSoon();
    return;
  }

  // Save selected loan type
  localStorage.setItem("loanType", loanType);

  // Redirect to loan-specific page
  window.location.href = `/${loanType}.html`;
});

// Show Coming Soon modal/alert
function showComingSoon() {
  // Remove any existing modal
  const existing = document.getElementById("comingSoonModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "comingSoonModal";
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
    animation: fadeIn 0.2s ease;
  `;
  modal.innerHTML = `
    <div style="
      background: #fff; border-radius: 20px; padding: 48px 40px;
      text-align: center; max-width: 360px; width: 90%;
      box-shadow: 0 25px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
    ">
      <div style="font-size: 56px; margin-bottom: 16px;">🚀</div>
      <h2 style="margin: 0 0 12px; font-size: 26px; color: #1e293b; font-family: Inter, sans-serif;">Coming Soon...</h2>
      <p style="margin: 0 0 28px; color: #64748b; font-size: 15px; font-family: Inter, sans-serif; line-height: 1.6;">
        This loan type is under development.<br>We'll be launching it very soon!
      </p>
      <button onclick="document.getElementById('comingSoonModal').remove()" style="
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff; border: none; border-radius: 12px;
        padding: 14px 36px; font-size: 15px; font-weight: 600;
        cursor: pointer; font-family: Inter, sans-serif;
        transition: transform 0.15s;
      " onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
        OK, Got It!
      </button>
    </div>
    <style>
      @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      @keyframes slideUp { from { transform:translateY(30px); opacity:0 } to { transform:translateY(0); opacity:1 } }
    </style>
  `;
  // Close when clicking backdrop
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
}
/* =========================document.getElementById("nextBtn").addEventListener("click", () => {
  const loanType = document.getElementById("loanType").value;

if (!loanType) {
  alert("Please select loan type");
  return;
}

localStorage.setItem("loanType", loanType);
   AUTO LOAN ID (TEMP)
   Backend will overwrite
========================= */
// document.getElementById("loanId").value = Date.now();  vijvijvijviv

/* =========================
   DATE & TIME
========================= */
// document.getElementById("dateTime").value = new Date().toLocaleString(); vijvivijvj

/* =========================
   MFG YEAR DROPDOWN
========================= */
const mfgYearSelect = document.getElementById("mfgYear");
for (let year = 2010; year <= 2027; year++) {
  const opt = document.createElement("option");
  opt.value = year;
  opt.textContent = year;
  mfgYearSelect.appendChild(opt);
}

/* =========================
   COPY ADDRESS BUTTONS
========================= */
document
  .getElementById("copyCurrentFromPermanent")
  .addEventListener("click", () => {
    document.getElementById("currentAddress").value =
      document.getElementById("permanentAddress").value;
    document.getElementById("currentLandmark").value =
      document.getElementById("permanentLandmark").value;
    document.getElementById("currentCategory").value =
      document.getElementById("permanentCategory").value;
  });

document
  .getElementById("copyOfficeFromPermanent")
  .addEventListener("click", () => {
    document.getElementById("officeAddress").value =
      document.getElementById("permanentAddress").value;
    document.getElementById("officeLandmark").value =
      document.getElementById("permanentLandmark").value;
  });

/* =========================
   FORCE UPPERCASE FOR NAMES
========================= */
function enforceUppercase() {
  const uppercaseInputs = document.querySelectorAll("[data-uppercase]");
  uppercaseInputs.forEach((input) => {
    const toUpper = () => {
      input.value = input.value.toUpperCase();
    };
    input.addEventListener("input", toUpper);
    input.addEventListener("blur", toUpper);
    toUpper();
  });
}

enforceUppercase();

/* =========================
   SUBMIT FORM
========================= */
document.getElementById("leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  /* 🔴 Mandatory fields (as per your requirement) */
  const requiredFields = [
    "type",
    "name",
    "gender",
    "customerProfile",
    "pan",
    "mobile",
    "email",
    "loanAmount",
    "dsa",
    "rcNo",
    "vehicle",
    "vehicleOwnerContact",
    "permanentAddress",
    "permanentLandmark",
    "permanentCategory",
    "officeEmploymentDetail",
    "casedealer"
  ];

  for (let id of requiredFields) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      alert(`Please fill mandatory field`);
      el.focus();
      return;
    }
  }

  /* 📦 Collect all form data */
  const leadData = {};
  document
    .querySelectorAll("#leadForm input, #leadForm select, #leadForm textarea")
    .forEach((el) => {
      leadData[el.id] = el.value;
    });

  /* =========================
     STEP 4: ADD STEP-1 DATA
  ========================= */
  leadData.loanType = localStorage.getItem("loanType");

  /* =========================
     STEP 5: ADD USER DATA
  ========================= */
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Session expired. Please login again.");
    window.location.href = "/index.html";
    return;
  }
  
  leadData.userId = user.id;
  leadData.role = user.role;

  console.log("Submitting lead with user:", { userId: user.id, role: user.role });

  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(`Failed to save lead: ${errorData.error || 'Unknown error'}`);
      return;
    }

    // success → go to My Leads
    window.location.href = "/view-cases.html";
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});





