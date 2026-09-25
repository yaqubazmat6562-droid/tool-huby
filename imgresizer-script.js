/* ============================================================
   IMAGE RESIZER - Advanced Logic
   Single + Batch resize · Aspect lock · Quality · Formats ·
   Preview compare · Presets
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const irCard         = document.getElementById("irCard");
    const uploadZone     = document.getElementById("uploadZone");
    const fileInput      = document.getElementById("fileInput");
    const browseBtn      = document.getElementById("browseBtn");

    const editorArea     = document.getElementById("editorArea");
    const imageName      = document.getElementById("imageName");
    const addMoreBtn     = document.getElementById("addMoreBtn");
    const removeBtn      = document.getElementById("removeBtn");

    const previewStage   = document.getElementById("previewStage");
    const previewImg     = document.getElementById("previewImg");
    const previewOriginal= document.getElementById("previewOriginal");
    const compareLabel   = document.getElementById("compareLabel");

    const zoomInBtn      = document.getElementById("zoomInBtn");
    const zoomOutBtn     = document.getElementById("zoomOutBtn");
    const zoomResetBtn   = document.getElementById("zoomResetBtn");
    const toggleCompareBtn = document.getElementById("toggleCompareBtn");

    const origDimensions = document.getElementById("origDimensions");
    const newDimensions  = document.getElementById("newDimensions");
    const estSize        = document.getElementById("estSize");
    const reduction      = document.getElementById("reduction");

    const widthInput     = document.getElementById("widthInput");
    const heightInput    = document.getElementById("heightInput");
    const lockRatioBtn   = document.getElementById("lockRatioBtn");
    const presetBtns     = document.querySelectorAll(".preset-btn");

    const formatPills    = document.querySelectorAll(".fmt-pill");
    const qualityBlock   = document.getElementById("qualityBlock");
    const qualitySlider  = document.getElementById("qualitySlider");
    const qualityValue   = document.getElementById("qualityValue");
    const bgBlock        = document.getElementById("bgBlock");
    const bgColor        = document.getElementById("bgColor");
    const bgWhite        = document.getElementById("bgWhite");
    const bgBlack        = document.getElementById("bgBlack");

    const resizeMethod   = document.getElementById("resizeMethod");
    const resizeBtn      = document.getElementById("resizeBtn");
    const resizeAllBtn   = document.getElementById("resizeAllBtn");
    const batchCount     = document.getElementById("batchCount");
    const resetBtn       = document.getElementById("resetBtn");

    const thumbnailsStrip= document.getElementById("thumbnailsStrip");
    const queueCount     = document.getElementById("queueCount");
    const tsList         = document.getElementById("tsList");

    const irHistoryList  = document.getElementById("irHistoryList");
    const clearIrHistory = document.getElementById("clearIrHistory");

    /* ---------------- State ---------------- */
    let images           = [];       // [{ id, file, name, img, dataUrl, width, height, size }]
    let activeIndex      = 0;
    let currentFormat    = "original"; // original | image/jpeg | image/png | image/webp
    let aspectLocked     = true;
    let aspectRatio      = 1;
    let currentZoom      = 1;
    let history          = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_imgresizer_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            // Don't store dataUrl — too big. Store metadata only.
            const meta = history.slice(0, 12).map((h) => ({
                name: h.name,
                from: h.from,
                to: h.to,
                reduction: h.reduction,
                format: h.format,
                time: h.time,
            }));
            localStorage.setItem("toolhub_imgresizer_history", JSON.stringify(meta));
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

    function getExtension(mime) {
        switch (mime) {
            case "image/jpeg": return "jpg";
            case "image/png":  return "png";
            case "image/webp": return "webp";
            case "image/gif":  return "gif";
            case "image/bmp":  return "bmp";
            default: return "png";
        }
    }

    function stripExtension(name) {
        return name.replace(/\.[^.]+$/, "");
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
                const img = new Image();
                img.onload = () => {
                    images.push({
                        id: Date.now() + Math.random(),
                        file,
                        name: file.name,
                        img,
                        dataUrl: e.target.result,
                        width: img.width,
                        height: img.height,
                        size: file.size,
                        type: file.type || "image/png",
                    });
                    loaded++;
                    if (loaded === valid.length) {
                        editorArea.style.display = "block";
                        if (images.length === 1) {
                            activeIndex = 0;
                            loadImageIntoEditor(0);
                        } else {
                            // Set first as active if editor empty
                            if (!previewImg.src) {
                                activeIndex = 0;
                                loadImageIntoEditor(0);
                            }
                            renderThumbnails();
                            updateBatchButton();
                        }
                        if (typeof showToast === "function") {
                            showToast(`✅ ${loaded} image${loaded !== 1 ? "s" : ""} loaded`);
                        }
                    }
                };
                img.onerror = () => {
                    loaded++;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
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

    removeBtn.addEventListener("click", () => {
        if (images.length === 0) return;
        if (!confirm("Remove current image?")) return;
        images.splice(activeIndex, 1);
        if (images.length === 0) {
            resetAll();
        } else {
            if (activeIndex >= images.length) activeIndex = images.length - 1;
            loadImageIntoEditor(activeIndex);
            renderThumbnails();
            updateBatchButton();
        }
    });

    /* ============================================================
       LOAD IMAGE INTO EDITOR
       ============================================================ */
    function loadImageIntoEditor(idx) {
        const item = images[idx];
        if (!item) return;
        activeIndex = idx;

        imageName.textContent = item.name;

        previewImg.src = item.dataUrl;
        previewOriginal.src = item.dataUrl;
        previewImg.style.display = "block";
        previewOriginal.classList.remove("show");
        previewOriginal.style.display = "none";
        compareLabel.style.display = "none";

        currentZoom = 1;
        previewImg.style.transform = "scale(1)";

        // Set inputs to original dimensions
        widthInput.value = item.width;
        heightInput.value = item.height;
        aspectRatio = item.width / item.height;

        origDimensions.textContent = `${item.width} × ${item.height}`;
        newDimensions.textContent = `${item.width} × ${item.height}`;

        estSize.textContent = formatBytes(item.size);
        reduction.textContent = "0%";
        reduction.className = "pi-value";

        // Enable quality control visibility
        updateQualityVisibility();

        // Update active thumbnail
        tsList.querySelectorAll(".ts-item").forEach((el, i) => {
            el.classList.toggle("active", i === idx);
        });
    }

    /* ============================================================
       THUMBNAILS
       ============================================================ */
    function renderThumbnails() {
        if (images.length <= 1) {
            thumbnailsStrip.style.display = "none";
            return;
        }
        thumbnailsStrip.style.display = "block";
        queueCount.textContent = images.length;
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
                const idx = parseInt(el.dataset.index, 10);
                loadImageIntoEditor(idx);
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
                updateBatchButton();
            });
        });
    }

    function updateBatchButton() {
        if (images.length > 1) {
            resizeAllBtn.style.display = "flex";
            batchCount.textContent = images.length;
        } else {
            resizeAllBtn.style.display = "none";
        }
    }

    /* ============================================================
       DIMENSION INPUT & ASPECT LOCK
       ============================================================ */
    widthInput.addEventListener("input", () => {
        if (!images[activeIndex]) return;
        const w = parseInt(widthInput.value, 10);
        if (isNaN(w) || w < 1) return;
        if (aspectLocked) {
            const h = Math.round(w / aspectRatio);
            heightInput.value = h;
        }
        updatePreviewDimensions();
    });

    heightInput.addEventListener("input", () => {
        if (!images[activeIndex]) return;
        const h = parseInt(heightInput.value, 10);
        if (isNaN(h) || h < 1) return;
        if (aspectLocked) {
            const w = Math.round(h * aspectRatio);
            widthInput.value = w;
        }
        updatePreviewDimensions();
    });

    lockRatioBtn.addEventListener("click", () => {
        aspectLocked = !aspectLocked;
        lockRatioBtn.classList.toggle("active", aspectLocked);
        lockRatioBtn.innerHTML = aspectLocked
            ? '<i class="fa-solid fa-lock"></i>'
            : '<i class="fa-solid fa-lock-open"></i>';
        if (aspectLocked && images[activeIndex]) {
            const w = parseInt(widthInput.value, 10);
            if (!isNaN(w)) heightInput.value = Math.round(w / aspectRatio);
        }
    });

    function updatePreviewDimensions() {
        const w = parseInt(widthInput.value, 10);
        const h = parseInt(heightInput.value, 10);
        if (isNaN(w) || isNaN(h)) return;
        newDimensions.textContent = `${w} × ${h}`;
        updateEstimatedSize();
    }

    function updateEstimatedSize() {
        const item = images[activeIndex];
        if (!item) return;
        const w = parseInt(widthInput.value, 10);
        const h = parseInt(heightInput.value, 10);
        if (isNaN(w) || isNaN(h)) return;

        const srcPixels = item.width * item.height;
        const newPixels = w * h;
        const pixelRatio = newPixels / srcPixels;

        let estBytes;
        // Base estimate
        if (currentFormat === "original" || currentFormat === item.type) {
            estBytes = item.size * pixelRatio;
        } else if (currentFormat === "image/jpeg" || currentFormat === "image/webp") {
            const q = parseInt(qualitySlider.value, 10) / 100;
            // JPEG compression factor (very rough)
            const jpegFactor = 0.15 + (q * 0.35);
            estBytes = newPixels * 3 * jpegFactor;
        } else {
            // PNG — lossless-ish
            estBytes = newPixels * 2;
        }

        estSize.textContent = formatBytes(Math.max(0, estBytes));

        const redPct = ((item.size - estBytes) / item.size) * 100;
        if (redPct > 0) {
            reduction.textContent = `-${redPct.toFixed(1)}%`;
            reduction.className = "pi-value green";
        } else if (redPct < 0) {
            reduction.textContent = `+${Math.abs(redPct).toFixed(1)}%`;
            reduction.className = "pi-value red";
        } else {
            reduction.textContent = "0%";
            reduction.className = "pi-value";
        }
    }

    /* ============================================================
       PRESETS
       ============================================================ */
    const PRESET_SIZES = {
        "1920": 1920, "1280": 1280, "1080": 1080,
        "800": 800, "512": 512, "256": 256,
        "128": 128, "64": 64,
    };

    const PRESET_ASPECTS = {
        instagram:  { w: 1080, h: 1080 },
        instaStory: { w: 1080, h: 1920 },
        fbCover:    { w: 820,  h: 312  },
        twitter:    { w: 1200, h: 675  },
        ytThumb:    { w: 1280, h: 720  },
        favicon:    { w: 64,   h: 64   },
    };

    presetBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!images[activeIndex]) return;
            const preset = btn.dataset.preset;

            presetBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            if (preset === "full") {
                widthInput.value = images[activeIndex].width;
                heightInput.value = images[activeIndex].height;
            } else if (PRESET_SIZES[preset]) {
                const targetW = PRESET_SIZES[preset];
                const newH = Math.round(targetW / aspectRatio);
                widthInput.value = targetW;
                heightInput.value = newH;
            } else if (PRESET_ASPECTS[preset]) {
                const { w, h } = PRESET_ASPECTS[preset];
                widthInput.value = w;
                heightInput.value = h;
                // Unlock aspect for fixed aspect presets
                if (aspectLocked) {
                    aspectLocked = false;
                    lockRatioBtn.classList.remove("active");
                    lockRatioBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
                }
            }

            updatePreviewDimensions();
        });
    });

    /* ============================================================
       FORMAT PILLS
       ============================================================ */
    formatPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            formatPills.forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            currentFormat = pill.dataset.format;
            updateQualityVisibility();
            updateEstimatedSize();
        });
    });

    function updateQualityVisibility() {
        const needsQuality = currentFormat === "image/jpeg" || currentFormat === "image/webp";
        qualityBlock.style.display = needsQuality ? "block" : "none";

        const srcIsTransparent = images[activeIndex] &&
            (images[activeIndex].type === "image/png" || images[activeIndex].type === "image/gif" || images[activeIndex].type === "image/svg+xml");
        const targetIsJpeg = currentFormat === "image/jpeg";
        bgBlock.style.display = (srcIsTransparent && targetIsJpeg) ? "block" : "none";
    }

    /* ============================================================
       QUALITY SLIDER
       ============================================================ */
    qualitySlider.addEventListener("input", () => {
        qualityValue.textContent = qualitySlider.value + "%";
        updateEstimatedSize();
    });

    /* ============================================================
       BG COLOR
       ============================================================ */
    bgWhite.addEventListener("click", () => { bgColor.value = "#ffffff"; });
    bgBlack.addEventListener("click", () => { bgColor.value = "#000000"; });

    /* ============================================================
       ZOOM
       ============================================================ */
    zoomInBtn.addEventListener("click", () => {
        currentZoom = Math.min(currentZoom + 0.25, 4);
        previewImg.style.transform = `scale(${currentZoom})`;
    });

    zoomOutBtn.addEventListener("click", () => {
        currentZoom = Math.max(currentZoom - 0.25, 0.25);
        previewImg.style.transform = `scale(${currentZoom})`;
    });

    zoomResetBtn.addEventListener("click", () => {
        currentZoom = 1;
        previewImg.style.transform = "scale(1)";
    });

    toggleCompareBtn.addEventListener("click", () => {
        const isShowing = previewOriginal.classList.contains("show");
        if (isShowing) {
            previewOriginal.classList.remove("show");
            previewOriginal.style.display = "none";
            compareLabel.style.display = "none";
        } else {
            previewOriginal.style.display = "block";
            setTimeout(() => previewOriginal.classList.add("show"), 10);
            compareLabel.style.display = "block";
        }
    });

    /* ============================================================
       RESIZE CORE
       ============================================================ */
    function resizeImage(item, targetW, targetH, mimeType, quality, bgHex) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");

            // Set smoothing based on method
            const method = resizeMethod.value;
            if (method === "high") {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
            } else if (method === "medium") {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "medium";
            } else {
                ctx.imageSmoothingEnabled = false;
            }

            const outMime = mimeType === "original" ? item.type : mimeType;

            // Fill background if JPEG (no alpha support)
            if (outMime === "image/jpeg") {
                ctx.fillStyle = bgHex || "#ffffff";
                ctx.fillRect(0, 0, targetW, targetH);
            }

            try {
                ctx.drawImage(item.img, 0, 0, targetW, targetH);
            } catch (e) {
                reject(e);
                return;
            }

            const q = quality !== undefined ? quality : 0.92;
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("Canvas toBlob failed"));
                    return;
                }
                resolve({ blob, mime: outMime, width: targetW, height: targetH });
            }, outMime, q);
        });
    }

    async function doResizeAndDownload(item, download = true) {
        const w = parseInt(widthInput.value, 10);
        const h = parseInt(heightInput.value, 10);
        if (isNaN(w) || isNaN(h) || w < 1 || h < 1) {
            if (typeof showToast === "function") showToast("⚠️ Invalid dimensions", "error");
            return null;
        }
        if (w > 10000 || h > 10000) {
            if (typeof showToast === "function") showToast("⚠️ Dimensions too large (max 10000)", "error");
            return null;
        }

        const quality = parseInt(qualitySlider.value, 10) / 100;
        const mime = currentFormat;
        const bgHex = bgColor.value;

        try {
            const result = await resizeImage(item, w, h, mime, quality, bgHex);
            const outMime = result.mime;
            const ext = getExtension(outMime);
            const baseName = stripExtension(item.name);
            const newName = `${baseName}_${result.width}x${result.height}.${ext}`;

            if (download) {
                const url = URL.createObjectURL(result.blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = newName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 3000);
            }

            // Update estimate with actual
            const actualReduction = ((item.size - result.blob.size) / item.size) * 100;
            estSize.textContent = formatBytes(result.blob.size);
            if (actualReduction > 0) {
                reduction.textContent = `-${actualReduction.toFixed(1)}%`;
                reduction.className = "pi-value green";
            } else if (actualReduction < 0) {
                reduction.textContent = `+${Math.abs(actualReduction).toFixed(1)}%`;
                reduction.className = "pi-value red";
            }

            // History
            pushHistory({
                name: item.name,
                from: `${item.width}×${item.height}`,
                to: `${result.width}×${result.height}`,
                reduction: actualReduction,
                format: ext.toUpperCase(),
                size: result.blob.size,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            return result;
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Resize failed: " + e.message, "error");
            return null;
        }
    }

    resizeBtn.addEventListener("click", async () => {
        const item = images[activeIndex];
        if (!item) {
            if (typeof showToast === "function") showToast("⚠️ No image loaded", "error");
            return;
        }
        resizeBtn.disabled = true;
        const originalHtml = resizeBtn.innerHTML;
        resizeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resizing…';

        const result = await doResizeAndDownload(item, true);

        resizeBtn.disabled = false;
        resizeBtn.innerHTML = originalHtml;

        if (result && typeof showToast === "function") {
            showToast("✅ Image resized & downloaded");
        }
    });

    resizeAllBtn.addEventListener("click", async () => {
        if (images.length === 0) return;
        const w = parseInt(widthInput.value, 10);
        const h = parseInt(heightInput.value, 10);
        if (isNaN(w) || isNaN(h) || w < 1 || h < 1) {
            if (typeof showToast === "function") showToast("⚠️ Invalid dimensions", "error");
            return;
        }

        if (!confirm(`Resize & download ${images.length} images at ${w}×${h}?`)) return;

        resizeAllBtn.disabled = true;
        const originalHtml = resizeAllBtn.innerHTML;
        resizeAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Resizing 0/${images.length}…`;

        let done = 0;
        for (const item of images) {
            await doResizeAndDownload(item, true);
            done++;
            resizeAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Resizing ${done}/${images.length}…`;
            await new Promise((r) => setTimeout(r, 150)); // Small delay between downloads
        }

        resizeAllBtn.disabled = false;
        resizeAllBtn.innerHTML = originalHtml;
        if (typeof showToast === "function") {
            showToast(`✅ ${images.length} images resized & downloaded`);
        }
    });

    /* ============================================================
       RESET
       ============================================================ */
    function resetAll() {
        images = [];
        activeIndex = 0;
        editorArea.style.display = "none";
        uploadZone.style.display = "block";
        thumbnailsStrip.style.display = "none";
        previewImg.src = "";
        previewOriginal.src = "";
        fileInput.value = "";
        updateBatchButton();

        // Reset UI controls
        widthInput.value = "";
        heightInput.value = "";
        currentFormat = "original";
        formatPills.forEach((p) => p.classList.toggle("active", p.dataset.format === "original"));
        qualitySlider.value = 92;
        qualityValue.textContent = "92%";
        currentZoom = 1;
        previewImg.style.transform = "scale(1)";
        previewOriginal.classList.remove("show");
        previewOriginal.style.display = "none";
        compareLabel.style.display = "none";
        aspectLocked = true;
        lockRatioBtn.classList.add("active");
        lockRatioBtn.innerHTML = '<i class="fa-solid fa-lock"></i>';

        if (typeof showToast === "function") showToast("🔄 Reset");
    }

    resetBtn.addEventListener("click", () => {
        if (images.length > 0 && !confirm("Clear all loaded images?")) return;
        resetAll();
    });

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(entry) {
        history.unshift(entry);
        if (history.length > 12) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            irHistoryList.innerHTML = '<div class="empty-history">No resizes yet</div>';
            return;
        }
        irHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb" style="background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.9rem;">
                    <i class="fa-solid fa-image"></i>
                </div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.name)}</div>
                    <div class="hi-meta">${escapeHtml(h.from)} → ${escapeHtml(h.to)} · ${escapeHtml(h.format)}</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");
    }

    clearIrHistory.addEventListener("click", () => {
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
            if (images.length > 0) resizeBtn.click();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r" && !e.shiftKey && images.length > 0) {
            e.preventDefault();
            resetBtn.click();
            return;
        }
        if (!typing && e.key === "Escape") {
            if (images.length > 0) removeBtn.click();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareImageResizer = function () {
        const shareData = {
            title: "Image Resizer - Tool Hub",
            text: "Resize images to any dimension with aspect ratio lock & quality control!",
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
        renderHistory();
    }

    init();
})();