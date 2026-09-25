/* ============================================================
   BMI CALCULATOR - Advanced Logic
   Metric + Imperial, live gauge, BMR, ideal weight, insights
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const bmiCard         = document.getElementById("bmiCard");
    const unitBtns        = document.querySelectorAll(".unit-btn");
    const heightGroupM    = document.getElementById("heightGroupMetric");
    const heightGroupI    = document.getElementById("heightGroupImperial");
    const heightUnit      = document.getElementById("heightUnit");
    const weightUnit      = document.getElementById("weightUnit");
    const ageInput        = document.getElementById("bmiAge");
    const heightCmInput   = document.getElementById("bmiHeightCm");
    const heightFtInput   = document.getElementById("bmiHeightFt");
    const heightInInput   = document.getElementById("bmiHeightIn");
    const weightInput     = document.getElementById("bmiWeight");
    const genderRadios    = document.querySelectorAll('input[name="gender"]');

    const calcBmiBtn      = document.getElementById("calcBmiBtn");
    const resetBmiBtn     = document.getElementById("resetBmiBtn");
    const bmiError        = document.getElementById("bmiError");

    const bmiResult       = document.getElementById("bmiResult");
    const bmiHero         = document.querySelector(".bmi-hero");
    const bmiValueEl      = document.getElementById("bmiValue");
    const bmiCategoryEl   = document.getElementById("bmiCategory");
    const bmiSubEl        = document.getElementById("bmiSub");

    const gaugeMarker     = document.getElementById("gaugeMarker");
    const categoryScale   = document.getElementById("categoryScale");
    const healthCards     = document.getElementById("healthCards");
    const healthRange     = document.getElementById("healthRange");
    const bmrSection      = document.getElementById("bmrSection");

    const copyBmiBtn      = document.getElementById("copyBmiBtn");
    const shareBmiResultBtn = document.getElementById("shareBmiResultBtn");
    const clearBmiBtn     = document.getElementById("clearBmiBtn");

    const bmiHistoryList  = document.getElementById("bmiHistoryList");
    const clearBmiHistory = document.getElementById("clearBmiHistory");

    /* ---------------- Constants ---------------- */
    const CATEGORIES = [
        { key: "under",   name: "Underweight", range: "< 18.5",   min: 0,    max: 18.5, color: "#3b82f6",
          tip: "You may need to gain some weight. Consult a nutritionist." },
        { key: "normal",  name: "Normal",      range: "18.5–24.9", min: 18.5, max: 25,   color: "#10b981",
          tip: "Great! Maintain your healthy lifestyle." },
        { key: "over",    name: "Overweight",  range: "25–29.9",   min: 25,   max: 30,   color: "#f59e0b",
          tip: "Consider diet & exercise to reach a healthier weight." },
        { key: "obese",   name: "Obese",       range: "30–39.9",   min: 30,   max: 40,   color: "#ef4444",
          tip: "Consult a doctor for a personalized health plan." },
        { key: "extreme", name: "Extremely Obese", range: "≥ 40",  min: 40,   max: 100,  color: "#7f1d1d",
          tip: "Please seek medical advice soon." },
    ];

    const GAUGE_MIN = 10;
    const GAUGE_MAX = 40;

    /* ---------------- State ---------------- */
    let currentUnit = "metric";  // metric | imperial
    let lastResult  = null;
    let history     = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_bmi_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_bmi_history", JSON.stringify(history.slice(0, 30)));
        } catch (e) {}
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    function showError(msg) {
        bmiError.textContent = msg;
        bmiError.classList.add("show");
        bmiError.style.animation = "none";
        void bmiError.offsetWidth;
        bmiError.style.animation = "";
    }
    function hideError() {
        bmiError.classList.remove("show");
        bmiError.textContent = "";
    }

    function getGender() {
        const r = document.querySelector('input[name="gender"]:checked');
        return r ? r.value : "male";
    }

    function getCategory(bmi) {
        for (const c of CATEGORIES) {
            if (bmi >= c.min && bmi < c.max) return c;
        }
        return CATEGORIES[CATEGORIES.length - 1];
    }

    function fmt(n, d = 1) {
        return Number(n).toFixed(d);
    }

    /* ============================================================
       UNIT SWITCHING
       ============================================================ */
    function setUnit(unit) {
        currentUnit = unit;
        unitBtns.forEach((b) => b.classList.toggle("active", b.dataset.unit === unit));

        if (unit === "metric") {
            heightGroupM.style.display = "block";
            heightGroupI.style.display = "none";
            heightUnit.textContent = "(cm)";
            weightUnit.textContent = "(kg)";
            heightCmInput.placeholder = "e.g. 175";
            weightInput.placeholder = "e.g. 70";
            weightInput.max = 500;
        } else {
            heightGroupM.style.display = "none";
            heightGroupI.style.display = "flex";
            heightUnit.textContent = "(ft / in)";
            weightUnit.textContent = "(lb)";
            heightFtInput.placeholder = "ft";
            heightInInput.placeholder = "in";
            weightInput.placeholder = "e.g. 154";
            weightInput.max = 1100;
        }
        hideError();
    }

    /* ============================================================
       COLLECT INPUT
       ============================================================ */
    function collectInputs() {
        const age = parseInt(ageInput.value, 10);
        const gender = getGender();

        let heightCm = null;
        let weightKg = null;

        if (currentUnit === "metric") {
            const cm = parseFloat(heightCmInput.value);
            const kg = parseFloat(weightInput.value);

            if (isNaN(cm) || cm <= 0) {
                showError("⚠️ Please enter a valid height in cm");
                return null;
            }
            if (isNaN(kg) || kg <= 0) {
                showError("⚠️ Please enter a valid weight in kg");
                return null;
            }
            if (cm < 50 || cm > 250) {
                showError("⚠️ Height should be between 50 and 250 cm");
                return null;
            }
            if (kg < 1 || kg > 500) {
                showError("⚠️ Weight should be between 1 and 500 kg");
                return null;
            }
            heightCm = cm;
            weightKg = kg;
        } else {
            const ft = parseFloat(heightFtInput.value);
            const inch = parseFloat(heightInInput.value) || 0;
            const lb = parseFloat(weightInput.value);

            if (isNaN(ft) || ft <= 0) {
                showError("⚠️ Please enter a valid height in feet");
                return null;
            }
            if (ft < 1 || ft > 8 || inch < 0 || inch >= 12) {
                showError("⚠️ Height should be between 1–8 ft and 0–11 in");
                return null;
            }
            if (isNaN(lb) || lb <= 0 || lb > 1100) {
                showError("⚠️ Weight should be between 1 and 1100 lb");
                return null;
            }
            heightCm = (ft * 12 + inch) * 2.54;
            weightKg = lb * 0.45359237;
        }

        return {
            age: !isNaN(age) && age >= 2 && age <= 120 ? age : 30, // default 30 for BMR
            hasAge: !isNaN(age) && age >= 2 && age <= 120,
            gender,
            heightCm,
            weightKg,
        };
    }

    /* ============================================================
       CALCULATIONS
       ============================================================ */
    function calcBMI(heightCm, weightKg) {
        const m = heightCm / 100;
        return weightKg / (m * m);
    }

    function calcBMR(gender, weightKg, heightCm, age) {
        // Mifflin-St Jeor
        if (gender === "male") {
            return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        }
        return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    function idealWeightRange(heightCm) {
        // Based on BMI 18.5 to 24.9
        const m = heightCm / 100;
        const min = 18.5 * m * m;
        const max = 24.9 * m * m;
        return { min, max };
    }

    /* ============================================================
       RENDER
       ============================================================ */
    function renderResult(data) {
        const { heightCm, weightKg, gender, age, hasAge } = data;
        const bmi = calcBMI(heightCm, weightKg);
        const cat = getCategory(bmi);

        // Hero
        bmiValueEl.textContent = fmt(bmi, 1);
        bmiCategoryEl.textContent = cat.name;
        bmiHero.classList.remove("under", "normal", "over", "obese", "extreme");
        bmiHero.classList.add(cat.key);

        // BMI sub message
        let subMsg = "";
        if (cat.key === "normal") {
            subMsg = "Great! You're in the healthy BMI range.";
        } else if (cat.key === "under") {
            subMsg = "You're underweight. Consider gaining some weight.";
        } else if (cat.key === "over") {
            subMsg = "You're slightly overweight. Small changes help!";
        } else if (cat.key === "obese") {
            subMsg = "Obesity range. Consider consulting a health expert.";
        } else {
            subMsg = "Extremely obese. Please seek medical advice.";
        }
        bmiSubEl.textContent = subMsg;

        // Gauge marker position
        const clampedBMI = Math.max(GAUGE_MIN, Math.min(GAUGE_MAX, bmi));
        const pct = ((clampedBMI - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100;
        gaugeMarker.style.left = pct + "%";

        // Category scale
        categoryScale.innerHTML = CATEGORIES.slice(0, 4).map((c) => `
            <div class="cat-item ${c.key} ${c.key === cat.key ? "active" : ""}">
                <div class="cat-name">${c.name}</div>
                <div class="cat-range">${c.range}</div>
            </div>
        `).join("");

        // Health cards
        const ideal = idealWeightRange(heightCm);
        const diffKg = weightKg < ideal.min
            ? -(ideal.min - weightKg)
            : weightKg > ideal.max
            ? weightKg - ideal.max
            : 0;

        healthCards.innerHTML = `
            <div class="health-card">
                <div class="hc-label"><i class="fa-solid fa-weight-scale"></i> Your BMI</div>
                <div class="hc-value">${fmt(bmi, 2)}</div>
            </div>
            <div class="health-card">
                <div class="hc-label"><i class="fa-solid fa-bullseye"></i> Category</div>
                <div class="hc-value" style="color:${cat.color}">${cat.name}</div>
            </div>
            <div class="health-card">
                <div class="hc-label"><i class="fa-solid fa-ruler-vertical"></i> Height</div>
                <div class="hc-value">${fmt(heightCm, 1)} cm</div>
            </div>
            <div class="health-card">
                <div class="hc-label"><i class="fa-solid fa-weight-hanging"></i> Weight</div>
                <div class="hc-value">${fmt(weightKg, 1)} kg</div>
            </div>
        `;

        // Healthy weight range
        const minLB = ideal.min * 2.20462;
        const maxLB = ideal.max * 2.20462;
        const weightDiffMsg = diffKg === 0
            ? `<b style="color:#10b981">You're at a healthy weight</b>`
            : diffKg > 0
            ? `You're <b style="color:#ef4444">${fmt(diffKg, 1)} kg (${fmt(diffKg * 2.20462, 1)} lb) above</b> healthy range`
            : `You're <b style="color:#3b82f6">${fmt(-diffKg, 1)} kg (${fmt(-diffKg * 2.20462, 1)} lb) below</b> healthy range`;

        // Marker position on range bar (percentage)
        let rangePct = 50;
        if (weightKg < ideal.min) {
            rangePct = Math.max(5, (weightKg / ideal.min) * 40);
        } else if (weightKg > ideal.max) {
            rangePct = Math.min(95, 60 + ((weightKg - ideal.max) / ideal.max) * 35);
        } else {
            rangePct = 40 + ((weightKg - ideal.min) / (ideal.max - ideal.min)) * 20;
        }

        healthRange.innerHTML = `
            <div class="hr-header"><i class="fa-solid fa-heart-pulse"></i> Healthy Weight Range</div>
            <div class="hr-visual">
                <div class="hr-marker" style="left:${rangePct}%"></div>
            </div>
            <div class="hr-info">
                <div>
                    <div class="hr-val">${fmt(ideal.min, 1)} kg</div>
                    <div class="hr-lbl">Min (${fmt(minLB, 1)} lb)</div>
                </div>
                <div>
                    <div class="hr-val">${fmt(ideal.max, 1)} kg</div>
                    <div class="hr-lbl">Max (${fmt(maxLB, 1)} lb)</div>
                </div>
            </div>
            <div class="hr-note">${weightDiffMsg}</div>
        `;

        // BMR section
        const bmr = calcBMR(gender, weightKg, heightCm, age);
        const activityLevels = [
            { label: "Sedentary",   factor: 1.2,   note: "Little/no exercise" },
            { label: "Light",       factor: 1.375, note: "1–3 days/week" },
            { label: "Moderate",    factor: 1.55,  note: "3–5 days/week" },
            { label: "Active",      factor: 1.725, note: "6–7 days/week" },
            { label: "Very Active", factor: 1.9,   note: "Athlete / 2x day" },
        ];

        bmrSection.innerHTML = `
            <div class="bmr-header"><i class="fa-solid fa-fire-flame-curved"></i> Daily Calorie Needs (BMR: ${Math.round(bmr)} kcal)</div>
            <div class="bmr-grid">
                ${activityLevels.map(l => `
                    <div class="bmr-item">
                        <div class="bmr-lbl">${l.label}</div>
                        <div class="bmr-val">${Math.round(bmr * l.factor)} kcal</div>
                        <div class="bmr-note">${l.note}</div>
                    </div>
                `).join("")}
            </div>
        `;

        // Store result
        lastResult = {
            bmi,
            cat,
            heightCm,
            weightKg,
            gender,
            age,
            hasAge,
            ideal,
            bmr: Math.round(bmr),
            unit: currentUnit,
        };

        bmiResult.style.display = "block";

        // Smooth scroll
        setTimeout(() => {
            const rect = bmiResult.getBoundingClientRect();
            if (rect.top > window.innerHeight - 120) {
                bmiResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       CALCULATE
       ============================================================ */
    function calculate() {
        hideError();
        const data = collectInputs();
        if (!data) return;
        renderResult(data);
        pushHistory(data);
        if (typeof showToast === "function") {
            showToast("✅ BMI calculated");
        }
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(data) {
        const bmi = calcBMI(data.heightCm, data.weightKg);
        const cat = getCategory(bmi);
        history.unshift({
            bmi: Number(bmi.toFixed(2)),
            catKey: cat.key,
            catName: cat.name,
            heightCm: Number(data.heightCm.toFixed(1)),
            weightKg: Number(data.weightKg.toFixed(1)),
            gender: data.gender,
            unit: currentUnit,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 30) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            bmiHistoryList.innerHTML = '<div class="empty-history">No calculations yet</div>';
            return;
        }
        bmiHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-time">${escapeHtml(h.time)} · ${h.gender === "male" ? "♂" : "♀"}</span>
                    <span class="hi-info">${h.heightCm} cm · ${h.weightKg} kg</span>
                </div>
                <div class="hi-bmi">
                    <span class="hi-bmi-val">${h.bmi}</span>
                    <span class="hi-bmi-cat ${h.catKey}">${h.catName}</span>
                </div>
            </div>
        `).join("");

        bmiHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                // Load into inputs
                if (h.unit === "metric") {
                    if (currentUnit !== "metric") setUnit("metric");
                    heightCmInput.value = h.heightCm;
                    weightInput.value = h.weightKg;
                } else {
                    if (currentUnit !== "imperial") setUnit("imperial");
                    const totalInch = h.heightCm / 2.54;
                    const ft = Math.floor(totalInch / 12);
                    const inch = Math.round(totalInch % 12);
                    heightFtInput.value = ft;
                    heightInInput.value = inch;
                    weightInput.value = (h.weightKg * 2.20462).toFixed(1);
                }
                if (h.gender === "female") {
                    document.querySelector('input[name="gender"][value="female"]').checked = true;
                } else {
                    document.querySelector('input[name="gender"][value="male"]').checked = true;
                }
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
       ACTIONS
       ============================================================ */
    function resetAll() {
        ageInput.value = "";
        heightCmInput.value = "";
        heightFtInput.value = "";
        heightInInput.value = "";
        weightInput.value = "";
        document.querySelector('input[name="gender"][value="male"]').checked = true;
        hideError();
        bmiResult.style.display = "none";
        lastResult = null;
        if (typeof showToast === "function") showToast("🔄 Reset");
    }

    /* Copy result */
    copyBmiBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const r = lastResult;
        const text = [
            "═══ BMI RESULT ═══",
            "",
            `BMI          : ${fmt(r.bmi, 2)}`,
            `Category     : ${r.cat.name}`,
            `Height       : ${fmt(r.heightCm, 1)} cm`,
            `Weight       : ${fmt(r.weightKg, 1)} kg`,
            `Gender       : ${r.gender}`,
            r.hasAge ? `Age          : ${r.age}` : "",
            "",
            `Healthy Weight Range:`,
            `  ${fmt(r.ideal.min, 1)} kg  –  ${fmt(r.ideal.max, 1)} kg`,
            `  (${fmt(r.ideal.min * 2.20462, 1)} lb  –  ${fmt(r.ideal.max * 2.20462, 1)} lb)`,
            "",
            `BMR (Mifflin-St Jeor): ${r.bmr} kcal/day`,
            "",
            "⚠ BMI is a general guide only.",
            "Generated with Tool Hub ❤️",
        ].filter(Boolean).join("\n");

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
    shareBmiResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const r = lastResult;
        const text = `My BMI is ${fmt(r.bmi, 2)} (${r.cat.name}). Check yours free!`;
        if (navigator.share) {
            navigator.share({ title: "BMI Result", text, url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied!");
            });
        }
    });

    /* Clear result */
    clearBmiBtn.addEventListener("click", () => {
        bmiResult.style.display = "none";
        lastResult = null;
    });

    /* Clear history */
    clearBmiHistory.addEventListener("click", () => {
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
    unitBtns.forEach((btn) => {
        btn.addEventListener("click", () => setUnit(btn.dataset.unit));
    });

    calcBmiBtn.addEventListener("click", calculate);
    resetBmiBtn.addEventListener("click", resetAll);

    [ageInput, heightCmInput, heightFtInput, heightInInput, weightInput].forEach((inp) => {
        inp.addEventListener("input", hideError);
        inp.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                calculate();
            }
        });
    });

    genderRadios.forEach((r) => {
        r.addEventListener("change", () => {
            if (lastResult && bmiResult.style.display === "block") {
                // Auto recalc for BMR (gender affects BMR)
                calculate();
            }
        });
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
    window.shareBMI = function () {
        const shareData = {
            title: "BMI Calculator - Tool Hub",
            text: "Check your Body Mass Index with full health insights!",
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
        setUnit("metric");
        renderHistory();
    }

    init();
})();