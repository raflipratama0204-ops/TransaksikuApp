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
            modalBox.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.15)';
            modal.style.transition = 'background-color 0.25s ease';
            modalBox.style.transform = 'translate3d(0, 0, 0)';
            modal.style.backgroundColor = '';
        }
    };

    modalBox.addEventListener('touchstart', (e) => {
        handleStart(e.touches[0].clientY, e);
    }, { passive: false });

    modalBox.addEventListener('touchmove', (e) => {
        handleMove(e.touches[0].clientY, e);
    }, { passive: false });

    modalBox.addEventListener('touchend', handleEnd);
    modalBox.addEventListener('touchcancel', handleEnd);

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
    if (typeof updateCategoryOptions === 'function') updateCategoryOptions();
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
    if (typeof updateCategoryOptions === 'function') updateCategoryOptions();
    if (typeof checkDebtReminders === 'function') checkDebtReminders();
    if (typeof checkBudgetAlerts === 'function') checkBudgetAlerts({ type: mainType, category, amount });
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
        if (typeof updateTransferWalletOptions === 'function') updateTransferWalletOptions(category, 'edit-');
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
    if (typeof checkDebtReminders === 'function') checkDebtReminders();
}

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
    if (typeof updateCategoryOptions === 'function') updateCategoryOptions();
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
    if (typeof updateCategoryOptions === 'function') updateCategoryOptions();
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
        if (typeof updateCategoryOptions === 'function') updateCategoryOptions();
        if (typeof renderBudgetView === 'function') renderBudgetView();
        showToast('Kategori kustom dihapus.');
    }
}

window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.setupSwipeDownToClose = setupSwipeDownToClose;
