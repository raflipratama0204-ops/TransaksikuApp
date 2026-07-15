// MODUL UTILITY & POPUP DIALOGS

// Format mata uang berdasarkan preferensi pengaturan
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

// Efek suara klik taktil menggunakan Web Audio API
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

// Menampilkan pesan notifikasi toast singkat di bagian atas
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

// Menampilkan tooltip informasi metrik dashboard
function showMetricInfo(type, event) {
    if (event) event.stopPropagation();

    const button = event ? event.currentTarget : null;
    if (!button) return;

    const existingTooltip = document.querySelector(`.metric-tooltip[data-type="${type}"]`);
    if (existingTooltip) {
        if (event && event.type === 'click') {
            existingTooltip.classList.remove('show');
            setTimeout(() => existingTooltip.remove(), 200);
        }
        return;
    }

    // Close other tooltips
    document.querySelectorAll('.metric-tooltip').forEach(el => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 200);
    });

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

    const tooltip = document.createElement('div');
    tooltip.className = 'metric-tooltip';
    tooltip.dataset.type = type;
    tooltip.innerText = text;

    const closeBtn = document.createElement('span');
    closeBtn.innerText = '×';
    closeBtn.style.cssText = 'float: right; cursor: pointer; font-weight: bold; font-size: 14px; margin-left: 10px; color: var(--text-muted); line-height: 1;';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        tooltip.classList.remove('show');
        setTimeout(() => tooltip.remove(), 200);
    };
    tooltip.insertBefore(closeBtn, tooltip.firstChild);

    tooltip.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.body.appendChild(tooltip);

    const rect = button.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const tooltipWidth = 240;
    let leftPos = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);

    if (leftPos < 10) leftPos = 10;
    const maxLeft = window.innerWidth + scrollLeft - tooltipWidth - 10;
    if (leftPos > maxLeft) leftPos = maxLeft;

    tooltip.style.left = leftPos + 'px';
    tooltip.style.top = (rect.bottom + scrollTop + 6) + 'px';

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

// Menutup semua tooltip aktif
document.addEventListener('click', () => {
    document.querySelectorAll('.metric-tooltip').forEach(el => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 200);
    });
});

// Format input mata uang secara otomatis saat diketik
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

// Mengubah teks input mata uang kembali menjadi nilai angka desimal
function parseCurrencyValue(value) {
    if (!value) return 0;
    let strVal = value.toString();
    let isNegative = strVal.startsWith('-');
    let cleanVal = strVal.replace(/[^0-9]/g, '');
    let parsed = parseFloat(cleanVal) || 0;
    return isNegative ? -parsed : parsed;
}

// Membuat modal popup kustom berbasis Promise
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

// Menentukan tanggal default hari ini pada form transaksi
function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateInput = document.getElementById('trans-date');
    if (dateInput) {
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
}
