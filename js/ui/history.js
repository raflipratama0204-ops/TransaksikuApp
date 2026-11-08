// --- TRANSACTION FILTERING & CALCULATIONS ---
function getFilteredTransactions() {
    const timeFilterEl = document.getElementById('time-filter');
    const categoryFilterEl = document.getElementById('category-filter');
    if (!timeFilterEl || !categoryFilterEl) return state.transactions || [];

    let timeVal = timeFilterEl.value;
    if (timeVal === 'specific_month') {
        const specificMonthFilter = document.getElementById('specific-month-filter');
        timeVal = specificMonthFilter ? specificMonthFilter.value : 'all';
    }
    const catVal = categoryFilterEl.value;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return state.transactions.filter(t => {
        const tDate = new Date(t.timestamp || t.id);
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();

        if (catVal !== 'all' && t.category !== catVal) return false;

        if (timeVal === 'this_month') {
            if (tMonth !== currentMonth || tYear !== currentYear) return false;
        } else if (timeVal === 'mtd') {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            if (tDate < startOfMonth || tDate > today) return false;
        } else if (timeVal === 'last_30_days') {
            let d = new Date(); d.setMonth(now.getMonth() - 1);
            if (tDate < d) return false;
        } else if (timeVal === 'last_month') {
            let lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            let lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            if (tMonth !== lastMonth || tYear !== lastYear) return false;
        } else if (timeVal === 'last_3_months') {
            let d = new Date(); d.setMonth(now.getMonth() - 3);
            if (tDate < d) return false;
        } else if (timeVal === 'last_6_months') {
            let d = new Date(); d.setMonth(now.getMonth() - 6);
            if (tDate < d) return false;
        } else if (timeVal === 'ytd') {
            if (tYear !== currentYear) return false;
        } else if (timeVal !== 'all') {
            const parts = timeVal.split('-');
            if (parts.length === 2) {
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                if (tYear !== y || tMonth !== m) return false;
            }
        }

        return true;
    });
}

function generateDynamicFilters() {
    const timeFilter = document.getElementById('time-filter');
    const catFilter = document.getElementById('category-filter');
    const specificMonthFilter = document.getElementById('specific-month-filter');
    const specificMonthContainer = document.getElementById('specific-month-container');
    if (!timeFilter || !catFilter) return;

    let currentTimeVal = timeFilter.value || 'last_30_days';
    let currentSpecificMonthVal = specificMonthFilter ? specificMonthFilter.value : '';
    const currentCatVal = catFilter.value || 'all';

    let monthsSet = new Set();
    state.transactions.forEach(t => {
        const d = new Date(t.timestamp || t.id);
        monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });

    let sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).slice(0, 12);

    let timeOptions = `
        <option value="last_30_days">1 Bulan Terakhir</option>
        <option value="mtd">Bulan Ini (MTD)</option>
        <option value="last_3_months">3 Bulan Terakhir</option>
        <option value="last_6_months">6 Bulan Terakhir</option>
        <option value="ytd">Tahun Ini (YTD)</option>
        <option value="all">Semua Waktu (All Time)</option>
    `;

    if (sortedMonths.length > 0) {
        timeOptions += `<option value="specific_month">Pilih Bulan Spesifik... 📅</option>`;
    }

    timeFilter.innerHTML = timeOptions;

    const isSpecificMonthVal = sortedMonths.includes(currentTimeVal);
    if (isSpecificMonthVal) {
        currentSpecificMonthVal = currentTimeVal;
        currentTimeVal = 'specific_month';
    }

    if (timeFilter.querySelector(`option[value="${currentTimeVal}"]`)) {
        timeFilter.value = currentTimeVal;
    } else {
        timeFilter.value = 'last_30_days';
    }

    if (sortedMonths.length > 0 && specificMonthFilter) {
        let monthOptions = '';
        sortedMonths.forEach(mStr => {
            const [y, m] = mStr.split('-');
            const dLabel = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            monthOptions += `<option value="${mStr}">${dLabel}</option>`;
        });
        specificMonthFilter.innerHTML = monthOptions;

        if (currentSpecificMonthVal && specificMonthFilter.querySelector(`option[value="${currentSpecificMonthVal}"]`)) {
            specificMonthFilter.value = currentSpecificMonthVal;
        }
    }

    if (specificMonthContainer) {
        specificMonthContainer.style.display = (timeFilter.value === 'specific_month') ? 'block' : 'none';
    }

    let catOptions = `<option value="all">Kategori: Semua</option>`;
    let catSet = new Set();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    state.transactions.forEach(t => {
        if (t.mainType === 'adjustment') return;

        const tDate = new Date(t.timestamp || t.id);
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();

        if (currentTimeVal === 'this_month') {
            if (tMonth !== currentMonth || tYear !== currentYear) return;
        } else if (currentTimeVal === 'mtd') {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            if (tDate < startOfMonth || tDate > today) return;
        } else if (currentTimeVal === 'last_30_days') {
            let d = new Date(); d.setMonth(now.getMonth() - 1);
            if (tDate < d) return;
        } else if (currentTimeVal === 'last_month') {
            let lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            let lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            if (tMonth !== lastMonth || tYear !== lastYear) return;
        } else if (currentTimeVal === 'last_3_months') {
            let d = new Date(); d.setMonth(now.getMonth() - 3);
            if (tDate < d) return;
        } else if (currentTimeVal === 'last_6_months') {
            let d = new Date(); d.setMonth(now.getMonth() - 6);
            if (tDate < d) return;
        } else if (currentTimeVal === 'ytd') {
            if (tYear !== currentYear) return;
        } else if (currentTimeVal === 'specific_month' && currentSpecificMonthVal) {
            const parts = currentSpecificMonthVal.split('-');
            if (parts.length === 2) {
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                if (tYear !== y || tMonth !== m) return;
            }
        }

        catSet.add(t.category);
    });

    Array.from(catSet).sort().forEach(c => {
        catOptions += `<option value="${c}">${c}</option>`;
    });
    catFilter.innerHTML = catOptions;
    if (catFilter.querySelector(`option[value="${currentCatVal}"]`)) {
        catFilter.value = currentCatVal;
    } else {
        catFilter.value = 'all';
    }
}

function handleTimeFilterChange() {
    const timeFilter = document.getElementById('time-filter');
    const specificMonthContainer = document.getElementById('specific-month-container');

    if (timeFilter && specificMonthContainer) {
        if (timeFilter.value === 'specific_month') {
            specificMonthContainer.style.display = 'block';
        } else {
            specificMonthContainer.style.display = 'none';
        }
    }
    applyFilter();
}

function applyFilter() {
    generateDynamicFilters();
    renderTransactions();
    if (typeof calculateCashflow === 'function') calculateCashflow();
    if (typeof renderDebtChartAndBreakdown === 'function') renderDebtChartAndBreakdown();
    if (typeof renderReceivablesChartAndBreakdown === 'function') renderReceivablesChartAndBreakdown();
}

// --- RENDER TRANSACTION HISTORY & CARDS ---
function renderTransactions() {
    const container = document.getElementById('history-list') || document.getElementById('transaction-list');
    if (!container) return;
    container.innerHTML = '';

    const filteredTrans = getFilteredTransactions();
    const sortedTrans = [...filteredTrans].sort((a, b) => {
        let timeA = a.timestamp || a.id;
        let timeB = b.timestamp || b.id;
        return timeB - timeA;
    });

    if (sortedTrans.length === 0) {
        container.innerHTML = `<div class="card" style="text-align:center; color:var(--text-muted); padding: 35px; border-radius: 16px; font-weight: 500;">Tidak ada transaksi sesuai filter yang dipilih.</div>`;
        return;
    }

    sortedTrans.forEach(t => {
        let badgeClass = '';
        let valColor = '';
        let cardTypeClass = '';

        if (t.mainType === 'income') {
            badgeClass = 'bg-green'; valColor = 'color: var(--success);'; cardTypeClass = 'income-card';
        } else if (t.mainType === 'expense') {
            badgeClass = 'bg-red'; valColor = 'color: var(--danger);'; cardTypeClass = 'expense-card';
        } else if (t.mainType === 'debt') {
            badgeClass = 'bg-purple'; valColor = 'color: var(--purple);'; cardTypeClass = 'debt-card';
        } else if (t.mainType === 'receivables') {
            badgeClass = 'bg-green'; valColor = 'color: var(--success);'; cardTypeClass = 'income-card';
        } else if (t.mainType === 'adjustment') {
            badgeClass = 'bg-gray';
            valColor = (t.category === 'Koreksi (+)' || t.category === 'Saldo Awal') ? 'color: var(--success);' : 'color: var(--danger);';
            cardTypeClass = 'adjustment-card';
        } else if (t.category === 'Penarikan Investasi') {
            badgeClass = 'bg-green';
            valColor = 'color: var(--success); font-weight: 700;';
            cardTypeClass = 'income-card';
        } else {
            badgeClass = 'bg-blue'; valColor = 'color: var(--text-main);'; cardTypeClass = 'transfer-card';
        }

        let walletDisplay = '';
            if (t.category === 'Penarikan Investasi') {
                walletDisplay = `📥 ${t.walletName}`;
            } else if (t.mainType === 'transfer') {
                walletDisplay = `🔄 ${t.walletName}`;
            } else if (t.mainType === 'debt' && !t.walletId) {
                walletDisplay = `💸 ${t.walletName}`;
            } else {
                walletDisplay = `💳 ${t.walletName}`;
            }

            const showTime = localStorage.getItem('transaksiku_show_time') !== 'false';
            let timeHtml = '';
            if (showTime) {
                const tDate = new Date(t.timestamp || t.id);
                const hrs = String(tDate.getHours()).padStart(2, '0');
                const mins = String(tDate.getMinutes()).padStart(2, '0');
                timeHtml = ` <span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">⏰ ${hrs}:${mins}</span>`;
            }

            container.innerHTML += `
            <div class="transaction-card ${cardTypeClass}">
                <div class="t-card-header">
                    <span class="badge ${badgeClass}">${t.category}</span>
                    <span class="t-card-date">${t.date}${timeHtml}</span>
                </div>
                <div class="t-card-body">
                    <span class="t-card-desc">${t.desc}</span>
                    <span class="t-card-amount" style="${valColor}">${formatRp(t.amount)}</span>
                </div>
                <div class="t-card-footer">
                    <div class="t-card-wallet">${walletDisplay}</div>
                    <div class="t-card-actions">
                        <button onclick="editTransaction(${t.id})" class="btn-t-action btn-t-edit">✏️ Ubah</button>
                        <button onclick="deleteTransaction(${t.id})" class="btn-t-action btn-t-delete">🗑️ Hapus</button>
                    </div>
                </div>
            </div>
        `;
        });
}
