// Shared State Object
const state = {
    wallets: JSON.parse(localStorage.getItem('keuangan_wallets28')) || [
        { id: 1, name: 'Dompet Tunai', balance: 0, type: 'cash' },
        { id: 2, name: 'Rekening Bank', balance: 0, type: 'cash' },
        { id: 3, name: 'Portofolio Saham', balance: 0, type: 'invest' }
    ],
    transactions: JSON.parse(localStorage.getItem('keuangan_transactions28')) || [],
    customCategories: JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [],
    savingsGoals: JSON.parse(localStorage.getItem('transaksiku_savings_goals')) || [],
    debts: JSON.parse(localStorage.getItem('transaksiku_debts')) || [],
    receivables: JSON.parse(localStorage.getItem('transaksiku_receivables')) || [],
    budgetSettings: JSON.parse(localStorage.getItem('transaksiku_budget_settings')) || {
        activeMode: 'envelope',
        monthlyTotal: 3600000,
        period: 'monthly',
        categoryBudgets: {
            "Makanan & Minuman": 1200000,
            "Belanja Kebutuhan": 600000,
            "Belanja Keinginan": 400000,
            "Transportasi": 400000,
            "Tagihan & Utilitas": 650000,
            "Hiburan": 350000
        },
        rolloverEnabled: true,
        rolloverBalance: 0,
        lastRolloverMonth: null,
        notificationsEnabled: true
    },
    hideBalancesActive: localStorage.getItem('transaksiku_hide_balances') === 'true',
    myChart: null,
    myComparisonChart: null,
    receivablesChart: null
};

// Kantong Tabungan Impian hanya dipastikan ada jika terdapat target tabungan aktif dengan saldo tersimpan
const totalSavingsInGoals = (state.savingsGoals || []).reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
if (totalSavingsInGoals > 0) {
    const centralWallet = getOrCreateCentralSavingsWallet();
    if (centralWallet.balance === 0) {
        centralWallet.balance = totalSavingsInGoals;
    }
} else if (!state.savingsGoals || state.savingsGoals.length === 0) {
    // Jika tidak ada target tabungan sama sekali dan kantong impian bersaldo 0, bersihkan agar tidak muncul kembali
    state.wallets = (state.wallets || []).filter(w => !((w.id === 999001 || w.name === '🐷 Tabungan Impian') && w.balance === 0));
}

if (state.budgetSettings && state.budgetSettings.activeMode === '50_30_20') {
    state.budgetSettings.activeMode = 'envelope';
}

if (Array.isArray(state.transactions)) {
    state.transactions.forEach(t => {
        if (!t.mainType && t.type) {
            t.mainType = t.type;
        }
        if (!t.desc && t.note) {
            t.desc = t.note;
        }
        if (!t.walletName && t.walletId) {
            const w = state.wallets.find(wal => wal.id == t.walletId);
            if (w) t.walletName = w.name;
        }
        if (!t.date && t.timestamp) {
            const d = new Date(t.timestamp);
            t.date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        // Normalize category names
        if (t.category === 'Makanan') t.category = 'Makanan & Minuman';
        if (t.category === 'Tagihan') t.category = 'Tagihan & Utilitas';
        if (t.category === 'Belanja') t.category = 'Belanja Kebutuhan';
    });
}

if (state.budgetSettings) {
    if (!state.budgetSettings.needsCategories) state.budgetSettings.needsCategories = [];
    if (!state.budgetSettings.needsCategories.includes("Makanan & Minuman")) {
        state.budgetSettings.needsCategories.push("Makanan & Minuman");
    }
    if (!state.budgetSettings.needsCategories.includes("Belanja Kebutuhan")) {
        state.budgetSettings.needsCategories.push("Belanja Kebutuhan");
    }
    if (!state.budgetSettings.needsCategories.includes("Tagihan & Utilitas")) {
        state.budgetSettings.needsCategories.push("Tagihan & Utilitas");
    }
    if (!state.budgetSettings.wantsCategories) state.budgetSettings.wantsCategories = [];
    if (!state.budgetSettings.wantsCategories.includes("Belanja Keinginan")) {
        state.budgetSettings.wantsCategories.push("Belanja Keinginan");
    }
}

// UI Redraw Callback
let onDataChangedCallback = null;

function registerDataChangedCallback(callback) {
    onDataChangedCallback = callback;
}

function notifyDataChanged() {
    if (onDataChangedCallback) {
        onDataChangedCallback();
    }
}

// Menangani sinkronisasi lokal ke cloud
function triggerCloudSync() {
    if (localStorage.getItem('transaksiku_user_logged_in') === 'true') {
        syncLocalToCloud().catch(err => console.error('Cloud sync failed:', err));
    }
}

// Menyimpan data lokal ke localStorage
function saveData() {
    const now = Date.now();
    const storedWallets = JSON.parse(localStorage.getItem('keuangan_wallets28') || '[]');
    state.wallets.forEach(w => {
        const stored = storedWallets.find(sw => sw.id === w.id);
        if (!stored || stored.balance !== w.balance || stored.name !== w.name) {
            w.updatedAt = now;
        } else {
            w.updatedAt = stored.updatedAt || w.id;
        }
    });

    localStorage.setItem('keuangan_wallets28', JSON.stringify(state.wallets));
    localStorage.setItem('keuangan_transactions28', JSON.stringify(state.transactions));
    localStorage.setItem('transaksiku_custom_categories', JSON.stringify(state.customCategories));
    localStorage.setItem('transaksiku_savings_goals', JSON.stringify(state.savingsGoals || []));
    localStorage.setItem('transaksiku_debts', JSON.stringify(state.debts || []));
    localStorage.setItem('transaksiku_receivables', JSON.stringify(state.receivables || []));
    localStorage.setItem('transaksiku_budget_settings', JSON.stringify(state.budgetSettings));
    notifyDataChanged();
    triggerCloudSync();
}

// Fungsi penggabung data lokal dan awan secara cerdas (offline-first)
function mergeLocalAndCloud(localData, cloudData) {
    const localWallets = localData.wallets || [];
    const localTransactions = localData.transactions || [];
    const localCategories = localData.customCategories || [];

    const cloudWallets = cloudData.wallets || [];
    const cloudTransactions = cloudData.transactions || [];
    const cloudCategories = cloudData.custom_categories || cloudData.customCategories || [];

    // 1. Gabungkan Kategori Kustom
    const deletedCategories = new Set(JSON.parse(localStorage.getItem('transaksiku_deleted_categories') || '[]'));
    const mergedCategoriesMap = new Map();
    cloudCategories.forEach(c => {
        const key = `${c.name.toLowerCase()}_${c.type}`;
        if (!deletedCategories.has(key)) {
            mergedCategoriesMap.set(key, c);
        }
    });
    localCategories.forEach(c => {
        const key = `${c.name.toLowerCase()}_${c.type}`;
        if (!deletedCategories.has(key)) {
            mergedCategoriesMap.set(key, c);
        }
    });
    const mergedCategories = Array.from(mergedCategoriesMap.values());

    // 2. Gabungkan Transaksi
    const deletedTxIds = new Set(JSON.parse(localStorage.getItem('transaksiku_deleted_tx_ids') || '[]'));
    const mergedTxMap = new Map();
    cloudTransactions.forEach(tx => {
        if (!deletedTxIds.has(tx.id)) {
            mergedTxMap.set(tx.id, tx);
        }
    });
    localTransactions.forEach(tx => {
        if (!deletedTxIds.has(tx.id)) {
            mergedTxMap.set(tx.id, tx);
        }
    });
    const mergedTransactions = Array.from(mergedTxMap.values());
    mergedTransactions.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // 3. Gabungkan Dompet
    const deletedWalletIds = new Set(JSON.parse(localStorage.getItem('transaksiku_deleted_wallet_ids') || '[]'));
    const mergedWalletsMap = new Map();
    cloudWallets.forEach(w => {
        if (!deletedWalletIds.has(w.id)) {
            mergedWalletsMap.set(w.id, w);
        }
    });
    localWallets.forEach(w => {
        if (!deletedWalletIds.has(w.id)) {
            const existing = mergedWalletsMap.get(w.id);
            if (!existing || (w.updatedAt || w.id) > (existing.updatedAt || existing.id)) {
                mergedWalletsMap.set(w.id, w);
            }
        }
    });
    const mergedWallets = Array.from(mergedWalletsMap.values());

    return {
        wallets: mergedWallets,
        transactions: mergedTransactions,
        customCategories: mergedCategories
    };
}

// Mengambil data dari cloud ke local storage
async function pullCloudData(userId) {
    showToast('Memuat data dari cloud...');
    try {
        const docRef = db.collection('user_sync').doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            const cloudData = doc.data();

            // Periksa apakah cloud mengalami reset baru dari perangkat lain
            const cloudReset = cloudData.last_reset;
            const localReset = localStorage.getItem('transaksiku_last_reset');
            if (cloudReset && cloudReset !== localReset) {
                localStorage.setItem('transaksiku_last_reset', cloudReset);

                localStorage.removeItem('keuangan_wallets28');
                localStorage.removeItem('keuangan_transactions28');
                localStorage.removeItem('transaksiku_custom_categories');
                localStorage.removeItem('transaksiku_hide_balances');
                localStorage.removeItem('transaksiku_deleted_tx_ids');
                localStorage.removeItem('transaksiku_deleted_wallet_ids');
                localStorage.removeItem('transaksiku_deleted_categories');

                state.wallets = [
                    { id: 1, name: 'Dompet Tunai', balance: 0, type: 'cash' },
                    { id: 2, name: 'Rekening Bank', balance: 0, type: 'cash' },
                    { id: 3, name: 'Portofolio Saham', balance: 0, type: 'invest' }
                ];
                state.transactions = [];
                state.customCategories = [];

                localStorage.setItem('keuangan_wallets28', JSON.stringify(state.wallets));
                localStorage.setItem('keuangan_transactions28', JSON.stringify(state.transactions));
                localStorage.setItem('transaksiku_custom_categories', JSON.stringify(state.customCategories));

                notifyDataChanged();
                await syncLocalToCloud(userId);
                showToast('Sinkronisasi data kosong (reset) dari perangkat lain selesai!');
                return;
            }

            const localData = {
                wallets: JSON.parse(localStorage.getItem('keuangan_wallets28') || '[]'),
                transactions: JSON.parse(localStorage.getItem('keuangan_transactions28') || '[]'),
                customCategories: JSON.parse(localStorage.getItem('transaksiku_custom_categories') || '[]')
            };

            const merged = mergeLocalAndCloud(localData, cloudData);

            state.wallets = merged.wallets;
            state.transactions = merged.transactions;
            state.customCategories = merged.customCategories;

            localStorage.setItem('keuangan_wallets28', JSON.stringify(state.wallets));
            localStorage.setItem('keuangan_transactions28', JSON.stringify(state.transactions));
            localStorage.setItem('transaksiku_custom_categories', JSON.stringify(state.customCategories));

            // Bersihkan daftar penghapusan karena data sudah digabung
            localStorage.removeItem('transaksiku_deleted_tx_ids');
            localStorage.removeItem('transaksiku_deleted_wallet_ids');
            localStorage.removeItem('transaksiku_deleted_categories');

            notifyDataChanged();

            // Perbarui cloud dengan hasil penggabungan
            await syncLocalToCloud(userId);
            showToast('Sinkronisasi selesai. Data berhasil digabungkan!');
        } else {
            showToast('Membuat backup cloud pertama kali...');
            await syncLocalToCloud(userId);
        }
    } catch (error) {
        console.error('Gagal mengambil data cloud:', error.message);
    }
}

// Mencadangkan data lokal ke cloud
async function syncLocalToCloud(userId) {
    if (!userId) {
        const user = auth.currentUser;
        if (!user) return;
        userId = user.uid;
    }

    const walletsData = JSON.parse(localStorage.getItem('keuangan_wallets28') || '[]');
    const transactionsData = JSON.parse(localStorage.getItem('keuangan_transactions28') || '[]');
    const categoriesData = JSON.parse(localStorage.getItem('transaksiku_custom_categories') || '[]');
    const lastReset = localStorage.getItem('transaksiku_last_reset') || '';

    try {
        await db.collection('user_sync').doc(userId).set({
            user_id: userId,
            wallets: walletsData,
            transactions: transactionsData,
            custom_categories: categoriesData,
            last_reset: lastReset,
            updated_at: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error('Gagal mencadangkan data:', error.message);
    }
}

// Berlangganan perubahan data cloud secara Realtime menggunakan Firestore Snapshot
let unsubscribeRealtime = null;

function areWalletsEqual(arrA, arrB) {
    if (!arrA || !arrB) return false;
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
        const a = arrA[i];
        const b = arrB[i];
        if (a.id !== b.id || a.name !== b.name || a.balance !== b.balance || a.type !== b.type) {
            return false;
        }
    }
    return true;
}

function areTransactionsEqual(arrA, arrB) {
    if (!arrA || !arrB) return false;
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
        const a = arrA[i];
        const b = arrB[i];
        if (a.id !== b.id || a.timestamp !== b.timestamp || a.desc !== b.desc || a.mainType !== b.mainType || a.category !== b.category || a.amount !== b.amount || a.walletId !== b.walletId) {
            return false;
        }
    }
    return true;
}

function areCategoriesEqual(arrA, arrB) {
    if (!arrA || !arrB) return false;
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
        const a = arrA[i];
        const b = arrB[i];
        if (a.name !== b.name || a.icon !== b.icon || a.type !== b.type) {
            return false;
        }
    }
    return true;
}

function subscribeToCloudChanges(userId) {
    if (unsubscribeRealtime) {
        console.log("[SYNC RESET DEBUG] Unsubscribing existing listener.");
        unsubscribeRealtime();
    }

    console.log("[SYNC RESET DEBUG] Subscribing to cloud changes for UID:", userId);
    unsubscribeRealtime = db.collection('user_sync').doc(userId).onSnapshot((doc) => {
        if (doc.exists) {
            const cloudData = doc.data();

            // Periksa apakah cloud mengalami reset baru dari perangkat lain
            const cloudReset = cloudData.last_reset;
            const localReset = localStorage.getItem('transaksiku_last_reset');
            console.log(`[SYNC RESET DEBUG] Snapshot received. cloudReset: "${cloudReset}", localReset: "${localReset}"`);

            if (cloudReset && cloudReset !== localReset) {
                console.log("[SYNC RESET DEBUG] Reset triggered on another device! Wiping local state...");
                localStorage.setItem('transaksiku_last_reset', cloudReset);

                localStorage.removeItem('keuangan_wallets28');
                localStorage.removeItem('keuangan_transactions28');
                localStorage.removeItem('transaksiku_custom_categories');
                localStorage.removeItem('transaksiku_hide_balances');
                localStorage.removeItem('transaksiku_deleted_tx_ids');
                localStorage.removeItem('transaksiku_deleted_wallet_ids');
                localStorage.removeItem('transaksiku_deleted_categories');

                state.wallets = [
                    { id: 1, name: 'Dompet Tunai', balance: 0, type: 'cash' },
                    { id: 2, name: 'Rekening Bank', balance: 0, type: 'cash' },
                    { id: 3, name: 'Portofolio Saham', balance: 0, type: 'invest' }
                ];
                state.transactions = [];
                state.customCategories = [];

                localStorage.setItem('keuangan_wallets28', JSON.stringify(state.wallets));
                localStorage.setItem('keuangan_transactions28', JSON.stringify(state.transactions));
                localStorage.setItem('transaksiku_custom_categories', JSON.stringify(state.customCategories));

                notifyDataChanged();
                console.log("[SYNC RESET DEBUG] Local state wiped successfully.");
                return; // Stop here, no merge or upload back!
            }

            const localData = {
                wallets: JSON.parse(localStorage.getItem('keuangan_wallets28') || '[]'),
                transactions: JSON.parse(localStorage.getItem('keuangan_transactions28') || '[]'),
                customCategories: JSON.parse(localStorage.getItem('transaksiku_custom_categories') || '[]')
            };

            const merged = mergeLocalAndCloud(localData, cloudData);

            const currentTransactions = JSON.parse(localStorage.getItem('keuangan_transactions28') || '[]');
            const currentWallets = JSON.parse(localStorage.getItem('keuangan_wallets28') || '[]');
            const currentCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories') || '[]');

            const hasChanges =
                !areTransactionsEqual(currentTransactions, merged.transactions) ||
                !areWalletsEqual(currentWallets, merged.wallets) ||
                !areCategoriesEqual(currentCategories, merged.customCategories);

            if (hasChanges) {
                console.log("[SYNC RESET DEBUG] Changes detected. Updating local storage.");
                localStorage.setItem('keuangan_wallets28', JSON.stringify(merged.wallets));
                localStorage.setItem('keuangan_transactions28', JSON.stringify(merged.transactions));
                localStorage.setItem('transaksiku_custom_categories', JSON.stringify(merged.customCategories));

                state.wallets = merged.wallets;
                state.transactions = merged.transactions;
                state.customCategories = merged.customCategories;

                // Bersihkan daftar penghapusan karena data sudah digabung
                localStorage.removeItem('transaksiku_deleted_tx_ids');
                localStorage.removeItem('transaksiku_deleted_wallet_ids');
                localStorage.removeItem('transaksiku_deleted_categories');

                notifyDataChanged();

                // Cek apakah data cloud tertinggal dibanding hasil penggabungan kita (misal karena offline changes)
                const cloudWallets = cloudData.wallets || [];
                const cloudTransactions = cloudData.transactions || [];
                const cloudCategories = cloudData.custom_categories || [];

                const needsUpload =
                    !areWalletsEqual(cloudWallets, merged.wallets) ||
                    !areTransactionsEqual(cloudTransactions, merged.transactions) ||
                    !areCategoriesEqual(cloudCategories, merged.customCategories);

                if (needsUpload) {
                    console.log("[SYNC RESET DEBUG] Cloud needs upload. Syncing local to cloud.");
                    syncLocalToCloud(userId).catch(err => console.error('Cloud sync from listener failed:', err));
                }
            }
        }
    }, (error) => {
        console.error('Realtime sync error:', error);
    });
}

function setUnsubscribeRealtime(val) {
    unsubscribeRealtime = val;
}

async function clearAllDataCloudAndLocal() {
    if (unsubscribeRealtime) {
        console.log("[SYNC RESET DEBUG] Unsubscribing existing listener.");
        unsubscribeRealtime();
        unsubscribeRealtime = null;
    }

    const resetTimestamp = new Date().toISOString();
    console.log("[SYNC RESET DEBUG] Initializing clearAllDataCloudAndLocal with timestamp:", resetTimestamp);

    localStorage.setItem('transaksiku_resetting', 'true');
    localStorage.setItem('transaksiku_last_reset', resetTimestamp);

    localStorage.removeItem('keuangan_wallets28');
    localStorage.removeItem('keuangan_transactions28');
    localStorage.removeItem('transaksiku_custom_categories');
    localStorage.removeItem('transaksiku_hide_balances');
    localStorage.removeItem('transaksiku_deleted_tx_ids');
    localStorage.removeItem('transaksiku_deleted_wallet_ids');
    localStorage.removeItem('transaksiku_deleted_categories');

    state.wallets = [
        { id: 1, name: 'Dompet Tunai', balance: 0, type: 'cash' },
        { id: 2, name: 'Rekening Bank', balance: 0, type: 'cash' },
        { id: 3, name: 'Portofolio Saham', balance: 0, type: 'invest' }
    ];
    state.transactions = [];
    state.customCategories = [];

    // Tulis langsung data default bersih ke localStorage agar state lokal sinkron
    localStorage.setItem('keuangan_wallets28', JSON.stringify(state.wallets));
    localStorage.setItem('keuangan_transactions28', JSON.stringify(state.transactions));
    localStorage.setItem('transaksiku_custom_categories', JSON.stringify(state.customCategories));

    notifyDataChanged();

    if (localStorage.getItem('transaksiku_user_logged_in') === 'true') {
        const user = auth.currentUser;
        if (user && db && typeof db.collection === 'function') {
            console.log("[SYNC RESET DEBUG] Writing empty/default state to cloud with last_reset:", resetTimestamp);
            // Tulis data default ke cloud (bukan array kosong agar tipe data setara dengan lokal) beserta last_reset
            await db.collection('user_sync').doc(user.uid).set({
                user_id: user.uid,
                wallets: state.wallets,
                transactions: [],
                custom_categories: [],
                last_reset: resetTimestamp,
                updated_at: resetTimestamp
            });

            // Tunggu hingga Firestore menyelesaikan proses sinkronisasi antrean ke server
            if (typeof db.waitForPendingWrites === 'function') {
                try {
                    console.log("[SYNC RESET DEBUG] Waiting for pending writes...");
                    await Promise.race([
                        db.waitForPendingWrites(),
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]);
                } catch (e) {
                    console.warn("Firestore pending writes timeout:", e);
                }
            }

            // Aktifkan kembali listener setelah data server bersih
            console.log("[SYNC RESET DEBUG] Resubscribing to cloud listener.");
            subscribeToCloudChanges(user.uid);
        }
    }

    localStorage.removeItem('transaksiku_resetting');
    console.log("[SYNC RESET DEBUG] clearAllDataCloudAndLocal completed.");
}

window.clearAllDataCloudAndLocal = clearAllDataCloudAndLocal;

// --- SAVINGS GOALS (TARGET TABUNGAN & IMPIAN) FUNCTIONS ---
function addSavingsGoal(goalData) {
    if (!state.savingsGoals) state.savingsGoals = [];
    const centralWallet = getOrCreateCentralSavingsWallet();
    const newGoal = {
        id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: goalData.name || 'Target Tanpa Nama',
        targetAmount: Number(goalData.targetAmount) || 0,
        currentAmount: Number(goalData.currentAmount) || 0,
        targetDate: goalData.targetDate || '',
        categoryIcon: goalData.categoryIcon || '🎯',
        notes: goalData.notes || '',
        history: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    if (newGoal.currentAmount > 0) {
        centralWallet.balance = (Number(centralWallet.balance) || 0) + newGoal.currentAmount;
        newGoal.history.push({
            id: 'gh_' + Date.now(),
            type: 'deposit',
            amount: newGoal.currentAmount,
            date: new Date().toISOString().split('T')[0],
            note: 'Saldo awal target'
        });
    }
    state.savingsGoals.push(newGoal);
    saveData();
    return newGoal;
}

function updateSavingsGoal(id, updatedFields) {
    if (!state.savingsGoals) return null;
    const index = state.savingsGoals.findIndex(g => g.id === id);
    if (index !== -1) {
        state.savingsGoals[index] = {
            ...state.savingsGoals[index],
            ...updatedFields,
            updatedAt: Date.now()
        };
        saveData();
        return state.savingsGoals[index];
    }
    return null;
}

function deleteSavingsGoal(id) {
    if (!state.savingsGoals) return;
    state.savingsGoals = state.savingsGoals.filter(g => g.id !== id);
    // Jika semua target tabungan sudah dihapus dan kantong impian sudah kosong (saldo 0), bersihkan dari daftar dompet
    if (state.savingsGoals.length === 0) {
        state.wallets = (state.wallets || []).filter(w => !((w.id === 999001 || w.name === '🐷 Tabungan Impian') && w.balance === 0));
    }
    saveData();
}

function getOrCreateCentralSavingsWallet() {
    if (!Array.isArray(state.wallets)) state.wallets = [];
    let w = state.wallets.find(wal => wal.id === 999001 || wal.name === '🐷 Tabungan Impian');
    if (!w) {
        const maxOrder = state.wallets.reduce((max, item) => Math.max(max, item.order !== undefined ? item.order : -1), -1);
        w = { id: 999001, name: '🐷 Tabungan Impian', type: 'invest', balance: 0, order: maxOrder + 1 };
        state.wallets.push(w);
    }
    return w;
}

function addGoalTransaction(goalId, { type, amount, walletId, note }) {
    if (!state.savingsGoals) return false;
    const goal = state.savingsGoals.find(g => g.id === goalId);
    if (!goal) return false;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;

    const centralSavingsWallet = getOrCreateCentralSavingsWallet();

    if (type === 'deposit') {
        goal.currentAmount = (goal.currentAmount || 0) + numAmount;
        centralSavingsWallet.balance += numAmount;

        if (walletId) {
            const wallet = state.wallets.find(w => w.id == walletId);
            if (wallet) {
                wallet.balance -= numAmount;
                state.transactions.unshift({
                    id: Date.now(),
                    mainType: 'transfer',
                    type: 'transfer',
                    amount: numAmount,
                    category: 'Investasi / Top Up Portofolio',
                    walletId: Number(walletId),
                    fromId: Number(walletId),
                    toId: centralSavingsWallet.id,
                    walletName: `${wallet.name} ➔ ${centralSavingsWallet.name}`,
                    date: new Date().toISOString().split('T')[0],
                    desc: `Setoran Target Impian: ${goal.name}` + (note ? ` (${note})` : ''),
                    note: `Setoran Target Impian: ${goal.name}` + (note ? ` (${note})` : ''),
                    timestamp: Date.now()
                });
            }
        }
    } else if (type === 'withdraw') {
        goal.currentAmount = Math.max(0, (goal.currentAmount || 0) - numAmount);
        centralSavingsWallet.balance = Math.max(0, centralSavingsWallet.balance - numAmount);

        if (walletId) {
            const wallet = state.wallets.find(w => w.id == walletId);
            if (wallet) {
                wallet.balance += numAmount;
                state.transactions.unshift({
                    id: Date.now(),
                    mainType: 'transfer',
                    type: 'transfer',
                    amount: numAmount,
                    category: 'Penarikan Investasi',
                    walletId: Number(walletId),
                    fromId: centralSavingsWallet.id,
                    toId: Number(walletId),
                    walletName: `${centralSavingsWallet.name} ➔ ${wallet.name}`,
                    date: new Date().toISOString().split('T')[0],
                    desc: `Penarikan Target Impian: ${goal.name}` + (note ? ` (${note})` : ''),
                    note: `Penarikan Target Impian: ${goal.name}` + (note ? ` (${note})` : ''),
                    timestamp: Date.now()
                });
            }
        }
    } else if (type === 'purchase') {
        const purchaseAmt = numAmount;
        centralSavingsWallet.balance = Math.max(0, centralSavingsWallet.balance - purchaseAmt);
        goal.currentAmount = Math.max(0, (goal.currentAmount || 0) - purchaseAmt);
        goal.status = 'completed';

        state.transactions.unshift({
            id: Date.now(),
            mainType: 'expense',
            type: 'expense',
            amount: purchaseAmt,
            category: 'Belanja Keinginan',
            walletId: centralSavingsWallet.id,
            walletName: centralSavingsWallet.name,
            date: new Date().toISOString().split('T')[0],
            desc: `Pembelian Barang Impian: ${goal.name}` + (note ? ` (${note})` : ''),
            note: `Pembelian Barang Impian: ${goal.name}` + (note ? ` (${note})` : ''),
            timestamp: Date.now()
        });
    }

    if (!goal.history) goal.history = [];
    goal.history.unshift({
        id: 'gh_' + Date.now(),
        type: type,
        amount: numAmount,
        walletId: walletId || null,
        date: new Date().toISOString().split('T')[0],
        note: note || ''
    });

    goal.updatedAt = Date.now();
    saveData();
    return true;
}

window.addSavingsGoal = addSavingsGoal;
window.updateSavingsGoal = updateSavingsGoal;
window.deleteSavingsGoal = deleteSavingsGoal;
window.addGoalTransaction = addGoalTransaction;

// --- DEBT (HUTANG) FUNCTIONS ---
function addDebt(debtData) {
    if (!state.debts) state.debts = [];
    const newDebt = {
        id: 'debt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: debtData.name || 'Hutang Tanpa Nama',
        category: debtData.category || 'Pinjaman Pribadi',
        totalAmount: Number(debtData.totalAmount) || 0,
        paidAmount: Number(debtData.paidAmount) || 0,
        monthlyTarget: Number(debtData.monthlyTarget) || 0,
        dueDay: Number(debtData.dueDay) || null,
        notes: debtData.notes || '',
        history: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    if (newDebt.paidAmount > 0) {
        newDebt.history.push({
            id: 'dh_' + Date.now(),
            amount: newDebt.paidAmount,
            date: new Date().toISOString().split('T')[0],
            note: 'Pembayaran awal / DP'
        });
    }

    if (debtData.walletId) {
        const wallet = state.wallets.find(w => w.id == debtData.walletId);
        if (wallet) {
            wallet.balance += newDebt.totalAmount;
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            state.transactions.unshift({
                id: Date.now(),
                timestamp: now.getTime(),
                date: dateStr,
                desc: `Pencairan Hutang: ${newDebt.name}`,
                mainType: 'income',
                category: 'Hutang & Pinjaman',
                amount: newDebt.totalAmount,
                walletName: wallet.name,
                walletId: Number(debtData.walletId)
            });
        }
    }

    state.debts.push(newDebt);
    saveData();
    return newDebt;
}

function updateDebt(id, updatedFields) {
    if (!state.debts) return null;
    const index = state.debts.findIndex(d => d.id === id);
    if (index !== -1) {
        state.debts[index] = {
            ...state.debts[index],
            ...updatedFields,
            updatedAt: Date.now()
        };
        saveData();
        return state.debts[index];
    }
    return null;
}

function deleteDebt(id) {
    if (!state.debts) return;
    state.debts = state.debts.filter(d => d.id !== id);
    saveData();
}

function addDebtPayment(debtId, { amount, walletId, note }) {
    if (!state.debts) return false;
    const debt = state.debts.find(d => d.id === debtId);
    if (!debt) return false;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;

    debt.paidAmount = (debt.paidAmount || 0) + numAmount;

    if (walletId) {
        const wallet = state.wallets.find(w => w.id == walletId);
        if (wallet) {
            wallet.balance -= numAmount;
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            state.transactions.unshift({
                id: Date.now(),
                timestamp: now.getTime(),
                date: dateStr,
                desc: `Pembayaran Cicilan: ${debt.name}` + (note ? ` (${note})` : ''),
                mainType: 'expense',
                category: 'Pembayaran Hutang',
                amount: numAmount,
                walletName: wallet.name,
                walletId: Number(walletId)
            });
        }
    }

    if (!debt.history) debt.history = [];
    debt.history.unshift({
        id: 'dh_' + Date.now(),
        amount: numAmount,
        walletId: walletId || null,
        date: new Date().toISOString().split('T')[0],
        note: note || ''
    });

    debt.updatedAt = Date.now();
    saveData();
    return true;
}

// --- RECEIVABLE (PIUTANG) FUNCTIONS ---
function addReceivable(receivableData) {
    if (!state.receivables) state.receivables = [];
    const newReceivable = {
        id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: receivableData.name || 'Piutang Tanpa Nama',
        debtorName: receivableData.debtorName || receivableData.name || 'Peminjam',
        totalAmount: Number(receivableData.totalAmount) || 0,
        receivedAmount: Number(receivableData.receivedAmount) || 0,
        dueDate: receivableData.dueDate || '',
        notes: receivableData.notes || '',
        history: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    if (newReceivable.receivedAmount > 0) {
        newReceivable.history.push({
            id: 'rh_' + Date.now(),
            amount: newReceivable.receivedAmount,
            date: new Date().toISOString().split('T')[0],
            note: 'Pembayaran awal'
        });
    }

    if (receivableData.walletId) {
        const wallet = state.wallets.find(w => w.id == receivableData.walletId);
        if (wallet) {
            wallet.balance -= newReceivable.totalAmount;
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            state.transactions.unshift({
                id: Date.now(),
                timestamp: now.getTime(),
                date: dateStr,
                desc: `Pemberian Piutang ke ${newReceivable.debtorName}: ${newReceivable.name}`,
                mainType: 'expense',
                category: 'Piutang & Pinjaman Diberikan',
                amount: newReceivable.totalAmount,
                walletName: wallet.name,
                walletId: Number(receivableData.walletId)
            });
        }
    }

    state.receivables.push(newReceivable);
    saveData();
    return newReceivable;
}

function updateReceivable(id, updatedFields) {
    if (!state.receivables) return null;
    const index = state.receivables.findIndex(r => r.id === id);
    if (index !== -1) {
        state.receivables[index] = {
            ...state.receivables[index],
            ...updatedFields,
            updatedAt: Date.now()
        };
        saveData();
        return state.receivables[index];
    }
    return null;
}

function deleteReceivable(id) {
    if (!state.receivables) return;
    state.receivables = state.receivables.filter(r => r.id !== id);
    saveData();
}

function addReceivablePayment(receivableId, { amount, walletId, note }) {
    if (!state.receivables) return false;
    const receivable = state.receivables.find(r => r.id === receivableId);
    if (!receivable) return false;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;

    receivable.receivedAmount = (receivable.receivedAmount || 0) + numAmount;

    if (walletId) {
        const wallet = state.wallets.find(w => w.id == walletId);
        if (wallet) {
            wallet.balance += numAmount;
            const now = new Date();
            const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            state.transactions.unshift({
                id: Date.now(),
                timestamp: now.getTime(),
                date: dateStr,
                desc: `Penerimaan Pelunasan dari ${receivable.debtorName}: ${receivable.name}` + (note ? ` (${note})` : ''),
                mainType: 'income',
                category: 'Pelunasan Piutang',
                amount: numAmount,
                walletName: wallet.name,
                walletId: Number(walletId)
            });
        }
    }

    if (!receivable.history) receivable.history = [];
    receivable.history.unshift({
        id: 'rh_' + Date.now(),
        amount: numAmount,
        walletId: walletId || null,
        date: new Date().toISOString().split('T')[0],
        note: note || ''
    });

    receivable.updatedAt = Date.now();
    saveData();
    return true;
}

window.addDebt = addDebt;
window.updateDebt = updateDebt;
window.deleteDebt = deleteDebt;
window.addDebtPayment = addDebtPayment;
window.addReceivable = addReceivable;
window.updateReceivable = updateReceivable;
window.deleteReceivable = deleteReceivable;
window.addReceivablePayment = addReceivablePayment;
