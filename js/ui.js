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
        if (viewId === 'dashboard' || viewId === 'debt' || viewId === 'receivables' || viewId === 'budget') {
            globalFilter.style.display = 'none';
        } else {
            globalFilter.style.display = 'block';
        }
    }

    if (viewId === 'budget' && typeof renderBudgetView === 'function') {
        renderBudgetView();
    }
    if (viewId === 'debt' && typeof renderDebtView === 'function') {
        renderDebtView();
    }
    if (viewId === 'receivables' && typeof renderReceivablesView === 'function') {
        renderReceivablesView();
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
        const isHidden = menu.style.display === 'none' || menu.style.display === '';
        if (isHidden) {
            // Cek apakah ada ruang di bawah atau harus buka ke atas
            const trigger = menu.previousElementSibling || menu.closest('.wallet-menu-container');
            if (trigger) {
                const rect = trigger.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const bottomNavHeight = 80; // ketinggian bottom nav
                if (spaceBelow < 160 + bottomNavHeight) {
                    // Buka ke atas (dropup)
                    menu.style.top = 'auto';
                    menu.style.bottom = '100%';
                    menu.style.marginTop = '0';
                    menu.style.marginBottom = '6px';
                } else {
                    // Buka ke bawah (default)
                    menu.style.top = '100%';
                    menu.style.bottom = 'auto';
                    menu.style.marginTop = '4px';
                    menu.style.marginBottom = '0';
                }
            }
            menu.style.display = 'flex';
            menu.style.flexDirection = 'column';
        } else {
            menu.style.display = 'none';
        }
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
            <option value="Makanan & Minuman">🍔 Makanan & Minuman</option>
            <option value="Belanja Kebutuhan">🛒 Belanja Kebutuhan (Sembako/Rumah)</option>
            <option value="Belanja Keinginan">🛍️ Belanja Keinginan (Baju/Gadget/Hobi)</option>
            <option value="Investasi / Top Up Portofolio">📈 Investasi / Top Up Portofolio</option>
            <option value="Hiburan">🎬 Hiburan & Rekreasi</option>
            <option value="Pendidikan">📚 Pendidikan / Kursus</option>
            <option value="Transportasi">🚗 Transportasi / Bensin</option>
            <option value="Tagihan & Utilitas">💡 Tagihan / Listrik / Operasional</option>
            <option value="Kerugian Investasi" style="color:var(--danger); font-weight:bold;">📉 Kerugian Investasi (Cut Loss)</option>
            <option value="Kesehatan">💊 Kesehatan / Medis</option>
            <option value="Biaya Admin Kartu Debit">💳 Biaya Admin Kartu Debit</option>
            <option value="Lainnya">💸 Pengeluaran Lain</option>
        `;
    } else if (mainType === 'income') {
        categorySelect.innerHTML = `
            <option value="Gaji">💰 Gaji / Omzet Bisnis</option>
            <option value="Keuntungan Investasi" style="color:var(--success); font-weight:bold;">📈 Keuntungan Investasi (Profit/Dividen)</option>
            <option value="Lainnya">💵 Pemasukan Lain-lain</option>
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
    
    (state.wallets || []).forEach(w => {
        if (w.type === 'invest' || w.type === 'savings') totalInvest += (Number(w.balance) || 0);
        else totalCash += (Number(w.balance) || 0);
    });

    // Accumulate total saved money from active Savings Goals (Target Tabungan)
    const totalSavingsGoals = (state.savingsGoals || []).reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
    const totalSavingsAndInvest = totalInvest + totalSavingsGoals;

    const sumTotalEl = document.getElementById('sum-total');
    const sumCashEl = document.getElementById('sum-cash');
    const sumPortfolioEl = document.getElementById('sum-portfolio');

    if (sumTotalEl) sumTotalEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash + totalSavingsAndInvest);
    if (sumCashEl) sumCashEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash);
    if (sumPortfolioEl) sumPortfolioEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalSavingsAndInvest);
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
        let deletedWalletIds = JSON.parse(localStorage.getItem('transaksiku_deleted_wallet_ids') || '[]');
        deletedWalletIds.push(id);
        localStorage.setItem('transaksiku_deleted_wallet_ids', JSON.stringify(deletedWalletIds));

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
        if (t.mainType === 'debt' || t.category === 'Hutang & Pinjaman' || t.category === 'Pencairan Hutang') globalDebtTaken += t.amount;
        if (t.mainType === 'expense' && (t.category === 'Cicilan' || t.category === 'Bayar Pinjaman Bank' || t.category === 'Bayar Kartu Kredit' || t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Pembayaran Hutang')) {
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
            if (walletTypes[t.walletId] === 'cash' || !t.walletId) {
                let key = `${t.mainType}-${t.category}`;
                summary[key] = (summary[key] || 0) + t.amount;
                totalIncome += t.amount;
            }
        } else if (t.mainType === 'expense') {
            if (walletTypes[t.walletId] === 'cash' || !t.walletId) {
                let key = `${t.mainType}-${t.category}`;
                summary[key] = (summary[key] || 0) + t.amount;
                totalExpense += t.amount;
                if (t.category === 'Cicilan' || t.category === 'Bayar Pinjaman Bank' || t.category === 'Bayar Kartu Kredit' || t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Pembayaran Hutang') {
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
    checkBudgetAlerts({ type: mainType, category, amount });
    closeTransactionModal();
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

    let deletedTxIds = JSON.parse(localStorage.getItem('transaksiku_deleted_tx_ids') || '[]');
    deletedTxIds.push(id);
    localStorage.setItem('transaksiku_deleted_tx_ids', JSON.stringify(deletedTxIds));

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
            <option value="Makanan & Minuman">🍔 Makanan & Minuman</option>
            <option value="Belanja Kebutuhan">🛒 Belanja Kebutuhan (Sembako/Rumah)</option>
            <option value="Belanja Keinginan">🛍️ Belanja Keinginan (Baju/Gadget/Hobi)</option>
            <option value="Investasi / Top Up Portofolio">📈 Investasi / Top Up Portofolio</option>
            <option value="Hiburan">🎬 Hiburan & Rekreasi</option>
            <option value="Pendidikan">📚 Pendidikan / Kursus</option>
            <option value="Transportasi">🚗 Transportasi / Bensin</option>
            <option value="Tagihan & Utilitas">💡 Tagihan / Listrik / Operasional</option>
            <option value="Kerugian Investasi" style="color:var(--danger); font-weight:bold;">📉 Kerugian Investasi (Cut Loss)</option>
            <option value="Kesehatan">💊 Kesehatan / Medis</option>
            <option value="Biaya Admin Kartu Debit">💳 Biaya Admin Kartu Debit</option>
            <option value="Pembayaran Hutang" style="font-weight: bold;">💳 Pembayaran Hutang</option>
            <option value="Pemberian Piutang" style="font-weight: bold;">🤝 Pemberian Piutang</option>
            <option value="Lainnya">💸 Pengeluaran Lain</option>
        `;
    } else if (mainType === 'income') {
        categorySelect.innerHTML = `
            <option value="Gaji">💰 Gaji / Omzet Bisnis</option>
            <option value="Keuntungan Investasi" style="color:var(--success); font-weight:bold;">📈 Keuntungan Investasi (Profit/Dividen)</option>
            <option value="Pencairan Hutang" style="color:var(--success); font-weight:bold;">💳 Pencairan Hutang</option>
            <option value="Pelunasan Piutang" style="color:var(--success); font-weight:bold;">🤝 Pelunasan Piutang</option>
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
    const groupSelect = document.getElementById('settings-new-cat-group');
    if (!nameInput || !emojiInput || !typeSelect) return;

    const name = nameInput.value.trim();
    const emoji = emojiInput.value;
    const type = typeSelect.value;
    const group = groupSelect ? groupSelect.value : 'wants';

    if (!name) return showToast('Nama kategori tidak boleh kosong!');

    if (state.customCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
        return showToast('Kategori ini sudah ada!');
    }

    state.customCategories.push({ name, icon: emoji, type, budgetGroup: group });

    // Sync custom category directly into 50/30/20 budget settings arrays
    if (type === 'expense' && state.budgetSettings) {
        if (!state.budgetSettings.needsCategories) state.budgetSettings.needsCategories = [];
        if (!state.budgetSettings.wantsCategories) state.budgetSettings.wantsCategories = [];
        if (!state.budgetSettings.savingsCategories) state.budgetSettings.savingsCategories = [];

        if (group === 'needs' && !state.budgetSettings.needsCategories.includes(name)) {
            state.budgetSettings.needsCategories.push(name);
        } else if (group === 'savings' && !state.budgetSettings.savingsCategories.includes(name)) {
            state.budgetSettings.savingsCategories.push(name);
        } else if (!state.budgetSettings.wantsCategories.includes(name)) {
            state.budgetSettings.wantsCategories.push(name);
        }
    }

    saveData();
    nameInput.value = '';

    renderSettingsCustomCategories();
    updateCategoryOptions();
    if (typeof renderBudgetView === 'function') renderBudgetView();
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

    const groupLabels = {
        needs: '🏠 50% Needs',
        wants: '🎮 30% Wants',
        savings: '💎 20% Savings'
    };

    state.customCategories.forEach((c) => {
        const groupTag = c.type === 'expense' ? ` • <strong style="color: var(--accent);">${groupLabels[c.budgetGroup || 'wants']}</strong>` : '';
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--bg); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 5px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.20rem;">${c.icon}</span>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${c.name}</span>
                        <span style="font-size: 0.7rem; color: var(--text-muted);">${typeLabels[c.type] || c.type}${groupTag}</span>
                    </div>
                </div>
                <button onclick="deleteCustomCategoryFromSettings('${c.name.replace(/'/g, "\\'")}', '${c.type}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-weight: 600; font-size: 0.8rem; padding: 4px 8px;">Hapus</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function deleteCustomCategoryFromSettings(name, type) {
    const index = state.customCategories.findIndex(c => c.name === name && c.type === type);
    if (index !== -1) {
        const c = state.customCategories[index];
        let deletedCategories = JSON.parse(localStorage.getItem('transaksiku_deleted_categories') || '[]');
        deletedCategories.push(`${c.name.toLowerCase()}_${c.type}`);
        localStorage.setItem('transaksiku_deleted_categories', JSON.stringify(deletedCategories));

        if (state.budgetSettings) {
            state.budgetSettings.needsCategories = (state.budgetSettings.needsCategories || []).filter(n => n !== name);
            state.budgetSettings.wantsCategories = (state.budgetSettings.wantsCategories || []).filter(w => w !== name);
            state.budgetSettings.savingsCategories = (state.budgetSettings.savingsCategories || []).filter(s => s !== name);
        }

        state.customCategories.splice(index, 1);
        saveData();
        renderSettingsCustomCategories();
        updateCategoryOptions();
        if (typeof renderBudgetView === 'function') renderBudgetView();
        showToast('Kategori kustom dihapus.');
    }
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

// --- BUDGETING FEATURE MODULE ---

// Switch Active Budget Mode (Envelope, 50/30/20, Custom)
function switchBudgetMode(mode) {
    if (!state.budgetSettings) return;
    state.budgetSettings.activeMode = mode;
    saveData();
    
    document.querySelectorAll('.budget-mode-chip').forEach(btn => btn.classList.remove('active'));
    const activeChip = document.getElementById(
        mode === 'envelope' ? 'chip-mode-envelope' : 
        mode === '50_30_20' ? 'chip-mode-503020' : 'chip-mode-custom'
    );
    if (activeChip) activeChip.classList.add('active');
    
    renderBudgetView();
}

// Render Dashboard Mini Widget
function renderDashboardBudgetWidget() {
    const container = document.getElementById('dashboard-budget-widget-content');
    if (!container || !state.budgetSettings) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isInvestmentWallet = (wId) => {
        if (!wId) return false;
        const w = state.wallets.find(wal => wal.id === wId);
        if (!w) return false;
        if (w.type === 'invest') return true;
        const nameLower = (w.name || '').toLowerCase();
        return nameLower.includes('invest') || nameLower.includes('portofolio') || nameLower.includes('bibit') || nameLower.includes('rdn') || nameLower.includes('reksa') || nameLower.includes('saham') || nameLower.includes('stockbit') || nameLower.includes('ajaib') || nameLower.includes('tabungan');
    };

    const currentMonthTx = state.transactions.filter(t => {
        const d = new Date(t.timestamp || t.id);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Sum expense transactions OR investment transfers for current month
    const monthlyExpenses = currentMonthTx
        .filter(t => {
            if (t.mainType === 'expense' || t.type === 'expense') return true;
            if (t.mainType === 'transfer' && isInvestmentWallet(t.toId)) return true;
            return false;
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    let totalLimit = 0;
    const settings = state.budgetSettings;
    if (settings.activeMode === 'envelope') {
        totalLimit = Object.values(settings.categoryBudgets || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    } else {
        totalLimit = Number(settings.monthlyTotal) || 0;
    }

    if (totalLimit <= 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 10px; color: var(--text-muted); font-size: 0.85rem;">
                Belum ada batas anggaran yang diatur. 
                <button onclick="openBudgetSetupModal()" class="btn btn-primary" style="margin-top: 8px; padding: 6px 14px; font-size: 0.78rem;">Atur Anggaran Sekarang</button>
            </div>
        `;
        return;
    }

    const pct = Math.min(100, Math.round((monthlyExpenses / totalLimit) * 100));
    const remaining = totalLimit - monthlyExpenses;
    const isOver = remaining < 0;

    let statusClass = 'safe';
    let statusText = '🟢 Aman';
    if (pct > 90) {
        statusClass = 'danger';
        statusText = isOver ? '🔴 Overbudget!' : '🟡 Peringatan Hati-hati!';
    } else if (pct > 70) {
        statusClass = 'warning';
        statusText = '🟡 Mendekati Limit';
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px;">
            <span style="color: var(--text-muted);">Terpakai: ${formatRp(monthlyExpenses)} (${pct}%)</span>
            <span class="budget-pacing-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="budget-progress-track" style="margin: 6px 0;">
            <div class="budget-progress-bar-fill ${statusClass}" style="width: ${pct}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">
            <span>Target: ${formatRp(totalLimit)}</span>
            <span style="color: ${isOver ? 'var(--danger)' : 'var(--success)'}; font-weight: 700;">
                ${isOver ? 'Melebihi ' + formatRp(Math.abs(remaining)) : 'Sisa ' + formatRp(remaining)}
            </span>
        </div>
    `;
}

// Render Full Budgeting Page View
function renderBudgetView() {
    renderDashboardBudgetWidget();

    const view = document.getElementById('view-budget');
    if (!view || !state.budgetSettings) return;

    const settings = state.budgetSettings;
    const mode = settings.activeMode || 'envelope';

    // Update active chip state
    document.querySelectorAll('.budget-mode-chip').forEach(btn => btn.classList.remove('active'));
    const activeChip = document.getElementById(
        mode === 'envelope' ? 'chip-mode-envelope' : 
        mode === '50_30_20' ? 'chip-mode-503020' : 'chip-mode-custom'
    );
    if (activeChip) activeChip.classList.add('active');

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysLeft = Math.max(1, daysInMonth - currentDay + 1);

    // Helper to check if a wallet is Investment/Savings/Portfolio
    const isInvestmentWallet = (wId) => {
        if (!wId) return false;
        const w = state.wallets.find(wal => wal.id === wId);
        if (!w) return false;
        if (w.type === 'invest') return true;
        const nameLower = (w.name || '').toLowerCase();
        return nameLower.includes('invest') || nameLower.includes('portofolio') || nameLower.includes('bibit') || nameLower.includes('rdn') || nameLower.includes('reksa') || nameLower.includes('saham') || nameLower.includes('stockbit') || nameLower.includes('ajaib') || nameLower.includes('tabungan');
    };

    // Calculate current month's transactions
    const currentMonthTx = state.transactions.filter(t => {
        const d = new Date(t.timestamp || t.id);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Expenses for budgeting: expense transactions OR transfers to investment/portfolio/savings wallets!
    const monthlyExpenses = currentMonthTx.filter(t => {
        if (t.mainType === 'expense' || t.type === 'expense') return true;
        if (t.mainType === 'transfer' && isInvestmentWallet(t.toId)) return true;
        return false;
    });

    // Compute category expenses map with category normalization
    const normalizeCategory = (cat) => {
        if (!cat) return 'Lainnya';
        if (cat === 'Makanan') return 'Makanan & Minuman';
        if (cat === 'Tagihan') return 'Tagihan & Utilitas';
        if (cat === 'Belanja') return 'Belanja Kebutuhan';
        return cat;
    };

    const categorySpentMap = {};
    monthlyExpenses.forEach(t => {
        let cat = normalizeCategory(t.category);
        if (t.mainType === 'transfer' && isInvestmentWallet(t.toId)) {
            cat = 'Investasi';
        }
        categorySpentMap[cat] = (categorySpentMap[cat] || 0) + (Number(t.amount) || 0);
    });

    const totalExpenseSum = monthlyExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    let totalBudget = 0;
    if (mode === 'envelope') {
        totalBudget = Object.values(settings.categoryBudgets || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    } else {
        totalBudget = Number(settings.monthlyTotal) || 0;
    }

    const pct = totalBudget > 0 ? Math.min(100, Math.round((totalExpenseSum / totalBudget) * 100)) : 0;
    const remaining = totalBudget - totalExpenseSum;

    // Update Hero Card UI
    const heroTotalEl = document.getElementById('budget-hero-total');
    const heroFillEl = document.getElementById('budget-hero-progress-fill');
    const heroSpentEl = document.getElementById('budget-hero-spent-text');
    const heroRemainingEl = document.getElementById('budget-hero-remaining-text');
    const pacingBadgeEl = document.getElementById('budget-pacing-badge');
    const pacingStatusEl = document.getElementById('budget-pacing-status-text');
    const pacingDescEl = document.getElementById('budget-pacing-desc');
    const dailyLimitEl = document.getElementById('budget-daily-limit-text');
    const dailyDaysLeftEl = document.getElementById('budget-daily-days-left');

    if (heroTotalEl) heroTotalEl.innerText = formatRp(totalBudget);
    if (heroSpentEl) heroSpentEl.innerText = `Terpakai: ${formatRp(totalExpenseSum)} (${pct}%)`;
    if (heroRemainingEl) {
        heroRemainingEl.innerText = remaining < 0 ? `Overbudget: ${formatRp(Math.abs(remaining))}` : `Sisa: ${formatRp(remaining)}`;
        heroRemainingEl.style.color = remaining < 0 ? 'var(--danger)' : 'var(--success)';
    }
    if (heroFillEl) {
        heroFillEl.style.width = `${pct}%`;
        heroFillEl.className = 'budget-progress-bar-fill ' + (pct > 90 ? 'danger' : pct > 70 ? 'warning' : 'safe');
    }

    // Pacing Analysis (Compare % spent vs % month passed)
    const timePct = Math.round((currentDay / daysInMonth) * 100);
    let pacingStatus = 'safe';
    let pacingTitle = '🟢 Kecepatan Belanja Ideal';
    let pacingDesc = `Anda telah menggunakan ${pct}% anggaran pada hari ke-${currentDay} (${timePct}% perjalanan bulan ini).`;

    if (pct > timePct + 15) {
        pacingStatus = 'danger';
        pacingTitle = '🔴 Boros (Terlalu Cepat)';
        pacingDesc = `⚠️ Hati-hati! Anda sudah menghabiskan ${pct}% budget padahal bulan ini baru berjalan ${timePct}%.`;
    } else if (pct > timePct + 5) {
        pacingStatus = 'warning';
        pacingTitle = '🟡 Sedikit Cepat';
        pacingDesc = `Pengeluaran sedikit lebih cepat dari ritme harian ideal (${pct}% terpakai pada hari ke-${currentDay}).`;
    }

    if (pacingBadgeEl) {
        pacingBadgeEl.className = `budget-pacing-badge ${pacingStatus}`;
        pacingBadgeEl.innerText = pacingTitle;
    }
    if (pacingStatusEl) pacingStatusEl.innerText = pacingTitle;
    if (pacingDescEl) pacingDescEl.innerText = pacingDesc;

    // Daily Limit Calculation
    const safeDailyLimit = Math.max(0, Math.round(remaining / daysLeft));
    if (dailyLimitEl) dailyLimitEl.innerText = `${formatRp(safeDailyLimit)} / hari`;
    if (dailyDaysLeftEl) dailyDaysLeftEl.innerText = `Berdasarkan sisa ${daysLeft} hari pada periode bulan ini.`;

    // Render Mode Dynamic Content Area
    const modeContentArea = document.getElementById('budget-mode-content');
    if (!modeContentArea) return;

    if (mode === 'envelope') {
        const catBudgets = settings.categoryBudgets || {};
        const catKeys = Object.keys(catBudgets);

        if (catKeys.length === 0) {
            modeContentArea.innerHTML = `
                <div class="card" style="text-align: center; padding: 25px; color: var(--text-muted);">
                    <p style="margin-bottom: 12px;">Belum ada kategori yang diberi batas anggaran (Envelope System).</p>
                    <button onclick="openBudgetSetupModal()" class="btn btn-primary" style="margin: 0 auto; padding: 8px 18px;">+ Atur Envelope Kategori</button>
                </div>
            `;
        } else {
            let catCardsHtml = `<h3 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--text-main);">Anggaran Per Kategori (Envelope)</h3>`;
            catKeys.forEach(catName => {
                const limit = Number(catBudgets[catName]) || 0;
                const spent = Number(categorySpentMap[catName]) || 0;
                const catPct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                const catRem = limit - spent;
                const isCatOver = catRem < 0;

                const catStatus = catPct > 90 ? 'danger' : catPct > 70 ? 'warning' : 'safe';

                catCardsHtml += `
                    <div class="budget-category-item">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">📁</span>
                                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${catName}</span>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 700; color: ${isCatOver ? 'var(--danger)' : 'var(--text-muted)'};">
                                ${formatRp(spent)} / ${formatRp(limit)}
                            </span>
                        </div>
                        <div class="budget-progress-track" style="margin: 6px 0;">
                            <div class="budget-progress-bar-fill ${catStatus}" style="width: ${catPct}%;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                            <span style="color: var(--text-muted); font-weight: 600;">Sisa: <strong style="color: ${isCatOver ? 'var(--danger)' : 'var(--success)'};">${isCatOver ? '-' + formatRp(Math.abs(catRem)) : formatRp(catRem)}</strong></span>
                            <div class="budget-quick-actions">
                                <button onclick="openReallocateModal('${catName}')" class="btn-budget-sub">🔄 Pindahkan Saldo</button>
                                <button onclick="openBudgetSetupModal()" class="btn-budget-sub">✏️ Edit Limit</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            modeContentArea.innerHTML = catCardsHtml;
        }
    } else if (mode === '50_30_20') {
        const needsCats = settings.needsCategories || ["Makanan & Minuman", "Makanan", "Belanja Kebutuhan", "Belanja", "Transportasi", "Tagihan & Utilitas", "Tagihan", "Kesehatan", "Pendidikan"];
        const wantsCats = settings.wantsCategories || ["Belanja Keinginan", "Hiburan", "Jalan-jalan", "Hobi"];
        const savingsCats = settings.savingsCategories || ["Investasi", "Tabungan", "Dana Darurat", "Top Up Portofolio", "Top Up Investasi", "Portofolio", "Investasi / Top Up Portofolio"];

        const needsSpent = monthlyExpenses.filter(t => (t.mainType === 'expense' || !t.mainType) && (needsCats.includes(t.category) || needsCats.includes(normalizeCategory(t.category)))).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const wantsSpent = monthlyExpenses.filter(t => (t.mainType === 'expense' || !t.mainType) && (wantsCats.includes(t.category) || wantsCats.includes(normalizeCategory(t.category)))).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        
        // Savings spent includes: expense transactions in savings categories PLUS transfer transactions to investment/savings wallets!
        const savingsSpent = monthlyExpenses.filter(t => {
            if (t.mainType === 'transfer' && isInvestmentWallet(t.toId)) return true;
            const c = normalizeCategory(t.category);
            return savingsCats.includes(t.category) || savingsCats.includes(c) || c.includes('Investasi') || c.includes('Portofolio') || c.includes('Tabungan');
        }).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const targetNeeds = Math.round(totalBudget * 0.5);
        const targetWants = Math.round(totalBudget * 0.3);
        const targetSavings = Math.round(totalBudget * 0.2);

        const needsPct = targetNeeds > 0 ? Math.min(100, Math.round((needsSpent / targetNeeds) * 100)) : 0;
        const wantsPct = targetWants > 0 ? Math.min(100, Math.round((wantsSpent / targetWants) * 100)) : 0;
        const savingsPct = targetSavings > 0 ? Math.min(100, Math.round((savingsSpent / targetSavings) * 100)) : 0;

        modeContentArea.innerHTML = `
            <h3 style="font-size: 1.05rem; margin-bottom: 12px; color: var(--text-main);">Alokasi Metode 50 / 30 / 20</h3>
            
            <div class="budget-category-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; font-size: 0.95rem; color: #3b82f6;">🏠 50% Needs (Kebutuhan Pokok)</span>
                    <span style="font-size: 0.8rem; font-weight: 700;">${formatRp(needsSpent)} / ${formatRp(targetNeeds)}</span>
                </div>
                <div class="budget-progress-track" style="margin: 8px 0;">
                    <div class="budget-progress-bar-fill ${needsPct > 90 ? 'danger' : 'safe'}" style="width: ${needsPct}%;"></div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Mencakup: Makanan, Belanja Kebutuhan (Sembako), Transportasi, Tagihan, Kesehatan, Pendidikan.</p>
            </div>

            <div class="budget-category-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; font-size: 0.95rem; color: #f59e0b;">🎮 30% Wants (Keinginan & Lifestyle)</span>
                    <span style="font-size: 0.8rem; font-weight: 700;">${formatRp(wantsSpent)} / ${formatRp(targetWants)}</span>
                </div>
                <div class="budget-progress-track" style="margin: 8px 0;">
                    <div class="budget-progress-bar-fill ${wantsPct > 90 ? 'danger' : 'warning'}" style="width: ${wantsPct}%;"></div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Mencakup: Belanja Keinginan (Fashion/Gadget), Hiburan, Jalan-jalan, Hobi.</p>
            </div>

            <div class="budget-category-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; font-size: 0.95rem; color: #10b981;">💎 20% Savings (Tabungan & Portofolio)</span>
                    <span style="font-size: 0.8rem; font-weight: 700;">${formatRp(savingsSpent)} / ${formatRp(targetSavings)}</span>
                </div>
                <div class="budget-progress-track" style="margin: 8px 0;">
                    <div class="budget-progress-bar-fill safe" style="width: ${savingsPct}%;"></div>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Mencakup: Tabungan, Investasi, Portofolio, Dana Darurat.</p>
            </div>
        `;
    } else {
        // Custom Mode
        modeContentArea.innerHTML = `
            <div class="card" style="padding: 20px; text-align: center;">
                <h3 style="font-size: 1.1rem; margin-bottom: 8px;">Target Custom Budget</h3>
                <p style="color: var(--text-muted); font-size: 0.88rem;">Total anggaran aktif: <strong>${formatRp(totalBudget)}</strong></p>
                <div class="budget-progress-track" style="margin: 15px 0;">
                    <div class="budget-progress-bar-fill ${pct > 90 ? 'danger' : 'safe'}" style="width: ${pct}%;"></div>
                </div>
                <p style="font-size: 0.82rem; color: var(--text-muted);">Terpakai ${formatRp(totalExpenseSum)} dari total ${formatRp(totalBudget)} (${pct}%).</p>
                <button onclick="openBudgetSetupModal()" class="btn btn-primary" style="margin-top: 12px; padding: 8px 20px;">Ubah Target Custom</button>
            </div>
        `;
    }

    // Render Insights Disiplin Card (Compact)
    const gamificationArea = document.getElementById('budget-gamification-content');
    if (gamificationArea) {
        gamificationArea.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px; background: var(--bg); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);">
                    <span style="font-size: 1.25rem;">🔥</span>
                    <div>
                        <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 600; display: block;">DISIPLIN ANGGARAN</span>
                        <h4 style="font-size: 0.85rem; margin: 0; color: var(--text-main); font-weight: 700;">Streak Hemat 1 Bulan</h4>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; background: var(--bg); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);">
                    <span style="font-size: 1.25rem;">💡</span>
                    <div>
                        <span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 600; display: block;">SISA ROLLED-OVER</span>
                        <h4 style="font-size: 0.85rem; margin: 0; color: var(--success); font-weight: 700;">${formatRp(settings.rolloverBalance || 0)}</h4>
                    </div>
                </div>
            </div>
        `;
    }
}

// Modal Handlers for Budget Setup
function openBudgetSetupModal() {
    const modal = document.getElementById('budget-setup-modal');
    if (!modal || !state.budgetSettings) return;

    const settings = state.budgetSettings;
    const modeSelect = document.getElementById('setup-budget-mode');
    if (modeSelect) modeSelect.value = settings.activeMode || 'envelope';

    const setup503020Total = document.getElementById('setup-503020-total');
    if (setup503020Total) setup503020Total.value = formatRp(settings.monthlyTotal || 0);

    const setupCustomTotal = document.getElementById('setup-custom-total');
    if (setupCustomTotal) setupCustomTotal.value = formatRp(settings.monthlyTotal || 0);

    // Build envelope list inputs
    const envelopeContainer = document.getElementById('setup-envelope-list');
    if (envelopeContainer) {
        const catBudgets = settings.categoryBudgets || {};
        const availableCategories = state.customCategories.filter(c => c.type === 'expense').map(c => c.name);
        const defaultExpenseCats = ["Makanan & Minuman", "Belanja Kebutuhan", "Belanja Keinginan", "Transportasi", "Tagihan & Utilitas", "Hiburan", "Kesehatan", "Pendidikan"];
        const allCats = Array.from(new Set([...defaultExpenseCats, ...availableCategories]));

        let listHtml = '';
        allCats.forEach(cat => {
            const val = catBudgets[cat] !== undefined ? catBudgets[cat] : 0;
            listHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 10px;">
                    <span style="font-size: 0.85rem; font-weight: 600; flex: 1;">${cat}</span>
                    <input type="text" class="envelope-cat-input" data-category="${cat}" value="${formatRp(val)}" oninput="formatCurrencyInput(this)" style="width: 140px; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--card); color: var(--text-main); font-size: 0.85rem;">
                </div>
            `;
        });
        envelopeContainer.innerHTML = listHtml;
    }

    toggleBudgetSetupFields();
    modal.classList.add('active');
}

function closeBudgetSetupModal() {
    const modal = document.getElementById('budget-setup-modal');
    if (modal) modal.classList.remove('active');
}

function toggleBudgetSetupFields() {
    const mode = document.getElementById('setup-budget-mode')?.value || 'envelope';
    const envFields = document.getElementById('setup-envelope-fields');
    const fields503020 = document.getElementById('setup-503020-fields');
    const customFields = document.getElementById('setup-custom-fields');

    if (envFields) envFields.style.display = mode === 'envelope' ? 'block' : 'none';
    if (fields503020) fields503020.style.display = mode === '50_30_20' ? 'block' : 'none';
    if (customFields) customFields.style.display = mode === 'custom' ? 'block' : 'none';
}

function saveBudgetSettingsFromModal() {
    if (!state.budgetSettings) return;

    const mode = document.getElementById('setup-budget-mode')?.value || 'envelope';
    state.budgetSettings.activeMode = mode;

    if (mode === 'envelope') {
        const catInputs = document.querySelectorAll('.envelope-cat-input');
        const newCatBudgets = {};
        catInputs.forEach(input => {
            const catName = input.getAttribute('data-category');
            const cleanVal = parseInt(input.value.replace(/[^0-9]/g, '')) || 0;
            if (catName && cleanVal > 0) {
                newCatBudgets[catName] = cleanVal;
            }
        });
        state.budgetSettings.categoryBudgets = newCatBudgets;
    } else if (mode === '50_30_20') {
        const totalInput = document.getElementById('setup-503020-total');
        const totalVal = parseInt(totalInput?.value.replace(/[^0-9]/g, '')) || 0;
        state.budgetSettings.monthlyTotal = totalVal;
    } else if (mode === 'custom') {
        const totalInput = document.getElementById('setup-custom-total');
        const totalVal = parseInt(totalInput?.value.replace(/[^0-9]/g, '')) || 0;
        state.budgetSettings.monthlyTotal = totalVal;
    }

    const rolloverToggle = document.getElementById('setup-rollover-toggle');
    if (rolloverToggle) state.budgetSettings.rolloverEnabled = rolloverToggle.checked;

    saveData();
    closeBudgetSetupModal();
    showToast('Pengaturan anggaran berhasil disimpan!');
    renderBudgetView();
}

// Modal Handlers for Budget Reallocation
function openReallocateModal(fromCategory = '') {
    const modal = document.getElementById('budget-reallocate-modal');
    if (!modal || !state.budgetSettings) return;

    const fromSelect = document.getElementById('reallocate-from-category');
    const toSelect = document.getElementById('reallocate-to-category');

    const catBudgets = state.budgetSettings.categoryBudgets || {};
    const categories = Object.keys(catBudgets);

    if (categories.length < 2) {
        showToast('Minimal harus ada 2 kategori dengan batas anggaran untuk memindahkan saldo.');
        return;
    }

    if (fromSelect && toSelect) {
        let optionsHtml = '';
        categories.forEach(cat => {
            optionsHtml += `<option value="${cat}">${cat}</option>`;
        });
        fromSelect.innerHTML = optionsHtml;
        toSelect.innerHTML = optionsHtml;

        if (fromCategory && categories.includes(fromCategory)) {
            fromSelect.value = fromCategory;
        }
        if (toSelect.options.length > 1 && toSelect.value === fromSelect.value) {
            toSelect.selectedIndex = (fromSelect.selectedIndex + 1) % toSelect.options.length;
        }
    }

    const amountInput = document.getElementById('reallocate-amount');
    if (amountInput) amountInput.value = '';

    modal.classList.add('active');
}

function closeReallocateModal() {
    const modal = document.getElementById('budget-reallocate-modal');
    if (modal) modal.classList.remove('active');
}

function submitBudgetReallocation() {
    const fromCat = document.getElementById('reallocate-from-category')?.value;
    const toCat = document.getElementById('reallocate-to-category')?.value;
    const amountInput = document.getElementById('reallocate-amount');
    const amount = parseInt(amountInput?.value.replace(/[^0-9]/g, '')) || 0;

    if (!fromCat || !toCat || fromCat === toCat) {
        showToast('Pilih kategori sumber dan tujuan yang berbeda.');
        return;
    }
    if (amount <= 0) {
        showToast('Masukkan nominal yang valid.');
        return;
    }

    const catBudgets = state.budgetSettings.categoryBudgets || {};
    const fromCurrent = Number(catBudgets[fromCat]) || 0;

    if (amount > fromCurrent) {
        showToast(`Nominal memindahkan (${formatRp(amount)}) melebihi limit kategori sumber (${formatRp(fromCurrent)}).`);
        return;
    }

    catBudgets[fromCat] = fromCurrent - amount;
    catBudgets[toCat] = (Number(catBudgets[toCat]) || 0) + amount;
    state.budgetSettings.categoryBudgets = catBudgets;

    saveData();
    closeReallocateModal();
    showToast(`Berhasil memindahkan ${formatRp(amount)} dari ${fromCat} ke ${toCat}!`);
    renderBudgetView();
}

// Smart Alerts Check Triggered when Expense is Added/Updated
function checkBudgetAlerts(transaction) {
    const isExpense = transaction && (transaction.mainType === 'expense' || transaction.type === 'expense');
    if (!isExpense || !state.budgetSettings) return;

    const settings = state.budgetSettings;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate current month's expenses
    const monthlyExpenses = state.transactions
        .filter(t => t.mainType === 'expense' || t.type === 'expense')
        .filter(t => {
            const d = new Date(t.timestamp || t.id);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

    const totalExpenseSum = monthlyExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    let totalBudget = 0;
    if (settings.activeMode === 'envelope') {
        totalBudget = Object.values(settings.categoryBudgets || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    } else {
        totalBudget = Number(settings.monthlyTotal) || 0;
    }

    if (totalBudget > 0) {
        const pct = Math.round((totalExpenseSum / totalBudget) * 100);
        if (pct >= 100) {
            showToast(`🚨 Peringatan: Total pengeluaran bulan ini (${formatRp(totalExpenseSum)}) telah melebihi batas anggaran (${formatRp(totalBudget)})!`);
        } else if (pct >= 90) {
            showToast(`⚠️ Perhatian: Pengeluaran bulan ini sudah mencapai ${pct}% dari total anggaran!`);
        } else if (pct >= 75) {
            showToast(`💡 Info: Pengeluaran bulan ini sudah mencapai ${pct}% dari total anggaran.`);
        }
    }
}

// Expose budget functions globally
window.switchBudgetMode = switchBudgetMode;
window.renderDashboardBudgetWidget = renderDashboardBudgetWidget;
window.renderBudgetView = renderBudgetView;
window.openBudgetSetupModal = openBudgetSetupModal;
window.closeBudgetSetupModal = closeBudgetSetupModal;
window.toggleBudgetSetupFields = toggleBudgetSetupFields;
window.saveBudgetSettingsFromModal = saveBudgetSettingsFromModal;
window.openReallocateModal = openReallocateModal;
window.closeReallocateModal = closeReallocateModal;
window.submitBudgetReallocation = submitBudgetReallocation;
window.checkBudgetAlerts = checkBudgetAlerts;

// --- SAVINGS GOALS (TARGET TABUNGAN & IMPIAN) UI FUNCTIONS ---
let activeBudgetSection = 'expenses'; // 'expenses' | 'savings'
let currentSelectedGoalId = null;

function switchBudgetSection(section) {
    activeBudgetSection = section;
    const btnExpenses = document.getElementById('btn-budget-tab-expenses');
    const btnSavings = document.getElementById('btn-budget-tab-savings');
    const secExpenses = document.getElementById('budget-section-expenses');
    const secSavings = document.getElementById('budget-section-savings');
    const mainTitle = document.getElementById('budget-main-title');
    const mainDesc = document.getElementById('budget-main-desc');
    const btnSetup = document.getElementById('btn-open-budget-setup');
    const btnSavingsModal = document.getElementById('btn-open-savings-modal');

    if (section === 'expenses') {
        if (btnExpenses) {
            btnExpenses.style.background = 'var(--accent)';
            btnExpenses.style.color = 'white';
            btnExpenses.classList.add('active');
        }
        if (btnSavings) {
            btnSavings.style.background = 'transparent';
            btnSavings.style.color = 'var(--text-muted)';
            btnSavings.classList.remove('active');
        }
        if (secExpenses) secExpenses.style.display = 'block';
        if (secSavings) secSavings.style.display = 'none';

        if (mainTitle) mainTitle.textContent = 'Manajemen & Batas Anggaran';
        if (mainDesc) mainDesc.textContent = 'Kendalikan pengeluaran bulanan Anda secara proaktif & disiplin.';
        if (btnSetup) btnSetup.style.display = 'inline-block';
        if (btnSavingsModal) btnSavingsModal.style.display = 'none';

        if (typeof renderBudgetView === 'function') renderBudgetView();
    } else {
        if (btnSavings) {
            btnSavings.style.background = 'var(--accent)';
            btnSavings.style.color = 'white';
            btnSavings.classList.add('active');
        }
        if (btnExpenses) {
            btnExpenses.style.background = 'transparent';
            btnExpenses.style.color = 'var(--text-muted)';
            btnExpenses.classList.remove('active');
        }
        if (secExpenses) secExpenses.style.display = 'none';
        if (secSavings) secSavings.style.display = 'block';

        if (mainTitle) mainTitle.textContent = 'Target Tabungan & Impian';
        if (mainDesc) mainDesc.textContent = 'Rencanakan dan kumpulkan dana untuk impian finansial Anda secara terukur.';
        if (btnSetup) btnSetup.style.display = 'none';
        if (btnSavingsModal) btnSavingsModal.style.display = 'inline-block';

        renderSavingsGoalsView();
    }
}

function renderSavingsGoalsView() {
    const summaryCard = document.getElementById('savings-goals-summary-card');
    const gridContainer = document.getElementById('savings-goals-grid-container');
    if (!summaryCard || !gridContainer) return;

    const goals = state.savingsGoals || [];
    const totalTargetSum = goals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
    const totalCurrentSum = goals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);
    const overallPct = totalTargetSum > 0 ? Math.min(100, Math.round((totalCurrentSum / totalTargetSum) * 100)) : 0;
    const completedCount = goals.filter(g => (g.currentAmount || 0) >= (g.targetAmount || 0) && g.targetAmount > 0).length;

    summaryCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <span style="font-size: 0.8rem; color: var(--purple); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL TABUNGAN IMPIAN</span>
                <h2 style="font-size: 1.8rem; color: var(--text-main); margin-top: 2px;">${formatRp(totalCurrentSum)} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">/ ${formatRp(totalTargetSum)}</span></h2>
                <div style="display: flex; gap: 15px; margin-top: 8px; font-size: 0.82rem; font-weight: 600;">
                    <span style="color: var(--accent);">🎯 ${goals.length} Target Aktif</span>
                    <span style="color: var(--success);">🥳 ${completedCount} Tercapai</span>
                </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
                <div style="font-size: 1.8rem; font-weight: 800; color: var(--purple);">${overallPct}%</div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Progress Keseluruhan</span>
            </div>
        </div>
        <div class="savings-goal-progress-bar" style="height: 12px; margin-top: 15px;">
            <div class="savings-goal-progress-fill ${overallPct >= 100 ? 'completed' : ''}" style="width: ${overallPct}%;"></div>
        </div>
    `;

    if (goals.length === 0) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--card); border-radius: 16px; border: 1px dashed var(--border);">
                <div style="font-size: 3rem; margin-bottom: 12px;">🌟</div>
                <h3 style="color: var(--text-main); margin-bottom: 6px;">Belum Ada Target Tabungan</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 400px; margin: 0 auto 16px auto;">
                    Mulai kumpulkan uang untuk impian Anda (misal: Laptop Baru, Dana Darurat, Liburan) dengan membuat target tabungan pertama.
                </p>
                <button onclick="openSavingsGoalModal()" class="btn btn-primary" style="width: auto; padding: 10px 20px;">
                    ➕ Buat Target Tabungan Pertama
                </button>
            </div>
        `;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    gridContainer.innerHTML = goals.map(goal => {
        const targetAmt = Number(goal.targetAmount) || 0;
        const currentAmt = Number(goal.currentAmount) || 0;
        const pct = targetAmt > 0 ? Math.min(100, Math.round((currentAmt / targetAmt) * 100)) : 0;
        const isCompleted = currentAmt >= targetAmt && targetAmt > 0;

        let statusBadge = '';
        let recommendationText = '';

        if (isCompleted) {
            statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: var(--success); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.3);">🥳 Target Tercapai!</span>`;
            recommendationText = `<span style="color: var(--success); font-weight: 700;">Selamat! Target nominal sudah terkumpul. 🎉</span>`;
        } else if (goal.targetDate) {
            const tDate = new Date(goal.targetDate);
            tDate.setHours(0, 0, 0, 0);
            const diffTime = tDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const remainingAmt = Math.max(0, targetAmt - currentAmt);

            if (diffDays < 0) {
                statusBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: var(--danger); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(239, 68, 68, 0.3);">⚠️ Lewat Tenggat</span>`;
                recommendationText = `Sisa Rp ${formatRp(remainingAmt).replace('Rp ', '')}`;
            } else {
                const diffMonths = Math.max(1, Math.ceil(diffDays / 30));
                const monthlyRec = Math.ceil(remainingAmt / diffMonths);
                statusBadge = `<span style="background: rgba(139, 92, 246, 0.15); color: var(--purple); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.3);">⏳ ${diffDays} hari lagi</span>`;
                recommendationText = `Saran: <strong>${formatRp(monthlyRec)}</strong> / bulan`;
            }
        } else {
            statusBadge = `<span style="background: var(--bg); color: var(--text-muted); font-weight: 600; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border);">🎯 Tanpa Tenggat</span>`;
            recommendationText = `Sisa: <strong>${formatRp(Math.max(0, targetAmt - currentAmt))}</strong>`;
        }

        return `
            <div class="savings-goal-card ${isCompleted ? 'completed' : ''}">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 2rem; background: var(--bg); padding: 8px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">${goal.categoryIcon || '🎯'}</span>
                            <div>
                                <h4 style="font-size: 1.05rem; color: var(--text-main); font-weight: 700; margin: 0; line-height: 1.2;">${escapeHtml(goal.name)}</h4>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">Target: ${goal.targetDate ? formatDateIndo(goal.targetDate) : 'Tidak diset'}</span>
                            </div>
                        </div>
                        ${statusBadge}
                    </div>

                    <div style="margin-top: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 1.2rem; font-weight: 800; color: ${isCompleted ? 'var(--success)' : 'var(--text-main)'};">${formatRp(currentAmt)}</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--purple);">${pct}%</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">dari target ${formatRp(targetAmt)}</div>

                        <div class="savings-goal-progress-bar">
                            <div class="savings-goal-progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${pct}%;"></div>
                        </div>

                        <div style="font-size: 0.75rem; color: var(--text-main); margin-top: 6px;">
                            ${recommendationText}
                        </div>
                    </div>
                </div>

                <div class="savings-goal-actions">
                    <button onclick="openGoalDepositModal('${goal.id}')" class="btn-goal-deposit">
                        💰 Setor
                    </button>
                    <button onclick="openGoalDetailModal('${goal.id}')" class="btn-goal-detail">
                        📜 Detail
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Modal Helpers for Savings Goals
function selectSavingsGoalIcon(icon, btnEl) {
    document.getElementById('savings-goal-icon').value = icon;
    document.querySelectorAll('#savings-goal-icon-grid .emoji-btn').forEach(btn => btn.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
}

function calculateGoalPacingPreview() {
    const targetInput = document.getElementById('savings-goal-target-amount');
    const initialInput = document.getElementById('savings-goal-initial-amount');
    const dateInput = document.getElementById('savings-goal-target-date');
    const previewBox = document.getElementById('savings-goal-pacing-preview');
    const previewText = document.getElementById('pacing-preview-text');

    if (!targetInput || !dateInput || !previewBox || !previewText) return;

    const targetAmt = parseCurrencyInput(targetInput.value) || 0;
    const initialAmt = parseCurrencyInput(initialInput.value) || 0;
    const targetDateStr = dateInput.value;

    if (targetAmt <= 0 || !targetDateStr) {
        previewBox.style.display = 'none';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        previewBox.style.display = 'block';
        previewText.innerHTML = `<span style="color: var(--danger);">Tanggal target harus di masa mendatang!</span>`;
        return;
    }

    const neededAmt = Math.max(0, targetAmt - initialAmt);
    const diffMonths = Math.max(1, Math.ceil(diffDays / 30));
    const monthlyRec = Math.ceil(neededAmt / diffMonths);
    const dailyRec = Math.ceil(neededAmt / diffDays);

    previewBox.style.display = 'block';
    previewText.innerHTML = `Tabung <strong>${formatRp(monthlyRec)}</strong> / bulan (atau ~${formatRp(dailyRec)} / hari) selama <strong>${diffMonths} bulan</strong> (${diffDays} hari).`;
}

function openSavingsGoalModal(goalId = null) {
    const modal = document.getElementById('savings-goal-modal');
    const titleEl = document.getElementById('savings-goal-modal-title');
    const idInput = document.getElementById('savings-goal-id');
    const nameInput = document.getElementById('savings-goal-name');
    const targetInput = document.getElementById('savings-goal-target-amount');
    const dateInput = document.getElementById('savings-goal-target-date');
    const initialInput = document.getElementById('savings-goal-initial-amount');
    const notesInput = document.getElementById('savings-goal-notes');

    if (!modal) return;

    if (goalId && state.savingsGoals) {
        const goal = state.savingsGoals.find(g => g.id === goalId);
        if (goal) {
            titleEl.textContent = '✏️ Edit Target Tabungan';
            idInput.value = goal.id;
            nameInput.value = goal.name || '';
            targetInput.value = formatRp(goal.targetAmount).replace('Rp ', '');
            dateInput.value = goal.targetDate || '';
            initialInput.value = formatRp(goal.currentAmount).replace('Rp ', '');
            notesInput.value = goal.notes || '';
            const matchingBtn = Array.from(document.querySelectorAll('#savings-goal-icon-grid .emoji-btn')).find(b => b.textContent.trim() === (goal.categoryIcon || '🎯'));
            selectSavingsGoalIcon(goal.categoryIcon || '🎯', matchingBtn);
        }
    } else {
        titleEl.textContent = '🎯 Buat Target Tabungan Baru';
        idInput.value = '';
        document.getElementById('savings-goal-form').reset();
        selectSavingsGoalIcon('🎯', document.querySelector('#savings-goal-icon-grid .emoji-btn'));
    }

    calculateGoalPacingPreview();
    modal.classList.add('active');
}

function closeSavingsGoalModal() {
    const modal = document.getElementById('savings-goal-modal');
    if (modal) modal.classList.remove('active');
}

function saveSavingsGoalFromForm() {
    const id = document.getElementById('savings-goal-id').value;
    const icon = document.getElementById('savings-goal-icon').value || '🎯';
    const name = document.getElementById('savings-goal-name').value.trim();
    const targetAmt = parseCurrencyInput(document.getElementById('savings-goal-target-amount').value);
    const targetDate = document.getElementById('savings-goal-target-date').value;
    const initialAmt = parseCurrencyInput(document.getElementById('savings-goal-initial-amount').value);
    const notes = document.getElementById('savings-goal-notes').value.trim();

    if (!name || targetAmt <= 0) {
        showToast('Mohon isi nama target dan nominal target uang!');
        return;
    }

    if (id) {
        updateSavingsGoal(id, {
            name,
            targetAmount: targetAmt,
            targetDate,
            categoryIcon: icon,
            notes
        });
        showToast('Target tabungan berhasil diperbarui! ✨');
    } else {
        addSavingsGoal({
            name,
            targetAmount: targetAmt,
            currentAmount: initialAmt,
            targetDate,
            categoryIcon: icon,
            notes
        });
        showToast('Target tabungan baru berhasil dibuat! 🎯');
    }

    closeSavingsGoalModal();
    renderSavingsGoalsView();
}

// Deposit Modal Functions
function openGoalDepositModal(goalId) {
    const goal = (state.savingsGoals || []).find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('deposit-goal-id').value = goal.id;
    document.getElementById('deposit-goal-icon').textContent = goal.categoryIcon || '🎯';
    document.getElementById('deposit-goal-name').textContent = goal.name;
    document.getElementById('deposit-goal-progress-text').textContent = `${formatRp(goal.currentAmount)} terkumpul dari target ${formatRp(goal.targetAmount)}`;

    // Populate Wallets select
    const walletSelect = document.getElementById('deposit-wallet-id');
    if (walletSelect) {
        walletSelect.innerHTML = `<option value="">-- Tanpa Potong Dompet (Pencatatan Saja) --</option>` +
            (state.wallets || []).map(w => `<option value="${w.id}">${w.name} (Saldo: ${formatRp(w.balance)})</option>`).join('');
    }

    document.getElementById('deposit-amount').value = '';
    document.getElementById('deposit-note').value = '';
    setGoalDepositType('deposit');

    const modal = document.getElementById('savings-goal-deposit-modal');
    if (modal) modal.classList.add('active');
}

function setGoalDepositType(type) {
    document.getElementById('deposit-goal-type').value = type;
    const btnDeposit = document.getElementById('btn-goal-type-deposit');
    const btnWithdraw = document.getElementById('btn-goal-type-withdraw');
    const walletLabel = document.getElementById('deposit-wallet-label');
    const btnSubmit = document.getElementById('btn-submit-goal-deposit');
    const titleEl = document.getElementById('goal-deposit-modal-title');

    if (type === 'deposit') {
        btnDeposit.style.background = 'var(--success)';
        btnDeposit.style.color = 'white';
        btnWithdraw.style.background = 'var(--border)';
        btnWithdraw.style.color = 'var(--text-muted)';
        walletLabel.textContent = 'Pilih Dompet Sumber Setoran (Dipotong):';
        btnSubmit.textContent = 'Proses Setoran Tabungan';
        btnSubmit.style.background = 'var(--success)';
        titleEl.textContent = '💰 Tambah Setoran Tabungan';
    } else {
        btnWithdraw.style.background = 'var(--accent)';
        btnWithdraw.style.color = 'white';
        btnDeposit.style.background = 'var(--border)';
        btnDeposit.style.color = 'var(--text-muted)';
        walletLabel.textContent = 'Pilih Dompet Tujuan Penarikan (Ditambah):';
        btnSubmit.textContent = 'Proses Penarikan Saldo';
        btnSubmit.style.background = 'var(--accent)';
        titleEl.textContent = '📤 Tarik Saldo Tabungan';
    }
}

function closeGoalDepositModal() {
    const modal = document.getElementById('savings-goal-deposit-modal');
    if (modal) modal.classList.remove('active');
}

function submitGoalDepositForm() {
    const goalId = document.getElementById('deposit-goal-id').value;
    const type = document.getElementById('deposit-goal-type').value;
    const walletId = document.getElementById('deposit-wallet-id').value;
    const amount = parseCurrencyInput(document.getElementById('deposit-amount').value);
    const note = document.getElementById('deposit-note').value.trim();

    if (amount <= 0) {
        showToast('Mohon masukkan nominal yang valid!');
        return;
    }

    const success = addGoalTransaction(goalId, { type, amount, walletId, note });
    if (success) {
        showToast(type === 'deposit' ? 'Setoran tabungan berhasil dicatat! 🎉' : 'Penarikan saldo berhasil! 💸');
        closeGoalDepositModal();
        renderSavingsGoalsView();
        if (typeof renderDashboard === 'function') renderDashboard();
    } else {
        showToast('Gagal memproses transaksi target tabungan.');
    }
}

// Detail & History Modal Functions
function openGoalDetailModal(goalId) {
    const goal = (state.savingsGoals || []).find(g => g.id === goalId);
    if (!goal) return;

    currentSelectedGoalId = goalId;
    document.getElementById('detail-goal-icon').textContent = goal.categoryIcon || '🎯';
    document.getElementById('detail-goal-title').textContent = goal.name;

    const summaryContainer = document.getElementById('detail-goal-summary-container');
    const historyList = document.getElementById('detail-goal-history-list');

    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;

    summaryContainer.innerHTML = `
        <div style="background: var(--bg); padding: 14px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Nominal Terkumpul</span>
                <strong style="font-size: 1.1rem; color: var(--accent);">${formatRp(goal.currentAmount)} / ${formatRp(goal.targetAmount)}</strong>
            </div>
            <div class="savings-goal-progress-bar">
                <div class="savings-goal-progress-fill ${pct >= 100 ? 'completed' : ''}" style="width: ${pct}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
                <span>Progress: ${pct}%</span>
                <span>Tenggat: ${goal.targetDate ? formatDateIndo(goal.targetDate) : '-'}</span>
            </div>
            ${goal.notes ? `<p style="font-size: 0.8rem; color: var(--text-main); margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); font-style: italic;">"${escapeHtml(goal.notes)}"</p>` : ''}
            ${goal.currentAmount > 0 ? `
                <button onclick="executeGoalPurchase('${goal.id}')" class="btn" style="margin-top: 12px; width: 100%; background: linear-gradient(135deg, var(--success) 0%, #059669 100%); color: white; border: none; font-weight: 700; padding: 10px; border-radius: 10px; font-size: 0.85rem; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    🛒 Beli Barang / Gunakan Tabungan (${formatRp(goal.currentAmount)})
                </button>
            ` : ''}
        </div>
    `;

    const history = goal.history || [];
    if (history.length === 0) {
        historyList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.82rem;">Belum ada riwayat transaksi.</div>`;
    } else {
        historyList.innerHTML = history.map(item => {
            const isDeposit = item.type === 'deposit';
            const isPurchase = item.type === 'purchase';
            const badgeTitle = isPurchase ? '🛒 Pembelian Barang Impian' : (isDeposit ? '📥 Setoran' : '📤 Penarikan');
            const badgeColor = isPurchase ? 'var(--purple)' : (isDeposit ? 'var(--success)' : 'var(--accent)');
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--card); border-radius: 8px; margin-bottom: 6px; border-left: 4px solid ${badgeColor};">
                    <div>
                        <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">${badgeTitle}</strong>
                        <span style="font-size: 0.72rem; color: var(--text-muted);">${formatDateIndo(item.date)} ${item.note ? '• ' + escapeHtml(item.note) : ''}</span>
                    </div>
                    <span style="font-size: 0.9rem; font-weight: 700; color: ${badgeColor};">
                        ${isDeposit ? '+' : '-'}${formatRp(item.amount)}
                    </span>
                </div>
            `;
        }).join('');
    }

    const modal = document.getElementById('savings-goal-detail-modal');
    if (modal) modal.classList.add('active');
}

async function executeGoalPurchase(goalId) {
    const goal = (state.savingsGoals || []).find(g => g.id === goalId);
    if (!goal || goal.currentAmount <= 0) return;

    const confirmed = await customConfirm(
        `Apakah Anda ingin merealisasikan/membeli [${goal.name}] seharga ${formatRp(goal.currentAmount)} menggunakan saldo dari Dompet Tabungan Impian?`,
        'Beli Barang Impian'
    );

    if (confirmed) {
        const success = addGoalTransaction(goalId, {
            type: 'purchase',
            amount: goal.currentAmount,
            walletId: null,
            note: 'Realisasi Pembelian Barang Impian'
        });

        if (success) {
            showToast(`Selamat! 🎉 Target [${goal.name}] telah berhasil dibeli!`);
            closeGoalDetailModal();
            renderSavingsGoalsView();
            if (typeof renderDashboard === 'function') renderDashboard();
        }
    }
}

window.executeGoalPurchase = executeGoalPurchase;

function closeGoalDetailModal() {
    const modal = document.getElementById('savings-goal-detail-modal');
    if (modal) modal.classList.remove('active');
}

function handleEditGoalClick() {
    if (!currentSelectedGoalId) return;
    closeGoalDetailModal();
    openSavingsGoalModal(currentSelectedGoalId);
}

async function handleDeleteGoalClick() {
    if (!currentSelectedGoalId) return;
    const goal = (state.savingsGoals || []).find(g => g.id === currentSelectedGoalId);
    const goalName = goal ? goal.name : 'target tabungan ini';
    const confirmed = await customConfirm(
        `Apakah Anda yakin ingin menghapus target tabungan "${goalName}"? Tindakan ini tidak dapat dibatalkan.`,
        '🗑️ Hapus Target Tabungan'
    );
    if (confirmed) {
        deleteSavingsGoal(currentSelectedGoalId);
        showToast('Target tabungan berhasil dihapus.');
        closeGoalDetailModal();
        renderSavingsGoalsView();
    }
}

// Expose functions globally
window.switchBudgetSection = switchBudgetSection;
window.renderSavingsGoalsView = renderSavingsGoalsView;
window.selectSavingsGoalIcon = selectSavingsGoalIcon;
window.calculateGoalPacingPreview = calculateGoalPacingPreview;
window.openSavingsGoalModal = openSavingsGoalModal;
window.closeSavingsGoalModal = closeSavingsGoalModal;
window.saveSavingsGoalFromForm = saveSavingsGoalFromForm;
window.openGoalDepositModal = openGoalDepositModal;
window.setGoalDepositType = setGoalDepositType;
window.closeGoalDepositModal = closeGoalDepositModal;
window.submitGoalDepositForm = submitGoalDepositForm;
window.openGoalDetailModal = openGoalDetailModal;
window.closeGoalDetailModal = closeGoalDetailModal;
window.handleEditGoalClick = handleEditGoalClick;
window.handleDeleteGoalClick = handleDeleteGoalClick;

// --- DEBT (HUTANG) & RECEIVABLE (PIUTANG) UI FUNCTIONS ---
let currentSelectedDebtId = null;
let currentSelectedReceivableId = null;

// RENDER DEBT VIEW
function renderDebtView() {
    const summaryCard = document.getElementById('debt-summary-hero-card');
    const alertBanner = document.getElementById('debt-due-alert-banner');
    const gridContainer = document.getElementById('debt-cards-grid-container');

    if (!summaryCard || !gridContainer) return;

    const debts = state.debts || [];
    const totalDebtSum = debts.reduce((acc, d) => acc + (Number(d.totalAmount) || 0), 0);
    const totalPaidSum = debts.reduce((acc, d) => acc + (Number(d.paidAmount) || 0), 0);
    const totalRemainingSum = Math.max(0, totalDebtSum - totalPaidSum);
    const overallPct = totalDebtSum > 0 ? Math.min(100, Math.round((totalPaidSum / totalDebtSum) * 100)) : 0;
    const completedCount = debts.filter(d => (d.paidAmount || 0) >= (d.totalAmount || 0) && d.totalAmount > 0).length;

    summaryCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <span style="font-size: 0.8rem; color: var(--purple); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL KEWAJIBAN HUTANG</span>
                <h2 style="font-size: 1.8rem; color: var(--text-main); margin-top: 2px;">${formatRp(totalRemainingSum)} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">/ Total ${formatRp(totalDebtSum)}</span></h2>
                <div style="display: flex; gap: 15px; margin-top: 8px; font-size: 0.82rem; font-weight: 600;">
                    <span style="color: var(--purple);">💳 ${debts.length} Catatan Hutang</span>
                    <span style="color: var(--success);">🟢 Terbayar: ${formatRp(totalPaidSum)} (${overallPct}%)</span>
                </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
                <div style="font-size: 1.8rem; font-weight: 800; color: var(--purple);">${overallPct}%</div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Pelunasan Terbayar</span>
            </div>
        </div>
        <div class="savings-goal-progress-bar" style="height: 12px; margin-top: 15px;">
            <div class="savings-goal-progress-fill ${overallPct >= 100 ? 'completed' : ''}" style="width: ${overallPct}%;"></div>
        </div>
    `;

    const today = new Date();
    const currentDay = today.getDate();
    const activeDueDebts = debts.filter(d => (d.paidAmount || 0) < (d.totalAmount || 0) && d.dueDay);
    const dueSoonDebts = activeDueDebts.filter(d => {
        const due = Number(d.dueDay);
        return due && ((due >= currentDay && due <= currentDay + 7) || currentDay > due);
    });

    if (alertBanner) {
        if (dueSoonDebts.length > 0) {
            alertBanner.innerHTML = `
                <div class="debt-due-alert-box">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">⏰</span>
                        <div>
                            <strong style="color: var(--danger); font-size: 0.9rem; display: block;">Peringatan Jatuh Tempo Bulan Ini</strong>
                            <span style="font-size: 0.8rem; color: var(--text-main);">Ada <strong>${dueSoonDebts.length} hutang</strong> yang mendekati atau telah melewati tanggal jatuh tempo cicilan.</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            alertBanner.innerHTML = '';
        }
    }

    if (debts.length === 0) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--card); border-radius: 16px; border: 1px dashed var(--border);">
                <div style="font-size: 3rem; margin-bottom: 12px;">🎉</div>
                <h3 style="color: var(--text-main); margin-bottom: 6px;">Bersih Dari Hutang!</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 400px; margin: 0 auto 16px auto;">
                    Saat ini tidak ada catatan hutang aktif. Jika Anda mengambil pinjaman baru atau kartu kredit, Anda dapat mencatatnya di sini.
                </p>
                <button onclick="openDebtModal()" class="btn btn-primary" style="width: auto; padding: 10px 20px; background: var(--purple);">
                    ➕ Tambah Catatan Hutang
                </button>
            </div>
        `;
        return;
    }

    gridContainer.innerHTML = debts.map(debt => {
        const totalAmt = Number(debt.totalAmount) || 0;
        const paidAmt = Number(debt.paidAmount) || 0;
        const remainingAmt = Math.max(0, totalAmt - paidAmt);
        const pct = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;
        const isCompleted = paidAmt >= totalAmt && totalAmt > 0;

        let categoryIcon = '📌';
        if (debt.category === 'Pinjaman Bank') categoryIcon = '🏛️';
        else if (debt.category === 'Kartu Kredit') categoryIcon = '💳';
        else if (debt.category === 'Pinjaman Pribadi') categoryIcon = '👤';
        else if (debt.category === 'KPR / Kendaraan') categoryIcon = '🏠';
        else if (debt.category === 'Paylater / Pinjol') categoryIcon = '📱';

        let statusBadge = '';
        if (isCompleted) {
            statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: var(--success); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.3);">🟢 Lunas</span>`;
        } else if (debt.dueDay) {
            const due = Number(debt.dueDay);
            if (currentDay > due) {
                statusBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: var(--danger); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(239, 68, 68, 0.3);">⚠️ Lewat Tgl ${due}</span>`;
            } else if (due - currentDay <= 7) {
                statusBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.3);">⏰ Tgl ${due} (Segera)</span>`;
            } else {
                statusBadge = `<span style="background: rgba(168, 85, 247, 0.15); color: var(--purple); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(168, 85, 247, 0.3);">📅 Tgl ${due} Tiap Bulan</span>`;
            }
        } else {
            statusBadge = `<span style="background: var(--bg); color: var(--text-muted); font-weight: 600; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border);">📌 Fleksibel</span>`;
        }

        return `
            <div class="debt-item-card ${isCompleted ? 'completed' : ''}">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 2rem; background: var(--bg); padding: 8px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">${categoryIcon}</span>
                            <div>
                                <h4 style="font-size: 1.05rem; color: var(--text-main); font-weight: 700; margin: 0; line-height: 1.2;">${escapeHtml(debt.name)}</h4>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">${escapeHtml(debt.category || 'Pinjaman')}</span>
                            </div>
                        </div>
                        ${statusBadge}
                    </div>

                    <div style="margin-top: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 1.2rem; font-weight: 800; color: ${isCompleted ? 'var(--success)' : 'var(--danger)'};">${formatRp(remainingAmt)}</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--purple);">${pct}% Terbayar</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Sisa kewajiban dari total ${formatRp(totalAmt)}</div>

                        <div class="savings-goal-progress-bar">
                            <div class="savings-goal-progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${pct}%;"></div>
                        </div>

                        ${debt.monthlyTarget ? `<div style="font-size: 0.75rem; color: var(--text-main); margin-top: 6px;">Target Cicilan: <strong>${formatRp(debt.monthlyTarget)}</strong> / bulan</div>` : ''}
                    </div>
                </div>

                <div class="savings-goal-actions">
                    <button onclick="openDebtPaymentModal('${debt.id}')" class="btn-goal-deposit" style="background: var(--purple);">
                        💳 Bayar Cicilan
                    </button>
                    <button onclick="openDebtDetailModal('${debt.id}')" class="btn-goal-detail">
                        📜 Detail
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// RENDER RECEIVABLES VIEW
function renderReceivablesView() {
    const summaryCard = document.getElementById('receivables-summary-hero-card');
    const gridContainer = document.getElementById('receivables-cards-grid-container');

    if (!summaryCard || !gridContainer) return;

    const receivables = state.receivables || [];
    const totalReceivableSum = receivables.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
    const totalReceivedSum = receivables.reduce((acc, r) => acc + (Number(r.receivedAmount) || 0), 0);
    const totalRemainingSum = Math.max(0, totalReceivableSum - totalReceivedSum);
    const overallPct = totalReceivableSum > 0 ? Math.min(100, Math.round((totalReceivedSum / totalReceivableSum) * 100)) : 0;
    const completedCount = receivables.filter(r => (r.receivedAmount || 0) >= (r.totalAmount || 0) && r.totalAmount > 0).length;

    summaryCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <span style="font-size: 0.8rem; color: var(--success); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PIUTANG DILUAR</span>
                <h2 style="font-size: 1.8rem; color: var(--text-main); margin-top: 2px;">${formatRp(totalRemainingSum)} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">/ Total ${formatRp(totalReceivableSum)}</span></h2>
                <div style="display: flex; gap: 15px; margin-top: 8px; font-size: 0.82rem; font-weight: 600;">
                    <span style="color: var(--success);">🤝 ${receivables.length} Catatan Piutang</span>
                    <span style="color: var(--accent);">🟢 Diterima: ${formatRp(totalReceivedSum)} (${overallPct}%)</span>
                </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
                <div style="font-size: 1.8rem; font-weight: 800; color: var(--success);">${overallPct}%</div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Pelunasan Diterima</span>
            </div>
        </div>
        <div class="savings-goal-progress-bar" style="height: 12px; margin-top: 15px;">
            <div class="savings-goal-progress-fill ${overallPct >= 100 ? 'completed' : ''}" style="width: ${overallPct}%;"></div>
        </div>
    `;

    if (receivables.length === 0) {
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--card); border-radius: 16px; border: 1px dashed var(--border);">
                <div style="font-size: 3rem; margin-bottom: 12px;">🤝</div>
                <h3 style="color: var(--text-main); margin-bottom: 6px;">Belum Ada Catatan Piutang</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 400px; margin: 0 auto 16px auto;">
                    Catat uang Anda yang dipinjam teman, keluarga, atau tagihan pekerjaan agar terpantau dengan jelas.
                </p>
                <button onclick="openReceivableModal()" class="btn btn-primary" style="width: auto; padding: 10px 20px; background: var(--success);">
                    ➕ Tambah Catatan Piutang
                </button>
            </div>
        `;
        return;
    }

    gridContainer.innerHTML = receivables.map(rec => {
        const totalAmt = Number(rec.totalAmount) || 0;
        const receivedAmt = Number(rec.receivedAmount) || 0;
        const remainingAmt = Math.max(0, totalAmt - receivedAmt);
        const pct = totalAmt > 0 ? Math.min(100, Math.round((receivedAmt / totalAmt) * 100)) : 0;
        const isCompleted = receivedAmt >= totalAmt && totalAmt > 0;

        let statusBadge = '';
        if (isCompleted) {
            statusBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: var(--success); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.3);">🟢 Lunas</span>`;
        } else if (rec.dueDate) {
            statusBadge = `<span style="background: rgba(139, 92, 246, 0.15); color: var(--purple); font-weight: 700; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(139, 92, 246, 0.3);">📅 Tenggat ${formatDateIndo(rec.dueDate)}</span>`;
        } else {
            statusBadge = `<span style="background: var(--bg); color: var(--text-muted); font-weight: 600; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border);">📌 Fleksibel</span>`;
        }

        return `
            <div class="receivable-item-card ${isCompleted ? 'completed' : ''}">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 2rem; background: var(--bg); padding: 8px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">🤝</span>
                            <div>
                                <h4 style="font-size: 1.05rem; color: var(--text-main); font-weight: 700; margin: 0; line-height: 1.2;">${escapeHtml(rec.name)}</h4>
                                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">Peminjam: <strong>${escapeHtml(rec.debtorName || 'Teman')}</strong></span>
                            </div>
                        </div>
                        ${statusBadge}
                    </div>

                    <div style="margin-top: 14px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-size: 1.2rem; font-weight: 800; color: ${isCompleted ? 'var(--success)' : 'var(--text-main)'};">${formatRp(remainingAmt)}</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--success);">${pct}% Diterima</span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Sisa tagihan dari total ${formatRp(totalAmt)}</div>

                        <div class="savings-goal-progress-bar">
                            <div class="savings-goal-progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${pct}%;"></div>
                        </div>
                    </div>
                </div>

                <div class="savings-goal-actions">
                    <button onclick="openReceivablePaymentModal('${rec.id}')" class="btn-goal-deposit" style="background: var(--success);">
                        💰 Terima Pelunasan
                    </button>
                    <button onclick="openReceivableDetailModal('${rec.id}')" class="btn-goal-detail">
                        📜 Detail
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Modal Handlers for Debt
function openDebtModal(debtId = null) {
    const modal = document.getElementById('debt-modal');
    const titleEl = document.getElementById('debt-modal-title');
    const idInput = document.getElementById('debt-id');
    const nameInput = document.getElementById('debt-name');
    const catInput = document.getElementById('debt-category');
    const totalInput = document.getElementById('debt-total-amount');
    const targetInput = document.getElementById('debt-monthly-target');
    const dueDayInput = document.getElementById('debt-due-day');
    const walletSelect = document.getElementById('debt-wallet-id');
    const notesInput = document.getElementById('debt-notes');

    if (!modal) return;

    if (walletSelect) {
        walletSelect.innerHTML = `<option value="">-- Tanpa Tambah Kas (Pencatatan Saja) --</option>` +
            (state.wallets || []).map(w => `<option value="${w.id}">${w.name} (Saldo: ${formatRp(w.balance)})</option>`).join('');
    }

    if (debtId && state.debts) {
        const debt = state.debts.find(d => d.id === debtId);
        if (debt) {
            titleEl.textContent = '✏️ Edit Catatan Hutang';
            idInput.value = debt.id;
            nameInput.value = debt.name || '';
            catInput.value = debt.category || 'Pinjaman Pribadi';
            totalInput.value = formatRp(debt.totalAmount).replace('Rp ', '');
            targetInput.value = debt.monthlyTarget ? formatRp(debt.monthlyTarget).replace('Rp ', '') : '';
            dueDayInput.value = debt.dueDay || '';
            notesInput.value = debt.notes || '';
        }
    } else {
        titleEl.textContent = '💳 Tambah Catatan Hutang Baru';
        idInput.value = '';
        document.getElementById('debt-form').reset();
    }

    modal.classList.add('active');
}

function closeDebtModal() {
    const modal = document.getElementById('debt-modal');
    if (modal) modal.classList.remove('active');
}

function saveDebtFromForm() {
    const id = document.getElementById('debt-id').value;
    const name = document.getElementById('debt-name').value.trim();
    const category = document.getElementById('debt-category').value;
    const totalAmount = parseCurrencyInput(document.getElementById('debt-total-amount').value);
    const monthlyTarget = parseCurrencyInput(document.getElementById('debt-monthly-target').value);
    const dueDay = document.getElementById('debt-due-day').value;
    const walletId = document.getElementById('debt-wallet-id').value;
    const notes = document.getElementById('debt-notes').value.trim();

    if (!name || totalAmount <= 0) {
        showToast('Mohon isi nama hutang dan nominal pinjaman yang valid!');
        return;
    }

    if (id) {
        updateDebt(id, {
            name,
            category,
            totalAmount,
            monthlyTarget,
            dueDay: dueDay ? Number(dueDay) : null,
            notes
        });
        showToast('Catatan hutang berhasil diperbarui! ✨');
    } else {
        addDebt({
            name,
            category,
            totalAmount,
            monthlyTarget,
            dueDay: dueDay ? Number(dueDay) : null,
            walletId,
            notes
        });
        showToast('Catatan hutang baru berhasil ditambahkan! 💳');
    }

    closeDebtModal();
    renderDebtView();
    if (typeof renderDashboard === 'function') renderDashboard();
}

function openDebtPaymentModal(debtId) {
    const debt = (state.debts || []).find(d => d.id === debtId);
    if (!debt) return;

    document.getElementById('payment-debt-id').value = debt.id;
    document.getElementById('payment-debt-name').textContent = debt.name;
    const remaining = Math.max(0, debt.totalAmount - debt.paidAmount);
    document.getElementById('payment-debt-progress-text').textContent = `Sisa kewajiban: ${formatRp(remaining)} dari total ${formatRp(debt.totalAmount)}`;

    const walletSelect = document.getElementById('payment-debt-wallet-id');
    if (walletSelect) {
        walletSelect.innerHTML = (state.wallets || []).map(w => `<option value="${w.id}">${w.name} (Saldo: ${formatRp(w.balance)})</option>`).join('');
    }

    document.getElementById('payment-debt-amount').value = debt.monthlyTarget ? formatRp(debt.monthlyTarget).replace('Rp ', '') : '';
    document.getElementById('payment-debt-note').value = '';

    const modal = document.getElementById('debt-payment-modal');
    if (modal) modal.classList.add('active');
}

function closeDebtPaymentModal() {
    const modal = document.getElementById('debt-payment-modal');
    if (modal) modal.classList.remove('active');
}

function submitDebtPaymentForm() {
    const debtId = document.getElementById('payment-debt-id').value;
    const walletId = document.getElementById('payment-debt-wallet-id').value;
    const amount = parseCurrencyInput(document.getElementById('payment-debt-amount').value);
    const note = document.getElementById('payment-debt-note').value.trim();

    if (amount <= 0) {
        showToast('Mohon masukkan nominal yang valid!');
        return;
    }

    const success = addDebtPayment(debtId, { amount, walletId, note });
    if (success) {
        showToast('Pembayaran cicilan hutang berhasil dicatat! 🎉');
        closeDebtPaymentModal();
        renderDebtView();
        if (typeof renderDashboard === 'function') renderDashboard();
    } else {
        showToast('Gagal memproses pembayaran cicilan.');
    }
}

function openDebtDetailModal(debtId) {
    const debt = (state.debts || []).find(d => d.id === debtId);
    if (!debt) return;

    currentSelectedDebtId = debtId;
    const summaryContainer = document.getElementById('detail-debt-summary-container');
    const historyList = document.getElementById('detail-debt-history-list');

    const totalAmt = Number(debt.totalAmount) || 0;
    const paidAmt = Number(debt.paidAmount) || 0;
    const remainingAmt = Math.max(0, totalAmt - paidAmt);
    const pct = totalAmt > 0 ? Math.min(100, Math.round((paidAmt / totalAmt) * 100)) : 0;

    summaryContainer.innerHTML = `
        <div style="background: var(--bg); padding: 14px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 12px;">
            <h4 style="font-size: 1.1rem; color: var(--text-main); margin: 0 0 6px 0;">${escapeHtml(debt.name)}</h4>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Sisa Kewajiban</span>
                <strong style="font-size: 1.1rem; color: var(--purple);">${formatRp(remainingAmt)} / ${formatRp(totalAmt)}</strong>
            </div>
            <div class="savings-goal-progress-bar">
                <div class="savings-goal-progress-fill ${pct >= 100 ? 'completed' : ''}" style="width: ${pct}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
                <span>Terbayar: ${pct}%</span>
                <span>Jatuh Tempo: ${debt.dueDay ? 'Tanggal ' + debt.dueDay + ' tiap bulan' : '-'}</span>
            </div>
            ${debt.notes ? `<p style="font-size: 0.8rem; color: var(--text-main); margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); font-style: italic;">"${escapeHtml(debt.notes)}"</p>` : ''}
        </div>
    `;

    const history = debt.history || [];
    if (history.length === 0) {
        historyList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.82rem;">Belum ada riwayat pembayaran.</div>`;
    } else {
        historyList.innerHTML = history.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--card); border-radius: 8px; margin-bottom: 6px; border-left: 4px solid var(--purple);">
                <div>
                    <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">💳 Pembayaran Cicilan</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">${formatDateIndo(item.date)} ${item.note ? '• ' + escapeHtml(item.note) : ''}</span>
                </div>
                <span style="font-size: 0.9rem; font-weight: 700; color: var(--purple);">${formatRp(item.amount)}</span>
            </div>
        `).join('');
    }

    const modal = document.getElementById('debt-detail-modal');
    if (modal) modal.classList.add('active');
}

function closeDebtDetailModal() {
    const modal = document.getElementById('debt-detail-modal');
    if (modal) modal.classList.remove('active');
}

function handleEditDebtClick() {
    if (!currentSelectedDebtId) return;
    closeDebtDetailModal();
    openDebtModal(currentSelectedDebtId);
}

async function handleDeleteDebtClick() {
    if (!currentSelectedDebtId) return;
    const debt = (state.debts || []).find(d => d.id === currentSelectedDebtId);
    const debtName = debt ? debt.name : 'catatan hutang ini';
    const confirmed = await customConfirm(
        `Apakah Anda yakin ingin menghapus catatan hutang "${debtName}"? Tindakan ini tidak dapat dibatalkan.`,
        '🗑️ Hapus Catatan Hutang'
    );
    if (confirmed) {
        deleteDebt(currentSelectedDebtId);
        showToast('Catatan hutang berhasil dihapus.');
        closeDebtDetailModal();
        renderDebtView();
    }
}

// Modal Handlers for Receivables
function openReceivableModal(receivableId = null) {
    const modal = document.getElementById('receivable-modal');
    const titleEl = document.getElementById('receivable-modal-title');
    const idInput = document.getElementById('receivable-id');
    const nameInput = document.getElementById('receivable-name');
    const debtorInput = document.getElementById('receivable-debtor-name');
    const totalInput = document.getElementById('receivable-total-amount');
    const dateInput = document.getElementById('receivable-due-date');
    const walletSelect = document.getElementById('receivable-wallet-id');
    const notesInput = document.getElementById('receivable-notes');

    if (!modal) return;

    if (walletSelect) {
        walletSelect.innerHTML = `<option value="">-- Tanpa Potong Kas (Pencatatan Saja) --</option>` +
            (state.wallets || []).map(w => `<option value="${w.id}">${w.name} (Saldo: ${formatRp(w.balance)})</option>`).join('');
    }

    if (receivableId && state.receivables) {
        const rec = state.receivables.find(r => r.id === receivableId);
        if (rec) {
            titleEl.textContent = '✏️ Edit Catatan Piutang';
            idInput.value = rec.id;
            nameInput.value = rec.name || '';
            debtorInput.value = rec.debtorName || '';
            totalInput.value = formatRp(rec.totalAmount).replace('Rp ', '');
            dateInput.value = rec.dueDate || '';
            notesInput.value = rec.notes || '';
        }
    } else {
        titleEl.textContent = '🤝 Tambah Catatan Piutang Baru';
        idInput.value = '';
        document.getElementById('receivable-form').reset();
    }

    modal.classList.add('active');
}

function closeReceivableModal() {
    const modal = document.getElementById('receivable-modal');
    if (modal) modal.classList.remove('active');
}

function saveReceivableFromForm() {
    const id = document.getElementById('receivable-id').value;
    const name = document.getElementById('receivable-name').value.trim();
    const debtorName = document.getElementById('receivable-debtor-name').value.trim();
    const totalAmount = parseCurrencyInput(document.getElementById('receivable-total-amount').value);
    const dueDate = document.getElementById('receivable-due-date').value;
    const walletId = document.getElementById('receivable-wallet-id').value;
    const notes = document.getElementById('receivable-notes').value.trim();

    if (!name || totalAmount <= 0) {
        showToast('Mohon isi nama piutang dan nominal yang valid!');
        return;
    }

    if (id) {
        updateReceivable(id, {
            name,
            debtorName,
            totalAmount,
            dueDate,
            notes
        });
        showToast('Catatan piutang berhasil diperbarui! ✨');
    } else {
        addReceivable({
            name,
            debtorName,
            totalAmount,
            dueDate,
            walletId,
            notes
        });
        showToast('Catatan piutang baru berhasil disimpan! 🤝');
    }

    closeReceivableModal();
    renderReceivablesView();
    if (typeof renderDashboard === 'function') renderDashboard();
}

function openReceivablePaymentModal(receivableId) {
    const rec = (state.receivables || []).find(r => r.id === receivableId);
    if (!rec) return;

    document.getElementById('payment-receivable-id').value = rec.id;
    document.getElementById('payment-receivable-name').textContent = rec.name;
    const remaining = Math.max(0, rec.totalAmount - rec.receivedAmount);
    document.getElementById('payment-receivable-progress-text').textContent = `Sisa tagihan: ${formatRp(remaining)} dari total ${formatRp(rec.totalAmount)}`;

    const walletSelect = document.getElementById('payment-receivable-wallet-id');
    if (walletSelect) {
        walletSelect.innerHTML = (state.wallets || []).map(w => `<option value="${w.id}">${w.name} (Saldo: ${formatRp(w.balance)})</option>`).join('');
    }

    document.getElementById('payment-receivable-amount').value = '';
    document.getElementById('payment-receivable-note').value = '';

    const modal = document.getElementById('receivable-payment-modal');
    if (modal) modal.classList.add('active');
}

function closeReceivablePaymentModal() {
    const modal = document.getElementById('receivable-payment-modal');
    if (modal) modal.classList.remove('active');
}

function submitReceivablePaymentForm() {
    const receivableId = document.getElementById('payment-receivable-id').value;
    const walletId = document.getElementById('payment-receivable-wallet-id').value;
    const amount = parseCurrencyInput(document.getElementById('payment-receivable-amount').value);
    const note = document.getElementById('payment-receivable-note').value.trim();

    if (amount <= 0) {
        showToast('Mohon masukkan nominal yang valid!');
        return;
    }

    const success = addReceivablePayment(receivableId, { amount, walletId, note });
    if (success) {
        showToast('Penerimaan pelunasan piutang berhasil dicatat! 🎉');
        closeReceivablePaymentModal();
        renderReceivablesView();
        if (typeof renderDashboard === 'function') renderDashboard();
    } else {
        showToast('Gagal memproses penerimaan pelunasan.');
    }
}

function openReceivableDetailModal(receivableId) {
    const rec = (state.receivables || []).find(r => r.id === receivableId);
    if (!rec) return;

    currentSelectedReceivableId = receivableId;
    const summaryContainer = document.getElementById('detail-receivable-summary-container');
    const historyList = document.getElementById('detail-receivable-history-list');

    const totalAmt = Number(rec.totalAmount) || 0;
    const receivedAmt = Number(rec.receivedAmount) || 0;
    const remainingAmt = Math.max(0, totalAmt - receivedAmt);
    const pct = totalAmt > 0 ? Math.min(100, Math.round((receivedAmt / totalAmt) * 100)) : 0;

    summaryContainer.innerHTML = `
        <div style="background: var(--bg); padding: 14px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 12px;">
            <h4 style="font-size: 1.1rem; color: var(--text-main); margin: 0 0 4px 0;">${escapeHtml(rec.name)}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 8px;">Peminjam: <strong>${escapeHtml(rec.debtorName || '-')}</strong></span>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Sisa Tagihan</span>
                <strong style="font-size: 1.1rem; color: var(--success);">${formatRp(remainingAmt)} / ${formatRp(totalAmt)}</strong>
            </div>
            <div class="savings-goal-progress-bar">
                <div class="savings-goal-progress-fill ${pct >= 100 ? 'completed' : ''}" style="width: ${pct}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-top: 6px;">
                <span>Diterima: ${pct}%</span>
                <span>Janji Bayar: ${rec.dueDate ? formatDateIndo(rec.dueDate) : '-'}</span>
            </div>
            ${rec.notes ? `<p style="font-size: 0.8rem; color: var(--text-main); margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border); font-style: italic;">"${escapeHtml(rec.notes)}"</p>` : ''}
        </div>
    `;

    const history = rec.history || [];
    if (history.length === 0) {
        historyList.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.82rem;">Belum ada riwayat penerimaan pelunasan.</div>`;
    } else {
        historyList.innerHTML = history.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--card); border-radius: 8px; margin-bottom: 6px; border-left: 4px solid var(--success);">
                <div>
                    <strong style="font-size: 0.85rem; color: var(--text-main); display: block;">💰 Pelunasan Diterima</strong>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">${formatDateIndo(item.date)} ${item.note ? '• ' + escapeHtml(item.note) : ''}</span>
                </div>
                <span style="font-size: 0.9rem; font-weight: 700; color: var(--success);">${formatRp(item.amount)}</span>
            </div>
        `).join('');
    }

    const modal = document.getElementById('receivable-detail-modal');
    if (modal) modal.classList.add('active');
}

function closeReceivableDetailModal() {
    const modal = document.getElementById('receivable-detail-modal');
    if (modal) modal.classList.remove('active');
}

function handleEditReceivableClick() {
    if (!currentSelectedReceivableId) return;
    closeReceivableDetailModal();
    openReceivableModal(currentSelectedReceivableId);
}

async function handleDeleteReceivableClick() {
    if (!currentSelectedReceivableId) return;
    const rec = (state.receivables || []).find(r => r.id === currentSelectedReceivableId);
    const recName = rec ? rec.name : 'catatan piutang ini';
    const confirmed = await customConfirm(
        `Apakah Anda yakin ingin menghapus catatan piutang "${recName}"? Tindakan ini tidak dapat dibatalkan.`,
        '🗑️ Hapus Catatan Piutang'
    );
    if (confirmed) {
        deleteReceivable(currentSelectedReceivableId);
        showToast('Catatan piutang berhasil dihapus.');
        closeReceivableDetailModal();
        renderReceivablesView();
    }
}

// Expose debt & receivable functions
window.renderDebtView = renderDebtView;
window.renderReceivablesView = renderReceivablesView;
window.openDebtModal = openDebtModal;
window.closeDebtModal = closeDebtModal;
window.saveDebtFromForm = saveDebtFromForm;
window.openDebtPaymentModal = openDebtPaymentModal;
window.closeDebtPaymentModal = closeDebtPaymentModal;
window.submitDebtPaymentForm = submitDebtPaymentForm;
window.openDebtDetailModal = openDebtDetailModal;
window.closeDebtDetailModal = closeDebtDetailModal;
window.handleEditDebtClick = handleEditDebtClick;
window.handleDeleteDebtClick = handleDeleteDebtClick;
window.openReceivableModal = openReceivableModal;
window.closeReceivableModal = closeReceivableModal;
window.saveReceivableFromForm = saveReceivableFromForm;
window.openReceivablePaymentModal = openReceivablePaymentModal;
window.closeReceivablePaymentModal = closeReceivablePaymentModal;
window.submitReceivablePaymentForm = submitReceivablePaymentForm;
window.openReceivableDetailModal = openReceivableDetailModal;
window.closeReceivableDetailModal = closeReceivableDetailModal;
window.handleEditReceivableClick = handleEditReceivableClick;
window.handleDeleteReceivableClick = handleDeleteReceivableClick;

// --- SWIPE DOWN TO CLOSE MODAL GESTURE HANDLER (ULTRA-FLUID PHYSICS) ---
const initializedSwipeModals = new Set();

function setupSwipeDownToClose(modalId, closeFn) {
    const modal = document.getElementById(modalId);
    if (!modal || initializedSwipeModals.has(modalId)) return;
    const modalBox = modal.querySelector('.modal-box');
    if (!modalBox) return;

    initializedSwipeModals.add(modalId);

    let startY = 0;
    let currentY = 0;
    let startTime = 0;
    let isDragging = false;

    const handleStart = (clientY, e) => {
        if (modalBox.scrollTop > 5) return;
        startY = clientY;
        currentY = clientY;
        startTime = Date.now();
        isDragging = true;
        modalBox.style.transition = 'none';
        modal.style.transition = 'none';
    };

    const handleMove = (clientY, e) => {
        if (!isDragging) return;
        currentY = clientY;
        const deltaY = currentY - startY;

        if (deltaY > 0) {
            if (e && e.cancelable) e.preventDefault();
            modalBox.style.transform = `translate3d(0, ${deltaY}px, 0)`;
            const backdropOpacity = Math.max(0, 0.5 * (1 - deltaY / 350));
            modal.style.backgroundColor = `rgba(0, 0, 0, ${backdropOpacity})`;
        }
    };

    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const deltaY = currentY - startY;
        const elapsedTime = Math.max(1, Date.now() - startTime);
        const velocity = deltaY / elapsedTime;

        if (deltaY > 70 || (deltaY > 20 && velocity > 0.35)) {
            // Smooth dismiss animation down
            modalBox.style.transition = 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
            modal.style.transition = 'opacity 0.28s linear, background-color 0.28s linear';
            modalBox.style.transform = 'translate3d(0, 100%, 0)';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            modal.style.opacity = '0';

            setTimeout(() => {
                closeFn();
                modalBox.style.transform = '';
                modalBox.style.transition = '';
                modal.style.backgroundColor = '';
                modal.style.opacity = '';
            }, 260);
        } else {
            // Spring bounce back to top
            modalBox.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15)';
            modal.style.transition = 'background-color 0.25s ease';
            modalBox.style.transform = 'translate3d(0, 0, 0)';
            modal.style.backgroundColor = '';
        }
    };

    // Touch events for mobile
    modalBox.addEventListener('touchstart', (e) => {
        handleStart(e.touches[0].clientY, e);
    }, { passive: false });

    modalBox.addEventListener('touchmove', (e) => {
        handleMove(e.touches[0].clientY, e);
    }, { passive: false });

    modalBox.addEventListener('touchend', handleEnd);
    modalBox.addEventListener('touchcancel', handleEnd);

    // Mouse drag support for desktop testing
    const swipeHandle = modalBox.querySelector('.sheet-swipe-handle') || modalBox;
    swipeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        handleStart(e.clientY, e);

        const onMouseMove = (me) => handleMove(me.clientY, me);
        const onMouseUp = () => {
            handleEnd();
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    // Close on overlay backdrop click outside modal box
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFn();
        }
    });
}

// Transaction Modal Handlers
function openTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (!modal) return;
    updateCategoryOptions();
    const dateInput = document.getElementById('trans-date');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    const modalBox = modal.querySelector('.modal-box');
    if (modalBox) {
        modalBox.style.transform = '';
        modalBox.style.transition = '';
    }
    modal.style.opacity = '';
    modal.style.backgroundColor = '';

    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
    setupSwipeDownToClose('transaction-modal', closeTransactionModal);
}

function closeTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        modal.classList.remove('active');
        const modalBox = modal.querySelector('.modal-box');
        if (modalBox) {
            modalBox.style.transform = '';
            modalBox.style.transition = '';
        }
    }
}

window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.setupSwipeDownToClose = setupSwipeDownToClose;

