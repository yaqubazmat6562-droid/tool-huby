/* ============================================================
   TOOL HUB - PWA INITIALIZATION
   Service Worker Registration + Install Prompt
   ============================================================ */

(function() {
    'use strict';

    // ============ 1. SERVICE WORKER REGISTER ============
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then((registration) => {
                    console.log('✅ [PWA] Service Worker registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('[PWA] New Service Worker found');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.error('❌ [PWA] Service Worker registration failed:', error);
                });
        });
    }

    // ============ 2. INSTALL PROMPT (Add to Home Screen) ============
    let deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[PWA] Install prompt available');
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install button
        if (installBtn) {
            installBtn.style.display = 'flex';
            installBtn.addEventListener('click', handleInstallClick);
        }
    });

    function handleInstallClick() {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('[PWA] User accepted install');
                showToast('🎉 App installed successfully!');
            } else {
                console.log('[PWA] User dismissed install');
            }
            deferredPrompt = null;
            if (installBtn) installBtn.style.display = 'none';
        });
    }

    // ============ 3. APP INSTALLED ============
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed');
        showToast('✅ Tool Hub installed!');
        if (installBtn) installBtn.style.display = 'none';
        deferredPrompt = null;
    });

    // ============ 4. DETECT STANDALONE MODE ============
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                      || window.navigator.standalone 
                      || document.referrer.includes('android-app://');
    
    if (isStandalone) {
        console.log('[PWA] Running in standalone mode');
        document.body.classList.add('pwa-mode');
    }

    // ============ 5. UPDATE NOTIFICATION ============
    function showUpdateNotification() {
        const updateBar = document.createElement('div');
        updateBar.className = 'pwa-update-bar';
        updateBar.innerHTML = `
            <i class="fa-solid fa-rotate"></i>
            <span>New version available!</span>
            <button onclick="window.location.reload()">Update</button>
        `;
        document.body.appendChild(updateBar);
        
        setTimeout(() => updateBar.classList.add('show'), 100);
    }

    // ============ 6. ONLINE/OFFLINE STATUS ============
    window.addEventListener('online', () => {
        console.log('[PWA] Back online');
        showToast('🌐 Back online!');
    });

    window.addEventListener('offline', () => {
        console.log('[PWA] Offline mode');
        showToast('📴 You are offline. Some tools may not work.');
    });

    // ============ 7. TOAST HELPER ============
    function showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        // Handle different toast structures
        const msgEl = toast.querySelector('#toast-message') || toast;
        if (msgEl === toast) {
            toast.textContent = message;
        } else {
            msgEl.textContent = message;
        }
        
        toast.classList.add('show');
        clearTimeout(window._pwaToastTimeout);
        window._pwaToastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ============ 8. PREVENT PULL-TO-REFRESH (App feel) ============
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        
        if (scrollTop === 0 && touchY > touchStartY && isStandalone) {
            e.preventDefault();
        }
    }, { passive: false });

    // ============ 9. DISABLE ZOOM ON DOUBLE TAP (App feel) ============
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    console.log('🚀 [PWA] Initialization complete');
})();