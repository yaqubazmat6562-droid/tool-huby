/* ============================================================
   TEXT REVERSER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ DOM ELEMENTS ============
const inputEl = document.getElementById('rev-input');
const outputEl = document.getElementById('rev-output');
const modeBadge = document.getElementById('mode-badge');

// Stats
const statChars = document.getElementById('stat-chars');
const statWords = document.getElementById('stat-words');
const statLines = document.getElementById('stat-lines');
const statMode = document.getElementById('stat-mode');

// Panel stats
const inputChars = document.getElementById('input-chars');
const inputWords = document.getElementById('input-words');
const inputLines = document.getElementById('input-lines');
const outputChars = document.getElementById('output-chars');
const outputWords = document.getElementById('output-words');
const outputLines = document.getElementById('output-lines');

// Options
const optPreserveCase = document.getElementById('opt-preserve-case');
const optKeepPunct = document.getElementById('opt-keep-punct');
const optTrim = document.getElementById('opt-trim');
const optAutoProcess = document.getElementById('opt-auto-process');

// ============ STATE ============
let currentMode = 'chars';

// ============ MODE NAMES ============
const MODE_NAMES = {
    chars: 'Characters',
    words: 'Words Order',
    lines: 'Lines Order',
    eachword: 'Each Word',
    sentences: 'Sentences',
    mirror: 'Mirror'
};

const MODE_BADGES = {
    chars: 'CHARS',
    words: 'WORDS',
    lines: 'LINES',
    eachword: 'EACH WORD',
    sentences: 'SENTENCES',
    mirror: 'MIRROR'
};

// ============ SET MODE ============
function setMode(mode) {
    currentMode = mode;

    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update badge
    modeBadge.innerText = MODE_BADGES[mode] || mode.toUpperCase();

    // Process text
    processText();
    showToast(`🔄 Mode: ${MODE_NAMES[mode]}`);
}

// ============ PROCESS TEXT ============
function processText() {
    const original = inputEl.value;

    if (!original) {
        outputEl.value = '';
        updateStats();
        return;
    }

    let result = '';

    switch (currentMode) {
        case 'chars':
            result = reverseChars(original);
            break;
        case 'words':
            result = reverseWords(original);
            break;
        case 'lines':
            result = reverseLines(original);
            break;
        case 'eachword':
            result = reverseEachWord(original);
            break;
        case 'sentences':
            result = reverseSentences(original);
            break;
        case 'mirror':
            result = mirrorText(original);
            break;
    }

    // Apply trim option
    if (optTrim.checked) {
        result = result.trim();
    }

    outputEl.value = result;
    updateStats();
}

// ============ REVERSE CHARACTERS ============
function reverseChars(text) {
    if (optKeepPunct.checked) {
        // Keep punctuation in place, reverse only letters/digits
        const chars = text.split('');
        const positions = [];
        const values = [];

        chars.forEach((char, i) => {
            if (/[a-zA-Z0-9]/.test(char)) {
                positions.push(i);
                values.push(char);
            }
        });

        values.reverse();
        positions.forEach((pos, i) => {
            chars[pos] = values[i];
        });

        let result = chars.join('');
        if (optPreserveCase.checked) {
            result = preserveCase(text, result);
        }
        return result;
    } else {
        let result = text.split('').reverse().join('');
        if (optPreserveCase.checked) {
            result = preserveCase(text, result);
        }
        return result;
    }
}

// ============ REVERSE WORDS ORDER ============
function reverseWords(text) {
    // Split by line first to preserve line structure
    return text.split('\n').map(line => {
        return line.split(/(\s+)/).reverse().join('');
    }).join('\n');
}

// ============ REVERSE LINES ============
function reverseLines(text) {
    return text.split('\n').reverse().join('\n');
}

// ============ REVERSE EACH WORD ============
function reverseEachWord(text) {
    return text.split('\n').map(line => {
        return line.replace(/\S+/g, word => {
            return word.split('').reverse().join('');
        });
    }).join('\n');
}

// ============ REVERSE SENTENCES ============
function reverseSentences(text) {
    // Split by sentence-ending punctuation while preserving them
    const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
    return sentences.reverse().join('').trim();
}

// ============ MIRROR TEXT ============
function mirrorText(text) {
    return text + text.split('').reverse().join('');
}

// ============ PRESERVE CASE PATTERN ============
function preserveCase(original, reversed) {
    let result = '';
    const minLen = Math.min(original.length, reversed.length);

    for (let i = 0; i < minLen; i++) {
        const origChar = original[i];
        const revChar = reversed[i];

        if (/[a-zA-Z]/.test(origChar)) {
            if (origChar === origChar.toUpperCase()) {
                result += revChar.toUpperCase();
            } else {
                result += revChar.toLowerCase();
            }
        } else {
            result += revChar;
        }
    }

    if (reversed.length > minLen) {
        result += reversed.slice(minLen);
    }

    return result;
}

// ============ UPDATE STATS ============
function updateStats() {
    const inputText = inputEl.value;
    const outputText = outputEl.value;

    // Input stats
    const inChars = inputText.length;
    const inWords = inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length;
    const inLines = inputText === '' ? 0 : inputText.split('\n').length;

    inputChars.innerText = inChars.toLocaleString();
    inputWords.innerText = inWords.toLocaleString();
    inputLines.innerText = inLines.toLocaleString();

    // Output stats
    const outChars = outputText.length;
    const outWords = outputText.trim() === '' ? 0 : outputText.trim().split(/\s+/).length;
    const outLines = outputText === '' ? 0 : outputText.split('\n').length;

    outputChars.innerText = outChars.toLocaleString();
    outputWords.innerText = outWords.toLocaleString();
    outputLines.innerText = outLines.toLocaleString();

    // Top stats (show output-based)
    statChars.innerText = outChars.toLocaleString();
    statWords.innerText = outWords.toLocaleString();
    statLines.innerText = outLines.toLocaleString();
    statMode.innerText = MODE_NAMES[currentMode].split(' ')[0];
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
    if (!text) return showToast('❌ Nothing to copy!', 'error');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Reversed text copied!');
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
    a.download = `reversed-${currentMode}-${timestamp}.txt`;
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
    inputEl.value = `The quick brown fox jumps over the lazy dog!

This is a sample text for testing the Text Reverser tool.

Try different modes to see amazing results. 🎉`;
    processText();
    showToast('🧪 Sample text loaded!');
}

// ============ TRY EXAMPLE ============
function tryExample(type) {
    const examples = {
        simple: 'Hello World',
        sentence: 'The quick brown fox jumps over the lazy dog.',
        multiline: 'First line here\nSecond line here\nThird line here',
        palindrome: 'A man, a plan, a canal, panama!'
    };

    inputEl.value = examples[type] || '';
    processText();
    showToast(`🧪 Example loaded: ${type}`);
}

// ============ SHARE ============
function shareTool() {
    const shareData = {
        title: 'Text Reverser - Tool Hub',
        text: 'Check out this free Text Reverser tool!',
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
    // 1-6 → Switch modes
    if (!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement !== inputEl) {
        const modes = ['chars', 'words', 'lines', 'eachword', 'sentences', 'mirror'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
            setMode(modes[num - 1]);
        }
    }
});

// ============ RESTORE DRAFT ============
const draft = localStorage.getItem('toolhub_rev_draft');
if (draft) {
    inputEl.value = draft;
    processText();
}

window.addEventListener('beforeunload', () => {
    if (inputEl.value.trim()) {
        localStorage.setItem('toolhub_rev_draft', inputEl.value);
    } else {
        localStorage.removeItem('toolhub_rev_draft');
    }
});

// ============ INITIALIZE ============
processText();
inputEl.focus();