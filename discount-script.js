/* ============================================================
   DISCOUNT CALCULATOR - Advanced Logic
   4 modes: Single, Stacked, Find % Off, Split Bill
   With tax, flat-off, multi-currency, and history
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const discCard      = document.getElementById("discCard");
    const currencySel   = document.getElementById("currencySelect");
    const modeTabs      = document.querySelectorAll(".mode-tab");
    const modeContents  = document.querySelectorAll(".mode-content");
    const calcBtn       = document.getElementById("calcDiscBtn");
    const resetBtn      = document.getElementById("resetDiscBtn");
    const clearBtn      = document.getElementById("clearDiscBtn");
    const discError     = document.getElementById("discError");

    const resultArea    = document.getElementById("resultArea");
    const heroFinal     = document.getElementById("heroFinal");
    const heroSavings   = document.getElementById("heroSavings");
    const heroBadge     = document.getElementById("heroBadge");
    const resultDetails = document.getElementById("resultDetails");

    const copyResultBtn = document.getElementById("copyResultBtn");
    const shareResultBtn= document.getElementById("shareResultBtn");
    const clearResultBtn= document.getElementById("clearResultBtn");

    const discHistoryList = document.getElementById("discHistoryList");
    const clearDiscHistory= document.getElementById("clearDiscHistory");

    const stackedList   = document.getElementById("stackedList");
    const addStackBtn   = document.getElementById("addStackBtn");

    /* ---------------- State ---------------- */
    let currentMode = "single";
    let currency    = "$";
    let lastResult  = null;
    let history     = loadHistory();
    let stackCount  = 0;

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_discount_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_discount_history", JSON.stringify(history.slice(0, 30)));
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

    function fmtMoney(n, decimals = 2) {
        if (!isFinite(n)) return currency + "0.00";
        const fixed = Math.abs(n).toFixed(decimals);
        const parts = fixed.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const sign = n < 0 ? "-" : "";
        return sign + currency + parts.join(".");
    }

    function fmtPct(n, decimals = 2) {
        if (!isFinite(n)) return "0%";
        const rounded = Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
        return rounded.toString() + "%";
    }

    function showError(msg) {
        discError.textContent = msg;
        discError.classList.add("show");
        discError.style.animation = "none";
        void discError.offsetWidth;
        discError.style.animation = "";
    }
    function hideError() {
        discError.classList.remove("show");
        discError.textContent = "";
    }

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
        modeContents.forEach((c) => c.classList.toggle("active", c.dataset.content === mode));
        hideError();

        // Auto-focus first input
        const firstInput = document.querySelector(
            `.mode-content[data-content="${mode}"] input`
        );
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }

    /* ============================================================
       STACKED DISCOUNTS UI
       ============================================================ */
    function addStackItem(value = "") {
        stackCount++;
        const el = document.createElement("div");
        el.className = "stack-item";
        el.innerHTML = `
            <span class="stack-num">${stackCount}</span>
            <input type="number" class="stack-input" placeholder="Discount %" value="${value}" min="0" max="100" inputmode="decimal">
            <span class="stack-percent">%</span>
            <button class="stack-remove" type="button" title="Remove"><i class="fa-solid fa-xmark"></i></button>
        `;
        stackedList.appendChild(el);

        el.querySelector(".stack-remove").addEventListener("click", () => {
            el.remove();
            // Renumber
            stackedList.querySelectorAll(".stack-item").forEach((item, idx) => {
                item.querySelector(".stack-num").textContent = idx + 1;
            });
            stackCount = stackedList.querySelectorAll(".stack-item").length;
            if (stackCount === 0) addStackItem(); // keep at least one
        });

        // Auto-calc on input change
        el.querySelector(".stack-input").addEventListener("input", () => {
            if (resultArea.style.display === "block" && currentMode === "stacked") {
                calculate();
            }
        });

        return el;
    }

    function initStacked() {
        stackedList.innerHTML = "";
        stackCount = 0;
        addStackItem("10");
        addStackItem("5");
    }

    /* ============================================================
       CALCULATION
       ============================================================ */
    function calculate() {
        hideError();

        let result = null;
        switch (currentMode) {
            case "single":     result = calcSingle(); break;
            case "stacked":    result = calcStacked(); break;
            case "final-price":result = calcFindPercent(); break;
            case "split":      result = calcSplit(); break;
        }

        if (!result) return;
        renderResult(result);
        pushHistory(result);
    }

    /* ---------- Mode 1: Single Discount ---------- */
    function calcSingle() {
        const price = num("sd-price");
        const pct   = num("sd-percent");
        const tax   = num("sd-tax");
        const flat  = num("sd-flat");

        if (isNaN(price) || price <= 0) {
            showError("⚠️ Please enter a valid original price");
            return null;
        }
        if (isNaN(pct) || pct < 0 || pct > 100) {
            showError("⚠️ Discount must be between 0 and 100");
            return null;
        }
        const taxVal = isNaN(tax) || tax < 0 ? 0 : tax;
        const flatVal= isNaN(flat) || flat < 0 ? 0 : flat;

        const discountAmount = (price * pct) / 100;
        const afterDiscount  = price - discountAmount;
        const afterFlat      = Math.max(0, afterDiscount - flatVal);
        const taxAmount      = (afterFlat * taxVal) / 100;
        const finalPrice     = afterFlat + taxAmount;
        const totalSaved     = price - finalPrice + (taxAmount > 0 ? 0 : 0); // just price - afterDiscount - flat
        const savedOnDiscount= discountAmount + flatVal;
        const effectiveOffPct= ((price - (finalPrice - taxAmount)) / price) * 100;

        const details = [
            { icon: "fa-tag", label: "Original Price", value: fmtMoney(price) },
            { icon: "fa-percent", label: `Discount (${fmtPct(pct, 2)})`, value: "− " + fmtMoney(discountAmount), cls: "danger" },
        ];
        if (flatVal > 0) {
            details.push({ icon: "fa-minus", label: "Extra Flat Off", value: "− " + fmtMoney(flatVal), cls: "danger" });
        }
        details.push({ icon: "fa-money-bill-wave", label: "After Discount", value: fmtMoney(afterFlat) });
        if (taxVal > 0) {
            details.push({ icon: "fa-receipt", label: `Tax / VAT (${fmtPct(taxVal, 2)})`, value: "+ " + fmtMoney(taxAmount), cls: "danger" });
        }
        details.push({ icon: "fa-check-circle", label: "Final Price", value: fmtMoney(finalPrice), cls: "success" });
        details.push({ icon: "fa-piggy-bank", label: "You Save", value: fmtMoney(savedOnDiscount), cls: "success" });

        return {
            mode: "single",
            modeLabel: "Single Discount",
            expression: `${fmtPct(pct)} off ${fmtMoney(price)}${flatVal > 0 ? ` + ${fmtMoney(flatVal)} flat` : ""}${taxVal > 0 ? ` + ${fmtPct(taxVal)} tax` : ""}`,
            final: finalPrice,
            saved: savedOnDiscount,
            savedPercent: effectiveOffPct,
            details,
            copyText:
                `Original: ${fmtMoney(price)}\n` +
                `Discount: ${fmtPct(pct)} = ${fmtMoney(discountAmount)}\n` +
                (flatVal > 0 ? `Flat Off: ${fmtMoney(flatVal)}\n` : "") +
                (taxVal > 0 ? `Tax (${fmtPct(taxVal)}): ${fmtMoney(taxAmount)}\n` : "") +
                `Final Price: ${fmtMoney(finalPrice)}\n` +
                `You Save: ${fmtMoney(savedOnDiscount)} (${fmtPct(effectiveOffPct)})`,
        };
    }

    /* ---------- Mode 2: Stacked Discounts ---------- */
    function calcStacked() {
        const price = num("st-price");
        if (isNaN(price) || price <= 0) {
            showError("⚠️ Please enter a valid original price");
            return null;
        }

        const inputs = stackedList.querySelectorAll(".stack-input");
        const discounts = [];
        inputs.forEach((inp, i) => {
            const v = parseFloat(inp.value);
            if (!isNaN(v) && v > 0) {
                if (v > 100) {
                    showError(`⚠️ Discount #${i + 1} must be ≤ 100%`);
                    return null;
                }
                discounts.push(v);
            }
        });

        if (discounts.length === 0) {
            showError("⚠️ Please add at least one discount");
            return null;
        }

        // Apply sequentially
        let current = price;
        const steps = [];
        discounts.forEach((p, i) => {
            const before = current;
            const cut = (current * p) / 100;
            current = current - cut;
            steps.push({
                n: i + 1,
                pct: p,
                before,
                cut,
                after: current,
            });
        });

        const finalPrice = current;
        const savedOnDiscount = price - finalPrice;
        const effectiveOffPct = (savedOnDiscount / price) * 100;

        const details = [
            { icon: "fa-tag", label: "Original Price", value: fmtMoney(price) },
        ];
        steps.forEach((s) => {
            details.push({
                icon: "fa-scissors",
                label: `Step ${s.n}: ${fmtPct(s.pct, 2)} off ${fmtMoney(s.before)}`,
                value: "− " + fmtMoney(s.cut),
                cls: "danger",
            });
        });
        details.push({ icon: "fa-check-circle", label: "Final Price", value: fmtMoney(finalPrice), cls: "success" });
        details.push({ icon: "fa-piggy-bank", label: "You Save", value: fmtMoney(savedOnDiscount), cls: "success" });

        return {
            mode: "stacked",
            modeLabel: `Stacked (${discounts.length} layers)`,
            expression: `${discounts.map(p => fmtPct(p, 0)).join(" + ")} off ${fmtMoney(price)}`,
            final: finalPrice,
            saved: savedOnDiscount,
            savedPercent: effectiveOffPct,
            details,
            copyText:
                `Original: ${fmtMoney(price)}\n` +
                steps.map(s => `Step ${s.n} (${fmtPct(s.pct)}): ${fmtMoney(s.before)} → ${fmtMoney(s.after)} (saved ${fmtMoney(s.cut)})`).join("\n") +
                `\n\nFinal Price: ${fmtMoney(finalPrice)}\n` +
                `Total Saved: ${fmtMoney(savedOnDiscount)} (effective ${fmtPct(effectiveOffPct)})`,
        };
    }

    /* ---------- Mode 3: Find % Off ---------- */
    function calcFindPercent() {
        const original = num("fp-original");
        const finalP   = num("fp-final");
        if (isNaN(original) || original <= 0) {
            showError("⚠️ Please enter a valid original price");
            return null;
        }
        if (isNaN(finalP) || finalP < 0) {
            showError("⚠️ Please enter a valid final price");
            return null;
        }
        if (finalP > original) {
            showError("⚠️ Final price can't be greater than original");
            return null;
        }
        const saved = original - finalP;
        const pct   = (saved / original) * 100;

        const details = [
            { icon: "fa-tag", label: "Original Price", value: fmtMoney(original) },
            { icon: "fa-money-bill-wave", label: "Final Price", value: fmtMoney(finalP) },
            { icon: "fa-piggy-bank", label: "You Save", value: fmtMoney(saved), cls: "success" },
            { icon: "fa-percent", label: "Discount Percentage", value: fmtPct(pct, 4), cls: "accent" },
        ];

        return {
            mode: "final-price",
            modeLabel: "Find % Off",
            expression: `${fmtMoney(original)} → ${fmtMoney(finalP)}`,
            final: finalP,
            saved,
            savedPercent: pct,
            details,
            copyText:
                `Original: ${fmtMoney(original)}\n` +
                `Final:    ${fmtMoney(finalP)}\n` +
                `Savings:  ${fmtMoney(saved)} (${fmtPct(pct, 4)} off)`,
        };
    }

    /* ---------- Mode 4: Split Bill ---------- */
    function calcSplit() {
        const bill = num("sp-bill");
        const pct  = num("sp-discount");
        const tax  = num("sp-tax");
        let people = num("sp-people");

        if (isNaN(bill) || bill <= 0) {
            showError("⚠️ Please enter a valid bill amount");
            return null;
        }
        if (isNaN(pct) || pct < 0 || pct > 100) {
            showError("⚠️ Discount must be between 0 and 100");
            return null;
        }
        const taxVal = isNaN(tax) || tax < 0 ? 0 : tax;
        if (isNaN(people) || people < 1) people = 1;
        people = Math.floor(people);

        const discountAmount = (bill * pct) / 100;
        const afterDiscount  = bill - discountAmount;
        const taxAmount      = (afterDiscount * taxVal) / 100;
        const total          = afterDiscount + taxAmount;
        const perPerson      = total / people;
        const savedOnDiscount= discountAmount;

        const details = [
            { icon: "fa-receipt", label: "Bill Amount", value: fmtMoney(bill) },
            { icon: "fa-percent", label: `Discount (${fmtPct(pct, 2)})`, value: "− " + fmtMoney(discountAmount), cls: "danger" },
            { icon: "fa-money-bill-wave", label: "After Discount", value: fmtMoney(afterDiscount) },
        ];
        if (taxVal > 0) {
            details.push({ icon: "fa-receipt", label: `Tax (${fmtPct(taxVal, 2)})`, value: "+ " + fmtMoney(taxAmount), cls: "danger" });
        }
        details.push({ icon: "fa-check-circle", label: "Total to Pay", value: fmtMoney(total), cls: "success" });
        details.push({ icon: "fa-piggy-bank", label: "You Save", value: fmtMoney(savedOnDiscount), cls: "success" });
        if (people > 1) {
            details.push({ icon: "fa-users", label: `Split (${people} people)`, value: fmtMoney(perPerson) + " each", cls: "accent" });
        }

        return {
            mode: "split",
            modeLabel: "Split Bill",
            expression: `${fmtPct(pct)} off ${fmtMoney(bill)}${taxVal > 0 ? ` + ${fmtPct(taxVal)} tax` : ""} ÷ ${people}`,
            final: total,
            saved: savedOnDiscount,
            savedPercent: pct,
            details,
            copyText:
                `Bill: ${fmtMoney(bill)}\n` +
                `Discount (${fmtPct(pct)}): − ${fmtMoney(discountAmount)}\n` +
                (taxVal > 0 ? `Tax (${fmtPct(taxVal)}): + ${fmtMoney(taxAmount)}\n` : "") +
                `Total: ${fmtMoney(total)}\n` +
                `Savings: ${fmtMoney(savedOnDiscount)}\n` +
                (people > 1 ? `Per person (${people}): ${fmtMoney(perPerson)}` : ""),
        };
    }

    /* ============================================================
       RENDER RESULT
       ============================================================ */
    function renderResult(r) {
        resultArea.style.display = "block";

        heroFinal.textContent   = fmtMoney(r.final);
        heroSavings.textContent = fmtMoney(r.saved);
        heroBadge.textContent   = fmtPct(r.savedPercent, 2) + " OFF";

        resultDetails.innerHTML = r.details.map(d => `
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
            final: r.final,
            saved: r.saved,
            savedPercent: r.savedPercent,
            copyText: r.copyText,
            currency,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 30) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            discHistoryList.innerHTML = '<div class="empty-history">No calculations yet</div>';
            return;
        }
        discHistoryList.innerHTML = history.map((h, i) => {
            const cur = h.currency || currency;
            const finalFmt = fmtWithCur(h.final, cur);
            const savedFmt = fmtWithCur(h.saved, cur);
            return `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-mode">${escapeHtml(h.modeLabel)} · ${escapeHtml(h.time)}</span>
                    <span class="hi-expr">${escapeHtml(h.expression)}</span>
                </div>
                <div class="hi-right">
                    <span class="hi-final">${finalFmt}</span>
                    <span class="hi-saved">save ${savedFmt} (${fmtPct(h.savedPercent, 1)})</span>
                </div>
            </div>`;
        }).join("");

        discHistoryList.querySelectorAll(".history-item").forEach(el => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                // Load into result view
                resultArea.style.display = "block";
                heroFinal.textContent   = fmtWithCur(h.final, h.currency || currency);
                heroSavings.textContent = fmtWithCur(h.saved, h.currency || currency);
                heroBadge.textContent   = fmtPct(h.savedPercent, 2) + " OFF";
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
                lastResult = { copyText: h.copyText, final: h.final, saved: h.saved, savedPercent: h.savedPercent };
                setTimeout(() => {
                    resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }, 60);
            });
        });
    }

    function fmtWithCur(n, cur) {
        if (!isFinite(n)) return cur + "0.00";
        const fixed = Math.abs(n).toFixed(2);
        const parts = fixed.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return (n < 0 ? "-" : "") + cur + parts.join(".");
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
        document.querySelectorAll(".disc-input").forEach((inp) => (inp.value = ""));
        document.querySelectorAll(".stack-input").forEach((inp) => (inp.value = ""));
        initStacked();
        hideError();
        resultArea.style.display = "none";
        lastResult = null;
        if (typeof showToast === "function") showToast("🔄 Reset");
    }

    function clearInputsOnly() {
        const active = document.querySelector(`.mode-content[data-content="${currentMode}"]`);
        if (active) {
            active.querySelectorAll("input").forEach((inp) => (inp.value = ""));
        }
        if (currentMode === "stacked") initStacked();
        hideError();
    }

    /* Copy */
    copyResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = lastResult.copyText || `${heroFinal.textContent} — ${heroSavings.textContent}`;
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
    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = `Final: ${heroFinal.textContent} · Save ${heroSavings.textContent} (${heroBadge.textContent})`;
        if (navigator.share) {
            navigator.share({ title: "Discount Result", text, url: window.location.href }).catch(() => {});
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
    clearDiscHistory.addEventListener("click", () => {
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

    addStackBtn.addEventListener("click", () => {
        addStackItem("");
        const inputs = stackedList.querySelectorAll(".stack-input");
        const last = inputs[inputs.length - 1];
        if (last) last.focus();
    });

    // Currency change
    currencySel.addEventListener("change", () => {
        currency = currencySel.value;
        if (resultArea.style.display === "block" && lastResult) {
            // Re-render last result with new currency
            calculate();
        }
    });

    // Quick % chips
    document.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            const target = document.getElementById(chip.dataset.target);
            if (target) {
                target.value = chip.dataset.value;
                target.dispatchEvent(new Event("input", { bubbles: true }));
                if (resultArea.style.display === "block") calculate();
            }
        });
    });

    // Auto-calc on Enter
    document.querySelectorAll(".disc-input, .stack-input").forEach((input) => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                calculate();
            }
        });
        input.addEventListener("input", hideError);
    });

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;

        if (e.key === "Escape") {
            e.preventDefault();
            resetAll();
        }
        // 1-4 to switch modes if not typing
        if (!typing && /^[1-4]$/.test(e.key)) {
            const modes = ["single", "stacked", "final-price", "split"];
            const idx = parseInt(e.key, 10) - 1;
            if (modes[idx]) setMode(modes[idx]);
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareDiscount = function () {
        const shareData = {
            title: "Discount Calculator - Tool Hub",
            text: "Calculate discounts, stacked offers, tax & split bills instantly!",
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
        currency = currencySel.value;
        setMode("single");
        initStacked();
        renderHistory();
    }

    init();
})();