

        // PENDAFTARAN SERVICE WORKER UNTUK STABILITAS OFFLINE / HOME SCREEN
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => console.log('Service Worker aktif!', reg.scope))
                    .catch(err => console.log('Service Worker bermasalah:', err));
            });
        }

        let wallets = JSON.parse(localStorage.getItem('keuangan_wallets28')) || [
            { id: 1, name: 'Dompet Tunai', balance: 0, type: 'cash' },
            { id: 2, name: 'Rekening Bank', balance: 0, type: 'cash' },
            { id: 3, name: 'Portofolio Saham', balance: 0, type: 'invest' }
        ];
        let transactions = JSON.parse(localStorage.getItem('keuangan_transactions28')) || [];
        let myChart = null;
        let hideBalancesActive = localStorage.getItem('transaksiku_hide_balances') === 'true';

        const formatRp = (angka) => {
            const currency = localStorage.getItem('transaksiku_currency') || 'Rp';
            if (currency === 'Rp') {
                return 'Rp ' + Math.round(angka).toLocaleString('id-ID');
            } else if (currency === '$') {
                return '$' + angka.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            } else if (currency === 'S$') {
                return 'S$ ' + angka.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            } else if (currency === '€') {
                return '€' + angka.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            } else if (currency === '¥') {
                return '¥' + angka.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            } else {
                return currency + ' ' + angka.toLocaleString('id-ID');
            }
        };

        function playClickSound() {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);

                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } catch (e) {
                console.warn("Web Audio API blocked or not supported:", e);
            }
        }

        function showToast(message) {
            let styleId = 'toast-notification-styles';
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.innerHTML = `
                    .toast-container {
                        position: fixed;
                        top: 25px;
                        left: 50%;
                        transform: translateX(-50%) translateY(-20px);
                        background: rgba(15, 23, 42, 0.9);
                        backdrop-filter: blur(8px);
                        color: #ffffff;
                        padding: 12px 24px;
                        border-radius: 14px;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
                        z-index: 9999999;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-weight: 600;
                        font-size: 0.95rem;
                        opacity: 0;
                        transition: opacity 0.3s, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                        pointer-events: none;
                        border: 1px solid rgba(255, 255, 255, 0.15);
                    }
                    .toast-container.show {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    .toast-icon {
                        color: var(--success);
                        font-size: 1.2rem;
                    }
                    body.dark-theme .toast-container {
                        background: rgba(30, 41, 59, 0.95);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                    }
                `;
                document.head.appendChild(style);
            }

            const toast = document.createElement('div');
            toast.className = 'toast-container';
            toast.innerHTML = `<span>${message}</span>`;
            document.body.appendChild(toast);

            toast.offsetHeight; // Force reflow
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 2500);
        }

        function showMetricInfo(type, event) {
            if (event) event.stopPropagation();

            const button = event ? event.currentTarget : null;
            if (!button) return;

            // If it's a click event and the tooltip is already open, close it.
            // If it's a mouseenter (hover) event and the tooltip is already open, do nothing (keep it open).
            const existingTooltip = document.querySelector(`.metric-tooltip[data-type="${type}"]`);
            if (existingTooltip) {
                if (event && event.type === 'click') {
                    existingTooltip.classList.remove('show');
                    setTimeout(() => existingTooltip.remove(), 200);
                }
                return;
            }

            // Close any other open tooltips
            document.querySelectorAll('.metric-tooltip').forEach(el => {
                el.classList.remove('show');
                setTimeout(() => el.remove(), 200);
            });

            // Get text based on type
            let text = "";
            if (type === 'income') {
                text = "Total seluruh aliran kas masuk ke dompet aktif Anda, termasuk pendapatan murni (Gaji, Bisnis, Hasil Investasi) serta pinjaman/hutang yang diambil dalam periode filter.";
            } else if (type === 'expense') {
                text = "Total seluruh aliran kas keluar dari dompet aktif Anda, termasuk pengeluaran biaya harian, pembayaran hutang/cicilan, serta pemindahan dana ke dompet investasi dalam periode filter.";
            } else if (type === 'outstanding_debt') {
                text = "Total sisa kewajiban hutang aktif yang belum dibayar. Dihitung dari akumulasi seluruh pinjaman yang pernah diambil dikurangi seluruh pelunasan yang pernah dibayar.";
            } else if (type === 'dta_ratio') {
                text = "Debt to Asset Ratio (DTA) menunjukkan persentase aset Anda yang didanai oleh hutang. Dihitung dengan rumus:\n\n(Sisa Hutang / Total Aset) x 100\n\nKlasifikasi Keamanan:\n- Dibawah 30%: Sangat Sehat\n- 30% s.d 50%: Batas Wajar\n- Diatas 50%: Berisiko Tinggi";
            }

            // Create tooltip element
            const tooltip = document.createElement('div');
            tooltip.className = 'metric-tooltip';
            tooltip.dataset.type = type;
            tooltip.innerText = text;

            // Close button inside tooltip
            const closeBtn = document.createElement('span');
            closeBtn.innerText = '×';
            closeBtn.style.cssText = 'float: right; cursor: pointer; font-weight: bold; font-size: 14px; margin-left: 10px; color: var(--text-muted); line-height: 1;';
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                tooltip.classList.remove('show');
                setTimeout(() => tooltip.remove(), 200);
            };
            tooltip.insertBefore(closeBtn, tooltip.firstChild);

            // Prevent tooltip clicks from closing itself (by propagation)
            tooltip.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Append to body to avoid overflow clipping issues
            document.body.appendChild(tooltip);

            // Position calculation
            const rect = button.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            const tooltipWidth = 240;
            let leftPos = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);

            // Prevent going off left edge
            if (leftPos < 10) {
                leftPos = 10;
            }
            // Prevent going off right edge
            const maxLeft = window.innerWidth + scrollLeft - tooltipWidth - 10;
            if (leftPos > maxLeft) {
                leftPos = maxLeft;
            }

            tooltip.style.left = leftPos + 'px';
            tooltip.style.top = (rect.bottom + scrollTop + 6) + 'px';

            // Force reflow and show
            tooltip.offsetHeight;
            tooltip.classList.add('show');
        }

        function hideMetricInfo(type, event) {
            if (event) event.stopPropagation();
            const existingTooltip = document.querySelector(`.metric-tooltip[data-type="${type}"]`);
            if (existingTooltip) {
                existingTooltip.classList.remove('show');
                setTimeout(() => existingTooltip.remove(), 200);
            }
        }

        // Close all tooltips on click anywhere on document
        document.addEventListener('click', () => {
            document.querySelectorAll('.metric-tooltip').forEach(el => {
                el.classList.remove('show');
                setTimeout(() => el.remove(), 200);
            });
        });

        function formatCurrencyInput(input) {
            let val = input.value;
            let isNegative = val.startsWith('-');
            let cleanVal = val.replace(/[^0-9]/g, '');
            if (cleanVal) {
                let formatted = new Intl.NumberFormat('id-ID').format(cleanVal);
                input.value = isNegative ? '-' + formatted : formatted;
            } else {
                input.value = isNegative ? '-' : '';
            }
        }

        function parseCurrencyValue(value) {
            if (!value) return 0;
            let strVal = value.toString();
            let isNegative = strVal.startsWith('-');
            let cleanVal = strVal.replace(/[^0-9]/g, '');
            let parsed = parseFloat(cleanVal) || 0;
            return isNegative ? -parsed : parsed;
        }

        function showModal({ type, title, message, defaultValue = '', isCurrency = false }) {
            return new Promise((resolve) => {
                const overlay = document.getElementById('custom-modal');
                const titleEl = document.getElementById('modal-title');
                const messageEl = document.getElementById('modal-message');
                const inputEl = document.getElementById('modal-input');
                const btnCancel = document.getElementById('modal-btn-cancel');
                const btnConfirm = document.getElementById('modal-btn-confirm');

                titleEl.innerText = title || 'Informasi';
                messageEl.innerText = message;

                inputEl.style.display = 'none';
                btnCancel.style.display = 'none';
                inputEl.value = '';
                inputEl.oninput = null;

                if (type === 'prompt') {
                    inputEl.style.display = 'block';
                    if (isCurrency) {
                        inputEl.value = new Intl.NumberFormat('id-ID').format(parseCurrencyValue(defaultValue));
                        inputEl.oninput = function () { formatCurrencyInput(this); };
                    } else {
                        inputEl.value = defaultValue;
                    }
                    btnCancel.style.display = 'block';
                    setTimeout(() => inputEl.focus(), 100);
                } else if (type === 'confirm') {
                    btnCancel.style.display = 'block';
                }

                overlay.classList.add('active');

                const closeAndResolve = (result) => {
                    overlay.classList.remove('active');
                    btnConfirm.onclick = null;
                    btnCancel.onclick = null;
                    resolve(result);
                };

                btnConfirm.onclick = () => {
                    if (type === 'prompt') closeAndResolve(inputEl.value);
                    else closeAndResolve(true);
                };
                btnCancel.onclick = () => {
                    if (type === 'prompt') closeAndResolve(null);
                    else closeAndResolve(false);
                };
            });
        }

        const customAlert = (msg, title = 'Perhatian') => showModal({ type: 'alert', message: msg, title: title });
        const customConfirm = (msg, title = 'Konfirmasi') => showModal({ type: 'confirm', message: msg, title: title });
        const customPrompt = (msg, def, title = 'Input', isCurrency = false) => showModal({ type: 'prompt', message: msg, defaultValue: def, title: title, isCurrency: isCurrency });

        function setDefaultDate() {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            document.getElementById('trans-date').value = `${yyyy}-${mm}-${dd}`;
        }

        function toggleAddWalletForm() {
            const container = document.getElementById('add-wallet-container');
            container.style.display = (container.style.display === 'none' || container.style.display === '') ? 'block' : 'none';
        }

        function toggleWalletMenu(id) {
            document.querySelectorAll('.wallet-dropdown').forEach(el => {
                if (el.id !== `w-menu-${id}`) el.style.display = 'none';
            });
            const menu = document.getElementById(`w-menu-${id}`);
            menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
        }

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.wallet-menu-container')) {
                document.querySelectorAll('.wallet-dropdown').forEach(el => el.style.display = 'none');
            }
        });

        function updateCategoryOptions() {
            const mainType = document.getElementById('trans-main-type').value;
            const categorySelect = document.getElementById('trans-category');
            const fieldsContainer = document.getElementById('trans-fields-container');

            if (!mainType) {
                if (fieldsContainer) fieldsContainer.style.display = 'none';
                return;
            }
            if (fieldsContainer) fieldsContainer.style.display = 'block';

            categorySelect.innerHTML = '';

            if (mainType === 'expense') {
                categorySelect.innerHTML = `
                <option value="Makanan">🍔 Makanan & Minuman</option>
                <option value="Hiburan">🎬 Hiburan & Rekreasi</option>
                <option value="Pendidikan">📚 Pendidikan / Kursus</option>
                <option value="Belanja">🛒 Belanja Bulanan / Keperluan</option>
                <option value="Transportasi">🚗 Transportasi / Bensin</option>
                <option value="Tagihan">💡 Tagihan / Listrik / Operasional</option>
                <option value="Bayar Pinjaman Bank" style="font-weight: bold;">🏦 Bayar Pinjaman Bank</option>
                <option value="Bayar Kartu Kredit" style="font-weight: bold;">💳 Bayar Paylater / Kartu Kredit</option>
                <option value="Bayar Pinjaman Pribadi" style="font-weight: bold;">🤝 Bayar Pinjaman Teman / Keluarga</option>
                <option value="Kerugian Investasi" style="color:var(--danger); font-weight:bold;">📉 Kerugian Investasi (Cut Loss)</option>
                <option value="Kesehatan">💊 Kesehatan / Medis</option>
                <option value="Biaya Admin Kartu Debit">💳 Biaya Admin Kartu Debit</option>
                <option value="Lainnya">💸 Pengeluaran Lain</option>
            `;
            } else if (mainType === 'income') {
                categorySelect.innerHTML = `
                <option value="Gaji">💰 Gaji / Omzet Bisnis</option>
                <option value="Keuntungan Investasi" style="color:var(--success); font-weight:bold;">📈 Keuntungan Investasi (Profit/Dividen)</option>
                <option value="Penerimaan Pelunasan Piutang Pribadi" style="color:var(--success); font-weight:bold;">🤝 Penerimaan Pelunasan Piutang Pribadi</option>
                <option value="Penerimaan Pelunasan Piutang Usaha" style="color:var(--success); font-weight:bold;">💼 Penerimaan Pelunasan Piutang Usaha</option>
                <option value="Lainnya">💵 Pemasukan Lain-lain</option>
            `;
            } else if (mainType === 'debt') {
                categorySelect.innerHTML = `
                <option value="Pinjaman Bank">🏦 Pinjaman Bank / KTA</option>
                <option value="Kartu Kredit">💳 Paylater / Kartu Kredit</option>
                <option value="Pinjaman Pribadi">🤝 Pinjaman Teman / Keluarga</option>
            `;
            } else if (mainType === 'receivables') {
                categorySelect.innerHTML = `
                <option value="Piutang Pribadi">🤝 Pinjaman Teman / Keluarga</option>
                <option value="Piutang Usaha">💼 Pinjaman Operasional Bisnis</option>
            `;
            } else if (mainType === 'transfer') {
                categorySelect.innerHTML = `
                <option value="Mutasi">🔄 Mutasi Kas (Tarik / Setor Tunai)</option>
                <option value="Investasi">🏦 Top Up Portofolio (Beli Saham/Reksa Dana)</option>
            `;
            }

            // Append custom categories
            const customCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [];
            const customOptions = customCategories
                .filter(cat => cat.type === mainType)
                .map(cat => `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`)
                .join('');
            categorySelect.innerHTML += customOptions;

            toggleTransferFields();
        }

        function generateDynamicFilters() {
            const timeFilter = document.getElementById('time-filter');
            const catFilter = document.getElementById('category-filter');
            const specificMonthFilter = document.getElementById('specific-month-filter');
            const specificMonthContainer = document.getElementById('specific-month-container');

            let currentTimeVal = timeFilter.value || 'last_30_days';
            let currentSpecificMonthVal = specificMonthFilter ? specificMonthFilter.value : '';
            const currentCatVal = catFilter.value || 'all';

            let monthsSet = new Set();
            transactions.forEach(t => {
                const d = new Date(t.timestamp || t.id);
                monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
            });

            let sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).slice(0, 12);

            let timeOptions = `
                <option value="last_30_days">1 Bulan Terakhir</option>
                <option value="mtd">Bulan Ini (MTD)</option>
                <option value="last_3_months">3 Bulan Terakhir</option>
                <option value="last_6_months">6 Bulan Terakhir</option>
                <option value="ytd">Tahun Ini (YTD)</option>
                <option value="all">Semua Waktu (All Time)</option>
            `;

            if (sortedMonths.length > 0) {
                timeOptions += `<option value="specific_month">Pilih Bulan Spesifik... 📅</option>`;
            }

            timeFilter.innerHTML = timeOptions;

            const isSpecificMonthVal = sortedMonths.includes(currentTimeVal);
            if (isSpecificMonthVal) {
                currentSpecificMonthVal = currentTimeVal;
                currentTimeVal = 'specific_month';
            }

            if (timeFilter.querySelector(`option[value="${currentTimeVal}"]`)) {
                timeFilter.value = currentTimeVal;
            } else {
                timeFilter.value = 'last_30_days';
            }

            if (sortedMonths.length > 0 && specificMonthFilter) {
                let monthOptions = '';
                sortedMonths.forEach(mStr => {
                    const [y, m] = mStr.split('-');
                    const dLabel = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                    monthOptions += `<option value="${mStr}">${dLabel}</option>`;
                });
                specificMonthFilter.innerHTML = monthOptions;

                if (currentSpecificMonthVal && specificMonthFilter.querySelector(`option[value="${currentSpecificMonthVal}"]`)) {
                    specificMonthFilter.value = currentSpecificMonthVal;
                }
            }

            if (timeFilter.value === 'specific_month') {
                specificMonthContainer.style.display = 'block';
            } else {
                specificMonthContainer.style.display = 'none';
            }

            let catOptions = `<option value="all">Kategori: Semua</option>`;
            let catSet = new Set();

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            transactions.forEach(t => {
                if (t.mainType === 'adjustment') return;

                const tDate = new Date(t.timestamp || t.id);
                const tMonth = tDate.getMonth();
                const tYear = tDate.getFullYear();

                if (currentTimeVal === 'this_month') {
                    if (tMonth !== currentMonth || tYear !== currentYear) return;
                } else if (currentTimeVal === 'mtd') {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    if (tDate < startOfMonth || tDate > today) return;
                } else if (currentTimeVal === 'last_30_days') {
                    let d = new Date(); d.setMonth(now.getMonth() - 1);
                    if (tDate < d) return;
                } else if (currentTimeVal === 'last_month') {
                    let lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    let lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    if (tMonth !== lastMonth || tYear !== lastYear) return;
                } else if (currentTimeVal === 'last_3_months') {
                    let d = new Date(); d.setMonth(now.getMonth() - 3);
                    if (tDate < d) return;
                } else if (currentTimeVal === 'last_6_months') {
                    let d = new Date(); d.setMonth(now.getMonth() - 6);
                    if (tDate < d) return;
                } else if (currentTimeVal === 'ytd') {
                    if (tYear !== currentYear) return;
                } else if (currentTimeVal === 'specific_month' && currentSpecificMonthVal) {
                    const parts = currentSpecificMonthVal.split('-');
                    if (parts.length === 2) {
                        const y = parseInt(parts[0]);
                        const m = parseInt(parts[1]) - 1;
                        if (tYear !== y || tMonth !== m) return;
                    }
                } else if (currentTimeVal !== 'all' && currentTimeVal !== 'specific_month') {
                    const parts = currentTimeVal.split('-');
                    if (parts.length === 2) {
                        const y = parseInt(parts[0]);
                        const m = parseInt(parts[1]) - 1;
                        if (tYear !== y || tMonth !== m) return;
                    }
                }

                catSet.add(t.category);
            });

            Array.from(catSet).sort().forEach(c => {
                catOptions += `<option value="${c}">${c}</option>`;
            });
            catFilter.innerHTML = catOptions;
            if (catFilter.querySelector(`option[value="${currentCatVal}"]`)) {
                catFilter.value = currentCatVal;
            } else {
                catFilter.value = 'all';
            }
        }

        function handleTimeFilterChange() {
            const timeFilter = document.getElementById('time-filter');
            const specificMonthContainer = document.getElementById('specific-month-container');

            if (timeFilter.value === 'specific_month') {
                specificMonthContainer.style.display = 'block';
            } else {
                specificMonthContainer.style.display = 'none';
            }
            applyFilter();
        }

        function toggleSidebar() {
            const drawer = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            drawer.classList.toggle('open');
            backdrop.classList.toggle('show');
        }

        function navigateTo(viewId) {
            const currentView = document.querySelector('.app-view.active');
            const targetView = document.getElementById('view-' + viewId);

            if (currentView === targetView) return; // Already on this view

            // Tampilkan/sembunyikan global filter card
            const globalFilter = document.getElementById('global-filter-card');
            if (viewId === 'dashboard' || viewId === 'debt' || viewId === 'receivables') {
                globalFilter.style.display = 'none';
            } else {
                globalFilter.style.display = 'block';
            }

            // Update status aktif di menu bottom nav
            document.querySelectorAll('.bottom-nav-item').forEach(el => {
                el.classList.remove('active');
            });
            const activeBottomBtn = document.getElementById('bottom-nav-' + viewId);
            if (activeBottomBtn) {
                activeBottomBtn.classList.add('active');
            }

            // Tutup sidebar drawer setelah navigasi
            const drawer = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            drawer.classList.remove('open');
            backdrop.classList.remove('show');

            // Pemicu rendering grafik Chart.js jika beralih ke Laporan Arus Kas, Hutang, atau Piutang
            if (viewId === 'cashflow' || viewId === 'debt' || viewId === 'receivables') {
                setTimeout(() => {
                    applyFilter();
                }, 300);
            } else {
                applyFilter();
            }

            if (currentView) {
                // Fade out current view
                currentView.classList.remove('visible');

                setTimeout(() => {
                    currentView.classList.remove('active');
                    currentView.style.display = 'none';

                    // Show new view
                    targetView.style.display = 'block';
                    targetView.classList.add('active');

                    // Force reflow
                    targetView.offsetHeight;

                    targetView.classList.add('visible');
                }, 250);
            } else {
                // Fallback jika tidak ada view aktif awal
                targetView.style.display = 'block';
                targetView.classList.add('active');
                targetView.offsetHeight;
                targetView.classList.add('visible');
            }
        }

        function getFilteredTransactions() {
            let timeVal = document.getElementById('time-filter').value;
            if (timeVal === 'specific_month') {
                const specificMonthFilter = document.getElementById('specific-month-filter');
                timeVal = specificMonthFilter ? specificMonthFilter.value : 'all';
            }
            const catVal = document.getElementById('category-filter').value;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            return transactions.filter(t => {
                const tDate = new Date(t.timestamp || t.id);
                const tMonth = tDate.getMonth();
                const tYear = tDate.getFullYear();

                if (catVal !== 'all' && t.category !== catVal) return false;

                if (timeVal === 'this_month') {
                    if (tMonth !== currentMonth || tYear !== currentYear) return false;
                } else if (timeVal === 'mtd') {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    if (tDate < startOfMonth || tDate > today) return false;
                } else if (timeVal === 'last_30_days') {
                    let d = new Date(); d.setMonth(now.getMonth() - 1);
                    if (tDate < d) return false;
                } else if (timeVal === 'last_month') {
                    let lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                    let lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                    if (tMonth !== lastMonth || tYear !== lastYear) return false;
                } else if (timeVal === 'last_3_months') {
                    let d = new Date(); d.setMonth(now.getMonth() - 3);
                    if (tDate < d) return false;
                } else if (timeVal === 'last_6_months') {
                    let d = new Date(); d.setMonth(now.getMonth() - 6);
                    if (tDate < d) return false;
                } else if (timeVal === 'ytd') {
                    if (tYear !== currentYear) return false;
                } else if (timeVal !== 'all') {
                    const parts = timeVal.split('-');
                    if (parts.length === 2) {
                        const y = parseInt(parts[0]);
                        const m = parseInt(parts[1]) - 1;
                        if (tYear !== y || tMonth !== m) return false;
                    }
                }

                return true;
            });
        }

        function applyFilter() {
            generateDynamicFilters();
            renderTransactions();
            calculateCashflow();
            renderDebtChartAndBreakdown();
            renderReceivablesChartAndBreakdown();
        }

        function updateSummaries() {
            let totalCash = 0; let totalInvest = 0;
            wallets.forEach(w => {
                if (w.type === 'invest') totalInvest += w.balance;
                else totalCash += w.balance;
            });
            document.getElementById('sum-total').innerText = hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash + totalInvest);
            document.getElementById('sum-cash').innerText = hideBalancesActive ? 'Rp ••••••' : formatRp(totalCash);
            document.getElementById('sum-portfolio').innerText = hideBalancesActive ? 'Rp ••••••' : formatRp(totalInvest);
        }

        function renderWallets() {
            const list = document.getElementById('wallet-list');
            const selectSingle = document.getElementById('trans-wallet');
            const selectFrom = document.getElementById('trans-from');
            const selectTo = document.getElementById('trans-to');

            list.innerHTML = ''; selectSingle.innerHTML = ''; selectFrom.innerHTML = ''; selectTo.innerHTML = '';

            wallets.forEach(w => {
                const typeClass = w.type === 'invest' ? 'invest-type' : 'cash-type';
                const typeLabel = w.type === 'invest' ? 'Investasi' : 'Kas & Bank';
                const displayBalance = hideBalancesActive ? 'Rp ••••••' : formatRp(w.balance);

                list.innerHTML += `
                <div class="wallet-item ${typeClass}">
                    <div class="w-info">
                        <h4>${w.name}</h4>
                        <p>${typeLabel}</p>
                    </div>
                    <div class="w-balance">
                        <span class="w-balance-val">${displayBalance}</span>
                        <div class="wallet-menu-container">
                            <button onclick="toggleWalletMenu(${w.id})" class="btn-option">Opsi ▼</button>
                            <div id="w-menu-${w.id}" class="wallet-dropdown" style="display:none;">
                                <button onclick="editWalletName(${w.id}); toggleWalletMenu(${w.id})">✏️ Ubah Nama</button>
                                <button onclick="editWalletBalance(${w.id}); toggleWalletMenu(${w.id})">⚙️ Koreksi Saldo</button>
                                <button onclick="deleteWallet(${w.id}); toggleWalletMenu(${w.id})" style="color:var(--danger);">🗑️ Hapus Akun</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

                const option = `<option value="${w.id}">${w.name}</option>`;
                selectSingle.innerHTML += option; selectFrom.innerHTML += option; selectTo.innerHTML += option;
            });
            updateSummaries();
            if (document.getElementById('trans-main-type').value === 'transfer') {
                toggleTransferFields();
            }
        }

        async function editWalletBalance(id) {
            let w = wallets.find(wallet => wallet.id === id);
            if (w) {
                let newBalanceStr = await customPrompt(`Masukkan saldo aktual untuk dompet '${w.name}':`, w.balance.toString(), 'Koreksi Saldo', true);
                if (newBalanceStr !== null && newBalanceStr.trim() !== "") {
                    let newBalance = parseCurrencyValue(newBalanceStr);
                    if (!isNaN(newBalance) && newBalance !== w.balance) {
                        let diff = newBalance - w.balance;
                        w.balance = newBalance;

                        const dateObj = new Date();
                        const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

                        transactions.push({
                            id: Date.now(), timestamp: dateObj.getTime(), date: dateStr,
                            desc: 'Koreksi Saldo Manual',
                            mainType: 'adjustment',
                            category: diff > 0 ? 'Koreksi (+)' : 'Koreksi (-)',
                            amount: Math.abs(diff), walletName: w.name, walletId: w.id
                        });

                        saveData();
                        customAlert(`Saldo ${w.name} berhasil diperbarui.\nSelisih otomatis tercatat sebagai penyesuaian di riwayat.`, 'Sukses');
                    }
                }
            }
        }

        async function editWalletName(id) {
            let w = wallets.find(wallet => wallet.id === id);
            if (w) {
                let newName = await customPrompt(`Ubah nama untuk dompet '${w.name}':`, w.name, 'Ganti Nama', false);
                if (newName && newName.trim() !== "") { w.name = newName.trim(); saveData(); }
            }
        }

        async function deleteWallet(id) {
            let w = wallets.find(wallet => wallet.id === id);
            if (!w) return;

            if (w.balance !== 0) {
                await customAlert(`Dompet [${w.name}] tidak bisa dihapus karena masih ada saldo ${formatRp(w.balance)}.\nKosongkan saldonya terlebih dahulu.`, 'Gagal Menghapus');
                return;
            }

            let isConfirm = await customConfirm(`Yakin ingin menghapus dompet [${w.name}]?`, 'Hapus Dompet');
            if (isConfirm) {
                wallets = wallets.filter(wallet => wallet.id !== id);
                saveData();
            }
        }

        function updateTransferWalletOptions(category, prefix = '') {
            const selectFrom = document.getElementById(prefix + 'trans-from');
            const selectTo = document.getElementById(prefix + 'trans-to');

            const prevFrom = selectFrom.value;
            const prevTo = selectTo.value;

            selectFrom.innerHTML = '';
            selectTo.innerHTML = '';

            wallets.forEach(w => {
                const option = `<option value="${w.id}">${w.name}</option>`;
                if (category === 'Investasi') {
                    if (w.type === 'cash') {
                        selectFrom.innerHTML += option;
                    } else if (w.type === 'invest') {
                        selectTo.innerHTML += option;
                    }
                } else {
                    if (w.type === 'cash') {
                        selectFrom.innerHTML += option;
                        selectTo.innerHTML += option;
                    }
                }
            });

            if (prevFrom && selectFrom.querySelector(`option[value="${prevFrom}"]`)) {
                selectFrom.value = prevFrom;
            }
            if (prevTo && selectTo.querySelector(`option[value="${prevTo}"]`)) {
                selectTo.value = prevTo;
            }
        }

        function toggleTransferFields() {
            const mainType = document.getElementById('trans-main-type').value;
            const category = document.getElementById('trans-category').value;
            const labelSingle = document.getElementById('wallet-field-label');
            const debtCashflowField = document.getElementById('debt-cashflow-toggle-field');
            const debtDueDayField = document.getElementById('debt-due-day-field');

            if (mainType === 'transfer') {
                if (debtCashflowField) debtCashflowField.style.display = 'none';
                if (debtDueDayField) debtDueDayField.style.display = 'none';
                document.getElementById('single-wallet-field').style.display = 'none';
                document.getElementById('transfer-fields').style.display = 'block';
                
                updateTransferWalletOptions(category);
            } else if (mainType === 'debt') {
                if (debtCashflowField) debtCashflowField.style.display = 'block';
                if (debtDueDayField) debtDueDayField.style.display = 'block';

                // Update default toggle based on category if triggered by category change or main type change
                const ev = window.event;
                if (!ev || (ev.target && (ev.target.id === 'trans-main-type' || ev.target.id === 'trans-category'))) {
                    document.getElementById('trans-debt-cashflow').value = (category === 'Pinjaman Pribadi') ? 'ya' : 'tidak';
                }

                const hasCashflow = document.getElementById('trans-debt-cashflow').value;
                if (hasCashflow === 'ya') {
                    document.getElementById('single-wallet-field').style.display = 'block';
                    document.getElementById('transfer-fields').style.display = 'none';
                    labelSingle.innerText = 'Uang Pinjaman Masuk Ke Dompet Mana?';
                } else {
                    document.getElementById('single-wallet-field').style.display = 'none';
                    document.getElementById('transfer-fields').style.display = 'none';
                }
            } else {
                if (debtCashflowField) debtCashflowField.style.display = 'none';
                if (debtDueDayField) debtDueDayField.style.display = 'none';
                document.getElementById('single-wallet-field').style.display = 'block';
                document.getElementById('transfer-fields').style.display = 'none';

                if (mainType === 'expense') labelSingle.innerText = 'Gunakan Uang Dari Dompet Mana?';
                else if (mainType === 'income') labelSingle.innerText = 'Simpan Uang Masuk Ke Dompet Mana?';
            }
        }

        async function addWallet() {
            const name = document.getElementById('new-wallet-name').value;
            const type = document.getElementById('new-wallet-type').value;
            const initialBalance = parseCurrencyValue(document.getElementById('new-wallet-balance').value);

            if (!name) {
                await customAlert('Nama akun tidak boleh kosong!', 'Input Tidak Valid');
                return;
            }

            const newId = Date.now();
            wallets.push({ id: newId, name: name, balance: initialBalance, type: type });

            if (initialBalance > 0) {
                const dateObj = new Date();
                const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                transactions.push({
                    id: Date.now() + 1, timestamp: dateObj.getTime(), date: dateStr,
                    desc: 'Saldo Awal Akun', mainType: 'adjustment', category: 'Saldo Awal',
                    amount: initialBalance, walletName: name, walletId: newId
                });
            }

            saveData();
            document.getElementById('new-wallet-name').value = '';
            document.getElementById('new-wallet-balance').value = '';
            document.getElementById('add-wallet-container').style.display = 'none';
        }

        async function addTransaction() {
            const dateInput = document.getElementById('trans-date').value;
            const mainType = document.getElementById('trans-main-type').value;
            const category = document.getElementById('trans-category').value;
            const desc = document.getElementById('trans-desc').value;
            const amount = parseCurrencyValue(document.getElementById('trans-amount').value);

            if (!dateInput) return await customAlert('Tanggal wajib diisi!', 'Data Tidak Lengkap');
            if (!desc || !amount || amount <= 0) return await customAlert('Keterangan dan nominal wajib diisi dengan benar!', 'Data Tidak Lengkap');

            if (mainType === 'debt') {
                const dueDay = document.getElementById('trans-debt-due-day').value;
                if (dueDay) {
                    const dayVal = parseInt(dueDay);
                    if (isNaN(dayVal) || dayVal < 1 || dayVal > 31) {
                        return await customAlert('Tanggal cicilan harus antara 1 sampai 31!', 'Tanggal Tidak Valid');
                    }
                }
            }

            const dateVals = dateInput.split('-');
            const dateObj = new Date(dateVals[0], dateVals[1] - 1, dateVals[2]);
            const now = new Date();
            dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
            const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStamp = dateObj.getTime();
            const uniqueId = Date.now();

            if (mainType === 'transfer') {
                const fromId = parseInt(document.getElementById('trans-from').value);
                const toId = parseInt(document.getElementById('trans-to').value);
                if (fromId === toId) return await customAlert('Pilih dompet yang berbeda!', 'Mutasi Gagal');

                let wFrom = wallets.find(w => w.id === fromId);
                let wTo = wallets.find(w => w.id === toId);

                if (!wFrom || !wTo) return await customAlert('Dompet tidak ditemukan!', 'Error');
                if (wFrom.balance < amount) return await customAlert(`Saldo di [${wFrom.name}] tidak cukup.`, 'Saldo Kurang');

                wFrom.balance -= amount; wTo.balance += amount;
                transactions.push({ id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: `${wFrom.name} ➔ ${wTo.name}`, fromId: wFrom.id, toId: wTo.id });

            } else if (mainType === 'debt') {
                const hasCashflow = document.getElementById('trans-debt-cashflow').value;
                const dueDay = document.getElementById('trans-debt-due-day').value;

                if (hasCashflow === 'ya') {
                    const walletId = parseInt(document.getElementById('trans-wallet').value);
                    let w = wallets.find(w => w.id === walletId);

                    if (!w) return await customAlert('Dompet tidak ditemukan!', 'Error');

                    w.balance += amount;
                    transactions.push({
                        id: uniqueId,
                        timestamp: timeStamp,
                        date: dateStr,
                        desc,
                        mainType,
                        category,
                        amount,
                        walletName: w.name,
                        walletId: w.id,
                        debtCashflow: 'ya',
                        dueDay: dueDay || null
                    });
                } else {
                    transactions.push({
                        id: uniqueId,
                        timestamp: timeStamp,
                        date: dateStr,
                        desc,
                        mainType,
                        category,
                        amount,
                        walletName: 'Tanpa Aliran Dompet',
                        walletId: null,
                        debtCashflow: 'tidak',
                        dueDay: dueDay || null
                    });
                }
            } else if (mainType === 'receivables') {
                const hasCashflow = document.getElementById('trans-debt-cashflow').value;
                const dueDay = document.getElementById('trans-debt-due-day').value;

                if (hasCashflow === 'ya') {
                    const walletId = parseInt(document.getElementById('trans-wallet').value);
                    let w = wallets.find(w => w.id === walletId);

                    if (!w) return await customAlert('Dompet tidak ditemukan!', 'Error');
                    if (w.balance < amount) return await customAlert(`Saldo di [${w.name}] tidak cukup untuk memberikan pinjaman.`, 'Saldo Kurang');

                    w.balance -= amount;
                    transactions.push({
                        id: uniqueId,
                        timestamp: timeStamp,
                        date: dateStr,
                        desc,
                        mainType,
                        category,
                        amount,
                        walletName: w.name,
                        walletId: w.id,
                        debtCashflow: 'ya',
                        dueDay: dueDay || null
                    });
                } else {
                    transactions.push({
                        id: uniqueId,
                        timestamp: timeStamp,
                        date: dateStr,
                        desc,
                        mainType,
                        category,
                        amount,
                        walletName: 'Tanpa Aliran Dompet',
                        walletId: null,
                        debtCashflow: 'tidak',
                        dueDay: dueDay || null
                    });
                }
            } else {
                const walletId = parseInt(document.getElementById('trans-wallet').value);
                let w = wallets.find(w => w.id === walletId);

                if (!w) return await customAlert('Dompet tidak ditemukan!', 'Error');

                if (mainType === 'expense' && w.balance < amount) {
                    return await customAlert(`Saldo di [${w.name}] tidak cukup untuk pengeluaran/kerugian ini.`, 'Saldo Kurang');
                }

                if (mainType === 'income') w.balance += amount;
                if (mainType === 'expense') w.balance -= amount;

                transactions.push({ id: uniqueId, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount, walletName: w.name, walletId: w.id });
            }

            document.getElementById('trans-desc').value = '';
            document.getElementById('trans-amount').value = '';
            if (document.getElementById('trans-debt-due-day')) document.getElementById('trans-debt-due-day').value = '';

            saveData();
            showToast("Transaksi Berhasil Disimpan!");

            // Reset mainType to expense (stays open) instead of blank
            document.getElementById('trans-main-type').value = 'expense';
            updateCategoryOptions();

            // Trigger check for debt reminders
            checkDebtReminders();
        }

        function renderTransactions() {
            const container = document.getElementById('history-list') || document.getElementById('transaction-list');
            if (!container) return;
            container.innerHTML = '';

            const filteredTrans = getFilteredTransactions();
            const sortedTrans = [...filteredTrans].sort((a, b) => {
                let timeA = a.timestamp || a.id;
                let timeB = b.timestamp || b.id;
                return timeB - timeA;
            });

            if (sortedTrans.length === 0) {
                container.innerHTML = `<div class="card" style="text-align:center; color:var(--text-muted); padding: 35px; border-radius: 16px; font-weight: 500;">Tidak ada transaksi sesuai filter yang dipilih.</div>`;
                return;
            }

            sortedTrans.forEach(t => {
                let badgeClass = ''; let valColor = ''; let cardTypeClass = '';

                if (t.mainType === 'income') {
                    badgeClass = 'bg-green'; valColor = 'color: var(--success);'; cardTypeClass = 'income-card';
                }
                else if (t.mainType === 'expense') {
                    badgeClass = 'bg-red'; valColor = 'color: var(--danger);'; cardTypeClass = 'expense-card';
                }
                else if (t.mainType === 'debt') {
                    badgeClass = 'bg-purple'; valColor = 'color: var(--purple);'; cardTypeClass = 'debt-card';
                }
                else if (t.mainType === 'adjustment') {
                    badgeClass = 'bg-gray';
                    valColor = t.category === 'Koreksi (+)' || t.category === 'Saldo Awal' ? 'color: var(--success);' : 'color: var(--danger);';
                    cardTypeClass = 'adjustment-card';
                }
                else {
                    badgeClass = 'bg-blue'; valColor = 'color: var(--text-main);'; cardTypeClass = 'transfer-card';
                }

                // Wallet/Source representation with nice emojis/arrows
                let walletDisplay = '';
                if (t.mainType === 'transfer') {
                    walletDisplay = `🔄 ${t.walletName}`;
                } else if (t.mainType === 'debt' && !t.walletId) {
                    walletDisplay = `💸 ${t.walletName}`;
                } else {
                    walletDisplay = `💳 ${t.walletName}`;
                }

                const showTime = localStorage.getItem('transaksiku_show_time') !== 'false';
                let timeHtml = '';
                if (showTime) {
                    const tDate = new Date(t.timestamp || t.id);
                    const hrs = String(tDate.getHours()).padStart(2, '0');
                    const mins = String(tDate.getMinutes()).padStart(2, '0');
                    timeHtml = ` <span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">⏰ ${hrs}:${mins}</span>`;
                }

                container.innerHTML += `
                    <div class="transaction-card ${cardTypeClass}">
                        <div class="t-card-header">
                            <span class="badge ${badgeClass}">${t.category}</span>
                            <span class="t-card-date">${t.date}${timeHtml}</span>
                        </div>
                        <div class="t-card-body">
                            <span class="t-card-desc">${t.desc}</span>
                            <span class="t-card-amount" style="${valColor}">${formatRp(t.amount)}</span>
                        </div>
                        <div class="t-card-footer">
                            <div class="t-card-wallet">${walletDisplay}</div>
                            <div class="t-card-actions">
                                <button onclick="editTransaction(${t.id})" class="btn-t-action btn-t-edit">✏️ Ubah</button>
                                <button onclick="deleteTransaction(${t.id})" class="btn-t-action btn-t-delete">🗑️ Hapus</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        function calculateCashflow() {
            const filteredTrans = getFilteredTransactions();
            const expenseContainer = document.getElementById('cashflow-expense-list');
            const incomeContainer = document.getElementById('cashflow-income-list');
            const debtContainer = document.getElementById('cashflow-debt-list');

            expenseContainer.innerHTML = ''; incomeContainer.innerHTML = ''; debtContainer.innerHTML = '';

            let globalDebtTaken = 0;
            let globalDebtPaid = 0;
            transactions.forEach(t => {
                if (t.mainType === 'debt') globalDebtTaken += t.amount;
                if (t.mainType === 'expense' && (t.category === 'Cicilan' || t.category === 'Bayar Pinjaman Bank' || t.category === 'Bayar Kartu Kredit' || t.category === 'Bayar Pinjaman Pribadi')) {
                    globalDebtPaid += t.amount;
                }
            });
            const outstandingDebt = Math.max(0, globalDebtTaken - globalDebtPaid);

            let summary = {};
            let totalIncome = 0; let totalExpense = 0;
            let currentPeriodDebtPaid = 0; let currentPeriodDebtTaken = 0;

            const walletTypes = {};
            wallets.forEach(w => {
                walletTypes[w.id] = w.type;
            });

            filteredTrans.forEach(t => {
                if (t.mainType === 'adjustment') return;

                if (t.mainType === 'income') {
                    if (walletTypes[t.walletId] === 'cash') {
                        let key = `${t.mainType}-${t.category}`;
                        summary[key] = (summary[key] || 0) + t.amount;
                        totalIncome += t.amount;
                    }
                }
                else if (t.mainType === 'expense') {
                    if (walletTypes[t.walletId] === 'cash') {
                        let key = `${t.mainType}-${t.category}`;
                        summary[key] = (summary[key] || 0) + t.amount;
                        totalExpense += t.amount;
                        if (t.category === 'Cicilan' || t.category === 'Bayar Pinjaman Bank' || t.category === 'Bayar Kartu Kredit' || t.category === 'Bayar Pinjaman Pribadi') {
                            currentPeriodDebtPaid += t.amount;
                        }
                    }
                }
                else if (t.mainType === 'debt') {
                    if ((t.debtCashflow === 'ya' || (t.debtCashflow === undefined && t.walletId)) && walletTypes[t.walletId] === 'cash') {
                        let key = `${t.mainType}-${t.category}`;
                        summary[key] = (summary[key] || 0) + t.amount;
                        currentPeriodDebtTaken += t.amount;
                    }
                }
                else if (t.mainType === 'transfer') {
                    const fromType = walletTypes[t.fromId];
                    const toType = walletTypes[t.toId];

                    if (fromType === 'cash' && toType === 'invest') {
                        let key = `expense-Investasi`;
                        summary[key] = (summary[key] || 0) + t.amount;
                        totalExpense += t.amount;
                    }
                    else if (fromType === 'invest' && toType === 'cash') {
                        let key = `income-Penarikan Investasi`;
                        summary[key] = (summary[key] || 0) + t.amount;
                        totalIncome += t.amount;
                    }
                }
            });

            document.getElementById('metric-income').innerText = formatRp(totalIncome + currentPeriodDebtTaken);
            document.getElementById('metric-expense').innerText = formatRp(totalExpense);

            const net = totalIncome + currentPeriodDebtTaken - totalExpense;
            const netEl = document.getElementById('metric-net');
            netEl.innerText = formatRp(net);
            netEl.style.color = net < 0 ? 'var(--danger)' : (net > 0 ? 'var(--success)' : 'var(--accent)');

            const outDebtEl = document.getElementById('metric-outstanding-debt');
            const outDebtBox = document.getElementById('outstanding-debt-box');
            outDebtEl.innerText = formatRp(outstandingDebt);
            document.getElementById('metric-debt-taken-period').innerText = 'Diambil Periode Ini: ' + formatRp(currentPeriodDebtTaken);

            if (outstandingDebt === 0) {
                outDebtEl.style.color = 'var(--success)';
                outDebtBox.style.borderColor = 'var(--success)';
                outDebtBox.style.background = '#f0fdf4';
            } else {
                outDebtEl.style.color = 'var(--purple)';
                outDebtBox.style.borderColor = 'var(--purple)';
                outDebtBox.style.background = '#f5f3ff';
            }

            const ratioEl = document.getElementById('metric-ratio');
            const ratioBox = document.getElementById('ratio-box');
            const ratioDesc = document.getElementById('ratio-desc');

            let totalAssets = 0;
            wallets.forEach(w => {
                totalAssets += w.balance;
            });

            if (totalAssets > 0) {
                const ratio = parseFloat(((outstandingDebt / totalAssets) * 100).toFixed(1));
                ratioEl.innerText = ratio + '%';

                if (ratio > 50) {
                    ratioBox.style.borderColor = 'var(--danger)'; ratioBox.style.backgroundColor = '#fef2f2';
                    ratioEl.style.color = 'var(--danger)'; ratioDesc.style.color = 'var(--danger)';
                    ratioDesc.innerText = '⚠️ Berisiko (>50%)';
                } else if (ratio > 30) {
                    ratioBox.style.borderColor = 'var(--warning)'; ratioBox.style.backgroundColor = '#fffbeb';
                    ratioEl.style.color = 'var(--warning)'; ratioDesc.style.color = 'var(--warning)';
                    ratioDesc.innerText = 'Batas Wajar (30%-50%)';
                } else {
                    ratioBox.style.borderColor = 'var(--success)'; ratioBox.style.backgroundColor = '#f0fdf4';
                    ratioEl.style.color = 'var(--success)'; ratioDesc.style.color = 'var(--success)';
                    ratioDesc.innerText = 'Sangat Sehat (<30%)';
                }
            } else {
                if (outstandingDebt > 0) {
                    ratioEl.innerText = '⚠️ Bahaya';
                    ratioBox.style.borderColor = 'var(--danger)'; ratioBox.style.backgroundColor = '#fef2f2';
                    ratioDesc.innerText = 'Ada Hutang Tanpa Aset!';
                    ratioEl.style.color = 'var(--danger)'; ratioDesc.style.color = 'var(--danger)';
                } else {
                    ratioEl.innerText = '0%';
                    ratioBox.style.borderColor = 'var(--success)'; ratioBox.style.backgroundColor = '#f0fdf4';
                    ratioDesc.innerText = 'Sangat Sehat';
                    ratioEl.style.color = 'var(--success)'; ratioDesc.style.color = 'var(--success)';
                }
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
                        <span class="flow-amount" style="color: var(--danger)">${formatRp(c.amount)} <span style="font-size:0.8rem; color:var(--text-muted);">(${percentage}%)</span></span>
                    </div>
                    <div class="flow-bar-bg">
                        <div class="flow-bar-fill" style="width: ${percentage}%; background-color: var(--danger);"></div>
                    </div>
                </div>
            `;
                expenseContainer.innerHTML += itemHtml;
                expCount++;
            });
            if (expCount === 0) expenseContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Tidak ada pengeluaran.</p>';

            let incCount = 0;
            for (let key in summary) {
                if (key.startsWith('income-')) {
                    let name = key.replace('income-', '');
                    incomeContainer.innerHTML += `<div class="flow-item" style="border-bottom: 1px solid #f1f5f9; padding: 12px 0;"><div style="display:flex; justify-content:space-between;"><span class="flow-category">${name}</span><span class="flow-amount" style="color: var(--success)">${formatRp(summary[key])}</span></div></div>`;
                    incCount++;
                }
            }
            if (incCount === 0) incomeContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Tidak ada pemasukan.</p>';

            let debtCount = 0;
            for (let key in summary) {
                if (key.startsWith('debt-')) {
                    let name = key.replace('debt-', '');
                    debtContainer.innerHTML += `<div class="flow-item" style="border-bottom: 1px solid #f1f5f9; padding: 12px 0;"><div style="display:flex; justify-content:space-between;"><span class="flow-category">${name}</span><span class="flow-amount" style="color: var(--purple)">${formatRp(summary[key])}</span></div></div>`;
                    debtCount++;
                }
            }
            if (debtCount === 0) debtContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Bersih! Tidak ada pinjaman diambil.</p>';

            // CEK INSTABILITAS CDN CHART.JS SEBELUM RENDERING GRAPH
            if (typeof Chart !== 'undefined') {
                renderChart(totalIncome, totalExpense, currentPeriodDebtTaken);
                renderComparisonChart(totalIncome + currentPeriodDebtTaken, totalExpense);
                renderDebtChartAndBreakdown();
                renderReceivablesChartAndBreakdown();
            } else {
                console.warn("Chart.js gagal dimuat dari CDN. Grafik dinonaktifkan sementara.");
                renderDebtChartAndBreakdown();
                renderReceivablesChartAndBreakdown();
            }
        }

        function renderChart(totalIncome, totalExpense, currentPeriodDebtTaken) {
            const ctx = document.getElementById('cashflowChart').getContext('2d');
            if (myChart) myChart.destroy();

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
                myChart = new Chart(ctx, {
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

            myChart = new Chart(ctx, {
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
                // All time
                return { income: 0, expense: 0 };
            }

            let prevIncome = 0;
            let prevExpense = 0;

            const walletTypes = {};
            wallets.forEach(w => {
                walletTypes[w.id] = w.type;
            });

            transactions.forEach(t => {
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

        function renderComparisonChart(currIncome, currExpense) {
            const canvas = document.getElementById('comparisonChart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (window.myComparisonChart) window.myComparisonChart.destroy();

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

            window.myComparisonChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Pemasukan', 'Pengeluaran'],
                    datasets: [
                        {
                            label: prevLabel,
                            data: [prevData.income, prevData.expense],
                            backgroundColor: '#94a3b8',
                            borderRadius: 6,
                            borderWidth: 0,
                            stack: 'Stack 0'
                        },
                        {
                            label: currLabel,
                            data: [currIncome, currExpense],
                            backgroundColor: ['#10b981', '#ef4444'],
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
                                callback: function(value) {
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
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatRp(context.raw)}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function renderDebtChartAndBreakdown() {
            let bankT = 0, bankP = 0;
            let ccT = 0, ccP = 0;
            let persT = 0, persP = 0;

            const chronoTransactions = [...transactions].sort((a, b) => {
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
                        bankT = 0;
                        bankP = 0;
                    }
                }

                if (t.mainType === 'debt' && t.category === 'Kartu Kredit') {
                    ccT += t.amount;
                } else if (t.mainType === 'expense' && t.category === 'Bayar Kartu Kredit') {
                    ccP += t.amount;
                    if (ccP >= ccT) {
                        ccT = 0;
                        ccP = 0;
                    }
                }

                if (t.mainType === 'debt' && t.category === 'Pinjaman Pribadi') {
                    persT += t.amount;
                } else if (t.mainType === 'expense' && (t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Cicilan')) {
                    persP += t.amount;
                    if (persP >= persT) {
                        persT = 0;
                        persP = 0;
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

            if (typeof Chart !== 'undefined') {
                const canvas = document.getElementById('debtChart');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (window.myDebtChart) window.myDebtChart.destroy();

                    const isDark = document.body.classList.contains('dark-theme');
                    const textColor = isDark ? '#cbd5e1' : '#1e293b';
                    const borderColor = isDark ? '#1e293b' : '#ffffff';

                    if (bankOut === 0 && ccOut === 0 && persOut === 0) {
                        window.myDebtChart = new Chart(ctx, {
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

                        window.myDebtChart = new Chart(ctx, {
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
            }

            const now = new Date();
            const nowYear = now.getFullYear();
            const nowMonth = now.getMonth();

            const debtPayments = transactions.filter(t => {
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
                if (bankOut === 0 && ccOut === 0 && persOut === 0) {
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

                    if (bankOut > 0) {
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

                    if (ccOut > 0) {
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

                    if (persOut > 0) {
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
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${categoryIconAndName}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">📅 Tanggal: ${p.date}</span>
                                    </div>
                                    <span style="color: var(--success); font-weight: 700; font-size: 0.95rem;">${formatRp(p.amount)}</span>
                                </div>
                            </div>
                        `;
                    });
                    historyContainer.innerHTML = historyHtml;
                }
            }
        }

        function renderReceivablesChartAndBreakdown() {
            let persT = 0, persP = 0;
            let bizT = 0, bizP = 0;

            const chronoTransactions = [...transactions].sort((a, b) => {
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
                        persT = 0;
                        persP = 0;
                    }
                }

                if (t.mainType === 'receivables' && t.category === 'Piutang Usaha') {
                    bizT += t.amount;
                } else if (t.mainType === 'income' && t.category === 'Penerimaan Pelunasan Piutang Usaha') {
                    bizP += t.amount;
                    if (bizP >= bizT) {
                        bizT = 0;
                        bizP = 0;
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

            if (typeof Chart !== 'undefined') {
                const canvas = document.getElementById('receivablesChart');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (window.myReceivablesChart) window.myReceivablesChart.destroy();

                    const isDark = document.body.classList.contains('dark-theme');
                    const textColor = isDark ? '#cbd5e1' : '#1e293b';
                    const borderColor = isDark ? '#1e293b' : '#ffffff';

                    if (persOut === 0 && bizOut === 0) {
                        window.myReceivablesChart = new Chart(ctx, {
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

                        window.myReceivablesChart = new Chart(ctx, {
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
            }

            const now = new Date();
            const nowYear = now.getFullYear();
            const nowMonth = now.getMonth();

            const receivablesPayments = transactions.filter(t => {
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
                if (persOut === 0 && bizOut === 0) {
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

                    if (persOut > 0) {
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

                    if (bizOut > 0) {
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
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-main);">${categoryIconAndName}</span>
                                        <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">📅 Tanggal: ${p.date}</span>
                                    </div>
                                    <span style="color: var(--success); font-weight: 700; font-size: 0.95rem;">${formatRp(p.amount)}</span>
                                </div>
                            </div>
                        `;
                    });
                    historyContainer.innerHTML = historyHtml;
                }
            }
        }

        async function deleteTransaction(id) {
            let isConfirm = await customConfirm("Hapus transaksi ini? Saldo dompet akan dikembalikan otomatis.", "Konfirmasi Hapus");
            if (!isConfirm) return;

            const tIndex = transactions.findIndex(t => t.id === id);
            const t = transactions[tIndex];

            if (t.mainType === 'transfer') {
                let wFrom = wallets.find(w => w.id === t.fromId);
                let wTo = wallets.find(w => w.id === t.toId);
                if (wFrom) wFrom.balance += t.amount;
                if (wTo) wTo.balance -= t.amount;
            } else if (t.mainType === 'adjustment') {
                let w = wallets.find(w => w.id === t.walletId);
                if (w) {
                    if (t.category === 'Koreksi (+)' || t.category === 'Saldo Awal') w.balance -= t.amount;
                    else w.balance += t.amount;
                }
            } else if (t.mainType === 'debt') {
                if (t.walletId && (t.debtCashflow === 'ya' || t.debtCashflow === undefined)) {
                    let w = wallets.find(w => w.id === t.walletId);
                    if (w) w.balance -= t.amount;
                }
            } else {
                let w = wallets.find(w => w.id === t.walletId);
                if (w) {
                    if (t.mainType === 'income') w.balance -= t.amount;
                    if (t.mainType === 'expense') w.balance += t.amount;
                }
            }

            transactions.splice(tIndex, 1);
            saveData();
        }

        function closeEditModal() {
            document.getElementById('edit-transaction-modal').classList.remove('active');
        }

        function populateEditCategories(mainType) {
            const categorySelect = document.getElementById('edit-trans-category');
            categorySelect.innerHTML = '';

            if (mainType === 'expense') {
                categorySelect.innerHTML = `
                <option value="Makanan">🍔 Makanan & Minuman</option>
                <option value="Hiburan">🎬 Hiburan & Rekreasi</option>
                <option value="Pendidikan">📚 Pendidikan / Kursus</option>
                <option value="Belanja">🛒 Belanja Bulanan / Keperluan</option>
                <option value="Transportasi">🚗 Transportasi / Bensin</option>
                <option value="Tagihan">💡 Tagihan / Listrik / Operasional</option>
                <option value="Bayar Pinjaman Bank" style="font-weight: bold;">🏦 Bayar Pinjaman Bank</option>
                <option value="Bayar Kartu Kredit" style="font-weight: bold;">💳 Bayar Paylater / Kartu Kredit</option>
                <option value="Bayar Pinjaman Pribadi" style="font-weight: bold;">🤝 Bayar Pinjaman Teman / Keluarga</option>
                <option value="Kerugian Investasi" style="color:var(--danger); font-weight:bold;">📉 Kerugian Investasi (Cut Loss)</option>
                <option value="Kesehatan">💊 Kesehatan / Medis</option>
                <option value="Biaya Admin Kartu Debit">💳 Biaya Admin Kartu Debit</option>
                <option value="Lainnya">💸 Pengeluaran Lain</option>
            `;
            } else if (mainType === 'income') {
                categorySelect.innerHTML = `
                <option value="Gaji">💰 Gaji / Omzet Bisnis</option>
                <option value="Keuntungan Investasi" style="color:var(--success); font-weight:bold;">📈 Keuntungan Investasi (Profit/Dividen)</option>
                <option value="Penerimaan Pelunasan Piutang Pribadi" style="color:var(--success); font-weight:bold;">🤝 Penerimaan Pelunasan Piutang Pribadi</option>
                <option value="Penerimaan Pelunasan Piutang Usaha" style="color:var(--success); font-weight:bold;">💼 Penerimaan Pelunasan Piutang Usaha</option>
                <option value="Lainnya">💵 Pemasukan Lain-lain</option>
            `;
            } else if (mainType === 'debt') {
                categorySelect.innerHTML = `
                <option value="Pinjaman Bank">🏦 Pinjaman Bank / KTA</option>
                <option value="Kartu Kredit">💳 Paylater / Kartu Kredit</option>
                <option value="Pinjaman Pribadi">🤝 Pinjaman Teman / Keluarga</option>
            `;
            } else if (mainType === 'receivables') {
                categorySelect.innerHTML = `
                <option value="Piutang Pribadi">🤝 Pinjaman Teman / Keluarga</option>
                <option value="Piutang Usaha">💼 Pinjaman Operasional Bisnis</option>
            `;
            } else if (mainType === 'transfer') {
                categorySelect.innerHTML = `
                <option value="Mutasi">🔄 Mutasi Kas (Tarik / Setor Tunai)</option>
                <option value="Investasi">🏦 Top Up Portofolio (Beli Saham/Reksa Dana)</option>
            `;
            } else if (mainType === 'adjustment') {
                categorySelect.innerHTML = `
                <option value="Koreksi (+)">⚙️ Koreksi (+)</option>
                <option value="Koreksi (-)">⚙️ Koreksi (-)</option>
                <option value="Saldo Awal">⚙️ Saldo Awal</option>
            `;
            }

            // Append custom categories
            const customCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [];
            const customOptions = customCategories
                .filter(cat => cat.type === mainType)
                .map(cat => `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`)
                .join('');
            categorySelect.innerHTML += customOptions;
        }

        function updateEditCategoryOptions() {
            const mainType = document.getElementById('edit-trans-main-type').value;
            const category = document.getElementById('edit-trans-category').value;
            const labelSingle = document.getElementById('edit-wallet-field-label');
            const debtCashflowField = document.getElementById('edit-debt-cashflow-toggle-field');
            const debtDueDayField = document.getElementById('edit-debt-due-day-field');

            populateEditCategories(mainType);

            // Restore the category if it exists in the newly populated list
            if (category) {
                const categorySelect = document.getElementById('edit-trans-category');
                if (categorySelect.querySelector(`option[value="${category}"]`)) {
                    categorySelect.value = category;
                }
            }

            if (mainType === 'transfer') {
                if (debtCashflowField) debtCashflowField.style.display = 'none';
                if (debtDueDayField) debtDueDayField.style.display = 'none';
                document.getElementById('edit-single-wallet-field').style.display = 'none';
                document.getElementById('edit-transfer-fields').style.display = 'block';
                
                updateTransferWalletOptions(category, 'edit-');
            } else if (mainType === 'debt') {
                if (debtCashflowField) debtCashflowField.style.display = 'block';
                if (debtDueDayField) debtDueDayField.style.display = 'block';

                // Automatically update default toggle based on category if triggered by category change or main type change
                const ev = window.event;
                if (ev && ev.target && (ev.target.id === 'edit-trans-main-type' || ev.target.id === 'edit-trans-category')) {
                    document.getElementById('edit-trans-debt-cashflow').value = (category === 'Pinjaman Pribadi') ? 'ya' : 'tidak';
                }

                const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
                if (hasCashflow === 'ya') {
                    document.getElementById('edit-single-wallet-field').style.display = 'block';
                    document.getElementById('edit-transfer-fields').style.display = 'none';
                    labelSingle.innerText = 'Uang Pinjaman Masuk Ke Dompet Mana?';
                } else {
                    document.getElementById('edit-single-wallet-field').style.display = 'none';
                    document.getElementById('edit-transfer-fields').style.display = 'none';
                }
            } else {
                if (debtCashflowField) debtCashflowField.style.display = 'none';
                if (debtDueDayField) debtDueDayField.style.display = 'none';
                document.getElementById('edit-single-wallet-field').style.display = 'block';
                document.getElementById('edit-transfer-fields').style.display = 'none';

                if (mainType === 'expense') labelSingle.innerText = 'Gunakan Uang Dari Dompet Mana?';
                else if (mainType === 'income') labelSingle.innerText = 'Simpan Uang Masuk Ke Dompet Mana?';
            }
        }

        function editTransaction(id) {
            const t = transactions.find(trans => trans.id === id);
            if (!t) return;

            document.getElementById('edit-trans-id').value = t.id;

            // Populate & select mainType
            const mainTypeSelect = document.getElementById('edit-trans-main-type');
            mainTypeSelect.innerHTML = `
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="debt" style="color: var(--purple); font-weight: bold;">Ambil Hutang</option>
            <option value="transfer">Pindah Uang</option>
        `;
            if (t.mainType === 'adjustment') {
                mainTypeSelect.innerHTML += `<option value="adjustment">Penyesuaian Saldo</option>`;
            }
            mainTypeSelect.value = t.mainType;

            // Set date
            const dateObj = new Date(t.timestamp || t.id);
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            document.getElementById('edit-trans-date').value = `${yyyy}-${mm}-${dd}`;

            // Populate Categories & Select
            populateEditCategories(t.mainType);
            document.getElementById('edit-trans-category').value = t.category;

            // Desc & Amount
            document.getElementById('edit-trans-desc').value = t.desc;
            document.getElementById('edit-trans-amount').value = new Intl.NumberFormat('id-ID').format(t.amount);

            // Populate Wallets
            const selectSingle = document.getElementById('edit-trans-wallet');
            const selectFrom = document.getElementById('edit-trans-from');
            const selectTo = document.getElementById('edit-trans-to');

            selectSingle.innerHTML = ''; selectFrom.innerHTML = ''; selectTo.innerHTML = '';
            wallets.forEach(w => {
                selectSingle.innerHTML += `<option value="${w.id}">${w.name}</option>`;
                selectFrom.innerHTML += `<option value="${w.id}">${w.name}</option>`;
                selectTo.innerHTML += `<option value="${w.id}">${w.name}</option>`;
            });

            // Set cashflow and due day values for debt type
            if (t.mainType === 'debt') {
                document.getElementById('edit-trans-debt-cashflow').value = t.debtCashflow || (t.category === 'Pinjaman Pribadi' ? 'ya' : 'tidak');
                document.getElementById('edit-trans-debt-due-day').value = t.dueDay || '';
            }

            // Toggle Transfer vs Single Wallet vs Debt
            updateEditCategoryOptions();
            if (t.mainType === 'transfer') {
                document.getElementById('edit-trans-from').value = t.fromId;
                document.getElementById('edit-trans-to').value = t.toId;
            } else if (t.mainType === 'debt') {
                const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
                if (hasCashflow === 'ya') {
                    document.getElementById('edit-trans-wallet').value = t.walletId || '';
                }
            } else {
                document.getElementById('edit-trans-wallet').value = t.walletId || '';
            }

            // Show Modal
            document.getElementById('edit-transaction-modal').classList.add('active');
        }

        async function updateTransaction() {
            const id = parseInt(document.getElementById('edit-trans-id').value);
            const dateInput = document.getElementById('edit-trans-date').value;
            const desc = document.getElementById('edit-trans-desc').value;
            const amount = parseCurrencyValue(document.getElementById('edit-trans-amount').value);
            const category = document.getElementById('edit-trans-category').value;
            const mainType = document.getElementById('edit-trans-main-type').value;

            if (!dateInput) return await customAlert('Tanggal wajib diisi!', 'Data Tidak Lengkap');
            if (!desc || !amount || amount <= 0) return await customAlert('Keterangan dan nominal wajib diisi dengan benar!', 'Data Tidak Lengkap');

            if (mainType === 'debt') {
                const dueDay = document.getElementById('edit-trans-debt-due-day').value;
                if (dueDay) {
                    const dayVal = parseInt(dueDay);
                    if (isNaN(dayVal) || dayVal < 1 || dayVal > 31) {
                        return await customAlert('Tanggal cicilan harus antara 1 sampai 31!', 'Tanggal Tidak Valid');
                    }
                }
            }

            const tIndex = transactions.findIndex(t => t.id === id);
            if (tIndex === -1) return;
            const oldT = transactions[tIndex];

            // 1. REVERT balances based on the old transaction
            if (oldT.mainType === 'transfer') {
                let wFrom = wallets.find(w => w.id === oldT.fromId);
                let wTo = wallets.find(w => w.id === oldT.toId);
                if (wFrom) wFrom.balance += oldT.amount;
                if (wTo) wTo.balance -= oldT.amount;
            } else if (oldT.mainType === 'adjustment') {
                let w = wallets.find(w => w.id === oldT.walletId);
                if (w) {
                    if (oldT.category === 'Koreksi (+)' || oldT.category === 'Saldo Awal') w.balance -= oldT.amount;
                    else w.balance += oldT.amount;
                }
            } else if (oldT.mainType === 'debt') {
                if (oldT.walletId && (oldT.debtCashflow === 'ya' || oldT.debtCashflow === undefined)) {
                    let w = wallets.find(w => w.id === oldT.walletId);
                    if (w) w.balance -= oldT.amount;
                }
            } else {
                let w = wallets.find(w => w.id === oldT.walletId);
                if (w) {
                    if (oldT.mainType === 'income') w.balance -= oldT.amount;
                    if (oldT.mainType === 'expense') w.balance += oldT.amount;
                }
            }

            // Helper to perform rollback if validation fails
            const rollbackOldBalances = () => {
                if (oldT.mainType === 'transfer') {
                    let wFrom = wallets.find(w => w.id === oldT.fromId);
                    let wTo = wallets.find(w => w.id === oldT.toId);
                    if (wFrom) wFrom.balance -= oldT.amount;
                    if (wTo) wTo.balance += oldT.amount;
                } else if (oldT.mainType === 'adjustment') {
                    let w = wallets.find(w => w.id === oldT.walletId);
                    if (w) {
                        if (oldT.category === 'Koreksi (+)' || oldT.category === 'Saldo Awal') w.balance += oldT.amount;
                        else w.balance -= oldT.amount;
                    }
                } else if (oldT.mainType === 'debt') {
                    if (oldT.walletId && (oldT.debtCashflow === 'ya' || oldT.debtCashflow === undefined)) {
                        let w = wallets.find(w => w.id === oldT.walletId);
                        if (w) w.balance += oldT.amount;
                    }
                } else {
                    let w = wallets.find(w => w.id === oldT.walletId);
                    if (w) {
                        if (oldT.mainType === 'income') w.balance += oldT.amount;
                        if (oldT.mainType === 'expense') w.balance -= oldT.amount;
                    }
                }
            };

            // 2. APPLY balances based on the new edit values
            let dateVals = dateInput.split('-');
            let dateObj = new Date(dateVals[0], dateVals[1] - 1, dateVals[2]);
            let dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            let timeStamp = dateObj.getTime();

            if (mainType === 'transfer') {
                const fromId = parseInt(document.getElementById('edit-trans-from').value);
                const toId = parseInt(document.getElementById('edit-trans-to').value);
                if (fromId === toId) {
                    rollbackOldBalances();
                    return await customAlert('Pilih dompet yang berbeda!', 'Mutasi Gagal');
                }

                let wFrom = wallets.find(w => w.id === fromId);
                let wTo = wallets.find(w => w.id === toId);

                if (!wFrom || !wTo) {
                    rollbackOldBalances();
                    return await customAlert('Dompet tidak ditemukan!', 'Error');
                }
                if (wFrom.balance < amount) {
                    rollbackOldBalances();
                    return await customAlert(`Saldo di [${wFrom.name}] tidak cukup.`, 'Saldo Kurang');
                }

                wFrom.balance -= amount; wTo.balance += amount;

                transactions[tIndex] = {
                    id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount,
                    walletName: `${wFrom.name} ➔ ${wTo.name}`, fromId: wFrom.id, toId: wTo.id
                };

            } else if (mainType === 'debt') {
                const hasCashflow = document.getElementById('edit-trans-debt-cashflow').value;
                const dueDay = document.getElementById('edit-trans-debt-due-day').value;

                if (hasCashflow === 'ya') {
                    const walletId = parseInt(document.getElementById('edit-trans-wallet').value);
                    let w = wallets.find(w => w.id === walletId);

                    if (!w) {
                        rollbackOldBalances();
                        return await customAlert('Dompet tidak ditemukan!', 'Error');
                    }

                    w.balance += amount;
                    transactions[tIndex] = {
                        id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount,
                        walletName: w.name, walletId: w.id,
                        debtCashflow: 'ya', dueDay: dueDay || null
                    };
                } else {
                    transactions[tIndex] = {
                        id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount,
                        walletName: 'Tanpa Aliran Dompet', walletId: null,
                        debtCashflow: 'tidak', dueDay: dueDay || null
                    };
                }
            } else {
                const walletId = parseInt(document.getElementById('edit-trans-wallet').value);
                let w = wallets.find(w => w.id === walletId);

                if (!w) {
                    rollbackOldBalances();
                    return await customAlert('Dompet tidak ditemukan!', 'Error');
                }

                if (mainType === 'expense' && w.balance < amount) {
                    rollbackOldBalances();
                    return await customAlert(`Saldo di [${w.name}] tidak cukup untuk pengeluaran/kerugian ini.`, 'Saldo Kurang');
                }

                if (mainType === 'income') w.balance += amount;
                if (mainType === 'expense') w.balance -= amount;
                if (mainType === 'adjustment') {
                    if (category === 'Koreksi (+)' || category === 'Saldo Awal') w.balance += amount;
                    else w.balance -= amount;
                }

                transactions[tIndex] = {
                    id, timestamp: timeStamp, date: dateStr, desc, mainType, category, amount,
                    walletName: w.name, walletId: w.id
                };
            }

            closeEditModal();
            saveData();
            checkDebtReminders();
        }

        function saveData() {
            localStorage.setItem('keuangan_wallets28', JSON.stringify(wallets));
            localStorage.setItem('keuangan_transactions28', JSON.stringify(transactions));
            generateDynamicFilters();
            renderWallets(); applyFilter();
        }

        function toggleTheme() {
            const isDark = document.body.classList.toggle('dark-theme');
            if (isDark) {
                document.documentElement.classList.add('dark-theme');
                localStorage.setItem('transaksiku_theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark-theme');
                localStorage.setItem('transaksiku_theme', 'light');
            }
            updateThemeToggles();

            // Redraw chart to update font colors if visible
            if (document.getElementById('view-cashflow').style.display === 'block' || document.getElementById('view-debt').style.display === 'block') {
                applyFilter();
            }
        }

        function updateThemeToggles() {
            const isDark = document.body.classList.contains('dark-theme');

            // Top toggle button icon update
            const themeIcon = document.getElementById('theme-icon-svg');
            if (themeIcon) {
                if (isDark) {
                    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
                } else {
                    themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
                }
            }

            // Drawer toggle icon & label update
            const drawerIcon = document.getElementById('theme-toggle-drawer-icon');
            const drawerText = document.getElementById('theme-toggle-drawer-text');
            if (drawerIcon && drawerText) {
                if (isDark) {
                    drawerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
                    drawerText.innerText = 'Mode Terang';
                } else {
                    drawerIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
                    drawerText.innerText = 'Mode Malam';
                }
            }
        }

        function initThemeUI() {
            const savedTheme = localStorage.getItem('transaksiku_theme') || 'light';
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                document.documentElement.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
                document.documentElement.classList.remove('dark-theme');
            }
            updateThemeToggles();
        }

        function initHideBalancesUI() {
            const eyeIcon = document.getElementById('eye-icon');
            const eyeText = document.getElementById('eye-text');
            if (eyeIcon && eyeText) {
                const EYE_SVG_OPEN = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`;
                const EYE_SVG_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.671-3.671m0-3.671a3 3 0 0 0-3.671 3.671m-.339.34L6.228 6.228" /></svg>`;
                
                eyeIcon.innerHTML = hideBalancesActive ? EYE_SVG_OPEN : EYE_SVG_CLOSED;
                eyeText.innerText = hideBalancesActive ? 'Tampilkan Saldo' : 'Sembunyikan Saldo';
            }
        }

        function toggleHideBalances() {
            hideBalancesActive = !hideBalancesActive;
            localStorage.setItem('transaksiku_hide_balances', hideBalancesActive);
            
            initHideBalancesUI();
            renderWallets();
            showToast(hideBalancesActive ? 'Saldo berhasil disembunyikan' : 'Saldo berhasil ditampilkan');
        }



        function updateReminderToggles() {
            const isEnabled = localStorage.getItem('transaksiku_reminders') === 'enabled';
            const iconEl = document.getElementById('reminder-toggle-icon');
            const textEl = document.getElementById('reminder-toggle-text');

            if (iconEl && textEl) {
                if (isEnabled && Notification.permission === 'granted') {
                    iconEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
                    textEl.innerText = 'Pengingat Harian (Aktif)';
                } else {
                    iconEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
                    textEl.innerText = 'Pengingat Harian (Nonaktif)';
                }
            }
        }

        async function toggleReminder() {
            const isEnabled = localStorage.getItem('transaksiku_reminders') === 'enabled';
            if (isEnabled) {
                localStorage.setItem('transaksiku_reminders', 'disabled');
                updateReminderToggles();
                await customAlert('Pengingat harian telah dinonaktifkan.', 'Pengingat Mati');
            } else {
                if (!('Notification' in window)) {
                    return await customAlert('Browser Anda tidak mendukung notifikasi.', 'Tidak Didukung');
                }

                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    localStorage.setItem('transaksiku_reminders', 'enabled');
                    updateReminderToggles();
                    showLocalNotification('Pengingat Aktif! 📝', 'Transaksiku akan mengingatkan Anda setiap hari untuk mencatat pengeluaran atau pemasukan.');
                } else {
                    await customAlert('Izin notifikasi ditolak. Aktifkan izin notifikasi di pengaturan browser Anda.', 'Izin Ditolak');
                }
            }
        }

        function getCategoryOutstanding(category) {
            let totalBorrowed = 0;
            let totalPaid = 0;

            transactions.forEach(t => {
                if (t.mainType === 'debt' && t.category === category) {
                    totalBorrowed += t.amount;
                }
                if (t.mainType === 'expense') {
                    if (category === 'Pinjaman Bank' && t.category === 'Bayar Pinjaman Bank') {
                        totalPaid += t.amount;
                    } else if (category === 'Kartu Kredit' && t.category === 'Bayar Kartu Kredit') {
                        totalPaid += t.amount;
                    } else if (category === 'Pinjaman Pribadi' && (t.category === 'Bayar Pinjaman Pribadi' || t.category === 'Cicilan')) {
                        totalPaid += t.amount;
                    }
                }
            });

            return Math.max(0, totalBorrowed - totalPaid);
        }

        function checkDebtReminders() {
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth(); // 0-indexed
            const currentDate = now.getDate();

            const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

            transactions.forEach(t => {
                if (t.mainType === 'debt' && t.dueDay) {
                    const dueDayNum = parseInt(t.dueDay);
                    if (isNaN(dueDayNum)) return;

                    const outstanding = getCategoryOutstanding(t.category);
                    if (outstanding <= 0) return; // Fully paid off / lunas, no notification

                    let triggerType = null;
                    let message = '';

                    if (currentDate === dueDayNum) {
                        triggerType = 'due';
                        message = `Hari ini adalah tanggal jatuh tempo pembayaran cicilan untuk [${t.category} - ${t.desc}]. Jangan lupa bayar ya! 💸`;
                    } else if (currentDate === dueDayNum + 1) {
                        triggerType = 'after';
                        message = `Kemarin adalah tanggal jatuh tempo [${t.category} - ${t.desc}]. Cicilan Anda masih belum terbayar. Harap segera bayar! ⚠️`;
                    } else if (currentDate === lastDay) {
                        triggerType = 'end';
                        message = `Sudah akhir bulan! Cicilan untuk [${t.category} - ${t.desc}] masih belum terbayar. Mari selesaikan pembayaran Anda! 🚨`;
                    }

                    if (triggerType) {
                        const notifiedKey = `notified_${t.id}_${currentYear}_${currentMonth}_${triggerType}`;
                        if (!localStorage.getItem(notifiedKey)) {
                            showLocalNotification(`Pengingat Pembayaran Cicilan 📌`, message);
                            localStorage.setItem(notifiedKey, 'true');
                        }
                    }
                }
            });
        }

        function showLocalNotification(title, body) {
            if (Notification.permission === 'granted') {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, {
                            body: body,
                            icon: 'logo.png',
                            badge: 'logo.png',
                            vibrate: [200, 100, 200]
                        });
                    }).catch(err => {
                        new Notification(title, { body: body, icon: 'logo.png' });
                    });
                } else {
                    new Notification(title, { body: body, icon: 'logo.png' });
                }
            }
        }

        function checkDailyReminder() {
            const isEnabled = localStorage.getItem('transaksiku_reminders') === 'enabled';
            if (!isEnabled || Notification.permission !== 'granted') return;

            const lastReminder = localStorage.getItem('transaksiku_last_reminder_time');
            const now = Date.now();

            // Check if less than 20 hours have passed since last reminder
            if (lastReminder && (now - parseInt(lastReminder)) < (20 * 60 * 60 * 1000)) {
                return;
            }

            // Check if there is any transaction recorded today
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayTime = todayStart.getTime();

            const hasTransactionToday = transactions.some(t => {
                const tDateObj = new Date(t.timestamp || t.id);
                tDateObj.setHours(0, 0, 0, 0);
                return tDateObj.getTime() === todayTime;
            });

            if (!hasTransactionToday) {
                showLocalNotification(
                    'Belum mencatat hari ini? 📝',
                    'Jangan lupa luangkan waktu 1 menit untuk mencatat pengeluaran atau pemasukan Anda hari ini di Transaksiku!'
                );
                localStorage.setItem('transaksiku_last_reminder_time', now.toString());
            }
        }

        checkEntryChoice();
        updateEntryUI();
        initThemeUI();
        initHideBalancesUI();
        updateReminderToggles();
        setDefaultDate();
        updateCategoryOptions();
        generateDynamicFilters();
        renderWallets();
        applyFilter();
        applyDisplaySettings();

        // PWA Daily Reminder audit check shortly after page loads, and check every 1 hour
        setTimeout(checkDailyReminder, 5000);
        setInterval(checkDailyReminder, 60 * 60 * 1000);

        // PWA Debt Reminders check shortly after page loads, and check every 1 hour
        setTimeout(checkDebtReminders, 6000);
        setInterval(checkDebtReminders, 60 * 60 * 1000);

        // PWA CUSTOM INSTALLATION PROMPT LOGIC
        let deferredPrompt;
        const pwaBanner = document.getElementById('pwa-install-banner');
        const pwaInstallBtn = document.getElementById('pwa-install-btn');
        const pwaCloseBtn = document.getElementById('pwa-close-btn');

        // Helper detection
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
            if (userAgent.indexOf('edg') > -1) {
                return 'edge';
            }
            if (userAgent.indexOf('firefox') > -1) {
                return 'firefox';
            }
            return 'other';
        }

        function renderPwaGuide() {
            const os = getDeviceOS();
            const browser = getBrowserName();
            const contentEl = document.getElementById('pwa-guide-content');
            if (!contentEl) return;

            let html = '';
            if (os === 'ios') {
                html = `
                    <p style="margin-bottom: 15px; font-size: 0.95rem; color: var(--text-muted);">Aplikasi ini dapat dipasang di iPhone/iPad Anda melalui Safari:</p>
                    <div class="pwa-guide-steps">
                        <div class="pwa-guide-step">
                            <span class="pwa-guide-step-num">1</span>
                            <span class="pwa-guide-step-text">Buka situs ini di browser <strong>Safari</strong> bawaan iOS.</span>
                        </div>
                        <div class="pwa-guide-step">
                            <span class="pwa-guide-step-num">2</span>
                            <span class="pwa-guide-step-text">Ketuk tombol <strong>Bagikan (Share)</strong> <span style="font-size:1.1rem; vertical-align:middle;">📤</span> di bilah navigasi bawah Safari.</span>
                        </div>
                        <div class="pwa-guide-step">
                            <span class="pwa-guide-step-num">3</span>
                            <span class="pwa-guide-step-text">Gulir ke bawah dan pilih menu <strong>'Tambahkan ke Layar Utama' (Add to Home Screen)</strong> <span style="font-size:1.1rem; vertical-align:middle;">➕</span>.</span>
                        </div>
                        <div class="pwa-guide-step">
                            <span class="pwa-guide-step-num">4</span>
                            <span class="pwa-guide-step-text">Ketuk tombol <strong>'Tambah' (Add)</strong> di sudut kanan atas untuk menyelesaikan pemasangan.</span>
                        </div>
                    </div>
                `;
            } else if (os === 'android') {
                html = `
                    <p style="margin-bottom: 15px; font-size: 0.95rem; color: var(--text-muted);">Ikuti langkah berikut untuk memasang di HP Android Anda:</p>
                    <div class="pwa-guide-steps">
                        <div class="pwa-guide-step">
                            <span class="pwa-guide-step-num">1</span>
                            <span class="pwa-guide-step-text">Ketuk tombol menu <strong>titik tiga (⋮)</strong> di sudut kanan atas browser Anda (misalnya Chrome).</span>
                        </div>
                        <div class="pwa-guide-step">
                            <span class="pwa-guide-step-num">2</span>
                            <span class="pwa-guide-step-text">Pilih menu <strong>'Instal aplikasi'</strong> atau <strong>'Tambahkan ke Layar Utama'</strong>.</span>
                        </div>
                        <div class="pwa-guide-step">
                            <span class="pwa-guide-step-num">3</span>
                            <span class="pwa-guide-step-text">Konfirmasi pemasangan dengan mengetuk tombol <strong>'Instal'</strong> atau <strong>'Tambah'</strong>.</span>
                        </div>
                    </div>
                `;
            } else {
                // Desktop
                if (browser === 'chrome' || browser === 'edge') {
                    html = `
                        <p style="margin-bottom: 15px; font-size: 0.95rem; color: var(--text-muted);">Pasang aplikasi di komputer Anda dengan sangat mudah:</p>
                        <div class="pwa-guide-steps">
                            <div class="pwa-guide-step">
                                <span class="pwa-guide-step-num">1</span>
                                <span class="pwa-guide-step-text">Perhatikan bilah alamat (address bar) browser Anda di bagian kanan atas.</span>
                            </div>
                            <div class="pwa-guide-step">
                                <span class="pwa-guide-step-num">2</span>
                                <span class="pwa-guide-step-text">Klik ikon <strong>Instal</strong> (gambar monitor dengan panah bawah <span style="font-size:1rem; vertical-align:middle;">🖥️</span> atau tanda plus <span style="font-size:1rem; vertical-align:middle;">➕</span>).</span>
                            </div>
                            <div class="pwa-guide-step">
                                <span class="pwa-guide-step-num">3</span>
                                <span class="pwa-guide-step-text">Atau klik menu <strong>titik tiga (⋮)</strong> lalu pilih <strong>'Instal Transaksiku...'</strong>.</span>
                            </div>
                        </div>
                    `;
                } else {
                    html = `
                        <p style="margin-bottom: 15px; font-size: 0.95rem; color: var(--text-muted);">Pasang aplikasi di browser Anda:</p>
                        <div class="pwa-guide-steps">
                            <div class="pwa-guide-step">
                                <span class="pwa-guide-step-num">1</span>
                                <span class="pwa-guide-step-text">Buka menu pengaturan/opsi di browser Anda (biasanya di sudut kanan atas).</span>
                            </div>
                            <div class="pwa-guide-step">
                                <span class="pwa-guide-step-num">2</span>
                                <span class="pwa-guide-step-text">Pilih opsi <strong>'Instal Transaksiku'</strong> atau <strong>'Tambahkan ke Layar Utama'</strong>.</span>
                            </div>
                            <div class="pwa-guide-step">
                                <span class="pwa-guide-step-num">3</span>
                                <span class="pwa-guide-step-text">Konfirmasi pemasangan di layar.</span>
                            </div>
                        </div>
                    `;
                }
            }
            contentEl.innerHTML = html;
        }

        function showPwaGuide() {
            renderPwaGuide();
            const guideModal = document.getElementById('pwa-guide-modal');
            if (guideModal) {
                guideModal.classList.add('active');
            }
        }

        function closePwaGuide() {
            const guideModal = document.getElementById('pwa-guide-modal');
            if (guideModal) {
                guideModal.classList.remove('active');
            }
        }

        function triggerPwaInstall() {
            // Tutup drawer sidebar jika sedang terbuka
            const sidebar = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
            if (backdrop && backdrop.classList.contains('show')) {
                backdrop.classList.remove('show');
                setTimeout(() => backdrop.style.display = 'none', 300);
            }

            if (deferredPrompt) {
                // Sembunyikan banner jika aktif
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

        // DISPLAY SETTINGS FUNCTIONS
        function applyDisplaySettings() {
            const settings = JSON.parse(localStorage.getItem('transaksiku_display_settings')) || { showTotal: true, showCash: true, showInvest: true };

            const cardTotal = document.getElementById('card-total-wealth');
            const cardCash = document.getElementById('card-active-cash');
            const cardInvest = document.getElementById('card-total-portfolio');

            if (cardTotal) cardTotal.style.display = settings.showTotal ? 'block' : 'none';
            if (cardCash) cardCash.style.display = settings.showCash ? 'block' : 'none';
            if (cardInvest) cardInvest.style.display = settings.showInvest ? 'block' : 'none';
        }

        window.showSettingsModal = function() {
            // Tutup drawer sidebar jika sedang terbuka
            const sidebar = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
            if (backdrop && backdrop.classList.contains('show')) {
                backdrop.classList.remove('show');
                setTimeout(() => backdrop.style.display = 'none', 300);
            }

            const settings = JSON.parse(localStorage.getItem('transaksiku_display_settings')) || { showTotal: true, showCash: true, showInvest: true };

            const toggleTotal = document.getElementById('toggle-card-total');
            const toggleCash = document.getElementById('toggle-card-cash');
            const toggleInvest = document.getElementById('toggle-card-invest');

            if (toggleTotal) toggleTotal.checked = settings.showTotal;
            if (toggleCash) toggleCash.checked = settings.showCash;
            if (toggleInvest) toggleInvest.checked = settings.showInvest;

            // Load Currency & Time settings
            const savedCurrency = localStorage.getItem('transaksiku_currency') || 'Rp';
            const savedShowTime = localStorage.getItem('transaksiku_show_time') !== 'false';
            const currencySelect = document.getElementById('setting-global-currency');
            const toggleTime = document.getElementById('toggle-show-time');
            if (currencySelect) currencySelect.value = savedCurrency;
            if (toggleTime) toggleTime.checked = savedShowTime;

            // Reset tab
            switchSettingsTab('settings-tab-display');

            const modal = document.getElementById('settings-display-modal');
            if (modal) {
                modal.classList.add('active');
            }
        };

        window.closeSettingsModal = function() {
            const modal = document.getElementById('settings-display-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        };

        window.saveSettingsDisplay = function() {
            const toggleTotal = document.getElementById('toggle-card-total');
            const toggleCash = document.getElementById('toggle-card-cash');
            const toggleInvest = document.getElementById('toggle-card-invest');

            const settings = {
                showTotal: toggleTotal ? toggleTotal.checked : true,
                showCash: toggleCash ? toggleCash.checked : true,
                showInvest: toggleInvest ? toggleInvest.checked : true
            };

            localStorage.setItem('transaksiku_display_settings', JSON.stringify(settings));

            // Save Currency & Time settings
            const currencySelect = document.getElementById('setting-global-currency');
            const toggleTime = document.getElementById('toggle-show-time');
            if (currencySelect) localStorage.setItem('transaksiku_currency', currencySelect.value);
            if (toggleTime) localStorage.setItem('transaksiku_show_time', toggleTime.checked.toString());

            applyDisplaySettings();
            applyFilter();
            renderWallets();
            closeSettingsModal();
            showToast('Pengaturan berhasil disimpan!');
        };

        // Cek PWA Mode (Standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://');

        // Cek dismissal dalam localStorage (tampilkan banner kembali setelah 3 hari jika ditutup)
        const dismissTime = localStorage.getItem('pwa_banner_dismissed_at');
        const delayToShowAgain = 3 * 24 * 60 * 60 * 1000; // 3 hari
        const isDismissed = dismissTime && (Date.now() - parseInt(dismissTime) < delayToShowAgain);

        // Pasang listener beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });

        // Tampilkan Banner Tawaran jika tidak standalone dan tidak dismissed
        if (!isStandalone) {
            // Tampilkan tombol "Pasang Aplikasi" di Sidebar Drawer
            const drawerInstallBtn = document.getElementById('drawer-install-btn');
            if (drawerInstallBtn) {
                drawerInstallBtn.style.display = 'flex';
            }

            // Tampilkan banner selamat datang / instalasi setelah 3 detik
            if (!isDismissed && pwaBanner) {
                setTimeout(() => {
                    pwaBanner.style.display = 'flex';
                    pwaBanner.offsetHeight; // Force reflow
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
                // Simpan tanggal penutupan agar tidak spam user setiap buka halaman
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

        // SIDEBAR & THEME TOGGLES
        window.toggleSidebar = function() {
            const sidebar = document.getElementById('sidebar-drawer');
            const backdrop = document.getElementById('drawer-backdrop');
            if (sidebar && backdrop) {
                const isOpen = sidebar.classList.toggle('open');
                if (isOpen) {
                    backdrop.style.display = 'block';
                    setTimeout(() => backdrop.classList.add('show'), 10);
                } else {
                    backdrop.classList.remove('show');
                    setTimeout(() => backdrop.style.display = 'none', 300);
                }
            }
        };

        window.toggleTheme = function() {
            const isDark = document.body.classList.toggle('dark-theme');
            if (isDark) {
                document.documentElement.classList.add('dark-theme');
                localStorage.setItem('transaksiku_theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark-theme');
                localStorage.setItem('transaksiku_theme', 'light');
            }
            updateThemeToggles();
            applyFilter();
        };

        // CUSTOM CATEGORY MODAL FUNCTIONS (Legacy backup if modal element still accessed)
        window.showCustomCategoryModal = function(e) {
            if (e) e.preventDefault();
            document.getElementById('custom-category-modal').classList.add('active');
        };
        window.closeCustomCategoryModal = function() {
            document.getElementById('custom-category-modal').classList.remove('active');
        };

        window.selectCategoryEmoji = function(el) {
            document.querySelectorAll('.emoji-option').forEach(span => {
                span.classList.remove('selected');
                span.style.borderColor = 'transparent';
            });
            el.classList.add('selected');
            el.style.borderColor = 'var(--purple)';
            const inputField = document.getElementById('settings-new-cat-emoji') || document.getElementById('new-cat-emoji');
            if (inputField) inputField.value = el.innerText;
        };

        window.saveCustomCategory = function() {
            const name = document.getElementById('new-cat-name').value.trim();
            const emoji = document.getElementById('new-cat-emoji').value;
            const type = document.getElementById('trans-main-type').value;
            if (!name) return showToast('Nama kategori tidak boleh kosong!');
            
            let customCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [];
            if (customCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
                return showToast('Kategori ini sudah ada!');
            }
            customCategories.push({ name, icon: emoji, type });
            localStorage.setItem('transaksiku_custom_categories', JSON.stringify(customCategories));
            document.getElementById('new-cat-name').value = '';
            closeCustomCategoryModal();
            updateCategoryOptions();
            showToast('Kategori kustom berhasil disimpan!');
        };

        // NEW SETTINGS-BASED CATEGORY MANAGER
        window.saveCustomCategoryFromSettings = function() {
            const name = document.getElementById('settings-new-cat-name').value.trim();
            const emoji = document.getElementById('settings-new-cat-emoji').value;
            const type = document.getElementById('settings-new-cat-type').value;
            if (!name) return showToast('Nama kategori tidak boleh kosong!');
            
            let customCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [];
            if (customCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === type)) {
                return showToast('Kategori ini sudah ada!');
            }
            customCategories.push({ name, icon: emoji, type });
            localStorage.setItem('transaksiku_custom_categories', JSON.stringify(customCategories));
            document.getElementById('settings-new-cat-name').value = '';
            
            renderSettingsCustomCategories();
            updateCategoryOptions();
            showToast('Kategori kustom berhasil ditambahkan!');
        };

        window.renderSettingsCustomCategories = function() {
            const container = document.getElementById('settings-custom-categories-list');
            if (!container) return;
            
            const customCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [];
            if (customCategories.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 10px;">Belum ada kategori kustom.</div>`;
                return;
            }
            
            let html = '';
            const typeLabels = {
                expense: 'Pengeluaran 🔴',
                income: 'Pemasukan 🟢',
                debt: 'Hutang 🟣',
                receivables: 'Piutang 🔵'
            };
            
            customCategories.forEach((c, idx) => {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--bg); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 5px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.20rem;">${c.icon}</span>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${c.name}</span>
                                <span style="font-size: 0.7rem; color: var(--text-muted);">${typeLabels[c.type] || c.type}</span>
                            </div>
                        </div>
                        <button onclick="deleteCustomCategoryFromSettings(${idx})" style="background: none; border: none; color: var(--danger); cursor: pointer; font-weight: 600; font-size: 0.8rem; padding: 4px 8px;">Hapus</button>
                    </div>
                `;
            });
            container.innerHTML = html;
        };

        window.deleteCustomCategoryFromSettings = function(index) {
            let customCategories = JSON.parse(localStorage.getItem('transaksiku_custom_categories')) || [];
            customCategories.splice(index, 1);
            localStorage.setItem('transaksiku_custom_categories', JSON.stringify(customCategories));
            renderSettingsCustomCategories();
            updateCategoryOptions();
            showToast('Kategori kustom dihapus.');
        };

        // SETTINGS TAB FUNCTION
        window.switchSettingsTab = function(tabId) {
            document.querySelectorAll('.settings-tab-content').forEach(el => el.style.display = 'none');
            const targetContent = document.getElementById(tabId);
            if (targetContent) targetContent.style.display = 'block';
            
            document.querySelectorAll('.settings-tab-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.borderBottomColor = 'transparent';
                btn.style.color = 'var(--text-muted)';
            });
            
            const tabButtons = Array.from(document.querySelectorAll('.settings-tab-btn'));
            const activeBtn = tabButtons.find(btn => btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`));
            if (activeBtn) {
                activeBtn.classList.add('active');
                activeBtn.style.borderBottomColor = 'var(--purple)';
                activeBtn.style.color = 'var(--purple)';
            }
            
            if (tabId === 'settings-tab-categories') {
                renderSettingsCustomCategories();
            }
        };

        // REPORT TABS SWITCHER
        window.switchReportTab = function(tabName) {
            const distContainer = document.getElementById('report-tab-dist-container');
            const compContainer = document.getElementById('report-tab-comp-container');
            const btnDist = document.getElementById('btn-report-dist');
            const btnComp = document.getElementById('btn-report-comp');
            
            if (tabName === 'dist') {
                if (distContainer) distContainer.style.display = 'block';
                if (compContainer) compContainer.style.display = 'none';
                if (btnDist) {
                    btnDist.style.background = 'var(--card)';
                    btnDist.style.color = 'var(--text-main)';
                    btnDist.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }
                if (btnComp) {
                    btnComp.style.background = 'transparent';
                    btnComp.style.color = 'var(--text-muted)';
                    btnComp.style.boxShadow = 'none';
                }
            } else {
                if (distContainer) distContainer.style.display = 'none';
                if (compContainer) compContainer.style.display = 'block';
                if (btnComp) {
                    btnComp.style.background = 'var(--card)';
                    btnComp.style.color = 'var(--text-main)';
                    btnComp.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }
                if (btnDist) {
                    btnDist.style.background = 'transparent';
                    btnDist.style.color = 'var(--text-muted)';
                    btnDist.style.boxShadow = 'none';
                }
                
                // Re-render the comparison chart
                const filteredTrans = getFilteredTransactions();
                let totalIncome = 0, totalExpense = 0, currentPeriodDebtTaken = 0;
                
                const walletTypes = {};
                wallets.forEach(w => {
                    walletTypes[w.id] = w.type;
                });
                
                filteredTrans.forEach(t => {
                    if (t.mainType === 'income') {
                        if (walletTypes[t.walletId] === 'cash') totalIncome += t.amount;
                    } else if (t.mainType === 'expense') {
                        if (walletTypes[t.walletId] === 'cash') totalExpense += t.amount;
                    } else if (t.mainType === 'debt') {
                        currentPeriodDebtTaken += t.amount;
                    } else if (t.mainType === 'transfer') {
                        const fromType = walletTypes[t.fromId];
                        const toType = walletTypes[t.toId];
                        if (fromType === 'cash' && toType === 'invest') totalExpense += t.amount;
                        else if (fromType === 'invest' && toType === 'cash') totalIncome += t.amount;
                    }
                });
                
                renderComparisonChart(totalIncome + currentPeriodDebtTaken, totalExpense);
            }
        };

        // GOOGLE LOGIN SIMULATION & AUTH FLOW
        window.mockGoogleLogin = function() {
            const btn = document.getElementById('google-login-btn');
            const statusTitle = document.getElementById('sync-status-title');
            const statusDesc = document.getElementById('sync-status-desc');
            if (!btn || !statusTitle || !statusDesc) return;
            if (btn.innerText.includes('Masuk')) {
                localStorage.setItem('transaksiku_entry_choice', 'online');
                localStorage.setItem('transaksiku_user_logged_in', 'true');
                btn.innerHTML = '<span>Keluar Akun Google</span>';
                btn.style.background = 'var(--danger)';
                btn.style.color = 'white';
                statusTitle.innerText = 'Akun Terhubung: budi@gmail.com';
                statusDesc.innerText = 'Sinkronisasi Supabase aktif (Simulasi)';
                showToast('Menyinkronkan data lokal ke cloud...');
                setTimeout(() => showToast('Login Berhasil! Data lokal dipindahkan ke database online (Simulasi).'), 1200);
            } else {
                localStorage.removeItem('transaksiku_entry_choice');
                localStorage.removeItem('transaksiku_user_logged_in');
                showToast('Akun Google diputus.');
                setTimeout(() => window.location.reload(), 800);
            }
        };

        // WELCOME SCREEN & ENTRY FLOW
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
        window.checkEntryChoice = checkEntryChoice;

        window.handleEntryChoice = function(choice) {
            localStorage.setItem('transaksiku_entry_choice', choice);
            if (choice === 'online') {
                localStorage.setItem('transaksiku_user_logged_in', 'true');
                showToast('Login Google Berhasil! Sinkronisasi Supabase Aktif.');
            } else {
                showToast('Masuk sebagai Tamu (Offline).');
            }
            checkEntryChoice();
            updateEntryUI();
        };

        function updateEntryUI() {
            const choice = localStorage.getItem('transaksiku_entry_choice');
            const btn = document.getElementById('google-login-btn');
            const statusTitle = document.getElementById('sync-status-title');
            const statusDesc = document.getElementById('sync-status-desc');
            if (!btn || !statusTitle || !statusDesc) return;

            if (choice === 'online') {
                btn.innerHTML = '<span>Keluar Akun Google</span>';
                btn.style.background = 'var(--danger)';
                btn.style.color = 'white';
                statusTitle.innerText = 'Akun Terhubung: budi@gmail.com';
                statusDesc.innerText = 'Sinkronisasi Supabase aktif (Simulasi)';
            } else {
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.87 3C6.18 7.73 8.87 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"/><path fill="#FBBC05" d="M5.27 14.56c-.25-.73-.39-1.5-.39-2.31s.14-1.58.39-2.31L1.4 6.94C.51 8.71 0 10.74 0 12.9s.51 4.19 1.4 5.96l3.87-3.3z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.13 0-5.82-2.69-6.77-5.52l-3.87 3C3.37 20.35 7.35 23 12 23z"/></svg><span>Masuk dengan Google</span>';
                btn.style.background = 'white';
                btn.style.color = '#374151';
                statusTitle.innerText = 'Mode Offline Aktif';
                statusDesc.innerText = 'Data hanya tersimpan di browser Anda saat ini.';
            }
        }
        window.updateEntryUI = updateEntryUI;

        window.handleResetAllData = function() {
            showCustomModal(
                'Konfirmasi Hapus Data',
                'Apakah Anda yakin ingin menghapus seluruh data transaksi, dompet, kategori kustom, dan pengaturan Anda? Tindakan ini tidak dapat dibatalkan.',
                function() {
                    localStorage.clear();
                    showToast('Seluruh data berhasil dihapus!');
                    setTimeout(() => window.location.reload(), 1000);
                },
                true
            );
        };
    