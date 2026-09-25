/* ============================================================
   TOOL HUB - FAVORITES & HISTORY MANAGER
   Universal module - Works on all pages
   ============================================================ */

(function() {
    'use strict';

    // ============ STATE ============
    let favorites = JSON.parse(localStorage.getItem('toolhub_favorites')) || [];
    let history = JSON.parse(localStorage.getItem('toolhub_history')) || [];

    // ============ GET TOOLS DATABASE ============
    function getToolsDB() {
        // Priority: ALL_TOOLS > SEARCH_TOOLS > fallback
        if (typeof ALL_TOOLS !== 'undefined') return ALL_TOOLS;
        if (typeof SEARCH_TOOLS !== 'undefined') return SEARCH_TOOLS;
        if (typeof toolsData !== 'undefined') return toolsData;
        return [];
    }

    // ============ FAVORITES FUNCTIONS ============
    window.FavoritesManager = {
        // Get all favorites
        getAll: () => [...favorites],

        // Get favorites as tool objects
        getTools: () => {
            const db = getToolsDB();
            return favorites
                .map(id => db.find(t => t.id === id))
                .filter(Boolean);
        },

        // Check if tool is favorite
        has: (toolId) => favorites.includes(toolId),

        // Add to favorites
        add: (toolId) => {
            if (!favorites.includes(toolId)) {
                favorites.push(toolId);
                saveFavorites();
                updateBadges();
                return true;
            }
            return false;
        },

        // Remove from favorites
        remove: (toolId) => {
            const idx = favorites.indexOf(toolId);
            if (idx > -1) {
                favorites.splice(idx, 1);
                saveFavorites();
                updateBadges();
                return true;
            }
            return false;
        },

        // Toggle favorite
        toggle: (toolId) => {
            if (favorites.includes(toolId)) {
                FavoritesManager.remove(toolId);
                return false;
            } else {
                FavoritesManager.add(toolId);
                return true;
            }
        },

        // Clear all favorites
        clearAll: () => {
            favorites = [];
            saveFavorites();
            updateBadges();
        },

        // Get count
        count: () => favorites.length
    };

    // ============ HISTORY FUNCTIONS ============
    window.HistoryManager = {
        // Get all history
        getAll: () => [...history],

        // Get history as tool objects with metadata
        getTools: () => {
            const db = getToolsDB();
            return history
                .map(h => {
                    const tool = db.find(t => t.id === h.id);
                    if (!tool) return null;
                    return {
                        ...tool,
                        openedAt: h.time,
                        openedCount: h.count || 1
                    };
                })
                .filter(Boolean);
        },

        // Add to history
        add: (tool) => {
            const existing = history.find(h => h.id === tool.id);
            
            if (existing) {
                // Update time & count
                existing.time = new Date().toISOString();
                existing.count = (existing.count || 1) + 1;
                // Move to top
                history = history.filter(h => h.id !== tool.id);
                history.unshift(existing);
            } else {
                history.unshift({
                    id: tool.id,
                    name: tool.name,
                    category: tool.category,
                    icon: tool.icon,
                    page: tool.page,
                    time: new Date().toISOString(),
                    count: 1
                });
            }
            
            // Keep only last 50
            if (history.length > 50) history = history.slice(0, 50);
            
            saveHistory();
            updateBadges();
        },

        // Remove single item
        remove: (toolId) => {
            history = history.filter(h => h.id !== toolId);
            saveHistory();
            updateBadges();
        },

        // Clear all history
        clearAll: () => {
            history = [];
            saveHistory();
            updateBadges();
        },

        // Get count
        count: () => history.length
    };

    // ============ SAVE TO LOCALSTORAGE ============
    function saveFavorites() {
        localStorage.setItem('toolhub_favorites', JSON.stringify(favorites));
        // Sync with other tabs
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }

    function saveHistory() {
        localStorage.setItem('toolhub_history', JSON.stringify(history));
        window.dispatchEvent(new CustomEvent('historyUpdated'));
    }

    // ============ UPDATE BADGES IN SIDEBAR ============
    function updateBadges() {
        const favBadge = document.getElementById('fav-count-badge');
        const historyBadge = document.getElementById('history-count-badge');
        
        if (favBadge) {
            const count = favorites.length;
            favBadge.textContent = count;
            favBadge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
        
        if (historyBadge) {
            const count = history.length;
            historyBadge.textContent = count;
            historyBadge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }

    // ============ RENDER TOOL CARD (Universal) ============
    function renderToolCard(tool, options = {}) {
        const CATEGORY_META = {
            text: { name: 'Text', icon: 'fa-font', color: 'text' },
            calc: { name: 'Calculator', icon: 'fa-calculator', color: 'calc' },
            dev: { name: 'Developer', icon: 'fa-code', color: 'dev' },
            image: { name: 'Image', icon: 'fa-image', color: 'image' },
            gen: { name: 'Generator', icon: 'fa-wand-magic-sparkles', color: 'gen' },
            date: { name: 'Date & Time', icon: 'fa-calendar-day', color: 'date' },
            finance: { name: 'Finance', icon: 'fa-coins', color: 'finance' }
        };

        const meta = CATEGORY_META[tool.category] || { name: tool.category, color: 'text' };
        const isFav = favorites.includes(tool.id);
        const isComingSoon = !tool.page;

        // Time ago (for history)
        let timeAgo = '';
        if (tool.openedAt) {
            timeAgo = getTimeAgo(tool.openedAt);
        }

        return `
            <div class="tool-card" onclick="openToolFromList('${tool.id}', '${tool.page || ''}')">
                <div class="tool-card-top">
                    <div class="tool-icon-badge ${meta.color}">
                        <i class="fa-solid ${tool.icon}"></i>
                    </div>
                    <button class="tool-fav-btn ${isFav ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleFavoriteFromList('${tool.id}', this)"
                            title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
                <div class="tool-content">
                    <h3>${escapeHtml(tool.name)}</h3>
                    <p>${escapeHtml(tool.desc || '')}</p>
                    ${timeAgo ? `<span class="time-ago"><i class="fa-solid fa-clock"></i> ${timeAgo}</span>` : ''}
                </div>
                <div class="tool-footer">
                    <span class="category-badge">${meta.name}</span>
                    ${options.showRemove ? `
                        <button class="remove-btn" onclick="event.stopPropagation(); ${options.removeAction}('${tool.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : `
                        <span class="open-btn">
                            ${isComingSoon ? 'Coming Soon <i class="fa-solid fa-clock"></i>' : 'Open <i class="fa-solid fa-arrow-right"></i>'}
                        </span>
                    `}
                </div>
            </div>
        `;
    }

    // ============ TIME AGO HELPER ============
    function getTimeAgo(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    }

    // ============ GLOBAL FUNCTIONS (HTML se call) ============
    window.toggleFavoriteFromList = function(toolId, btnElement) {
        const isFav = FavoritesManager.toggle(toolId);
        
        if (btnElement) {
            btnElement.classList.toggle('active', isFav);
        }
        
        // Update all instances of this button on page
        document.querySelectorAll(`[data-fav-id="${toolId}"]`).forEach(btn => {
            btn.classList.toggle('active', isFav);
        });
        
        // Show toast
        if (typeof showToast === 'function') {
            showToast(isFav ? '❤️ Added to favorites' : '💔 Removed from favorites');
        } else {
            showUniversalToast(isFav ? '❤️ Added to favorites' : '💔 Removed from favorites');
        }
    };

    window.openToolFromList = function(toolId, page) {
        const db = getToolsDB();
        const tool = db.find(t => t.id === toolId);
        
        if (tool) {
            HistoryManager.add(tool);
        }
        
        if (page && page !== 'undefined' && page !== '') {
            window.location.href = page;
        } else if (typeof openTool === 'function') {
            openTool(toolId);
        } else {
            showUniversalToast('🚧 Tool coming soon!');
        }
    };

    window.removeFromFavorites = function(toolId) {
        FavoritesManager.remove(toolId);
        if (typeof showToast === 'function') {
            showToast('💔 Removed from favorites');
        }
        // Re-render if on favorites page
        if (typeof renderFavoritesPage === 'function') {
            renderFavoritesPage();
        }
    };

    window.removeFromHistory = function(toolId) {
        HistoryManager.remove(toolId);
        if (typeof showToast === 'function') {
            showToast('🗑️ Removed from history');
        }
        // Re-render if on history page
        if (typeof renderHistoryPage === 'function') {
            renderHistoryPage();
        }
    };

    window.clearAllFavorites = function() {
        if (favorites.length === 0) {
            showUniversalToast('No favorites to clear');
            return;
        }
        
        if (confirm('Clear all favorites? This cannot be undone.')) {
            FavoritesManager.clearAll();
            if (typeof showToast === 'function') {
                showToast('🗑️ All favorites cleared');
            }
            if (typeof renderFavoritesPage === 'function') {
                renderFavoritesPage();
            }
        }
    };

    window.clearAllHistory = function() {
        if (history.length === 0) {
            showUniversalToast('History is already empty');
            return;
        }
        
        if (confirm('Clear all history? This cannot be undone.')) {
            HistoryManager.clearAll();
            if (typeof showToast === 'function') {
                showToast('🗑️ History cleared');
            }
            if (typeof renderHistoryPage === 'function') {
                renderHistoryPage();
            }
        }
    };

    // ============ UNIVERSAL TOAST ============
    function showUniversalToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        const msgEl = toast.querySelector('#toast-message') || toast;
        if (msgEl === toast) {
            toast.textContent = message;
        } else {
            msgEl.textContent = message;
        }
        
        toast.classList.add('show');
        clearTimeout(window._universalToastTimeout);
        window._universalToastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ============ SYNC ACROSS TABS ============
    window.addEventListener('storage', (e) => {
        if (e.key === 'toolhub_favorites') {
            favorites = JSON.parse(e.newValue) || [];
            updateBadges();
            if (typeof renderFavoritesPage === 'function') renderFavoritesPage();
        }
        if (e.key === 'toolhub_history') {
            history = JSON.parse(e.newValue) || [];
            updateBadges();
            if (typeof renderHistoryPage === 'function') renderHistoryPage();
        }
    });

    // ============ UTILITY ============
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ============ EXPOSE HELPERS ============
    window.renderToolCardUniversal = renderToolCard;
    window.getTimeAgo = getTimeAgo;
    window.updateFavHistoryBadges = updateBadges;

    // ============ INIT ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateBadges);
    } else {
        updateBadges();
    }

    console.log('✅ Favorites & History Manager loaded');
})();