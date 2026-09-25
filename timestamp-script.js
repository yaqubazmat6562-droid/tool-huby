/* ============================================================
   TIMESTAMP CONVERTER - Advanced Logic
   Timestamp ↔ Date · Batch · Timezones · Relative · ISO/RFC
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const tsCard         = document.getElementById("tsCard");
    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");

    // Live clock
    const liveUnix       = document.getElementById("liveUnix");
    const liveIso        = document.getElementById("liveIso");
    const liveUtc        = document.getElementById("liveUtc");

    // Mode 1: TS → Date
    const tsInput        = document.getElementById("tsInput");
    const pasteTs        = document.getElementById("pasteTs");
    const nowTs          = document.getElementById("nowTs");
    const clearTs        = document.getElementById("clearTs");
    const unitPills      = document.querySelectorAll(".unit-pill");
    const tzSelect       = document.getElementById("tzSelect");
    const formatSelect   = document.getElementById("formatSelect");

    // Mode 2: Date → TS
    const dateInput      = document.getElementById("dateInput");
    const tzInputSelect  = document.getElementById("tzInputSelect");
    const tsFormatSelect = document.getElementById("tsFormatSelect");
    const nowDate        = document.getElementById("nowDate");
    const clearDate      = document.getElementById("clearDate");

    // Mode 3: Batch
    const batchInput     = document.getElementById("batchInput");
    const pasteBatch     = document.getElementById("pasteBatch");
    const sampleBatch    = document.getElementById("sampleBatch");
    const clearBatch     = document.getElementById("clearBatch");
    const exportBatch    = document.getElementById("exportBatch");

    // Actions
    const convertBtn     = document.getElementById("convertBtn");
    const processBtnLabel= document.getElementById("processBtnLabel");
    const clearAllBtn    = document.getElementById("clearAllBtn");
    const tsError        = document.getElementById("tsError");

    // Output
    const outputArea     = document.getElementById("outputArea");
    const resultHero     = document.getElementById("resultHero");
    const rhLabel        = document.getElementById("rhLabel");
    const rhValue        = document.getElementById("rhValue");
    const rhSub          = document.getElementById("rhSub");
    const resultGrid     = document.getElementById("resultGrid");

    const copyResultBtn  = document.getElementById("copyResultBtn");
    const shareResultBtn = document.getElementById("shareResultBtn");
    const clearResultBtn = document.getElementById("clearResultBtn");

    // Batch output
    const batchArea      = document.getElementById("batchArea");
    const batchCount     = document.getElementById("batchCount");
    const batchBody      = document.getElementById("batchBody");

    // Quick timestamps
    const quickTsGrid    = document.getElementById("quickTsGrid");

    // History
    const tsHistoryList  = document.getElementById("tsHistoryList");
    const clearTsHistory = document.getElementById("clearTsHistory");

    /* ---------------- State ---------------- */
    let currentMode      = "ts-to-date";  // ts-to-date | date-to-ts | batch
    let currentUnit      = "auto";        // auto | s | ms | us | ns
    let lastResult       = null;
    let history          = loadHistory();
    let liveTimer        = null;

    /* ---------------- Constants ---------------- */
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    const COMMON_TIMEZONES = [
        { value: "local", label: "Local Time" },
        { value: "UTC", label: "UTC / GMT" },
        { value: "America/New_York", label: "New York (EST/EDT)" },
        { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
        { value: "America/Chicago", label: "Chicago (CST/CDT)" },
        { value: "Europe/London", label: "London (GMT/BST)" },
        { value: "Europe/Paris", label: "Paris (CET/CEST)" },
        { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
        { value: "Europe/Moscow", label: "Moscow (MSK)" },
        { value: "Asia/Dubai", label: "Dubai (GST)" },
        { value: "Asia/Karachi", label: "Karachi (PKT)" },
        { value: "Asia/Kolkata", label: "Mumbai/Delhi (IST)" },
        { value: "Asia/Dhaka", label: "Dhaka (BST)" },
        { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
        { value: "Asia/Singapore", label: "Singapore (SGT)" },
        { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
        { value: "Asia/Shanghai", label: "Shanghai (CST)" },
        { value: "Asia/Tokyo", label: "Tokyo (JST)" },
        { value: "Asia/Seoul", label: "Seoul (KST)" },
        { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
        { value: "Pacific/Auckland", label: "Auckland (NZDT/NZST)" },
        { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
        { value: "Africa/Cairo", label: "Cairo (EET)" },
        { value: "Africa/Lagos", label: "Lagos (WAT)" },
        { value: "Africa/Johannesburg", label: "Johannesburg (SAST)" },
    ];

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_timestamp_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_timestamp_history", JSON.stringify(history.slice(0, 20)));
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

    function showError(msg) {
        tsError.textContent = msg;
        tsError.classList.add("show");
        tsError.style.animation = "none";
        void tsError.offsetWidth;
        tsError.style.animation = "";
    }
    function hideError() {
        tsError.classList.remove("show");
        tsError.textContent = "";
    }

    function pad(n) { return String(n).padStart(2, "0"); }

    /* ============================================================
       TIMEZONE HELPERS
       ============================================================ */
    function getPartsInTz(date, tz) {
        // Returns object { year, month, day, hour, minute, second, weekday, weekdayShort, monthShort }
        if (tz === "local") {
            return {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hour: date.getHours(),
                minute: date.getMinutes(),
                second: date.getSeconds(),
                weekday: date.getDay(),
                weekdayShort: DAYS[date.getDay()],
                monthShort: MONTHS[date.getMonth()],
            };
        }

        // Use Intl for timezone-aware extraction
        try {
            const fmt = new Intl.DateTimeFormat("en-US", {
                timeZone: tz,
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                hour12: false, weekday: "short",
            });
            const parts = {};
            fmt.formatToParts(date).forEach((p) => {
                if (p.type !== "literal") parts[p.type] = p.value;
            });

            let hour = parseInt(parts.hour, 10);
            if (hour === 24) hour = 0;

            return {
                year: parseInt(parts.year, 10),
                month: parseInt(parts.month, 10),
                day: parseInt(parts.day, 10),
                hour,
                minute: parseInt(parts.minute, 10),
                second: parseInt(parts.second, 10),
                weekday: parts.weekday,
                weekdayShort: parts.weekday,
                monthShort: MONTHS[parseInt(parts.month, 10) - 1],
            };
        } catch (e) {
            return null;
        }
    }

    function getTzOffsetMinutes(date, tz) {
        // Returns offset in minutes (positive = ahead of UTC)
        if (tz === "local") return -date.getTimezoneOffset();

        if (tz === "UTC") return 0;

        try {
            const dtf = new Intl.DateTimeFormat("en-US", {
                timeZone: tz,
                hour12: false,
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
            });
            const parts = {};
            dtf.formatToParts(date).forEach((p) => {
                if (p.type !== "literal") parts[p.type] = p.value;
            });
            const asUTC = Date.UTC(
                parseInt(parts.year, 10),
                parseInt(parts.month, 10) - 1,
                parseInt(parts.day, 10),
                parseInt(parts.hour === "24" ? "0" : parts.hour, 10),
                parseInt(parts.minute, 10),
                parseInt(parts.second, 10)
            );
            return (asUTC - date.getTime()) / 60000;
        } catch (e) {
            return -date.getTimezoneOffset();
        }
    }

    function formatOffset(offsetMin) {
        const sign = offsetMin >= 0 ? "+" : "-";
        const abs = Math.abs(offsetMin);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return `${sign}${pad(h)}:${pad(m)}`;
    }

    function getTzAbbr(date, tz) {
        // Try to extract short tz name from Intl
        try {
            const fmt = new Intl.DateTimeFormat("en-US", {
                timeZone: tz,
                timeZoneName: "short",
            });
            const parts = fmt.formatToParts(date);
            const tzPart = parts.find((p) => p.type === "timeZoneName");
            return tzPart ? tzPart.value : "";
        } catch (e) {
            return "";
        }
    }

    /* ============================================================
       TIMESTAMP PARSING
       ============================================================ */
    function parseTimestamp(input, unitMode) {
        // Returns { ms, unit } or null
        const cleaned = String(input).trim();
        if (!cleaned) return null;

        // Allow numeric strings and decimals
        if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

        const num = Number(cleaned);
        if (isNaN(num)) return null;

        let unit = unitMode;
        if (unit === "auto") {
            // Heuristic based on magnitude
            const abs = Math.abs(num);
            if (abs >= 1e17) unit = "ns";       // 100+ million years in seconds... rare
            else if (abs >= 1e14) unit = "us";
            else if (abs >= 1e11) unit = "ms";
            else if (abs >= 1e8) unit = "s";
            else unit = "s";                     // small numbers, assume seconds
        }

        let ms;
        switch (unit) {
            case "s":  ms = num * 1000; break;
            case "ms": ms = num; break;
            case "us": ms = num / 1000; break;
            case "ns": ms = num / 1e6; break;
            default:   ms = num * 1000;
        }

        if (!isFinite(ms)) return null;

        // Sanity check: between year 1000 and 3000
        if (ms < -30610224000000 || ms > 32503680000000) {
            return { ms, unit, outOfRange: true };
        }

        return { ms, unit };
    }

    /* ============================================================
       DATE FORMATS
       ============================================================ */
    function toIso(date, tz) {
        const p = getPartsInTz(date, tz);
        if (!p) return "—";
        const off = getTzOffsetMinutes(date, tz);
        // For UTC, we drop the offset
        if (tz === "UTC") {
            return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}Z`;
        }
        // For local with offset 0, still append Z
        const sign = off >= 0 ? "+" : "-";
        const abs = Math.abs(off);
        const offStr = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
        return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${offStr}`;
    }

    function toRfc2822(date, tz) {
        const p = getPartsInTz(date, tz);
        if (!p) return "—";
        const off = getTzOffsetMinutes(date, tz);
        const offStr = formatOffset(off).replace(":", "");
        return `${p.weekdayShort}, ${pad(p.day)} ${p.monthShort} ${p.year} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)} ${offStr}`;
    }

    function toUtcString(date) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${days[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} GMT`;
    }

    function toLocaleString(date, tz) {
        try {
            const opts = {
                year: "numeric", month: "short", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
                hour12: true,
            };
            if (tz && tz !== "local") opts.timeZone = tz;
            return new Intl.DateTimeFormat(undefined, opts).format(date);
        } catch (e) {
            return date.toLocaleString();
        }
    }

    function toDateOnly(date, tz) {
        const p = getPartsInTz(date, tz);
        if (!p) return "—";
        return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
    }

    function toTimeOnly(date, tz) {
        const p = getPartsInTz(date, tz);
        if (!p) return "—";
        return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
    }

    function toFullReadable(date, tz) {
        const p = getPartsInTz(date, tz);
        if (!p) return "—";
        // Long month name
        const monthLong = new Date(p.year, p.month - 1, p.day).toLocaleString("en-US", { month: "long" });
        return `${p.weekdayShort}, ${p.day} ${monthLong} ${p.year} · ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
    }

    function toRelative(date) {
        const now = Date.now();
        const diff = date.getTime() - now;
        const abs = Math.abs(diff);
        const past = diff < 0;

        const units = [
            { name: "year",   ms: 31536000000 },
            { name: "month",  ms: 2592000000 },
            { name: "week",   ms: 604800000 },
            { name: "day",    ms: 86400000 },
            { name: "hour",   ms: 3600000 },
            { name: "minute", ms: 60000 },
            { name: "second", ms: 1000 },
        ];

        for (const u of units) {
            const val = abs / u.ms;
            if (val >= 1 || u.name === "second") {
                const rounded = Math.floor(val);
                const plural = rounded !== 1 ? "s" : "";
                return past
                    ? `${rounded} ${u.name}${plural} ago`
                    : `in ${rounded} ${u.name}${plural}`;
            }
        }
        return "just now";
    }

    /* ============================================================
       LIVE CLOCK
       ============================================================ */
    function updateLiveClock() {
        const now = new Date();
        liveUnix.textContent = Math.floor(now.getTime() / 1000).toLocaleString();
        liveIso.textContent = toIso(now, "local");
        liveUtc.textContent = toUtcString(now);
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
            "ts-to-date": "Convert to Date",
            "date-to-ts": "Convert to Timestamp",
            "batch": "Convert Batch",
        };
        processBtnLabel.textContent = labels[mode] || "Convert";

        // Hide outputs when switching
        outputArea.style.display = "none";
        batchArea.style.display = "none";

        const firstInput = document.querySelector(
            `.mode-content[data-content="${mode}"] input, .mode-content[data-content="${mode}"] textarea`
        );
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }

    /* ============================================================
       TS → DATE
       ============================================================ */
    function convertTsToDate() {
        hideError();
        const raw = tsInput.value.trim();
        if (!raw) {
            showError("⚠️ Please enter a Unix timestamp");
            tsInput.focus();
            return;
        }

        const parsed = parseTimestamp(raw, currentUnit);
        if (!parsed) {
            showError("❌ Invalid timestamp — must be a number");
            return;
        }

        if (parsed.outOfRange) {
            showError("⚠️ Timestamp is out of typical range (year 1000–3000)");
            // Still try to show
        }

        const date = new Date(parsed.ms);
        if (isNaN(date.getTime())) {
            showError("❌ Could not convert to a valid date");
            return;
        }

        const tz = tzSelect.value;
        const formatChoice = formatSelect.value;

        // Hero
        rhLabel.textContent = "HUMAN-READABLE";
        rhValue.textContent = toFullReadable(date, tz);
        rhSub.textContent = `${tz === "local" ? "Local Time" : tz} · ${getTzAbbr(date, tz) || formatOffset(getTzOffsetMinutes(date, tz))}`;

        // Format grid
        const items = [];
        const offMin = getTzOffsetMinutes(date, tz);
        const offStr = formatOffset(offMin);

        if (formatChoice === "all" || formatChoice === "iso") {
            items.push({ label: "ISO 8601", icon: "fa-barcode", value: toIso(date, tz) });
        }
        if (formatChoice === "all" || formatChoice === "rfc") {
            items.push({ label: "RFC 2822", icon: "fa-envelope-open-text", value: toRfc2822(date, tz) });
        }
        if (formatChoice === "all" || formatChoice === "utc") {
            items.push({ label: "UTC String", icon: "fa-globe", value: toUtcString(date) });
        }
        if (formatChoice === "all" || formatChoice === "locale") {
            items.push({ label: "Locale String", icon: "fa-language", value: toLocaleString(date, tz) });
        }
        if (formatChoice === "all" || formatChoice === "dateOnly") {
            items.push({ label: "Date Only (YYYY-MM-DD)", icon: "fa-calendar-day", value: toDateOnly(date, tz) });
        }
        if (formatChoice === "all" || formatChoice === "timeOnly") {
            items.push({ label: "Time Only (HH:MM:SS)", icon: "fa-clock", value: toTimeOnly(date, tz) });
        }
        if (formatChoice === "all" || formatChoice === "relative") {
            items.push({ label: "Relative", icon: "fa-hourglass-half", value: toRelative(date) });
        }

        // Always include these in "all"
        if (formatChoice === "all") {
            items.push({ label: "Timezone Offset", icon: "fa-compass", value: offStr });
            items.push({ label: "Day of Week", icon: "fa-calendar-week", value: getPartsInTz(date, tz).weekdayShort || "—" });
            items.push({ label: "Unix Seconds", icon: "fa-hashtag", value: Math.floor(date.getTime() / 1000).toString() });
            items.push({ label: "Unix Milliseconds", icon: "fa-bolt", value: date.getTime().toString() });
            items.push({ label: "Week Number (ISO)", icon: "fa-calendar", value: getIsoWeek(date) });
            items.push({ label: "Day of Year", icon: "fa-list-ol", value: getDayOfYear(date).toString() });
            items.push({ label: "Leap Year", icon: "fa-check-circle", value: isLeapYear(date.getFullYear()) ? "Yes" : "No" });
            items.push({ label: "Detected Unit", icon: "fa-ruler", value: parsed.unit.toUpperCase() });
        }

        renderResultGrid(items);
        outputArea.style.display = "block";

        lastResult = {
            mode: "ts-to-date",
            input: raw,
            output: toFullReadable(date, tz),
            items,
        };

        pushHistory("ts-to-date", `${raw} (${parsed.unit})`, toFullReadable(date, tz));

        if (typeof showToast === "function") showToast("✅ Converted");

        scrollToResult();
    }

    function getIsoWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${pad(weekNum)}`;
    }

    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / 86400000);
    }

    function isLeapYear(y) {
        return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    }

    /* ============================================================
       DATE → TS
       ============================================================ */
    function convertDateToTs() {
        hideError();
        const val = dateInput.value;
        if (!val) {
            showError("⚠️ Please pick a date and time");
            dateInput.focus();
            return;
        }

        // Parse as local datetime string first
        const localDate = new Date(val);
        if (isNaN(localDate.getTime())) {
            showError("❌ Invalid date/time");
            return;
        }

        const tz = tzInputSelect.value;
        let dateMs;

        if (tz === "local") {
            dateMs = localDate.getTime();
        } else {
            // Interpret the input as if it were in the chosen timezone
            // Strategy: parse components as if UTC, then adjust by the timezone offset
            const [datePart, timePart] = val.split("T");
            const [y, mo, d] = datePart.split("-").map(Number);
            const [h, mi, se] = (timePart || "00:00:00").split(":").map(Number);

            // Build a UTC-based date from the naive input
            const utcGuess = Date.UTC(y, mo - 1, d, h, mi, se || 0);

            // Find what the target timezone thinks this UTC moment is
            // Iterate to find the offset that makes both sides match
            let offset;
            try {
                // Guess using the same month to get an approximate offset
                offset = -getTzOffsetMinutes(new Date(utcGuess), tz) * 60000;
            } catch (e) {
                offset = 0;
            }
            // Try one correction
            try {
                const adjusted = utcGuess - offset;
                const newOffset = -getTzOffsetMinutes(new Date(adjusted), tz) * 60000;
                offset = newOffset;
            } catch (e) {}
            dateMs = utcGuess - offset;
        }

        const date = new Date(dateMs);
        if (isNaN(date.getTime())) {
            showError("❌ Could not compute timestamp");
            return;
        }

        const seconds  = Math.floor(dateMs / 1000);
        const millis   = dateMs;
        const micros   = dateMs * 1000;
        const nanos    = dateMs * 1e6;

        // Hero
        rhLabel.textContent = "UNIX TIMESTAMP";
        rhValue.textContent = seconds.toString();
        rhSub.textContent = `${tz === "local" ? "Local Time" : tz} · ${toFullReadable(date, tz)}`;

        const formatChoice = tsFormatSelect.value;
        const items = [];

        if (formatChoice === "all" || formatChoice === "s") {
            items.push({ label: "Seconds", icon: "fa-clock", value: seconds.toString() });
        }
        if (formatChoice === "all" || formatChoice === "ms") {
            items.push({ label: "Milliseconds", icon: "fa-bolt", value: millis.toString() });
        }
        if (formatChoice === "all" || formatChoice === "us") {
            items.push({ label: "Microseconds", icon: "fa-microchip", value: micros.toString() });
        }
        if (formatChoice === "all" || formatChoice === "ns") {
            items.push({ label: "Nanoseconds", icon: "fa-atom", value: nanos.toString() });
        }

        if (formatChoice === "all") {
            items.push({ label: "ISO 8601", icon: "fa-barcode", value: toIso(date, tz) });
            items.push({ label: "UTC String", icon: "fa-globe", value: toUtcString(date) });
            items.push({ label: "RFC 2822", icon: "fa-envelope-open-text", value: toRfc2822(date, tz) });
            items.push({ label: "Readable", icon: "fa-file-lines", value: toFullReadable(date, tz) });
            items.push({ label: "Relative", icon: "fa-hourglass-half", value: toRelative(date) });
            items.push({ label: "Timezone Offset", icon: "fa-compass", value: formatOffset(getTzOffsetMinutes(date, tz)) });
        }

        renderResultGrid(items);
        outputArea.style.display = "block";

        lastResult = {
            mode: "date-to-ts",
            input: val,
            output: seconds.toString(),
            items,
        };

        pushHistory("date-to-ts", toFullReadable(date, tz), seconds.toString());

        if (typeof showToast === "function") showToast("✅ Converted");

        scrollToResult();
    }

    /* ============================================================
       RENDER RESULT GRID
       ============================================================ */
    function renderResultGrid(items) {
        resultGrid.innerHTML = items.map((it, i) => `
            <div class="result-item ${it.fullWidth ? "full-width" : ""}" style="animation-delay:${Math.min(i, 15) * 0.03}s">
                <div class="ri-label"><i class="fa-solid ${it.icon}"></i> ${escapeHtml(it.label)}</div>
                <div class="ri-value">${escapeHtml(it.value)}</div>
                <button class="ri-copy" data-copy="${escapeHtml(it.value)}" title="Copy">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
        `).join("");

        resultGrid.querySelectorAll(".ri-copy").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.copy);
            });
        });
    }

    function scrollToResult() {
        setTimeout(() => {
            const r = outputArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       BATCH
       ============================================================ */
    function convertBatch() {
        hideError();
        const raw = batchInput.value.trim();
        if (!raw) {
            showError("⚠️ Please enter timestamps or dates (one per line)");
            batchInput.focus();
            return;
        }

        const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) {
            showError("⚠️ No valid lines found");
            return;
        }
        if (lines.length > 500) {
            showError("⚠️ Maximum 500 lines per batch");
            return;
        }

        const tz = tzSelect.value;
        const rows = lines.map((line, i) => {
            // Try as timestamp
            const parsed = parseTimestamp(line, "auto");
            if (parsed) {
                const d = new Date(parsed.ms);
                if (!isNaN(d.getTime())) {
                    return {
                        num: i + 1,
                        input: line,
                        output: toFullReadable(d, tz),
                        unit: parsed.unit,
                    };
                }
            }
            // Try as date
            const d = new Date(line);
            if (!isNaN(d.getTime())) {
                return {
                    num: i + 1,
                    input: line,
                    output: `${Math.floor(d.getTime() / 1000)} (s) · ${d.getTime()} (ms)`,
                    unit: "date",
                };
            }
            return {
                num: i + 1,
                input: line,
                output: "Invalid",
                error: true,
            };
        });

        batchBody.innerHTML = rows.map((r) => `
            <tr>
                <td>${r.num}</td>
                <td class="cell-in ${r.error ? "cell-error" : ""}">${escapeHtml(r.input)}</td>
                <td class="cell-out ${r.error ? "cell-error" : ""}">${escapeHtml(r.output)}</td>
            </tr>
        `).join("");

        batchCount.textContent = `${rows.length} row${rows.length !== 1 ? "s" : ""}`;
        batchArea.style.display = "block";

        lastResult = {
            mode: "batch",
            input: `${lines.length} lines`,
            output: `${rows.filter((r) => !r.error).length} converted`,
            rows,
        };

        pushHistory("batch", `${lines.length} lines`, `${rows.filter((r) => !r.error).length} converted`);

        if (typeof showToast === "function") showToast(`✅ ${rows.filter((r) => !r.error).length} converted`);

        setTimeout(() => {
            const r = batchArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                batchArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       MAIN PROCESS
       ============================================================ */
    function process() {
        if (currentMode === "ts-to-date") convertTsToDate();
        else if (currentMode === "date-to-ts") convertDateToTs();
        else if (currentMode === "batch") convertBatch();
    }

    /* ============================================================
       COPY
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

    /* ============================================================
       QUICK TIMESTAMPS
       ============================================================ */
    function renderQuickTs() {
        const now = new Date();
        const nowSec = Math.floor(now.getTime() / 1000);

        const presets = [
            { name: "Now", ts: nowSec },
            { name: "1 min ago", ts: nowSec - 60 },
            { name: "1 hour ago", ts: nowSec - 3600 },
            { name: "Yesterday", ts: nowSec - 86400 },
            { name: "Start of Today", ts: Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000) },
            { name: "Start of Month", ts: Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000) },
            { name: "Start of Year", ts: Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000) },
            { name: "Epoch (1970)", ts: 0 },
            { name: "Y2K (2000)", ts: 946684800 },
        ];

        quickTsGrid.innerHTML = presets.map((p) => `
            <button class="qt-btn" data-ts="${p.ts}">
                <span class="qt-name">${escapeHtml(p.name)}</span>
                <span class="qt-ts">${p.ts}</span>
            </button>
        `).join("");

        quickTsGrid.querySelectorAll(".qt-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const val = btn.dataset.ts;
                tsInput.value = val;
                setMode("ts-to-date");
                setTimeout(() => convertTsToDate(), 100);
            });
        });
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(mode, inputPreview, outputPreview) {
        history.unshift({
            mode,
            inputPreview: String(inputPreview || "").slice(0, 60),
            outputPreview: String(outputPreview || "").slice(0, 60),
            inputFull: String(inputPreview || ""),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 20) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            tsHistoryList.innerHTML = '<div class="empty-history">No conversions yet</div>';
            return;
        }
        tsHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-time">
                        <span class="hi-mode-badge ${h.mode}">${h.mode}</span>
                        ${escapeHtml(h.time)}
                    </span>
                    <span class="hi-preview">${escapeHtml(h.inputPreview || "(empty)")}</span>
                </div>
                <span class="hi-result">${escapeHtml(h.outputPreview || "")}</span>
            </div>
        `).join("");

        tsHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                if (h.mode === "ts-to-date") {
                    setMode("ts-to-date");
                    tsInput.value = h.inputFull;
                    setTimeout(() => convertTsToDate(), 100);
                } else if (h.mode === "date-to-ts") {
                    // Just show toast; can't reconstruct exactly without full date string
                    if (typeof showToast === "function") showToast("⚠️ Cannot reload — please re-enter date");
                } else if (h.mode === "batch") {
                    setMode("batch");
                }
            });
        });
    }

    /* ============================================================
       POPULATE TIMEZONES
       ============================================================ */
    function populateTimezones() {
        const opts = COMMON_TIMEZONES.map((tz) =>
            `<option value="${tz.value}">${escapeHtml(tz.label)}</option>`
        ).join("");
        tzSelect.innerHTML = opts;
        tzInputSelect.innerHTML = opts;

        // Default to local
        tzSelect.value = "local";
        tzInputSelect.value = "local";
    }

    /* ============================================================
       EVENTS
       ============================================================ */
    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    unitPills.forEach((p) => {
        p.addEventListener("click", () => {
            unitPills.forEach((x) => x.classList.remove("active"));
            p.classList.add("active");
            currentUnit = p.dataset.unit;
            if (tsInput.value) convertTsToDate();
        });
    });

    // TS input
    tsInput.addEventListener("input", () => {
        clearTimeout(tsInput._t);
        tsInput._t = setTimeout(() => {
            if (tsInput.value.trim()) convertTsToDate();
        }, 300);
    });

    tsInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            convertTsToDate();
        }
    });

    pasteTs.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            tsInput.value = text.trim();
            convertTsToDate();
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    nowTs.addEventListener("click", () => {
        tsInput.value = Math.floor(Date.now() / 1000).toString();
        convertTsToDate();
    });

    clearTs.addEventListener("click", () => {
        tsInput.value = "";
        outputArea.style.display = "none";
        hideError();
    });

    // Date input
    dateInput.addEventListener("change", () => {
        if (dateInput.value) convertDateToTs();
    });

    dateInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            convertDateToTs();
        }
    });

    nowDate.addEventListener("click", () => {
        // Format as local ISO for datetime-local
        const now = new Date();
        const tzOffsetMs = now.getTimezoneOffset() * 60000;
        const localIso = new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 19);
        dateInput.value = localIso;
        convertDateToTs();
    });

    clearDate.addEventListener("click", () => {
        dateInput.value = "";
        outputArea.style.display = "none";
        hideError();
    });

    // Batch
    pasteBatch.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            batchInput.value = text;
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    sampleBatch.addEventListener("click", () => {
        const now = Math.floor(Date.now() / 1000);
        batchInput.value = [
            String(now),
            String(now - 3600),
            String(now - 86400),
            String(now - 604800),
            "0",
            "946684800",
            "1735689600",
            String(now * 1000),
        ].join("\n");
        convertBatch();
    });

    clearBatch.addEventListener("click", () => {
        batchInput.value = "";
        batchArea.style.display = "none";
        hideError();
    });

    exportBatch.addEventListener("click", () => {
        if (!lastResult || lastResult.mode !== "batch" || !lastResult.rows) return;
        const csv = "Index,Input,Output\n" + lastResult.rows.map((r) =>
            `${r.num},"${String(r.input).replace(/"/g, '""')}","${String(r.output).replace(/"/g, '""')}"`
        ).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `timestamps-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === "function") showToast("📥 Exported CSV");
    });

    // Actions
    convertBtn.addEventListener("click", process);

    clearAllBtn.addEventListener("click", () => {
        if (confirm("Clear all inputs?")) {
            tsInput.value = "";
            dateInput.value = "";
            batchInput.value = "";
            outputArea.style.display = "none";
            batchArea.style.display = "none";
            hideError();
            lastResult = null;
            if (typeof showToast === "function") showToast("🧹 Cleared");
        }
    });

    // Format/unit changes → re-run
    formatSelect.addEventListener("change", () => {
        if (tsInput.value.trim()) convertTsToDate();
    });
    tzSelect.addEventListener("change", () => {
        if (tsInput.value.trim()) convertTsToDate();
    });
    tsFormatSelect.addEventListener("change", () => {
        if (dateInput.value) convertDateToTs();
    });
    tzInputSelect.addEventListener("change", () => {
        if (dateInput.value) convertDateToTs();
    });

    // Result actions
    copyResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        if (lastResult.items) {
            const text = lastResult.items.map((it) => `${it.label}: ${it.value}`).join("\n");
            copyToClipboard(text);
        } else if (lastResult.rows) {
            const text = lastResult.rows.map((r) => `${r.input} → ${r.output}`).join("\n");
            copyToClipboard(text);
        }
    });

    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = `${lastResult.input} → ${lastResult.output}`;
        if (navigator.share) {
            navigator.share({ title: "Timestamp Result", text, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    clearResultBtn.addEventListener("click", () => {
        outputArea.style.display = "none";
        lastResult = null;
    });

    clearTsHistory.addEventListener("click", () => {
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
        const typing = tag === "input" || tag === "textarea" || tag === "select";

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            process();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "c") {
            e.preventDefault();
            if (lastResult) copyResultBtn.click();
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
    window.shareTimestamp = function () {
        const shareData = {
            title: "Timestamp Converter - Tool Hub",
            text: "Convert Unix timestamps to human-readable dates!",
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
        populateTimezones();
        renderQuickTs();
        renderHistory();
        updateLiveClock();
        liveTimer = setInterval(updateLiveClock, 1000);
        setMode("ts-to-date");
    }

    init();

    // Cleanup
    window.addEventListener("beforeunload", () => {
        if (liveTimer) clearInterval(liveTimer);
    });
})();