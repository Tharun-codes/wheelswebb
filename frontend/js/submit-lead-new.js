// Submit Lead JavaScript - Uses shared form structure
let additionalApplicantCount = 0;

// Load shared form structure
async function loadSharedForm() {
  try {
    const response = await fetch('/shared-lead-form.html');
    const formHTML = await response.text();
    document.getElementById('leadFormContainer').innerHTML = formHTML;
    
    // Initialize form
    initializeForm();
    
    // Check if editing existing lead
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('loanId');
    if (loanId) {
      await loadExistingLead(loanId);
    }
  } catch (error) {
    console.error('Error loading shared form:', error);
    alert('Error loading form structure');
  }
}

// Initialize form functionality
function initializeForm() {
  // Generate loan ID and date/time
  generateLoanId();
  setDateTime();
  
  // Setup event listeners
  setupEventListeners();
  
  // Populate dropdowns
  populateDropdowns();
  
  // Hide actions section (not needed in submit mode)
  const actionsSection = document.getElementById('actionsSection');
  if (actionsSection) {
    actionsSection.style.display = 'none';
  }
}

// Generate loan ID
function generateLoanId() {
  const loanIdField = document.getElementById('loanId');
  if (loanIdField && !loanIdField.value) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    loanIdField.value = `${timestamp}${random}`;
  }
}

// Set current date and time
function setDateTime() {
  const dateTimeField = document.getElementById('dateTime');
  if (dateTimeField && !dateTimeField.value) {
    const now = new Date();
    dateTimeField.value = now.toLocaleString('en-IN');
  }
}

// Setup all event listeners
function setupEventListeners() {
  // Form submission
  const form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  // Loan nature change (show/hide BT fields)
  const loanNature = document.getElementById('loanNature');
  if (loanNature) {
    loanNature.addEventListener('change', toggleBTFields);
  }
  
  // Marital status change (show/hide spouse name)
  const maritalStatus = document.getElementById('MaritalStatus');
  if (maritalStatus) {
    maritalStatus.addEventListener('change', toggleSpouseName);
  }
  
  // Add alternate mobile button
  const addAltBtn = document.getElementById('addAltNoBtn');
  if (addAltBtn) {
    addAltBtn.addEventListener('click', showAlternateMobile);
  }
  
  // CIBIL toggle
  const cibilToggle = document.getElementById('cibilToggleBtn');
  if (cibilToggle) {
    cibilToggle.addEventListener('click', toggleCibilDetails);
  }
  
  // CIBIL color buttons
  const cibilColorBtns = document.querySelectorAll('.cibil-color-btn');
  cibilColorBtns.forEach(btn => {
    btn.addEventListener('click', selectCibilColor);
  });
  
  // CIBIL prompt button
  const cibilPrompt = document.getElementById('cibilPromptBtn');
  if (cibilPrompt) {
    cibilPrompt.addEventListener('click', promptCibilScore);
  }
  
  // Copy permanent address from current
  const copyCheckbox = document.getElementById('copyPermanentFromCurrent');
  if (copyCheckbox) {
    copyCheckbox.addEventListener('change', copyPermanentAddress);
  }
  
  // Add applicant button
  const addApplicantBtn = document.getElementById('addApplicantBtn');
  if (addApplicantBtn) {
    addApplicantBtn.addEventListener('click', addAdditionalApplicant);
  }
  
  // Vehicle age calculation
  const mfgMonth = document.getElementById('mfgMonth');
  const mfgYear = document.getElementById('mfgYear');
  if (mfgMonth && mfgYear) {
    [mfgMonth, mfgYear].forEach(field => {
      field.addEventListener('change', calculateVehicleAge);
    });
  }
  
  // EMI calculations
  const loanAmount = document.getElementById('loanAmount');
  const loanTenure = document.getElementById('loanTenure');
  const interestRate = document.getElementById('interestRate');
  [loanAmount, loanTenure, interestRate].forEach(field => {
    if (field) {
      field.addEventListener('input', calculateEMI);
    }
  });
  
  // Obligation calculations
  const existingEmi = document.getElementById('existingEmi');
  const existingEmiCount = document.getElementById('existingEmiCount');
  [existingEmi, existingEmiCount].forEach(field => {
    if (field) {
      field.addEventListener('input', calculateObligations);
    }
  });
  
  // Input formatting
  setupInputFormatting();
}

// Populate all dropdowns
function populateDropdowns() {
  populateMonths();
  populateYears();
  populateTenure();
  populateEMIPaid();
}

// Populate months dropdown
function populateMonths() {
  const monthSelect = document.getElementById('mfgMonth');
  if (!monthSelect) return;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = month;
    monthSelect.appendChild(option);
  });
}

// Populate years dropdown
function populateYears() {
  const yearSelect = document.getElementById('mfgYear');
  if (!yearSelect) return;
  
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 20; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

// Populate tenure dropdown
function populateTenure() {
  const tenureSelect = document.getElementById('loanTenure');
  if (!tenureSelect) return;
  
  for (let months = 12; months <= 84; months += 6) {
    const option = document.createElement('option');
    option.value = months;
    option.textContent = `${months} months`;
    tenureSelect.appendChild(option);
  }
}

// Populate EMI paid dropdown
function populateEMIPaid() {
  const emiPaidSelect = document.getElementById('emiPaid');
  if (!emiPaidSelect) return;
  
  for (let count = 0; count <= 60; count++) {
    const option = document.createElement('option');
    option.value = count;
    option.textContent = count;
    emiPaidSelect.appendChild(option);
  }
}

// Toggle BT fields based on loan nature
function toggleBTFields() {
  const loanNature = document.getElementById('loanNature').value;
  const btFields = document.getElementById('btFields');
  
  if (!btFields) return;
  
  const isBTLoan = loanNature && (
    loanNature.includes('Refinance') || 
    loanNature.includes('BT') || 
    loanNature.includes('Balance Transfer')
  );
  
  if (isBTLoan) {
    btFields.classList.remove('hidden');
    // Make BT fields required
    btFields.querySelectorAll('[data-bt-required="true"]').forEach(field => {
      field.required = true;
    });
  } else {
    btFields.classList.add('hidden');
    // Remove required from BT fields
    btFields.querySelectorAll('[data-bt-required="true"]').forEach(field => {
      field.required = false;
    });
  }
}

// Toggle spouse name field
function toggleSpouseName() {
  const maritalStatus = document.getElementById('MaritalStatus').value;
  const spouseField = document.getElementById('spouseNameField');
  
  if (!spouseField) return;
  
  if (maritalStatus === 'Married') {
    spouseField.classList.remove('hidden');
    document.getElementById('spouseName').required = true;
  } else {
    spouseField.classList.add('hidden');
    document.getElementById('spouseName').required = false;
  }
}

// Show alternate mobile field
function showAlternateMobile() {
  const container = document.getElementById('extraAltMobileContainer');
  const btn = document.getElementById('addAltNoBtn');
  
  if (container && btn) {
    container.classList.remove('hidden');
    btn.style.display = 'none';
  }
}

// Toggle CIBIL details
function toggleCibilDetails() {
  const details = document.getElementById('cibilDetails');
  const btn = document.getElementById('cibilToggleBtn');
  
  if (details && btn) {
    const isHidden = details.classList.contains('hidden');
    
    if (isHidden) {
      details.classList.remove('hidden');
      btn.textContent = '-';
      btn.classList.remove('plus-state');
      btn.classList.add('minus-state');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      details.classList.add('hidden');
      btn.textContent = '+';
      btn.classList.remove('minus-state');
      btn.classList.add('plus-state');
      btn.setAttribute('aria-expanded', 'false');
    }
  }
}

// Select CIBIL color
function selectCibilColor(e) {
  const color = e.target.dataset.color;
  const indicator = document.getElementById('cibilIndicator');
  const display = document.getElementById('cibilDisplay');
  
  // Remove active class from all buttons
  document.querySelectorAll('.cibil-color-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to selected button
  e.target.classList.add('active');
  
  // Set indicator value
  if (indicator) {
    indicator.value = color;
  }
  
  // Update display color
  if (display) {
    display.className = `cibil-display ${color}`;
  }
}

// Prompt for CIBIL score
function promptCibilScore() {
  const score = prompt('Enter CIBIL Score (300-900):');
  if (score && !isNaN(score)) {
    const scoreNum = parseInt(score);
    if (scoreNum >= 300 && scoreNum <= 900) {
      const scoreField = document.getElementById('cibilScore');
      const display = document.getElementById('cibilDisplay');
      
      if (scoreField) scoreField.value = score;
      if (display) display.textContent = score;
      
      // Auto-select color based on score
      let color = 'red';
      if (scoreNum >= 700) color = 'green';
      else if (scoreNum >= 600) color = 'yellow';
      
      const colorBtn = document.querySelector(`.cibil-color-btn[data-color="${color}"]`);
      if (colorBtn) {
        colorBtn.click();
      }
      
      // Show details if hidden
      const details = document.getElementById('cibilDetails');
      if (details && details.classList.contains('hidden')) {
        toggleCibilDetails();
      }
    } else {
      alert('CIBIL Score must be between 300 and 900');
    }
  }
}

// Copy permanent address from current
function copyPermanentAddress() {
  const isChecked = document.getElementById('copyPermanentFromCurrent').checked;
  
  if (isChecked) {
    // Copy current address fields to permanent address fields
    const fieldMappings = [
      ['currentAddressProof', 'permanentAddressProof'],
      ['currentLandmark', 'permanentLandmark'],
      ['currentPincode', 'permanentPincode'],
      ['currentDistrict', 'permanentDistrict'],
      ['currentOhpRelation', 'permanentOhpRelation']
    ];
    
    fieldMappings.forEach(([source, target]) => {
      const sourceField = document.getElementById(source);
      const targetField = document.getElementById(target);
      
      if (sourceField && targetField) {
        targetField.value = sourceField.value;
      }
    });
  }
}

// Add additional applicant
function addAdditionalApplicant() {
  additionalApplicantCount++;
  const container = document.getElementById('additionalApplicants');
  
  const applicantBlock = document.createElement('div');
  applicantBlock.className = 'additional-applicant-block';
  applicantBlock.innerHTML = `
    <div class="additional-applicant-header">
      <h4>Applicant ${additionalApplicantCount + 1}</h4>
      <button type="button" class="icon-btn minus-state compact" onclick="this.closest('.additional-applicant-block').remove()">-</button>
    </div>
    <div class="sub-section">
      <h5>Personal Details</h5>
      <div class="grid">
        <div class="form-field">
          <label>Name *</label>
          <input type="text" name="additionalApplicant${additionalApplicantCount}_name" required data-uppercase data-alphabets />
        </div>
        <div class="form-field">
          <label>Relationship *</label>
          <select name="additionalApplicant${additionalApplicantCount}_relationship" required>
            <option value="">Select Relationship</option>
            <option>Spouse</option>
            <option>Father</option>
            <option>Mother</option>
            <option>Brother</option>
            <option>Sister</option>
            <option>Son</option>
            <option>Daughter</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-field">
          <label>Mobile *</label>
          <input type="tel" name="additionalApplicant${additionalApplicantCount}_mobile" required data-numbers maxlength="10" />
        </div>
        <div class="form-field">
          <label>Email</label>
          <input type="email" name="additionalApplicant${additionalApplicantCount}_email" />
        </div>
        <div class="form-field">
          <label>PAN</label>
          <input type="text" name="additionalApplicant${additionalApplicantCount}_pan" data-uppercase maxlength="10" />
        </div>
        <div class="form-field">
          <label>Monthly Income</label>
          <input type="number" name="additionalApplicant${additionalApplicantCount}_monthlyIncome" min="0" />
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(applicantBlock);
}

// Calculate vehicle age
function calculateVehicleAge() {
  const month = document.getElementById('mfgMonth').value;
  const year = document.getElementById('mfgYear').value;
  const ageField = document.getElementById('vehicleAge');
  
  if (!month || !year || !ageField) return;
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  let age = currentYear - parseInt(year);
  
  if (currentMonth < getMonthNumber(month)) {
    age--;
  }
  
  ageField.value = `${age} years`;
}

// Get month number from month name
function getMonthNumber(monthName) {
  const months = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  return months[monthName] || 1;
}

// Calculate EMI
function calculateEMI() {
  const principal = parseFloat(document.getElementById('loanAmount').value) || 0;
  const tenure = parseFloat(document.getElementById('loanTenure').value) || 0;
  const rate = parseFloat(document.getElementById('interestRate').value) || 0;
  
  if (principal <= 0 || tenure <= 0 || rate <= 0) return;
  
  const monthlyRate = rate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
  
  const emiField = document.getElementById('emi');
  if (emiField) {
    emiField.value = Math.round(emi);
  }
  
  // Update obligations
  calculateObligations();
}

// Calculate obligations
function calculateObligations() {
  const existingEmi = parseFloat(document.getElementById('existingEmi').value) || 0;
  const existingEmiCount = parseFloat(document.getElementById('existingEmiCount').value) || 0;
  const newEmi = parseFloat(document.getElementById('emi').value) || 0;
  const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value) || 0;
  
  const totalEmi = existingEmi + newEmi;
  const foir = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;
  
  // Update fields
  const totalEmiField = document.getElementById('totalEmi');
  const foirField = document.getElementById('foir');
  
  if (totalEmiField) totalEmiField.value = Math.round(totalEmi);
  if (foirField) foirField.value = Math.round(foir);
}

// Setup input formatting
function setupInputFormatting() {
  // Uppercase fields
  document.querySelectorAll('[data-uppercase]').forEach(field => {
    field.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  });
  
  // Alphabet-only fields
  document.querySelectorAll('[data-alphabets]').forEach(field => {
    field.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    });
  });
  
  // Number-only fields
  document.querySelectorAll('[data-numbers]').forEach(field => {
    field.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
  });
}

// Load existing lead for editing
async function loadExistingLead(loanId) {
  try {
    const response = await fetch(`/api/leads/${loanId}`);
    if (!response.ok) {
      alert('Error loading lead data');
      return;
    }
    
    const lead = await response.json();
    const data = lead.data || {};
    
    // Populate form fields
    Object.keys(data).forEach(key => {
      const field = document.getElementById(key);
      if (field) {
        if (field.tagName === 'SELECT') {
          // Handle select dropdowns
          const option = Array.from(field.options).find(opt => opt.value === data[key]);
          if (option) option.selected = true;
        } else {
          field.value = data[key] || '';
        }
      }
    });
    
    // Update page title
    document.querySelector('h2').textContent = 'Edit Used Car Loan Application';
    
  } catch (error) {
    console.error('Error loading existing lead:', error);
    alert('Error loading lead data');
  }
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Session expired. Please login again.");
    window.location.href = "/index.html";
    return;
  }
  
  // Collect form data
  const formData = collectFormData();
  
  // Add user info
  formData.loanType = 'used-car-loan';
  formData.userId = user.id;
  formData.role = user.role;
  
  // Check if editing
  const urlParams = new URLSearchParams(window.location.search);
  const loanId = urlParams.get('loanId');
  
  try {
    let response;
    if (loanId) {
      // Update existing lead
      response = await fetch(`/api/leads/${loanId}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
    } else {
      // Create new lead
      response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
    }
    
    if (response.ok) {
      alert(loanId ? 'Lead updated successfully!' : 'Lead submitted successfully!');
      window.location.href = "/view-cases.html";
    } else {
      const errorData = await response.json();
      alert(`Failed to ${loanId ? 'update' : 'save'} lead: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error submitting lead:', error);
    alert(`Error ${loanId ? 'updating' : 'saving'} lead`);
  }
}

// Collect all form data
function collectFormData() {
  const formData = {};
  
  // Collect all input and select fields
  document.querySelectorAll('#leadFormContainer input, #leadFormContainer select, #leadFormContainer textarea').forEach(field => {
    if (field.id && field.type !== 'file' && field.type !== 'checkbox') {
      formData[field.id] = field.value;
    }
  });
  
  // Collect additional applicants
  const additionalApplicants = [];
  document.querySelectorAll('.additional-applicant-block').forEach((block, index) => {
    const applicant = {};
    block.querySelectorAll('input, select').forEach(field => {
      if (field.name && field.value) {
        const fieldName = field.name.replace(`additionalApplicant${index}_`, '');
        applicant[fieldName] = field.value;
      }
    });
    
    if (Object.keys(applicant).length > 0) {
      additionalApplicants.push(applicant);
    }
  });
  
  if (additionalApplicants.length > 0) {
    formData.additionalApplicants = additionalApplicants;
  }
  
  return formData;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSharedForm();
});
