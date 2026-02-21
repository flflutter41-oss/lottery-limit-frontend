// Database API Client - เชื่อมต่อกับ Node.js Server
const API_BASE = window.location.origin;

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
        const res = await fetch(`${API_BASE}/api/users`);
        return res.json();
    },

    async addUser(username, password) {
        const res = await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return res.json();
    },

    async updatePassword(username, password) {
        const res = await fetch(`${API_BASE}/api/users/${username}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        return res.json();
    },

    async deleteUser(username) {
        const res = await fetch(`${API_BASE}/api/users/${username}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // ==================== SETTINGS ====================
    async getSettings() {
        const res = await fetch(`${API_BASE}/api/settings`);
        return res.json();
    },

    async saveSettings(settings) {
        const res = await fetch(`${API_BASE}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        return res.json();
    },

    // ==================== 2-DIGIT ====================
    async get2DigitLimits() {
        const res = await fetch(`${API_BASE}/api/limits/2digit`);
        return res.json();
    },

    async update2DigitLimit(number, limit, amount) {
        const res = await fetch(`${API_BASE}/api/limits/2digit/${number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit, amount })
        });
        return res.json();
    },

    async save2DigitLimits(data) {
        const res = await fetch(`${API_BASE}/api/limits/2digit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // ==================== 3-DIGIT TODE ====================
    async get3DigitTodeLimits() {
        const res = await fetch(`${API_BASE}/api/limits/3digit-tode`);
        return res.json();
    },

    async update3DigitTodeLimit(number, limit, amount) {
        const res = await fetch(`${API_BASE}/api/limits/3digit-tode/${number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit, amount })
        });
        return res.json();
    },

    async delete3DigitTode(number) {
        const res = await fetch(`${API_BASE}/api/limits/3digit-tode/${number}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    async save3DigitTodeLimits(data) {
        const res = await fetch(`${API_BASE}/api/limits/3digit-tode`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // ==================== 3-DIGIT TENG ====================
    async get3DigitTengLimits() {
        const res = await fetch(`${API_BASE}/api/limits/3digit-teng`);
        return res.json();
    },

    async update3DigitTengLimit(number, limit, amount) {
        const res = await fetch(`${API_BASE}/api/limits/3digit-teng/${number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit, amount })
        });
        return res.json();
    },

    async delete3DigitTeng(number) {
        const res = await fetch(`${API_BASE}/api/limits/3digit-teng/${number}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    async save3DigitTengLimits(data) {
        const res = await fetch(`${API_BASE}/api/limits/3digit-teng`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // ==================== TRANSACTIONS ====================
    async getTransactions() {
        const res = await fetch(`${API_BASE}/api/transactions`);
        return res.json();
    },

    async addTransaction(transaction) {
        const res = await fetch(`${API_BASE}/api/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });
        return res.json();
    },

    async deleteTransaction(id) {
        const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    async clearTransactions() {
        const res = await fetch(`${API_BASE}/api/transactions`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // ==================== EXPORT/IMPORT ====================
    async exportData() {
        const res = await fetch(`${API_BASE}/api/export`);
        return res.json();
    },

    async importData(data) {
        const res = await fetch(`${API_BASE}/api/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // ==================== UTILITIES ====================
    async clearAllAmounts() {
        const res = await fetch(`${API_BASE}/api/clear-amounts`, {
            method: 'POST'
        });
        return res.json();
    },

    async clearAllData() {
        const res = await fetch(`${API_BASE}/api/clear-all`, {
            method: 'POST'
        });
        return res.json();
    },

    async getDbInfo() {
        const res = await fetch(`${API_BASE}/api/db-info`);
        return res.json();
    }
};

// Export for use
window.db = db;
