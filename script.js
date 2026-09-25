// 1. Tools Data (Aapki poori list yahan aayegi)
const toolsData = [
    // Text Tools
    
    { id: 'word-counter', name: 'Word Counter', category: 'text', icon: 'fa-file-word', desc: 'Count words & characters', popular: true },
    { id: 'case-converter', name: 'Case Converter', category: 'text', icon: 'fa-font', desc: 'Uppercase, Lowercase, Title Case' },
    { id: 'remove-spaces', name: 'Remove Extra Spaces', category: 'text', icon: 'fa-eraser', desc: 'Clean up text spaces' },
    // Calculator Tools
    { id: 'basic-calc', name: 'Basic Calculator', category: 'calc', icon: 'fa-calculator', desc: 'Simple arithmetic', popular: true },
    { id: 'age-calc', name: 'Age Calculator', category: 'calc', icon: 'fa-cake-candles', desc: 'Calculate your age' },
    { id: 'bmi-calc', name: 'BMI Calculator', category: 'calc', icon: 'fa-weight-scale', desc: 'Check your BMI' },
    // Developer Tools
    { id: 'json-formatter', name: 'JSON Formatter', category: 'dev', icon: 'fa-code', desc: 'Format & Validate JSON', popular: true },
    { id: 'base64', name: 'Base64 Encoder/Decoder', category: 'dev', icon: 'fa-lock', desc: 'Encode/Decode Base64' },
    { id: 'uuid-gen', name: 'UUID Generator', category: 'dev', icon: 'fa-fingerprint', desc: 'Generate unique IDs' },
    // Image Tools
    { id: 'img-compressor', name: 'Image Compressor', category: 'image', icon: 'fa-image', desc: 'Compress images online', popular: true },
    { id: 'img-resizer', name: 'Image Resizer', category: 'image', icon: 'fa-expand', desc: 'Resize images' },
    // Generator Tools
    { id: 'pass-gen', name: 'Password Generator', category: 'gen', icon: 'fa-key', desc: 'Strong passwords', popular: true },
    { id: 'qr-gen', name: 'QR Code Generator', category: 'gen', icon: 'fa-qrcode', desc: 'Create QR codes', popular: true },
    { id: 'color-palette', name: 'Color Palette Generator', category: 'gen', icon: 'fa-palette', desc: 'Beautiful color palettes', popular: true },
    // Date & Time
    { id: 'world-clock', name: 'World Clock', category: 'date', icon: 'fa-globe', desc: 'Check time worldwide' },
    { id: 'stopwatch', name: 'Stopwatch', category: 'date', icon: 'fa-stopwatch', desc: 'Track time' },
    // Finance
    { id: 'currency-conv', name: 'Currency Converter', category: 'finance', icon: 'fa-money-bill-transfer', desc: 'Convert currencies' },
    { id: 'emi-calc', name: 'EMI/Loan Calculator', category: 'finance', icon: 'fa-building-columns', desc: 'Calculate EMI' }
];

// 2. State Management (Favorites & History)
let favorites = JSON.parse(localStorage.getItem('toolhub_favorites')) || [];
let history = JSON.parse(localStorage.getItem('toolhub_history')) || [];

// ============ CATEGORY INFO (Add this ABOVE renderPopularTools) ============
const CATEGORY_INFO = {
    text:    { name: 'Text',        icon: 'fa-font' },
    calc:    { name: 'Calculator',  icon: 'fa-calculator' },
    dev:     { name: 'Developer',   icon: 'fa-code' },
    image:   { name: 'Image',       icon: 'fa-image' },
    gen:     { name: 'Generator',   icon: 'fa-wand-magic-sparkles' },
    date:    { name: 'Date & Time', icon: 'fa-calendar-day' },
    finance: { name: 'Finance',     icon: 'fa-coins' }
};

// ============ RENDER TOOL CARD (Universal) ============
function renderToolCard(tool) {
    const isFav = window.FavoritesManager ? FavoritesManager.has(tool.id) : favorites.includes(tool.id);
    const catInfo = CATEGORY_INFO[tool.category] || { name: tool.category, icon: 'fa-tools' };
    
    return `
        <div class="tool-card" onclick="openTool('${tool.id}')">
            <div class="tool-card-top">
                <div class="tool-icon-badge ${tool.category}">
                    <i class="fa-solid ${tool.icon}"></i>
                </div>
                <button class="tool-fav-btn ${isFav ? 'active' : ''}" 
                        data-fav-id="${tool.id}"
                        onclick="event.stopPropagation(); toggleFavoriteFromList('${tool.id}', this)">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
            <div class="tool-content">
                <h3>${tool.name}</h3>
                <p>${tool.desc}</p>
            </div>
            <div class="tool-footer">
                <span class="category-badge ${tool.category}">
                    <i class="fa-solid ${catInfo.icon}"></i> ${catInfo.name}
                </span>
                <span class="open-btn">
                    Open <i class="fa-solid fa-arrow-right"></i>
                </span>
            </div>
        </div>
    `;
}

// ============ RENDER POPULAR TOOLS ============
function renderPopularTools() {
    const grid = document.getElementById('popular-tools-grid');
    if (!grid) return;
    
    const popular = toolsData.filter(t => t.popular);
    grid.innerHTML = popular.map(tool => renderToolCard(tool)).join('');
    
    // Reset section title
    updateSectionTitle('🔥 Popular Tools', 'alltools-index.html');
}

function openTool(toolId) {
    const tool = toolsData.find(t => t.id === toolId);
    if (!tool) return;

    // Add to history via manager
    if (window.HistoryManager) {
        HistoryManager.add(tool);
    } else {
        // Fallback
        addToHistory(tool);
    }

    // ============ TOOL REDIRECTS ============
    const toolPages = {
        'word-counter': 'word-index.html',
        'basic-calc': 'calc-index.html',
        'json-formatter': 'json-index.html',
        'img-compressor': 'imgcomp-index.html',
        'pass-gen': 'passgen-index.html',
        'qr-gen': 'qr-index.html',
        'color-palette': 'colorgen-index.html',
        'case-converter': 'case-index.html',
        'age-calc': 'age-index.html',
        'bmi-calc': 'bmi-index.html',
        'base64': 'base64-index.html',
        'uuid-gen': 'uuid-index.html',
        'img-resizer': 'imgresizer-index.html',
        'world-clock': 'worldclock-index.html',
        'stopwatch': 'stopwatch-index.html',
        'currency-conv': 'currency-index.html',
        'emi-calc': 'emi-index.html'
    };

    if (toolPages[toolId]) {
        window.location.href = toolPages[toolId];
        return;
    }

    // Fallback
    document.getElementById('home-section').style.display = 'none';
    document.getElementById('tool-view-section').style.display = 'block';
    document.getElementById('current-tool-name').innerText = tool.name;
    
    const container = document.getElementById('tool-container');
    container.innerHTML = `
        <div style="background: var(--card-bg); padding: 30px; border-radius: 12px; border: 1px solid var(--border); text-align: center;">
            <h2>${tool.name}</h2>
            <p>Yeh tool abhi banaya ja raha hai. Iska code yahan aayega.</p>
        </div>
    `;
}

// 5. Show Section (Home, All Tools, Favorites, History)
function showSection(section) {
    document.getElementById('home-section').style.display = 'none';
    document.getElementById('tool-view-section').style.display = 'none';
    
    if (section === 'home') {
        document.getElementById('home-section').style.display = 'block';
        renderPopularTools();
    } else if (section === 'favorites') {
        // Render Favorites (Logic baad mein)
        document.getElementById('home-section').style.display = 'block';
        // Filter grid logic here...
        showToast('Favorites section coming soon!');
    } else if (section === 'history') {
        showToast('History section coming soon!');
    }
    
    // Sidebar active class update
    document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
    event.target.classList.add('active');
}

// ============ FILTER CATEGORY (Fully Working) ============
function filterCategory(category) {
    // Show home section
    const homeSection = document.getElementById('home-section');
    const toolViewSection = document.getElementById('tool-view-section');
    if (homeSection) homeSection.style.display = 'block';
    if (toolViewSection) toolViewSection.style.display = 'none';

    // Reset main sidebar nav active state
    document.querySelectorAll('.sidebar > nav ul li').forEach(li => li.classList.remove('active'));

    // Filter tools by category
    const filtered = toolsData.filter(t => t.category === category);
    const catInfo = CATEGORY_INFO[category];

    // Render
    const grid = document.getElementById('popular-tools-grid');
    if (!grid) return;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-category">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No tools in this category yet</h3>
                <p>Coming soon!</p>
            </div>
        `;
    } else {
        grid.innerHTML = filtered.map(tool => renderToolCard(tool)).join('');
    }

    // Update section title
    updateSectionTitle(
        `<i class="fa-solid ${catInfo.icon}"></i> ${catInfo.name} Tools (${filtered.length})`,
        `alltools-index.html?cat=${category}`,
        category
    );

    // Update active state in sidebar
    document.querySelectorAll('.categories ul li').forEach(li => {
        li.classList.toggle('active', li.dataset.category === category);
    });

    // Scroll to grid
    setTimeout(() => {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Toast
    showToast(`📂 ${catInfo.name} Tools`);
}

// ============ UPDATE SECTION TITLE ============
function updateSectionTitle(titleHTML, viewAllHref, category = null) {
    const sectionTitle = document.querySelector('#home-section .section-title');
    if (!sectionTitle) return;

    sectionTitle.innerHTML = `
        <h2>${titleHTML}</h2>
        <div class="section-title-actions">
            ${category ? `<button class="back-to-popular-btn" onclick="resetToPopular()">
                <i class="fa-solid fa-rotate-left"></i> Back
            </button>` : ''}
            <a href="${viewAllHref}">View All →</a>
        </div>
    `;
}

// ============ RESET TO POPULAR ============
function resetToPopular() {
    // Clear active states
    document.querySelectorAll('.categories ul li').forEach(li => li.classList.remove('active'));

    // Render popular
    renderPopularTools();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Toast
    showToast('🔥 Showing Popular Tools');
}

// ============ UPDATE CATEGORY COUNTS ============
function updateSidebarCategoryCounts() {
    Object.keys(CATEGORY_INFO).forEach(cat => {
        const count = toolsData.filter(t => t.category === cat).length;
        const el = document.getElementById('cat-count-' + cat);
        if (el) {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    });
}

// 7. Add to History
function addToHistory(tool) {
    history = history.filter(h => h.id !== tool.id); // Remove duplicate
    history.unshift({ id: tool.id, name: tool.name, time: new Date().toLocaleTimeString() });
    if (history.length > 10) history.pop(); // Keep only last 10
    localStorage.setItem('toolhub_history', JSON.stringify(history));
}

// 8. Toast Notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// 9. Share Tool
function shareTool(toolName) {
    if (navigator.share) {
        navigator.share({ title: toolName, url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
    }
}

// 10. Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
});

// Check saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', () => {
    renderPopularTools();
    updateSidebarCategoryCounts();
    console.log('✅ Home page loaded');
});/* ============================================================
   MOBILE TOUCH IMPROVEMENTS (NEW)
   ============================================================ */

// Detect touch device
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (isTouchDevice) {
    document.body.classList.add('touch-device');

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Haptic feedback on tap
    document.querySelectorAll('button, .tool-card, .cat-card').forEach(el => {
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

// Prevent pull-to-refresh
let startY = 0;
document.addEventListener('touchstart', (e) => {
    startY = e.touches[0].pageY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    const y = e.touches[0].pageY;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (scrollTop === 0 && y > startY) {
        const target = e.target.closest('.sidebar, .category-filter, .sidebar nav ul, .categories ul');
        if (!target) e.preventDefault();
    }
}, { passive: false });