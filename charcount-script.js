/* ============================================================
   CHARACTER COUNTER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ DOM ELEMENTS ============
const textarea = document.getElementById('char-input');

// Main stats
const statChars = document.getElementById('stat-chars');
const statCharsNoSpace = document.getElementById('stat-chars-nospace');
const statWords = document.getElementById('stat-words');
const statSentences = document.getElementById('stat-sentences');
const statParagraphs = document.getElementById('stat-paragraphs');
const statLines = document.getElementById('stat-lines');

// Breakdown stats
const statLetters = document.getElementById('stat-letters');
const statDigits = document.getElementById('stat-digits');
const statSpaces = document.getElementById('stat-spaces');
const statPunct = document.getElementById('stat-punct');
const statSpecial = document.getElementById('stat-special');
const statVowels = document.getElementById('stat-vowels');
const statConsonants = document.getElementById('stat-consonants');
const statUpper = document.getElementById('stat-upper');
const statLower = document.getElementById('stat-lower');

// Extra stats
const statReading = document.getElementById('stat-reading');
const statSpeaking = document.getElementById('stat-speaking');
const statAvgWord = document.getElementById('stat-avg-word');
const statLongest = document.getElementById('stat-longest');
const statUnique = document.getElementById('stat-unique');
const statBytes = document.getElementById('stat-bytes');

// ============ PLATFORM LIMITS ============
const PLATFORM_LIMITS = {
    twitter: 280,
    sms: 160,
    meta: 60,
    description: 160,
    instagram: 2200,
    linkedin: 3000
};

// ============ MAIN COUNT FUNCTION ============
function updateCounts() {
    const text = textarea.value;
    const chars = text.length;

    // ============ MAIN STATS ============
    statChars.innerText = chars.toLocaleString();
    statCharsNoSpace.innerText = text.replace(/\s/g, '').length.toLocaleString();

    const trimmed = text.trim();
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    statWords.innerText = words.toLocaleString();

    const sentences = trimmed === '' 
        ? 0 
        : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    statSentences.innerText = sentences.toLocaleString();

    const paragraphs = trimmed === '' 
        ? 0 
        : text.split(/\n+/).filter(p => p.trim().length > 0).length;
    statParagraphs.innerText = paragraphs.toLocaleString();

    const lines = text === '' ? 0 : text.split('\n').length;
    statLines.innerText = lines.toLocaleString();

    // ============ BREAKDOWN ============
    const letters = (text.match(/[a-zA-Z]/g) || []).length;
    const digits = (text.match(/[0-9]/g) || []).length;
    const spaces = (text.match(/\s/g) || []).length;
    const punct = (text.match(/[.,!?;:'"()\[\]{}<>/\\|`~@#$%^&*\-_+=]/g) || []).length;
    const vowels = (text.match(/[aeiouAEIOU]/g) || []).length;
    const consonants = letters - vowels;
    const upper = (text.match(/[A-Z]/g) || []).length;
    const lower = (text.match(/[a-z]/g) || []).length;
    
    // Special = total - letters - digits - spaces - punctuation
    const special = chars - letters - digits - spaces - punct;

    statLetters.innerText = letters.toLocaleString();
    statDigits.innerText = digits.toLocaleString();
    statSpaces.innerText = spaces.toLocaleString();
    statPunct.innerText = punct.toLocaleString();
    statSpecial.innerText = Math.max(0, special).toLocaleString();
    statVowels.innerText = vowels.toLocaleString();
    statConsonants.innerText = consonants.toLocaleString();
    statUpper.innerText = upper.toLocaleString();
    statLower.innerText = lower.toLocaleString();

    // Update progress bars
    updateBar('bar-letters', letters, chars);
    updateBar('bar-digits', digits, chars);
    updateBar('bar-spaces', spaces, chars);
    updateBar('bar-punct', punct, chars);
    updateBar('bar-special', Math.max(0, special), chars);
    updateBar('bar-vowels', vowels, letters); // vowels out of letters
    updateBar('bar-consonants', consonants, letters);
    updateBar('bar-upper', upper, letters);
    updateBar('bar-lower', lower, letters);

    // ============ EXTRA STATS ============
    // Reading time (200 WPM)
    const readingTime = words / 200;
    statReading.innerText = formatTime(readingTime);

    // Speaking time (130 WPM)
    const speakingTime = words / 130;
    statSpeaking.innerText = formatTime(speakingTime);

    // Average word length
    const noSpaceLen = text.replace(/\s/g, '').length;
    const avgWord = words === 0 ? '0' : (noSpaceLen / words).toFixed(1);
    statAvgWord.innerText = avgWord;

    // Longest word
    if (words === 0) {
        statLongest.innerText = '—';
        statLongest.title = '';
    } else {
        const wordList = trimmed.split(/\s+/);
        const longest = wordList.reduce((a, b) => a.length >= b.length ? a : b, '');
        const clean = longest.replace(/[^a-zA-Z0-9]/g, '');
        const display = clean.length > 12 ? clean.slice(0, 12) + '…' : clean;
        statLongest.innerText = display || '—';
        statLongest.title = clean;
    }

    // Unique words
    if (words === 0) {
        statUnique.innerText = '0';
    } else {
        const wordList = trimmed.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);
        statUnique.innerText = new Set(wordList).size.toLocaleString();
    }

    // Byte size
    const bytes = new Blob([text]).size;
    statBytes.innerText = formatBytes(bytes);

    // ============ PLATFORM LIMITS ============
    updatePlatformLimits(chars);
}

// ============ UPDATE PROGRESS BAR ============
function updateBar(barId, value, total) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    const percent = total === 0 ? 0 : Math.min(100, (value / total) * 100);
    bar.style.width = percent + '%';
}

// ============ FORMAT TIME ============
function formatTime(minutes) {
    if (minutes === 0) return '0s';
    if (minutes < 1) return Math.ceil(minutes * 60) + 's';
    if (minutes < 60) return Math.ceil(minutes) + 'm';
    const hours = Math.floor(minutes / 60);
    const mins = Math.ceil(minutes % 60);
    return `${hours}h ${mins}m`;
}

// ============ FORMAT BYTES ============
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

// ============ UPDATE PLATFORM LIMITS ============
function updatePlatformLimits(chars) {
    for (const [platform, limit] of Object.entries(PLATFORM_LIMITS)) {
        const bar = document.getElementById('bar-' + platform);
        const count = document.getElementById('count-' + platform);
        const item = document.getElementById('limit-' + platform);

        if (!bar || !count || !item) continue;

        const percent = Math.min(100, (chars / limit) * 100);
        bar.style.width = percent + '%';
        count.innerText = chars.toLocaleString();

        // State classes
        item.classList.remove('warning', 'exceeded');
        if (chars > limit) {
            item.classList.add('exceeded');
        } else if (chars > limit * 0.8) {
            item.classList.add('warning');
        }
    }
}

// ============ COPY TEXT ============
function copyText() {
    const text = textarea.value;
    if (!text) return showToast('❌ Nothing to copy!', 'error');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Text copied to clipboard!');
    }).catch(() => {
        textarea.select();
        document.execCommand('copy');
        showToast('📋 Text copied!');
    });
}

// ============ COPY STATS ============
function copyStats() {
    if (!textarea.value.trim()) {
        showToast('❌ Please enter some text first!', 'error');
        return;
    }

    const stats = [
        '📊 CHARACTER COUNTER STATS',
        '═══════════════════════════════',
        '',
        '📌 MAIN STATS',
        `Characters: ${statChars.innerText}`,
        `Characters (no spaces): ${statCharsNoSpace.innerText}`,
        `Words: ${statWords.innerText}`,
        `Sentences: ${statSentences.innerText}`,
        `Paragraphs: ${statParagraphs.innerText}`,
        `Lines: ${statLines.innerText}`,
        '',
        '📈 BREAKDOWN',
        `Letters: ${statLetters.innerText}`,
        `Digits: ${statDigits.innerText}`,
        `Spaces: ${statSpaces.innerText}`,
        `Punctuation: ${statPunct.innerText}`,
        `Special chars: ${statSpecial.innerText}`,
        `Vowels: ${statVowels.innerText}`,
        `Consonants: ${statConsonants.innerText}`,
        `Uppercase: ${statUpper.innerText}`,
        `Lowercase: ${statLower.innerText}`,
        '',
        '⏱️ ADDITIONAL',
        `Reading Time: ${statReading.innerText}`,
        `Speaking Time: ${statSpeaking.innerText}`,
        `Avg Word Length: ${statAvgWord.innerText}`,
        `Unique Words: ${statUnique.innerText}`,
        `Byte Size: ${statBytes.innerText}`,
        '',
        `Generated by Tool Hub • ${new Date().toLocaleString()}`
    ].join('\n');

    navigator.clipboard.writeText(stats).then(() => {
        showToast('📊 Stats copied to clipboard!');
    }).catch(() => {
        showToast('❌ Copy failed!', 'error');
    });
}

// ============ DOWNLOAD TEXT ============
function downloadText() {
    const text = textarea.value;
    if (!text) return showToast('❌ Nothing to download!', 'error');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `text-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 File downloaded!');
}

// ============ PASTE TEXT ============
function pasteText() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        showToast('❌ Clipboard API not supported!', 'error');
        return;
    }
    navigator.clipboard.readText().then(text => {
        if (!text) return showToast('❌ Clipboard is empty!', 'error');
        textarea.value = text;
        updateCounts();
        showToast('📋 Pasted from clipboard!');
    }).catch(() => {
        showToast('❌ Paste permission denied!', 'error');
    });
}

// ============ CLEAR TEXT ============
function clearText() {
    if (!textarea.value) {
        showToast('❌ Text is already empty!', 'error');
        return;
    }
    if (!confirm('Kya aap poora text clear karna chahte hain?')) return;
    textarea.value = '';
    updateCounts();
    textarea.focus();
    showToast('🧹 Text cleared!');
}

// ============ LOAD SAMPLE ============
function loadSample() {
    textarea.value = `The quick brown fox jumps over the lazy dog! This is a sample text for testing the character counter tool. It contains 123 numbers and some special characters like @, #, $, %, and &.

This is the second paragraph. Try typing more text to see all the counts update in real-time. The tool tracks letters, digits, spaces, punctuation, vowels, consonants, and even uppercase/lowercase letters.

Happy counting! 🎉`;
    updateCounts();
    showToast('🧪 Sample text loaded!');
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Character Counter - Tool Hub',
        text: 'Check out this free Character Counter tool!',
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
textarea.addEventListener('input', updateCounts);

// Tab inserts 2 spaces
textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateCounts();
    }
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + C → Copy Stats
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyStats();
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

// ============ RESTORE DRAFT ============
const draft = localStorage.getItem('toolhub_charcount_draft');
if (draft) {
    textarea.value = draft;
}

// Save draft on unload
window.addEventListener('beforeunload', () => {
    if (textarea.value.trim()) {
        localStorage.setItem('toolhub_charcount_draft', textarea.value);
    } else {
        localStorage.removeItem('toolhub_charcount_draft');
    }
});

// ============ INITIALIZE ============
updateCounts();
textarea.focus();