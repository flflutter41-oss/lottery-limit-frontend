// Database API Client - เชื่อมต่อกับ Node.js Server
// ใช้ CONFIG.API_URL จาก config.js
const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) 
    ? CONFIG.API_URL 
    : 'https://lottery-limit-backend.onrender.com';

// ==================== RETRY & CACHE UTILITIES ====================
const apiCache = new Map();
const CACHE_TTL = 5000; // 5 seconds cache

async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            
            // ถ้าเจอ 429 (Too Many Requests) ให้รอแล้วลองใหม่
            if (res.status === 429) {
                const waitTime = delay * Math.pow(2, i); // Exponential backoff
                console.warn(`Rate limited (429). Retrying in ${waitTime}ms... (attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            
            // ถ้า response ไม่ ok แต่ไม่ใช่ 429
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            return res;
        } catch (error) {
            if (i === retries - 1) throw error;
            const waitTime = delay * Math.pow(2, i);
            console.warn(`Request failed. Retrying in ${waitTime}ms...`, error.message);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    throw new Error('Max retries exceeded');
}

async function cachedFetch(url, options = {}, useCache = true) {
    const cacheKey = url + JSON.stringify(options);
    
    // ถ้าเป็น GET request และมี cache ที่ยังไม่หมดอายุ
    if (useCache && (!options.method || options.method === 'GET')) {
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
    }
    
    try {
        const res = await fetchWithRetry(url, options);
        const data = await res.json();
        
        // Cache GET requests only
        if (!options.method || options.method === 'GET') {
            apiCache.set(cacheKey, { data, timestamp: Date.now() });
        } else {
            // Invalidate related caches on mutation
            apiCache.clear();
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        // Return safe defaults based on endpoint
        if (url.includes('/limits/2digit')) return {};
        if (url.includes('/limits/3digit-tode')) return {};
        if (url.includes('/limits/3digit-teng')) return {};
        if (url.includes('/settings')) return { alertThreshold: 80, defaultLimit2Digit: 5000, defaultLimit3DigitTode: 3000, defaultLimit3DigitTeng: 2000 };
        if (url.includes('/transactions')) return [];
        throw error;
    }
}

const db = {
    // ==================== AUTH ====================
    async login(username, password) {
        const res = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return res.json();
    },

    async getUsers() {
        return cachedFetch(`${API_BASE}/api/users`);
    },

    async addUser(username, password) {
        return cachedFetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
    },

    async updatePassword(username, password) {
        return cachedFetch(`${API_BASE}/api/users/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
    },

    async deleteUser(username) {
        return cachedFetch(`${API_BASE}/api/users/${username}`, {
            method: 'DELETE'
        });
    },

    // ==================== SETTINGS ====================
    async getSettings() {
        return cachedFetch(`${API_BASE}/api/settings`);
    },

    async saveSettings(settings) {
        return cachedFetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    },

    // ==================== 2-DIGIT ====================
    async get2DigitLimits() {
        return cachedFetch(`${API_BASE}/api/limits/2digit`);
    },

    async update2DigitLimit(number, limit, amount) {
        return cachedFetch(`${API_BASE}/api/limits/2digit/${number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit, amount })
        }, false);
    },

    async save2DigitLimits(data) {
        return cachedFetch(`${API_BASE}/api/limits/2digit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }, false);
    },

    // ==================== 3-DIGIT TODE ====================
    async get3DigitTodeLimits() {
        return cachedFetch(`${API_BASE}/api/limits/3digit-tode`);
    },

    async update3DigitTodeLimit(number, limit, amount) {
        return cachedFetch(`${API_BASE}/api/limits/3digit-tode/${number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit, amount })
        }, false);
    },

    async delete3DigitTode(number) {
        return cachedFetch(`${API_BASE}/api/limits/3digit-tode/${number}`, {
            method: 'DELETE'
        }, false);
    },

    async save3DigitTodeLimits(data) {
        return cachedFetch(`${API_BASE}/api/limits/3digit-tode`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }, false);
    },

    // ==================== 3-DIGIT TENG ====================
    async get3DigitTengLimits() {
        return cachedFetch(`${API_BASE}/api/limits/3digit-teng`);
    },

    async update3DigitTengLimit(number, limit, amount) {
        return cachedFetch(`${API_BASE}/api/limits/3digit-teng/${number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit, amount })
        }, false);
    },

    async delete3DigitTeng(number) {
        return cachedFetch(`${API_BASE}/api/limits/3digit-teng/${number}`, {
            method: 'DELETE'
        }, false);
    },

    async save3DigitTengLimits(data) {
        return cachedFetch(`${API_BASE}/api/limits/3digit-teng`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }, false);
    },

    // ==================== TRANSACTIONS ====================
    async getTransactions() {
        return cachedFetch(`${API_BASE}/api/transactions`);
    },

    async addTransaction(transaction) {
        return cachedFetch(`${API_BASE}/api/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        }, false);
    },

    async deleteTransaction(id) {
        return cachedFetch(`${API_BASE}/api/transactions/${id}`, {
            method: 'DELETE'
        }, false);
    },

    async clearTransactions() {
        return cachedFetch(`${API_BASE}/api/transactions`, {
            method: 'DELETE'
        }, false);
    },

    // ==================== EXPORT/IMPORT ====================
    async exportData() {
        return cachedFetch(`${API_BASE}/api/export`);
    },

    async importData(data) {
        return cachedFetch(`${API_BASE}/api/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }, false);
    },

    // ==================== UTILITIES ====================
    async clearAllAmounts() {
        return cachedFetch(`${API_BASE}/api/clear-amounts`, {
            method: 'POST'
        }, false);
    },

    async clearAllData() {
        return cachedFetch(`${API_BASE}/api/clear-all`, {
            method: 'POST'
        }, false);
    },

    async getDbInfo() {
        return cachedFetch(`${API_BASE}/api/db-info`);
    },

    // Clear cache manually if needed
    clearCache() {
        apiCache.clear();
    }
};

// Export for use
window.db = db;
