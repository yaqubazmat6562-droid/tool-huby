/* ============================================================
   IMAGE COMPRESSOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let images = []; // Array of image objects
let imageIdCounter = 0;

// ============ DOM ELEMENTS ============
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const settingsPanel = document.getElementById('settings-panel');
const overallStats = document.getElementById('overall-stats');
const imagesGrid = document.getElementById('images-grid');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const widthSlider = document.getElementById('width-slider');
const widthValue = document.getElementById('width-value');
const formatSelect = document.getElementById('format-select');
const downloadAllBtn = document.getElementById('download-all-btn');
const downloadCount = document.getElementById('download-count');

// Stats elements
const statTotalImages = document.getElementById('stat-total-images');
const statOriginalSize = document.getElementById('stat-original-size');
const statCompressedSize = document.getElementById('stat-compressed-size');
const statSaved = document.getElementById('stat-saved');

// ============ FILE HANDLING ============
uploadArea.addEventListener('click', (e) => {
    if (e.target.closest('.upload-content .btn') || 
        e.target.closest('.browse-link') || 
        e.target === uploadArea) {
        fileInput.click();
    }
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
});

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// ============ HANDLE FILES ============
function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        if (!file.type.startsWith('image/')) {
            showToast(`❌ "${file.name}" is not an image!`, 'error');
            return false;
        }
        if (file.size > 20 * 1024 * 1024) {
            showToast(`❌ "${file.name}" is larger than 20MB!`, 'error');
            return false;
        }
        return true;
    });

    if (validFiles.length === 0) return;

    validFiles.forEach(file => {
        const imgObj = {
            id: ++imageIdCounter,
            file: file,
            originalUrl: URL.createObjectURL(file),
            compressedUrl: null,
            compressedBlob: null,
            originalSize: file.size,
            compressedSize: 0,
            width: 0,
            height: 0,
            status: 'pending'
        };
        images.push(imgObj);
    });

    renderImages();
    updateOverallStats();
    settingsPanel.style.display = 'block';
    showToast(`✅ ${validFiles.length} image(s) added!`);
    
    // Auto-scroll to settings
    if (images.length === validFiles.length) {
        setTimeout(() => {
            settingsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// ============ RENDER IMAGES ============
function renderImages() {
    if (images.length === 0) {
        imagesGrid.innerHTML = '';
        settingsPanel.style.display = 'none';
        overallStats.style.display = 'none';
        return;
    }

    imagesGrid.innerHTML = images.map(img => renderImageCard(img)).join('');

    // Load dimensions
    images.forEach(img => {
        if (img.width === 0) {
            const imageEl = new Image();
            imageEl.onload = () => {
                img.width = imageEl.naturalWidth;
                img.height = imageEl.naturalHeight;
                const dimEl = document.querySelector(`[data-id="${img.id}"] .dimensions`);
                if (dimEl) dimEl.innerText = `${img.width} × ${img.height}`;
            };
            imageEl.src = img.originalUrl;
        }
    });
}

function renderImageCard(img) {
    const statusMap = {
        pending: { text: 'Ready', class: 'pending', icon: 'fa-clock' },
        compressing: { text: 'Compressing', class: 'compressing', icon: 'fa-spinner' },
        done: { text: 'Done', class: 'done', icon: 'fa-check' },
        error: { text: 'Error', class: 'error', icon: 'fa-times' }
    };
    const st = statusMap[img.status];

    // Size comparison
    const originalKB = formatBytes(img.originalSize);
    const compressedKB = img.compressedSize ? formatBytes(img.compressedSize) : '—';
    const savedPercent = img.compressedSize && img.originalSize
        ? Math.round((1 - img.compressedSize / img.originalSize) * 100)
        : 0;
    const savedLabel = img.compressedSize
        ? (savedPercent > 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`)
        : '—';
    const savedClass = img.compressedSize
        ? (savedPercent > 0 ? '' : 'bad')
        : '';

    // Preview: compare slider if compressed, else original
    let previewHtml;
    if (img.compressedUrl && img.status === 'done') {
        previewHtml = `
            <div class="compare-container" data-id="${img.id}">
                <img class="compare-before" src="${img.originalUrl}" alt="before">
                <img class="compare-after" src="${img.compressedUrl}" alt="after">
                <div class="compare-handle"></div>
                <div class="compare-labels">
                    <span class="compare-label">Before</span>
                    <span class="compare-label">After</span>
                </div>
            </div>
        `;
    } else {
        previewHtml = `<img src="${img.originalUrl}" alt="${escapeHtml(img.file.name)}">`;
    }

    return `
        <div class="image-card" data-id="${img.id}">
            <div class="card-preview">
                ${previewHtml}
                <div class="status-badge ${st.class}">
                    ${img.status === 'compressing' 
                        ? '<span class="spinner"></span>' 
                        : `<i class="fa-solid ${st.icon}"></i>`}
                    ${st.text}
                </div>
            </div>
            <div class="card-info">
                <div class="card-filename">
                    <i class="fa-solid fa-image"></i>
                    <span title="${escapeHtml(img.file.name)}">${escapeHtml(truncate(img.file.name, 30))}</span>
                </div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:10px;">
                    <i class="fa-solid fa-expand"></i> 
                    <span class="dimensions">${img.width || '...'} × ${img.height || '...'}</span>
                </div>
                <div class="size-compare">
                    <div class="size-item">
                        <div class="label">Original</div>
                        <div class="value">${originalKB}</div>
                    </div>
                    <div class="size-item">
                        <div class="label">Compressed</div>
                        <div class="value">${compressedKB}</div>
                    </div>
                    <div class="size-item saved ${savedClass}">
                        <div class="label">Saved</div>
                        <div class="value">${savedLabel}</div>
                    </div>
                </div>
                ${img.status === 'compressing' ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 70%"></div>
                    </div>
                ` : ''}
                <div class="card-actions">
                    <button class="btn-download" onclick="downloadImage(${img.id})" 
                        ${img.status !== 'done' ? 'disabled' : ''}>
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                    <button class="btn-delete" onclick="deleteImage(${img.id})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============ COMPARE SLIDER INTERACTION ============
document.addEventListener('mousemove', handleCompareMove);
document.addEventListener('touchmove', handleCompareMove, { passive: false });

function handleCompareMove(e) {
    const containers = document.querySelectorAll('.compare-container');
    containers.forEach(container => {
        const rect = container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        
        if (clientX >= rect.left && clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
            
            if (e.type === 'mousemove' || (e.buttons === 1 && e.type === 'touchmove')) {
                const percent = ((clientX - rect.left) / rect.width) * 100;
                const clamped = Math.max(0, Math.min(100, percent));
                const afterImg = container.querySelector('.compare-after');
                const handle = container.querySelector('.compare-handle');
                if (afterImg && handle) {
                    afterImg.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
                    handle.style.left = clamped + '%';
                }
            }
        }
    });
}

// Touch support for handle drag
document.addEventListener('touchstart', (e) => {
    const handle = e.target.closest('.compare-handle');
    if (handle) {
        handle.dataset.active = 'true';
    }
});

// ============ COMPRESS ALL ============
async function compressAll() {
    if (images.length === 0) {
        showToast('❌ No images to compress!', 'error');
        return;
    }

    const quality = parseInt(qualitySlider.value) / 100;
    const maxWidth = parseInt(widthSlider.value);
    const format = formatSelect.value;

    showToast('⏳ Compressing images...');

    // Process one by one
    for (const img of images) {
        if (img.status === 'done' && img.compressedUrl) {
            // Revoke old compressed URL
            URL.revokeObjectURL(img.compressedUrl);
        }

        img.status = 'compressing';
        updateSingleCard(img);
        await sleep(50); // Small delay for UI update

        try {
            const result = await compressImage(img.file, quality, maxWidth, format);
            img.compressedBlob = result.blob;
            img.compressedUrl = URL.createObjectURL(result.blob);
            img.compressedSize = result.blob.size;
            img.width = result.width;
            img.height = result.height;
            img.status = 'done';
        } catch (err) {
            console.error(err);
            img.status = 'error';
        }

        updateSingleCard(img);
        updateOverallStats();
    }

    const doneCount = images.filter(i => i.status === 'done').length;
    showToast(`✅ ${doneCount} image(s) compressed!`);
}

// ============ COMPRESS IMAGE (Core Logic) ============
function compressImage(file, quality, maxWidth, format) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // Calculate new dimensions
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(width);
                    canvas.height = Math.round(height);
                    
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Fill white background for JPEG (PNG transparency becomes black)
                    let outputFormat = format;
                    if (format === 'original') {
                        outputFormat = file.type.split('/')[1] || 'jpeg';
                        if (outputFormat === 'jpg') outputFormat = 'jpeg';
                    }
                    
                    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Convert to blob
                    const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : `image/${outputFormat}`;
                    
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Compression failed'));
                            return;
                        }
                        resolve({
                            blob: blob,
                            width: canvas.width,
                            height: canvas.height
                        });
                    }, mimeType, quality);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// ============ UPDATE SINGLE CARD ============
function updateSingleCard(img) {
    const card = document.querySelector(`.image-card[data-id="${img.id}"]`);
    if (!card) return;

    // Update status badge
    const statusMap = {
        pending: { text: 'Ready', class: 'pending', icon: 'fa-clock' },
        compressing: { text: 'Compressing', class: 'compressing', icon: 'fa-spinner' },
        done: { text: 'Done', class: 'done', icon: 'fa-check' },
        error: { text: 'Error', class: 'error', icon: 'fa-times' }
    };
    const st = statusMap[img.status];
    const badge = card.querySelector('.status-badge');
    badge.className = `status-badge ${st.class}`;
    badge.innerHTML = img.status === 'compressing'
        ? '<span class="spinner"></span> Compressing'
        : `<i class="fa-solid ${st.icon}"></i> ${st.text}`;

    // Update preview
    const preview = card.querySelector('.card-preview');
    if (img.status === 'done' && img.compressedUrl) {
        preview.innerHTML = `
            <div class="compare-container" data-id="${img.id}">
                <img class="compare-before" src="${img.originalUrl}" alt="before">
                <img class="compare-after" src="${img.compressedUrl}" alt="after">
                <div class="compare-handle"></div>
                <div class="compare-labels">
                    <span class="compare-label">Before</span>
                    <span class="compare-label">After</span>
                </div>
            </div>
            <div class="status-badge ${st.class}">
                <i class="fa-solid ${st.icon}"></i> ${st.text}
            </div>
        `;
    }

    // Update size compare
    const sizeCompare = card.querySelector('.size-compare');
    const originalKB = formatBytes(img.originalSize);
    const compressedKB = img.compressedSize ? formatBytes(img.compressedSize) : '—';
    const savedPercent = img.compressedSize && img.originalSize
        ? Math.round((1 - img.compressedSize / img.originalSize) * 100)
        : 0;
    const savedLabel = img.compressedSize
        ? (savedPercent > 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`)
        : '—';
    const savedClass = img.compressedSize
        ? (savedPercent > 0 ? '' : 'bad')
        : '';

    sizeCompare.innerHTML = `
        <div class="size-item">
            <div class="label">Original</div>
            <div class="value">${originalKB}</div>
        </div>
        <div class="size-item">
            <div class="label">Compressed</div>
            <div class="value">${compressedKB}</div>
        </div>
        <div class="size-item saved ${savedClass}">
            <div class="label">Saved</div>
            <div class="value">${savedLabel}</div>
        </div>
    `;

    // Update download button
    const downloadBtn = card.querySelector('.btn-download');
    downloadBtn.disabled = img.status !== 'done';

    // Update dimensions
    const dimEl = card.querySelector('.dimensions');
    if (dimEl) dimEl.innerText = `${img.width} × ${img.height}`;
}

// ============ UPDATE OVERALL STATS ============
function updateOverallStats() {
    if (images.length === 0) {
        overallStats.style.display = 'none';
        return;
    }

    overallStats.style.display = 'grid';
    
    const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0);
    const totalCompressed = images.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
    const doneImages = images.filter(i => i.status === 'done');
    const savedPercent = totalCompressed > 0
        ? Math.round((1 - totalCompressed / totalOriginal) * 100)
        : 0;

    statTotalImages.innerText = images.length;
    statOriginalSize.innerText = formatBytes(totalOriginal);
    statCompressedSize.innerText = totalCompressed > 0 ? formatBytes(totalCompressed) : '—';
    statSaved.innerText = totalCompressed > 0 
        ? (savedPercent > 0 ? `-${savedPercent}%` : `+${Math.abs(savedPercent)}%`)
        : '0%';

    // Update download all button
    const readyCount = doneImages.length;
    downloadCount.innerText = readyCount;
    downloadAllBtn.disabled = readyCount === 0;
}

// ============ DOWNLOAD SINGLE IMAGE ============
function downloadImage(id) {
    const img = images.find(i => i.id === id);
    if (!img || !img.compressedBlob) return;

    const ext = getExtension(img.compressedBlob.type);
    const baseName = img.file.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-compressed.${ext}`;

    const url = URL.createObjectURL(img.compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    showToast(`📥 ${filename} downloaded!`);
}

// ============ DOWNLOAD ALL ============
async function downloadAll() {
    const doneImages = images.filter(i => i.status === 'done' && i.compressedBlob);
    if (doneImages.length === 0) {
        showToast('❌ No compressed images to download!', 'error');
        return;
    }

    showToast(`⏳ Downloading ${doneImages.length} images...`);
    
    for (let i = 0; i < doneImages.length; i++) {
        const img = doneImages[i];
        const ext = getExtension(img.compressedBlob.type);
        const baseName = img.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}-compressed.${ext}`;
        
        const url = URL.createObjectURL(img.compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        // Small delay between downloads
        await sleep(300);
    }
    
    showToast(`✅ ${doneImages.length} image(s) downloaded!`);
}

// ============ DELETE IMAGE ============
function deleteImage(id) {
    const img = images.find(i => i.id === id);
    if (!img) return;

    // Revoke URLs
    if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
    if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);

    images = images.filter(i => i.id !== id);
    renderImages();
    updateOverallStats();
    showToast('🗑️ Image removed!');
}

// ============ CLEAR ALL ============
function clearAllImages() {
    if (images.length === 0) {
        showToast('❌ No images to clear!', 'error');
        return;
    }

    if (!confirm(`Kya aap ${images.length} images sab clear karna chahte hain?`)) return;

    images.forEach(img => {
        if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
    });

    images = [];
    renderImages();
    updateOverallStats();
    showToast('🧹 All images cleared!');
}

// ============ PRESETS ============
function applyPreset(type) {
    // Update active state
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    switch (type) {
        case 'light':
            qualitySlider.value = 90;
            widthSlider.value = 2560;
            formatSelect.value = 'jpeg';
            break;
        case 'balanced':
            qualitySlider.value = 80;
            widthSlider.value = 1920;
            formatSelect.value = 'jpeg';
            break;
        case 'aggressive':
            qualitySlider.value = 60;
            widthSlider.value = 1280;
            formatSelect.value = 'webp';
            break;
    }

    updateSliderDisplay();
    showToast(`✨ Preset applied: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
}

// ============ SLIDER DISPLAY ============
function updateSliderDisplay() {
    qualityValue.innerText = qualitySlider.value + '%';
    widthValue.innerText = widthSlider.value + 'px';
}

qualitySlider.addEventListener('input', updateSliderDisplay);
widthSlider.addEventListener('input', updateSliderDisplay);

// ============ HELPERS ============
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

function getExtension(mimeType) {
    const map = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    };
    return map[mimeType] || 'jpg';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Image Compressor - Tool Hub',
        text: 'Check out this free Image Compressor tool!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Link copied!');
        }).catch(() => {
            showToast('❌ Could not copy link!', 'error');
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
    }, 2500);
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

// ============ INITIALIZE ============
updateSliderDisplay();