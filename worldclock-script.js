/* ============================================================
   WORLD CLOCK - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ CITIES DATABASE ============
const CITIES = [
    // Americas
    { name: 'New York', country: 'United States', tz: 'America/New_York', region: 'americas' },
    { name: 'Los Angeles', country: 'United States', tz: 'America/Los_Angeles', region: 'americas' },
    { name: 'Chicago', country: 'United States', tz: 'America/Chicago', region: 'americas' },
    { name: 'Toronto', country: 'Canada', tz: 'America/Toronto', region: 'americas' },
    { name: 'Mexico City', country: 'Mexico', tz: 'America/Mexico_City', region: 'americas' },
    { name: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo', region: 'americas' },
    { name: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires', region: 'americas' },

    // Europe
    { name: 'London', country: 'United Kingdom', tz: 'Europe/London', region: 'europe' },
    { name: 'Paris', country: 'France', tz: 'Europe/Paris', region: 'europe' },
    { name: 'Berlin', country: 'Germany', tz: 'Europe/Berlin', region: 'europe' },
    { name: 'Rome', country: 'Italy', tz: 'Europe/Rome', region: 'europe' },
    { name: 'Madrid', country: 'Spain', tz: 'Europe/Madrid', region: 'europe' },
    { name: 'Moscow', country: 'Russia', tz: 'Europe/Moscow', region: 'europe' },
    { name: 'Istanbul', country: 'Turkey', tz: 'Europe/Istanbul', region: 'europe' },
    { name: 'Amsterdam', country: 'Netherlands', tz: 'Europe/Amsterdam', region: 'europe' },

    // Asia
    { name: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', region: 'asia' },
    { name: 'Karachi', country: 'Pakistan', tz: 'Asia/Karachi', region: 'asia' },
    { name: 'Lahore', country: 'Pakistan', tz: 'Asia/Karachi', region: 'asia' },
    { name: 'Delhi', country: 'India', tz: 'Asia/Kolkata', region: 'asia' },
    { name: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', region: 'asia' },
    { name: 'Dhaka', country: 'Bangladesh', tz: 'Asia/Dhaka', region: 'asia' },
    { name: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok', region: 'asia' },
    { name: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', region: 'asia' },
    { name: 'Hong Kong', country: 'China', tz: 'Asia/Hong_Kong', region: 'asia' },
    { name: 'Shanghai', country: 'China', tz: 'Asia/Shanghai', region: 'asia' },
    { name: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', region: 'asia' },
    { name: 'Seoul', country: 'South Korea', tz: 'Asia/Seoul', region: 'asia' },
    { name: 'Kuala Lumpur', country: 'Malaysia', tz: 'Asia/Kuala_Lumpur', region: 'asia' },
    { name: 'Jakarta', country: 'Indonesia', tz: 'Asia/Jakarta', region: 'asia' },
    { name: 'Manila', country: 'Philippines', tz: 'Asia/Manila', region: 'asia' },
    { name: 'Riyadh', country: 'Saudi Arabia', tz: 'Asia/Riyadh', region: 'asia' },

    // Africa
    { name: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo', region: 'africa' },
    { name: 'Lagos', country: 'Nigeria', tz: 'Africa/Lagos', region: 'africa' },
    { name: 'Nairobi', country: 'Kenya', tz: 'Africa/Nairobi', region: 'africa' },
    { name: 'Johannesburg', country: 'South Africa', tz: 'Africa/Johannesburg', region: 'africa' },
    { name: 'Casablanca', country: 'Morocco', tz: 'Africa/Casablanca', region: 'africa' },

    // Oceania
    { name: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', region: 'oceania' },
    { name: 'Melbourne', country: 'Australia', tz: 'Australia/Melbourne', region: 'oceania' },
    { name: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland', region: 'oceania' },
    { name: 'Honolulu', country: 'USA', tz: 'Pacific/Honolulu', region: 'oceania' },
];

// ============ ALL IANA TIMEZONES ============
const ALL_TIMEZONES = [
    'Africa/Cairo', 'Africa/Casablanca', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
    'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Chicago',
    'America/Denver', 'America/Lima', 'America/Los_Angeles', 'America/Mexico_City',
    'America/New_York', 'America/Sao_Paulo', 'America/Toronto', 'America/Vancouver',
    'Asia/Bangkok', 'Asia/Dhaka', 'Asia/Dubai', 'Asia/Hong_Kong', 'Asia/Jakarta', 'Asia/Karachi',
    'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Manila', 'Asia/Riyadh', 'Asia/Seoul',
    'Asia/Shanghai', 'Asia/Singapore', 'Asia/Tokyo',
    'Atlantic/Azores',
    'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
    'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Dublin', 'Europe/Istanbul',
    'Europe/Lisbon', 'Europe/London', 'Europe/Madrid', 'Europe/Moscow', 'Europe/Paris',
    'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich',
    'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu',
    'UTC'
];

// ============ STATE ============
let favorites = JSON.parse(localStorage.getItem('toolhub_worldclock_favs')) || ['Asia/Tokyo', 'Europe/London', 'America/New_York', 'Asia/Dubai'];
let customCities = JSON.parse(localStorage.getItem('toolhub_worldclock_custom')) || [];
let currentFilter = 'all';
let searchQuery = '';
let use24Hour = true;
let allCities = [];

// ============ DOM ELEMENTS ============
const clocksGrid = document.getElementById('clocks-grid');
const noResults = document.getElementById('no-results');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('city-search');
const clearSearchBtn = document.getElementById('clear-search');
const heroTime = document.getElementById('hero-time');
const heroPeriod = document.getElementById('hero-period');
const heroDate = document.getElementById('hero-date');
const heroClock = document.querySelector('.hero-clock');
const localTimezone = document.getElementById('local-timezone');
const localDayNightIcon = document.getElementById('local-daynight-icon');
const localDayNightText = document.getElementById('local-daynight-text');
const formatLabel = document.getElementById('format-label');
const convFrom = document.getElementById('conv-from');
const convTo = document.getElementById('conv-to');
const convTime = document.getElementById('conv-time');
const converterValue = document.getElementById('converter-value');
const converterSub = document.getElementById('converter-sub');

// ============ INITIALIZE ============
function init() {
    // Combine default + custom cities
    allCities = [...CITIES, ...customCities.map(c => ({ ...c, isCustom: true }))];

    // Populate timezone dropdown for custom
    populateTimezoneDropdown();

    // Populate converter dropdowns
    populateConverterDropdowns();

    // Set default converter values
    convFrom.value = 'Asia/Karachi';
    convTo.value = 'Europe/London';
    convTime.value = '12:00';

    // Render
    renderClocks();
    updateHeroClock();
    updateConverter();

    // Start live updates
    setInterval(() => {
        updateHeroClock();
        updateAllClocks();
    }, 1000);

    // Search listener
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
        renderClocks();
    });

    // Format toggle
    formatLabel.innerText = use24Hour ? '24H' : '12H';
}

// ============ POPULATE TIMEZONE DROPDOWN ============
function populateTimezoneDropdown() {
    const sel = document.getElementById('custom-city-tz');
    sel.innerHTML = '<option value="">-- Select Timezone --</option>' +
        ALL_TIMEZONES.map(tz => `<option value="${tz}">${tz}</option>`).join('');
}

// ============ POPULATE CONVERTER DROPDOWNS ============
function populateConverterDropdowns() {
    const options = allCities.map(c => 
        `<option value="${c.tz}">${c.name}, ${c.country}</option>`
    ).join('');

    convFrom.innerHTML = options;
    convTo.innerHTML = options;
}

// ============ UPDATE HERO CLOCK (Local Time) ============
function updateHeroClock() {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Time formatting
    const timeOpts = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !use24Hour
    };
    const timeStr = now.toLocaleTimeString('en-US', timeOpts);
    
    // Split time and period
    if (use24Hour) {
        heroTime.innerText = timeStr;
        heroPeriod.innerText = '';
    } else {
        const parts = timeStr.split(' ');
        heroTime.innerText = parts[0];
        heroPeriod.innerText = parts[1] || '';
    }

    // Date
    heroDate.innerText = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Timezone
    localTimezone.innerText = formatTimezoneOffset(tz, now);

    // Day/Night detection
    const hour = now.getHours();
    const isDay = hour >= 6 && hour < 18;
    
    if (isDay) {
        heroClock.classList.add('daytime');
        localDayNightIcon.className = 'fa-solid fa-sun';
        localDayNightText.innerText = 'Daytime';
    } else {
        heroClock.classList.remove('daytime');
        localDayNightIcon.className = 'fa-solid fa-moon';
        localDayNightText.innerText = 'Night';
    }
}

// ============ FORMAT TIMEZONE OFFSET ============
function formatTimezoneOffset(tz, date = new Date()) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            timeZoneName: 'shortOffset'
        });
        const parts = formatter.formatToParts(date);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');
        return offsetPart ? offsetPart.value : 'UTC';
    } catch (e) {
        return 'UTC';
    }
}

// ============ GET TIMEZONE OFFSET IN MINUTES ============
function getTimezoneOffsetMinutes(tz, date = new Date()) {
    try {
        // Get UTC time
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        // Get target timezone time
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
        return (tzDate - utcDate) / 60000;
    } catch (e) {
        return 0;
    }
}

// ============ FORMAT OFFSET DIFFERENCE ============
function formatOffsetDiff(tz, date = new Date()) {
    const localOffset = -date.getTimezoneOffset();
    const tzOffset = getTimezoneOffsetMinutes(tz, date);
    const diff = tzOffset - localOffset;
    
    if (diff === 0) return { text: 'Same as local', cls: 'diff-same', hours: 0 };
    
    const sign = diff > 0 ? '+' : '';
    const hours = Math.floor(Math.abs(diff) / 60);
    const minutes = Math.abs(diff) % 60;
    
    let text = `${sign}${diff > 0 ? '+' : '-'}${hours}`;
    if (minutes > 0) text += `:${String(minutes).padStart(2, '0')}`;
    text += 'h from you';
    
    return {
        text,
        cls: diff > 0 ? 'diff-positive' : 'diff-negative',
        hours: diff / 60
    };
}

// ============ GET TIME IN TIMEZONE ============
function getTimeInTimezone(tz, date = new Date()) {
    try {
        return new Date(date.toLocaleString('en-US', { timeZone: tz }));
    } catch (e) {
        return date;
    }
}

// ============ FORMAT TIME FOR CITY ============
function formatCityTime(date, tz) {
    try {
        const opts = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !use24Hour,
            timeZone: tz
        };
        const timeStr = date.toLocaleTimeString('en-US', opts);
        
        if (use24Hour) {
            return { digits: timeStr, period: '' };
        } else {
            const parts = timeStr.split(' ');
            return { digits: parts[0], period: parts[1] || '' };
        }
    } catch (e) {
        return { digits: '--:--', period: '' };
    }
}

// ============ FORMAT DATE FOR CITY ============
function formatCityDate(date, tz) {
    try {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: tz
        });
    } catch (e) {
        return '';
    }
}

// ============ GET SECONDS IN TIMEZONE ============
function getSecondsInTimezone(tz) {
    const now = new Date();
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            second: 'numeric'
        }).formatToParts(now);
        const secPart = parts.find(p => p.type === 'second');
        return parseInt(secPart?.value) || now.getSeconds();
    } catch (e) {
        return now.getSeconds();
    }
}

// ============ GET HOUR IN TIMEZONE ============
function getHourInTimezone(tz) {
    const now = new Date();
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            hour12: false
        }).formatToParts(now);
        const hourPart = parts.find(p => p.type === 'hour');
        return parseInt(hourPart?.value) || 0;
    } catch (e) {
        return 0;
    }
}

// ============ RENDER CLOCKS ============
function renderClocks() {
    let filtered = [...allCities];

    // Filter by region/favorites
    if (currentFilter === 'favorites') {
        filtered = filtered.filter(c => favorites.includes(c.tz));
    } else if (currentFilter !== 'all') {
        filtered = filtered.filter(c => c.region === currentFilter);
    }

    // Filter by search
    if (searchQuery) {
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(searchQuery) ||
            c.country.toLowerCase().includes(searchQuery) ||
            c.tz.toLowerCase().includes(searchQuery)
        );
    }

    // Update count
    resultsCount.innerText = `Showing ${filtered.length} ${filtered.length === 1 ? 'city' : 'cities'}`;

    // Show/hide no results
    if (filtered.length === 0) {
        clocksGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    } else {
        clocksGrid.style.display = 'grid';
        noResults.style.display = 'none';
    }

    // Render
    clocksGrid.innerHTML = filtered.map(city => renderCityCard(city)).join('');
}

// ============ RENDER CITY CARD ============
function renderCityCard(city) {
    const now = new Date();
    const time = formatCityTime(now, city.tz);
    const date = formatCityDate(now, city.tz);
    const seconds = getSecondsInTimezone(city.tz);
    const hour = getHourInTimezone(city.tz);
    const isDay = hour >= 6 && hour < 18;
    const isFav = favorites.includes(city.tz);
    const offsetInfo = formatOffsetDiff(city.tz, now);
    const tzOffset = formatTimezoneOffset(city.tz, now);

    const dayNightIcon = isDay 
        ? '<i class="fa-solid fa-sun"></i>' 
        : '<i class="fa-solid fa-moon"></i>';

    return `
        <div class="city-card ${isDay ? '' : 'night'}" data-tz="${city.tz}">
            <div class="city-daynight">${dayNightIcon}</div>
            <div class="city-card-header">
                <div class="city-info">
                    <div class="city-name" title="${city.name}">
                        ${escapeHtml(city.name)}
                        ${city.isCustom ? '<i class="fa-solid fa-user-tag" style="font-size:0.7rem;color:var(--info);" title="Custom city"></i>' : ''}
                    </div>
                    <div class="city-country">
                        <span class="region-badge">${city.region.toUpperCase()}</span>
                        ${escapeHtml(city.country)}
                    </div>
                </div>
                <button class="city-star ${isFav ? 'active' : ''}" 
                        onclick="toggleFavorite('${city.tz}', event)"
                        title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>

            <div class="city-time">
                <div class="city-time-digits time-display">${time.digits}</div>
                ${time.period ? `<div class="city-period">${time.period}</div>` : ''}
            </div>

            <div class="city-seconds-bar">
                <div class="city-seconds-fill seconds-fill" style="width: ${(seconds / 60) * 100}%"></div>
            </div>

            <div class="city-date">${date} • ${tzOffset}</div>

            <div class="city-meta">
                <span class="city-offset ${offsetInfo.cls}">
                    <i class="fa-solid fa-arrow-${offsetInfo.hours > 0 ? 'up' : offsetInfo.hours < 0 ? 'down' : 'right'}"></i>
                    ${offsetInfo.text}
                </span>
                ${city.isCustom ? `
                    <button class="delete-city-btn" onclick="deleteCustomCity('${city.tz}', event)" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// ============ UPDATE ALL CLOCKS (Live Seconds) ============
function updateAllClocks() {
    const cards = document.querySelectorAll('.city-card');
    const now = new Date();

    cards.forEach(card => {
        const tz = card.dataset.tz;
        if (!tz) return;

        const time = formatCityTime(now, tz);
        const seconds = getSecondsInTimezone(tz);
        const hour = getHourInTimezone(tz);
        const isDay = hour >= 6 && hour < 18;

        // Update time digits
        const timeEl = card.querySelector('.time-display');
        if (timeEl) timeEl.innerText = time.digits;

        // Update period
        const periodEl = card.querySelector('.city-period');
        if (periodEl) {
            if (time.period) periodEl.innerText = time.period;
            else periodEl.innerText = '';
        }

        // Update seconds bar
        const secondsFill = card.querySelector('.seconds-fill');
        if (secondsFill) secondsFill.style.width = ((seconds / 60) * 100) + '%';

        // Update day/night class
        const dayNight = card.querySelector('.city-daynight');
        if (dayNight) {
            dayNight.innerHTML = isDay 
                ? '<i class="fa-solid fa-sun"></i>' 
                : '<i class="fa-solid fa-moon"></i>';
        }
        card.classList.toggle('night', !isDay);
    });
}

// ============ TOGGLE FAVORITE ============
function toggleFavorite(tz, event) {
    if (event) event.stopPropagation();
    
    const idx = favorites.indexOf(tz);
    if (idx > -1) {
        favorites.splice(idx, 1);
        showToast('⭐ Removed from favorites');
    } else {
        favorites.push(tz);
        showToast('⭐ Added to favorites');
    }
    
    localStorage.setItem('toolhub_worldclock_favs', JSON.stringify(favorites));
    
    // Update star in place
    const card = document.querySelector(`.city-card[data-tz="${tz}"]`);
    if (card) {
        const star = card.querySelector('.city-star');
        if (star) star.classList.toggle('active', favorites.includes(tz));
    }

    // Re-render if on favorites filter
    if (currentFilter === 'favorites') renderClocks();
}

// ============ FILTER BY REGION ============
function filterByRegion(region) {
    currentFilter = region;
    
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === region);
    });
    
    renderClocks();
}

// ============ CLEAR SEARCH ============
function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderClocks();
    searchInput.focus();
}

// ============ TOGGLE FORMAT ============
function toggleFormat() {
    use24Hour = !use24Hour;
    formatLabel.innerText = use24Hour ? '24H' : '12H';
    localStorage.setItem('toolhub_worldclock_24h', use24Hour);
    updateHeroClock();
    renderClocks();
    updateConverter();
    showToast(`🕐 Switched to ${use24Hour ? '24-hour' : '12-hour'} format`);
}

// ============ TOGGLE ADD PANEL ============
function toggleAddPanel() {
    const panel = document.getElementById('add-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// ============ ADD CUSTOM CITY ============
function addCustomCity() {
    const name = document.getElementById('custom-city-name').value.trim();
    const tz = document.getElementById('custom-city-tz').value;

    if (!name) return showToast('❌ Please enter a city name!', 'error');
    if (!tz) return showToast('❌ Please select a timezone!', 'error');

    // Check duplicate
    if (allCities.some(c => c.tz === tz && c.isCustom)) {
        return showToast('❌ This timezone is already added!', 'error');
    }

    const newCity = {
        name: name,
        country: 'Custom',
        tz: tz,
        region: 'custom',
        isCustom: true
    };

    customCities.push(newCity);
    allCities = [...CITIES, ...customCities.map(c => ({ ...c, isCustom: true }))];
    localStorage.setItem('toolhub_worldclock_custom', JSON.stringify(customCities));

    // Populate converter dropdowns again
    populateConverterDropdowns();

    // Clear inputs
    document.getElementById('custom-city-name').value = '';
    document.getElementById('custom-city-tz').value = '';

    toggleAddPanel();
    renderClocks();
    showToast(`✅ ${name} added!`);
}

// ============ DELETE CUSTOM CITY ============
function deleteCustomCity(tz, event) {
    if (event) event.stopPropagation();
    
    if (!confirm('Delete this custom city?')) return;

    customCities = customCities.filter(c => c.tz !== tz);
    allCities = [...CITIES, ...customCities.map(c => ({ ...c, isCustom: true }))];
    localStorage.setItem('toolhub_worldclock_custom', JSON.stringify(customCities));

    populateConverterDropdowns();
    renderClocks();
    showToast('🗑️ City deleted!');
}

// ============ UPDATE CONVERTER ============
function updateConverter() {
    const fromTz = convFrom.value;
    const toTz = convTo.value;
    const timeVal = convTime.value;

    if (!fromTz || !toTz || !timeVal) {
        converterValue.innerText = '—';
        converterSub.innerText = 'Select cities to convert';
        return;
    }

    try {
        // Parse HH:MM
        const [hh, mm] = timeVal.split(':').map(Number);

        // Get today's date in "from" timezone
        const now = new Date();
        const fromDate = new Date(now.toLocaleString('en-US', { timeZone: fromTz }));
        fromDate.setHours(hh, mm, 0, 0);

        // Convert: get the "wall clock" time in from timezone
        // Then find equivalent instant, then display in to timezone
        const fromOffset = getTimezoneOffsetMinutes(fromTz, now);
        const toOffset = getTimezoneOffsetMinutes(toTz, now);

        // Get the UTC instant corresponding to the from time
        const fromCity = allCities.find(c => c.tz === fromTz);
        const toCity = allCities.find(c => c.tz === toTz);

        // Compute equivalent time in target
        const diffMinutes = toOffset - fromOffset;
        const totalMinutes = hh * 60 + mm + diffMinutes;
        let targetH = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60);
        let targetM = ((totalMinutes % 60) + 60) % 60;

        // Format
        let displayH, period = '';
        if (use24Hour) {
            displayH = String(targetH).padStart(2, '0');
        } else {
            period = targetH >= 12 ? 'PM' : 'AM';
            displayH = targetH % 12 || 12;
        }
        const displayM = String(targetM).padStart(2, '0');

        // Day offset
        const dayOffset = Math.floor(totalMinutes / 1440);

        converterValue.innerText = `${displayH}:${displayM}${period ? ' ' + period : ''}`;
        converterSub.innerHTML = `
            ${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')} in <b>${fromCity?.name || fromTz}</b> 
            = ${displayH}:${displayM}${period ? ' ' + period : ''} in <b>${toCity?.name || toTz}</b>
            ${dayOffset !== 0 ? ` • ${dayOffset > 0 ? 'Next' : 'Previous'} day` : ''}
        `;
    } catch (e) {
        converterValue.innerText = '—';
        converterSub.innerText = 'Could not convert';
    }
}

// Event listeners for converter
convFrom.addEventListener('change', updateConverter);
convTo.addEventListener('change', updateConverter);
convTime.addEventListener('input', updateConverter);

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
        title: 'World Clock - Tool Hub',
        text: 'Check out this free World Clock tool!',
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

// Load saved 24h preference
const saved24h = localStorage.getItem('toolhub_worldclock_24h');
if (saved24h !== null) {
    use24Hour = saved24h === 'true';
    formatLabel.innerText = use24Hour ? '24H' : '12H';
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // "/" → Focus search
    if (e.key === '/' && document.activeElement !== searchInput && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault();
        searchInput.focus();
    }
    // Escape → clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        clearSearch();
    }
    // Ctrl/Cmd + Shift + F → Toggle format
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        toggleFormat();
    }
});

// ============ INITIALIZE ============
init();