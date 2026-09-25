/* ============================================================
   DUPLICATE LINE REMOVER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ DOM ELEMENTS ============
const inputEl = document.getElementById('dupe-input');
const outputEl = document.getElementById('dupe-output');

// Stats
const statInputLines = document.getElementById('stat-input-lines');
const statOutputLines = document.getElementById('stat-output-lines');
const statDupes = document.getElementById('stat-dupes');
const statReduction = document.getElementById('stat-reduction');

// Panel stats
const inputLines = document.getElementById('input-lines');
const inputChars = document.getElementById('input-chars');
const outputLines = document.getElementById('output-lines');
const outputChars = document.getElementById('output-chars');

// Badges
const inputBadge = document.getElementById('input-badge');
const outputBadge = document.getElementById('output-badge');

// Options
const optCaseInsensitive = document.getElementById('opt-case-insensitive');
const optTrim = document.getElementById('opt-trim');
const optRemoveEmpty = document.getElementById('opt-remove-empty');
const optSortResult = document.getElementById('opt-sort-result');
const optAutoProcess = document.getElementById('opt-auto-process');
const optPreserveOrder = document.getElementById('opt-preserve-order');
const optKeepSeparator = document.getElementById('opt-keep-separator');

// Dupe analysis panel
const dupesPanel = document.getElementById('dupes-panel');
const dupesGrid = document.getElementById('dupes-grid');

// ============ STATE ============
let currentQuickAction = 'basic';

// ============ PROCESS TEXT ============
function processText() {
    const original = inputEl.value;

    if (!original) {
        outputEl.value = '';
        updateStats(0, 0, 0);
        dupesPanel.style.display = 'none';
        return;
    }

    // Split into lines
    let lines = original.split('\n');
    const originalCount = lines.length;

    // Trim whitespace
    if (optTrim.checked) {
        lines = lines.map(line => line.trim());
    }

    // Remove empty lines
    let emptyRemoved = 0;
    if (optRemoveEmpty.checked) {
        const before = lines.length;
        lines = lines.filter(line => line !== '');
        emptyRemoved = before - lines.length;
    }

    // Determine keep mode
    const keepMode = document.querySelector('input[name="keep-mode"]:checked')?.value || 'first';

    // Dedupe
    const { unique, dupesMap, dupesCount } = dedupeLines(lines, keepMode);

    // Sort result if option is on
    let finalResult = unique;
    if (optSortResult.checked) {
        finalResult = [...unique].sort((a, b) => {
            const strA = optCaseInsensitive.checked ? a.toLowerCase() : a;
            const strB = optCaseInsensitive.checked ? b.toLowerCase() : b;
            return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
        });
    }

    // Join output
    outputEl.value = finalResult.join('\n');

    // Update stats
    updateStats(originalCount, finalResult.length, dupesCount);

    // Update duplicate analysis
    renderDupeAnalysis(dupesMap);
}

// ============ DEDUPE LINES ============
function dedupeLines(lines, keepMode) {
    const dupesMap = new Map(); // key -> { text, count }
    const result = [];
    const keyToIndex = new Map(); // key -> index in result (for keep-last mode)

    lines.forEach((line, idx) => {
        // Generate comparison key
        let key = line;
        if (optCaseInsensitive.checked) key = key.toLowerCase();

        // Count duplicates (for analysis)
        if (dupesMap.has(key)) {
            const item = dupesMap.get(key);
            item.count++;
        } else {
            dupesMap.set(key, { text: line, count: 1 });
        }

        if (keepMode === 'first') {
            // Only add if not seen before
            if (!keyToIndex.has(key)) {
                keyToIndex.set(key, result.length);
                result.push(line);
            }
        } else if (keepMode === 'last') {
            // If seen, update the existing position; else add
            if (keyToIndex.has(key)) {
                result[keyToIndex.get(key)] = line;
            } else {
                keyToIndex.set(key, result.length);
                result.push(line);
            }
        }
    });

    // If preserve order is OFF, sort by first occurrence
    if (!optPreserveOrder.checked && keepMode === 'last') {
        // Sort by index of first occurrence
        const firstSeen = new Map();
        lines.forEach((line, idx) => {
            let key = line;
            if (optCaseInsensitive.checked) key = key.toLowerCase();
            if (!firstSeen.has(key)) {
                firstSeen.set(key, idx);
            }
        });
        result.sort((a, b) => {
            let keyA = a;
            let keyB = b;
            if (optCaseInsensitive.checked) {
                keyA = keyA.toLowerCase();
                keyB = keyB.toLowerCase();
            }
            return (firstSeen.get(keyA) || 0) - (firstSeen.get(keyB) || 0);
        });
    }

    // Calculate total duplicates removed
    let dupesCount = 0;
    dupesMap.forEach(item => {
        if (item.count > 1) dupesCount += item.count - 1;
    });

    return { unique: result, dupesMap, dupesCount };
}

// ============ UPDATE STATS ============
function updateStats(inputCount, outputCount, dupesCount) {
    // Top stats
    statInputLines.innerText = inputCount.toLocaleString();
    statOutputLines.innerText = outputCount.toLocaleString();
    statDupes.innerText = dupesCount.toLocaleString();

    const reduction = inputCount === 0 ? 0 : Math.round((dupesCount / inputCount) * 100);
    statReduction.innerText = reduction + '%';

    // Panel stats
    const inText = inputEl.value;
    const outText = outputEl.value;

    inputLines.innerText = (inText === '' ? 0 : inText.split('\n').length).toLocaleString();
    inputChars.innerText = inText.length.toLocaleString();
    outputLines.innerText = (outText === '' ? 0 : outText.split('\n').length).toLocaleString();
    outputChars.innerText = outText.length.toLocaleString();

    // Badges
    inputBadge.innerText = (inText === '' ? 0 : inText.split('\n').length).toLocaleString();
}

// ============ DUPLICATE ANALYSIS ============
function renderDupeAnalysis(dupesMap) {
    // Get items with count > 1
    const dupes = Array.from(dupesMap.entries())
        .filter(([_, item]) => item.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20); // Top 20

    if (dupes.length === 0) {
        dupesPanel.style.display = 'none';
        return;
    }

    dupesPanel.style.display = 'block';

    dupesGrid.innerHTML = dupes.map(([key, item]) => `
        <div class="dupe-item" title="${escapeHtml(item.text)}">
            <div class="dupe-text">${escapeHtml(truncate(item.text, 30)) || '(empty)'}</div>
            <div class="dupe-count">×${item.count}</div>
        </div>
    `).join('');
}

// ============ QUICK ACTIONS ============
function quickAction(type) {
    // Update active button
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(type) || 
            (type === 'basic' && btn.querySelector('span').innerText === 'Basic Dedupe') ||
            (type === 'smart' && btn.querySelector('span').innerText === 'Smart Clean') ||
            (type === 'aggressive' && btn.querySelector('span').innerText === 'Aggressive') ||
            (type === 'sort' && btn.querySelector('span').innerText.includes('Sort')));
    });

    // Reset options to defaults
    optCaseInsensitive.checked = false;
    optTrim.checked = false;
    optRemoveEmpty.checked = true;
    optSortResult.checked = false;
    optAutoProcess.checked = true;
    optPreserveOrder.checked = true;
    optKeepSeparator.checked = false;

    document.querySelector('input[name="keep-mode"][value="first"]').checked = true;

    switch (type) {
        case 'basic':
            // Defaults already set
            showToast('⚡ Basic Dedupe applied');
            break;

        case 'smart':
            optCaseInsensitive.checked = true;
            optTrim.checked = true;
            showToast('✨ Smart Clean applied');
            break;

        case 'aggressive':
            optCaseInsensitive.checked = true;
            optTrim.checked = true;
            optRemoveEmpty.checked = true;
            showToast('🧹 Aggressive Clean applied');
            break;

        case 'sort':
            optTrim.checked = true;
            optSortResult.checked = true;
            showToast('📊 Dedupe + Sort applied');
            break;
    }

    currentQuickAction = type;
    processText();
}

// ============ TOGGLE OPTIONS ============
function toggleOptions() {
    const body = document.getElementById('options-body');
    const btn = document.getElementById('options-toggle');
    body.classList.toggle('collapsed');
    btn.classList.toggle('rotated');
}

// ============ COPY OUTPUT ============
function copyOutput() {
    const text = outputEl.value;
    if (!text) return showToast('❌ Nothing to copy!', 'error');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Unique lines copied!');
    }).catch(() => {
        outputEl.select();
        document.execCommand('copy');
        showToast('📋 Copied!');
    });
}

// ============ DOWNLOAD OUTPUT ============
function downloadOutput() {
    const text = outputEl.value;
    if (!text) return showToast('❌ Nothing to download!', 'error');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `unique-lines-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 File downloaded!');
}

// ============ PASTE ============
function pasteText() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        showToast('❌ Clipboard API not supported!', 'error');
        return;
    }
    navigator.clipboard.readText().then(text => {
        if (!text) return showToast('❌ Clipboard is empty!', 'error');
        inputEl.value = text;
        processText();
        showToast('📋 Pasted from clipboard!');
    }).catch(() => {
        showToast('❌ Paste permission denied!', 'error');
    });
}

// ============ CLEAR INPUT ============
function clearInput() {
    if (!inputEl.value) return showToast('❌ Input already empty!', 'error');
    inputEl.value = '';
    processText();
    inputEl.focus();
    showToast('🧹 Input cleared!');
}

// ============ CLEAR ALL ============
function clearAll() {
    if (!inputEl.value && !outputEl.value) {
        showToast('❌ Nothing to clear!', 'error');
        return;
    }
    if (!confirm('Kya aap input aur output dono clear karna chahte hain?')) return;

    inputEl.value = '';
    outputEl.value = '';
    updateStats(0, 0, 0);
    dupesPanel.style.display = 'none';
    inputEl.focus();
    showToast('🧹 Cleared successfully!');
}

// ============ USE AS INPUT ============
function useAsInput() {
    const text = outputEl.value;
    if (!text) return showToast('❌ Output is empty!', 'error');
    inputEl.value = text;
    processText();
    showToast('⬆️ Output moved to input!');
}

// ============ LOAD SAMPLE ============
function loadSample() {
    inputEl.value = `apple
banana
Apple
cherry
banana
date
  apple  
cherry
banana
apple
Elderberry
fig
apple
cherry
date
grape`;
    processText();
    showToast('🧪 Sample loaded!');
}

// ============ TRY EXAMPLE ============
function tryExample(type) {
    const examples = {
        simple: `apple
banana
apple
cherry
banana
apple`,
        case: `Apple
apple
APPLE
banana
Banana
BANANA
cherry
Cherry`,
        spaces: `  apple
apple
apple  
  apple  
banana
banana  `,
        email: `john@example.com
jane@example.com
john@example.com
bob@example.com
jane@example.com
alice@example.com
john@example.com`
    };

    inputEl.value = examples[type] || '';
    processText();
    showToast(`🧪 Example loaded: ${type}`);
}

// ============ HELPERS ============
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ============ SHARE ============
function shareTool() {
    const shareData = {
        title: 'Duplicate Line Remover - Tool Hub',
        text: 'Check out this free Duplicate Line Remover tool!',
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
    }, 2000);
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
inputEl.addEventListener('input', () => {
    if (optAutoProcess.checked) {
        processText();
    } else {
        updateStats(0, 0, 0);
    }
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Process
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processText();
        showToast('✅ Duplicates removed!');
    }
    // Ctrl/Cmd + Shift + C → Copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyOutput();
    }
    // Ctrl/Cmd + Shift + S → Download
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        downloadOutput();
    }
    // Ctrl/Cmd + Shift + X → Clear
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearAll();
    }
});

// ============ RESTORE DRAFT ============
const draft = localStorage.getItem('toolhub_dupe_draft');
if (draft) {
    inputEl.value = draft;
    processText();
}

window.addEventListener('beforeunload', () => {
    if (inputEl.value.trim()) {
        localStorage.setItem('toolhub_dupe_draft', inputEl.value);
    } else {
        localStorage.removeItem('toolhub_dupe_draft');
    }
});

// ============ INITIALIZE ============
processText();
inputEl.focus();