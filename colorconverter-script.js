/* ============================================================
   COLOR CONVERTER - Advanced Logic
   HEX · RGB · HSL · HSV · CMYK · HWB · Palette · Shades ·
   Contrast · Harmony
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const ccCard         = document.getElementById("ccCard");

    const previewSwatch  = document.getElementById("previewSwatch");
    const swatchHex      = document.getElementById("swatchHex");
    const swatchName     = document.getElementById("swatchName");
    const nativePicker   = document.getElementById("nativeColorPicker");
    const randomColorBtn = document.getElementById("randomColorBtn");
    const copyHexBtn     = document.getElementById("copyHexBtn");
    const clearColorBtn  = document.getElementById("clearColorBtn");

    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");

    const colorInput     = document.getElementById("colorInput");
    const pasteColorBtn  = document.getElementById("pasteColorBtn");
    const clearColorInput= document.getElementById("clearColorInput");
    const formatsGrid    = document.getElementById("formatsGrid");
    const cssOutput      = document.getElementById("cssOutput");
    const copyCssVars    = document.getElementById("copyCssVars");

    const paletteTypes   = document.querySelectorAll(".pt-btn");
    const paletteGrid    = document.getElementById("paletteGrid");
    const copyPaletteHex = document.getElementById("copyPaletteHex");
    const exportPaletteCss = document.getElementById("exportPaletteCss");
    const exportPaletteSvg = document.getElementById("exportPaletteSvg");

    const bcdSwatch      = document.getElementById("bcdSwatch");
    const bcdHex         = document.getElementById("bcdHex");
    const bcdRgb         = document.getElementById("bcdRgb");
    const shadesGrid     = document.getElementById("shadesGrid");
    const tintsGrid      = document.getElementById("tintsGrid");
    const tonesGrid      = document.getElementById("tonesGrid");

    const contrastBgPicker = document.getElementById("contrastBgPicker");
    const contrastResults  = document.getElementById("contrastResults");
    const contrastPreview  = document.getElementById("contrastPreview");

    const harmonyWheel   = document.getElementById("harmonyWheel");
    const hwCenter       = document.getElementById("hwCenter");
    const harmonyDetails = document.getElementById("harmonyDetails");

    const ccHistoryList  = document.getElementById("ccHistoryList");
    const clearCcHistory = document.getElementById("clearCcHistory");

    /* ---------------- State ---------------- */
    let currentColor     = { r: 59, g: 130, b: 246 }; // #3B82F6
    let currentMode      = "convert";
    let currentPalette   = "complementary";
    let currentBg        = "#ffffff";
    let history          = loadHistory();
    let autoTimer        = null;

    /* ---------------- Constants ---------------- */
    const NAMED_COLORS = {
        black: "#000000", white: "#ffffff", red: "#ff0000", lime: "#00ff00",
        blue: "#0000ff", yellow: "#ffff00", cyan: "#00ffff", aqua: "#00ffff",
        magenta: "#ff00ff", fuchsia: "#ff00ff", silver: "#c0c0c0", gray: "#808080",
        grey: "#808080", maroon: "#800000", olive: "#808000", green: "#008000",
        purple: "#800080", teal: "#008080", navy: "#000080", orange: "#ffa500",
        pink: "#ffc0cb", brown: "#a52a2a", gold: "#ffd700", indigo: "#4b0082",
        violet: "#ee82ee", salmon: "#fa8072", coral: "#ff7f50", tomato: "#ff6347",
        crimson: "#dc143c", darkblue: "#00008b", darkgreen: "#006400",
        darkred: "#8b0000", lightblue: "#add8e6", lightgreen: "#90ee90",
        lightgray: "#d3d3d3", lightgrey: "#d3d3d3", darkgray: "#a9a9a9",
        darkgrey: "#a9a9a9", turquoise: "#40e0d0", tan: "#d2b48c",
        beige: "#f5f5dc", ivory: "#fffff0", khaki: "#f0e68c", orchid: "#da70d6",
        plum: "#dda0dd", skyblue: "#87ceeb", steelblue: "#4682b4",
        chocolate: "#d2691e", firebrick: "#b22222", goldenrod: "#daa520",
        hotpink: "#ff69b4", limegreen: "#32cd32", midnightblue: "#191970",
        royalblue: "#4169e1", seagreen: "#2e8b57", slateblue: "#6a5acd",
        slateGray: "#708090", springgreen: "#00ff7f", thistle: "#d8bfd8",
    };

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_colorconv_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_colorconv_history", JSON.stringify(history.slice(0, 24)));
        } catch (e) {}
    }

    /* ============================================================
       HELPERS
       ============================================================ */
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    function hex2(n) {
        const h = clamp(Math.round(n), 0, 255).toString(16);
        return h.length === 1 ? "0" + h : h;
    }

    /* ============================================================
       COLOR CONVERSIONS
       ============================================================ */
    function rgbToHex(r, g, b) {
        return "#" + hex2(r) + hex2(g) + hex2(b);
    }

    function hexToRgb(hex) {
        let h = hex.replace(/^#/, "");
        if (h.length === 3) h = h.split("").map((c) => c + c).join("");
        if (h.length !== 6 && h.length !== 8) return null;
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        const a = h.length === 8 ? parseInt(h.substring(6, 8), 16) / 255 : 1;
        if ([r, g, b].some(isNaN)) return null;
        return { r, g, b, a };
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h = 0, s = 0;
        const l = (max + min) / 2;

        if (d !== 0) {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
                case g: h = ((b - r) / d + 2); break;
                case b: h = ((r - g) / d + 4); break;
            }
            h *= 60;
        }

        return {
            h: Math.round(h),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    }

    function hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (h < 60)      { r = c; g = x; b = 0; }
        else if (h < 120){ r = x; g = c; b = 0; }
        else if (h < 180){ r = 0; g = c; b = x; }
        else if (h < 240){ r = 0; g = x; b = c; }
        else if (h < 300){ r = x; g = 0; b = c; }
        else             { r = c; g = 0; b = x; }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
        };
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;

        if (d !== 0) {
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
                case g: h = ((b - r) / d + 2); break;
                case b: h = ((r - g) / d + 4); break;
            }
            h *= 60;
        }

        return {
            h: Math.round(h),
            s: Math.round(s * 100),
            v: Math.round(v * 100),
        };
    }

    function rgbToCmyk(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const k = 1 - Math.max(r, g, b);
        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        const c = (1 - r - k) / (1 - k);
        const m = (1 - g - k) / (1 - k);
        const y = (1 - b - k) / (1 - k);
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100),
        };
    }

    function rgbToHwb(r, g, b) {
        const hsl = rgbToHsl(r, g, b);
        const h = hsl.h;
        const w = Math.round((Math.min(r, g, b) / 255) * 100);
        const bl = Math.round((1 - Math.max(r, g, b) / 255) * 100);
        return { h, w, b: bl };
    }

    /* ============================================================
       COLOR PARSER
       ============================================================ */
    function parseColor(str) {
        if (!str) return null;
        const s = String(str).trim().toLowerCase();

        // Named color
        if (NAMED_COLORS[s]) return hexToRgb(NAMED_COLORS[s]);

        // HEX
        if (/^#?[0-9a-f]{3}$/i.test(s) || /^#?[0-9a-f]{6}$/i.test(s) || /^#?[0-9a-f]{8}$/i.test(s)) {
            const rgb = hexToRgb(s.startsWith("#") ? s : "#" + s);
            if (rgb) return rgb;
        }

        // rgb(r, g, b) or rgba(r, g, b, a)
        let m = s.match(/^rgba?\s*\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)(?:\s*[,/ ]\s*(\d*\.?\d+))?\s*\)$/);
        if (m) {
            return {
                r: clamp(Math.round(parseFloat(m[1])), 0, 255),
                g: clamp(Math.round(parseFloat(m[2])), 0, 255),
                b: clamp(Math.round(parseFloat(m[3])), 0, 255),
                a: m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1,
            };
        }

        // hsl(h, s%, l%) or hsla(...)
        m = s.match(/^hsla?\s*\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%(?:\s*[,/ ]\s*(\d*\.?\d+))?\s*\)$/);
        if (m) {
            const rgb = hslToRgb(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
            return {
                r: rgb.r, g: rgb.g, b: rgb.b,
                a: m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : 1,
            };
        }

        // hsv(h, s%, v%)
        m = s.match(/^hsv\s*\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%\s*\)$/);
        if (m) {
            const h = parseFloat(m[1]);
            const sv = parseFloat(m[2]) / 100;
            const v = parseFloat(m[3]) / 100;
            // HSV → HSL
            const l = v * (1 - sv / 2);
            const sl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l);
            const rgb = hslToRgb(h, sl * 100, l * 100);
            return { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 };
        }

        // hwb(h, w%, b%)
        m = s.match(/^hwb\s*\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)%\s*[, ]\s*(\d+(?:\.\d+)?)%\s*\)$/);
        if (m) {
            const h = parseFloat(m[1]);
            const w = parseFloat(m[2]) / 100;
            const bl = parseFloat(m[3]) / 100;
            // HWB → RGB: pure hue then mix with white/black
            const pureRgb = hslToRgb(h, 100, 50);
            // Mix
            const total = w + bl;
            if (total >= 1) {
                const gray = Math.round((w / total) * 255);
                return { r: gray, g: gray, b: gray, a: 1 };
            }
            const factor = 1 - total;
            const r = pureRgb.r * factor + w * 255;
            const g = pureRgb.g * factor + w * 255;
            const b = pureRgb.b * factor + w * 255;
            return {
                r: clamp(Math.round(r), 0, 255),
                g: clamp(Math.round(g), 0, 255),
                b: clamp(Math.round(b), 0, 255),
                a: 1,
            };
        }

        // cmyk(c%, m%, y%, k%)
        m = s.match(/^cmyk\s*\(\s*(\d+(?:\.\d+)?)%?\s*[, ]\s*(\d+(?:\.\d+)?)%?\s*[, ]\s*(\d+(?:\.\d+)?)%?\s*[, ]\s*(\d+(?:\.\d+)?)%?\s*\)$/);
        if (m) {
            const c = parseFloat(m[1]) / 100;
            const mg = parseFloat(m[2]) / 100;
            const y = parseFloat(m[3]) / 100;
            const k = parseFloat(m[4]) / 100;
            const r = 255 * (1 - c) * (1 - k);
            const g = 255 * (1 - mg) * (1 - k);
            const b = 255 * (1 - y) * (1 - k);
            return {
                r: clamp(Math.round(r), 0, 255),
                g: clamp(Math.round(g), 0, 255),
                b: clamp(Math.round(b), 0, 255),
                a: 1,
            };
        }

        return null;
    }

    /* ============================================================
       COLOR NAME APPROXIMATION
       ============================================================ */
    function approximateName(r, g, b) {
        // Find nearest named color
        let bestName = "Custom";
        let bestDist = Infinity;
        for (const [name, hex] of Object.entries(NAMED_COLORS)) {
            const rgb = hexToRgb(hex);
            const d = (rgb.r - r) ** 2 + (rgb.g - g) ** 2 + (rgb.b - b) ** 2;
            if (d < bestDist) {
                bestDist = d;
                bestName = name;
            }
        }
        // If very close, use name; else compute descriptive name
        if (bestDist < 400) {
            return bestName.charAt(0).toUpperCase() + bestName.slice(1);
        }
        // Descriptive based on HSL
        const hsl = rgbToHsl(r, g, b);
        let hue = "Color";
        if (hsl.s < 10) hue = hsl.l < 20 ? "Black" : hsl.l > 85 ? "White" : "Gray";
        else if (hsl.h < 15 || hsl.h >= 345) hue = "Red";
        else if (hsl.h < 45) hue = "Orange";
        else if (hsl.h < 70) hue = "Yellow";
        else if (hsl.h < 150) hue = "Green";
        else if (hsl.h < 200) hue = "Cyan";
        else if (hsl.h < 255) hue = "Blue";
        else if (hsl.h < 290) hue = "Purple";
        else if (hsl.h < 345) hue = "Pink";
        let prefix = "";
        if (hsl.l < 25) prefix = "Dark ";
        else if (hsl.l > 75) prefix = "Light ";
        return prefix + hue;
    }

    /* ============================================================
       UPDATE UI (all modes)
       ============================================================ */
    function updateAllFromRgb(rgb, options = {}) {
        currentColor = { r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a !== undefined ? rgb.a : 1 };

        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
        const hwb = rgbToHwb(rgb.r, rgb.g, rgb.b);
        const name = approximateName(rgb.r, rgb.g, rgb.b);

        // Preview swatch
        previewSwatch.style.background = hex;
        swatchHex.textContent = hex.toUpperCase();
        swatchName.textContent = name;

        // Auto text color for readability
        const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        const infoEl = document.getElementById("swatchInfo");
        if (lum > 0.6) {
            infoEl.style.background = "linear-gradient(to top, rgba(0,0,0,0.35), transparent)";
            infoEl.style.color = "#000";
            swatchHex.style.color = "#000";
            swatchHex.style.textShadow = "0 1px 3px rgba(255,255,255,0.6)";
            swatchName.style.color = "rgba(0,0,0,0.75)";
        } else {
            infoEl.style.background = "linear-gradient(to top, rgba(0,0,0,0.5), transparent)";
            swatchHex.style.color = "#fff";
            swatchHex.style.textShadow = "0 2px 8px rgba(0,0,0,0.4)";
            swatchName.style.color = "rgba(255,255,255,0.92)";
        }

        // Native picker
        nativePicker.value = hex;

        // Hex label in history
        nativePicker.title = hex.toUpperCase();

        // Formats grid
        renderFormats(rgb, hex, hsl, hsv, cmyk, hwb, name);

        // CSS Vars
        renderCssVars(hex, rgb, hsl);

        // Base color display
        if (bcdSwatch) {
            bcdSwatch.style.background = hex;
            bcdHex.textContent = hex.toUpperCase();
            bcdRgb.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }

        // Palette
        renderPalette(rgb, hsl);

        // Shades/tints/tones
        renderShades(hsl);

        // Contrast
        renderContrast();

        // Harmony
        renderHarmony(hsl);

        // History (only if not silent)
        if (!options.silent) {
            pushHistory(hex);
        }
    }

    /* ============================================================
       RENDER FORMATS
       ============================================================ */
    function renderFormats(rgb, hex, hsl, hsv, cmyk, hwb, name) {
        const a = rgb.a !== undefined ? rgb.a : 1;
        const hasAlpha = a < 1;
        const rgbStr = hasAlpha
            ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a.toFixed(2)})`
            : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        const hslStr = hasAlpha
            ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a.toFixed(2)})`
            : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

        const items = [
            { label: "HEX", icon: "fa-hashtag", value: hex.toUpperCase() },
            { label: "HEX (no #)", icon: "fa-hashtag", value: hex.toUpperCase().replace("#", "") },
            { label: "RGB", icon: "fa-square", value: rgbStr },
            { label: "RGB Values", icon: "fa-list-ol", value: `${rgb.r}, ${rgb.g}, ${rgb.b}` },
            { label: "HSL", icon: "fa-circle-half-stroke", value: hslStr },
            { label: "HSL Values", icon: "fa-list-ol", value: `${hsl.h}°, ${hsl.s}%, ${hsl.l}%` },
            { label: "HSV / HSB", icon: "fa-palette", value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)` },
            { label: "CMYK", icon: "fa-print", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
            { label: "HWB", icon: "fa-paint-roller", value: `hwb(${hwb.h}, ${hwb.w}%, ${hwb.b}%)` },
            { label: "CSS Name", icon: "fa-tag", value: name },
        ];

        formatsGrid.innerHTML = items.map((it, i) => `
            <div class="format-item" style="animation-delay:${i * 0.03}s">
                <div class="format-label"><i class="fa-solid ${it.icon}"></i> ${it.label}</div>
                <div class="format-value">${escapeHtml(it.value)}</div>
                <button class="format-copy" data-copy="${escapeHtml(it.value)}" title="Copy">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
        `).join("");

        formatsGrid.querySelectorAll(".format-copy").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.copy);
            });
        });
    }

    /* ============================================================
       CSS VARIABLES
       ============================================================ */
    function renderCssVars(hex, rgb, hsl) {
        const r = rgb.r, g = rgb.g, b = rgb.b;
        const rgba = `rgba(${r}, ${g}, ${b}, 0.5)`;
        const textOnColor = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#000000" : "#ffffff";

        cssOutput.textContent = `:root {
  --color-hex: ${hex.toUpperCase()};
  --color-rgb: rgb(${r}, ${g}, ${b});
  --color-hsl: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%);
  --color-alpha: ${rgba};
  --color-on: ${textOnColor};
}`;
    }

    copyCssVars.addEventListener("click", () => {
        copyToClipboard(cssOutput.textContent);
    });

    /* ============================================================
       PALETTE
       ============================================================ */
    function getPaletteColors(hsl, type) {
        const { h, s, l } = hsl;
        switch (type) {
            case "complementary":
                return [
                    { h, s, l, label: "Base" },
                    { h: (h + 180) % 360, s, l, label: "Complement" },
                ];
            case "analogous":
                return [
                    { h: (h - 30 + 360) % 360, s, l, label: "-30°" },
                    { h, s, l, label: "Base" },
                    { h: (h + 30) % 360, s, l, label: "+30°" },
                ];
            case "triadic":
                return [
                    { h, s, l, label: "Base" },
                    { h: (h + 120) % 360, s, l, label: "+120°" },
                    { h: (h + 240) % 360, s, l, label: "+240°" },
                ];
            case "tetradic":
                return [
                    { h, s, l, label: "Base" },
                    { h: (h + 90) % 360, s, l, label: "+90°" },
                    { h: (h + 180) % 360, s, l, label: "+180°" },
                    { h: (h + 270) % 360, s, l, label: "+270°" },
                ];
            case "split":
                return [
                    { h, s, l, label: "Base" },
                    { h: (h + 150) % 360, s, l, label: "+150°" },
                    { h: (h + 210) % 360, s, l, label: "+210°" },
                ];
            case "monochrome":
                return [
                    { h, s, l: clamp(l - 30, 5, 95), label: "-30 L" },
                    { h, s, l: clamp(l - 15, 5, 95), label: "-15 L" },
                    { h, s, l, label: "Base" },
                    { h, s, l: clamp(l + 15, 5, 95), label: "+15 L" },
                    { h, s, l: clamp(l + 30, 5, 95), label: "+30 L" },
                ];
        }
        return [];
    }

    function renderPalette(rgb, hsl) {
        const palette = getPaletteColors(hsl, currentPalette);
        paletteGrid.innerHTML = palette.map((p, i) => {
            const r = hslToRgb(p.h, p.s, p.l);
            const hex = rgbToHex(r.r, r.g, r.b);
            const textColor = (0.299 * r.r + 0.587 * r.g + 0.114 * r.b) / 255 > 0.6 ? "#000" : "#fff";
            return `
                <div class="palette-swatch" data-hex="${hex}" style="animation-delay:${i * 0.05}s">
                    <div class="ps-color" style="background:${hex}">
                        <div class="ps-copied"><i class="fa-solid fa-check"></i> Copied</div>
                    </div>
                    <div class="ps-info">
                        <div class="ps-hex">${hex.toUpperCase()}</div>
                        <div class="ps-label">${escapeHtml(p.label)} · hsl(${p.h}, ${p.s}%, ${p.l}%)</div>
                    </div>
                </div>
            `;
        }).join("");

        paletteGrid.querySelectorAll(".palette-swatch").forEach((sw) => {
            sw.addEventListener("click", () => {
                copyToClipboard(sw.dataset.hex.toUpperCase());
                sw.classList.add("copied");
                setTimeout(() => sw.classList.remove("copied"), 800);
            });
        });
    }

    paletteTypes.forEach((btn) => {
        btn.addEventListener("click", () => {
            paletteTypes.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentPalette = btn.dataset.type;
            renderPalette(currentColor, rgbToHsl(currentColor.r, currentColor.g, currentColor.b));
        });
    });

    copyPaletteHex.addEventListener("click", () => {
        const hexes = Array.from(paletteGrid.querySelectorAll(".palette-swatch"))
            .map((sw) => sw.dataset.hex.toUpperCase());
        copyToClipboard(hexes.join(", "));
    });

    exportPaletteCss.addEventListener("click", () => {
        const lines = Array.from(paletteGrid.querySelectorAll(".palette-swatch")).map((sw, i) => {
            const name = `--color-${i + 1}`;
            return `  ${name}: ${sw.dataset.hex.toUpperCase()};`;
        });
        const css = ":root {\n" + lines.join("\n") + "\n}";
        copyToClipboard(css);
    });

    exportPaletteSvg.addEventListener("click", () => {
        const swatches = Array.from(paletteGrid.querySelectorAll(".palette-swatch"));
        const width = 100;
        const totalW = swatches.length * width;
        const rects = swatches.map((sw, i) =>
            `<rect x="${i * width}" y="0" width="${width}" height="120" fill="${sw.dataset.hex}"/>`
        ).join("");
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} 120" width="${totalW}" height="120">${rects}</svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `palette-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === "function") showToast("📥 SVG downloaded");
    });

    /* ============================================================
       SHADES / TINTS / TONES
       ============================================================ */
    function renderShades(hsl) {
        // Shades: reduce lightness
        const shades = [];
        for (let i = 1; i <= 9; i++) {
            shades.push({ h: hsl.h, s: hsl.s, l: clamp(hsl.l - i * (hsl.l / 10), 0, 100), pct: -i * 10 });
        }
        shadesGrid.innerHTML = shades.map((sh, i) => {
            const r = hslToRgb(sh.h, sh.s, sh.l);
            const hex = rgbToHex(r.r, r.g, r.b);
            return `
                <div class="shade-swatch" data-hex="${hex}" style="animation-delay:${i * 0.03}s">
                    <div class="shade-color" style="background:${hex}">
                        <div class="sc-copied">✓</div>
                    </div>
                    <div class="shade-info">
                        <div class="shade-hex">${hex.toUpperCase()}</div>
                        <div class="shade-pct">${sh.pct}% L</div>
                    </div>
                </div>
            `;
        }).join("");

        // Tints: increase lightness
        const tints = [];
        for (let i = 1; i <= 9; i++) {
            tints.push({ h: hsl.h, s: hsl.s, l: clamp(hsl.l + i * ((100 - hsl.l) / 10), 0, 100), pct: i * 10 });
        }
        tintsGrid.innerHTML = tints.map((sh, i) => {
            const r = hslToRgb(sh.h, sh.s, sh.l);
            const hex = rgbToHex(r.r, r.g, r.b);
            return `
                <div class="shade-swatch" data-hex="${hex}" style="animation-delay:${i * 0.03}s">
                    <div class="shade-color" style="background:${hex}">
                        <div class="sc-copied">✓</div>
                    </div>
                    <div class="shade-info">
                        <div class="shade-hex">${hex.toUpperCase()}</div>
                        <div class="shade-pct">+${sh.pct}% L</div>
                    </div>
                </div>
            `;
        }).join("");

        // Tones: reduce saturation
        const tones = [];
        for (let i = 1; i <= 9; i++) {
            tones.push({ h: hsl.h, s: clamp(hsl.s - i * (hsl.s / 10), 0, 100), l: hsl.l, pct: -i * 10 });
        }
        tonesGrid.innerHTML = tones.map((sh, i) => {
            const r = hslToRgb(sh.h, sh.s, sh.l);
            const hex = rgbToHex(r.r, r.g, r.b);
            return `
                <div class="shade-swatch" data-hex="${hex}" style="animation-delay:${i * 0.03}s">
                    <div class="shade-color" style="background:${hex}">
                        <div class="sc-copied">✓</div>
                    </div>
                    <div class="shade-info">
                        <div class="shade-hex">${hex.toUpperCase()}</div>
                        <div class="shade-pct">${sh.pct}% S</div>
                    </div>
                </div>
            `;
        }).join("");

        // Attach click handlers to all shades
        [...shadesGrid.children, ...tintsGrid.children, ...tonesGrid.children].forEach((sw) => {
            sw.addEventListener("click", () => {
                copyToClipboard(sw.dataset.hex.toUpperCase());
                sw.classList.add("copied");
                setTimeout(() => sw.classList.remove("copied"), 800);
            });
        });
    }

    /* ============================================================
       CONTRAST
       ============================================================ */
    function relativeLuminance(r, g, b) {
        const chan = (c) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
    }

    function contrastRatio(rgb1, rgb2) {
        const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
        const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function renderContrast() {
        const bgRgb = parseColor(currentBg) || hexToRgb(currentBg);

        const ratio = contrastRatio(currentColor, bgRgb);
        const ratioText = ratio.toFixed(2);

        // Determine pass/fail
        const passAA_Normal  = ratio >= 4.5;
        const passAAA_Normal = ratio >= 7;
        const passAA_Large   = ratio >= 3;
        const passAAA_Large  = ratio >= 4.5;

        contrastResults.innerHTML = `
            <div class="cr-card ${passAA_Normal ? "pass" : "fail"}">
                <div class="cr-label">AA Normal</div>
                <div class="cr-value">${ratioText}</div>
                <div class="cr-note">${passAA_Normal ? "PASS" : "FAIL"}</div>
            </div>
            <div class="cr-card ${passAAA_Normal ? "pass" : "fail"}">
                <div class="cr-label">AAA Normal</div>
                <div class="cr-value">${ratioText}</div>
                <div class="cr-note">${passAAA_Normal ? "PASS" : "FAIL"}</div>
            </div>
            <div class="cr-card ${passAA_Large ? "pass" : "fail"}">
                <div class="cr-label">AA Large</div>
                <div class="cr-value">${ratioText}</div>
                <div class="cr-note">${passAA_Large ? "PASS" : "FAIL"}</div>
            </div>
        `;

        // Preview box
        const fgHex = rgbToHex(currentColor.r, currentColor.g, currentColor.b);
        contrastPreview.style.background = currentBg;
        contrastPreview.style.color = fgHex;
    }

    contrastBgPicker.querySelectorAll(".bg-pill").forEach((btn) => {
        btn.addEventListener("click", () => {
            contrastBgPicker.querySelectorAll(".bg-pill").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const bg = btn.dataset.bg;
            if (bg === "custom") {
                // Prompt-based fallback for custom bg
                const custom = prompt("Enter background color (hex, rgb, etc.):", currentBg);
                if (custom && parseColor(custom)) {
                    currentBg = custom;
                }
            } else {
                currentBg = bg;
            }
            renderContrast();
        });
    });

    /* ============================================================
       HARMONY WHEEL
       ============================================================ */
    function renderHarmony(hsl) {
        const { h, s, l } = hsl;

        // Set center dot color
        const centerRgb = hslToRgb(h, s, l);
        hwCenter.style.background = rgbToHex(centerRgb.r, centerRgb.g, centerRgb.b);

        // Remove old dots
        harmonyWheel.querySelectorAll(".hw-dot").forEach((d) => d.remove());

        // Harmony dots
        const dots = [
            { angle: h, label: "Base" },
            { angle: (h + 180) % 360, label: "Comp" },
            { angle: (h + 120) % 360, label: "T1" },
            { angle: (h + 240) % 360, label: "T2" },
        ];

        dots.forEach((d) => {
            const dotRgb = hslToRgb(d.angle, s, l);
            const dotHex = rgbToHex(dotRgb.r, dotRgb.g, dotRgb.b);
            const rad = (d.angle - 90) * Math.PI / 180;
            const radius = 100; // px
            const x = 120 + Math.cos(rad) * radius;
            const y = 120 + Math.sin(rad) * radius;

            const dot = document.createElement("div");
            dot.className = "hw-dot";
            dot.style.left = x + "px";
            dot.style.top = y + "px";
            dot.style.background = dotHex;
            dot.title = `${d.label}: ${dotHex.toUpperCase()}`;
            dot.dataset.hex = dotHex;
            dot.addEventListener("click", () => {
                copyToClipboard(dotHex.toUpperCase());
            });
            harmonyWheel.appendChild(dot);
        });

        // Harmony details
        harmonyDetails.innerHTML = dots.map((d, i) => {
            const rgb = hslToRgb(d.angle, s, l);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            return `
                <div class="hd-item" data-hex="${hex}" style="animation-delay:${i * 0.05}s">
                    <div class="hd-swatch" style="background:${hex}"></div>
                    <div class="hd-info">
                        <div class="hd-hex">${hex.toUpperCase()}</div>
                        <div class="hd-hsl">${d.label} · hsl(${d.angle}, ${s}%, ${l}%)</div>
                    </div>
                </div>
            `;
        }).join("");

        harmonyDetails.querySelectorAll(".hd-item").forEach((it) => {
            it.addEventListener("click", () => {
                copyToClipboard(it.dataset.hex.toUpperCase());
            });
        });
    }

    /* ============================================================
       COPY / PASTE
       ============================================================ */
    function copyToClipboard(text) {
        if (!text && text !== "") return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (typeof showToast === "function") showToast("📋 Copied!");
            }).catch(() => fallbackCopy(text));
        } else fallbackCopy(text);
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            if (typeof showToast === "function") showToast("📋 Copied!");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Copy failed");
        }
        document.body.removeChild(ta);
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(hex) {
        if (history.length > 0 && history[0] === hex) return;
        history = history.filter((h) => h !== hex);
        history.unshift(hex);
        if (history.length > 24) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            ccHistoryList.innerHTML = '<div class="empty-history">No colors yet</div>';
            return;
        }
        ccHistoryList.innerHTML = history.map((hex, i) => `
            <div class="hist-swatch" data-hex="${hex}" data-i="${i}" style="background:${hex};animation-delay:${Math.min(i, 20) * 0.02}s"></div>
        `).join("");

        ccHistoryList.querySelectorAll(".hist-swatch").forEach((sw) => {
            sw.addEventListener("click", () => {
                const hex = sw.dataset.hex;
                const rgb = hexToRgb(hex);
                if (rgb) {
                    colorInput.value = hex.toUpperCase();
                    updateAllFromRgb(rgb, { silent: true });
                }
            });
        });
    }

    clearCcHistory.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
        modeContents.forEach((c) => c.classList.toggle("active", c.dataset.content === mode));
    }

    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    /* ============================================================
       INPUT HANDLING
       ============================================================ */
    function handleInput() {
        const val = colorInput.value.trim();
        if (!val) return;
        const rgb = parseColor(val);
        if (rgb) {
            updateAllFromRgb(rgb);
        }
    }

    colorInput.addEventListener("input", () => {
        clearTimeout(autoTimer);
        autoTimer = setTimeout(handleInput, 250);
    });

    colorInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleInput();
        }
    });

    colorInput.addEventListener("blur", () => {
        if (colorInput.value.trim()) handleInput();
    });

    pasteColorBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            colorInput.value = text.trim();
            handleInput();
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    clearColorInput.addEventListener("click", () => {
        colorInput.value = "";
    });

    /* ============================================================
       NATIVE COLOR PICKER
       ============================================================ */
    nativePicker.addEventListener("input", () => {
        const rgb = hexToRgb(nativePicker.value);
        if (rgb) {
            colorInput.value = nativePicker.value.toUpperCase();
            updateAllFromRgb(rgb);
        }
    });

    /* ============================================================
       RANDOM & RESET
       ============================================================ */
    function randomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        colorInput.value = rgbToHex(r, g, b).toUpperCase();
        updateAllFromRgb({ r, g, b });
    }

    randomColorBtn.addEventListener("click", randomColor);

    copyHexBtn.addEventListener("click", () => {
        copyToClipboard(rgbToHex(currentColor.r, currentColor.g, currentColor.b).toUpperCase());
    });

    clearColorBtn.addEventListener("click", () => {
        const defaultRgb = { r: 59, g: 130, b: 246 };
        colorInput.value = "#3B82F6";
        updateAllFromRgb(defaultRgb, { silent: true });
        if (typeof showToast === "function") showToast("🔄 Reset");
    });

    /* ============================================================
       KEYBOARD SHORTCUTS
       ============================================================ */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select";

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleInput();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r" && !e.shiftKey) {
            e.preventDefault();
            randomColor();
            return;
        }
        if (!typing && e.key === "Escape") {
            e.preventDefault();
            colorInput.value = "";
            clearColorBtn.click();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareColorConverter = function () {
        const shareData = {
            title: "Color Converter - Tool Hub",
            text: "Convert HEX, RGB, HSL & generate beautiful color palettes!",
            url: window.location.href,
        };
        if (navigator.share) navigator.share(shareData).catch(() => {});
        else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Link copied!");
            }).catch(() => {});
        }
    };

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        // Default color: #3B82F6
        colorInput.value = "#3B82F6";
        updateAllFromRgb({ r: 59, g: 130, b: 246 }, { silent: true });
        renderHistory();
        setMode("convert");
    }

    init();
})();