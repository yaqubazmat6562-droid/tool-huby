/* ============================================================
   GRAYSCALE IMAGE - Advanced Logic
   8 Algorithms · Intensity control · Tint · Effects · Batch ·
   Split view · ZIP download
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const gsCard         = document.getElementById("gsCard");
    const uploadZone     = document.getElementById("uploadZone");
    const fileInput      = document.getElementById("fileInput");
    const browseBtn      = document.getElementById("browseBtn");

    const editorArea     = document.getElementById("editorArea");
    const queueCount     = document.getElementById("queueCount");
    const totalSize      = document.getElementById("totalSize");
    const addMoreBtn     = document.getElementById("addMoreBtn");
    const clearAllBtn    = document.getElementById("clearAllBtn");

    const activeName     = document.getElementById("activeName");
    const previewStage   = document.getElementById("previewStage");
    const previewImg     = document.getElementById("previewImg");
    const previewOriginal= document.getElementById("previewOriginal");
    const compareLabel   = document.getElementById("compareLabel");
    const toggleOriginalBtn = document.getElementById("toggleOriginalBtn");
    const splitViewBtn   = document.getElementById("splitViewBtn");

    const splitContainer = document.getElementById("splitContainer");
    const splitImgColor  = document.getElementById("splitImgColor");
    const splitImgGray   = document.getElementById("splitImgGray");
    const splitDivider   = document.getElementById("splitDivider");

    const piFile         = document.getElementById("piFile");
    const piDims         = document.getElementById("piDims");
    const piSize         = document.getElementById("piSize");
    const piAlgo         = document.getElementById("piAlgo");

    const algoBtns       = document.querySelectorAll(".algo-btn");
    const intensitySlider= document.getElementById("intensitySlider");
    const intensityValue = document.getElementById("intensityValue");
    const ipMinis        = document.querySelectorAll(".ip-mini");

    const tintPresets    = document.querySelectorAll(".tint-preset");
    const customTintRow  = document.getElementById("customTintRow");
    const customTintColor= document.getElementById("customTintColor");

    const contrastSlider = document.getElementById("contrastSlider");
    const contrastValue  = document.getElementById("contrastValue");
    const brightnessSlider = document.getElementById("brightnessSlider");
    const brightnessValue = document.getElementById("brightnessValue");
    const grainSlider    = document.getElementById("grainSlider");
    const grainValue     = document.getElementById("grainValue");

    const formatPills    = document.querySelectorAll(".fmt-pill");
    const qualityBlock   = document.getElementById("qualityBlock");
    const qualitySlider  = document.getElementById("qualitySlider");
    const qualityValue   = document.getElementById("qualityValue");

    const downloadBtn    = document.getElementById("downloadBtn");
    const previewBtn     = document.getElementById("previewBtn");
    const downloadAllBtn = document.getElementById("downloadAllBtn");
    const batchCount     = document.getElementById("batchCount");
    const downloadZipBtn = document.getElementById("downloadZipBtn");

    const thumbnailsStrip= document.getElementById("thumbnailsStrip");
    const queueCount2    = document.getElementById("queueCount2");
    const tsList         = document.getElementById("tsList");

    const progressWrap   = document.getElementById("progressWrap");
    const progressLabel  = document.getElementById("progressLabel");
    const progressFill   = document.getElementById("progressFill");

    const gsHistoryList  = document.getElementById("gsHistoryList");
    const clearGsHistory = document.getElementById("clearGsHistory");

    /* ---------------- State ---------------- */
    let images           = [];       // { id, file, name, img, dataUrl, width, height, size, type }
    let activeIndex      = 0;
    let currentAlgo      = "luminance"; // luminance | average | lightness | desaturate | red | green | blue | sepia
    let currentIntensity = 100;         // 0-100
    let currentTint      = "none";      // none | #hex
    let currentFormat    = "image/png";
    let showSplitView    = false;
    let showOriginal     = false;
    let lastResults      = [];
    let history          = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_grayscale_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            const meta = history.slice(0, 15).map((h) => ({
                name: h.name,
                size: h.size,
                algo: h.algo,
                count: h.count,
                time: h.time,
            }));
            localStorage.setItem("toolhub_grayscale_history", JSON.stringify(meta));
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

    function formatBytes(b) {
        if (b < 1024) return b + " B";
        if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
        return (b / (1024 * 1024)).toFixed(2) + " MB";
    }

    function stripExtension(name) {
        return name.replace(/\.[^.]+$/, "");
    }

    function getExt(mime) {
        switch (mime) {
            case "image/jpeg": return "jpg";
            case "image/webp": return "webp";
            default: return "png";
        }
    }

    function hexToRgb(hex) {
        const h = hex.replace("#", "");
        return {
            r: parseInt(h.substring(0, 2), 16),
            g: parseInt(h.substring(2, 4), 16),
            b: parseInt(h.substring(4, 6), 16),
        };
    }

    /* ============================================================
       FILE HANDLING
       ============================================================ */
    function handleFiles(files) {
        const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (valid.length === 0) {
            if (typeof showToast === "function") showToast("⚠️ Please select image files", "error");
            return;
        }

        const tooBig = valid.filter((f) => f.size > 20 * 1024 * 1024);
        if (tooBig.length > 0) {
            if (typeof showToast === "function") showToast(`⚠️ ${tooBig.length} file(s) exceed 20 MB`, "error");
        }

        let loaded = 0;
        valid.forEach((file) => {
            if (file.size > 20 * 1024 * 1024) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const img = new Image();
                img.onload = () => {
                    images.push({
                        id: Date.now() + Math.random(),
                        file,
                        name: file.name,
                        img,
                        dataUrl,
                        width: img.width,
                        height: img.height,
                        size: file.size,
                        type: file.type || "image/png",
                    });
                    loaded++;
                    finalizeLoad(loaded, valid.length);
                };
                img.onerror = () => {
                    loaded++;
                    finalizeLoad(loaded, valid.length);
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        });
    }

    function finalizeLoad(done, total) {
        if (done < total) return;
        if (images.length === 0) return;
        uploadZone.style.display = "none";
        editorArea.style.display = "block";
        if (!previewImg.src) {
            activeIndex = 0;
            loadImageIntoEditor(0);
        }
        renderThumbnails();
        updateToolbarStats();
        updateBatchButtons();
        if (typeof showToast === "function") {
            showToast(`✅ ${images.length} image${images.length !== 1 ? "s" : ""} loaded`);
        }
    }

    uploadZone.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") fileInput.click();
    });
    browseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) handleFiles(e.target.files);
        fileInput.value = "";
    });

    uploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadZone.classList.add("dragover");
    });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("dragover");
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });

    addMoreBtn.addEventListener("click", () => fileInput.click());
    clearAllBtn.addEventListener("click", () => {
        if (images.length === 0) return;
        if (!confirm("Clear all images?")) return;
        resetAll();
    });

    /* ============================================================
       LOAD IMAGE INTO EDITOR
       ============================================================ */
    function loadImageIntoEditor(idx) {
        const item = images[idx];
        if (!item) return;
        activeIndex = idx;

        activeName.textContent = item.name;
        previewImg.src = item.dataUrl;
        previewOriginal.src = item.dataUrl;
        previewImg.style.display = "block";

        // Split view images
        splitImgColor.src = item.dataUrl;
        splitImgGray.src = item.dataUrl;

        piFile.textContent = item.name;
        piDims.textContent = `${item.width} × ${item.height}`;
        piSize.textContent = formatBytes(item.size);
        piAlgo.textContent = getAlgoLabel(currentAlgo);

        // Reset visibility
        previewOriginal.classList.remove("show");
        previewOriginal.style.display = "none";
        compareLabel.style.display = "none";
        showOriginal = false;
        toggleOriginalBtn.classList.remove("active");

        renderPreview();
        tsList.querySelectorAll(".ts-item").forEach((el, i) => {
            el.classList.toggle("active", i === idx);
        });
    }

    function getAlgoLabel(algo) {
        const labels = {
            luminance: "Luminance",
            average: "Average",
            lightness: "Lightness",
            desaturate: "Desaturate",
            red: "Red",
            green: "Green",
            blue: "Blue",
            sepia: "Sepia",
        };
        return labels[algo] || "Luminance";
    }

    /* ============================================================
       THUMBNAILS
       ============================================================ */
    function renderThumbnails() {
        if (images.length === 0) {
            thumbnailsStrip.style.display = "none";
            return;
        }
        thumbnailsStrip.style.display = "block";
        queueCount2.textContent = images.length;
        tsList.innerHTML = images.map((img, i) => `
            <div class="ts-item ${i === activeIndex ? "active" : ""}" data-index="${i}">
                <img src="${img.dataUrl}" alt="${escapeHtml(img.name)}">
                <button class="ts-remove" data-remove="${i}" title="Remove">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join("");

        tsList.querySelectorAll(".ts-item").forEach((el) => {
            el.addEventListener("click", (e) => {
                if (e.target.closest(".ts-remove")) return;
                loadImageIntoEditor(parseInt(el.dataset.index, 10));
                renderThumbnails();
            });
        });

        tsList.querySelectorAll(".ts-remove").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.remove, 10);
                images.splice(idx, 1);
                if (images.length === 0) {
                    resetAll();
                    return;
                }
                if (activeIndex >= images.length) activeIndex = images.length - 1;
                loadImageIntoEditor(activeIndex);
                renderThumbnails();
                updateToolbarStats();
                updateBatchButtons();
            });
        });
    }

    function updateToolbarStats() {
        queueCount.textContent = images.length;
        const total = images.reduce((sum, i) => sum + i.size, 0);
        totalSize.textContent = formatBytes(total);
    }

    function updateBatchButtons() {
        if (images.length > 1) {
            downloadAllBtn.style.display = "flex";
            batchCount.textContent = images.length;
        } else {
            downloadAllBtn.style.display = "none";
        }
        downloadZipBtn.style.display = lastResults.length > 1 ? "flex" : "none";
    }

    /* ============================================================
       RENDER PREVIEW (apply CSS filter for real-time view)
       ============================================================ */
    function renderPreview() {
        // Build CSS filter based on current algo + intensity + tint + effects
        const filter = buildCssFilter();
        previewImg.style.filter = filter;
        splitImgGray.style.filter = filter;
    }

    function buildCssFilter() {
        const filters = [];

        // Grayscale intensity
        const gsIntensity = currentIntensity / 100;

        switch (currentAlgo) {
            case "luminance":
            case "average":
            case "lightness":
            case "desaturate":
                filters.push(`grayscale(${gsIntensity})`);
                break;
            case "red":
                // Simulate red channel: use grayscale + sepia+hue tricks are complex; use direct filter chain
                filters.push(`grayscale(${gsIntensity}) sepia(${gsIntensity}) hue-rotate(-30deg) saturate(${gsIntensity * 3})`);
                break;
            case "green":
                filters.push(`grayscale(${gsIntensity}) sepia(${gsIntensity}) hue-rotate(60deg) saturate(${gsIntensity * 3})`);
                break;
            case "blue":
                filters.push(`grayscale(${gsIntensity}) sepia(${gsIntensity}) hue-rotate(170deg) saturate(${gsIntensity * 3})`);
                break;
            case "sepia":
                filters.push(`grayscale(${gsIntensity * 0.3}) sepia(${gsIntensity})`);
                break;
        }

        // Tint overlay effect: use sepia + hue-rotate as approximation
        if (currentTint !== "none") {
            const tintRgb = hexToRgb(currentTint);
            // Approximate tint by applying sepia + hue-rotate
            filters.push(`sepia(${gsIntensity * 0.4})`);
        }

        // Contrast & Brightness
        const contrastVal = 1 + (parseInt(contrastSlider.value, 10) / 100);
        const brightnessVal = 1 + (parseInt(brightnessSlider.value, 10) / 100);
        if (contrastVal !== 1) filters.push(`contrast(${contrastVal})`);
        if (brightnessVal !== 1) filters.push(`brightness(${brightnessVal})`);

        return filters.join(" ");
    }

    /* ============================================================
       ALGORITHM SELECTION
       ============================================================ */
    algoBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            algoBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentAlgo = btn.dataset.algo;
            piAlgo.textContent = getAlgoLabel(currentAlgo);
            renderPreview();
        });
    });

    /* ============================================================
       INTENSITY
       ============================================================ */
    intensitySlider.addEventListener("input", () => {
        currentIntensity = parseInt(intensitySlider.value, 10);
        intensityValue.textContent = currentIntensity + "%";
        ipMinis.forEach((b) => b.classList.toggle("active", parseInt(b.dataset.intensity, 10) === currentIntensity));
        renderPreview();
    });

    ipMinis.forEach((btn) => {
        btn.addEventListener("click", () => {
            const val = parseInt(btn.dataset.intensity, 10);
            intensitySlider.value = val;
            currentIntensity = val;
            intensityValue.textContent = val + "%";
            ipMinis.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderPreview();
        });
    });

    /* ============================================================
       TINT
       ============================================================ */
    tintPresets.forEach((btn) => {
        btn.addEventListener("click", () => {
            tintPresets.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const tint = btn.dataset.tint;
            if (tint === "custom") {
                customTintRow.style.display = "flex";
                currentTint = customTintColor.value;
            } else if (tint === "none") {
                customTintRow.style.display = "none";
                currentTint = "none";
            } else {
                customTintRow.style.display = "none";
                currentTint = tint;
            }
            renderPreview();
        });
    });

    customTintColor.addEventListener("input", () => {
        currentTint = customTintColor.value;
        renderPreview();
    });

    /* ============================================================
       EFFECTS (Contrast / Brightness / Grain)
       ============================================================ */
    contrastSlider.addEventListener("input", () => {
        const v = parseInt(contrastSlider.value, 10);
        contrastValue.textContent = (v > 0 ? "+" : "") + v;
        renderPreview();
    });

    brightnessSlider.addEventListener("input", () => {
        const v = parseInt(brightnessSlider.value, 10);
        brightnessValue.textContent = (v > 0 ? "+" : "") + v;
        renderPreview();
    });

    grainSlider.addEventListener("input", () => {
        grainValue.textContent = grainSlider.value;
    });

    /* ============================================================
       FORMAT & QUALITY
       ============================================================ */
    formatPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            formatPills.forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            currentFormat = pill.dataset.format;
            qualityBlock.style.display = (currentFormat === "image/jpeg" || currentFormat === "image/webp") ? "block" : "none";
        });
    });

    qualitySlider.addEventListener("input", () => {
        qualityValue.textContent = qualitySlider.value + "%";
    });

    /* ============================================================
       SPLIT VIEW
       ============================================================ */
    splitViewBtn.addEventListener("click", () => {
        showSplitView = !showSplitView;
        splitViewBtn.classList.toggle("active", showSplitView);

        if (showSplitView) {
            splitContainer.style.display = "block";
            previewImg.style.display = "none";
            previewOriginal.style.display = "none";
            compareLabel.style.display = "none";
            renderPreview();
        } else {
            splitContainer.style.display = "none";
            previewImg.style.display = "block";
        }
    });

    // Split divider drag
    let isSplitDragging = false;
    function startSplitDrag(e) {
        e.preventDefault();
        isSplitDragging = true;
        document.addEventListener("mousemove", onSplitMove);
        document.addEventListener("mouseup", endSplitDrag);
        document.addEventListener("touchmove", onSplitMove, { passive: false });
        document.addEventListener("touchend", endSplitDrag);
    }
    function onSplitMove(e) {
        if (!isSplitDragging) return;
        e.preventDefault();
        const rect = splitContainer.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        splitDivider.style.left = pct + "%";
        splitImgGray.style.clipPath = `inset(0 0 0 ${pct}%)`;
    }
    function endSplitDrag() {
        isSplitDragging = false;
        document.removeEventListener("mousemove", onSplitMove);
        document.removeEventListener("mouseup", endSplitDrag);
        document.removeEventListener("touchmove", onSplitMove);
        document.removeEventListener("touchend", endSplitDrag);
    }
    splitContainer.addEventListener("mousedown", startSplitDrag);
    splitContainer.addEventListener("touchstart", startSplitDrag, { passive: false });

    /* ============================================================
       TOGGLE ORIGINAL
       ============================================================ */
    toggleOriginalBtn.addEventListener("click", () => {
        if (showSplitView) return;
        showOriginal = !showOriginal;
        toggleOriginalBtn.classList.toggle("active", showOriginal);
        if (showOriginal) {
            previewOriginal.style.display = "block";
            setTimeout(() => previewOriginal.classList.add("show"), 10);
            compareLabel.style.display = "block";
        } else {
            previewOriginal.classList.remove("show");
            setTimeout(() => previewOriginal.style.display = "none", 300);
            compareLabel.style.display = "none";
        }
    });

    /* ============================================================
       GRAYSCALE CONVERSION (Canvas)
       ============================================================ */
    function grayscalePixel(r, g, b, algo) {
        switch (algo) {
            case "luminance":
                // Rec. 709
                return 0.2126 * r + 0.7152 * g + 0.0722 * b;
            case "average":
                return (r + g + b) / 3;
            case "lightness":
                return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
            case "desaturate": {
                // Convert to HSL, set S=0, convert back
                const max = Math.max(r, g, b) / 255;
                const min = Math.min(r, g, b) / 255;
                const l = (max + min) / 2;
                return l * 255;
            }
            case "red":
                return r;
            case "green":
                return g;
            case "blue":
                return b;
            case "sepia":
                // Sepia-like: use luminance but tint warm
                return 0.3 * r + 0.6 * g + 0.1 * b;
            default:
                return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
    }

    function applyGrayscale(item, opts) {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = item.width;
            canvas.height = item.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(item.img, 0, 0);

            const imageData = ctx.getImageData(0, 0, item.width, item.height);
            const data = imageData.data;

            const algo = opts.algo;
            const intensity = opts.intensity / 100;
            const contrast = 1 + (opts.contrast / 100);
            const brightness = opts.brightness;
            const grain = opts.grain / 100;

            // Tint
            const tintRgb = opts.tint !== "none" ? hexToRgb(opts.tint) : null;
            const tintStrength = 0.15;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                let gray = grayscalePixel(r, g, b, algo);

                // Blend with original based on intensity
                let newR = r + (gray - r) * intensity;
                let newG = g + (gray - g) * intensity;
                let newB = b + (gray - b) * intensity;

                // Apply sepia tint (warm tone)
                if (algo === "sepia") {
                    const sepR = Math.min(255, gray * 1.1);
                    const sepG = Math.min(255, gray * 0.95);
                    const sepB = Math.min(255, gray * 0.78);
                    newR = r + (sepR - r) * intensity;
                    newG = g + (sepG - g) * intensity;
                    newB = b + (sepB - b) * intensity;
                }

                // Custom tint
                if (tintRgb && currentTint !== "none") {
                    newR = newR * (1 - tintStrength) + tintRgb.r * tintStrength;
                    newG = newG * (1 - tintStrength) + tintRgb.g * tintStrength;
                    newB = newB * (1 - tintStrength) + tintRgb.b * tintStrength;
                }

                // Brightness
                if (brightness !== 0) {
                    newR += brightness * 2.55;
                    newG += brightness * 2.55;
                    newB += brightness * 2.55;
                }

                // Contrast (around midpoint 128)
                if (contrast !== 1) {
                    newR = ((newR - 128) * contrast) + 128;
                    newG = ((newG - 128) * contrast) + 128;
                    newB = ((newB - 128) * contrast) + 128;
                }

                // Grain (random noise)
                if (grain > 0) {
                    const noise = (Math.random() - 0.5) * 80 * grain;
                    newR += noise;
                    newG += noise;
                    newB += noise;
                }

                data[i] = Math.max(0, Math.min(255, newR));
                data[i + 1] = Math.max(0, Math.min(255, newG));
                data[i + 2] = Math.max(0, Math.min(255, newB));
                // alpha unchanged
            }

            ctx.putImageData(imageData, 0, 0);

            // Output format
            const mime = opts.format || "image/png";
            const quality = mime === "image/png" ? undefined : opts.quality;

            canvas.toBlob((blob) => {
                resolve({ blob, canvas, mime });
            }, mime, quality);
        });
    }

    /* ============================================================
       DOWNLOAD ACTIONS
       ============================================================ */
    async function processAndDownload(item, download = true) {
        const opts = {
            algo: currentAlgo,
            intensity: currentIntensity,
            contrast: parseInt(contrastSlider.value, 10),
            brightness: parseInt(brightnessSlider.value, 10),
            grain: parseInt(grainSlider.value, 10),
            tint: currentTint,
            format: currentFormat,
            quality: parseInt(qualitySlider.value, 10) / 100,
        };

        const { blob, mime } = await applyGrayscale(item, opts);
        const ext = getExt(mime);
        const baseName = stripExtension(item.name);
        const filename = `${baseName}_gray.${ext}`;

        if (download) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);
        }

        return { blob, mime, filename, size: blob.size };
    }

    downloadBtn.addEventListener("click", async () => {
        const item = images[activeIndex];
        if (!item) {
            if (typeof showToast === "function") showToast("⚠️ No image loaded", "error");
            return;
        }

        downloadBtn.disabled = true;
        const origHtml = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing…';
        showProgress(30, "Converting to grayscale…");

        try {
            const result = await processAndDownload(item, true);
            showProgress(100, "Done!");

            lastResults = [result];
            updateBatchButtons();

            pushHistory({
                name: item.name,
                size: item.size,
                algo: getAlgoLabel(currentAlgo),
                count: 1,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            if (typeof showToast === "function") showToast("✅ Downloaded grayscale image");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Failed: " + e.message, "error");
        }

        hideProgress();
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = origHtml;
    });

    previewBtn.addEventListener("click", () => {
        renderPreview();
        if (typeof showToast === "function") showToast("👁️ Preview updated");
    });

    downloadAllBtn.addEventListener("click", async () => {
        if (images.length === 0) return;
        if (!confirm(`Convert all ${images.length} images to grayscale?`)) return;

        downloadAllBtn.disabled = true;
        const origHtml = downloadAllBtn.innerHTML;

        showProgress(0, `Processing 0/${images.length}`);

        lastResults = [];
        let done = 0;

        for (const item of images) {
            try {
                const result = await processAndDownload(item, true);
                lastResults.push({ ...result, name: item.name });
                done++;
                updateProgress((done / images.length) * 100, `Processing ${done}/${images.length}`);
                downloadAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${done}/${images.length}…`;
                await new Promise((r) => setTimeout(r, 300));
            } catch (e) {
                done++;
            }
        }

        updateBatchButtons();

        pushHistory({
            name: `${images.length} images`,
            size: images.reduce((s, i) => s + i.size, 0),
            algo: getAlgoLabel(currentAlgo),
            count: images.length,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        if (typeof showToast === "function") {
            showToast(`✅ ${lastResults.length} image${lastResults.length !== 1 ? "s" : ""} converted`);
        }

        hideProgress();
        downloadAllBtn.disabled = false;
        downloadAllBtn.innerHTML = origHtml;
    });

    /* ============================================================
       ZIP DOWNLOAD
       ============================================================ */
    downloadZipBtn.addEventListener("click", async () => {
        if (lastResults.length === 0) return;

        showProgress(0, "Preparing ZIP…");

        try {
            const files = lastResults.map((r) => ({
                name: r.filename,
                blob: r.blob,
            }));

            const zipBlob = await createZip(files);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `grayscale-batch-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);

            updateProgress(100, "Done!");
            if (typeof showToast === "function") showToast("📦 ZIP downloaded");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ ZIP failed: " + e.message, "error");
        }

        hideProgress();
    });

    async function createZip(files) {
        const encoder = new TextEncoder();
        const parts = [];
        const centralDirectory = [];
        let offset = 0;

        const crcTable = (() => {
            const table = new Uint32Array(256);
            for (let i = 0; i < 256; i++) {
                let c = i;
                for (let k = 0; k < 8; k++) {
                    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                }
                table[i] = c;
            }
            return table;
        })();

        function crc32(data) {
            let crc = 0xFFFFFFFF;
            for (let i = 0; i < data.length; i++) {
                crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
            }
            return (crc ^ 0xFFFFFFFF) >>> 0;
        }

        for (const file of files) {
            const nameBytes = encoder.encode(file.name);
            const dataBytes = new Uint8Array(await file.blob.arrayBuffer());
            const crc = crc32(dataBytes);

            const localHeader = new Uint8Array(30 + nameBytes.length);
            const lhView = new DataView(localHeader.buffer);
            lhView.setUint32(0, 0x04034b50, true);
            lhView.setUint16(4, 20, true);
            lhView.setUint16(6, 0, true);
            lhView.setUint16(8, 0, true);
            lhView.setUint16(10, 0, true);
            lhView.setUint16(12, 0, true);
            lhView.setUint32(14, crc, true);
            lhView.setUint32(18, dataBytes.length, true);
            lhView.setUint32(22, dataBytes.length, true);
            lhView.setUint16(26, nameBytes.length, true);
            lhView.setUint16(28, 0, true);
            localHeader.set(nameBytes, 30);

            parts.push(localHeader);
            parts.push(dataBytes);

            const cdHeader = new Uint8Array(46 + nameBytes.length);
            const cdView = new DataView(cdHeader.buffer);
            cdView.setUint32(0, 0x02014b50, true);
            cdView.setUint16(4, 20, true);
            cdView.setUint16(6, 20, true);
            cdView.setUint16(8, 0, true);
            cdView.setUint16(10, 0, true);
            cdView.setUint16(12, 0, true);
            cdView.setUint16(14, 0, true);
            cdView.setUint32(16, crc, true);
            cdView.setUint32(20, dataBytes.length, true);
            cdView.setUint32(24, dataBytes.length, true);
            cdView.setUint16(28, nameBytes.length, true);
            cdView.setUint16(30, 0, true);
            cdView.setUint16(32, 0, true);
            cdView.setUint16(34, 0, true);
            cdView.setUint16(36, 0, true);
            cdView.setUint32(38, 0, true);
            cdView.setUint32(42, offset, true);
            cdHeader.set(nameBytes, 46);

            centralDirectory.push(cdHeader);

            offset += localHeader.length + dataBytes.length;
        }

        const cdSize = centralDirectory.reduce((s, c) => s + c.length, 0);
        const eocd = new Uint8Array(22);
        const ev = new DataView(eocd.buffer);
        ev.setUint32(0, 0x06054b50, true);
        ev.setUint16(4, 0, true);
        ev.setUint16(6, 0, true);
        ev.setUint16(8, files.length, true);
        ev.setUint16(10, files.length, true);
        ev.setUint32(12, cdSize, true);
        ev.setUint32(16, offset, true);
        ev.setUint16(20, 0, true);

        return new Blob([...parts, ...centralDirectory, eocd], { type: "application/zip" });
    }

    /* ============================================================
       PROGRESS
       ============================================================ */
    function showProgress(pct, label) {
        progressWrap.style.display = "block";
        updateProgress(pct, label);
    }

    function updateProgress(pct, label) {
        progressFill.style.width = Math.min(100, Math.max(0, pct)) + "%";
        if (label) progressLabel.textContent = label;
    }

    function hideProgress() {
        progressFill.style.width = "100%";
        setTimeout(() => {
            progressWrap.style.display = "none";
            progressFill.style.width = "0%";
        }, 500);
    }

    /* ============================================================
       RESET
       ============================================================ */
    function resetAll() {
        images = [];
        activeIndex = 0;
        lastResults = [];
        editorArea.style.display = "none";
        uploadZone.style.display = "block";
        thumbnailsStrip.style.display = "none";
        progressWrap.style.display = "none";

        previewImg.src = "";
        previewImg.style.filter = "";
        previewOriginal.src = "";
        splitImgColor.src = "";
        splitImgGray.src = "";
        fileInput.value = "";

        // Reset controls
        algoBtns.forEach((b) => b.classList.toggle("active", b.dataset.algo === "luminance"));
        currentAlgo = "luminance";

        intensitySlider.value = 100;
        intensityValue.textContent = "100%";
        currentIntensity = 100;
        ipMinis.forEach((b) => b.classList.toggle("active", b.dataset.intensity === "100"));

        tintPresets.forEach((b) => b.classList.toggle("active", b.dataset.tint === "none"));
        customTintRow.style.display = "none";
        currentTint = "none";

        contrastSlider.value = 0;
        contrastValue.textContent = "0";
        brightnessSlider.value = 0;
        brightnessValue.textContent = "0";
        grainSlider.value = 0;
        grainValue.textContent = "0";

        formatPills.forEach((b) => b.classList.toggle("active", b.dataset.format === "image/png"));
        currentFormat = "image/png";
        qualityBlock.style.display = "none";
        qualitySlider.value = 92;
        qualityValue.textContent = "92%";

        showSplitView = false;
        splitViewBtn.classList.remove("active");
        splitContainer.style.display = "none";
        showOriginal = false;
        toggleOriginalBtn.classList.remove("active");

        updateToolbarStats();
        updateBatchButtons();

        if (typeof showToast === "function") showToast("🔄 Cleared");
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(entry) {
        history.unshift(entry);
        if (history.length > 15) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            gsHistoryList.innerHTML = '<div class="empty-history">No conversions yet</div>';
            return;
        }
        gsHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb"><i class="fa-solid fa-circle-half-stroke"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.name)}</div>
                    <div class="hi-meta">${h.count || 1} file${(h.count || 1) !== 1 ? "s" : ""} · ${escapeHtml(h.algo)} · ${formatBytes(h.size)}</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");
    }

    clearGsHistory.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* ============================================================
       KEYBOARD SHORTCUTS
       ============================================================ */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select";

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            if (images.length > 0) downloadBtn.click();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r" && images.length > 0) {
            e.preventDefault();
            resetAll();
            return;
        }
        if (!typing && e.key === "Escape") {
            if (images.length > 0) clearAllBtn.click();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareGrayscale = function () {
        const shareData = {
            title: "Grayscale Image Converter - Tool Hub",
            text: "Convert colored images to grayscale with multiple algorithms & effects!",
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
        editorArea.style.display = "none";
        uploadZone.style.display = "block";
        progressWrap.style.display = "none";
        renderHistory();
    }

    init();
})();