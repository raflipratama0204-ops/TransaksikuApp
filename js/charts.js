// Render Donut Chart Cashflow Utama
function renderChart(totalIncome, totalExpense, currentPeriodDebtTaken) {
    const canvas = document.getElementById('cashflowChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (state.myChart) state.myChart.destroy();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#cbd5e1' : '#1e293b';
    const borderColor = isDark ? '#1e293b' : '#ffffff';

    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw: function (chart) {
            const width = chart.width;
            const height = chart.height;
            const ctx = chart.ctx;
            ctx.save();

            const meta = chart.getDatasetMeta(0);
            if (meta && meta.data && meta.data.length > 0) {
                const firstArc = meta.data[0];
                const centerX = firstArc.x;
                const centerY = firstArc.y;

                const net = totalIncome + currentPeriodDebtTaken - totalExpense;
                const netStr = formatRp(net);
                const labelColor = isDark ? '#94a3b8' : '#64748b';
                const valColor = net < 0 ? '#ef4444' : (net > 0 ? '#10b981' : (isDark ? '#60a5fa' : '#2563eb'));

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                const sizeFactor = Math.min(width, height) / 250;
                const labelSize = Math.max(11, Math.round(13 * sizeFactor));
                const valSize = Math.max(13, Math.round(16 * sizeFactor));

                ctx.font = `600 ${labelSize}px 'Inter', sans-serif`;
                ctx.fillStyle = labelColor;
                ctx.fillText("Arus Kas (Net)", centerX, centerY - (12 * sizeFactor));

                ctx.font = `800 ${valSize}px 'Inter', sans-serif`;
                ctx.fillStyle = valColor;
                ctx.fillText(netStr, centerX, centerY + (10 * sizeFactor));
            }
            ctx.restore();
        }
    };

    if (totalIncome === 0 && totalExpense === 0 && currentPeriodDebtTaken === 0) {
        state.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Belum ada data'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0, cutout: '72%' }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { enabled: false },
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, font: { family: 'Inter' } }
                    }
                }
            },
            plugins: [centerTextPlugin]
        });
        return;
    }

    state.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pemasukan Murni', 'Pengeluaran', 'Hutang Diambil'],
            datasets: [{
                data: [totalIncome, totalExpense, currentPeriodDebtTaken],
                backgroundColor: ['#10b981', '#ef4444', '#8b5cf6'],
                borderWidth: 2, borderColor: borderColor, hoverOffset: 6,
                cutout: '72%'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: 'Inter', weight: '600' }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}

// Menghitung data periode sebelumnya untuk perbandingan chart batang
function getPreviousPeriodTransactions() {
    const timeFilter = document.getElementById('time-filter').value || 'last_30_days';
    const specificMonthFilter = document.getElementById('specific-month-filter');
    const currentSpecificMonthVal = specificMonthFilter ? specificMonthFilter.value : '';

    const now = new Date();
    let startOfCurrent, endOfCurrent;
    let startOfPrev, endOfPrev;

    if (timeFilter === 'last_30_days') {
        endOfCurrent = new Date();
        startOfCurrent = new Date();
        startOfCurrent.setDate(now.getDate() - 30);

        endOfPrev = new Date(startOfCurrent);
        startOfPrev = new Date(startOfCurrent);
        startOfPrev.setDate(startOfPrev.getDate() - 30);
    } else if (timeFilter === 'mtd') {
        startOfCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
        endOfCurrent = new Date();

        startOfPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endOfPrev = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (timeFilter === 'specific_month' && currentSpecificMonthVal) {
        const parts = currentSpecificMonthVal.split('-');
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;
        startOfCurrent = new Date(y, m, 1);
        endOfCurrent = new Date(y, m + 1, 0, 23, 59, 59, 999);

        startOfPrev = new Date(y, m - 1, 1);
        endOfPrev = new Date(y, m, 0, 23, 59, 59, 999);
    } else if (timeFilter === 'last_3_months') {
        endOfCurrent = new Date();
        startOfCurrent = new Date();
        startOfCurrent.setMonth(now.getMonth() - 3);

        endOfPrev = new Date(startOfCurrent);
        startOfPrev = new Date(startOfCurrent);
        startOfPrev.setMonth(startOfPrev.getMonth() - 3);
    } else if (timeFilter === 'last_6_months') {
        endOfCurrent = new Date();
        startOfCurrent = new Date();
        startOfCurrent.setMonth(now.getMonth() - 6);

        endOfPrev = new Date(startOfCurrent);
        startOfPrev = new Date(startOfCurrent);
        startOfPrev.setMonth(startOfPrev.getMonth() - 6);
    } else if (timeFilter === 'ytd') {
        startOfCurrent = new Date(now.getFullYear(), 0, 1);
        endOfCurrent = new Date();

        startOfPrev = new Date(now.getFullYear() - 1, 0, 1);
        endOfPrev = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else {
        return { income: 0, expense: 0 };
    }

    let prevIncome = 0;
    let prevExpense = 0;

    const walletTypes = {};
    state.wallets.forEach(w => {
        walletTypes[w.id] = w.type;
    });

    state.transactions.forEach(t => {
        if (t.mainType === 'adjustment') return;
        const tDate = new Date(t.timestamp || t.id);

        if (tDate >= startOfPrev && tDate <= endOfPrev) {
            if (t.mainType === 'income') {
                if (walletTypes[t.walletId] === 'cash') prevIncome += t.amount;
            } else if (t.mainType === 'expense') {
                if (walletTypes[t.walletId] === 'cash') prevExpense += t.amount;
            } else if (t.mainType === 'transfer') {
                const fromType = walletTypes[t.fromId];
                const toType = walletTypes[t.toId];
                if (fromType === 'cash' && toType === 'invest') prevExpense += t.amount;
                else if (fromType === 'invest' && toType === 'cash') prevIncome += t.amount;
            }
        }
    });

    return { income: prevIncome, expense: prevExpense };
}

// Render Stacked Bar Chart Perbandingan Arus Kas
function renderComparisonChart(currIncome, currExpense) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (state.myComparisonChart) state.myComparisonChart.destroy();

    const prevData = getPreviousPeriodTransactions();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#cbd5e1' : '#1e293b';

    const timeFilter = document.getElementById('time-filter').value || 'last_30_days';
    let prevLabel = 'Periode Sebelumnya';
    let currLabel = 'Periode Aktif';
    if (timeFilter === 'last_30_days') {
        prevLabel = '30 Hari Sebelumnya';
        currLabel = '30 Hari Terakhir';
    } else if (timeFilter === 'mtd' || timeFilter === 'specific_month') {
        prevLabel = 'Bulan Sebelumnya';
        currLabel = 'Bulan Ini';
    } else if (timeFilter === 'last_3_months') {
        prevLabel = '3 Bulan Sebelumnya';
        currLabel = '3 Bulan Terakhir';
    } else if (timeFilter === 'last_6_months') {
        prevLabel = '6 Bulan Sebelumnya';
        currLabel = '6 Bulan Terakhir';
    } else if (timeFilter === 'ytd') {
        prevLabel = 'Tahun Sebelumnya';
        currLabel = 'Tahun Ini';
    }

    const chartTitleEl = document.getElementById('comparison-chart-title');
    if (chartTitleEl) {
        chartTitleEl.innerText = `Perbandingan dengan ${prevLabel}`;
    }

    state.myComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [prevLabel, currLabel],
            datasets: [
                {
                    label: 'Pemasukan',
                    data: [prevData.income, currIncome],
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                    borderWidth: 0,
                    stack: 'Stack 0'
                },
                {
                    label: 'Pengeluaran',
                    data: [prevData.expense, currExpense],
                    backgroundColor: '#ef4444',
                    borderRadius: 6,
                    borderWidth: 0,
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', size: 10 },
                        callback: function (value) {
                            return formatRp(value);
                        }
                    },
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    stacked: true,
                    ticks: {
                        color: textColor,
                        font: { family: 'Inter', weight: '600' }
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: 'Inter', weight: '600', size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${formatRp(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// Render Donut Chart Hutang Aktif
function renderDebtChart(bankOut, ccOut, persOut) {
    const canvas = document.getElementById('debtChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (state.myDebtChart) state.myDebtChart.destroy();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#cbd5e1' : '#1e293b';
    const borderColor = isDark ? '#1e293b' : '#ffffff';

    if (bankOut === 0 && ccOut === 0 && persOut === 0) {
        state.myDebtChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Tidak ada hutang aktif 🎉'],
                datasets: [{
                    data: [1],
                    backgroundColor: [isDark ? '#334155' : '#e2e8f0'],
                    borderWidth: 0,
                    cutout: '72%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { enabled: false },
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, font: { family: 'Inter', weight: '600' } }
                    }
                }
            }
        });
    } else {
        const centerDebtTextPlugin = {
            id: 'centerDebtText',
            beforeDraw: function (chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                ctx.save();

                const meta = chart.getDatasetMeta(0);
                if (meta && meta.data && meta.data.length > 0) {
                    const firstArc = meta.data[0];
                    const centerX = firstArc.x;
                    const centerY = firstArc.y;

                    const totalDebt = bankOut + ccOut + persOut;
                    const debtStr = formatRp(totalDebt);
                    const labelColor = isDark ? '#94a3b8' : '#64748b';
                    const valColor = '#8b5cf6';

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const sizeFactor = Math.min(width, height) / 250;
                    const labelSize = Math.max(11, Math.round(13 * sizeFactor));
                    const valSize = Math.max(12, Math.round(15 * sizeFactor));

                    ctx.font = `600 ${labelSize}px 'Inter', sans-serif`;
                    ctx.fillStyle = labelColor;
                    ctx.fillText("Sisa Utang", centerX, centerY - (12 * sizeFactor));

                    ctx.font = `800 ${valSize}px 'Inter', sans-serif`;
                    ctx.fillStyle = valColor;
                    ctx.fillText(debtStr, centerX, centerY + (10 * sizeFactor));
                }
                ctx.restore();
            }
        };

        state.myDebtChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Utang Bank', 'Paylater & KK', 'Teman & Keluarga'],
                datasets: [{
                    data: [bankOut, ccOut, persOut],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6'],
                    borderWidth: 2,
                    borderColor: borderColor,
                    hoverOffset: 6,
                    cutout: '72%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', weight: '600' }
                        }
                    }
                }
            },
            plugins: [centerDebtTextPlugin]
        });
    }
}

// Render Donut Chart Piutang Aktif
function renderReceivablesChart(persOut, bizOut) {
    const canvas = document.getElementById('receivablesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (state.myReceivablesChart) state.myReceivablesChart.destroy();

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#cbd5e1' : '#1e293b';
    const borderColor = isDark ? '#1e293b' : '#ffffff';

    if (persOut === 0 && bizOut === 0) {
        state.myReceivablesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Tidak ada piutang aktif 🎉'],
                datasets: [{
                    data: [1],
                    backgroundColor: [isDark ? '#334155' : '#e2e8f0'],
                    borderWidth: 0,
                    cutout: '72%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { enabled: false },
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, font: { family: 'Inter', weight: '600' } }
                    }
                }
            }
        });
    } else {
        const centerReceivablesTextPlugin = {
            id: 'centerReceivablesText',
            beforeDraw: function (chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                ctx.save();

                const meta = chart.getDatasetMeta(0);
                if (meta && meta.data && meta.data.length > 0) {
                    const firstArc = meta.data[0];
                    const centerX = firstArc.x;
                    const centerY = firstArc.y;

                    const totalReceivables = persOut + bizOut;
                    const receivablesStr = formatRp(totalReceivables);
                    const labelColor = isDark ? '#94a3b8' : '#64748b';
                    const valColor = '#10b981';

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    const sizeFactor = Math.min(width, height) / 250;
                    const labelSize = Math.max(11, Math.round(13 * sizeFactor));
                    const valSize = Math.max(12, Math.round(15 * sizeFactor));

                    ctx.font = `600 ${labelSize}px 'Inter', sans-serif`;
                    ctx.fillStyle = labelColor;
                    ctx.fillText("Sisa Piutang", centerX, centerY - (12 * sizeFactor));

                    ctx.font = `800 ${valSize}px 'Inter', sans-serif`;
                    ctx.fillStyle = valColor;
                    ctx.fillText(receivablesStr, centerX, centerY + (10 * sizeFactor));
                }
                ctx.restore();
            }
        };

        state.myReceivablesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Piutang Pribadi', 'Piutang Usaha'],
                datasets: [{
                    data: [persOut, bizOut],
                    backgroundColor: ['#10b981', '#06b6d4'],
                    borderWidth: 2,
                    borderColor: borderColor,
                    hoverOffset: 6,
                    cutout: '72%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', weight: '600' }
                        }
                    }
                }
            },
            plugins: [centerReceivablesTextPlugin]
        });
    }
}

// ============================================================
// DASHBOARD CASH MOVEMENT LINE CHART (GRAFIK PERGERAKAN UANG)
// ============================================================
let currentDashboardChartRange = 30;

function setDashboardChartRange(range, btnEl) {
    currentDashboardChartRange = range;
    const switcher = document.getElementById('dashboard-chart-range-switcher');
    if (switcher) {
        switcher.querySelectorAll('.chart-range-btn').forEach(b => {
            b.classList.toggle('active', b === btnEl);
        });
    }
    renderDashboardCashMovementChart();
}

function renderDashboardCashMovementChart() {
    const canvas = document.getElementById('cashMovementChart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    if (state.myDashboardCashChart) {
        try {
            state.myDashboardCashChart.destroy();
        } catch (e) {}
        state.myDashboardCashChart = null;
    }

    const isDark = document.body.classList.contains('dark-theme');
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let numDays = 30;
    if (currentDashboardChartRange === 7) {
        numDays = 7;
    } else if (currentDashboardChartRange === 'all') {
        let earliest = now;
        (state.transactions || []).forEach(t => {
            const d = new Date(t.timestamp || t.id);
            if (!isNaN(d.getTime()) && d < earliest) earliest = d;
        });
        const diffTime = Math.abs(now - earliest);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        numDays = Math.max(7, Math.min(diffDays + 1, 365));
    }

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (numDays - 1), 0, 0, 0, 0);

    // Calculate current total balance from all active wallets
    let currentTotal = 0;
    (state.wallets || []).forEach(w => {
        currentTotal += Number(w.balance) || 0;
    });

    // Group transactions by day and calculate total in/out for the period
    let totalInPeriod = 0;
    let totalOutPeriod = 0;
    const dailyDeltas = {}; // key: 'YYYY-MM-DD' => delta

    (state.transactions || []).forEach(t => {
        const tDate = new Date(t.timestamp || t.id);
        if (isNaN(tDate.getTime())) return;

        const y = tDate.getFullYear();
        const m = String(tDate.getMonth() + 1).padStart(2, '0');
        const d = String(tDate.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;

        const amt = Number(t.amount) || 0;
        let delta = 0;

        if (t.mainType === 'income' || t.mainType === 'receivables') {
            delta = amt;
            if (tDate >= startDate && tDate <= now) totalInPeriod += amt;
        } else if (t.mainType === 'expense') {
            delta = -amt;
            if (tDate >= startDate && tDate <= now) totalOutPeriod += amt;
        } else if (t.mainType === 'debt') {
            delta = amt;
            if (tDate >= startDate && tDate <= now) totalInPeriod += amt;
        } else if (t.mainType === 'adjustment') {
            if (t.category === 'Koreksi (+)' || t.category === 'Saldo Awal') {
                delta = amt;
                if (tDate >= startDate && tDate <= now) totalInPeriod += amt;
            } else {
                delta = -amt;
                if (tDate >= startDate && tDate <= now) totalOutPeriod += amt;
            }
        }

        dailyDeltas[dateKey] = (dailyDeltas[dateKey] || 0) + delta;
    });

    // Build day sequence from startDate to today
    const days = [];
    const dateLabels = [];
    const fullDateLabels = [];
    let iter = new Date(startDate);
    while (iter <= now) {
        const y = iter.getFullYear();
        const m = String(iter.getMonth() + 1).padStart(2, '0');
        const d = String(iter.getDate()).padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;
        days.push(dateKey);

        const shortLabel = iter.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        dateLabels.push(shortLabel);

        const fullLabel = iter.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        fullDateLabels.push(fullLabel);

        iter.setDate(iter.getDate() + 1);
    }

    // Work backwards from currentTotal to reconstruct running balance at end of each day
    const balances = new Array(days.length);
    let running = currentTotal;

    for (let i = days.length - 1; i >= 0; i--) {
        balances[i] = running;
        const key = days[i];
        const dayDelta = dailyDeltas[key] || 0;
        running = running - dayDelta;
    }

    const startBalance = (balances.length > 1) ? balances[0] : currentTotal;
    const endBalance = currentTotal;
    const netChange = endBalance - startBalance;

    let percentChange = 0;
    if (startBalance > 0) {
        percentChange = ((endBalance - startBalance) / startBalance) * 100;
    } else if (startBalance === 0) {
        percentChange = endBalance > 0 ? 100 : (endBalance < 0 ? -100 : 0);
    } else {
        percentChange = ((endBalance - startBalance) / Math.abs(startBalance)) * 100;
    }

    // Update UI elements
    const pctBadge = document.getElementById('dashboard-chart-pct-badge');
    const nominalSub = document.getElementById('dashboard-chart-nominal-sub');
    const totalInEl = document.getElementById('dashboard-chart-total-in');
    const totalOutEl = document.getElementById('dashboard-chart-total-out');

    let lineColor = '#228b5b';
    let gradTop = 'rgba(34, 139, 91, 0.22)';

    if (pctBadge) {
        if (netChange > 0) {
            pctBadge.className = 'apple-trend-pill positive';
            pctBadge.innerText = `↗ +${Math.abs(percentChange).toFixed(1)}%`;
            lineColor = '#228b5b';
            gradTop = 'rgba(34, 139, 91, 0.25)';
        } else if (netChange < 0) {
            pctBadge.className = 'apple-trend-pill negative';
            pctBadge.innerText = `↘ -${Math.abs(percentChange).toFixed(1)}%`;
            lineColor = '#ba1a1a';
            gradTop = 'rgba(186, 26, 26, 0.25)';
        } else {
            pctBadge.className = 'apple-trend-pill neutral';
            pctBadge.innerText = `0.0% Stabil`;
            lineColor = '#6750a4';
            gradTop = 'rgba(103, 80, 164, 0.25)';
        }
    }

    if (nominalSub) {
        const sign = netChange > 0 ? '+' : (netChange < 0 ? '-' : '');
        const rangeText = currentDashboardChartRange === 'all' ? 'semua waktu' : `${numDays} hari terakhir`;
        const dispNet = state.hideBalancesActive ? 'Rp ••••••' : `${sign}${formatRp(Math.abs(netChange))}`;
        nominalSub.innerText = `${dispNet} (${rangeText})`;
    }

    if (totalInEl) totalInEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalInPeriod);
    if (totalOutEl) totalOutEl.innerText = state.hideBalancesActive ? 'Rp ••••••' : formatRp(totalOutPeriod);

    // Create chart gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, gradTop);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    state.myDashboardCashChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                data: balances,
                borderColor: lineColor,
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointRadius: numDays <= 7 ? 4 : 0,
                pointHoverRadius: 6,
                pointBackgroundColor: isDark ? '#1d2026' : '#ffffff',
                pointBorderColor: lineColor,
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1d2026' : '#ffffff',
                    titleColor: isDark ? '#e2e2e6' : '#191c20',
                    bodyColor: isDark ? '#c4c6d0' : '#44474f',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 16,
                    displayColors: false,
                    callbacks: {
                        title: (items) => {
                            const idx = items[0].dataIndex;
                            return fullDateLabels[idx] || '';
                        },
                        label: (item) => {
                            if (state.hideBalancesActive) return 'Saldo: Rp ••••••';
                            return 'Saldo: ' + formatRp(item.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: isDark ? '#8e9099' : '#74777f',
                        font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 10 },
                        maxTicksLimit: numDays <= 7 ? 7 : (numDays <= 30 ? 6 : 8)
                    }
                },
                y: {
                    grid: {
                        color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#8e9099' : '#74777f',
                        font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 10 },
                        maxTicksLimit: 4,
                        callback: (val) => {
                            if (state.hideBalancesActive) return '•••';
                            if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                            if (Math.abs(val) >= 1000) return (val / 1000).toFixed(0) + 'k';
                            return val;
                        }
                    }
                }
            }
        }
    });
}
