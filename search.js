/* ============================================================
   TOOL HUB - UNIVERSAL SEARCH MODULE
   Works on Home page + All Tools page
   ============================================================ */

(function() {
    'use strict';

    // ============ TOOLS DATABASE (Home page ke liye) ============
    // Agar ALL_TOOLS already defined hai toh use karein, warna ye use karein
    const SEARCH_TOOLS = typeof ALL_TOOLS !== 'undefined' ? ALL_TOOLS : [
        { id: 'word-counter', name: 'Word Counter', category: 'text', icon: 'fa-file-word', desc: 'Count words & characters', page: 'word-index.html' },
        { id: 'case-converter', name: 'Case Converter', category: 'text', icon: 'fa-font', desc: 'Uppercase, Lowercase, Title Case', page: 'case-index.html' },
        { id: 'remove-spaces', name: 'Remove Extra Spaces', category: 'text', icon: 'fa-eraser', desc: 'Clean up text spaces', page: 'rmspaces-index.html' },
        { id: 'basic-calc', name: 'Basic Calculator', category: 'calc', icon: 'fa-calculator', desc: 'Simple arithmetic', page: 'calc-index.html' },
        { id: 'age-calc', name: 'Age Calculator', category: 'calc', icon: 'fa-cake-candles', desc: 'Calculate your age', page: 'age-index.html' },
        { id: 'bmi-calc', name: 'BMI Calculator', category: 'calc', icon: 'fa-weight-scale', desc: 'Check your BMI', page: 'bmi-index.html' },
        { id: 'json-formatter', name: 'JSON Formatter', category: 'dev', icon: 'fa-code', desc: 'Format & Validate JSON', page: 'json-index.html' },
        { id: 'base64', name: 'Base64 Encoder/Decoder', category: 'dev', icon: 'fa-lock', desc: 'Encode/Decode Base64', page: 'base64-index.html' },
        { id: 'uuid-gen', name: 'UUID Generator', category: 'dev', icon: 'fa-fingerprint', desc: 'Generate unique IDs', page: 'uuid-index.html' },
        { id: 'img-compressor', name: 'Image Compressor', category: 'image', icon: 'fa-image', desc: 'Compress images online', page: 'imgcomp-index.html' },
        { id: 'img-resizer', name: 'Image Resizer', category: 'image', icon: 'fa-expand', desc: 'Resize images', page: 'imgresizer-index.html' },
        { id: 'pass-gen', name: 'Password Generator', category: 'gen', icon: 'fa-key', desc: 'Strong passwords', page: 'passgen-index.html' },
        { id: 'qr-gen', name: 'QR Code Generator', category: 'gen', icon: 'fa-qrcode', desc: 'Create QR codes', page: 'qr-index.html' },
        { id: 'color-palette', name: 'Color Palette Generator', category: 'gen', icon: 'fa-palette', desc: 'Beautiful color palettes', page: 'colorgen-index.html' },
        { id: 'world-clock', name: 'World Clock', category: 'date', icon: 'fa-globe', desc: 'Check time worldwide', page: 'worldclock-index.html' },
        { id: 'stopwatch', name: 'Stopwatch', category: 'date', icon: 'fa-stopwatch', desc: 'Track time', page: 'stopwatch-index.html' },
        { id: 'currency-conv', name: 'Currency Converter', category: 'finance', icon: 'fa-money-bill-transfer', desc: 'Convert currencies', page: 'currency-index.html' },
        { id: 'emi-calc', name: 'EMI/Loan Calculator', category: 'finance', icon: 'fa-building-columns', desc: 'Calculate EMI', page: 'emi-index.html' }
    ];

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

    // ============ SEARCH STATE ============
    let searchHistory = JSON.parse(localStorage.getItem('toolhub_search_history')) || [];
    let activeSuggestionIndex = -1;
    let currentSuggestions = [];

    // ============ INITIALIZE SEARCH ============
    function initSearch() {
        // Dono search bars ko setup karo
        setupSearchInput('navbar-search', 'navbar-suggestions');
        setupSearchInput('hero-search', 'hero-suggestions');
        
        // Keyboard shortcut: "/" press to focus
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !isInputFocused()) {
                e.preventDefault();
                const input = document.getElementById('navbar-search') || 
                             document.getElementById('hero-search') ||
                             document.getElementById('search-input');
                if (input) {
                    input.focus();
                    input.select();
                }
            }
            
            // Escape to close suggestions
            if (e.key === 'Escape') {
                closeAllSuggestions();
            }
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar') && 
                !e.target.closest('.hero-search') && 
                !e.target.closest('.search-box')) {
                closeAllSuggestions();
            }
        });
    }

    // ============ SETUP SEARCH INPUT ============
    function setupSearchInput(inputId, suggestionsId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        // Create suggestions container if not exists
        let suggestions = document.getElementById(suggestionsId);
        if (!suggestions) {
            suggestions = document.createElement('div');
            suggestions.id = suggestionsId;
            suggestions.className = 'search-suggestions';
            
            // Position relative to input
            const parent = input.parentElement;
            if (parent) {
                parent.style.position = 'relative';
                parent.appendChild(suggestions);
            }
        }

        // Input events
        input.addEventListener('input', debounce((e) => {
            handleSearchInput(e.target.value, suggestions, input);
        }, 150));

        input.addEventListener('focus', (e) => {
            if (e.target.value.trim()) {
                handleSearchInput(e.target.value, suggestions, input);
            } else {
                showRecentSearches(suggestions, input);
            }
        });

        input.addEventListener('keydown', (e) => {
            handleKeyNavigation(e, suggestions, input);
        });

        // Form submit (Enter key)
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = input.value.trim();
                if (query) {
                    saveSearchHistory(query);
                    navigateToSearch(query);
                }
            }
        });
    }

    // ============ HANDLE SEARCH INPUT ============
    function handleSearchInput(query, suggestionsEl, inputEl) {
        query = query.trim().toLowerCase();
        
        if (!query) {
            showRecentSearches(suggestionsEl, inputEl);
            return;
        }

        // Filter tools
        const results = SEARCH_TOOLS.filter(tool => 
            tool.name.toLowerCase().includes(query) ||
            tool.desc.toLowerCase().includes(query) ||
            tool.category.toLowerCase().includes(query)
        ).slice(0, 6); // Max 6 suggestions

        currentSuggestions = results;
        activeSuggestionIndex = -1;

        renderSuggestions(results, query, suggestionsEl, inputEl);
    }

    // ============ RENDER SUGGESTIONS ============
    function renderSuggestions(results, query, suggestionsEl, inputEl) {
        if (results.length === 0) {
            suggestionsEl.innerHTML = `
                <div class="suggestion-empty">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <p>No tools found for "<b>${escapeHtml(query)}</b>"</p>
                    <span>Try: calculator, JSON, image, password</span>
                </div>
            `;
            suggestionsEl.classList.add('show');
            return;
        }

        const html = results.map((tool, idx) => {
            const meta = CATEGORY_META[tool.category] || { name: tool.category, color: 'text' };
            return `
                <div class="suggestion-item" data-index="${idx}" onclick="window.openToolFromSearch('${tool.id}', '${tool.page || ''}')">
                    <div class="suggestion-icon ${meta.color}">
                        <i class="fa-solid ${tool.icon}"></i>
                    </div>
                    <div class="suggestion-content">
                        <div class="suggestion-name">${highlightMatch(tool.name, query)}</div>
                        <div class="suggestion-desc">${escapeHtml(tool.desc)}</div>
                    </div>
                    <span class="suggestion-category">${meta.name}</span>
                </div>
            `;
        }).join('');

        suggestionsEl.innerHTML = `
            <div class="suggestions-header">
                <i class="fa-solid fa-bolt"></i> Suggestions
            </div>
            ${html}
            <div class="suggestions-footer" onclick="window.goToAllToolsSearch('${escapeHtml(query)}')">
                <i class="fa-solid fa-arrow-right"></i> See all results for "<b>${escapeHtml(query)}</b>"
            </div>
        `;
        
        suggestionsEl.classList.add('show');
    }

    // ============ SHOW RECENT SEARCHES ============
    function showRecentSearches(suggestionsEl, inputEl) {
        if (searchHistory.length === 0) {
            suggestionsEl.classList.remove('show');
            return;
        }

        const html = searchHistory.slice(0, 5).map(term => `
            <div class="suggestion-item recent" onclick="window.useRecentSearch('${escapeHtml(term)}')">
                <div class="suggestion-icon recent-icon">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-name">${escapeHtml(term)}</div>
                </div>
                <button class="remove-recent" onclick="event.stopPropagation(); window.removeRecentSearch('${escapeHtml(term)}')">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `).join('');

        suggestionsEl.innerHTML = `
            <div class="suggestions-header">
                <i class="fa-solid fa-clock-rotate-left"></i> Recent Searches
                <button class="clear-history-btn" onclick="window.clearSearchHistory()">Clear</button>
            </div>
            ${html}
        `;
        
        suggestionsEl.classList.add('show');
    }

    // ============ KEYBOARD NAVIGATION ============
    function handleKeyNavigation(e, suggestionsEl, inputEl) {
        const items = suggestionsEl.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
            updateActiveSuggestion(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
            updateActiveSuggestion(items);
        } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            items[activeSuggestionIndex].click();
        }
    }

    function updateActiveSuggestion(items) {
        items.forEach((item, idx) => {
            item.classList.toggle('active', idx === activeSuggestionIndex);
        });
    }

    // ============ NAVIGATE ============
    function navigateToSearch(query) {
        // Agar All Tools page pe hain toh wahi filter karo
        if (document.getElementById('tools-grid') && typeof currentSearch !== 'undefined') {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = query;
                if (typeof applyFilters === 'function') {
                    window.currentSearch = query;
                    applyFilters();
                }
            }
            closeAllSuggestions();
        } else {
            // Warna All Tools page pe redirect karo
            window.location.href = `alltools-index.html?q=${encodeURIComponent(query)}`;
        }
    }

    // ============ GLOBAL FUNCTIONS (HTML se call honge) ============
    window.openToolFromSearch = function(toolId, page) {
        const tool = SEARCH_TOOLS.find(t => t.id === toolId);
        if (tool) {
            saveSearchHistory(tool.name);
            // Add to history
            addToToolHistory(tool);
        }
        
        if (page) {
            window.location.href = page;
        } else if (typeof openTool === 'function') {
            openTool(toolId);
        }
        closeAllSuggestions();
    };

    window.goToAllToolsSearch = function(query) {
        saveSearchHistory(query);
        window.location.href = `alltools-index.html?q=${encodeURIComponent(query)}`;
    };

    window.useRecentSearch = function(query) {
        const input = document.getElementById('navbar-search') || 
                     document.getElementById('hero-search');
        if (input) input.value = query;
        saveSearchHistory(query);
        navigateToSearch(query);
    };

    window.removeRecentSearch = function(query) {
        searchHistory = searchHistory.filter(h => h !== query);
        localStorage.setItem('toolhub_search_history', JSON.stringify(searchHistory));
        const suggestions = document.querySelector('.search-suggestions.show');
        if (suggestions) {
            const input = document.getElementById('navbar-search') || document.getElementById('hero-search');
            showRecentSearches(suggestions, input);
        }
    };

    window.clearSearchHistory = function() {
        searchHistory = [];
        localStorage.setItem('toolhub_search_history', JSON.stringify([]));
        closeAllSuggestions();
        if (typeof showToast === 'function') showToast('🗑️ Search history cleared');
    };

    // ============ HELPERS ============
    function saveSearchHistory(query) {
        query = query.trim();
        if (!query) return;
        searchHistory = searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase());
        searchHistory.unshift(query);
        if (searchHistory.length > 8) searchHistory.pop();
        localStorage.setItem('toolhub_search_history', JSON.stringify(searchHistory));
    }

    function addToToolHistory(tool) {
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

    function highlightMatch(text, query) {
        if (!query) return escapeHtml(text);
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function debounce(fn, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function isInputFocused() {
        const el = document.activeElement;
        return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    }

    function closeAllSuggestions() {
        document.querySelectorAll('.search-suggestions').forEach(el => {
            el.classList.remove('show');
        });
        activeSuggestionIndex = -1;
    }

    // ============ CHECK URL FOR SEARCH QUERY ============
    function checkUrlQuery() {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = q;
                if (typeof applyFilters === 'function') {
                    window.currentSearch = q;
                    setTimeout(() => applyFilters(), 100);
                }
            }
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }

    // ============ INIT ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initSearch();
            checkUrlQuery();
        });
    } else {
        initSearch();
        checkUrlQuery();
    }

})();