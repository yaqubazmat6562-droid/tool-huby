/* ============================================================
   CASE CONVERTER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ DOM ELEMENTS ============
const inputEl = document.getElementById('case-input');
const outputEl = document.getElementById('case-output');
const inputWordsEl = document.getElementById('input-words');
const inputCharsEl = document.getElementById('input-chars');
const inputLinesEl = document.getElementById('input-lines');
const outputWordsEl = document.getElementById('output-words');
const outputCharsEl = document.getElementById('output-chars');
const outputLinesEl = document.getElementById('output-lines');
const activeCaseBadge = document.getElementById('active-case-badge');

// ============ STATE ============
let currentCase = null;

// ============ CASE CONVERSION FUNCTIONS ============
const caseFunctions = {
    uppercase: (text) => text.toUpperCase(),
    lowercase: (text) => text.toLowerCase(),
    title: (text) => text.replace(/\w\S*/g, (word) => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ),
    sentence: (text) => {
        return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
    },
    capitalize: (text) => {
        return text.replace(/\b\w/g, (char) => char.toUpperCase());
    },
    alternating: (text) => {
        let result = '';
        let upper = true;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (/[a-zA-Z]/.test(char)) {
                result += upper ? char.toUpperCase() : char.toLowerCase();
                upper = !upper;
            } else {
                result += char;
            }
        }
        return result;
    },
    inverse: (text) => {
        return text.split('').map(char => {
            if (char === char.toUpperCase()) return char.toLowerCase();
            if (char === char.toLowerCase()) return char.toUpperCase();
            return char;
        }).join('');
    },
    camel: (text) => {
        return text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^[A-Z]/, (m) => m.toLowerCase());
    },
    pascal: (text) => {
        return text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, '')
            .replace(/^[a-z]/, (m) => m.toUpperCase());
    },
    snake: (text) => {
        return text
            .trim()
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s\-]+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .replace(/_+/g, '_')
            .toLowerCase();
    },
    kebab: (text) => {
        return text
            .trim()
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-zA-Z0-9\-]/g, '')
            .replace(/-+/g, '-')
            .toLowerCase();
    },
    constant: (text) => {
        return text
            .trim()
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s\-]+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .replace(/_+/g, '_')
            .toUpperCase();
    }
};

// ============ CASE DISPLAY NAMES ============
const caseNames = {
    uppercase: 'UPPERCASE',
    lowercase: 'lowercase',
    title: 'Title Case',
    sentence: 'Sentence case',
    capitalize: 'Capitalize',
    alternating: 'aLtErNaTiNg',
    inverse: 'iNVERSE',
    camel: 'camelCase',
    pascal: 'PascalCase',
    snake: 'snake_case',
    kebab: 'kebab-case',
    constant: 'CONSTANT_CASE'
};

// ============ MAIN CONVERT FUNCTION ============
function convertCase(caseType) {
    const text = inputEl.value;
    
    if (!text.trim()) {
        showToast('❌ Please enter some text first!', 'error');
        inputEl.focus();
        return;
    }

    const converter = caseFunctions[caseType];
    if (!converter) return;

    const converted = converter(text);
    outputEl.value = converted;
    currentCase = caseType;

    // Update badge
    activeCaseBadge.innerText = caseNames[caseType] || caseType;

    // Update stats
    updateStats();

    // Animation
    outputEl.style.transition = 'none';
    outputEl.style.background = 'rgba(37, 99, 235, 0.12)';
    setTimeout(() => {
        outputEl.style.transition = 'background 0.6s';
        outputEl.style.background = '';
    }, 50);

    showToast(`✅ Converted to ${caseNames[caseType]}`);
}

// ============ STATS ============
function updateStats() {
    updatePanelStats(inputEl.value, inputWordsEl, inputCharsEl, inputLinesEl);
    updatePanelStats(outputEl.value, outputWordsEl, outputCharsEl, outputLinesEl);
}

function updatePanelStats(text, wordsEl, charsEl, linesEl) {
    const trimmed = text.trim();
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    const chars = text.length;
    const lines = text === '' ? 0 : text.split('\n').length;

    wordsEl.innerText = words.toLocaleString();
    charsEl.innerText = chars.toLocaleString();
    linesEl.innerText = lines.toLocaleString();
}

// ============ COPY OUTPUT ============
function copyOutput() {
    const text = outputEl.value;
    if (!text) {
        showToast('❌ Nothing to copy! Convert text first.', 'error');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Output copied to clipboard!');
    }).catch(() => {
        // Fallback
        outputEl.select();
        document.execCommand('copy');
        showToast('📋 Output copied!');
    });
}

// ============ DOWNLOAD OUTPUT ============
function downloadOutput() {
    const text = outputEl.value;
    if (!text) {
        showToast('❌ Nothing to download! Convert text first.', 'error');
        return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const caseName = currentCase || 'converted';
    a.href = url;
    a.download = `${caseName}-${timestamp}.txt`;
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
        updateStats();
        showToast('📋 Pasted from clipboard!');
    }).catch(() => {
        showToast('❌ Paste permission denied!', 'error');
    });
}

// ============ CLEAR INPUT ============
function clearInput() {
    if (!inputEl.value) {
        showToast('❌ Input already empty!', 'error');
        return;
    }
    inputEl.value = '';
    updateStats();
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
    currentCase = null;
    activeCaseBadge.innerText = '—';
    updateStats();
    inputEl.focus();
    showToast('🧹 Cleared successfully!');
}

// ============ USE AS INPUT ============
function useAsInput() {
    const text = outputEl.value;
    if (!text) {
        showToast('❌ Output is empty!', 'error');
        return;
    }
    inputEl.value = text;
    outputEl.value = '';
    currentCase = null;
    activeCaseBadge.innerText = '—';
    updateStats();
    showToast('⬆️ Output moved to input!');
}

// ============ SWAP ============
function swapText() {
    const inputText = inputEl.value;
    const outputText = outputEl.value;

    if (!inputText && !outputText) {
        showToast('❌ Both boxes are empty!', 'error');
        return;
    }

    inputEl.value = outputText;
    outputEl.value = inputText;
    updateStats();
    showToast('🔄 Text swapped!');
}

// ============ LOAD SAMPLE ============
function loadSample() {
    inputEl.value = 'the quick brown fox jumps over the lazy dog. This is a sample text for testing the case converter tool. Try different cases now!';
    updateStats();
    showToast('🧪 Sample text loaded!');
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Case Converter - Tool Hub',
        text: 'Check out this free Case Converter tool!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Link copied!');
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
inputEl.addEventListener('input', () => {
    updateStats();
    // Auto re-convert if a case was already applied
    if (currentCase && inputEl.value.trim()) {
        const converter = caseFunctions[currentCase];
        if (converter) {
            outputEl.value = converter(inputEl.value);
            updateStats();
        }
    }
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + U → Uppercase
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        convertCase('uppercase');
    }
    // Ctrl/Cmd + Shift + L → Lowercase
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        convertCase('lowercase');
    }
    // Ctrl/Cmd + Shift + T → Title Case
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        convertCase('title');
    }
    // Ctrl/Cmd + Shift + C → Copy (overrides browser devtools but only when input has content)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        if (outputEl.value) {
            e.preventDefault();
            copyOutput();
        }
    }
});

// ============ RESTORE DRAFT ============
const draft = localStorage.getItem('toolhub_case_draft');
if (draft) {
    inputEl.value = draft;
    updateStats();
}

// Save draft on unload
window.addEventListener('beforeunload', () => {
    if (inputEl.value.trim()) {
        localStorage.setItem('toolhub_case_draft', inputEl.value);
    } else {
        localStorage.removeItem('toolhub_case_draft');
    }
});

// ============ INITIALIZE ============
updateStats();
inputEl.focus();