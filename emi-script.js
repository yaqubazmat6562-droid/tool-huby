/* ============================================================
   LOAN/EMI CALCULATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentLoanType = 'home';
let currentResult = null;
let scheduleData = [];
let scheduleDisplayLimit = 12;
let savedLoans = JSON.parse(localStorage.getItem('toolhub_emi_saved')) || [];

// ============ LOAN TYPE PRESETS ============
const LOAN_TYPES = {
    home: {
        amount: 200000,
        rate: 7.5,
        tenure: 20,
        amountMax: 2000000,
        rateMax: 15,
        tenureMax: 30,
        label: 'Home Loan'
    },
    car: {
        amount: 30000,
        rate: 9,
        tenure: 5,
        amountMax: 200000,
        rateMax: 18,
        tenureMax: 10,
        label: 'Car Loan'
    },
    personal: {
        amount: 10000,
        rate: 12,
        tenure: 3,
        amountMax: 100000,
        rateMax: 25,
        tenureMax: 7,
        label: 'Personal Loan'
    },
    education: {
        amount: 50000,
        rate: 6,
        tenure: 10,
        amountMax: 500000,
        rateMax: 15,
        tenureMax: 15,
        label: 'Education Loan'
    },
    business: {
        amount: 100000,
        rate: 10.5,
        tenure: 7,
        amountMax: 1000000,
        rateMax: 20,
        tenureMax: 15,
        label: 'Business Loan'
    }
};

// ============ DOM ELEMENTS ============
const loanAmount = document.getElementById('loan-amount');
const loanAmountSlider = document.getElementById('loan-amount-slider');
const amountBadge = document.getElementById('amount-badge');
const interestRate = document.getElementById('interest-rate');
const interestRateSlider = document.getElementById('interest-rate-slider');
const rateBadge = document.getElementById('rate-badge');
const loanTenure = document.getElementById('loan-tenure');
const loanTenureSlider = document.getElementById('loan-tenure-slider');
const tenureUnit = document.getElementById('tenure-unit');
const tenureBadge = document.getElementById('tenure-badge');
const processingFee = document.getElementById('processing-fee');

// Result elements
const emiValue = document.getElementById('emi-value');
const emiSub = document.getElementById('emi-sub');
const donutPrincipal = document.getElementById('donut-principal');
const donutInterest = document.getElementById('donut-interest');
const donutTotal = document.getElementById('donut-total');
const legendPrincipal = document.getElementById('legend-principal');
const legendInterest = document.getElementById('legend-interest');
const legendTotal = document.getElementById('legend-total');
const statPrincipal = document.getElementById('stat-principal');
const statInterest = document.getElementById('stat-interest');
const statTotal = document.getElementById('stat-total');
const statMonths = document.getElementById('stat-months');
const extraStats = document.getElementById('extra-stats');
const extraFee = document.getElementById('extra-fee');
const extraEffective = document.getElementById('extra-effective');
const extraPercent = document.getElementById('extra-percent');

// Schedule
const schedulePanel = document.getElementById('schedule-panel');
const scheduleBody = document.getElementById('schedule-body');
const scheduleInfo = document.getElementById('schedule-info');
const loadMoreBtn = document.getElementById('load-more-btn');

// Saved
const savedPanel = document.getElementById('saved-panel');
const savedList = document.getElementById('saved-list');

// ============ SET LOAN TYPE ============
function setLoanType(type) {
    currentLoanType = type;
    
    document.querySelectorAll('.type-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });
    
    // Apply defaults for this loan type
    const cfg = LOAN_TYPES[type];
    loanAmount.value = cfg.amount;
    interestRate.value = cfg.rate;
    loanTenure.value = cfg.tenure;
    tenureUnit.value = 'years';
    
    loanAmountSlider.max = cfg.amountMax;
    loanAmountSlider.value = cfg.amount;
    
    interestRateSlider.max = cfg.rateMax;
    interestRateSlider.value = cfg.rate;
    
    loanTenureSlider.max = cfg.tenureMax;
    loanTenureSlider.value = cfg.tenure;
    
    updateBadges();
    calculateEMI();
    showToast(`🏦 ${cfg.label} selected`);
}

// ============ UPDATE BADGES ============
function updateBadges() {
    const amount = parseFloat(loanAmount.value) || 0;
    amountBadge.innerText = '$' + amount.toLocaleString('en-US');
    
    const rate = parseFloat(interestRate.value) || 0;
    rateBadge.innerText = rate + '%';
    
    const tenure = parseFloat(loanTenure.value) || 0;
    const unit = tenureUnit.value;
    tenureBadge.innerText = `${tenure} ${tenure === 1 ? unit.slice(0, -1) : unit}`;
}

// ============ SYNC SLIDERS ============
loanAmount.addEventListener('input', () => {
    loanAmountSlider.value = Math.min(parseFloat(loanAmount.value) || 0, parseFloat(loanAmountSlider.max));
    updateBadges();
    debounceCalc();
});

loanAmountSlider.addEventListener('input', () => {
    loanAmount.value = loanAmountSlider.value;
    updateBadges();
    debounceCalc();
});

interestRate.addEventListener('input', () => {
    interestRateSlider.value = Math.min(parseFloat(interestRate.value) || 0, parseFloat(interestRateSlider.max));
    updateBadges();
    debounceCalc();
});

interestRateSlider.addEventListener('input', () => {
    interestRate.value = interestRateSlider.value;
    updateBadges();
    debounceCalc();
});

loanTenure.addEventListener('input', () => {
    loanTenureSlider.value = Math.min(parseFloat(loanTenure.value) || 0, parseFloat(loanTenureSlider.max));
    updateBadges();
    debounceCalc();
});

loanTenureSlider.addEventListener('input', () => {
    loanTenure.value = loanTenureSlider.value;
    updateBadges();
    debounceCalc();
});

tenureUnit.addEventListener('change', () => {
    // Convert value when switching units
    const currentVal = parseFloat(loanTenure.value) || 1;
    if (tenureUnit.value === 'months') {
        loanTenure.value = Math.min(currentVal * 12, 480);
    } else {
        loanTenure.value = Math.max(1, Math.round(currentVal / 12));
    }
    updateBadges();
    debounceCalc();
});

processingFee.addEventListener('input', debounceCalc);

// ============ DEBOUNCE ============
let debounceTimer;
function debounceCalc() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(calculateEMI, 250);
}

// ============ CALCULATE EMI ============
function calculateEMI() {
    const principal = parseFloat(loanAmount.value) || 0;
    const annualRate = parseFloat(interestRate.value) || 0;
    const tenureVal = parseFloat(loanTenure.value) || 0;
    const unit = tenureUnit.value;
    const fee = parseFloat(processingFee.value) || 0;

    if (principal <= 0 || annualRate < 0 || tenureVal <= 0) {
        resetResult();
        return;
    }

    // Convert tenure to months
    const months = unit === 'years' ? Math.round(tenureVal * 12) : Math.round(tenureVal);
    if (months <= 0) {
        resetResult();
        return;
    }

    // Monthly interest rate
    const monthlyRate = annualRate / 12 / 100;

    // EMI formula: P × r × (1+r)^n / ((1+r)^n - 1)
    let emi;
    if (monthlyRate === 0) {
        emi = principal / months;
    } else {
        const factor = Math.pow(1 + monthlyRate, months);
        emi = (principal * monthlyRate * factor) / (factor - 1);
    }

    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    // Build amortization schedule
    scheduleData = [];
    let balance = principal;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;

    for (let i = 1; i <= months; i++) {
        const interestComponent = balance * monthlyRate;
        const principalComponent = emi - interestComponent;
        balance = Math.max(0, balance - principalComponent);

        totalPrincipalPaid += principalComponent;
        totalInterestPaid += interestComponent;

        scheduleData.push({
            month: i,
            emi: emi,
            principal: principalComponent,
            interest: interestComponent,
            balance: balance
        });
    }

    // Store result
    currentResult = {
        loanType: currentLoanType,
        principal: principal,
        annualRate: annualRate,
        months: months,
        emi: emi,
        totalPayment: totalPayment,
        totalInterest: totalInterest,
        processingFee: fee,
        effectiveCost: totalPayment + fee,
        timestamp: Date.now()
    };

    // Update UI
    renderResult(currentResult);
    scheduleDisplayLimit = 12;
    renderSchedule();
}

// ============ RENDER RESULT ============
function renderResult(r) {
    // EMI hero
    emiValue.innerText = formatCurrency(r.emi);
    emiSub.innerText = `${r.months} months • ${(r.months / 12).toFixed(1)} years`;

    // Stats
    statPrincipal.innerText = formatCurrencyShort(r.principal);
    statInterest.innerText = formatCurrencyShort(r.totalInterest);
    statTotal.innerText = formatCurrencyShort(r.totalPayment);
    statMonths.innerText = r.months;

    // Legend
    legendPrincipal.innerText = formatCurrencyShort(r.principal);
    legendInterest.innerText = formatCurrencyShort(r.totalInterest);
    legendTotal.innerText = formatCurrencyShort(r.totalPayment);
    donutTotal.innerText = formatCurrencyShort(r.totalPayment);

    // Donut chart
    updateDonut(r.principal, r.totalInterest);

    // Extra stats
    if (r.processingFee > 0) {
        extraStats.style.display = 'flex';
        extraFee.innerText = formatCurrency(r.processingFee);
        extraEffective.innerText = formatCurrency(r.effectiveCost);
        extraPercent.innerText = ((r.totalInterest / r.principal) * 100).toFixed(2) + '%';
    } else {
        extraStats.style.display = 'none';
    }

    // Schedule info
    if (schedulePanel.style.display !== 'none') {
        scheduleInfo.innerText = `${r.months} months schedule`;
    }
}

// ============ RESET RESULT ============
function resetResult() {
    emiValue.innerText = '$0.00';
    emiSub.innerText = '—';
    statPrincipal.innerText = '$0';
    statInterest.innerText = '$0';
    statTotal.innerText = '$0';
    statMonths.innerText = '0';
    legendPrincipal.innerText = '$0';
    legendInterest.innerText = '$0';
    legendTotal.innerText = '$0';
    donutTotal.innerText = '$0';
    donutPrincipal.style.strokeDashoffset = 502.65;
    donutInterest.style.strokeDashoffset = 502.65;
    extraStats.style.display = 'none';
    currentResult = null;
    scheduleData = [];
}

// ============ UPDATE DONUT CHART ============
function updateDonut(principal, interest) {
    const total = principal + interest;
    if (total === 0) {
        donutPrincipal.style.strokeDashoffset = 502.65;
        donutInterest.style.strokeDashoffset = 502.65;
        return;
    }

    const circumference = 2 * Math.PI * 80; // r = 80
    const principalRatio = principal / total;
    const interestRatio = interest / total;

    // Principal arc (start at 0)
    const principalArc = circumference * principalRatio;
    donutPrincipal.style.strokeDasharray = `${principalArc} ${circumference}`;
    donutPrincipal.style.strokeDashoffset = 0;

    // Interest arc (starts after principal)
    const interestArc = circumference * interestRatio;
    donutInterest.style.strokeDasharray = `${interestArc} ${circumference}`;
    donutInterest.style.strokeDashoffset = -principalArc;
}

// ============ RENDER SCHEDULE ============
function renderSchedule() {
    if (scheduleData.length === 0) {
        scheduleBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">No schedule data</td></tr>';
        return;
    }

    const toShow = scheduleData.slice(0, scheduleDisplayLimit);
    const date = new Date();

    scheduleBody.innerHTML = toShow.map(row => {
        const monthDate = new Date(date.getFullYear(), date.getMonth() + row.month, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        return `
            <tr>
                <td><b>${row.month}</b></td>
                <td>${monthName}</td>
                <td>${formatCurrency(row.emi)}</td>
                <td class="td-principal">${formatCurrency(row.principal)}</td>
                <td class="td-interest">${formatCurrency(row.interest)}</td>
                <td class="td-balance">${formatCurrency(row.balance)}</td>
            </tr>
        `;
    }).join('');

    // Load more button
    if (scheduleDisplayLimit < scheduleData.length) {
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Load More (${scheduleData.length - scheduleDisplayLimit} remaining)`;
    } else {
        loadMoreBtn.style.display = 'none';
    }

    scheduleInfo.innerText = `Showing ${Math.min(scheduleDisplayLimit, scheduleData.length)} of ${scheduleData.length} months`;
}

// ============ LOAD MORE SCHEDULE ============
function loadMoreSchedule() {
    scheduleDisplayLimit += 12;
    renderSchedule();
}

// ============ TOGGLE SCHEDULE ============
function toggleSchedule() {
    if (scheduleData.length === 0) {
        return showToast('❌ Calculate EMI first!', 'error');
    }

    if (schedulePanel.style.display === 'none') {
        schedulePanel.style.display = 'block';
        renderSchedule();
        setTimeout(() => schedulePanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else {
        schedulePanel.style.display = 'none';
    }
}

// ============ DOWNLOAD SCHEDULE CSV ============
function downloadScheduleCSV() {
    if (scheduleData.length === 0) {
        return showToast('❌ No schedule to download!', 'error');
    }

    let csv = 'Month,EMI,Principal,Interest,Balance\n';
    const date = new Date();

    scheduleData.forEach((row, i) => {
        const monthDate = new Date(date.getFullYear(), date.getMonth() + row.month, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        csv += `${row.month},"${monthName}",${row.emi.toFixed(2)},${row.principal.toFixed(2)},${row.interest.toFixed(2)},${row.balance.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `emi-schedule-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Schedule downloaded!');
}

// ============ FORMAT CURRENCY ============
function formatCurrency(num) {
    if (!isFinite(num)) return '$0.00';
    return '$' + Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ============ FORMAT CURRENCY SHORT (for large numbers) ============
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
    const lines = [
        `🏦 LOAN/EMI CALCULATION`,
        `═══════════════════════════════`,
        `Loan Type:        ${LOAN_TYPES[r.loanType].label}`,
        `Loan Amount:      ${formatCurrency(r.principal)}`,
        `Interest Rate:    ${r.annualRate}% (annual)`,
        `Loan Tenure:      ${r.months} months (${(r.months / 12).toFixed(1)} years)`,
        ``,
        `────────── RESULTS ──────────`,
        `Monthly EMI:      ${formatCurrency(r.emi)}`,
        `Total Interest:   ${formatCurrency(r.totalInterest)}`,
        `Total Payment:    ${formatCurrency(r.totalPayment)}`,
    ];

    if (r.processingFee > 0) {
        lines.push(`Processing Fee:   ${formatCurrency(r.processingFee)}`);
        lines.push(`Effective Cost:   ${formatCurrency(r.effectiveCost)}`);
    }

    lines.push('');
    lines.push(`Interest % of Principal: ${((r.totalInterest / r.principal) * 100).toFixed(2)}%`);
    lines.push('');
    lines.push(`Generated by Tool Hub • ${new Date().toLocaleString()}`);

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
    const text = `Loan: ${formatCurrency(r.principal)} @ ${r.annualRate}% for ${r.months}mo → EMI: ${formatCurrency(r.emi)} • Total: ${formatCurrency(r.totalPayment)}`;

    if (navigator.share) {
        navigator.share({
            title: 'EMI Calculation',
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

// ============ LOAD SAMPLE ============
function loadSample() {
    const cfg = LOAN_TYPES[currentLoanType];
    loanAmount.value = cfg.amount;
    interestRate.value = cfg.rate;
    loanTenure.value = cfg.tenure;
    tenureUnit.value = 'years';
    processingFee.value = 500;

    loanAmountSlider.value = Math.min(cfg.amount, parseFloat(loanAmountSlider.max));
    interestRateSlider.value = Math.min(cfg.rate, parseFloat(interestRateSlider.max));
    loanTenureSlider.value = Math.min(cfg.tenure, parseFloat(loanTenureSlider.max));

    updateBadges();
    calculateEMI();
    showToast('🧪 Sample loaded!');
}

// ============ RESET ALL ============
function resetAll() {
    if (!confirm('Kya aap sab kuch reset karna chahte hain?')) return;

    const cfg = LOAN_TYPES[currentLoanType];
    loanAmount.value = cfg.amount;
    interestRate.value = cfg.rate;
    loanTenure.value = cfg.tenure;
    tenureUnit.value = 'years';
    processingFee.value = 0;

    loanAmountSlider.value = Math.min(cfg.amount, parseFloat(loanAmountSlider.max));
    interestRateSlider.value = Math.min(cfg.rate, parseFloat(interestRateSlider.max));
    loanTenureSlider.value = Math.min(cfg.tenure, parseFloat(loanTenureSlider.max));

    updateBadges();
    calculateEMI();
    schedulePanel.style.display = 'none';
    showToast('🧹 Reset complete!');
}

// ============ APPLY PRESET ============
function applyPreset(name) {
    const presets = {
        home20: { type: 'home', amount: 200000, rate: 7, tenure: 20 },
        car5: { type: 'car', amount: 30000, rate: 9, tenure: 5 },
        personal3: { type: 'personal', amount: 10000, rate: 12, tenure: 3 },
        education4: { type: 'education', amount: 50000, rate: 6, tenure: 10 }
    };

    const preset = presets[name];
    if (!preset) return;

    // Switch type
    if (preset.type !== currentLoanType) {
        currentLoanType = preset.type;
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === preset.type);
        });
    }

    loanAmount.value = preset.amount;
    interestRate.value = preset.rate;
    loanTenure.value = preset.tenure;
    tenureUnit.value = 'years';

    loanAmountSlider.value = Math.min(preset.amount, parseFloat(loanAmountSlider.max));
    interestRateSlider.value = Math.min(preset.rate, parseFloat(interestRateSlider.max));
    loanTenureSlider.value = Math.min(preset.tenure, parseFloat(loanTenureSlider.max));

    updateBadges();
    calculateEMI();
    showToast(`⚡ Preset applied: ${name}`);
}

// ============ SAVE LOAN ============
function saveLoan() {
    if (!currentResult) return showToast('❌ Calculate first!', 'error');

    const r = currentResult;
    const entry = {
        id: Date.now(),
        loanType: r.loanType,
        principal: r.principal,
        rate: r.annualRate,
        months: r.months,
        emi: r.emi,
        totalPayment: r.totalPayment,
        time: Date.now()
    };

    savedLoans.unshift(entry);
    if (savedLoans.length > 20) savedLoans.pop();

    try {
        localStorage.setItem('toolhub_emi_saved', JSON.stringify(savedLoans));
    } catch (e) {}

    renderSaved();
    showToast('💾 Saved!');
}

// ============ RENDER SAVED ============
function renderSaved() {
    if (savedLoans.length === 0) {
        savedPanel.style.display = 'none';
        return;
    }

    savedPanel.style.display = 'block';

    savedList.innerHTML = savedLoans.map(loan => `
        <div class="saved-item" onclick="loadSavedLoan(${loan.id})">
            <div class="saved-info">
                <div class="saved-name">${LOAN_TYPES[loan.loanType]?.label || 'Loan'} • ${formatCurrencyShort(loan.principal)}</div>
                <div class="saved-sub">EMI ${formatCurrency(loan.emi)} • ${loan.months}mo • ${formatTime(loan.time)}</div>
            </div>
            <button class="saved-delete" onclick="event.stopPropagation(); deleteSavedLoan(${loan.id})" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function loadSavedLoan(id) {
    const loan = savedLoans.find(l => l.id === id);
    if (!loan) return;

    currentLoanType = loan.loanType;
    document.querySelectorAll('.type-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === loan.loanType);
    });

    loanAmount.value = loan.principal;
    interestRate.value = loan.rate;
    loanTenure.value = loan.months;
    tenureUnit.value = 'months';

    updateBadges();
    calculateEMI();
    showToast('📋 Loaded from saved!');
}

function deleteSavedLoan(id) {
    savedLoans = savedLoans.filter(l => l.id !== id);
    localStorage.setItem('toolhub_emi_saved', JSON.stringify(savedLoans));
    renderSaved();
    showToast('🗑️ Deleted');
}

function clearAllSaved() {
    if (savedLoans.length === 0) return;
    if (!confirm('Kya aap saari saved calculations clear karna chahte hain?')) return;
    savedLoans = [];
    localStorage.removeItem('toolhub_emi_saved');
    renderSaved();
    showToast('🧹 Cleared!');
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
        title: 'Loan/EMI Calculator - Tool Hub',
        text: 'Check out this free Loan/EMI Calculator!',
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

// ============ SAVE BUTTON (create dynamically) ============
const saveLoanBtn = document.createElement('button');
saveLoanBtn.className = 'btn btn-info';
saveLoanBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Save';
saveLoanBtn.onclick = saveLoan;
saveLoanBtn.style.flex = '1 1 130px';
saveLoanBtn.style.fontSize = '0.82rem';
saveLoanBtn.style.padding = '10px 14px';
document.querySelector('.result-actions').appendChild(saveLoanBtn);

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Calculate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        calculateEMI();
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
        saveLoan();
    }
    // Ctrl/Cmd + Shift + D → Schedule
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleSchedule();
    }
});

// ============ INITIALIZE ============
function init() {
    const cfg = LOAN_TYPES[currentLoanType];
    loanAmount.value = cfg.amount;
    interestRate.value = cfg.rate;
    loanTenure.value = cfg.tenure;
    tenureUnit.value = 'years';
    
    loanAmountSlider.max = cfg.amountMax;
    loanAmountSlider.value = cfg.amount;
    interestRateSlider.max = cfg.rateMax;
    interestRateSlider.value = cfg.rate;
    loanTenureSlider.max = cfg.tenureMax;
    loanTenureSlider.value = cfg.tenure;

    updateBadges();
    calculateEMI();
    renderSaved();
}

init();