/* ============================================================
   HTML FORMATTER - Advanced Logic
   Beautify · Minify · Validate · Preview · Stats · Tag Frequency
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const htmlCard       = document.getElementById("htmlCard");
    const htmlInput      = document.getElementById("htmlInput");
    const lineNumbers    = document.getElementById("lineNumbers");
    const fileInput      = document.getElementById("fileInput");

    const formatBtn      = document.getElementById("formatBtn");
    const minifyBtn      = document.getElementById("minifyBtn");
    const validateBtn    = document.getElementById("validateBtn");
    const sampleBtn      = document.getElementById("sampleBtn");
    const clearBtn       = document.getElementById("clearBtn");

    const pasteBtn       = document.getElementById("pasteBtn");
    const copyInputBtn   = document.getElementById("copyInputBtn");
    const uploadBtn      = document.getElementById("uploadBtn");
    const downloadBtn    = document.getElementById("downloadBtn");
    const fullscreenBtn  = document.getElementById("fullscreenBtn");

    const sortAttrs      = document.getElementById("sortAttrs");
    const preserveInline = document.getElementById("preserveInline");
    const autoValidate   = document.getElementById("autoValidate");
    const indentBtns     = document.querySelectorAll(".indent-btn");

    const statusBadge    = document.getElementById("statusBadge");
    const statChars      = document.getElementById("statChars");
    const statLines      = document.getElementById("statLines");
    const statTags       = document.getElementById("statTags");

    const outputArea     = document.getElementById("outputArea");
    const otTabs         = document.querySelectorAll(".ot-tab");
    const outputViews    = document.querySelectorAll(".output-view");
    const outputContent  = document.getElementById("outputContent");
    const outputStats    = document.getElementById("outputStats");
    const previewFrame   = document.getElementById("previewFrame");
    const openPreviewBtn = document.getElementById("openPreviewBtn");

    const stTotalTags    = document.getElementById("stTotalTags");
    const stOpenTags     = document.getElementById("stOpenTags");
    const stCloseTags    = document.getElementById("stCloseTags");
    const stSelfTags     = document.getElementById("stSelfTags");
    const stAttrs        = document.getElementById("stAttrs");
    const stComments     = document.getElementById("stComments");
    const stMaxDepth     = document.getElementById("stMaxDepth");
    const stSize         = document.getElementById("stSize");
    const tagFreqList    = document.getElementById("tagFreqList");

    const copyOutputBtn  = document.getElementById("copyOutputBtn");
    const downloadOutputBtn = document.getElementById("downloadOutputBtn");
    const copyFormattedBtn  = document.getElementById("copyFormattedBtn");
    const shareResultBtn    = document.getElementById("shareResultBtn");
    const downloadFormattedBtn = document.getElementById("downloadFormattedBtn");

    const validationArea = document.getElementById("validationArea");
    const vaHeader       = document.getElementById("vaHeader");
    const vaTitle        = document.getElementById("vaTitle");
    const vaBody         = document.getElementById("vaBody");

    const htmlHistoryList= document.getElementById("htmlHistoryList");
    const clearHtmlHistory = document.getElementById("clearHtmlHistory");

    /* ---------------- Constants ---------------- */
    const VOID_ELEMENTS = new Set([
        "area","base","br","col","embed","hr","img","input","link","meta",
        "param","source","track","wbr","!doctype"
    ]);

    const INLINE_ELEMENTS = new Set([
        "a","abbr","b","bdi","bdo","br","cite","code","data","dfn","em","i",
        "kbd","mark","q","rp","rt","ruby","s","samp","small","span","strong",
        "sub","sup","time","u","var","wbr"
    ]);

    /* ---------------- State ---------------- */
    let currentIndent = 2;         // 2 | 4 | "tab"
    let lastResult    = null;      // { text, mode, size }
    let lastValidData = null;      // last parsed tokens
    let history       = loadHistory();
    let autoTimer     = null;
    let currentView   = "output";

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_htmlformatter_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_htmlformatter_history", JSON.stringify(history.slice(0, 20)));
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

    function formatBytes(b) {
        if (b < 1024) return b + " B";
        if (b < 1024 * 1024) return (b / 1024).toFixed(2) + " KB";
        return (b / (1024 * 1024)).toFixed(2) + " MB";
    }

    function getIndentStr() {
        if (currentIndent === "tab") return "\t";
        return " ".repeat(currentIndent);
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
        const lines = htmlInput.value.split("\n").length;
        let out = "";
        for (let i = 1; i <= Math.max(lines, 1); i++) out += i + "\n";
        lineNumbers.textContent = out.trimEnd();
        lineNumbers.scrollTop = htmlInput.scrollTop;
    }

    function updateInputStats() {
        const v = htmlInput.value;
        statChars.innerHTML = `<i class="fa-solid fa-font"></i> ${v.length.toLocaleString()} chars`;
        statLines.innerHTML = `<i class="fa-solid fa-list-ol"></i> ${v.split("\n").length.toLocaleString()} lines`;
        const tagCount = (v.match(/<[a-zA-Z!][^>]*>/g) || []).length;
        statTags.innerHTML = `<i class="fa-solid fa-code"></i> ${tagCount.toLocaleString()} tags`;
    }

    /* ============================================================
       TOKENIZER
       Returns array of tokens:
         { type: "open"|"close"|"self"|"text"|"comment"|"doctype",
           tag, attrs (raw string), raw, isInline, whitespace }
       ============================================================ */
    function tokenize(html) {
        const tokens = [];
        let i = 0;
        const n = html.length;

        while (i < n) {
            const lt = html.indexOf("<", i);

            // Text before next tag
            if (lt === -1) {
                if (i < n) tokens.push({ type: "text", raw: html.slice(i) });
                break;
            }
            if (lt > i) {
                tokens.push({ type: "text", raw: html.slice(i, lt) });
            }

            // Comment
            if (html.startsWith("<!--", lt)) {
                const end = html.indexOf("-->", lt + 4);
                const stop = end === -1 ? n : end + 3;
                tokens.push({ type: "comment", raw: html.slice(lt, stop) });
                i = stop;
                continue;
            }

            // Doctype / declaration / CDATA
            if (html.startsWith("<!", lt)) {
                const end = html.indexOf(">", lt);
                const stop = end === -1 ? n : end + 1;
                tokens.push({ type: "doctype", raw: html.slice(lt, stop) });
                i = stop;
                continue;
            }

            // Closing tag
            if (html.startsWith("</", lt)) {
                const end = html.indexOf(">", lt);
                const stop = end === -1 ? n : end + 1;
                const raw = html.slice(lt, stop);
                const tag = raw.match(/^<\/\s*([a-zA-Z][a-zA-Z0-9-]*)/);
                tokens.push({
                    type: "close",
                    tag: tag ? tag[1].toLowerCase() : "",
                    raw,
                });
                i = stop;
                continue;
            }

            // Opening tag (may be self-closing)
            const tagMatch = html.slice(lt).match(/^<\s*([a-zA-Z][a-zA-Z0-9-]*)/);
            if (!tagMatch) {
                // Not a valid tag start, treat "<" as text
                tokens.push({ type: "text", raw: "<" });
                i = lt + 1;
                continue;
            }

            // Find end of opening tag (respecting quotes)
            let end = lt + 1;
            let inQuote = null;
            while (end < n) {
                const c = html[end];
                if (inQuote) {
                    if (c === inQuote) inQuote = null;
                } else if (c === '"' || c === "'") {
                    inQuote = c;
                } else if (c === ">") {
                    break;
                }
                end++;
            }
            const stop = end === -1 ? n : end + 1;
            const raw = html.slice(lt, stop);
            const tagName = tagMatch[1].toLowerCase();
            const isSelfClosing = /\/\s*>$/.test(raw) || VOID_ELEMENTS.has(tagName);

            tokens.push({
                type: isSelfClosing ? "self" : "open",
                tag: tagName,
                raw,
            });
            i = stop;
        }

        return tokens;
    }

    /* ============================================================
       ATTRIBUTE PARSING
       ============================================================ */
    function parseAttrs(raw) {
        // raw like: <div class="foo" id='bar' disabled data-x=1>
        // return { tagName, attrs: [{name, value}], selfClosing }
        const match = raw.match(/^<\s*([a-zA-Z][a-zA-Z0-9-]*)/);
        if (!match) return null;
        const tagName = match[1];
        let rest = raw.slice(match[0].length);

        // Strip trailing >
        rest = rest.replace(/>$/, "").replace(/\/$/, "").trim();

        const attrs = [];
        const attrRegex = /([^\s=]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
        let m;
        while ((m = attrRegex.exec(rest)) !== null) {
            if (!m[1]) continue;
            attrs.push({
                name: m[1],
                value: m[2] !== undefined ? m[2] : null,
                raw: m[0],
            });
        }
        return { tagName, attrs, selfClosing: /\/\s*>$/.test(raw) };
    }

    function rebuildTag(tagName, attrs, selfClosing, sortAttrsOption) {
        const attrList = attrs.slice();
        if (sortAttrsOption) {
            attrList.sort((a, b) => a.name.localeCompare(b.name));
        }
        const attrStr = attrList.map((a) => a.value !== null ? `${a.name}=${a.value}` : a.name).join(" ");
        const selfClose = selfClosing ? " /" : "";
        return `<${tagName}${attrStr ? " " + attrStr : ""}${selfClose}>`;
    }

    /* ============================================================
       BEAUTIFY (FORMAT)
       ============================================================ */
    function beautify(source) {
        const tokens = tokenize(source);
        const indentStr = getIndentStr();
        let depth = 0;
        const lines = [];
        let currentLine = "";
        const sortAttrOpt = sortAttrs.checked;
        const preserveInl = preserveInline.checked;

        function pushLine() {
            if (currentLine.trim().length > 0) {
                lines.push(indentStr.repeat(depth) + currentLine);
            }
            currentLine = "";
        }

        function isInlineToken(token) {
            if (!preserveInl) return false;
            if (token.type === "open" && INLINE_ELEMENTS.has(token.tag)) return true;
            if (token.type === "close" && INLINE_ELEMENTS.has(token.tag)) return true;
            return false;
        }

        let inlineDepth = 0;
        let inlineBuffer = "";

        for (let idx = 0; idx < tokens.length; idx++) {
            const tok = tokens[idx];

            // -------- Text --------
            if (tok.type === "text") {
                const text = tok.raw;
                const trimmed = text.replace(/\s+/g, " ").trim();
                if (!trimmed) continue;

                if (inlineDepth > 0) {
                    inlineBuffer += trimmed;
                } else {
                    pushLine();
                    currentLine = trimmed;
                }
                continue;
            }

            // -------- Comment --------
            if (tok.type === "comment") {
                if (inlineDepth > 0) {
                    inlineBuffer += tok.raw;
                } else {
                    pushLine();
                    currentLine = tok.raw.trim();
                    pushLine();
                }
                continue;
            }

            // -------- Doctype --------
            if (tok.type === "doctype") {
                pushLine();
                currentLine = tok.raw.trim();
                pushLine();
                continue;
            }

            // -------- Self-closing --------
            if (tok.type === "self") {
                const parsed = parseAttrs(tok.raw);
                const rebuilt = parsed ? rebuildTag(parsed.tagName, parsed.attrs, true, sortAttrOpt) : tok.raw;
                if (inlineDepth > 0) {
                    inlineBuffer += rebuilt;
                } else {
                    pushLine();
                    currentLine = rebuilt;
                    pushLine();
                }
                continue;
            }

            // -------- Opening tag --------
            if (tok.type === "open") {
                const parsed = parseAttrs(tok.raw);
                const rebuilt = parsed ? rebuildTag(parsed.tagName, parsed.attrs, false, sortAttrOpt) : tok.raw;

                if (isInlineToken(tok)) {
                    // Handle inline mode
                    if (inlineDepth === 0) {
                        pushLine();
                        inlineBuffer = "";
                    }
                    inlineBuffer += rebuilt;
                    inlineDepth++;
                    continue;
                }

                pushLine();
                currentLine = rebuilt;
                pushLine();
                depth++;
                continue;
            }

            // -------- Closing tag --------
            if (tok.type === "close") {
                if (isInlineToken(tok)) {
                    inlineDepth = Math.max(0, inlineDepth - 1);
                    inlineBuffer += `</${tok.tag}>`;
                    if (inlineDepth === 0) {
                        pushLine();
                        currentLine = inlineBuffer.trim();
                        pushLine();
                        inlineBuffer = "";
                    }
                    continue;
                }

                pushLine();
                depth = Math.max(0, depth - 1);
                currentLine = `</${tok.tag}>`;
                pushLine();
                continue;
            }
        }

        // Flush remaining inline buffer
        if (inlineBuffer) {
            pushLine();
            currentLine = inlineBuffer.trim();
            pushLine();
        }

        pushLine();

        return lines.join("\n");
    }

    /* ============================================================
       MINIFY
       ============================================================ */
    function minifyHtml(source) {
        // Remove comments (but keep conditional comments)
        let out = source.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");

        // Collapse whitespace between tags
        out = out.replace(/>\s+</g, "><");

        // Collapse multiple spaces inside text (but keep meaningful ones)
        // Naive: collapse all runs of whitespace to single space
        out = out.replace(/\s+/g, " ");

        // Remove space before >
        out = out.replace(/\s+>/g, ">");

        // Trim
        out = out.trim();

        return out;
    }

    /* ============================================================
       ANALYZE (STATS)
       ============================================================ */
    function analyze(source) {
        const tokens = tokenize(source);
        const stats = {
            totalTags: 0,
            openTags: 0,
            closeTags: 0,
            selfTags: 0,
            attrs: 0,
            comments: 0,
            maxDepth: 0,
            size: new Blob([source]).size,
        };
        const tagFreq = {};
        let depth = 0;

        for (const tok of tokens) {
            switch (tok.type) {
                case "open":
                    stats.totalTags++;
                    stats.openTags++;
                    tagFreq[tok.tag] = (tagFreq[tok.tag] || 0) + 1;
                    depth++;
                    stats.maxDepth = Math.max(stats.maxDepth, depth);
                    {
                        const p = parseAttrs(tok.raw);
                        if (p) stats.attrs += p.attrs.length;
                    }
                    break;
                case "close":
                    stats.totalTags++;
                    stats.closeTags++;
                    depth = Math.max(0, depth - 1);
                    break;
                case "self":
                    stats.totalTags++;
                    stats.selfTags++;
                    tagFreq[tok.tag] = (tagFreq[tok.tag] || 0) + 1;
                    {
                        const p = parseAttrs(tok.raw);
                        if (p) stats.attrs += p.attrs.length;
                    }
                    break;
                case "comment":
                    stats.comments++;
                    break;
            }
        }

        return { stats, tagFreq };
    }

    function renderStats(source) {
        const { stats, tagFreq } = analyze(source);

        stTotalTags.textContent = stats.totalTags.toLocaleString();
        stOpenTags.textContent  = stats.openTags.toLocaleString();
        stCloseTags.textContent = stats.closeTags.toLocaleString();
        stSelfTags.textContent  = stats.selfTags.toLocaleString();
        stAttrs.textContent     = stats.attrs.toLocaleString();
        stComments.textContent  = stats.comments.toLocaleString();
        stMaxDepth.textContent  = stats.maxDepth.toLocaleString();
        stSize.textContent      = formatBytes(stats.size);

        // Tag frequency
        const sorted = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sorted.length === 0) {
            tagFreqList.innerHTML = '<div class="empty-history">No tags found</div>';
            return;
        }
        const max = sorted[0][1];
        tagFreqList.innerHTML = sorted.map(([name, count]) => {
            const pct = (count / max) * 100;
            return `
                <div class="tf-item">
                    <span class="tf-name">&lt;${escapeHtml(name)}&gt;</span>
                    <div class="tf-bar-wrap">
                        <div class="tf-bar" style="width:${pct}%"></div>
                    </div>
                    <span class="tf-count">${count}</span>
                </div>
            `;
        }).join("");
    }

    /* ============================================================
       VALIDATE
       ============================================================ */
    function validate(source) {
        const tokens = tokenize(source);
        const issues = [];
        const stack = [];

        for (const tok of tokens) {
            if (tok.type === "open") {
                if (VOID_ELEMENTS.has(tok.tag)) {
                    issues.push({
                        level: "warn",
                        text: `<${tok.tag}> should be self-closing or void element`,
                    });
                } else {
                    stack.push(tok.tag);
                }
            } else if (tok.type === "close") {
                if (stack.length === 0) {
                    issues.push({
                        level: "error",
                        text: `Unexpected closing tag </${tok.tag}> — no matching open tag`,
                    });
                } else {
                    const expected = stack[stack.length - 1];
                    if (expected === tok.tag) {
                        stack.pop();
                    } else {
                        // Search stack for matching tag
                        const idx = stack.lastIndexOf(tok.tag);
                        if (idx === -1) {
                            issues.push({
                                level: "error",
                                text: `Unexpected closing tag </${tok.tag}> — never opened`,
                            });
                        } else {
                            const unclosed = stack.slice(idx + 1);
                            issues.push({
                                level: "warn",
                                text: `Unclosed tag(s) before </${tok.tag}>: ${unclosed.map(t => `<${t}>`).join(", ")}`,
                            });
                            stack.length = idx;
                        }
                    }
                }
            }
        }

        // Unclosed tags remaining
        if (stack.length > 0) {
            stack.forEach((t) => {
                issues.push({
                    level: "error",
                    text: `Unclosed tag <${t}> — missing closing tag </${t}>`,
                });
            });
        }

        if (issues.length === 0) {
            issues.push({
                level: "pass",
                text: "HTML structure looks balanced — no unclosed or mismatched tags.",
            });
        }

        return issues;
    }

    function renderValidation(issues) {
        validationArea.style.display = "block";
        const hasError = issues.some((i) => i.level === "error");
        vaHeader.classList.toggle("pass", !hasError);

        const errorCount = issues.filter((i) => i.level === "error").length;
        const warnCount  = issues.filter((i) => i.level === "warn").length;
        let title;
        if (errorCount === 0 && warnCount === 0) {
            title = "Validation Passed";
        } else {
            title = `${errorCount} error${errorCount !== 1 ? "s" : ""}`;
            if (warnCount > 0) title += ` · ${warnCount} warning${warnCount !== 1 ? "s" : ""}`;
        }
        vaTitle.textContent = title;
        vaHeader.querySelector("i").className = hasError
            ? "fa-solid fa-circle-exclamation"
            : "fa-solid fa-circle-check";

        vaBody.innerHTML = issues.map((iss) => {
            const iconMap = {
                error: "fa-times-circle",
                warn: "fa-exclamation-triangle",
                info: "fa-info-circle",
                pass: "fa-check-circle",
            };
            return `<div class="va-item ${iss.level}"><i class="fa-solid ${iconMap[iss.level]}"></i><span class="va-text">${escapeHtml(iss.text)}</span></div>`;
        }).join("");

        setTimeout(() => {
            const r = validationArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                validationArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       SHOW OUTPUT
       ============================================================ */
    function showOutput(content, mode) {
        outputArea.style.display = "block";
        outputContent.textContent = content;

        const bytes = new Blob([content]).size;
        outputStats.textContent = `${content.length.toLocaleString()} chars · ${formatBytes(bytes)}`;

        // Update preview
        try {
            previewFrame.srcdoc = content;
        } catch (e) {
            previewFrame.srcdoc = "<pre>Preview not available</pre>";
        }

        // Render stats
        renderStats(content);

        lastResult = {
            text: content,
            mode,
            size: bytes,
        };
    }

    /* ============================================================
       MAIN ACTIONS
       ============================================================ */
    function doFormat() {
        const src = htmlInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter HTML first", "error");
            return;
        }
        setStatus("checking", "Formatting…");
        try {
            const out = beautify(src);
            setStatus("valid", "Formatted");
            showOutput(out, "format");
            pushHistory("format", src, out);
            if (typeof showToast === "function") showToast("✨ Formatted");
        } catch (e) {
            setStatus("invalid", "Formatting failed");
            if (typeof showToast === "function") showToast("❌ " + e.message, "error");
        }
    }

    function doMinify() {
        const src = htmlInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter HTML first", "error");
            return;
        }
        setStatus("checking", "Minifying…");
        try {
            const out = minifyHtml(src);
            setStatus("valid", "Minified");
            showOutput(out, "minify");
            pushHistory("minify", src, out);
            if (typeof showToast === "function") showToast("🗜️ Minified");
        } catch (e) {
            setStatus("invalid", "Minify failed");
            if (typeof showToast === "function") showToast("❌ " + e.message, "error");
        }
    }

    function doValidate() {
        const src = htmlInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter HTML first", "error");
            return;
        }
        setStatus("checking", "Validating…");
        try {
            const issues = validate(src);
            const hasError = issues.some((i) => i.level === "error");
            setStatus(hasError ? "invalid" : "valid", hasError ? "Validation issues" : "Valid HTML");
            renderValidation(issues);
            pushHistory("validate", src, issues.length + " issue(s)");
            if (typeof showToast === "function") showToast(hasError ? "⚠️ Issues found" : "✅ Valid HTML");
        } catch (e) {
            setStatus("invalid", "Validation failed");
            if (typeof showToast === "function") showToast("❌ " + e.message, "error");
        }
    }

    /* ============================================================
       SAMPLE
       ============================================================ */
    function loadSample() {
        const sample = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Sample Page</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="style.css">
</head><body>
<!-- Header Section -->
<header class="site-header"><nav><ul><li><a href="/">Home</a></li><li><a href="/about">About</a></li><li><a href="/contact">Contact</a></li></ul></nav></header>
<main>
<section class="hero"><h1>Welcome to <em>Tool Hub</em></h1><p>Find all your <strong>favorite</strong> tools in <span class="highlight">one place</span>.</p><button type="button" onclick="alert('Click!')">Get Started</button></section>
<section class="features"><div class="feature"><h3><i class="icon">&#9733;</i> Fast</h3><p>Lightning fast tools.</p></div><div class="feature"><h3><i class="icon">&#9889;</i> Modern</h3><p>Built with latest tech.</p></div></div>
</main>
<footer><p>&copy; 2025 Tool Hub</p><img src="logo.png" alt="Logo" width="100" height="50"><br></footer>
</body></html>`;
        htmlInput.value = sample;
        updateLineNumbers();
        updateInputStats();
        doFormat();
        if (typeof showToast === "function") showToast("🧪 Sample loaded");
    }

    /* ============================================================
       CLEAR
       ============================================================ */
    function clearAll() {
        if (htmlInput.value && !confirm("Clear all content?")) return;
        htmlInput.value = "";
        updateLineNumbers();
        updateInputStats();
        outputArea.style.display = "none";
        validationArea.style.display = "none";
        setStatus("valid", "Ready — paste HTML and click Beautify");
        lastResult = null;
        if (typeof showToast === "function") showToast("🧹 Cleared");
    }

    /* ============================================================
       COPY / PASTE / DOWNLOAD
       ============================================================ */
    function copyToClipboard(text) {
        if (text === undefined || text === null) return;
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

    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: "text/html" });
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

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(mode, inputPreview, outputPreview) {
        history.unshift({
            mode,
            inputPreview: (inputPreview || "").replace(/\s+/g, " ").slice(0, 55),
            outputPreview: (outputPreview || "").replace(/\s+/g, " ").slice(0, 55),
            inputFull: inputPreview && inputPreview.length < 5000 ? inputPreview : null,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 20) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            htmlHistoryList.innerHTML = '<div class="empty-history">No actions yet</div>';
            return;
        }
        htmlHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-time">
                        <span class="hi-mode-badge ${h.mode}">${h.mode}</span>
                        ${escapeHtml(h.time)}
                    </span>
                    <span class="hi-preview">${escapeHtml(h.inputPreview || "(empty)")}</span>
                </div>
                <span class="hi-size">${escapeHtml((h.outputPreview || "").slice(0, 20))}</span>
            </div>
        `).join("");

        htmlHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                if (h.inputFull) {
                    htmlInput.value = h.inputFull;
                    updateLineNumbers();
                    updateInputStats();
                    if (h.mode === "format") doFormat();
                    else if (h.mode === "minify") doMinify();
                    else if (h.mode === "validate") doValidate();
                } else {
                    if (typeof showToast === "function") showToast("⚠️ Entry too large to reload");
                }
            });
        });
    }

    /* ============================================================
       EVENT LISTENERS
       ============================================================ */
    htmlInput.addEventListener("input", () => {
        updateLineNumbers();
        updateInputStats();
        if (autoValidate.checked) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
                if (htmlInput.value.trim()) {
                    const issues = validate(htmlInput.value);
                    const hasError = issues.some((i) => i.level === "error");
                    setStatus(hasError ? "invalid" : "valid", hasError ? "Validation issues" : "Valid HTML");
                }
            }, 800);
        }
    });

    htmlInput.addEventListener("scroll", () => {
        lineNumbers.scrollTop = htmlInput.scrollTop;
    });

    // Tab handling
    htmlInput.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = htmlInput.selectionStart;
            const end = htmlInput.selectionEnd;
            htmlInput.value = htmlInput.value.substring(0, start) + "  " + htmlInput.value.substring(end);
            htmlInput.selectionStart = htmlInput.selectionEnd = start + 2;
            updateLineNumbers();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            doFormat();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
            e.preventDefault();
            doMinify();
        }
    });

    // Buttons
    formatBtn.addEventListener("click", doFormat);
    minifyBtn.addEventListener("click", doMinify);
    validateBtn.addEventListener("click", doValidate);
    sampleBtn.addEventListener("click", loadSample);
    clearBtn.addEventListener("click", clearAll);

    // Toolbar
    pasteBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            htmlInput.value = text;
            updateLineNumbers();
            updateInputStats();
            if (typeof showToast === "function") showToast("📋 Pasted");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    copyInputBtn.addEventListener("click", () => {
        if (!htmlInput.value) return;
        copyToClipboard(htmlInput.value);
    });

    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            htmlInput.value = ev.target.result;
            updateLineNumbers();
            updateInputStats();
            if (typeof showToast === "function") showToast("📁 File loaded");
        };
        reader.readAsText(file);
        fileInput.value = "";
    });

    downloadBtn.addEventListener("click", () => {
        if (!htmlInput.value) return;
        downloadFile(htmlInput.value, "input.html");
    });

    fullscreenBtn.addEventListener("click", () => {
        htmlCard.classList.toggle("fullscreen");
        const on = htmlCard.classList.contains("fullscreen");
        fullscreenBtn.innerHTML = on
            ? '<i class="fa-solid fa-compress"></i>'
            : '<i class="fa-solid fa-expand"></i>';
    });

    // Indent
    indentBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            indentBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const v = btn.dataset.indent;
            currentIndent = v === "tab" ? "tab" : parseInt(v, 10);
            if (lastResult && lastResult.mode === "format") doFormat();
        });
    });

    // Output tabs
    otTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            otTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            currentView = tab.dataset.view;
            outputViews.forEach((v) => v.classList.toggle("active", v.dataset.view === currentView));
        });
    });

    // Output actions
    copyOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        copyToClipboard(lastResult.text);
    });

    downloadOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        downloadFile(lastResult.text, `${lastResult.mode}-output.html`);
    });

    copyFormattedBtn.addEventListener("click", () => {
        if (!lastResult) return;
        copyToClipboard(lastResult.text);
    });

    downloadFormattedBtn.addEventListener("click", () => {
        if (!lastResult) return;
        downloadFile(lastResult.text, `${lastResult.mode}-output.html`);
    });

    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = `HTML ${lastResult.mode} result (${lastResult.size} bytes)`;
        if (navigator.share) {
            navigator.share({ title: "HTML Result", text, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    openPreviewBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const w = window.open("", "_blank");
        if (w) {
            w.document.write(lastResult.text);
            w.document.close();
        } else {
            if (typeof showToast === "function") showToast("⚠️ Popup blocked", "error");
        }
    });

    // Clear history
    clearHtmlHistory.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    // Keyboard shortcuts
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
    window.shareHtmlFormatter = function () {
        const shareData = {
            title: "HTML Formatter - Tool Hub",
            text: "Format, beautify & minify messy HTML code!",
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
        setStatus("valid", "Ready — paste HTML and click Beautify");
    }

    init();
})();