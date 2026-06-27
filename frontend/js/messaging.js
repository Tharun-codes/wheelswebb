// Messaging System JavaScript
let currentUser = null;
let selectedUsers = [];
let allUsers = [];

// Initialize messaging system
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔍 Messaging page loaded');
  
  currentUser = JSON.parse(localStorage.getItem('user'));
  if (!currentUser) {
    console.log('❌ No user found, redirecting to login');
    window.location.href = '/index.html';
    return;
  }
  
  console.log('✅ User found:', currentUser.username, 'ID:', currentUser.id);
  loadUsers();
  setupEventListeners();
});

// Load all users
async function loadUsers() {
  console.log('🔄 Starting to load users...');
  try {
    const response = await fetch('/api/all-users');
    console.log('📡 Response received:', response.status);
    
    if (response.ok) {
      allUsers = await response.json();
      console.log('✅ Users loaded successfully:', allUsers.length, allUsers);
      renderUserList();
    } else {
      console.log('❌ Failed to load users:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error loading users:', error);
  }
}

// Render user list for selection
function renderUserList() {
  console.log('🎨 Rendering user list...');
  const recipientsList = document.getElementById('recipientsList');
  console.log('📍 recipientsList element:', recipientsList);
  
  if (!recipientsList) {
    console.log('❌ recipientsList element not found');
    return;
  }
  
  const filteredUsers = allUsers.filter(u => u.id !== currentUser.id);
  console.log('👥 Filtered users:', filteredUsers.length);
  
  let html = '';
  filteredUsers.forEach(user => {
    html += '<div class="user-item" data-user-id="' + user.id + '">';
    html += '<input type="checkbox" class="user-checkbox" id="user_' + user.id + '">';
    html += '<div class="user-avatar">' + user.username.charAt(0).toUpperCase() + '</div>';
    html += '<div class="user-info">';
    html += '<div class="user-name">' + user.username + '</div>';
    html += '<div class="user-role">' + user.role + '</div>';
    html += '</div>';
    html += '</div>';
  });
  
  console.log('📝 Generated HTML length:', html.length);
  console.log('📄 HTML preview:', html.substring(0, 200) + '...');
  
  recipientsList.innerHTML = html;
  console.log('✅ User list rendered');
  
  // Add event listeners for user selection
  const userItems = document.querySelectorAll('.user-item');
  console.log('🖱️ Found user items:', userItems.length);
  
  if (userItems.length === 0) {
    console.log('❌ No user items found after rendering!');
    return;
  }
  
  userItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
      console.log('🖱️ User item clicked:', index, e.target.type);
      if (e.target.type !== 'checkbox') {
        const checkbox = item.querySelector('.user-checkbox');
        checkbox.checked = !checkbox.checked;
        toggleUserSelection(item.dataset.userId, checkbox.checked);
      }
    });
    
    const checkbox = item.querySelector('.user-checkbox');
    checkbox.addEventListener('change', (e) => {
      console.log('☑️ Checkbox changed:', e.target.checked);
      toggleUserSelection(item.dataset.userId, e.target.checked);
    });
  });
}

// Toggle user selection
function toggleUserSelection(userId, isSelected) {
  if (isSelected) {
    const user = allUsers.find(u => u.id === userId);
    if (user && !selectedUsers.find(u => u.id === userId)) {
      selectedUsers.push(user);
    }
  } else {
    selectedUsers = selectedUsers.filter(u => u.id !== userId);
  }
  
  console.log('👥 Selected users:', selectedUsers.length, selectedUsers);
  updateSelectedUsersDisplay();
}

// Update selected users display
function updateSelectedUsersDisplay() {
  const selectedRecipients = document.getElementById('selectedRecipients');
  const selectedUsersList = document.getElementById('selectedUsersList');
  
  if (!selectedRecipients || !selectedUsersList) return;
  
  if (selectedUsers.length > 0) {
    selectedRecipients.style.display = 'block';
    selectedUsersList.innerHTML = selectedUsers.map(user => `
      <div class="selected-user-tag">
        ${user.username}
        <span class="remove" onclick="removeUser(${user.id})">×</span>
      </div>
    `).join('');
  } else {
    selectedRecipients.style.display = 'none';
  }
}

// Remove user from selection
function removeUser(userId) {
  selectedUsers = selectedUsers.filter(u => u.id !== userId);
  
  // Update checkbox
  const checkbox = document.getElementById(`user_${userId}`);
  if (checkbox) checkbox.checked = false;
  
  updateSelectedUsersDisplay();
}

// Setup event listeners
function setupEventListeners() {
  // User search
  const userSearch = document.getElementById('userSearch');
  if (userSearch) {
    userSearch.addEventListener('input', (e) => {
      filterUsers(e.target.value);
    });
  }
  
  // Enter key for sending messages
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

// Filter users
function filterUsers(searchTerm) {
  const userItems = document.querySelectorAll('.user-item');
  const term = searchTerm.toLowerCase();
  
  userItems.forEach(item => {
    const userName = item.querySelector('.user-name').textContent.toLowerCase();
    const userRole = item.querySelector('.user-role').textContent.toLowerCase();
    
    item.style.display = userName.includes(term) || userRole.includes(term) ? 'flex' : 'none';
  });
}

// Send message
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const messageText = messageInput.value.trim();
  
  if (!messageText || selectedUsers.length === 0) {
    alert('Please select recipients and enter a message');
    return;
  }
  
  try {
    const messageData = {
      senderId: currentUser.id,
      receiverIds: selectedUsers.map(u => u.id),
      message: messageText,
      type: selectedUsers.length === 1 ? 'individual' : 'group'
    };
    
    console.log('📤 Sending message:', messageData);
    
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Message sent successfully:', result);
      
      // Clear form
      messageInput.value = '';
      
      // Show success feedback
      alert(`Message sent successfully to ${selectedUsers.length} recipient(s)!`);
      
      // Clear selected users
      selectedUsers = [];
      document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
      updateSelectedUsersDisplay();
      
    } else {
      const error = await response.json();
      console.error('❌ Failed to send message:', error);
      alert(`Failed to send message: ${error.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error sending message');
  }
}

// Go back to dashboard
function goBack() {
  window.location.href = '/dashboard.html';
}
