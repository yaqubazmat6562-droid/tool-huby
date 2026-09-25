/* ============================================================
   JPG TO PNG CONVERTER - Advanced Logic
   Batch · Quality presets · Optional resize · Background fill ·
   Metadata toggle · ZIP download · History
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const j2pCard        = document.getElementById("j2pCard");
    const uploadZone     = document.getElementById("uploadZone");
    const fileInput      = document.getElementById("fileInput");
    const browseBtn      = document.getElementById("browseBtn");

    const editorArea     = document.getElementById("editorArea");
    const queueCount     = document.getElementById("queueCount");
    const totalSize      = document.getElementById("totalSize");
    const addMoreBtn     = document.getElementById("addMoreBtn");
    const clearAllBtn    = document.getElementById("clearAllBtn");

    const previewStage   = document.getElementById("previewStage");
    const previewImg     = document.getElementById("previewImg");
    const previewOriginal= document.getElementById("previewOriginal");
    const compareLabel   = document.getElementById("compareLabel");
    const activeName     = document.getElementById("activeName");

    const toggleCompareBtn = document.getElementById("toggleCompareBtn");
    const zoomInBtn      = document.getElementById("zoomInBtn");
    const zoomOutBtn     = document.getElementById("zoomOutBtn");
    const zoomResetBtn   = document.getElementById("zoomResetBtn");

    const inputSize      = document.getElementById("inputSize");
    const outputSize     = document.getElementById("outputSize");
    const imgDimensions  = document.getElementById("imgDimensions");
    const imgCompression = document.getElementById("imgCompression");

    const qualityPresets = document.querySelectorAll(".qp-btn");

    const resizeToggle   = document.getElementById("resizeToggle");
    const resizeOptions  = document.getElementById("resizeOptions");
    const widthInput     = document.getElementById("widthInput");
    const heightInput    = document.getElementById("heightInput");
    const lockRatioBtn   = document.getElementById("lockRatioBtn");

    const bgPresets      = document.querySelectorAll(".bg-preset");
    const customBgRow    = document.getElementById("customBgRow");
    const customBgColor  = document.getElementById("customBgColor");

    const keepMetadata   = document.getElementById("keepMetadata");

    const convertBtn     = document.getElementById("convertBtn");
    const convertAllBtn  = document.getElementById("convertAllBtn");
    const batchCount     = document.getElementById("batchCount");
    const downloadZipBtn = document.getElementById("downloadZipBtn");

    const thumbnailsStrip= document.getElementById("thumbnailsStrip");
    const queueCount2    = document.getElementById("queueCount2");
    const tsList         = document.getElementById("tsList");

    const resultsArea    = document.getElementById("resultsArea");
    const resultsCount   = document.getElementById("resultsCount");
    const resultsList    = document.getElementById("resultsList");

    const progressWrap   = document.getElementById("progressWrap");
    const progressLabel  = document.getElementById("progressLabel");
    const progressFill   = document.getElementById("progressFill");

    const j2pHistoryList = document.getElementById("j2pHistoryList");
    const clearJ2pHistory= document.getElementById("clearJ2pHistory");

    /* ---------------- State ---------------- */
    let images           = [];       // { id, file, name, img, dataUrl, width, height, size, type }
    let activeIndex      = 0;
    let currentQuality   = "max";    // max | balanced | small
    let currentBg        = "transparent";
    let aspectLocked     = true;
    let currentZoom      = 1;
    let lastResults      = [];       // { name, blob, size, dataUrl, width, height }
    let history          = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_jpgtopng_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            const meta = history.slice(0, 15).map((h) => ({
                name: h.name,
                size: h.size,
                time: h.time,
                count: h.count,
            }));
            localStorage.setItem("toolhub_jpgtopng_history", JSON.stringify(meta));
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

    function isJpeg(file) {
        return file.type === "image/jpeg" || /\.(jpe?g)$/i.test(file.name);
    }

    /* ============================================================
       FILE HANDLING
       ============================================================ */
    function handleFiles(files) {
        const valid = Array.from(files).filter(isJpeg);
        if (valid.length === 0) {
            if (typeof showToast === "function") showToast("⚠️ Please select JPG / JPEG images only", "error");
            return;
        }

        const notJpeg = Array.from(files).filter((f) => !isJpeg(f));
        if (notJpeg.length > 0) {
            if (typeof showToast === "function") {
                showToast(`ℹ️ Skipped ${notJpeg.length} non-JPG file(s)`, "error");
            }
        }

        let loaded = 0;
        valid.forEach((file) => {
            if (file.size > 20 * 1024 * 1024) {
                loaded++;
                return;
            }
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
                        type: file.type,
                    });
                    loaded++;
                    finalizeLoad(loaded, valid.length);
                };
                img.onerror = () => {
                    loaded++;
                    finalizeLoad(loaded, valid.length);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function finalizeLoad(done, total) {
        if (done < total) return;
        if (images.length === 0) {
            if (typeof showToast === "function") showToast("⚠️ No valid JPG images loaded", "error");
            return;
        }
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
            showToast(`✅ ${images.length} JPG image${images.length !== 1 ? "s" : ""} loaded`);
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
        if (!confirm("Clear all images and results?")) return;
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
        previewOriginal.classList.remove("show");
        previewOriginal.style.display = "none";
        compareLabel.style.display = "none";

        currentZoom = 1;
        previewImg.style.transform = "scale(1)";

        inputSize.textContent = formatBytes(item.size);
        imgDimensions.textContent = `${item.width} × ${item.height}`;

        // Reset resize inputs
        widthInput.value = item.width;
        heightInput.value = item.height;

        updateEstimatedOutput();
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
            convertAllBtn.style.display = "flex";
            batchCount.textContent = images.length;
        } else {
            convertAllBtn.style.display = "none";
        }
        downloadZipBtn.style.display = lastResults.length > 1 ? "flex" : "none";
    }

    /* ============================================================
       QUALITY PRESETS
       ============================================================ */
    qualityPresets.forEach((btn) => {
        btn.addEventListener("click", () => {
            qualityPresets.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentQuality = btn.dataset.quality;
            updateEstimatedOutput();
        });
    });

    function updateQualityVisibility() {
        // Keep metadata block always visible
    }

    /* ============================================================
       RESIZE OPTIONS
       ============================================================ */
    resizeToggle.addEventListener("change", () => {
        resizeOptions.style.display = resizeToggle.checked ? "block" : "none";
        if (resizeToggle.checked && images[activeIndex]) {
            // Lock ratio when toggle turns on
            const item = images[activeIndex];
            widthInput.value = item.width;
            heightInput.value = item.height;
        }
        updateEstimatedOutput();
    });

    widthInput.addEventListener("input", () => {
        if (!images[activeIndex]) return;
        const w = parseInt(widthInput.value, 10);
        if (isNaN(w) || w < 1) return;
        if (aspectLocked && resizeToggle.checked) {
            const item = images[activeIndex];
            const ratio = item.width / item.height;
            heightInput.value = Math.round(w / ratio);
        }
        updateEstimatedOutput();
    });

    heightInput.addEventListener("input", () => {
        if (!images[activeIndex]) return;
        const h = parseInt(heightInput.value, 10);
        if (isNaN(h) || h < 1) return;
        if (aspectLocked && resizeToggle.checked) {
            const item = images[activeIndex];
            const ratio = item.width / item.height;
            widthInput.value = Math.round(h * ratio);
        }
        updateEstimatedOutput();
    });

    lockRatioBtn.addEventListener("click", () => {
        aspectLocked = !aspectLocked;
        lockRatioBtn.classList.toggle("active", aspectLocked);
        lockRatioBtn.innerHTML = aspectLocked
            ? '<i class="fa-solid fa-lock"></i>'
            : '<i class="fa-solid fa-lock-open"></i>';
    });

    /* ============================================================
       BACKGROUND PRESETS
       ============================================================ */
    bgPresets.forEach((btn) => {
        btn.addEventListener("click", () => {
            bgPresets.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const bg = btn.dataset.bg;
            if (bg === "custom") {
                customBgRow.style.display = "flex";
                currentBg = customBgColor.value;
            } else {
                customBgRow.style.display = "none";
                currentBg = bg;
            }
            updateEstimatedOutput();
        });
    });

    customBgColor.addEventListener("input", () => {
        currentBg = customBgColor.value;
    });

    /* ============================================================
       ESTIMATE OUTPUT SIZE
       ============================================================ */
    function updateEstimatedOutput() {
        const item = images[activeIndex];
        if (!item) return;

        let targetW = item.width;
        let targetH = item.height;
        if (resizeToggle.checked) {
            const w = parseInt(widthInput.value, 10);
            const h = parseInt(heightInput.value, 10);
            if (!isNaN(w) && w > 0) targetW = w;
            if (!isNaN(h) && h > 0) targetH = h;
        }

        const pixelRatio = (targetW * targetH) / (item.width * item.height);

        // Rough PNG size estimate: PNG is roughly 2-3x the JPEG size for photos
        // Adjust by quality preset
        let qualityFactor;
        switch (currentQuality) {
            case "max":      qualityFactor = 3.2; break;
            case "balanced": qualityFactor = 2.4; break;
            case "small":    qualityFactor = 1.8; break;
            default:         qualityFactor = 2.5;
        }

        const estBytes = item.size * pixelRatio * qualityFactor;
        outputSize.textContent = formatBytes(estBytes);

        const increasePct = ((estBytes - item.size) / item.size) * 100;
        if (increasePct > 0) {
            imgCompression.textContent = `+${increasePct.toFixed(0)}% vs JPG`;
            imgCompression.className = "pi-value orange";
        } else {
            imgCompression.textContent = `${increasePct.toFixed(0)}% vs JPG`;
            imgCompression.className = "pi-value green";
        }
    }

    /* ============================================================
       ZOOM & COMPARE
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
        const showing = previewOriginal.classList.contains("show");
        if (showing) {
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
       CONVERSION
       ============================================================ */
    function convertToPng(item, opts = {}) {
        return new Promise((resolve, reject) => {
            let targetW = item.width;
            let targetH = item.height;

            if (opts.resize) {
                targetW = opts.width || item.width;
                targetH = opts.height || item.height;
            }

            const canvas = document.createElement("canvas");
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext("2d");

            // High quality resampling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Fill background if not transparent
            if (opts.bg && opts.bg !== "transparent") {
                ctx.fillStyle = opts.bg;
                ctx.fillRect(0, 0, targetW, targetH);
            }

            try {
                ctx.drawImage(item.img, 0, 0, targetW, targetH);
            } catch (e) {
                reject(e);
                return;
            }

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas toBlob returned null"));
                        return;
                    }
                    const outName = stripExtension(item.name) + ".png";
                    const dataUrl = URL.createObjectURL(blob);
                    resolve({
                        name: outName,
                        blob,
                        size: blob.size,
                        dataUrl,
                        width: targetW,
                        height: targetH,
                        originalSize: item.size,
                    });
                },
                "image/png"
            );
        });
    }

    function getConversionOptions() {
        const opts = {
            bg: currentBg,
        };
        if (resizeToggle.checked) {
            const w = parseInt(widthInput.value, 10);
            const h = parseInt(heightInput.value, 10);
            if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
                opts.resize = true;
                opts.width = w;
                opts.height = h;
            }
        }
        return opts;
    }

    convertBtn.addEventListener("click", async () => {
        const item = images[activeIndex];
        if (!item) {
            if (typeof showToast === "function") showToast("⚠️ No image loaded", "error");
            return;
        }

        convertBtn.disabled = true;
        const origHtml = convertBtn.innerHTML;
        convertBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Converting…';

        showProgress(0, "Converting " + item.name);

        try {
            const result = await convertToPng(item, getConversionOptions());
            updateProgress(100);

            // Download
            triggerDownload(result);

            // Results
            lastResults = [result];
            renderResults();
            updateBatchButtons();

            // History
            pushHistory({
                name: item.name,
                size: result.size,
                count: 1,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            if (typeof showToast === "function") showToast("✅ Converted to PNG & downloaded");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Conversion failed: " + e.message, "error");
        }

        hideProgress();
        convertBtn.disabled = false;
        convertBtn.innerHTML = origHtml;
    });

    convertAllBtn.addEventListener("click", async () => {
        if (images.length === 0) return;
        if (!confirm(`Convert all ${images.length} images to PNG?`)) return;

        convertAllBtn.disabled = true;
        const origHtml = convertAllBtn.innerHTML;
        convertAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 0/${images.length}…`;

        showProgress(0, `Converting 0/${images.length}`);

        lastResults = [];
        const opts = getConversionOptions();
        let done = 0;

        for (const item of images) {
            try {
                const result = await convertToPng(item, opts);
                lastResults.push(result);
                triggerDownload(result, 200);
                done++;
                updateProgress((done / images.length) * 100, `Converting ${done}/${images.length}`);
                convertAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${done}/${images.length}…`;
                // Small delay between downloads
                await new Promise((r) => setTimeout(r, 250));
            } catch (e) {
                done++;
            }
        }

        renderResults();
        updateBatchButtons();

        pushHistory({
            name: `${images.length} images`,
            size: lastResults.reduce((s, r) => s + r.size, 0),
            count: images.length,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        if (typeof showToast === "function") {
            showToast(`✅ ${lastResults.length} image${lastResults.length !== 1 ? "s" : ""} converted`);
        }

        hideProgress();
        convertAllBtn.disabled = false;
        convertAllBtn.innerHTML = origHtml;
    });

    function triggerDownload(result, delay = 0) {
        setTimeout(() => {
            const a = document.createElement("a");
            a.href = result.dataUrl;
            a.download = result.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, delay);
    }

    /* ============================================================
       RESULTS
       ============================================================ */
    function renderResults() {
        if (lastResults.length === 0) {
            resultsArea.style.display = "none";
            return;
        }
        resultsArea.style.display = "block";
        resultsCount.textContent = `${lastResults.length} file${lastResults.length !== 1 ? "s" : ""}`;

        resultsList.innerHTML = lastResults.map((r, i) => {
            const reductionPct = ((r.originalSize - r.size) / r.originalSize) * 100;
            const reductionHtml = reductionPct > 0
                ? `<span class="res-green">-${reductionPct.toFixed(0)}%</span>`
                : `<span class="res-red">+${Math.abs(reductionPct).toFixed(0)}%</span>`;
            return `
                <div class="result-item" style="animation-delay:${Math.min(i, 15) * 0.03}s" data-idx="${i}">
                    <img class="res-thumb" src="${r.dataUrl}" alt="${escapeHtml(r.name)}">
                    <div class="res-info">
                        <div class="res-name">${escapeHtml(r.name)}</div>
                        <div class="res-meta">
                            ${r.width}×${r.height} ·
                            ${formatBytes(r.originalSize)} → ${formatBytes(r.size)}
                            ${reductionHtml}
                        </div>
                    </div>
                    <i class="fa-solid fa-circle-check res-check"></i>
                    <button class="res-download" data-download="${i}" title="Download">
                        <i class="fa-solid fa-download"></i>
                    </button>
                </div>
            `;
        }).join("");

        resultsList.querySelectorAll(".res-download").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.download, 10);
                if (lastResults[idx]) {
                    triggerDownload(lastResults[idx]);
                    if (typeof showToast === "function") showToast("📥 Downloaded");
                }
            });
        });
    }

    /* ============================================================
       ZIP DOWNLOAD
       ============================================================ */
    downloadZipBtn.addEventListener("click", async () => {
        if (lastResults.length === 0) return;
        // Use minimal ZIP implementation (STORE method, no compression)
        try {
            const zipBlob = await createZip(lastResults);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `png-converted-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);
            if (typeof showToast === "function") showToast("📦 ZIP downloaded");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ ZIP failed: " + e.message, "error");
        }
    });

    // Simple ZIP (STORE only, no compression) — enough for images
    async function createZip(files) {
        const encoder = new TextEncoder();
        const parts = [];
        const centralDirectory = [];
        let offset = 0;

        // CRC32 table
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

            // Local file header
            const localHeader = new Uint8Array(30 + nameBytes.length);
            const lhView = new DataView(localHeader.buffer);
            lhView.setUint32(0, 0x04034b50, true);      // signature
            lhView.setUint16(4, 20, true);              // version needed
            lhView.setUint16(6, 0, true);               // flags
            lhView.setUint16(8, 0, true);               // method (0 = store)
            lhView.setUint16(10, 0, true);              // time
            lhView.setUint16(12, 0, true);              // date
            lhView.setUint32(14, crc, true);            // crc32
            lhView.setUint32(18, dataBytes.length, true); // compressed size
            lhView.setUint32(22, dataBytes.length, true); // uncompressed size
            lhView.setUint16(26, nameBytes.length, true);
            lhView.setUint16(28, 0, true);              // extra length
            localHeader.set(nameBytes, 30);

            parts.push(localHeader);
            parts.push(dataBytes);

            // Central directory record
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

        // End of central directory
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
        resultsArea.style.display = "none";
        progressWrap.style.display = "none";

        previewImg.src = "";
        previewOriginal.src = "";
        fileInput.value = "";

        // Reset controls
        resizeToggle.checked = false;
        resizeOptions.style.display = "none";
        widthInput.value = "";
        heightInput.value = "";
        aspectLocked = true;
        lockRatioBtn.classList.add("active");
        lockRatioBtn.innerHTML = '<i class="fa-solid fa-lock"></i>';

        qualityPresets.forEach((b) => b.classList.toggle("active", b.dataset.quality === "max"));
        currentQuality = "max";

        bgPresets.forEach((b) => b.classList.toggle("active", b.dataset.bg === "transparent"));
        customBgRow.style.display = "none";
        currentBg = "transparent";

        currentZoom = 1;
        previewImg.style.transform = "scale(1)";
        previewOriginal.classList.remove("show");
        previewOriginal.style.display = "none";
        compareLabel.style.display = "none";

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
            j2pHistoryList.innerHTML = '<div class="empty-history">No conversions yet</div>';
            return;
        }
        j2pHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb"><i class="fa-solid fa-file-image"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.name)}</div>
                    <div class="hi-meta">${h.count || 1} file${(h.count || 1) !== 1 ? "s" : ""} · ${formatBytes(h.size)} · PNG</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");
    }

    clearJ2pHistory.addEventListener("click", () => {
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
            if (images.length > 0) convertBtn.click();
            return;
        }
        if (!typing && e.key === "Escape") {
            if (images.length > 0) clearAllBtn.click();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareJpgToPng = function () {
        const shareData = {
            title: "JPG to PNG Converter - Tool Hub",
            text: "Convert JPG images to PNG format instantly — free & 100% client-side!",
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