/* ============================================================
   IMAGE TO 4K CONVERTER - Tool Hub
   Advanced Client-Side Image Upscaling
   ============================================================ */

// ============ STATE ============
let currentFile = null;
let originalImage = null;
let resultBlob = null;
let resultUrl = null;
let targetWidth = 3840;
let targetHeight = 2160;
let keepAspect = true;
let quality = 0.95;
let sharpenLevel = 1;
let outputFormat = 'image/jpeg';

// ============ DOM ============
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const editorContainer = document.getElementById('editor-container');
const originalPreview = document.getElementById('original-preview');
const resultPreview = document.getElementById('result-preview');
const resultPlaceholder = document.getElementById('result-placeholder');
const convertBtn = document.getElementById('convert-btn');
const downloadBtn = document.getElementById('download-btn');
const infoSection = document.getElementById('info-section');

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initUploadZone();
    initFileInput();
    initDragDrop();
    initPasteSupport();
});

// ============ UPLOAD ZONE ============
function initUploadZone() {
    uploadZone.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        fileInput.click();
    });
}

function initFileInput() {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });
}

function initDragDrop() {
    ['dragenter', 'dragover'].forEach(evt => {
        uploadZone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        uploadZone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('dragover');
        });
    });

    uploadZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    });
}

function initPasteSupport() {
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) handleFile(file);
                break;
            }
        }
    });
}

// ============ FILE HANDLING ============
function handleFile(file) {
    // Validate
    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select a valid image file', 'error');
        return;
    }

    if (file.size > 25 * 1024 * 1024) {
        showToast('❌ File too large. Max 25 MB', 'error');
        return;
    }

    currentFile = file;

    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            showEditor(file, img);
        };
        img.onerror = () => {
            showToast('❌ Failed to load image', 'error');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showEditor(file, img) {
    // Update preview
    originalPreview.src = img.src;
    
    // Update info
    document.getElementById('original-dim').innerText = `${img.width} × ${img.height}`;
    document.getElementById('original-size').innerText = formatBytes(file.size);
    document.getElementById('original-format').innerText = file.type.split('/')[1].toUpperCase();

    // Auto-set best resolution based on original
    autoSelectResolution(img.width, img.height);

    // Show editor
    uploadZone.style.display = 'none';
    editorContainer.style.display = 'block';
    infoSection.style.display = 'none';

    // Reset result
    resetResult();

    // Smooth scroll
    setTimeout(() => {
        editorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function autoSelectResolution(w, h) {
    // If original is already 4K+, don't force upscale
    if (w >= 3840 || h >= 2160) {
        // Keep 4K selected but warn
        showToast('ℹ️ Your image is already 4K or higher');
    }
}

// ============ SETTINGS ============
function selectResolution(btn, w, h) {
    document.querySelectorAll('.res-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (w === 0 && h === 0) {
        // Custom
        document.getElementById('custom-res').style.display = 'flex';
        targetWidth = parseInt(document.getElementById('custom-width').value);
        targetHeight = parseInt(document.getElementById('custom-height').value);
    } else {
        document.getElementById('custom-res').style.display = 'none';
        targetWidth = w;
        targetHeight = h;
    }
}

// Custom input listeners
document.getElementById('custom-width')?.addEventListener('input', (e) => {
    targetWidth = parseInt(e.target.value) || 3840;
});

document.getElementById('custom-height')?.addEventListener('input', (e) => {
    targetHeight = parseInt(e.target.value) || 2160;
});

function toggleAspect() {
    keepAspect = !keepAspect;
    const toggle = document.getElementById('aspect-toggle');
    toggle.classList.toggle('active', keepAspect);
}

function updateQuality(val) {
    quality = val / 100;
    document.getElementById('quality-value').innerText = val + '%';
}

function updateSharpen(val) {
    sharpenLevel = parseInt(val);
    const labels = ['None', 'Low', 'Medium', 'High'];
    document.getElementById('sharpen-value').innerText = labels[sharpenLevel];
}

function selectFormat(btn, format) {
    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    outputFormat = format;
}

// ============ CONVERT ============
async function convertImage() {
    if (!originalImage) {
        showToast('❌ Please upload an image first', 'error');
        return;
    }

    convertBtn.classList.add('loading');
    convertBtn.disabled = true;
    downloadBtn.disabled = true;

    try {
        // Small delay for UI
        await new Promise(r => setTimeout(r, 300));

        const result = await processImage();

        // Convert to blob
        resultBlob = await new Promise(resolve => {
            result.toBlob(resolve, outputFormat, quality);
        });

        // Show result
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = URL.createObjectURL(resultBlob);
        
        resultPreview.src = resultUrl;
        resultPreview.style.display = 'block';
        resultPlaceholder.style.display = 'none';

        // Update info
        document.getElementById('result-dim').innerText = `${result.width} × ${result.height}`;
        document.getElementById('result-size').innerText = formatBytes(resultBlob.size);
        document.getElementById('result-format').innerText = outputFormat.split('/')[1].toUpperCase();

        // Enable download
        downloadBtn.disabled = false;

        showToast('✅ Converted successfully!');

    } catch (err) {
        console.error(err);
        showToast('❌ Conversion failed. Try a smaller image.', 'error');
    } finally {
        convertBtn.classList.remove('loading');
        convertBtn.disabled = false;
    }
}

// ============ IMAGE PROCESSING ============
async function processImage() {
    const srcW = originalImage.width;
    const srcH = originalImage.height;

    let outW = targetWidth;
    let outH = targetHeight;

    // Handle aspect ratio
    if (keepAspect) {
        const srcRatio = srcW / srcH;
        const targetRatio = outW / outH;

        if (srcRatio > targetRatio) {
            // Source is wider — fit to width
            outH = Math.round(outW / srcRatio);
        } else {
            // Source is taller — fit to height
            outW = Math.round(outH * srcRatio);
        }
    }

    // Cap to max canvas size (browsers have limits ~16384x16384)
    const MAX_DIM = 8000;
    if (outW > MAX_DIM || outH > MAX_DIM) {
        const scale = Math.min(MAX_DIM / outW, MAX_DIM / outH);
        outW = Math.round(outW * scale);
        outH = Math.round(outH * scale);
    }

    // Multi-step upscale for better quality
    const upscaleSteps = calculateUpscaleSteps(srcW, srcH, outW, outH);
    
    let currentCanvas = createCanvas(srcW, srcH);
    let ctx = currentCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImage, 0, 0);

    // Progressive upscaling
    for (let i = 0; i < upscaleSteps.length; i++) {
        const step = upscaleSteps[i];
        const isLast = i === upscaleSteps.length - 1;

        const stepCanvas = createCanvas(step.width, step.height);
        const stepCtx = stepCanvas.getContext('2d');
        stepCtx.imageSmoothingEnabled = true;
        stepCtx.imageSmoothingQuality = 'high';

        // Use multiple passes for very large jumps
        if (step.scaleFactor > 2) {
            // Two-pass
            const midW = Math.round(step.width / Math.sqrt(step.scaleFactor));
            const midH = Math.round(step.height / Math.sqrt(step.scaleFactor));
            const midCanvas = createCanvas(midW, midH);
            const midCtx = midCanvas.getContext('2d');
            midCtx.imageSmoothingEnabled = true;
            midCtx.imageSmoothingQuality = 'high';
            midCtx.drawImage(currentCanvas, 0, 0, midW, midH);
            stepCtx.drawImage(midCanvas, 0, 0, step.width, step.height);
        } else {
            stepCtx.drawImage(currentCanvas, 0, 0, step.width, step.height);
        }

        // Apply sharpening to final step
        if (isLast && sharpenLevel > 0) {
            applySharpen(stepCtx, step.width, step.height, sharpenLevel);
        }

        currentCanvas = stepCanvas;
    }

    return currentCanvas;
}

function calculateUpscaleSteps(srcW, srcH, outW, outH) {
    const steps = [];
    let curW = srcW;
    let curH = srcH;

    // If upscaling by more than 1.5x, do it in steps
    const totalScale = Math.max(outW / srcW, outH / srcH);

    if (totalScale <= 1.5) {
        // Direct
        steps.push({ width: outW, height: outH, scaleFactor: totalScale });
    } else {
        // Step-wise: 1.5x each step until we reach target
        const maxStep = 1.5;
        const numSteps = Math.ceil(Math.log(totalScale) / Math.log(maxStep));

        for (let i = 1; i <= numSteps; i++) {
            const progress = i / numSteps;
            let stepW, stepH;

            if (i === numSteps) {
                stepW = outW;
                stepH = outH;
            } else {
                const scale = Math.pow(totalScale, progress);
                stepW = Math.round(srcW * scale);
                stepH = Math.round(srcH * scale);
            }

            const prevW = i === 1 ? srcW : steps[i - 2].width;
            const scaleFactor = stepW / prevW;

            steps.push({ width: stepW, height: stepH, scaleFactor });
        }
    }

    return steps;
}

// ============ SHARPENING (Convolution) ============
function applySharpen(ctx, w, h, level) {
    // Intensity based on level
    const intensities = {
        0: 0,
        1: 0.3,  // Low
        2: 0.6,  // Medium
        3: 1.0   // High
    };

    const amount = intensities[level] || 0;
    if (amount === 0) return;

    try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const output = new Uint8ClampedArray(data.length);

        // Sharpen kernel
        //  0   -a    0
        // -a  1+4a  -a
        //  0   -a    0
        const a = amount;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;

                // Skip edges for simplicity
                if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
                    output[idx] = data[idx];
                    output[idx + 1] = data[idx + 1];
                    output[idx + 2] = data[idx + 2];
                    output[idx + 3] = data[idx + 3];
                    continue;
                }

                for (let c = 0; c < 3; c++) {
                    const center = data[idx + c];
                    const top = data[((y - 1) * w + x) * 4 + c];
                    const bottom = data[((y + 1) * w + x) * 4 + c];
                    const left = data[(y * w + x - 1) * 4 + c];
                    const right = data[(y * w + x + 1) * 4 + c];

                    const val = center * (1 + 4 * a) - a * (top + bottom + left + right);
                    output[idx + c] = Math.max(0, Math.min(255, val));
                }
                output[idx + 3] = data[idx + 3];
            }
        }

        imageData.data.set(output);
        ctx.putImageData(imageData, 0, 0);
    } catch (e) {
        console.warn('Sharpening failed (likely CORS):', e);
    }
}

function createCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
}

// ============ DOWNLOAD ============
function downloadResult() {
    if (!resultBlob) {
        showToast('❌ Nothing to download', 'error');
        return;
    }

    const ext = outputFormat.split('/')[1].replace('jpeg', 'jpg');
    const baseName = (currentFile?.name || 'image').replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_4K_${Date.now()}.${ext}`;

    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('✅ Downloaded!');
}

// ============ RESET ============
function resetResult() {
    if (resultUrl) {
        URL.revokeObjectURL(resultUrl);
        resultUrl = null;
    }
    resultBlob = null;
    resultPreview.src = '';
    resultPreview.style.display = 'none';
    resultPlaceholder.style.display = 'block';
    document.getElementById('result-dim').innerText = '—';
    document.getElementById('result-size').innerText = '—';
    document.getElementById('result-format').innerText = '—';
    downloadBtn.disabled = true;
}

function resetTool() {
    resetResult();
    currentFile = null;
    originalImage = null;

    editorContainer.style.display = 'none';
    uploadZone.style.display = 'block';
    infoSection.style.display = 'block';

    fileInput.value = '';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast('🔄 Ready for new image');
}

// ============ UTILITIES ============
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============ SHARE ============
function shareTool() {
    const data = {
        title: 'Image to 4K Converter - Tool Hub',
        text: 'Convert any image to 4K resolution — free & private!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(data).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Link copied!');
        });
    }
}

// ============ THEME TOGGLE ============
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('toolhub_theme', 'dark');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('toolhub_theme', 'light');
        }
    });

    if (localStorage.getItem('toolhub_theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }
}

// ============ TOAST ============
let toastTimeout;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    const icon = toast.querySelector('i');

    msg.innerText = message;
    toast.classList.remove('error');

    if (type === 'error') {
        toast.classList.add('error');
        icon.className = 'fa-solid fa-circle-exclamation';
    } else {
        icon.className = 'fa-solid fa-circle-check';
    }

    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============ HISTORY TRACKING ============
(function trackUsage() {
    try {
        const history = JSON.parse(localStorage.getItem('toolhub_history')) || [];
        const entry = {
            id: 'img-to-4k',
            name: 'Image to 4K Converter',
            category: 'image',
            icon: 'fa-image',
            page: 'imgto4k-index.html',
            time: new Date().toISOString()
        };
        const filtered = history.filter(h => h.id !== entry.id);
        filtered.unshift(entry);
        if (filtered.length > 20) filtered.pop();
        localStorage.setItem('toolhub_history', JSON.stringify(filtered));
    } catch (e) {}
})();