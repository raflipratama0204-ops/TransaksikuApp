// MAIN ENTRY POINT - ORCHESTRATOR & EVENT BINDINGS

// --- AUTHENTICATION FLOWS & HANDLERS ---
async function mockGoogleLogin() {
    const btn = document.getElementById('google-login-btn');
    if (!btn) return;
    if (btn.innerText.includes('Masuk')) {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider).catch((error) => {
            showToast('Gagal menghubungkan Google: ' + error.message);
        });
    } else {
        auth.signOut().then(() => {
            localStorage.removeItem('transaksiku_entry_choice');
            localStorage.removeItem('transaksiku_user_logged_in');
            showToast('Akun Google diputus.');
            setTimeout(() => window.location.reload(), 800);
        }).catch((error) => {
            showToast('Gagal memutus akun: ' + error.message);
        });
    }
}

function checkEntryChoice() {
    const choice = localStorage.getItem('transaksiku_entry_choice');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
        if (!choice) {
            welcome.style.display = 'flex';
            welcome.classList.add('active');
        } else {
            welcome.style.display = 'none';
            welcome.classList.remove('active');
        }
    }
}

async function handleEntryChoice(choice) {
    localStorage.setItem('transaksiku_entry_choice', choice);
    if (choice === 'online') {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider).catch((error) => {
            showToast('Gagal login Google: ' + error.message);
        });
    } else {
        showToast('Masuk sebagai Tamu (Offline).');
        checkEntryChoice();
        updateEntryUI();
    }
}

async function updateEntryUI() {
    const choice = localStorage.getItem('transaksiku_entry_choice');
    const btn = document.getElementById('google-login-btn');
    const statusTitle = document.getElementById('sync-status-title');
    const statusDesc = document.getElementById('sync-status-desc');
    if (!btn || !statusTitle || !statusDesc) return;

    if (choice === 'online') {
        btn.innerHTML = '<span>Keluar Akun Google</span>';
        btn.style.background = 'var(--danger)';
        btn.style.color = 'white';

        const user = auth.currentUser;
        const email = user?.email || 'Akun Terhubung';
        statusTitle.innerText = 'Akun Terhubung: ' + email;
        statusDesc.innerText = 'Sinkronisasi cloud aktif';
    } else {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.87 3C6.18 7.73 8.87 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"/><path fill="#FBBC05" d="M5.27 14.56c-.25-.73-.39-1.5-.39-2.31s.14-1.58.39-2.31L1.4 6.94C.51 8.71 0 10.74 0 12.9s.51 4.19 1.4 5.96l3.87-3.3z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.13 0-5.82-2.69-6.77-5.52l-3.87 3C3.37 20.35 7.35 23 12 23z"/></svg><span>Masuk dengan Google</span>';
        btn.style.background = 'white';
        btn.style.color = '#374151';
        statusTitle.innerText = 'Mode Offline Aktif';
        statusDesc.innerText = 'Data hanya tersimpan di browser Anda saat ini.';
    }
}

async function handleResetAllData() {
    const confirmed = await customConfirm(
        'Apakah Anda yakin ingin menghapus seluruh data transaksi, dompet, kategori kustom, dan pengaturan Anda? Tindakan ini tidak dapat dibatalkan.',
        'Konfirmasi Hapus Data'
    );
    if (confirmed) {
        localStorage.clear();
        showToast('Seluruh data berhasil dihapus!');
        setTimeout(() => window.location.reload(), 1000);
    }
}

// --- PWA INSTALLATION PROCESS HANDLERS ---
let deferredPrompt;
const pwaBanner = document.getElementById('pwa-install-banner');
const pwaInstallBtn = document.getElementById('pwa-install-btn');
const pwaCloseBtn = document.getElementById('pwa-close-btn');

function getDeviceOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    return 'desktop';
}

function getBrowserName() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('chrome') > -1 && userAgent.indexOf('edge') === -1 && userAgent.indexOf('opr') === -1) {
        return 'chrome';
    }
    if (userAgent.indexOf('safari') > -1 && userAgent.indexOf('chrome') === -1) {
        return 'safari';
    }
    if (userAgent.indexOf('firefox') > -1) {
        return 'firefox';
    }
    return 'other';
}

function renderPwaGuide() {
    const content = document.getElementById('pwa-guide-content');
    if (!content) return;
    const os = getDeviceOS();
    const browser = getBrowserName();

    let guideHtml = '';
    if (os === 'ios') {
        guideHtml = `
            <ol style="padding-left: 20px; font-size: 0.9rem; line-height: 1.6; display: flex; flex-direction: column; gap: 8px; color: var(--text-main);">
                <li>Buka aplikasi lewat browser <strong>Safari</strong>.</li>
                <li>Tap tombol <strong>Bagikan (Share)</strong> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> di bagian bawah layar.</li>
                <li>Scroll ke bawah dan pilih opsi <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
                <li>Tap <strong>Tambah (Add)</strong> di kanan atas.</li>
            </ol>
        `;
    } else if (os === 'android') {
        if (browser === 'chrome') {
            guideHtml = `
                <ol style="padding-left: 20px; font-size: 0.9rem; line-height: 1.6; display: flex; flex-direction: column; gap: 8px; color: var(--text-main);">
                    <li>Tap ikon <strong>menu titik tiga</strong> di kanan atas browser Chrome.</li>
                    <li>Pilih opsi <strong>Instal Aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong>.</li>
                    <li>Konfirmasi pemasangan dengan mengetuk tombol <strong>Instal</strong>.</li>
                </ol>
            `;
        } else {
            guideHtml = `
                <ol style="padding-left: 20px; font-size: 0.9rem; line-height: 1.6; display: flex; flex-direction: column; gap: 8px; color: var(--text-main);">
                    <li>Gunakan browser <strong>Google Chrome</strong> untuk Android agar mendapatkan instalasi instan.</li>
                    <li>Atau cari opsi <strong>Instal / Tambah ke Layar Utama</strong> di menu browser Anda saat ini.</li>
                </ol>
            `;
        }
    } else {
        guideHtml = `
            <ol style="padding-left: 20px; font-size: 0.9rem; line-height: 1.6; display: flex; flex-direction: column; gap: 8px; color: var(--text-main);">
                <li>Gunakan browser desktop modern seperti <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>.</li>
                <li>Klik ikon <strong>Instal</strong> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> di bilah alamat (URL bar) di kanan atas browser.</li>
                <li>Konfirmasi pemasangan dengan mengeklik <strong>Instal</strong> pada dialog.</li>
            </ol>
        `;
    }
    content.innerHTML = guideHtml;
}

function showPwaGuide() {
    renderPwaGuide();
    const modal = document.getElementById('pwa-guide-modal');
    if (modal) modal.classList.add('active');
}

function closePwaGuide() {
    const modal = document.getElementById('pwa-guide-modal');
    if (modal) modal.classList.remove('active');
}

function triggerPwaInstall() {
    if (deferredPrompt) {
        if (pwaBanner) {
            pwaBanner.classList.remove('show');
            setTimeout(() => pwaBanner.style.display = 'none', 400);
        }

        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(({ outcome }) => {
            console.log(`Pilihan user: ${outcome}`);
            deferredPrompt = null;
        });
    } else {
        showPwaGuide();
    }
}

// Bind ALL handlers to window so HTML templates onclick actions work
window.navigateTo = navigateTo;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.toggleReminder = toggleReminder;
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettingsDisplay = saveSettingsDisplay;
window.mockGoogleLogin = mockGoogleLogin;
window.handleEntryChoice = handleEntryChoice;
window.updateEntryUI = updateEntryUI;
window.checkEntryChoice = checkEntryChoice;
window.handleResetAllData = handleResetAllData;
window.selectCategoryEmoji = selectCategoryEmoji;
window.saveCustomCategoryFromSettings = saveCustomCategoryFromSettings;
window.deleteCustomCategoryFromSettings = deleteCustomCategoryFromSettings;
window.switchSettingsTab = switchSettingsTab;
window.switchReportTab = switchReportTab;
window.saveCustomCategory = saveCustomCategory;
window.showCustomCategoryModal = showCustomCategoryModal;
window.closeCustomCategoryModal = closeCustomCategoryModal;
window.toggleAddWalletForm = toggleAddWalletForm;
window.toggleWalletMenu = toggleWalletMenu;
window.addWallet = addWallet;
window.editWalletName = editWalletName;
window.editWalletBalance = editWalletBalance;
window.deleteWallet = deleteWallet;
window.addTransaction = addTransaction;
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;
window.updateTransaction = updateTransaction;
window.updateCategoryOptions = updateCategoryOptions;
window.toggleHideBalances = toggleHideBalances;
window.updateEditCategoryOptions = updateEditCategoryOptions;
window.formatCurrencyInput = formatCurrencyInput;
window.showPwaGuide = showPwaGuide;
window.closePwaGuide = closePwaGuide;
window.triggerPwaInstall = triggerPwaInstall;

// --- INITIALIZE & START ROUTINES ---

// Register the Observer Redraw callback to db.js
registerDataChangedCallback(() => {
    generateDynamicFilters();
    renderWallets();
    applyFilter();
});

// Setup Firebase Authentication listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        localStorage.setItem('transaksiku_entry_choice', 'online');
        localStorage.setItem('transaksiku_user_logged_in', 'true');
        updateEntryUI();
        await pullCloudData(user.uid);
        subscribeToCloudChanges(user.uid);
    } else {
        localStorage.removeItem('transaksiku_entry_choice');
        localStorage.removeItem('transaksiku_user_logged_in');
        updateEntryUI();
        const unsub = unsubscribeRealtime;
        if (unsub) {
            unsub();
            setUnsubscribeRealtime(null);
        }
    }
});

// Run theme and other startup configurations
console.log("DEBUG STARTUP: checkEntryChoice start");
checkEntryChoice();
console.log("DEBUG STARTUP: updateEntryUI start");
updateEntryUI();
console.log("DEBUG STARTUP: initThemeUI start");
initThemeUI();
console.log("DEBUG STARTUP: initHideBalancesUI start");
initHideBalancesUI();
console.log("DEBUG STARTUP: updateReminderToggles start");
updateReminderToggles();
console.log("DEBUG STARTUP: setDefaultDate start");
setDefaultDate();
console.log("DEBUG STARTUP: updateCategoryOptions start");
updateCategoryOptions();
console.log("DEBUG STARTUP: generateDynamicFilters start");
generateDynamicFilters();
console.log("DEBUG STARTUP: renderWallets start");
renderWallets();
console.log("DEBUG STARTUP: applyFilter start");
applyFilter();
console.log("DEBUG STARTUP: applyDisplaySettings start");
applyDisplaySettings();
console.log("DEBUG STARTUP: all routines completed successfully!");

// PWA Installer checks
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');
const dismissTime = localStorage.getItem('pwa_banner_dismissed_at');
const delayToShowAgain = 3 * 24 * 60 * 60 * 1000;
const isDismissed = dismissTime && (Date.now() - parseInt(dismissTime) < delayToShowAgain);

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

if (!isStandalone) {
    const drawerInstallBtn = document.getElementById('drawer-install-btn');
    if (drawerInstallBtn) {
        drawerInstallBtn.style.display = 'flex';
    }
    if (!isDismissed && pwaBanner) {
        setTimeout(() => {
            pwaBanner.style.display = 'flex';
            pwaBanner.offsetHeight;
            pwaBanner.classList.add('show');
        }, 3000);
    }
}

if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', triggerPwaInstall);
}

if (pwaCloseBtn) {
    pwaCloseBtn.addEventListener('click', () => {
        pwaBanner.classList.remove('show');
        setTimeout(() => {
            pwaBanner.style.display = 'none';
        }, 400);
        localStorage.setItem('pwa_banner_dismissed_at', Date.now().toString());
    });
}

window.addEventListener('appinstalled', (evt) => {
    console.log('Transaksiku berhasil diinstal!');
    deferredPrompt = null;
    if (pwaBanner) {
        pwaBanner.classList.remove('show');
        setTimeout(() => pwaBanner.style.display = 'none', 400);
    }
    const drawerInstallBtn = document.getElementById('drawer-install-btn');
    if (drawerInstallBtn) {
        drawerInstallBtn.style.display = 'none';
    }
});

// Set intervals for PWA reminders
setTimeout(checkDailyReminder, 5000);
setInterval(checkDailyReminder, 60 * 60 * 1000);

setTimeout(checkDebtReminders, 6000);
setInterval(checkDebtReminders, 60 * 60 * 1000);
