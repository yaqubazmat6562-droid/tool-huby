/* ============================================================
   SIMPLE INTEREST CALCULATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentMode = 'calculate-si';
let currentTimeUnit = 'years';
let currentResult = null;
let history = JSON.parse(localStorage.getItem('toolhub_si_history')) || [];

// ============ INPUT DEFINITIONS PER MODE ============
const INPUT_DEFS = {
    'calculate-si': [
        { id: 'input-p', label: 'Principal Amount', icon: 'fa-money-bill-wave', prefix: '$', placeholder: '10000', value: 10000, hint: 'P' },
        { id: 'input-r', label: 'Annual Interest Rate', icon: 'fa-percent', suffix: '%', placeholder: '7.5', value: 7.5, hint: 'R' },
        { id: 'input-t', label: 'Time Period', icon: 'fa-clock', placeholder: '5', value: 5, hint: 'T', isTime: true }
    ],
    'find-principal': [
        { id: 'input-si', label: 'Simple Interest', icon: 'fa-coins', prefix: '$', placeholder: '5000', value: 5000, hint: 'SI' },
        { id: 'input-r', label: 'Annual Interest Rate', icon: 'fa-percent', suffix: '%', placeholder: '7.5', value: 7.5, hint: 'R' },
        { id: 'input-t', label: 'Time Period', icon: 'fa-clock', placeholder: '5', value: 5, hint: 'T', isTime: true }
    ],
    'find-rate': [
        { id: 'input-si', label: 'Simple Interest', icon: 'fa-coins', prefix: '$', placeholder: '5000', value: 5000, hint: 'SI' },
        { id: 'input-p', label: 'Principal Amount', icon: 'fa-money-bill-wave', prefix: '$', placeholder: '10000', value: 10000, hint: 'P' },
        { id: 'input-t', label: 'Time Period', icon: 'fa-clock', placeholder: '5', value: 5, hint: 'T', isTime: true }
    ],
    'find-time': [
        { id: 'input-si', label: 'Simple Interest', icon: 'fa-coins', prefix: '$', placeholder: '5000', value: 5000, hint: 'SI' },
        { id: 'input-p', label: 'Principal Amount', icon: 'fa-money-bill-wave', prefix: '$', placeholder: '10000', value: 10000, hint: 'P' },
        { id: 'input-r', label: 'Annual Interest Rate', icon: 'fa-percent', suffix: '%', placeholder: '7.5', value: 7.5, hint: 'R' }
    ]
};

// ============ DOM ELEMENTS ============
const inputGrid = document.getElementById('input-grid');
const inputTitle = document.getElementById('input-title');
const timeUnitSection = document.getElementById('time-unit-section');
const mainResult = document.getElementById('main-result');
const mainResultLabel = document.getElementById('main-result-label');
const mainResultValue = document.getElementById('main-result-value');
const mainResultSub = document.getElementById('main-result-sub');
const donutPrincipal = document.getElementById('donut-principal');
const donutInterest = document.getElementById('donut-interest');
const donutTotal = document.getElementById('donut-total');
const legendPrincipal = document.getElementById('legend-principal');
const legendInterest = document.getElementById('legend-interest');
const legendTotal = document.getElementById('legend-total');
const statPrincipal = document.getElementById('stat-principal');
const statRate = document.getElementById('stat-rate');
const statTime = document.getElementById('stat-time');
const statMaturity = document.getElementById('stat-maturity');
const breakdownPanel = document.getElementById('breakdown-panel');
const breakdownBody = document.getElementById('breakdown-body');
const breakdownInfo = document.getElementById('breakdown-info');
const comparisonPanel = document.getElementById('comparison-panel');
const comparisonGrid = document.getElementById('comparison-grid');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// ============ SET MODE ============
function setMode(mode) {
    currentMode = mode;
    
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    // Update title
    const titles = {
        'calculate-si': 'Enter Principal, Rate & Time',
        'find-principal': 'Enter SI, Rate & Time',
        'find-rate': 'Enter SI, Principal & Time',
        'find-time': 'Enter SI, Principal & Rate'
    };
    inputTitle.innerText = titles[mode] || 'Enter Values';
    
    renderInputs();
    calculate();
    showToast(`🔄 Mode changed`);
}

// ============ RENDER INPUTS ============
function renderInputs() {
    const fields = INPUT_DEFS[currentMode] || [];
    
    let showTimeUnit = false;
    
    inputGrid.innerHTML = fields.map(field => {
        if (field.isTime) showTimeUnit = true;
        
        const hasPrefix = field.prefix && field.prefix !== '';
        const hasSuffix = field.suffix && field.suffix !== '';
        const inputValue = field.isTime && currentTimeUnit !== 'years' 
            ? convertTime(field.value, currentTimeUnit) 
            : field.value;
        
        return `
            <div class="input-field">
                <label for="${field.id}">
                    <i class="fa-solid ${field.icon}"></i> ${field.label}
                    <span class="value-badge" style="background:var(--info);">${field.hint}</span>
                </label>
                <div class="input-wrap">
                    ${hasPrefix ? `<span class="input-prefix">${field.prefix}</span>` : ''}
                    <input type="number" 
                           id="${field.id}" 
                           class="${hasPrefix ? 'has-prefix' : ''} ${hasSuffix ? 'has-suffix' : ''}"
                           placeholder="${field.placeholder}" 
                           value="${inputValue}"
                           min="0"
                           step="any">
                    ${hasSuffix ? `<span class="input-suffix">${field.suffix}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Show/hide time unit section
    timeUnitSection.style.display = showTimeUnit ? 'block' : 'none';
    
    // Attach listeners
    inputGrid.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', debounceCalc);
    });
}

// ============ TIME UNIT ============
function setTimeUnit(unit) {
    const previousUnit = currentTimeUnit;
    currentTimeUnit = unit;
    
    document.querySelectorAll('.unit-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
    });
    
    // Convert current T value
    const tInput = document.getElementById('input-t');
    if (tInput) {
        const oldValue = parseFloat(tInput.value) || 0;
        const years = convertToYears(oldValue, previousUnit);
        tInput.value = convertFromYears(years, unit).toFixed(2);
    }
    
    calculate();
    showToast(`⏱️ Time unit: ${unit}`);
}

function convertToYears(value, unit) {
    switch (unit) {
        case 'years': return value;
        case 'months': return value / 12;
        case 'days': return value / 365;
    }
    return value;
}

function convertFromYears(years, unit) {
    switch (unit) {
        case 'years': return years;
        case 'months': return years * 12;
        case 'days': return years * 365;
    }
    return years;
}

function convertTime(years, unit) {
    return convertFromYears(years, unit).toFixed(2);
}

// ============ DEBOUNCE ============
let debounceTimer;
function debounceCalc() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(calculate, 200);
}

// ============ GET INPUT VALUE ============
function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = parseFloat(el.value);
    return isNaN(v) ? 0 : v;
}

// ============ CALCULATE ============
function calculate() {
    let result = null;
    
    switch (currentMode) {
        case 'calculate-si': {
            const p = getVal('input-p');
            const r = getVal('input-r');
            const tRaw = getVal('input-t');
            const t = convertToYears(tRaw, currentTimeUnit);
            
            if (p <= 0 || r < 0 || t <= 0) { resetResult(); return; }
            
            const si = (p * r * t) / 100;
            const maturity = p + si;
            
            result = {
                mode: 'calculate-si',
                label: 'Simple Interest',
                value: si,
                sub: `On $${formatNum(p)} at ${r}% for ${tRaw} ${currentTimeUnit}`,
                principal: p,
                rate: r,
                time: t,
                timeRaw: tRaw,
                si: si,
                maturity: maturity
            };
            break;
        }
        
        case 'find-principal': {
            const si = getVal('input-si');
            const r = getVal('input-r');
            const tRaw = getVal('input-t');
            const t = convertToYears(tRaw, currentTimeUnit);
            
            if (si <= 0 || r <= 0 || t <= 0) { resetResult(); return; }
            
            const p = (si * 100) / (r * t);
            const maturity = p + si;
            
            result = {
                mode: 'find-principal',
                label: 'Principal Amount',
                value: p,
                sub: `Required to earn $${formatNum(si)} interest at ${r}% for ${tRaw} ${currentTimeUnit}`,
                principal: p,
                rate: r,
                time: t,
                timeRaw: tRaw,
                si: si,
                maturity: maturity
            };
            break;
        }
        
        case 'find-rate': {
            const si = getVal('input-si');
            const p = getVal('input-p');
            const tRaw = getVal('input-t');
            const t = convertToYears(tRaw, currentTimeUnit);
            
            if (si <= 0 || p <= 0 || t <= 0) { resetResult(); return; }
            
            const r = (si * 100) / (p * t);
            const maturity = p + si;
            
            result = {
                mode: 'find-rate',
                label: 'Interest Rate',
                value: r,
                valueType: 'percent',
                sub: `To earn $${formatNum(si)} on $${formatNum(p)} in ${tRaw} ${currentTimeUnit}`,
                principal: p,
                rate: r,
                time: t,
                timeRaw: tRaw,
                si: si,
                maturity: maturity
            };
            break;
        }
        
        case 'find-time': {
            const si = getVal('input-si');
            const p = getVal('input-p');
            const r = getVal('input-r');
            
            if (si <= 0 || p <= 0 || r <= 0) { resetResult(); return; }
            
            const tYears = (si * 100) / (p * r);
            const tRaw = convertFromYears(tYears, currentTimeUnit);
            const maturity = p + si;
            
            result = {
                mode: 'find-time',
                label: 'Time Period',
                value: tRaw,
                valueType: 'time',
                sub: `To earn $${formatNum(si)} on $${formatNum(p)} at ${r}%`,
                principal: p,
                rate: r,
                time: tYears,
                timeRaw: tRaw,
                si: si,
                maturity: maturity
            };
            break;
        }
    }
    
    if (!result) { resetResult(); return; }
    
    currentResult = result;
    renderResult(result);
    renderBreakdown(result);
    renderComparison(result);
}

// ============ RENDER RESULT ============
function renderResult(r) {
    // Main result
    mainResult.className = 'main-result';
    if (r.mode === 'find-principal') mainResult.classList.add('principal-mode');
    else if (r.mode === 'find-rate') mainResult.classList.add('rate-mode');
    else if (r.mode === 'find-time') mainResult.classList.add('time-mode');
    
    mainResultLabel.innerText = r.label;
    
    if (r.valueType === 'percent') {
        mainResultValue.innerText = r.value.toFixed(2) + '%';
    } else if (r.valueType === 'time') {
        const unitShort = currentTimeUnit === 'years' ? 'Years' : currentTimeUnit === 'months' ? 'Months' : 'Days';
        mainResultValue.innerText = r.value.toFixed(2);
        mainResultSub.innerText = r.sub + ` • Unit: ${unitShort}`;
        // Skip second sub assignment below
    } else {
        mainResultValue.innerText = formatCurrency(r.value);
    }
    
    if (r.valueType !== 'time') {
        mainResultSub.innerText = r.sub;
    }
    
    // Stats
    statPrincipal.innerText = formatCurrencyShort(r.principal);
    statRate.innerText = r.rate.toFixed(2) + '%';
    
    const timeUnitShort = currentTimeUnit === 'years' ? 'Y' : currentTimeUnit === 'months' ? 'M' : 'D';
    statTime.innerText = `${r.timeRaw.toFixed(1)} ${timeUnitShort}`;
    
    statMaturity.innerText = formatCurrencyShort(r.maturity);
    
    // Legend
    legendPrincipal.innerText = formatCurrencyShort(r.principal);
    legendInterest.innerText = formatCurrencyShort(r.si);
    legendTotal.innerText = formatCurrencyShort(r.maturity);
    donutTotal.innerText = formatCurrencyShort(r.maturity);
    
    // Donut
    updateDonut(r.principal, r.si);
}

// ============ UPDATE DONUT ============
function updateDonut(principal, interest) {
    const total = principal + interest;
    if (total === 0) {
        donutPrincipal.style.strokeDashoffset = 502.65;
        donutInterest.style.strokeDashoffset = 502.65;
        return;
    }
    
    const circumference = 2 * Math.PI * 80;
    const principalRatio = principal / total;
    const interestRatio = interest / total;
    
    const principalArc = circumference * principalRatio;
    donutPrincipal.style.strokeDasharray = `${principalArc} ${circumference}`;
    donutPrincipal.style.strokeDashoffset = 0;
    
    const interestArc = circumference * interestRatio;
    donutInterest.style.strokeDasharray = `${interestArc} ${circumference}`;
    donutInterest.style.strokeDashoffset = -principalArc;
}

// ============ RESET RESULT ============
function resetResult() {
    mainResultLabel.innerText = 'Simple Interest';
    mainResultValue.innerText = '$0.00';
    mainResultSub.innerText = '—';
    statPrincipal.innerText = '$0';
    statRate.innerText = '0%';
    statTime.innerText = '0';
    statMaturity.innerText = '$0';
    legendPrincipal.innerText = '$0';
    legendInterest.innerText = '$0';
    legendTotal.innerText = '$0';
    donutTotal.innerText = '$0';
    donutPrincipal.style.strokeDashoffset = 502.65;
    donutInterest.style.strokeDashoffset = 502.65;
    breakdownPanel.style.display = 'none';
    comparisonPanel.style.display = 'none';
    currentResult = null;
}

// ============ RENDER BREAKDOWN ============
function renderBreakdown(r) {
    if (r.time < 1 || r.mode !== 'calculate-si') {
        breakdownPanel.style.display = 'none';
        return;
    }
    
    const years = Math.ceil(r.time);
    const yearlyRate = r.rate / 100;
    
    let balance = r.principal;
    let cumulativeInterest = 0;
    const rows = [];
    
    for (let year = 1; year <= years; year++) {
        // Handle partial last year
        const yearFraction = (year === years && r.time !== years) ? (r.time - (years - 1)) : 1;
        const yearInterest = r.principal * yearlyRate * yearFraction;
        cumulativeInterest += yearInterest;
        
        rows.push({
            year: year,
            opening: r.principal,
            interest: yearInterest,
            cumulative: cumulativeInterest,
            closing: r.principal + cumulativeInterest
        });
    }
    
    breakdownPanel.style.display = 'block';
    breakdownInfo.innerText = `${years} year${years > 1 ? 's' : ''} breakdown`;
    
    breakdownBody.innerHTML = rows.map(row => `
        <tr>
            <td><b>${row.year}</b></td>
            <td>Year ${row.year}</td>
            <td>${formatCurrency(row.opening)}</td>
            <td class="td-interest">+${formatCurrency(row.interest)}</td>
            <td>${formatCurrency(row.cumulative)}</td>
            <td class="td-balance">${formatCurrency(row.closing)}</td>
        </tr>
    `).join('');
}

// ============ RENDER COMPARISON ============
function renderComparison(r) {
    if (r.mode !== 'calculate-si' || r.principal <= 0) {
        comparisonPanel.style.display = 'none';
        return;
    }
    
    const baseRate = r.rate;
    const baseTime = r.time;
    const principal = r.principal;
    
    // Compare with different rates (±2%)
    const comparisons = [
        { label: 'Lower Rate', rate: Math.max(0.5, baseRate - 2), time: baseTime, highlight: false },
        { label: 'Current', rate: baseRate, time: baseTime, highlight: true },
        { label: 'Higher Rate', rate: baseRate + 2, time: baseTime, highlight: false },
        { label: 'Double Time', rate: baseRate, time: baseTime * 2, highlight: false }
    ];
    
    comparisonPanel.style.display = 'block';
    
    comparisonGrid.innerHTML = comparisons.map(c => {
        const si = (principal * c.rate * c.time) / 100;
        const maturity = principal + si;
        
        return `
            <div class="comparison-card ${c.highlight ? 'highlight' : ''}">
                <div class="comparison-title">${c.label}</div>
                <div class="comparison-label">${c.rate.toFixed(2)}% • ${c.time.toFixed(1)}Y</div>
                <div class="comparison-value">${formatCurrencyShort(si)}</div>
                <div class="comparison-sub">Maturity: ${formatCurrencyShort(maturity)}</div>
            </div>
        `;
    }).join('');
}

// ============ DOWNLOAD BREAKDOWN CSV ============
function downloadBreakdownCSV() {
    if (!currentResult || currentResult.mode !== 'calculate-si' || currentResult.time < 1) {
        return showToast('❌ No breakdown to download!', 'error');
    }
    
    const r = currentResult;
    const years = Math.ceil(r.time);
    const yearlyRate = r.rate / 100;
    let cumulativeInterest = 0;
    
    let csv = 'Year,Opening Balance,Interest Earned,Cumulative Interest,Closing Balance\n';
    
    for (let year = 1; year <= years; year++) {
        const yearFraction = (year === years && r.time !== years) ? (r.time - (years - 1)) : 1;
        const yearInterest = r.principal * yearlyRate * yearFraction;
        cumulativeInterest += yearInterest;
        
        csv += `${year},${r.principal.toFixed(2)},${yearInterest.toFixed(2)},${cumulativeInterest.toFixed(2)},${(r.principal + cumulativeInterest).toFixed(2)}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `simple-interest-breakdown-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Breakdown downloaded!');
}

// ============ FORMAT HELPERS ============
function formatCurrency(num) {
    if (!isFinite(num)) return '$0.00';
    return '$' + Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatCurrencyShort(num) {
    if (!isFinite(num)) return '$0';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (abs >= 1e12) return sign + '$' + (abs / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(1) + 'K';
    
    return sign + '$' + abs.toFixed(0);
}

function formatNum(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// ============ COPY RESULT ============
function copyResult() {
    if (!currentResult) return showToast('❌ Nothing to copy!', 'error');
    const r = currentResult;
    
    const timeUnitLabel = currentTimeUnit === 'years' ? 'years' : currentTimeUnit === 'months' ? 'months' : 'days';
    
    const lines = [
        `💰 SIMPLE INTEREST CALCULATION`,
        `═══════════════════════════════`,
        `Mode:          ${r.label}`,
        `Principal (P): ${formatCurrency(r.principal)}`,
        `Rate (R):      ${r.rate.toFixed(2)}% p.a.`,
        `Time (T):      ${r.timeRaw.toFixed(2)} ${timeUnitLabel}`,
        ``,
        `────────── RESULTS ──────────`,
        `Simple Interest: ${formatCurrency(r.si)}`,
        `Maturity Amount: ${formatCurrency(r.maturity)}`,
        ``,
        `Formula: SI = (P × R × T) / 100`,
        `        = (${r.principal} × ${r.rate} × ${r.time.toFixed(4)}) / 100`,
        `        = ${formatCurrency(r.si)}`,
        ``,
        `Generated by Tool Hub • ${new Date().toLocaleString()}`
    ];
    
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        showToast('📋 Result copied!');
    }).catch(() => {
        showToast('❌ Copy failed!', 'error');
    });
}

// ============ SHARE RESULT ============
function shareResult() {
    if (!currentResult) return showToast('❌ Calculate first!', 'error');
    const r = currentResult;
    const text = `SI: ${formatCurrency(r.si)} on ${formatCurrency(r.principal)} @ ${r.rate}% for ${r.timeRaw} ${currentTimeUnit} → Maturity: ${formatCurrency(r.maturity)}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Simple Interest Result',
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
        mode: r.mode,
        label: r.label,
        principal: r.principal,
        rate: r.rate,
        timeRaw: r.timeRaw,
        timeUnit: currentTimeUnit,
        si: r.si,
        maturity: r.maturity,
        time: Date.now()
    };
    
    history.unshift(entry);
    if (history.length > 20) history.pop();
    
    try {
        localStorage.setItem('toolhub_si_history', JSON.stringify(history));
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
        <div class="history-item">
            <div class="history-info">
                <div class="history-main">${formatCurrencyShort(h.principal)} @ ${h.rate}% • ${h.timeRaw} ${h.timeUnit.slice(0, 1)}</div>
                <div class="history-sub">SI: ${formatCurrency(h.si)} • Maturity: ${formatCurrency(h.maturity)} • ${formatTime(h.time)}</div>
            </div>
            <button class="history-delete" onclick="deleteHistory(${idx})" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteHistory(idx) {
    history.splice(idx, 1);
    localStorage.setItem('toolhub_si_history', JSON.stringify(history));
    renderHistory();
    showToast('🗑️ Deleted');
}

function clearHistory() {
    if (history.length === 0) return;
    if (!confirm('Kya aap saari history clear karna chahte hain?')) return;
    history = [];
    localStorage.removeItem('toolhub_si_history');
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

// ============ LOAD SAMPLE ============
function loadSample() {
    const samples = {
        'calculate-si': { p: 10000, r: 7.5, t: 5 },
        'find-principal': { si: 3750, r: 7.5, t: 5 },
        'find-rate': { si: 3750, p: 10000, t: 5 },
        'find-time': { si: 3750, p: 10000, r: 7.5 }
    };
    
    const s = samples[currentMode];
    
    Object.entries(s).forEach(([key, value]) => {
        const el = document.getElementById(`input-${key}`);
        if (el) el.value = value;
    });
    
    calculate();
    showToast('🧪 Sample loaded!');
}

// ============ RESET ALL ============
function resetAll() {
    if (!confirm('Kya aap sab kuch reset karna chahte hain?')) return;
    
    Object.values(INPUT_DEFS).flat().forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = field.value;
    });
    
    calculate();
    showToast('🧹 Reset complete!');
}

// ============ APPLY PRESET ============
function applyPreset(name) {
    const presets = {
        fd: { mode: 'calculate-si', p: 10000, r: 7, t: 5, unit: 'years' },
        savings: { mode: 'calculate-si', p: 5000, r: 4, t: 3, unit: 'years' },
        bond: { mode: 'calculate-si', p: 50000, r: 8, t: 10, unit: 'years' },
        shortloan: { mode: 'calculate-si', p: 20000, r: 12, t: 24, unit: 'months' }
    };
    
    const preset = presets[name];
    if (!preset) return;
    
    if (preset.mode !== currentMode) {
        currentMode = preset.mode;
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === preset.mode);
        });
        renderInputs();
    }
    
    // Set time unit
    if (preset.unit) {
        currentTimeUnit = preset.unit;
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === preset.unit);
        });
    }
    
    // Set values
    const pEl = document.getElementById('input-p');
    const rEl = document.getElementById('input-r');
    const tEl = document.getElementById('input-t');
    
    if (pEl) pEl.value = preset.p;
    if (rEl) rEl.value = preset.r;
    if (tEl) tEl.value = preset.t;
    
    calculate();
    showToast(`⚡ Preset applied: ${name}`);
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Simple Interest Calculator - Tool Hub',
        text: 'Check out this free Simple Interest Calculator!',
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
    // Ctrl/Cmd + Enter → Calculate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        calculate();
        showToast('✅ Calculated!');
    }
    // Ctrl/Cmd + Shift + C → Copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyResult();
    }
    // Ctrl/Cmd + Shift + S → Save
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        saveToHistory();
    }
    // 1-4 → Switch modes
    if (!e.ctrlKey && !e.metaKey && !e.altKey && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'SELECT') {
        const modes = ['calculate-si', 'find-principal', 'find-rate', 'find-time'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
            setMode(modes[num - 1]);
        }
    }
});

// ============ INITIALIZE ============
renderInputs();
calculate();
renderHistory();