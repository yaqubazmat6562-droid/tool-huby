/* ============================================================
   CSS FORMATTER - Advanced Logic
   Beautify · Minify · Validate · Preview · Stats
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const cssCard        = document.getElementById("cssCard");
    const cssInput       = document.getElementById("cssInput");
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

    const sortProps      = document.getElementById("sortProps");
    const autoValidate   = document.getElementById("autoValidate");
    const semicolons     = document.getElementById("semicolons");
    const indentBtns     = document.querySelectorAll(".indent-btn");

    const statusBadge    = document.getElementById("statusBadge");
    const statChars      = document.getElementById("statChars");
    const statLines      = document.getElementById("statLines");
    const statRules      = document.getElementById("statRules");

    const outputArea     = document.getElementById("outputArea");
    const otTabs         = document.querySelectorAll(".ot-tab");
    const outputViews    = document.querySelectorAll(".output-view");
    const outputContent  = document.getElementById("outputContent");
    const outputStats    = document.getElementById("outputStats");
    const previewFrame   = document.getElementById("previewFrame");
    const openPreviewBtn = document.getElementById("openPreviewBtn");
    const previewSampleRadios = document.querySelectorAll('input[name="previewSample"]');

    const stRules        = document.getElementById("stRules");
    const stSelectors    = document.getElementById("stSelectors");
    const stProps        = document.getElementById("stProps");
    const stMedia        = document.getElementById("stMedia");
    const stKeyframes    = document.getElementById("stKeyframes");
    const stImports      = document.getElementById("stImports");
    const stMaxDepth     = document.getElementById("stMaxDepth");
    const stSize         = document.getElementById("stSize");
    const propFreqList   = document.getElementById("propFreqList");

    const copyOutputBtn  = document.getElementById("copyOutputBtn");
    const downloadOutputBtn = document.getElementById("downloadOutputBtn");
    const copyFormattedBtn  = document.getElementById("copyFormattedBtn");
    const shareResultBtn    = document.getElementById("shareResultBtn");
    const downloadFormattedBtn = document.getElementById("downloadFormattedBtn");

    const validationArea = document.getElementById("validationArea");
    const vaHeader       = document.getElementById("vaHeader");
    const vaTitle        = document.getElementById("vaTitle");
    const vaBody         = document.getElementById("vaBody");

    const cssHistoryList = document.getElementById("cssHistoryList");
    const clearCssHistory = document.getElementById("clearCssHistory");

    /* ---------------- State ---------------- */
    let currentIndent = 2;
    let lastResult    = null;
    let history       = loadHistory();
    let autoTimer     = null;
    let currentView   = "output";
    let currentPreviewSample = "buttons";

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_cssformatter_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_cssformatter_history", JSON.stringify(history.slice(0, 20)));
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
        const lines = cssInput.value.split("\n").length;
        let out = "";
        for (let i = 1; i <= Math.max(lines, 1); i++) out += i + "\n";
        lineNumbers.textContent = out.trimEnd();
        lineNumbers.scrollTop = cssInput.scrollTop;
    }

    function updateInputStats() {
        const v = cssInput.value;
        statChars.innerHTML = `<i class="fa-solid fa-font"></i> ${v.length.toLocaleString()} chars`;
        statLines.innerHTML = `<i class="fa-solid fa-list-ol"></i> ${v.split("\n").length.toLocaleString()} lines`;
        const ruleCount = (v.match(/\{/g) || []).length;
        statRules.innerHTML = `<i class="fa-solid fa-cube"></i> ${ruleCount.toLocaleString()} rules`;
    }

    /* ============================================================
       CSS PARSER (tokenizer-lite)
       Splits into rules while respecting strings, comments, at-rules.
       ============================================================ */
    function parseCss(source) {
        // Remove comments (keep track separately)
        const comments = [];
        let cleaned = source.replace(/\/\*[\s\S]*?\*\//g, (m) => {
            comments.push(m);
            return "";
        });

        const rules = [];
        let i = 0;
        const n = cleaned.length;

        while (i < n) {
            // Skip whitespace
            while (i < n && /\s/.test(cleaned[i])) i++;
            if (i >= n) break;

            // Read selector/at-rule until { or ; (for @import etc.)
            let selector = "";
            while (i < n && cleaned[i] !== "{" && cleaned[i] !== ";") {
                // Handle strings
                if (cleaned[i] === '"' || cleaned[i] === "'") {
                    const quote = cleaned[i];
                    selector += cleaned[i++];
                    while (i < n && cleaned[i] !== quote) {
                        if (cleaned[i] === "\\") selector += cleaned[i++];
                        if (i < n) selector += cleaned[i++];
                    }
                    if (i < n) selector += cleaned[i++];
                } else {
                    selector += cleaned[i++];
                }
            }

            if (i >= n) {
                if (selector.trim()) {
                    rules.push({ type: "statement", text: selector.trim() });
                }
                break;
            }

            if (cleaned[i] === ";") {
                // @import, @charset, etc.
                rules.push({ type: "statement", text: selector.trim() });
                i++;
                continue;
            }

            if (cleaned[i] === "{") {
                i++; // skip {
                // Read body until matching }
                let body = "";
                let depth = 1;
                while (i < n && depth > 0) {
                    const c = cleaned[i];
                    if (c === '"' || c === "'") {
                        const quote = c;
                        body += c;
                        i++;
                        while (i < n && cleaned[i] !== quote) {
                            if (cleaned[i] === "\\") body += cleaned[i++];
                            if (i < n) body += cleaned[i++];
                        }
                        if (i < n) body += cleaned[i++];
                        continue;
                    }
                    if (c === "{") depth++;
                    if (c === "}") {
                        depth--;
                        if (depth === 0) {
                            i++;
                            break;
                        }
                    }
                    body += c;
                    i++;
                }

                const sel = selector.trim();
                if (sel.startsWith("@media") ||
                    sel.startsWith("@supports") ||
                    sel.startsWith("@keyframes") ||
                    sel.startsWith("@-webkit-keyframes") ||
                    sel.startsWith("@font-face") ||
                    sel.startsWith("@page") ||
                    sel.startsWith("@layer") ||
                    sel.startsWith("@container")) {
                    rules.push({ type: "at-rule", selector: sel, body });
                } else {
                    rules.push({ type: "rule", selector: sel, body });
                }
            }
        }

        return { rules, comments };
    }

    /* ============================================================
       PROPERTY PARSER
       Parses "prop: value; prop2: value2" into [{name, value}]
       ============================================================ */
    function parseProperties(body) {
        const props = [];
        let i = 0;
        const n = body.length;

        while (i < n) {
            // Skip whitespace & semicolons
            while (i < n && /[\s;]/.test(body[i])) i++;
            if (i >= n) break;

            // Read property name
            let name = "";
            while (i < n && body[i] !== ":" && body[i] !== "{" && body[i] !== "}") {
                name += body[i++];
            }
            name = name.trim();

            if (i >= n || body[i] !== ":") {
                // Nested rule or malformed
                if (name) props.push({ name, value: "", raw: name });
                continue;
            }
            i++; // skip :

            // Read value until ; or end (respect parens, quotes)
            let value = "";
            let parenDepth = 0;
            while (i < n) {
                const c = body[i];
                if (c === '"' || c === "'") {
                    const quote = c;
                    value += c;
                    i++;
                    while (i < n && body[i] !== quote) {
                        if (body[i] === "\\") value += body[i++];
                        if (i < n) value += body[i++];
                    }
                    if (i < n) value += body[i++];
                    continue;
                }
                if (c === "(") parenDepth++;
                if (c === ")") parenDepth--;
                if (c === ";" && parenDepth === 0) {
                    i++;
                    break;
                }
                value += c;
                i++;
            }

            if (name) props.push({ name, value: value.trim() });
        }

        return props;
    }

    /* ============================================================
       BEAUTIFY
       ============================================================ */
    function beautifyCss(source) {
        const { rules } = parseCss(source);
        const indentStr = getIndentStr();
        const out = [];
        const doSortProps = sortProps.checked;
        const addSemicolons = semicolons.checked;

        for (const rule of rules) {
            if (rule.type === "statement") {
                out.push(rule.text + ";");
                out.push("");
                continue;
            }

            if (rule.type === "rule") {
                // Selectors, one per line if comma-separated
                const selectors = rule.selector
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                selectors.forEach((sel, idx) => {
                    out.push((idx === 0 ? "" : indentStr) + sel + (idx < selectors.length - 1 ? "," : " {"));
                });
                if (selectors.length === 1) {
                    out[out.length - 1] = selectors[0] + " {";
                }

                let props = parseProperties(rule.body);
                if (doSortProps) {
                    props = props.slice().sort((a, b) => a.name.localeCompare(b.name));
                }
                props.forEach((p) => {
                    const val = p.value.replace(/\s+/g, " ");
                    out.push(indentStr + p.name + ": " + val + (addSemicolons ? ";" : ";"));
                });
                out.push("}");
                out.push("");
                continue;
            }

            if (rule.type === "at-rule") {
                out.push(rule.selector + " {");
                // Parse body for nested rules OR properties
                const inner = parseCss(rule.body);
                if (inner.rules.length > 0 && (rule.body.includes("{") || rule.body.includes("}"))) {
                    // Nested rules (e.g., @media, @keyframes)
                    inner.rules.forEach((r) => {
                        if (r.type === "rule") {
                            out.push(indentStr + r.selector + " {");
                            let props = parseProperties(r.body);
                            if (doSortProps) {
                                props = props.slice().sort((a, b) => a.name.localeCompare(b.name));
                            }
                            props.forEach((p) => {
                                const val = p.value.replace(/\s+/g, " ");
                                out.push(indentStr + indentStr + p.name + ": " + val + ";");
                            });
                            out.push(indentStr + "}");
                        } else if (r.type === "statement") {
                            out.push(indentStr + r.text + ";");
                        } else if (r.type === "at-rule") {
                            out.push(indentStr + r.selector + " {");
                            const deepInner = parseCss(r.body);
                            deepInner.rules.forEach((dr) => {
                                if (dr.type === "rule") {
                                    out.push(indentStr + indentStr + dr.selector + " {");
                                    let props = parseProperties(dr.body);
                                    props.forEach((p) => {
                                        out.push(indentStr + indentStr + indentStr + p.name + ": " + p.value.replace(/\s+/g, " ") + ";");
                                    });
                                    out.push(indentStr + indentStr + "}");
                                }
                            });
                            out.push(indentStr + "}");
                        }
                    });
                } else {
                    // Properties directly in @font-face etc.
                    let props = parseProperties(rule.body);
                    if (doSortProps) {
                        props = props.slice().sort((a, b) => a.name.localeCompare(b.name));
                    }
                    props.forEach((p) => {
                        const val = p.value.replace(/\s+/g, " ");
                        out.push(indentStr + p.name + ": " + val + ";");
                    });
                }
                out.push("}");
                out.push("");
                continue;
            }
        }

        // Remove trailing blank line
        while (out.length > 0 && out[out.length - 1] === "") out.pop();

        return out.join("\n");
    }

    /* ============================================================
       MINIFY
       ============================================================ */
    function minifyCss(source) {
        // Remove comments
        let out = source.replace(/\/\*[\s\S]*?\*\//g, "");
        // Collapse whitespace
        out = out.replace(/\s+/g, " ");
        // Remove spaces around symbols
        out = out.replace(/\s*([{}:;,>~+])\s*/g, "$1");
        // Remove last semicolon in blocks
        out = out.replace(/;}/g, "}");
        // Remove leading/trailing
        out = out.trim();
        return out;
    }

    /* ============================================================
       ANALYZE (STATS)
       ============================================================ */
    function analyzeCss(source) {
        const { rules } = parseCss(source);
        const stats = {
            rules: 0,
            selectors: 0,
            properties: 0,
            media: 0,
            keyframes: 0,
            imports: 0,
            maxDepth: 0,
            size: new Blob([source]).size,
        };
        const propFreq = {};

        function walk(rules, depth) {
            stats.maxDepth = Math.max(stats.maxDepth, depth);
            rules.forEach((r) => {
                if (r.type === "statement") {
                    if (r.text.startsWith("@import")) stats.imports++;
                    return;
                }
                if (r.type === "at-rule") {
                    if (r.selector.startsWith("@media")) stats.media++;
                    if (r.selector.startsWith("@keyframes") || r.selector.startsWith("@-webkit-keyframes")) stats.keyframes++;
                    stats.rules++;
                    const inner = parseCss(r.body);
                    walk(inner.rules, depth + 1);
                    return;
                }
                if (r.type === "rule") {
                    stats.rules++;
                    stats.selectors += r.selector.split(",").length;
                    const props = parseProperties(r.body);
                    props.forEach((p) => {
                        stats.properties++;
                        propFreq[p.name] = (propFreq[p.name] || 0) + 1;
                    });
                }
            });
        }
        walk(rules, 1);

        return { stats, propFreq };
    }

    function renderStats(source) {
        const { stats, propFreq } = analyzeCss(source);

        stRules.textContent     = stats.rules.toLocaleString();
        stSelectors.textContent = stats.selectors.toLocaleString();
        stProps.textContent     = stats.properties.toLocaleString();
        stMedia.textContent     = stats.media.toLocaleString();
        stKeyframes.textContent = stats.keyframes.toLocaleString();
        stImports.textContent   = stats.imports.toLocaleString();
        stMaxDepth.textContent  = stats.maxDepth.toLocaleString();
        stSize.textContent      = formatBytes(stats.size);

        const sorted = Object.entries(propFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sorted.length === 0) {
            propFreqList.innerHTML = '<div class="empty-history">No properties found</div>';
            return;
        }
        const max = sorted[0][1];
        propFreqList.innerHTML = sorted.map(([name, count]) => {
            const pct = (count / max) * 100;
            return `
                <div class="tf-item">
                    <span class="tf-name">${escapeHtml(name)}</span>
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
    function validateCss(source) {
        const issues = [];
        const { rules } = parseCss(source);

        // Check brace balance (raw scan)
        let depth = 0;
        let inStr = null;
        let line = 1;
        let errorLine = -1;

        for (let i = 0; i < source.length; i++) {
            const c = source[i];
            if (c === "\n") line++;
            if (inStr) {
                if (c === "\\") i++;
                else if (c === inStr) inStr = null;
                continue;
            }
            if (c === '"' || c === "'") inStr = c;
            else if (c === "{") depth++;
            else if (c === "}") {
                depth--;
                if (depth < 0 && errorLine === -1) {
                    errorLine = line;
                }
            }
        }

        if (depth > 0) {
            issues.push({ level: "error", text: `Missing ${depth} closing brace(s) — unclosed block` });
        }
        if (depth < 0) {
            issues.push({ level: "error", text: `Extra closing brace(s) found — line ${errorLine}` });
        }

        // Check rules
        rules.forEach((r) => {
            if (r.type === "rule" || r.type === "at-rule") {
                const props = parseProperties(r.body);
                props.forEach((p) => {
                    if (!p.name) return;
                    if (!/^[-a-zA-Z_][-a-zA-Z0-9_]*$/.test(p.name) && !p.name.startsWith("--")) {
                        if (!p.name.startsWith("@")) {
                            issues.push({
                                level: "warn",
                                text: `Suspicious property name: "${p.name}" in "${r.selector}"`,
                            });
                        }
                    }
                    if (p.value === "" && p.name) {
                        issues.push({
                            level: "warn",
                            text: `Property "${p.name}" has no value in "${r.selector}"`,
                        });
                    }
                });
            }
        });

        // Duplicate selector check
        const seen = {};
        rules.forEach((r) => {
            if (r.type === "rule") {
                const key = r.selector.trim();
                if (seen[key]) {
                    issues.push({ level: "info", text: `Duplicate selector: "${key}"` });
                }
                seen[key] = true;
            }
        });

        if (issues.length === 0) {
            issues.push({ level: "pass", text: "CSS structure is balanced — no obvious issues found." });
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
       PREVIEW HTML SAMPLES
       ============================================================ */
    function getPreviewHtml(sample) {
        const baseStyle = `<style>body{font-family:system-ui,sans-serif;padding:20px;margin:0;background:#f8fafc;color:#1e293b;}h1{font-size:1.5rem;margin:0 0 16px;}</style>`;
        switch (sample) {
            case "buttons":
                return baseStyle + `<h1>Buttons</h1>
                    <button class="btn primary">Primary Button</button>
                    <button class="btn secondary">Secondary</button>
                    <button class="btn outline">Outline</button>
                    <button class="btn" disabled>Disabled</button>
                    <a href="#" class="btn link">Link Button</a>`;
            case "cards":
                return baseStyle + `<h1>Cards</h1>
                    <div class="cards">
                        <div class="card"><h3>Card One</h3><p>Some description text here for the card.</p></div>
                        <div class="card"><h3>Card Two</h3><p>Another card with slightly different content.</p></div>
                        <div class="card highlight"><h3>Highlighted</h3><p>This card has a special highlight class.</p></div>
                    </div>`;
            case "typography":
                return baseStyle + `<h1>Typography</h1>
                    <h2>Heading Level 2</h2>
                    <h3>Heading Level 3</h3>
                    <p>This is a regular paragraph. <strong>Bold text</strong> and <em>italic text</em> with a <a href="#">link</a> inside.</p>
                    <blockquote>This is a blockquote with some quoted content.</blockquote>
                    <p class="lead">This is a lead paragraph with larger font size.</p>
                    <ul><li>List item one</li><li>List item two</li><li>List item three</li></ul>`;
            case "form":
                return baseStyle + `<h1>Form</h1>
                    <form class="form">
                        <label>Name<input type="text" placeholder="Your name"></label>
                        <label>Email<input type="email" placeholder="you@example.com"></label>
                        <label>Message<textarea rows="3" placeholder="Your message..."></textarea></label>
                        <label class="checkbox"><input type="checkbox"> Subscribe to newsletter</label>
                        <button type="button" class="btn primary">Submit</button>
                    </form>`;
        }
        return baseStyle + "<p>Preview</p>";
    }

    /* ============================================================
       SHOW OUTPUT
       ============================================================ */
    function showOutput(content, mode) {
        outputArea.style.display = "block";
        outputContent.textContent = content;

        const bytes = new Blob([content]).size;
        outputStats.textContent = `${content.length.toLocaleString()} chars · ${formatBytes(bytes)}`;

        // Preview
        const previewHtml = getPreviewHtml(currentPreviewSample);
        previewFrame.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${content}</style></head><body>${previewHtml.replace(/<\/?style>.*?<\/style>/, "")}</body></html>`;

        // Stats
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
        const src = cssInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter CSS first", "error");
            return;
        }
        setStatus("checking", "Formatting…");
        try {
            const out = beautifyCss(src);
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
        const src = cssInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter CSS first", "error");
            return;
        }
        setStatus("checking", "Minifying…");
        try {
            const out = minifyCss(src);
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
        const src = cssInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter CSS first", "error");
            return;
        }
        setStatus("checking", "Validating…");
        try {
            const issues = validateCss(src);
            const hasError = issues.some((i) => i.level === "error");
            setStatus(hasError ? "invalid" : "valid", hasError ? "Validation issues" : "Valid CSS");
            renderValidation(issues);
            pushHistory("validate", src, issues.length + " issue(s)");
            if (typeof showToast === "function") showToast(hasError ? "⚠️ Issues found" : "✅ Valid CSS");
        } catch (e) {
            setStatus("invalid", "Validation failed");
            if (typeof showToast === "function") showToast("❌ " + e.message, "error");
        }
    }

    /* ============================================================
       SAMPLE
       ============================================================ */
    function loadSample() {
        const sample = `/* Main styles */
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,sans-serif;line-height:1.6;color:#333;background:#f5f5f5}
.btn{display:inline-block;padding:10px 20px;border-radius:6px;font-weight:600;text-decoration:none;border:none;cursor:pointer;transition:all .2s ease}
.btn.primary{background:#2965f1;color:#fff}
.btn.primary:hover{background:#1e4fd8;transform:translateY(-2px)}
.btn.secondary{background:#64748b;color:#fff}
.btn.outline{background:transparent;border:2px solid #2965f1;color:#2965f1}
.btn:disabled{opacity:.5;cursor:not-allowed}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:20px}
.card{background:#fff;padding:20px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);transition:transform .2s}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 20px rgba(0,0,0,.12)}
.card.highlight{border:2px solid #2965f1;background:linear-gradient(135deg,#eef2ff,#fff)}
@media (max-width:600px){.cards{grid-template-columns:1fr}.btn{width:100%;text-align:center}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.lead{font-size:1.15rem;color:#475569}
blockquote{border-left:4px solid #2965f1;padding:12px 20px;background:#f1f5f9;font-style:italic}`;
        cssInput.value = sample;
        updateLineNumbers();
        updateInputStats();
        doFormat();
        if (typeof showToast === "function") showToast("🧪 Sample loaded");
    }

    /* ============================================================
       CLEAR
       ============================================================ */
    function clearAll() {
        if (cssInput.value && !confirm("Clear all content?")) return;
        cssInput.value = "";
        updateLineNumbers();
        updateInputStats();
        outputArea.style.display = "none";
        validationArea.style.display = "none";
        setStatus("valid", "Ready — paste CSS and click Beautify");
        lastResult = null;
        if (typeof showToast === "function") showToast("🧹 Cleared");
    }

    /* ============================================================
       COPY / DOWNLOAD
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
        const blob = new Blob([content], { type: "text/css" });
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
            cssHistoryList.innerHTML = '<div class="empty-history">No actions yet</div>';
            return;
        }
        cssHistoryList.innerHTML = history.map((h, i) => `
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

        cssHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                if (h.inputFull) {
                    cssInput.value = h.inputFull;
                    updateLineNumbers();
                    updateInputStats();
                    if (h.mode === "format") doFormat();
                    else if (h.mode === "minify") doMinify();
                    else if (h.mode === "validate") doValidate();
                } else {
                    if (typeof showToast === "function") showToast("⚠️ Entry too large");
                }
            });
        });
    }

    /* ============================================================
       EVENT LISTENERS
       ============================================================ */
    cssInput.addEventListener("input", () => {
        updateLineNumbers();
        updateInputStats();
        if (autoValidate.checked) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
                if (cssInput.value.trim()) {
                    const issues = validateCss(cssInput.value);
                    const hasError = issues.some((i) => i.level === "error");
                    setStatus(hasError ? "invalid" : "valid", hasError ? "Validation issues" : "Valid CSS");
                }
            }, 800);
        }
    });

    cssInput.addEventListener("scroll", () => {
        lineNumbers.scrollTop = cssInput.scrollTop;
    });

    cssInput.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = cssInput.selectionStart;
            const end = cssInput.selectionEnd;
            cssInput.value = cssInput.value.substring(0, start) + "  " + cssInput.value.substring(end);
            cssInput.selectionStart = cssInput.selectionEnd = start + 2;
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
            cssInput.value = text;
            updateLineNumbers();
            updateInputStats();
            if (typeof showToast === "function") showToast("📋 Pasted");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    copyInputBtn.addEventListener("click", () => {
        if (!cssInput.value) return;
        copyToClipboard(cssInput.value);
    });

    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            cssInput.value = ev.target.result;
            updateLineNumbers();
            updateInputStats();
            if (typeof showToast === "function") showToast("📁 File loaded");
        };
        reader.readAsText(file);
        fileInput.value = "";
    });

    downloadBtn.addEventListener("click", () => {
        if (!cssInput.value) return;
        downloadFile(cssInput.value, "input.css");
    });

    fullscreenBtn.addEventListener("click", () => {
        cssCard.classList.toggle("fullscreen");
        const on = cssCard.classList.contains("fullscreen");
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

    // Option changes re-run format if output visible
    sortProps.addEventListener("change", () => {
        if (lastResult && lastResult.mode === "format") doFormat();
    });
    semicolons.addEventListener("change", () => {
        if (lastResult && lastResult.mode === "format") doFormat();
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

    // Preview sample
    previewSampleRadios.forEach((r) => {
        r.addEventListener("change", () => {
            if (r.checked) {
                currentPreviewSample = r.value;
                if (lastResult) {
                    const previewHtml = getPreviewHtml(currentPreviewSample);
                    previewFrame.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${lastResult.text}</style></head><body>${previewHtml.replace(/<\/?style>.*?<\/style>/, "")}</body></html>`;
                }
            }
        });
    });

    // Output actions
    copyOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        copyToClipboard(lastResult.text);
    });

    downloadOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        downloadFile(lastResult.text, `${lastResult.mode}-output.css`);
    });

    copyFormattedBtn.addEventListener("click", () => {
        if (!lastResult) return;
        copyToClipboard(lastResult.text);
    });

    downloadFormattedBtn.addEventListener("click", () => {
        if (!lastResult) return;
        downloadFile(lastResult.text, `${lastResult.mode}-output.css`);
    });

    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = `CSS ${lastResult.mode} result (${lastResult.size} bytes)`;
        if (navigator.share) {
            navigator.share({ title: "CSS Result", text, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    openPreviewBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const previewHtml = getPreviewHtml(currentPreviewSample);
        const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${lastResult.text}</style></head><body>${previewHtml.replace(/<\/?style>.*?<\/style>/, "")}</body></html>`;
        const w = window.open("", "_blank");
        if (w) {
            w.document.write(full);
            w.document.close();
        } else {
            if (typeof showToast === "function") showToast("⚠️ Popup blocked", "error");
        }
    });

    // Clear history
    clearCssHistory.addEventListener("click", () => {
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
    window.shareCssFormatter = function () {
        const shareData = {
            title: "CSS Formatter - Tool Hub",
            text: "Format, beautify & minify CSS stylesheets!",
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
        setStatus("valid", "Ready — paste CSS and click Beautify");
    }

    init();
})();