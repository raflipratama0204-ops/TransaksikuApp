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

    const monthlyExpenses = currentMonthTx.filter(t => {
        if (t.mainType === 'expense' || t.type === 'expense') return true;
        if (t.mainType === 'transfer' && isInvestmentWallet(t.toId)) return true;
        return false;
    });

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

    const safeDailyLimit = Math.max(0, Math.round(remaining / daysLeft));
    if (dailyLimitEl) dailyLimitEl.innerText = `${formatRp(safeDailyLimit)} / hari`;
    if (dailyDaysLeftEl) dailyDaysLeftEl.innerText = `Berdasarkan sisa ${daysLeft} hari pada periode bulan ini.`;

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

function checkBudgetAlerts(transaction) {
    const isExpense = transaction && (transaction.mainType === 'expense' || transaction.type === 'expense');
    if (!isExpense || !state.budgetSettings) return;

    const settings = state.budgetSettings;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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

// --- SAVINGS GOALS (TARGET TABUNGAN & IMPIAN) UI FUNCTIONS ---
let activeBudgetSection = 'expenses';
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

        renderBudgetView();
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
        <div class="hero-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <span class="hero-card-label" style="font-size: 0.8rem; color: var(--purple); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL TABUNGAN IMPIAN</span>
                <h2 class="hero-card-amount" style="font-size: 1.8rem; color: var(--text-main); margin-top: 2px;">${formatRp(totalCurrentSum)} <span class="hero-card-subamount" style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">/ ${formatRp(totalTargetSum)}</span></h2>
                <div class="hero-card-stats" style="display: flex; gap: 15px; margin-top: 8px; font-size: 0.82rem; font-weight: 600;">
                    <span style="color: var(--accent);">🎯 ${goals.length} Target Aktif</span>
                    <span style="color: var(--success);">🥳 ${completedCount} Tercapai</span>
                </div>
            </div>
            <div class="hero-card-pct-box" style="text-align: right; min-width: 120px;">
                <div class="hero-card-pct-val" style="font-size: 1.8rem; font-weight: 800; color: var(--purple);">${overallPct}%</div>
                <span class="hero-card-pct-label" style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Progress Keseluruhan</span>
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

function openGoalDepositModal(goalId) {
    const goal = (state.savingsGoals || []).find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('deposit-goal-id').value = goal.id;
    document.getElementById('deposit-goal-icon').textContent = goal.categoryIcon || '🎯';
    document.getElementById('deposit-goal-name').textContent = goal.name;
    document.getElementById('deposit-goal-progress-text').textContent = `${formatRp(goal.currentAmount)} terkumpul dari target ${formatRp(goal.targetAmount)}`;

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
    } else {
        showToast('Gagal memproses transaksi target tabungan.');
    }
}

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
        }
    }
}

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
window.executeGoalPurchase = executeGoalPurchase;
