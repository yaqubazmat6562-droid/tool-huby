/* ============================================================
   UUID GENERATOR - Advanced Logic
   Generate (v1, v4, v5, Nano) · Validate · Info · Bulk
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const uuidCard       = document.getElementById("uuidCard");
    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");

    const versionGrid    = document.getElementById("versionGrid");
    const versionBtns    = document.querySelectorAll(".ver-btn");
    const v5Panel        = document.getElementById("v5Panel");
    const nanoPanel      = document.getElementById("nanoPanel");

    const v5Namespace    = document.getElementById("v5Namespace");
    const v5CustomWrap   = document.getElementById("v5CustomWrap");
    const v5Custom       = document.getElementById("v5Custom");
    const v5Name         = document.getElementById("v5Name");

    const nanoLength     = document.getElementById("nanoLength");
    const nanoAlphabet   = document.getElementById("nanoAlphabet");

    const quantityInput  = document.getElementById("quantity");
    const formatSelect   = document.getElementById("formatSelect");
    const qtyBtns        = document.querySelectorAll(".qty-btn");
    const qqBtns         = document.querySelectorAll(".qq-btn");

    const validateInput  = document.getElementById("validateInput");
    const pasteValidate  = document.getElementById("pasteValidate");
    const sampleValidate = document.getElementById("sampleValidate");
    const clearValidate  = document.getElementById("clearValidate");

    const infoInput      = document.getElementById("infoInput");
    const pasteInfo      = document.getElementById("pasteInfo");
    const sampleInfo     = document.getElementById("sampleInfo");
    const clearInfo      = document.getElementById("clearInfo");

    const generateBtn    = document.getElementById("generateBtn");
    const processBtnLabel= document.getElementById("processBtnLabel");
    const regenBtn       = document.getElementById("regenBtn");
    const clearAllBtn    = document.getElementById("clearAllBtn");

    const outputArea     = document.getElementById("outputArea");
    const outputLabel    = document.getElementById("outputLabel");
    const outputContent  = document.getElementById("outputContent");
    const outputStats    = document.getElementById("outputStats");
    const uuidListWrap   = document.getElementById("uuidListWrap");
    const uuidList       = document.getElementById("uuidList");

    const copyOutputBtn  = document.getElementById("copyOutputBtn");
    const downloadOutputBtn = document.getElementById("downloadOutputBtn");
    const sendToValidate = document.getElementById("sendToValidate");

    const validationArea = document.getElementById("validationArea");
    const vaHeader       = document.getElementById("vaHeader");
    const vaTitle        = document.getElementById("vaTitle");
    const vaSummary      = document.getElementById("vaSummary");
    const vaBody         = document.getElementById("vaBody");

    const infoArea       = document.getElementById("infoArea");
    const infoGrid       = document.getElementById("infoGrid");

    const uuidError      = document.getElementById("uuidError");

    const uuidHistoryList= document.getElementById("uuidHistoryList");
    const clearUuidHistory= document.getElementById("clearUuidHistory");

    /* ---------------- State ---------------- */
    let currentMode      = "generate";   // generate | validate | info
    let currentVersion   = "v4";         // v4 | v1 | v5 | nanoid
    let lastResult       = null;
    let lastUuids        = [];
    let history          = loadHistory();

    /* ---------------- Constants ---------------- */
    const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const UUID_V1_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const UUID_V5_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const UUID_ANY_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const NAMESPACES = {
        dns:  "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        url:  "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        oid:  "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
        x500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
    };

    const NANO_ALPHABETS = {
        default: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-",
        alnum:   "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        lower:   "abcdefghijklmnopqrstuvwxyz",
        upper:   "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        num:     "0123456789",
        hex:     "0123456789abcdef",
    };

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_uuid_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_uuid_history", JSON.stringify(history.slice(0, 20)));
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
        uuidError.textContent = msg;
        uuidError.classList.add("show");
        uuidError.style.animation = "none";
        void uuidError.offsetWidth;
        uuidError.style.animation = "";
    }
    function hideError() {
        uuidError.classList.remove("show");
        uuidError.textContent = "";
    }

    /* ============================================================
       UUID GENERATION
       ============================================================ */
    function randomHex(len) {
        const bytes = new Uint8Array(Math.ceil(len / 2));
        crypto.getRandomValues(bytes);
        let hex = "";
        for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
        return hex.slice(0, len);
    }

    // UUID v4 — Random
    function uuidV4() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        // Set version 4
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        // Set variant
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }

    // UUID v1 — Time-based (simple version)
    // 60-bit timestamp since 1582-10-15, plus random node
    const GREGORIAN_OFFSET = 12219292800000; // ms between 1582-10-15 and 1970-01-01
    function uuidV1() {
        // 100-nanosecond intervals since Gregorian epoch
        const now = Date.now();
        const time = (now + GREGORIAN_OFFSET) * 10000;
        const timeLow = (time & 0xffffffff).toString(16).padStart(8, "0");
        const timeMid = ((time / 0x100000000) & 0xffff).toString(16).padStart(4, "0");
        const timeHi  = (((time / 0x1000000000000) & 0x0fff) | 0x1000).toString(16).padStart(4, "0");
        const clockSeq = ((Math.random() * 0x3fff) | 0x8000).toString(16).padStart(4, "0");
        // 48-bit node (random, with multicast bit set)
        const nodeBytes = new Uint8Array(6);
        crypto.getRandomValues(nodeBytes);
        nodeBytes[0] = (nodeBytes[0] | 0x01);
        const node = Array.from(nodeBytes, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
    }

    // UUID v5 — SHA-1 namespace + name
    // Requires a SHA-1 implementation. We'll use SubtleCrypto (async).
    async function uuidV5(namespaceUuid, name) {
        // Convert namespace UUID (hex, dashless) to bytes
        const nsHex = namespaceUuid.replace(/-/g, "");
        const nsBytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) nsBytes[i] = parseInt(nsHex.substr(i * 2, 2), 16);

        // Encode name to UTF-8
        const nameBytes = new TextEncoder().encode(name);

        // Concatenate namespace + name
        const data = new Uint8Array(nsBytes.length + nameBytes.length);
        data.set(nsBytes, 0);
        data.set(nameBytes, nsBytes.length);

        // SHA-1
        const hashBuf = await crypto.subtle.digest("SHA-1", data);
        const hash = new Uint8Array(hashBuf).slice(0, 16);

        // Set version 5
        hash[6] = (hash[6] & 0x0f) | 0x50;
        // Set variant
        hash[8] = (hash[8] & 0x3f) | 0x80;

        const hex = Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }

    // Nano ID
    function nanoId(len, alphabet) {
        const bytes = new Uint8Array(len);
        crypto.getRandomValues(bytes);
        let out = "";
        for (let i = 0; i < len; i++) {
            out += alphabet[bytes[i] % alphabet.length];
        }
        return out;
    }

    /* ============================================================
       FORMAT APPLY
       ============================================================ */
    function applyFormat(uuids, format) {
        if (format === "comma") return uuids.join(", ");
        if (format === "json")  return JSON.stringify(uuids, null, 2);
        if (format === "python") return "[" + uuids.map((u) => `"${u}"`).join(", ") + "]";
        if (format === "php")   return "[" + uuids.map((u) => `"${u}"`).join(", ") + "]";
        if (format === "js")    return "[" + uuids.map((u) => `"${u}"`).join(", ") + "]";
        if (format === "sql") {
            // SQL IN clause — chunk 100
            const chunks = [];
            for (let i = 0; i < uuids.length; i += 100) {
                const chunk = uuids.slice(i, i + 100);
                chunks.push("(" + chunk.map((u) => `'${u}'`).join(", ") + ")");
            }
            return "IN " + chunks.join(" OR IN ");
        }

        // Per-item formats
        return uuids.map((u) => {
            switch (format) {
                case "uppercase": return u.toUpperCase();
                case "nodash":    return u.replace(/-/g, "");
                case "braces":    return `{${u}}`;
                case "urn":       return `urn:uuid:${u}`;
                case "quote":     return `"${u}"`;
                case "single":    return `'${u}'`;
                default:          return u;
            }
        }).join("\n");
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
            generate: "Generate UUID",
            validate: "Validate UUIDs",
            info: "Get UUID Info",
        };
        processBtnLabel.textContent = labels[mode] || "Process";

        // Show/hide output areas
        if (mode === "generate") {
            outputArea.style.display = lastResult && lastResult.mode === "generate" ? "block" : "none";
            validationArea.style.display = "none";
            infoArea.style.display = "none";
        } else if (mode === "validate") {
            outputArea.style.display = "none";
            infoArea.style.display = "none";
        } else if (mode === "info") {
            outputArea.style.display = "none";
            validationArea.style.display = "none";
        }
    }

    /* ============================================================
       VERSION SELECTION
       ============================================================ */
    function setVersion(version) {
        currentVersion = version;
        versionBtns.forEach((b) => b.classList.toggle("active", b.dataset.version === version));
        v5Panel.style.display = version === "v5" ? "block" : "none";
        nanoPanel.style.display = version === "nanoid" ? "block" : "none";
    }

    /* ============================================================
       GENERATE
       ============================================================ */
    async function doGenerate() {
        hideError();

        // Read quantity
        let qty = parseInt(quantityInput.value, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        if (qty > 1000) qty = 1000;
        quantityInput.value = qty;

        // Validate v5 params
        if (currentVersion === "v5") {
            const name = v5Name.value.trim();
            if (!name) {
                showError("⚠️ Please enter a name for UUID v5");
                v5Name.focus();
                return;
            }
            if (v5Namespace.value === "custom") {
                const custom = v5Custom.value.trim();
                if (!UUID_ANY_REGEX.test(custom)) {
                    showError("⚠️ Invalid custom namespace UUID");
                    v5Custom.focus();
                    return;
                }
            }
        }

        // Nano length validation
        if (currentVersion === "nanoid") {
            let len = parseInt(nanoLength.value, 10);
            if (isNaN(len) || len < 4) len = 4;
            if (len > 64) len = 64;
            nanoLength.value = len;
        }

        const uuids = [];
        try {
            if (currentVersion === "v4") {
                for (let i = 0; i < qty; i++) uuids.push(uuidV4());
            } else if (currentVersion === "v1") {
                for (let i = 0; i < qty; i++) uuids.push(uuidV1());
            } else if (currentVersion === "v5") {
                // Namespace resolution
                let ns = v5Namespace.value;
                if (ns === "custom") ns = v5Custom.value.trim();
                const name = v5Name.value.trim();

                for (let i = 0; i < qty; i++) {
                    const nameForThis = qty === 1 ? name : `${name}-${i + 1}`;
                    const uuid = await uuidV5(ns, nameForThis);
                    uuids.push(uuid);
                }
            } else if (currentVersion === "nanoid") {
                const alphaKey = nanoAlphabet.value;
                const alphabet = NANO_ALPHABETS[alphaKey] || NANO_ALPHABETS.default;
                const len = parseInt(nanoLength.value, 10) || 21;
                for (let i = 0; i < qty; i++) uuids.push(nanoId(len, alphabet));
            }
        } catch (e) {
            showError("❌ Generation failed: " + e.message);
            return;
        }

        // Format
        const format = formatSelect.value;
        const formatted = applyFormat(uuids, format);

        // Display
        showOutput(formatted, uuids, "generate");

        pushHistory("generate", `${qty}× ${currentVersion} (${format})`, uuids[0] ? uuids[0].slice(0, 20) + "…" : "");

        if (typeof showToast === "function") {
            showToast(`✨ Generated ${qty} ${currentVersion.toUpperCase()}`);
        }
    }

    /* ============================================================
       SHOW OUTPUT
       ============================================================ */
    function showOutput(text, uuids, mode) {
        outputArea.style.display = "block";
        outputContent.textContent = text;

        const bytes = new Blob([text]).size;
        outputStats.textContent = `${uuids.length} UUID${uuids.length !== 1 ? "s" : ""} · ${bytes.toLocaleString()} bytes`;

        // Per-item list (only if qty <= 100)
        if (uuids.length <= 100 && uuids.length > 0) {
            uuidListWrap.style.display = "block";
            uuidList.innerHTML = uuids.map((u, i) => `
                <div class="uuid-item" data-uuid="${escapeHtml(u)}">
                    <span class="ui-num">#${i + 1}</span>
                    <span class="ui-val">${escapeHtml(u)}</span>
                    <span class="ui-copy"><i class="fa-solid fa-copy"></i></span>
                </div>
            `).join("");

            uuidList.querySelectorAll(".uuid-item").forEach((el) => {
                el.addEventListener("click", () => {
                    copyToClipboard(el.dataset.uuid);
                });
            });
        } else {
            uuidListWrap.style.display = "none";
        }

        lastResult = { text, mode, uuids };
        lastUuids = uuids;

        // Scroll into view
        setTimeout(() => {
            const r = outputArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       VALIDATE
       ============================================================ */
    function doValidate() {
        hideError();
        const raw = validateInput.value;
        if (!raw.trim()) {
            showError("⚠️ Please enter UUIDs to validate");
            validateInput.focus();
            return;
        }

        // Split by newlines, commas, spaces
        const candidates = raw
            .split(/[\n,;\s]+/)
            .map((s) => s.trim().replace(/^["'\[{]+|["'\]}]+$/g, "").replace(/^urn:uuid:/i, ""))
            .filter(Boolean);

        // Remove duplicates
        const unique = [...new Set(candidates)];

        let validCount = 0, invalidCount = 0, warningCount = 0;
        const items = unique.map((u) => {
            const analysis = analyzeUuid(u);
            if (analysis.valid) validCount++;
            else invalidCount++;
            if (analysis.warnings && analysis.warnings.length > 0) warningCount++;
            return analysis;
        });

        // Summary
        vaSummary.innerHTML = `
            <div class="va-summary-card pass">
                <div class="vsc-value">${validCount}</div>
                <div class="vsc-label">Valid</div>
            </div>
            <div class="va-summary-card fail">
                <div class="vsc-value">${invalidCount}</div>
                <div class="vsc-label">Invalid</div>
            </div>
            <div class="va-summary-card warn">
                <div class="vsc-value">${warningCount}</div>
                <div class="vsc-label">Warnings</div>
            </div>
        `;

        // Header
        vaHeader.classList.remove("pass", "fail", "partial");
        if (invalidCount === 0 && warningCount === 0) {
            vaHeader.classList.add("pass");
            vaTitle.textContent = `All ${validCount} UUID${validCount !== 1 ? "s" : ""} valid`;
            vaHeader.querySelector("i").className = "fa-solid fa-circle-check";
        } else if (invalidCount === 0) {
            vaHeader.classList.add("partial");
            vaTitle.textContent = `${validCount} valid · ${warningCount} warning${warningCount !== 1 ? "s" : ""}`;
            vaHeader.querySelector("i").className = "fa-solid fa-triangle-exclamation";
        } else if (validCount === 0) {
            vaHeader.classList.add("fail");
            vaTitle.textContent = `All ${invalidCount} invalid`;
            vaHeader.querySelector("i").className = "fa-solid fa-times-circle";
        } else {
            vaHeader.classList.add("partial");
            vaTitle.textContent = `${validCount} valid · ${invalidCount} invalid`;
            vaHeader.querySelector("i").className = "fa-solid fa-triangle-exclamation";
        }

        // Body
        vaBody.innerHTML = items.map((item) => `
            <div class="va-item ${item.valid ? "valid" : "invalid"}">
                <i class="fa-solid ${item.valid ? "fa-check-circle" : "fa-times-circle"}"></i>
                <div class="vi-body">
                    <div class="vi-uuid">${escapeHtml(item.original)}</div>
                    <div class="vi-note">${escapeHtml(item.message)}</div>
                    ${item.badges && item.badges.length > 0 ? `<div class="vi-badges">${item.badges.map(b => `<span class="vi-badge ${b.cls}">${escapeHtml(b.label)}</span>`).join("")}</div>` : ""}
                </div>
            </div>
        `).join("");

        validationArea.style.display = "block";
        pushHistory("validate", `${unique.length} input`, `${validCount} valid / ${invalidCount} invalid`);

        if (typeof showToast === "function") {
            showToast(invalidCount === 0 ? `✅ All valid` : `⚠️ ${invalidCount} invalid`);
        }

        setTimeout(() => {
            const r = validationArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                validationArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       ANALYZE UUID
       ============================================================ */
    function analyzeUuid(uuid) {
        const original = uuid;
        const trimmed = uuid.trim();
        const result = {
            original,
            valid: false,
            message: "",
            badges: [],
            warnings: [],
            info: null,
        };

        if (!trimmed) {
            result.message = "Empty string";
            return result;
        }

        // Try parse
        if (!UUID_ANY_REGEX.test(trimmed)) {
            result.message = "Not a valid UUID format";
            return result;
        }

        // Extract version
        const version = parseInt(trimmed.charAt(14), 16);
        const variantNibble = parseInt(trimmed.charAt(19), 16);
        const variantBits = (variantNibble & 0xc) >> 2;

        if (variantBits !== 2) {
            result.message = "Invalid variant bits (expected RFC 4122 variant)";
            result.warnings.push("invalid-variant");
            return result;
        }

        result.valid = true;
        result.info = {
            version,
            variant: "RFC 4122",
            timestamp: null,
            node: null,
        };

        // Version-specific badges and info
        if (version === 1) {
            result.badges.push({ label: "v1", cls: "v1" });
            result.message = "Valid time-based UUID v1";
            // Try to extract timestamp
            try {
                const timeLow = trimmed.substring(0, 8);
                const timeMid = trimmed.substring(9, 13);
                const timeHi = trimmed.substring(14, 18);
                const timestamp = parseInt(timeHi + timeMid + timeLow, 16);
                // Convert from 100ns Gregorian intervals
                const ms = timestamp / 10000 - GREGORIAN_OFFSET;
                const date = new Date(ms);
                if (!isNaN(date.getTime())) {
                    result.info.timestamp = date;
                }
                result.info.node = trimmed.substring(24).replace(/-/g, "");
            } catch (e) {}
        } else if (version === 4) {
            result.badges.push({ label: "v4", cls: "v4" });
            result.message = "Valid random UUID v4";
        } else if (version === 5) {
            result.badges.push({ label: "v5", cls: "v5" });
            result.message = "Valid SHA-1 namespace UUID v5";
        } else if (version === 3) {
            result.badges.push({ label: "v3", cls: "other" });
            result.message = "Valid MD5 namespace UUID v3";
        } else if (version === 2) {
            result.badges.push({ label: "v2", cls: "other" });
            result.message = "Valid DCE Security UUID v2";
        } else {
            result.badges.push({ label: "v" + version, cls: "other" });
            result.message = `Valid UUID with version ${version}`;
            result.warnings.push("unknown-version");
        }

        // Nil UUID check
        if (trimmed === "00000000-0000-0000-0000-000000000000") {
            result.warnings.push("nil-uuid");
            result.message += " (Nil UUID)";
        }

        // Max UUID check
        if (trimmed.toLowerCase() === "ffffffff-ffff-ffff-ffff-ffffffffffff") {
            result.warnings.push("max-uuid");
            result.message += " (Max UUID)";
        }

        return result;
    }

    /* ============================================================
       INFO
       ============================================================ */
    function doInfo() {
        hideError();
        const raw = infoInput.value.trim();
        if (!raw) {
            showError("⚠️ Please enter a UUID to inspect");
            infoInput.focus();
            return;
        }

        // Normalize (strip decoration)
        const cleaned = raw
            .replace(/^urn:uuid:/i, "")
            .replace(/^["'\[{]+|["'\]}]+$/g, "")
            .trim();

        const analysis = analyzeUuid(cleaned);

        // Render info grid
        const rows = [];

        rows.push({
            label: "UUID",
            icon: "fa-fingerprint",
            value: cleaned,
            fullWidth: true,
        });

        rows.push({
            label: "Valid",
            icon: "fa-circle-check",
            value: analysis.valid ? "✓ Yes" : "✗ No",
            cls: analysis.valid ? "ok" : "fail",
        });

        rows.push({
            label: "Version",
            icon: "fa-tag",
            value: analysis.valid ? "v" + analysis.info.version : "—",
        });

        rows.push({
            label: "Variant",
            icon: "fa-shield-halved",
            value: analysis.valid ? analysis.info.variant : "—",
        });

        rows.push({
            label: "Uppercase",
            icon: "fa-arrow-up",
            value: cleaned.toUpperCase(),
            fullWidth: true,
        });

        rows.push({
            label: "No Dashes",
            icon: "fa-minus",
            value: cleaned.replace(/-/g, ""),
            fullWidth: true,
        });

        rows.push({
            label: "Braces Form",
            icon: "fa-code",
            value: "{" + cleaned + "}",
            fullWidth: true,
        });

        rows.push({
            label: "URN Form",
            icon: "fa-link",
            value: "urn:uuid:" + cleaned,
            fullWidth: true,
        });

        if (analysis.valid && analysis.info.timestamp) {
            rows.push({
                label: "Timestamp",
                icon: "fa-clock",
                value: analysis.info.timestamp.toLocaleString(),
                fullWidth: true,
                cls: "text",
            });
        }

        if (analysis.valid && analysis.info.node) {
            rows.push({
                label: "Node",
                icon: "fa-server",
                value: analysis.info.node,
                fullWidth: true,
            });
        }

        // Byte breakdown
        if (analysis.valid) {
            const hex = cleaned.replace(/-/g, "");
            const bytes = [];
            for (let i = 0; i < hex.length; i += 2) {
                bytes.push(hex.substr(i, 2));
            }
            rows.push({
                label: "Byte Breakdown (16 bytes)",
                icon: "fa-layer-group",
                value: bytes.join(" "),
                fullWidth: true,
            });
        }

        infoGrid.innerHTML = rows.map((r, i) => `
            <div class="info-item ${r.fullWidth ? "full-width" : ""}" style="animation-delay:${i * 0.04}s">
                <span class="info-label"><i class="fa-solid ${r.icon}"></i> ${escapeHtml(r.label)}</span>
                <span class="info-value ${r.cls || ""}">${escapeHtml(r.value)}</span>
            </div>
        `).join("");

        infoArea.style.display = "block";
        pushHistory("info", cleaned.slice(0, 24) + "…", analysis.valid ? "Valid v" + analysis.info.version : "Invalid");

        if (typeof showToast === "function") {
            showToast(analysis.valid ? "✅ Valid UUID" : "❌ Invalid UUID");
        }

        setTimeout(() => {
            const r = infoArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                infoArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       MAIN PROCESS
       ============================================================ */
    function process() {
        switch (currentMode) {
            case "generate": doGenerate(); break;
            case "validate": doValidate(); break;
            case "info":     doInfo(); break;
        }
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

    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: "text/plain" });
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
            inputPreview: (inputPreview || "").replace(/\s+/g, " ").slice(0, 60),
            outputPreview: (outputPreview || "").replace(/\s+/g, " ").slice(0, 60),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 20) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            uuidHistoryList.innerHTML = '<div class="empty-history">No actions yet</div>';
            return;
        }
        uuidHistoryList.innerHTML = history.map((h, i) => `
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

        uuidHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                // Just switch mode; user can paste
                if (h.mode === "generate") setMode("generate");
                else if (h.mode === "validate") {
                    setMode("validate");
                    validateInput.value = "";
                } else if (h.mode === "info") {
                    setMode("info");
                    infoInput.value = "";
                }
            });
        });
    }

    /* ============================================================
       EVENT LISTENERS
       ============================================================ */
    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    versionBtns.forEach((btn) => {
        btn.addEventListener("click", () => setVersion(btn.dataset.version));
    });

    v5Namespace.addEventListener("change", () => {
        v5CustomWrap.style.display = v5Namespace.value === "custom" ? "block" : "none";
    });

    // Quantity stepper
    qtyBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            let val = parseInt(quantityInput.value, 10) || 1;
            if (btn.dataset.qty === "-") val = Math.max(1, val - 1);
            else val = Math.min(1000, val + 1);
            quantityInput.value = val;
            updateQtyChips();
        });
    });

    quantityInput.addEventListener("input", updateQtyChips);

    function updateQtyChips() {
        const val = parseInt(quantityInput.value, 10);
        qqBtns.forEach((b) => {
            b.classList.toggle("active", parseInt(b.dataset.qvalue, 10) === val);
        });
    }

    // Quick qty buttons
    qqBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            quantityInput.value = btn.dataset.qvalue;
            updateQtyChips();
        });
    });

    // Generate / Process
    generateBtn.addEventListener("click", process);

    // Regenerate
    regenBtn.addEventListener("click", () => {
        if (currentMode === "generate") doGenerate();
        else if (currentMode === "info") doInfo();
    });

    // Clear all
    clearAllBtn.addEventListener("click", () => {
        if (confirm("Clear all inputs and outputs?")) {
            validateInput.value = "";
            infoInput.value = "";
            v5Name.value = "";
            v5Custom.value = "";
            outputArea.style.display = "none";
            validationArea.style.display = "none";
            infoArea.style.display = "none";
            hideError();
            lastResult = null;
            lastUuids = [];
            if (typeof showToast === "function") showToast("🧹 Cleared");
        }
    });

    // Validate quick actions
    pasteValidate.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            validateInput.value = text;
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    sampleValidate.addEventListener("click", () => {
        validateInput.value = [
            "550e8400-e29b-41d4-a716-446655440000",
            "9c858901-8a57-4791-81fe-4c455b099bc9",
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "{a3bb189e-8bf9-3888-9912-ace4e6543002}",
            "invalid-uuid-here",
            "00000000-0000-0000-0000-000000000000",
            "ffffffff-ffff-ffff-ffff-ffffffffffff",
            "urn:uuid:123e4567-e89b-12d3-a456-426614174000",
        ].join("\n");
        doValidate();
    });

    clearValidate.addEventListener("click", () => {
        validateInput.value = "";
        validationArea.style.display = "none";
    });

    // Info quick actions
    pasteInfo.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            infoInput.value = text;
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    sampleInfo.addEventListener("click", () => {
        infoInput.value = "550e8400-e29b-41d4-a716-446655440000";
        doInfo();
    });

    clearInfo.addEventListener("click", () => {
        infoInput.value = "";
        infoArea.style.display = "none";
    });

    // Output actions
    copyOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        copyToClipboard(lastResult.text);
    });

    downloadOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const ext = formatSelect.value === "json" ? "json" : "txt";
        downloadFile(lastResult.text, `uuids.${ext}`);
    });

    sendToValidate.addEventListener("click", () => {
        if (!lastUuids || lastUuids.length === 0) return;
        validateInput.value = lastUuids.join("\n");
        setMode("validate");
        setTimeout(() => doValidate(), 100);
    });

    // Clear history
    clearUuidHistory.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    // Enter to process in validate/info modes
    validateInput.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            doValidate();
        }
    });

    infoInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            doInfo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            doInfo();
        }
    });

    v5Name.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            doGenerate();
        }
    });

    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select";
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            process();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
            e.preventDefault();
            if (lastResult) copyToClipboard(lastResult.text);
            return;
        }
        if (!typing && e.key === "Escape") {
            e.preventDefault();
            clearAllBtn.click();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareUuidGenerator = function () {
        const shareData = {
            title: "UUID Generator - Tool Hub",
            text: "Generate RFC-compliant UUIDs v1, v4, v5 & Nano IDs!",
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
        setMode("generate");
        setVersion("v4");
        updateQtyChips();
        renderHistory();
    }

    init();
})();