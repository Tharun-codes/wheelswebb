// View Lead JavaScript - Uses shared form structure
const user = JSON.parse(localStorage.getItem("user"));

// Get loan ID from URL
const urlParams = new URLSearchParams(window.location.search);
const loanId = urlParams.get('loanId');

if (!loanId) {
  alert('Error: No loan ID provided');
  window.location.href = '/view-cases.html';
  throw new Error('No loanId provided');
}

// Load shared form structure
async function loadSharedForm() {
  try {
    const response = await fetch('/shared-lead-form.html');
    const formHTML = await response.text();
    document.getElementById('leadFormContainer').innerHTML = formHTML;
    
    // After loading form, populate with data
    await fetchAndPopulateLead();
  } catch (error) {
    console.error('Error loading shared form:', error);
    alert('Error loading form structure');
  }
}

// Fetch lead data and populate form fields
async function fetchAndPopulateLead() {
  try {
    console.log('Fetching lead with loanId:', loanId);
    
    const response = await fetch(`/api/leads/${loanId}`);
    if (!response.ok) {
      if (response.status === 404) {
        alert('Lead not found');
      } else {
        alert('Error fetching lead data');
      }
      window.location.href = '/view-cases.html';
      return;
    }
    
    const lead = await response.json();
    console.log('Lead data fetched:', lead);
    
    // Update page title
    const heading = document.getElementById('pageHeading');
    if (heading) {
      heading.textContent = `View Lead Details - ${lead.loan_id}`;
    }
    
    // Populate form fields with lead data
    populateFormFields(lead);
    
    // Disable all form fields for view mode
    disableFormFields();
    
    // Show actions section
    showActions(lead);
    
  } catch (error) {
    console.error('Error fetching lead:', error);
    alert('Error loading lead data');
    window.location.href = '/view-cases.html';
  }
}

// Populate form fields with lead data
function populateFormFields(lead) {
  const data = lead.data || {};
  
  // Helper function to set field value
  function setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
      if (field.tagName === 'SELECT') {
        // For select dropdowns, find and select the matching option
        const option = Array.from(field.options).find(opt => opt.value === value || opt.textContent === value);
        if (option) {
          option.selected = true;
        }
      } else {
        field.value = value || '';
      }
    }
  }
  
  // Basic Information
  setFieldValue('loanType', lead.loan_type || 'used-car-loan');
  setFieldValue('loanId', lead.loan_id);
  setFieldValue('dateTime', formatDate(lead.created_at));
  setFieldValue('source', data.source);
  setFieldValue('basicCaseDealer', data.basicCaseDealer);
  setFieldValue('basicRefNameMobile', data.basicRefNameMobile);
  
  // Vehicle Information
  setFieldValue('rcNo', data.rcNo);
  setFieldValue('vehicle', data.vehicle);
  setFieldValue('osNo', data.osNo);
  setFieldValue('mfgMonth', data.mfgMonth);
  setFieldValue('mfgYear', data.mfgYear);
  setFieldValue('vehicleAge', data.vehicleAge);
  setFieldValue('kilometreReading', data.kilometreReading);
  setFieldValue('vehicleOwnerContact', data.vehicleOwnerContact);
  setFieldValue('vehicleLocation', data.vehicleLocation);
  
  // Loan Details
  setFieldValue('loanNature', data.loanNature);
  setFieldValue('loanAmount', data.loanAmount);
  setFieldValue('loanTenure', data.loanTenure);
  setFieldValue('interestRate', data.interestRate);
  setFieldValue('emi', data.emi);
  
  // BT Fields (show if applicable)
  if (data.loanNature && (data.loanNature.includes('Refinance') || data.loanNature.includes('BT'))) {
    const btFields = document.getElementById('btFields');
    if (btFields) {
      btFields.classList.remove('hidden');
    }
    setFieldValue('prevFinanceName', data.prevFinanceName);
    setFieldValue('btTenure', data.btTenure);
    setFieldValue('emiPaid', data.emiPaid);
    setFieldValue('btPrincipalOs', data.btPrincipalOs);
  }
  
  // Applicant Profile
  setFieldValue('name', data.name);
  setFieldValue('gender', data.gender);
  setFieldValue('pan', data.pan);
  setFieldValue('mobile', data.mobile);
  setFieldValue('extraAltMobile', data.extraAltMobile);
  setFieldValue('email', data.email);
  setFieldValue('MaritalStatus', data.MaritalStatus);
  setFieldValue('spouseName', data.spouseName);
  setFieldValue('fatherName', data.fatherName);
  setFieldValue('motherName', data.motherName);
  
  // Show spouse name field if married
  if (data.MaritalStatus === 'Married') {
    const spouseField = document.getElementById('spouseNameField');
    if (spouseField) {
      spouseField.classList.remove('hidden');
    }
  }
  
  // CIBIL Details
  if (data.cibilScore) {
    const cibilDisplay = document.getElementById('cibilDisplay');
    const cibilDetails = document.getElementById('cibilDetails');
    if (cibilDisplay && cibilDetails) {
      cibilDisplay.textContent = data.cibilScore;
      cibilDetails.classList.remove('hidden');
      
      // Set CIBIL indicator color
      if (data.cibilIndicator) {
        const indicator = document.getElementById('cibilIndicator');
        const colorBtn = document.querySelector(`.cibil-color-btn[data-color="${data.cibilIndicator}"]`);
        if (indicator) indicator.value = data.cibilIndicator;
        if (colorBtn) colorBtn.classList.add('active');
        
        // Apply color class to display
        cibilDisplay.className = `cibil-display ${data.cibilIndicator}`;
      }
    }
  }
  
  // Current Address
  setFieldValue('currentAddressProof', data.currentAddressProof);
  setFieldValue('currentLandmark', data.currentLandmark);
  setFieldValue('currentPincode', data.currentPincode);
  setFieldValue('currentDistrict', data.currentDistrict);
  setFieldValue('currentOhpRelation', data.currentOhpRelation);
  
  // Permanent Address
  setFieldValue('permanentAddressProof', data.permanentAddressProof);
  setFieldValue('permanentLandmark', data.permanentLandmark);
  setFieldValue('permanentPincode', data.permanentPincode);
  setFieldValue('permanentDistrict', data.permanentDistrict);
  setFieldValue('permanentOhpRelation', data.permanentOhpRelation);
  
  // Employment & Office
  setFieldValue('employmentCustomerProfile', data.employmentCustomerProfile);
  setFieldValue('businessName', data.businessName);
  setFieldValue('monthlyIncome', data.monthlyIncome);
  setFieldValue('workExperience', data.workExperience);
  setFieldValue('officeAddress', data.officeAddress);
  setFieldValue('officePincode', data.officePincode);
  setFieldValue('officeDistrict', data.officeDistrict);
  setFieldValue('officeState', data.officeState);
  
  // Bank & DSA
  setFieldValue('bankFinance', data.bankFinance);
  setFieldValue('dsa', data.dsa);
  setFieldValue('loanDsa', data.loanDsa);
  
  // Obligation Details
  setFieldValue('existingEmi', data.existingEmi);
  setFieldValue('existingEmiCount', data.existingEmiCount);
  setFieldValue('newEmi', data.newEmi);
  setFieldValue('totalEmi', data.totalEmi);
  setFieldValue('foir', data.foir);
  
  // Additional Applicants (if any)
  if (data.additionalApplicants && Array.isArray(data.additionalApplicants)) {
    populateAdditionalApplicants(data.additionalApplicants);
  }
}

// Populate additional applicants
function populateAdditionalApplicants(applicants) {
  const container = document.getElementById('additionalApplicants');
  if (!container) return;
  
  applicants.forEach((applicant, index) => {
    const applicantBlock = document.createElement('div');
    applicantBlock.className = 'additional-applicant-block';
    applicantBlock.innerHTML = `
      <div class="additional-applicant-header">
        <h4>Applicant ${index + 2}</h4>
      </div>
      <div class="sub-section">
        <h5>Personal Details</h5>
        <div class="grid">
          <div class="form-field">
            <label>Name</label>
            <input type="text" value="${applicant.name || ''}" readonly />
          </div>
          <div class="form-field">
            <label>Relationship</label>
            <input type="text" value="${applicant.relationship || ''}" readonly />
          </div>
          <div class="form-field">
            <label>Mobile</label>
            <input type="text" value="${applicant.mobile || ''}" readonly />
          </div>
          <div class="form-field">
            <label>Email</label>
            <input type="text" value="${applicant.email || ''}" readonly />
          </div>
          <div class="form-field">
            <label>PAN</label>
            <input type="text" value="${applicant.pan || ''}" readonly />
          </div>
          <div class="form-field">
            <label>Monthly Income</label>
            <input type="text" value="${applicant.monthlyIncome || ''}" readonly />
          </div>
        </div>
      </div>
    `;
    container.appendChild(applicantBlock);
  });
}

// Disable all form fields for view mode
function disableFormFields() {
  // Add view-mode class to main container
  document.getElementById('leadFormContainer').classList.add('view-mode');
  
  // Disable all inputs, selects, and textareas
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    input.disabled = true;
    input.readOnly = true;
  });
  
  // Hide file inputs (they don't work well in view mode)
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.style.display = 'none';
    // Add a text display instead
    const label = input.previousElementSibling;
    if (label && label.tagName === 'LABEL') {
      const display = document.createElement('div');
      display.style.cssText = 'padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 4px; color: #374151;';
      display.textContent = 'Document uploaded (file not shown in view mode)';
      label.parentNode.insertBefore(display, input.nextSibling);
    }
  });
  
  // Hide add/remove buttons
  const addButtons = document.querySelectorAll('.icon-btn.plus-state, .icon-btn.minus-state');
  addButtons.forEach(btn => btn.style.display = 'none');
  
  // Hide checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.style.display = 'none');
}

// Show actions section
function showActions(lead) {
  const actionsSection = document.getElementById('actionsSection');
  if (actionsSection) {
    actionsSection.style.display = 'block';
    
    // Update edit button with correct loan ID
    const editBtn = document.getElementById('editLeadBtn');
    if (editBtn) {
      editBtn.href = `/used-car-loan.html?loanId=${lead.loan_id}`;
    }
    
    // Set up delete button (only for admin)
    const deleteBtn = document.getElementById('deleteLeadBtn');
    if (deleteBtn) {
      if (user.role === 'admin') {
        deleteBtn.style.display = 'inline-block';
        deleteBtn.onclick = () => deleteLead(lead.loan_id);
      } else {
        deleteBtn.style.display = 'none';
      }
    }
  }
}

// Delete lead function
async function deleteLead(loanId) {
  if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/leads/${loanId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Lead deleted successfully');
      window.location.href = '/view-cases.html';
    } else {
      alert('Error deleting lead');
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    alert('Error deleting lead');
  }
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSharedForm();
});
