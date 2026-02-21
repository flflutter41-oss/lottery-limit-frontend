// config.js - Frontend Configuration
// ================================================
// ⚠️ สำคัญ! หลัง Deploy ให้แก้ไข API_URL เป็น URL ของ Render
// ================================================

const CONFIG = {
    // Development: ใช้ localhost
    // Production: เปลี่ยนเป็น URL ของ Render เช่น 'https://your-app-name.onrender.com'
    API_URL: 'https://lottery-limit-backend.onrender.com',
    
    // Token key for localStorage
    TOKEN_KEY: 'lottery_token',
    
    // Session timeout (24 hours in milliseconds)
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000
};

// =============================================
// Helper Functions
// =============================================

// Get stored token
function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

// Set token
function setToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
}

// Remove token (logout)
function removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    
    // Check token expiration (basic check - server will validate fully)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 > Date.now();
    } catch (e) {
        return false;
    }
}

// API Request helper with authentication
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, mergedOptions);
        
        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
            removeToken();
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
            throw new Error('กรุณาเข้าสู่ระบบใหม่');
        }
        
        // Handle 429 Too Many Requests
        if (response.status === 429) {
            throw new Error('คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'เกิดข้อผิดพลาด');
        }
        
        return data;
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        }
        throw error;
    }
}

// =============================================
// API Methods
// =============================================

const API = {
    // Authentication
    async login(password) {
        const data = await apiRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        if (data.token) {
            setToken(data.token);
        }
        return data;
    },
    
    async logout() {
        removeToken();
        window.location.href = 'index.html';
    },
    
    // Settings
    async getSettings() {
        return apiRequest('/api/settings');
    },
    
    async updateSettings(settings) {
        return apiRequest('/api/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    },
    
    async changePassword(oldPassword, newPassword) {
        return apiRequest('/api/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });
    },
    
    // 2-Digit Limits
    async get2DigitLimits() {
        return apiRequest('/api/limits/2digit');
    },
    
    async update2DigitLimit(number, limit) {
        return apiRequest('/api/limits/2digit', {
            method: 'POST',
            body: JSON.stringify({ number, limit })
        });
    },
    
    async reset2DigitLimits() {
        return apiRequest('/api/limits/2digit/reset', {
            method: 'POST'
        });
    },
    
    // 3-Digit Limits
    async get3DigitLimits() {
        return apiRequest('/api/limits/3digit');
    },
    
    async add3DigitLimit(number, type, limit) {
        return apiRequest('/api/limits/3digit', {
            method: 'POST',
            body: JSON.stringify({ number, type, limit })
        });
    },
    
    async update3DigitLimit(id, limit) {
        return apiRequest(`/api/limits/3digit/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ limit })
        });
    },
    
    async delete3DigitLimit(id) {
        return apiRequest(`/api/limits/3digit/${id}`, {
            method: 'DELETE'
        });
    },
    
    async reset3DigitLimits() {
        return apiRequest('/api/limits/3digit/reset', {
            method: 'POST'
        });
    },
    
    // Bets
    async add2DigitBet(number, amount) {
        return apiRequest('/api/bets/2digit', {
            method: 'POST',
            body: JSON.stringify({ number, amount })
        });
    },
    
    async add3DigitBet(number, type, amount) {
        return apiRequest('/api/bets/3digit', {
            method: 'POST',
            body: JSON.stringify({ number, type, amount })
        });
    },
    
    // Dashboard
    async getDashboardStats() {
        return apiRequest('/api/dashboard/stats');
    },
    
    async getAlerts() {
        return apiRequest('/api/alerts');
    },
    
    // Period Management
    async getCurrentPeriod() {
        return apiRequest('/api/period/current');
    },
    
    async newPeriod() {
        return apiRequest('/api/period/new', {
            method: 'POST'
        });
    },
    
    // History
    async getHistory() {
        return apiRequest('/api/history');
    }
};

// Export for use in other files
window.CONFIG = CONFIG;
window.API = API;
window.isAuthenticated = isAuthenticated;
window.getToken = getToken;
window.removeToken = removeToken;
