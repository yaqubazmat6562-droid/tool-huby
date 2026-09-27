/* ============================================================
   IMAGE TOOLS - COMPLETE DYNAMIC SYSTEM
   ============================================================ */

const IMAGE_TOOLS = [
    { id: 'img-compressor', name: 'Image Compressor', icon: 'fa-compress', desc: 'Compress JPG, PNG & WebP without quality loss' },
    { id: 'img-resizer', name: 'Image Resizer', icon: 'fa-expand', desc: 'Resize images to any dimension' },
    { id: 'img-cropper', name: 'Image Cropper', icon: 'fa-crop', desc: 'Crop images interactively' },
    { id: 'jpg-to-png', name: 'JPG → PNG', icon: 'fa-file-image', desc: 'Convert JPG to PNG format' },
    { id: 'png-to-jpg', name: 'PNG → JPG', icon: 'fa-file-image', desc: 'Convert PNG to JPG format' },
    { id: 'jpg-to-webp', name: 'JPG → WEBP', icon: 'fa-file-image', desc: 'Convert JPG to WebP format' },
    { id: 'webp-to-jpg', name: 'WEBP → JPG', icon: 'fa-file-image', desc: 'Convert WebP to JPG format' },
    { id: 'img-rotator', name: 'Image Rotator', icon: 'fa-rotate', desc: 'Rotate images by any angle' },
    { id: 'img-flipper', name: 'Image Flipper', icon: 'fa-left-right', desc: 'Flip images horizontally or vertically' },
    { id: 'watermark-img', name: 'Watermark Image', icon: 'fa-stamp', desc: 'Add text or image watermark' },
    { id: 'img-blur', name: 'Image Blur', icon: 'fa-eye-slash', desc: 'Apply blur effect to images' },
    { id: 'color-adjust', name: 'Color Adjuster', icon: 'fa-palette', desc: 'Adjust brightness, contrast & saturation' },
    { id: 'passport-photo', name: 'Passport Photo Maker', icon: 'fa-id-card', desc: 'Create passport size photos' }
];

let currentImage = null;
let currentFileName = '';

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    renderToolsGrid();
    checkUrlTool();
    initTheme();
});

// ============ RENDER TOOLS GRID ============
function renderToolsGrid() {
    const grid = document.getElementById('image-tools-grid');
    if (!grid) return;
    
    grid.innerHTML = IMAGE_TOOLS.map(tool => `
        <div class="tool-card" onclick="openImageTool('${tool.id}')">
            <div class="tool-card-top">
                <div class="tool-icon-badge image">
                    <i class="fa-solid ${tool.icon}"></i>
                </div>
            </div>
            <div class="tool-content">
                <h3>${tool.name}</h3>
                <p>${tool.desc}</p>
            </div>
            <div class="tool-footer">
                <span class="category-badge image">
                    <i class="fa-solid fa-image"></i> Image
                </span>
                <span class="open-btn">Open <i class="fa-solid fa-arrow-right"></i></span>
            </div>
        </div>
    `).join('');
}

// ============ CHECK URL FOR TOOL ============
function checkUrlTool() {
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get('tool');
    if (toolId) {
        openImageTool(toolId);
    }
}

// ============ OPEN TOOL ============
function openImageTool(toolId) {
    const tool = IMAGE_TOOLS.find(t => t.id === toolId);
    if (!tool) return;
    
    document.getElementById('tools-list-view').style.display = 'none';
    document.getElementById('tool-view').style.display = 'block';
    document.getElementById('tool-title').innerHTML = `<i class="fa-solid ${tool.icon}"></i> ${tool.name}`;
    document.getElementById('tool-desc').innerText = tool.desc;
    document.getElementById('current-tool-name').innerText = tool.name;
    
    // Load tool content
    const content = document.getElementById('tool-content');
    content.innerHTML = renderToolUI(toolId);
    
    // Bind events
    bindToolEvents(toolId);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.replaceState({}, '', `?tool=${toolId}`);
}

// ============ BACK TO LIST ============
function showToolsList() {
    document.getElementById('tools-list-view').style.display = 'block';
    document.getElementById('tool-view').style.display = 'none';
    document.getElementById('current-tool-name').innerText = 'Image Tools';
    window.history.replaceState({}, '', window.location.pathname);
    currentImage = null;
    currentFileName = '';
}

// ============ RENDER TOOL UI ============
function renderToolUI(toolId) {
    // Common upload UI
    const uploadUI = `
        <div class="tool-panel">
            <div class="upload-area" id="upload-area">
                <input type="file" id="file-input" accept="image/*">
                <div class="upload-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
                <h3>Drop your image here</h3>
                <p>or click to browse — JPG, PNG, WebP supported</p>
                <button class="upload-btn" onclick="document.getElementById('file-input').click()">
                    <i class="fa-solid fa-folder-open"></i> Choose Image
                </button>
            </div>
        </div>
    `;

    // Tool-specific controls
    const controls = {
        'img-compressor': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-field">
                    <label>Quality: <span class="range-value" id="quality-val">80%</span></label>
                    <input type="range" class="tool-range" id="quality" min="10" max="100" value="80">
                </div>
                <div class="tool-field">
                    <label>Output Format</label>
                    <select class="tool-select" id="format">
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="process-btn">
                        <i class="fa-solid fa-compress"></i> Compress
                    </button>
                </div>
            </div>
        `,
        'img-resizer': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-field">
                    <label>Width (px)</label>
                    <input type="number" class="tool-input" id="width" placeholder="e.g. 800">
                </div>
                <div class="tool-field">
                    <label>Height (px)</label>
                    <input type="number" class="tool-input" id="height" placeholder="e.g. 600">
                </div>
                <div class="tool-field">
                    <label>
                        <input type="checkbox" id="keep-ratio" checked> Keep aspect ratio
                    </label>
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="process-btn">
                        <i class="fa-solid fa-expand"></i> Resize
                    </button>
                </div>
            </div>
        `,
        'img-rotator': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-field">
                    <label>Rotation Angle</label>
                    <div class="tool-btn-row">
                        <button class="tool-btn tool-btn-secondary" onclick="rotateImage(-90)"><i class="fa-solid fa-rotate-left"></i> -90°</button>
                        <button class="tool-btn tool-btn-secondary" onclick="rotateImage(90)"><i class="fa-solid fa-rotate-right"></i> +90°</button>
                        <button class="tool-btn tool-btn-secondary" onclick="rotateImage(180)"><i class="fa-solid fa-rotate"></i> 180°</button>
                    </div>
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="download-btn">
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                </div>
            </div>
        `,
        'img-flipper': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-secondary" onclick="flipImage('h')"><i class="fa-solid fa-left-right"></i> Flip Horizontal</button>
                    <button class="tool-btn tool-btn-secondary" onclick="flipImage('v')"><i class="fa-solid fa-up-down"></i> Flip Vertical</button>
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="download-btn">
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                </div>
            </div>
        `,
        'img-blur': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-field">
                    <label>Blur Amount: <span class="range-value" id="blur-val">5px</span></label>
                    <input type="range" class="tool-range" id="blur" min="0" max="20" value="5">
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="apply-blur">
                        <i class="fa-solid fa-eye-slash"></i> Apply Blur
                    </button>
                    <button class="tool-btn tool-btn-success" id="download-btn">
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                </div>
            </div>
        `,
        'watermark-img': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-field">
                    <label>Watermark Text</label>
                    <input type="text" class="tool-input" id="wm-text" placeholder="© Your Name" value="© ToolHub">
                </div>
                <div class="tool-field">
                    <label>Position</label>
                    <select class="tool-select" id="wm-position">
                        <option value="br">Bottom Right</option>
                        <option value="bl">Bottom Left</option>
                        <option value="tr">Top Right</option>
                        <option value="tl">Top Left</option>
                        <option value="center">Center</option>
                    </select>
                </div>
                <div class="tool-field">
                    <label>Font Size: <span class="range-value" id="wm-size-val">30px</span></label>
                    <input type="range" class="tool-range" id="wm-size" min="10" max="100" value="30">
                </div>
                <div class="tool-field">
                    <label>Opacity: <span class="range-value" id="wm-opacity-val">50%</span></label>
                    <input type="range" class="tool-range" id="wm-opacity" min="10" max="100" value="50">
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="apply-wm">
                        <i class="fa-solid fa-stamp"></i> Apply Watermark
                    </button>
                    <button class="tool-btn tool-btn-success" id="download-btn">
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                </div>
            </div>
        `,
        'color-adjust': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-field">
                    <label>Brightness: <span class="range-value" id="brightness-val">100%</span></label>
                    <input type="range" class="tool-range" id="brightness" min="0" max="200" value="100">
                </div>
                <div class="tool-field">
                    <label>Contrast: <span class="range-value" id="contrast-val">100%</span></label>
                    <input type="range" class="tool-range" id="contrast" min="0" max="200" value="100">
                </div>
                <div class="tool-field">
                    <label>Saturation: <span class="range-value" id="saturation-val">100%</span></label>
                    <input type="range" class="tool-range" id="saturation" min="0" max="200" value="100">
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="apply-adjust">
                        <i class="fa-solid fa-palette"></i> Apply
                    </button>
                    <button class="tool-btn tool-btn-success" id="download-btn">
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                </div>
            </div>
        `,
        'passport-photo': `
            <div class="tool-panel" id="controls-panel" style="display:none;">
                <div class="tool-field">
                    <label>Photo Size</label>
                    <select class="tool-select" id="passport-size">
                        <option value="35x45">35×45 mm (Standard)</option>
                        <option value="51x51">51×51 mm (US 2x2)</option>
                        <option value="35x35">35×35 mm (Square)</option>
                        <option value="25x35">25×35 mm (Small)</option>
                    </select>
                </div>
                <div class="tool-field">
                    <label>Background Color</label>
                    <select class="tool-select" id="bg-color">
                        <option value="#ffffff">White</option>
                        <option value="#f0f0f0">Light Gray</option>
                        <option value="#dbeafe">Light Blue</option>
                        <option value="#fee2e2">Light Red</option>
                    </select>
                </div>
                <div class="tool-btn-row">
                    <button class="tool-btn tool-btn-primary" id="make-passport">
                        <i class="fa-solid fa-id-card"></i> Generate Passport Photo
                    </button>
                    <button class="tool-btn tool-btn-success" id="download-btn">
                        <i class="fa-solid fa-download"></i> Download
                    </button>
                </div>
            </div>
        `,
        // Format converters (simple)
        'jpg-to-png': `<div class="tool-panel" id="controls-panel" style="display:none;">
            <div class="tool-btn-row">
                <button class="tool-btn tool-btn-primary" id="convert-btn" data-format="image/png">
                    <i class="fa-solid fa-arrow-right"></i> Convert to PNG
                </button>
            </div>
        </div>`,
        'png-to-jpg': `<div class="tool-panel" id="controls-panel" style="display:none;">
            <div class="tool-field">
                <label>Quality: <span class="range-value" id="quality-val">90%</span></label>
                <input type="range" class="tool-range" id="quality" min="10" max="100" value="90">
            </div>
            <div class="tool-btn-row">
                <button class="tool-btn tool-btn-primary" id="convert-btn" data-format="image/jpeg">
                    <i class="fa-solid fa-arrow-right"></i> Convert to JPG
                </button>
            </div>
        </div>`,
        'jpg-to-webp': `<div class="tool-panel" id="controls-panel" style="display:none;">
            <div class="tool-field">
                <label>Quality: <span class="range-value" id="quality-val">85%</span></label>
                <input type="range" class="tool-range" id="quality" min="10" max="100" value="85">
            </div>
            <div class="tool-btn-row">
                <button class="tool-btn tool-btn-primary" id="convert-btn" data-format="image/webp">
                    <i class="fa-solid fa-arrow-right"></i> Convert to WebP
                </button>
            </div>
        </div>`,
        'webp-to-jpg': `<div class="tool-panel" id="controls-panel" style="display:none;">
            <div class="tool-field">
                <label>Quality: <span class="range-value" id="quality-val">90%</span></label>
                <input type="range" class="tool-range" id="quality" min="10" max="100" value="90">
            </div>
            <div class="tool-btn-row">
                <button class="tool-btn tool-btn-primary" id="convert-btn" data-format="image/jpeg">
                    <i class="fa-solid fa-arrow-right"></i> Convert to JPG
                </button>
            </div>
        </div>`,
        'img-cropper': `<div class="tool-panel" id="controls-panel" style="display:none;">
            <div class="tool-field">
                <label>Crop Area (X, Y, Width, Height)</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <input type="number" class="tool-input" id="crop-x" placeholder="X" value="0">
                    <input type="number" class="tool-input" id="crop-y" placeholder="Y" value="0">
                    <input type="number" class="tool-input" id="crop-w" placeholder="Width">
                    <input type="number" class="tool-input" id="crop-h" placeholder="Height">
                </div>
            </div>
            <div class="tool-btn-row">
                <button class="tool-btn tool-btn-primary" id="crop-btn">
                    <i class="fa-solid fa-crop"></i> Crop Image
                </button>
                <button class="tool-btn tool-btn-success" id="download-btn">
                    <i class="fa-solid fa-download"></i> Download
                </button>
            </div>
        </div>`
    };

    const previewUI = `
        <div class="tool-panel" id="preview-panel" style="display:none;">
            <div class="preview-area">
                <div class="preview-box">
                    <h4>Original</h4>
                    <img id="original-preview" alt="Original">
                    <div class="preview-info" id="original-info"></div>
                </div>
                <div class="preview-box">
                    <h4>Result</h4>
                    <canvas id="result-canvas" style="max-width:100%;border-radius:8px;display:none;"></canvas>
                    <img id="result-preview" style="display:none;" alt="Result">
                    <div class="preview-info" id="result-info"></div>
                </div>
            </div>
        </div>
    `;

    return uploadUI + (controls[toolId] || '') + previewUI;
}

// ============ BIND TOOL EVENTS ============
function bindToolEvents(toolId) {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');
    
    // File input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });
    
    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    
    // Range values
    document.querySelectorAll('input[type="range"]').forEach(range => {
        range.addEventListener('input', (e) => {
            const valEl = e.target.parentElement.querySelector('.range-value');
            if (valEl) {
                const unit = e.target.id.includes('blur') ? 'px' : '%';
                valEl.innerText = e.target.value + unit;
            }
        });
    });
    
    // Process button
    const processBtn = document.getElementById('process-btn');
    if (processBtn) processBtn.addEventListener('click', () => processTool(toolId));
    
    const convertBtn = document.getElementById('convert-btn');
    if (convertBtn) convertBtn.addEventListener('click', () => processTool(toolId));
    
    const applyBlur = document.getElementById('apply-blur');
    if (applyBlur) applyBlur.addEventListener('click', () => processTool(toolId));
    
    const applyWm = document.getElementById('apply-wm');
    if (applyWm) applyWm.addEventListener('click', () => processTool(toolId));
    
    const applyAdj = document.getElementById('apply-adjust');
    if (applyAdj) applyAdj.addEventListener('click', () => processTool(toolId));
    
    const cropBtn = document.getElementById('crop-btn');
    if (cropBtn) cropBtn.addEventListener('click', () => processTool(toolId));
    
    const passportBtn = document.getElementById('make-passport');
    if (passportBtn) passportBtn.addEventListener('click', () => processTool(toolId));
    
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadResult);
}

// ============ HANDLE FILE ============
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select an image file', 'error');
        return;
    }
    
    currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            
            // Show preview
            document.getElementById('preview-panel').style.display = 'block';
            document.getElementById('controls-panel').style.display = 'block';
            
            const originalPreview = document.getElementById('original-preview');
            originalPreview.src = e.target.result;
            document.getElementById('original-info').innerText = 
                `${img.width} × ${img.height} px • ${formatSize(file.size)}`;
            
            // Auto-fill resize fields
            const wInput = document.getElementById('width');
            const hInput = document.getElementById('height');
            if (wInput && hInput) {
                wInput.value = img.width;
                hInput.value = img.height;
            }
            
            const cropW = document.getElementById('crop-w');
            const cropH = document.getElementById('crop-h');
            if (cropW && cropH) {
                cropW.value = img.width;
                cropH.value = img.height;
            }
            
            // Scroll to preview
            document.getElementById('preview-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            showToast('✅ Image loaded');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ============ PROCESS TOOL ============
async function processTool(toolId) {
    if (!currentImage) {
        showToast('⚠️ Please upload an image first', 'error');
        return;
    }
    
    const canvas = document.getElementById('result-canvas');
    const ctx = canvas.getContext('2d');
    
    switch(toolId) {
        case 'img-compressor':
        case 'jpg-to-png':
        case 'png-to-jpg':
        case 'jpg-to-webp':
        case 'webp-to-jpg': {
            const quality = parseInt(document.getElementById('quality')?.value || 90) / 100;
            const format = document.getElementById('format')?.value || 
                          document.getElementById('convert-btn')?.dataset.format || 
                          'image/jpeg';
            
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            
            // White background for JPG
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(currentImage, 0, 0);
            
            const dataUrl = canvas.toDataURL(format, quality);
            showResult(canvas, dataUrl, format, quality);
            break;
        }
        
        case 'img-resizer': {
            let w = parseInt(document.getElementById('width').value);
            let h = parseInt(document.getElementById('height').value);
            const keepRatio = document.getElementById('keep-ratio').checked;
            
            if (keepRatio && currentImage.width && currentImage.height) {
                const ratio = currentImage.width / currentImage.height;
                if (w && !h) h = Math.round(w / ratio);
                else if (h && !w) w = Math.round(h * ratio);
            }
            
            if (!w || !h) {
                showToast('⚠️ Enter width or height', 'error');
                return;
            }
            
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(currentImage, 0, 0, w, h);
            
            const dataUrl = canvas.toDataURL('image/png');
            showResult(canvas, dataUrl, 'image/png', 1);
            break;
        }
        
        case 'img-blur': {
            const blur = document.getElementById('blur').value;
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            ctx.filter = `blur(${blur}px)`;
            ctx.drawImage(currentImage, 0, 0);
            ctx.filter = 'none';
            
            const dataUrl = canvas.toDataURL('image/png');
            showResult(canvas, dataUrl, 'image/png', 1);
            break;
        }
        
        case 'watermark-img': {
            const text = document.getElementById('wm-text').value;
            const position = document.getElementById('wm-position').value;
            const size = parseInt(document.getElementById('wm-size').value);
            const opacity = parseInt(document.getElementById('wm-opacity').value) / 100;
            
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            ctx.drawImage(currentImage, 0, 0);
            
            ctx.font = `bold ${size}px Arial`;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.textBaseline = 'middle';
            
            const metrics = ctx.measureText(text);
            const padding = 20;
            let x, y;
            
            switch(position) {
                case 'tl': x = padding; y = padding + size/2; ctx.textAlign = 'left'; break;
                case 'tr': x = canvas.width - metrics.width - padding; y = padding + size/2; ctx.textAlign = 'left'; break;
                case 'bl': x = padding; y = canvas.height - padding - size/2; ctx.textAlign = 'left'; break;
                case 'br': x = canvas.width - metrics.width - padding; y = canvas.height - padding - size/2; ctx.textAlign = 'left'; break;
                case 'center': x = canvas.width/2; y = canvas.height/2; ctx.textAlign = 'center'; break;
            }
            
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
            
            const dataUrl = canvas.toDataURL('image/png');
            showResult(canvas, dataUrl, 'image/png', 1);
            break;
        }
        
        case 'color-adjust': {
            const brightness = document.getElementById('brightness').value;
            const contrast = document.getElementById('contrast').value;
            const saturation = document.getElementById('saturation').value;
            
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
            ctx.drawImage(currentImage, 0, 0);
            ctx.filter = 'none';
            
            const dataUrl = canvas.toDataURL('image/png');
            showResult(canvas, dataUrl, 'image/png', 1);
            break;
        }
        
        case 'img-cropper': {
            const x = parseInt(document.getElementById('crop-x').value) || 0;
            const y = parseInt(document.getElementById('crop-y').value) || 0;
            const w = parseInt(document.getElementById('crop-w').value);
            const h = parseInt(document.getElementById('crop-h').value);
            
            if (!w || !h) {
                showToast('⚠️ Enter crop width & height', 'error');
                return;
            }
            
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(currentImage, x, y, w, h, 0, 0, w, h);
            
            const dataUrl = canvas.toDataURL('image/png');
            showResult(canvas, dataUrl, 'image/png', 1);
            break;
        }
        
        case 'passport-photo': {
            const sizeStr = document.getElementById('passport-size').value;
            const [wmm, hmm] = sizeStr.split('x').map(Number);
            const bgColor = document.getElementById('bg-color').value;
            
            // Convert mm to px (300 DPI: 1mm = 11.81px)
            const wpx = Math.round(wmm * 11.81);
            const hpx = Math.round(hmm * 11.81);
            
            canvas.width = wpx;
            canvas.height = hpx;
            
            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, wpx, hpx);
            
            // Draw image (cover fit)
            const ratio = Math.max(wpx / currentImage.width, hpx / currentImage.height);
            const newW = currentImage.width * ratio;
            const newH = currentImage.height * ratio;
            const offsetX = (wpx - newW) / 2;
            const offsetY = (hpx - newH) / 2;
            
            ctx.drawImage(currentImage, offsetX, offsetY, newW, newH);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            showResult(canvas, dataUrl, 'image/jpeg', 0.95);
            break;
        }
    }
}

// ============ ROTATE / FLIP ============
function rotateImage(deg) {
    if (!currentImage) return;
    const canvas = document.getElementById('result-canvas');
    const ctx = canvas.getContext('2d');
    
    const rad = deg * Math.PI / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    
    canvas.width = currentImage.width * cos + currentImage.height * sin;
    canvas.height = currentImage.width * sin + currentImage.height * cos;
    
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(rad);
    ctx.drawImage(currentImage, -currentImage.width/2, -currentImage.height/2);
    
    document.getElementById('result-canvas').style.display = 'block';
    document.getElementById('result-preview').style.display = 'none';
    document.getElementById('result-info').innerText = `${canvas.width} × ${canvas.height} px`;
    document.getElementById('preview-panel').style.display = 'block';
    document.getElementById('controls-panel').style.display = 'block';
}

function flipImage(dir) {
    if (!currentImage) return;
    const canvas = document.getElementById('result-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    
    ctx.translate(dir === 'h' ? canvas.width : 0, dir === 'v' ? canvas.height : 0);
    ctx.scale(dir === 'h' ? -1 : 1, dir === 'v' ? -1 : 1);
    ctx.drawImage(currentImage, 0, 0);
    
    document.getElementById('result-canvas').style.display = 'block';
    document.getElementById('result-preview').style.display = 'none';
    document.getElementById('result-info').innerText = `${canvas.width} × ${canvas.height} px`;
    document.getElementById('preview-panel').style.display = 'block';
    document.getElementById('controls-panel').style.display = 'block';
}

// ============ SHOW RESULT ============
function showResult(canvas, dataUrl, format, quality) {
    canvas.style.display = 'block';
    document.getElementById('result-preview').style.display = 'none';
    
    // Calculate size
    const size = Math.round((dataUrl.length - 'data:image/png;base64,'.length) * 0.75);
    const ext = format.split('/')[1].toUpperCase();
    
    document.getElementById('result-info').innerText = 
        `${canvas.width} × ${canvas.height} px • ${formatSize(size)} • ${ext}`;
    
    // Store for download
    canvas._dataUrl = dataUrl;
    canvas._format = format;
    
    showToast('✅ Done! Click download to save');
}

// ============ DOWNLOAD ============
function downloadResult() {
    const canvas = document.getElementById('result-canvas');
    if (!canvas || !canvas._dataUrl) {
        showToast('⚠️ Process an image first', 'error');
        return;
    }
    
    const link = document.createElement('a');
    const ext = canvas._format.split('/')[1];
    const baseName = currentFileName.replace(/\.[^.]+$/, '');
    
    link.download = `${baseName}_toolhub.${ext}`;
    link.href = canvas._dataUrl;
    link.click();
    
    showToast('📥 Downloaded!');
}

// ============ HELPERS ============
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    
    msgEl.innerText = msg;
    toast.classList.remove('error');
    
    if (type === 'error') {
        toast.classList.add('error');
        icon.className = 'fa-solid fa-circle-exclamation';
    } else {
        icon.className = 'fa-solid fa-circle-check';
    }
    
    toast.classList.add('show');
    clearTimeout(window._toastT);
    window._toastT = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============ THEME ============
function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('toolhub_theme') || 'light';
    
    if (saved === 'dark') document.body.classList.add('dark-mode');
    updateThemeIcon(saved);
    
    toggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('toolhub_theme', theme);
        updateThemeIcon(theme);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (!icon) return;
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// Global
window.openImageTool = openImageTool;
window.showToolsList = showToolsList;
window.rotateImage = rotateImage;
window.flipImage = flipImage;