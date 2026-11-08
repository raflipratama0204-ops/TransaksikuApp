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
            <option value="Penarikan Investasi">📥 Penarikan Investasi (Withdraw ke Kas/Bank)</option>
        `;
    }

    const customOptions = state.customCategories
        .filter(cat => cat.type === mainType)
        .map(cat => `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`)
        .join('');
    categorySelect.innerHTML += customOptions;

    if (typeof toggleTransferFields === 'function') toggleTransferFields();
}

// --- RENDERING WALLETS & BALANCE SUMMARIES ---
function updateSummaries() {
    let totalCash = 0; 
    let totalInvest = 0;
    
    (state.wallets || []).forEach(w => {
        if (w.type === 'invest' || w.type === 'savings') totalInvest += (Number(w.balance) || 0);
        else totalCash += (Number(w.balance) || 0);
    });

    const totalSavingsGoals = (state.savingsGoals || []).reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
    const centralWallet = (state.wallets || []).find(w => w.id === 999001 || w.name === '🐷 Tabungan Impian');
    const centralBalance = centralWallet ? (Number(centralWallet.balance) || 0) : 0;
    // Hindari duplikasi perhitungan jika saldo target sudah ada di dalam dompet investasi '🐷 Tabungan Impian'
    const unlinkedSavings = Math.max(0, totalSavingsGoals - centralBalance);
    const totalSavingsAndInvest = totalInvest + unlinkedSavings;

    const sumTotalEl = document.getElementById('sum-total');
    const sumCashEl = document.getElementById('sum-cash');
    const sumPortfolioEl = document.getElementById('sum-portfolio');

    if (sumTotalEl) sumTotalEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash + totalSavingsAndInvest);
    if (sumCashEl) sumCashEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash);
    if (sumPortfolioEl) sumPortfolioEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalSavingsAndInvest);
}

function moveWallet(id, direction) {
    if (!Array.isArray(state.wallets)) return;
    const index = state.wallets.findIndex(w => w.id === id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.wallets.length) return;

    const [moved] = state.wallets.splice(index, 1);
    state.wallets.splice(newIndex, 0, moved);

    state.wallets.forEach((w, idx) => {
        w.order = idx;
        w.updatedAt = Date.now();
    });

    saveData();
    renderWallets();
}

function initWalletDragAndDrop() {
    const list = document.getElementById('wallet-list');
    if (!list) return;

    const items = Array.from(list.querySelectorAll('.wallet-item'));
    items.forEach(item => {
        // Pointerdown pada kartu maupun gagang (bebas bayangan, 100% solid lifted card)
        item.addEventListener('pointerdown', (e) => {
            // Abaikan klik kanan atau klik pada tombol aksi, opsi, dropdown
            if (e.button !== 0 && e.pointerType === 'mouse') return;
            if (e.target.closest('button, .wallet-dropdown, a, input, select')) return;

            // Di layar sentuh (HP), hanya aktifkan jika menyentuh gagang agar scroll halaman tetap nyaman
            if (e.pointerType === 'touch' && !e.target.closest('.wallet-drag-handle')) return;

            const walletId = Number(item.getAttribute('data-wallet-id'));
            if (!walletId) return;

            const rect = item.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            const shiftX = startX - rect.left;
            const shiftY = startY - rect.top;

            let isDragging = false;
            let floatingCard = null;
            let currentTarget = null;
            let insertAfter = false;

            try {
                item.setPointerCapture(e.pointerId);
            } catch (err) {}

            const onPointerMove = (moveEvt) => {
                const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
                if (!isDragging && dist < 4) return;

                if (!isDragging) {
                    isDragging = true;
                    if (navigator.vibrate) navigator.vibrate(20);

                    // Buat kartu nyata yang melayang 100% SOLID (bukan bayangan tipis browser)
                    floatingCard = item.cloneNode(true);
                    floatingCard.classList.remove('wallet-placeholder');
                    floatingCard.classList.add('wallet-pointer-floating-card');
                    floatingCard.style.width = `${rect.width}px`;
                    floatingCard.style.height = `${rect.height}px`;
                    floatingCard.style.left = `${moveEvt.clientX - shiftX}px`;
                    floatingCard.style.top = `${moveEvt.clientY - shiftY}px`;
                    document.body.appendChild(floatingCard);

                    // Slot posisi asal menjadi placeholder
                    item.classList.add('wallet-placeholder');
                }

                // Gerakkan kartu melayang solid mengikuti pergerakan kursor/jari secara presisi
                floatingCard.style.left = `${moveEvt.clientX - shiftX}px`;
                floatingCard.style.top = `${moveEvt.clientY - shiftY}px`;

                // Deteksi item target di bawah kursor
                const elem = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY);
                const overItem = elem ? elem.closest('.wallet-item') : null;

                items.forEach(it => {
                    if (it !== overItem) it.classList.remove('drag-over-top', 'drag-over-bottom');
                });

                if (overItem && overItem !== item) {
                    currentTarget = overItem;
                    const targetRect = overItem.getBoundingClientRect();
                    insertAfter = (moveEvt.clientY - targetRect.top) > (targetRect.height / 2);
                    overItem.classList.toggle('drag-over-top', !insertAfter);
                    overItem.classList.toggle('drag-over-bottom', insertAfter);
                } else {
                    currentTarget = null;
                }
            };

            const onPointerUp = (upEvt) => {
                item.removeEventListener('pointermove', onPointerMove);
                item.removeEventListener('pointerup', onPointerUp);
                item.removeEventListener('pointercancel', onPointerUp);

                try {
                    item.releasePointerCapture(e.pointerId);
                } catch (err) {}

                if (floatingCard) {
                    floatingCard.remove();
                    floatingCard = null;
                }

                items.forEach(it => it.classList.remove('drag-over-top', 'drag-over-bottom', 'wallet-placeholder'));

                if (isDragging && currentTarget && currentTarget !== item) {
                    const fromId = walletId;
                    const toId = Number(currentTarget.getAttribute('data-wallet-id'));

                    const fromIndex = state.wallets.findIndex(w => w.id === fromId);
                    const toIndex = state.wallets.findIndex(w => w.id === toId);

                    if (fromIndex !== -1 && toIndex !== -1) {
                        const [moved] = state.wallets.splice(fromIndex, 1);
                        let targetIndex = state.wallets.findIndex(w => w.id === toId);
                        if (insertAfter) targetIndex++;
                        state.wallets.splice(targetIndex, 0, moved);

                        state.wallets.forEach((w, idx) => {
                            w.order = idx;
                            w.updatedAt = Date.now();
                        });

                        saveData();
                        renderWallets();
                    }
                }
            };

            item.addEventListener('pointermove', onPointerMove);
            item.addEventListener('pointerup', onPointerUp);
            item.addEventListener('pointercancel', onPointerUp);
        });
    });
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

    // Pertahankan urutan yang disimpan jika properti order ada
    if (Array.isArray(state.wallets)) {
        state.wallets.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return 0;
        });
    }

    state.wallets.forEach((w, index) => {
        const typeClass = w.type === 'invest' ? 'invest-type' : 'cash-type';
        const typeLabel = w.type === 'invest' ? 'Investasi' : 'Kas & Bank';
        const displayBalance = state.hideBalancesActive ? 'Rp ••••••' : formatRp(w.balance);

        list.innerHTML += `
            <div class="wallet-item ${typeClass}" data-wallet-id="${w.id}">
                <div class="wallet-drag-handle" title="Tahan & geser untuk memindahkan posisi dompet">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="5" r="1.5"></circle>
                        <circle cx="9" cy="12" r="1.5"></circle>
                        <circle cx="9" cy="19" r="1.5"></circle>
                        <circle cx="15" cy="5" r="1.5"></circle>
                        <circle cx="15" cy="12" r="1.5"></circle>
                        <circle cx="15" cy="19" r="1.5"></circle>
                    </svg>
                </div>
                <div class="w-info" style="flex: 1; min-width: 0;">
                    <h4 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${w.name}</h4>
                    <p>${typeLabel}</p>
                </div>
                <div class="w-balance">
                    <span class="w-balance-val">${displayBalance}</span>
                    <div class="wallet-menu-container">
                        <button onclick="toggleWalletMenu(${w.id})" class="btn-option">Opsi ▼</button>
                        <div id="w-menu-${w.id}" class="wallet-dropdown" style="display:none;">
                            ${index > 0 ? `<button onclick="moveWallet(${w.id}, -1); toggleWalletMenu(${w.id})">⬆️ Naikkan Urutan</button>` : ''}
                            ${index < state.wallets.length - 1 ? `<button onclick="moveWallet(${w.id}, 1); toggleWalletMenu(${w.id})">⬇️ Turunkan Urutan</button>` : ''}
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

    initWalletDragAndDrop();

    updateSummaries();
    const transMainTypeEl = document.getElementById('trans-main-type');
    if (transMainTypeEl && transMainTypeEl.value === 'transfer' && typeof toggleTransferFields === 'function') {
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
    const maxOrder = state.wallets.reduce((max, w) => Math.max(max, w.order !== undefined ? w.order : -1), -1);
    state.wallets.push({ id: newId, name: name, balance: initialBalance, type: type, order: maxOrder + 1 });

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

    let isConfirmed = await customConfirm(`Apakah Anda yakin ingin menghapus akun '${w.name}'?`, 'Konfirmasi Hapus');
    if (isConfirmed) {
        state.wallets = state.wallets.filter(wallet => wallet.id !== id);

        // Catat ID dompet yang dihapus agar tidak dibangkitkan lagi oleh sinkronisasi cloud
        const deletedWalletIds = JSON.parse(localStorage.getItem('transaksiku_deleted_wallet_ids') || '[]');
        if (!deletedWalletIds.includes(id)) {
            deletedWalletIds.push(id);
            localStorage.setItem('transaksiku_deleted_wallet_ids', JSON.stringify(deletedWalletIds));
        }

        saveData();
        renderWallets();
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
    if (typeof applyFilter === 'function') applyFilter();
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

    if (tabId === 'settings-tab-categories' && typeof renderSettingsCustomCategories === 'function') {
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

        const filteredTrans = typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : [];
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

        if (typeof renderComparisonChart === 'function') {
            renderComparisonChart(totalIncome + currentPeriodDebtTaken, totalExpense);
        }
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

    const cashflowView = document.getElementById('view-cashflow');
    const debtView = document.getElementById('view-debt');
    if ((cashflowView && cashflowView.style.display === 'block') || (debtView && debtView.style.display === 'block')) {
        if (typeof applyFilter === 'function') applyFilter();
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

window.getCategoryOutstanding = getCategoryOutstanding;
window.checkDebtReminders = checkDebtReminders;
window.checkDailyReminder = checkDailyReminder;
