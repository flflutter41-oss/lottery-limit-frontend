// ==================== CONFIGURATION ====================
const APP_CONFIG = {
    ALERT_THRESHOLD: 80,
    DEFAULT_LIMIT_2DIGIT: 5000,
    DEFAULT_LIMIT_3DIGIT_TODE: 3000,
    DEFAULT_LIMIT_3DIGIT_TENG: 2000
};

// ==================== AUTH FUNCTIONS ====================
async function loginAsync(username, password) {
    try {
        const result = await db.login(username, password);
        if (result.success) {
            localStorage.setItem('lottery_current_user', username);
            return true;
        }
        return false;
    } catch (e) {
        console.error('Login error:', e);
        return false;
    }
}

function logout() {
    localStorage.removeItem('lottery_current_user');
}

function isLoggedIn() {
    return localStorage.getItem('lottery_current_user') !== null;
}

function getCurrentUser() {
    return localStorage.getItem('lottery_current_user') || '';
}

function checkAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
    }
}

function logoutUser() {
    logout();
    window.location.href = 'index.html';
}

// ==================== UTILITY FUNCTIONS ====================
function formatNumber(num) {
    return num.toLocaleString('th-TH');
}

function formatDate(date) {
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateInput(date) {
    return date.toISOString().split('T')[0];
}

function formatDateTime(date) {
    return date.toLocaleString('th-TH');
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Thai lottery period functions
function getThaiMonthName(month) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return months[month];
}

function getLotteryPeriods() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    
    const periods = [];
    const thaiYear = currentYear + 543;
    
    // Determine current working period based on today's date
    if (currentDay <= 16) {
        // วันที่ 2-16: กำลังรับยอดสำหรับงวด 16 ของเดือนนี้
        // Current period: งวด 16 เดือนนี้
        periods.push({
            label: `งวด 16 ${getThaiMonthName(currentMonth)} ${thaiYear}`,
            value: `current`,
            isCurrent: true
        });
        
        // Previous: งวด 1 เดือนนี้
        periods.push({
            label: `งวด 1 ${getThaiMonthName(currentMonth)} ${thaiYear}`,
            value: `prev1`,
            isCurrent: false
        });
        
        // Previous: งวด 16 เดือนก่อน
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevThaiYear = currentMonth === 0 ? thaiYear - 1 : thaiYear;
        periods.push({
            label: `งวด 16 ${getThaiMonthName(prevMonth)} ${prevThaiYear}`,
            value: `prev2`,
            isCurrent: false
        });
    } else {
        // วันที่ 17-31: กำลังรับยอดสำหรับงวด 1 ของเดือนถัดไป
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextThaiYear = currentMonth === 11 ? thaiYear + 1 : thaiYear;
        
        // Current period: งวด 1 เดือนถัดไป
        periods.push({
            label: `งวด 1 ${getThaiMonthName(nextMonth)} ${nextThaiYear}`,
            value: `current`,
            isCurrent: true
        });
        
        // Previous: งวด 16 เดือนนี้
        periods.push({
            label: `งวด 16 ${getThaiMonthName(currentMonth)} ${thaiYear}`,
            value: `prev1`,
            isCurrent: false
        });
        
        // Previous: งวด 1 เดือนนี้
        periods.push({
            label: `งวด 1 ${getThaiMonthName(currentMonth)} ${thaiYear}`,
            value: `prev2`,
            isCurrent: false
        });
    }
    
    return periods;
}

function getCurrentPeriod() {
    return 'current'; // Always select current working period
}

function initPeriodSelector() {
    const select = document.getElementById('periodSelect');
    if (!select) return;
    
    const periods = getLotteryPeriods();
    
    select.innerHTML = periods.map(p => 
        `<option value="${p.value}" ${p.isCurrent ? 'selected' : ''}>${p.label}</option>`
    ).join('');
}

async function getSettingsAsync() {
    try {
        return await db.getSettings();
    } catch (e) {
        return {
            alertThreshold: APP_CONFIG.ALERT_THRESHOLD,
            defaultLimit2Digit: APP_CONFIG.DEFAULT_LIMIT_2DIGIT,
            defaultLimit3DigitTode: APP_CONFIG.DEFAULT_LIMIT_3DIGIT_TODE,
            defaultLimit3DigitTeng: APP_CONFIG.DEFAULT_LIMIT_3DIGIT_TENG
        };
    }
}

function getStatusClass(percent) {
    if (percent >= 100) return 'status-danger';
    if (percent >= 80) return 'status-warning';
    return 'status-safe';
}

function getStatusText(percent) {
    if (percent >= 100) return 'เกินลิมิต';
    if (percent >= 80) return 'ใกล้ลิมิต';
    return 'ปกติ';
}

function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕'}</span>
        <span class="toast-message">${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('show');
}

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('show');
}

// ==================== 2-DIGIT FUNCTIONS ====================
async function add2DigitAmount() {
    const numberInput = document.getElementById('number2Digit');
    const amountInput = document.getElementById('amount2Digit');
    const number = numberInput.value.trim().padStart(2, '0');
    const amount = parseFloat(amountInput.value);

    if (!/^\d{2}$/.test(number) || parseInt(number) > 99) {
        showToast('กรุณากรอกเลข 2 ตัว (00-99)', 'error');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showToast('กรุณากรอกจำนวนเงินที่ถูกต้อง', 'error');
        return;
    }

    showLoading();
    
    try {
        const data = await db.get2DigitLimits();
        const settings = await getSettingsAsync();
        
        if (!data[number]) {
            data[number] = { limit: settings.defaultLimit2Digit, amount: 0 };
        }
        
        data[number].amount += amount;
        await db.update2DigitLimit(number, data[number].limit, data[number].amount);
        
        await db.addTransaction({
            date: new Date().toISOString(),
            type: '2digit',
            number: number,
            amount: amount,
            totalAmount: data[number].amount,
            limit: data[number].limit
        });
        
        const percent = (data[number].amount / data[number].limit) * 100;
        if (percent >= settings.alertThreshold) {
            showToast(`⚠️ เลข ${number} ใกล้ถึงลิมิต! (${percent.toFixed(1)}%)`, 'warning');
        } else {
            showToast(`เพิ่มยอดเลข ${number} สำเร็จ`, 'success');
        }
        
        numberInput.value = '';
        amountInput.value = '';
        
        if (typeof load2DigitTable === 'function') await load2DigitTable();
        if (typeof loadDashboard === 'function') await loadDashboard();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
    
    hideLoading();
}

async function load2DigitTable() {
    const tbody = document.getElementById('tbody2Digit');
    if (!tbody) return;
    
    try {
        const data = await db.get2DigitLimits();
        const settings = await getSettingsAsync();
        
        tbody.innerHTML = '';
        
        for (let i = 0; i <= 99; i++) {
            const number = i.toString().padStart(2, '0');
            const item = data[number] || { limit: settings.defaultLimit2Digit, amount: 0 };
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            const statusClass = getStatusClass(percent);
            const statusText = getStatusText(percent);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${number}</strong></td>
                <td>${formatNumber(item.amount)}</td>
                <td>${formatNumber(item.limit)}</td>
                <td>
                    <div class="progress-container">
                        <div><div class="progress-bar ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div></div>
                        <span class="progress-text ${statusClass}">${percent.toFixed(1)}%</span>
                    </div>
                </td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEdit2DigitModal('${number}', ${item.limit}, ${item.amount})">แก้ไข</button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (e) {
        console.error('Error loading 2-digit table:', e);
    }
}

let current2DigitNumber = null;

function openEdit2DigitModal(number, limit, amount) {
    current2DigitNumber = number;
    document.getElementById('editNumber').textContent = number;
    document.getElementById('editLimit').value = limit;
    document.getElementById('editAmount').value = amount;
    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    current2DigitNumber = null;
}

async function saveEdit2Digit() {
    if (!current2DigitNumber) return;
    
    const newLimit = parseFloat(document.getElementById('editLimit').value);
    const newAmount = parseFloat(document.getElementById('editAmount').value);
    
    if (isNaN(newLimit) || newLimit < 0) {
        showToast('กรุณากรอกลิมิตที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await db.update2DigitLimit(current2DigitNumber, newLimit, newAmount);
        showToast(`บันทึกเลข ${current2DigitNumber} เรียบร้อย`, 'success');
        closeEditModal();
        await load2DigitTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    
    hideLoading();
}

// ==================== 3-DIGIT TODE FUNCTIONS ====================
async function add3DigitTodeAmount() {
    const numberInput = document.getElementById('numberTode');
    const amountInput = document.getElementById('amountTode');
    const number = numberInput.value.trim().padStart(3, '0');
    const amount = parseFloat(amountInput.value);

    if (!/^\d{3}$/.test(number) || parseInt(number) > 999) {
        showToast('กรุณากรอกเลข 3 ตัว (000-999)', 'error');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showToast('กรุณากรอกจำนวนเงินที่ถูกต้อง', 'error');
        return;
    }

    showLoading();
    
    try {
        const data = await db.get3DigitTodeLimits();
        const settings = await getSettingsAsync();
        
        if (!data[number]) {
            data[number] = { limit: settings.defaultLimit3DigitTode, amount: 0 };
        }
        
        data[number].amount += amount;
        await db.update3DigitTodeLimit(number, data[number].limit, data[number].amount);
        
        await db.addTransaction({
            date: new Date().toISOString(),
            type: '3digit-tode',
            number: number,
            amount: amount,
            totalAmount: data[number].amount,
            limit: data[number].limit
        });
        
        const percent = (data[number].amount / data[number].limit) * 100;
        if (percent >= settings.alertThreshold) {
            showToast(`⚠️ เลข ${number} ใกล้ถึงลิมิต! (${percent.toFixed(1)}%)`, 'warning');
        } else {
            showToast(`เพิ่มยอดเลข ${number} โต๊ดสำเร็จ`, 'success');
        }
        
        numberInput.value = '';
        amountInput.value = '';
        
        if (typeof load3DigitTodeTable === 'function') await load3DigitTodeTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
    
    hideLoading();
}

async function load3DigitTodeTable() {
    const tbody = document.getElementById('tbodyTode');
    if (!tbody) return;
    
    try {
        const data = await db.get3DigitTodeLimits();
        const settings = await getSettingsAsync();
        
        tbody.innerHTML = '';
        
        const numbers = Object.keys(data).sort();
        
        if (numbers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">ยังไม่มีข้อมูล</td></tr>';
            return;
        }
        
        for (const number of numbers) {
            const item = data[number];
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            const statusClass = getStatusClass(percent);
            const statusText = getStatusText(percent);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${number}</strong></td>
                <td>${formatNumber(item.amount)}</td>
                <td>${formatNumber(item.limit)}</td>
                <td>
                    <div class="progress-container">
                        <div><div class="progress-bar ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div></div>
                        <span class="progress-text ${statusClass}">${percent.toFixed(1)}%</span>
                    </div>
                </td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEdit3DigitTodeModal('${number}', ${item.limit}, ${item.amount})">แก้ไข</button>
                    <button class="btn btn-sm btn-danger" onclick="delete3DigitTode('${number}')">ลบ</button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (e) {
        console.error('Error loading 3-digit tode table:', e);
    }
}

let current3DigitTodeNumber = null;

function openEdit3DigitTodeModal(number, limit, amount) {
    openEdit3Modal(number, limit, amount, 'tode');
}

function closeEditTodeModal() {
    closeModal3();
}

async function saveEdit3DigitTode() {
    await saveEdit3();
}

async function delete3DigitTode(number) {
    if (!confirm(`ต้องการลบเลข ${number} ?`)) return;
    
    showLoading();
    try {
        await db.delete3DigitTode(number);
        showToast(`ลบเลข ${number} เรียบร้อย`, 'success');
        await load3DigitTodeTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

// ==================== 3-DIGIT TENG FUNCTIONS ====================
async function add3DigitTengAmount() {
    const numberInput = document.getElementById('numberTeng');
    const amountInput = document.getElementById('amountTeng');
    const number = numberInput.value.trim().padStart(3, '0');
    const amount = parseFloat(amountInput.value);

    if (!/^\d{3}$/.test(number) || parseInt(number) > 999) {
        showToast('กรุณากรอกเลข 3 ตัว (000-999)', 'error');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showToast('กรุณากรอกจำนวนเงินที่ถูกต้อง', 'error');
        return;
    }

    showLoading();
    
    try {
        const data = await db.get3DigitTengLimits();
        const settings = await getSettingsAsync();
        
        if (!data[number]) {
            data[number] = { limit: settings.defaultLimit3DigitTeng, amount: 0 };
        }
        
        data[number].amount += amount;
        await db.update3DigitTengLimit(number, data[number].limit, data[number].amount);
        
        await db.addTransaction({
            date: new Date().toISOString(),
            type: '3digit-teng',
            number: number,
            amount: amount,
            totalAmount: data[number].amount,
            limit: data[number].limit
        });
        
        const percent = (data[number].amount / data[number].limit) * 100;
        if (percent >= settings.alertThreshold) {
            showToast(`⚠️ เลข ${number} ใกล้ถึงลิมิต! (${percent.toFixed(1)}%)`, 'warning');
        } else {
            showToast(`เพิ่มยอดเลข ${number} เต็งสำเร็จ`, 'success');
        }
        
        numberInput.value = '';
        amountInput.value = '';
        
        if (typeof load3DigitTengTable === 'function') await load3DigitTengTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
    
    hideLoading();
}

async function load3DigitTengTable() {
    const tbody = document.getElementById('tbodyTeng');
    if (!tbody) return;
    
    try {
        const data = await db.get3DigitTengLimits();
        const settings = await getSettingsAsync();
        
        tbody.innerHTML = '';
        
        const numbers = Object.keys(data).sort();
        
        if (numbers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">ยังไม่มีข้อมูล</td></tr>';
            return;
        }
        
        for (const number of numbers) {
            const item = data[number];
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            const statusClass = getStatusClass(percent);
            const statusText = getStatusText(percent);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${number}</strong></td>
                <td>${formatNumber(item.amount)}</td>
                <td>${formatNumber(item.limit)}</td>
                <td>
                    <div class="progress-container">
                        <div><div class="progress-bar ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div></div>
                        <span class="progress-text ${statusClass}">${percent.toFixed(1)}%</span>
                    </div>
                </td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEdit3DigitTengModal('${number}', ${item.limit}, ${item.amount})">แก้ไข</button>
                    <button class="btn btn-sm btn-danger" onclick="delete3DigitTeng('${number}')">ลบ</button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (e) {
        console.error('Error loading 3-digit teng table:', e);
    }
}

let current3DigitTengNumber = null;

function openEdit3DigitTengModal(number, limit, amount) {
    openEdit3Modal(number, limit, amount, 'teng');
}

function closeEditTengModal() {
    closeModal3();
}

async function saveEdit3DigitTeng() {
    await saveEdit3();
}

async function delete3DigitTeng(number) {
    if (!confirm(`ต้องการลบเลข ${number} ?`)) return;
    
    showLoading();
    try {
        await db.delete3DigitTeng(number);
        showToast(`ลบเลข ${number} เรียบร้อย`, 'success');
        await load3DigitTengTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

// ==================== 3-DIGIT TAB FUNCTIONS ====================
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`tab-${tabName}`);
    
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

async function load3DigitTables() {
    await load3DigitTodeTable();
    await load3DigitTengTable();
}

// ==================== DASHBOARD FUNCTIONS ====================
async function loadDashboard() {
    try {
        const data2Digit = await db.get2DigitLimits();
        const data3DigitTode = await db.get3DigitTodeLimits();
        const data3DigitTeng = await db.get3DigitTengLimits();
        const settings = await getSettingsAsync();
        
        // Calculate stats
        let total2Digit = 0, total3DigitTode = 0, total3DigitTeng = 0;
        let alerts = [];
        
        Object.entries(data2Digit).forEach(([number, item]) => {
            total2Digit += item.amount;
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            if (percent >= settings.alertThreshold) {
                alerts.push({ type: '2 ตัว', number, percent, amount: item.amount, limit: item.limit });
            }
        });
        
        Object.entries(data3DigitTode).forEach(([number, item]) => {
            total3DigitTode += item.amount;
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            if (percent >= settings.alertThreshold) {
                alerts.push({ type: '3 ตัวโต๊ด', number, percent, amount: item.amount, limit: item.limit });
            }
        });
        
        Object.entries(data3DigitTeng).forEach(([number, item]) => {
            total3DigitTeng += item.amount;
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            if (percent >= settings.alertThreshold) {
                alerts.push({ type: '3 ตัวเต็ง', number, percent, amount: item.amount, limit: item.limit });
            }
        });
        
        // Update stats
        const stat2Digit = document.getElementById('total2Digit');
        const stat3DigitTode = document.getElementById('total3DigitTode');
        const stat3DigitTeng = document.getElementById('total3DigitTeng');
        const statAlerts = document.getElementById('nearLimitCount');
        
        if (stat2Digit) stat2Digit.textContent = formatNumber(total2Digit);
        if (stat3DigitTode) stat3DigitTode.textContent = formatNumber(total3DigitTode);
        if (stat3DigitTeng) stat3DigitTeng.textContent = formatNumber(total3DigitTeng);
        if (statAlerts) statAlerts.textContent = alerts.length;
        
        // Update alerts
        const alertsContainer = document.getElementById('alertsContainer');
        if (alertsContainer) {
            if (alerts.length === 0) {
                alertsContainer.innerHTML = '<div class="no-alerts">✓ ไม่มีเลขใกล้ถึงลิมิต</div>';
            } else {
                alerts.sort((a, b) => b.percent - a.percent);
                alertsContainer.innerHTML = alerts.slice(0, 10).map(alert => `
                    <div class="alert-item ${alert.percent >= 100 ? 'danger' : 'warning'}">
                        <div class="alert-info">
                            <span class="alert-type">${alert.type}</span>
                            <span class="alert-number">${alert.number}</span>
                        </div>
                        <div class="alert-detail">
                            <span>${formatNumber(alert.amount)} / ${formatNumber(alert.limit)} บาท</span>
                            <span class="alert-percent">${alert.percent.toFixed(1)}%</span>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Update recent list - show all numbers with amounts > 0 from current data
        const recentTbody = document.getElementById('recentTransactions');
        if (recentTbody) {
            // Collect all entries with amounts > 0
            const allEntries = [];
            
            Object.entries(data2Digit).forEach(([number, item]) => {
                if (item.amount > 0) {
                    allEntries.push({ type: '2 ตัว', number, amount: item.amount, limit: item.limit });
                }
            });
            
            Object.entries(data3DigitTode).forEach(([number, item]) => {
                if (item.amount > 0) {
                    allEntries.push({ type: '3 ตัวโต๊ด', number, amount: item.amount, limit: item.limit });
                }
            });
            
            Object.entries(data3DigitTeng).forEach(([number, item]) => {
                if (item.amount > 0) {
                    allEntries.push({ type: '3 ตัวเต็ง', number, amount: item.amount, limit: item.limit });
                }
            });
            
            // Sort by amount descending
            allEntries.sort((a, b) => b.amount - a.amount);
            const displayEntries = allEntries.slice(0, 10);
            
            if (displayEntries.length === 0) {
                recentTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888;">ยังไม่มีรายการ</td></tr>';
            } else {
                recentTbody.innerHTML = displayEntries.map(entry => `
                        <tr>
                            <td>${entry.type}</td>
                            <td>${entry.number}</td>
                            <td>${formatNumber(entry.amount)} / ${formatNumber(entry.limit)}</td>
                        </tr>
                    `).join('');
            }
        }
    } catch (e) {
        console.error('Error loading dashboard:', e);
    }
}

async function quickAdd() {
    const typeSelect = document.getElementById('quickType');
    const numberInput = document.getElementById('quickNumber');
    const amountInput = document.getElementById('quickAmount');
    
    const type = typeSelect.value;
    const number = numberInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    const expectedLength = type === '2digit' ? 2 : 3;
    const paddedNumber = number.padStart(expectedLength, '0');
    
    if (number.length > expectedLength || !/^\d+$/.test(number)) {
        showToast(`กรุณากรอกเลข ${expectedLength} ตัวที่ถูกต้อง`, 'error');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showToast('กรุณากรอกจำนวนเงินที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const settings = await getSettingsAsync();
        let data, updateFn, defaultLimit;
        
        if (type === '2digit') {
            data = await db.get2DigitLimits();
            updateFn = db.update2DigitLimit.bind(db);
            defaultLimit = settings.defaultLimit2Digit;
        } else if (type === '3digit-tode') {
            data = await db.get3DigitTodeLimits();
            updateFn = db.update3DigitTodeLimit.bind(db);
            defaultLimit = settings.defaultLimit3DigitTode;
        } else {
            data = await db.get3DigitTengLimits();
            updateFn = db.update3DigitTengLimit.bind(db);
            defaultLimit = settings.defaultLimit3DigitTeng;
        }
        
        if (!data[paddedNumber]) {
            data[paddedNumber] = { limit: defaultLimit, amount: 0 };
        }
        
        data[paddedNumber].amount += amount;
        await updateFn(paddedNumber, data[paddedNumber].limit, data[paddedNumber].amount);
        
        await db.addTransaction({
            date: new Date().toISOString(),
            type: type,
            number: paddedNumber,
            amount: amount,
            totalAmount: data[paddedNumber].amount,
            limit: data[paddedNumber].limit
        });
        
        const percent = (data[paddedNumber].amount / data[paddedNumber].limit) * 100;
        if (percent >= settings.alertThreshold) {
            showToast(`⚠️ เลข ${paddedNumber} ใกล้ถึงลิมิต! (${percent.toFixed(1)}%)`, 'warning');
        } else {
            showToast(`เพิ่มยอดเลข ${paddedNumber} สำเร็จ`, 'success');
        }
        
        numberInput.value = '';
        amountInput.value = '';
        
        await loadDashboard();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    }
    
    hideLoading();
}

// ==================== SETTINGS FUNCTIONS ====================
async function loadSettingsPage() {
    try {
        const settings = await db.getSettings();
        
        const alertInput = document.getElementById('alertThreshold');
        const default2Input = document.getElementById('default2DigitLimit');
        const default3TodeInput = document.getElementById('default3DigitTodeLimit');
        const default3TengInput = document.getElementById('default3DigitTengLimit');
        
        if (alertInput) alertInput.value = settings.alertThreshold;
        if (default2Input) default2Input.value = settings.defaultLimit2Digit;
        if (default3TodeInput) default3TodeInput.value = settings.defaultLimit3DigitTode;
        if (default3TengInput) default3TengInput.value = settings.defaultLimit3DigitTeng;
        
        await loadUsersTable();
    } catch (e) {
        console.error('Error loading settings:', e);
    }
}

async function saveAlertSettings() {
    const threshold = parseInt(document.getElementById('alertThreshold').value);
    if (isNaN(threshold) || threshold < 1 || threshold > 100) {
        showToast('กรุณากรอกค่าระหว่าง 1-100', 'error');
        return;
    }
    
    showLoading();
    try {
        const settings = await db.getSettings();
        settings.alertThreshold = threshold;
        await db.saveSettings(settings);
        showToast('บันทึกการตั้งค่าเรียบร้อย', 'success');
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function saveDefaultLimits() {
    const default2 = parseInt(document.getElementById('default2DigitLimit').value);
    const default3Tode = parseInt(document.getElementById('default3DigitTodeLimit').value);
    const default3Teng = parseInt(document.getElementById('default3DigitTengLimit').value);
    
    if (isNaN(default2) || isNaN(default3Tode) || isNaN(default3Teng)) {
        showToast('กรุณากรอกค่าที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    try {
        const settings = await db.getSettings();
        settings.defaultLimit2Digit = default2;
        settings.defaultLimit3DigitTode = default3Tode;
        settings.defaultLimit3DigitTeng = default3Teng;
        await db.saveSettings(settings);
        showToast('บันทึกค่าเริ่มต้นเรียบร้อย', 'success');
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function changePassword() {
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (!currentPass || !newPass || !confirmPass) {
        showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        showToast('รหัสผ่านใหม่ไม่ตรงกัน', 'error');
        return;
    }
    
    showLoading();
    try {
        const username = getCurrentUser();
        const result = await db.login(username, currentPass);
        
        if (!result.success) {
            showToast('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'error');
            hideLoading();
            return;
        }
        
        await db.updatePassword(username, newPass);
        showToast('เปลี่ยนรหัสผ่านเรียบร้อย', 'success');
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function loadUsersTable() {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    try {
        const users = await db.getUsers();
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.username}</td>
                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : '-'}</td>
                <td>
                    ${u.username !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${u.username}')">ลบ</button>` : '<span style="color:#888">-</span>'}
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Error loading users:', e);
    }
}

async function addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newUserPassword').value;
    
    if (!username || !password) {
        showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
        return;
    }
    
    showLoading();
    try {
        const result = await db.addUser(username, password);
        if (result.success) {
            showToast('เพิ่มผู้ใช้เรียบร้อย', 'success');
            document.getElementById('newUsername').value = '';
            document.getElementById('newUserPassword').value = '';
            await loadUsersTable();
        } else {
            showToast(result.message || 'เพิ่มผู้ใช้ไม่สำเร็จ', 'error');
        }
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function deleteUser(username) {
    if (!confirm(`ต้องการลบผู้ใช้ ${username} ?`)) return;
    
    showLoading();
    try {
        await db.deleteUser(username);
        showToast('ลบผู้ใช้เรียบร้อย', 'success');
        await loadUsersTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

// ==================== DATA MANAGEMENT ====================
async function exportAllData() {
    showLoading();
    try {
        const data = await db.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lottery_backup_${getToday()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('ส่งออกข้อมูลเรียบร้อย', 'success');
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('การนำเข้าข้อมูลจะแทนที่ข้อมูลปัจจุบันทั้งหมด ต้องการดำเนินการต่อ?')) {
        event.target.value = '';
        return;
    }
    
    showLoading();
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        await db.importData(data);
        showToast('นำเข้าข้อมูลเรียบร้อย', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (e) {
        showToast('ไฟล์ไม่ถูกต้อง', 'error');
    }
    hideLoading();
    event.target.value = '';
}

async function clearTodayData() {
    if (!confirm('ต้องการล้างยอดทั้งหมด (ลิมิตยังคงอยู่)?')) return;
    
    showLoading();
    try {
        await db.clearAllAmounts();
        showToast('ล้างยอดทั้งหมดเรียบร้อย', 'success');
        setTimeout(() => location.reload(), 500);
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function clearAllData() {
    if (!confirm('⚠️ ต้องการล้างข้อมูลทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้!')) return;
    if (!confirm('ยืนยันอีกครั้ง: ลบข้อมูลทั้งหมด?')) return;
    
    showLoading();
    try {
        await db.clearAllData();
        showToast('ล้างข้อมูลทั้งหมดเรียบร้อย', 'success');
        setTimeout(() => location.reload(), 500);
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    const menu = document.querySelector('.nav-menu');
    menu.classList.toggle('show');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.menu-toggle');
    if (menu && toggle && !menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('show');
    }
});

// ==================== NAVIGATION ====================
async function showAllTransactions() {
    try {
        const data2Digit = await db.get2DigitLimits();
        const data3DigitTode = await db.get3DigitTodeLimits();
        const data3DigitTeng = await db.get3DigitTengLimits();
        
        // Collect all entries with amounts > 0
        const allEntries = [];
        
        Object.entries(data2Digit).forEach(([number, item]) => {
            if (item.amount > 0) {
                allEntries.push({ type: '2 ตัว', number, amount: item.amount, limit: item.limit });
            }
        });
        
        Object.entries(data3DigitTode).forEach(([number, item]) => {
            if (item.amount > 0) {
                allEntries.push({ type: '3 ตัวโต๊ด', number, amount: item.amount, limit: item.limit });
            }
        });
        
        Object.entries(data3DigitTeng).forEach(([number, item]) => {
            if (item.amount > 0) {
                allEntries.push({ type: '3 ตัวเต็ง', number, amount: item.amount, limit: item.limit });
            }
        });
        
        // Sort by amount descending
        allEntries.sort((a, b) => b.amount - a.amount);
        
        // Create modal content
        let html = `
            <div id="allTransactionsModal" class="modal show">
                <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
                    <div class="modal-header">
                        <h3>📋 รายการทั้งหมด (${allEntries.length} รายการ)</h3>
                        <button class="modal-close" onclick="closeAllTransactionsModal()">&times;</button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ประเภท</th>
                                    <th>เลข</th>
                                    <th>ยอด/ลิมิต</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        if (allEntries.length === 0) {
            html += '<tr><td colspan="3" style="text-align:center;color:#888;">ยังไม่มีรายการ</td></tr>';
        } else {
            allEntries.forEach(entry => {
                html += `
                    <tr>
                        <td>${entry.type}</td>
                        <td>${entry.number}</td>
                        <td>${formatNumber(entry.amount)} / ${formatNumber(entry.limit)}</td>
                    </tr>
                `;
            });
        }
        
        html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeAllTransactionsModal()">ปิด</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('allTransactionsModal');
        if (existingModal) existingModal.remove();
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) {
        console.error('Error showing all transactions:', e);
        showToast('เกิดข้อผิดพลาด', 'error');
    }
}

function closeAllTransactionsModal() {
    const modal = document.getElementById('allTransactionsModal');
    if (modal) modal.remove();
}

// ==================== FILTER FUNCTIONS ====================
async function filter2DigitTable() {
    const searchValue = document.getElementById('search2Digit')?.value.toLowerCase() || '';
    const filterValue = document.getElementById('filter2Digit')?.value || 'all';
    
    const tbody = document.getElementById('tbody2Digit');
    if (!tbody) return;
    
    try {
        const data = await db.get2DigitLimits();
        const settings = await getSettingsAsync();
        
        tbody.innerHTML = '';
        
        for (let i = 0; i <= 99; i++) {
            const number = i.toString().padStart(2, '0');
            const item = data[number] || { limit: settings.defaultLimit2Digit, amount: 0 };
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            
            // Apply search filter
            if (searchValue && !number.includes(searchValue)) continue;
            
            // Apply status filter
            if (filterValue === 'has-amount' && item.amount === 0) continue;
            if (filterValue === 'near-limit' && percent < 80) continue;
            if (filterValue === 'over-limit' && percent < 100) continue;
            
            const statusClass = getStatusClass(percent);
            const statusText = getStatusText(percent);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${number}</strong></td>
                <td>${formatNumber(item.amount)}</td>
                <td>${formatNumber(item.limit)}</td>
                <td>
                    <div class="progress-container">
                        <div><div class="progress-bar ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div></div>
                        <span class="progress-text ${statusClass}">${percent.toFixed(1)}%</span>
                    </div>
                </td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEdit2DigitModal('${number}', ${item.limit}, ${item.amount})">แก้ไข</button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (e) {
        console.error('Error filtering 2-digit table:', e);
    }
}

// ==================== 2-DIGIT ADDITIONAL FUNCTIONS ====================
function closeModal() {
    closeEditModal();
}

async function saveEdit() {
    if (!current2DigitNumber) return;
    
    const newLimit = parseFloat(document.getElementById('editLimit').value);
    let newAmount = document.getElementById('editNewAmount')?.value;
    
    if (newAmount === '' || newAmount === undefined) {
        newAmount = parseFloat(document.getElementById('editAmount').value);
    } else {
        newAmount = parseFloat(newAmount);
    }
    
    if (isNaN(newLimit) || newLimit < 0) {
        showToast('กรุณากรอกลิมิตที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await db.update2DigitLimit(current2DigitNumber, newLimit, newAmount);
        showToast(`บันทึกเลข ${current2DigitNumber} เรียบร้อย`, 'success');
        closeEditModal();
        await load2DigitTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    
    hideLoading();
}

async function setDefault2DigitLimit() {
    const defaultLimit = parseFloat(document.getElementById('default2DigitLimit')?.value || 5000);
    
    if (isNaN(defaultLimit) || defaultLimit < 0) {
        showToast('กรุณากรอกลิมิตที่ถูกต้อง', 'error');
        return;
    }
    
    if (!confirm(`ต้องการตั้งลิมิตทุกเลขเป็น ${formatNumber(defaultLimit)} บาท?`)) return;
    
    showLoading();
    try {
        const data = await db.get2DigitLimits();
        for (let i = 0; i <= 99; i++) {
            const number = i.toString().padStart(2, '0');
            const currentAmount = data[number]?.amount || 0;
            await db.update2DigitLimit(number, defaultLimit, currentAmount);
        }
        showToast('ตั้งค่าลิมิตทั้งหมดเรียบร้อย', 'success');
        await load2DigitTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function resetAll2DigitAmounts() {
    if (!confirm('ต้องการรีเซ็ตยอดทั้งหมดเป็น 0?')) return;
    
    showLoading();
    try {
        const data = await db.get2DigitLimits();
        for (let i = 0; i <= 99; i++) {
            const number = i.toString().padStart(2, '0');
            const currentLimit = data[number]?.limit || 5000;
            await db.update2DigitLimit(number, currentLimit, 0);
        }
        showToast('รีเซ็ตยอดทั้งหมดเรียบร้อย', 'success');
        await load2DigitTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function set2DigitLimit() {
    const numberInput = document.getElementById('limitNumber');
    const limitInput = document.getElementById('limitAmount');
    const number = numberInput?.value.trim().padStart(2, '0');
    const limit = parseFloat(limitInput?.value);
    
    if (!/^\d{2}$/.test(number)) {
        showToast('กรุณากรอกเลข 2 ตัว', 'error');
        return;
    }
    
    if (isNaN(limit) || limit < 0) {
        showToast('กรุณากรอกลิมิตที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    try {
        const data = await db.get2DigitLimits();
        const currentAmount = data[number]?.amount || 0;
        await db.update2DigitLimit(number, limit, currentAmount);
        showToast(`ตั้งลิมิตเลข ${number} เรียบร้อย`, 'success');
        numberInput.value = '';
        limitInput.value = '';
        await load2DigitTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

// ==================== 3-DIGIT ADDITIONAL FUNCTIONS ====================
// Tode functions
async function addTodeAmount() {
    await add3DigitTodeAmount();
}

async function setTodeLimit() {
    const numberInput = document.getElementById('limitNumberTode');
    const limitInput = document.getElementById('limitValueTode');
    const number = numberInput?.value.trim().padStart(3, '0');
    const limit = parseFloat(limitInput?.value);
    
    if (!/^\d{3}$/.test(number)) {
        showToast('กรุณากรอกเลข 3 ตัว', 'error');
        return;
    }
    
    if (isNaN(limit) || limit < 0) {
        showToast('กรุณากรอกลิมิตที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    try {
        const data = await db.get3DigitTodeLimits();
        const currentAmount = data[number]?.amount || 0;
        await db.update3DigitTodeLimit(number, limit, currentAmount);
        showToast(`ตั้งลิมิตเลข ${number} โต๊ดเรียบร้อย`, 'success');
        numberInput.value = '';
        limitInput.value = '';
        await load3DigitTodeTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function setDefaultTodeLimit() {
    const defaultLimit = parseFloat(document.getElementById('defaultLimitTode')?.value || 3000);
    
    if (!confirm(`ต้องการตั้งลิมิตโต๊ดทั้งหมดเป็น ${formatNumber(defaultLimit)} บาท?`)) return;
    
    showLoading();
    try {
        const data = await db.get3DigitTodeLimits();
        for (const [number, item] of Object.entries(data)) {
            await db.update3DigitTodeLimit(number, defaultLimit, item.amount);
        }
        showToast('ตั้งค่าลิมิตโต๊ดทั้งหมดเรียบร้อย', 'success');
        await load3DigitTodeTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function resetAllTodeAmounts() {
    if (!confirm('ต้องการรีเซ็ตยอดโต๊ดทั้งหมดเป็น 0?')) return;
    
    showLoading();
    try {
        const data = await db.get3DigitTodeLimits();
        for (const [number, item] of Object.entries(data)) {
            await db.update3DigitTodeLimit(number, item.limit, 0);
        }
        showToast('รีเซ็ตยอดโต๊ดทั้งหมดเรียบร้อย', 'success');
        await load3DigitTodeTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function filterTodeTable() {
    const searchValue = document.getElementById('searchTode')?.value.toLowerCase() || '';
    const filterValue = document.getElementById('filterTode')?.value || 'all';
    
    const tbody = document.getElementById('tbodyTode');
    if (!tbody) return;
    
    try {
        const data = await db.get3DigitTodeLimits();
        const settings = await getSettingsAsync();
        
        tbody.innerHTML = '';
        const numbers = Object.keys(data).sort();
        
        if (numbers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">ยังไม่มีข้อมูล</td></tr>';
            return;
        }
        
        let hasData = false;
        for (const number of numbers) {
            const item = data[number];
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            
            if (searchValue && !number.includes(searchValue)) continue;
            if (filterValue === 'has-amount' && item.amount === 0) continue;
            if (filterValue === 'near-limit' && percent < 80) continue;
            if (filterValue === 'over-limit' && percent < 100) continue;
            
            hasData = true;
            const statusClass = getStatusClass(percent);
            const statusText = getStatusText(percent);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${number}</strong></td>
                <td>${formatNumber(item.amount)}</td>
                <td>${formatNumber(item.limit)}</td>
                <td>
                    <div class="progress-container">
                        <div><div class="progress-bar ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div></div>
                        <span class="progress-text ${statusClass}">${percent.toFixed(1)}%</span>
                    </div>
                </td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEdit3DigitTodeModal('${number}', ${item.limit}, ${item.amount})">แก้ไข</button>
                    <button class="btn btn-sm btn-danger" onclick="delete3DigitTode('${number}')">ลบ</button>
                </td>
            `;
            tbody.appendChild(row);
        }
        
        if (!hasData) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">ไม่พบข้อมูลที่ตรงกัน</td></tr>';
        }
    } catch (e) {
        console.error('Error filtering tode table:', e);
    }
}

// Teng functions
async function addTengAmount() {
    await add3DigitTengAmount();
}

async function setTengLimit() {
    const numberInput = document.getElementById('limitNumberTeng');
    const limitInput = document.getElementById('limitValueTeng');
    const number = numberInput?.value.trim().padStart(3, '0');
    const limit = parseFloat(limitInput?.value);
    
    if (!/^\d{3}$/.test(number)) {
        showToast('กรุณากรอกเลข 3 ตัว', 'error');
        return;
    }
    
    if (isNaN(limit) || limit < 0) {
        showToast('กรุณากรอกลิมิตที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    try {
        const data = await db.get3DigitTengLimits();
        const currentAmount = data[number]?.amount || 0;
        await db.update3DigitTengLimit(number, limit, currentAmount);
        showToast(`ตั้งลิมิตเลข ${number} เต็งเรียบร้อย`, 'success');
        numberInput.value = '';
        limitInput.value = '';
        await load3DigitTengTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function setDefaultTengLimit() {
    const defaultLimit = parseFloat(document.getElementById('defaultLimitTeng')?.value || 2000);
    
    if (!confirm(`ต้องการตั้งลิมิตเต็งทั้งหมดเป็น ${formatNumber(defaultLimit)} บาท?`)) return;
    
    showLoading();
    try {
        const data = await db.get3DigitTengLimits();
        for (const [number, item] of Object.entries(data)) {
            await db.update3DigitTengLimit(number, defaultLimit, item.amount);
        }
        showToast('ตั้งค่าลิมิตเต็งทั้งหมดเรียบร้อย', 'success');
        await load3DigitTengTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function resetAllTengAmounts() {
    if (!confirm('ต้องการรีเซ็ตยอดเต็งทั้งหมดเป็น 0?')) return;
    
    showLoading();
    try {
        const data = await db.get3DigitTengLimits();
        for (const [number, item] of Object.entries(data)) {
            await db.update3DigitTengLimit(number, item.limit, 0);
        }
        showToast('รีเซ็ตยอดเต็งทั้งหมดเรียบร้อย', 'success');
        await load3DigitTengTable();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    hideLoading();
}

async function filterTengTable() {
    const searchValue = document.getElementById('searchTeng')?.value.toLowerCase() || '';
    const filterValue = document.getElementById('filterTeng')?.value || 'all';
    
    const tbody = document.getElementById('tbodyTeng');
    if (!tbody) return;
    
    try {
        const data = await db.get3DigitTengLimits();
        const settings = await getSettingsAsync();
        
        tbody.innerHTML = '';
        const numbers = Object.keys(data).sort();
        
        if (numbers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">ยังไม่มีข้อมูล</td></tr>';
            return;
        }
        
        let hasData = false;
        for (const number of numbers) {
            const item = data[number];
            const percent = item.limit > 0 ? (item.amount / item.limit) * 100 : 0;
            
            if (searchValue && !number.includes(searchValue)) continue;
            if (filterValue === 'has-amount' && item.amount === 0) continue;
            if (filterValue === 'near-limit' && percent < 80) continue;
            if (filterValue === 'over-limit' && percent < 100) continue;
            
            hasData = true;
            const statusClass = getStatusClass(percent);
            const statusText = getStatusText(percent);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${number}</strong></td>
                <td>${formatNumber(item.amount)}</td>
                <td>${formatNumber(item.limit)}</td>
                <td>
                    <div class="progress-container">
                        <div><div class="progress-bar ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div></div>
                        <span class="progress-text ${statusClass}">${percent.toFixed(1)}%</span>
                    </div>
                </td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEdit3DigitTengModal('${number}', ${item.limit}, ${item.amount})">แก้ไข</button>
                    <button class="btn btn-sm btn-danger" onclick="delete3DigitTeng('${number}')">ลบ</button>
                </td>
            `;
            tbody.appendChild(row);
        }
        
        if (!hasData) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">ไม่พบข้อมูลที่ตรงกัน</td></tr>';
        }
    } catch (e) {
        console.error('Error filtering teng table:', e);
    }
}

// 3-digit modal functions
let current3DigitNumber = null;
let current3DigitType = null;

function openEdit3Modal(number, limit, amount, type) {
    current3DigitNumber = number;
    current3DigitType = type;
    document.getElementById('editNumber3').textContent = number;
    document.getElementById('editType3').textContent = type === 'tode' ? 'โต๊ด' : 'เต็ง';
    document.getElementById('editLimit3').value = limit;
    document.getElementById('editAmount3').value = amount;
    document.getElementById('editModal3').classList.add('show');
}

function closeModal3() {
    document.getElementById('editModal3').classList.remove('show');
    current3DigitNumber = null;
    current3DigitType = null;
}

async function saveEdit3() {
    if (!current3DigitNumber || !current3DigitType) return;
    
    const newLimit = parseFloat(document.getElementById('editLimit3').value);
    let newAmount = document.getElementById('editNewAmount3')?.value;
    
    if (newAmount === '' || newAmount === undefined) {
        newAmount = parseFloat(document.getElementById('editAmount3').value);
    } else {
        newAmount = parseFloat(newAmount);
    }
    
    if (isNaN(newLimit) || newLimit < 0) {
        showToast('กรุณากรอกลิมิตที่ถูกต้อง', 'error');
        return;
    }
    
    showLoading();
    
    try {
        if (current3DigitType === 'tode') {
            await db.update3DigitTodeLimit(current3DigitNumber, newLimit, newAmount);
            await load3DigitTodeTable();
        } else {
            await db.update3DigitTengLimit(current3DigitNumber, newLimit, newAmount);
            await load3DigitTengTable();
        }
        showToast(`บันทึกเลข ${current3DigitNumber} เรียบร้อย`, 'success');
        closeModal3();
    } catch (e) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
    
    hideLoading();
}
