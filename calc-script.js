/* ============================================================
   BASIC CALCULATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentInput = '0';
let expression = '';
let previousValue = null;
let currentOperator = null;
let shouldResetInput = false;
let memory = 0;
let hasMemory = false;
let history = JSON.parse(localStorage.getItem('toolhub_calc_history')) || [];

// ============ DOM ELEMENTS ============
const expressionEl = document.getElementById('calc-expression');
const resultEl = document.getElementById('calc-result');
const historyListEl = document.getElementById('history-list');

// ============ DISPLAY UPDATE ============
function updateDisplay() {
    // Format result for display
    let display = currentInput;
    if (display.length > 14 && !isNaN(parseFloat(display))) {
        const num = parseFloat(display);
        if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
            display = num.toExponential(6);
        } else {
            display = parseFloat(num.toPrecision(12)).toString();
        }
    }
    resultEl.innerText = display;
    expressionEl.innerText = expression || '\u00A0';
}

// ============ MAIN ACTION HANDLER ============
function calcAction(action) {
    switch (action) {
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            inputDigit(action);
            break;
        case 'decimal':
            inputDecimal();
            break;
        case 'add': case 'subtract': case 'multiply': case 'divide':
            setOperator(action);
            break;
        case 'equals':
            calculateResult();
            break;
        case 'clear':
            clearAll();
            break;
        case 'backspace':
            backspace();
            break;
        case 'percent':
            applyPercent();
            break;
        case 'sign':
            toggleSign();
            break;
        case 'sqrt':
            applyUnary('sqrt');
            break;
        case 'square':
            applyUnary('square');
            break;
        case 'inverse':
            applyUnary('inverse');
            break;
        case 'pi':
            inputPi();
            break;
    }
    updateDisplay();
}

// ============ INPUT DIGIT ============
function inputDigit(digit) {
    if (shouldResetInput) {
        currentInput = digit;
        shouldResetInput = false;
    } else {
        currentInput = currentInput === '0' ? digit : currentInput + digit;
    }
    if (currentInput.length > 16) {
        currentInput = currentInput.slice(0, 16);
    }
}

// ============ INPUT DECIMAL ============
function inputDecimal() {
    if (shouldResetInput) {
        currentInput = '0.';
        shouldResetInput = false;
        return;
    }
    if (!currentInput.includes('.')) {
        currentInput += '.';
    }
}

// ============ INPUT PI ============
function inputPi() {
    if (shouldResetInput) {
        currentInput = Math.PI.toString();
        shouldResetInput = false;
    } else {
        currentInput = Math.PI.toString();
    }
}

// ============ SET OPERATOR ============
function setOperator(op) {
    if (currentOperator && !shouldResetInput) {
        calculateResult(false); // silent
    }
    previousValue = parseFloat(currentInput);
    currentOperator = op;
    shouldResetInput = true;

    const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
    expression = `${formatNumber(previousValue)} ${symbols[op]}`;
}

// ============ CALCULATE RESULT ============
function calculateResult(addToHistory = true) {
    if (currentOperator === null || previousValue === null) {
        // Just finalize current input
        expression = '';
        currentOperator = null;
        return;
    }

    const current = parseFloat(currentInput);
    let result = 0;
    let symbol = '';

    switch (currentOperator) {
        case 'add': result = previousValue + current; symbol = '+'; break;
        case 'subtract': result = previousValue - current; symbol = '−'; break;
        case 'multiply': result = previousValue * current; symbol = '×'; break;
        case 'divide':
            if (current === 0) {
                showToast('❌ Cannot divide by zero!', 'error');
                expression = '';
                currentOperator = null;
                previousValue = null;
                currentInput = '0';
                return;
            }
            result = previousValue / current;
            symbol = '÷';
            break;
    }

    // Round floating point errors
    result = parseFloat(result.toPrecision(12));

    const exprText = `${formatNumber(previousValue)} ${symbol} ${formatNumber(current)}`;
    
    if (addToHistory) {
        addHistoryItem(exprText, result);
    }

    expression = `${exprText} =`;
    currentInput = result.toString();
    previousValue = null;
    currentOperator = null;
    shouldResetInput = true;
}

// ============ CLEAR ALL ============
function clearAll() {
    currentInput = '0';
    expression = '';
    previousValue = null;
    currentOperator = null;
    shouldResetInput = false;
}

// ============ BACKSPACE ============
function backspace() {
    if (shouldResetInput) {
        currentInput = '0';
        shouldResetInput = false;
        return;
    }
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
}

// ============ PERCENT ============
function applyPercent() {
    const current = parseFloat(currentInput);
    if (isNaN(current)) return;

    if (previousValue !== null && (currentOperator === 'add' || currentOperator === 'subtract')) {
        // Percentage of previous value (like 200 + 10% = 220)
        const percentValue = (previousValue * current) / 100;
        currentInput = percentValue.toString();
    } else {
        currentInput = (current / 100).toString();
    }
}

// ============ TOGGLE SIGN ============
function toggleSign() {
    if (currentInput === '0') return;
    if (currentInput.startsWith('-')) {
        currentInput = currentInput.slice(1);
    } else {
        currentInput = '-' + currentInput;
    }
}

// ============ UNARY OPERATIONS ============
function applyUnary(type) {
    const current = parseFloat(currentInput);
    if (isNaN(current)) return;

    let result;
    let label;

    switch (type) {
        case 'sqrt':
            if (current < 0) {
                showToast('❌ Cannot sqrt negative!', 'error');
                return;
            }
            result = Math.sqrt(current);
            label = `√(${formatNumber(current)})`;
            break;
        case 'square':
            result = current * current;
            label = `(${formatNumber(current)})²`;
            break;
        case 'inverse':
            if (current === 0) {
                showToast('❌ Cannot divide by zero!', 'error');
                return;
            }
            result = 1 / current;
            label = `1/(${formatNumber(current)})`;
            break;
    }

    result = parseFloat(result.toPrecision(12));

    addHistoryItem(label, result);
    expression = `${label} =`;
    currentInput = result.toString();
    shouldResetInput = true;
}

// ============ MEMORY FUNCTIONS ============
function memoryAction(action) {
    const current = parseFloat(currentInput);

    switch (action) {
        case 'MC':
            memory = 0;
            hasMemory = false;
            showToast('🧠 Memory cleared');
            break;
        case 'MR':
            if (!hasMemory) {
                showToast('❌ Memory is empty!', 'error');
                return;
            }
            currentInput = memory.toString();
            shouldResetInput = true;
            showToast('🧠 Memory recalled');
            break;
        case 'M+':
            memory += current;
            hasMemory = true;
            showToast(`🧠 Added to memory (M = ${formatNumber(memory)})`);
            break;
        case 'M-':
            memory -= current;
            hasMemory = true;
            showToast(`🧠 Subtracted from memory (M = ${formatNumber(memory)})`);
            break;
        case 'MS':
            memory = current;
            hasMemory = true;
            showToast('🧠 Value stored in memory');
            break;
    }

    updateMemoryIndicator();
}

function updateMemoryIndicator() {
    const memBtns = document.querySelectorAll('.mem-btn');
    memBtns.forEach(btn => {
        if (btn.innerText === 'MR' || btn.innerText === 'MC') {
            if (hasMemory) {
                btn.classList.add('active-mem');
            } else {
                btn.classList.remove('active-mem');
            }
        }
    });
}

// ============ HISTORY ============
function addHistoryItem(expr, result) {
    const item = {
        expr: expr,
        result: result,
        time: Date.now()
    };
    history.unshift(item);
    if (history.length > 30) history.pop();
    localStorage.setItem('toolhub_calc_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyListEl.innerHTML = '<p class="empty-history">No calculations yet...</p>';
        return;
    }

    historyListEl.innerHTML = history.map((item, idx) => `
        <div class="history-item" onclick="useHistoryResult(${idx})" title="Click to use this result">
            <div class="hist-expr">${escapeHtml(item.expr)}</div>
            <div class="hist-result">= ${formatNumber(item.result)}</div>
        </div>
    `).join('');
}

function useHistoryResult(idx) {
    const item = history[idx];
    if (!item) return;
    currentInput = item.result.toString();
    shouldResetInput = true;
    expression = `From history: ${item.expr}`;
    updateDisplay();
    showToast('📋 Result loaded from history');
}

function clearHistory() {
    if (history.length === 0) {
        showToast('❌ History already empty!', 'error');
        return;
    }
    if (confirm('Kya aap poori history clear karna chahte hain?')) {
        history = [];
        localStorage.removeItem('toolhub_calc_history');
        renderHistory();
        showToast('🗑️ History cleared!');
    }
}

// ============ HELPERS ============
function formatNumber(num) {
    if (isNaN(num)) return '0';
    if (!isFinite(num)) return '∞';
    const rounded = parseFloat(num.toPrecision(12));
    if (Math.abs(rounded) > 1e12 || (Math.abs(rounded) < 1e-6 && rounded !== 0)) {
        return rounded.toExponential(4);
    }
    return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Basic Calculator - Tool Hub',
        text: 'Check out this free Basic Calculator tool!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Tool link copied!');
        }).catch(() => {
            showToast('❌ Could not copy link!', 'error');
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
    }, 2500);
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

const savedTheme = localStorage.getItem('toolhub_theme') || 'light';
applyTheme(savedTheme);

// ============ KEYBOARD SUPPORT ============
document.addEventListener('keydown', (e) => {
    const key = e.key;

    // Numbers
    if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        calcAction(key);
        flashKey(key);
    }
    // Decimal
    else if (key === '.' || key === ',') {
        e.preventDefault();
        calcAction('decimal');
        flashKey('.');
    }
    // Operators
    else if (key === '+') { e.preventDefault(); calcAction('add'); flashKey('+'); }
    else if (key === '-') { e.preventDefault(); calcAction('subtract'); flashKey('−'); }
    else if (key === '*' || key === 'x' || key === 'X') { e.preventDefault(); calcAction('multiply'); flashKey('×'); }
    else if (key === '/') { e.preventDefault(); calcAction('divide'); flashKey('÷'); }
    else if (key === '%') { e.preventDefault(); calcAction('percent'); flashKey('%'); }
    // Equals
    else if (key === '=' || key === 'Enter') {
        e.preventDefault();
        calcAction('equals');
        flashKey('=');
    }
    // Clear
    else if (key === 'Escape' || key === 'c' || key === 'C') {
        e.preventDefault();
        calcAction('clear');
        flashKey('C');
    }
    // Backspace
    else if (key === 'Backspace') {
        e.preventDefault();
        calcAction('backspace');
    }
});

// Visual feedback on key press
function flashKey(key) {
    const buttons = document.querySelectorAll('.key');
    for (let btn of buttons) {
        if (btn.innerText.trim() === key) {
            btn.style.transform = 'scale(0.95)';
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
            setTimeout(() => {
                btn.style.transform = '';
                btn.style.background = '';
                btn.style.color = '';
            }, 120);
            break;
        }
    }
}

// ============ INITIALIZE ============
updateDisplay();
renderHistory();
updateMemoryIndicator();