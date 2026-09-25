/* ============================================================
   TEXT SORTER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ DOM ELEMENTS ============
const inputEl = document.getElementById('sort-input');
const outputEl = document.getElementById('sort-output');
const modeBadge = document.getElementById('mode-badge');

// Stats
const statLines = document.getElementById('stat-lines');
const statChars = document.getElementById('stat-chars');
const statWords = document.getElementById('stat-words');
const statMode = document.getElementById('stat-mode');

// Panel stats
const inputLines = document.getElementById('input-lines');
const inputChars = document.getElementById('input-chars');
const outputLines = document.getElementById('output-lines');
const outputChars = document.getElementById('output-chars');

// Options
const optCaseInsensitive = document.getElementById('opt-case-insensitive');
const optNatural = document.getElementById('opt-natural');
const optTrim = document.getElementById('opt-trim');
const optRemoveEmpty = document.getElementById('opt-remove-empty');
const optRemoveDupes = document.getElementById('opt-remove-dupes');
const optAutoProcess = document.getElementById('opt-auto-process');

// Sort summary
const sortStatsPanel = document.getElementById('sort-stats-panel');
const sortStatsGrid = document.getElementById('sort-stats-grid');

// ============ STATE ============
let currentMode = 'az';

// ============ MODE NAMES ============
const MODE_NAMES = {
    az: 'A → Z',
    za: 'Z → A',
    lengthAsc: 'Length ↑',
    lengthDesc: 'Length ↓',
    numeric: 'Numeric',
    reverse: 'Reverse',
    random: 'Random',
    none: 'No Sort'
};

// ============ SET MODE ============
function setMode(mode) {
    currentMode = mode;

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update badge
    modeBadge.innerText = MODE_NAMES[mode] || mode.toUpperCase();

    // Process
    processText();
    showToast(`🔄 Mode: ${MODE_NAMES[mode]}`);
}

// ============ PROCESS TEXT ============
function processText() {
    const original = inputEl.value;

    if (!original.trim()) {
        outputEl.value = '';
        updateStats();
        sortStatsPanel.style.display = 'none';
        return;
    }

    // Split into lines
    let lines = original.split('\n');

    // Track original count
    const originalCount = lines.length;

    // Trim lines
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

    // Remove duplicates
    let dupesRemoved = 0;
    if (optRemoveDupes.checked) {
        const seen = new Set();
        const result = [];
        lines.forEach(line => {
            const key = optCaseInsensitive.checked ? line.toLowerCase() : line;
            if (!seen.has(key)) {
                seen.add(key);
                result.push(line);
            } else {
                dupesRemoved++;
            }
        });
        lines = result;
    }

    // Sort
    const sorted = applySort(lines);

    // Join output
    outputEl.value = sorted.join('\n');

    // Update stats
    updateStats();

    // Show sort summary
    renderSortSummary({
        originalCount,
        finalCount: sorted.length,
        emptyRemoved,
        dupesRemoved,
        mode: currentMode
    });
}

// ============ APPLY SORT ============
function applySort(lines) {
    const result = [...lines];

    switch (currentMode) {
        case 'az':
            result.sort((a, b) => compareStrings(a, b, 1));
            break;

        case 'za':
            result.sort((a, b) => compareStrings(a, b, -1));
            break;

        case 'lengthAsc':
            result.sort((a, b) => {
                const diff = a.length - b.length;
                if (diff !== 0) return diff;
                return compareStrings(a, b, 1);
            });
            break;

        case 'lengthDesc':
            result.sort((a, b) => {
                const diff = b.length - a.length;
                if (diff !== 0) return diff;
                return compareStrings(a, b, 1);
            });
            break;

        case 'numeric':
            result.sort((a, b) => {
                const numA = parseFloat(a.replace(/[^0-9.\-]/g, ''));
                const numB = parseFloat(b.replace(/[^0-9.\-]/g, ''));
                const isNumA = !isNaN(numA);
                const isNumB = !isNaN(numB);

                if (isNumA && isNumB) return numA - numB;
                if (isNumA) return -1;
                if (isNumB) return 1;
                return compareStrings(a, b, 1);
            });
            break;

        case 'reverse':
            result.reverse();
            break;

        case 'random':
            // Fisher-Yates shuffle with crypto
            for (let i = result.length - 1; i > 0; i--) {
                const j = secureRandom(i + 1);
                [result[i], result[j]] = [result[j], result[i]];
            }
            break;

        case 'none':
            // No sort, keep original order
            break;
    }

    return result;
}

// ============ COMPARE STRINGS ============
function compareStrings(a, b, direction = 1) {
    let strA = optCaseInsensitive.checked ? a.toLowerCase() : a;
    let strB = optCaseInsensitive.checked ? b.toLowerCase() : b;

    let result;
    if (optNatural.checked) {
        result = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
    } else {
        if (strA < strB) result = -1;
        else if (strA > strB) result = 1;
        else result = 0;
    }

    return result * direction;
}

// ============ CRYPTOGRAPHIC RANDOM ============
function secureRandom(max) {
    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
    }
    return Math.floor(Math.random() * max);
}

// ============ UPDATE STATS ============
function updateStats() {
    const inText = inputEl.value;
    const outText = outputEl.value;

    // Input stats
    const inLineCount = inText === '' ? 0 : inText.split('\n').length;
    const inCharCount = inText.length;

    inputLines.innerText = inLineCount.toLocaleString();
    inputChars.innerText = inCharCount.toLocaleString();

    // Output stats
    const outLineCount = outText === '' ? 0 : outText.split('\n').length;
    const outCharCount = outText.length;
    const outWordCount = outText.trim() === '' ? 0 : outText.trim().split(/\s+/).length;

    outputLines.innerText = outLineCount.toLocaleString();
    outputChars.innerText = outCharCount.toLocaleString();

    // Top stats
    statLines.innerText = outLineCount.toLocaleString();
    statChars.innerText = outCharCount.toLocaleString();
    statWords.innerText = outWordCount.toLocaleString();
    statMode.innerText = MODE_NAMES[currentMode];
}

// ============ SORT SUMMARY ============
function renderSortSummary(info) {
    const items = [];

    items.push({
        icon: 'fa-arrow-down-a-z',
        label: 'Sort Mode',
        value: info.mode === 'none' ? 'No Sort' : MODE_NAMES[info.mode],
        isText: true
    });

    items.push({
        icon: 'fa-list',
        label: 'Input Lines',
        value: info.originalCount.toLocaleString()
    });

    items.push({
        icon: 'fa-check',
        label: 'Final Lines',
        value: info.finalCount.toLocaleString()
    });

    if (info.emptyRemoved > 0) {
        items.push({
            icon: 'fa-align-justify',
            label: 'Empty Removed',
            value: info.emptyRemoved.toLocaleString(),
            highlight: true
        });
    }

    if (info.dupesRemoved > 0) {
        items.push({
            icon: 'fa-clone',
            label: 'Duplicates Removed',
            value: info.dupesRemoved.toLocaleString(),
            highlight: true
        });
    }

    sortStatsPanel.style.display = 'block';

    sortStatsGrid.innerHTML = items.map(item => `
        <div class="sort-stat-item">
            <div class="sort-stat-label">
                <i class="fa-solid ${item.icon}"></i> ${item.label}
            </div>
            <div class="sort-stat-value ${item.highlight ? '' : ''}">
                ${item.value}
            </div>
        </div>
    `).join('');
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
        showToast('📋 Sorted text copied!');
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
    a.download = `sorted-${currentMode}-${timestamp}.txt`;
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
    updateStats();
    sortStatsPanel.style.display = 'none';
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
    inputEl.value = `banana
Apple
cherry
date
Elderberry
fig
grape
Apple
banana
   kiwi   
mango

orange
peach
item10
item2
item1`;
    processText();
    showToast('🧪 Sample loaded!');
}

// ============ TRY EXAMPLE ============
function tryExample(type) {
    const examples = {
        names: `John
Alice
Bob
Charlie
Diana
Eve
Frank
Grace`,
        numbers: `100
5
42
7
1000
23
1
99`,
        mixed: `apple
BANANA
Cherry
date
Elderberry
FIG
grape
kiwi`,
        withDupes: `apple
banana
apple
cherry
banana
date
apple
cherry`
    };

    inputEl.value = examples[type] || '';
    processText();
    showToast(`🧪 Example loaded: ${type}`);
}

// ============ SHARE ============
function shareTool() {
    const shareData = {
        title: 'Text Sorter - Tool Hub',
        text: 'Check out this free Text Sorter tool!',
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
        updateStats();
    }
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Process
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processText();
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
    // 1-8 → Switch modes
    if (!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== inputEl) {
        const modes = ['az', 'za', 'lengthAsc', 'lengthDesc', 'numeric', 'reverse', 'random', 'none'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= 8) {
            setMode(modes[num - 1]);
        }
    }
});

// ============ RESTORE DRAFT ============
const draft = localStorage.getItem('toolhub_sort_draft');
if (draft) {
    inputEl.value = draft;
    processText();
}

window.addEventListener('beforeunload', () => {
    if (inputEl.value.trim()) {
        localStorage.setItem('toolhub_sort_draft', inputEl.value);
    } else {
        localStorage.removeItem('toolhub_sort_draft');
    }
});

// ============ INITIALIZE ============
processText();
inputEl.focus();