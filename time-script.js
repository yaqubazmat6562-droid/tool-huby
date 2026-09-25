/* ============================================================
   TIME CALCULATOR - Advanced Logic
   5 modes: Add, Subtract, Between, Convert, Work Hours
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const tmCard        = document.getElementById("tmCard");
    const modeTabs      = document.querySelectorAll(".mode-tab");
    const modeContents  = document.querySelectorAll(".mode-content");
    const calcBtn       = document.getElementById("calcTmBtn");
    const resetBtn      = document.getElementById("resetTmBtn");
    const clearBtn      = document.getElementById("clearTmBtn");
    const tmError       = document.getElementById("tmError");

    const resultArea    = document.getElementById("resultArea");
    const heroLabel     = document.getElementById("heroLabel");
    const heroValue     = document.getElementById("heroValue");
    const heroSub       = document.getElementById("heroSub");
    const resultDetails = document.getElementById("resultDetails");

    const copyResultBtn = document.getElementById("copyResultBtn");
    const shareResultBtn= document.getElementById("shareResultBtn");
    const clearResultBtn= document.getElementById("clearResultBtn");

    const tmHistoryList = document.getElementById("tmHistoryList");
    const clearTmHistory= document.getElementById("clearTmHistory");

    const cvValue       = document.getElementById("cv-value");
    const cvFrom        = document.getElementById("cv-from");
    const cvResults     = document.getElementById("cvResults");

    /* ---------------- State ---------------- */
    let currentMode = "add";
    let lastResult  = null;
    let history     = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_timecalc_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_timecalc_history", JSON.stringify(history.slice(0, 30)));
        } catch (e) {}
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    function getT(name) {
        const el = document.querySelector(`input[data-t="${name}"]`);
        if (!el) return 0;
        const v = parseInt(el.value, 10);
        return isNaN(v) || v < 0 ? 0 : v;
    }

    function num(id) {
        const el = document.getElementById(id);
        if (!el) return NaN;
        const v = el.value.trim();
        if (v === "") return NaN;
        const n = parseFloat(v);
        return isNaN(n) ? NaN : n;
    }

    function fmtNumber(n, decimals = 4) {
        if (!isFinite(n)) return "—";
        const rounded = Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
        const parts = rounded.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    function showError(msg) {
        tmError.textContent = msg;
        tmError.classList.add("show");
        tmError.style.animation = "none";
        void tmError.offsetWidth;
        tmError.style.animation = "";
    }
    function hideError() {
        tmError.classList.remove("show");
        tmError.textContent = "";
    }

    /* ---------- Time formatting ---------- */
    function msToBreakdown(totalSeconds) {
        // Returns { days, hours, minutes, seconds } — can be negative
        const sign = totalSeconds < 0 ? -1 : 1;
        const abs = Math.abs(totalSeconds);
        const days = Math.floor(abs / 86400);
        const hours = Math.floor((abs % 86400) / 3600);
        const minutes = Math.floor((abs % 3600) / 60);
        const seconds = abs % 60;
        return { sign, days, hours, minutes, seconds };
    }

    function fmtBreakdown(totalSeconds) {
        const b = msToBreakdown(totalSeconds);
        const parts = [];
        if (b.days > 0) parts.push(`${b.days}d`);
        if (b.hours > 0 || b.days > 0) parts.push(`${b.hours}h`);
        if (b.minutes > 0 || parts.length > 0) parts.push(`${b.minutes}m`);
        parts.push(`${b.seconds}s`);
        return (b.sign < 0 ? "− " : "") + parts.join(" ");
    }

    function fmtHMS(totalSeconds) {
        const b = msToBreakdown(totalSeconds);
        const pad = (n) => n.toString().padStart(2, "0");
        let str;
        if (b.days > 0) {
            str = `${b.days}d ${pad(b.hours)}:${pad(b.minutes)}:${pad(b.seconds)}`;
        } else {
            str = `${pad(b.hours)}:${pad(b.minutes)}:${pad(b.seconds)}`;
        }
        return (b.sign < 0 ? "− " : "") + str;
    }

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
        modeContents.forEach((c) => c.classList.toggle("active", c.dataset.content === mode));
        hideError();

        // If switching to convert, update live preview
        if (mode === "convert") {
            renderConvertResults();
        }

        const firstInput = document.querySelector(
            `.mode-content[data-content="${mode}"] input, .mode-content[data-content="${mode}"] select`
        );
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }

    /* ============================================================
       CALCULATION
       ============================================================ */
    function calculate() {
        hideError();
        let result = null;
        switch (currentMode) {
            case "add":       result = calcAdd(); break;
            case "subtract":  result = calcSubtract(); break;
            case "between":   result = calcBetween(); break;
            case "convert":   result = calcConvert(); break;
            case "workhours": result = calcWorkHours(); break;
        }
        if (!result) return;
        renderResult(result);
        pushHistory(result);
    }

    /* ---------- Add ---------- */
    function calcAdd() {
        const t1 = getT("d1") * 86400 + getT("h1") * 3600 + getT("m1") * 60 + getT("s1");
        const t2 = getT("d2") * 86400 + getT("h2") * 3600 + getT("m2") * 60 + getT("s2");

        if (t1 === 0 && t2 === 0) {
            showError("⚠️ Please enter at least one time value");
            return null;
        }

        const total = t1 + t2;
        const b = msToBreakdown(total);

        return {
            mode: "add",
            modeLabel: "Addition",
            expression: `${fmtHMS(t1)} + ${fmtHMS(t2)}`,
            heroLabel: "TOTAL TIME",
            heroValue: fmtBreakdown(total),
            heroSub: `${fmtHMS(total)} (${total.toLocaleString()} seconds total)`,
            details: [
                { icon: "fa-clock", label: "Time 1", value: fmtHMS(t1) },
                { icon: "fa-plus", label: "Time 2", value: fmtHMS(t2) },
                { icon: "fa-calculator", label: "Total Days", value: b.days.toLocaleString() },
                { icon: "fa-clock", label: "Total Hours", value: Math.floor(total / 3600).toLocaleString() },
                { icon: "fa-equals", label: "Grand Total", value: fmtBreakdown(total), cls: "success" },
            ],
            copyText: `${fmtHMS(t1)} + ${fmtHMS(t2)} = ${fmtBreakdown(total)}`,
        };
    }

    /* ---------- Subtract ---------- */
    function calcSubtract() {
        const t1 = getT("sd1") * 86400 + getT("sh1") * 3600 + getT("sm1") * 60 + getT("ss1");
        const t2 = getT("sd2") * 86400 + getT("sh2") * 3600 + getT("sm2") * 60 + getT("ss2");

        if (t1 === 0 && t2 === 0) {
            showError("⚠️ Please enter at least one time value");
            return null;
        }

        const total = t1 - t2;
        const b = msToBreakdown(total);
        const isNegative = total < 0;

        return {
            mode: "subtract",
            modeLabel: "Subtraction",
            expression: `${fmtHMS(t1)} − ${fmtHMS(t2)}`,
            heroLabel: isNegative ? "DIFFERENCE (NEGATIVE)" : "DIFFERENCE",
            heroValue: fmtBreakdown(total),
            heroSub: `${fmtHMS(total)} (${Math.abs(total).toLocaleString()} seconds total)`,
            details: [
                { icon: "fa-clock", label: "Time 1", value: fmtHMS(t1) },
                { icon: "fa-minus", label: "Time 2", value: fmtHMS(t2) },
                { icon: "fa-calculator", label: "Days", value: b.days.toLocaleString() },
                { icon: "fa-clock", label: "Hours", value: b.hours.toString() },
                { icon: "fa-equals", label: "Difference", value: fmtBreakdown(total), cls: isNegative ? "danger" : "success" },
            ],
            copyText: `${fmtHMS(t1)} − ${fmtHMS(t2)} = ${fmtBreakdown(total)}`,
        };
    }

    /* ---------- Time Between ---------- */
    function calcBetween() {
        const start = document.getElementById("bt-start").value;
        const end = document.getElementById("bt-end").value;

        if (!start || !end) {
            showError("⚠️ Please enter both start and end times");
            return null;
        }

        const [sh, sm, ss] = start.split(":").map((n) => parseInt(n, 10) || 0);
        const [eh, em, es] = end.split(":").map((n) => parseInt(n, 10) || 0);

        let startSec = sh * 3600 + sm * 60 + (ss || 0);
        let endSec = eh * 3600 + em * 60 + (es || 0);

        // If end < start, assume it crosses midnight (add 24h to end)
        let crossesMidnight = false;
        if (endSec < startSec) {
            endSec += 86400;
            crossesMidnight = true;
        }

        const total = endSec - startSec;
        const b = msToBreakdown(total);

        const formatTime12 = (h, m) => {
            const period = h >= 12 ? "PM" : "AM";
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
        };

        return {
            mode: "between",
            modeLabel: "Time Between",
            expression: `${formatTime12(sh, sm)} → ${formatTime12(eh, em)}${crossesMidnight ? " (next day)" : ""}`,
            heroLabel: "DURATION",
            heroValue: fmtBreakdown(total),
            heroSub: `${fmtHMS(total)} ${crossesMidnight ? "· crosses midnight" : ""}`,
            details: [
                { icon: "fa-play", label: "Start", value: formatTime12(sh, sm) },
                { icon: "fa-flag-checkered", label: "End", value: formatTime12(eh, em) + (crossesMidnight ? " (next day)" : "") },
                { icon: "fa-clock", label: "Hours", value: b.hours.toString() + "h" },
                { icon: "fa-stopwatch", label: "Minutes", value: b.minutes.toString() + "m" },
                { icon: "fa-equals", label: "Total", value: fmtBreakdown(total), cls: "success" },
            ],
            copyText: `From ${formatTime12(sh, sm)} to ${formatTime12(eh, em)} = ${fmtBreakdown(total)}${crossesMidnight ? " (next day)" : ""}`,
        };
    }

    /* ---------- Convert ---------- */
    function calcConvert() {
        renderConvertResults();
        const val = parseFloat(cvValue.value);
        if (isNaN(val) || val < 0) {
            showError("⚠️ Please enter a valid value");
            return null;
        }
        const fromUnit = cvFrom.value;
        const unitMeta = getUnitMeta();
        const seconds = val * unitMeta[fromUnit].factor;

        const b = msToBreakdown(seconds);
        const fromLabel = unitMeta[fromUnit].label;

        return {
            mode: "convert",
            modeLabel: "Convert Units",
            expression: `${fmtNumber(val)} ${fromLabel} converted`,
            heroLabel: "CONVERTED TO ALL UNITS",
            heroValue: fmtNumber(val) + " " + fromLabel,
            heroSub: `Equivalent in all time units`,
            details: Object.keys(unitMeta).map((k) => {
                const u = unitMeta[k];
                const converted = seconds / u.factor;
                return {
                    icon: "fa-ruler",
                    label: u.label,
                    value: fmtNumber(converted, 6),
                    cls: k === fromUnit ? "accent" : "",
                };
            }),
            copyText: Object.keys(unitMeta).map((k) => {
                const u = unitMeta[k];
                return `${u.label}: ${fmtNumber(seconds / u.factor, 6)}`;
            }).join("\n"),
        };
    }

    function getUnitMeta() {
        return {
            ms:  { label: "Milliseconds", factor: 0.001 },
            s:   { label: "Seconds",      factor: 1 },
            min: { label: "Minutes",      factor: 60 },
            h:   { label: "Hours",        factor: 3600 },
            d:   { label: "Days",         factor: 86400 },
            w:   { label: "Weeks",        factor: 604800 },
            mo:  { label: "Months (30d)", factor: 2592000 },
            y:   { label: "Years (365d)", factor: 31536000 },
        };
    }

    function renderConvertResults() {
        const val = parseFloat(cvValue.value);
        if (isNaN(val) || val < 0) {
            cvResults.innerHTML = '<div class="cv-item"><div class="cv-label">Enter a value</div><div class="cv-value">—</div></div>';
            return;
        }
        const fromUnit = cvFrom.value;
        const unitMeta = getUnitMeta();
        const seconds = val * unitMeta[fromUnit].factor;

        cvResults.innerHTML = Object.keys(unitMeta).map((k) => {
            const u = unitMeta[k];
            const converted = seconds / u.factor;
            const active = k === fromUnit;
            return `
                <div class="cv-item ${active ? "active" : ""}">
                    <div class="cv-label">${u.label}${active ? " (from)" : ""}</div>
                    <div class="cv-value">${fmtNumber(converted, 6)}</div>
                </div>
            `;
        }).join("");
    }

    /* ---------- Work Hours ---------- */
    function calcWorkHours() {
        const inTime = document.getElementById("wh-in").value;
        const outTime = document.getElementById("wh-out").value;
        const breakMin = Math.max(0, num("wh-break") || 0);
        const rate = num("wh-rate");
        const otAfter = num("wh-ot");
        const otMult = num("wh-otm");

        if (!inTime || !outTime) {
            showError("⚠️ Please enter both clock-in and clock-out times");
            return null;
        }

        const [ih, im] = inTime.split(":").map((n) => parseInt(n, 10) || 0);
        const [oh, om] = outTime.split(":").map((n) => parseInt(n, 10) || 0);

        let inSec = ih * 3600 + im * 60;
        let outSec = oh * 3600 + om * 60;

        if (outSec < inSec) outSec += 86400; // overnight shift

        let workedSec = outSec - inSec - (breakMin * 60);
        if (workedSec < 0) workedSec = 0;

        const workedHrs = workedSec / 3600;
        const otAfterVal = (!isNaN(otAfter) && otAfter > 0) ? otAfter : 8;
        const otMultVal = (!isNaN(otMult) && otMult >= 1) ? otMult : 1.5;

        let regularHrs = Math.min(workedHrs, otAfterVal);
        let otHrs = Math.max(0, workedHrs - otAfterVal);

        let regularPay = null;
        let otPay = null;
        let totalPay = null;
        if (!isNaN(rate) && rate > 0) {
            regularPay = regularHrs * rate;
            otPay = otHrs * rate * otMultVal;
            totalPay = regularPay + otPay;
        }

        const formatTime12 = (h, m) => {
            const period = h >= 12 ? "PM" : "AM";
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
        };

        const details = [
            { icon: "fa-right-to-bracket", label: "Clock In", value: formatTime12(ih, im) },
            { icon: "fa-right-from-bracket", label: "Clock Out", value: formatTime12(oh, om) },
            { icon: "fa-utensils", label: "Break", value: breakMin + " min" },
            { icon: "fa-clock", label: "Total Worked", value: fmtBreakdown(workedSec), cls: "accent" },
            { icon: "fa-business-time", label: "Regular Hours", value: fmtNumber(regularHrs, 2) + " hrs", cls: "success" },
            { icon: "fa-fire", label: "Overtime Hours", value: fmtNumber(otHrs, 2) + " hrs", cls: otHrs > 0 ? "danger" : "" },
        ];
        if (totalPay !== null) {
            details.push({ icon: "fa-money-bill-wave", label: "Regular Pay", value: fmtNumber(regularPay, 2), cls: "success" });
            if (otHrs > 0) details.push({ icon: "fa-fire-flame-curved", label: `Overtime Pay (×${otMultVal})`, value: fmtNumber(otPay, 2), cls: "danger" });
            details.push({ icon: "fa-sack-dollar", label: "Total Pay", value: fmtNumber(totalPay, 2), cls: "accent" });
        }

        return {
            mode: "workhours",
            modeLabel: "Work Hours",
            expression: `${formatTime12(ih, im)} → ${formatTime12(oh, om)}${breakMin > 0 ? " (break " + breakMin + "m)" : ""}`,
            heroLabel: "TOTAL WORKED",
            heroValue: fmtNumber(workedHrs, 2) + " hrs",
            heroSub: `${fmtBreakdown(workedSec)}` + (totalPay !== null ? ` · Earned ${fmtNumber(totalPay, 2)}` : ""),
            details,
            copyText:
                `Clock In: ${formatTime12(ih, im)}\n` +
                `Clock Out: ${formatTime12(oh, om)}\n` +
                `Break: ${breakMin} min\n` +
                `Total Worked: ${fmtNumber(workedHrs, 2)} hrs (${fmtBreakdown(workedSec)})\n` +
                `Regular: ${fmtNumber(regularHrs, 2)} hrs · Overtime: ${fmtNumber(otHrs, 2)} hrs\n` +
                (totalPay !== null ? `Total Pay: ${fmtNumber(totalPay, 2)}` : ""),
        };
    }

    /* ============================================================
       RENDER RESULT
       ============================================================ */
    function renderResult(r) {
        resultArea.style.display = "block";
        heroLabel.textContent = r.heroLabel;
        heroValue.textContent = r.heroValue;
        heroSub.textContent = r.heroSub;

        resultDetails.innerHTML = r.details.map((d) => `
            <div class="detail-item">
                <span class="d-label"><i class="fa-solid ${d.icon}"></i> ${d.label}</span>
                <span class="d-value ${d.cls || ""}">${d.value}</span>
            </div>
        `).join("");

        lastResult = r;

        setTimeout(() => {
            const rect = resultArea.getBoundingClientRect();
            if (rect.top > window.innerHeight - 100) {
                resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(r) {
        history.unshift({
            mode: r.mode,
            modeLabel: r.modeLabel,
            expression: r.expression,
            heroValue: r.heroValue,
            copyText: r.copyText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 30) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            tmHistoryList.innerHTML = '<div class="empty-history">No calculations yet</div>';
            return;
        }
        tmHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-mode">${escapeHtml(h.modeLabel)} · ${escapeHtml(h.time)}</span>
                    <span class="hi-expr">${escapeHtml(h.expression)}</span>
                </div>
                <span class="hi-result">${escapeHtml(h.heroValue)}</span>
            </div>
        `).join("");

        tmHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                resultArea.style.display = "block";
                heroLabel.textContent = h.modeLabel.toUpperCase();
                heroValue.textContent = h.heroValue;
                heroSub.textContent   = h.expression;
                resultDetails.innerHTML = `
                    <div class="detail-item">
                        <span class="d-label"><i class="fa-solid fa-clock-rotate-left"></i> From history</span>
                        <span class="d-value">${escapeHtml(h.time)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label"><i class="fa-solid fa-calculator"></i> Expression</span>
                        <span class="d-value">${escapeHtml(h.expression)}</span>
                    </div>
                `;
                lastResult = { copyText: h.copyText };
                setTimeout(() => {
                    resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }, 60);
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
       ACTIONS
       ============================================================ */
    function resetAll() {
        document.querySelectorAll(".ti").forEach((inp) => (inp.value = ""));
        document.querySelectorAll("input[type='time']").forEach((inp) => (inp.value = ""));
        document.querySelectorAll("input[type='number']").forEach((inp) => {
            // Reset only in time modes, but keep defaults in work hours
            if (inp.id === "wh-ot") inp.value = "8";
            else if (inp.id === "wh-otm") inp.value = "1.5";
            else if (inp.id === "wh-break") inp.value = "0";
            else if (inp.id === "cv-value") inp.value = "";
            else if (inp.dataset.t) inp.value = "";
            else if (inp.id === "wh-rate") inp.value = "";
        });
        cvResults.innerHTML = "";
        hideError();
        resultArea.style.display = "none";
        lastResult = null;
        if (typeof showToast === "function") showToast("🔄 Reset");
    }

    function clearInputsOnly() {
        const active = document.querySelector(`.mode-content[data-content="${currentMode}"]`);
        if (active) {
            active.querySelectorAll("input").forEach((inp) => {
                if (inp.id === "wh-ot") inp.value = "8";
                else if (inp.id === "wh-otm") inp.value = "1.5";
                else if (inp.id === "wh-break") inp.value = "0";
                else inp.value = "";
            });
            if (currentMode === "convert") cvResults.innerHTML = "";
        }
        hideError();
    }

    /* Copy */
    copyResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = lastResult.copyText || `${heroValue.textContent}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (typeof showToast === "function") showToast("📋 Copied!");
            }).catch(() => fallbackCopy(text));
        } else fallbackCopy(text);
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
    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = `${heroLabel.textContent}: ${heroValue.textContent}`;
        if (navigator.share) {
            navigator.share({ title: "Time Result", text, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    clearResultBtn.addEventListener("click", () => {
        resultArea.style.display = "none";
        lastResult = null;
    });

    clearTmHistory.addEventListener("click", () => {
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
    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    calcBtn.addEventListener("click", calculate);
    resetBtn.addEventListener("click", resetAll);
    clearBtn.addEventListener("click", clearInputsOnly);

    // Live convert preview
    cvValue.addEventListener("input", () => {
        renderConvertResults();
        hideError();
    });
    cvFrom.addEventListener("change", () => {
        renderConvertResults();
        if (cvValue.value && resultArea.style.display === "block" && currentMode === "convert") {
            calculate();
        }
    });

    // Quick picks for between mode
    document.querySelectorAll(".qp").forEach((qp) => {
        qp.addEventListener("click", () => {
            const [start, end] = qp.dataset.bt.split("|");
            document.getElementById("bt-start").value = start;
            document.getElementById("bt-end").value = end;
            calculate();
        });
    });

    // Enter triggers calculate
    document.querySelectorAll(".ti, .mode-content input, .mode-content select").forEach((inp) => {
        inp.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                calculate();
            }
        });
        inp.addEventListener("input", hideError);
    });

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select";
        if (e.key === "Escape") {
            e.preventDefault();
            resetAll();
        }
        if (!typing && /^[1-5]$/.test(e.key)) {
            const modes = ["add", "subtract", "between", "convert", "workhours"];
            const idx = parseInt(e.key, 10) - 1;
            if (modes[idx]) setMode(modes[idx]);
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareTime = function () {
        const shareData = {
            title: "Time Calculator - Tool Hub",
            text: "Add, subtract, convert time & calculate work hours!",
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
        setMode("add");
        renderHistory();
    }

    init();
})();