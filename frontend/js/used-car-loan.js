
const urlParams = new URLSearchParams(window.location.search);
const loanId = urlParams.get("loanId");
const isEditMode = !!loanId;

// let user = null;

// try {
//   const raw = localStorage.getItem("user");
//   if (raw) user = JSON.parse(raw);
// } catch {
//   localStorage.removeItem("user");
// }

// if (!user) {
//   window.location.href = "/index.html";
//   throw new Error("Unauthenticated");
// }

// console.log("Used Car Loan JS loaded");

/* =========================
   INPUT VALIDATION & UPPERCASE
========================= */

// Enforce uppercase for inputs with data-uppercase attribute
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

// Restrict to alphabets only (with spaces) for name fields
function enforceAlphabetsOnly() {
  const alphabetInputs = document.querySelectorAll("[data-alphabets]");
  alphabetInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      // Allow only letters, spaces, and common name characters
      e.target.value = e.target.value.replace(/[^A-Za-z\s\.\-]/g, "");
    });
    input.addEventListener("keypress", (e) => {
      // Prevent non-alphabetic characters (except space, period, hyphen)
      const char = String.fromCharCode(e.which);
      if (!/[A-Za-z\s\.\-]/.test(char)) {
        e.preventDefault();
      }
    });
  });
}

// Restrict to numbers only for numeric fields
function enforceNumbersOnly() {
  const numberInputs = document.querySelectorAll("[data-numbers]");
  numberInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      // Remove any non-numeric characters
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    });
    input.addEventListener("keypress", (e) => {
      // Allow only digits
      const char = String.fromCharCode(e.which);
      if (!/[0-9]/.test(char)) {
        e.preventDefault();
      }
    });
  });
}

// Initialize all validations
enforceUppercase();
enforceAlphabetsOnly();
enforceNumbersOnly();

/* =========================
   AUTOMATIC LOAN ID GENERATION
========================= */
function generateLoanId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Get current counter from localStorage or start with 0
  const storageKey = `loanCounter_${year}${month}`;
  let counter = parseInt(localStorage.getItem(storageKey) || '0');
  
  // Generate loan ID: YYYYMM0001 format (don't increment yet)
  const loanId = `${year}${month}${String(counter + 1).padStart(4, '0')}`;
  
  return { loanId, storageKey, counter };
}

function incrementLoanCounter(storageKey, currentCounter) {
  // Only increment when form is actually submitted
  const newCounter = currentCounter + 1;
  localStorage.setItem(storageKey, newCounter.toString());
}

// Set loan ID and initialize form when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Initialize progress tracking
  updateProgress();
  
  // Initialize loan ID
  const loanIdField = document.getElementById('loanId');
    if (loanIdField && !loanId) {   // 👈 do NOT generate when editing
      const { loanId } = generateLoanId();
      loanIdField.value = loanId;

    loanIdField.readOnly = true;
    
    // Add visual indicator that it's auto-generated
    loanIdField.style.backgroundColor = '#f8fafc';
    loanIdField.style.color = '#6b7280';
    loanIdField.title = 'Auto-generated Loan ID - will be finalized on submission';
  }

  // Initialize date/time
  const dateTimeField = document.getElementById("dateTime");
  if (dateTimeField) {
    dateTimeField.value = new Date().toLocaleString();
  }

  // Add input event listeners for progress tracking
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    input.addEventListener('input', updateProgress);
    input.addEventListener('change', updateProgress);
  });

  // Add form validation
  const form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Initialize MFG dropdowns
  const mfgMonth = document.getElementById("mfgMonth");
  const mfgYear = document.getElementById("mfgYear");
  const vehicleAgeInput = document.getElementById("vehicleAge");

  if (mfgMonth) {
    const monthNames = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
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

    const today = new Date();
    const mfgDate = new Date(yearVal, monthVal - 1);
    let age = today.getFullYear() - mfgDate.getFullYear();
    
    if (today.getMonth() < mfgDate.getMonth() || 
        (today.getMonth() === mfgDate.getMonth() && today.getDate() < mfgDate.getDate())) {
      age--;
    }
    
    vehicleAgeInput.value = age + " years";
  }

  // Add event listeners for vehicle age calculation
  if (mfgMonth && mfgYear) {
    mfgMonth.addEventListener("change", updateVehicleAge);
    mfgYear.addEventListener("change", updateVehicleAge);
  }

  // Initialize input validations
  enforceUppercase();
  enforceAlphabetsOnly();
  enforceNumbersOnly();
});

// Progress tracking function
function updateProgress() {
  const requiredFields = document.querySelectorAll('[required]');
  const filledRequiredFields = Array.from(requiredFields).filter(field => {
    if (field.type === 'checkbox') return field.checked;
    return field.value.trim() !== '';
  });
  
  const progress = Math.round((filledRequiredFields.length / requiredFields.length) * 100);
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    progressBar.style.width = progress + '%';
  }
  
  return progress;
}

// Form validation and submission
function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;
  let firstInvalidField = null;
  
  // Clear previous validation states
  requiredFields.forEach(field => {
    field.style.borderColor = '';
  });
  
  // Validate required fields
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.style.borderColor = 'var(--error-color)';
      if (!firstInvalidField) firstInvalidField = field;
    }
  });
  
  if (!isValid) {
    // Show error message
    showError('Please fill in all required fields');
    // Scroll to first invalid field
    if (firstInvalidField) {
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidField.focus();
    }
    return;
  }
  
  // Show loading state
  showLoading();
  
  // Simulate form submission (replace with actual submission logic)
  setTimeout(() => {
    hideLoading();
    showSuccess('Application submitted successfully!');
    // Reset form or redirect as needed
    setTimeout(() => {
      if (confirm('Would you like to submit another application?')) {
        form.reset();
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 2000);
  }, 2000);
}

// UI Helper functions
function showError(message) {
  showNotification(message, 'error');
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: 'var(--border-radius)',
    color: 'white',
    fontWeight: '600',
    zIndex: '1000',
    animation: 'slideIn 0.3s ease-out',
    maxWidth: '400px'
  });
  
  if (type === 'error') {
    notification.style.background = 'var(--error-color)';
  } else if (type === 'success') {
    notification.style.background = 'var(--success-color)';
  } else {
    notification.style.background = 'var(--primary-color)';
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

function showLoading() {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting...';
    submitBtn.classList.add('loading');
  }
  
  // Add loading overlay
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    color: white;
    font-size: 1.2rem;
    font-weight: 600;
  `;
  overlay.innerHTML = '🚗 Processing your application...';
  document.body.appendChild(overlay);
}

function hideLoading() {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = '🚀 Submit Application';
    submitBtn.classList.remove('loading');
  }
  
  // Remove loading overlay
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.remove();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .notification {
    box-shadow: var(--shadow-lg);
  }
  
  .loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
document.head.appendChild(style);

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
const extraAltMobileContainer = document.getElementById("extraAltMobileContainer");
const extraAltMobileInput = document.getElementById("extraAltMobile");
const cibilDisplay = document.getElementById("cibilDisplay");
const cibilPromptBtn = document.getElementById("cibilPromptBtn");
const cibilScoreInput = document.getElementById("cibilScore");
const cibilIndicatorInput = document.getElementById("cibilIndicator");
const cibilColorButtons = document.querySelectorAll(".cibil-color-btn");
const cibilToggleBtn = document.getElementById("cibilToggleBtn");
const cibilDetailsSection = document.getElementById("cibilDetails");
const motorInsuranceFields = document.getElementById("motorInsuranceFields");
const addAdditionalApplicantBtn = document.getElementById("addAdditionalApplicantBtn");
const additionalApplicantsContainer = document.getElementById("additionalApplicantsContainer");
let additionalApplicantCount = 0;
const MAX_ADDITIONAL_APPLICANTS = 2;

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

if (addAltNoBtn && extraAltMobileContainer && extraAltMobileInput) {
  addAltNoBtn.addEventListener("click", () => {
    const isHidden = extraAltMobileContainer.classList.contains("hidden");
    extraAltMobileContainer.classList.toggle("hidden", !isHidden);
    const nowHidden = extraAltMobileContainer.classList.contains("hidden");
    addAltNoBtn.textContent = nowHidden ? "+" : "−";
    addAltNoBtn.classList.toggle("plus-state", nowHidden);
    addAltNoBtn.classList.toggle("minus-state", !nowHidden);
    addAltNoBtn.setAttribute(
      "aria-label",
      nowHidden ? "Add alternate number" : "Remove alternate number"
    );
    if (isHidden) {
      extraAltMobileInput.focus();
    } else {
      extraAltMobileInput.value = "";
    }
  });
}

function createAdditionalApplicantBlock(index) {
  const block = document.createElement("div");
  block.className = "additional-applicant-block";
  block.id = `additionalApplicant${index}`;
  block.innerHTML = `
    <div class="additional-applicant-header">
      <h4>Applicant ${index}</h4>
      <button type="button" class="icon-btn minus-state compact remove-additional-applicant" data-target="${index}" aria-label="Remove applicant ${index}">− Remove</button>
    </div>
     <div class="sub-section">
      <h5>Applicant Profile</h5>

      <div class="grid">

        <div class="form-field">
          <label for="additionalApplicant${index}Type">APPLICANT TYPE *</label>
          <select id="additionalApplicant${index}Type">
            <option value="">APPLICANT TYPE *</option>
            ${index === 3
              ? '<option value="Guarantor">Guarantor</option>'
              : '<option value="Co-Applicant">Co-Applicant</option><option value="Guarantor">Guarantor</option>'}
          </select>
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}Relation">APPLICANT RELATION</label>
          <select id="additionalApplicant${index}Relation">
            <option value="">APPLICANT RELATION</option>
            <option>Spouse</option><option>Father</option><option>Mother</option>
            <option>Brother</option><option>Sister</option>
            <option>Son</option><option>Daughter</option>
            <option>Grand Father</option><option>Grand Mother</option>
            <option>Friend</option><option>Relative</option>
          </select>
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}Name">NAME *</label>
          <input id="additionalApplicant${index}Name" data-uppercase data-alphabets />
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}Gender">GENDER *</label>
          <select id="additionalApplicant${index}Gender">
            <option value="">GENDER *</option>
            <option>Male</option>
            <option>Female</option>
            <option>Rather Not To Say</option>
          </select>
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}Pan">PAN NO</label>
          <input id="additionalApplicant${index}Pan" data-uppercase maxlength="10" />
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}Mobile">MOBILE NO</label>
          <input id="additionalApplicant${index}Mobile" data-numbers maxlength="10" />
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}Email">EMAIL ID</label>
          <input id="additionalApplicant${index}Email" type="email" />
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}MaritalStatus">MARITAL STATUS</label>
          <select id="additionalApplicant${index}MaritalStatus">
            <option value="">MARITAL STATUS</option>
            <option>Single</option>
            <option>Married</option>
            <option>Divorced</option>
          </select>
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}FatherName">FATHER NAME</label>
          <input id="additionalApplicant${index}FatherName" data-uppercase data-alphabets />
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}MotherName">MOTHER NAME</label>
          <input id="additionalApplicant${index}MotherName" data-uppercase data-alphabets />
        </div>

      </div>
    </div>

    <div class="sub-section">
  <h5>Current Address</h5>

  <div class="grid">

    <div class="form-field">
      <label for="additionalApplicant${index}CurrentProof">ADDRESS PROOF *</label>
      <select id="additionalApplicant${index}CurrentProof">
        <option value="">ADDRESS PROOF *</option>
        <option>Aadhaar</option>
        <option>Voter ID</option>
        <option>Gas Bill</option>
        <option>EB Bill</option>
        <option>Tax Paid Receipt</option>
        <option>Rent Agreements</option>
      </select>
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}CurrentLandmark">LAND MARK</label>
      <input
        id="additionalApplicant${index}CurrentLandmark"
        data-uppercase
      />
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}CurrentPincode">PIN CODE</label>
      <input
        id="additionalApplicant${index}CurrentPincode"
        data-numbers
        maxlength="6"
      />
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}CurrentDistrict">DISTRICT</label>
      <input
        id="additionalApplicant${index}CurrentDistrict"
        data-uppercase
        data-alphabets
      />
    </div>

    <div class="form-field hidden" style="grid-column: span 2;">
      <label for="additionalApplicant${index}CurrentPinDropdown">SELECT PIN</label>
      <select id="additionalApplicant${index}CurrentPinDropdown">
        <option value="">Select PIN</option>
      </select>
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}CurrentRelation">OHP OWNER RELATION *</label>
      <select id="additionalApplicant${index}CurrentRelation">
        <option value="">OHP OWNER RELATION *</option>
        <option>SPOUSE</option>
        <option>SELF-OWNED</option>
        <option>PARANTEL</option>
        <option>RENTED</option>
      </select>
    </div>

  </div>
</div>

<div class="sub-section">
  <h5>Permanent Address</h5>

  <div class="grid">

    <div class="form-field">
      <label for="additionalApplicant${index}PermanentProof">ADDRESS PROOF *</label>
      <select id="additionalApplicant${index}PermanentProof">
        <option value="">ADDRESS PROOF *</option>
        <option>Aadhaar</option>
        <option>Voter ID</option>
        <option>Gas Bill</option>
        <option>EB Bill</option>
        <option>Tax Paid Receipt</option>
        <option>Rent Agreements</option>
      </select>
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}PermanentLandmark">LAND MARK</label>
      <input
        id="additionalApplicant${index}PermanentLandmark"
        data-uppercase
      />
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}PermanentPincode">PIN CODE</label>
      <input
        id="additionalApplicant${index}PermanentPincode"
        data-numbers
        maxlength="6"
      />
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}PermanentDistrict">DISTRICT</label>
      <input
        id="additionalApplicant${index}PermanentDistrict"
        data-uppercase
        data-alphabets
      />
    </div>

    <div class="form-field hidden" style="grid-column: span 2;">
      <label for="additionalApplicant${index}PermanentPinDropdown">SELECT PIN</label>
      <select id="additionalApplicant${index}PermanentPinDropdown">
        <option value="">Select PIN</option>
      </select>
    </div>

    <div class="form-field">
      <label for="additionalApplicant${index}PermanentRelation">OHP OWNER RELATION *</label>
      <select id="additionalApplicant${index}PermanentRelation">
        <option value="">OHP OWNER RELATION *</option>
        <option>SPOUSE</option>
        <option>SELF-OWNED</option>
        <option>PARANTEL</option>
        <option>RENTED</option>
      </select>
    </div>

  </div>
</div>


    <div class="sub-section">
  <h5>Employment & Office</h5>

  <div class="grid">

    <div class="form-field">
      <label for="additionalApplicant${index}EmploymentProfile">
        CUSTOMER PROFILE *
      </label>
      <select id="additionalApplicant${index}EmploymentProfile">
        <option value="">CUSTOMER PROFILE *</option>
        <option>Self-Employed</option>
        <option>Salaried</option>
        <option>ITR</option>
        <option>Agriculture</option>
        <option>Pension</option>
      </select>
    </div>

        <div class="form-field">
          <label for="additionalApplicant${index}BusinessName">
            BUSINESS / OFFICE / DESIGNATION NAME
          </label>
          <input
            id="additionalApplicant${index}BusinessName"
            data-uppercase
          />
        </div>

        <div class="form-field">
          <label for="additionalApplicant${index}MonthlyIncome">
            MONTHLY INCOME
          </label>
          <input
            id="additionalApplicant${index}MonthlyIncome"
            type="number"
          />
        </div>

    <div class="form-field">
      <label for="additionalApplicant${index}BusinessProof">
        BUSINESS PROOF *
      </label>
      <select id="additionalApplicant${index}BusinessProof">
        <option value="">BUSINESS PROOF *</option>
        <option>NIP</option>
        <option>Pay slips</option>
        <option>RTC</option>
        <option>GST</option>
        <option>ITR</option>
        <option>License</option>
        <option>Pension Statements</option>
      </select>
    </div>

    <div class="form-field" style="grid-column: span 3;">
      <label for="additionalApplicant${index}OfficeAddress">
        FULL ADDRESS
      </label>
      <textarea
        id="additionalApplicant${index}OfficeAddress"
      ></textarea>
    </div>

  </div>
</div>

  `;
  return block;
}

// Ensure remove button is disabled when any field in the block has a value.
function setupRemoveButtonBehavior(block) {
  if (!block) return;
  const removeBtn = block.querySelector('.remove-additional-applicant');
  if (!removeBtn) return;

  function isBlockEmpty() {
    const fields = Array.from(block.querySelectorAll('input, select, textarea'));
    return !fields.some(f => {
      if (f.type === 'checkbox' || f.type === 'radio') return f.checked;
      return String(f.value || '').trim() !== '';
    });
  }

  function updateRemoveState() {
    const empty = isBlockEmpty();
    removeBtn.disabled = !empty ? true : false;
    removeBtn.style.opacity = empty ? '1' : '0.5';
    removeBtn.style.cursor = empty ? 'pointer' : 'not-allowed';
    removeBtn.setAttribute('aria-disabled', (!empty).toString());
  }

  // Attach listeners to all fields in the block
  const fields = Array.from(block.querySelectorAll('input, select, textarea'));
  fields.forEach(f => {
    f.addEventListener('input', updateRemoveState);
    f.addEventListener('change', updateRemoveState);
  });

  // Initialize state
  updateRemoveState();
}

function isApplicantBlockEmpty(block) {
  if (!block) return true;
  const fields = Array.from(block.querySelectorAll('input, select, textarea'));
  return !fields.some(f => {
    if (f.type === 'checkbox' || f.type === 'radio') return f.checked;
    return String(f.value || '').trim() !== '';
  });
}

function initializeAdditionalApplicants() {
  if (!addAdditionalApplicantBtn || !additionalApplicantsContainer) return;

  addAdditionalApplicantBtn.addEventListener("click", () => {
    if (!additionalApplicantsContainer) return;
    const existingCount = additionalApplicantsContainer.querySelectorAll('.additional-applicant-block').length;
    if (existingCount >= MAX_ADDITIONAL_APPLICANTS) return;

    // Visible applicant numbers should be 2 and 3 (primary applicant is 1)
    const visibleIndex = existingCount + 2;
    const block = createAdditionalApplicantBlock(visibleIndex);
    additionalApplicantsContainer.appendChild(block);
    initAdditionalApplicantPin(visibleIndex);

    // Re-apply validation to dynamically created fields
    enforceUppercase();
    enforceAlphabetsOnly();
    enforceNumbersOnly();

    // Setup remove button behavior (enabled only when block is empty)
    if (typeof setupRemoveButtonBehavior === 'function') setupRemoveButtonBehavior(block);

    const nameInput = block.querySelector("[id$='Name']");
if (nameInput) nameInput.required = false;

    block.scrollIntoView({ behavior: "smooth", block: "center" });

    // Disable add button when max reached
    const newCount = additionalApplicantsContainer.querySelectorAll('.additional-applicant-block').length;
    if (newCount >= MAX_ADDITIONAL_APPLICANTS) {
      addAdditionalApplicantBtn.disabled = true;
      addAdditionalApplicantBtn.style.opacity = '0.5';
      addAdditionalApplicantBtn.style.cursor = 'not-allowed';
    }
  });

  additionalApplicantsContainer.addEventListener("click", (event) => {
    const removeBtn = event.target.closest(".remove-additional-applicant");
    if (!removeBtn) return;
    const block = removeBtn.closest(".additional-applicant-block");
    if (block) {
      // Prevent removal if block contains any entered data
      if (!isApplicantBlockEmpty(block)) {
        alert("Cannot remove applicant: fields contain data. Clear fields to enable removal.");
        return;
      }

      block.remove();

      // Re-enable add button if below max
      const newCount = additionalApplicantsContainer.querySelectorAll('.additional-applicant-block').length;
      if (newCount < MAX_ADDITIONAL_APPLICANTS) {
        addAdditionalApplicantBtn.disabled = false;
        addAdditionalApplicantBtn.style.opacity = '1';
        addAdditionalApplicantBtn.style.cursor = 'pointer';
      }
    }
  });
}

initializeAdditionalApplicants();

// Copy Permanent = Current
const copyPermanentCheckbox = document.getElementById("copyPermanentFromCurrent");
const currentAddressFields = {
  proof: document.getElementById("currentAddressProof"),
  landmark: document.getElementById("currentLandmark"),
  pincode: document.getElementById("currentPincode"),
  district: document.getElementById("currentDistrict"),
  relation: document.getElementById("currentOhpRelation")
};
const permanentAddressFields = {
  proof: document.getElementById("permanentAddressProof"),
  landmark: document.getElementById("permanentLandmark"),
  pincode: document.getElementById("permanentPincode"),
  district: document.getElementById("permanentDistrict"),
  relation: document.getElementById("permanentOhpRelation")
};

let savedPermanentValues = null;

function copyFromCurrent() {
  permanentAddressFields.proof.value = currentAddressFields.proof.value;
  permanentAddressFields.landmark.value = currentAddressFields.landmark.value;
  permanentAddressFields.pincode.value = currentAddressFields.pincode.value;
  if (permanentAddressFields.district && currentAddressFields.district) {
    permanentAddressFields.district.value = currentAddressFields.district.value;
  }
  permanentAddressFields.relation.value = currentAddressFields.relation.value;
}

function clearPermanent() {
  permanentAddressFields.proof.value = "";
  permanentAddressFields.landmark.value = "";
  permanentAddressFields.pincode.value = "";
  if (permanentAddressFields.district) permanentAddressFields.district.value = "";
  permanentAddressFields.relation.value = "";
}

if (copyPermanentCheckbox) {
  copyPermanentCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      savedPermanentValues = {
        proof: permanentAddressFields.proof.value,
        landmark: permanentAddressFields.landmark.value,
        pincode: permanentAddressFields.pincode.value,
        district: permanentAddressFields.district?.value,
        relation: permanentAddressFields.relation.value
      };
      copyFromCurrent();
    } else {
      if (savedPermanentValues) {
        permanentAddressFields.proof.value = savedPermanentValues.proof;
        permanentAddressFields.landmark.value = savedPermanentValues.landmark;
        permanentAddressFields.pincode.value = savedPermanentValues.pincode;
        if (permanentAddressFields.district) permanentAddressFields.district.value = savedPermanentValues.district || "";
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
    
    // Re-apply validation to dynamically created fields
    enforceUppercase();
    enforceAlphabetsOnly();
    enforceNumbersOnly();
    
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
          <h4 style="margin-bottom: 10px; color: #555;">
      Payment ${index}
    </h4>

    <div class="grid">

      <div class="form-field">
        <label for="utrDate${index}">DATE</label>
        <input id="utrDate${index}" type="date" />
      </div>

      <div class="form-field">
        <label for="utrAmount${index}">AMOUNT</label>
        <input
          id="utrAmount${index}"
          type="number"
        />
      </div>

      <div class="form-field">
        <label for="utrNo${index}">UTR NO</label>
        <input
          id="utrNo${index}"
          data-uppercase
        />
      </div>

      <div class="form-field">
        <label for="utrAcHolderName${index}">AC HOLDER NAME</label>
        <input
          id="utrAcHolderName${index}"
          data-uppercase
          data-alphabets
        />
      </div>

      <div class="form-field">
        <label for="utrBankName${index}">BANK NAME</label>
        <input
          id="utrBankName${index}"
          data-uppercase
          data-alphabets
        />
      </div>

      <div class="form-field">
        <label for="utrAcNo${index}">AC NO</label>
        <input
          id="utrAcNo${index}"
          data-numbers
        />
      </div>

      <div class="form-field">
        <label for="utrIfsc${index}">IFSC</label>
        <input
          id="utrIfsc${index}"
          data-uppercase
        />
      </div>

      <div class="form-field">
        <label for="utrRemarks${index}">REMARKS</label>
        <input
          id="utrRemarks${index}"
        />
      </div>

    </div>

    `;

  const dateInput = block.querySelector(`#utrDate${index}`);
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  // Attach listeners to update remove button state when payment fields change
  const inputs = Array.from(block.querySelectorAll('input'));
  inputs.forEach(i => {
    i.addEventListener('input', updatePaymentButtons);
    i.addEventListener('change', updatePaymentButtons);
  });

  return block;
}

function updatePaymentButtons() {
  if (!removePaymentBtn || !addPaymentBtn) return;
  // Show remove button if at least 1 payment
  if (paymentCount <= 0) {
    removePaymentBtn.classList.add('hidden');
  } else {
    removePaymentBtn.classList.remove('hidden');
  }

  // Disable remove button if any payment block has entered data (prevent accidental deletion)
  const anyPaymentHasData = isAnyPaymentHasData();
  removePaymentBtn.disabled = anyPaymentHasData || paymentCount <= 0;
  removePaymentBtn.style.opacity = removePaymentBtn.disabled ? '0.5' : '1';
  removePaymentBtn.style.cursor = removePaymentBtn.disabled ? 'not-allowed' : 'pointer';

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

function isAnyPaymentHasData() {
  const blocks = Array.from(document.querySelectorAll('.payment-block'));
  return blocks.some(block => {
    const inputs = Array.from(block.querySelectorAll('input'));
    return inputs.some(i => {
      // Ignore auto-filled date fields (utrDate...) — only consider other inputs as user-entered data
      if (i.type === 'date' || /utrDate/i.test(i.id)) return false;
      return String(i.value || '').trim() !== '';
    });
  });
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

  if (loanStage && loanStage.value === "Disbursed") {
    toggleDisbursedFields();
  }

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Session expired");
    window.location.href = "/index.html";
    return;
  }

  const leadData = {};
  leadData.userId = user.id;
  leadData.role = user.role;

  // Collect all fields
  document.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.id) leadData[el.id] = el.value;
  });

  // 🚨 decide create or update
  const url = loanId
    ? `/api/leads/${loanId}`    // EDIT
    : `/api/leads`;            // CREATE

  const method = loanId ? "PUT" : "POST";

  console.log("Saving lead", { mode: method, loanId });

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData)
  });

  const result = await res.json();

  if (!res.ok) {
    alert(`Failed to save: ${result.error || "Unknown error"}`);
    return;
  }

  // if new lead, redirect into edit mode
  if (!loanId) {
    window.location.href = `/used-car-loan.html?loanId=${result.loan_id}`;
  } else {
  window.location.href = "/view-cases.html";
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
      e.stopPropagation();
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

  document.addEventListener("click", (e) => {
    if (!rtoDisplay.contains(e.target) && !rtoDropdown.contains(e.target)) {
      rtoDropdown.classList.remove("active");
    }
  });
}

// function disableFormForView() {
//   // disable inputs, textareas and selects
//   document.querySelectorAll('input,textarea,select').forEach(el => {
//     // keep hidden inputs enabled (they may be needed)
//     if (el.type === 'hidden') return;
//     try { el.disabled = true; } catch (e) {}
//     try { el.readOnly = true; } catch (e) {}
//   });

//   // disable other buttons (like add/remove) but keep navigation/back buttons enabled if needed
//   document.querySelectorAll('button').forEach(b => {
//     if (b.type === 'submit') return;
//     // allow any button with data-allow-view attribute to remain enabled
//     if (b.hasAttribute('data-allow-view')) return;
//     b.disabled = true;
//   });
// }






















// =========================
// VIEW / EDIT MODE DETECTION
// =========================

if (loanId) {
  fetch(`/api/leads/${loanId}`)
    .then(res => res.json())
    .then(lead => {
  if (!lead || !lead.data) {
    console.error("Invalid lead response", lead);
    return;
  }
  const data = lead.data;

      // ####
      // =========================
      // ✅ Restore UTR Payments (EDIT)
      // =========================
      if (data && Array.isArray(data.payments)) {
        data.payments.forEach((payment, index) => {
          const block = createPaymentBlock(index + 1);
          paymentContainer.appendChild(block);

          Object.keys(payment).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.value = payment[key];
          });

          paymentCount = index + 1;
        });

        // Re-apply validation to payment blocks
        enforceUppercase();
        enforceAlphabetsOnly();
        enforceNumbersOnly();
        
        updatePaymentButtons();
      }

      // =========================
      // 1️⃣ Restore normal fields
      // =========================
      Object.keys(data).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = data[key];
      });






















      // =========================
      // 2️⃣ Restore CIBIL UI
      // =========================
      updateCibilDisplay(data.cibilScore);
      setCibilIndicator(data.cibilIndicator);
      // =========================
      // 3️⃣ FORCE Disbursed fields to show on edit
      // =========================
      if (loanStage && loanStage.value === "Disbursed") {
        toggleDisbursedFields();
      }

      // =========================
      // 4️⃣ Restore RTO Documents
      // =========================
      if (data.disbursedRtoDocs) {
        selectedRtoDocs = data.disbursedRtoDocs
          .split(",")
          .map(v => v.trim())
          .filter(Boolean);

        renderRtoDropdown();
        updateRtoDisplay();
      }

      // =========================
      // 3️⃣ Restore Additional Applicants
      // =========================








          // =========================
          // 🧩 Rebuild Additional Applicants from flat fields
          // =========================
          if (!data.additionalApplicants) {
            const applicants = [];

            [2, 3].forEach(i => {
              const prefix = `additionalApplicant${i}`;

              // detect if applicant exists by checking name
              if (data[`${prefix}Name`]) {
                const obj = {};

                Object.keys(data).forEach(key => {
                  if (key.startsWith(prefix)) {
                    const cleanKey = key.replace(prefix, "");
                    obj[cleanKey] = data[key];
                  }
                });

                applicants.push(obj);
              }
            });

            if (applicants.length) {
              data.additionalApplicants = applicants;
            }
          }









      if (Array.isArray(data.additionalApplicants)) {
        data.additionalApplicants.forEach((applicant, idx) => {
          if (idx >= MAX_ADDITIONAL_APPLICANTS) return;

          const visibleIndex = idx + 2;
          const block = createAdditionalApplicantBlock(visibleIndex);
          additionalApplicantsContainer.appendChild(block);
          initAdditionalApplicantPin(visibleIndex);









              Object.keys(applicant).forEach(key => {
                const fieldId = `additionalApplicant${visibleIndex}${key}`;
                const el = document.getElementById(fieldId);
                if (el) el.value = applicant[key];
              });














              
          // After populating values, update remove button state
          if (typeof setupRemoveButtonBehavior === 'function') setupRemoveButtonBehavior(block);
          
          // Re-apply validation to additional applicant fields
          enforceUppercase();
          enforceAlphabetsOnly();
          enforceNumbersOnly();
        });

        if (data.additionalApplicants.length >= MAX_ADDITIONAL_APPLICANTS) {
          addAdditionalApplicantBtn.disabled = true;
          addAdditionalApplicantBtn.style.opacity = "0.5";
        }
      }

      // Re-apply validation after all data is restored
      enforceUppercase();
      enforceAlphabetsOnly();
      enforceNumbersOnly();
      
      // Disable form for view mode
      // disableFormForView();
    })
    .catch(err => {
      console.error("Failed to load lead", err);
    });
}


// ####






// ===== PIN ↔ DISTRICT REUSABLE MODULE =====

const PIN_API = "https://api.postalpincode.in";

// simple loader
function setLoading(input, loading) {
  input.style.background = loading ? "#f3f5f8" : "";
}

// debounce helper
function debounce(fn, delay = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function show(el) { el && el.classList.remove("hidden"); }
function hide(el) { el && el.classList.add("hidden"); }

// PIN → District
async function handlePinToDistrict(pinInput, districtInput, dropdown) {
  const pin = pinInput.value.trim();
  if (!/^\d{6}$/.test(pin)) return;

  setLoading(pinInput, true);

  try {
    const res = await fetch(`${PIN_API}/pincode/${pin}`);
    const data = await res.json();

    if (data[0].Status === "Success") {
      districtInput.value = data[0].PostOffice[0].District;
      hide(dropdown);
    } else {
      districtInput.value = "";
      alert("Invalid PIN code");
    }
  } catch (e) {
    console.error("PIN lookup failed", e);
  } finally {
    setLoading(pinInput, false);
  }
}

// District → PIN dropdown
async function handleDistrictToPin(districtInput, pinInput, dropdown) {
  const district = districtInput.value.trim();
  if (!district) return;

  setLoading(districtInput, true);

  try {
    const res = await fetch(`${PIN_API}/postoffice/${district}`);
    const data = await res.json();

    if (data[0].Status !== "Success") {
      hide(dropdown);
      alert("Invalid District");
      return;
    }

    dropdown.innerHTML = `<option value="">Select PIN</option>`;
    data[0].PostOffice.forEach(po => {
      const opt = document.createElement("option");
      opt.value = po.Pincode;
      opt.textContent = `${po.Pincode} – ${po.Name}`;
      dropdown.appendChild(opt);
    });

    show(dropdown);
  } catch (e) {
    console.error("District lookup failed", e);
  } finally {
    setLoading(districtInput, false);
  }
}

// Attach logic to any address block
function initPinDistrict({ pinId, districtId, dropdownId }) {
  const pin = document.getElementById(pinId);
  const district = document.getElementById(districtId);
  const dropdown = document.getElementById(dropdownId);

  if (!pin || !district || !dropdown) return;

  pin.addEventListener(
    "blur",
    debounce(() => handlePinToDistrict(pin, district, dropdown))
  );

  district.addEventListener(
    "blur",
    debounce(() => handleDistrictToPin(district, pin, dropdown))
  );

  dropdown.addEventListener("change", () => {
    if (dropdown.value) {
      pin.value = dropdown.value;
      hide(dropdown);
    }
  });
}

initPinDistrict({
  pinId: "currentPincode",
  districtId: "currentDistrict",
  dropdownId: "currentPinDropdown"
});

initPinDistrict({
  pinId: "permanentPincode",
  districtId: "permanentDistrict",
  dropdownId: "permanentPinDropdown"
});

function initAdditionalApplicantPin(index) {
  initPinDistrict({
    pinId: `additionalApplicant${index}CurrentPincode`,
    districtId: `additionalApplicant${index}CurrentDistrict`,
    dropdownId: `additionalApplicant${index}CurrentPinDropdown`
  });

  initPinDistrict({
    pinId: `additionalApplicant${index}PermanentPincode`,
    districtId: `additionalApplicant${index}PermanentDistrict`,
    dropdownId: `additionalApplicant${index}PermanentPinDropdown`
  });
}
// initAdditionalApplicantPin(visibleIndex);

