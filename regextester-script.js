/* ============================================================
   REGEX TESTER - Advanced Logic
   Live matching · Highlighting · Groups · Replace · Explain ·
   Library · Cheat Sheet
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const regexCard      = document.getElementById("regexCard");
    const regexPattern   = document.getElementById("regexPattern");
    const regexFlags     = document.getElementById("regexFlags");
    const copyRegexBtn   = document.getElementById("copyRegexBtn");
    const flagChips      = document.querySelectorAll(".flag-chip input[data-flag]");
    const regexStatus    = document.getElementById("regexStatus");

    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");

    const testInput      = document.getElementById("testInput");
    const pasteTest      = document.getElementById("pasteTest");
    const sampleTest     = document.getElementById("sampleTest");
    const clearTest      = document.getElementById("clearTest");

    const previewContent = document.getElementById("previewContent");
    const matchCount     = document.getElementById("matchCount");

    const matchesWrap    = document.getElementById("matchesWrap");
    const matchesList    = document.getElementById("matchesList");
    const copyMatchesBtn = document.getElementById("copyMatchesBtn");
    const exportMatchesBtn = document.getElementById("exportMatchesBtn");

    const replaceInput   = document.getElementById("replaceInput");
    const replacePreview = document.getElementById("replacePreview");
    const copyReplaceResult = document.getElementById("copyReplaceResult");

    const explainList    = document.getElementById("explainList");
    const explainTokens  = document.getElementById("explainTokens");

    const libraryGrid    = document.getElementById("libraryGrid");
    const librarySearch  = document.getElementById("librarySearch");

    const cheatsheetGrid = document.getElementById("cheatsheetGrid");

    const regexHistoryList = document.getElementById("regexHistoryList");
    const clearRegexHistory= document.getElementById("clearRegexHistory");

    /* ---------------- State ---------------- */
    let currentRegex     = null;
    let currentMatches   = [];
    let history          = loadHistory();
    let autoTimer        = null;
    let currentMode      = "match";

    /* ---------------- Constants ---------------- */
    const LIBRARY = [
        { name: "Email", icon: "fa-envelope", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "g", desc: "Match email addresses" },
        { name: "URL", icon: "fa-link", pattern: "https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", flags: "g", desc: "Match HTTP/HTTPS URLs" },
        { name: "Phone (US)", icon: "fa-phone", pattern: "\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}", flags: "g", desc: "US phone numbers" },
        { name: "Phone (Intl)", icon: "fa-globe", pattern: "\\+?\\d{1,3}[\\s.-]?\\(?\\d{1,4}\\)?[\\s.-]?\\d{1,4}[\\s.-]?\\d{1,9}", flags: "g", desc: "International phone numbers" },
        { name: "Date (ISO)", icon: "fa-calendar", pattern: "\\d{4}-\\d{2}-\\d{2}", flags: "g", desc: "YYYY-MM-DD dates" },
        { name: "Date (US)", icon: "fa-calendar-day", pattern: "\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}", flags: "g", desc: "MM/DD/YYYY dates" },
        { name: "Time (24h)", icon: "fa-clock", pattern: "([01]?\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?", flags: "g", desc: "HH:MM or HH:MM:SS" },
        { name: "IPv4", icon: "fa-network-wired", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g", desc: "IPv4 addresses" },
        { name: "Hex Color", icon: "fa-palette", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "g", desc: "Hex color codes" },
        { name: "HTML Tag", icon: "fa-code", pattern: "<\\/?[a-zA-Z][^>]*>", flags: "g", desc: "HTML tags" },
        { name: "Username", icon: "fa-user", pattern: "^[a-zA-Z0-9_]{3,16}$", flags: "gm", desc: "3-16 char username" },
        { name: "Password (Strong)", icon: "fa-key", pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$", flags: "gm", desc: "Min 8, upper+lower+digit+special" },
        { name: "Zip Code (US)", icon: "fa-mail-bulk", pattern: "\\b\\d{5}(-\\d{4})?\\b", flags: "g", desc: "US ZIP code" },
        { name: "Credit Card", icon: "fa-credit-card", pattern: "\\b(?:\\d[ -]*?){13,16}\\b", flags: "g", desc: "Credit card numbers (simple)" },
        { name: "Slug", icon: "fa-hashtag", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", flags: "gm", desc: "URL-friendly slug" },
        { name: "IP Address (v6)", icon: "fa-network-wired", pattern: "(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}", flags: "g", desc: "IPv6 addresses" },
        { name: "Whitespace", icon: "fa-spaces", pattern: "\\s+", flags: "g", desc: "Any whitespace" },
        { name: "Number", icon: "fa-hashtag", pattern: "-?\\d+(\\.\\d+)?", flags: "g", desc: "Integer or decimal" },
        { name: "Currency", icon: "fa-dollar-sign", pattern: "\\$\\s?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?", flags: "g", desc: "USD currency format" },
        { name: "Duplicated Words", icon: "fa-clone", pattern: "\\b(\\w+)\\s+\\1\\b", flags: "g", desc: "Repeated words" },
    ];

    const CHEATSHEET = [
        {
            title: "Character Classes", icon: "fa-font",
            rows: [
                { tok: ".", desc: "Any character except newline" },
                { tok: "\\w", desc: "Word character [a-zA-Z0-9_]" },
                { tok: "\\W", desc: "Non-word character" },
                { tok: "\\d", desc: "Digit [0-9]" },
                { tok: "\\D", desc: "Non-digit" },
                { tok: "\\s", desc: "Whitespace" },
                { tok: "\\S", desc: "Non-whitespace" },
                { tok: "[abc]", desc: "Any of a, b, c" },
                { tok: "[^abc]", desc: "Not a, b, or c" },
                { tok: "[a-z]", desc: "Character range a to z" },
            ],
        },
        {
            title: "Quantifiers", icon: "fa-arrows-left-right",
            rows: [
                { tok: "*", desc: "0 or more" },
                { tok: "+", desc: "1 or more" },
                { tok: "?", desc: "0 or 1" },
                { tok: "{n}", desc: "Exactly n times" },
                { tok: "{n,}", desc: "n or more times" },
                { tok: "{n,m}", desc: "Between n and m times" },
                { tok: "*?", desc: "Lazy: 0 or more (minimal)" },
                { tok: "+?", desc: "Lazy: 1 or more (minimal)" },
            ],
        },
        {
            title: "Anchors & Boundaries", icon: "fa-anchor",
            rows: [
                { tok: "^", desc: "Start of string/line" },
                { tok: "$", desc: "End of string/line" },
                { tok: "\\b", desc: "Word boundary" },
                { tok: "\\B", desc: "Non-word boundary" },
                { tok: "\\A", desc: "Start of string (no multiline)" },
                { tok: "\\Z", desc: "End of string (no multiline)" },
            ],
        },
        {
            title: "Groups & Ranges", icon: "fa-layer-group",
            rows: [
                { tok: "(abc)", desc: "Capture group" },
                { tok: "(?:abc)", desc: "Non-capturing group" },
                { tok: "(?<name>abc)", desc: "Named capture group" },
                { tok: "(?=abc)", desc: "Positive lookahead" },
                { tok: "(?!abc)", desc: "Negative lookahead" },
                { tok: "(?<=abc)", desc: "Positive lookbehind" },
                { tok: "(?<!abc)", desc: "Negative lookbehind" },
                { tok: "a|b", desc: "Alternation (a or b)" },
            ],
        },
        {
            title: "Escapes", icon: "fa-backslash",
            rows: [
                { tok: "\\.", desc: "Literal dot" },
                { tok: "\\*", desc: "Literal asterisk" },
                { tok: "\\\\", desc: "Literal backslash" },
                { tok: "\\n", desc: "Newline" },
                { tok: "\\t", desc: "Tab" },
                { tok: "\\r", desc: "Carriage return" },
                { tok: "\\0", desc: "Null character" },
            ],
        },
        {
            title: "Flags", icon: "fa-flag",
            rows: [
                { tok: "g", desc: "Global — all matches" },
                { tok: "i", desc: "Ignore case" },
                { tok: "m", desc: "Multiline: ^ $ per line" },
                { tok: "s", desc: "Dotall: . matches newline" },
                { tok: "u", desc: "Unicode mode" },
                { tok: "y", desc: "Sticky — match from lastIndex" },
            ],
        },
    ];

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_regex_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_regex_history", JSON.stringify(history.slice(0, 20)));
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

    function setStatus(type, message) {
        regexStatus.classList.remove("valid", "invalid", "empty");
        regexStatus.classList.add(type);
        const icons = {
            valid: "fa-check-circle",
            invalid: "fa-times-circle",
            empty: "fa-circle-info",
        };
        const icon = icons[type] || "fa-circle-info";
        regexStatus.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(message)}</span>`;
    }

    function copyToClipboard(text) {
        if (!text && text !== "") return;
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
       FLAGS SYNC
       ============================================================ */
    function syncFlagsFromChips() {
        let flags = "";
        flagChips.forEach((c) => {
            if (c.checked) flags += c.dataset.flag;
        });
        regexFlags.value = flags;
    }

    function syncChipsFromFlags() {
        const flags = regexFlags.value;
        flagChips.forEach((c) => {
            c.checked = flags.includes(c.dataset.flag);
        });
    }

    /* ============================================================
       REGEX BUILD
       ============================================================ */
    function buildRegex() {
        const pattern = regexPattern.value;
        const flags = regexFlags.value;

        if (!pattern) {
            currentRegex = null;
            return { ok: false, reason: "empty" };
        }

        try {
            currentRegex = new RegExp(pattern, flags);
            return { ok: true, regex: currentRegex };
        } catch (e) {
            currentRegex = null;
            return { ok: false, reason: "invalid", error: e.message };
        }
    }

    /* ============================================================
       MATCH + HIGHLIGHT
       ============================================================ */
    function runMatch() {
        // Sync chips → flags
        if (regexFlags.value !== Array.from(flagChips).filter(c => c.checked).map(c => c.dataset.flag).join("")) {
            syncFlagsFromFlags();
        }

        const build = buildRegex();

        if (!build.ok) {
            if (build.reason === "empty") {
                setStatus("empty", "Enter a pattern to begin testing");
                previewContent.innerHTML = '<span style="color:#94a3b8;font-style:italic;">Highlighted matches will appear here...</span>';
                matchCount.textContent = "0 matches";
                matchCount.classList.add("empty");
                matchesWrap.style.display = "none";
                explainList.innerHTML = '<div class="explain-empty">Enter a pattern to see its explanation</div>';
                explainTokens.textContent = "0 tokens";
            } else {
                setStatus("invalid", "Invalid regex: " + build.error);
                previewContent.innerHTML = '<span style="color:#ef4444;font-weight:600;">⚠ Invalid regular expression</span>';
                matchCount.textContent = "—";
                matchCount.classList.add("empty");
                matchesWrap.style.display = "none";
            }
            return;
        }

        const regex = build.regex;
        const text = testInput.value;

        // Collect matches
        const matches = collectMatches(regex, text);
        currentMatches = matches;

        // Status
        const isGlobal = regex.flags.includes("g");
        if (isGlobal) {
            setStatus("valid", `✓ Valid regex · ${matches.length} match${matches.length !== 1 ? "es" : ""} found`);
        } else {
            setStatus("valid", `✓ Valid regex · first match ${matches.length > 0 ? "found" : "not found"} (add "g" flag for all)`);
        }

        // Count
        matchCount.textContent = `${matches.length} match${matches.length !== 1 ? "es" : ""}`;
        matchCount.classList.toggle("empty", matches.length === 0);

        // Highlight
        previewContent.innerHTML = renderHighlighted(text, matches);

        // Match details
        if (matches.length > 0) {
            matchesWrap.style.display = "block";
            matchesList.innerHTML = matches.slice(0, 500).map((m, i) => renderMatchItem(m, i)).join("");
            if (matches.length > 500) {
                matchesList.innerHTML += `<div class="explain-empty" style="padding:14px 0;">Showing first 500 of ${matches.length} matches</div>`;
            }
            // Click on a match item to copy
            matchesList.querySelectorAll(".match-item").forEach((el) => {
                el.addEventListener("click", () => {
                    const idx = parseInt(el.dataset.idx, 10);
                    if (matches[idx]) copyToClipboard(matches[idx].value);
                });
            });
        } else {
            matchesWrap.style.display = "none";
        }

        // Explain
        renderExplain(regexPattern.value);

        // Replace
        renderReplace();

        // History
        if (matches.length > 0) {
            pushHistory(regexPattern.value, regexFlags.value, matches.length);
        }
    }

    function collectMatches(regex, text) {
        const matches = [];
        if (!regex || !text) return matches;

        const isGlobal = regex.flags.includes("g");
        try {
            if (isGlobal) {
                // Ensure lastIndex reset
                regex.lastIndex = 0;
                let m;
                let safety = 0;
                while ((m = regex.exec(text)) !== null) {
                    // Prevent infinite loop on zero-length matches
                    if (m.index === regex.lastIndex) regex.lastIndex++;
                    matches.push({
                        value: m[0],
                        index: m.index,
                        length: m[0].length,
                        groups: m.slice(1),
                        namedGroups: m.groups || {},
                    });
                    if (++safety > 10000) break;
                }
            } else {
                const m = regex.exec(text);
                if (m) {
                    matches.push({
                        value: m[0],
                        index: m.index,
                        length: m[0].length,
                        groups: m.slice(1),
                        namedGroups: m.groups || {},
                    });
                }
            }
        } catch (e) {
            // Ignore regex execution errors (e.g., catastrophic backtracking)
        }
        return matches;
    }

    function renderHighlighted(text, matches) {
        if (!text) return '<span style="color:#94a3b8;font-style:italic;">Enter a test string above...</span>';
        if (matches.length === 0) return escapeHtml(text);

        // Sort matches by index
        const sorted = matches.slice().sort((a, b) => a.index - b.index);
        let out = "";
        let cursor = 0;

        for (const m of sorted) {
            if (m.index < cursor) continue; // overlapping (shouldn't happen)
            out += escapeHtml(text.slice(cursor, m.index));
            const val = text.slice(m.index, m.index + m.length);
            out += `<span class="hl-match" title="Match at index ${m.index}">${escapeHtml(val)}</span>`;
            cursor = m.index + m.length;
        }
        out += escapeHtml(text.slice(cursor));
        return out;
    }

    function renderMatchItem(m, i) {
        let groupsHtml = "";
        if (m.groups.length > 0) {
            groupsHtml = '<div class="match-groups">';
            m.groups.forEach((g, gi) => {
                groupsHtml += `<div class="match-group"><span class="mg-label">$${gi + 1}</span><span class="mg-val">${g !== undefined ? escapeHtml(g) : '<em style="opacity:0.5;">undefined</em>'}</span></div>`;
            });
            groupsHtml += "</div>";
        }
        // Named groups
        const namedKeys = Object.keys(m.namedGroups);
        if (namedKeys.length > 0) {
            groupsHtml += '<div class="match-groups">';
            namedKeys.forEach((k) => {
                groupsHtml += `<div class="match-group"><span class="mg-name">${escapeHtml(k)}</span><span class="mg-val">${escapeHtml(m.namedGroups[k])}</span></div>`;
            });
            groupsHtml += "</div>";
        }

        return `
            <div class="match-item" data-idx="${i}" style="animation-delay:${Math.min(i, 20) * 0.02}s">
                <div class="match-head">
                    <span class="match-num">Match #${i + 1}</span>
                    <span class="match-pos">${m.index}–${m.index + m.length}</span>
                </div>
                <div class="match-val">${escapeHtml(m.value) || '<em style="opacity:0.5;">(empty)</em>'}</div>
                ${groupsHtml}
            </div>
        `;
    }

    /* ============================================================
       REPLACE
       ============================================================ */
    function renderReplace() {
        if (!currentRegex) {
            replacePreview.innerHTML = '<span style="color:#94a3b8;font-style:italic;">Enter a valid regex pattern to see replacement preview...</span>';
            return;
        }
        const text = testInput.value;
        const replacement = replaceInput.value;

        try {
            // Use a fresh regex without sticky
            const flags = currentRegex.flags.replace("y", "");
            const re = new RegExp(currentRegex.source, flags.includes("g") ? flags : flags + "g");
            let result;
            if (replacement.includes("$")) {
                // Simple replace with captured groups
                result = text.replace(re, replacement);
            } else {
                result = text.replace(re, replacement);
            }

            // Highlight replaced portions
            // Find all replaced spans by running regex again on original
            const matches = collectMatches(currentRegex, text);
            if (matches.length === 0) {
                replacePreview.innerHTML = escapeHtml(text);
                return;
            }

            // If replacement has $ substitutions, we can't easily highlight; just show result
            let highlighted = "";
            let cursor = 0;
            for (const m of matches) {
                if (m.index < cursor) continue;
                highlighted += escapeHtml(text.slice(cursor, m.index));
                // Compute replacement for this match (basic $ expansion)
                const expanded = expandReplacement(replacement, m, text);
                highlighted += `<span class="rp-highlight">${escapeHtml(expanded)}</span>`;
                cursor = m.index + m.length;
            }
            highlighted += escapeHtml(text.slice(cursor));
            replacePreview.innerHTML = highlighted;
        } catch (e) {
            replacePreview.innerHTML = `<span style="color:#ef4444;font-weight:600;">⚠ Replacement error: ${escapeHtml(e.message)}</span>`;
        }
    }

    function expandReplacement(repl, m, text) {
        return repl
            .replace(/\$&/g, m.value)
            .replace(/\$`/g, text.slice(0, m.index))
            .replace(/\$'/g, text.slice(m.index + m.length))
            .replace(/\$(\d+)/g, (_, n) => {
                const idx = parseInt(n, 10) - 1;
                return m.groups[idx] !== undefined ? m.groups[idx] : "";
            })
            .replace(/\$<([^>]+)>/g, (_, name) => {
                return m.namedGroups[name] !== undefined ? m.namedGroups[name] : "";
            })
            .replace(/\$\$/g, "$");
    }

    /* ============================================================
       EXPLAIN
       ============================================================ */
    function renderExplain(pattern) {
        if (!pattern) {
            explainList.innerHTML = '<div class="explain-empty">Enter a pattern to see its explanation</div>';
            explainTokens.textContent = "0 tokens";
            return;
        }

        const tokens = tokenizeRegex(pattern);
        explainTokens.textContent = `${tokens.length} token${tokens.length !== 1 ? "s" : ""}`;

        if (tokens.length === 0) {
            explainList.innerHTML = '<div class="explain-empty">No tokens to explain</div>';
            return;
        }

        explainList.innerHTML = tokens.map((t, i) => `
            <div class="explain-item" style="animation-delay:${Math.min(i, 20) * 0.02}s">
                <div class="explain-tok">${escapeHtml(t.raw)}</div>
                <div class="explain-desc">${escapeHtml(t.desc)}</div>
            </div>
        `).join("");
    }

    function tokenizeRegex(pattern) {
        const tokens = [];
        let i = 0;
        const n = pattern.length;

        const push = (raw, desc) => tokens.push({ raw, desc });

        while (i < n) {
            const c = pattern[i];

            // Escape sequences
            if (c === "\\") {
                const next = pattern[i + 1];
                if (!next) {
                    push("\\", "Literal backslash (incomplete)");
                    i++;
                    continue;
                }
                const seq = c + next;
                const map = {
                    "\\d": "Any digit [0-9]",
                    "\\D": "Any non-digit",
                    "\\w": "Word character [a-zA-Z0-9_]",
                    "\\W": "Non-word character",
                    "\\s": "Whitespace",
                    "\\S": "Non-whitespace",
                    "\\b": "Word boundary",
                    "\\B": "Non-word boundary",
                    "\\n": "Newline character",
                    "\\r": "Carriage return",
                    "\\t": "Tab character",
                    "\\f": "Form feed",
                    "\\v": "Vertical tab",
                    "\\0": "Null character",
                };
                if (map[seq]) {
                    push(seq, map[seq]);
                } else if (/\\[1-9]/.test(seq)) {
                    push(seq, `Back-reference to capture group #${next}`);
                } else if (next === "k" && pattern[i + 2] === "<") {
                    // Named backref
                    const end = pattern.indexOf(">", i + 3);
                    if (end !== -1) {
                        const name = pattern.slice(i + 3, end);
                        push(pattern.slice(i, end + 1), `Back-reference to named group "${name}"`);
                        i = end + 1;
                        continue;
                    }
                    push(seq, "Escaped character");
                } else {
                    push(seq, `Literal "${next}"`);
                }
                i += 2;
                continue;
            }

            // Character class
            if (c === "[") {
                const start = i;
                i++;
                if (pattern[i] === "^") i++;
                // Read until unescaped ]
                while (i < n && pattern[i] !== "]") {
                    if (pattern[i] === "\\") i++;
                    i++;
                }
                if (i < n) i++;
                const raw = pattern.slice(start, i);
                push(raw, raw.startsWith("[^") ? "Negated character class" : "Character class");
                continue;
            }

            // Groups
            if (c === "(") {
                if (pattern[i + 1] === "?" && pattern[i + 2] === ":") {
                    push("(?:", "Non-capturing group start");
                    i += 3;
                    continue;
                }
                if (pattern[i + 1] === "?" && pattern[i + 2] === "=") {
                    push("(?=", "Positive lookahead start");
                    i += 3;
                    continue;
                }
                if (pattern[i + 1] === "?" && pattern[i + 2] === "!") {
                    push("(?!", "Negative lookahead start");
                    i += 3;
                    continue;
                }
                if (pattern[i + 1] === "?" && pattern[i + 2] === "<" && pattern[i + 3] === "=") {
                    push("(?<=", "Positive lookbehind start");
                    i += 4;
                    continue;
                }
                if (pattern[i + 1] === "?" && pattern[i + 2] === "<" && pattern[i + 3] === "!") {
                    push("(?<!", "Negative lookbehind start");
                    i += 4;
                    continue;
                }
                if (pattern[i + 1] === "?" && pattern[i + 2] === "<") {
                    // Named group
                    const end = pattern.indexOf(">", i + 3);
                    if (end !== -1) {
                        const name = pattern.slice(i + 3, end);
                        push(pattern.slice(i, end + 1), `Named capture group "${name}"`);
                        i = end + 1;
                        continue;
                    }
                }
                push("(", "Capture group start");
                i++;
                continue;
            }

            if (c === ")") {
                push(")", "Group end");
                i++;
                continue;
            }

            // Anchors
            if (c === "^") {
                push("^", "Start of string/line");
                i++;
                continue;
            }
            if (c === "$") {
                push("$", "End of string/line");
                i++;
                continue;
            }

            // Dot
            if (c === ".") {
                push(".", "Any character (except newline unless 's' flag)");
                i++;
                continue;
            }

            // Quantifiers
            if (c === "*") {
                if (pattern[i + 1] === "?") {
                    push("*?", "Zero or more (lazy)");
                    i += 2;
                } else {
                    push("*", "Zero or more");
                    i++;
                }
                continue;
            }
            if (c === "+") {
                if (pattern[i + 1] === "?") {
                    push("+?", "One or more (lazy)");
                    i += 2;
                } else {
                    push("+", "One or more");
                    i++;
                }
                continue;
            }
            if (c === "?") {
                if (pattern[i + 1] === "?") {
                    push("??", "Zero or one (lazy)");
                    i += 2;
                } else {
                    push("?", "Zero or one (optional)");
                    i++;
                }
                continue;
            }

            if (c === "{") {
                const end = pattern.indexOf("}", i);
                if (end !== -1) {
                    const raw = pattern.slice(i, end + 1);
                    const inner = raw.slice(1, -1);
                    let desc;
                    if (/^\d+$/.test(inner)) desc = `Exactly ${inner} times`;
                    else if (/^\d+,$/.test(inner)) desc = `${inner.slice(0, -1)} or more times`;
                    else if (/^\d+,\d+$/.test(inner)) {
                        const [a, b] = inner.split(",");
                        desc = `Between ${a} and ${b} times`;
                    } else desc = "Quantifier";
                    push(raw, desc);
                    i = end + 1;
                    continue;
                }
                push("{", "Literal brace (invalid quantifier)");
                i++;
                continue;
            }

            // Alternation
            if (c === "|") {
                push("|", "Alternation (OR)");
                i++;
                continue;
            }

            // Regular character
            // Merge consecutive literals
            let lit = c;
            i++;
            while (i < n && !/[\\\[\]()^$.*+?{}|]/.test(pattern[i])) {
                lit += pattern[i++];
            }
            push(lit, `Literal text "${lit}"`);
        }

        return tokens;
    }

    /* ============================================================
       LIBRARY
       ============================================================ */
    function renderLibrary(filter = "") {
        const f = filter.toLowerCase().trim();
        const items = LIBRARY.filter((lib) =>
            !f ||
            lib.name.toLowerCase().includes(f) ||
            lib.desc.toLowerCase().includes(f) ||
            lib.pattern.toLowerCase().includes(f)
        );

        if (items.length === 0) {
            libraryGrid.innerHTML = '<div class="lib-empty">No patterns match your search</div>';
            return;
        }

        libraryGrid.innerHTML = items.map((lib, i) => `
            <button class="lib-card" data-pattern="${escapeHtml(lib.pattern)}" data-flags="${escapeHtml(lib.flags)}" style="animation-delay:${Math.min(i, 20) * 0.02}s">
                <div class="lib-name"><i class="fa-solid ${lib.icon}"></i> ${escapeHtml(lib.name)}</div>
                <div class="lib-pattern">/${escapeHtml(lib.pattern)}/${escapeHtml(lib.flags)}</div>
                <div class="lib-desc">${escapeHtml(lib.desc)}</div>
            </button>
        `).join("");

        libraryGrid.querySelectorAll(".lib-card").forEach((btn) => {
            btn.addEventListener("click", () => {
                regexPattern.value = btn.dataset.pattern;
                regexFlags.value = btn.dataset.flags;
                syncChipsFromFlags();
                runMatch();
                if (typeof showToast === "function") showToast("✨ Pattern loaded");
                // Scroll to preview
                setTimeout(() => {
                    const r = regexCard.getBoundingClientRect();
                    if (r.top < 0 || r.top > 200) {
                        regexCard.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }, 100);
            });
        });
    }

    /* ============================================================
       CHEAT SHEET
       ============================================================ */
    function renderCheatsheet() {
        cheatsheetGrid.innerHTML = CHEATSHEET.map((section, i) => `
            <div class="cs-section" style="animation-delay:${i * 0.04}s">
                <div class="cs-header"><i class="fa-solid ${section.icon}"></i> ${escapeHtml(section.title)}</div>
                <div class="cs-body">
                    ${section.rows.map((r) => `
                        <div class="cs-row" data-insert="${escapeHtml(r.tok)}">
                            <span class="cs-tok">${escapeHtml(r.tok)}</span>
                            <span class="cs-desc">${escapeHtml(r.desc)}</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        `).join("");

        cheatsheetGrid.querySelectorAll(".cs-row").forEach((row) => {
            row.addEventListener("click", () => {
                regexPattern.value += row.dataset.insert;
                regexPattern.focus();
                runMatch();
            });
        });
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(pattern, flags, count) {
        // Skip if same as first entry
        if (history.length > 0 && history[0].pattern === pattern && history[0].flags === flags) {
            history[0].count = count;
            saveHistory();
            renderHistory();
            return;
        }
        history.unshift({
            pattern,
            flags,
            count,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 20) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            regexHistoryList.innerHTML = '<div class="empty-history">No patterns tested yet</div>';
            return;
        }
        regexHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-regex">/${escapeHtml(h.pattern)}/${escapeHtml(h.flags)}</div>
                <span class="hi-count">${h.count} match${h.count !== 1 ? "es" : ""}</span>
            </div>
        `).join("");

        regexHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                regexPattern.value = h.pattern;
                regexFlags.value = h.flags;
                syncChipsFromFlags();
                runMatch();
            });
        });
    }

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
        modeContents.forEach((c) => c.classList.toggle("active", c.dataset.content === mode));

        if (mode === "library") renderLibrary(librarySearch.value);
        if (mode === "cheatsheet") renderCheatsheet();
        if (mode === "explain") renderExplain(regexPattern.value);
        if (mode === "replace") renderReplace();
    }

    /* ============================================================
       EVENTS
       ============================================================ */
    regexPattern.addEventListener("input", () => {
        clearTimeout(autoTimer);
        autoTimer = setTimeout(runMatch, 250);
    });

    regexFlags.addEventListener("input", () => {
        // Sanitize flags
        regexFlags.value = regexFlags.value.replace(/[^gimsuyd]/g, "");
        syncChipsFromFlags();
        clearTimeout(autoTimer);
        autoTimer = setTimeout(runMatch, 200);
    });

    flagChips.forEach((c) => {
        c.addEventListener("change", () => {
            syncFlagsFromChips();
            runMatch();
        });
    });

    testInput.addEventListener("input", () => {
        clearTimeout(autoTimer);
        autoTimer = setTimeout(runMatch, 250);
    });

    replaceInput.addEventListener("input", () => {
        clearTimeout(autoTimer);
        autoTimer = setTimeout(renderReplace, 200);
    });

    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    copyRegexBtn.addEventListener("click", () => {
        if (!regexPattern.value) return;
        copyToClipboard(`/${regexPattern.value}/${regexFlags.value}`);
    });

    // Test input actions
    pasteTest.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            testInput.value = text;
            runMatch();
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    sampleTest.addEventListener("click", () => {
        testInput.value = `Contact us at support@example.com or sales@company.co.uk.
Our phone numbers are +1 (555) 123-4567 and 555-987-6543.
Visit https://tool-hub.example.com or http://test.org for more info.
Dates: 2024-01-15, 2025-12-31, 12/25/2025.
IDs: ABC-123, XYZ-789, DEF-456.
IP addresses: 192.168.1.1, 10.0.0.254, 8.8.8.8
Hex colors: #fff, #1a2b3c, #ABCDEF
Prices: $19.99, $1,234.56, $100`;
        runMatch();
        if (typeof showToast === "function") showToast("🧪 Sample loaded");
    });

    clearTest.addEventListener("click", () => {
        testInput.value = "";
        runMatch();
    });

    // Copy matches
    copyMatchesBtn.addEventListener("click", () => {
        if (currentMatches.length === 0) return;
        copyToClipboard(currentMatches.map((m) => m.value).join("\n"));
    });

    // Export matches as JSON
    exportMatchesBtn.addEventListener("click", () => {
        if (currentMatches.length === 0) return;
        const data = {
            pattern: regexPattern.value,
            flags: regexFlags.value,
            totalMatches: currentMatches.length,
            matches: currentMatches.map((m, i) => ({
                index: i + 1,
                value: m.value,
                position: m.index,
                length: m.length,
                groups: m.groups,
                namedGroups: m.namedGroups,
            })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `regex-matches-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === "function") showToast("📥 Exported");
    });

    // Copy replace result
    copyReplaceResult.addEventListener("click", () => {
        if (!replacePreview.textContent) return;
        const text = testInput.value;
        const replacement = replaceInput.value;
        if (!currentRegex) return;
        try {
            const flags = currentRegex.flags.includes("g") ? currentRegex.flags : currentRegex.flags + "g";
            const re = new RegExp(currentRegex.source, flags.replace("y", ""));
            const result = text.replace(re, replacement);
            copyToClipboard(result);
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Copy failed", "error");
        }
    });

    // Library search
    librarySearch.addEventListener("input", () => {
        renderLibrary(librarySearch.value);
    });

    // Clear history
    clearRegexHistory.addEventListener("click", () => {
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
        const typing = tag === "input" || tag === "textarea";

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            copyRegexBtn.click();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
            e.preventDefault();
            setMode("library");
            return;
        }
        if (!typing && e.key === "Escape") {
            e.preventDefault();
            regexPattern.value = "";
            testInput.value = "";
            replaceInput.value = "";
            runMatch();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareRegexTester = function () {
        const shareData = {
            title: "Regex Tester - Tool Hub",
            text: "Test regular expressions with live matching & highlighting!",
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
        syncChipsFromFlags();
        renderLibrary("");
        renderCheatsheet();
        renderHistory();
        runMatch();
    }

    init();
})();