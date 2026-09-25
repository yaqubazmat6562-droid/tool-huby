/* ============================================================
   JAVASCRIPT MINIFIER - Advanced Logic
   Minify · Beautify · Validate · Mangle · Stats · Diff
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const jsCard         = document.getElementById("jsCard");
    const jsInput        = document.getElementById("jsInput");
    const lineNumbers    = document.getElementById("lineNumbers");
    const fileInput      = document.getElementById("fileInput");

    const minifyBtn      = document.getElementById("minifyBtn");
    const beautifyBtn    = document.getElementById("beautifyBtn");
    const validateBtn    = document.getElementById("validateBtn");
    const sampleBtn      = document.getElementById("sampleBtn");
    const clearBtn       = document.getElementById("clearBtn");

    const pasteBtn       = document.getElementById("pasteBtn");
    const copyInputBtn   = document.getElementById("copyInputBtn");
    const uploadBtn      = document.getElementById("uploadBtn");
    const downloadBtn    = document.getElementById("downloadBtn");
    const fullscreenBtn  = document.getElementById("fullscreenBtn");

    const mangleVars     = document.getElementById("mangleVars");
    const removeComments = document.getElementById("removeComments");
    const removeConsole  = document.getElementById("removeConsole");
    const autoValidate   = document.getElementById("autoValidate");
    const indentBtns     = document.querySelectorAll(".indent-btn");

    const statusBadge    = document.getElementById("statusBadge");
    const statChars      = document.getElementById("statChars");
    const statLines      = document.getElementById("statLines");
    const statFunctions  = document.getElementById("statFunctions");

    const outputArea     = document.getElementById("outputArea");
    const otTabs         = document.querySelectorAll(".ot-tab");
    const outputViews    = document.querySelectorAll(".output-view");
    const outputContent  = document.getElementById("outputContent");
    const outputStats    = document.getElementById("outputStats");

    const stFunctions    = document.getElementById("stFunctions");
    const stVars         = document.getElementById("stVars");
    const stComments     = document.getElementById("stComments");
    const stStrings      = document.getElementById("stStrings");
    const stNumbers      = document.getElementById("stNumbers");
    const stLines        = document.getElementById("stLines");
    const stSize         = document.getElementById("stSize");
    const stRatio        = document.getElementById("stRatio");
    const kwFreqList     = document.getElementById("kwFreqList");

    const diffOriginalBar = document.getElementById("diffOriginalBar");
    const diffOriginalVal = document.getElementById("diffOriginalVal");
    const diffMinifiedBar = document.getElementById("diffMinifiedBar");
    const diffMinifiedVal = document.getElementById("diffMinifiedVal");
    const diffSummary     = document.getElementById("diffSummary");

    const copyOutputBtn  = document.getElementById("copyOutputBtn");
    const downloadOutputBtn = document.getElementById("downloadOutputBtn");
    const copyFormattedBtn  = document.getElementById("copyFormattedBtn");
    const shareResultBtn    = document.getElementById("shareResultBtn");
    const downloadFormattedBtn = document.getElementById("downloadFormattedBtn");

    const validationArea = document.getElementById("validationArea");
    const vaHeader       = document.getElementById("vaHeader");
    const vaTitle        = document.getElementById("vaTitle");
    const vaBody         = document.getElementById("vaBody");

    const jsHistoryList  = document.getElementById("jsHistoryList");
    const clearJsHistory = document.getElementById("clearJsHistory");

    /* ---------------- Constants ---------------- */
    const JS_KEYWORDS = [
        "break","case","catch","class","const","continue","debugger","default",
        "delete","do","else","export","extends","finally","for","function","if",
        "import","in","instanceof","new","return","super","switch","this","throw",
        "try","typeof","var","void","while","with","yield","let","static","async",
        "await","of","get","set"
    ];

    /* ---------------- State ---------------- */
    let currentIndent = 2;
    let lastResult    = null;
    let lastInputSize = 0;
    let history       = loadHistory();
    let autoTimer     = null;
    let currentView   = "output";

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_jsminifier_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_jsminifier_history", JSON.stringify(history.slice(0, 20)));
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
        const lines = jsInput.value.split("\n").length;
        let out = "";
        for (let i = 1; i <= Math.max(lines, 1); i++) out += i + "\n";
        lineNumbers.textContent = out.trimEnd();
        lineNumbers.scrollTop = jsInput.scrollTop;
    }

    function updateInputStats() {
        const v = jsInput.value;
        statChars.innerHTML = `<i class="fa-solid fa-font"></i> ${v.length.toLocaleString()} chars`;
        statLines.innerHTML = `<i class="fa-solid fa-list-ol"></i> ${v.split("\n").length.toLocaleString()} lines`;
        const fnCount = (v.match(/\bfunction\b/g) || []).length + (v.match(/=>/g) || []).length;
        statFunctions.innerHTML = `<i class="fa-solid fa-code"></i> ${fnCount.toLocaleString()} functions`;
    }

    /* ============================================================
       TOKENIZER (for minify)
       Produces tokens: { type, value }
       types: string, template, regex, comment-line, comment-block,
              ident, number, punct, whitespace, keyword
       ============================================================ */
    function tokenizeJs(src) {
        const tokens = [];
        let i = 0;
        const n = src.length;
        let lastMeaningful = null;

        function push(type, value) {
            tokens.push({ type, value });
            if (type !== "whitespace" && type !== "comment-line" && type !== "comment-block") {
                lastMeaningful = type;
            }
        }

        while (i < n) {
            const c = src[i];

            // Whitespace
            if (/\s/.test(c)) {
                let ws = "";
                while (i < n && /\s/.test(src[i])) ws += src[i++];
                push("whitespace", ws);
                continue;
            }

            // Line comment
            if (c === "/" && src[i + 1] === "/") {
                let cm = "//";
                i += 2;
                while (i < n && src[i] !== "\n") cm += src[i++];
                push("comment-line", cm);
                continue;
            }

            // Block comment
            if (c === "/" && src[i + 1] === "*") {
                let cm = "/*";
                i += 2;
                while (i < n && !(src[i] === "*" && src[i + 1] === "/")) cm += src[i++];
                cm += "*/";
                i += 2;
                push("comment-block", cm);
                continue;
            }

            // Regex literal — only if previous meaningful token is not identifier/number/)/]
            const canBeRegex = !lastMeaningful ||
                !["ident", "number", "punct", "string", "template"].includes(lastMeaningful) ||
                (tokens.length > 0 && ["ident", "number"].includes(lastMeaningful));

            // Actually, regex can follow ( , = : [ ! & | ? { } ; return typeof etc.
            // Simplify: if previous meaningful token is ident/number/string/template/)/] -> division
            const prevToken = tokens.slice().reverse().find(
                (t) => t.type !== "whitespace" && t.type !== "comment-line" && t.type !== "comment-block"
            );
            const prevIsValueLike = prevToken && (
                prevToken.type === "ident" ||
                prevToken.type === "number" ||
                prevToken.type === "string" ||
                prevToken.type === "template" ||
                prevToken.type === "regex" ||
                (prevToken.type === "punct" && [")", "]", "}", "++", "--"].includes(prevToken.value))
            );

            if (c === "/" && !prevIsValueLike) {
                // Try parse regex
                let rx = "/";
                i++;
                let inClass = false;
                let isValid = false;
                while (i < n) {
                    const ch = src[i];
                    if (ch === "\\") {
                        rx += ch + (src[i + 1] || "");
                        i += 2;
                        continue;
                    }
                    if (ch === "[") inClass = true;
                    else if (ch === "]") inClass = false;
                    else if (ch === "/" && !inClass) {
                        rx += ch;
                        i++;
                        isValid = true;
                        break;
                    } else if (ch === "\n") {
                        break;
                    }
                    rx += ch;
                    i++;
                }
                if (isValid) {
                    // Read flags
                    while (i < n && /[a-z]/i.test(src[i])) rx += src[i++];
                    push("regex", rx);
                    continue;
                } else {
                    // Not a valid regex, treat as punct
                    push("punct", "/");
                    continue;
                }
            }

            // String
            if (c === '"' || c === "'") {
                const quote = c;
                let str = c;
                i++;
                while (i < n) {
                    const ch = src[i];
                    if (ch === "\\") {
                        str += ch + (src[i + 1] || "");
                        i += 2;
                        continue;
                    }
                    str += ch;
                    i++;
                    if (ch === quote) break;
                }
                push("string", str);
                continue;
            }

            // Template literal
            if (c === "`") {
                let tpl = "`";
                i++;
                let depth = 0;
                while (i < n) {
                    const ch = src[i];
                    if (ch === "\\") {
                        tpl += ch + (src[i + 1] || "");
                        i += 2;
                        continue;
                    }
                    if (ch === "`" && depth === 0) {
                        tpl += ch;
                        i++;
                        break;
                    }
                    if (ch === "$" && src[i + 1] === "{") {
                        depth++;
                        tpl += "${";
                        i += 2;
                        continue;
                    }
                    if (ch === "}" && depth > 0) {
                        depth--;
                        tpl += ch;
                        i++;
                        continue;
                    }
                    tpl += ch;
                    i++;
                }
                push("template", tpl);
                continue;
            }

            // Number (hex, bin, oct, dec, float, exponent)
            if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1]))) {
                let num = "";
                // Hex / bin / oct prefix
                if (c === "0" && /[xXbBoO]/.test(src[i + 1])) {
                    num += src[i++];
                    num += src[i++];
                    while (i < n && /[0-9a-fA-F_]/.test(src[i])) num += src[i++];
                } else {
                    while (i < n && /[0-9_]/.test(src[i])) num += src[i++];
                    if (src[i] === ".") {
                        num += src[i++];
                        while (i < n && /[0-9_]/.test(src[i])) num += src[i++];
                    }
                    if (/[eE]/.test(src[i])) {
                        num += src[i++];
                        if (/[+-]/.test(src[i])) num += src[i++];
                        while (i < n && /[0-9]/.test(src[i])) num += src[i++];
                    }
                }
                // BigInt suffix
                if (src[i] === "n") num += src[i++];
                push("number", num);
                continue;
            }

            // Identifier / keyword
            if (/[a-zA-Z_$]/.test(c) || c === "\\") {
                let id = "";
                while (i < n && /[a-zA-Z0-9_$\\]/.test(src[i])) id += src[i++];
                const type = JS_KEYWORDS.includes(id) ? "keyword" : "ident";
                push(type, id);
                continue;
            }

            // Punctuation (multi-char first)
            const multiPunct = [
                "===","!==","**=","<<=",">>=",">>>","...","===","**","++","--",
                "+=","-=","*=","/=","%=","&=","|=","^=","<<",">>",">>>","==","!=",
                "<=",">=","&&","||","??","?.","=>","::"
            ];
            let matched = false;
            for (const mp of multiPunct) {
                if (src.startsWith(mp, i)) {
                    push("punct", mp);
                    i += mp.length;
                    matched = true;
                    break;
                }
            }
            if (matched) continue;

            push("punct", c);
            i++;
        }

        return tokens;
    }

    /* ============================================================
       MINIFY (safe token-based)
       ============================================================ */
    function minifyJs(src) {
        const tokens = tokenizeJs(src);
        const doRemoveComments = removeComments.checked;
        const doRemoveConsole = removeConsole.checked;

        let out = "";
        let prevToken = null;

        // For console.* removal — track state
        let consoleSkip = 0; // paren depth we are in if removing console.X(...)

        for (let idx = 0; idx < tokens.length; idx++) {
            const tok = tokens[idx];

            // Comments
            if (tok.type === "comment-line" || tok.type === "comment-block") {
                if (!doRemoveComments) {
                    // Preserve with a space separator
                    out += tok.value;
                    // Ensure newline after line comment
                    if (tok.type === "comment-line") out += "\n";
                } else {
                    // Preserve important comments like /*! ... */
                    if (tok.type === "comment-block" && tok.value.startsWith("/*!")) {
                        out += tok.value;
                    }
                }
                continue;
            }

            // Whitespace — decide whether to emit a single space
            if (tok.type === "whitespace") {
                if (!prevToken) continue;

                // Next non-ws token
                let next = null;
                for (let k = idx + 1; k < tokens.length; k++) {
                    if (tokens[k].type !== "whitespace" &&
                        tokens[k].type !== "comment-line" &&
                        tokens[k].type !== "comment-block") {
                        next = tokens[k];
                        break;
                    }
                }
                if (!next) continue;

                // Space needed between ident/keyword/number/string and ident/keyword/number
                const needsSpace =
                    (["ident","keyword","number"].includes(prevToken.type) &&
                     ["ident","keyword","number"].includes(next.type)) ||
                    (["ident","keyword"].includes(prevToken.type) &&
                     ["string","template","regex"].includes(next.type)) ||
                    (prevToken.type === "keyword" && next.type === "punct" && next.value === "{" && prevToken.value === "return") ||
                    // After regex before identifier (rare)
                    (prevToken.type === "regex" && ["ident","keyword"].includes(next.type));

                if (needsSpace) out += " ";
                continue;
            }

            // Remove console.* if option enabled
            if (doRemoveConsole && tok.type === "ident" && tok.value === "console") {
                // Look ahead: .ident( — start skip
                let k = idx + 1;
                // skip whitespace
                while (k < tokens.length && tokens[k].type === "whitespace") k++;
                if (k < tokens.length && tokens[k].type === "punct" && tokens[k].value === ".") {
                    k++;
                    while (k < tokens.length && tokens[k].type === "whitespace") k++;
                    if (k < tokens.length && tokens[k].type === "ident") {
                        k++;
                        while (k < tokens.length && tokens[k].type === "whitespace") k++;
                        if (k < tokens.length && tokens[k].type === "punct" && tokens[k].value === "(") {
                            // Skip until matching )
                            let depth = 1;
                            k++;
                            while (k < tokens.length && depth > 0) {
                                if (tokens[k].type === "punct") {
                                    if (tokens[k].value === "(") depth++;
                                    else if (tokens[k].value === ")") depth--;
                                }
                                k++;
                            }
                            // Skip trailing ;
                            while (k < tokens.length && tokens[k].type === "whitespace") k++;
                            if (k < tokens.length && tokens[k].type === "punct" && tokens[k].value === ";") {
                                k++;
                            }
                            idx = k - 1;
                            continue;
                        }
                    }
                }
            }

            // Emit token
            out += tok.value;
            prevToken = tok;
        }

        // Remove trailing ;
        out = out.replace(/;+$/, "");
        return out;
    }

    /* ============================================================
       BEAUTIFY (basic pretty printer)
       ============================================================ */
    function beautifyJs(src) {
        const tokens = tokenizeJs(src);
        const indentStr = getIndentStr();
        let out = "";
        let depth = 0;
        let lineStart = true;
        let lastEmitted = null;

        function write(str) {
            if (lineStart) {
                out += indentStr.repeat(depth);
                lineStart = false;
            }
            out += str;
        }
        function newline() {
            out += "\n";
            lineStart = true;
        }

        // Remove whitespace tokens; keep only meaningful ones.
        const meaningful = tokens.filter((t) =>
            t.type !== "whitespace" && t.type !== "comment-line" && t.type !== "comment-block"
        );
        const comments = tokens.filter((t) => t.type === "comment-line" || t.type === "comment-block");

        // We'll iterate meaningful tokens but also need semicolon detection.
        let pendingSemis = 0;

        for (let i = 0; i < meaningful.length; i++) {
            const t = meaningful[i];
            const next = meaningful[i + 1];

            if (t.type === "punct") {
                const v = t.value;

                if (v === "{") {
                    write("{");
                    newline();
                    depth++;
                    lastEmitted = "{";
                    continue;
                }
                if (v === "}") {
                    // Close pending semicolon line first
                    if (!lineStart) newline();
                    depth = Math.max(0, depth - 1);
                    write("}");
                    // Decide if next needs newline or space
                    if (next && [";", ",", ")", "]", "}", "."].includes(next.value)) {
                        lastEmitted = "}";
                        continue;
                    }
                    newline();
                    lastEmitted = "}";
                    continue;
                }
                if (v === ";") {
                    write(";");
                    // If next is } -> newline is handled there
                    if (next && next.value === "}") {
                        newline();
                    } else {
                        newline();
                    }
                    lastEmitted = ";";
                    continue;
                }
                if (v === ",") {
                    write(", ");
                    lastEmitted = ",";
                    continue;
                }
                if (v === ".") {
                    write(".");
                    lastEmitted = ".";
                    continue;
                }
                if (v === "(" || v === "[") {
                    write(v);
                    lastEmitted = v;
                    continue;
                }
                if (v === ")" || v === "]") {
                    write(v);
                    lastEmitted = v;
                    continue;
                }
                if (["+","-","*","/","%","=","<",">","!","&","|","^","?"].includes(v) ||
                    ["==","===","!=","!==","<=",">=","&&","||","??","=>","+=","-=","*=","/=","%=","++","--","**"].includes(v)) {
                    // Space around operators (except postfix ++/--)
                    const isPostfix = (v === "++" || v === "--") && lastEmitted && (
                        lastEmitted.type === "ident" || lastEmitted.type === "number" || lastEmitted.type === "keyword" ||
                        ["]", ")"].includes(lastEmitted.value || lastEmitted)
                    );
                    if (isPostfix) {
                        write(v);
                    } else if (v === "=>") {
                        write(" => ");
                    } else {
                        write(" " + v + " ");
                    }
                    lastEmitted = { type: "punct", value: v };
                    continue;
                }

                // Default
                write(v);
                lastEmitted = v;
                continue;
            }

            // Identifier / keyword / number / string / template / regex
            // Space before if last was ident/keyword/number
            if (lastEmitted && (
                (typeof lastEmitted === "object" &&
                 ["ident","keyword","number"].includes(lastEmitted.type)) ||
                (typeof lastEmitted === "string" && ["ident","keyword","number"].includes(lastEmitted))
            )) {
                if (["ident","keyword","number","string","regex","template"].includes(t.type)) {
                    write(" ");
                }
            }
            write(t.value);
            lastEmitted = t;
        }

        // Ensure final newline
        if (!lineStart) newline();

        return out;
    }

    /* ============================================================
       ANALYZE (STATS)
       ============================================================ */
    function analyzeJs(src) {
        const tokens = tokenizeJs(src);
        const stats = {
            functions: 0,
            vars: 0,
            comments: 0,
            strings: 0,
            numbers: 0,
            lines: src.split("\n").length,
            size: new Blob([src]).size,
        };
        const kwFreq = {};

        for (const t of tokens) {
            if (t.type === "keyword") {
                stats.functions += (t.value === "function" ? 1 : 0);
                if (["var","let","const"].includes(t.value)) stats.vars++;
                kwFreq[t.value] = (kwFreq[t.value] || 0) + 1;
            }
            if (t.type === "ident") {
                kwFreq[t.value] = (kwFreq[t.value] || 0) + 1;
            }
            if (t.type === "comment-line" || t.type === "comment-block") stats.comments++;
            if (t.type === "string") stats.strings++;
            if (t.type === "number") stats.numbers++;
        }
        // Arrow functions count
        for (const t of tokens) {
            if (t.type === "punct" && t.value === "=>") stats.functions++;
        }

        return { stats, kwFreq };
    }

    function renderStats(source) {
        const { stats, kwFreq } = analyzeJs(source);

        stFunctions.textContent = stats.functions.toLocaleString();
        stVars.textContent      = stats.vars.toLocaleString();
        stComments.textContent  = stats.comments.toLocaleString();
        stStrings.textContent   = stats.strings.toLocaleString();
        stNumbers.textContent   = stats.numbers.toLocaleString();
        stLines.textContent     = stats.lines.toLocaleString();
        stSize.textContent      = formatBytes(stats.size);

        // Saved % vs original input
        if (lastInputSize > 0) {
            const saved = ((lastInputSize - stats.size) / lastInputSize) * 100;
            stRatio.textContent = (saved >= 0 ? saved.toFixed(1) + "%" : "+" + Math.abs(saved).toFixed(1) + "%");
        } else {
            stRatio.textContent = "—";
        }

        // Keyword frequency
        const sorted = Object.entries(kwFreq)
            .filter(([k]) => k.length <= 20)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sorted.length === 0) {
            kwFreqList.innerHTML = '<div class="empty-history">No tokens found</div>';
            return;
        }
        const max = sorted[0][1];
        kwFreqList.innerHTML = sorted.map(([name, count]) => {
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
    function validateJs(src) {
        const issues = [];

        // Try to compile using new Function (doesn't execute)
        try {
            new Function(src);
            issues.push({ level: "pass", text: "JavaScript syntax is valid — no errors detected." });
        } catch (e) {
            issues.push({ level: "error", text: "Syntax error: " + e.message });
        }

        // Additional checks
        const tokens = tokenizeJs(src);
        let parenDepth = 0, braceDepth = 0, bracketDepth = 0;
        let inTemplate = 0;
        for (const t of tokens) {
            if (t.type === "template") {
                // Count ${ } occurrences not critical here
            }
            if (t.type === "punct") {
                if (t.value === "(") parenDepth++;
                else if (t.value === ")") parenDepth--;
                else if (t.value === "{") braceDepth++;
                else if (t.value === "}") braceDepth--;
                else if (t.value === "[") bracketDepth++;
                else if (t.value === "]") bracketDepth--;
            }
        }

        if (parenDepth !== 0) issues.push({ level: "error", text: `Unbalanced parentheses (diff ${parenDepth})` });
        if (braceDepth !== 0) issues.push({ level: "error", text: `Unbalanced braces (diff ${braceDepth})` });
        if (bracketDepth !== 0) issues.push({ level: "error", text: `Unbalanced brackets (diff ${bracketDepth})` });

        // console.log detection
        const consoleMatches = src.match(/\bconsole\.\w+\s*\(/g);
        if (consoleMatches && consoleMatches.length > 0) {
            issues.push({ level: "info", text: `Found ${consoleMatches.length} console.* call(s) — consider removing for production` });
        }

        // Debugger detection
        if (/\bdebugger\b/.test(src)) {
            issues.push({ level: "warn", text: "Contains 'debugger' statement — remove for production" });
        }

        // eval detection
        if (/\beval\s*\(/.test(src)) {
            issues.push({ level: "warn", text: "Contains 'eval()' — potential security risk" });
        }

        // == vs ===
        const looseEq = (src.match(/([^=!<>])==([^=])/g) || []).length;
        if (looseEq > 0) {
            issues.push({ level: "info", text: `Found ${looseEq} loose equality (==) — consider ===` });
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

        renderStats(content);
        renderDiff(lastInputSize, bytes);

        lastResult = { text: content, mode, size: bytes };
    }

    /* ============================================================
       DIFF VIEW
       ============================================================ */
    function renderDiff(origSize, newSize) {
        const maxSize = Math.max(origSize, newSize, 1);
        diffOriginalBar.style.width = (origSize / maxSize * 100) + "%";
        diffMinifiedBar.style.width = (newSize / maxSize * 100) + "%";
        diffOriginalVal.textContent = formatBytes(origSize);
        diffMinifiedVal.textContent = formatBytes(newSize);

        const saved = origSize - newSize;
        const pct = origSize > 0 ? (saved / origSize) * 100 : 0;

        diffSummary.innerHTML = `
            <div class="ds-item saved"><i class="fa-solid fa-circle-check"></i> Saved ${formatBytes(Math.max(0, saved))}</div>
            <div class="ds-item reduction"><i class="fa-solid fa-percent"></i> ${Math.max(0, pct).toFixed(1)}% reduction</div>
        `;
    }

    /* ============================================================
       MAIN ACTIONS
       ============================================================ */
    function doMinify() {
        const src = jsInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter JavaScript first", "error");
            return;
        }
        setStatus("checking", "Minifying…");
        try {
            lastInputSize = new Blob([src]).size;
            const out = minifyJs(src);
            setStatus("valid", "Minified");
            showOutput(out, "minify");
            pushHistory("minify", src, out);
            if (typeof showToast === "function") showToast("🗜️ Minified");
        } catch (e) {
            setStatus("invalid", "Minify failed");
            if (typeof showToast === "function") showToast("❌ " + e.message, "error");
        }
    }

    function doBeautify() {
        const src = jsInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter JavaScript first", "error");
            return;
        }
        setStatus("checking", "Beautifying…");
        try {
            lastInputSize = new Blob([src]).size;
            const out = beautifyJs(src);
            setStatus("valid", "Beautified");
            showOutput(out, "beautify");
            pushHistory("beautify", src, out);
            if (typeof showToast === "function") showToast("✨ Beautified");
        } catch (e) {
            setStatus("invalid", "Beautify failed");
            if (typeof showToast === "function") showToast("❌ " + e.message, "error");
        }
    }

    function doValidate() {
        const src = jsInput.value.trim();
        if (!src) {
            setStatus("invalid", "Empty input");
            if (typeof showToast === "function") showToast("⚠️ Please enter JavaScript first", "error");
            return;
        }
        setStatus("checking", "Validating…");
        try {
            const issues = validateJs(src);
            const hasError = issues.some((i) => i.level === "error");
            setStatus(hasError ? "invalid" : "valid", hasError ? "Validation issues" : "Valid JavaScript");
            renderValidation(issues);
            pushHistory("validate", src, issues.length + " issue(s)");
            if (typeof showToast === "function") showToast(hasError ? "⚠️ Issues found" : "✅ Valid JS");
        } catch (e) {
            setStatus("invalid", "Validation failed");
            if (typeof showToast === "function") showToast("❌ " + e.message, "error");
        }
    }

    /* ============================================================
       SAMPLE
       ============================================================ */
    function loadSample() {
        const sample = `// Calculator module
// Author: Tool Hub

/**
 * Adds two numbers together
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum
 */
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

const multiply = (a, b) => a * b;
const divide = (a, b) => {
    if (b === 0) {
        throw new Error("Cannot divide by zero");
    }
    return a / b;
};

// Main execution
const numbers = [10, 20, 30, 40, 50];
let total = 0;

for (let i = 0; i < numbers.length; i++) {
    total = add(total, numbers[i]);
}

console.log("Total:", total);
console.log("Average:", divide(total, numbers.length));

debugger;

const result = {
    total: total,
    average: divide(total, numbers.length),
    count: numbers.length
};

export default result;`;
        jsInput.value = sample;
        updateLineNumbers();
        updateInputStats();
        doMinify();
        if (typeof showToast === "function") showToast("🧪 Sample loaded");
    }

    /* ============================================================
       CLEAR
       ============================================================ */
    function clearAll() {
        if (jsInput.value && !confirm("Clear all content?")) return;
        jsInput.value = "";
        updateLineNumbers();
        updateInputStats();
        outputArea.style.display = "none";
        validationArea.style.display = "none";
        setStatus("valid", "Ready — paste JS and click Minify");
        lastResult = null;
        lastInputSize = 0;
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
        const blob = new Blob([content], { type: "application/javascript" });
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
            jsHistoryList.innerHTML = '<div class="empty-history">No actions yet</div>';
            return;
        }
        jsHistoryList.innerHTML = history.map((h, i) => `
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

        jsHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                if (h.inputFull) {
                    jsInput.value = h.inputFull;
                    updateLineNumbers();
                    updateInputStats();
                    if (h.mode === "minify") doMinify();
                    else if (h.mode === "beautify") doBeautify();
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
    jsInput.addEventListener("input", () => {
        updateLineNumbers();
        updateInputStats();
        if (autoValidate.checked) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
                if (jsInput.value.trim()) {
                    const issues = validateJs(jsInput.value);
                    const hasError = issues.some((i) => i.level === "error");
                    setStatus(hasError ? "invalid" : "valid", hasError ? "Validation issues" : "Valid JavaScript");
                }
            }, 900);
        }
    });

    jsInput.addEventListener("scroll", () => {
        lineNumbers.scrollTop = jsInput.scrollTop;
    });

    jsInput.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = jsInput.selectionStart;
            const end = jsInput.selectionEnd;
            jsInput.value = jsInput.value.substring(0, start) + "  " + jsInput.value.substring(end);
            jsInput.selectionStart = jsInput.selectionEnd = start + 2;
            updateLineNumbers();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            doMinify();
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            e.preventDefault();
            doBeautify();
        }
    });

    // Buttons
    minifyBtn.addEventListener("click", doMinify);
    beautifyBtn.addEventListener("click", doBeautify);
    validateBtn.addEventListener("click", doValidate);
    sampleBtn.addEventListener("click", loadSample);
    clearBtn.addEventListener("click", clearAll);

    // Toolbar
    pasteBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            jsInput.value = text;
            updateLineNumbers();
            updateInputStats();
            if (typeof showToast === "function") showToast("📋 Pasted");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    copyInputBtn.addEventListener("click", () => {
        if (!jsInput.value) return;
        copyToClipboard(jsInput.value);
    });

    uploadBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            jsInput.value = ev.target.result;
            updateLineNumbers();
            updateInputStats();
            if (typeof showToast === "function") showToast("📁 File loaded");
        };
        reader.readAsText(file);
        fileInput.value = "";
    });

    downloadBtn.addEventListener("click", () => {
        if (!jsInput.value) return;
        downloadFile(jsInput.value, "input.js");
    });

    fullscreenBtn.addEventListener("click", () => {
        jsCard.classList.toggle("fullscreen");
        const on = jsCard.classList.contains("fullscreen");
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
            if (lastResult && lastResult.mode === "beautify") doBeautify();
        });
    });

    // Option change re-run
    mangleVars.addEventListener("change", () => {
        if (lastResult && lastResult.mode === "minify") doMinify();
    });
    removeComments.addEventListener("change", () => {
        if (lastResult && lastResult.mode === "minify") doMinify();
    });
    removeConsole.addEventListener("change", () => {
        if (lastResult && lastResult.mode === "minify") doMinify();
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
        downloadFile(lastResult.text, `${lastResult.mode}-output.js`);
    });

    copyFormattedBtn.addEventListener("click", () => {
        if (!lastResult) return;
        copyToClipboard(lastResult.text);
    });

    downloadFormattedBtn.addEventListener("click", () => {
        if (!lastResult) return;
        downloadFile(lastResult.text, `${lastResult.mode}-output.js`);
    });

    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = `JS ${lastResult.mode} result (${lastResult.size} bytes)`;
        if (navigator.share) {
            navigator.share({ title: "JS Result", text, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    // Clear history
    clearJsHistory.addEventListener("click", () => {
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
    window.shareJsMinifier = function () {
        const shareData = {
            title: "JavaScript Minifier - Tool Hub",
            text: "Minify & beautify JavaScript to reduce file size!",
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
        setStatus("valid", "Ready — paste JS and click Minify");
    }

    init();
})();