// --- NAVIGATION & SIDEBAR ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (sidebar && backdrop) {
        const isOpen = sidebar.classList.toggle('open');
        if (isOpen) {
            backdrop.style.display = 'block';
            setTimeout(() => backdrop.classList.add('show'), 10);
        } else {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.style.display = 'none', 300);
        }
    }
}

function navigateTo(viewId) {
    const currentView = document.querySelector('.app-view.active');
    const targetView = document.getElementById('view-' + viewId);

    if (currentView === targetView) return; // Sudah di view ini

    // Tampilkan/sembunyikan global filter card
    const globalFilter = document.getElementById('global-filter-card');
    if (globalFilter) {
        if (viewId === 'dashboard' || viewId === 'debt' || viewId === 'receivables') {
            globalFilter.style.display = 'none';
        } else {
            globalFilter.style.display = 'block';
        }
    }

    // Update status aktif di menu bottom nav
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
        el.classList.remove('active');
    });
    const activeBottomBtn = document.getElementById('bottom-nav-' + viewId);
    if (activeBottomBtn) {
        activeBottomBtn.classList.add('active');
    }

    // Tutup sidebar drawer setelah navigasi
    const drawer = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer && backdrop) {
        drawer.classList.remove('open');
        backdrop.classList.remove('show');
    }

    // Pemicu rendering grafik Chart.js jika beralih ke Laporan Arus Kas, Hutang, atau Piutang
    if (viewId === 'cashflow' || viewId === 'debt' || viewId === 'receivables') {
        setTimeout(() => {
            applyFilter();
        }, 300);
    } else {
        applyFilter();
    }

    if (currentView && targetView) {
        currentView.classList.remove('visible');
        setTimeout(() => {
            currentView.classList.remove('active');
            currentView.style.display = 'none';

            targetView.style.display = 'block';
            targetView.classList.add('active');
            targetView.offsetHeight; // Force reflow
            targetView.classList.add('visible');
        }, 250);
    } else if (targetView) {
        targetView.style.display = 'block';
        targetView.classList.add('active');
        targetView.offsetHeight;
        targetView.classList.add('visible');
    }
}

// --- FORM WALLET & WALLET OPTION DROPDOWNS ---
function toggleAddWalletForm() {
    const container = document.getElementById('add-wallet-container');
    if (container) {
        container.style.display = (container.style.display === 'none' || container.style.display === '') ? 'block' : 'none';
    }
}

function toggleWalletMenu(id) {
    document.querySelectorAll('.wallet-dropdown').forEach(el => {
        if (el.id !== `w-menu-${id}`) el.style.display = 'none';
    });
    const menu = document.getElementById(`w-menu-${id}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    }
}

// Menutup dropdown dompet jika mengklik di luar area
document.addEventListener('click', function (e) {
    if (!e.target.closest('.wallet-menu-container')) {
        document.querySelectorAll('.wallet-dropdown').forEach(el => el.style.display = 'none');
    }
});

// Update opsi transfer/dompet normal berdasarkan jenis transaksi yang dipilih
function updateCategoryOptions() {
    const mainTypeEl = document.getElementById('trans-main-type');
    const categorySelect = document.getElementById('trans-category');
    const fieldsContainer = document.getElementById('trans-fields-container');

    if (!mainTypeEl || !categorySelect) return;
    const mainType = mainTypeEl.value;

    if (!mainType) {
        if (fieldsContainer) fieldsContainer.style.display = 'none';
        return;
    }
    if (fieldsContainer) fieldsContainer.style.display = 'block';

    categorySelect.innerHTML = '';

    if (mainType === 'expense') {
        categorySelect.innerHTML = `
            <option value="Makanan">🍔 Makanan & Minuman</option>
            <option value="Hiburan">🎬 Hiburan & Rekreasi</option>
            <option value="Pendidikan">📚 Pendidikan / Kursus</option>
            <option value="Belanja">🛒 Belanja Bulanan / Keperluan</option>
            <option value="Transportasi">🚗 Transportasi / Bensin</option>
            <option value="Tagihan">💡 Tagihan / Listrik / Operasional</option>
            <option value="Bayar Pinjaman Bank" style="font-weight: bold;">🏦 Bayar Pinjaman Bank</option>
            <option value="Bayar Kartu Kredit" style="font-weight: bold;">💳 Bayar Paylater / Kartu Kredit</option>
            <option value="Bayar Pinjaman Pribadi" style="font-weight: bold;">🤝 Bayar Pinjaman Teman / Keluarga</option>
            <option value="Kerugian Investasi" style="color:var(--danger); font-weight:bold;">📉 Kerugian Investasi (Cut Loss)</option>
            <option value="Kesehatan">💊 Kesehatan / Medis</option>
            <option value="Biaya Admin Kartu Debit">💳 Biaya Admin Kartu Debit</option>
            <option value="Lainnya">💸 Pengeluaran Lain</option>
        `;
    } else if (mainType === 'income') {
        categorySelect.innerHTML = `
            <option value="Gaji">💰 Gaji / Omzet Bisnis</option>
            <option value="Keuntungan Investasi" style="color:var(--success); font-weight:bold;">📈 Keuntungan Investasi (Profit/Dividen)</option>
            <option value="Penerimaan Pelunasan Piutang Pribadi" style="color:var(--success); font-weight:bold;">🤝 Penerimaan Pelunasan Piutang Pribadi</option>
            <option value="Penerimaan Pelunasan Piutang Usaha" style="color:var(--success); font-weight:bold;">💼 Penerimaan Pelunasan Piutang Usaha</option>
            <option value="Lainnya">💵 Pemasukan Lain-lain</option>
        `;
    } else if (mainType === 'debt') {
        categorySelect.innerHTML = `
            <option value="Pinjaman Bank">🏦 Pinjaman Bank / KTA</option>
            <option value="Kartu Kredit">💳 Paylater / Kartu Kredit</option>
            <option value="Pinjaman Pribadi">🤝 Pinjaman Teman / Keluarga</option>
        `;
    } else if (mainType === 'receivables') {
        categorySelect.innerHTML = `
            <option value="Piutang Pribadi">🤝 Pinjaman Teman / Keluarga</option>
            <option value="Piutang Usaha">💼 Pinjaman Operasional Bisnis</option>
        `;
    } else if (mainType === 'transfer') {
        categorySelect.innerHTML = `
            <option value="Mutasi">🔄 Mutasi Kas (Tarik / Setor Tunai)</option>
            <option value="Investasi">🏦 Top Up Portofolio (Beli Saham/Reksa Dana)</option>
        `;
    }

    const customOptions = state.customCategories
        .filter(cat => cat.type === mainType)
        .map(cat => `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`)
        .join('');
    categorySelect.innerHTML += customOptions;

    toggleTransferFields();
}

// --- RENDERING WALLETS & BALANCE SUMMARIES ---
function updateSummaries() {
    let totalCash = 0; 
    let totalInvest = 0;
    state.wallets.forEach(w => {
        if (w.type === 'invest') totalInvest += w.balance;
        else totalCash += w.balance;
    });

    const sumTotalEl = document.getElementById('sum-total');
    const sumCashEl = document.getElementById('sum-cash');
    const sumPortfolioEl = document.getElementById('sum-portfolio');

    if (sumTotalEl) sumTotalEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash + totalInvest);
    if (sumCashEl) sumCashEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash);
    if (sumPortfolioEl) sumPortfolioEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalInvest);
}

function renderWallets() {
    const list = document.getElementById('wallet-list');
    const selectSingle = document.getElementById('trans-wallet');
    const selectFrom = document.getElementById('trans-from');
    const selectTo = document.getElementById('trans-to');

    if (!list) return;

    list.innerHTML = ''; 
    if (selectSingle) selectSingle.innerHTML = ''; 
    if (selectFrom) selectFrom.innerHTML = ''; 
    if (selectTo) selectTo.innerHTML = '';

    state.wallets.forEach(w => {
        const typeClass = w.type === 'invest' ? 'invest-type' : 'cash-type';
        const typeLabel = w.type === 'invest' ? 'Investasi' : 'Kas & Bank';
        const displayBalance = state.hideBalancesActive ? 'Rp ••••••' : formatRp(w.balance);

        list.innerHTML += `
            <div class="wallet-item ${typeClass}">
                <div class="w-info">
                    <h4>${w.name}</h4>
                    <p>${typeLabel}</p>
                </div>
                <div class="w-balance">
                    <span class="w-balance-val">${displayBalance}</span>
                    <div class="wallet-menu-container">
                        <button onclick="toggleWalletMenu(${w.id})" class="btn-option">Opsi ▼</button>
                        <div id="w-menu-${w.id}" class="wallet-dropdown" style="display:none;">
                            <button onclick="editWalletName(${w.id}); toggleWalletMenu(${w.id})">✏️ Ubah Nama</button>
                            <button onclick="editWalletBalance(${w.id}); toggleWalletMenu(${w.id})">⚙️ Koreksi Saldo</button>
                            <button onclick="deleteWallet(${w.id}); toggleWalletMenu(${w.id})" style="color:var(--danger);">🗑️ Hapus Akun</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const option = `<option value="${w.id}">${w.name}</option>`;
        if (selectSingle) selectSingle.innerHTML += option; 
        if (selectFrom) selectFrom.innerHTML += option; 
        if (selectTo) selectTo.innerHTML += option;
    });

    updateSummaries();
    const transMainTypeEl = document.getElementById('trans-main-type');
    if (transMainTypeEl && transMainTypeEl.value === 'transfer') {
        toggleTransferFields();
    }
}

// --- CRUD WALLETS HANDLERS ---
async function addWallet() {
    const nameInput = document.getElementById('new-wallet-name');
    const balanceInput = document.getElementById('new-wallet-balance');
    const typeSelect = document.getElementById('new-wallet-type');
    if (!nameInput || !balanceInput || !typeSelect) return;

    const name = nameInput.value.trim();
    const initialBalance = parseCurrencyValue(balanceInput.value) || 0;
    const type = typeSelect.value;

    if (!name) {
        await customAlert('Nama akun tidak boleh kosong!', 'Input Tidak Valid');
        return;
    }

    const newId = Date.now();
    state.wallets.push({ id: newId, name: name, balance: initialBalance, type: type });

    if (initialBalance > 0) {
        const dateObj = new Date();
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        state.transactions.push({
            id: Date.now() + 1, timestamp: dateObj.getTime(), date: dateStr,
            desc: 'Saldo Awal Akun', mainType: 'adjustment', category: 'Saldo Awal',
            amount: initialBalance, walletName: name, walletId: newId
        });
    }

    saveData();
    nameInput.value = '';
    balanceInput.value = '';
    const addWalletContainer = document.getElementById('add-wallet-container');
    if (addWalletContainer) addWalletContainer.style.display = 'none';
}

async function editWalletBalance(id) {
    let w = state.wallets.find(wallet => wallet.id === id);
    if (w) {
        let newBalanceStr = await customPrompt(`Masukkan saldo aktual untuk dompet '${w.name}':`, w.balance.toString(), 'Koreksi Saldo', true);
        if (newBalanceStr !== null && newBalanceStr.trim() !== "") {
            let newBalance = parseCurrencyValue(newBalanceStr);
            if (!isNaN(newBalance) && newBalance !== w.balance) {
                let diff = newBalance - w.balance;
                w.balance = newBalance;

                const dateObj = new Date();
                const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

                state.transactions.push({
                    id: Date.now(), timestamp: dateObj.getTime(), date: dateStr,
                    desc: 'Koreksi Saldo Manual',
                    mainType: 'adjustment',
                    category: diff > 0 ? 'Koreksi (+)' : 'Koreksi (-)',
                    amount: Math.abs(diff), walletName: w.name, walletId: w.id
                });

                saveData();
                customAlert(`Saldo ${w.name} berhasil diperbarui.\nSelisih otomatis tercatat sebagai penyesuaian di riwayat.`, 'Sukses');
            }
        }
    }
}

async function editWalletName(id) {
    let w = state.wallets.find(wallet => wallet.id === id);
    if (w) {
        let newName = await customPrompt(`Ubah nama untuk dompet '${w.name}':`, w.name, 'Ganti Nama', false);
        if (newName && newName.trim() !== "") { 
            w.name = newName.trim(); 
            saveData(); 
        }
    }
}

async function deleteWallet(id) {
    let w = state.wallets.find(wallet => wallet.id === id);
    if (!w) return;

    if (w.balance !== 0) {
        await customAlert(`Dompet [${w.name}] tidak bisa dihapus karena masih ada saldo ${formatRp(w.balance)}.\nKosongkan saldonya terlebih dahulu.`, 'Gagal Menghapus');
        return;
    }

    let isConfirm = await customConfirm(`Yakin ingin menghapus dompet [${w.name}]?`, 'Hapus Dompet');
    if (isConfirm) {
        state.wallets = state.wallets.filter(wallet => wallet.id !== id);
        saveData();
    }
}

// --- TRANSACTION FILTERING & CALCULATIONS ---
function getFilteredTransactions() {
    const timeFilterEl = document.getElementById('time-filter');
    const categoryFilterEl = document.getElementById('category-filter');
    if (!timeFilterEl || !categoryFilterEl) return [];

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
    console.log("DEBUG APPLYFILTER: generateDynamicFilters starting");
    generateDynamicFilters();
    console.log("DEBUG APPLYFILTER: renderTransactions starting");
    renderTransactions();
    console.log("DEBUG APPLYFILTER: calculateCashflow starting");
    calculateCashflow();
    console.log("DEBUG APPLYFILTER: renderDebtChartAndBreakdown starting");
    renderDebtChartAndBreakdown();
    console.log("DEBUG APPLYFILTER: renderReceivablesChartAndBreakdown starting");
    renderReceivablesChartAndBreakdown();
    console.log("DEBUG APPLYFILTER: applyFilter completed");
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
        } else {
            badgeClass = 'bg-blue'; valColor = 'color: var(--text-main);'; cardTypeClass = 'transfer-card';
        }

        let walletDisplay = '';
        if (t.mainType === 'transfer') {
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

// --- CASHFLOW REPORTING & METRICS ---
function calculateCashflow() {
    const filteredTrans = getFilteredTransactions();
    const expenseContainer = document.getElementById('cashflow-expense-list');
    const incomeContainer = document.getElementById('cashflow-income-list');
    const debtContainer = document.getElementById('cashflow-debt-list');

    if (!expenseContainer || !incomeContainer || !debtContainer) return;

    expenseContainer.innerHTML = ''; 
    incomeContainer.innerHTML = ''; 
    debtContainer.innerHTML = '';

    let globalDebtTaken = 0;
    let globalDebtPaid = 0;
    state.transactions.forEach(t => {
        if (t.mainType === 'debt') globalDebtTaken += t.amount;
        if (t.mainType === 'expense' && (t.category === 'Cicilan' || t.category === 'Bayar Pinjaman Bank' || t.category === 'Bayar Kartu Kredit' || t.category === 'Bayar Pinjaman Pribadi')) {
            globalDebtPaid += t.amount;
        }
    });
    const outstandingDebt = Math.max(0, globalDebtTaken - globalDebtPaid);

    let summary = {};
    let totalIncome = 0; 
    let totalExpense = 0;
    let currentPeriodDebtPaid = 0; 
    let currentPeriodDebtTaken = 0;

    const walletTypes = {};
    state.wallets.forEach(w => {
        walletTypes[w.id] = w.type;
    });

    filteredTrans.forEach(t => {
        if (t.mainType === 'adjustment') return;

        if (t.mainType === 'income') {
            if (walletTypes[t.walletId] === 'cash') {
                let key = `${t.mainType}-${t.category}`;
                summary[key] = (summary[key] || 0) + t.amount;
                totalIncome += t.amount;
            }
        } else if (t.mainType === 'expense') {
            if (walletTypes[t.walletId] === 'cash') {
                let key = `${t.mainType}-${t.category}`;
                summary[key] = (summary[key] || 0) + t.amount;
                totalExpense += t.amount;
                if (t.category === 'Cicilan' || t.category === 'Bayar Pinjaman Bank' || t.category === 'Bayar Kartu Kredit' || t.category === 'Bayar Pinjaman Pribadi') {
                    currentPeriodDebtPaid += t.amount;
                }
            }
        } else if (t.mainType === 'debt') {
            if ((t.debtCashflow === 'ya' || (t.debtCashflow === undefined && t.walletId)) && walletTypes[t.walletId] === 'cash') {
                let key = `${t.mainType}-${t.category}`;
                summary[key] = (summary[key] || 0) + t.amount;
                currentPeriodDebtTaken += t.amount;
            }
        } else if (t.mainType === 'transfer') {
            const fromType = walletTypes[t.fromId];
            const toType = walletTypes[t.toId];

            if (fromType === 'cash' && toType === 'invest') {
                let key = `expense-Investasi`;
                summary[key] = (summary[key] || 0) + t.amount;
                totalExpense += t.amount;
            } else if (fromType === 'invest' && toType === 'cash') {
                let key = `income-Penarikan Investasi`;
                summary[key] = (summary[key] || 0) + t.amount;
                totalIncome += t.amount;
            }
        }
    });

    const metricIncomeEl = document.getElementById('metric-income');
    const metricExpenseEl = document.getElementById('metric-expense');
    if (metricIncomeEl) metricIncomeEl.innerText = formatRp(totalIncome + currentPeriodDebtTaken);
    if (metricExpenseEl) metricExpenseEl.innerText = formatRp(totalExpense);

    const net = totalIncome + currentPeriodDebtTaken - totalExpense;
    const netEl = document.getElementById('metric-net');
    if (netEl) {
        netEl.innerText = formatRp(net);
        netEl.style.color = net < 0 ? 'var(--danger)' : (net > 0 ? 'var(--success)' : 'var(--accent)');
    }

    const outDebtEl = document.getElementById('metric-outstanding-debt');
    const outDebtBox = document.getElementById('outstanding-debt-box');
    const periodDebtTakenEl = document.getElementById('metric-debt-taken-period');

    if (outDebtEl) outDebtEl.innerText = formatRp(outstandingDebt);
    if (periodDebtTakenEl) periodDebtTakenEl.innerText = 'Diambil Periode Ini: ' + formatRp(currentPeriodDebtTaken);

    if (outDebtBox && outDebtEl) {
        if (outstandingDebt === 0) {
            outDebtEl.style.color = 'var(--success)';
            outDebtBox.style.borderColor = 'var(--success)';
            outDebtBox.style.background = '#f0fdf4';
        } else {
            outDebtEl.style.color = 'var(--purple)';
            outDebtBox.style.borderColor = 'var(--purple)';
            outDebtBox.style.background = '#f5f3ff';
        }
    }

    const ratioEl = document.getElementById('metric-ratio');
    const ratioBox = document.getElementById('ratio-box');
    const ratioDesc = document.getElementById('ratio-desc');

    let totalAssets = 0;
    state.wallets.forEach(w => {
        totalAssets += w.balance;
    });

    if (ratioEl && ratioBox && ratioDesc) {
        if (totalAssets > 0) {
            const ratio = parseFloat(((outstandingDebt / totalAssets) * 100).toFixed(1));
            ratioEl.innerText = ratio + '%';

            if (ratio > 50) {
                ratioBox.style.borderColor = 'var(--danger)'; ratioBox.style.backgroundColor = '#fef2f2';
                ratioEl.style.color = 'var(--danger)'; ratioDesc.style.color = 'var(--danger)';
                ratioDesc.innerText = '⚠️ Berisiko (>50%)';
            } else if (ratio > 30) {
                ratioBox.style.borderColor = 'var(--warning)'; ratioBox.style.backgroundColor = '#fffbeb';
                ratioEl.style.color = 'var(--warning)'; ratioDesc.style.color = 'var(--warning)';
                ratioDesc.innerText = 'Batas Wajar (30%-50%)';
            } else {
                ratioBox.style.borderColor = 'var(--success)'; ratioBox.style.backgroundColor = '#f0fdf4';
                ratioEl.style.color = 'var(--success)'; ratioDesc.style.color = 'var(--success)';
                ratioDesc.innerText = 'Sangat Sehat (<30%)';
            }
        } else {
            if (outstandingDebt > 0) {
                ratioEl.innerText = '⚠️ Bahaya';
                ratioBox.style.borderColor = 'var(--danger)'; ratioBox.style.backgroundColor = '#fef2f2';
                ratioDesc.innerText = 'Ada Hutang Tanpa Aset!';
                ratioEl.style.color = 'var(--danger)'; ratioDesc.style.color = 'var(--danger)';
            } else {
                ratioEl.innerText = '0%';
                ratioBox.style.borderColor = 'var(--success)'; ratioBox.style.backgroundColor = '#f0fdf4';
                ratioDesc.innerText = 'Sangat Sehat';
                ratioEl.style.color = 'var(--success)'; ratioDesc.style.color = 'var(--success)';
            }
        }
    }

    let expenseCats = [];
    for (let key in summary) {
        if (key.startsWith('expense-')) expenseCats.push({ name: key.replace('expense-', ''), amount: summary[key] });
    }

    let expCount = 0;
    expenseCats.sort((a, b) => b.amount - a.amount).forEach(c => {
        let percentage = totalExpense > 0 ? ((c.amount / totalExpense) * 100).toFixed(1) : 0;
        let itemHtml = `
            <div class="flow-item">
                <div class="flow-header">
                    <span class="flow-category">${c.name}</span>
                    <span class="flow-amount" style="color: var(--danger)">${formatRp(c.amount)} <span style="font-size:0.8rem; color:var(--text-muted); (${percentage}%)</span></span>
                </div>
                <div class="flow-bar-bg">
                    <div class="flow-bar-fill" style="width: ${percentage}%; background-color: var(--danger);"></div>
                </div>
            </div>
        `;
        expenseContainer.innerHTML += itemHtml;
        expCount++;
    });
    if (expCount === 0) expenseContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Tidak ada pengeluaran.</p>';

    let incCount = 0;
    for (let key in summary) {
        if (key.startsWith('income-')) {
            let name = key.replace('income-', '');
            incomeContainer.innerHTML += `<div class="flow-item" style="border-bottom: 1px solid #f1f5f9; padding: 12px 0;"><div style="display:flex; justify-content:space-between;"><span class="flow-category">${name}</span><span class="flow-amount" style="color: var(--success)">${formatRp(summary[key])}</span></div></div>`;
            incCount++;
        }
    }
    if (incCount === 0) incomeContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Tidak ada pemasukan.</p>';

    let debtCount = 0;
    for (let key in summary) {
        if (key.startsWith('debt-')) {
            let name = key.replace('debt-', '');
            debtContainer.innerHTML += `<div class="flow-item" style="border-bottom: 1px solid #f1f5f9; padding: 12px 0;"><div style="display:flex; justify-content:space-between;"><span class="flow-category">${name}</span><span class="flow-amount" style="color: var(--purple)">${formatRp(summary[key])}</span></div></div>`;
            debtCount++;
        }
    }
    if (debtCount === 0) debtContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Bersih! Tidak ada pinjaman diambil.</p>';

    // rendering Chart
    if (typeof Chart !== 'undefined') {
        renderChart(totalIncome, totalExpense, currentPeriodDebtTaken);
        renderComparisonChart(totalIncome + currentPeriodDebtTaken, totalExpense);
    }
}

// --- DEBT REPORT & CALCULATIONS ---
function renderDebtChartAndBreakdown() {
    let bankT = 0, bankP = 0;
    let ccT = 0, ccP = 0;
    let persT = 0, persP = 0;

    const chronoTransactions = [...state.transactions].sort((a, b) => {
        let timeA = a.timestamp || a.id;
        let timeB = b.timestamp || b.id;
        return timeA - timeB;
    });

    chronoTransactions.forEach(t => {
        if (t.mainType === 'debt' && t.category === 'Pinjaman Bank') {
            bankT += t.amount;
        } else if (t.mainType === 'expense' && t.category === 'Bayar Pinjaman Bank') {
            bankP += t.amount;
            if (bankP >= bankT) {
                bankT = 0; bankP = 0;
            }
        }

        if (t.mainType === 'debt' && t.category === 'Kartu Kredit') {
            ccT += t.amount;
        } else if (t.mainType === 'expense' && t.category === 'Bayar Kartu Kredit') {
            ccP += t.amount;
            if (ccP >= ccT) {
                ccT = 0; ccP = 0;
            }
        }

        if (t.mainType === 'debt' && t.category === 'Pinjaman Pribadi') {
            persT += t.amount;
        } else if (t.mainType === 'expense' && (t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Cicilan')) {
            persP += t.amount;
            if (persP >= persT) {
                persT = 0; persP = 0;
            }
        }
    });

    const bankOut = Math.max(0, bankT - bankP);
    const ccOut = Math.max(0, ccT - ccP);
    const persOut = Math.max(0, persT - persP);

    const breakdownContainer = document.getElementById('debt-breakdown-list');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = `
            <div class="flow-item" style="border-bottom: 1px solid rgba(226, 232, 240, 0.1); padding-bottom: 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem;">🏦 Pinjaman Bank / KTA</span>
                    <span style="color: #3b82f6; font-weight: 700; font-size: 1rem;">${formatRp(bankOut)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    <span>Total Pinjam: ${formatRp(bankT)}</span>
                    <span>Total Bayar: ${formatRp(bankP)}</span>
                </div>
            </div>
            <div class="flow-item" style="border-bottom: 1px solid rgba(226, 232, 240, 0.1); padding-bottom: 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem;">💳 Paylater & Kartu Kredit</span>
                    <span style="color: #f59e0b; font-weight: 700; font-size: 1rem;">${formatRp(ccOut)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    <span>Total Pinjam: ${formatRp(ccT)}</span>
                    <span>Total Bayar: ${formatRp(ccP)}</span>
                </div>
            </div>
            <div class="flow-item" style="padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem;">🤝 Teman & Keluarga</span>
                    <span style="color: #8b5cf6; font-weight: 700; font-size: 1rem;">${formatRp(persOut)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    <span>Total Pinjam: ${formatRp(persT)}</span>
                    <span>Total Bayar: ${formatRp(persP)}</span>
                </div>
            </div>
        `;
    }

    if (typeof Chart !== 'undefined') {
        renderDebtChart(bankOut, ccOut, persOut);
    }

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();

    const debtPayments = state.transactions.filter(t => {
        return t.mainType === 'expense' && (
            t.category === 'Bayar Pinjaman Bank' ||
            t.category === 'Bayar Kartu Kredit' ||
            t.category === 'Bayar Pinjaman Pribadi' ||
            t.category === 'Cicilan'
        );
    });

    let paidBankThisMonth = false;
    let paidCcThisMonth = false;
    let paidPersThisMonth = false;

    debtPayments.forEach(t => {
        const tDate = new Date(t.timestamp || t.id);
        if (tDate.getFullYear() === nowYear && tDate.getMonth() === nowMonth) {
            if (t.category === 'Bayar Pinjaman Bank') {
                paidBankThisMonth = true;
            } else if (t.category === 'Bayar Kartu Kredit') {
                paidCcThisMonth = true;
            } else if (t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Cicilan') {
                paidPersThisMonth = true;
            }
        }
    });

    const monthlyCard = document.getElementById('debt-monthly-status-card');
    const monthlyStatusContainer = document.getElementById('debt-monthly-status-list');
    if (monthlyCard && monthlyStatusContainer) {
        if (bankOut === 0 && ccOut === 0 && persOut === 0 && !paidBankThisMonth && !paidCcThisMonth && !paidPersThisMonth) {
            monthlyCard.style.display = 'none';
        } else {
            monthlyCard.style.display = 'block';
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const currentMonthName = monthNames[nowMonth] + " " + nowYear;

            let html = `
                <div style="text-align: center; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">
                    Periode: <strong>${currentMonthName}</strong>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
            `;

            if (bankOut > 0 || paidBankThisMonth) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: var(--bg); border: 1px solid ${paidBankThisMonth ? 'var(--success)' : 'rgba(226, 232, 240, 0.5)'};">
                        <span style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                            🏦 Pinjaman Bank
                        </span>
                        <span style="font-size: 0.85rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; color: #fff; background: ${paidBankThisMonth ? 'var(--success)' : 'var(--danger)'};">
                            ${paidBankThisMonth ? '✅ Sudah Dibayar' : '⚠️ Belum Dibayar'}
                        </span>
                    </div>
                `;
            }

            if (ccOut > 0 || paidCcThisMonth) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: var(--bg); border: 1px solid ${paidCcThisMonth ? 'var(--success)' : 'rgba(226, 232, 240, 0.5)'};">
                        <span style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                            💳 Paylater & Kartu Kredit
                        </span>
                        <span style="font-size: 0.85rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; color: #fff; background: ${paidCcThisMonth ? 'var(--success)' : 'var(--danger)'};">
                            ${paidCcThisMonth ? '✅ Sudah Dibayar' : '⚠️ Belum Dibayar'}
                        </span>
                    </div>
                `;
            }

            if (persOut > 0 || paidPersThisMonth) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: var(--bg); border: 1px solid ${paidPersThisMonth ? 'var(--success)' : 'rgba(226, 232, 240, 0.5)'};">
                        <span style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                            🤝 Teman & Keluarga
                        </span>
                        <span style="font-size: 0.85rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; color: #fff; background: ${paidPersThisMonth ? 'var(--success)' : 'var(--danger)'};">
                            ${paidPersThisMonth ? '✅ Sudah Dibayar' : '⚠️ Belum Dibayar'}
                        </span>
                    </div>
                `;
            }

            html += `</div>`;
            monthlyStatusContainer.innerHTML = html;
        }
    }

    const historyContainer = document.getElementById('debt-payment-history-list');
    if (historyContainer) {
        if (debtPayments.length === 0) {
            historyContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 25px; font-size: 0.9rem;">
                    Belum ada riwayat pembayaran hutang.
                </div>
            `;
        } else {
            const sortedPayments = [...debtPayments].sort((a, b) => {
                let timeA = a.timestamp || a.id;
                let timeB = b.timestamp || b.id;
                return timeB - timeA;
            });

            let historyHtml = '';
            sortedPayments.forEach(p => {
                let categoryIconAndName = '';
                if (p.category === 'Bayar Pinjaman Bank') {
                    categoryIconAndName = '🏦 Pembayaran Pinjaman Bank';
                } else if (p.category === 'Bayar Kartu Kredit') {
                    categoryIconAndName = '💳 Pembayaran Paylater / KK';
                } else if (p.category === 'Bayar Pinjaman Pribadi' || p.category === 'Cicilan') {
                    categoryIconAndName = '🤝 Pembayaran Pinjaman Teman / Keluarga';
                } else {
                    categoryIconAndName = `💸 ${p.category}`;
                }

                historyHtml += `
                    <div class="flow-item" style="border-bottom: 1px solid rgba(226, 232, 240, 0.1); padding-bottom: 10px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                            <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                                <span style="font-weight: 600; font-size: 0.78rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${categoryIconAndName}">${categoryIconAndName}</span>
                                <span style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">📅 Tanggal: ${p.date}</span>
                            </div>
                            <span style="color: var(--success); font-weight: 700; font-size: 0.82rem; white-space: nowrap; flex-shrink: 0;">${formatRp(p.amount)}</span>
                        </div>
                    </div>
                `;
            });
            historyContainer.innerHTML = historyHtml;
        }
    }
}

// --- RECEIVABLES REPORT & CALCULATIONS ---
function renderReceivablesChartAndBreakdown() {
    let persT = 0, persP = 0;
    let bizT = 0, bizP = 0;

    const chronoTransactions = [...state.transactions].sort((a, b) => {
        let timeA = a.timestamp || a.id;
        let timeB = b.timestamp || b.id;
        return timeA - timeB;
    });

    chronoTransactions.forEach(t => {
        if (t.mainType === 'receivables' && t.category === 'Piutang Pribadi') {
            persT += t.amount;
        } else if (t.mainType === 'income' && t.category === 'Penerimaan Pelunasan Piutang Pribadi') {
            persP += t.amount;
            if (persP >= persT) {
                persT = 0; persP = 0;
            }
        }

        if (t.mainType === 'receivables' && t.category === 'Piutang Usaha') {
            bizT += t.amount;
        } else if (t.mainType === 'income' && t.category === 'Penerimaan Pelunasan Piutang Usaha') {
            bizP += t.amount;
            if (bizP >= bizT) {
                bizT = 0; bizP = 0;
            }
        }
    });

    const persOut = Math.max(0, persT - persP);
    const bizOut = Math.max(0, bizT - bizP);

    const breakdownContainer = document.getElementById('receivables-breakdown-list');
    if (breakdownContainer) {
        breakdownContainer.innerHTML = `
            <div class="flow-item" style="border-bottom: 1px solid rgba(226, 232, 240, 0.1); padding-bottom: 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem;">🤝 Piutang Pribadi</span>
                    <span style="color: #10b981; font-weight: 700; font-size: 1rem;">${formatRp(persOut)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    <span>Total Diberikan: ${formatRp(persT)}</span>
                    <span>Total Diterima: ${formatRp(persP)}</span>
                </div>
            </div>
            <div class="flow-item" style="padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem;">💼 Piutang Usaha</span>
                    <span style="color: #06b6d4; font-weight: 700; font-size: 1rem;">${formatRp(bizOut)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    <span>Total Diberikan: ${formatRp(bizT)}</span>
                    <span>Total Diterima: ${formatRp(bizP)}</span>
                </div>
            </div>
        `;
    }

    if (typeof Chart !== 'undefined') {
        renderReceivablesChart(persOut, bizOut);
    }

    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();

    const receivablesPayments = state.transactions.filter(t => {
        return t.mainType === 'income' && (
            t.category === 'Penerimaan Pelunasan Piutang Pribadi' ||
            t.category === 'Penerimaan Pelunasan Piutang Usaha'
        );
    });

    let paidPersThisMonth = false;
    let paidBizThisMonth = false;

    receivablesPayments.forEach(t => {
        const tDate = new Date(t.timestamp || t.id);
        if (tDate.getFullYear() === nowYear && tDate.getMonth() === nowMonth) {
            if (t.category === 'Penerimaan Pelunasan Piutang Pribadi') {
                paidPersThisMonth = true;
            } else if (t.category === 'Penerimaan Pelunasan Piutang Usaha') {
                paidBizThisMonth = true;
            }
        }
    });

    const monthlyCard = document.getElementById('receivables-monthly-status-card');
    const monthlyStatusContainer = document.getElementById('receivables-monthly-status-list');
    if (monthlyCard && monthlyStatusContainer) {
        if (persOut === 0 && bizOut === 0 && !paidPersThisMonth && !paidBizThisMonth) {
            monthlyCard.style.display = 'none';
        } else {
            monthlyCard.style.display = 'block';
            const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const currentMonthName = monthNames[nowMonth] + " " + nowYear;

            let html = `
                <div style="text-align: center; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">
                    Periode: <strong>${currentMonthName}</strong>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
            `;

            if (persOut > 0 || paidPersThisMonth) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: var(--bg); border: 1px solid ${paidPersThisMonth ? 'var(--success)' : 'rgba(226, 232, 240, 0.5)'};">
                        <span style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                            🤝 Piutang Pribadi
                        </span>
                        <span style="font-size: 0.85rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; color: #fff; background: ${paidPersThisMonth ? 'var(--success)' : 'var(--danger)'};">
                            ${paidPersThisMonth ? '✅ Sudah Diterima' : '⚠️ Belum Diterima'}
                        </span>
                    </div>
                `;
            }

            if (bizOut > 0 || paidBizThisMonth) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-radius: 10px; background: var(--bg); border: 1px solid ${paidBizThisMonth ? 'var(--success)' : 'rgba(226, 232, 240, 0.5)'};">
                        <span style="font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                            💼 Piutang Usaha
                        </span>
                        <span style="font-size: 0.85rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; color: #fff; background: ${paidBizThisMonth ? 'var(--success)' : 'var(--danger)'};">
                            ${paidBizThisMonth ? '✅ Sudah Diterima' : '⚠️ Belum Diterima'}
                        </span>
                    </div>
                `;
            }

            html += `</div>`;
            monthlyStatusContainer.innerHTML = html;
        }
    }

    const historyContainer = document.getElementById('receivables-payment-history-list');
    if (historyContainer) {
        if (receivablesPayments.length === 0) {
            historyContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 25px; font-size: 0.9rem;">
                    Belum ada riwayat penerimaan pelunasan piutang.
                </div>
            `;
        } else {
            const sortedPayments = [...receivablesPayments].sort((a, b) => {
                let timeA = a.timestamp || a.id;
                let timeB = b.timestamp || b.id;
                return timeB - timeA;
            });

            let historyHtml = '';
            sortedPayments.forEach(p => {
                let categoryIconAndName = '';
                if (p.category === 'Penerimaan Pelunasan Piutang Pribadi') {
                    categoryIconAndName = '🤝 Pelunasan Piutang Pribadi';
                } else if (p.category === 'Penerimaan Pelunasan Piutang Usaha') {
                    categoryIconAndName = '💼 Pelunasan Piutang Usaha';
                } else {
                    categoryIconAndName = `💵 ${p.category}`;
                }

                historyHtml += `
                    <div class="flow-item" style="border-bottom: 1px solid rgba(226, 232, 240, 0.1); padding-bottom: 10px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                            <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">
                                <span style="font-weight: 600; font-size: 0.78rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${categoryIconAndName}">${categoryIconAndName}</span>
                                <span style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">📅 Tanggal: ${p.date}</span>
                            </div>
                            <span style="color: var(--success); font-weight: 700; font-size: 0.82rem; white-space: nowrap; flex-shrink: 0;">${formatRp(p.amount)}</span>
                        </div>
                    </div>
                `;
            });
            historyContainer.innerHTML = historyHtml;
        }
    }
}

// --- CRUD TRANSACTIONS HANDLERS ---
async function addTransaction() {
    const dateInput = document.getElementById('trans-date').value;
    const mainType = document.getElementById('trans-main-type').value;
    const category = document.getElementById('trans-category').value;
    const desc = document.getElementById('trans-desc').value;
    const amount = parseCurrencyValue(document.getElementById('trans-amount').value);

    if (!dateInput) return await customAlert('Tanggal wajib diisi!', 'Data Tidak Lengkap');
    if (!desc || !amount || amount <= 0) return await customAlert('Keterangan dan nominal wajib diisi dengan benar!', 'Data Tidak Lengkap');

    if (mainType === 'debt') {
        const dueDay = document.getElementById('trans-debt-due-day').value;
        if (dueDay) {
            const dayVal = parseInt(dueDay);
            if (isNaN(dayVal) || dayVal < 1 || dayVal > 31) {
                return await customAlert('Tanggal cicilan harus antara 1 sampai 31!', 'Tanggal Tidak Valid');
            }
        }
    }

    const dateVals = dateInput.split('-');
    const dateObj = new Date(dateVals[0], dateVals[1] - 1, dateVals[2]);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStamp = dateObj.getTime();
    const uniqueId = Date.now();

    if (mainType === 'transfer') {
        const fromId = parseInt(document.getElementById('trans-from').value);
        const toId = parseInt(document.getElementById('trans-to').value);
        if (fromId === toId) return await customAlert('Pilih dompet yang berbeda!', 'Mutasi Gagal');

        let wFrom = state.wallets.find(w => w.id === fromId);
        let wTo = state.wallets.find(w => w.id === toId);

        if (!wFrom || !wTo) return await customAlert('Dompet tidak ditemukan!', 'Error');
        if (wFrom.balance < amount) return await customAlert(`Saldo di [${wFrom.name}] tidak cukup.`, 'Saldo Kurang');

        wFrom.balance -= amount; wTo.balance += amount;
        state.transactions.push({ id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: `${wFrom.name} ➔ ${wTo.name}`, fromId: wFrom.id, toId: wTo.id });

    } else if (mainType === 'debt') {
        const hasCashflow = document.getElementById('trans-debt-cashflow').value;
        const dueDay = document.getElementById('trans-debt-due-day').value;

        if (hasCashflow === 'ya') {
            const walletId = parseInt(document.getElementById('trans-wallet').value);
            let w = state.wallets.find(w => w.id === walletId);

            if (!w) return await customAlert('Dompet tidak ditemukan!', 'Error');

            w.balance += amount;
            state.transactions.push({
                id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: w.name, walletId: w.id, debtCashflow: 'ya', dueDay: dueDay || null
            });
        } else {
            state.transactions.push({
                id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: 'Tanpa Aliran Dompet', walletId: null, debtCashflow: 'tidak', dueDay: dueDay || null
            });
        }
    } else if (mainType === 'receivables') {
        const hasCashflow = document.getElementById('trans-debt-cashflow').value;
        const dueDay = document.getElementById('trans-debt-due-day').value;

        if (hasCashflow === 'ya') {
            const walletId = parseInt(document.getElementById('trans-wallet').value);
            let w = state.wallets.find(w => w.id === walletId);

            if (!w) return await customAlert('Dompet tidak ditemukan!', 'Error');
            if (w.balance < amount) return await customAlert(`Saldo di [${w.name}] tidak cukup untuk memberikan pinjaman.`, 'Saldo Kurang');

            w.balance -= amount;
            state.transactions.push({
                id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: w.name, walletId: w.id, debtCashflow: 'ya', dueDay: dueDay || null
            });
        } else {
            state.transactions.push({
                id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: 'Tanpa Aliran Dompet', walletId: null, debtCashflow: 'tidak', dueDay: dueDay || null
            });
        }
    } else {
        const walletId = parseInt(document.getElementById('trans-wallet').value);
        let w = state.wallets.find(w => w.id === walletId);

        if (!w) return await customAlert('Dompet tidak ditemukan!', 'Error');

        if (mainType === 'expense' && w.balance < amount) {
            return await customAlert(`Saldo di [${w.name}] tidak cukup untuk pengeluaran/kerugian ini.`, 'Saldo Kurang');
        }

        if (mainType === 'income') w.balance += amount;
        if (mainType === 'expense') w.balance -= amount;

        state.transactions.push({ id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: w.name, walletId: w.id });
    }

    document.getElementById('trans-desc').value = '';
    document.getElementById('trans-amount').value = '';
    const dueDayEl = document.getElementById('trans-debt-due-day');
    if (dueDayEl) dueDayEl.value = '';

    saveData();
    showToast("Transaksi Berhasil Disimpan!");

    document.getElementById('trans-main-type').value = 'expense';
    updateCategoryOptions();
    checkDebtReminders();
}

async function deleteTransaction(id) {
    let isConfirm = await customConfirm("Hapus transaksi ini? Saldo dompet akan dikembalikan otomatis.", "Konfirmasi Hapus");
    if (!isConfirm) return;

    const tIndex = state.transactions.findIndex(t => t.id === id);
    const t = state.transactions[tIndex];

    if (t.mainType === 'transfer') {
        let wFrom = state.wallets.find(w => w.id === t.fromId);
        let wTo = state.wallets.find(w => w.id === t.toId);
        if (wFrom) wFrom.balance += t.amount;
        if (wTo) wTo.balance -= t.amount;
    } else if (t.mainType === 'adjustment') {
        let w = state.wallets.find(w => w.id === t.walletId);
        if (w) {
            if (t.category === 'Koreksi (+)' || t.category === 'Saldo Awal') w.balance -= t.amount;
            else w.balance += t.amount;
        }
    } else if (t.mainType === 'debt') {
        if (t.walletId && (t.debtCashflow === 'ya' || t.debtCashflow === undefined)) {
            let w = state.wallets.find(w => w.id === t.walletId);
            if (w) w.balance -= t.amount;
        }
    } else if (t.mainType === 'receivables') {
        if (t.walletId && (t.debtCashflow === 'ya' || t.debtCashflow === undefined)) {
            let w = state.wallets.find(w => w.id === t.walletId);
            if (w) w.balance += t.amount;
        }
    } else {
        let w = state.wallets.find(w => w.id === t.walletId);
        if (w) {
            if (t.mainType === 'income') w.balance -= t.amount;
            if (t.mainType === 'expense') w.balance += t.amount;
        }
    }

    state.transactions.splice(tIndex, 1);
    saveData();
}

// --- EDIT TRANSACTION OVERLAYS ---
function closeEditModal() {
    const modal = document.getElementById('edit-transaction-modal');
    if (modal) modal.classList.remove('active');
}

function populateEditCategories(mainType) {
    const categorySelect = document.getElementById('edit-trans-category');
    if (!categorySelect) return;
    categorySelect.innerHTML = '';

    if (mainType === 'expense') {
        categorySelect.innerHTML = `
            <option value="Makanan">🍔 Makanan & Minuman</option>
            <option value="Hiburan">🎬 Hiburan & Rekreasi</option>
            <option value="Pendidikan">📚 Pendidikan / Kursus</option>
            <option value="Belanja">🛒 Belanja Bulanan / Keperluan</option>
            <option value="Transportasi">🚗 Transportasi / Bensin</option>
            <option value="Tagihan">💡 Tagihan / Listrik / Operasional</option>
            <option value="Bayar Pinjaman Bank" style="font-weight: bold;">🏦 Bayar Pinjaman Bank</option>
            <option value="Bayar Kartu Kredit" style="font-weight: bold;">💳 Bayar Paylater / Kartu Kredit</option>
            <option value="Bayar Pinjaman Pribadi" style="font-weight: bold;">🤝 Bayar Pinjaman Teman / Keluarga</option>
            <option value="Kerugian Investasi" style="color:var(--danger); font-weight:bold;">📉 Kerugian Investasi (Cut Loss)</option>
            <option value="Kesehatan">💊 Kesehatan / Medis</option>
            <option value="Biaya Admin Kartu Debit">💳 Biaya Admin Kartu Debit</option>
            <option value="Lainnya">💸 Pengeluaran Lain</option>
        `;
    } else if (mainType === 'income') {
        categorySelect.innerHTML = `
            <option value="Gaji">💰 Gaji / Omzet Bisnis</option>
            <option value="Keuntungan Investasi" style="color:var(--success); font-weight:bold;">📈 Keuntungan Investasi (Profit/Dividen)</option>
            <option value="Penerimaan Pelunasan Piutang Pribadi" style="color:var(--success); font-weight:bold;">🤝 Penerimaan Pelunasan Piutang Pribadi</option>
            <option value="Penerimaan Pelunasan Piutang Usaha" style="color:var(--success); font-weight:bold;">💼 Penerimaan Pelunasan Piutang Usaha</option>
            <option value="Lainnya">💵 Pemasukan Lain-lain</option>
        `;
    } else if (mainType === 'debt') {
        categorySelect.innerHTML = `
            <option value="Pinjaman Bank">🏦 Pinjaman Bank / KTA</option>
            <option value="Kartu Kredit">💳 Paylater / Kartu Kredit</option>
            <option value="Pinjaman Pribadi">🤝 Pinjaman Teman / Keluarga</option>
        `;
    } else if (mainType === 'receivables') {
        categorySelect.innerHTML = `
            <option value="Piutang Pribadi">🤝 Pinjaman Teman / Keluarga</option>
            <option value="Piutang Usaha">💼 Pinjaman Operasional Bisnis</option>
        `;
    } else if (mainType === 'transfer') {
        categorySelect.innerHTML = `
            <option value="Mutasi">🔄 Mutasi Kas (Tarik / Setor Tunai)</option>
            <option value="Investasi">🏦 Top Up Portofolio (Beli Saham/Reksa Dana)</option>
        `;
    } else if (mainType === 'adjustment') {
        categorySelect.innerHTML = `
            <option value="Koreksi (+)">⚙️ Koreksi (+)</option>
            <option value="Koreksi (-)">⚙️ Koreksi (-)</option>
            <option value="Saldo Awal">⚙️ Saldo Awal</option>
        `;
    }

    const customOptions = state.customCategories
        .filter(cat => cat.type === mainType)
        .map(cat => `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`)
        .join('');
    categorySelect.innerHTML += customOptions;
}

function updateEditCategoryOptions() {
    const mainTypeEl = document.getElementById('edit-trans-main-type');
    const categoryEl = document.getElementById('edit-trans-category');
    if (!mainTypeEl || !categoryEl) return;

    const mainType = mainTypeEl.value;
    const category = categoryEl.value;
    const labelSingle = document.getElementById('edit-wallet-field-label');
    const debtCashflowField = document.getElementById('edit-debt-cashflow-toggle-field');
    const debtDueDayField = document.getElementById('edit-debt-due-day-field');

    populateEditCategories(mainType);

    if (category) {
        const categorySelect = document.getElementById('edit-trans-category');
        if (categorySelect && categorySelect.querySelector(`option[value="${category}"]`)) {
            categorySelect.value = category;
        }
    }

    if (mainType === 'transfer') {
        if (debtCashflowField) debtCashflowField.style.display = 'none';
        if (debtDueDayField) debtDueDayField.style.display = 'none';
        document.getElementById('edit-single-wallet-field').style.display = 'none';
        document.getElementById('edit-transfer-fields').style.display = 'block';
        updateTransferWalletOptions(category, 'edit-');
    } else if (mainType === 'debt') {
        if (debtCashflowField) debtCashflowField.style.display = 'block';
        if (debtDueDayField) debtDueDayField.style.display = 'block';

        const ev = window.event;
        if (ev && ev.target && (ev.target.id === 'edit-trans-main-type' || ev.target.id === 'edit-trans-category')) {
            document.getElementById('edit-trans-debt-cashflow').value = (category === 'Pinjaman Pribadi') ? 'ya' : 'tidak';
        }

        const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
        if (hasCashflow === 'ya') {
            document.getElementById('edit-single-wallet-field').style.display = 'block';
            document.getElementById('edit-transfer-fields').style.display = 'none';
            if (labelSingle) labelSingle.innerText = 'Uang Pinjaman Uang Masuk Ke Dompet Mana?';
        } else {
            document.getElementById('edit-single-wallet-field').style.display = 'none';
            document.getElementById('edit-transfer-fields').style.display = 'none';
        }
    } else if (mainType === 'receivables') {
        if (debtCashflowField) debtCashflowField.style.display = 'block';
        if (debtDueDayField) debtDueDayField.style.display = 'block';

        const ev = window.event;
        if (ev && ev.target && (ev.target.id === 'edit-trans-main-type' || ev.target.id === 'edit-trans-category')) {
            document.getElementById('edit-trans-debt-cashflow').value = 'ya';
        }

        const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
        if (hasCashflow === 'ya') {
            document.getElementById('edit-single-wallet-field').style.display = 'block';
            document.getElementById('edit-transfer-fields').style.display = 'none';
            if (labelSingle) labelSingle.innerText = 'Uang Dipinjamkan Diambil Dari Dompet Mana?';
        } else {
            document.getElementById('edit-single-wallet-field').style.display = 'none';
            document.getElementById('edit-transfer-fields').style.display = 'none';
        }
    } else {
        if (debtCashflowField) debtCashflowField.style.display = 'none';
        if (debtDueDayField) debtDueDayField.style.display = 'none';
        document.getElementById('edit-single-wallet-field').style.display = 'block';
        document.getElementById('edit-transfer-fields').style.display = 'none';

        if (labelSingle) {
            if (mainType === 'expense') labelSingle.innerText = 'Gunakan Uang Dari Dompet Mana?';
            else if (mainType === 'income') labelSingle.innerText = 'Simpan Uang Masuk Ke Dompet Mana?';
        }
    }
}

function editTransaction(id) {
    const t = state.transactions.find(trans => trans.id === id);
    if (!t) return;

    document.getElementById('edit-trans-id').value = t.id;

    const mainTypeSelect = document.getElementById('edit-trans-main-type');
    if (!mainTypeSelect) return;

    mainTypeSelect.innerHTML = `
        <option value="expense">Pengeluaran</option>
        <option value="income">Pemasukan</option>
        <option value="debt" style="color: var(--purple); font-weight: bold;">Ambil Hutang</option>
        <option value="receivables" style="color: var(--success); font-weight: bold;">Beri Pinjaman / Piutang</option>
        <option value="transfer">Pindah Uang</option>
    `;
    if (t.mainType === 'adjustment') {
        mainTypeSelect.innerHTML += `<option value="adjustment">Penyesuaian Saldo</option>`;
    }
    mainTypeSelect.value = t.mainType;

    const dateObj = new Date(t.timestamp || t.id);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    document.getElementById('edit-trans-date').value = `${yyyy}-${mm}-${dd}`;

    populateEditCategories(t.mainType);
    document.getElementById('edit-trans-category').value = t.category;

    document.getElementById('edit-trans-desc').value = t.desc;
    document.getElementById('edit-trans-amount').value = new Intl.NumberFormat('id-ID').format(t.amount);

    const selectSingle = document.getElementById('edit-trans-wallet');
    const selectFrom = document.getElementById('edit-trans-from');
    const selectTo = document.getElementById('edit-trans-to');

    if (selectSingle && selectFrom && selectTo) {
        selectSingle.innerHTML = ''; selectFrom.innerHTML = ''; selectTo.innerHTML = '';
        state.wallets.forEach(w => {
            selectSingle.innerHTML += `<option value="${w.id}">${w.name}</option>`;
            selectFrom.innerHTML += `<option value="${w.id}">${w.name}</option>`;
            selectTo.innerHTML += `<option value="${w.id}">${w.name}</option>`;
        });
    }

    if (t.mainType === 'debt' || t.mainType === 'receivables') {
        document.getElementById('edit-trans-debt-cashflow').value = t.debtCashflow || 'ya';
        document.getElementById('edit-trans-debt-due-day').value = t.dueDay || '';
    }

    updateEditCategoryOptions();
    if (t.mainType === 'transfer') {
        document.getElementById('edit-trans-from').value = t.fromId;
        document.getElementById('edit-trans-to').value = t.toId;
    } else if (t.mainType === 'debt' || t.mainType === 'receivables') {
        const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
        if (hasCashflow === 'ya') {
            document.getElementById('edit-trans-wallet').value = t.walletId || '';
        }
    } else {
        document.getElementById('edit-trans-wallet').value = t.walletId || '';
    }

    document.getElementById('edit-transaction-modal').classList.add('active');
}

async function updateTransaction() {
    const id = parseInt(document.getElementById('edit-trans-id').value);
    const dateInput = document.getElementById('edit-trans-date').value;
    const desc = document.getElementById('edit-trans-desc').value;
    const amount = parseCurrencyValue(document.getElementById('edit-trans-amount').value);
    const category = document.getElementById('edit-trans-category').value;
    const mainType = document.getElementById('edit-trans-main-type').value;

    if (!dateInput) return await customAlert('Tanggal wajib diisi!', 'Data Tidak Lengkap');
    if (!desc || !amount || amount <= 0) return await customAlert('Keterangan dan nominal wajib diisi dengan benar!', 'Data Tidak Lengkap');

    if (mainType === 'debt' || mainType === 'receivables') {
        const dueDay = document.getElementById('edit-trans-debt-due-day').value;
        if (dueDay) {
            const dayVal = parseInt(dueDay);
            if (isNaN(dayVal) || dayVal < 1 || dayVal > 31) {
                return await customAlert('Tanggal jatuh tempo harus antara 1 sampai 31!', 'Tanggal Tidak Valid');
            }
        }
    }

    const tIndex = state.transactions.findIndex(t => t.id === id);
    if (tIndex === -1) return;
    const oldT = state.transactions[tIndex];

    // Rollback saldo lama
    if (oldT.mainType === 'transfer') {
        let wFrom = state.wallets.find(w => w.id === oldT.fromId);
        let wTo = state.wallets.find(w => w.id === oldT.toId);
        if (wFrom) wFrom.balance += oldT.amount;
        if (wTo) wTo.balance -= oldT.amount;
    } else if (oldT.mainType === 'adjustment') {
        let w = state.wallets.find(w => w.id === oldT.walletId);
        if (w) {
            if (oldT.category === 'Koreksi (+)' || oldT.category === 'Saldo Awal') w.balance -= oldT.amount;
            else w.balance += oldT.amount;
        }
    } else if (oldT.mainType === 'debt') {
        if (oldT.walletId && (oldT.debtCashflow === 'ya' || oldT.debtCashflow === undefined)) {
            let w = state.wallets.find(w => w.id === oldT.walletId);
            if (w) w.balance -= oldT.amount;
        }
    } else if (oldT.mainType === 'receivables') {
        if (oldT.walletId && (oldT.debtCashflow === 'ya' || oldT.debtCashflow === undefined)) {
            let w = state.wallets.find(w => w.id === oldT.walletId);
            if (w) w.balance += oldT.amount;
        }
    } else {
        let w = state.wallets.find(w => w.id === oldT.walletId);
        if (w) {
            if (oldT.mainType === 'income') w.balance -= oldT.amount;
            if (oldT.mainType === 'expense') w.balance += oldT.amount;
        }
    }

    const rollbackOldBalances = () => {
        if (oldT.mainType === 'transfer') {
            let wFrom = state.wallets.find(w => w.id === oldT.fromId);
            let wTo = state.wallets.find(w => w.id === oldT.toId);
            if (wFrom) wFrom.balance -= oldT.amount;
            if (wTo) wTo.balance += oldT.amount;
        } else if (oldT.mainType === 'adjustment') {
            let w = state.wallets.find(w => w.id === oldT.walletId);
            if (w) {
                if (oldT.category === 'Koreksi (+)' || oldT.category === 'Saldo Awal') w.balance += oldT.amount;
                else w.balance -= oldT.amount;
            }
        } else if (oldT.mainType === 'debt') {
            if (oldT.walletId && (oldT.debtCashflow === 'ya' || oldT.debtCashflow === undefined)) {
                let w = state.wallets.find(w => w.id === oldT.walletId);
                if (w) w.balance += oldT.amount;
            }
        } else if (oldT.mainType === 'receivables') {
            if (oldT.walletId && (oldT.debtCashflow === 'ya' || oldT.debtCashflow === undefined)) {
                let w = state.wallets.find(w => w.id === oldT.walletId);
                if (w) w.balance -= oldT.amount;
            }
        } else {
            let w = state.wallets.find(w => w.id === oldT.walletId);
            if (w) {
                if (oldT.mainType === 'income') w.balance += oldT.amount;
                if (oldT.mainType === 'expense') w.balance -= oldT.amount;
            }
        }
    };

    let dateVals = dateInput.split('-');
    let dateObj = new Date(dateVals[0], dateVals[1] - 1, dateVals[2]);
    let dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    let timeStamp = dateObj.getTime();

    if (mainType === 'transfer') {
        const fromId = parseInt(document.getElementById('edit-trans-from').value);
        const toId = parseInt(document.getElementById('edit-trans-to').value);
        if (fromId === toId) {
            rollbackOldBalances();
            return await customAlert('Pilih dompet yang berbeda!', 'Mutasi Gagal');
        }

        let wFrom = state.wallets.find(w => w.id === fromId);
        let wTo = state.wallets.find(w => w.id === toId);

        if (!wFrom || !wTo) {
            rollbackOldBalances();
            return await customAlert('Dompet tidak ditemukan!', 'Error');
        }
        if (wFrom.balance < amount) {
            rollbackOldBalances();
            return await customAlert(`Saldo di [${wFrom.name}] tidak cukup.`, 'Saldo Kurang');
        }

        wFrom.balance -= amount; wTo.balance += amount;

        state.transactions[tIndex] = {
            id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: `${wFrom.name} ➔ ${wTo.name}`, fromId: wFrom.id, toId: wTo.id
        };

    } else if (mainType === 'debt') {
        const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
        const dueDay = document.getElementById('edit-trans-debt-due-day').value;

        if (hasCashflow === 'ya') {
            const walletId = parseInt(document.getElementById('edit-trans-wallet').value);
            let w = state.wallets.find(w => w.id === walletId);

            if (!w) {
                rollbackOldBalances();
                return await customAlert('Dompet tidak ditemukan!', 'Error');
            }

            w.balance += amount;
            state.transactions[tIndex] = {
                id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: w.name, walletId: w.id, debtCashflow: 'ya', dueDay: dueDay || null
            };
        } else {
            state.transactions[tIndex] = {
                id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: 'Tanpa Aliran Dompet', walletId: null, debtCashflow: 'tidak', dueDay: dueDay || null
            };
        }
    } else if (mainType === 'receivables') {
        const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
        const dueDay = document.getElementById('edit-trans-debt-due-day').value;

        if (hasCashflow === 'ya') {
            const walletId = parseInt(document.getElementById('edit-trans-wallet').value);
            let w = state.wallets.find(w => w.id === walletId);

            if (!w) {
                rollbackOldBalances();
                return await customAlert('Dompet tidak ditemukan!', 'Error');
            }
            if (w.balance < amount) {
                rollbackOldBalances();
                return await customAlert(`Saldo di [${w.name}] tidak cukup untuk piutang ini.`, 'Saldo Kurang');
            }

            w.balance -= amount;
            state.transactions[tIndex] = {
                id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: w.name, walletId: w.id, debtCashflow: 'ya', dueDay: dueDay || null
            };
        } else {
            state.transactions[tIndex] = {
                id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: 'Tanpa Aliran Dompet', walletId: null, debtCashflow: 'tidak', dueDay: dueDay || null
            };
        }
    } else {
        const walletId = parseInt(document.getElementById('edit-trans-wallet').value);
        let w = state.wallets.find(w => w.id === walletId);

        if (!w) {
            rollbackOldBalances();
            return await customAlert('Dompet tidak ditemukan!', 'Error');
        }

        if (mainType === 'expense' && w.balance < amount) {
            rollbackOldBalances();
            return await customAlert(`Saldo di [${w.name}] tidak cukup untuk pengeluaran/kerugian ini.`, 'Saldo Kurang');
        }

        if (mainType === 'income') w.balance += amount;
        if (mainType === 'expense') w.balance -= amount;
        if (mainType === 'adjustment') {
            if (category === 'Koreksi (+)' || category === 'Saldo Awal') w.balance += amount;
            else w.balance -= amount;
        }

        state.transactions[tIndex] = {
            id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: w.name, walletId: w.id
        };
    }

    closeEditModal();
    saveData();
    checkDebtReminders();
}

// --- OPTION HELPERS ---
function toggleTransferFields() {
    const mainTypeEl = document.getElementById('trans-main-type');
    const categoryEl = document.getElementById('trans-category');
    if (!mainTypeEl || !categoryEl) return;

    const mainType = mainTypeEl.value;
    const category = categoryEl.value;

    const singleWallet = document.getElementById('single-wallet-field');
    const transferFields = document.getElementById('transfer-fields');
    const label = document.getElementById('wallet-field-label');
    const debtCashflowField = document.getElementById('debt-cashflow-toggle-field');
    const debtDueDayField = document.getElementById('debt-due-day-field');

    if (mainType === 'transfer') {
        if (singleWallet) singleWallet.style.display = 'none';
        if (transferFields) transferFields.style.display = 'block';
        if (debtCashflowField) debtCashflowField.style.display = 'none';
        if (debtDueDayField) debtDueDayField.style.display = 'none';
        updateTransferWalletOptions(category);
    } else if (mainType === 'debt') {
        if (debtCashflowField) debtCashflowField.style.display = 'block';
        if (debtDueDayField) debtDueDayField.style.display = 'block';

        const ev = window.event;
        if (ev && ev.target && (ev.target.id === 'trans-main-type' || ev.target.id === 'trans-category')) {
            const flowToggle = document.getElementById('trans-debt-cashflow');
            if (flowToggle) flowToggle.value = (category === 'Pinjaman Pribadi') ? 'ya' : 'tidak';
        }

        const hasCashflow = document.getElementById('trans-debt-cashflow').value;
        if (hasCashflow === 'ya') {
            if (singleWallet) singleWallet.style.display = 'block';
            if (transferFields) transferFields.style.display = 'none';
            if (label) label.innerText = 'Uang Pinjaman Masuk Ke Dompet Mana?';
        } else {
            if (singleWallet) singleWallet.style.display = 'none';
            if (transferFields) transferFields.style.display = 'none';
        }
    } else if (mainType === 'receivables') {
        if (debtCashflowField) debtCashflowField.style.display = 'block';
        if (debtDueDayField) debtDueDayField.style.display = 'block';

        const ev = window.event;
        if (ev && ev.target && (ev.target.id === 'trans-main-type' || ev.target.id === 'trans-category')) {
            const flowToggle = document.getElementById('trans-debt-cashflow');
            if (flowToggle) flowToggle.value = 'ya';
        }

        const hasCashflow = document.getElementById('trans-debt-cashflow').value;
        if (hasCashflow === 'ya') {
            if (singleWallet) singleWallet.style.display = 'block';
            if (transferFields) transferFields.style.display = 'none';
            if (label) label.innerText = 'Uang Dipinjamkan Diambil Dari Dompet Mana?';
        } else {
            if (singleWallet) singleWallet.style.display = 'none';
            if (transferFields) transferFields.style.display = 'none';
        }
    } else {
        if (singleWallet) singleWallet.style.display = 'block';
        if (transferFields) transferFields.style.display = 'none';
        if (debtCashflowField) debtCashflowField.style.display = 'none';
        if (debtDueDayField) debtDueDayField.style.display = 'none';

        if (label) {
            if (mainType === 'expense') label.innerText = 'Gunakan Uang Dari Dompet Mana?';
            else if (mainType === 'income') label.innerText = 'Simpan Uang Masuk Ke Dompet Mana?';
        }
    }
}

function updateTransferWalletOptions(category, prefix = '') {
    const selectFrom = document.getElementById(prefix + 'trans-from');
    const selectTo = document.getElementById(prefix + 'trans-to');
    if (!selectFrom || !selectTo) return;

    const prevFrom = selectFrom.value;
    const prevTo = selectTo.value;

    selectFrom.innerHTML = '';
    selectTo.innerHTML = '';

    state.wallets.forEach(w => {
        const option = `<option value="${w.id}">${w.name}</option>`;
        if (category === 'Investasi') {
            if (w.type === 'cash') {
                selectFrom.innerHTML += option;
            } else if (w.type === 'invest') {
                selectTo.innerHTML += option;
            }
        } else {
            if (w.type === 'cash') {
                selectFrom.innerHTML += option;
                selectTo.innerHTML += option;
            }
        }
    });

    if (prevFrom && selectFrom.querySelector(`option[value="${prevFrom}"]`)) {
        selectFrom.value = prevFrom;
    }
    if (prevTo && selectTo.querySelector(`option[value="${prevTo}"]`)) {
        selectTo.value = prevTo;
    }
}

// --- CUSTOM CATEGORIES MANAGEMENT ---
function showCustomCategoryModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('custom-category-modal');
    if (modal) modal.classList.add('active');
}

function closeCustomCategoryModal() {
    const modal = document.getElementById('custom-category-modal');
    if (modal) modal.classList.remove('active');
}

function selectCategoryEmoji(el) {
    document.querySelectorAll('.emoji-option').forEach(span => {
        span.classList.remove('selected');
        span.style.borderColor = 'transparent';
    });
    el.classList.add('selected');
    el.style.borderColor = 'var(--purple)';
    const inputField = document.getElementById('settings-new-cat-emoji') || document.getElementById('new-cat-emoji');
    if (inputField) inputField.value = el.innerText;
}

function saveCustomCategory() {
    const nameInput = document.getElementById('new-cat-name');
    const emojiInput = document.getElementById('new-cat-emoji');
    const typeSelect = document.getElementById('trans-main-type');
    if (!nameInput || !emojiInput || !typeSelect) return;

    const name = nameInput.value.trim();
    const emoji = emojiInput.value;
    const type = typeSelect.value;

    if (!name) return showToast('Nama kategori tidak boleh kosong!');

    if (state.customCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
        return showToast('Kategori ini sudah ada!');
    }
    state.customCategories.push({ name, icon: emoji, type });
    saveData();
    nameInput.value = '';
    closeCustomCategoryModal();
    updateCategoryOptions();
    showToast('Kategori kustom berhasil disimpan!');
}

function saveCustomCategoryFromSettings() {
    const nameInput = document.getElementById('settings-new-cat-name');
    const emojiInput = document.getElementById('settings-new-cat-emoji');
    const typeSelect = document.getElementById('settings-new-cat-type');
    if (!nameInput || !emojiInput || !typeSelect) return;

    const name = nameInput.value.trim();
    const emoji = emojiInput.value;
    const type = typeSelect.value;

    if (!name) return showToast('Nama kategori tidak boleh kosong!');

    if (state.customCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
        return showToast('Kategori ini sudah ada!');
    }
    state.customCategories.push({ name, icon: emoji, type });
    saveData();
    nameInput.value = '';

    renderSettingsCustomCategories();
    updateCategoryOptions();
    showToast('Kategori kustom berhasil ditambahkan!');
}

function renderSettingsCustomCategories() {
    const container = document.getElementById('settings-custom-categories-list');
    if (!container) return;

    if (state.customCategories.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">Belum ada kategori kustom.</div>`;
        return;
    }

    let html = '';
    const typeLabels = {
        expense: 'Pengeluaran 🔴',
        income: 'Pemasukan 🟢',
        debt: 'Hutang 🟣',
        receivables: 'Piutang 🔵'
    };

    state.customCategories.forEach((c, idx) => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--bg); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 5px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.20rem;">${c.icon}</span>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${c.name}</span>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">${typeLabels[c.type] || c.type}</span>
                    </div>
                </div>
                <button onclick="deleteCustomCategoryFromSettings(${idx})" style="background: none; border: none; color: var(--danger); cursor: pointer; font-weight: 600; font-size: 0.8rem; padding: 4px 8px;">Hapus</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function deleteCustomCategoryFromSettings(index) {
    state.customCategories.splice(index, 1);
    saveData();
    renderSettingsCustomCategories();
    updateCategoryOptions();
    showToast('Kategori kustom dihapus.');
}

// --- DISPLAY SETTINGS ---
function applyDisplaySettings() {
    const settings = JSON.parse(localStorage.getItem('transaksiku_display_settings')) || { showTotal: true, showCash: true, showInvest: true };

    const cardTotal = document.getElementById('card-total-wealth');
    const cardCash = document.getElementById('card-active-cash');
    const cardInvest = document.getElementById('card-total-portfolio');

    if (cardTotal) cardTotal.style.display = settings.showTotal ? 'block' : 'none';
    if (cardCash) cardCash.style.display = settings.showCash ? 'block' : 'none';
    if (cardInvest) cardInvest.style.display = settings.showInvest ? 'block' : 'none';
}

function showSettingsModal() {
    const sidebar = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
    if (backdrop && backdrop.classList.contains('show')) {
        backdrop.classList.remove('show');
        setTimeout(() => backdrop.style.display = 'none', 300);
    }

    const settings = JSON.parse(localStorage.getItem('transaksiku_display_settings')) || { showTotal: true, showCash: true, showInvest: true };

    const toggleTotal = document.getElementById('toggle-card-total');
    const toggleCash = document.getElementById('toggle-card-cash');
    const toggleInvest = document.getElementById('toggle-card-invest');

    if (toggleTotal) toggleTotal.checked = settings.showTotal;
    if (toggleCash) toggleCash.checked = settings.showCash;
    if (toggleInvest) toggleInvest.checked = settings.showInvest;

    const savedCurrency = localStorage.getItem('transaksiku_currency') || 'Rp';
    const savedShowTime = localStorage.getItem('transaksiku_show_time') !== 'false';
    const currencySelect = document.getElementById('setting-global-currency');
    const toggleTime = document.getElementById('toggle-show-time');
    if (currencySelect) currencySelect.value = savedCurrency;
    if (toggleTime) toggleTime.checked = savedShowTime;

    switchSettingsTab('settings-tab-display');

    const modal = document.getElementById('settings-display-modal');
    if (modal) modal.classList.add('active');
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-display-modal');
    if (modal) modal.classList.remove('active');
}

function saveSettingsDisplay() {
    const toggleTotal = document.getElementById('toggle-card-total');
    const toggleCash = document.getElementById('toggle-card-cash');
    const toggleInvest = document.getElementById('toggle-card-invest');

    const settings = {
        showTotal: toggleTotal ? toggleTotal.checked : true,
        showCash: toggleCash ? toggleCash.checked : true,
        showInvest: toggleInvest ? toggleInvest.checked : true
    };

    localStorage.setItem('transaksiku_display_settings', JSON.stringify(settings));

    const currencySelect = document.getElementById('setting-global-currency');
    const toggleTime = document.getElementById('toggle-show-time');
    if (currencySelect) localStorage.setItem('transaksiku_currency', currencySelect.value);
    if (toggleTime) localStorage.setItem('transaksiku_show_time', toggleTime.checked.toString());

    applyDisplaySettings();
    applyFilter();
    renderWallets();
    closeSettingsModal();
    showToast('Pengaturan berhasil disimpan!');
}

function switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-tab-content').forEach(el => el.style.display = 'none');
    const targetContent = document.getElementById(tabId);
    if (targetContent) targetContent.style.display = 'block';

    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderBottomColor = 'transparent';
        btn.style.color = 'var(--text-muted)';
    });

    const tabButtons = Array.from(document.querySelectorAll('.settings-tab-btn'));
    const activeBtn = tabButtons.find(btn => btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`));
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.borderBottomColor = 'var(--purple)';
        activeBtn.style.color = 'var(--purple)';
    }

    if (tabId === 'settings-tab-categories') {
        renderSettingsCustomCategories();
    }
}

function switchReportTab(tabName) {
    const distContainer = document.getElementById('report-tab-dist-container');
    const compContainer = document.getElementById('report-tab-comp-container');
    const btnDist = document.getElementById('btn-report-dist');
    const btnComp = document.getElementById('btn-report-comp');

    if (tabName === 'dist') {
        if (distContainer) distContainer.style.display = 'block';
        if (compContainer) compContainer.style.display = 'none';
        if (btnDist) {
            btnDist.style.background = 'var(--card)';
            btnDist.style.color = 'var(--text-main)';
            btnDist.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        }
        if (btnComp) {
            btnComp.style.background = 'transparent';
            btnComp.style.color = 'var(--text-muted)';
            btnComp.style.boxShadow = 'none';
        }
    } else {
        if (distContainer) distContainer.style.display = 'none';
        if (compContainer) compContainer.style.display = 'block';
        if (btnComp) {
            btnComp.style.background = 'var(--card)';
            btnComp.style.color = 'var(--text-main)';
            btnComp.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        }
        if (btnDist) {
            btnDist.style.background = 'transparent';
            btnDist.style.color = 'var(--text-muted)';
            btnDist.style.boxShadow = 'none';
        }

        const filteredTrans = getFilteredTransactions();
        let totalIncome = 0, totalExpense = 0, currentPeriodDebtTaken = 0;

        const walletTypes = {};
        state.wallets.forEach(w => {
            walletTypes[w.id] = w.type;
        });

        filteredTrans.forEach(t => {
            if (t.mainType === 'income') {
                if (walletTypes[t.walletId] === 'cash') totalIncome += t.amount;
            } else if (t.mainType === 'expense') {
                if (walletTypes[t.walletId] === 'cash') totalExpense += t.amount;
            } else if (t.mainType === 'debt') {
                currentPeriodDebtTaken += t.amount;
            } else if (t.mainType === 'transfer') {
                const fromType = walletTypes[t.fromId];
                const toType = walletTypes[t.toId];
                if (fromType === 'cash' && toType === 'invest') totalExpense += t.amount;
                else if (fromType === 'invest' && toType === 'cash') totalIncome += t.amount;
            }
        });

        renderComparisonChart(totalIncome + currentPeriodDebtTaken, totalExpense);
    }
}

// --- THEME & HIDE BALANCES ---
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    if (isDark) {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('transaksiku_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('transaksiku_theme', 'light');
    }
    updateThemeToggles();

    if (document.getElementById('view-cashflow').style.display === 'block' || document.getElementById('view-debt').style.display === 'block') {
        applyFilter();
    }
}

function updateThemeToggles() {
    const isDark = document.body.classList.contains('dark-theme');

    const themeIcon = document.getElementById('theme-icon-svg');
    if (themeIcon) {
        if (isDark) {
            themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
        } else {
            themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
        }
    }

    const drawerIcon = document.getElementById('theme-toggle-drawer-icon');
    const drawerText = document.getElementById('theme-toggle-drawer-text');
    if (drawerIcon && drawerText) {
        if (isDark) {
            drawerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            drawerText.innerText = 'Mode Terang';
        } else {
            drawerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            drawerText.innerText = 'Mode Malam';
        }
    }
}

function initThemeUI() {
    const savedTheme = localStorage.getItem('transaksiku_theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.documentElement.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
        document.documentElement.classList.remove('dark-theme');
    }
    updateThemeToggles();
}

function initHideBalancesUI() {
    const eyeIcon = document.getElementById('eye-icon');
    const eyeText = document.getElementById('eye-text');
    if (eyeIcon && eyeText) {
        const EYE_SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`;
        const EYE_SVG_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.671-3.671m0-3.671a3 3 0 0 0-3.671 3.671m-.339.34L6.228 6.228" /></svg>`;

        eyeIcon.innerHTML = state.hideBalancesActive ? EYE_SVG_OPEN : EYE_SVG_CLOSED;
        eyeText.innerText = state.hideBalancesActive ? 'Tampilkan Saldo' : 'Sembunyikan Saldo';
    }
}

function toggleHideBalances() {
    state.hideBalancesActive = !state.hideBalancesActive;
    localStorage.setItem('transaksiku_hide_balances', state.hideBalancesActive);

    initHideBalancesUI();
    renderWallets();
    showToast(state.hideBalancesActive ? 'Saldo berhasil disembunyikan' : 'Saldo berhasil ditampilkan');
}

// --- REMINDER TOGGLES & NOTIFICATIONS ---
function updateReminderToggles() {
    const isEnabled = localStorage.getItem('transaksiku_reminders') === 'enabled';
    const iconEl = document.getElementById('reminder-toggle-icon');
    const textEl = document.getElementById('reminder-toggle-text');

    if (iconEl && textEl) {
        if (isEnabled && Notification.permission === 'granted') {
            iconEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            textEl.innerText = 'Pengingat Harian (Aktif)';
        } else {
            iconEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
            textEl.innerText = 'Pengingat Harian (Nonaktif)';
        }
    }
}

async function toggleReminder() {
    const isEnabled = localStorage.getItem('transaksiku_reminders') === 'enabled';
    if (isEnabled) {
        localStorage.setItem('transaksiku_reminders', 'disabled');
        updateReminderToggles();
        await customAlert('Pengingat harian telah dinonaktifkan.', 'Pengingat Mati');
    } else {
        if (!('Notification' in window)) {
            return await customAlert('Browser Anda tidak mendukung notifikasi.', 'Tidak Didukung');
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            localStorage.setItem('transaksiku_reminders', 'enabled');
            updateReminderToggles();
            showLocalNotification('Pengingat Aktif! 📝', 'Transaksiku akan mengingatkan Anda setiap hari untuk mencatat pengeluaran atau pemasukan.');
        } else {
            await customAlert('Izin notifikasi ditolak. Aktifkan izin notifikasi di pengaturan browser Anda.', 'Izin Ditolak');
        }
    }
}

function showLocalNotification(title, body) {
    if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: 'logo.png',
                    badge: 'logo.png',
                    vibrate: [200, 100, 200]
                });
            }).catch(err => {
                new Notification(title, { body: body, icon: 'logo.png' });
            });
        } else {
            new Notification(title, { body: body, icon: 'logo.png' });
        }
    }
}

function getCategoryOutstanding(category) {
    let totalBorrowed = 0;
    let totalPaid = 0;

    state.transactions.forEach(t => {
        if (t.mainType === 'debt' && t.category === category) {
            totalBorrowed += t.amount;
        }
        if (t.mainType === 'expense') {
            if (category === 'Pinjaman Bank' && t.category === 'Bayar Pinjaman Bank') {
                totalPaid += t.amount;
            } else if (category === 'Kartu Kredit' && t.category === 'Bayar Kartu Kredit') {
                totalPaid += t.amount;
            } else if (category === 'Pinjaman Pribadi' && (t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Cicilan')) {
                totalPaid += t.amount;
            }
        }
    });

    return Math.max(0, totalBorrowed - totalPaid);
}

function checkDebtReminders() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

    state.transactions.forEach(t => {
        if (t.mainType === 'debt' && t.dueDay) {
            const dueDayNum = parseInt(t.dueDay);
            if (isNaN(dueDayNum)) return;

            const outstanding = getCategoryOutstanding(t.category);
            if (outstanding <= 0) return;

            let triggerType = null;
            let message = '';

            if (currentDate === dueDayNum) {
                triggerType = 'due';
                message = `Hari ini adalah tanggal jatuh tempo pembayaran cicilan untuk [${t.category} - ${t.desc}]. Jangan lupa bayar ya! 💸`;
            } else if (currentDate === dueDayNum + 1) {
                triggerType = 'after';
                message = `Kemarin adalah tanggal jatuh tempo [${t.category} - ${t.desc}]. Cicilan Anda masih belum terbayar. Harap segera bayar! ⚠️`;
            } else if (currentDate === lastDay) {
                triggerType = 'end';
                message = `Sudah akhir bulan! Cicilan untuk [${t.category} - ${t.desc}] masih belum terbayar. Mari selesaikan pembayaran Anda! 🚨`;
            }

            if (triggerType) {
                const notifiedKey = `notified_${t.id}_${currentYear}_${currentMonth}_triggerType`;
                if (!localStorage.getItem(notifiedKey)) {
                    showLocalNotification(`Pengingat Pembayaran Cicilan 📌`, message);
                    localStorage.setItem(notifiedKey, 'true');
                }
            }
        }
    });
}

function checkDailyReminder() {
    const isEnabled = localStorage.getItem('transaksiku_reminders') === 'enabled';
    if (!isEnabled || Notification.permission !== 'granted') return;

    const lastReminder = localStorage.getItem('transaksiku_last_reminder_time');
    const now = Date.now();

    if (lastReminder && (now - parseInt(lastReminder)) < (20 * 60 * 60 * 1000)) {
        return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTime = todayStart.getTime();

    const hasTransactionToday = state.transactions.some(t => {
        const tDateObj = new Date(t.timestamp || t.id);
        tDateObj.setHours(0, 0, 0, 0);
        return tDateObj.getTime() === todayTime;
    });

    if (!hasTransactionToday) {
        showLocalNotification(
            'Belum mencatat hari ini? 📝',
            'Jangan lupa luangkan waktu 1 menit untuk mencatat pengeluaran atau pemasukan Anda hari ini di Transaksiku!'
        );
        localStorage.setItem('transaksiku_last_reminder_time', now.toString());
    }
}
