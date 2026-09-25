/* ============================================================
   PERCENTAGE CALCULATOR - Advanced Logic
   8 different modes with full details, history & sharing
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const pctCard        = document.getElementById("pctCard");
    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");
    const calcBtn        = document.getElementById("calcBtn");
    const resetPctBtn    = document.getElementById("resetPctBtn");
    const swapBtn        = document.getElementById("swapBtn");
    const pctError       = document.getElementById("pctError");

    const resultArea     = document.getElementById("resultArea");
    const resultLabel    = document.getElementById("resultLabel");
    const resultValue    = document.getElementById("resultValue");
    const resultSub      = document.getElementById("resultSub");
    const resultDetails  = document.getElementById("resultDetails");

    const copyResultBtn  = document.getElementById("copyResultBtn");
    const shareResultBtn = document.getElementById("shareResultBtn");
    const clearResultBtn = document.getElementById("clearResultBtn");

    const pctHistoryList = document.getElementById("pctHistoryList");
    const clearPctHistory= document.getElementById("clearPctHistory");

    /* ---------------- State ---------------- */
    let currentMode = "what-is";
    let lastResult  = null;
    let history     = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_pct_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_pct_history", JSON.stringify(history.slice(0, 30)));
        } catch (e) {}
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    function num(id) {
        const el = document.getElementById(id);
        if (!el) return NaN;
        const v = el.value.trim();
        if (v === "") return NaN;
        const n = parseFloat(v);
        return isNaN(n) ? NaN : n;
    }

    function fmt(n, maxDec = 4) {
        if (!isFinite(n)) return "—";
        // Avoid tiny floating errors
        const rounded = Math.round(n * Math.pow(10, maxDec)) / Math.pow(10, maxDec);
        // Add thousand separators
        const parts = rounded.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    function fmtPct(n) {
        return fmt(n, 4) + "%";
    }

    function showError(msg) {
        pctError.textContent = msg;
        pctError.classList.add("show");
        pctError.style.animation = "none";
        void pctError.offsetWidth;
        pctError.style.animation = "";
    }

    function hideError() {
        pctError.classList.remove("show");
        pctError.textContent = "";
    }

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) =>
            t.classList.toggle("active", t.dataset.mode === mode)
        );
        modeContents.forEach((c) =>
            c.classList.toggle("active", c.dataset.content === mode)
        );
        hideError();
        // Focus first input
        const firstInput = document.querySelector(
            `.mode-content[data-content="${mode}"] input`
        );
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }

    /* ============================================================
       CALCULATION LOGIC
       ============================================================ */
    function calculate() {
        hideError();

        let result = null;

        switch (currentMode) {
            case "what-is":       result = calcWhatIs(); break;
            case "is-what":       result = calcIsWhat(); break;
            case "change":        result = calcChange(); break;
            case "difference":    result = calcDifference(); break;
            case "reverse":       result = calcReverse(); break;
            case "add-sub":       result = calcAddSub(); break;
            case "discount":      result = calcDiscount(); break;
            case "tip":           result = calcTip(); break;
        }

        if (!result) return;

        renderResult(result);
        pushHistory(result);
    }

    /* ---------- Mode 1: What is X% of Y? ---------- */
    function calcWhatIs() {
        const x = num("wi-x");
        const y = num("wi-y");
        if (isNaN(x) || isNaN(y)) {
            showError("⚠️ Please fill in both fields");
            return null;
        }
        const res = (x / 100) * y;
        return {
            mode: "what-is",
            modeLabel: "X% of Y",
            expression: `${x}% of ${y}`,
            heroLabel: "RESULT",
            heroValue: fmt(res),
            heroSub: `${x}% of ${y} = ${fmt(res)}`,
            details: [
                { icon: "fa-percent", label: "Percentage", value: fmtPct(x) },
                { icon: "fa-hashtag", label: "Number", value: fmt(y) },
                { icon: "fa-divide", label: "Calculation", value: `(${x} ÷ 100) × ${y}` },
                { icon: "fa-equals", label: "Answer", value: fmt(res) },
            ],
            copyText: `${x}% of ${y} = ${fmt(res)}`,
        };
    }

    /* ---------- Mode 2: X is what % of Y? ---------- */
    function calcIsWhat() {
        const x = num("iw-x");
        const y = num("iw-y");
        if (isNaN(x) || isNaN(y)) {
            showError("⚠️ Please fill in both fields");
            return null;
        }
        if (y === 0) {
            showError("⚠️ Total (Y) cannot be zero");
            return null;
        }
        const res = (x / y) * 100;
        return {
            mode: "is-what",
            modeLabel: "X is what % of Y",
            expression: `${x} is what % of ${y}`,
            heroLabel: "PERCENTAGE",
            heroValue: fmtPct(res),
            heroSub: `${x} is ${fmtPct(res)} of ${y}`,
            details: [
                { icon: "fa-hashtag", label: "Value (X)", value: fmt(x) },
                { icon: "fa-hashtag", label: "Total (Y)", value: fmt(y) },
                { icon: "fa-divide", label: "Calculation", value: `(${x} ÷ ${y}) × 100` },
                { icon: "fa-equals", label: "Percentage", value: fmtPct(res) },
            ],
            copyText: `${x} is ${fmtPct(res)} of ${y}`,
        };
    }

    /* ---------- Mode 3: % Increase / Decrease ---------- */
    function calcChange() {
        const from = num("ch-from");
        const to   = num("ch-to");
        if (isNaN(from) || isNaN(to)) {
            showError("⚠️ Please fill in both values");
            return null;
        }
        if (from === 0) {
            showError("⚠️ Original value cannot be zero");
            return null;
        }
        const diff = to - from;
        const pctChange = (diff / Math.abs(from)) * 100;
        const isIncrease = pctChange > 0;
        const isSame = pctChange === 0;

        const label = isSame ? "NO CHANGE" : (isIncrease ? "INCREASE" : "DECREASE");
        const icon = isSame ? "fa-equals" : (isIncrease ? "fa-arrow-trend-up" : "fa-arrow-trend-down");

        return {
            mode: "change",
            modeLabel: isIncrease ? "Increase" : (isSame ? "No Change" : "Decrease"),
            expression: `From ${from} to ${to}`,
            heroLabel: label,
            heroValue: (isSame ? "0" : (isIncrease ? "+" : "") + fmt(pctChange)) + "%",
            heroSub: isSame
                ? `Value stayed the same at ${fmt(from)}`
                : `${isIncrease ? "Increased" : "Decreased"} by ${fmt(Math.abs(diff))} (${fmt(Math.abs(pctChange))}%)`,
            details: [
                { icon: "fa-flag", label: "Original", value: fmt(from) },
                { icon: "fa-flag-checkered", label: "New Value", value: fmt(to) },
                { icon: "fa-plus-minus", label: "Difference", value: (diff > 0 ? "+" : "") + fmt(diff) },
                { icon, label: "Change", value: (isIncrease && !isSame ? "+" : "") + fmt(pctChange) + "%" },
            ],
            copyText: `From ${from} to ${to}: ${isIncrease ? "+" : ""}${fmt(pctChange)}% (${isIncrease ? "increase" : isSame ? "no change" : "decrease"})`,
        };
    }

    /* ---------- Mode 4: % Difference ---------- */
    function calcDifference() {
        const a = num("df-a");
        const b = num("df-b");
        if (isNaN(a) || isNaN(b)) {
            showError("⚠️ Please fill in both values");
            return null;
        }
        const avg = (Math.abs(a) + Math.abs(b)) / 2;
        if (avg === 0) {
            showError("⚠️ Values cannot both be zero");
            return null;
        }
        const diff = Math.abs(a - b);
        const pctDiff = (diff / avg) * 100;

        return {
            mode: "difference",
            modeLabel: "Percentage Difference",
            expression: `Between ${a} and ${b}`,
            heroLabel: "DIFFERENCE",
            heroValue: fmt(pctDiff) + "%",
            heroSub: `The percentage difference between ${fmt(a)} and ${fmt(b)} is ${fmt(pctDiff)}%`,
            details: [
                { icon: "fa-a", label: "Value A", value: fmt(a) },
                { icon: "fa-b", label: "Value B", value: fmt(b) },
                { icon: "fa-minus", label: "Absolute Difference", value: fmt(diff) },
                { icon: "fa-divide", label: "Average", value: fmt(avg) },
                { icon: "fa-equals", label: "Percentage Difference", value: fmt(pctDiff) + "%" },
            ],
            copyText: `Percentage difference between ${a} and ${b} = ${fmt(pctDiff)}%`,
        };
    }

    /* ---------- Mode 5: Reverse % ---------- */
    function calcReverse() {
        const finalNum = num("rv-result");
        const pct      = num("rv-pct");
        if (isNaN(finalNum) || isNaN(pct)) {
            showError("⚠️ Please fill in both fields");
            return null;
        }
        if (pct === 0) {
            showError("⚠️ Percentage cannot be zero");
            return null;
        }
        const original = (finalNum / pct) * 100;

        return {
            mode: "reverse",
            modeLabel: "Reverse Percentage",
            expression: `If ${pct}% = ${finalNum}, then 100% = ?`,
            heroLabel: "ORIGINAL VALUE",
            heroValue: fmt(original),
            heroSub: `${finalNum} is ${fmt(pct)}% of ${fmt(original)}`,
            details: [
                { icon: "fa-flag-checkered", label: "Final Number", value: fmt(finalNum) },
                { icon: "fa-percent", label: "Percentage", value: fmtPct(pct) },
                { icon: "fa-divide", label: "Calculation", value: `(${finalNum} ÷ ${pct}) × 100` },
                { icon: "fa-equals", label: "Original Value", value: fmt(original) },
            ],
            copyText: `If ${pct}% = ${finalNum}, then original value = ${fmt(original)}`,
        };
    }

    /* ---------- Mode 6: Add / Subtract % ---------- */
    function calcAddSub() {
        const base = num("as-base");
        const pct  = num("as-pct");
        if (isNaN(base) || isNaN(pct)) {
            showError("⚠️ Please fill in both fields");
            return null;
        }
        const choice = document.querySelector('input[name="as-choice"]:checked').value;
        const isAdd  = choice === "add";
        const amount = (base * pct) / 100;
        const result = isAdd ? base + amount : base - amount;

        return {
            mode: "add-sub",
            modeLabel: isAdd ? "Add %" : "Subtract %",
            expression: `${base} ${isAdd ? "+" : "−"} ${pct}%`,
            heroLabel: isAdd ? "RESULT (ADDED)" : "RESULT (SUBTRACTED)",
            heroValue: fmt(result),
            heroSub: `${fmt(base)} ${isAdd ? "+" : "−"} ${fmt(amount)} (${fmtPct(pct)}) = ${fmt(result)}`,
            details: [
                { icon: "fa-hashtag", label: "Base Number", value: fmt(base) },
                { icon: "fa-percent", label: "Percentage", value: fmtPct(pct) },
                { icon: isAdd ? "fa-plus" : "fa-minus", label: isAdd ? "Added Amount" : "Subtracted Amount", value: fmt(amount) },
                { icon: "fa-equals", label: "Final Result", value: fmt(result) },
            ],
            copyText: `${base} ${isAdd ? "+" : "−"} ${pct}% = ${fmt(result)}`,
        };
    }

    /* ---------- Mode 7: Discount ---------- */
    function calcDiscount() {
        const price = num("dc-price");
        const pct   = num("dc-pct");
        if (isNaN(price) || isNaN(pct)) {
            showError("⚠️ Please fill in both fields");
            return null;
        }
        if (pct < 0 || pct > 100) {
            showError("⚠️ Discount must be between 0 and 100");
            return null;
        }
        const discount = (price * pct) / 100;
        const final    = price - discount;

        return {
            mode: "discount",
            modeLabel: "Discount",
            expression: `${fmtPct(pct)} off ${fmt(price)}`,
            heroLabel: "FINAL PRICE",
            heroValue: fmt(final),
            heroSub: `You save ${fmt(discount)} (${fmtPct(pct)}) on ${fmt(price)}`,
            details: [
                { icon: "fa-tag", label: "Original Price", value: fmt(price) },
                { icon: "fa-percent", label: "Discount", value: fmtPct(pct) },
                { icon: "fa-hand-holding-dollar", label: "You Save", value: fmt(discount) },
                { icon: "fa-money-bill-wave", label: "Final Price", value: fmt(final) },
            ],
            copyText: `${fmtPct(pct)} off ${fmt(price)} = ${fmt(final)} (saves ${fmt(discount)})`,
        };
    }

    /* ---------- Mode 8: Tip Split ---------- */
    function calcTip() {
        const bill = num("tp-bill");
        const pct  = num("tp-pct");
        let people = num("tp-people");
        if (isNaN(bill) || isNaN(pct)) {
            showError("⚠️ Please fill Bill Amount and Tip %");
            return null;
        }
        if (isNaN(people) || people < 1) people = 1;
        people = Math.floor(people);

        const tip     = (bill * pct) / 100;
        const total   = bill + tip;
        const perHead = total / people;

        return {
            mode: "tip",
            modeLabel: "Tip Split",
            expression: `${fmtPct(pct)} tip on ${fmt(bill)} ÷ ${people}`,
            heroLabel: people > 1 ? "PER PERSON" : "TOTAL WITH TIP",
            heroValue: fmt(people > 1 ? perHead : total),
            heroSub: people > 1
                ? `${people} people · total ${fmt(total)} (incl. ${fmt(tip)} tip)`
                : `Total ${fmt(total)} (bill ${fmt(bill)} + tip ${fmt(tip)})`,
            details: [
                { icon: "fa-receipt", label: "Bill Amount", value: fmt(bill) },
                { icon: "fa-percent", label: "Tip", value: fmtPct(pct) + " = " + fmt(tip) },
                { icon: "fa-money-bill-wave", label: "Total (with tip)", value: fmt(total) },
                { icon: "fa-users", label: people > 1 ? `Split by ${people}` : "No Split", value: fmt(people > 1 ? perHead : total) + (people > 1 ? " / person" : "") },
            ],
            copyText: `Bill ${fmt(bill)} + ${fmtPct(pct)} tip = ${fmt(total)}` + (people > 1 ? ` · ${fmt(perHead)} / person (${people} people)` : ""),
        };
    }

    /* ============================================================
       RENDER RESULT
       ============================================================ */
    function renderResult(r) {
        resultArea.style.display = "block";

        resultLabel.textContent = r.heroLabel;
        resultValue.textContent = r.heroValue;
        resultSub.textContent   = r.heroSub;

        // Details
        resultDetails.innerHTML = r.details
            .map(
                (d) => `
            <div class="detail-item">
                <span class="d-label"><i class="fa-solid ${d.icon}"></i> ${d.label}</span>
                <span class="d-value">${d.value}</span>
            </div>`
            )
            .join("");

        lastResult = r;

        // Smooth scroll (only if out of view)
        setTimeout(() => {
            const rect = resultArea.getBoundingClientRect();
            if (rect.top > window.innerHeight - 100 || rect.bottom < 100) {
                resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 60);
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
            pctHistoryList.innerHTML =
                '<div class="empty-history">No calculations yet</div>';
            return;
        }
        pctHistoryList.innerHTML = history
            .map(
                (h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-mode">${escapeHtml(h.modeLabel)} · ${escapeHtml(h.time)}</span>
                    <span class="hi-expr">${escapeHtml(h.expression)}</span>
                </div>
                <span class="hi-result">${escapeHtml(h.heroValue)}</span>
            </div>`
            )
            .join("");

        pctHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                // Load into result area (without recomputing)
                resultArea.style.display = "block";
                resultLabel.textContent = h.modeLabel.toUpperCase();
                resultValue.textContent = h.heroValue;
                resultSub.textContent   = h.copyText;
                resultDetails.innerHTML = `
                    <div class="detail-item">
                        <span class="d-label"><i class="fa-solid fa-clock-rotate-left"></i> From history</span>
                        <span class="d-value">${escapeHtml(h.time)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="d-label"><i class="fa-solid fa-calculator"></i> Calculation</span>
                        <span class="d-value">${escapeHtml(h.expression)}</span>
                    </div>
                `;
                lastResult = { copyText: h.copyText, heroValue: h.heroValue };
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
        // Clear all inputs
        document.querySelectorAll(".pct-input").forEach((inp) => (inp.value = ""));
        // Reset radio
        const addRadio = document.querySelector('input[name="as-choice"][value="add"]');
        if (addRadio) addRadio.checked = true;
        // Hide result
        resultArea.style.display = "none";
        hideError();
        lastResult = null;
        if (typeof showToast === "function") showToast("🔄 Reset");
    }

    function clearInputsOnly() {
        const active = document.querySelector(`.mode-content[data-content="${currentMode}"]`);
        if (active) {
            active.querySelectorAll("input").forEach((inp) => {
                if (inp.type !== "radio") inp.value = "";
            });
        }
        hideError();
    }

    /* Copy result */
    copyResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = lastResult.copyText || lastResult.heroValue;
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    if (typeof showToast === "function") showToast("📋 Copied!");
                })
                .catch(() => fallbackCopy(text));
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

    /* Share result */
    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = lastResult.copyText || lastResult.heroValue;
        if (navigator.share) {
            navigator
                .share({ title: "Percentage Result", text, url: window.location.href })
                .catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    /* Clear result */
    clearResultBtn.addEventListener("click", () => {
        resultArea.style.display = "none";
        lastResult = null;
    });

    /* Clear history */
    clearPctHistory.addEventListener("click", () => {
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
    resetPctBtn.addEventListener("click", resetAll);
    swapBtn.addEventListener("click", clearInputsOnly);

    // Auto-calculate when pressing Enter in any input
    document.querySelectorAll(".pct-input").forEach((input) => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                calculate();
            }
        });
        // Also live preview option? Skip, user must press Calculate
    });

    // Radio choice triggers recalc if already showing result
    document.querySelectorAll('input[name="as-choice"]').forEach((r) => {
        r.addEventListener("change", () => {
            if (resultArea.style.display === "block" && currentMode === "add-sub") {
                calculate();
            }
        });
    });

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const isTyping = tag === "input" || tag === "textarea" || e.target.isContentEditable;

        if (e.key === "Escape") {
            e.preventDefault();
            resetAll();
        }
        // Number 1-8 to switch modes if not typing
        if (!isTyping && /^[1-8]$/.test(e.key)) {
            const modes = [
                "what-is", "is-what", "change", "difference",
                "reverse", "add-sub", "discount", "tip",
            ];
            const idx = parseInt(e.key, 10) - 1;
            if (modes[idx]) setMode(modes[idx]);
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.sharePct = function () {
        const shareData = {
            title: "Percentage Calculator - Tool Hub",
            text: "All-in-one percentage calculator — 8 different modes!",
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
        setMode("what-is");
        renderHistory();
    }

    init();
})();