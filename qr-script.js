/* ============================================================
   QR CODE GENERATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentType = 'text';
let currentData = '';
let qrInstance = null;
let logoImage = null;
let currentQRCanvas = null;

// ============ DOM ELEMENTS ============
const inputSection = document.getElementById('input-section');
const qrContainer = document.getElementById('qrcode-container');
const previewInfo = document.getElementById('preview-info');
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
const errorLevel = document.getElementById('error-level');
const fgColor = document.getElementById('fg-color');
const fgColorText = document.getElementById('fg-color-text');
const bgColor = document.getElementById('bg-color');
const bgColorText = document.getElementById('bg-color-text');
const logoInput = document.getElementById('logo-input');
const removeLogoBtn = document.getElementById('remove-logo-btn');
const infoSize = document.getElementById('info-size');
const infoError = document.getElementById('info-error');
const infoLength = document.getElementById('info-length');
const downloadPngBtn = document.getElementById('download-png');
const downloadSvgBtn = document.getElementById('download-svg');
const copyQrBtn = document.getElementById('copy-qr');
const printQrBtn = document.getElementById('print-qr');

// ============ TYPE SWITCHING ============
function switchType(type) {
    currentType = type;
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    renderInputFields();
    clearPreview();
}

// ============ RENDER INPUT FIELDS ============
function renderInputFields() {
    const fields = {
        text: `
            <div class="input-field">
                <label><i class="fa-solid fa-link"></i> Text or URL</label>
                <textarea id="input-text" placeholder="Enter any text, URL, or message...&#10;&#10;Example:&#10;https://example.com&#10;Hello World!">https://toolhub.com</textarea>
                <div class="char-counter"><span id="char-count">0</span> characters</div>
            </div>
        `,
        wifi: `
            <div class="input-field">
                <label><i class="fa-solid fa-wifi"></i> Network Name (SSID)</label>
                <input type="text" id="wifi-ssid" placeholder="MyWiFiNetwork" value="MyWiFiNetwork">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-key"></i> Password</label>
                <input type="text" id="wifi-password" placeholder="Enter WiFi password" value="">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-shield"></i> Security Type</label>
                <select id="wifi-security">
                    <option value="WPA" selected>WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                </select>
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-eye"></i> Hidden Network</label>
                <select id="wifi-hidden">
                    <option value="false" selected>No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
        `,
        email: `
            <div class="input-field">
                <label><i class="fa-solid fa-at"></i> Email Address</label>
                <input type="email" id="email-to" placeholder="hello@example.com" value="hello@example.com">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-heading"></i> Subject</label>
                <input type="text" id="email-subject" placeholder="Subject line" value="">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-message"></i> Body</label>
                <textarea id="email-body" placeholder="Email body..." style="min-height:80px;"></textarea>
            </div>
        `,
        phone: `
            <div class="input-field">
                <label><i class="fa-solid fa-phone"></i> Phone Number</label>
                <input type="tel" id="phone-number" placeholder="+1234567890" value="+1234567890">
            </div>
        `,
        sms: `
            <div class="input-field">
                <label><i class="fa-solid fa-phone"></i> Phone Number</label>
                <input type="tel" id="sms-number" placeholder="+1234567890" value="+1234567890">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-message"></i> Message</label>
                <textarea id="sms-message" placeholder="Your message..." style="min-height:80px;">Hello!</textarea>
            </div>
        `,
        vcard: `
            <div class="input-field">
                <label><i class="fa-solid fa-user"></i> Full Name</label>
                <input type="text" id="vcard-name" placeholder="John Doe" value="John Doe">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-phone"></i> Phone</label>
                <input type="tel" id="vcard-phone" placeholder="+1234567890" value="+1234567890">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-at"></i> Email</label>
                <input type="email" id="vcard-email" placeholder="john@example.com" value="john@example.com">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-building"></i> Organization</label>
                <input type="text" id="vcard-org" placeholder="Company" value="">
            </div>
            <div class="input-field">
                <label><i class="fa-solid fa-globe"></i> Website</label>
                <input type="url" id="vcard-url" placeholder="https://example.com" value="">
            </div>
        `
    };

    inputSection.innerHTML = fields[currentType] || '';

    // Attach live listeners
    setTimeout(() => {
        const allInputs = inputSection.querySelectorAll('input, textarea, select');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (currentType === 'text') {
                    const cc = document.getElementById('char-count');
                    if (cc) cc.innerText = document.getElementById('input-text').value.length;
                }
            });
        });

        if (currentType === 'text') {
            const cc = document.getElementById('char-count');
            const txt = document.getElementById('input-text');
            if (cc && txt) cc.innerText = txt.value.length;
        }
    }, 0);
}

// ============ BUILD DATA STRING ============
function buildDataString() {
    switch (currentType) {
        case 'text': {
            const el = document.getElementById('input-text');
            return el ? el.value : '';
        }
        case 'wifi': {
            const ssid = document.getElementById('wifi-ssid')?.value || '';
            const pass = document.getElementById('wifi-password')?.value || '';
            const sec = document.getElementById('wifi-security')?.value || 'WPA';
            const hid = document.getElementById('wifi-hidden')?.value || 'false';
            if (!ssid) return '';
            return `WIFI:T:${sec};S:${escapeWifi(ssid)};${sec !== 'nopass' ? `P:${escapeWifi(pass)};` : ''}H:${hid};;`;
        }
        case 'email': {
            const to = document.getElementById('email-to')?.value || '';
            const sub = document.getElementById('email-subject')?.value || '';
            const body = document.getElementById('email-body')?.value || '';
            if (!to) return '';
            const params = [];
            if (sub) params.push(`subject=${encodeURIComponent(sub)}`);
            if (body) params.push(`body=${encodeURIComponent(body)}`);
            return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
        }
        case 'phone': {
            const num = document.getElementById('phone-number')?.value || '';
            return num ? `tel:${num}` : '';
        }
        case 'sms': {
            const num = document.getElementById('sms-number')?.value || '';
            const msg = document.getElementById('sms-message')?.value || '';
            if (!num) return '';
            return msg ? `SMSTO:${num}:${msg}` : `SMSTO:${num}`;
        }
        case 'vcard': {
            const name = document.getElementById('vcard-name')?.value || '';
            const phone = document.getElementById('vcard-phone')?.value || '';
            const email = document.getElementById('vcard-email')?.value || '';
            const org = document.getElementById('vcard-org')?.value || '';
            const url = document.getElementById('vcard-url')?.value || '';
            if (!name) return '';
            const parts = name.split(' ');
            const first = parts[0] || '';
            const last = parts.slice(1).join(' ') || '';
            let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
            vcard += `N:${last};${first};;;\n`;
            vcard += `FN:${name}\n`;
            if (org) vcard += `ORG:${org}\n`;
            if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`;
            if (email) vcard += `EMAIL:${email}\n`;
            if (url) vcard += `URL:${url}\n`;
            vcard += 'END:VCARD';
            return vcard;
        }
        default: return '';
    }
}

function escapeWifi(str) {
    return str.replace(/([\\;,":])/g, '\\$1');
}

// ============ GENERATE QR CODE ============
function generateQR() {
    const data = buildDataString();

    if (!data || data.trim() === '') {
        showToast('❌ Please enter some content!', 'error');
        return;
    }

    currentData = data;
    const size = parseInt(sizeSlider.value);
    const ecLevel = errorLevel.value;
    const fg = fgColor.value;
    const bg = bgColor.value;

    // Clear previous
    qrContainer.innerHTML = '';

    try {
        // Generate QR using QRCode.js
        qrInstance = new QRCode(qrContainer, {
            text: data,
            width: size,
            height: size,
            colorDark: fg,
            colorLight: bg,
            correctLevel: QRCode.CorrectLevel[ecLevel]
        });

        // Wait for render, then post-process (add logo, get canvas)
        setTimeout(() => {
            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
                // If logo is uploaded, draw it on the canvas
                if (logoImage) {
                    drawLogoOnCanvas(canvas);
                }
                currentQRCanvas = canvas;
                
                // Also create a clean image element for display
                const img = qrContainer.querySelector('img');
                if (img) {
                    img.style.display = 'none';
                }
            }

            // Enable download buttons
            downloadPngBtn.disabled = false;
            downloadSvgBtn.disabled = false;
            copyQrBtn.disabled = false;
            printQrBtn.disabled = false;

            // Update preview info
            updatePreviewInfo(data, size, ecLevel);
            previewInfo.style.display = 'flex';
        }, 100);

    } catch (err) {
        console.error(err);
        showToast('❌ Failed to generate QR code!', 'error');
    }
}

// ============ DRAW LOGO ON CANVAS ============
function drawLogoOnCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const logoSize = size * 0.22; // 22% of QR size
    const padding = size * 0.03;

    // White circle/square behind logo for better visibility
    ctx.fillStyle = '#ffffff';
    const boxSize = logoSize + padding * 2;
    const boxX = (size - boxSize) / 2;
    const boxY = (size - boxSize) / 2;
    
    // Rounded rectangle
    const radius = boxSize * 0.15;
    roundedRect(ctx, boxX, boxY, boxSize, boxSize, radius);
    ctx.fill();

    // Draw logo
    ctx.drawImage(logoImage, (size - logoSize) / 2, (size - logoSize) / 2, logoSize, logoSize);
}

function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ============ UPDATE PREVIEW INFO ============
function updatePreviewInfo(data, size, ecLevel) {
    const ecNames = { L: 'Low', M: 'Medium', Q: 'Quartile', H: 'High' };
    infoSize.innerText = `${size} × ${size}`;
    infoError.innerText = ecNames[ecLevel] || ecLevel;
    infoLength.innerText = `${data.length} chars`;
}

// ============ CLEAR PREVIEW ============
function clearPreview() {
    qrContainer.innerHTML = `
        <div class="empty-qr">
            <i class="fa-solid fa-qrcode"></i>
            <p>Enter content & click<br>Generate QR Code</p>
        </div>
    `;
    previewInfo.style.display = 'none';
    downloadPngBtn.disabled = true;
    downloadSvgBtn.disabled = true;
    copyQrBtn.disabled = true;
    printQrBtn.disabled = true;
    currentData = '';
    currentQRCanvas = null;
}

// ============ CLEAR ALL ============
function clearAll() {
    if (!currentData && !logoImage) {
        showToast('❌ Already empty!', 'error');
        return;
    }
    if (!confirm('Kya aap sab kuch clear karna chahte hain?')) return;

    // Reset inputs
    renderInputFields();
    removeLogo();
    clearPreview();
    showToast('🧹 Cleared successfully!');
}

// ============ DOWNLOAD PNG ============
function downloadPNG() {
    if (!currentQRCanvas && !qrContainer.querySelector('canvas')) {
        showToast('❌ Please generate a QR code first!', 'error');
        return;
    }

    const canvas = currentQRCanvas || qrContainer.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
        if (!blob) return showToast('❌ Export failed!', 'error');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.href = url;
        a.download = `qrcode-${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📥 PNG downloaded!');
    }, 'image/png');
}

// ============ DOWNLOAD SVG ============
function downloadSVG() {
    if (!currentData) {
        showToast('❌ Please generate a QR code first!', 'error');
        return;
    }

    try {
        const size = parseInt(sizeSlider.value);
        const ecLevel = errorLevel.value;
        const fg = fgColor.value;
        const bg = bgColor.value;

        // Create a temporary container for SVG generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Generate QR - QRCode.js only produces canvas/img, so we need to build SVG manually
        // Alternative: use the canvas and embed it in an SVG wrapper
        const canvas = currentQRCanvas || qrContainer.querySelector('canvas');
        
        if (!canvas) {
            document.body.removeChild(tempDiv);
            showToast('❌ Please generate a QR code first!', 'error');
            return;
        }

        // Get QR matrix by reading pixels from canvas
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const moduleSize = canvas.width;
        
        // QRCode.js canvas has the actual QR drawn at full canvas size
        // We need to determine the module count
        // Since QRCode.js uses a specific module size, we can read directly
        
        // Build SVG from pixel data
        const svgSize = size;
        const pixelSize = canvas.width;
        const scale = svgSize / pixelSize;
        
        let svgContent = '';
        // Read pixels and create rect elements (this is a simple approach)
        // For better SVG, we'd need the QR matrix, but this works
        
        // Simple approach: embed canvas as image in SVG
        const dataUrl = canvas.toDataURL('image/png');
        const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
    <rect width="${svgSize}" height="${svgSize}" fill="${bg}"/>
    <image x="0" y="0" width="${svgSize}" height="${svgSize}" xlink:href="${dataUrl}"/>
</svg>`;

        document.body.removeChild(tempDiv);

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.href = url;
        a.download = `qrcode-${timestamp}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📥 SVG downloaded!');
    } catch (err) {
        console.error(err);
        showToast('❌ SVG export failed!', 'error');
    }
}

// ============ COPY QR IMAGE ============
async function copyQRImage() {
    const canvas = currentQRCanvas || qrContainer.querySelector('canvas');
    if (!canvas) {
        showToast('❌ Please generate a QR code first!', 'error');
        return;
    }

    try {
        canvas.toBlob(async (blob) => {
            if (!blob) {
                showToast('❌ Copy failed!', 'error');
                return;
            }
            try {
                if (navigator.clipboard && window.ClipboardItem) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    showToast('📋 QR image copied to clipboard!');
                } else {
                    throw new Error('Clipboard not supported');
                }
            } catch (err) {
                // Fallback: copy the data string
                if (currentData) {
                    await navigator.clipboard.writeText(currentData);
                    showToast('📋 QR data copied to clipboard!');
                } else {
                    showToast('❌ Copy not supported!', 'error');
                }
            }
        }, 'image/png');
    } catch (err) {
        console.error(err);
        showToast('❌ Copy failed!', 'error');
    }
}

// ============ PRINT QR ============
function printQR() {
    if (!currentData) {
        showToast('❌ Please generate a QR code first!', 'error');
        return;
    }

    const canvas = currentQRCanvas || qrContainer.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print QR Code</title>
            <style>
                body {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                }
                .container {
                    text-align: center;
                    padding: 30px;
                }
                img {
                    max-width: 400px;
                    width: 100%;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                }
                h2 { margin-bottom: 15px; color: #333; }
                p { color: #666; font-size: 13px; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>QR Code</h2>
                <img src="${dataUrl}" alt="QR Code">
                <p>Generated by Tool Hub</p>
            </div>
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 300);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ============ LOGO UPLOAD ============
logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select an image file!', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('❌ Logo must be under 5MB!', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            logoImage = img;
            removeLogoBtn.disabled = false;
            showToast('✅ Logo uploaded! Regenerate QR to apply.');
            
            // Auto regenerate if QR exists
            if (currentData) {
                generateQR();
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

function removeLogo() {
    logoImage = null;
    logoInput.value = '';
    removeLogoBtn.disabled = true;
    showToast('🗑️ Logo removed!');
    
    if (currentData) {
        generateQR();
    }
}

// ============ COLOR SYNC ============
fgColor.addEventListener('input', () => {
    fgColorText.value = fgColor.value.toUpperCase();
});
fgColorText.addEventListener('input', () => {
    const val = fgColorText.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        fgColor.value = val;
    }
});

bgColor.addEventListener('input', () => {
    bgColorText.value = bgColor.value.toUpperCase();
});
bgColorText.addEventListener('input', () => {
    const val = bgColorText.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        bgColor.value = val;
    }
});

// ============ COLOR PRESETS ============
function applyColorPreset(fg, bg) {
    fgColor.value = fg;
    fgColorText.value = fg.toUpperCase();
    bgColor.value = bg;
    bgColorText.value = bg.toUpperCase();
    
    if (currentData) generateQR();
    showToast('🎨 Colors applied!');
}

// ============ SIZE SLIDER ============
sizeSlider.addEventListener('input', () => {
    sizeValue.innerText = sizeSlider.value + 'px';
});

// ============ QUICK TEMPLATES ============
function loadTemplate(name) {
    switchType('text');
    
    setTimeout(() => {
        const input = document.getElementById('input-text');
        if (!input) return;

        const templates = {
            website: 'https://toolhub.com',
            youtube: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
            whatsapp: 'https://wa.me/1234567890?text=Hello%20from%20QR%20code',
            instagram: 'https://instagram.com/username',
            maps: 'https://maps.google.com/?q=New+Delhi',
            upi: 'upi://pay?pa=example@upi&pn=Example&am=100&cu=INR'
        };

        input.value = templates[name] || '';
        input.dispatchEvent(new Event('input'));
        
        const cc = document.getElementById('char-count');
        if (cc) cc.innerText = input.value.length;
        
        generateQR();
        showToast(`✨ ${name.charAt(0).toUpperCase() + name.slice(1)} template loaded!`);
    }, 50);
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'QR Code Generator - Tool Hub',
        text: 'Check out this free QR Code Generator tool!',
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

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateQR();
    }
    // Ctrl/Cmd + Shift + S → Save PNG
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (!downloadPngBtn.disabled) downloadPNG();
    }
});

// ============ INITIALIZE ============
renderInputFields();
// Auto-generate on page load
setTimeout(() => {
    generateQR();
}, 200);