/* ============================================================
   POMODORO TIMER - Advanced Logic
   Works with Tool Hub
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const card          = document.getElementById("pomoCard");
    const displayTime   = document.getElementById("displayTime");
    const statusLabel   = document.getElementById("statusLabel");
    const sessionInfo   = document.getElementById("sessionInfo");
    const startPauseBtn = document.getElementById("startPauseBtn");
    const resetBtn      = document.getElementById("resetBtn");
    const skipBtn       = document.getElementById("skipBtn");
    const ringProgress  = document.getElementById("ringProgress");
    const modeTabs      = document.querySelectorAll(".mode-tab");

    const completedCountEl = document.getElementById("completedCount");
    const totalFocusEl     = document.getElementById("totalFocus");
    const cycleCountEl     = document.getElementById("cycleCount");

    const settingsToggle   = document.getElementById("settingsToggle");
    const settingsPanel    = document.getElementById("settingsPanel");
    const saveSettingsBtn  = document.getElementById("saveSettings");
    const focusInput       = document.getElementById("focusInput");
    const shortInput       = document.getElementById("shortInput");
    const longInput        = document.getElementById("longInput");
    const cycleInput       = document.getElementById("cycleInput");
    const soundToggle      = document.getElementById("soundToggle");

    const historyList      = document.getElementById("historyList");
    const clearHistoryBtn  = document.getElementById("clearHistoryBtn");

    /* ---------------- Constants ---------------- */
    const RING_CIRCUMFERENCE = 2 * Math.PI * 118;

    const DEFAULT_SETTINGS = {
        focus: 25,
        short: 5,
        long: 15,
        cycle: 4,
        sound: true,
    };

    const MODE_META = {
        focus: { label: "FOCUS TIME",  icon: "fa-brain",   status: "READY TO FOCUS" },
        short: { label: "SHORT BREAK", icon: "fa-mug-hot", status: "SHORT BREAK" },
        long:  { label: "LONG BREAK",  icon: "fa-couch",   status: "LONG BREAK" },
    };

    /* ---------------- State ---------------- */
    let settings = loadSettings();

    let currentMode        = "focus";
    let isRunning          = false;
    let totalMs            = settings.focus * 60 * 1000;
    let remainingMs        = totalMs;
    let endTimestamp       = 0;      // performance.now() + remainingMs when running
    let rafId              = null;
    let lastRenderMs       = 0;

    let completedSessions  = 0;   // total focus sessions completed today
    let cycleCount         = 0;   // how many focus sessions in current cycle
    let totalFocusMs       = 0;   // total focus time (ms) accumulated

    let history            = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadSettings() {
        try {
            const raw = localStorage.getItem("toolhub_pomodoro_settings");
            if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        } catch (e) {}
        return { ...DEFAULT_SETTINGS };
    }

    function saveSettingsToStorage() {
        localStorage.setItem("toolhub_pomodoro_settings", JSON.stringify(settings));
    }

    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_pomodoro_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }

    function saveHistory() {
        localStorage.setItem("toolhub_pomodoro_history", JSON.stringify(history));
    }

    /* ============================================================
       FORMATTING
       ============================================================ */
    function pad(n) { return n.toString().padStart(2, "0"); }

    function formatMMSS(ms) {
        if (ms < 0) ms = 0;
        const totalSec = Math.ceil(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${pad(m)}:${pad(s)}`;
    }

    function formatDuration(ms) {
        const totalMin = Math.round(ms / 60000);
        if (totalMin < 60) return `${totalMin}m`;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }

    /* ============================================================
       RENDER
       ============================================================ */
    function renderTime() {
        displayTime.textContent = formatMMSS(remainingMs);
    }

    function renderRing() {
        const progress = totalMs > 0 ? remainingMs / totalMs : 0;
        const offset = RING_CIRCUMFERENCE * (1 - progress);
        ringProgress.style.strokeDashoffset = offset;
    }

    function renderMode() {
        card.classList.remove("mode-focus", "mode-short", "mode-long");
        card.classList.add("mode-" + currentMode);

        modeTabs.forEach((tab) => {
            tab.classList.toggle("active", tab.dataset.mode === currentMode);
        });

        statusLabel.textContent = isRunning
            ? MODE_META[currentMode].label
            : (remainingMs < totalMs ? "PAUSED" : MODE_META[currentMode].status);
    }

    function renderSessionInfo() {
        if (currentMode === "focus") {
            sessionInfo.textContent = `Session ${cycleCount + 1} of ${settings.cycle}`;
        } else {
            sessionInfo.textContent = currentMode === "short"
                ? "Take a short breather"
                : "Enjoy a longer rest";
        }
    }

    function renderButtons() {
        if (isRunning) {
            startPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
            startPauseBtn.classList.add("pause-state");
        } else {
            const label = remainingMs < totalMs ? "Resume" : "Start";
            const icon = remainingMs < totalMs
                ? '<i class="fa-solid fa-play"></i>'
                : '<i class="fa-solid fa-play"></i>';
            startPauseBtn.innerHTML = `${icon} <span>${label}</span>`;
            startPauseBtn.classList.remove("pause-state");
        }
    }

    function renderStats() {
        completedCountEl.textContent = completedSessions;
        totalFocusEl.textContent     = formatDuration(totalFocusMs);
        cycleCountEl.textContent     = Math.min(cycleCount, settings.cycle);
    }

    function renderLowTime() {
        card.classList.toggle("low-time", remainingMs <= 10000 && isRunning);
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No sessions yet — start your first focus!</div>';
            return;
        }
        historyList.innerHTML = history
            .slice(0, 20)
            .map((h) => {
                const iconClass = h.mode === "focus" ? "fa-brain"
                    : h.mode === "short" ? "fa-mug-hot"
                    : "fa-couch";
                const title = h.mode === "focus" ? "Focus Session"
                    : h.mode === "short" ? "Short Break"
                    : "Long Break";
                return `
                    <div class="history-item ${h.mode}">
                        <div class="h-icon"><i class="fa-solid ${iconClass}"></i></div>
                        <div class="h-info">
                            <span class="h-title">${title}</span>
                            <span class="h-meta">${h.time}</span>
                        </div>
                        <span class="h-duration">${h.duration}</span>
                    </div>
                `;
            })
            .join("");
    }

    function renderAll() {
        renderTime();
        renderRing();
        renderMode();
        renderSessionInfo();
        renderButtons();
        renderStats();
        renderLowTime();
    }

    /* ============================================================
       MODE / DURATION LOGIC
       ============================================================ */
    function getDurationMs(mode) {
        switch (mode) {
            case "focus": return settings.focus * 60 * 1000;
            case "short": return settings.short * 60 * 1000;
            case "long":  return settings.long * 60 * 1000;
        }
        return 25 * 60 * 1000;
    }

    function setMode(mode, { autoStart = false } = {}) {
        stopLoop();
        isRunning = false;
        currentMode = mode;
        totalMs = getDurationMs(mode);
        remainingMs = totalMs;
        renderAll();

        if (autoStart) start();
    }

    function advanceToNextMode() {
        // Log the current session (only focus or breaks that were completed)
        logSession(currentMode);

        if (currentMode === "focus") {
            completedSessions++;
            totalFocusMs += totalMs;
            cycleCount++;

            // Long break after N focus sessions, else short break
            if (cycleCount >= settings.cycle) {
                cycleCount = 0;
                setMode("long", { autoStart: false });
            } else {
                setMode("short", { autoStart: false });
            }
        } else {
            // Break finished → back to focus
            setMode("focus", { autoStart: false });
        }
        renderStats();
    }

    function logSession(mode) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        history.unshift({
            mode,
            time: timeStr,
            duration: formatDuration(getDurationMs(mode)),
            timestamp: now.getTime(),
        });
        if (history.length > 50) history.pop();
        saveHistory();
        renderHistory();
    }

    /* ============================================================
       ANIMATION LOOP
       ============================================================ */
    function tick() {
        if (!isRunning) return;

        remainingMs = Math.max(0, endTimestamp - performance.now());
        renderTime();
        renderRing();
        renderLowTime();

        // Persist exact time for refresh safety
        if (performance.now() - lastRenderMs > 900) {
            lastRenderMs = performance.now();
        }

        if (remainingMs <= 0) {
            finishSession();
            return;
        }

        rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);
    }

    function stopLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    /* ============================================================
       ACTIONS
       ============================================================ */
    function start() {
        if (isRunning) return;
        if (remainingMs <= 0) remainingMs = totalMs;
        endTimestamp = performance.now() + remainingMs;
        isRunning = true;
        renderAll();
        startLoop();
    }

    function pause() {
        if (!isRunning) return;
        remainingMs = Math.max(0, endTimestamp - performance.now());
        isRunning = false;
        stopLoop();
        renderAll();
    }

    function toggleStartPause() {
        if (isRunning) pause();
        else start();
    }

    function reset() {
        stopLoop();
        isRunning = false;
        totalMs = getDurationMs(currentMode);
        remainingMs = totalMs;
        renderAll();
        if (typeof showToast === "function") {
            showToast("🔄 Timer reset");
        }
    }

    function skip() {
        stopLoop();
        isRunning = false;
        // Only count as "completed" if more than 60% done
        const pctDone = totalMs > 0 ? (1 - remainingMs / totalMs) : 0;
        if (pctDone >= 0.6) {
            logSession(currentMode);
            if (currentMode === "focus") {
                completedSessions++;
                totalFocusMs += (totalMs - remainingMs);
                cycleCount++;
                if (cycleCount >= settings.cycle) {
                    cycleCount = 0;
                    setMode("long");
                } else {
                    setMode("short");
                }
            } else {
                setMode("focus");
            }
        } else {
            // Skip without logging
            if (currentMode === "focus") setMode("short");
            else setMode("focus");
        }
        renderStats();
        if (typeof showToast === "function") showToast("⏭️ Skipped");
    }

    function finishSession() {
        stopLoop();
        isRunning = false;
        remainingMs = 0;
        renderTime();
        renderRing();

        // Log
        logSession(currentMode);

        // Advance automatically
        if (currentMode === "focus") {
            completedSessions++;
            totalFocusMs += totalMs;
            cycleCount++;

            playNotification("focus");

            if (typeof showToast === "function") {
                showToast("✅ Focus complete! Time for a break.");
            }

            if (cycleCount >= settings.cycle) {
                cycleCount = 0;
                setTimeout(() => setMode("long", { autoStart: true }), 800);
            } else {
                setTimeout(() => setMode("short", { autoStart: true }), 800);
            }
        } else {
            playNotification("break");

            if (typeof showToast === "function") {
                showToast("⏰ Break over! Let's focus again.");
            }
            setTimeout(() => setMode("focus", { autoStart: true }), 800);
        }
        renderStats();
    }

    /* ============================================================
       NOTIFICATION SOUND (Web Audio API - no asset needed)
       ============================================================ */
    let audioCtx = null;

    function playNotification(type) {
        if (!settings.sound) return;
        try {
            if (!audioCtx) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (!Ctx) return;
                audioCtx = new Ctx();
            }
            if (audioCtx.state === "suspended") audioCtx.resume();

            // Different tunes per type
            const notes = type === "focus"
                ? [880, 1100, 1320]
                : [660, 550, 440];

            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = "sine";
                osc.frequency.value = freq;

                const t = audioCtx.currentTime + i * 0.15;
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

                osc.start(t);
                osc.stop(t + 0.35);
            });
        } catch (e) {
            // Silent fail
        }
    }

    /* ============================================================
       EVENT LISTENERS
       ============================================================ */
    startPauseBtn.addEventListener("click", toggleStartPause);
    resetBtn.addEventListener("click", reset);
    skipBtn.addEventListener("click", skip);

    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            if (isRunning && !confirm("Timer is running. Switch mode anyway?")) return;
            setMode(tab.dataset.mode);
        });
    });

    settingsToggle.addEventListener("click", () => {
        settingsPanel.classList.toggle("open");
    });

    saveSettingsBtn.addEventListener("click", () => {
        const f = clamp(parseInt(focusInput.value, 10) || 25, 1, 90);
        const s = clamp(parseInt(shortInput.value, 10) || 5, 1, 30);
        const l = clamp(parseInt(longInput.value, 10) || 15, 1, 60);
        const c = clamp(parseInt(cycleInput.value, 10) || 4, 2, 10);

        settings.focus = f;
        settings.short = s;
        settings.long = l;
        settings.cycle = c;
        settings.sound = soundToggle.checked;

        saveSettingsToStorage();

        // Reset to current mode duration if not running
        if (!isRunning) {
            totalMs = getDurationMs(currentMode);
            remainingMs = totalMs;
            renderAll();
        }
        renderStats();

        if (typeof showToast === "function") showToast("✅ Settings saved");
        settingsPanel.classList.remove("open");
    });

    clearHistoryBtn.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all session history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;

        if (e.code === "Space") {
            e.preventDefault();
            toggleStartPause();
        } else if (e.code === "KeyR") {
            e.preventDefault();
            reset();
        } else if (e.code === "KeyS") {
            e.preventDefault();
            skip();
        }
    });

    /* Prevent context menu on long-press */
    [startPauseBtn, resetBtn, skipBtn].forEach((b) =>
        b.addEventListener("contextmenu", (e) => e.preventDefault())
    );

    /* Tab visibility safety */
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && isRunning && !rafId) {
            remainingMs = Math.max(0, endTimestamp - performance.now());
            startLoop();
        }
    });

    /* Save state before unload (so pause is accurate) */
    window.addEventListener("beforeunload", () => {
        if (isRunning) {
            remainingMs = Math.max(0, endTimestamp - performance.now());
        }
    });

    /* ============================================================
       SHARE
       ============================================================ */
    window.sharePomodoro = function () {
        const shareData = {
            title: "Pomodoro Timer - Tool Hub",
            text: "Boost your productivity with this free Pomodoro Timer!",
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
       HELPERS
       ============================================================ */
    function clamp(n, min, max) {
        return Math.min(Math.max(n, min), max);
    }

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        // Set ring dash
        ringProgress.style.strokeDasharray = RING_CIRCUMFERENCE;
        ringProgress.style.strokeDashoffset = 0;

        // Fill settings inputs
        focusInput.value = settings.focus;
        shortInput.value = settings.short;
        longInput.value = settings.long;
        cycleInput.value = settings.cycle;
        soundToggle.checked = settings.sound;

        // Restore mode default
        currentMode = "focus";
        totalMs = getDurationMs("focus");
        remainingMs = totalMs;

        renderHistory();
        renderAll();

        // Refresh low-time render every second even when not running (visual stability)
        setInterval(() => {
            if (!isRunning) renderLowTime();
        }, 1000);
    }

    init();
})();