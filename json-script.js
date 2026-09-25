/* ============================================================
   JSON FORMATTER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentView = 'text'; // 'text' or 'tree'
let lastValidJSON = null;
let treeExpandedState = new Set();

// ============ DOM ELEMENTS ============
const inputEl = document.getElementById('json-input');
const outputEl = document.getElementById('json-output');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const sizeInfo = document.getElementById('size-info');
const linesInfo = document.getElementById('lines-info');
const errorBox = document.getElementById('error-box');
const errorMessage = document.getElementById('error-message');
const errorTitle = document.getElementById('error-title');
const viewModeBadge = document.getElementById('view-mode');
const indentSelect = document.getElementById('indent-size');

// ============ FORMAT JSON ============
function formatJSON() {
    const input = inputEl.value.trim();
    
    if (!input) {
        showToast('❌ Please enter some JSON!', 'error');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        lastValidJSON = parsed;

        const indent = getIndentValue();
        const formatted = JSON.stringify(parsed, null, indent);

        currentView = 'text';
        viewModeBadge.innerText = 'Text';
        renderTextOutput(formatted);
        hideError();
        setStatus('valid', '✓ Valid JSON — formatted successfully');
        updateStats(formatted);
        showToast('✅ JSON formatted successfully!');
    } catch (err) {
        showError(err, input);
    }
}

// ============ MINIFY JSON ============
function minifyJSON() {
    const input = inputEl.value.trim();
    
    if (!input) {
        showToast('❌ Please enter some JSON!', 'error');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        lastValidJSON = parsed;

        const minified = JSON.stringify(parsed);

        currentView = 'text';
        viewModeBadge.innerText = 'Minified';
        renderTextOutput(minified);
        hideError();
        setStatus('valid', '✓ Valid JSON — minified successfully');
        updateStats(minified);
        showToast('🗜️ JSON minified!');
    } catch (err) {
        showError(err, input);
    }
}

// ============ VALIDATE JSON ============
function validateJSON() {
    const input = inputEl.value.trim();
    
    if (!input) {
        showToast('❌ Please enter some JSON!', 'error');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        hideError();
        setStatus('valid', '✓ Valid JSON — no errors found');
        updateStats(input);
        
        // Show summary
        const type = Array.isArray(parsed) ? 'Array' : typeof parsed;
        const keys = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? Object.keys(parsed).length
            : Array.isArray(parsed) ? parsed.length : 0;
        
        showToast(`✅ Valid JSON! Type: ${type}${keys ? `, Items: ${keys}` : ''}`);
    } catch (err) {
        showError(err, input);
    }
}

// ============ TOGGLE TREE VIEW ============
function toggleTreeView() {
    const input = inputEl.value.trim();
    
    if (!input) {
        showToast('❌ Please enter some JSON!', 'error');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        lastValidJSON = parsed;

        if (currentView === 'tree') {
            // Switch to text view
            currentView = 'text';
            viewModeBadge.innerText = 'Text';
            const indent = getIndentValue();
            renderTextOutput(JSON.stringify(parsed, null, indent));
            showToast('📄 Switched to Text View');
        } else {
            // Switch to tree view
            currentView = 'tree';
            viewModeBadge.innerText = 'Tree';
            renderTreeOutput(parsed);
            showToast('🌳 Switched to Tree View');
        }
        hideError();
        setStatus('valid', '✓ Valid JSON');
    } catch (err) {
        showError(err, input);
    }
}

// ============ RENDER TEXT OUTPUT ============
function renderTextOutput(text) {
    const highlighted = syntaxHighlight(text);
    outputEl.innerHTML = `<pre>${highlighted}</pre>`;
}

// ============ SYNTAX HIGHLIGHT ============
function syntaxHighlight(json) {
    // Escape HTML first
    json = escapeHtml(json);
    
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                    // Remove trailing colon from match for wrapping
                    const key = match.slice(0, -1);
                    return `<span class="${cls}">${key}</span><span class="json-punctuation">:</span>`;
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
}

// ============ RENDER TREE OUTPUT ============
function renderTreeOutput(data) {
    treeExpandedState.clear();
    const treeHtml = buildTree(data, 'root', 0, true);
    outputEl.innerHTML = `<div class="tree-container">${treeHtml}</div>`;
    updateStats(JSON.stringify(data));
}

function buildTree(data, key, depth, expanded = true) {
    const nodeId = `node-${depth}-${key}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Primitive values
    if (data === null) {
        return `<div class="tree-node"><span class="tree-key">${escapeHtml(key)}</span><span class="json-punctuation">: </span><span class="tree-value-null">null</span></div>`;
    }
    
    if (typeof data !== 'object') {
        return `<div class="tree-node"><span class="tree-key">${escapeHtml(key)}</span><span class="json-punctuation">: </span>${formatPrimitive(data)}</div>`;
    }

    const isArray = Array.isArray(data);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';
    const entries = isArray 
        ? data.map((v, i) => [i, v])
        : Object.entries(data);

    const count = entries.length;

    if (count === 0) {
        return `<div class="tree-node"><span class="tree-key">${escapeHtml(key)}</span><span class="json-punctuation">: ${openBracket}${closeBracket}</span></div>`;
    }

    const expandedClass = expanded ? '' : 'collapsed';
    const hiddenClass = expanded ? '' : 'hidden';

    let childrenHtml = '';
    entries.forEach(([k, v]) => {
        childrenHtml += buildTree(v, String(k), depth + 1, depth < 1); // First level expanded
    });

    return `
        <div class="tree-node">
            <span class="tree-toggle ${expandedClass}" onclick="toggleTreeNode(this, '${nodeId}')">
                <i class="fa-solid fa-chevron-down"></i>
                <span class="tree-key">${escapeHtml(key)}</span>
                <span class="json-punctuation">: ${openBracket}</span>
                <span class="tree-count">${count} ${isArray ? 'items' : 'keys'}</span>
            </span>
            <div class="tree-children ${hiddenClass}" id="${nodeId}">
                ${childrenHtml}
            </div>
            <span class="json-punctuation">${closeBracket}</span>
        </div>
    `;
}

function formatPrimitive(value) {
    if (typeof value === 'string') {
        return `<span class="tree-value-string">"${escapeHtml(value)}"</span>`;
    }
    if (typeof value === 'number') {
        return `<span class="tree-value-number">${value}</span>`;
    }
    if (typeof value === 'boolean') {
        return `<span class="tree-value-boolean">${value}</span>`;
    }
    return String(value);
}

// ============ TREE NODE TOGGLE ============
function toggleTreeNode(el, nodeId) {
    const children = document.getElementById(nodeId);
    if (!children) return;
    
    children.classList.toggle('hidden');
    el.classList.toggle('collapsed');
}

// ============ EXPAND ALL NODES ============
function expandAllNodes() {
    if (currentView !== 'tree') {
        showToast('❌ Switch to Tree View first!', 'error');
        return;
    }
    document.querySelectorAll('.tree-children').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.tree-toggle').forEach(el => el.classList.remove('collapsed'));
    showToast('➕ All nodes expanded');
}

// ============ COLLAPSE ALL NODES ============
function collapseAllNodes() {
    if (currentView !== 'tree') {
        showToast('❌ Switch to Tree View first!', 'error');
        return;
    }
    document.querySelectorAll('.tree-children').forEach((el, i) => {
        // Don't collapse root
        if (i > 0) {
            el.classList.add('hidden');
        }
    });
    document.querySelectorAll('.tree-toggle').forEach((el, i) => {
        if (i > 0) {
            el.classList.add('collapsed');
        }
    });
    showToast('➖ All nodes collapsed');
}

// ============ ERROR HANDLING ============
function showError(err, input) {
    let msg = err.message;
    let lineInfo = '';

    // Try to extract position info
    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const before = input.substring(0, pos);
        const line = before.split('\n').length;
        const col = pos - before.lastIndexOf('\n');
        lineInfo = `<br><br><b>📍 Location:</b> Line ${line}, Column ${col}`;
        
        // Show context around error
        const start = Math.max(0, pos - 40);
        const end = Math.min(input.length, pos + 40);
        const contextBefore = input.substring(start, pos);
        const contextAfter = input.substring(pos, end);
        const context = escapeHtml(contextBefore) + 
                        '<span style="background:#fecaca;color:#7f1d1d;padding:0 3px;border-radius:3px;font-weight:700;">▶</span>' + 
                        escapeHtml(contextAfter);
        lineInfo += `<br><br><b>🔍 Context:</b><br><code style="background:rgba(0,0,0,0.05);padding:6px 10px;display:inline-block;border-radius:6px;font-size:0.85rem;">${context}</code>`;
    }

    errorTitle.innerText = 'JSON Parsing Error';
    errorMessage.innerHTML = escapeHtml(msg) + lineInfo;
    errorBox.style.display = 'block';
    setStatus('invalid', '✗ Invalid JSON — see error details below');
    showToast('❌ Invalid JSON!', 'error');
}

function hideError() {
    errorBox.style.display = 'none';
}

// ============ STATUS ============
function setStatus(type, message) {
    statusDot.className = 'status-dot';
    if (type === 'valid') statusDot.classList.add('valid');
    else if (type === 'invalid') statusDot.classList.add('invalid');
    statusText.innerText = message;
}

function updateStats(text) {
    // Size
    const bytes = new Blob([text]).size;
    sizeInfo.innerText = formatBytes(bytes);
    
    // Lines
    const lines = text.split('\n').length;
    linesInfo.innerText = `${lines} line${lines !== 1 ? 's' : ''}`;
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

// ============ GET INDENT VALUE ============
function getIndentValue() {
    const val = indentSelect.value;
    if (val === 'tab') return '\t';
    return parseInt(val);
}

// ============ SAMPLE JSON ============
function loadSample() {
    const sample = {
        name: "Tool Hub",
        version: "1.0.0",
        description: "All Your Online Tools in One Place",
        author: {
            name: "Developer",
            email: "dev@toolhub.com",
            website: "https://toolhub.com"
        },
        features: [
            "JSON Formatter",
            "Base64 Encoder",
            "UUID Generator",
            "Regex Tester"
        ],
        stats: {
            tools: 50,
            users: 12500,
            rating: 4.8,
            isActive: true,
            lastUpdate: null
        },
        tags: ["developer", "tools", "free", "online"],
        config: {
            theme: "dark",
            language: "en",
            notifications: {
                email: true,
                push: false,
                sms: null
            }
        }
    };

    inputEl.value = JSON.stringify(sample, null, 2);
    formatJSON();
    showToast('🧪 Sample JSON loaded!');
}

// ============ CLEAR ALL ============
function clearAll() {
    if (!inputEl.value && outputEl.querySelector('.empty-output')) {
        showToast('❌ Already empty!', 'error');
        return;
    }
    if (!confirm('Kya aap input aur output dono clear karna chahte hain?')) return;
    
    inputEl.value = '';
    outputEl.innerHTML = `
        <div class="empty-output">
            <i class="fa-solid fa-file-code"></i>
            <p>Formatted JSON will appear here...</p>
        </div>
    `;
    currentView = 'text';
    viewModeBadge.innerText = 'Text';
    lastValidJSON = null;
    hideError();
    setStatus('idle', 'Ready — paste your JSON and click Format');
    sizeInfo.innerText = '0 B';
    linesInfo.innerText = '0 lines';
    showToast('🧹 Cleared successfully!');
}

// ============ CLIPBOARD: PASTE ============
function pasteFromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        showToast('❌ Clipboard API not supported!', 'error');
        return;
    }
    navigator.clipboard.readText().then(text => {
        if (!text) return showToast('❌ Clipboard is empty!', 'error');
        inputEl.value = text;
        showToast('📋 Pasted from clipboard!');
    }).catch(() => {
        showToast('❌ Paste permission denied!', 'error');
    });
}

// ============ CLIPBOARD: COPY INPUT ============
function copyInput() {
    const text = inputEl.value;
    if (!text) return showToast('❌ Input is empty!', 'error');
    copyToClipboard(text, '📋 Input copied!');
}

// ============ CLIPBOARD: COPY OUTPUT ============
function copyOutput() {
    let text;
    if (currentView === 'tree') {
        if (!lastValidJSON) return showToast('❌ Nothing to copy!', 'error');
        text = JSON.stringify(lastValidJSON, null, getIndentValue());
    } else {
        const pre = outputEl.querySelector('pre');
        if (!pre) return showToast('❌ No output to copy!', 'error');
        text = pre.innerText;
    }
    copyToClipboard(text, '📋 Output copied!');
}

function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg);
        }).catch(() => {
            fallbackCopy(text, successMsg);
        });
    } else {
        fallbackCopy(text, successMsg);
    }
}

function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast(successMsg);
    } catch (e) {
        showToast('❌ Copy failed!', 'error');
    }
    document.body.removeChild(ta);
}

// ============ DOWNLOAD OUTPUT ============
function downloadOutput() {
    let text;
    if (currentView === 'tree') {
        if (!lastValidJSON) return showToast('❌ Nothing to download!', 'error');
        text = JSON.stringify(lastValidJSON, null, getIndentValue());
    } else {
        const pre = outputEl.querySelector('pre');
        if (!pre) return showToast('❌ No output to download!', 'error');
        text = pre.innerText;
    }

    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `formatted-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 File downloaded!');
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'JSON Formatter - Tool Hub',
        text: 'Check out this free JSON Formatter tool!',
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

// ============ HELPERS ============
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Format
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formatJSON();
    }
    // Ctrl/Cmd + Shift + M → Minify
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        minifyJSON();
    }
    // Ctrl/Cmd + Shift + V → Validate
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        validateJSON();
    }
    // Ctrl/Cmd + Shift + T → Tree View
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTreeView();
    }
});

// Tab key inside textarea inserts tab instead of losing focus
inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = inputEl.selectionStart;
        const end = inputEl.selectionEnd;
        inputEl.value = inputEl.value.substring(0, start) + '  ' + inputEl.value.substring(end);
        inputEl.selectionStart = inputEl.selectionEnd = start + 2;
    }
});

// ============ INITIALIZE ============
setStatus('idle', 'Ready — paste your JSON and click Format');