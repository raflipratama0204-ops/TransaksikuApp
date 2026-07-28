// Shared State Object
const state = {
    wallets: JSON.parse(localStorage.getItem('keuangan_wallets28')) || [
        { id: 1, name: 'Dompet Tunai', balance: 0, type: 'cash' },
        { id: 2, name: 'Rekening Bank', balance: 0, type: 'cash' },
        { id: 3, name: 'Portofolio Saham', balance: 0, type: 'invest' }
    ],
    transactions: JSON.parse(localStorage.getItem('keuangan_transactions28')) || [],
    customCategories: JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [],
    budgetSettings: JSON.parse(localStorage.getItem('transaksiku_budget_settings')) || {
        activeMode: 'envelope',
        monthlyTotal: 3600000,
        period: 'monthly',
        categoryBudgets: {
            "Makanan & Minuman": 1500000,
            "Transportasi": 500000,
            "Belanja": 500000,
            "Tagihan & Utilitas": 750000,
            "Hiburan": 350000
        },
        allocations503020: { needsPercent: 50, wantsPercent: 30, savingsPercent: 20 },
        needsCategories: ["Makanan & Minuman", "Transportasi", "Tagihan & Utilitas", "Kesehatan", "Pendidikan"],
        wantsCategories: ["Belanja", "Hiburan", "Jalan-jalan", "Hobi"],
        savingsCategories: ["Investasi", "Tabungan", "Dana Darurat"],
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
