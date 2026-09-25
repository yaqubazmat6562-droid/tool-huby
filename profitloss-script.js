/* ============================================================
   PROFIT/LOSS CALCULATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentMode = 'basic';
let currentResult = null;
let history = JSON.parse(localStorage.getItem('toolhub_profitloss_history')) || [];

// ============ DOM ELEMENTS ============
const inputGrid = document.getElementById('input-grid');
const resultPanel = document.getElementById('result-panel');
const resultBadge = document.getElementById('result-badge');
const mainResult = document.getElementById('main-result');
const mainResultLabel = document.getElementById('main-result-label');
const mainResultValue = document.getElementById('main-result-value');
const mainResultSub = document.getElementById('main-result-sub');
const statsGrid = document.getElementById('stats-grid');
const breakdownPanel = document.getElementById('breakdown-panel');
const breakdownList = document.getElementById('breakdown-list');
const progressFill = document.getElementById('progress-fill');
const progressLabelLeft = document.getElementById('progress-label-left');
const progressLabelRight = document.getElementById('progress-label-right');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// ============ INPUT FIELD DEFINITIONS ============
const INPUT_DEFS = {
    basic: [
        { id: 'buy-price', label: 'Buy Price', icon: 'fa-shopping-cart', prefix: '$', placeholder: '50', value: 50 },
        { id: 'sell-price', label: 'Sell Price', icon: 'fa-tag', prefix: '$', placeholder: '65', value: 65 }
    ],
    trading: [
        { id: 'buy-price', label: 'Buy Price (per unit)', icon: 'fa-shopping-cart', prefix: '$', placeholder: '50', value: 50 },
        { id: 'sell-price', label: 'Sell Price (per unit)', icon: 'fa-tag', prefix: '$', placeholder: '65', value: 65 },
        { id: 'quantity', label: 'Quantity', icon: 'fa-hashtag', prefix: '', placeholder: '100', value: 100, suffix: 'units' },
        { id: 'fees', label: 'Total Fees (optional)', icon: 'fa-percent', prefix: '$', placeholder: '0', value: 0 }
    ],
    business: [
        { id: 'total-cost', label: 'Total Cost', icon: 'fa-money-bill-wave', prefix: '$', placeholder: '500', value: 500 },
        { id: 'total-revenue', label: 'Total Revenue', icon: 'fa-cash-register', prefix: '$', placeholder: '750', value: 750 },
        { id: 'units-sold', label: 'Units Sold (optional)', icon: 'fa-box', prefix: '', placeholder: '100', value: 100, suffix: 'units' },
        { id: 'expenses', label: 'Other Expenses (optional)', icon: 'fa-receipt', prefix: '$', placeholder: '0', value: 0 }
    ],
    'break-even': [
        { id: 'fixed-cost', label: 'Fixed Cost', icon: 'fa-building', prefix: '$', placeholder: '5000', value: 5000 },
        { id: 'variable-cost', label: 'Variable Cost (per unit)', icon: 'fa-cubes', prefix: '$', placeholder: '20', value: 20 },
        { id: 'selling-price', label: 'Selling Price (per unit)', icon: 'fa-tag', prefix: '$', placeholder: '35', value: 35 }
    ]
};

// ============ SET MODE ============
function setMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    renderInputs();
    hideResult();

    showToast(`🔄 Mode: ${formatModeName(mode)}`);
}

function formatModeName(mode) {
    const names = {
        'basic': 'Basic P/L',
        'trading': 'Trading',
        'business': 'Business',
        'break-even': 'Break-Even'
    };
    return names[mode] || mode;
}

// ============ RENDER INPUTS ============
function renderInputs() {
    const fields = INPUT_DEFS[currentMode] || [];

    inputGrid.innerHTML = fields.map(field => {
        const hasPrefix = field.prefix && field.prefix !== '';
        const hasSuffix = field.suffix && field.suffix !== '';
        const fullWidth = fields.length === 3 ? 'full-width' : '';
        
        return `
            <div class="input-field ${fullWidth}">
                <label for="${field.id}">
                    <i class="fa-solid ${field.icon}"></i> ${field.label}
                </label>
                <div class="input-wrap">
                    ${hasPrefix ? `<span class="input-prefix">${field.prefix}</span>` : ''}
                    <input type="number" 
                           id="${field.id}" 
                           class="${hasPrefix ? 'has-prefix' : ''} ${hasSuffix ? 'has-suffix' : ''}"
                           placeholder="${field.placeholder}" 
                           value="${field.value || ''}"
                           step="any"
                           min="0"
                           oninput="debounceCalculate()">
                    ${hasSuffix ? `<span class="input-suffix">${field.suffix}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ============ DEBOUNCE CALCULATE ============
let debounceTimeout;
function debounceCalculate() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(calculate, 250);
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
    let result;

    switch (currentMode) {
        case 'basic':
            result = calculateBasic();
            break;
        case 'trading':
            result = calculateTrading();
            break;
        case 'business':
            result = calculateBusiness();
            break;
        case 'break-even':
            result = calculateBreakEven();
            break;
    }

    if (!result) {
        hideResult();
        return;
    }

    currentResult = result;
    renderResult(result);
}

// ============ BASIC P/L ============
function calculateBasic() {
    const buyPrice = getVal('buy-price');
    const sellPrice = getVal('sell-price');

    if (buyPrice <= 0 || sellPrice <= 0) return null;

    const profitLoss = sellPrice - buyPrice;
    const percentage = (profitLoss / buyPrice) * 100;
    const roi = percentage; // ROI same as percentage for single trade
    const isProfit = profitLoss > 0;
    const isLoss = profitLoss < 0;

    return {
        type: isProfit ? 'profit' : isLoss ? 'loss' : 'break-even',
        mainLabel: isProfit ? 'Net Profit' : isLoss ? 'Net Loss' : 'Break Even',
        mainValue: Math.abs(profitLoss),
        mainSub: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}% ${isProfit ? 'gain' : isLoss ? 'loss' : ''}`,
        progress: Math.min(100, Math.abs(percentage)),
        progressLabel: isProfit ? 'Profit Margin' : isLoss ? 'Loss Percentage' : 'Break Even',
        progressValue: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`,
        stats: [
            { icon: 'fa-shopping-cart', label: 'Buy Price', value: formatCurrency(buyPrice) },
            { icon: 'fa-tag', label: 'Sell Price', value: formatCurrency(sellPrice) },
            { icon: isProfit ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', label: isProfit ? 'Gain' : 'Loss', value: formatCurrency(Math.abs(profitLoss)), cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' },
            { icon: 'fa-percent', label: 'Change %', value: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' },
            { icon: 'fa-coins', label: 'ROI', value: `${roi.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' }
        ],
        breakdown: [
            { icon: 'fa-calculator', label: 'Sell Price - Buy Price', value: `${formatCurrency(sellPrice)} - ${formatCurrency(buyPrice)}` },
            { icon: 'fa-equals', label: 'Net Profit/Loss', value: formatCurrency(profitLoss), cls: isProfit ? 'positive' : isLoss ? 'negative' : '' },
            { icon: 'fa-divide', label: 'Percentage Formula', value: `(${formatCurrency(profitLoss)} / ${formatCurrency(buyPrice)}) × 100` },
            { icon: 'fa-percent', label: 'Percentage Result', value: `${percentage.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : '' }
        ]
    };
}

// ============ TRADING ============
function calculateTrading() {
    const buyPrice = getVal('buy-price');
    const sellPrice = getVal('sell-price');
    const quantity = getVal('quantity');
    const fees = getVal('fees');

    if (buyPrice <= 0 || sellPrice <= 0 || quantity <= 0) return null;

    const buyCost = buyPrice * quantity;
    const sellRevenue = sellPrice * quantity;
    const grossPL = sellRevenue - buyCost;
    const netPL = grossPL - fees;
    const totalInvested = buyCost + fees;
    const percentage = (netPL / totalInvested) * 100;
    const roi = percentage;

    const isProfit = netPL > 0;
    const isLoss = netPL < 0;

    return {
        type: isProfit ? 'profit' : isLoss ? 'loss' : 'break-even',
        mainLabel: isProfit ? 'Net Profit' : isLoss ? 'Net Loss' : 'Break Even',
        mainValue: Math.abs(netPL),
        mainSub: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}% on ${formatCurrency(totalInvested)} invested`,
        progress: Math.min(100, Math.abs(percentage)),
        progressLabel: isProfit ? 'Profit Margin' : isLoss ? 'Loss Percentage' : 'Break Even',
        progressValue: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`,
        stats: [
            { icon: 'fa-shopping-cart', label: 'Total Buy', value: formatCurrency(buyCost) },
            { icon: 'fa-tag', label: 'Total Sell', value: formatCurrency(sellRevenue) },
            { icon: 'fa-coins', label: 'Fees', value: formatCurrency(fees) },
            { icon: isProfit ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', label: isProfit ? 'Net Gain' : 'Net Loss', value: formatCurrency(Math.abs(netPL)), cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' },
            { icon: 'fa-percent', label: 'ROI', value: `${roi.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' },
            { icon: 'fa-cube', label: 'Per Unit', value: formatCurrency(netPL / quantity), cls: isProfit ? 'positive' : isLoss ? 'negative' : '' }
        ],
        breakdown: [
            { icon: 'fa-shopping-cart', label: 'Buy Cost', value: `${quantity} × ${formatCurrency(buyPrice)} = ${formatCurrency(buyCost)}` },
            { icon: 'fa-tag', label: 'Sell Revenue', value: `${quantity} × ${formatCurrency(sellPrice)} = ${formatCurrency(sellRevenue)}` },
            { icon: 'fa-calculator', label: 'Gross P/L', value: formatCurrency(grossPL), cls: grossPL > 0 ? 'positive' : grossPL < 0 ? 'negative' : '' },
            { icon: 'fa-receipt', label: 'Less: Fees', value: `- ${formatCurrency(fees)}` },
            { icon: 'fa-equals', label: 'Net P/L', value: formatCurrency(netPL), cls: isProfit ? 'positive' : isLoss ? 'negative' : '' },
            { icon: 'fa-percent', label: 'Return on Investment', value: `${roi.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : '' }
        ]
    };
}

// ============ BUSINESS ============
function calculateBusiness() {
    const totalCost = getVal('total-cost');
    const totalRevenue = getVal('total-revenue');
    const unitsSold = getVal('units-sold');
    const expenses = getVal('expenses');

    if (totalCost <= 0 && totalRevenue <= 0) return null;

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - expenses;
    const totalInvested = totalCost + expenses;
    const percentage = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roi = percentage;

    const isProfit = netProfit > 0;
    const isLoss = netProfit < 0;

    const stats = [
        { icon: 'fa-money-bill-wave', label: 'Total Cost', value: formatCurrency(totalCost) },
        { icon: 'fa-cash-register', label: 'Revenue', value: formatCurrency(totalRevenue) },
        { icon: 'fa-receipt', label: 'Expenses', value: formatCurrency(expenses) },
        { icon: isProfit ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', label: isProfit ? 'Net Profit' : 'Net Loss', value: formatCurrency(Math.abs(netProfit)), cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' },
        { icon: 'fa-percent', label: 'Profit Margin', value: `${profitMargin.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' },
        { icon: 'fa-coins', label: 'ROI', value: `${roi.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : 'neutral' }
    ];

    if (unitsSold > 0) {
        stats.push({ icon: 'fa-cube', label: 'Profit / Unit', value: formatCurrency(netProfit / unitsSold), cls: isProfit ? 'positive' : isLoss ? 'negative' : '' });
    }

    return {
        type: isProfit ? 'profit' : isLoss ? 'loss' : 'break-even',
        mainLabel: isProfit ? 'Net Profit' : isLoss ? 'Net Loss' : 'Break Even',
        mainValue: Math.abs(netProfit),
        mainSub: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}% return on ${formatCurrency(totalInvested)}`,
        progress: Math.min(100, Math.abs(profitMargin)),
        progressLabel: isProfit ? 'Profit Margin' : isLoss ? 'Loss Margin' : 'Break Even',
        progressValue: `${profitMargin >= 0 ? '+' : ''}${profitMargin.toFixed(2)}%`,
        stats,
        breakdown: [
            { icon: 'fa-cash-register', label: 'Total Revenue', value: formatCurrency(totalRevenue) },
            { icon: 'fa-money-bill-wave', label: 'Less: Total Cost', value: `- ${formatCurrency(totalCost)}` },
            { icon: 'fa-calculator', label: 'Gross Profit', value: formatCurrency(grossProfit), cls: grossProfit > 0 ? 'positive' : grossProfit < 0 ? 'negative' : '' },
            { icon: 'fa-receipt', label: 'Less: Expenses', value: `- ${formatCurrency(expenses)}` },
            { icon: 'fa-equals', label: 'Net Profit/Loss', value: formatCurrency(netProfit), cls: isProfit ? 'positive' : isLoss ? 'negative' : '' },
            { icon: 'fa-percent', label: 'Profit Margin', value: `${profitMargin.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : '' },
            { icon: 'fa-coins', label: 'ROI', value: `${roi.toFixed(2)}%`, cls: isProfit ? 'positive' : isLoss ? 'negative' : '' }
        ]
    };
}

// ============ BREAK-EVEN ============
function calculateBreakEven() {
    const fixedCost = getVal('fixed-cost');
    const variableCost = getVal('variable-cost');
    const sellingPrice = getVal('selling-price');

    if (sellingPrice <= 0 || variableCost < 0) return null;

    const contributionMargin = sellingPrice - variableCost;

    if (contributionMargin <= 0) {
        return {
            type: 'loss',
            mainLabel: 'Cannot Break Even',
            mainValue: 0,
            mainSub: 'Selling price must be greater than variable cost',
            progress: 100,
            progressLabel: 'Contribution Margin',
            progressValue: `${contributionMargin.toFixed(2)}`,
            stats: [
                { icon: 'fa-tag', label: 'Selling Price', value: formatCurrency(sellingPrice) },
                { icon: 'fa-cubes', label: 'Variable Cost', value: formatCurrency(variableCost) },
                { icon: 'fa-exclamation-triangle', label: 'Contribution', value: formatCurrency(contributionMargin), cls: 'negative' }
            ],
            breakdown: [
                { icon: 'fa-exclamation-triangle', label: 'Warning', value: 'Selling price must exceed variable cost to break even.', cls: 'negative' },
                { icon: 'fa-calculator', label: 'Selling Price - Variable Cost', value: `${formatCurrency(sellingPrice)} - ${formatCurrency(variableCost)} = ${formatCurrency(contributionMargin)}`, cls: 'negative' }
            ]
        };
    }

    const breakEvenUnits = fixedCost / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * sellingPrice;
    const cmRatio = (contributionMargin / sellingPrice) * 100;

    return {
        type: 'break-even',
        mainLabel: 'Break-Even Units',
        mainValue: breakEvenUnits,
        mainSub: `Need to sell ${Math.ceil(breakEvenUnits).toLocaleString()} units to break even`,
        isCount: true,
        progress: Math.min(100, cmRatio),
        progressLabel: 'Contribution Margin Ratio',
        progressValue: `${cmRatio.toFixed(2)}%`,
        stats: [
            { icon: 'fa-building', label: 'Fixed Cost', value: formatCurrency(fixedCost) },
            { icon: 'fa-cubes', label: 'Variable Cost', value: formatCurrency(variableCost) },
            { icon: 'fa-tag', label: 'Selling Price', value: formatCurrency(sellingPrice) },
            { icon: 'fa-hand-holding-dollar', label: 'Contribution', value: formatCurrency(contributionMargin), cls: 'positive' },
            { icon: 'fa-cubes-stacked', label: 'Break-Even Units', value: Math.ceil(breakEvenUnits).toLocaleString() },
            { icon: 'fa-dollar-sign', label: 'Break-Even Revenue', value: formatCurrency(breakEvenRevenue) }
        ],
        breakdown: [
            { icon: 'fa-calculator', label: 'Contribution Margin', value: `${formatCurrency(sellingPrice)} - ${formatCurrency(variableCost)} = ${formatCurrency(contributionMargin)}` },
            { icon: 'fa-percent', label: 'CM Ratio', value: `(${formatCurrency(contributionMargin)} / ${formatCurrency(sellingPrice)}) × 100 = ${cmRatio.toFixed(2)}%` },
            { icon: 'fa-divide', label: 'Break-Even Units', value: `${formatCurrency(fixedCost)} / ${formatCurrency(contributionMargin)} = ${Math.ceil(breakEvenUnits).toLocaleString()} units` },
            { icon: 'fa-dollar-sign', label: 'Break-Even Revenue', value: `${Math.ceil(breakEvenUnits)} × ${formatCurrency(sellingPrice)} = ${formatCurrency(breakEvenRevenue)}` },
            { icon: 'fa-lightbulb', label: 'Insight', value: `Har unit par ${formatCurrency(contributionMargin)} contribution. Fixed cost cover karne ke liye ${Math.ceil(breakEvenUnits)} units chahiye.` }
        ]
    };
}

// ============ RENDER RESULT ============
function renderResult(result) {
    resultPanel.style.display = 'block';
    breakdownPanel.style.display = 'block';

    // Badge
    resultBadge.className = 'result-badge';
    resultBadge.innerText = result.type === 'profit' ? 'PROFIT' : result.type === 'loss' ? 'LOSS' : 'BREAK-EVEN';
    if (result.type === 'loss') resultBadge.classList.add('loss');
    else if (result.type === 'break-even') resultBadge.classList.add('break-even');

    // Main result
    mainResult.className = 'main-result';
    if (result.type === 'loss') mainResult.classList.add('loss');
    else if (result.type === 'break-even') mainResult.classList.add('break-even');

    mainResultLabel.innerText = result.mainLabel;
    mainResultValue.innerText = result.isCount 
        ? Math.ceil(result.mainValue).toLocaleString() 
        : formatCurrency(result.mainValue);
    mainResultSub.innerText = result.mainSub;

    // Progress
    progressFill.className = 'progress-fill';
    if (result.type === 'loss') progressFill.classList.add('negative');
    else if (result.type === 'break-even') progressFill.classList.add('neutral');
    progressFill.style.width = result.progress + '%';

    progressLabelLeft.innerText = result.progressLabel;
    progressLabelRight.innerText = result.progressValue;
    progressLabelRight.className = '';
    if (result.type === 'loss') progressLabelRight.classList.add('negative');
    else if (result.type === 'break-even') progressLabelRight.classList.add('neutral');

    // Stats
    statsGrid.innerHTML = result.stats.map(stat => `
        <div class="stat-card">
            <div class="stat-icon"><i class="fa-solid ${stat.icon}"></i></div>
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value ${stat.cls || ''}">${stat.value}</div>
        </div>
    `).join('');

    // Breakdown
    breakdownList.innerHTML = result.breakdown.map(item => `
        <div class="breakdown-item">
            <div class="breakdown-item-label">
                <i class="fa-solid ${item.icon}"></i> ${item.label}
            </div>
            <div class="breakdown-item-value ${item.cls || ''}">${item.value}</div>
        </div>
    `).join('');
}

// ============ HIDE RESULT ============
function hideResult() {
    resultPanel.style.display = 'none';
    breakdownPanel.style.display = 'none';
    currentResult = null;
}

// ============ FORMAT CURRENCY ============
function formatCurrency(num) {
    if (!isFinite(num)) return '$0.00';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    return sign + '$' + abs.toFixed(2);
}

// ============ LOAD SAMPLE ============
function loadSample() {
    const fields = INPUT_DEFS[currentMode] || [];
    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el && field.value !== undefined) {
            // Add slight random variation
            const variation = Math.random() * 0.2 - 0.1; // -10% to +10%
            const value = field.value * (1 + variation);
            el.value = parseFloat(value.toFixed(2));
        }
    });
    calculate();
    showToast('🧪 Sample loaded!');
}

// ============ CLEAR ALL ============
function clearAll() {
    const fields = INPUT_DEFS[currentMode] || [];
    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) el.value = '';
    });
    hideResult();
    showToast('🧹 Cleared!');
}

// ============ APPLY PRESET ============
function applyPreset(name) {
    const presets = {
        stock: {
            mode: 'trading',
            values: { 'buy-price': 50, 'sell-price': 65, 'quantity': 100, 'fees': 5 }
        },
        business: {
            mode: 'business',
            values: { 'total-cost': 500, 'total-revenue': 750, 'units-sold': 100, 'expenses': 25 }
        },
        crypto: {
            mode: 'trading',
            values: { 'buy-price': 40000, 'sell-price': 45000, 'quantity': 0.5, 'fees': 50 }
        },
        loss: {
            mode: 'basic',
            values: { 'buy-price': 100, 'sell-price': 85 }
        }
    };

    const preset = presets[name];
    if (!preset) return;

    // Switch mode
    if (preset.mode !== currentMode) {
        currentMode = preset.mode;
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === preset.mode);
        });
        renderInputs();
    }

    // Fill values
    Object.entries(preset.values).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    });

    calculate();
    showToast(`⚡ Preset applied: ${name}`);
}

// ============ COPY RESULT ============
function copyResult() {
    if (!currentResult) return showToast('❌ Nothing to copy!', 'error');

    const lines = [
        `📊 ${formatModeName(currentMode)} Calculation`,
        `─────────────────────────────`,
        `${currentResult.mainLabel}: ${currentResult.isCount ? Math.ceil(currentResult.mainValue).toLocaleString() : formatCurrency(currentResult.mainValue)}`,
        currentResult.mainSub,
        ``,
        `📈 Statistics:`
    ];

    currentResult.stats.forEach(stat => {
        lines.push(`  • ${stat.label}: ${stat.value}`);
    });

    lines.push('');
    lines.push('📝 Breakdown:');
    currentResult.breakdown.forEach(item => {
        lines.push(`  • ${item.label}: ${item.value}`);
    });

    lines.push('');
    lines.push(`Generated by Tool Hub • ${new Date().toLocaleString()}`);

    const text = lines.join('\n');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Result copied!');
    }).catch(() => {
        showToast('❌ Copy failed!', 'error');
    });
}

// ============ SHARE RESULT ============
function shareResult() {
    if (!currentResult) return showToast('❌ Nothing to share!', 'error');

    const mainValueStr = currentResult.isCount 
        ? Math.ceil(currentResult.mainValue).toLocaleString() 
        : formatCurrency(currentResult.mainValue);

    const text = `${currentResult.mainLabel}: ${mainValueStr} — ${currentResult.mainSub}`;

    if (navigator.share) {
        navigator.share({
            title: 'Profit/Loss Calculation',
            text: text,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('🔗 Result copied to clipboard!');
        }).catch(() => {
            showToast('❌ Could not share!', 'error');
        });
    }
}

// ============ SAVE TO HISTORY ============
function saveToHistory() {
    if (!currentResult) return showToast('❌ Calculate first!', 'error');

    const entry = {
        mode: currentMode,
        modeName: formatModeName(currentMode),
        type: currentResult.type,
        mainLabel: currentResult.mainLabel,
        mainValue: currentResult.mainValue,
        mainSub: currentResult.mainSub,
        isCount: currentResult.isCount,
        time: Date.now()
    };

    history.unshift(entry);
    if (history.length > 20) history.pop();

    try {
        localStorage.setItem('toolhub_profitloss_history', JSON.stringify(history));
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

    historyList.innerHTML = history.map((h, idx) => {
        const valueStr = h.isCount 
            ? Math.ceil(h.mainValue).toLocaleString() 
            : formatCurrency(h.mainValue);
        
        return `
            <div class="history-item" onclick="loadFromHistory(${idx})">
                <div class="history-info">
                    <div class="history-main">${h.mainLabel} • ${h.modeName}</div>
                    <div class="history-sub">${h.mainSub} • ${formatTime(h.time)}</div>
                </div>
                <div class="history-value ${h.type === 'profit' ? 'positive' : h.type === 'loss' ? 'negative' : ''}">
                    ${valueStr}
                </div>
            </div>
        `;
    }).join('');
}

function loadFromHistory(idx) {
    const h = history[idx];
    if (!h) return;

    // Switch mode
    currentMode = h.mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === h.mode);
    });
    renderInputs();
    showToast('📋 Loaded from history');
}

function clearHistory() {
    if (history.length === 0) return;
    if (!confirm('Kya aap saari history clear karna chahte hain?')) return;
    history = [];
    localStorage.removeItem('toolhub_profitloss_history');
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
        title: 'Profit/Loss Calculator - Tool Hub',
        text: 'Check out this free Profit/Loss Calculator tool!',
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
    // Ctrl/Cmd + Shift + X → Clear
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearAll();
    }
    // 1-4 → Switch modes
    if (!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName !== 'INPUT') {
        const modes = ['basic', 'trading', 'business', 'break-even'];
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