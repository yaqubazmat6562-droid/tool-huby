/* ============================================================
   URL ENCODER/DECODER - Advanced Logic
   4 modes: Encode · Decode · Query Params · Analyze URL
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const urlCard        = document.getElementById("urlCard");
    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");

    const encodeInput    = document.getElementById("encodeInput");
    const decodeInput    = document.getElementById("decodeInput");
    const queryInput     = document.getElementById("queryInput");
    const analyzeInput   = document.getElementById("analyzeInput");

    const encCounter     = document.getElementById("encCounter");
    const decCounter     = document.getElementById("decCounter");

    const encTypePills   = document.querySelectorAll(".et-pill");
    const encAuto        = document.getElementById("encAuto");
    const encUpper       = document.getElementById("encUpper");
    const decAuto        = document.getElementById("decAuto");
    const decReplacePlus = document.getElementById("decReplacePlus");
    const qryDecodeValues= document.getElementById("qryDecodeValues");

    const processBtn     = document.getElementById("processBtn");
    const processBtnLabel= document.getElementById("processBtnLabel");
    const swapBtn        = document.getElementById("swapBtn");
    const clearAllBtn    = document.getElementById("clearAllBtn");

    const encPaste       = document.getElementById("enc-paste");
    const encClear       = document.getElementById("enc-clear");
    const encSample      = document.getElementById("enc-sample");
    const decPaste       = document.getElementById("dec-paste");
    const decClear       = document.getElementById("dec-clear");
    const decSample      = document.getElementById("dec-sample");
    const qryPaste       = document.getElementById("qry-paste");
    const qrySample      = document.getElementById("qry-sample");
    const anaPaste       = document.getElementById("ana-paste");
    const anaSample      = document.getElementById("ana-sample");

    const parseQueryBtn  = document.getElementById("parseQueryBtn");
    const analyzeBtn     = document.getElementById("analyzeBtn");

    const outputArea     = document.getElementById("outputArea");
    const outputLabel    = document.getElementById("outputLabel");
    const outputContent  = document.getElementById("outputContent");
    const outputStats    = document.getElementById("outputStats");

    const paramsArea     = document.getElementById("paramsArea");
    const paramsCount    = document.getElementById("paramsCount");
    const paramsTable    = document.getElementById("paramsTable");
    const copyParamsJson = document.getElementById("copyParamsJson");
    const copyParamsQuery= document.getElementById("copyParamsQuery");

    const analysisArea   = document.getElementById("analysisArea");
    const analysisGrid   = document.getElementById("analysisGrid");
    const analysisParams = document.getElementById("analysisParams");
    const analysisSecurityWrap = document.getElementById("analysisSecurityWrap");
    const analysisSecurity = document.getElementById("analysisSecurity");

    const copyOutputBtn  = document.getElementById("copyOutputBtn");
    const downloadOutputBtn = document.getElementById("downloadOutputBtn");
    const sendToInputBtn = document.getElementById("sendToInputBtn");

    const urlError       = document.getElementById("urlError");

    const urlHistoryList = document.getElementById("urlHistoryList");
    const clearUrlHistory= document.getElementById("clearUrlHistory");

    /* ---------------- State ---------------- */
    let currentMode  = "encode";         // encode | decode | query | analyze
    let currentEtype = "component";      // component | full | query | path
    let lastResult   = null;             // { text, mode, size }
    let lastParams   = null;             // array of {key, value}
    let history      = loadHistory();
    let autoTimer    = null;

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_urlencoder_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_urlencoder_history", JSON.stringify(history.slice(0, 30)));
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

    function showError(msg) {
        urlError.textContent = msg;
        urlError.classList.add("show");
        urlError.style.animation = "none";
        void urlError.offsetWidth;
        urlError.style.animation = "";
    }
    function hideError() {
        urlError.classList.remove("show");
        urlError.textContent = "";
    }

    /* ============================================================
       ENCODE TYPES
       ============================================================ */
    function encodeByType(str, type) {
        switch (type) {
            case "component":
                // encodeURIComponent — encodes everything except A-Za-z0-9 - _ . ! ~ * ' ( )
                return encodeURIComponent(str);
            case "full":
                // encodeURI — preserves : / ? # & = etc.
                return encodeURI(str);
            case "query":
                // Strict: like component but also encode ! ' ( ) *
                return encodeURIComponent(str).replace(/[!'()*]/g, (c) =>
                    "%" + c.charCodeAt(0).toString(16).toUpperCase()
                );
            case "path":
                // Encode each path segment
                return str.split("/").map((seg) => encodeURIComponent(seg)).join("/");
            default:
                return encodeURIComponent(str);
        }
    }

    function decodeByType(str, type) {
        switch (type) {
            case "component":
            case "query":
            case "path":
                return decodeURIComponent(str);
            case "full":
                return decodeURI(str);
            default:
                return decodeURIComponent(str);
        }
    }

    function uppercaseHex(str) {
        return str.replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase());
    }

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
        modeContents.forEach((c) => c.classList.toggle("active", c.dataset.content === mode));
        hideError();

        const labels = {
            encode: "Encode",
            decode: "Decode",
            query: "Parse Params",
            analyze: "Analyze",
        };
        processBtnLabel.textContent = labels[mode] || "Process";

        // Hide outputs on mode change
        outputArea.style.display = "none";
        paramsArea.style.display = "none";
        analysisArea.style.display = "none";
        lastResult = null;

        const firstInput = document.querySelector(
            `.mode-content[data-content="${mode}"] textarea`
        );
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }

    /* ============================================================
       COUNTERS
       ============================================================ */
    function updateEncCounter() {
        encCounter.textContent = `${encodeInput.value.length.toLocaleString()} characters`;
    }
    function updateDecCounter() {
        decCounter.textContent = `${decodeInput.value.length.toLocaleString()} characters`;
    }

    /* ============================================================
       ENCODE
       ============================================================ */
    function doEncode() {
        hideError();
        const input = encodeInput.value;
        if (!input) {
            showError("⚠️ Please enter text or URL to encode");
            return;
        }
        try {
            let out = encodeByType(input, currentEtype);
            if (encUpper.checked) out = uppercaseHex(out);

            showOutput(out, "encode");
            pushHistory("encode", input, out);
            if (typeof showToast === "function") showToast("✅ Encoded");
        } catch (e) {
            showError("❌ Encoding failed: " + e.message);
        }
    }

    /* ============================================================
       DECODE
       ============================================================ */
    function doDecode() {
        hideError();
        let input = decodeInput.value.trim();
        if (!input) {
            showError("⚠️ Please enter encoded URL/text to decode");
            return;
        }
        try {
            // Replace + with space (form-urlencoded behaviour)
            let toDecode = input;
            if (decReplacePlus.checked) toDecode = toDecode.replace(/\+/g, " ");

            const out = decodeByType(toDecode, currentEtype);
            showOutput(out, "decode");
            pushHistory("decode", input.slice(0, 60), out.slice(0, 60));
            if (typeof showToast === "function") showToast("✅ Decoded");
        } catch (e) {
            showError("❌ Invalid encoded string");
        }
    }

    /* ============================================================
       QUERY PARAMS
       ============================================================ */
    function parseQueryParams() {
        hideError();
        const raw = queryInput.value.trim();
        if (!raw) {
            showError("⚠️ Please paste a URL or query string");
            return;
        }

        // Extract query string
        let qs = "";
        const qIdx = raw.indexOf("?");
        if (qIdx !== -1) {
            qs = raw.substring(qIdx + 1);
            // Remove fragment
            const hIdx = qs.indexOf("#");
            if (hIdx !== -1) qs = qs.substring(0, hIdx);
        } else {
            // Treat as raw query string
            qs = raw.replace(/^[?#]/, "");
        }

        if (!qs) {
            showError("⚠️ No query string found");
            return;
        }

        const params = [];
        qs.split("&").forEach((pair) => {
            if (!pair) return;
            const eq = pair.indexOf("=");
            let key, value;
            if (eq === -1) {
                key = pair;
                value = "";
            } else {
                key = pair.substring(0, eq);
                value = pair.substring(eq + 1);
            }

            // Decode if option enabled
            if (qryDecodeValues.checked) {
                try { key = decodeURIComponent(key.replace(/\+/g, " ")); } catch (e) {}
                try { value = decodeURIComponent(value.replace(/\+/g, " ")); } catch (e) {}
            }

            params.push({ key, value });
        });

        if (params.length === 0) {
            showError("⚠️ No parameters found");
            return;
        }

        renderParams(params);
        lastParams = params;
        pushHistory("query", `${params.length} params from ${raw.slice(0, 40)}`, `${params.length} parsed`);
        if (typeof showToast === "function") showToast(`✅ Parsed ${params.length} param(s)`);
    }

    function renderParams(params) {
        paramsArea.style.display = "block";
        paramsCount.textContent = params.length;
        paramsTable.innerHTML = params.map((p, i) => `
            <div class="param-row">
                <div class="pr-key">${escapeHtml(p.key) || "(empty)"}</div>
                <div class="pr-value">${escapeHtml(p.value) || "(empty)"}</div>
                <div class="pr-actions">
                    <button class="pr-btn" data-copy="${escapeHtml(p.value)}" title="Copy value">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                </div>
            </div>
        `).join("");

        paramsTable.querySelectorAll(".pr-btn").forEach((b) => {
            b.addEventListener("click", () => {
                copyToClipboard(b.dataset.copy);
            });
        });

        // Scroll
        setTimeout(() => {
            const r = paramsArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                paramsArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       ANALYZE URL
       ============================================================ */
    function analyzeURL() {
        hideError();
        const raw = analyzeInput.value.trim();
        if (!raw) {
            showError("⚠️ Please paste a URL to analyze");
            return;
        }

        // Try parsing with URL API
        let url;
        try {
            // If no scheme, assume https
            const withScheme = /^[a-z]+:\/\//i.test(raw) ? raw : "https://" + raw;
            url = new URL(withScheme);
        } catch (e) {
            showError("❌ Invalid URL — could not parse");
            return;
        }

        // Extract parts
        const parts = {
            protocol: url.protocol.replace(":", ""),
            hostname: url.hostname,
            port: url.port || "(default)",
            pathname: url.pathname || "/",
            search: url.search || "(none)",
            hash: url.hash || "(none)",
            username: url.username || "",
            password: url.password ? "••••••" : "",
            origin: url.origin,
        };

        // Extract path segments
        const pathSegments = url.pathname.split("/").filter(Boolean);

        // Subdomain & TLD
        const hostParts = url.hostname.split(".");
        let subdomain = "(none)";
        let tld = "";
        let domain = url.hostname;
        if (hostParts.length >= 2) {
            tld = hostParts[hostParts.length - 1];
            domain = hostParts[hostParts.length - 2] + "." + tld;
            if (hostParts.length > 2) {
                subdomain = hostParts.slice(0, -2).join(".");
            }
        }

        // Render analysis
        analysisArea.style.display = "block";

        const gridItems = [
            { label: "Protocol", icon: "fa-lock", value: parts.protocol || "—", empty: !parts.protocol },
            { label: "Hostname", icon: "fa-globe", value: parts.hostname || "—", empty: !parts.hostname },
            { label: "Domain", icon: "fa-sitemap", value: domain || "—", empty: !domain },
            { label: "Subdomain", icon: "fa-diagram-project", value: subdomain, empty: subdomain === "(none)" },
            { label: "TLD", icon: "fa-flag", value: tld || "—", empty: !tld },
            { label: "Port", icon: "fa-plug", value: parts.port, empty: parts.port === "(default)" },
            { label: "Path", icon: "fa-route", value: parts.pathname, empty: parts.pathname === "/" },
            { label: "Query", icon: "fa-list", value: parts.search, empty: parts.search === "(none)" },
            { label: "Fragment", icon: "fa-hashtag", value: parts.hash, empty: parts.hash === "(none)" },
            { label: "Origin", icon: "fa-cube", value: parts.origin, empty: !parts.origin },
        ];

        if (parts.username) {
            gridItems.push({ label: "Username", icon: "fa-user", value: parts.username, empty: false });
            if (parts.password) {
                gridItems.push({ label: "Password", icon: "fa-key", value: parts.password, empty: false });
            }
        }

        if (pathSegments.length > 0) {
            gridItems.push({ label: "Path Segments", icon: "fa-layer-group", value: pathSegments.length.toString(), empty: false });
        }

        analysisGrid.innerHTML = gridItems.map((item) => `
            <div class="ag-item">
                <span class="ag-label"><i class="fa-solid ${item.icon}"></i> ${item.label}</span>
                <span class="ag-value ${item.empty ? "empty" : ""}">${escapeHtml(item.value)}</span>
            </div>
        `).join("");

        // Query params
        const params = [];
        url.searchParams.forEach((value, key) => {
            params.push({ key, value });
        });

        if (params.length > 0) {
            analysisParams.innerHTML = params.map((p) => `
                <div class="param-row" style="padding:8px 10px;">
                    <div class="pr-key">${escapeHtml(p.key)}</div>
                    <div class="pr-value">${escapeHtml(p.value) || "(empty)"}</div>
                    <div class="pr-actions">
                        <button class="pr-btn" data-copy="${escapeHtml(p.value)}">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                    </div>
                </div>
            `).join("");
            analysisParams.querySelectorAll(".pr-btn").forEach((b) => {
                b.addEventListener("click", () => copyToClipboard(b.dataset.copy));
            });
        } else {
            analysisParams.innerHTML = '<div class="empty-history">No query parameters</div>';
        }

        // Security checks
        const checks = [];

        // HTTPS
        checks.push({
            status: url.protocol === "https:" ? "pass" : "fail",
            text: url.protocol === "https:" ? "Secure connection (HTTPS)" : "Not using HTTPS",
        });

        // Username/password in URL
        if (url.username || url.password) {
            checks.push({
                status: "warn",
                text: "Credentials embedded in URL — visible to logs",
            });
        }

        // IP address host
        if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
            checks.push({
                status: "warn",
                text: "Using IP address instead of domain name",
            });
        }

        // Non-standard port
        if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) {
            checks.push({
                status: "warn",
                text: `Unusual port: ${url.port}`,
            });
        }

        // Long URL
        if (raw.length > 2000) {
            checks.push({ status: "warn", text: `Very long URL (${raw.length} chars)` });
        } else {
            checks.push({ status: "pass", text: `URL length: ${raw.length} chars (OK)` });
        }

        // Query params present
        if (params.length > 0) {
            checks.push({ status: "warn", text: `${params.length} query parameter(s) — check for tracking` });
        }

        // Fragment present
        if (url.hash) {
            checks.push({ status: "pass", text: "Uses fragment identifier (#)" });
        }

        analysisSecurityWrap.style.display = "block";
        analysisSecurity.innerHTML = checks.map((c) => {
            const icon = c.status === "pass" ? "fa-check-circle"
                : c.status === "fail" ? "fa-times-circle"
                : "fa-exclamation-triangle";
            return `<div class="sec-item ${c.status}"><i class="fa-solid ${icon}"></i><span class="sec-text">${escapeHtml(c.text)}</span></div>`;
        }).join("");

        pushHistory("analyze", raw.slice(0, 60), `${params.length} params, ${checks.length} checks`);
        if (typeof showToast === "function") showToast("✅ URL analyzed");

        setTimeout(() => {
            const r = analysisArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                analysisArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       SHOW OUTPUT
       ============================================================ */
    function showOutput(content, mode) {
        outputArea.style.display = "block";

        const labels = {
            encode: "Encoded URL",
            decode: "Decoded Text",
        };
        outputLabel.innerHTML = `<i class="fa-solid fa-arrow-right"></i> ${labels[mode] || "Output"}`;

        outputContent.textContent = content;

        const outBytes = new Blob([content]).size;
        outputStats.textContent = `${content.length.toLocaleString()} chars · ${formatBytes(outBytes)}`;

        lastResult = { text: content, mode, size: outBytes };

        setTimeout(() => {
            const r = outputArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       PROCESS (main)
       ============================================================ */
    function process() {
        switch (currentMode) {
            case "encode":  doEncode(); break;
            case "decode":  doDecode(); break;
            case "query":   parseQueryParams(); break;
            case "analyze": analyzeURL(); break;
        }
    }

    /* ============================================================
       SWAP
       ============================================================ */
    function swapDirection() {
        if (lastResult && lastResult.text && currentMode === "encode") {
            decodeInput.value = lastResult.text;
            updateDecCounter();
            setMode("decode");
            if (decAuto.checked) setTimeout(doDecode, 150);
        } else if (lastResult && lastResult.text && currentMode === "decode") {
            encodeInput.value = lastResult.text;
            updateEncCounter();
            setMode("encode");
            if (encAuto.checked) setTimeout(doEncode, 150);
        } else {
            setMode(currentMode === "encode" ? "decode" : "encode");
        }
    }

    /* ============================================================
       CLEAR ALL
       ============================================================ */
    function clearAll() {
        if (!confirm("Clear all inputs and outputs?")) return;
        encodeInput.value = "";
        decodeInput.value = "";
        queryInput.value = "";
        analyzeInput.value = "";
        updateEncCounter();
        updateDecCounter();
        outputArea.style.display = "none";
        paramsArea.style.display = "none";
        analysisArea.style.display = "none";
        lastResult = null;
        lastParams = null;
        hideError();
        if (typeof showToast === "function") showToast("🧹 Cleared");
    }

    /* ============================================================
       COPY
       ============================================================ */
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
       HISTORY
       ============================================================ */
    function pushHistory(mode, inputPreview, outputPreview) {
        history.unshift({
            mode,
            inputPreview: (inputPreview || "").replace(/\s+/g, " ").slice(0, 50),
            outputPreview: (outputPreview || "").replace(/\s+/g, " ").slice(0, 50),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 30) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            urlHistoryList.innerHTML = '<div class="empty-history">No operations yet</div>';
            return;
        }
        urlHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-time">
                        <span class="hi-mode-badge ${h.mode}">${h.mode}</span>
                        ${escapeHtml(h.time)}
                    </span>
                    <span class="hi-preview">${escapeHtml(h.inputPreview || "(empty)")}</span>
                </div>
                <span class="hi-arrow">→ ${escapeHtml((h.outputPreview || "").slice(0, 20))}</span>
            </div>
        `).join("");

        urlHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                if (h.mode === "encode") {
                    setMode("encode");
                    encodeInput.value = h.inputPreview;
                    updateEncCounter();
                    doEncode();
                } else if (h.mode === "decode") {
                    setMode("decode");
                    decodeInput.value = h.inputPreview;
                    updateDecCounter();
                    doDecode();
                } else if (h.mode === "query") {
                    setMode("query");
                    queryInput.value = h.inputPreview;
                    parseQueryParams();
                } else if (h.mode === "analyze") {
                    setMode("analyze");
                    analyzeInput.value = h.inputPreview;
                    analyzeURL();
                }
            });
        });
    }

    /* ============================================================
       OUTPUT ACTIONS
       ============================================================ */
    copyOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        copyToClipboard(lastResult.text);
    });

    downloadOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const blob = new Blob([lastResult.text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${lastResult.mode}-output.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === "function") showToast("📥 Downloaded");
    });

    sendToInputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        if (currentMode === "encode") {
            decodeInput.value = lastResult.text;
            updateDecCounter();
            setMode("decode");
        } else if (currentMode === "decode") {
            encodeInput.value = lastResult.text;
            updateEncCounter();
            setMode("encode");
        }
    });

    /* Query copy actions */
    copyParamsJson.addEventListener("click", () => {
        if (!lastParams) return;
        const obj = {};
        lastParams.forEach((p) => { obj[p.key] = p.value; });
        copyToClipboard(JSON.stringify(obj, null, 2));
    });

    copyParamsQuery.addEventListener("click", () => {
        if (!lastParams) return;
        const qs = lastParams.map((p) =>
            `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
        ).join("&");
        copyToClipboard(qs);
    });

    /* ============================================================
       EVENTS
       ============================================================ */
    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    encTypePills.forEach((p) => {
        p.addEventListener("click", () => {
            encTypePills.forEach((x) => x.classList.remove("active"));
            p.classList.add("active");
            currentEtype = p.dataset.etype;
            if (currentMode === "encode" && encodeInput.value) doEncode();
        });
    });

    processBtn.addEventListener("click", process);
    swapBtn.addEventListener("click", swapDirection);
    clearAllBtn.addEventListener("click", clearAll);

    parseQueryBtn.addEventListener("click", parseQueryParams);
    analyzeBtn.addEventListener("click", analyzeURL);

    // Live encode
    encodeInput.addEventListener("input", () => {
        updateEncCounter();
        if (encAuto.checked) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
                if (encodeInput.value) doEncode();
            }, 350);
        }
    });

    // Live decode
    decodeInput.addEventListener("input", () => {
        updateDecCounter();
        if (decAuto.checked) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
                if (decodeInput.value.trim()) doDecode();
            }, 350);
        }
    });

    // Re-run on option change
    encUpper.addEventListener("change", () => {
        if (currentMode === "encode" && encodeInput.value) doEncode();
    });
    decReplacePlus.addEventListener("change", () => {
        if (currentMode === "decode" && decodeInput.value) doDecode();
    });
    qryDecodeValues.addEventListener("change", () => {
        if (currentMode === "query" && queryInput.value) parseQueryParams();
    });

    /* Paste buttons */
    async function pasteInto(el, counter) {
        try {
            const text = await navigator.clipboard.readText();
            el.value = text;
            if (counter) counter();
            return true;
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
            return false;
        }
    }

    encPaste.addEventListener("click", async () => {
        if (await pasteInto(encodeInput, updateEncCounter) && encAuto.checked) doEncode();
    });
    decPaste.addEventListener("click", async () => {
        if (await pasteInto(decodeInput, updateDecCounter) && decAuto.checked) doDecode();
    });
    qryPaste.addEventListener("click", async () => {
        if (await pasteInto(queryInput)) parseQueryParams();
    });
    anaPaste.addEventListener("click", async () => {
        if (await pasteInto(analyzeInput)) analyzeURL();
    });

    /* Clear buttons */
    encClear.addEventListener("click", () => {
        encodeInput.value = "";
        updateEncCounter();
    });
    decClear.addEventListener("click", () => {
        decodeInput.value = "";
        updateDecCounter();
    });

    /* Sample buttons */
    encSample.addEventListener("click", () => {
        encodeInput.value = "https://example.com/search?q=hello world&lang=en&emoji=🚀";
        updateEncCounter();
        doEncode();
    });

    decSample.addEventListener("click", () => {
        decodeInput.value = "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26lang%3Den%26emoji%3D%F0%9F%9A%80";
        updateDecCounter();
        doDecode();
    });

    qrySample.addEventListener("click", () => {
        queryInput.value = "https://shop.example.com/products?category=electronics&sort=price_asc&min=100&max=500&brand=Apple&brand=Samsung&utm_source=google&utm_campaign=spring_sale";
        parseQueryParams();
    });

    anaSample.addEventListener("click", () => {
        analyzeInput.value = "https://user:secret@api.example.com:8443/v2/users/42/posts?include=comments&limit=20&sort=-created_at#top";
        analyzeURL();
    });

    /* Clear history */
    clearUrlHistory.addEventListener("click", () => {
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
        const typing = tag === "input" || tag === "textarea" || tag === "select";

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            process();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "x") {
            e.preventDefault();
            swapDirection();
            return;
        }
        if (!typing && e.key === "Escape") {
            e.preventDefault();
            clearAll();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareUrlEncoder = function () {
        const shareData = {
            title: "URL Encoder/Decoder - Tool Hub",
            text: "Encode & decode URLs safely with query param parser & analyzer!",
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
        setMode("encode");
        updateEncCounter();
        updateDecCounter();
        renderHistory();
    }

    init();
})();