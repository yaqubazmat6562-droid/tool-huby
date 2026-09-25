/* ============================================================
   WORD COUNTER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ DOM ELEMENTS ============
const textarea = document.getElementById('word-counter-input');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const charNoSpaceEl = document.getElementById('char-no-space');
const sentenceCountEl = document.getElementById('sentence-count');
const paraCountEl = document.getElementById('para-count');
const readingTimeEl = document.getElementById('reading-time');
const avgWordLenEl = document.getElementById('avg-word-len');
const longestWordEl = document.getElementById('longest-word');
const uniqueWordsEl = document.getElementById('unique-words');
const speakingTimeEl = document.getElementById('speaking-time');

// ============ MAIN COUNT FUNCTION ============
function updateWordCount() {
    const text = textarea.value;

    // ---- Words ----
    const trimmed = text.trim();
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    wordCountEl.innerText = words.toLocaleString();

    // ---- Characters (with spaces) ----
    charCountEl.innerText = text.length.toLocaleString();

    // ---- Characters (without spaces) ----
    const noSpace = text.replace(/\s/g, '').length;
    charNoSpaceEl.innerText = noSpace.toLocaleString();

    // ---- Sentences ----
    const sentences = trimmed === ''
        ? 0
        : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    sentenceCountEl.innerText = sentences.toLocaleString();

    // ---- Paragraphs ----
    const paragraphs = trimmed === ''
        ? 0
        : text.split(/\n+/).filter(p => p.trim().length > 0).length;
    paraCountEl.innerText = paragraphs.toLocaleString();

    // ---- Reading Time (200 WPM) ----
    readingTimeEl.innerText = formatTime(words, 200);

    // ---- Speaking Time (130 WPM) ----
    speakingTimeEl.innerText = formatTime(words, 130);

    // ---- Average Word Length ----
    const avgLen = words === 0
        ? 0
        : (noSpace / words).toFixed(1);
    avgWordLenEl.innerText = avgLen;

    // ---- Longest Word ----
    if (words === 0) {
        longestWordEl.innerText = '-';
        longestWordEl.title = '';
    } else {
        const wordList = trimmed.split(/\s+/);
        const longest = wordList.reduce((a, b) => a.length >= b.length ? a : b, '');
        const clean = longest.replace(/[^a-zA-Z0-9]/g, '');
        longestWordEl.innerText = clean || '-';
        longestWordEl.title = clean;
    }

    // ---- Unique Words ----
    if (words === 0) {
        uniqueWordsEl.innerText = '0';
    } else {
        const wordList = trimmed.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);
        const unique = new Set(wordList).size;
        uniqueWordsEl.innerText = unique.toLocaleString();
    }
}

// ============ HELPER: Format Time ============
function formatTime(words, wpm) {
    if (words === 0) return '0m';
    const minutes = words / wpm;
    if (minutes < 1) return Math.ceil(minutes * 60) + 's';
    if (minutes < 60) return Math.ceil(minutes) + 'm';
    const hours = Math.floor(minutes / 60);
    const mins = Math.ceil(minutes % 60);
    return `${hours}h ${mins}m`;
}

// ============ COPY TEXT ============
function copyText() {
    const text = textarea.value;
    if (!text) return showToast('❌ Pehle kuch text likhein!', 'error');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('✅ Text copied to clipboard!');
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('✅ Text copied!');
        window.getSelection().removeAllRanges();
    } catch (err) {
        showToast('❌ Copy failed!', 'error');
    }
}

// ============ CLEAR TEXT ============
function clearText() {
    if (!textarea.value) return showToast('❌ Textarea already empty!', 'error');

    if (confirm('Kya aap waqai poora text clear karna chahte hain?')) {
        textarea.value = '';
        updateWordCount();
        textarea.focus();
        showToast('🧹 Text cleared successfully!');
    }
}

// ============ DOWNLOAD AS TXT ============
function downloadText() {
    const text = textarea.value;
    if (!text) return showToast('❌ Download ke liye text likhein!', 'error');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `word-counter-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 File downloaded successfully!');
}

// ============ PASTE FROM CLIPBOARD ============
function pasteText() {
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
            if (!text) return showToast('❌ Clipboard khali hai!', 'error');
            textarea.value += text;
            updateWordCount();
            showToast('📋 Text pasted!');
        }).catch(() => {
            showToast('❌ Paste permission denied!', 'error');
        });
    } else {
        showToast('❌ Clipboard API not supported!', 'error');
    }
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Word Counter - Tool Hub',
        text: 'Check out this free Word Counter tool!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Tool link copied to clipboard!');
        }).catch(() => {
            showToast('❌ Could not copy link!', 'error');
        });
    }
}

// ============ TOAST NOTIFICATION ============
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
    }, 3000);
}

// ============ DARK MODE TOGGLE ============
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

// Load saved theme
const savedTheme = localStorage.getItem('toolhub_theme') || 'light';
applyTheme(savedTheme);

// ============ LIVE UPDATE EVENT ============
textarea.addEventListener('input', updateWordCount);

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + C → Copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyText();
    }
    // Ctrl/Cmd + Shift + X → Clear
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        clearText();
    }
    // Ctrl/Cmd + Shift + S → Download
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        downloadText();
    }
});

// ============ INITIALIZE ============
updateWordCount();
textarea.focus();

// Save text on unload (optional - comfort feature)
window.addEventListener('beforeunload', () => {
    if (textarea.value.length > 0) {
        localStorage.setItem('toolhub_wordcounter_draft', textarea.value);
    }
});

// Restore draft on load
const draft = localStorage.getItem('toolhub_wordcounter_draft');
if (draft && draft.trim().length > 0) {
    textarea.value = draft;
    updateWordCount();
}