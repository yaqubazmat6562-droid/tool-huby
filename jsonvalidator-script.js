/* ============================================================
   JSON VALIDATOR - Advanced Logic
   Validate · Beautify · Minify · Auto-Fix · Tree View · Paths
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const jvCard         = document.getElementById("jvCard");
    const jsonInput      = document.getElementById("jsonInput");
    const lineNumbers    = document.getElementById("lineNumbers");
    const fileInput      = document.getElementById("fileInput");

    const validateBtn    = document.getElementById("validateBtn");
    const beautifyBtn    = document.getElementById("beautifyBtn");
    const minifyBtn      = document.getElementById("minifyBtn");
    const fixBtn         = document.getElementById("fixBtn");
    const sampleBtn      = document.getElementById("sampleBtn");
    const clearBtn       = document.getElementById("clearBtn");

    const pasteBtn       = document.getElementById("pasteBtn");
    const copyInputBtn   = document.getElementById("copyInputBtn");
    const uploadBtn      = document.getElementById("uploadBtn");
    const downloadBtn    = document.getElementById("downloadBtn");
    const fullscreenBtn  = document.getElementById("fullscreenBtn");

    const sortKeysChk    = document.getElementById("sortKeys");
    const autoValidateChk= document.getElementById("autoValidate");
    const indentBtns     = document.querySelectorAll(".indent-btn");

    const statusBadge    = document.getElementById("statusBadge");
    const statChars      = document.getElementById("statChars");
    const statLines      = document.getElementById("statLines");
    const statSize       = document.getElementById("statSize");

    const jvResult       = document.getElementById("jvResult");
    const resultBanner   = document.getElementById("resultBanner");
    const rbIcon         = document.getElementById("rbIcon");
    const rbTitle        = document.getElementById("rbTitle");
    const rbDesc         = document.getElementById("rbDesc");

    const errorPanel     = document.getElementById("errorPanel");
    const errMsg         = document.getElementById("errMsg");
    const errLine        = document.getElementById("errLine");
    const errCol         = document.getElementById("errCol");
    const errPos         = document.getElementById("errPos");
    const errSnippet     = document.getElementById("errSnippet");

    const statsGrid      = document.getElementById("statsGrid");
    const statDepth      = document.getElementById("statDepth");
    const statKeys       = document.getElementById("statKeys");
    const statArrays     = document.getElementById("statArrays");
    const statObjects    = document.getElementById("statObjects");
    const statStrings    = document.getElementById("statStrings");
    const statNumbers    = document.getElementById("statNumbers");
    const statBools      = document.getElementById("statBools");
    const statNulls      = document.getElementById("statNulls");

    const rtTabs         = document.querySelectorAll(".rt-tab");
    const treeView       = document.getElementById("treeView");
    const treeContainer  = document.getElementById("treeContainer");
    const formattedView  = document.getElementById("formattedView");
    const formattedOutput= document.getElementById("formattedOutput");
    const pathsView      = document.getElementById("pathsView");
    const pathsList      = document.getElementById("pathsList");
    const copyPathsBtn   = document.getElementById("copyPathsBtn");

    const copyFormattedBtn = document.getElementById("copyFormattedBtn");
    const shareResultBtn   = document.getElementById("shareResultBtn");
    const downloadFormattedBtn = document.getElementById("downloadFormattedBtn");

    const jvHistoryList  = document.getElementById("jvHistoryList");
    const clearJvHistory = document.getElementById("clearJvHistory");

    /* ---------------- State ---------------- */
    let currentIndent = 2;       // 2 | 4 | "\t"
    let parsedData    = null;
    let parsedValid   = false;
    let currentView   = "tree";
    let history       = loadHistory();
    let autoValidateTimer = null;

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_jsonvalidator_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_jsonvalidator_history", JSON.stringify(history.slice(0, 20)));
        } catch (e) {}
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    function getIndentStr() {
        if (currentIndent === "tab") return "\t";
        return currentIndent;
    }

    function setStatus(type, message) {
        statusBadge.classList.remove("valid", "invalid", "checking");
        statusBadge.classList.add(type);
        const icons = {
            valid: "fa-check-circle",
            invalid: "fa-times-circle",
            checking: "fa-spinner fa-spin",
        };
        const icon = icons[type] || "fa-circle-info";
        statusBadge.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(message)}</span>`;
    }

    function updateLineNumbers() {
        const lines = jsonInput.value.split("\n").length;
        let html = "";
        for (let i = 1; i <= Math.max(lines, 1); i++) html += i + "\n";
        lineNumbers.textContent = html.trimEnd();
        // Sync scroll
        lineNumbers.scrollTop = jsonInput.scrollTop;
    }

    function updateInputStats() {
        const v = jsonInput.value;
        statChars.innerHTML = `<i class="fa-solid fa-font"></i> ${v.length.toLocaleString()} chars`;
        statLines.innerHTML = `<i class="fa-solid fa-list-ol"></i> ${(v.split("\n").length).toLocaleString()} lines`;
        const bytes = new Blob([v]).size;
        statSize.innerHTML = `<i class="fa-solid fa-database"></i> ${formatBytes(bytes)}`;
    }

    /* ============================================================
       ERROR POSITION EXTRACTION
       ============================================================ */
    function extractErrorPosition(err, source) {
        const msg = err.message || "Unknown error";

        // Try to extract "position N" (V8 style)
        const posMatch = msg.match(/position\s+(\d+)/i);
        if (posMatch) {
            const pos = parseInt(posMatch[1], 10);
            const { line, col } = posToLineCol(source, pos);
            return { message: msg, position: pos, line, col };
        }

        // Try to extract "at line X column Y" (SpiderMonkey style)
        const lcMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
        if (lcMatch) {
            const line = parseInt(lcMatch[1], 10);
            const col  = parseInt(lcMatch[2], 10);
            return { message: msg, position: lineColToPos(source, line, col), line, col };
        }

        // Fallback
        return { message: msg, position: -1, line: -1, col: -1 };
    }

    function posToLineCol(source, pos) {
        let line = 1, col = 1;
        for (let i = 0; i < pos && i < source.length; i++) {
            if (source[i] === "\n") { line++; col = 1; } else col++;
        }
        return { line, col };
    }

    function lineColToPos(source, line, col) {
        let pos = 0, currLine = 1, currCol = 1;
        while (pos < source.length && (currLine < line || currCol < col)) {
            if (source[pos] === "\n") { currLine++; currCol = 1; } else currCol++;
            pos++;
        }
        return pos;
    }

    function renderSnippet(source, pos) {
        if (pos < 0 || pos > source.length) return "";
        // Get 3 lines around pos
        const startIdx = Math.max(0, source.lastIndexOf("\n", Math.max(0, pos - 1)) + 1);
        const endIdx = source.indexOf("\n", pos);
        const lineEnd = endIdx === -1 ? source.length : endIdx;
        const line = source.substring(startIdx, lineEnd);
        const errCol = pos - startIdx;

        // Show the line with error char highlighted
        let before = line.substring(0, errCol);
        let bad = line.charAt(errCol) || " ";
        let after = line.substring(errCol + 1);

        // Limit width for mobile
        const maxW = 60;
        if (before.length > maxW) {
            before = "…" + before.substring(before.length - maxW);
        }
        if (after.length > maxW) {
            after = after.substring(0, maxW) + "…";
        }

        return `<span style="color:#64748b">${escapeHtml(before)}</span><span class="err-char">${escapeHtml(bad)}</span><span style="color:#64748b">${escapeHtml(after)}</span>`;
    }

    /* ============================================================
       VALIDATION CORE
       ============================================================ */
    function validateJSON(silent = false) {
        const source = jsonInput.value.trim();
        if (!source) {
            if (!silent) {
                parsedValid = false;
                parsedData = null;
                setStatus("invalid", "Empty input");
                jvResult.style.display = "none";
            }
            return false;
        }

        setStatus("checking", "Validating…");

        try {
            const data = JSON.parse(source);
            parsedData = data;
            parsedValid = true;
            setStatus("valid", "Valid JSON");
            renderValidResult(data, source);
            pushHistory(true, source, data);
            return true;
        } catch (err) {
            parsedValid = false;
            parsedData = null;
            const info = extractErrorPosition(err, source);
            setStatus("invalid", "Invalid JSON");
            renderInvalidResult(info, source);
            pushHistory(false, source, null, info);
            return false;
        }
    }

    /* ============================================================
       RENDER: VALID
       ============================================================ */
    function renderValidResult(data, source) {
        jvResult.style.display = "block";

        // Banner
        resultBanner.className = "result-banner valid";
        rbIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        rbTitle.textContent = "Valid JSON";
        const bytes = new Blob([source]).size;
        rbDesc.textContent = `Well-formed JSON · ${formatBytes(bytes)} · Parsed successfully`;

        // Hide error panel
        errorPanel.style.display = "none";

        // Stats
        statsGrid.style.display = "grid";
        const stats = analyzeJson(data);
        statDepth.textContent   = stats.depth;
        statKeys.textContent    = stats.keys;
        statArrays.textContent  = stats.arrays;
        statObjects.textContent = stats.objects;
        statStrings.textContent = stats.strings;
        statNumbers.textContent = stats.numbers;
        statBools.textContent   = stats.booleans;
        statNulls.textContent   = stats.nulls;

        // Render tree + formatted + paths
        renderTree(data);
        renderFormatted(data);
        renderPaths(data);

        // Show tabs
        document.getElementById("resultTabs").style.display = "flex";

        // Scroll into view if needed
        setTimeout(() => {
            const rect = jvResult.getBoundingClientRect();
            if (rect.top > window.innerHeight - 100) {
                jvResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       RENDER: INVALID
       ============================================================ */
    function renderInvalidResult(info, source) {
        jvResult.style.display = "block";

        resultBanner.className = "result-banner invalid";
        rbIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        rbTitle.textContent = "Invalid JSON";
        rbDesc.textContent = info.message;

        // Error panel
        errorPanel.style.display = "block";
        errMsg.textContent = info.message;
        errLine.textContent = info.line > 0 ? info.line : "—";
        errCol.textContent = info.col > 0 ? info.col : "—";
        errPos.textContent = info.position >= 0 ? info.position : "—";

        // Snippet
        if (info.position >= 0) {
            errSnippet.innerHTML = renderSnippet(source, info.position);
        } else {
            errSnippet.innerHTML = "";
        }

        // Hide stats and tabs
        statsGrid.style.display = "none";
        document.getElementById("resultTabs").style.display = "none";
        treeView.style.display = "none";
        formattedView.style.display = "none";
        pathsView.style.display = "none";

        // Scroll
        setTimeout(() => {
            const rect = jvResult.getBoundingClientRect();
            if (rect.top > window.innerHeight - 100) {
                jvResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       JSON ANALYTICS
       ============================================================ */
    function analyzeJson(data) {
        const stats = {
            depth: 0,
            keys: 0,
            arrays: 0,
            objects: 0,
            strings: 0,
            numbers: 0,
            booleans: 0,
            nulls: 0,
        };

        function walk(node, depth) {
            stats.depth = Math.max(stats.depth, depth);
            if (node === null) {
                stats.nulls++;
            } else if (Array.isArray(node)) {
                stats.arrays++;
                node.forEach((item) => walk(item, depth + 1));
            } else if (typeof node === "object") {
                stats.objects++;
                const keys = Object.keys(node);
                stats.keys += keys.length;
                keys.forEach((k) => walk(node[k], depth + 1));
            } else if (typeof node === "string") {
                stats.strings++;
            } else if (typeof node === "number") {
                stats.numbers++;
            } else if (typeof node === "boolean") {
                stats.booleans++;
            }
        }

        walk(data, 1);
        return stats;
    }

    /* ============================================================
       TREE VIEW
       ============================================================ */
    function renderTree(data) {
        treeContainer.innerHTML = "";
        treeContainer.appendChild(buildTree(data, "$", true));
    }

    function buildTree(node, path, isRoot) {
        const wrap = document.createElement("div");
        wrap.className = "tree-node";

        const type = node === null ? "null"
            : Array.isArray(node) ? "array"
            : typeof node === "object" ? "object"
            : typeof node;

        if (type === "object" || type === "array") {
            const isArray = type === "array";
            const keys = isArray ? node.map((_, i) => i) : Object.keys(node);
            const openBracket = isArray ? "[" : "{";
            const closeBracket = isArray ? "]" : "}";

            const header = document.createElement("div");
            header.className = "tree-line";
            header.innerHTML = `
                <span class="tree-toggle">▼</span>
                <span class="tree-bracket">${openBracket}</span>
                <span class="tree-count">${keys.length} ${isArray ? "items" : "keys"}</span>
                <span class="tree-path" data-path="${escapeHtml(path)}" title="Click to copy path">${escapeHtml(path)}</span>
            `;
            wrap.appendChild(header);

            const children = document.createElement("div");
            children.className = "tree-node";
            keys.forEach((k) => {
                const childPath = isArray ? `${path}[${k}]` : `${path}.${k}`;
                const childEl = buildKeyValue(k, node[k], childPath, isArray);
                children.appendChild(childEl);
            });
            wrap.appendChild(children);

            const footer = document.createElement("div");
            footer.className = "tree-line";
            footer.innerHTML = `<span class="tree-bracket" style="padding-left:14px">${closeBracket}</span>`;
            wrap.appendChild(footer);

            // Toggle collapse
            header.querySelector(".tree-toggle").addEventListener("click", (e) => {
                e.stopPropagation();
                const toggle = header.querySelector(".tree-toggle");
                const isCollapsed = children.style.display === "none";
                children.style.display = isCollapsed ? "block" : "none";
                footer.style.display = isCollapsed ? "block" : "none";
                header.querySelector(".tree-count").style.display = isCollapsed ? "none" : "inline";
                toggle.classList.toggle("collapsed", !isCollapsed);
            });

            // Copy path
            header.querySelector(".tree-path").addEventListener("click", (e) => {
                e.stopPropagation();
                copyToClipboard(path);
            });
        } else {
            // Primitive at root
            const line = document.createElement("div");
            line.className = "tree-line";
            line.innerHTML = `${renderPrimitive(node)} <span class="tree-path" data-path="${escapeHtml(path)}">${escapeHtml(path)}</span>`;
            line.querySelector(".tree-path").addEventListener("click", () => copyToClipboard(path));
            wrap.appendChild(line);
        }

        return wrap;
    }

    function buildKeyValue(key, value, path, isArray) {
        const line = document.createElement("div");
        line.className = "tree-line";

        const type = value === null ? "null"
            : Array.isArray(value) ? "array"
            : typeof value === "object" ? "object"
            : typeof value;

        if (type === "object" || type === "array") {
            const nested = buildTree(value, path, false);
            // Remove the extra wrapping
            const first = nested.firstChild;
            if (first && first.classList.contains("tree-line")) {
                // Prepend key on first line
                const keyPrefix = isArray
                    ? `<span class="tree-key">[${key}]</span>`
                    : `<span class="tree-key">"${escapeHtml(key)}"</span>`;
                first.insertAdjacentHTML("afterbegin", `${keyPrefix}<span class="tree-colon">:</span> `);
            }
            return nested;
        }

        // Primitive
        const keyPrefix = isArray
            ? `<span class="tree-key">[${key}]</span>`
            : `<span class="tree-key">"${escapeHtml(key)}"</span>`;

        line.innerHTML = `${keyPrefix}<span class="tree-colon">:</span> ${renderPrimitive(value)} <span class="tree-path" data-path="${escapeHtml(path)}">${escapeHtml(path)}</span>`;
        line.querySelector(".tree-path").addEventListener("click", () => copyToClipboard(path));

        const wrap = document.createElement("div");
        wrap.className = "tree-node";
        wrap.appendChild(line);
        return wrap;
    }

    function renderPrimitive(v) {
        if (v === null) return `<span class="tree-null">null</span>`;
        if (typeof v === "string") return `<span class="tree-string">"${escapeHtml(v)}"</span>`;
        if (typeof v === "number") return `<span class="tree-number">${v}</span>`;
        if (typeof v === "boolean") return `<span class="tree-bool">${v}</span>`;
        return escapeHtml(String(v));
    }

    /* ============================================================
       FORMATTED VIEW
       ============================================================ */
    function renderFormatted(data) {
        let json;
        try {
            json = JSON.stringify(data, null, getIndentStr());
        } catch (e) {
            json = JSON.stringify(data);
        }
        formattedOutput.textContent = json;
    }

    /* ============================================================
       PATHS VIEW
       ============================================================ */
    function renderPaths(data) {
        const paths = [];
        function walk(node, path) {
            if (node === null || typeof node !== "object") {
                paths.push({
                    path,
                    value: node === null ? "null"
                        : typeof node === "string" ? `"${node}"`
                        : String(node),
                });
                return;
            }
            if (Array.isArray(node)) {
                node.forEach((item, i) => walk(item, `${path}[${i}]`));
            } else {
                Object.keys(node).forEach((k) => walk(node[k], `${path}.${k}`));
            }
        }
        walk(data, "$");

        if (paths.length === 0) {
            pathsList.innerHTML = '<div class="empty-history">No paths</div>';
            return;
        }

        pathsList.innerHTML = paths.slice(0, 500).map((p) => `
            <div class="path-item" data-path="${escapeHtml(p.path)}">
                <span class="pi-path">${escapeHtml(p.path)}</span>
                <span class="pi-value">${escapeHtml(p.value.length > 30 ? p.value.slice(0, 30) + "…" : p.value)}</span>
            </div>
        `).join("");

        if (paths.length > 500) {
            pathsList.insertAdjacentHTML("beforeend",
                `<div class="empty-history" style="padding:10px 0">Showing first 500 of ${paths.length} paths</div>`);
        }

        pathsList.querySelectorAll(".path-item").forEach((el) => {
            el.addEventListener("click", () => copyToClipboard(el.dataset.path));
        });
    }

    /* ============================================================
       COPY
       ============================================================ */
    function copyToClipboard(text) {
        if (!text) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (typeof showToast === "function") showToast("📋 Copied!");
            }).catch(() => fallbackCopy(text));
        } else fallbackCopy(text);
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            if (typeof showToast === "function") showToast("📋 Copied!");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Copy failed");
        }
        document.body.removeChild(ta);
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(isValid, source, data, errInfo) {
        // Skip if same as last entry
        if (history.length > 0 && history[0].preview === source.slice(0, 60) && history[0].valid === isValid) {
            return;
        }
        const preview = source.replace(/\s+/g, " ").slice(0, 60);
        history.unshift({
            valid: isValid,
            preview,
            full: source.length > 5000 ? null : source,
            size: new Blob([source]).size,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 20) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            jvHistoryList.innerHTML = '<div class="empty-history">No validations yet</div>';
            return;
        }
        jvHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-time">
                        <span class="hi-status ${h.valid ? "valid" : "invalid"}">
                            <i class="fa-solid ${h.valid ? "fa-check" : "fa-xmark"}"></i>
                            ${h.valid ? "Valid" : "Invalid"}
                        </span>
                        ${escapeHtml(h.time)}
                    </span>
                    <span class="hi-preview">${escapeHtml(h.preview || "(empty)")}</span>
                </div>
                <span class="hi-size">${formatBytes(h.size)}</span>
            </div>
        `).join("");

        jvHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                if (h.full) {
                    jsonInput.value = h.full;
                    updateLineNumbers();
                    updateInputStats();
                    validateJSON();
                } else {
                    if (typeof showToast === "function") showToast("⚠️ Large entry — paste manually");
                }
            });
        });
    }

    /* ============================================================
       ACTIONS
       ============================================================ */
    function beautify() {
        try {
            const data = JSON.parse(jsonInput.value);
            let output;
            if (sortKeysChk.checked) {
                output = JSON.stringify(sortObjectDeep(data), null, getIndentStr());
            } else {
                output = JSON.stringify(data, null, getIndentStr());
            }
            jsonInput.value = output;
            updateLineNumbers();
            updateInputStats();
            validateJSON();
            if (typeof showToast === "function") showToast("✨ Beautified");
        } catch (e) {
            if (typeof showToast === "function") showToast("⚠️ Fix JSON errors first", "error");
            validateJSON();
        }
    }

    function minify() {
        try {
            const data = JSON.parse(jsonInput.value);
            jsonInput.value = JSON.stringify(data);
            updateLineNumbers();
            updateInputStats();
            validateJSON();
            if (typeof showToast === "function") showToast("🗜️ Minified");
        } catch (e) {
            if (typeof showToast === "function") showToast("⚠️ Fix JSON errors first", "error");
            validateJSON();
        }
    }

    function autoFix() {
        let src = jsonInput.value;
        if (!src.trim()) return;

        let fixes = 0;

        // 1. Replace single quotes with double (naive)
        if (/'/.test(src)) {
            // Only outside of existing strings — very basic fix
            src = src.replace(/'([^'\n]*)'/g, (m, inner) => {
                fixes++;
                return `"${inner}"`;
            });
        }

        // 2. Remove trailing commas before } or ]
        const beforeTrail = src;
        src = src.replace(/,(\s*[}\]])/g, "$1");
        if (src !== beforeTrail) fixes++;

        // 3. Add quotes to unquoted keys
        const beforeKeys = src;
        src = src.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
        if (src !== beforeKeys) fixes++;

        // 4. Convert Python-style True/False/None
        const beforeBools = src;
        src = src.replace(/\bTrue\b/g, "true")
                 .replace(/\bFalse\b/g, "false")
                 .replace(/\bNone\b/g, "null");
        if (src !== beforeBools) fixes++;

        // 5. Try parse
        try {
            const data = JSON.parse(src);
            jsonInput.value = JSON.stringify(data, null, getIndentStr());
            updateLineNumbers();
            updateInputStats();
            validateJSON();
            if (typeof showToast === "function") {
                showToast(fixes > 0 ? `🔧 Fixed ${fixes} issue(s)` : "✓ Already valid");
            }
        } catch (e) {
            jsonInput.value = src;
            updateLineNumbers();
            updateInputStats();
            validateJSON();
            if (typeof showToast === "function") showToast("⚠️ Couldn't fully fix — see error", "error");
        }
    }

    function sortObjectDeep(obj) {
        if (Array.isArray(obj)) return obj.map(sortObjectDeep);
        if (obj && typeof obj === "object") {
            const sorted = {};
            Object.keys(obj).sort().forEach((k) => {
                sorted[k] = sortObjectDeep(obj[k]);
            });
            return sorted;
        }
        return obj;
    }

    function loadSample() {
        const sample = {
            name: "Tool Hub",
            version: "1.0.0",
            active: true,
            rating: 4.8,
            tags: ["json", "validator", "tools"],
            author: {
                name: "John Doe",
                email: "john@example.com",
                social: {
                    twitter: "@johndoe",
                    github: "johndoe"
                }
            },
            features: [
                { id: 1, title: "Validate", enabled: true },
                { id: 2, title: "Beautify", enabled: true },
                { id: 3, title: "Tree View", enabled: true }
            ],
            meta: {
                createdAt: "2024-01-15",
                updatedAt: "2025-01-20",
                stats: {
                    users: 12500,
                    downloads: 89000,
                    reviews: 3421
                }
            },
            deprecated: null
        };
        jsonInput.value = JSON.stringify(sample, null, 2);
        updateLineNumbers();
        updateInputStats();
        validateJSON();
        if (typeof showToast === "function") showToast("🧪 Sample loaded");
    }

    function clearAll() {
        if (jsonInput.value && !confirm("Clear all content?")) return;
        jsonInput.value = "";
        updateLineNumbers();
        updateInputStats();
        jvResult.style.display = "none";
        parsedData = null;
        parsedValid = false;
        setStatus("valid", "Ready — paste JSON and click Validate");
        if (typeof showToast === "function") showToast("🧹 Cleared");
    }

    /* ============================================================
       EVENTS
       ============================================================ */
    // Input changes
    jsonInput.addEventListener("input", () => {
        updateLineNumbers();
        updateInputStats();

        if (autoValidateChk.checked) {
            clearTimeout(autoValidateTimer);
            autoValidateTimer = setTimeout(() => {
                if (jsonInput.value.trim()) validateJSON(true);
            }, 600);
        }
    });

    jsonInput.addEventListener("scroll", () => {
        lineNumbers.scrollTop = jsonInput.scrollTop;
    });

    // Handle Tab key in textarea
    jsonInput.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = jsonInput.selectionStart;
            const end = jsonInput.selectionEnd;
            jsonInput.value = jsonInput.value.substring(0, start) + "  " + jsonInput.value.substring(end);
            jsonInput.selectionStart = jsonInput.selectionEnd = start + 2;
            updateLineNumbers();
        }
        // Ctrl+Enter validate
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            validateJSON();
        }
        // Ctrl+B beautify
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            beautify();
        }
        // Ctrl+M minify
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
            e.preventDefault();
            minify();
        }
    });

    // Buttons
    validateBtn.addEventListener("click", () => validateJSON());
    beautifyBtn.addEventListener("click", beautify);
    minifyBtn.addEventListener("click", minify);
    fixBtn.addEventListener("click", autoFix);
    sampleBtn.addEventListener("click", loadSample);
    clearBtn.addEventListener("click", clearAll);

    pasteBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            jsonInput.value = text;
            updateLineNumbers();
            updateInputStats();
            validateJSON();
            if (typeof showToast === "function") showToast("📋 Pasted");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    copyInputBtn.addEventListener("click", () => {
        if (!jsonInput.value) return;
        copyToClipboard(jsonInput.value);
    });

    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            jsonInput.value = ev.target.result;
            updateLineNumbers();
            updateInputStats();
            validateJSON();
            if (typeof showToast === "function") showToast("📁 File loaded");
        };
        reader.readAsText(file);
        fileInput.value = "";
    });

    downloadBtn.addEventListener("click", () => {
        if (!jsonInput.value) return;
        downloadFile(jsonInput.value, "data.json");
    });

    fullscreenBtn.addEventListener("click", () => {
        jvCard.classList.toggle("fullscreen");
        const isFs = jvCard.classList.contains("fullscreen");
        fullscreenBtn.innerHTML = isFullscreenIcon(isFs);
    });

    function isFullscreenIcon(on) {
        return on ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
    }

    // Indent buttons
    indentBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            indentBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const val = btn.dataset.indent;
            currentIndent = val === "tab" ? "tab" : parseInt(val, 10);
            if (parsedValid && parsedData) renderFormatted(parsedData);
        });
    });

    // Result tabs
    rtTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            rtTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            currentView = tab.dataset.view;
            treeView.style.display = currentView === "tree" ? "block" : "none";
            formattedView.style.display = currentView === "formatted" ? "block" : "none";
            pathsView.style.display = currentView === "paths" ? "block" : "none";
        });
    });

    // Copy all paths
    copyPathsBtn.addEventListener("click", () => {
        const paths = Array.from(pathsList.querySelectorAll(".path-item"))
            .map((el) => el.dataset.path)
            .filter(Boolean);
        if (paths.length === 0) return;
        copyToClipboard(paths.join("\n"));
    });

    // Result actions
    copyFormattedBtn.addEventListener("click", () => {
        if (parsedData) {
            try {
                const out = JSON.stringify(parsedData, null, getIndentStr());
                copyToClipboard(out);
            } catch (e) {}
        }
    });

    shareResultBtn.addEventListener("click", () => {
        const text = parsedValid ? "Valid JSON ✓" : "Invalid JSON ✗";
        if (navigator.share) {
            navigator.share({
                title: "JSON Validator Result",
                text,
                url: window.location.href,
            }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    downloadFormattedBtn.addEventListener("click", () => {
        if (!parsedData) return;
        let out;
        try {
            out = JSON.stringify(parsedData, null, getIndentStr());
        } catch (e) {
            out = jsonInput.value;
        }
        downloadFile(out, "formatted.json");
    });

    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === "function") showToast("📥 Downloaded");
    }

    clearJvHistory.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;

        if (e.key === "Escape") {
            e.preventDefault();
            clearAll();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareJsonValidator = function () {
        const shareData = {
            title: "JSON Validator - Tool Hub",
            text: "Validate, beautify & inspect JSON with detailed error info!",
            url: window.location.href,
        };
        if (navigator.share) navigator.share(shareData).catch(() => {});
        else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Link copied!");
            }).catch(() => {});
        }
    };

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        updateLineNumbers();
        updateInputStats();
        renderHistory();
        setStatus("valid", "Ready — paste JSON and click Validate");
    }

    init();
})();