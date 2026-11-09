// --- CASHFLOW REPORTING & METRICS ---
function calculateCashflow() {
    const filteredTrans = typeof getFilteredTransactions === 'function' ? getFilteredTransactions() : state.transactions;
    const expenseContainer = document.getElementById('cashflow-expense-list');
    const incomeContainer = document.getElementById('cashflow-income-list');
    const debtContainer = document.getElementById('cashflow-debt-list');

    if (!expenseContainer || !incomeContainer || !debtContainer) return;

    expenseContainer.innerHTML = ''; 
    incomeContainer.innerHTML = ''; 
    debtContainer.innerHTML = '';

    // Calculate total remaining debt from structured debts (state.debts)
    const structuredDebts = state.debts || [];
    const structuredDebtRemaining = structuredDebts.reduce((sum, d) => {
        return sum + Math.max(0, (Number(d.totalAmount) || 0) - (Number(d.paidAmount) || 0));
    }, 0);

    // Calculate total remaining debt from standalone transactions
    let standaloneDebtTaken = 0;
    let standaloneDebtPaid = 0;
    state.transactions.forEach(t => {
        if (t.mainType === 'debt') {
            standaloneDebtTaken += Number(t.amount) || 0;
        } else if (t.mainType === 'expense' && (t.category === 'Cicilan' || t.category === 'Bayar Pinjaman Bank' || t.category === 'Bayar Kartu Kredit' || t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Pembayaran Hutang')) {
            if (!t.desc || !t.desc.startsWith('Pembayaran Cicilan:')) {
                standaloneDebtPaid += Number(t.amount) || 0;
            }
        }
    });

    const standaloneDebtRemaining = Math.max(0, standaloneDebtTaken - standaloneDebtPaid);
    const outstandingDebt = structuredDebtRemaining + standaloneDebtRemaining;

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
            let key = `${t.mainType}-${t.category}`;
            summary[key] = (summary[key] || 0) + t.amount;
            currentPeriodDebtTaken += t.amount;
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
    const totalEffectiveIncome = totalIncome + currentPeriodDebtTaken;
    if (metricIncomeEl) metricIncomeEl.innerText = formatRp(totalEffectiveIncome);
    if (metricExpenseEl) metricExpenseEl.innerText = formatRp(totalExpense);

    const net = totalEffectiveIncome - totalExpense;
    const netEl = document.getElementById('metric-net');
    if (netEl) {
        netEl.innerText = formatRp(net);
        netEl.style.color = net < 0 ? 'var(--danger)' : (net > 0 ? 'var(--success)' : 'var(--accent)');
    }

    // Populate Cashflow Titanium Hero Card
    const cashflowNetHero = document.getElementById('cashflow-net-hero');
    const cashflowIncomeHero = document.getElementById('cashflow-income-hero');
    const cashflowExpenseHero = document.getElementById('cashflow-expense-hero');
    const cashflowNetBadge = document.getElementById('cashflow-net-badge');
    const cashflowDebtHero = document.getElementById('cashflow-debt-hero');
    const cashflowDebtPeriodSub = document.getElementById('cashflow-debt-period-sub');
    const cashflowDtaHero = document.getElementById('cashflow-dta-hero');
    const cashflowDtaDescSub = document.getElementById('cashflow-dta-desc-sub');

    if (cashflowNetHero) {
        cashflowNetHero.innerText = formatRp(net);
        if (net > 0) {
            cashflowNetHero.style.color = '#34d399';
        } else if (net < 0) {
            cashflowNetHero.style.color = '#f87171';
        } else {
            cashflowNetHero.style.color = '#ffffff';
        }
    }
    if (cashflowIncomeHero) cashflowIncomeHero.innerText = formatRp(totalEffectiveIncome);
    if (cashflowExpenseHero) cashflowExpenseHero.innerText = formatRp(totalExpense);
    if (cashflowDebtHero) cashflowDebtHero.innerText = formatRp(outstandingDebt);
    if (cashflowDebtPeriodSub) cashflowDebtPeriodSub.innerText = '+ ' + formatRp(currentPeriodDebtTaken) + ' periode ini';

    if (cashflowNetBadge) {
        if (net > 0) {
            cashflowNetBadge.className = 'apple-status-pill success';
            cashflowNetBadge.innerText = 'Surplus +';
        } else if (net < 0) {
            cashflowNetBadge.className = 'apple-status-pill danger';
            cashflowNetBadge.innerText = 'Defisit -';
        } else {
            cashflowNetBadge.className = 'apple-status-pill neutral';
            cashflowNetBadge.innerText = 'Seimbang';
        }
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
            outDebtBox.style.background = 'rgba(16, 185, 129, 0.08)';
        } else {
            outDebtEl.style.color = 'var(--purple)';
            outDebtBox.style.borderColor = 'var(--purple)';
            outDebtBox.style.background = 'rgba(139, 92, 246, 0.08)';
        }
    }

    const ratioEl = document.getElementById('metric-ratio');
    const ratioBox = document.getElementById('ratio-box');
    const ratioDesc = document.getElementById('ratio-desc');

    let totalAssets = 0;
    state.wallets.forEach(w => {
        totalAssets += w.balance;
    });

    let calculatedRatioStr = '0%';
    let calculatedRatioDesc = 'Sangat Sehat';
    let calculatedRatioColor = '#34d399';

    if (totalAssets > 0) {
        const ratio = parseFloat(((outstandingDebt / totalAssets) * 100).toFixed(1));
        calculatedRatioStr = ratio + '%';

        if (ratio > 50) {
            calculatedRatioDesc = '⚠️ Berisiko (>50%)';
            calculatedRatioColor = '#f87171';
        } else if (ratio > 30) {
            calculatedRatioDesc = 'Batas Wajar (30%-50%)';
            calculatedRatioColor = '#fbbf24';
        } else {
            calculatedRatioDesc = 'Sangat Sehat (<30%)';
            calculatedRatioColor = '#34d399';
        }
    } else {
        if (outstandingDebt > 0) {
            calculatedRatioStr = '⚠️ Bahaya';
            calculatedRatioDesc = 'Hutang Tanpa Aset';
            calculatedRatioColor = '#f87171';
        } else {
            calculatedRatioStr = '0%';
            calculatedRatioDesc = 'Sangat Sehat';
            calculatedRatioColor = '#34d399';
        }
    }

    if (cashflowDtaHero) {
        cashflowDtaHero.innerText = calculatedRatioStr;
        cashflowDtaHero.style.color = calculatedRatioColor;
    }
    if (cashflowDtaDescSub) {
        cashflowDtaDescSub.innerText = calculatedRatioDesc;
        cashflowDtaDescSub.style.color = calculatedRatioColor;
    }

    if (ratioEl) ratioEl.innerText = calculatedRatioStr;
    if (ratioDesc) {
        ratioDesc.innerText = calculatedRatioDesc;
        ratioDesc.style.color = calculatedRatioColor;
    }
    if (ratioBox && ratioEl) {
        ratioBox.style.borderColor = calculatedRatioColor;
        ratioEl.style.color = calculatedRatioColor;
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
                    <span class="flow-amount" style="color: var(--danger)">${formatRp(c.amount)} <span style="font-size:0.8rem; color:var(--text-muted); font-weight: 500;">(${percentage}%)</span></span>
                </div>
                <div class="flow-bar-bg">
                    <div class="flow-bar-fill" style="width: ${percentage}%; background-color: var(--danger);"></div>
                </div>
            </div>
        `;
        expenseContainer.innerHTML += itemHtml;
        expCount++;
    });
    if (expCount === 0) expenseContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; padding: 12px 0;">Tidak ada pengeluaran.</p>';

    let incCount = 0;
    for (let key in summary) {
        if (key.startsWith('income-')) {
            let name = key.replace('income-', '');
            incomeContainer.innerHTML += `<div class="flow-item" style="border-bottom: 1px solid var(--border); padding: 11px 0;"><div style="display:flex; justify-content:space-between; align-items:center;"><span class="flow-category">${name}</span><span class="flow-amount" style="color: var(--success); font-weight: 700;">${formatRp(summary[key])}</span></div></div>`;
            incCount++;
        }
    }
    if (incCount === 0) incomeContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; padding: 12px 0;">Tidak ada pemasukan.</p>';

    let debtCount = 0;
    for (let key in summary) {
        if (key.startsWith('debt-')) {
            let name = key.replace('debt-', '');
            debtContainer.innerHTML += `<div class="flow-item" style="border-bottom: 1px solid var(--border); padding: 11px 0;"><div style="display:flex; justify-content:space-between; align-items:center;"><span class="flow-category">${name}</span><span class="flow-amount" style="color: var(--purple); font-weight: 700;">${formatRp(summary[key])}</span></div></div>`;
            debtCount++;
        }
    }
    if (debtCount === 0) debtContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; padding: 12px 0;">Bersih! Tidak ada pinjaman diambil.</p>';

    // rendering Chart
    if (typeof Chart !== 'undefined') {
        if (typeof renderChart === 'function') renderChart(totalIncome, totalExpense, currentPeriodDebtTaken);
        if (typeof renderComparisonChart === 'function') renderComparisonChart(totalIncome + currentPeriodDebtTaken, totalExpense);
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

    if (typeof Chart !== 'undefined' && typeof renderDebtChart === 'function') {
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

    if (typeof Chart !== 'undefined' && typeof renderReceivablesChart === 'function') {
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

// --- DASHBOARD MATERIAL YOU / GOOGLE WALLET EXTRA HELPERS ---
function updateDashboardGreeting() {
    const greetingEl = document.getElementById('m3-greeting-text');
    const dateEl = document.getElementById('m3-date-chip');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greet = 'Selamat Datang 👋';
    if (hour >= 4 && hour < 11) greet = 'Selamat Pagi ☀️';
    else if (hour >= 11 && hour < 15) greet = 'Selamat Siang 🌤️';
    else if (hour >= 15 && hour < 18) greet = 'Selamat Sore 🌇';
    else greet = 'Selamat Malam 🌙';

    greetingEl.innerText = greet;

    if (dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        dateEl.innerText = new Date().toLocaleDateString('id-ID', options);
    }
}

function renderDashboardRecentTransactions() {
    const container = document.getElementById('dashboard-recent-transactions-list');
    if (!container) return;

    const recent = [...(state.transactions || [])]
        .sort((a, b) => (b.timestamp || b.id) - (a.timestamp || a.id))
        .slice(0, 4);

    if (recent.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 18px 10px; color: var(--text-muted); font-size: 0.84rem;">
                Belum ada transaksi tercatat. Mulai dengan tombol <strong>"Catat"</strong> di atas! ✍️
            </div>
        `;
        return;
    }

    let html = '';
    recent.forEach(t => {
        const isExp = t.mainType === 'expense';
        const isInc = t.mainType === 'income';
        const isTrf = t.mainType === 'transfer';
        const isDebt = t.mainType === 'debt';

        let color = 'var(--text-main)';
        let sign = '';
        if (isExp) { color = 'var(--danger)'; sign = '- '; }
        else if (isInc) { color = 'var(--success)'; sign = '+ '; }
        else if (isTrf) { color = 'var(--accent)'; sign = '⇄ '; }
        else if (isDebt) { color = 'var(--purple)'; sign = '• '; }

        const icon = typeof getCategoryIcon === 'function' ? getCategoryIcon(t.category, t.mainType) : '📝';
        const dispAmount = state.hideBalancesActive ? 'Rp ••••••' : `${sign}${formatRp(t.amount)}`;
        const dateStr = t.date || (typeof formatDateIndo === 'function' ? formatDateIndo(t.timestamp) : '');

        html += `
            <div class="m3-recent-item" onclick="openEditModal(${t.id})" title="Klik untuk ubah transaksi">
                <div class="m3-recent-icon-wrap">${icon}</div>
                <div class="m3-recent-info">
                    <span class="m3-recent-desc">${escapeHtml(t.desc || t.category)}</span>
                    <span class="m3-recent-sub">${escapeHtml(t.walletName || '')} • ${dateStr}</span>
                </div>
                <div class="m3-recent-amount" style="color: ${color};">${dispAmount}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.updateDashboardGreeting = updateDashboardGreeting;
window.renderDashboardRecentTransactions = renderDashboardRecentTransactions;
