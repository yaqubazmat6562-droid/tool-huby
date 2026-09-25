/* ============================================================
   COUNTDOWN TIMER - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentMode = 'duration';
let targetTime = null;      // Target end time (Date object)
let timerInterval = null;   // setInterval ID
let isRunning = false;
let isPaused = false;
let pausedRemaining = 0;    // Remaining ms when paused
let totalDuration = 0;      // Total ms (for progress ring)
let savedTimers = JSON.parse(localStorage.getItem('toolhub_countdown_saved')) || [];
let alarmAudio = null;

// ============ DOM ELEMENTS ============
const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMinutes = document.getElementById('cd-minutes');
const cdSeconds = document.getElementById('cd-seconds');
const cdDaysWrap = document.getElementById('cd-days-wrap');
const countdownPanel = document.getElementById('countdown-panel');
const countdownLabel = document.getElementById('countdown-label');
const progressRingFill = document.getElementById('progress-ring-fill');
const progressPercent = document.getElementById('progress-percent');
const targetInfo = document.getElementById('target-info');
const targetInfoText = document.getElementById('target-info-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const savedPanel = document.getElementById('saved-panel');
const savedList = document.getElementById('saved-list');

// ============ MODE SWITCH ============
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    document.getElementById('mode-duration').style.display = mode === 'duration' ? 'block' : 'none';
    document.getElementById('mode-datetime').style.display = mode === 'datetime' ? 'block' : 'none';
    
    // Reset timer when switching mode
    if (isRunning) resetTimer();
}

// ============ STEP VALUE ============
function stepValue(id, delta, min, max) {
    const el = document.getElementById(id);
    let val = parseInt(el.value) || 0;
    val = Math.max(min, Math.min(max, val + delta));
    el.value = val;
    updateTimerPreview();
}

// ============ UPDATE TIMER PREVIEW ============
function updateTimerPreview() {
    if (isRunning) return;
    
    if (currentMode === 'duration') {
        const h = parseInt(document.getElementById('dur-hours').value) || 0;
        const m = parseInt(document.getElementById('dur-minutes').value) || 0;
        const s = parseInt(document.getElementById('dur-seconds').value) || 0;
        
        cdDays.innerText = '00';
        cdHours.innerText = String(h).padStart(2, '0');
        cdMinutes.innerText = String(m).padStart(2, '0');
        cdSeconds.innerText = String(s).padStart(2, '0');
        
        cdDaysWrap.style.display = 'none';
        document.querySelectorAll('.countdown-sep')[0].style.display = 'none';
        
        progressRingFill.style.strokeDashoffset = '0';
        progressPercent.innerText = '100%';
    } else {
        // Datetime mode
        const dateVal = document.getElementById('target-date').value;
        const timeVal = document.getElementById('target-time').value || '00:00';
        
        if (dateVal) {
            const target = new Date(`${dateVal}T${timeVal}`);
            const now = new Date();
            const diff = target - now;
            
            if (diff > 0) {
                const { days, hours, minutes, seconds } = msToTime(diff);
                cdDays.innerText = String(days).padStart(2, '0');
                cdHours.innerText = String(hours).padStart(2, '0');
                cdMinutes.innerText = String(minutes).padStart(2, '0');
                cdSeconds.innerText = String(seconds).padStart(2, '0');
                
                cdDaysWrap.style.display = 'flex';
                document.querySelectorAll('.countdown-sep')[0].style.display = 'block';
            }
        }
    }
}

// ============ MS TO TIME COMPONENTS ============
function msToTime(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return { days, hours, minutes, seconds };
}

// ============ START TIMER ============
function startTimer() {
    // Determine target time
    let durationMs = 0;
    
    if (currentMode === 'duration') {
        const h = parseInt(document.getElementById('dur-hours').value) || 0;
        const m = parseInt(document.getElementById('dur-minutes').value) || 0;
        const s = parseInt(document.getElementById('dur-seconds').value) || 0;
        
        durationMs = (h * 3600 + m * 60 + s) * 1000;
        
        if (durationMs <= 0) {
            return showToast('❌ Please set a duration!', 'error');
        }
        
        targetTime = new Date(Date.now() + durationMs);
    } else {
        const dateVal = document.getElementById('target-date').value;
        const timeVal = document.getElementById('target-time').value || '00:00';
        
        if (!dateVal) {
            return showToast('❌ Please select a target date!', 'error');
        }
        
        targetTime = new Date(`${dateVal}T${timeVal}`);
        
        if (targetTime <= new Date()) {
            return showToast('❌ Target time must be in the future!', 'error');
        }
        
        durationMs = targetTime - new Date();
    }
    
    totalDuration = durationMs;
    isRunning = true;
    isPaused = false;
    pausedRemaining = 0;
    
    // Update UI
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-flex';
    resetBtn.style.display = 'inline-flex';
    
    countdownPanel.classList.add('running');
    countdownPanel.classList.remove('finished');
    
    // Timer label
    const label = document.getElementById('timer-label').value.trim();
    if (label) {
        countdownLabel.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> ${escapeHtml(label)}`;
    } else {
        countdownLabel.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> Countdown`;
    }
    
    // Target info
    targetInfo.style.display = 'inline-flex';
    targetInfoText.innerText = `Ends: ${formatTargetTime(targetTime)}`;
    
    // Days visibility (only if > 24h)
    if (durationMs >= 86400000) {
        cdDaysWrap.style.display = 'flex';
        document.querySelectorAll('.countdown-sep')[0].style.display = 'block';
    } else {
        cdDaysWrap.style.display = 'none';
        document.querySelectorAll('.countdown-sep')[0].style.display = 'none';
    }
    
    // Start ticking
    tick();
    timerInterval = setInterval(tick, 1000);
    
    showToast('▶️ Countdown started!');
}

// ============ TICK ============
function tick() {
    if (!isRunning || isPaused) return;
    
    const now = Date.now();
    const remaining = targetTime - now;
    
    if (remaining <= 0) {
        // Timer finished
        finishTimer();
        return;
    }
    
    const { days, hours, minutes, seconds } = msToTime(remaining);
    
    cdDays.innerText = String(days).padStart(2, '0');
    cdHours.innerText = String(hours).padStart(2, '0');
    cdMinutes.innerText = String(minutes).padStart(2, '0');
    cdSeconds.innerText = String(seconds).padStart(2, '0');
    
    // Update progress ring
    const progress = remaining / totalDuration;
    const circumference = 2 * Math.PI * 52; // r = 52
    const offset = circumference * (1 - progress);
    progressRingFill.style.strokeDashoffset = offset;
    progressRingFill.style.strokeDasharray = circumference;
    
    progressPercent.innerText = Math.round(progress * 100) + '%';
}

// ============ FINISH TIMER ============
function finishTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    isPaused = false;
    
    cdDays.innerText = '00';
    cdHours.innerText = '00';
    cdMinutes.innerText = '00';
    cdSeconds.innerText = '00';
    
    progressRingFill.style.strokeDashoffset = 0;
    progressPercent.innerText = '0%';
    
    countdownPanel.classList.remove('running');
    countdownPanel.classList.add('finished');
    countdownLabel.innerHTML = `<i class="fa-solid fa-check"></i> Time's Up!`;
    
    startBtn.style.display = 'inline-flex';
    pauseBtn.style.display = 'none';
    resetBtn.style.display = 'inline-flex';
    
    // Play alarm
    playAlarm();
    
    // Browser notification
    showNotification();
    
    showToast('🔔 Time is up!');
}

// ============ PAUSE / RESUME ============
function togglePause() {
    if (!isRunning) return;
    
    if (!isPaused) {
        // Pause
        isPaused = true;
        pausedRemaining = targetTime - Date.now();
        clearInterval(timerInterval);
        timerInterval = null;
        
        pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
        countdownPanel.classList.remove('running');
        countdownLabel.innerHTML = '<i class="fa-solid fa-pause"></i> Paused';
        showToast('⏸️ Paused');
    } else {
        // Resume
        isPaused = false;
        targetTime = new Date(Date.now() + pausedRemaining);
        timerInterval = setInterval(tick, 1000);
        
        pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        countdownPanel.classList.add('running');
        
        const label = document.getElementById('timer-label').value.trim();
        if (label) {
            countdownLabel.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> ${escapeHtml(label)}`;
        } else {
            countdownLabel.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Countdown';
        }
        showToast('▶️ Resumed');
    }
}

// ============ RESET TIMER ============
function resetTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    isPaused = false;
    targetTime = null;
    
    countdownPanel.classList.remove('running', 'finished');
    countdownLabel.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Countdown';
    
    startBtn.style.display = 'inline-flex';
    pauseBtn.style.display = 'none';
    pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    resetBtn.style.display = 'none';
    
    targetInfo.style.display = 'none';
    
    cdDays.innerText = '00';
    cdHours.innerText = '00';
    cdMinutes.innerText = '00';
    cdSeconds.innerText = '00';
    
    progressRingFill.style.strokeDashoffset = 0;
    progressPercent.innerText = '100%';
    
    cdDaysWrap.style.display = 'none';
    document.querySelectorAll('.countdown-sep')[0].style.display = 'none';
    
    updateTimerPreview();
    showToast('🔄 Timer reset');
}

// ============ FORMAT TARGET TIME ============
function formatTargetTime(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============ ALARM SOUND (Web Audio API) ============
function playAlarm() {
    try {
        // Create an AudioContext
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Play a beeping sound
        const playBeep = (startTime, freq, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gain.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.05);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        const now = ctx.currentTime;
        
        // Play 6 beeps
        for (let i = 0; i < 6; i++) {
            playBeep(now + i * 0.25, i % 2 === 0 ? 880 : 660, 0.2);
        }
    } catch (e) {
        console.warn('Audio not supported:', e);
    }
}

// ============ BROWSER NOTIFICATION ============
function showNotification() {
    if (!('Notification' in window)) return;
    
    const show = () => {
        new Notification('⏰ Countdown Finished!', {
            body: 'Your countdown timer has ended.',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">⏰</text></svg>',
            tag: 'countdown-finished'
        });
    };
    
    if (Notification.permission === 'granted') {
        show();
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') show();
        });
    }
}

// ============ PRESETS ============
function applyPreset(type) {
    // Reset if running
    if (isRunning) resetTimer();
    
    switch (type) {
        case '1min':
            setMode('duration');
            document.getElementById('dur-hours').value = 0;
            document.getElementById('dur-minutes').value = 1;
            document.getElementById('dur-seconds').value = 0;
            document.getElementById('timer-label').value = '1 Minute';
            break;
        case '5min':
            setMode('duration');
            document.getElementById('dur-hours').value = 0;
            document.getElementById('dur-minutes').value = 5;
            document.getElementById('dur-seconds').value = 0;
            document.getElementById('timer-label').value = '5 Minutes';
            break;
        case '10min':
            setMode('duration');
            document.getElementById('dur-hours').value = 0;
            document.getElementById('dur-minutes').value = 10;
            document.getElementById('dur-seconds').value = 0;
            document.getElementById('timer-label').value = '10 Minutes';
            break;
        case '25min':
            setMode('duration');
            document.getElementById('dur-hours').value = 0;
            document.getElementById('dur-minutes').value = 25;
            document.getElementById('dur-seconds').value = 0;
            document.getElementById('timer-label').value = 'Pomodoro';
            break;
        case '1hour':
            setMode('duration');
            document.getElementById('dur-hours').value = 1;
            document.getElementById('dur-minutes').value = 0;
            document.getElementById('dur-seconds').value = 0;
            document.getElementById('timer-label').value = '1 Hour';
            break;
        case 'newyear': {
            setMode('datetime');
            const next = new Date();
            next.setFullYear(next.getFullYear() + 1);
            next.setMonth(0, 1);
            next.setHours(0, 0, 0, 0);
            document.getElementById('target-date').value = toDateInput(next);
            document.getElementById('target-time').value = '00:00';
            document.getElementById('timer-label').value = 'New Year';
            break;
        }
        case 'tomorrow': {
            setMode('datetime');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            document.getElementById('target-date').value = toDateInput(tomorrow);
            document.getElementById('target-time').value = '09:00';
            document.getElementById('timer-label').value = 'Tomorrow 9AM';
            break;
        }
        case 'weekend': {
            setMode('datetime');
            const sat = new Date();
            const day = sat.getDay();
            const daysUntilSat = (6 - day + 7) % 7 || 7;
            sat.setDate(sat.getDate() + daysUntilSat);
            sat.setHours(9, 0, 0, 0);
            document.getElementById('target-date').value = toDateInput(sat);
            document.getElementById('target-time').value = '09:00';
            document.getElementById('timer-label').value = 'Weekend';
            break;
        }
    }
    
    updateTimerPreview();
    showToast(`⚡ Preset loaded: ${type}`);
}

function toDateInput(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ============ SAVE TIMER ============
function saveTimer() {
    if (!isRunning && !targetTime) {
        return showToast('❌ No active timer to save!', 'error');
    }
    
    const label = document.getElementById('timer-label').value.trim() || 'Untitled Timer';
    
    const entry = {
        id: Date.now(),
        label: label,
        mode: currentMode,
        targetTime: targetTime ? targetTime.toISOString() : null,
        createdAt: Date.now()
    };
    
    savedTimers.unshift(entry);
    if (savedTimers.length > 20) savedTimers.pop();
    
    try {
        localStorage.setItem('toolhub_countdown_saved', JSON.stringify(savedTimers));
    } catch (e) {}
    
    renderSavedTimers();
    showToast('💾 Timer saved!');
}

// ============ RENDER SAVED TIMERS ============
function renderSavedTimers() {
    if (savedTimers.length === 0) {
        savedPanel.style.display = 'none';
        return;
    }
    
    savedPanel.style.display = 'block';
    
    savedList.innerHTML = savedTimers.map(t => {
        const target = t.targetTime ? new Date(t.targetTime) : null;
        const isPast = target && target <= new Date();
        const timeStr = target ? formatTargetTime(target) : 'N/A';
        const status = isPast ? 'Expired' : 'Upcoming';
        const statusColor = isPast ? 'var(--danger)' : 'var(--success)';
        
        return `
            <div class="saved-item" onclick="loadSavedTimer(${t.id})">
                <div class="saved-info">
                    <div class="saved-name">${escapeHtml(t.label)}</div>
                    <div class="saved-sub">
                        <span style="color:${statusColor};font-weight:700;">${status}</span> • ${timeStr}
                    </div>
                </div>
                <button class="saved-delete" onclick="event.stopPropagation(); deleteSavedTimer(${t.id})" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// ============ LOAD SAVED TIMER ============
function loadSavedTimer(id) {
    const t = savedTimers.find(x => x.id === id);
    if (!t) return;
    
    if (t.targetTime) {
        const target = new Date(t.targetTime);
        if (target <= new Date()) {
            return showToast('❌ This timer has already expired!', 'error');
        }
        
        setMode('datetime');
        document.getElementById('target-date').value = toDateInput(target);
        document.getElementById('target-time').value = 
            String(target.getHours()).padStart(2, '0') + ':' + 
            String(target.getMinutes()).padStart(2, '0');
        document.getElementById('timer-label').value = t.label;
        
        updateTimerPreview();
        showToast(`📋 Loaded: ${t.label}`);
    }
}

// ============ DELETE SAVED TIMER ============
function deleteSavedTimer(id) {
    savedTimers = savedTimers.filter(t => t.id !== id);
    localStorage.setItem('toolhub_countdown_saved', JSON.stringify(savedTimers));
    renderSavedTimers();
    showToast('🗑️ Deleted');
}

// ============ CLEAR ALL SAVED ============
function clearAllSaved() {
    if (savedTimers.length === 0) return;
    if (!confirm('Kya aap saare saved timers clear karna chahte hain?')) return;
    
    savedTimers = [];
    localStorage.removeItem('toolhub_countdown_saved');
    renderSavedTimers();
    showToast('🧹 All cleared!');
}

// ============ HELPERS ============
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Countdown Timer - Tool Hub',
        text: 'Check out this free Countdown Timer tool!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Link copied!');
        }).catch(() => {
            showToast('❌ Could not copy!', 'error');
        });
    }
}

// ============ TOAST ============
let toastTimeout;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');

    toastMsg.innerText = message;
    toast.classList.remove('error');

    if (type === 'error') {
        toast.classList.add('error');
        toastIcon.className = 'fa-solid fa-circle-exclamation';
    } else {
        toastIcon.className = 'fa-solid fa-circle-check';
    }

    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// ============ DARK MODE ============
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        document.body.classList.remove('dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('toolhub_theme', newTheme);
});

applyTheme(localStorage.getItem('toolhub_theme') || 'light');

// ============ EVENT LISTENERS ============
document.getElementById('dur-hours').addEventListener('input', updateTimerPreview);
document.getElementById('dur-minutes').addEventListener('input', updateTimerPreview);
document.getElementById('dur-seconds').addEventListener('input', updateTimerPreview);
document.getElementById('target-date').addEventListener('input', updateTimerPreview);
document.getElementById('target-time').addEventListener('input', updateTimerPreview);

// Save button (create on the fly)
const saveTimerBtn = document.createElement('button');
saveTimerBtn.className = 'btn btn-info';
saveTimerBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Save Timer';
saveTimerBtn.onclick = saveTimer;
saveTimerBtn.style.display = 'none';
saveTimerBtn.id = 'save-btn';
document.querySelector('.input-actions').appendChild(saveTimerBtn);

// Show save button when timer is running
const originalStart = startTimer;
startTimer = function() {
    originalStart();
    if (isRunning) saveTimerBtn.style.display = 'inline-flex';
};

const originalReset = resetTimer;
resetTimer = function() {
    originalReset();
    saveTimerBtn.style.display = 'none';
};

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Space → Start / Pause
    if (e.key === ' ' && !e.target.matches('input, textarea, select, button')) {
        e.preventDefault();
        if (!isRunning) startTimer();
        else togglePause();
    }
    // Escape → Reset
    if (e.key === 'Escape' && isRunning) {
        e.preventDefault();
        resetTimer();
    }
    // Ctrl/Cmd + Shift + S → Save
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (isRunning) saveTimer();
    }
});

// ============ INITIALIZE ============
(function init() {
    // Set default target date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('target-date').value = toDateInput(tomorrow);
    document.getElementById('target-time').value = '00:00';
    
    updateTimerPreview();
    renderSavedTimers();
})();