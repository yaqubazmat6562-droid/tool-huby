/* ============================================================
   DATE DIFFERENCE CALCULATOR - Advanced Logic
   Exact Y/M/D, weeks, business days, fun equivalents
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const dtCard        = document.getElementById("dtCard");
    const startInput    = document.getElementById("startDate");
    const endInput      = document.getElementById("endDate");
    const includeEnd    = document.getElementById("includeEndDate");
    const bizDaysOnly   = document.getElementById("businessDaysOnly");
    const swapBtn       = document.getElementById("swapDatesBtn");
    const calcBtn       = document.getElementById("calcDtBtn");
    const resetBtn      = document.getElementById("resetDtBtn");
    const dtError       = document.getElementById("dtError");

    const resultArea    = document.getElementById("dtResult");
    const heroDays      = document.getElementById("heroDays");
    const heroUnit      = document.getElementById("heroUnit");
    const heroSub       = document.getElementById("heroSub");

    const bdYears       = document.getElementById("bdYears");
    const bdMonths      = document.getElementById("bdMonths");
    const bdWeeks       = document.getElementById("bdWeeks");
    const bdDays        = document.getElementById("bdDays");
    const bdHours       = document.getElementById("bdHours");
    const bdMinutes     = document.getElementById("bdMinutes");
    const bdSeconds     = document.getElementById("bdSeconds");
    const bdBusiness    = document.getElementById("bdBusiness");

    const ciStart       = document.getElementById("ciStart");
    const ciStartExtra  = document.getElementById("ciStartExtra");
    const ciEnd         = document.getElementById("ciEnd");
    const ciEndExtra    = document.getElementById("ciEndExtra");

    const feList        = document.getElementById("feList");

    const copyDtBtn     = document.getElementById("copyDtBtn");
    const shareDtResult = document.getElementById("shareDtResultBtn");
    const clearDtBtn    = document.getElementById("clearDtBtn");

    const dtHistoryList = document.getElementById("dtHistoryList");
    const clearDtHistory= document.getElementById("clearDtHistory");
    const presetBtns    = document.querySelectorAll(".preset");

    /* ---------------- State ---------------- */
    let lastResult = null;
    let history    = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_datediff_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_datediff_history", JSON.stringify(history.slice(0, 30)));
        } catch (e) {}
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    function pad(n) { return n.toString().padStart(2, "0"); }

    function todayLocal() {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    }

    function toInputValue(d) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function toLocalDate(str) {
        if (!str) return null;
        const [y, m, d] = str.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function formatDateLong(d) {
        const months = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];
        const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    function formatDateShort(d) {
        const months = ["Jan","Feb","Mar","Apr","May","Jun",
                        "Jul","Aug","Sep","Oct","Nov","Dec"];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    function daysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function showError(msg) {
        dtError.textContent = msg;
        dtError.classList.add("show");
        dtError.style.animation = "none";
        void dtError.offsetWidth;
        dtError.style.animation = "";
    }
    function hideError() {
        dtError.classList.remove("show");
        dtError.textContent = "";
    }

    /* ============================================================
       CORE MATH
       ============================================================ */
    function ymdDifference(start, end) {
        // Returns { years, months, days } between two dates (start <= end)
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
            months--;
            const prevMonth = (end.getMonth() + 11) % 12;
            const prevMonthYear = end.getMonth() === 0
                ? end.getFullYear() - 1
                : end.getFullYear();
            days += daysInMonth(prevMonthYear, prevMonth);
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days };
    }

    function countBusinessDays(start, end) {
        // Count Mon-Fri between start and end (inclusive-exclusive)
        let count = 0;
        const cursor = new Date(start.getTime());
        while (cursor < end) {
            const dow = cursor.getDay();
            if (dow !== 0 && dow !== 6) count++;
            cursor.setDate(cursor.getDate() + 1);
        }
        return count;
    }

    function countWeekends(start, end) {
        let count = 0;
        const cursor = new Date(start.getTime());
        while (cursor < end) {
            const dow = cursor.getDay();
            if (dow === 0 || dow === 6) count++;
            cursor.setDate(cursor.getDate() + 1);
        }
        return count;
    }

    /* ============================================================
       CALCULATE
       ============================================================ */
    function calculate() {
        hideError();

        const startStr = startInput.value;
        const endStr = endInput.value;

        if (!startStr || !endStr) {
            showError("⚠️ Please select both start and end dates");
            return;
        }

        let start = toLocalDate(startStr);
        let end = toLocalDate(endStr);

        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
            showError("❌ Invalid date");
            return;
        }

        // Auto-swap if start > end (friendly UX)
        if (start > end) {
            [start, end] = [end, start];
            startInput.value = toInputValue(start);
            endInput.value = toInputValue(end);
            if (typeof showToast === "function") {
                showToast("🔄 Dates swapped automatically");
            }
        }

        // Include end date (adds 1 day to the diff)
        const includeEndVal = includeEnd.checked;
        const endForDiff = new Date(end.getTime());
        if (includeEndVal) {
            endForDiff.setDate(endForDiff.getDate() + 1);
        }

        // Total days (exclusive of end by default)
        const msPerDay = 86400000;
        const totalDays = Math.round((endForDiff.getTime() - start.getTime()) / msPerDay);

        // Y/M/D
        const ymd = ymdDifference(start, endForDiff);

        // Weeks
        const weeks = Math.floor(totalDays / 7);
        const remDaysAfterWeeks = totalDays % 7;

        // Hours/Minutes/Seconds
        const totalSeconds = totalDays * 86400;
        const totalHours = totalDays * 24;
        const totalMinutes = totalHours * 60;

        // Business days & weekends
        const bizCount = countBusinessDays(start, endForDiff);
        const weekendCount = countWeekends(start, endForDiff);

        // Render
        renderResult({
            start,
            end,
            includeEnd: includeEndVal,
            totalDays,
            ymd,
            weeks,
            remDaysAfterWeeks,
            totalHours,
            totalMinutes,
            totalSeconds,
            bizCount,
            weekendCount,
        });

        pushHistory({
            start, end, includeEnd: includeEndVal, totalDays, ymd,
        });
    }

    /* ============================================================
       RENDER
       ============================================================ */
    function renderResult(r) {
        // Hero
        heroDays.textContent = r.totalDays.toLocaleString();
        heroUnit.textContent = r.totalDays === 1 ? "Day" : "Days";

        // Hero sub
        let subText = `${formatDateShort(r.start)} → ${formatDateShort(r.end)}`;
        if (r.includeEnd) subText += " (inclusive)";
        heroSub.textContent = subText;

        // Breakdown
        bdYears.textContent   = r.ymd.years;
        bdMonths.textContent  = r.ymd.months;
        bdWeeks.textContent   = r.weeks;
        bdDays.textContent    = r.ymd.days;
        bdHours.textContent   = r.totalHours.toLocaleString();
        bdMinutes.textContent = r.totalMinutes.toLocaleString();
        bdSeconds.textContent = r.totalSeconds.toLocaleString();
        bdBusiness.textContent= r.bizCount.toLocaleString();

        // Calendar info
        ciStart.textContent = formatDateShort(r.start);
        ciStartExtra.textContent = formatDateLong(r.start);
        ciEnd.textContent = formatDateShort(r.end);
        ciEndExtra.textContent = formatDateLong(r.end);

        // Fun equivalents
        const fe = [
            { icon: "fa-moon", label: "Lunar cycles (approx.)", value: (r.totalDays / 29.53).toFixed(2) },
            { icon: "fa-heart", label: "Heartbeats (approx.)", value: Math.round(r.totalMinutes * 72).toLocaleString() },
            { icon: "fa-bed", label: "Sleep cycles (approx.)", value: Math.round(r.totalHours / 8).toLocaleString() },
            { icon: "fa-cake-candles", label: "Weekend days", value: r.weekendCount.toLocaleString() },
            { icon: "fa-briefcase", label: "Business days", value: r.bizCount.toLocaleString() },
            { icon: "fa-clock", label: "Total hours", value: r.totalHours.toLocaleString() },
            { icon: "fa-bolt", label: "Total seconds", value: r.totalSeconds.toLocaleString() },
        ];
        feList.innerHTML = fe.map(f => `
            <div class="fe-item">
                <span class="fe-item-label"><i class="fa-solid ${f.icon}"></i> ${f.label}</span>
                <span class="fe-item-value">${f.value}</span>
            </div>
        `).join("");

        // Store for copy/share
        lastResult = {
            ...r,
            startStr: formatDateLong(r.start),
            endStr: formatDateLong(r.end),
        };

        resultArea.style.display = "block";

        // Smooth scroll
        setTimeout(() => {
            const rect = resultArea.getBoundingClientRect();
            if (rect.top > window.innerHeight - 120) {
                resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(r) {
        history.unshift({
            startStr: toInputValue(r.start),
            endStr: toInputValue(r.end),
            startLabel: formatDateShort(r.start),
            endLabel: formatDateShort(r.end),
            totalDays: r.totalDays,
            includeEnd: r.includeEnd,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 30) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            dtHistoryList.innerHTML = '<div class="empty-history">No calculations yet</div>';
            return;
        }
        dtHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-time">${escapeHtml(h.time)}${h.includeEnd ? " · inclusive" : ""}</span>
                    <span class="hi-info">${escapeHtml(h.startLabel)} → ${escapeHtml(h.endLabel)}</span>
                </div>
                <div class="hi-right">
                    <span class="hi-days">${h.totalDays.toLocaleString()}</span>
                </div>
            </div>
        `).join("");

        dtHistoryList.querySelectorAll(".history-item").forEach(el => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                startInput.value = h.startStr;
                endInput.value = h.endStr;
                includeEnd.checked = h.includeEnd;
                calculate();
            });
        });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /* ============================================================
       PRESETS
       ============================================================ */
    function applyPreset(preset) {
        const today = todayLocal();
        let start = new Date(today);
        let end = new Date(today);

        switch (preset) {
            case "today-tomorrow":
                start = today;
                end = new Date(today);
                end.setDate(end.getDate() + 1);
                break;
            case "this-week":
                start = new Date(today);
                start.setDate(today.getDate() - today.getDay()); // Sunday
                end = new Date(start);
                end.setDate(end.getDate() + 7);
                break;
            case "this-month":
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                break;
            case "this-year":
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear() + 1, 0, 1);
                break;
            case "next-birthday":
                // User enters their DOB as start, next birthday = end (1 year later than last birthday)
                // Here we just set start = today, end = today + 1 year as placeholder
                // Better: use start as today, and prompt user for DOB... but simpler: today → 1 year later
                start = today;
                end = new Date(today);
                end.setFullYear(end.getFullYear() + 1);
                break;
        }

        startInput.value = toInputValue(start);
        endInput.value = toInputValue(end);
        calculate();
    }

    /* ============================================================
       ACTIONS
       ============================================================ */
    function resetAll() {
        startInput.value = "";
        endInput.value = "";
        includeEnd.checked = false;
        bizDaysOnly.checked = false;
        hideError();
        resultArea.style.display = "none";
        lastResult = null;
        if (typeof showToast === "function") showToast("🔄 Reset");
    }

    /* Copy */
    copyDtBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const r = lastResult;
        const text = [
            "═══ DATE DIFFERENCE RESULT ═══",
            "",
            `From  : ${r.startStr}`,
            `To    : ${r.endStr}${r.includeEnd ? " (inclusive)" : ""}`,
            "",
            `Total Days      : ${r.totalDays.toLocaleString()}`,
            `Years / Months / Days : ${r.ymd.years} y, ${r.ymd.months} m, ${r.ymd.days} d`,
            `Weeks           : ${r.weeks} weeks ${r.remDaysAfterWeeks} days`,
            `Hours           : ${r.totalHours.toLocaleString()}`,
            `Minutes         : ${r.totalMinutes.toLocaleString()}`,
            `Seconds         : ${r.totalSeconds.toLocaleString()}`,
            `Business Days   : ${r.bizCount.toLocaleString()}`,
            `Weekend Days    : ${r.weekendCount.toLocaleString()}`,
            "",
            "Generated with Tool Hub ❤️",
        ].join("\n");
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (typeof showToast === "function") showToast("📋 Copied!");
            }).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    });

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

    /* Share */
    shareDtResult.addEventListener("click", () => {
        if (!lastResult) return;
        const text = `Difference: ${lastResult.totalDays.toLocaleString()} days between ${lastResult.startStr} and ${lastResult.endStr}`;
        if (navigator.share) {
            navigator.share({ title: "Date Difference", text, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    /* Clear result */
    clearDtBtn.addEventListener("click", () => {
        resultArea.style.display = "none";
        lastResult = null;
    });

    /* Clear history */
    clearDtHistory.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* ============================================================
       EVENTS
       ============================================================ */
    calcBtn.addEventListener("click", calculate);
    resetBtn.addEventListener("click", resetAll);

    swapBtn.addEventListener("click", () => {
        const a = startInput.value;
        const b = endInput.value;
        startInput.value = b;
        endInput.value = a;
        if (a && b) calculate();
    });

    presetBtns.forEach((btn) => {
        btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
    });

    // Auto-calc on change
    [startInput, endInput].forEach((inp) => {
        inp.addEventListener("change", () => {
            if (startInput.value && endInput.value) calculate();
        });
        inp.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                calculate();
            }
        });
    });

    includeEnd.addEventListener("change", () => {
        if (startInput.value && endInput.value) calculate();
    });

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;

        if (e.key === "Enter") {
            e.preventDefault();
            calculate();
        } else if (e.key === "Escape") {
            e.preventDefault();
            resetAll();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareDateDiff = function () {
        const shareData = {
            title: "Date Difference Calculator - Tool Hub",
            text: "Calculate exact difference between any two dates!",
            url: window.location.href,
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Link copied!");
            }).catch(() => {});
        }
    };

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        // Default: today → tomorrow
        const today = todayLocal();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        startInput.value = toInputValue(today);
        endInput.value = toInputValue(tomorrow);
        renderHistory();
    }

    init();
})();