/* ============================================================
   PASSWORD GENERATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ CHARACTER SETS ============
const CHARS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'
};

const SIMILAR_CHARS = 'il1Lo0O';
const AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;:.<>';

// ============ STATE ============
let currentPassword = '';
let isVisible = true;
let bulkPasswords = [];

// ============ DOM ELEMENTS ============
const passwordOutput = document.getElementById('password-output');
const visibilityBtn = document.getElementById('visibility-btn');
const lengthSlider = document.getElementById('length-slider');
const lengthValue = document.getElementById('length-value');
const strengthBars = document.getElementById('strength-bars');
const strengthText = document.getElementById('strength-text');
const crackTime = document.getElementById('crack-time');
const bulkList = document.getElementById('bulk-list');
const bulkCount = document.getElementById('bulk-count');
const downloadCsvBtn = document.getElementById('download-csv-btn');
const clearBulkBtn = document.getElementById('clear-bulk-btn');

// Options
const optUppercase = document.getElementById('opt-uppercase');
const optLowercase = document.getElementById('opt-lowercase');
const optNumbers = document.getElementById('opt-numbers');
const optSymbols = document.getElementById('opt-symbols');
const optExcludeSimilar = document.getElementById('opt-exclude-similar');
const optExcludeAmbiguous = document.getElementById('opt-exclude-ambiguous');

// ============ CRYPTOGRAPHICALLY SECURE RANDOM ============
function secureRandom(max) {
    if (window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(1);
        const maxValid = Math.floor(0xFFFFFFFF / max) * max;
        let value;
        do {
            window.crypto.getRandomValues(array);
            value = array[0];
        } while (value >= maxValid);
        return value % max;
    }
    // Fallback (less secure)
    return Math.floor(Math.random() * max);
}

// ============ GET SELECTED CHARACTERS ============
function getSelectedChars() {
    let chars = '';
    if (optUppercase.checked) chars += CHARS.uppercase;
    if (optLowercase.checked) chars += CHARS.lowercase;
    if (optNumbers.checked) chars += CHARS.numbers;
    if (optSymbols.checked) chars += CHARS.symbols;

    // Exclude similar
    if (optExcludeSimilar.checked) {
        chars = chars.split('').filter(c => !SIMILAR_CHARS.includes(c)).join('');
    }

    // Exclude ambiguous
    if (optExcludeAmbiguous.checked) {
        chars = chars.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join('');
    }

    return chars;
}

// ============ GENERATE PASSWORD ============
function generatePassword() {
    const length = parseInt(lengthSlider.value);
    const chars = getSelectedChars();

    if (chars.length === 0) {
        showToast('❌ Please select at least one character type!', 'error');
        return;
    }

    if (length < 4) {
        showToast('❌ Password length must be at least 4!', 'error');
        return;
    }

    let password = '';
    const charArray = chars.split('');
    
    // Ensure at least one char from each selected set
    const guaranteed = [];
    if (optUppercase.checked) guaranteed.push(getRandomFromSet(CHARS.uppercase, optExcludeSimilar, optExcludeAmbiguous));
    if (optLowercase.checked) guaranteed.push(getRandomFromSet(CHARS.lowercase, optExcludeSimilar, optExcludeAmbiguous));
    if (optNumbers.checked) guaranteed.push(getRandomFromSet(CHARS.numbers, optExcludeSimilar, optExcludeAmbiguous));
    if (optSymbols.checked) guaranteed.push(getRandomFromSet(CHARS.symbols, optExcludeSimilar, optExcludeAmbiguous));

    // Build password
    const guaranteedCount = Math.min(guaranteed.length, length);
    const remainingLength = length - guaranteedCount;

    // Add random chars
    for (let i = 0; i < remainingLength; i++) {
        password += charArray[secureRandom(charArray.length)];
    }

    // Add guaranteed chars
    password += guaranteed.slice(0, guaranteedCount).join('');

    // Shuffle password
    password = shuffleString(password);

    currentPassword = password;
    passwordOutput.value = password;
    
    // Ensure visibility
    if (!isVisible) {
        isVisible = true;
        passwordOutput.type = 'text';
        visibilityBtn.querySelector('i').className = 'fa-solid fa-eye';
    }

    updateStrength(password);
}

function getRandomFromSet(set, excludeSimilar, excludeAmbiguous) {
    let filtered = set;
    if (excludeSimilar) filtered = filtered.split('').filter(c => !SIMILAR_CHARS.includes(c)).join('');
    if (excludeAmbiguous) filtered = filtered.split('').filter(c => !AMBIGUOUS_CHARS.includes(c)).join('');
    if (filtered.length === 0) return '';
    return filtered[secureRandom(filtered.length)];
}

function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

// ============ STRENGTH CALCULATION ============
function updateStrength(password) {
    if (!password || password === 'Click Generate to start') {
        strengthBars.className = 'strength-bars';
        strengthText.innerText = 'Strength: —';
        strengthText.style.color = '';
        crackTime.innerHTML = '<i class="fa-solid fa-clock"></i> —';
        return;
    }

    const length = password.length;
    let charsets = 0;
    if (/[a-z]/.test(password)) charsets += 26;
    if (/[A-Z]/.test(password)) charsets += 26;
    if (/[0-9]/.test(password)) charsets += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsets += 33;

    // Entropy calculation
    const entropy = length * Math.log2(charsets || 1);

    let strength, className, color;

    if (entropy < 28) {
        strength = 'Very Weak';
        className = 'weak';
        color = '#ef4444';
    } else if (entropy < 36) {
        strength = 'Weak';
        className = 'weak';
        color = '#ef4444';
    } else if (entropy < 60) {
        strength = 'Fair';
        className = 'fair';
        color = '#f59e0b';
    } else if (entropy < 80) {
        strength = 'Good';
        className = 'good';
        color = '#eab308';
    } else if (entropy < 100) {
        strength = 'Strong';
        className = 'strong';
        color = '#10b981';
    } else {
        strength = 'Very Strong';
        className = 'very-strong';
        color = '#10b981';
    }

    strengthBars.className = `strength-bars ${className}`;
    strengthText.innerText = `Strength: ${strength}`;
    strengthText.style.color = color;
    
    // Crack time estimation (10 billion guesses/sec)
    const combinations = Math.pow(charsets || 1, length);
    const guessesPerSecond = 1e10;
    const seconds = combinations / guessesPerSecond / 2; // average half

    crackTime.innerHTML = `<i class="fa-solid fa-clock"></i> Crack time: ${formatCrackTime(seconds)}`;
}

function formatCrackTime(seconds) {
    if (seconds < 1) return 'Instantly';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
    if (seconds < 31536000 * 1000) return `${Math.round(seconds / 31536000)} years`;
    if (seconds < 31536000 * 1e6) return `${Math.round(seconds / 31536000 / 1000)}K years`;
    if (seconds < 31536000 * 1e9) return `${Math.round(seconds / 31536000 / 1e6)}M years`;
    return '∞ (Billions of years)';
}

// ============ VISIBILITY TOGGLE ============
function toggleVisibility() {
    if (passwordOutput.value === 'Click Generate to start') return;
    isVisible = !isVisible;
    passwordOutput.type = isVisible ? 'text' : 'password';
    const icon = visibilityBtn.querySelector('i');
    icon.className = isVisible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
}

// ============ COPY PASSWORD ============
function copyPassword() {
    if (!currentPassword) {
        showToast('❌ Please generate a password first!', 'error');
        return;
    }
    navigator.clipboard.writeText(currentPassword).then(() => {
        showToast('📋 Password copied to clipboard!');
    }).catch(() => {
        // Fallback
        passwordOutput.select();
        document.execCommand('copy');
        showToast('📋 Password copied!');
    });
}

// ============ REFRESH PASSWORD ============
function refreshPassword() {
    generatePassword();
    showToast('🔄 New password generated!');
}

// ============ PRESETS ============
function applyPreset(preset) {
    // Update active state
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-preset="${preset}"]`).classList.add('active');

    switch (preset) {
        case 'pin':
            lengthSlider.value = 4;
            optUppercase.checked = false;
            optLowercase.checked = false;
            optNumbers.checked = true;
            optSymbols.checked = false;
            optExcludeSimilar.checked = false;
            optExcludeAmbiguous.checked = false;
            break;
        case 'simple':
            lengthSlider.value = 8;
            optUppercase.checked = true;
            optLowercase.checked = true;
            optNumbers.checked = true;
            optSymbols.checked = false;
            optExcludeSimilar.checked = true;
            optExcludeAmbiguous.checked = false;
            break;
        case 'strong':
            lengthSlider.value = 16;
            optUppercase.checked = true;
            optLowercase.checked = true;
            optNumbers.checked = true;
            optSymbols.checked = true;
            optExcludeSimilar.checked = false;
            optExcludeAmbiguous.checked = false;
            break;
        case 'paranoid':
            lengthSlider.value = 32;
            optUppercase.checked = true;
            optLowercase.checked = true;
            optNumbers.checked = true;
            optSymbols.checked = true;
            optExcludeSimilar.checked = true;
            optExcludeAmbiguous.checked = false;
            break;
    }

    lengthValue.innerText = lengthSlider.value;
    generatePassword();
    showToast(`✨ ${preset.charAt(0).toUpperCase() + preset.slice(1)} preset applied!`);
}

// ============ BULK GENERATION ============
function generateBulk() {
    const count = parseInt(bulkCount.value);
    if (isNaN(count) || count < 1 || count > 100) {
        showToast('❌ Count must be between 1 and 100!', 'error');
        return;
    }

    bulkPasswords = [];
    const chars = getSelectedChars();
    if (chars.length === 0) {
        showToast('❌ Please select at least one character type!', 'error');
        return;
    }

    for (let i = 0; i < count; i++) {
        bulkPasswords.push(generateSinglePassword());
    }

    renderBulkList();
    downloadCsvBtn.disabled = false;
    clearBulkBtn.disabled = false;
    showToast(`✅ ${count} passwords generated!`);
}

function generateSinglePassword() {
    const length = parseInt(lengthSlider.value);
    const chars = getSelectedChars();
    const charArray = chars.split('');
    
    // Guaranteed chars
    const guaranteed = [];
    if (optUppercase.checked) guaranteed.push(getRandomFromSet(CHARS.uppercase, optExcludeSimilar.checked, optExcludeAmbiguous.checked));
    if (optLowercase.checked) guaranteed.push(getRandomFromSet(CHARS.lowercase, optExcludeSimilar.checked, optExcludeAmbiguous.checked));
    if (optNumbers.checked) guaranteed.push(getRandomFromSet(CHARS.numbers, optExcludeSimilar.checked, optExcludeAmbiguous.checked));
    if (optSymbols.checked) guaranteed.push(getRandomFromSet(CHARS.symbols, optExcludeSimilar.checked, optExcludeAmbiguous.checked));

    const guaranteedCount = Math.min(guaranteed.length, length);
    let password = '';

    for (let i = 0; i < length - guaranteedCount; i++) {
        password += charArray[secureRandom(charArray.length)];
    }
    password += guaranteed.slice(0, guaranteedCount).join('');
    return shuffleString(password);
}

function renderBulkList() {
    if (bulkPasswords.length === 0) {
        bulkList.innerHTML = `
            <p class="empty-bulk">
                <i class="fa-solid fa-inbox"></i>
                No passwords generated yet. Click "Generate Bulk" to start.
            </p>
        `;
        return;
    }

    bulkList.innerHTML = bulkPasswords.map((pass, idx) => {
        const strength = getStrengthClass(pass);
        return `
            <div class="bulk-item">
                <div class="bulk-index">${idx + 1}</div>
                <div class="bulk-pass">${escapeHtml(pass)}</div>
                <div class="bulk-strength ${strength}"></div>
                <button class="bulk-copy" onclick="copyBulkItem(${idx})" title="Copy">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
        `;
    }).join('');
}

function getStrengthClass(password) {
    const length = password.length;
    let charsets = 0;
    if (/[a-z]/.test(password)) charsets += 26;
    if (/[A-Z]/.test(password)) charsets += 26;
    if (/[0-9]/.test(password)) charsets += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsets += 33;
    const entropy = length * Math.log2(charsets || 1);

    if (entropy < 36) return 'weak';
    if (entropy < 60) return 'fair';
    if (entropy < 80) return 'good';
    return 'strong';
}

function copyBulkItem(idx) {
    const pass = bulkPasswords[idx];
    if (!pass) return;
    navigator.clipboard.writeText(pass).then(() => {
        showToast(`📋 Password #${idx + 1} copied!`);
    }).catch(() => {
        showToast('❌ Copy failed!', 'error');
    });
}

function downloadBulkCSV() {
    if (bulkPasswords.length === 0) {
        showToast('❌ No passwords to download!', 'error');
        return;
    }

    let csv = 'S.No,Password,Strength,Length\n';
    bulkPasswords.forEach((pass, idx) => {
        const strength = getStrengthClass(pass);
        csv += `${idx + 1},"${pass.replace(/"/g, '""')}",${strength},${pass.length}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `passwords-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 CSV downloaded!');
}

function clearBulk() {
    if (bulkPasswords.length === 0) return;
    if (!confirm('Kya aap saare bulk passwords clear karna chahte hain?')) return;
    bulkPasswords = [];
    renderBulkList();
    downloadCsvBtn.disabled = true;
    clearBulkBtn.disabled = true;
    showToast('🧹 Bulk list cleared!');
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

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Password Generator - Tool Hub',
        text: 'Check out this secure Password Generator tool!',
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

applyTheme(localStorage.getItem('toolhub_theme') || 'light');

// ============ EVENT LISTENERS ============
lengthSlider.addEventListener('input', () => {
    lengthValue.innerText = lengthSlider.value;
});

// Regenerate on option change
[optUppercase, optLowercase, optNumbers, optSymbols, optExcludeSimilar, optExcludeAmbiguous].forEach(opt => {
    opt.addEventListener('change', () => {
        if (currentPassword) generatePassword();
    });
});

// Keyboard shortcut: Space to regenerate
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        refreshPassword();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.shiftKey) {
        e.preventDefault();
        copyPassword();
    }
});

// ============ INITIALIZE ============
generatePassword();