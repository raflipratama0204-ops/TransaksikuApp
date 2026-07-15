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
    localStorage.setItem('keuangan_wallets28', JSON.stringify(state.wallets));
    localStorage.setItem('keuangan_transactions28', JSON.stringify(state.transactions));
    localStorage.setItem('transaksiku_custom_categories', JSON.stringify(state.customCategories));
    notifyDataChanged();
    triggerCloudSync();
}

// Mengambil data dari cloud ke local storage
async function pullCloudData(userId) {
    showToast('Memuat data dari cloud...');
    try {
        const docRef = db.collection('user_sync').doc(userId);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            localStorage.setItem('keuangan_wallets28', JSON.stringify(data.wallets || []));
            localStorage.setItem('keuangan_transactions28', JSON.stringify(data.transactions || []));
            localStorage.setItem('transaksiku_custom_categories', JSON.stringify(data.custom_categories || []));

            state.wallets = data.wallets || [];
            state.transactions = data.transactions || [];
            state.customCategories = data.custom_categories || [];

            notifyDataChanged();
            showToast('Sinkronisasi selesai. Data cloud termuat!');
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

    try {
        await db.collection('user_sync').doc(userId).set({
            user_id: userId,
            wallets: walletsData,
            transactions: transactionsData,
            custom_categories: categoriesData,
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
            const data = doc.data();
            const newWallets = data.wallets || [];
            const newTransactions = data.transactions || [];
            const newCategories = data.custom_categories || [];

            const currentTransactions = JSON.parse(localStorage.getItem('keuangan_transactions28') || '[]');
            const currentWallets = JSON.parse(localStorage.getItem('keuangan_wallets28') || '[]');
            const currentCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories') || '[]');

            const hasChanges = 
                JSON.stringify(currentTransactions) !== JSON.stringify(newTransactions) ||
                JSON.stringify(currentWallets) !== JSON.stringify(newWallets) ||
                JSON.stringify(currentCategories) !== JSON.stringify(newCategories);

            if (hasChanges) {
                localStorage.setItem('keuangan_wallets28', JSON.stringify(newWallets));
                localStorage.setItem('keuangan_transactions28', JSON.stringify(newTransactions));
                localStorage.setItem('transaksiku_custom_categories', JSON.stringify(newCategories));

                state.wallets = newWallets;
                state.transactions = newTransactions;
                state.customCategories = newCategories;

                notifyDataChanged();
                // showToast('Data diperbarui dari perangkat lain secara realtime!');
            }
        }
    }, (error) => {
        console.error('Realtime sync error:', error);
    });
}

function setUnsubscribeRealtime(val) {
    unsubscribeRealtime = val;
}
