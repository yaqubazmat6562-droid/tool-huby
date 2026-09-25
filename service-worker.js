/* ============================================================
   TOOL HUB - SERVICE WORKER
   Offline Support & Caching
   ============================================================ */

const CACHE_VERSION = 'toolhub-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Files jo pehli baar mein cache karni hain
const STATIC_FILES = [
    './',
    './index.html',
    './alltools-index.html',
    './offline.html',
    './style.css',
    './alltools-style.css',
    './script.js',
    './alltools-script.js',
    './pwa-init.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ============ INSTALL EVENT ============
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static files');
                return cache.addAll(STATIC_FILES.map(url => {
                    return new Request(url, { cache: 'reload' });
                })).catch(err => {
                    console.warn('[SW] Some files failed to cache:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// ============ ACTIVATE EVENT ============
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== STATIC_CACHE && 
                        cache !== DYNAMIC_CACHE && 
                        cache !== IMAGE_CACHE) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ============ FETCH EVENT ============
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension & other protocols
    if (!url.protocol.startsWith('http')) return;

    // ===== IMAGES: Cache First =====
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                
                return fetch(request).then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(IMAGE_CACHE).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                }).catch(() => {
                    // Fallback image
                    return caches.match('./icons/icon-192x192.png');
                });
            })
        );
        return;
    }

    // ===== HTML/CSS/JS: Network First, Fallback to Cache =====
    if (request.destination === 'document' || 
        request.destination === 'style' || 
        request.destination === 'script') {
        
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        if (cached) return cached;
                        
                        // Agar HTML document hai toh offline page dikhao
                        if (request.destination === 'document') {
                            return caches.match('./offline.html');
                        }
                    });
                })
        );
        return;
    }

    // ===== BAQI SAB: Cache First, Fallback to Network =====
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            
            return fetch(request).then((response) => {
                const clonedResponse = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(request, clonedResponse);
                });
                return response;
            });
        }).catch(() => {
            return caches.match('./offline.html');
        })
    );
});

// ============ MESSAGE EVENT ============
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============ PUSH NOTIFICATIONS (optional) ============
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Tool Hub';
    const options = {
        body: data.body || 'New update available!',
        icon: './icons/icon-192x192.png',
        badge: './icons/icon-96x96.png',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow('./'));
});