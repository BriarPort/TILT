// API utility - replaces all Electron IPC calls with standard fetch calls
// All requests go to http://127.0.0.1:8000 (FastAPI backend)
// Using standard abbreviations: config, params, calc, etc.

const API_BASE = 'http://127.0.0.1:8000';

// Helper to handle API responses
// Note: FastAPI returns JSON by default, but we need to handle errors
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const resp = await fetch(url, config);
    
    // Handle non-JSON responses (like network errors)
    if (!resp.ok) {
      let errorMsg = 'API request failed';
      try {
        const data = await resp.json();
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(err => {
            const loc = Array.isArray(err.loc) ? err.loc.join('.') : '';
            return `${loc}: ${err.msg || err.message || 'Validation error'}`;
          }).join(', ');
        } else {
          errorMsg = data.detail || data.message || errorMsg;
        }
        // Convert to string if it's still an object
        if (typeof errorMsg === 'object') {
          errorMsg = JSON.stringify(errorMsg);
        }
      } catch {
        // If response isn't JSON, use status text
        errorMsg = resp.statusText || errorMsg;
      }
      throw new Error(errorMsg);
    }
    
    const data = await resp.json();
    return data;
  } catch (err) {
    // Network errors or JSON parse errors
    console.error(`API call failed: ${endpoint}`, err);
    // Re-throw with better error message
    if (err.message) {
      throw err;
    }
    throw new Error(`Network error: ${err.message || 'Unable to connect to backend'}`);
  }
}

// Auth endpoints
export async function login(password) {
  return apiCall('/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function changePassword(oldPassword, newPassword) {
  return apiCall('/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}

export async function isDatabaseLocked() {
  return apiCall('/is-locked');
}

// Vendor CRUD
export async function getVendors() {
  return apiCall('/vendors');
}

export async function saveVendor(vendor) {
  return apiCall('/vendors', {
    method: 'POST',
    body: JSON.stringify(vendor),
  });
}

export async function updateVendor(vendor) {
  return apiCall(`/vendors/${vendor.id}`, {
    method: 'PUT',
    body: JSON.stringify(vendor),
  });
}

export async function deleteVendor(id) {
  return apiCall(`/vendors/${id}`, {
    method: 'DELETE',
  });
}

// Questions
export async function getQuestions() {
  return apiCall('/questions/standard');
}

export async function saveQuestion(question) {
  return apiCall('/questions/standard', {
    method: 'POST',
    body: JSON.stringify(question),
  });
}

export async function updateQuestion(question) {
  return apiCall('/questions/standard', {
    method: 'POST',
    body: JSON.stringify(question),
  });
}

export async function deleteQuestion(id) {
  return apiCall(`/questions/standard/${id}`, {
    method: 'DELETE',
  });
}

// Cloud criteria
export async function getCloudCriteria() {
  return apiCall('/questions/cloud');
}

export async function saveCloudCriterion(criterion) {
  return apiCall('/questions/cloud', {
    method: 'POST',
    body: JSON.stringify(criterion),
  });
}

export async function updateCloudCriterion(criterion) {
  return apiCall('/questions/cloud', {
    method: 'POST',
    body: JSON.stringify(criterion),
  });
}

export async function deleteCloudCriterion(id) {
  return apiCall(`/questions/cloud/${id}`, {
    method: 'DELETE',
  });
}

// Settings
export async function getSettings() {
  return apiCall('/settings');
}

export async function saveSettings(settings) {
  return apiCall('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

// Assessment calculation
export async function calculateAssessment(assessmentData) {
  return apiCall('/assessment/calculate', {
    method: 'POST',
    body: JSON.stringify(assessmentData),
  });
}

// OSINT
export async function scanOSINT(vendorId) {
  return apiCall(`/osint/scan/${vendorId}`, {
    method: 'POST',
  });
}

