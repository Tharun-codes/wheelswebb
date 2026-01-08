
console.log("Used Car Loan JS loaded");

// Auto values
document.getElementById("loanId").value = Date.now();
document.getElementById("dateTime").value = new Date().toLocaleString();

// MFG dropdowns
const mfgMonth = document.getElementById("mfgMonth");
const mfgYear = document.getElementById("mfgYear");
const vehicleAgeInput = document.getElementById("vehicleAge");

if (mfgMonth) {
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  monthNames.forEach((name, index) => {
    const opt = document.createElement("option");
    const monthNumber = String(index + 1).padStart(2, "0");
    opt.value = monthNumber;
    opt.textContent = `${monthNumber} - ${name}`;
    mfgMonth.appendChild(opt);
  });
}

if (mfgYear) {
  for (let y = 2010; y <= 2030; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    mfgYear.appendChild(opt);
  }
}

function updateVehicleAge() {
  if (!mfgMonth || !mfgYear || !vehicleAgeInput) return;
  const monthVal = Number(mfgMonth.value);
  const yearVal = Number(mfgYear.value);

  if (!monthVal || !yearVal) {
    vehicleAgeInput.value = "";
    return;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let monthsDiff = (currentYear - yearVal) * 12 + (currentMonth - monthVal);

  if (monthsDiff < 0) {
    vehicleAgeInput.value = "Invalid";
    return;
  }

  const years = Math.floor(monthsDiff / 12);
  const months = monthsDiff % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? "s" : ""}`);
  vehicleAgeInput.value = parts.length ? parts.join(" ") : "Current Month";
}

function updateInsuranceValidity() {
  if (!motorInsuranceExpiry || !motorInsuranceValidity) return;
  const expiryValue = motorInsuranceExpiry.value;
  if (!expiryValue) {
    motorInsuranceValidity.value = "";
    return;
  }

  const expiryDate = new Date(expiryValue);
  const today = new Date();
  expiryDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = expiryDate - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays)) {
    motorInsuranceValidity.value = "";
    return;
  }

  motorInsuranceValidity.value = `${diffDays} day${Math.abs(diffDays) === 1 ? "" : "s"}`;
}

if (motorInsuranceExpiry) {
  motorInsuranceExpiry.addEventListener("change", updateInsuranceValidity);
  updateInsuranceValidity();
}

if (mfgMonth && mfgYear) {
  mfgMonth.addEventListener("change", updateVehicleAge);
  mfgYear.addEventListener("change", updateVehicleAge);
}

// Loan tenure dropdown (01 to 96 months)
const loanTenure = document.getElementById("loanTenure");
const emiPaid = document.getElementById("emiPaid");
for (let t = 1; t <= 96; t++) {
  const padded = String(t).padStart(2, "0");
  if (loanTenure) {
    const opt = document.createElement("option");
    opt.value = padded;
    opt.textContent = padded;
    loanTenure.appendChild(opt);
  }
  if (emiPaid) {
    const opt2 = document.createElement("option");
    opt2.value = padded;
    opt2.textContent = padded;
    emiPaid.appendChild(opt2);
  }
}

// Show BT-specific fields when type is BT Topup or Int BT
const loanTypeSelect = document.getElementById("loanType");
const btFields = document.getElementById("btFields");
const btInputs = document.querySelectorAll("[data-bt-required='true']");
const dsaSelect = document.getElementById("loanDsa");
const dsaCodeField = document.getElementById("dsaCodeField");
const dsaCodeInput = document.getElementById("loanDsaCode");
const maritalStatus = document.getElementById("MaritalStatus");
const spouseNameField = document.getElementById("spouseNameField");
const spouseNameInput = document.getElementById("spouseName");
const addAltNoBtn = document.getElementById("addAltNoBtn");
const extraAltMobile = document.getElementById("extraAltMobile");
const cibilDisplay = document.getElementById("cibilDisplay");
const cibilPromptBtn = document.getElementById("cibilPromptBtn");
const cibilScoreInput = document.getElementById("cibilScore");
const cibilIndicatorInput = document.getElementById("cibilIndicator");
const cibilColorButtons = document.querySelectorAll(".cibil-color-btn");
const cibilToggleBtn = document.getElementById("cibilToggleBtn");
const cibilDetailsSection = document.getElementById("cibilDetails");
const motorInsuranceFields = document.getElementById("motorInsuranceFields");

function updateCibilDisplay(score) {
  if (!cibilDisplay) return;
  if (score) {
    cibilDisplay.textContent = `Score: ${score}`;
  } else {
    cibilDisplay.textContent = "Not Entered";
  }
}

function setCibilIndicator(color) {
  if (!cibilDisplay || !cibilIndicatorInput) return;
  cibilDisplay.classList.remove("red", "yellow", "green");
  cibilColorButtons.forEach((btn) => btn.classList.remove("active"));
  if (color) {
    cibilDisplay.classList.add(color);
    cibilIndicatorInput.value = color;
    const activeBtn = Array.from(cibilColorButtons).find(
      (btn) => btn.dataset.color === color
    );
    if (activeBtn) activeBtn.classList.add("active");
  } else {
    cibilIndicatorInput.value = "";
  }
}

if (cibilPromptBtn && cibilScoreInput) {
  cibilPromptBtn.addEventListener("click", () => {
    const current = cibilScoreInput.value || "";
    const value = prompt("Enter CIBIL Score", current);
    if (value === null) return;
    const trimmed = value.trim();
    cibilScoreInput.value = trimmed;
    updateCibilDisplay(trimmed);
  });
  updateCibilDisplay(cibilScoreInput.value);
}

if (cibilColorButtons.length) {
  cibilColorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      setCibilIndicator(color);
    });
  });
  setCibilIndicator(cibilIndicatorInput?.value || "");
}

if (cibilToggleBtn && cibilDetailsSection) {
  const updateToggleUi = () => {
    const isOpen = !cibilDetailsSection.classList.contains("hidden");
    cibilToggleBtn.setAttribute("aria-expanded", isOpen);
    cibilToggleBtn.textContent = isOpen ? "−" : "+";
    cibilToggleBtn.classList.toggle("plus-state", !isOpen);
    cibilToggleBtn.classList.toggle("minus-state", isOpen);
  };

  cibilToggleBtn.addEventListener("click", () => {
    cibilDetailsSection.classList.toggle("hidden");
    updateToggleUi();
  });

  updateToggleUi();
}

function toggleBtFields() {
  const isBt =
    loanTypeSelect &&
    (loanTypeSelect.value === "BT Topup" || loanTypeSelect.value === "Int BT");
  if (btFields) {
    btFields.classList.toggle("hidden", !isBt);
  }
  btInputs.forEach((input) => {
    input.required = !!isBt;
    if (!isBt) input.value = "";
  });
}

if (loanTypeSelect) {
  loanTypeSelect.addEventListener("change", toggleBtFields);
  toggleBtFields();
}

function toggleDsaCode() {
  const showCode = dsaSelect && dsaSelect.value === "Others";
  if (dsaCodeField) {
    dsaCodeField.classList.toggle("hidden", !showCode);
  }
  if (dsaCodeInput) {
    dsaCodeInput.required = !!showCode;
    if (!showCode) dsaCodeInput.value = "";
  }
}

if (dsaSelect) {
  dsaSelect.addEventListener("change", toggleDsaCode);
  toggleDsaCode();
}

function toggleSpouseField() {
  const needsSpouse = maritalStatus && maritalStatus.value === "Married";
  if (spouseNameField) {
    spouseNameField.classList.toggle("hidden", !needsSpouse);
  }
  if (spouseNameInput) {
    spouseNameInput.required = !!needsSpouse;
    if (!needsSpouse) spouseNameInput.value = "";
  }
}

if (maritalStatus) {
  maritalStatus.addEventListener("change", toggleSpouseField);
  toggleSpouseField();
}

if (addAltNoBtn && extraAltMobile) {
  addAltNoBtn.addEventListener("click", () => {
    const isHidden = extraAltMobile.classList.contains("hidden");
    extraAltMobile.classList.toggle("hidden", !isHidden);
    const nowHidden = extraAltMobile.classList.contains("hidden");
    addAltNoBtn.textContent = nowHidden ? "+" : "−";
    addAltNoBtn.classList.toggle("plus-state", nowHidden);
    addAltNoBtn.classList.toggle("minus-state", !nowHidden);
    addAltNoBtn.setAttribute(
      "aria-label",
      nowHidden ? "Add alternate number" : "Remove alternate number"
    );
    if (isHidden) {
      extraAltMobile.focus();
    } else {
      extraAltMobile.value = "";
    }
  });
}

// Copy Permanent = Current
const copyPermanentCheckbox = document.getElementById("copyPermanentFromCurrent");
const currentAddressFields = {
  proof: document.getElementById("currentAddressProof"),
  landmark: document.getElementById("currentLandmark"),
  pincode: document.getElementById("currentPincode"),
  relation: document.getElementById("currentOhpRelation")
};
const permanentAddressFields = {
  proof: document.getElementById("permanentAddressProof"),
  landmark: document.getElementById("permanentLandmark"),
  pincode: document.getElementById("permanentPincode"),
  relation: document.getElementById("permanentOhpRelation")
};

let savedPermanentValues = null;

function copyFromCurrent() {
  permanentAddressFields.proof.value = currentAddressFields.proof.value;
  permanentAddressFields.landmark.value = currentAddressFields.landmark.value;
  permanentAddressFields.pincode.value = currentAddressFields.pincode.value;
  permanentAddressFields.relation.value = currentAddressFields.relation.value;
}

function clearPermanent() {
  permanentAddressFields.proof.value = "";
  permanentAddressFields.landmark.value = "";
  permanentAddressFields.pincode.value = "";
  permanentAddressFields.relation.value = "";
}

if (copyPermanentCheckbox) {
  copyPermanentCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      savedPermanentValues = {
        proof: permanentAddressFields.proof.value,
        landmark: permanentAddressFields.landmark.value,
        pincode: permanentAddressFields.pincode.value,
        relation: permanentAddressFields.relation.value
      };
      copyFromCurrent();
    } else {
      if (savedPermanentValues) {
        permanentAddressFields.proof.value = savedPermanentValues.proof;
        permanentAddressFields.landmark.value = savedPermanentValues.landmark;
        permanentAddressFields.pincode.value = savedPermanentValues.pincode;
        permanentAddressFields.relation.value = savedPermanentValues.relation;
      } else {
        clearPermanent();
      }
      savedPermanentValues = null;
    }
  });
}

// Disbursed Logic
const loanStage = document.getElementById("loanStage");
const disbursedFields = document.getElementById("disbursedFields");
const disbursedTenure = document.getElementById("disbursedTenure");
const disbursedEmiDate = document.getElementById("disbursedEmiDate");

// Populate Disbursed Tenure (1-96)
if (disbursedTenure) {
  for (let i = 1; i <= 96; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    disbursedTenure.appendChild(opt);
  }
}

// Populate Disbursed EMI Date (1-31)
if (disbursedEmiDate) {
  for (let i = 1; i <= 31; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    disbursedEmiDate.appendChild(opt);
  }
}

// Toggle Disbursed Fields
const utrFields = document.getElementById("utrFields");
const addPaymentBtn = document.getElementById("addPaymentBtn");
const removePaymentBtn = document.getElementById("removePaymentBtn");
const paymentContainer = document.getElementById("paymentContainer");
let paymentCount = 0;
const MAX_PAYMENTS = 5;

function toggleDisbursedFields() {
  if (loanStage && disbursedFields) {
    const isDisbursed = loanStage.value === "Disbursed";
    disbursedFields.classList.toggle("hidden", !isDisbursed);
    
    // Toggle UTR fields
    if (utrFields) {
      utrFields.classList.toggle("hidden", !isDisbursed);
      
      // Auto-fill UTR Date if Disbursed and empty
      const utrDateInput = document.getElementById("utrDate1");
      if (isDisbursed && utrDateInput && !utrDateInput.value) {
         const today = new Date().toISOString().split('T')[0];
         utrDateInput.value = today;
      }
    }

    if (motorInsuranceFields) {
      motorInsuranceFields.classList.toggle("hidden", !isDisbursed);
    }

    // Toggle required for disbursed fields if necessary
    const requiredInputs = disbursedFields.querySelectorAll("input:not([readonly]), select");
    requiredInputs.forEach(input => {
      input.required = isDisbursed;
    });

    // Auto-fill Date if Disbursed and empty
    const disbursedDateInput = document.getElementById("disbursedDate");
    if (isDisbursed && disbursedDateInput && !disbursedDateInput.value) {
      const today = new Date().toISOString().split('T')[0];
      disbursedDateInput.value = today;
    }
  }
}

// Payment Add/Remove Logic
if (addPaymentBtn && removePaymentBtn && paymentContainer) {
  addPaymentBtn.addEventListener("click", () => {
    if (paymentCount >= MAX_PAYMENTS) return;
    
    paymentCount++;
    const newBlock = createPaymentBlock(paymentCount);
    paymentContainer.appendChild(newBlock);
    updatePaymentButtons();
  });
  
  removePaymentBtn.addEventListener("click", () => {
    if (paymentCount <= 0) return;
    
    const blockToRemove = document.getElementById(`paymentBlock${paymentCount}`);
    if (blockToRemove) {
      blockToRemove.remove();
      paymentCount--;
    }
    
    updatePaymentButtons();
  });
}

function createPaymentBlock(index) {
  const block = document.createElement("div");
  block.className = "payment-block";
  block.id = `paymentBlock${index}`;
  block.style.marginTop = index === 1 ? "0" : "20px";
  block.style.borderTop = index === 1 ? "none" : "1px solid #eee";
  block.style.paddingTop = index === 1 ? "0" : "15px";
  block.innerHTML = `
      <h4 style="margin-bottom: 10px; color: #555;">Payment ${index}</h4>
      <div class="grid">
        <input id="utrDate${index}" type="date" title="DATE" />
        <input id="utrAmount${index}" type="number" placeholder="AMOUNT" />
        <input id="utrNo${index}" placeholder="UTR NO" data-uppercase />
        <input id="utrAcHolderName${index}" placeholder="AC HOLDER NAME" data-uppercase />
        <input id="utrBankName${index}" placeholder="BANK NAME" data-uppercase />
        <input id="utrAcNo${index}" placeholder="AC NO" />
        <input id="utrIfsc${index}" placeholder="IFSC" data-uppercase />
        <input id="utrRemarks${index}" placeholder="REMARKS" />
      </div>
    `;

  const dateInput = block.querySelector(`#utrDate${index}`);
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  return block;
}

function updatePaymentButtons() {
  if (!removePaymentBtn || !addPaymentBtn) return;
  
  // Show remove button if at least 1 payment
  removePaymentBtn.classList.toggle("hidden", paymentCount <= 0);
  
  // Disable/Hide add button if max reached (optional, or just disable)
  if (paymentCount >= MAX_PAYMENTS) {
    addPaymentBtn.disabled = true;
    addPaymentBtn.style.opacity = "0.5";
    addPaymentBtn.style.cursor = "not-allowed";
  } else {
    addPaymentBtn.disabled = false;
    addPaymentBtn.style.opacity = "1";
    addPaymentBtn.style.cursor = "pointer";
  }
}

if (loanStage) {
  loanStage.addEventListener("change", toggleDisbursedFields);
  toggleDisbursedFields(); // Run on load
}

// Auto Calculations
const calcFields = {
  sanction: document.getElementById("disbursedSanctionLoanAmount"),
  loanIns: document.getElementById("disbursedLoanInsuranceCharges"),
  motorIns: document.getElementById("disbursedMotorInsurance"),
  pf: document.getElementById("disbursedPfCharges"),
  doc: document.getElementById("disbursedDocumentationCharges"),
  other: document.getElementById("disbursedOtherCharges"),
  rto: document.getElementById("disbursedRtoCharges"),
  challan: document.getElementById("disbursedChallanFineCharges"),
  total: document.getElementById("disbursedTotalLoanAmount"),
  net: document.getElementById("disbursedNetLoanAmount")
};

function calculateDisbursedAmounts() {
  const getVal = (el) => Number(el?.value) || 0;

  const sanction = getVal(calcFields.sanction);
  const loanIns = getVal(calcFields.loanIns);
  const motorIns = getVal(calcFields.motorIns);
  
  // Total Loan Amount = Sanction + Loan Ins + Motor Ins
  if (calcFields.total) {
    calcFields.total.value = sanction + loanIns + motorIns;
  }

  const pf = getVal(calcFields.pf);
  const doc = getVal(calcFields.doc);
  const other = getVal(calcFields.other);
  const rto = getVal(calcFields.rto);
  const challan = getVal(calcFields.challan);

  // Net Loan Amount = Sanction - PF - Doc - Other - RTO - Challan
  if (calcFields.net) {
    calcFields.net.value = sanction - pf - doc - other - rto - challan;
  }
}

// Attach listeners
Object.values(calcFields).forEach(el => {
  if (el && !el.readOnly) {
    el.addEventListener("input", calculateDisbursedAmounts);
  }
});

// Submit
document.getElementById("leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Session expired. Please login again.");
    window.location.href = "/index.html";
    return;
  }

  const leadData = {};
  document.querySelectorAll("input, select, textarea").forEach(el => {
    // For the hidden RTO Docs input, we ensure we get the value
    if (el.type !== 'submit' && el.id) {
       leadData[el.id] = el.value;
    }
  });

  leadData.loanType = "New Car Loan";
  leadData.userId = user.id;
  leadData.role = user.role;

  console.log("Submitting new car loan with user:", { userId: user.id, role: user.role });

  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData)
  });

  if (res.ok) {
    window.location.href = "/view-cases.html";
  } else {
    const errorData = await res.json();
    alert(`Failed to save lead: ${errorData.error || 'Unknown error'}`);
  }
});

// --- RTO Documents Multi-Select Logic ---
const rtoOptions = [
  "RC CARD",
  "INSURANCE",
  "FORM SET 29/30",
  "FORM 34",
  "EMMISION COPY",
  "CC",
  "FORCLOSURE LETTER",
  "LOAN CLOSURE PROOF",
  "B-EXTRACT",
  "NOC",
  "SELLER KYC",
  "PAYMENT (D/A) KYC"
];

const rtoDisplay = document.getElementById("rtoDocsDisplay");
const rtoDropdown = document.getElementById("rtoDocsDropdown");
const rtoHiddenInput = document.getElementById("disbursedRtoDocs");
let selectedRtoDocs = [];

function renderRtoDropdown() {
  if (!rtoDropdown) return;
  rtoDropdown.innerHTML = "";
  rtoOptions.forEach(opt => {
    const div = document.createElement("div");
    div.className = "multi-select-option";
    if (selectedRtoDocs.includes(opt)) {
      div.classList.add("selected");
    }
    div.textContent = opt;
    div.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent closing dropdown
      toggleRtoOption(opt);
    });
    rtoDropdown.appendChild(div);
  });
}

function updateRtoDisplay() {
  if (!rtoDisplay) return;
  rtoDisplay.innerHTML = "";
  
  if (selectedRtoDocs.length === 0) {
    rtoDisplay.innerHTML = '<span class="multi-select-placeholder">Select RTO Documents...</span>';
  } else {
    selectedRtoDocs.forEach(opt => {
      const tag = document.createElement("span");
      tag.className = "multi-select-tag";
      tag.textContent = opt;
      // Optional: Add a remove 'x'
      const removeBtn = document.createElement("span");
      removeBtn.textContent = "×";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.marginLeft = "4px";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleRtoOption(opt);
      });
      tag.appendChild(removeBtn);
      rtoDisplay.appendChild(tag);
    });
  }
  
  // Update hidden input
  if (rtoHiddenInput) {
    rtoHiddenInput.value = selectedRtoDocs.join(", ");
  }
}

function toggleRtoOption(opt) {
  if (selectedRtoDocs.includes(opt)) {
    selectedRtoDocs = selectedRtoDocs.filter(item => item !== opt);
  } else {
    selectedRtoDocs.push(opt);
  }
  renderRtoDropdown();
  updateRtoDisplay();
}

// Initialize
if (rtoDisplay && rtoDropdown) {
  renderRtoDropdown();
  
  rtoDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    rtoDropdown.classList.toggle("active");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!rtoDisplay.contains(e.target) && !rtoDropdown.contains(e.target)) {
      rtoDropdown.classList.remove("active");
    }
  });
}