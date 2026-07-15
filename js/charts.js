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
