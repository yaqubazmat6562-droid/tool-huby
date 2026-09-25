/* ============================================================
   CURRENCY CONVERTER - Tool Hub
   Standalone JavaScript Logic
   Using Frankfurter API (free, no API key, CORS enabled)
   ============================================================ */

// ============ STATE ============
const API_BASE = 'https://api.frankfurter.dev/v2';
let currencies = {};
let ratesCache = null;
let lastFetchTime = null;
let history = JSON.parse(localStorage.getItem('toolhub_currency_history')) || [];

// ============ CURRENCY FLAGS & NAMES ============
const CURRENCY_META = {
    USD: { flag: '🇺🇸', name: 'US Dollar' },
    EUR: { flag: '🇪🇺', name: 'Euro' },
    GBP: { flag: '🇬🇧', name: 'British Pound' },
    JPY: { flag: '🇯🇵', name: 'Japanese Yen' },
    AUD: { flag: '🇦🇺', name: 'Australian Dollar' },
    CAD: { flag: '🇨🇦', name: 'Canadian Dollar' },
    CHF: { flag: '🇨🇭', name: 'Swiss Franc' },
    CNY: { flag: '🇨🇳', name: 'Chinese Yuan' },
    INR: { flag: '🇮🇳', name: 'Indian Rupee' },
    PKR: { flag: '🇵🇰', name: 'Pakistani Rupee' },
    AED: { flag: '🇦🇪', name: 'UAE Dirham' },
    SAR: { flag: '🇸🇦', name: 'Saudi Riyal' },
    SGD: { flag: '🇸🇬', name: 'Singapore Dollar' },
    HKD: { flag: '🇭🇰', name: 'Hong Kong Dollar' },
    KRW: { flag: '🇰🇷', name: 'South Korean Won' },
    TRY: { flag: '🇹🇷', name: 'Turkish Lira' },
    BRL: { flag: '🇧🇷', name: 'Brazilian Real' },
    ZAR: { flag: '🇿🇦', name: 'South African Rand' },
    MXN: { flag: '🇲🇽', name: 'Mexican Peso' },
    NZD: { flag: '🇳🇿', name: 'New Zealand Dollar' },
    SEK: { flag: '🇸🇪', name: 'Swedish Krona' },
    NOK: { flag: '🇳🇴', name: 'Norwegian Krone' },
    DKK: { flag: '🇩🇰', name: 'Danish Krone' },
    PLN: { flag: '🇵🇱', name: 'Polish Zloty' },
    THB: { flag: '🇹🇭', name: 'Thai Baht' },
    IDR: { flag: '🇮🇩', name: 'Indonesian Rupiah' },
    MYR: { flag: '🇲🇾', name: 'Malaysian Ringgit' },
    PHP: { flag: '🇵🇭', name: 'Philippine Peso' },
    VND: { flag: '🇻🇳', name: 'Vietnamese Dong' },
    EGP: { flag: '🇪🇬', name: 'Egyptian Pound' },
    NGN: { flag: '🇳🇬', name: 'Nigerian Naira' },
    KES: { flag: '🇰🇪', name: 'Kenyan Shilling' },
    BDT: { flag: '🇧🇩', name: 'Bangladeshi Taka' },
    LKR: { flag: '🇱🇰', name: 'Sri Lankan Rupee' },
    NPR: { flag: '🇳🇵', name: 'Nepalese Rupee' },
    CZK: { flag: '🇨🇿', name: 'Czech Koruna' },
    HUF: { flag: '🇭🇺', name: 'Hungarian Forint' },
    RON: { flag: '🇷🇴', name: 'Romanian Leu' },
    BGN: { flag: '🇧🇬', name: 'Bulgarian Lev' },
    HRK: { flag: '🇭🇷', name: 'Croatian Kuna' },
    ISK: { flag: '🇮🇸', name: 'Icelandic Krona' },
    ILS: { flag: '🇮🇱', name: 'Israeli Shekel' }
};

// ============ DEFAULT CURRENCIES ============
const DEFAULT_CURRENCIES = {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
    AUD: 'Australian Dollar', CAD: 'Canadian Dollar', CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan', INR: 'Indian Rupee', PKR: 'Pakistani Rupee',
    AED: 'UAE Dirham', SAR: 'Saudi Riyal', SGD: 'Singapore Dollar',
    HKD: 'Hong Kong Dollar', KRW: 'South Korean Won', TRY: 'Turkish Lira',
    BRL: 'Brazilian Real', ZAR: 'South African Rand', MXN: 'Mexican Peso',
    NZD: 'New Zealand Dollar', SEK: 'Swedish Krona', NOK: 'Norwegian Krone',
    DKK: 'Danish Krone', PLN: 'Polish Zloty', THB: 'Thai Baht',
    IDR: 'Indonesian Rupiah', MYR: 'Malaysian Ringgit', PHP: 'Philippine Peso',
    VND: 'Vietnamese Dong', EGP: 'Egyptian Pound', NGN: 'Nigerian Naira',
    KES: 'Kenyan Shilling', BDT: 'Bangladeshi Taka', LKR: 'Sri Lankan Rupee',
    NPR: 'Nepalese Rupee', CZK: 'Czech Koruna', HUF: 'Hungarian Forint',
    RON: 'Romanian Leu', BGN: 'Bulgarian Lev', HRK: 'Croatian Kuna',
    ISK: 'Icelandic Krona', ILS: 'Israeli Shekel'
};

// ============ DOM ELEMENTS ============
const amountInput = document.getElementById('amount-input');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const fromFlag = document.getElementById('from-flag');
const toFlag = document.getElementById('to-flag');
const resultAmount = document.getElementById('result-amount');
const resultCurrency = document.getElementById('result-currency');
const resultSub = document.getElementById('result-sub');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const quickGrid = document.getElementById('quick-grid');
const ratesGrid = document.getElementById('rates-grid');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// ============ INITIALIZE ============
async function init() {
    // Populate currency dropdowns
    populateCurrencies(DEFAULT_CURRENCIES);
    
    // Set defaults
    fromCurrency.value = 'USD';
    toCurrency.value = 'EUR';
    updateFlags();
    
    // Fetch live rates
    await fetchRates();
    
    // Render
    renderQuickConversions();
    renderPopularRates();
    renderHistory();
    
    // Initial convert
    convertCurrency();
    
    // Setup input listener
    amountInput.addEventListener('input', debounce(convertCurrency, 300));
}

// ============ DEBOUNCE ============
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// ============ POPULATE CURRENCIES ============
function populateCurrencies(currencyList) {
    const sorted = Object.entries(currencyList).sort((a, b) => a[0].localeCompare(b[0]));
    
    const options = sorted.map(([code, name]) => {
        const meta = CURRENCY_META[code];
        const flag = meta ? meta.flag : '🏳️';
        return `<option value="${code}">${flag} ${code} — ${name}</option>`;
    }).join('');
    
    fromCurrency.innerHTML = options;
    toCurrency.innerHTML = options;
}

// ============ UPDATE FLAGS ============
function updateFlags() {
    const fromMeta = CURRENCY_META[fromCurrency.value];
    const toMeta = CURRENCY_META[toCurrency.value];
    fromFlag.textContent = fromMeta ? fromMeta.flag : '🏳️';
    toFlag.textContent = toMeta ? toMeta.flag : '🏳️';
}

// ============ FETCH RATES (Frankfurter API) ============
async function fetchRates() {
    setStatus('loading', 'Fetching live rates...');
    
    try {
        // Fetch all rates based on USD
        const res = await fetch(`${API_BASE}/rates?base=USD`);
        
        if (!res.ok) {
            throw new Error(`API returned ${res.status}`);
        }
        
        const data = await res.json();
        
        // Frankfurter v2 returns an array of {base, quote, rate, date}
        if (Array.isArray(data)) {
            ratesCache = {};
            data.forEach(row => {
                ratesCache[row.quote] = row.rate;
            });
            ratesCache['USD'] = 1;
        } else {
            throw new Error('Unexpected API response');
        }
        
        lastFetchTime = new Date();
        
        // Save to localStorage for offline fallback
        try {
            localStorage.setItem('toolhub_currency_rates', JSON.stringify({
                rates: ratesCache,
                timestamp: lastFetchTime.toISOString()
            }));
        } catch (e) {
            // Ignore storage errors
        }
        
        setStatus('live', `Live rates • ${formatTime(lastFetchTime)}`);
        showToast('✅ Live rates loaded!');
        
        return true;
    } catch (err) {
        console.error('Failed to fetch rates:', err);
        
        // Try cached rates
        const cached = localStorage.getItem('toolhub_currency_rates');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                ratesCache = parsed.rates;
                lastFetchTime = new Date(parsed.timestamp);
                setStatus('cached', `Cached rates • ${formatTime(lastFetchTime)}`);
                showToast('⚠️ Using cached rates', 'error');
                return true;
            } catch (e) {
                // Ignore
            }
        }
        
        // Use fallback rates if nothing else works
        ratesCache = getFallbackRates();
        setStatus('error', 'Offline mode — using approximate rates');
        showToast('⚠️ Using approximate rates', 'error');
        return false;
    }
}

// ============ FALLBACK RATES ============
function getFallbackRates() {
    return {
        USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150.5, AUD: 1.52,
        CAD: 1.36, CHF: 0.88, CNY: 7.24, INR: 83.5, PKR: 278.5,
        AED: 3.67, SAR: 3.75, SGD: 1.34, HKD: 7.82, KRW: 1330,
        TRY: 32.5, BRL: 5.05, ZAR: 18.5, MXN: 17.2, NZD: 1.64,
        SEK: 10.5, NOK: 10.7, DKK: 6.85, PLN: 3.95, THB: 35.5,
        IDR: 15800, MYR: 4.72, PHP: 56.5, VND: 24500, EGP: 47.5,
        NGN: 1450, KES: 145, BDT: 110, LKR: 300, NPR: 133,
        CZK: 23, HUF: 355, RON: 4.57, BGN: 1.80, HRK: 6.93,
        ISK: 138, ILS: 3.75
    };
}

// ============ SET STATUS ============
function setStatus(type, message) {
    statusDot.className = 'status-dot';
    if (type === 'live') statusDot.classList.add('live');
    else if (type === 'cached') statusDot.classList.add('cached');
    else if (type === 'error') statusDot.classList.add('error');
    statusText.textContent = message;
}

// ============ FORMAT TIME ============
function formatTime(date) {
    if (!date) return 'unknown';
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
}

// ============ ON CURRENCY CHANGE ============
function onCurrencyChange() {
    updateFlags();
    convertCurrency();
}

// ============ SWAP CURRENCIES ============
function swapCurrencies() {
    const from = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = from;
    updateFlags();
    convertCurrency();
    showToast('🔄 Currencies swapped!');
}

// ============ SET AMOUNT ============
function setAmount(value) {
    amountInput.value = value;
    convertCurrency();
}

// ============ CONVERT CURRENCY ============
function convertCurrency() {
    if (!ratesCache) {
        resultSub.textContent = 'Rates not loaded yet...';
        return;
    }
    
    const amount = parseFloat(amountInput.value) || 0;
    const from = fromCurrency.value;
    const to = toCurrency.value;
    
    if (from === to) {
        resultAmount.textContent = formatNumber(amount);
        resultCurrency.textContent = to;
        resultSub.textContent = `1 ${from} = 1 ${to}`;
        return;
    }
    
    // Convert via USD base
    const fromRate = ratesCache[from] || 1;
    const toRate = ratesCache[to] || 1;
    const rate = toRate / fromRate;
    const converted = amount * rate;
    
    resultAmount.textContent = formatNumber(converted);
    resultCurrency.textContent = to;
    resultSub.textContent = `1 ${from} = ${formatRate(rate)} ${to}`;
    
    // Save to history
    saveToHistory(amount, from, to, converted, rate);
}

// ============ FORMAT NUMBER ============
function formatNumber(num) {
    if (!isFinite(num)) return '—';
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e12) return num.toExponential(4);
    
    // Determine decimal places based on magnitude
    let decimals;
    if (Math.abs(num) < 0.01) decimals = 6;
    else if (Math.abs(num) < 1) decimals = 4;
    else if (Math.abs(num) < 1000) decimals = 2;
    else decimals = 2;
    
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// ============ FORMAT RATE ============
function formatRate(rate) {
    if (rate >= 1000) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    return rate.toFixed(6);
}

// ============ HISTORY ============
function saveToHistory(amount, from, to, converted, rate) {
    const entry = {
        amount: amount,
        from: from,
        to: to,
        converted: converted,
        rate: rate,
        time: Date.now()
    };
    
    // Remove duplicates (same pair + amount within 3 seconds)
    const now = Date.now();
    history = history.filter(h => {
        return !(h.from === from && h.to === to && h.amount === amount && (now - h.time) < 3000);
    });
    
    history.unshift(entry);
    if (history.length > 20) history.pop();
    
    try {
        localStorage.setItem('toolhub_currency_history', JSON.stringify(history));
    } catch (e) {
        // Ignore storage errors
    }
    
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyPanel.style.display = 'none';
        return;
    }
    
    historyPanel.style.display = 'block';
    
    historyList.innerHTML = history.map((h, idx) => `
        <div class="history-item" onclick="loadFromHistory(${idx})">
            <div class="history-conversion">
                <span class="history-from">${formatNumber(h.amount)} ${h.from}</span>
                <span class="history-arrow"><i class="fa-solid fa-arrow-right"></i></span>
                <span class="history-to">${formatNumber(h.converted)} ${h.to}</span>
            </div>
            <span class="history-time">${formatTime(new Date(h.time))}</span>
        </div>
    `).join('');
}

function loadFromHistory(idx) {
    const h = history[idx];
    if (!h) return;
    amountInput.value = h.amount;
    fromCurrency.value = h.from;
    toCurrency.value = h.to;
    updateFlags();
    convertCurrency();
    showToast('📋 Loaded from history');
}

function clearHistory() {
    if (history.length === 0) return;
    if (!confirm('Kya aap conversion history clear karna chahte hain?')) return;
    history = [];
    localStorage.removeItem('toolhub_currency_history');
    renderHistory();
    showToast('🧹 History cleared!');
}

// ============ QUICK CONVERSIONS ============
const QUICK_PAIRS = [
    { from: 'USD', to: 'EUR' },
    { from: 'USD', to: 'GBP' },
    { from: 'USD', to: 'PKR' },
    { from: 'USD', to: 'INR' },
    { from: 'EUR', to: 'USD' },
    { from: 'GBP', to: 'USD' },
    { from: 'USD', to: 'AED' },
    { from: 'USD', to: 'SAR' }
];

function renderQuickConversions() {
    if (!ratesCache) return;
    
    quickGrid.innerHTML = QUICK_PAIRS.map((pair, idx) => {
        const fromRate = ratesCache[pair.from] || 1;
        const toRate = ratesCache[pair.to] || 1;
        const rate = toRate / fromRate;
        const fromMeta = CURRENCY_META[pair.from];
        const toMeta = CURRENCY_META[pair.to];
        
        return `
            <button class="quick-card" onclick="applyQuickPair(${idx})">
                <div class="quick-pair">
                    <span>${fromMeta ? fromMeta.flag : ''}</span>
                    <span class="from-code">${pair.from}</span>
                    <span class="arrow"><i class="fa-solid fa-arrow-right"></i></span>
                    <span>${toMeta ? toMeta.flag : ''}</span>
                    <span class="to-code">${pair.to}</span>
                </div>
                <div class="quick-value">${formatRate(rate)}</div>
            </button>
        `;
    }).join('');
}

function applyQuickPair(idx) {
    const pair = QUICK_PAIRS[idx];
    fromCurrency.value = pair.from;
    toCurrency.value = pair.to;
    updateFlags();
    convertCurrency();
    showToast(`⚡ ${pair.from} → ${pair.to}`);
}

// ============ POPULAR RATES ============
const POPULAR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'INR', 'PKR', 'AED', 'SAR', 'CNY'];

function renderPopularRates() {
    if (!ratesCache) return;
    
    const usdRate = ratesCache['USD'] || 1;
    
    ratesGrid.innerHTML = POPULAR_CURRENCIES.map(code => {
        const rate = (ratesCache[code] || 0) / usdRate;
        const meta = CURRENCY_META[code];
        return `
            <div class="rate-card">
                <div class="rate-flag">${meta ? meta.flag : '🏳️'}</div>
                <div class="rate-info">
                    <div class="rate-code">${code}</div>
                    <div class="rate-value">${formatRate(rate)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============ REFRESH RATES ============
async function refreshRates() {
    showToast('🔄 Refreshing rates...');
    await fetchRates();
    renderQuickConversions();
    renderPopularRates();
    convertCurrency();
}

// ============ COPY RESULT ============
function copyResult() {
    const amount = resultAmount.textContent;
    const currency = resultCurrency.textContent;
    if (!amount || amount === '—') return showToast('❌ Nothing to copy!', 'error');
    
    const text = `${amount} ${currency}`;
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Result copied!');
    }).catch(() => {
        showToast('❌ Copy failed!', 'error');
    });
}

// ============ SHARE ============
function shareTool() {
    const shareData = {
        title: 'Currency Converter - Tool Hub',
        text: 'Check out this free Currency Converter tool!',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Link copied!');
        }).catch(() => {
            showToast('❌ Could not copy!', 'error');
        });
    }
}

// ============ TOAST ============
let toastTimeout;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');
    
    toastMsg.innerText = message;
    toast.classList.remove('error');
    
    if (type === 'error') {
        toast.classList.add('error');
        toastIcon.className = 'fa-solid fa-circle-exclamation';
    } else {
        toastIcon.className = 'fa-solid fa-circle-check';
    }
    
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2200);
}

// ============ DARK MODE ============
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        document.body.classList.remove('dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('toolhub_theme', newTheme);
});

applyTheme(localStorage.getItem('toolhub_theme') || 'light');

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Convert
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        convertCurrency();
        showToast('✅ Converted!');
    }
    // Ctrl/Cmd + Shift + S → Swap
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        swapCurrencies();
    }
    // Ctrl/Cmd + Shift + C → Copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyResult();
    }
    // Ctrl/Cmd + Shift + R → Refresh
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        refreshRates();
    }
});

// ============ INITIALIZE ============
init();