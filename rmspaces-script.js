/* ============================================================
   REMOVE EXTRA SPACES - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ DOM ELEMENTS ============
const inputEl = document.getElementById('rmspaces-input');
const outputEl = document.getElementById('rmspaces-output');

// Stats
const statChars = document.getElementById('stat-chars');
const statWords = document.getElementById('stat-words');
const statLines = document.getElementById('stat-lines');
const statRemoved = document.getElementById('stat-removed');

// Panel stats
const inputChars = document.getElementById('input-chars');
const inputWords = document.getElementById('input-words');
const outputChars = document.getElementById('output-chars');
const outputWords = document.getElementById('output-words');

// Options
const optMultiSpaces = document.getElementById('opt-multi-spaces');
const optTrimLines = document.getElementById('opt-trim-lines');
const optBlankLines = document.getElementById('opt-blank-lines');
const optTabs = document.getElementById('opt-tabs');
const optMultiBreaks = document.getElementById('opt-multi-breaks');
const optNbsp = document.getElementById('opt-nbsp');
const optZeroWidth = document.getElementById('opt-zerowidth');
const optDuplicates = document.getElementById('opt-duplicates');
const optBreaksToSpace = document.getElementById('opt-breaks-to-space');
const optPunctSpaces = document.getElementById('opt-punct-spaces');
const tabSizeSelect = document.getElementById('tab-size');

// Diff panel
const diffPanel = document.getElementById('diff-panel');
const diffGrid = document.getElementById('diff-grid');

// ============ STATE ============
let lastOriginal = '';
let lastCleaned = '';

// ============ MAIN CLEAN FUNCTION ============
function applyOptions() {
    const original = inputEl.value;
    lastOriginal = original;

    if (!original) {
        outputEl.value = '';
        updateStats(original, '');
        diffPanel.style.display = 'none';
        return;
    }

    let cleaned = original;
    const diff = {};

    // Track initial stats
    const originalChars = original.length;

    // 1. Non-breaking spaces → regular spaces
    if (optNbsp.checked) {
        const count = (cleaned.match(/\u00A0/g) || []).length;
        if (count > 0) diff['Non-breaking spaces'] = count;
        cleaned = cleaned.replace(/\u00A0/g, ' ');
    }

    // 2. Zero-width characters
    if (optZeroWidth.checked) {
        const before = cleaned.length;
        cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');
        const count = before - cleaned.length;
        if (count > 0) diff['Zero-width chars'] = count;
    }

    // 3. Tabs → spaces
    if (optTabs.checked) {
        const tabSize = parseInt(tabSizeSelect.value) || 4;
        const count = (cleaned.match(/\t/g) || []).length;
        if (count > 0) diff['Tabs converted'] = count;
        cleaned = cleaned.replace(/\t/g, ' '.repeat(tabSize));
    }

    // 4. Line break → space
    if (optBreaksToSpace.checked) {
        const count = (cleaned.match(/\n/g) || []).length;
        if (count > 0) diff['Line breaks → spaces'] = count;
        cleaned = cleaned.replace(/\n+/g, ' ');
    }

    // 5. Trim each line
    if (optTrimLines.checked && !optBreaksToSpace.checked) {
        const before = cleaned;
        cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
        // Count leading/trailing spaces removed
        const originalTrimmed = before.split('\n').map(l => l.trim()).join('\n');
        const count = before.length - originalTrimmed.length;
        if (count > 0) diff['Trimmed spaces'] = count;
    }

    // 6. Multiple spaces → single
    if (optMultiSpaces.checked) {
        const matches = cleaned.match(/ {2,}/g) || [];
        const count = matches.reduce((sum, m) => sum + (m.length - 1), 0);
        if (count > 0) diff['Extra spaces removed'] = count;
        cleaned = cleaned.replace(/ {2,}/g, ' ');
    }

    // 7. Spaces before punctuation
    if (optPunctSpaces.checked) {
        const before = cleaned;
        cleaned = cleaned.replace(/ +([.,!?;:])/g, '$1');
        const count = before.length - cleaned.length;
        if (count > 0) diff['Spaces before punctuation'] = count;
    }

    // 8. Remove blank lines
    if (optBlankLines.checked && !optBreaksToSpace.checked) {
        const beforeLines = cleaned.split('\n').length;
        cleaned = cleaned.split('\n').filter(line => line.trim() !== '').join('\n');
        const afterLines = cleaned.split('\n').length;
        const count = beforeLines - afterLines;
        if (count > 0) diff['Blank lines removed'] = count;
    }

    // 9. Multiple line breaks → max 2
    if (optMultiBreaks.checked && !optBlankLines.checked && !optBreaksToSpace.checked) {
        const beforeLines = cleaned.split('\n').length;
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        const afterLines = cleaned.split('\n').length;
        const count = beforeLines - afterLines;
        if (count > 0) diff['Extra line breaks'] = count;
    }

    // 10. Duplicate lines
    if (optDuplicates.checked) {
        const lines = cleaned.split('\n');
        const seen = new Set();
        const result = [];
        let removed = 0;
        lines.forEach(line => {
            if (!seen.has(line)) {
                seen.add(line);
                result.push(line);
            } else {
                removed++;
            }
        });
        cleaned = result.join('\n');
        if (removed > 0) diff['Duplicate lines'] = removed;
    }

    // Final trim overall
    cleaned = cleaned.trim();

    lastCleaned = cleaned;
    outputEl.value = cleaned;
    updateStats(original, cleaned);
    renderDiff(diff, originalChars - cleaned.length);
}

// ============ UPDATE STATS ============
function updateStats(original, cleaned) {
    const origChars = original.length;
    const origWords = original.trim() === '' ? 0 : original.trim().split(/\s+/).length;
    const origLines = original === '' ? 0 : original.split('\n').length;

    const cleanChars = cleaned.length;
    const cleanWords = cleaned.trim() === '' ? 0 : cleaned.trim().split(/\s+/).length;

    // Top stats
    statChars.innerText = cleanChars.toLocaleString();
    statWords.innerText = cleanWords.toLocaleString();
    statLines.innerText = (cleaned === '' ? 0 : cleaned.split('\n').length).toLocaleString();

    const removed = Math.max(0, origChars - cleanChars);
    statRemoved.innerText = removed.toLocaleString();

    // Panel stats
    inputChars.innerText = origChars.toLocaleString();
    inputWords.innerText = origWords.toLocaleString();
    outputChars.innerText = cleanChars.toLocaleString();
    outputWords.innerText = cleanWords.toLocaleString();
}

// ============ RENDER DIFF SUMMARY ============
function renderDiff(diff, totalRemoved) {
    const entries = Object.entries(diff);

    if (entries.length === 0) {
        diffPanel.style.display = 'none';
        return;
    }

    diffPanel.style.display = 'block';

    let html = '';

    // Total chars removed
    if (totalRemoved > 0) {
        html += `
            <div class="diff-item">
                <div class="diff-label"><i class="fa-solid fa-scissors"></i> Total chars removed</div>
                <div class="diff-value">${totalRemoved.toLocaleString()}</div>
            </div>
        `;
    }

    // Individual diffs
    const icons = {
        'Non-breaking spaces': 'fa-ban',
        'Zero-width chars': 'fa-eye-slash',
        'Tabs converted': 'fa-arrow-right',
        'Line breaks → spaces': 'fa-arrow-right-arrow-left',
        'Trimmed spaces': 'fa-crop-simple',
        'Extra spaces removed': 'fa-arrows-left-right',
        'Spaces before punctuation': 'fa-spell-check',
        'Blank lines removed': 'fa-align-justify',
        'Extra line breaks': 'fa-paragraph',
        'Duplicate lines': 'fa-clone'
    };

    entries.forEach(([label, count]) => {
        const icon = icons[label] || 'fa-check';
        html += `
            <div class="diff-item">
                <div class="diff-label"><i class="fa-solid ${icon}"></i> ${label}</div>
                <div class="diff-value">${count.toLocaleString()}</div>
            </div>
        `;
    });

    diffGrid.innerHTML = html;
}

// ============ QUICK ACTIONS ============
function quickAction(type) {
    if (!inputEl.value.trim()) {
        showToast('❌ Please enter some text first!', 'error');
        inputEl.focus();
        return;
    }

    switch (type) {
        case 'all':
            // Enable all common options
            optMultiSpaces.checked = true;
            optTrimLines.checked = true;
            optBlankLines.checked = true;
            optMultiBreaks.checked = true;
            optNbsp.checked = true;
            optZeroWidth.checked = true;
            optPunctSpaces.checked = true;
            // Disable destructive ones
            optDuplicates.checked = false;
            optTabs.checked = false;
            optBreaksToSpace.checked = false;
            showToast('✨ Full cleanup applied!');
            break;

        case 'spaces':
            resetAllOptions();
            optMultiSpaces.checked = true;
            showToast('🎯 Extra spaces removed!');
            break;

        case 'trim':
            resetAllOptions();
            optTrimLines.checked = true;
            showToast('✂️ Lines trimmed!');
            break;

        case 'blank':
            resetAllOptions();
            optBlankLines.checked = true;
            optMultiBreaks.checked = true;
            showToast('📄 Blank lines removed!');
            break;
    }

    applyOptions();
}

// ============ RESET ALL OPTIONS ============
function resetAllOptions() {
    optMultiSpaces.checked = false;
    optTrimLines.checked = false;
    optBlankLines.checked = false;
    optTabs.checked = false;
    optMultiBreaks.checked = false;
    optNbsp.checked = false;
    optZeroWidth.checked = false;
    optDuplicates.checked = false;
    optBreaksToSpace.checked = false;
    optPunctSpaces.checked = false;
}

// ============ TOGGLE OPTIONS PANEL ============
function toggleOptions() {
    const body = document.getElementById('options-body');
    const btn = document.getElementById('options-toggle');
    body.classList.toggle('collapsed');
    btn.classList.toggle('rotated');
}

// ============ COPY OUTPUT ============
function copyOutput() {
    const text = outputEl.value;
    if (!text) return showToast('❌ Nothing to copy! Convert text first.', 'error');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Cleaned text copied!');
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
    a.download = `cleaned-text-${timestamp}.txt`;
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
        applyOptions();
        showToast('📋 Pasted from clipboard!');
    }).catch(() => {
        showToast('❌ Paste permission denied!', 'error');
    });
}

// ============ CLEAR INPUT ============
function clearInput() {
    if (!inputEl.value) return showToast('❌ Input already empty!', 'error');
    inputEl.value = '';
    applyOptions();
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
    updateStats('', '');
    diffPanel.style.display = 'none';
    inputEl.focus();
    showToast('🧹 Cleared successfully!');
}

// ============ USE AS INPUT ============
function useAsInput() {
    const text = outputEl.value;
    if (!text) return showToast('❌ Output is empty!', 'error');
    inputEl.value = text;
    applyOptions();
    showToast('⬆️ Output moved to input!');
}

// ============ LOAD SAMPLE ============
function loadSample() {
    inputEl.value = `   Hello    World!   This  is   a    test    text.    


    It has  multiple spaces,	tabs,  and   blank lines.


    	Also non-breaking&nbsp;spaces and some invisible\u200B chars.



    Duplicate line here
    Duplicate line here

       Trailing spaces at the end of this line.      
	
	Random  spacing    issues everywhere!   `;

    applyOptions();
    showToast('🧪 Sample loaded!');
}

// ============ SHARE ============
function shareTool() {
    const shareData = {
        title: 'Remove Extra Spaces - Tool Hub',
        text: 'Check out this free Remove Extra Spaces tool!',
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
inputEl.addEventListener('input', applyOptions);

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
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
    // Ctrl/Cmd + Enter → Full cleanup
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        quickAction('all');
    }
});

// ============ RESTORE DRAFT ============
const draft = localStorage.getItem('toolhub_rmspaces_draft');
if (draft) {
    inputEl.value = draft;
    applyOptions();
}

window.addEventListener('beforeunload', () => {
    if (inputEl.value.trim()) {
        localStorage.setItem('toolhub_rmspaces_draft', inputEl.value);
    } else {
        localStorage.removeItem('toolhub_rmspaces_draft');
    }
});

// ============ INITIALIZE ============
applyOptions();
inputEl.focus();