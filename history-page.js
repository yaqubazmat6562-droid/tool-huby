/* ============================================================
   HISTORY PAGE LOGIC
   ============================================================ */

let currentHistoryFilter = 'all';

function renderHistoryPage() {
    const grid = document.getElementById('history-grid');
    const empty = document.getElementById('history-empty');
    const countEl = document.getElementById('history-total-count');
    const clearBtn = document.getElementById('clear-history-btn');
    const controls = document.getElementById('history-controls');

    if (!grid) return;

    let historyTools = HistoryManager.getTools();

    // Apply filter
    if (currentHistoryFilter !== 'all') {
        historyTools = filterByTime(historyTools, currentHistoryFilter);
    }

    const totalCount = HistoryManager.count();
    countEl.textContent = totalCount;

    if (historyTools.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        empty.style.display = 'block';
        clearBtn.style.display = 'none';
        controls.style.display = 'none';
    } else {
        grid.style.display = 'grid';
        empty.style.display = 'none';
        clearBtn.style.display = 'inline-flex';
        controls.style.display = 'block';

        grid.innerHTML = historyTools.map(tool => 
            renderToolCardUniversal(tool, {
                showRemove: true,
                removeAction: 'removeFromHistory'
            })
        ).join('');
    }
}

// ============ FILTER BY TIME ============
function filterByTime(tools, filter) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return tools.filter(tool => {
        const date = new Date(tool.openedAt);
        
        switch (filter) {
            case 'today':
                return date >= startOfDay;
            case 'week':
                return date >= startOfWeek;
            case 'month':
                return date >= startOfMonth;
            default:
                return true;
        }
    });
}

// ============ FILTER HISTORY ============
function filterHistory(filter) {
    currentHistoryFilter = filter;
    
    document.querySelectorAll('.history-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderHistoryPage();
}

// ============ SHARE ============
function sharePage() {
    const shareData = {
        title: 'My History - Tool Hub',
        text: 'Check out my recently used tools!',
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
window.addEventListener('historyUpdated', renderHistoryPage);

// ============ INIT ============
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHistoryPage);
} else {
    renderHistoryPage();
}