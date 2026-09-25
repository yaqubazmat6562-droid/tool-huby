/* ============================================================
   STOPWATCH TOOL - Standalone Script
   Works with Tool Hub (theme, toast, share, etc.)
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const card          = document.getElementById("stopwatchCard");
    const displayTime   = document.getElementById("displayTime");
    const statusLabel   = document.getElementById("statusLabel");
    const startPauseBtn = document.getElementById("startPauseBtn");
    const lapBtn        = document.getElementById("lapBtn");
    const resetBtn      = document.getElementById("resetBtn");
    const lapsList      = document.getElementById("lapsList");
    const ringProgress  = document.getElementById("ringProgress");
    const lapCountEl    = document.getElementById("lapCount");
    const bestLapEl     = document.getElementById("bestLap");
    const worstLapEl    = document.getElementById("worstLap");

    /* ---------------- Constants ---------------- */
    const RING_CIRCUMFERENCE = 2 * Math.PI * 118;
    const RING_CYCLE_MS      = 60000;

    /* ---------------- State ---------------- */
    let isRunning      = false;
    let startTimestamp = 0;
    let accumulatedMs  = 0;
    let rafId          = null;

    let lapCount       = 0;
    let lapSplits      = [];
    let lastLapTotalMs = 0;

    /* ============================================================
       TIME FORMATTING
       ============================================================ */
    function pad(n) {
        return n.toString().padStart(2, "0");
    }

    function formatTime(ms) {
        if (ms < 0) ms = 0;
        const totalSec = Math.floor(ms / 1000);
        const h  = Math.floor(totalSec / 3600);
        const m  = Math.floor((totalSec % 3600) / 60);
        const s  = totalSec % 60;
        const cs = Math.floor((ms % 1000) / 10);

        let main;
        if (h > 0) {
            main = `${pad(h)}:${pad(m)}:${pad(s)}`;
        } else {
            main = `${pad(m)}:${pad(s)}`;
        }
        return { main, cs: pad(cs) };
    }

    function formatInline(ms) {
        const f = formatTime(ms);
        return `${f.main}.${f.cs}`;
    }

    /* ============================================================
       RENDER
       ============================================================ */
    function renderTime(ms) {
        const f = formatTime(ms);
        displayTime.innerHTML = `${f.main}<span class="milli">.${f.cs}</span>`;
    }

    function renderRing(ms) {
        const progress = (ms % RING_CYCLE_MS) / RING_CYCLE_MS;
        const offset = RING_CIRCUMFERENCE * (1 - progress);
        ringProgress.style.strokeDashoffset = offset;
    }

    function renderStatus() {
        if (isRunning) {
            statusLabel.textContent = "RUNNING";
        } else if (accumulatedMs > 0) {
            statusLabel.textContent = "PAUSED";
        } else {
            statusLabel.textContent = "READY";
        }
    }

    function renderButtons() {
        if (isRunning) {
            startPauseBtn.textContent = "Pause";
            startPauseBtn.classList.add("pause-state");
            lapBtn.disabled = false;
            resetBtn.disabled = false;
        } else {
            startPauseBtn.textContent = accumulatedMs > 0 ? "Resume" : "Start";
            startPauseBtn.classList.remove("pause-state");
            lapBtn.disabled = true;
            resetBtn.disabled = accumulatedMs === 0 && lapCount === 0;
        }
    }

    function renderStateClass() {
        card.classList.remove("running", "paused");
        if (isRunning) {
            card.classList.add("running");
        } else if (accumulatedMs > 0) {
            card.classList.add("paused");
        }
    }

    /* ============================================================
       TIME COMPUTE
       ============================================================ */
    function currentElapsed() {
        if (isRunning) {
            return accumulatedMs + (performance.now() - startTimestamp);
        }
        return accumulatedMs;
    }

    /* ============================================================
       ANIMATION LOOP
       ============================================================ */
    function tick() {
        if (!isRunning) return;
        const elapsed = currentElapsed();
        renderTime(elapsed);
        renderRing(elapsed);
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
        startTimestamp = performance.now();
        isRunning = true;
        startLoop();
        renderButtons();
        renderStatus();
        renderStateClass();
    }

    function pause() {
        if (!isRunning) return;
        accumulatedMs += performance.now() - startTimestamp;
        isRunning = false;
        stopLoop();
        renderTime(accumulatedMs);
        renderRing(accumulatedMs);
        renderButtons();
        renderStatus();
        renderStateClass();
    }

    function reset() {
        isRunning = false;
        stopLoop();

        accumulatedMs  = 0;
        startTimestamp = 0;
        lapCount       = 0;
        lapSplits      = [];
        lastLapTotalMs = 0;

        renderTime(0);
        renderRing(0);
        renderButtons();
        renderStatus();
        renderStateClass();

        lapCountEl.textContent = "0";
        bestLapEl.textContent  = "--:--.--";
        worstLapEl.textContent = "--:--.--";

        lapsList.innerHTML = '<div class="empty-lap">No laps recorded yet</div>';

        if (typeof showToast === "function") {
            showToast("🔄 Stopwatch reset");
        }
    }

    function recordLap() {
        if (!isRunning) return;

        const totalMs = currentElapsed();
        const splitMs = totalMs - lastLapTotalMs;
        lastLapTotalMs = totalMs;
        lapCount++;
        lapSplits.push(splitMs);

        const empty = lapsList.querySelector(".empty-lap");
        if (empty) empty.remove();

        const row = document.createElement("div");
        row.className = "lap-item";
        row.innerHTML = `
            <span>#${lapCount}</span>
            <span>${formatInline(splitMs)}</span>
            <span>${formatInline(totalMs)}</span>
        `;
        lapsList.prepend(row);
        lapsList.scrollTop = 0;

        lapCountEl.textContent = lapCount;
        updateBestWorst();
    }

    function updateBestWorst() {
        if (lapSplits.length === 0) {
            bestLapEl.textContent  = "--:--.--";
            worstLapEl.textContent = "--:--.--";
            return;
        }
        const best  = Math.min(...lapSplits);
        const worst = Math.max(...lapSplits);

        bestLapEl.textContent  = formatInline(best);
        worstLapEl.textContent = formatInline(worst);

        lapsList.querySelectorAll(".lap-item").forEach((r) => {
            r.classList.remove("best", "worst");
            const splitText = r.children[1].textContent;
            if (splitText === formatInline(best))  r.classList.add("best");
            if (splitText === formatInline(worst) && best !== worst) r.classList.add("worst");
        });
    }

    /* ============================================================
       EVENTS
       ============================================================ */
    startPauseBtn.addEventListener("click", () => {
        if (isRunning) pause();
        else start();
    });

    lapBtn.addEventListener("click", () => {
        if (isRunning) recordLap();
    });

    resetBtn.addEventListener("click", reset);

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;

        if (e.code === "Space") {
            e.preventDefault();
            if (isRunning) pause();
            else start();
        } else if (e.code === "KeyL") {
            e.preventDefault();
            if (isRunning) recordLap();
        } else if (e.code === "KeyR") {
            e.preventDefault();
            reset();
        }
    });

    /* Prevent long-press context menu on mobile */
    [startPauseBtn, lapBtn, resetBtn].forEach((b) =>
        b.addEventListener("contextmenu", (e) => e.preventDefault())
    );

    /* Tab visibility safety */
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && isRunning && !rafId) {
            startLoop();
        }
    });

    /* ============================================================
       SHARE
       ============================================================ */
    window.shareStopwatch = function () {
        const shareData = {
            title: "Stopwatch - Tool Hub",
            text: "Check out this free online Stopwatch with lap tracking!",
            url: window.location.href,
        };

        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Link copied!");
            }).catch(() => {
                if (typeof showToast === "function") showToast("❌ Could not copy!", "error");
            });
        } else {
            if (typeof showToast === "function") showToast("🔗 " + window.location.href);
        }
    };

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
        ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;
        reset();
        renderButtons();
        renderStatus();
        renderStateClass();
    }

    init();
})();