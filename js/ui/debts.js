// --- DEBT (HUTANG) & RECEIVABLE (PIUTANG) UI MODULE ---
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
        <div class="hero-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <span class="hero-card-label" style="font-size: 0.8rem; color: var(--purple); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL KEWAJIBAN HUTANG</span>
                <h2 class="hero-card-amount" style="font-size: 1.8rem; color: var(--text-main); margin-top: 2px;">${formatRp(totalRemainingSum)} <span class="hero-card-subamount" style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">/ Total ${formatRp(totalDebtSum)}</span></h2>
                <div class="hero-card-stats" style="display: flex; gap: 15px; margin-top: 8px; font-size: 0.82rem; font-weight: 600;">
                    <span style="color: var(--purple);">💳 ${debts.length} Catatan Hutang</span>
                    <span style="color: var(--success);">🟢 Terbayar: ${formatRp(totalPaidSum)} (${overallPct}%)</span>
                </div>
            </div>
            <div class="hero-card-pct-box" style="text-align: right; min-width: 120px;">
                <div class="hero-card-pct-val" style="font-size: 1.8rem; font-weight: 800; color: var(--purple);">${overallPct}%</div>
                <span class="hero-card-pct-label" style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Pelunasan Terbayar</span>
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
        <div class="hero-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <span class="hero-card-label" style="font-size: 0.8rem; color: var(--success); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PIUTANG DILUAR</span>
                <h2 class="hero-card-amount" style="font-size: 1.8rem; color: var(--text-main); margin-top: 2px;">${formatRp(totalRemainingSum)} <span class="hero-card-subamount" style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">/ Total ${formatRp(totalReceivableSum)}</span></h2>
                <div class="hero-card-stats" style="display: flex; gap: 15px; margin-top: 8px; font-size: 0.82rem; font-weight: 600;">
                    <span style="color: var(--success);">🤝 ${receivables.length} Catatan Piutang</span>
                    <span style="color: var(--accent);">🟢 Diterima: ${formatRp(totalReceivedSum)} (${overallPct}%)</span>
                </div>
            </div>
            <div class="hero-card-pct-box" style="text-align: right; min-width: 120px;">
                <div class="hero-card-pct-val" style="font-size: 1.8rem; font-weight: 800; color: var(--success);">${overallPct}%</div>
                <span class="hero-card-pct-label" style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Pelunasan Diterima</span>
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
