/* ============================================================
   AGE CALCULATOR - Advanced Logic
   Works with Tool Hub
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const dobInput       = document.getElementById("dobInput");
    const targetInput    = document.getElementById("targetInput");
    const todayBtn       = document.getElementById("todayBtn");
    const calculateBtn   = document.getElementById("calculateBtn");
    const resetAgeBtn    = document.getElementById("resetAgeBtn");
    const errorMsg       = document.getElementById("errorMsg");
    const resultSection  = document.getElementById("resultSection");

    // Age Hero
    const ageHeroValue   = document.getElementById("ageHeroValue");
    const ageHeroUnit    = document.getElementById("ageHeroUnit");
    const ageHeroSub     = document.getElementById("ageHeroSub");

    // Breakdown
    const bdYears        = document.getElementById("bdYears");
    const bdMonths       = document.getElementById("bdMonths");
    const bdWeeks        = document.getElementById("bdWeeks");
    const bdDays         = document.getElementById("bdDays");
    const bdHours        = document.getElementById("bdHours");
    const bdMinutes      = document.getElementById("bdMinutes");
    const bdSeconds      = document.getElementById("bdSeconds");
    const bdHeartbeats   = document.getElementById("bdHeartbeats");

    // Next Birthday
    const nbDays         = document.getElementById("nbDays");
    const nbHours        = document.getElementById("nbHours");
    const nbMinutes      = document.getElementById("nbMinutes");
    const nbSeconds      = document.getElementById("nbSeconds");
    const nbDate         = document.getElementById("nbDate");

    // Fun facts
    const ffList         = document.getElementById("ffList");

    // Zodiac
    const zodiacIcon     = document.getElementById("zodiacIcon");
    const zodiacName     = document.getElementById("zodiacName");
    const zodiacDates    = document.getElementById("zodiacDates");

    // Actions
    const copyResultBtn     = document.getElementById("copyResultBtn");
    const shareResultBtn    = document.getElementById("shareResultBtn");
    const downloadResultBtn = document.getElementById("downloadResultBtn");

    /* ---------------- Constants ---------------- */
    const ZODIAC = [
        { name: "Capricorn",   symbol: "♑", from: [12, 22], to: [1, 19]  },
        { name: "Aquarius",    symbol: "♒", from: [1, 20],  to: [2, 18]  },
        { name: "Pisces",      symbol: "♓", from: [2, 19],  to: [3, 20]  },
        { name: "Aries",       symbol: "♈", from: [3, 21],  to: [4, 19]  },
        { name: "Taurus",      symbol: "♉", from: [4, 20],  to: [5, 20]  },
        { name: "Gemini",      symbol: "♊", from: [5, 21],  to: [6, 20]  },
        { name: "Cancer",      symbol: "♋", from: [6, 21],  to: [7, 22]  },
        { name: "Leo",         symbol: "♌", from: [7, 23],  to: [8, 22]  },
        { name: "Virgo",       symbol: "♍", from: [8, 23],  to: [9, 22]  },
        { name: "Libra",       symbol: "♎", from: [9, 23],  to: [10, 22] },
        { name: "Scorpio",     symbol: "♏", from: [10, 23], to: [11, 21] },
        { name: "Sagittarius", symbol: "♐", from: [11, 22], to: [12, 21] },
    ];

    /* ---------------- State ---------------- */
    let lastResult = null;
    let birthdayTicker = null;

    /* ============================================================
       HELPERS
       ============================================================ */
    function pad(n) { return n.toString().padStart(2, "0"); }

    function formatDateLong(d) {
        const months = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    function daysInMonth(year, month) {
        // month 0-11
        return new Date(year, month + 1, 0).getDate();
    }

    function toLocalDate(str) {
        // str is "YYYY-MM-DD"
        const [y, m, d] = str.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function todayLocal() {
        const n = new Date();
        return new Date(n.getFullYear(), n.getMonth(), n.getDate());
    }

    function toInputValue(d) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    /* ============================================================
       CORE: AGE CALCULATION
       Returns { years, months, days, ... } based on exact calendar math
       ============================================================ */
    function calculateAgeParts(dob, target) {
        let years = target.getFullYear() - dob.getFullYear();
        let months = target.getMonth() - dob.getMonth();
        let days = target.getDate() - dob.getDate();

        if (days < 0) {
            months--;
            const prevMonth = (target.getMonth() + 11) % 12;
            const prevMonthYear = target.getMonth() === 0
                ? target.getFullYear() - 1
                : target.getFullYear();
            days += daysInMonth(prevMonthYear, prevMonth);
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return { years, months, days };
    }

    function getZodiacSign(dob) {
        const m = dob.getMonth() + 1;
        const d = dob.getDate();
        for (const z of ZODIAC) {
            // Handle wrap-around Capricorn
            if (z.from[0] > z.to[0]) {
                if ((m === z.from[0] && d >= z.from[1]) ||
                    (m === z.to[0]   && d <= z.to[1])) {
                    return z;
                }
            } else {
                if ((m === z.from[0] && d >= z.from[1]) ||
                    (m === z.to[0]   && d <= z.to[1]) ||
                    (m > z.from[0] && m < z.to[0])) {
                    return z;
                }
            }
        }
        return ZODIAC[0];
    }

    function getZodiacDates(z) {
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return `${monthNames[z.from[0] - 1]} ${z.from[1]} - ${monthNames[z.to[0] - 1]} ${z.to[1]}`;
    }

    /* ============================================================
       RENDER RESULT
       ============================================================ */
    function showResult() {
        resultSection.style.display = "block";
        // Smooth scroll
        resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function renderResult(dob, target) {
        const parts = calculateAgeParts(dob, target);

        // ---------- Hero ----------
        ageHeroValue.textContent = parts.years;
        ageHeroUnit.textContent  = parts.years === 1 ? "Year Old" : "Years Old";
        ageHeroSub.textContent   = `Born on ${formatDateLong(dob)}`;

        // ---------- Breakdown ----------
        const diffMs = target.getTime() - dob.getTime();
        const totalDays = Math.floor(diffMs / 86400000);
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = parts.years * 12 + parts.months;
        const totalHours = totalDays * 24;
        const totalMinutes = totalHours * 60;
        const totalSeconds = totalMinutes * 60;
        const heartbeats = Math.floor(totalMinutes * 72); // avg 72 bpm

        bdYears.textContent      = formatNum(parts.years);
        bdMonths.textContent     = formatNum(totalMonths);
        bdWeeks.textContent      = formatNum(totalWeeks);
        bdDays.textContent       = formatNum(totalDays);
        bdHours.textContent      = formatNum(totalHours);
        bdMinutes.textContent    = formatNum(totalMinutes);
        bdSeconds.textContent    = formatNum(totalSeconds);
        bdHeartbeats.textContent = formatNum(heartbeats);

        // ---------- Next Birthday ----------
        updateNextBirthday(dob, target);

        // ---------- Zodiac ----------
        const z = getZodiacSign(dob);
        zodiacIcon.textContent  = z.symbol;
        zodiacName.textContent  = z.name;
        zodiacDates.textContent = getZodiacDates(z);

        // ---------- Fun Facts ----------
        renderFunFacts(dob, target, parts, totalDays, totalMonths);

        // ---------- Save for copy/share/download ----------
        lastResult = {
            dob,
            target,
            parts,
            totalDays,
            totalWeeks,
            totalMonths,
            totalHours,
            totalMinutes,
            totalSeconds,
            heartbeats,
            zodiac: z,
        };
    }

    function formatNum(n) {
        if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
        if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
        if (n >= 1e5) return (n / 1e3).toFixed(1) + "K";
        return n.toLocaleString("en-US");
    }

    /* ============================================================
       NEXT BIRTHDAY COUNTDOWN
       ============================================================ */
    function getNextBirthday(dob, from) {
        const year = from.getFullYear();
        let next = new Date(year, dob.getMonth(), dob.getDate());
        if (next < from) {
            next = new Date(year + 1, dob.getMonth(), dob.getDate());
        }
        return next;
    }

    function updateNextBirthday(dob, target) {
        if (birthdayTicker) {
            clearInterval(birthdayTicker);
            birthdayTicker = null;
        }

        const next = getNextBirthday(dob, target);
        const turningAge = next.getFullYear() - dob.getFullYear();
        nbDate.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Will turn <b>${turningAge}</b> on <b>${formatDateLong(next)}</b>`;

        function tick() {
            const now = target.getTime();
            const nextTime = next.getTime();
            let diff = Math.max(0, nextTime - now);

            const sec = Math.floor(diff / 1000);
            const days = Math.floor(sec / 86400);
            const hours = Math.floor((sec % 86400) / 3600);
            const mins = Math.floor((sec % 3600) / 60);
            const secs = sec % 60;

            nbDays.textContent    = days;
            nbHours.textContent   = pad(hours);
            nbMinutes.textContent = pad(mins);
            nbSeconds.textContent = pad(secs);
        }

        tick();
        // If target is today, live update every second
        const isToday = target.getTime() >= todayLocal().getTime();
        if (isToday && target.getTime() - Date.now() < 2 * 86400000) {
            birthdayTicker = setInterval(tick, 1000);
        }
    }

    /* ============================================================
       FUN FACTS
       ============================================================ */
    function renderFunFacts(dob, target, parts, totalDays, totalMonths) {
        const facts = [
            { icon: "fa-moon",        label: "Total Lunar Cycles",     value: Math.floor(totalDays / 29.53).toLocaleString() },
            { icon: "fa-earth-americas", label: "Earth Orbits Completed", value: parts.years.toLocaleString() },
            { icon: "fa-plane",       label: "Times Around the Sun (km)", value: (parts.years * 940000000).toLocaleString() + " km" },
            { icon: "fa-heart",       label: "Approx. Breaths Taken",    value: Math.floor(totalDays * 24 * 60 * 16).toLocaleString() },
            { icon: "fa-bed",         label: "Approx. Sleep (days)",     value: Math.floor(totalDays / 3).toLocaleString() },
            { icon: "fa-utensils",    label: "Approx. Meals Eaten",      value: Math.floor(totalDays * 3).toLocaleString() },
            { icon: "fa-droplet",     label: "Approx. Water (liters)",   value: Math.floor(totalDays * 2).toLocaleString() },
        ];

        ffList.innerHTML = facts.map(f => `
            <div class="ff-item">
                <span class="ff-item-label"><i class="fa-solid ${f.icon}"></i> ${f.label}</span>
                <span class="ff-item-value">${f.value}</span>
            </div>
        `).join("");
    }

    /* ============================================================
       VALIDATION
       ============================================================ */
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add("show");
        // remove animation reset
        errorMsg.style.animation = "none";
        void errorMsg.offsetWidth;
        errorMsg.style.animation = "";
    }

    function hideError() {
        errorMsg.classList.remove("show");
        errorMsg.textContent = "";
    }

    /* ============================================================
       MAIN CALCULATE
       ============================================================ */
    function calculate() {
        hideError();

        const dobVal    = dobInput.value;
        const targetVal = targetInput.value;

        if (!dobVal) {
            showError("⚠️ Please enter your Date of Birth.");
            dobInput.focus();
            return;
        }
        if (!targetVal) {
            showError("⚠️ Please enter a target date.");
            targetInput.focus();
            return;
        }

        const dob = toLocalDate(dobVal);
        const target = toLocalDate(targetVal);

        if (isNaN(dob.getTime()) || isNaN(target.getTime())) {
            showError("❌ Invalid date format.");
            return;
        }

        if (dob > target) {
            showError("⚠️ Date of Birth cannot be after the target date.");
            return;
        }

        renderResult(dob, target);
        showResult();

        if (typeof showToast === "function") {
            showToast("✅ Age calculated successfully");
        }
    }

    function resetAll() {
        dobInput.value = "";
        targetInput.value = toInputValue(todayLocal());
        hideError();
        resultSection.style.display = "none";
        if (birthdayTicker) {
            clearInterval(birthdayTicker);
            birthdayTicker = null;
        }
        lastResult = null;
        if (typeof showToast === "function") {
            showToast("🔄 Reset");
        }
    }

    /* ============================================================
       COPY / SHARE / DOWNLOAD
       ============================================================ */
    function buildTextResult() {
        if (!lastResult) return "";
        const r = lastResult;
        const lines = [
            "═══ AGE CALCULATOR RESULT ═══",
            "",
            `Date of Birth : ${formatDateLong(r.dob)}`,
            `Calculate On  : ${formatDateLong(r.target)}`,
            "",
            `── YOUR AGE ──`,
            `${r.parts.years} Years, ${r.parts.months} Months, ${r.parts.days} Days`,
            "",
            "── BREAKDOWN ──",
            `Years     : ${r.parts.years.toLocaleString()}`,
            `Months    : ${r.totalMonths.toLocaleString()}`,
            `Weeks     : ${r.totalWeeks.toLocaleString()}`,
            `Days      : ${r.totalDays.toLocaleString()}`,
            `Hours     : ${r.totalHours.toLocaleString()}`,
            `Minutes   : ${r.totalMinutes.toLocaleString()}`,
            `Seconds   : ${r.totalSeconds.toLocaleString()}`,
            `Heartbeats: ${r.heartbeats.toLocaleString()}`,
            "",
            "── ZODIAC ──",
            `${r.zodiac.symbol}  ${r.zodiac.name}`,
            "",
            "Generated with Tool Hub ❤️",
        ];
        return lines.join("\n");
    }

    copyResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = buildTextResult();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (typeof showToast === "function") showToast("📋 Result copied!");
            }).catch(() => {
                fallbackCopy(text);
            });
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
            if (typeof showToast === "function") showToast("📋 Result copied!");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Copy failed");
        }
        document.body.removeChild(ta);
    }

    shareResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = buildTextResult();
        const shareData = {
            title: "Age Calculator Result",
            text,
            url: window.location.href,
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text + "\n" + window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Copied to clipboard!");
            }).catch(() => {
                if (typeof showToast === "function") showToast("❌ Share failed");
            });
        }
    });

    downloadResultBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const text = buildTextResult();
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `age-result-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === "function") showToast("📥 Downloaded!");
    });

    /* ============================================================
       EVENTS
       ============================================================ */
    calculateBtn.addEventListener("click", calculate);

    resetAgeBtn.addEventListener("click", resetAll);

    todayBtn.addEventListener("click", () => {
        targetInput.value = toInputValue(todayLocal());
        hideError();
    });

    dobInput.addEventListener("input", hideError);
    targetInput.addEventListener("input", hideError);

    // Auto calculate when both dates filled and valid
    [dobInput, targetInput].forEach((el) => {
        el.addEventListener("change", () => {
            if (dobInput.value && targetInput.value && !errorMsg.classList.contains("show")) {
                // Small delay to avoid janky UX
                clearTimeout(el._t);
                el._t = setTimeout(() => {
                    const dob = toLocalDate(dobInput.value);
                    const target = toLocalDate(targetInput.value);
                    if (!isNaN(dob) && !isNaN(target) && dob <= target) {
                        calculate();
                    }
                }, 400);
            }
        });
    });

    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
            if (e.key === "Enter" && (e.target === dobInput || e.target === targetInput)) {
                e.preventDefault();
                calculate();
            }
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            calculate();
        } else if (e.key === "Escape") {
            e.preventDefault();
            resetAll();
        }
    });

    /* ============================================================
       SHARE (page-level from title bar)
       ============================================================ */
    window.shareAge = function () {
        const shareData = {
            title: "Age Calculator - Tool Hub",
            text: "Calculate your exact age in years, months, days & more!",
            url: window.location.href,
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Link copied!");
            }).catch(() => {
                if (typeof showToast === "function") showToast("❌ Could not copy!");
            });
        }
    };

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        // Set max DOB to today, set default target to today
        const today = todayLocal();
        dobInput.max = toInputValue(today);
        targetInput.value = toInputValue(today);
        targetInput.max = ""; // no restriction on future (for future age calc)

        hideError();
    }

    init();
})();