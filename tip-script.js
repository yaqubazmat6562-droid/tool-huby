/* ============================================================
   TIP CALCULATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentResult = null;
let history = JSON.parse(localStorage.getItem('toolhub_tip_history')) || [];

// ============ DOM ELEMENTS ============
const billAmount = document.getElementById('bill-amount');
const tipSlider = document.getElementById('tip-slider');
const tipBadge = document.getElementById('tip-badge');
const splitCount = document.getElementById('split-count');
const rounding = document.getElementById('rounding');
const taxPercent = document.getElementById('tax-percent');
const discountPercent = document.getElementById('discount-percent');
const advancedBody = document.getElementById('advanced-body');
const advancedIcon = document.getElementById('advanced-icon');

// Result elements
const mainResultValue = document.getElementById('main-result-value');
const mainResultSub = document.getElementById('main-result-sub');
const statBill = document.getElementById('stat-bill');
const statTip = document.getElementById('stat-tip');
const statTax = document.getElementById('stat-tax');
const statDiscount = document.getElementById('stat-discount');
const statTotal = document.getElementById('stat-total');
const statPerPerson = document.getElementById('stat-per-person');
const barBill = document.getElementById('bar-bill');
const barTax = document.getElementById('bar-tax');
const barTip = document.getElementById('bar-tip');
const compositionTotal = document.getElementById('composition-total');

// History
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// ============ SET BILL ============
function setBill(value) {
    billAmount.value = value;
    calculate();
}

// ============ SET TIP ============
function setTip(value) {
    tipSlider.value = value;
    tipBadge.innerText = value + '%';
    
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.tip) === value);
    });
    
    calculate();
}

// ============ CHANGE SPLIT ============
function changeSplit(delta) {
    let current = parseInt(splitCount.value) || 1;
    current = Math.max(1, Math.min(100, current + delta));
    splitCount.value = current;
    calculate();
}

// ============ TOGGLE ADVANCED ============
function toggleAdvanced() {
    advancedBody.classList.toggle('open');
    advancedIcon.classList.toggle('rotated');
}

// ============ CALCULATE ============
function calculate() {
    const bill = parseFloat(billAmount.value) || 0;
    const tipPct = parseFloat(tipSlider.value) || 0;
    const split = Math.max(1, parseInt(splitCount.value) || 1);
    const taxPct = parseFloat(taxPercent.value) || 0;
    const discountPct = parseFloat(discountPercent.value) || 0;
    const roundingMode = rounding.value;

    // Update tip badge
    tipBadge.innerText = tipPct + '%';

    // Calculations
    const discountAmount = (bill * discountPct) / 100;
    const billAfterDiscount = bill - discountAmount;
    
    const taxAmount = (billAfterDiscount * taxPct) / 100;
    const billWithTax = billAfterDiscount + taxAmount;
    
    const tipAmount = (billWithTax * tipPct) / 100;
    
    let total = billWithTax + tipAmount;

    // Apply rounding
    if (roundingMode === 'nearest') total = Math.round(total);
    else if (roundingMode === 'up') total = Math.ceil(total);
    else if (roundingMode === 'down') total = Math.floor(total);

    const perPerson = total / split;

    // Store result
    currentResult = {
        bill: bill,
        tipPct: tipPct,
        tipAmount: tipAmount,
        taxPct: taxPct,
        taxAmount: taxAmount,
        discountPct: discountPct,
        discountAmount: discountAmount,
        total: total,
        split: split,
        perPerson: perPerson,
        rounding: roundingMode,
        timestamp: Date.now()
    };

    // Update UI
    renderResult(currentResult);
}

// ============ RENDER RESULT ============
function renderResult(r) {
    // Main result
    mainResultValue.innerText = formatCurrency(r.perPerson);
    
    if (r.split > 1) {
        mainResultSub.innerText = `${r.split} people × ${formatCurrency(r.perPerson)} = ${formatCurrency(r.total)}`;
    } else {
        mainResultSub.innerText = `Total: ${formatCurrency(r.total)} (Tip: ${r.tipPct}%)`;
    }

    // Stats
    statBill.innerText = formatCurrency(r.bill);
    statTip.innerText = formatCurrency(r.tipAmount);
    statTax.innerText = r.taxAmount > 0 ? formatCurrency(r.taxAmount) : '$0.00';
    statDiscount.innerText = r.discountAmount > 0 ? '-' + formatCurrency(r.discountAmount) : '$0.00';
    statTotal.innerText = formatCurrency(r.total);
    statPerPerson.innerText = formatCurrency(r.perPerson);

    // Composition bar
    const billBase = r.bill - r.discountAmount;
    const billSegment = billBase > 0 ? billBase : 0;
    const taxSegment = r.taxAmount;
    const tipSegment = r.tipAmount;
    const totalForBar = billSegment + taxSegment + tipSegment;

    compositionTotal.innerText = formatCurrency(r.total);

    if (totalForBar > 0) {
        const billPct = (billSegment / totalForBar) * 100;
        const taxPct = (taxSegment / totalForBar) * 100;
        const tipPct = (tipSegment / totalForBar) * 100;

        barBill.style.width = billPct + '%';
        barTax.style.width = taxPct + '%';
        barTip.style.width = tipPct + '%';
    } else {
        barBill.style.width = '0%';
        barTax.style.width = '0%';
        barTip.style.width = '0%';
    }
}

// ============ FORMAT CURRENCY ============
function formatCurrency(num) {
    if (!isFinite(num)) return '$0.00';
    return '$' + Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ============ LOAD SAMPLE ============
function loadSample() {
    billAmount.value = 87.50;
    tipSlider.value = 18;
    splitCount.value = 4;
    taxPercent.value = 8;
    discountPercent.value = 0;
    rounding.value = 'none';
    
    // Open advanced if has value
    if (!advancedBody.classList.contains('open')) {
        toggleAdvanced();
    }
    
    // Update tip buttons
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.tip) === 18);
    });
    
    calculate();
    showToast('🧪 Sample loaded!');
}

// ============ RESET ALL ============
function resetAll() {
    if (!confirm('Kya aap sab kuch reset karna chahte hain?')) return;
    
    billAmount.value = 50;
    tipSlider.value = 15;
    splitCount.value = 1;
    taxPercent.value = 0;
    discountPercent.value = 0;
    rounding.value = 'none';
    
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.tip) === 15);
    });
    
    calculate();
    showToast('🧹 Reset complete!');
}

// ============ COPY RESULT ============
function copyResult() {
    if (!currentResult) return showToast('❌ Nothing to copy!', 'error');

    const r = currentResult;
    const lines = [
        '💰 BILL SUMMARY',
        '═══════════════════════════════',
        `Bill Amount:       ${formatCurrency(r.bill)}`,
    ];

    if (r.discountAmount > 0) {
        lines.push(`Discount (${r.discountPct}%):   -${formatCurrency(r.discountAmount)}`);
    }
    if (r.taxAmount > 0) {
        lines.push(`Tax (${r.taxPct}%):          ${formatCurrency(r.taxAmount)}`);
    }
    lines.push(`Tip (${r.tipPct}%):          ${formatCurrency(r.tipAmount)}`);
    lines.push('─────────────────────────────');
    lines.push(`Total:             ${formatCurrency(r.total)}`);
    lines.push('');
    lines.push(`Split between:     ${r.split} ${r.split > 1 ? 'people' : 'person'}`);
    lines.push(`Per Person:        ${formatCurrency(r.perPerson)}`);
    lines.push('');
    lines.push(`Generated by Tool Hub • ${new Date().toLocaleString()}`);

    const text = lines.join('\n');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Summary copied!');
    }).catch(() => {
        showToast('❌ Copy failed!', 'error');
    });
}

// ============ SHARE RESULT ============
function shareResult() {
    if (!currentResult) return showToast('❌ Nothing to share!', 'error');
    const r = currentResult;
    const text = `Bill: ${formatCurrency(r.bill)} • Tip ${r.tipPct}%: ${formatCurrency(r.tipAmount)} • Total: ${formatCurrency(r.total)}${r.split > 1 ? ` • Per Person: ${formatCurrency(r.perPerson)}` : ''}`;

    if (navigator.share) {
        navigator.share({
            title: 'Tip Calculator Result',
            text: text,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('🔗 Result copied!');
        }).catch(() => {
            showToast('❌ Could not share!', 'error');
        });
    }
}

// ============ SAVE TO HISTORY ============
function saveToHistory() {
    if (!currentResult) return showToast('❌ Nothing to save!', 'error');

    const r = currentResult;
    const entry = {
        bill: r.bill,
        tipPct: r.tipPct,
        tipAmount: r.tipAmount,
        total: r.total,
        split: r.split,
        perPerson: r.perPerson,
        time: Date.now()
    };

    // Avoid immediate duplicates
    const last = history[0];
    if (last && last.bill === r.bill && last.total === r.total && (Date.now() - last.time) < 3000) {
        return showToast('⚠️ Already saved!', 'error');
    }

    history.unshift(entry);
    if (history.length > 20) history.pop();

    try {
        localStorage.setItem('toolhub_tip_history', JSON.stringify(history));
    } catch (e) {}

    renderHistory();
    showToast('💾 Saved to history!');
}

// ============ RENDER HISTORY ============
function renderHistory() {
    if (history.length === 0) {
        historyPanel.style.display = 'none';
        return;
    }

    historyPanel.style.display = 'block';

    historyList.innerHTML = history.map((h, idx) => `
        <div class="history-item" onclick="loadFromHistory(${idx})">
            <div class="history-info">
                <div class="history-main">${formatCurrency(h.bill)} • Tip ${h.tipPct}%</div>
                <div class="history-sub">${h.split > 1 ? `Split ${h.split} • ` : ''}${formatTime(h.time)}</div>
            </div>
            <div class="history-value">${formatCurrency(h.perPerson)}</div>
        </div>
    `).join('');
}

function loadFromHistory(idx) {
    const h = history[idx];
    if (!h) return;

    billAmount.value = h.bill;
    tipSlider.value = h.tipPct;
    splitCount.value = h.split;
    
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.tip) === h.tipPct);
    });
    
    calculate();
    showToast('📋 Loaded from history');
}

function clearHistory() {
    if (history.length === 0) return;
    if (!confirm('Kya aap saari history clear karna chahte hain?')) return;
    history = [];
    localStorage.removeItem('toolhub_tip_history');
    renderHistory();
    showToast('🧹 History cleared!');
}

function formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Tip Calculator - Tool Hub',
        text: 'Check out this free Tip Calculator tool!',
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

// ============ EVENT LISTENERS ============
billAmount.addEventListener('input', calculate);
tipSlider.addEventListener('input', () => {
    tipBadge.innerText = tipSlider.value + '%';
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.tip) === parseInt(tipSlider.value));
    });
    calculate();
});

splitCount.addEventListener('input', calculate);
rounding.addEventListener('change', calculate);
taxPercent.addEventListener('input', calculate);
discountPercent.addEventListener('input', calculate);

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveToHistory();
    }
    // Ctrl/Cmd + Shift + C → Copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyResult();
    }
    // Ctrl/Cmd + Shift + X → Reset
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        resetAll();
    }
});

// ============ INITIALIZE ============
calculate();
renderHistory();