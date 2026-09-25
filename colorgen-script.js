/* ============================================================
   COLOR PALETTE GENERATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ STATE ============
let currentPalette = [];       // [{ hex, rgb, hsl, locked }]
let harmonyMode = 'random';
let paletteHistory = [];
let historyIndex = -1;
let savedPalettes = JSON.parse(localStorage.getItem('toolhub_saved_palettes')) || [];

// ============ DOM ELEMENTS ============
const paletteEl = document.getElementById('palette');
const paletteNameEl = document.getElementById('palette-name');
const countSlider = document.getElementById('count-slider');
const countValue = document.getElementById('count-value');
const saturationSlider = document.getElementById('saturation-slider');
const saturationValue = document.getElementById('saturation-value');
const baseColor = document.getElementById('base-color');
const baseColorText = document.getElementById('base-color-text');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const lockAllIcon = document.getElementById('lock-all-icon');
const savedListEl = document.getElementById('saved-list');
const inspirationGrid = document.getElementById('inspiration-grid');
const clearSavedBtn = document.getElementById('clear-saved-btn');

// ============ COLOR CONVERSION UTILITIES ============
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => {
        const hex = Math.round(255 * x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    const r1 = r / 255, g1 = g / 255, b1 = b / 255;
    const max = Math.max(r1, g1, b1);
    const min = Math.min(r1, g1, b1);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
            case g1: h = (b1 - r1) / d + 2; break;
            case b1: h = (r1 - g1) / d + 4; break;
        }
        h *= 60;
    }

    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastText(hex) {
    return getLuminance(hex) > 0.5 ? '#1e293b' : '#ffffff';
}

// ============ COLOR NAME (Basic) ============
function getColorName(hex) {
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = hexToHsl(hex);

    if (l < 10) return 'Black';
    if (l > 95) return 'White';
    if (s < 10) return l < 40 ? 'Dark Gray' : l < 70 ? 'Gray' : 'Light Gray';

    if (h < 15 || h >= 345) return l < 50 ? 'Maroon' : 'Red';
    if (h < 45) return l < 50 ? 'Brown' : l < 70 ? 'Orange' : 'Peach';
    if (h < 70) return l < 50 ? 'Olive' : 'Yellow';
    if (h < 160) return l < 40 ? 'Dark Green' : l < 70 ? 'Green' : 'Light Green';
    if (h < 200) return l < 50 ? 'Teal' : 'Cyan';
    if (h < 250) return l < 50 ? 'Navy' : 'Blue';
    if (h < 290) return l < 50 ? 'Indigo' : 'Purple';
    if (h < 345) return l < 50 ? 'Magenta' : 'Pink';
    return 'Color';
}

// ============ PALETTE NAME GENERATOR ============
const NAME_ADJ = ['Sunset', 'Ocean', 'Forest', 'Cosmic', 'Desert', 'Arctic', 'Tropical', 'Vintage', 'Neon', 'Pastel', 'Royal', 'Mystic', 'Vibrant', 'Serene', 'Electric', 'Golden', 'Silver', 'Ruby', 'Emerald', 'Sapphire'];
const NAME_NOUN = ['Vibes', 'Dream', 'Wave', 'Bloom', 'Sky', 'Breeze', 'Glow', 'Pulse', 'Aura', 'Mist', 'Dawn', 'Dusk', 'Echo', 'Harmony', 'Journey', 'Story', 'Vision', 'Escape', 'Rhythm', 'Symphony'];

function generatePaletteName() {
    const adj = NAME_ADJ[Math.floor(Math.random() * NAME_ADJ.length)];
    const noun = NAME_NOUN[Math.floor(Math.random() * NAME_NOUN.length)];
    return `${adj} ${noun}`;
}

// ============ GENERATE COLOR BY HARMONY ============
function generateColorsByHarmony(count) {
    const sat = parseInt(saturationSlider.value);
    const baseHsl = hexToHsl(baseColor.value);
    const colors = [];

    switch (harmonyMode) {
        case 'random':
            for (let i = 0; i < count; i++) {
                const h = Math.floor(Math.random() * 360);
                const s = sat + Math.floor(Math.random() * 20 - 10);
                const l = 40 + Math.floor(Math.random() * 30);
                colors.push(hslToHex(h, Math.max(20, Math.min(100, s)), l));
            }
            break;

        case 'analogous':
            for (let i = 0; i < count; i++) {
                const offset = (i - Math.floor(count / 2)) * 25;
                const h = (baseHsl.h + offset + 360) % 360;
                const l = 40 + (i % 3) * 15;
                colors.push(hslToHex(h, sat, l));
            }
            break;

        case 'monochromatic':
            for (let i = 0; i < count; i++) {
                const l = 15 + (i * 70 / (count - 1 || 1));
                colors.push(hslToHex(baseHsl.h, sat, Math.round(l)));
            }
            break;

        case 'complementary':
            for (let i = 0; i < count; i++) {
                const h = i < Math.ceil(count / 2) 
                    ? baseHsl.h 
                    : (baseHsl.h + 180) % 360;
                const l = 30 + (i % 3) * 20;
                colors.push(hslToHex(h, sat, l));
            }
            break;

        case 'triadic': {
            const triad = [baseHsl.h, (baseHsl.h + 120) % 360, (baseHsl.h + 240) % 360];
            for (let i = 0; i < count; i++) {
                const h = triad[i % 3];
                const l = 35 + Math.floor(i / 3) * 20;
                colors.push(hslToHex(h, sat, l));
            }
            break;
        }

        case 'tetradic': {
            const tetrad = [baseHsl.h, (baseHsl.h + 90) % 360, (baseHsl.h + 180) % 360, (baseHsl.h + 270) % 360];
            for (let i = 0; i < count; i++) {
                const h = tetrad[i % 4];
                const l = 35 + Math.floor(i / 4) * 20;
                colors.push(hslToHex(h, sat, l));
            }
            break;
        }
    }

    return colors;
}

// ============ GENERATE PALETTE ============
function generatePalette(saveToHistory = true) {
    const count = parseInt(countSlider.value);
    
    // Save current state to history before regenerating
    if (saveToHistory && currentPalette.length > 0) {
        saveHistoryState();
    }

    // Generate new colors
    const newColors = generateColorsByHarmony(count);

    // Preserve locked colors and their positions
    const newPalette = [];
    let newColorIndex = 0;

    for (let i = 0; i < count; i++) {
        if (currentPalette[i] && currentPalette[i].locked) {
            newPalette.push({ ...currentPalette[i] });
        } else {
            const hex = newColors[newColorIndex++] || newColors[0];
            newPalette.push({
                hex: hex,
                rgb: hexToRgb(hex),
                hsl: hexToHsl(hex),
                locked: false
            });
        }
    }

    currentPalette = newPalette;
    paletteNameEl.innerText = generatePaletteName();
    renderPalette();
}

// ============ RENDER PALETTE ============
function renderPalette() {
    paletteEl.innerHTML = currentPalette.map((color, idx) => {
        const textColor = getContrastText(color.hex);
        const name = getColorName(color.hex);
        const lockedClass = color.locked ? 'locked' : '';
        const lockIcon = color.locked ? 'fa-lock' : 'fa-lock-open';

        return `
            <div class="color-card" style="background: ${color.hex};" 
                 onclick="copyColor('${color.hex}')"
                 title="Click to copy ${color.hex}">
                <button class="lock-btn ${lockedClass}" 
                        onclick="event.stopPropagation(); toggleLock(${idx})"
                        title="${color.locked ? 'Unlock' : 'Lock'}">
                    <i class="fa-solid ${lockIcon}"></i>
                </button>
                <button class="copy-btn" 
                        onclick="event.stopPropagation(); copyColor('${color.hex}')"
                        title="Copy hex">
                    <i class="fa-solid fa-copy"></i>
                </button>
                <div class="color-swatch"></div>
                <div class="color-info" style="color: ${textColor};">
                    <div class="color-hex">${color.hex}</div>
                    <div class="color-rgb">rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})</div>
                    <div class="color-name">${name}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============ LOCK/UNLOCK ============
function toggleLock(idx) {
    if (!currentPalette[idx]) return;
    currentPalette[idx].locked = !currentPalette[idx].locked;
    renderPalette();
    showToast(currentPalette[idx].locked ? '🔒 Color locked' : '🔓 Color unlocked');
}

function toggleLockAll() {
    const allLocked = currentPalette.every(c => c.locked);
    currentPalette.forEach(c => c.locked = !allLocked);
    lockAllIcon.className = allLocked ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock';
    renderPalette();
    showToast(allLocked ? '🔓 All unlocked' : '🔒 All locked');
}

// ============ COPY COLOR ============
function copyColor(hex) {
    navigator.clipboard.writeText(hex).then(() => {
        showToast(`📋 ${hex} copied!`);
    }).catch(() => {
        fallbackCopy(hex);
    });
}

function copyHexAll() {
    if (currentPalette.length === 0) return;
    const hexList = currentPalette.map(c => c.hex).join(', ');
    navigator.clipboard.writeText(hexList).then(() => {
        showToast(`📋 All ${currentPalette.length} hex codes copied!`);
    }).catch(() => {
        fallbackCopy(hexList);
    });
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('📋 Copied!');
    } catch (e) {
        showToast('❌ Copy failed!', 'error');
    }
    document.body.removeChild(ta);
}

// ============ HISTORY (UNDO/REDO) ============
function saveHistoryState() {
    // Truncate future if we're not at the end
    if (historyIndex < paletteHistory.length - 1) {
        paletteHistory = paletteHistory.slice(0, historyIndex + 1);
    }
    paletteHistory.push(currentPalette.map(c => ({ ...c })));
    historyIndex = paletteHistory.length - 1;
    if (paletteHistory.length > 30) {
        paletteHistory.shift();
        historyIndex--;
    }
    updateHistoryButtons();
}

function undoPalette() {
    if (historyIndex <= 0) return;
    historyIndex--;
    currentPalette = paletteHistory[historyIndex].map(c => ({ ...c }));
    renderPalette();
    updateHistoryButtons();
    showToast('↩️ Undo');
}

function redoPalette() {
    if (historyIndex >= paletteHistory.length - 1) return;
    historyIndex++;
    currentPalette = paletteHistory[historyIndex].map(c => ({ ...c }));
    renderPalette();
    updateHistoryButtons();
    showToast('↪️ Redo');
}

function updateHistoryButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= paletteHistory.length - 1;
}

// ============ HARMONY MODE ============
function setHarmony(mode) {
    harmonyMode = mode;
    document.querySelectorAll('.harmony-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    generatePalette();
    showToast(`🎨 ${mode.charAt(0).toUpperCase() + mode.slice(1)} mode`);
}

// ============ BASE COLOR ============
function randomizeBase() {
    const h = Math.floor(Math.random() * 360);
    const s = 60 + Math.floor(Math.random() * 30);
    const l = 40 + Math.floor(Math.random() * 20);
    const hex = hslToHex(h, s, l);
    baseColor.value = hex;
    baseColorText.value = hex;
    if (harmonyMode !== 'random') generatePalette();
    showToast(`🎲 Base color: ${hex}`);
}

baseColor.addEventListener('input', () => {
    baseColorText.value = baseColor.value.toUpperCase();
    if (harmonyMode !== 'random') generatePalette();
});

baseColorText.addEventListener('input', () => {
    const val = baseColorText.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        baseColor.value = val;
        if (harmonyMode !== 'random') generatePalette();
    }
});

// ============ SLIDERS ============
countSlider.addEventListener('input', () => {
    countValue.innerText = countSlider.value;
});

countSlider.addEventListener('change', () => {
    generatePalette();
});

saturationSlider.addEventListener('input', () => {
    saturationValue.innerText = saturationSlider.value + '%';
});

saturationSlider.addEventListener('change', () => {
    generatePalette();
});

// ============ EXPORTS ============
function exportCSS() {
    if (currentPalette.length === 0) return showToast('❌ No palette!', 'error');
    let css = `/* Generated by Tool Hub - Color Palette Generator */\n:root {\n`;
    currentPalette.forEach((c, i) => {
        css += `  --color-${i + 1}: ${c.hex};\n`;
    });
    css += `}\n`;
    downloadFile(css, 'text/css', `palette-${Date.now()}.css`);
    showToast('📥 CSS downloaded!');
}

function exportTailwind() {
    if (currentPalette.length === 0) return showToast('❌ No palette!', 'error');
    let config = `// Generated by Tool Hub - Color Palette Generator\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n`;
    currentPalette.forEach((c, i) => {
        config += `          ${(i + 1) * 100}: '${c.hex}',\n`;
    });
    config += `        }\n      }\n    }\n  }\n};\n`;
    downloadFile(config, 'text/javascript', `tailwind.config-${Date.now()}.js`);
    showToast('📥 Tailwind config downloaded!');
}

function exportJSON() {
    if (currentPalette.length === 0) return showToast('❌ No palette!', 'error');
    const data = {
        name: paletteNameEl.innerText,
        generated: new Date().toISOString(),
        colors: currentPalette.map((c, i) => ({
            position: i + 1,
            hex: c.hex,
            rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
            hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`
        }))
    };
    downloadFile(JSON.stringify(data, null, 2), 'application/json', `palette-${Date.now()}.json`);
    showToast('📥 JSON downloaded!');
}

function exportText() {
    if (currentPalette.length === 0) return showToast('❌ No palette!', 'error');
    let text = `Palette: ${paletteNameEl.innerText}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `─────────────────────────────\n\n`;
    currentPalette.forEach((c, i) => {
        text += `${i + 1}. ${c.hex}   rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})   hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)\n`;
    });
    downloadFile(text, 'text/plain', `palette-${Date.now()}.txt`);
    showToast('📥 Text file downloaded!');
}

function exportPNG() {
    if (currentPalette.length === 0) return showToast('❌ No palette!', 'error');
    
    const canvas = document.createElement('canvas');
    const count = currentPalette.length;
    const swatchWidth = 200;
    const swatchHeight = 300;
    const infoHeight = 80;
    const padding = 40;

    canvas.width = swatchWidth * count + padding * 2;
    canvas.height = swatchHeight + infoHeight + padding * 2 + 60;

    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(paletteNameEl.innerText, canvas.width / 2, padding + 30);

    // Color swatches
    currentPalette.forEach((c, i) => {
        const x = padding + i * swatchWidth;
        const y = padding + 60;

        // Swatch
        ctx.fillStyle = c.hex;
        ctx.fillRect(x, y, swatchWidth, swatchHeight);

        // Hex text
        ctx.fillStyle = getContrastText(c.hex);
        ctx.font = 'bold 22px Consolas, Monaco, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(c.hex, x + swatchWidth / 2, y + swatchHeight / 2);
    });

    // Info
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Segoe UI, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Generated by Tool Hub • ${new Date().toLocaleDateString()}`, canvas.width / 2, canvas.height - padding + 10);

    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `palette-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📥 PNG downloaded!');
    }, 'image/png');
}

function exportSVG() {
    if (currentPalette.length === 0) return showToast('❌ No palette!', 'error');
    
    const count = currentPalette.length;
    const swatchWidth = 200;
    const swatchHeight = 300;
    const padding = 40;
    const width = swatchWidth * count + padding * 2;
    const height = swatchHeight + padding * 2 + 80;

    let rects = '';
    currentPalette.forEach((c, i) => {
        const x = padding + i * swatchWidth;
        const y = padding + 60;
        const textColor = getContrastText(c.hex);
        rects += `  <rect x="${x}" y="${y}" width="${swatchWidth}" height="${swatchHeight}" fill="${c.hex}"/>\n`;
        rects += `  <text x="${x + swatchWidth / 2}" y="${y + swatchHeight / 2}" fill="${textColor}" font-family="Consolas,monospace" font-size="22" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${c.hex}</text>\n`;
    });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <text x="${width / 2}" y="${padding + 30}" fill="#1e293b" font-family="Segoe UI,Arial" font-size="28" font-weight="bold" text-anchor="middle">${escapeXml(paletteNameEl.innerText)}</text>
${rects}
  <text x="${width / 2}" y="${height - padding + 20}" fill="#64748b" font-family="Segoe UI,Arial" font-size="14" text-anchor="middle">Generated by Tool Hub</text>
</svg>`;

    downloadFile(svg, 'image/svg+xml', `palette-${Date.now()}.svg`);
    showToast('📥 SVG downloaded!');
}

function escapeXml(str) {
    return String(str).replace(/[<>&'"]/g, c => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
    }[c]));
}

function downloadFile(content, type, filename) {
    const blob = new Blob([content], { type: type + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============ SAVE PALETTES ============
function saveCurrentPalette() {
    if (currentPalette.length === 0) return showToast('❌ No palette to save!', 'error');
    
    const saved = {
        id: Date.now(),
        name: paletteNameEl.innerText,
        colors: currentPalette.map(c => c.hex),
        date: new Date().toISOString()
    };

    savedPalettes.unshift(saved);
    if (savedPalettes.length > 50) savedPalettes.pop();
    localStorage.setItem('toolhub_saved_palettes', JSON.stringify(savedPalettes));
    renderSavedPalettes();
    showToast('💾 Palette saved!');
}

function renderSavedPalettes() {
    clearSavedBtn.disabled = savedPalettes.length === 0;

    if (savedPalettes.length === 0) {
        savedListEl.innerHTML = `
            <p class="empty-saved">
                <i class="fa-solid fa-inbox"></i>
                No saved palettes yet. Click "Save Current" to save your favorite palettes.
            </p>
        `;
        return;
    }

    savedListEl.innerHTML = savedPalettes.map(p => `
        <div class="saved-item" onclick="loadSavedPalette(${p.id})">
            <div class="saved-colors">
                ${p.colors.map(c => `<div style="background:${c};" title="${c}"></div>`).join('')}
            </div>
            <div class="saved-info">
                <div>
                    <div style="font-size:0.85rem;font-weight:600;color:var(--text-color);">${escapeHtml(p.name)}</div>
                    <div class="saved-date">${formatDate(p.date)}</div>
                </div>
                <button class="saved-delete" onclick="event.stopPropagation(); deleteSavedPalette(${p.id})" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadSavedPalette(id) {
    const p = savedPalettes.find(x => x.id === id);
    if (!p) return;
    
    currentPalette = p.colors.map(hex => ({
        hex: hex,
        rgb: hexToRgb(hex),
        hsl: hexToHsl(hex),
        locked: false
    }));
    paletteNameEl.innerText = p.name;
    countSlider.value = p.colors.length;
    countValue.innerText = p.colors.length;
    renderPalette();
    saveHistoryState();
    showToast(`📂 Loaded: ${p.name}`);
}

function deleteSavedPalette(id) {
    savedPalettes = savedPalettes.filter(p => p.id !== id);
    localStorage.setItem('toolhub_saved_palettes', JSON.stringify(savedPalettes));
    renderSavedPalettes();
    showToast('🗑️ Palette deleted');
}

function clearAllSaved() {
    if (savedPalettes.length === 0) return;
    if (!confirm('Kya aap saari saved palettes delete karna chahte hain?')) return;
    savedPalettes = [];
    localStorage.removeItem('toolhub_saved_palettes');
    renderSavedPalettes();
    showToast('🧹 All saved palettes cleared!');
}

function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

// ============ INSPIRATION PALETTES ============
const POPULAR_PALETTES = [
    { name: 'Ocean Breeze', colors: ['#05445E', '#189AB4', '#75E6DA', '#D4F1F4', '#F0F9FF'] },
    { name: 'Sunset Glow', colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#F38181', '#AA96DA'] },
    { name: 'Forest Walk', colors: ['#2D5A27', '#4A7C59', '#8FCB9B', '#C9E4CA', '#E8F4EA'] },
    { name: 'Cosmic Dust', colors: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#F5A623'] },
    { name: 'Pastel Dream', colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'] },
    { name: 'Vintage Wine', colors: ['#3D0814', '#5C1A2E', '#8B3A62', '#C97777', '#E8B4B8'] },
    { name: 'Neon Nights', colors: ['#0F0F0F', '#FF006E', '#8338EC', '#3A86FF', '#06FFA5'] },
    { name: 'Desert Sand', colors: ['#8B4513', '#CD853F', '#DEB887', '#F5DEB3', '#FFFAF0'] },
    { name: 'Arctic Ice', colors: ['#0A2463', '#3E92CC', '#78C0E0', '#B8E0F5', '#EBF5FB'] },
    { name: 'Tropical Fruit', colors: ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#3A86FF'] },
    { name: 'Royal Purple', colors: ['#240046', '#3C096C', '#5A189A', '#7B2CBF', '#9D4EDD'] },
    { name: 'Minimal Gray', colors: ['#212529', '#495057', '#6C757D', '#ADB5BD', '#DEE2E6'] }
];

function renderInspiration() {
    inspirationGrid.innerHTML = POPULAR_PALETTES.map((p, idx) => `
        <div class="inspiration-card" onclick="loadInspiration(${idx})">
            <div class="inspiration-colors">
                ${p.colors.map(c => `<div style="background:${c};" title="${c}"></div>`).join('')}
            </div>
            <div class="inspiration-name">
                ${escapeHtml(p.name)}
                <small>${p.colors.length} colors</small>
            </div>
        </div>
    `).join('');
}

function loadInspiration(idx) {
    const p = POPULAR_PALETTES[idx];
    if (!p) return;
    
    currentPalette = p.colors.map(hex => ({
        hex: hex,
        rgb: hexToRgb(hex),
        hsl: hexToHsl(hex),
        locked: false
    }));
    paletteNameEl.innerText = p.name;
    countSlider.value = p.colors.length;
    countValue.innerText = p.colors.length;
    renderPalette();
    saveHistoryState();
    showToast(`✨ Loaded: ${p.name}`);
}

// ============ HELPERS ============
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============ SHARE TOOL ============
function shareTool() {
    const shareData = {
        title: 'Color Palette Generator - Tool Hub',
        text: 'Check out this free Color Palette Generator tool!',
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
    }, 2200);
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
    // Space → Generate
    if (e.key === ' ' && !e.target.matches('input, textarea, select') && !e.target.matches('button')) {
        e.preventDefault();
        generatePalette();
    }
    // Ctrl/Cmd + Z → Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoPalette();
    }
    // Ctrl/Cmd + Shift + Z or Ctrl+Y → Redo
    if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') || 
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redoPalette();
    }
    // Ctrl/Cmd + Shift + C → Copy all hex
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyHexAll();
    }
});

// ============ INITIALIZE ============
generatePalette(false);
saveHistoryState();
renderSavedPalettes();
renderInspiration();