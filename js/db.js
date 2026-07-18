// Shared State Object
const state = {
    wallets: JSON.parse(localStorage.getItem('keuangan_wallets28')) || [
        { id: 1, name: 'Dompet Tunai', balance: 0, type: 'cash' },
        { id: 2, name: 'Rekening Bank', balance: 0, type: 'cash' },
        { id: 3, name: 'Portofolio Saham', balance: 0, type: 'invest' }
    ],
    transactions: JSON.parse(localStorage.getItem('keuangan_transactions28')) || [],
    customCategories: JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [],
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

function subscribeToCloudChanges(userId) {
    if (unsubscribeRealtime) {
        unsubscribeRealtime();
    }

    unsubscribeRealtime = db.collection('user_sync').doc(userId).onSnapshot((doc) => {
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
                JSON.stringify(currentTransactions) !== JSON.stringify(merged.transactions) ||
                JSON.stringify(currentWallets) !== JSON.stringify(merged.wallets) ||
                JSON.stringify(currentCategories) !== JSON.stringify(merged.customCategories);

            if (hasChanges) {
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
                    JSON.stringify(cloudWallets) !== JSON.stringify(merged.wallets) ||
                    JSON.stringify(cloudTransactions) !== JSON.stringify(merged.transactions) ||
                    JSON.stringify(cloudCategories) !== JSON.stringify(merged.customCategories);

                if (needsUpload) {
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
        unsubscribeRealtime();
        unsubscribeRealtime = null;
    }

    localStorage.setItem('transaksiku_resetting', 'true');

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
            // Tulis data default ke cloud (bukan array kosong agar tipe data setara dengan lokal)
            await db.collection('user_sync').doc(user.uid).set({
                user_id: user.uid,
                wallets: state.wallets,
                transactions: [],
                custom_categories: [],
                updated_at: new Date().toISOString()
            });

            // Tunggu hingga Firestore menyelesaikan proses sinkronisasi antrean ke server
            if (typeof db.waitForPendingWrites === 'function') {
                try {
                    await Promise.race([
                        db.waitForPendingWrites(),
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]);
                } catch (e) {
                    console.warn("Firestore pending writes timeout:", e);
                }
            }

            // Aktifkan kembali listener setelah data server bersih
            subscribeToCloudChanges(user.uid);
        }
    }
    
    localStorage.removeItem('transaksiku_resetting');
}

window.clearAllDataCloudAndLocal = clearAllDataCloudAndLocal;
