/* ============================================================
   ALL TOOLS PAGE - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ COMPLETE TOOLS DATABASE ============
// Yahan aap apne saare tools add karte jayein
// page: file ka naam (khali chhodein agar abhi nahi bana)
const ALL_TOOLS = [
    // ============ TEXT TOOLS ============
    { id: 'word-counter', name: 'Word Counter', category: 'text', icon: 'fa-file-word', desc: 'Count words, characters, sentences & paragraphs in real-time.', page: 'word-index.html', popular: true },
   { id: 'char-counter', name: 'Character Counter', category: 'text', icon: 'fa-text-width', desc: 'Count characters with and without spaces instantly.', page: 'charcount-index.html', popular: true },
   { id: 'case-converter', name: 'Case Converter', category: 'text', icon: 'fa-font', desc: 'Convert text to UPPERCASE, lowercase, Title Case, Sentence case.', page: 'case-index.html', popular: true },
   { id: 'remove-spaces', name: 'Remove Extra Spaces', category: 'text', icon: 'fa-eraser', desc: 'Remove extra whitespace, tabs & line breaks from text.', page: 'rmspaces-index.html', popular: true },
    { id: 'text-reverser', name: 'Text Reverser', category: 'text', icon: 'fa-rotate-left', desc: 'Reverse text, words, or lines instantly.', page: 'rev-index.html', popular: true },
    { id: 'text-sorter', name: 'Text Sorter', category: 'text', icon: 'fa-arrow-down-a-z', desc: 'Sort lines alphabetically, numerically or by length.', page: 'sort-index.html', popular: true },
   { id: 'duplicate-remover', name: 'Duplicate Line Remover', category: 'text', icon: 'fa-clone', desc: 'Remove duplicate lines from any text instantly.', page: 'dupe-index.html', popular: true },
   { id: 'lorem-generator', name: 'Lorem Ipsum Generator', category: 'text', icon: 'fa-paragraph', desc: 'Generate Lorem Ipsum placeholder text by words or paragraphs.', page: 'lorem-index.html', popular: true },
    // ============ CALCULATOR TOOLS ============
    { id: 'basic-calc', name: 'Basic Calculator', category: 'calc', icon: 'fa-calculator', desc: 'Simple arithmetic calculator with keyboard support.', page: 'calc-index.html', popular: true },
    { id: 'scientific-calc', name: 'Scientific Calculator', category: 'calc', icon: 'fa-square-root-variable', desc: 'Advanced calculator with trig, log & power functions.', page: 'scientific-index.html', popular: true },
    { id: 'age-calc', name: 'Age Calculator', category: 'calc', icon: 'fa-cake-candles', desc: 'Calculate exact age from date of birth in years, months & days.', page: 'age-index.html', popular: true },
    { id: 'percentage-calc', name: 'Percentage Calculator', category: 'calc', icon: 'fa-percent', desc: 'Calculate percentages, increases, decreases & differences.', page: 'percentage-index.html', popular: true },
    { id: 'bmi-calc', name: 'BMI Calculator', category: 'calc', icon: 'fa-weight-scale', desc: 'Check your Body Mass Index with health category.', page: 'bmi-index.html', popular: true },
   { id: 'discount-calc', name: 'Discount Calculator', category: 'calc', icon: 'fa-tags', desc: 'Calculate final price after discount & savings.', page: 'discount-index.html', popular: true },
    { id: 'date-diff', name: 'Date Difference Calculator', category: 'calc', icon: 'fa-calendar-week', desc: 'Find days, weeks & months between two dates.', page: 'datediff-index.html', popular: true },
   { id: 'time-calc', name: 'Time Calculator', category: 'calc', icon: 'fa-clock', desc: 'Add, subtract & convert time units easily.', page: 'time-index.html', popular: true },

    // ============ DEVELOPER TOOLS ============
    { id: 'json-formatter', name: 'JSON Formatter', category: 'dev', icon: 'fa-code', desc: 'Format, validate & beautify JSON with tree view.', page: 'json-index.html', popular: true },
   { id: 'json-validator', name: 'JSON Validator', category: 'dev', icon: 'fa-circle-check', desc: 'Validate JSON with detailed error line info.', page: 'jsonvalidator-index.html', popular: true },
    { id: 'base64', name: 'Base64 Encoder/Decoder', category: 'dev', icon: 'fa-lock', desc: 'Encode & decode text or images to Base64.', page: 'base64-index.html', popular: true },
   { id: 'url-encoder', name: 'URL Encoder/Decoder', category: 'dev', icon: 'fa-link', desc: 'Encode & decode URLs safely for web use.', page: 'urlencoder-index.html', popular: true },
   { id: 'html-formatter', name: 'HTML Formatter', category: 'dev', icon: 'fa-html5', desc: 'Format & beautify messy HTML code instantly.', page: 'htmlformatter-index.html', popular: true },
   { id: 'css-formatter', name: 'CSS Formatter', category: 'dev', icon: 'fa-css3-alt', desc: 'Format & minify CSS stylesheets.', page: 'cssformatter-index.html', popular: true },
    { id: 'js-minifier', name: 'JavaScript Minifier', category: 'dev', icon: 'fa-js', desc: 'Minify JS code to reduce file size.', page: 'jsminifier-index.html', popular: true },
   { id: 'uuid-gen', name: 'UUID Generator', category: 'dev', icon: 'fa-fingerprint', desc: 'Generate RFC-compliant UUID v4 identifiers.', page: 'uuid-index.html', popular: true },
   { id: 'regex-tester', name: 'Regex Tester', category: 'dev', icon: 'fa-asterisk', desc: 'Test regular expressions with live matching.', page: 'regextester-index.html', popular: true },
   { id: 'timestamp-conv', name: 'Timestamp Converter', category: 'dev', icon: 'fa-clock-rotate-left', desc: 'Convert Unix timestamps to readable dates.', page: 'timestamp-index.html', popular: true },
    { id: 'color-converter', name: 'Color Converter', category: 'dev', icon: 'fa-palette', desc: 'Convert HEX, RGB, HSL color formats.', page: 'colorconverter-index.html', popular: true },

    // ============ IMAGE TOOLS ============
    { id: 'img-compressor', name: 'Image Compressor', category: 'image', icon: 'fa-image', desc: 'Compress JPG, PNG & WebP images without losing quality.', page: 'imgcomp-index.html', popular: true },
   { id: 'img-resizer', name: 'Image Resizer', category: 'image', icon: 'fa-expand', desc: 'Resize images to any dimension with aspect ratio lock.', page: 'imgresizer-index.html', popular: true },
    { id: 'jpg-to-png', name: 'JPG to PNG', category: 'image', icon: 'fa-file-image', desc: 'Convert JPG images to PNG format instantly.', page: 'jpgtopng-index.html', popular: true },
   { id: 'png-to-jpg', name: 'PNG to JPG', category: 'image', icon: 'fa-file-image', desc: 'Convert PNG images to JPG format.', page: 'pngtojpg-index.html', popular: true },
   { id: 'img-cropper', name: 'Image Cropper', category: 'image', icon: 'fa-crop', desc: 'Crop images interactively with custom aspect ratios.', page: 'imgcropper-index.html', popular: true },
    { id: 'img-to-base64', name: 'Image to Base64', category: 'image', icon: 'fa-code', desc: 'Convert images to Base64 data URIs.', page: 'imgtobase64-index.html', popular: true },
   { id: 'grayscale-img', name: 'Grayscale Image', category: 'image', icon: 'fa-circle-half-stroke', desc: 'Convert colored images to grayscale.', page: 'grayscale-index.html', popular: true },
    { id: 'img-metadata', name: 'Image Metadata Viewer', category: 'image', icon: 'fa-info-circle', desc: 'View EXIF & metadata of your images.', page: 'imgmetadata-index.html', popular: true },
    { id: 'img-to-4k', name: 'Image to 4K Converter', category: 'image', icon: 'fa-image', desc: 'Upscale any image to stunning 4K resolution (3840×2160) with advanced algorithms.', page: 'imgto4k-index.html', popular: true },

    // ============ GENERATOR TOOLS ============
    { id: 'pass-gen', name: 'Password Generator', category: 'gen', icon: 'fa-key', desc: 'Generate secure passwords with custom rules & bulk option.', page: 'passgen-index.html', popular: true },
    { id: 'qr-gen', name: 'QR Code Generator', category: 'gen', icon: 'fa-qrcode', desc: 'Create QR codes for URL, WiFi, Email, SMS, vCard & more.', page: 'qr-index.html', popular: true },
    { id: 'color-palette', name: 'Color Palette Generator', category: 'gen', icon: 'fa-palette', desc: 'Generate beautiful color palettes & export them.', page: 'colorgen-index.html', popular: true },
    { id: 'random-number', name: 'Random Number Generator', category: 'gen', icon: 'fa-dice', desc: 'Generate random numbers within any range.', page: '', popular: false },
    { id: 'random-name', name: 'Random Name Generator', category: 'gen', icon: 'fa-user', desc: 'Generate random names for testing or games.', page: 'randomname-index.html', popular: true },
    
    { id: 'barcode-gen', name: 'Barcode Generator', category: 'gen', icon: 'fa-barcode', desc: 'Generate barcodes in multiple formats.', page: 'barcode-index.html', popular: true },
    { id: 'gradient-gen', name: 'Gradient Generator', category: 'gen', icon: 'fa-fill-drip', desc: 'Create beautiful CSS gradients visually.', page: '', popular: true },

    // ============ DATE & TIME ============
   { id: 'world-clock', name: 'World Clock', category: 'date', icon: 'fa-globe', desc: 'Check current time in any city worldwide.', page: 'worldclock-index.html', popular: true },
   { id: 'countdown', name: 'Countdown Timer', category: 'date', icon: 'fa-hourglass-half', desc: 'Set countdown to any date or event.', page: 'countdown-index.html', popular: true },
    { id: 'stopwatch', name: 'Stopwatch', category: 'date', icon: 'fa-stopwatch', desc: 'Precise stopwatch with lap tracking.', page: 'stopwatch-index.html', popular: true },
    { id: 'pomodoro', name: 'Pomodoro Timer', category: 'date', icon: 'fa-clock', desc: 'Boost productivity with 25-minute Pomodoro sessions.', page: 'pomodoro-index.html', popular: true },
   
    // ============ FINANCE ============
    { id: 'currency-conv', name: 'Currency Converter', category: 'finance', icon: 'fa-money-bill-transfer', desc: 'Convert between 150+ world currencies.', page: 'currency-index.html', popular: true },
    { id: 'profit-loss', name: 'Profit/Loss Calculator', category: 'finance', icon: 'fa-chart-line', desc: 'Calculate profit, loss & percentage with ease.', page: 'profitloss-index.html', popular: true },
    { id: 'tip-calc', name: 'Tip Calculator', category: 'finance', icon: 'fa-receipt', desc: 'Calculate tip & split bills among friends.', page: 'tip-index.html', popular: true },
    { id: 'loan-emi', name: 'Loan/EMI Calculator', category: 'finance', icon: 'fa-building-columns', desc: 'Calculate loan EMI with interest breakdown.', page: 'emi-index.html', popular: true },
   { id: 'simple-interest', name: 'Simple Interest Calculator', category: 'finance', icon: 'fa-percent', desc: 'Calculate simple interest on loans & investments.', page: 'simpleinterest-index.html', popular: true },
    { id: 'compound-interest', name: 'Compound Interest Calculator', category: 'finance', icon: 'fa-chart-line', desc: 'Calculate compound interest over time.', page: 'compound-index.html', popular: true },
];

// ============ STATE ============
let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'popular';
let currentView = 'grid';
let favorites = JSON.parse(localStorage.getItem('toolhub_favorites')) || [];
let filteredTools = [];

// ============ DOM ELEMENTS ============
const toolsGrid = document.getElementById('tools-grid');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const sortSelect = document.getElementById('sort-select');
const resultsText = document.getElementById('results-text');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const totalToolsCount = document.getElementById('total-tools-count');

// ============ CATEGORY META ============
const CATEGORY_META = {
    text: { name: 'Text', icon: 'fa-font', color: 'text' },
    calc: { name: 'Calculator', icon: 'fa-calculator', color: 'calc' },
    dev: { name: 'Developer', icon: 'fa-code', color: 'dev' },
    image: { name: 'Image', icon: 'fa-image', color: 'image' },
    gen: { name: 'Generator', icon: 'fa-wand-magic-sparkles', color: 'gen' },
    date: { name: 'Date & Time', icon: 'fa-calendar-day', color: 'date' },
    finance: { name: 'Finance', icon: 'fa-coins', color: 'finance' }
};

// ============ INITIALIZE ============
function init() {
    totalToolsCount.innerText = ALL_TOOLS.length;
    updateCategoryCounts();
    
    // URL query check karein (?q=calculator)
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    if (urlQuery) {
        currentSearch = urlQuery;
        if (searchInput) {
            searchInput.value = urlQuery;
            if (clearSearchBtn) clearSearchBtn.style.display = 'flex';
        }
    }
    
    // Category query check karein (?cat=text)
    const urlCat = params.get('cat');
    if (urlCat && CATEGORY_META[urlCat]) {
        currentCategory = urlCat;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === urlCat);
        });
    }
    
    applyFilters();
    
    // Clean URL
    if (urlQuery || urlCat) {
        window.history.replaceState({}, '', window.location.pathname);
    }
}

// ============ UPDATE CATEGORY COUNTS ============
function updateCategoryCounts() {
    document.getElementById('count-all').innerText = ALL_TOOLS.length;
    ['text', 'calc', 'dev', 'image', 'gen', 'date', 'finance'].forEach(cat => {
        const count = ALL_TOOLS.filter(t => t.category === cat).length;
        const el = document.getElementById('count-' + cat);
        if (el) el.innerText = count;
    });
}

// ============ APPLY FILTERS ============
function applyFilters() {
    let result = [...ALL_TOOLS];

    // Category filter
    if (currentCategory !== 'all') {
        result = result.filter(t => t.category === currentCategory);
    }

    // Search filter
    if (currentSearch.trim()) {
        const q = currentSearch.toLowerCase().trim();
        result = result.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        );
    }

    // Sort
    switch (currentSort) {
        case 'popular':
            result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
            break;
        case 'az':
            result.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'za':
            result.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'newest':
            result.reverse();
            break;
    }

    filteredTools = result;
    renderTools();
}

// ============ RENDER TOOLS ============
function renderTools() {
    // Show/hide no-results
    if (filteredTools.length === 0) {
        toolsGrid.innerHTML = '';
        toolsGrid.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        toolsGrid.style.display = 'grid';
        noResults.style.display = 'none';
        toolsGrid.innerHTML = filteredTools.map(tool => renderToolCard(tool)).join('');
    }

    // Update grid view class
    toolsGrid.classList.toggle('list-view', currentView === 'list');

    // Update results text
    const showingText = filteredTools.length === ALL_TOOLS.length
        ? `Showing all <b>${filteredTools.length}</b> tools`
        : `Showing <b>${filteredTools.length}</b> of ${ALL_TOOLS.length} tools`;
    resultsText.innerHTML = showingText;

    // Show/hide clear filters button
    const hasFilters = currentCategory !== 'all' || currentSearch.trim() || currentSort !== 'popular';
    clearFiltersBtn.style.display = hasFilters ? 'flex' : 'none';
}

// ============ RENDER SINGLE CARD ============
function renderToolCard(tool) {
    const meta = CATEGORY_META[tool.category] || { name: tool.category, color: 'text' };
    const isFav = favorites.includes(tool.id);
    const isComingSoon = !tool.page;

    return `
        <div class="tool-card" onclick="openTool('${tool.id}')">
            <div class="tool-card-top">
                <div class="tool-icon-badge ${meta.color}">
                    <i class="fa-solid ${tool.icon}"></i>
                </div>
                <button class="tool-fav-btn ${isFav ? 'active' : ''}" 
                        onclick="event.stopPropagation(); toggleFavorite('${tool.id}')"
                        title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
            <div class="tool-content">
                <h3>${escapeHtml(tool.name)}</h3>
                <p>${escapeHtml(tool.desc)}</p>
            </div>
            <div class="tool-footer">
                <span class="category-badge">${meta.name}</span>
                <span class="open-btn">
                    ${isComingSoon ? 'Coming Soon <i class="fa-solid fa-clock"></i>' : 'Open <i class="fa-solid fa-arrow-right"></i>'}
                </span>
            </div>
        </div>
    `;
}

// ============ OPEN TOOL ============
function openTool(toolId) {
    const tool = ALL_TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    // Add to history
    addToHistory(tool);

    if (!tool.page) {
        showToast('🚧 Yeh tool abhi ban raha hai!', 'error');
        return;
    }

    window.location.href = tool.page;
}

// ============ HISTORY ============
function addToHistory(tool) {
    let history = JSON.parse(localStorage.getItem('toolhub_history')) || [];
    history = history.filter(h => h.id !== tool.id);
    history.unshift({
        id: tool.id,
        name: tool.name,
        category: tool.category,
        icon: tool.icon,
        page: tool.page,
        time: new Date().toISOString()
    });
    if (history.length > 20) history.pop();
    localStorage.setItem('toolhub_history', JSON.stringify(history));
}

// ============ FAVORITES ============
function toggleFavorite(toolId) {
    const idx = favorites.indexOf(toolId);
    if (idx > -1) {
        favorites.splice(idx, 1);
        showToast('💔 Removed from favorites');
    } else {
        favorites.push(toolId);
        showToast('❤️ Added to favorites');
    }
    localStorage.setItem('toolhub_favorites', JSON.stringify(favorites));
    
    // Re-render just the card
    const card = document.querySelector(`.tool-card[onclick="openTool('${toolId}')"]`);
    if (card) {
        const favBtn = card.querySelector('.tool-fav-btn');
        favBtn.classList.toggle('active', favorites.includes(toolId));
    }
}

// ============ CATEGORY FILTER ============
function filterByCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === cat);
    });
    applyFilters();
    
    // Scroll to top of tools
    window.scrollTo({ top: 250, behavior: 'smooth' });
}

// ============ SEARCH ============
searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    clearSearchBtn.style.display = currentSearch ? 'flex' : 'none';
    
    // Debounce
    clearTimeout(searchInput._debounce);
    searchInput._debounce = setTimeout(() => {
        applyFilters();
    }, 200);
});

function clearSearch() {
    searchInput.value = '';
    currentSearch = '';
    clearSearchBtn.style.display = 'none';
    applyFilters();
    searchInput.focus();
}

// ============ SORT ============
function sortTools() {
    currentSort = sortSelect.value;
    applyFilters();
}

// ============ VIEW TOGGLE ============
function setView(view) {
    currentView = view;
    document.getElementById('view-grid').classList.toggle('active', view === 'grid');
    document.getElementById('view-list').classList.toggle('active', view === 'list');
    toolsGrid.classList.toggle('list-view', view === 'list');
    localStorage.setItem('toolhub_alltools_view', view);
}

// ============ CLEAR FILTERS ============
function clearAllFilters() {
    currentCategory = 'all';
    currentSearch = '';
    currentSort = 'popular';
    
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    sortSelect.value = 'popular';
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === 'all');
    });
    
    applyFilters();
    showToast('🧹 Filters cleared');
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

// ============ SHARE ============
function shareTool() {
    const shareData = {
        title: 'All Tools - Tool Hub',
        text: 'Check out all these free online tools!',
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
    }, 2200);
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

// ============ LOAD SAVED VIEW ============
const savedView = localStorage.getItem('toolhub_alltools_view');
if (savedView === 'list') setView('list');

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // "/" → Focus search
    if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
    // Escape → Clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        clearSearch();
    }
});

// ============ INIT ============
init();
/* ============================================================
   MOBILE TOUCH IMPROVEMENTS (NEW)
   ============================================================ */

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (isTouchDevice) {
    document.body.classList.add('touch-device');

    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });

    document.querySelectorAll('button, .tool-card, .filter-btn').forEach(el => {
        el.addEventListener('touchstart', () => {
            if (navigator.vibrate) navigator.vibrate(10);
        }, { passive: true });
    });
}

// iOS keyboard scroll fix
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
}

// Prevent pull-to-refresh (except in scrollable areas)
let startY = 0;
document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    const y = e.touches[0].pageY;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop === 0 && y > startY) {
        const target = e.target.closest('.category-filter, .search-suggestions');
        if (!target) e.preventDefault();
    }
}, { passive: false });