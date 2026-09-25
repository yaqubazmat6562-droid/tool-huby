/* ============================================================
   PNG TO JPG CONVERTER - Advanced Logic
   Batch · Quality control · Background fill · Resize · ZIP · History
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const p2jCard        = document.getElementById("p2jCard");
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
    const imgTransparency= document.getElementById("imgTransparency");

    const qualitySlider  = document.getElementById("qualitySlider");
    const qualityValue   = document.getElementById("qualityValue");
    const qualityHint    = document.getElementById("qualityHint");
    const qpMinis        = document.querySelectorAll(".qp-mini");

    const resizeToggle   = document.getElementById("resizeToggle");
    const resizeOptions  = document.getElementById("resizeOptions");
    const widthInput     = document.getElementById("widthInput");
    const heightInput    = document.getElementById("heightInput");
    const lockRatioBtn   = document.getElementById("lockRatioBtn");

    const bgPresets      = document.querySelectorAll(".bg-preset");
    const customBgRow    = document.getElementById("customBgRow");
    const customBgColor  = document.getElementById("customBgColor");

    const progressiveJpg = document.getElementById("progressiveJpg");
    const chromaSubsampling = document.getElementById("chromaSubsampling");

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

    const p2jHistoryList = document.getElementById("p2jHistoryList");
    const clearP2jHistory= document.getElementById("clearP2jHistory");

    /* ---------------- State ---------------- */
    let images           = [];
    let activeIndex      = 0;
    let currentBg        = "#ffffff";
    let aspectLocked     = true;
    let currentZoom      = 1;
    let hasTransparency  = false;
    let lastResults      = [];
    let history          = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_pngtojpg_history");
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
            localStorage.setItem("toolhub_pngtojpg_history", JSON.stringify(meta));
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

    function isPng(file) {
        return file.type === "image/png" || /\.png$/i.test(file.name);
    }

    /* ============================================================
       DETECT TRANSPARENCY
       ============================================================ */
    function detectTransparency(img) {
        // Downscale to a small canvas and check alpha channel
        const SIZE = 32;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        try {
            const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] < 250) return true;
            }
        } catch (e) {}
        return false;
    }

    /* ============================================================
       FILE HANDLING
       ============================================================ */
    function handleFiles(files) {
        const valid = Array.from(files).filter(isPng);
        if (valid.length === 0) {
            if (typeof showToast === "function") showToast("⚠️ Please select PNG images only", "error");
            return;
        }

        const notPng = Array.from(files).filter((f) => !isPng(f));
        if (notPng.length > 0) {
            if (typeof showToast === "function") {
                showToast(`ℹ️ Skipped ${notPng.length} non-PNG file(s)`, "error");
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
                    const trans = detectTransparency(img);
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
                        hasTransparency: trans,
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
            if (typeof showToast === "function") showToast("⚠️ No valid PNG images loaded", "error");
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
            showToast(`✅ ${images.length} PNG image${images.length !== 1 ? "s" : ""} loaded`);
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

        // Transparency indicator
        hasTransparency = item.hasTransparency;
        if (hasTransparency) {
            imgTransparency.textContent = "Yes — filled with BG color";
            imgTransparency.className = "pi-value warn";
        } else {
            imgTransparency.textContent = "No";
            imgTransparency.className = "pi-value ok";
        }

        widthInput.value = item.width;
        heightInput.value = item.height;

        updateEstimatedOutput();

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
       QUALITY
       ============================================================ */
    qualitySlider.addEventListener("input", () => {
        const q = parseInt(qualitySlider.value, 10);
        qualityValue.textContent = q + "%";
        qpMinis.forEach((b) => b.classList.toggle("active", parseInt(b.dataset.quality, 10) === q));
        updateHintForQuality(q);
        updateEstimatedOutput();
    });

    qpMinis.forEach((btn) => {
        btn.addEventListener("click", () => {
            const q = parseInt(btn.dataset.quality, 10);
            qualitySlider.value = q;
            qualityValue.textContent = q + "%";
            qpMinis.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            updateHintForQuality(q);
            updateEstimatedOutput();
        });
    });

    function updateHintForQuality(q) {
        let msg = "";
        if (q < 50) msg = "Very small file, noticeable quality loss.";
        else if (q < 75) msg = "Small file, some quality loss. Good for thumbnails.";
        else if (q < 85) msg = "Good balance for general web use.";
        else if (q < 95) msg = "High quality, larger file. Ideal for photos.";
        else msg = "Maximum quality, largest file.";
        qualityHint.innerHTML = `<i class="fa-solid fa-info-circle"></i> ${msg}`;
    }

    /* ============================================================
       RESIZE
       ============================================================ */
    resizeToggle.addEventListener("change", () => {
        resizeOptions.style.display = resizeToggle.checked ? "block" : "none";
        if (resizeToggle.checked && images[activeIndex]) {
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
       BACKGROUND
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
       ESTIMATE OUTPUT
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
        const q = parseInt(qualitySlider.value, 10) / 100;

        // Rough JPG estimate: PNG is ~3-4x larger than comparable JPG
        // JPEG size factor depends heavily on quality
        const jpegFactor = 0.05 + Math.pow(q, 2.5) * 0.45;
        const estBytes = (targetW * targetH) * 3 * jpegFactor;

        outputSize.textContent = formatBytes(estBytes);
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
       CONVERT TO JPG
       ============================================================ */
    function convertToJpg(item, opts = {}) {
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

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Fill background (essential since JPG has no alpha)
            ctx.fillStyle = opts.bg || "#ffffff";
            ctx.fillRect(0, 0, targetW, targetH);

            try {
                ctx.drawImage(item.img, 0, 0, targetW, targetH);
            } catch (e) {
                reject(e);
                return;
            }

            const quality = opts.quality !== undefined ? opts.quality : 0.92;

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas toBlob returned null"));
                        return;
                    }
                    const outName = stripExtension(item.name) + ".jpg";
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
                "image/jpeg",
                quality
            );
        });
    }

    function getConversionOptions() {
        const opts = {
            bg: currentBg,
            quality: parseInt(qualitySlider.value, 10) / 100,
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
            const result = await convertToJpg(item, getConversionOptions());
            updateProgress(100);

            triggerDownload(result);

            lastResults = [result];
            renderResults();
            updateBatchButtons();

            pushHistory({
                name: item.name,
                size: result.size,
                count: 1,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            if (typeof showToast === "function") showToast("✅ Converted to JPG & downloaded");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Conversion failed: " + e.message, "error");
        }

        hideProgress();
        convertBtn.disabled = false;
        convertBtn.innerHTML = origHtml;
    });

    convertAllBtn.addEventListener("click", async () => {
        if (images.length === 0) return;
        if (!confirm(`Convert all ${images.length} PNGs to JPG?`)) return;

        convertAllBtn.disabled = true;
        const origHtml = convertAllBtn.innerHTML;

        showProgress(0, `Converting 0/${images.length}`);

        lastResults = [];
        const opts = getConversionOptions();
        let done = 0;

        for (const item of images) {
            try {
                const result = await convertToJpg(item, opts);
                lastResults.push(result);
                triggerDownload(result, 200);
                done++;
                updateProgress((done / images.length) * 100, `Converting ${done}/${images.length}`);
                convertAllBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${done}/${images.length}…`;
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
                <div class="result-item" style="animation-delay:${Math.min(i, 15) * 0.03}s">
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
        try {
            const zipBlob = await createZip(lastResults);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `jpg-converted-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);
            if (typeof showToast === "function") showToast("📦 ZIP downloaded");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ ZIP failed: " + e.message, "error");
        }
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
        resultsArea.style.display = "none";
        progressWrap.style.display = "none";

        previewImg.src = "";
        previewOriginal.src = "";
        fileInput.value = "";

        resizeToggle.checked = false;
        resizeOptions.style.display = "none";
        widthInput.value = "";
        heightInput.value = "";
        aspectLocked = true;
        lockRatioBtn.classList.add("active");
        lockRatioBtn.innerHTML = '<i class="fa-solid fa-lock"></i>';

        qualitySlider.value = 92;
        qualityValue.textContent = "92%";
        qpMinis.forEach((b) => b.classList.toggle("active", b.dataset.quality === "92"));

        bgPresets.forEach((b) => b.classList.toggle("active", b.dataset.bg === "#ffffff"));
        customBgRow.style.display = "none";
        currentBg = "#ffffff";

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
            p2jHistoryList.innerHTML = '<div class="empty-history">No conversions yet</div>';
            return;
        }
        p2jHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb"><i class="fa-solid fa-file-image"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.name)}</div>
                    <div class="hi-meta">${h.count || 1} file${(h.count || 1) !== 1 ? "s" : ""} · ${formatBytes(h.size)} · JPG</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");
    }

    clearP2jHistory.addEventListener("click", () => {
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
    window.sharePngToJpg = function () {
        const shareData = {
            title: "PNG to JPG Converter - Tool Hub",
            text: "Convert PNG images to JPG format instantly — free & 100% client-side!",
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
        updateHintForQuality(92);
        renderHistory();
    }

    init();
})();