/* ============================================================
   FAVORITES PAGE LOGIC
   ============================================================ */

function renderFavoritesPage() {
    const grid = document.getElementById('favorites-grid');
    const empty = document.getElementById('fav-empty');
    const countEl = document.getElementById('fav-total-count');
    const clearBtn = document.getElementById('clear-fav-btn');

    if (!grid) return;

    const favTools = FavoritesManager.getTools();

    countEl.textContent = favTools.length;

    if (favTools.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        empty.style.display = 'block';
        clearBtn.style.display = 'none';
    } else {
        grid.style.display = 'grid';
        empty.style.display = 'none';
        clearBtn.style.display = 'inline-flex';

        grid.innerHTML = favTools.map(tool => 
            renderToolCardUniversal(tool, {
                showRemove: true,
                removeAction: 'removeFromFavorites'
            })
        ).join('');
    }
}

// ============ SHARE ============
function sharePage() {
    const shareData = {
        title: 'My Favorites - Tool Hub',
        text: 'Check out my favorite tools on Tool Hub!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            if (typeof showToast === 'function') showToast('🔗 Link copied!');
        });
    }
}

// ============ LISTEN FOR UPDATES ============
window.addEventListener('favoritesUpdated', renderFavoritesPage);

// ============ INIT ============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFavoritesPage);
} else {
    renderFavoritesPage();
}