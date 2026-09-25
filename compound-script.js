/* ============================================================
   COMPOUND INTEREST CALCULATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentFrequency = 12; // Monthly default
let currentResult = null;
let history = JSON.parse(localStorage.getItem('toolhub_ci_history')) || [];

// ============ DOM ELEMENTS ============
const principal = document.getElementById('principal');
const principalSlider = document.getElementById('principal-slider');
const principalBadge = document.getElementById('principal-badge');
const monthlyContrib = document.getElementById('monthly-contrib');
const contribSlider = document.getElementById('contrib-slider');
const contribBadge = document.getElementById('contrib-badge');
const rate = document.getElementById('rate');
const rateSlider = document.getElementById('rate-slider');
const rateBadge = document.getElementById('rate-badge');
const timePeriod = document.getElementById('time-period');
const timeUnit = document.getElementById('time-unit');
const timeSlider = document.getElementById('time-slider');
const timeBadge = document.getElementById('time-badge');

// Result elements
const maturityValue = document.getElementById('maturity-value');
const maturitySub = document.getElementById('maturity-sub');
const donutPrincipal = document.getElementById('donut-principal');
const donutContrib = document.getElementById('donut-contrib');
const donutInterest = document.getElementById('donut-interest');
const donutTotal = document.getElementById('donut-total');
const legendPrincipal = document.getElementById('legend-principal');
const legendContrib = document.getElementById('legend-contrib');
const legendInterest = document.getElementById('legend-interest');
const legendTotal = document.getElementById('legend-total');
const statInvested = document.getElementById('stat-invested');
const statInterest = document.getElementById('stat-interest');
const statGrowth = document.getElementById('stat-growth');
const statEffective = document.getElementById('stat-effective');

// Breakdown
const breakdownPanel = document.getElementById('breakdown-panel');
const breakdownBody = document.getElementById('breakdown-body');
const breakdownInfo = document.getElementById('breakdown-info');

// Comparison
const comparisonPanel = document.getElementById('comparison-panel');
const comparisonGrid = document.getElementById('comparison-grid');

// History
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// ============ SET FREQUENCY ============
function setFrequency(freq) {
    currentFrequency = freq;
    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.freq) === freq);
    });
    calculate();
    showToast(`🔄 Compounding: ${getFrequencyLabel(freq)}`);
}

function getFrequencyLabel(freq) {
    const labels = { 1: 'Yearly', 2: 'Half-Yearly', 4: 'Quarterly', 12: 'Monthly' };
    return labels[freq] || `${freq}×/year`;
}

// ============ BADGES ============
function updateBadges() {
    const p = parseFloat(principal.value) || 0;
    principalBadge.innerText = '$' + p.toLocaleString('en-US');
    
    const c = parseFloat(monthlyContrib.value) || 0;
    contribBadge.innerText = '$' + c.toLocaleString('en-US');
    
    const r = parseFloat(rate.value) || 0;
    rateBadge.innerText = r + '%';
    
    const t = parseFloat(timePeriod.value) || 0;
    const u = timeUnit.value;
    timeBadge.innerText = `${t} ${t === 1 ? u.slice(0, -1) : u}`;
}

// ============ EVENT LISTENERS ============
principal.addEventListener('input', () => {
    principalSlider.value = Math.min(parseFloat(principal.value) || 0, parseFloat(principalSlider.max));
    updateBadges();
    debounceCalc();
});

principalSlider.addEventListener('input', () => {
    principal.value = principalSlider.value;
    updateBadges();
    debounceCalc();
});

monthlyContrib.addEventListener('input', () => {
    contribSlider.value = Math.min(parseFloat(monthlyContrib.value) || 0, parseFloat(contribSlider.max));
    updateBadges();
    debounceCalc();
});

contribSlider.addEventListener('input', () => {
    monthlyContrib.value = contribSlider.value;
    updateBadges();
    debounceCalc();
});

rate.addEventListener('input', () => {
    rateSlider.value = Math.min(parseFloat(rate.value) || 0, parseFloat(rateSlider.max));
    updateBadges();
    debounceCalc();
});

rateSlider.addEventListener('input', () => {
    rate.value = rateSlider.value;
    updateBadges();
    debounceCalc();
});

timePeriod.addEventListener('input', () => {
    timeSlider.value = Math.min(parseFloat(timePeriod.value) || 0, parseFloat(timeSlider.max));
    updateBadges();
    debounceCalc();
});

timeSlider.addEventListener('input', () => {
    timePeriod.value = timeSlider.value;
    updateBadges();
    debounceCalc();
});

timeUnit.addEventListener('change', () => {
    // Convert value when switching units
    const currentVal = parseFloat(timePeriod.value) || 1;
    if (timeUnit.value === 'months') {
        timePeriod.value = Math.min(currentVal * 12, 600);
    } else {
        timePeriod.value = Math.max(1, Math.round(currentVal / 12));
    }
    updateBadges();
    debounceCalc();
});

// ============ DEBOUNCE ============
let debounceTimer;
function debounceCalc() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(calculate, 250);
}

// ============ GET VALUE ============
function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = parseFloat(el.value);
    return isNaN(v) ? 0 : v;
}

// ============ CALCULATE ============
function calculate() {
    const P = getVal('principal');
    const C = getVal('monthly-contrib');
    const R = getVal('rate');
    const timeRaw = getVal('time-period');
    const unit = timeUnit.value;
    const n = currentFrequency;

    if (P <= 0 && C <= 0) { resetResult(); return; }
    if (R < 0) { resetResult(); return; }
    if (timeRaw <= 0) { resetResult(); return; }

    // Convert time to years
    const t = unit === 'years' ? timeRaw : timeRaw / 12;
    const months = Math.round(t * 12);

    // Annual rate as decimal
    const r = R / 100;
    
    // Rate per compounding period
    const ratePerPeriod = r / n;

    // Total periods
    const totalPeriods = n * t;

    // Compound interest on principal
    // A = P × (1 + r/n)^(nt)
    let principalGrowth;
    if (ratePerPeriod === 0) {
        principalGrowth = P;
    } else {
        principalGrowth = P * Math.pow(1 + ratePerPeriod, totalPeriods);
    }

    // Future value of monthly contributions (if any)
    // If contributions are monthly, we need to use monthly rate
    let contribGrowth = 0;
    let totalContributions = 0;

    if (C > 0) {
        const monthlyRate = r / 12;
        totalContributions = C * months;

        if (monthlyRate === 0) {
            contribGrowth = totalContributions;
        } else {
            // FV of annuity (ordinary): PMT × [((1+i)^n - 1) / i]
            contribGrowth = C * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
        }
    }

    const maturity = principalGrowth + contribGrowth;
    const totalInvested = P + totalContributions;
    const totalInterest = maturity - totalInvested;
    const growthPercent = totalInvested > 0 ? (totalInterest / totalInvested) * 100 : 0;

    // Effective Annual Rate: EAR = (1 + r/n)^n - 1
    const ear = Math.pow(1 + ratePerPeriod, n) - 1;
    const earPercent = ear * 100;

    // Build yearly breakdown
    const breakdown = buildBreakdown(P, C, r, n, months);

    // Store result
    currentResult = {
        principal: P,
        monthlyContrib: C,
        rate: R,
        timeYears: t,
        timeRaw: timeRaw,
        timeUnit: unit,
        frequency: n,
        months: months,
        principalGrowth: principalGrowth,
        contribGrowth: contribGrowth,
        totalContributions: totalContributions,
        totalInvested: totalInvested,
        totalInterest: totalInterest,
        maturity: maturity,
        growthPercent: growthPercent,
        ear: earPercent,
        breakdown: breakdown
    };

    renderResult(currentResult);
    renderBreakdown(currentResult);
    renderComparison(currentResult);
}

// ============ BUILD BREAKDOWN ============
function buildBreakdown(P, C, r, n, months) {
    const breakdown = [];
    const years = Math.ceil(months / 12);
    const monthlyRate = r / 12;

    let balance = P;
    let cumulativeContrib = 0;
    let cumulativeInterest = 0;

    for (let year = 1; year <= years; year++) {
        const startBalance = balance;
        const yearStartMonth = (year - 1) * 12 + 1;
        const yearEndMonth = Math.min(year * 12, months);
        let yearContrib = 0;
        let yearInterest = 0;

        // Simulate each month
        for (let m = yearStartMonth; m <= yearEndMonth; m++) {
            // Interest on current balance
            const monthlyInterest = balance * monthlyRate;
            balance += monthlyInterest;
            yearInterest += monthlyInterest;

            // Add monthly contribution
            if (C > 0) {
                balance += C;
                yearContrib += C;
            }
        }

        cumulativeContrib += yearContrib;
        cumulativeInterest += yearInterest;

        breakdown.push({
            year: year,
            openingBalance: startBalance,
            contributed: yearContrib,
            interestEarned: yearInterest,
            cumulativeContrib: cumulativeContrib,
            cumulativeInterest: cumulativeInterest,
            closingBalance: balance
        });
    }

    return breakdown;
}

// ============ RENDER RESULT ============
function renderResult(r) {
    // Main result
    maturityValue.innerText = formatCurrencyShort(r.maturity);
    const timeLabel = r.timeUnit === 'years' ? `${r.timeYears.toFixed(1)}Y` : `${r.timeRaw}mo`;
    maturitySub.innerText = `${timeLabel} • ${getFrequencyLabel(r.frequency)} compounding`;

    // Stats
    statInvested.innerText = formatCurrencyShort(r.totalInvested);
    statInterest.innerText = formatCurrencyShort(r.totalInterest);
    statGrowth.innerText = r.growthPercent.toFixed(2) + '%';
    statEffective.innerText = r.ear.toFixed(2) + '%';

    // Legend
    legendPrincipal.innerText = formatCurrencyShort(r.principalGrowth);
    legendContrib.innerText = formatCurrencyShort(r.contribGrowth);
    legendInterest.innerText = formatCurrencyShort(r.totalInterest);
    legendTotal.innerText = formatCurrencyShort(r.maturity);
    donutTotal.innerText = formatCurrencyShort(r.maturity);

    // Donut
    updateDonut(r.principalGrowth, r.contribGrowth, r.totalInterest);
}

// ============ UPDATE DONUT ============
function updateDonut(principalGrowth, contribGrowth, interest) {
    const total = principalGrowth + contribGrowth + interest;
    if (total === 0) {
        donutPrincipal.style.strokeDashoffset = 502.65;
        donutContrib.style.strokeDashoffset = 502.65;
        donutInterest.style.strokeDashoffset = 502.65;
        return;
    }

    const circumference = 2 * Math.PI * 80;

    const pRatio = principalGrowth / total;
    const cRatio = contribGrowth / total;
    const iRatio = interest / total;

    // Principal arc
    const pArc = circumference * pRatio;
    donutPrincipal.style.strokeDasharray = `${pArc} ${circumference}`;
    donutPrincipal.style.strokeDashoffset = 0;

    // Contrib arc (starts after principal)
    const cArc = circumference * cRatio;
    donutContrib.style.strokeDasharray = `${cArc} ${circumference}`;
    donutContrib.style.strokeDashoffset = -pArc;

    // Interest arc (starts after principal + contrib)
    const iArc = circumference * iRatio;
    donutInterest.style.strokeDasharray = `${iArc} ${circumference}`;
    donutInterest.style.strokeDashoffset = -(pArc + cArc);
}

// ============ RESET RESULT ============
function resetResult() {
    maturityValue.innerText = '$0.00';
    maturitySub.innerText = '—';
    statInvested.innerText = '$0';
    statInterest.innerText = '$0';
    statGrowth.innerText = '0%';
    statEffective.innerText = '0%';
    legendPrincipal.innerText = '$0';
    legendContrib.innerText = '$0';
    legendInterest.innerText = '$0';
    legendTotal.innerText = '$0';
    donutTotal.innerText = '$0';
    donutPrincipal.style.strokeDashoffset = 502.65;
    donutContrib.style.strokeDashoffset = 502.65;
    donutInterest.style.strokeDashoffset = 502.65;
    breakdownPanel.style.display = 'none';
    comparisonPanel.style.display = 'none';
    currentResult = null;
}

// ============ RENDER BREAKDOWN ============
function renderBreakdown(r) {
    if (!r.breakdown || r.breakdown.length === 0) {
        breakdownPanel.style.display = 'none';
        return;
    }

    breakdownPanel.style.display = 'block';
    breakdownInfo.innerText = `${r.breakdown.length} year${r.breakdown.length > 1 ? 's' : ''} breakdown`;

    breakdownBody.innerHTML = r.breakdown.map(row => `
        <tr>
            <td><b>Year ${row.year}</b></td>
            <td>${formatCurrency(row.openingBalance)}</td>
            <td class="td-contrib">${row.contributed > 0 ? '+' + formatCurrency(row.contributed) : '—'}</td>
            <td class="td-interest">+${formatCurrency(row.interestEarned)}</td>
            <td>${formatCurrency(row.cumulativeInterest)}</td>
            <td class="td-balance">${formatCurrency(row.closingBalance)}</td>
        </tr>
    `).join('');
}

// ============ RENDER COMPARISON ============
function renderComparison(r) {
    if (r.principal <= 0 && r.monthlyContrib <= 0) {
        comparisonPanel.style.display = 'none';
        return;
    }

    const P = r.principal;
    const C = r.monthlyContrib;
    const R = r.rate;
    const t = r.timeYears;
    const months = r.months;

    const frequencies = [
        { n: 1, label: 'Yearly', highlight: false },
        { n: 2, label: 'Half-Yearly', highlight: false },
        { n: 4, label: 'Quarterly', highlight: false },
        { n: 12, label: 'Monthly', highlight: true }
    ];

    comparisonPanel.style.display = 'block';

    comparisonGrid.innerHTML = frequencies.map(f => {
        const ratePerPeriod = (R / 100) / f.n;
        const totalPeriods = f.n * t;
        
        let pGrowth = P;
        if (ratePerPeriod > 0) {
            pGrowth = P * Math.pow(1 + ratePerPeriod, totalPeriods);
        }

        let cGrowth = 0;
        if (C > 0) {
            const monthlyRate = (R / 100) / 12;
            if (monthlyRate > 0) {
                cGrowth = C * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
            } else {
                cGrowth = C * months;
            }
        }

        const maturity = pGrowth + cGrowth;
        const interest = maturity - (P + C * months);

        return `
            <div class="comparison-card ${f.n === currentFrequency ? 'highlight' : ''}">
                <div class="comparison-title">${f.n}×/year</div>
                <div class="comparison-label">${f.label}</div>
                <div class="comparison-value">${formatCurrencyShort(maturity)}</div>
                <div class="comparison-sub">Interest: ${formatCurrencyShort(interest)}</div>
            </div>
        `;
    }).join('');
}

// ============ DOWNLOAD BREAKDOWN CSV ============
function downloadBreakdownCSV() {
    if (!currentResult || !currentResult.breakdown || currentResult.breakdown.length === 0) {
        return showToast('❌ No breakdown to download!', 'error');
    }

    let csv = 'Year,Opening Balance,Contributed,Interest Earned,Cumulative Interest,Closing Balance\n';
    
    currentResult.breakdown.forEach(row => {
        csv += `${row.year},${row.openingBalance.toFixed(2)},${row.contributed.toFixed(2)},${row.interestEarned.toFixed(2)},${row.cumulativeInterest.toFixed(2)},${row.closingBalance.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `compound-interest-breakdown-${timestamp}.csv`;
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

// ============ COPY RESULT ============
function copyResult() {
    if (!currentResult) return showToast('❌ Nothing to copy!', 'error');
    const r = currentResult;

    const timeUnitLabel = r.timeUnit === 'years' ? 'years' : 'months';

    const lines = [
        `💰 COMPOUND INTEREST CALCULATION`,
        `═══════════════════════════════`,
        `Principal:        ${formatCurrency(r.principal)}`,
        `Monthly Contrib:  ${formatCurrency(r.monthlyContrib)}`,
        `Rate:             ${r.rate}% p.a.`,
        `Time:             ${r.timeRaw} ${timeUnitLabel}`,
        `Compounding:      ${getFrequencyLabel(r.frequency)}`,
        ``,
        `────────── RESULTS ──────────`,
        `Total Invested:   ${formatCurrency(r.totalInvested)}`,
        `Total Interest:   ${formatCurrency(r.totalInterest)}`,
        `Maturity Amount:  ${formatCurrency(r.maturity)}`,
        `Growth:           ${r.growthPercent.toFixed(2)}%`,
        `Effective Rate:   ${r.ear.toFixed(2)}%`,
        ``,
        `Formula: A = P(1 + r/n)^(nt)`,
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
    const text = `${formatCurrencyShort(r.principal)} @ ${r.rate}% for ${r.timeYears.toFixed(1)}Y → ${formatCurrencyShort(r.maturity)} (Interest: ${formatCurrencyShort(r.totalInterest)})`;

    if (navigator.share) {
        navigator.share({
            title: 'Compound Interest Result',
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
        principal: r.principal,
        monthlyContrib: r.monthlyContrib,
        rate: r.rate,
        timeRaw: r.timeRaw,
        timeUnit: r.timeUnit,
        frequency: r.frequency,
        maturity: r.maturity,
        interest: r.totalInterest,
        time: Date.now()
    };

    history.unshift(entry);
    if (history.length > 20) history.pop();

    try {
        localStorage.setItem('toolhub_ci_history', JSON.stringify(history));
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
                <div class="history-sub">Interest: ${formatCurrencyShort(h.interest)} • ${formatTime(h.time)}</div>
            </div>
            <button class="history-delete" onclick="deleteHistory(${idx})" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteHistory(idx) {
    history.splice(idx, 1);
    localStorage.setItem('toolhub_ci_history', JSON.stringify(history));
    renderHistory();
    showToast('🗑️ Deleted');
}

function clearHistory() {
    if (history.length === 0) return;
    if (!confirm('Kya aap saari history clear karna chahte hain?')) return;
    history = [];
    localStorage.removeItem('toolhub_ci_history');
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
    principal.value = 10000;
    monthlyContrib.value = 500;
    rate.value = 8;
    timePeriod.value = 10;
    timeUnit.value = 'years';
    currentFrequency = 12;

    principalSlider.value = 10000;
    contribSlider.value = 500;
    rateSlider.value = 8;
    timeSlider.value = 10;

    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.freq) === 12);
    });

    updateBadges();
    calculate();
    showToast('🧪 Sample loaded!');
}

// ============ RESET ALL ============
function resetAll() {
    if (!confirm('Kya aap sab kuch reset karna chahte hain?')) return;

    principal.value = 10000;
    monthlyContrib.value = 0;
    rate.value = 8;
    timePeriod.value = 10;
    timeUnit.value = 'years';
    currentFrequency = 12;

    principalSlider.value = 10000;
    contribSlider.value = 0;
    rateSlider.value = 8;
    timeSlider.value = 10;

    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.freq) === 12);
    });

    updateBadges();
    calculate();
    showToast('🧹 Reset complete!');
}

// ============ APPLY PRESET ============
function applyPreset(name) {
    const presets = {
        sip: { p: 0, c: 500, r: 12, t: 10, unit: 'years', freq: 12 },
        fd: { p: 50000, c: 0, r: 7, t: 5, unit: 'years', freq: 4 },
        retirement: { p: 100000, c: 0, r: 8, t: 30, unit: 'years', freq: 12 },
        education: { p: 10000, c: 200, r: 10, t: 15, unit: 'years', freq: 12 }
    };

    const preset = presets[name];
    if (!preset) return;

    principal.value = preset.p;
    monthlyContrib.value = preset.c;
    rate.value = preset.r;
    timePeriod.value = preset.t;
    timeUnit.value = preset.unit;
    currentFrequency = preset.freq;

    principalSlider.value = Math.min(preset.p, parseFloat(principalSlider.max));
    contribSlider.value = Math.min(preset.c, parseFloat(contribSlider.max));
    rateSlider.value = Math.min(preset.r, parseFloat(rateSlider.max));
    timeSlider.value = Math.min(preset.t, parseFloat(timeSlider.max));

    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.freq) === preset.freq);
    });

    updateBadges();
    calculate();
    showToast(`⚡ Preset applied: ${name}`);
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Compound Interest Calculator - Tool Hub',
        text: 'Check out this free Compound Interest Calculator!',
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
});

// ============ INITIALIZE ============
updateBadges();
calculate();
renderHistory();