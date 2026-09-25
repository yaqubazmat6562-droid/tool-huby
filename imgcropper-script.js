/* ============================================================
   IMAGE CROPPER - Advanced Logic
   Interactive drag & resize · Aspect ratios · Rotate · Flip ·
   Live preview · Multiple formats · Clipboard
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const icCard         = document.getElementById("icCard");
    const uploadZone     = document.getElementById("uploadZone");
    const fileInput      = document.getElementById("fileInput");
    const browseBtn      = document.getElementById("browseBtn");

    const editorArea     = document.getElementById("editorArea");
    const imageName      = document.getElementById("imageName");
    const imageDims      = document.getElementById("imageDims");
    const undoBtn        = document.getElementById("undoBtn");
    const removeBtn      = document.getElementById("removeBtn");

    const canvasStage    = document.getElementById("canvasStage");
    const cropContainer  = document.getElementById("cropContainer");
    const cropImage      = document.getElementById("cropImage");
    const cropOverlay    = document.getElementById("cropOverlay");
    const cropBox        = document.getElementById("cropBox");
    const cropSizeLabel  = document.getElementById("cropSizeLabel");
    const canvasLoading  = document.getElementById("canvasLoading");

    const aspectBtns     = document.querySelectorAll(".aspect-btn");

    const posX           = document.getElementById("posX");
    const posY           = document.getElementById("posY");
    const cropWidth      = document.getElementById("cropWidth");
    const cropHeight     = document.getElementById("cropHeight");

    const rotateLeftBtn  = document.getElementById("rotateLeftBtn");
    const rotateRightBtn = document.getElementById("rotateRightBtn");
    const flipHBtn       = document.getElementById("flipHBtn");
    const flipVBtn       = document.getElementById("flipVBtn");
    const resetTransformBtn = document.getElementById("resetTransformBtn");
    const transformInfo  = document.getElementById("transformInfo");

    const formatPills    = document.querySelectorAll(".fmt-pill");
    const qualityBlock   = document.getElementById("qualityBlock");
    const qualitySlider  = document.getElementById("qualitySlider");
    const qualityValue   = document.getElementById("qualityValue");

    const cropBtn        = document.getElementById("cropBtn");
    const copyBtn        = document.getElementById("copyBtn");
    const resetBtn       = document.getElementById("resetBtn");

    const previewCanvas  = document.getElementById("previewCanvas");

    const progressWrap   = document.getElementById("progressWrap");
    const progressLabel  = document.getElementById("progressLabel");
    const progressFill   = document.getElementById("progressFill");

    const icHistoryList  = document.getElementById("icHistoryList");
    const clearIcHistory = document.getElementById("clearIcHistory");

    /* ---------------- State ---------------- */
    let currentImage     = null;   // { file, name, img, dataUrl, width, height, size }
    let displayWidth     = 0;
    let displayHeight    = 0;
    let currentAspect    = "free"; // "free" | "1:1" | ...
    let aspectRatio      = 0;      // 0 for free
    let cropRect         = { x: 0, y: 0, w: 0, h: 0 }; // in DISPLAY px
    let rotation         = 0;      // 0, 90, 180, 270
    let flipH            = false;
    let flipV            = false;
    let currentFormat    = "png";
    let isDragging       = false;
    let dragMode         = null;   // "move" | "nw" | "n" | ...
    let dragStart        = null;
    let history          = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_imgcropper_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            const meta = history.slice(0, 12).map((h) => ({
                name: h.name,
                from: h.from,
                to: h.to,
                format: h.format,
                time: h.time,
            }));
            localStorage.setItem("toolhub_imgcropper_history", JSON.stringify(meta));
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

    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    /* ============================================================
       FILE HANDLING
       ============================================================ */
    function handleFile(file) {
        if (!file || !file.type.startsWith("image/")) {
            if (typeof showToast === "function") showToast("⚠️ Please select an image file", "error");
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            if (typeof showToast === "function") showToast("⚠️ File exceeds 20 MB", "error");
            return;
        }

        showLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImage = {
                    file,
                    name: file.name,
                    img,
                    dataUrl: e.target.result,
                    width: img.width,
                    height: img.height,
                    size: file.size,
                };
                rotation = 0;
                flipH = false;
                flipV = false;
                updateTransformInfo();

                uploadZone.style.display = "none";
                editorArea.style.display = "block";

                imageName.textContent = file.name;
                imageDims.textContent = `${img.width} × ${img.height}`;

                cropImage.src = e.target.result;
                // Wait for the cropImage element to be laid out
                setTimeout(() => {
                    computeDisplaySize();
                    initializeCropBox();
                    updateLivePreview();
                    showLoading(false);
                }, 50);

                if (typeof showToast === "function") showToast("✅ Image loaded");
            };
            img.onerror = () => {
                showLoading(false);
                if (typeof showToast === "function") showToast("❌ Failed to load image", "error");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    uploadZone.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") fileInput.click();
    });
    browseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
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
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    function showLoading(on) {
        canvasLoading.style.display = on ? "flex" : "none";
    }

    /* ============================================================
       DISPLAY SIZE COMPUTATION
       ============================================================ */
    function computeDisplaySize() {
        const maxW = canvasStage.clientWidth - 40;
        const maxH = canvasStage.clientHeight - 40;
        const imgW = cropImage.naturalWidth || cropImage.width;
        const imgH = cropImage.naturalHeight || cropImage.height;

        const ratio = imgW / imgH;
        let w = imgW;
        let h = imgH;
        if (w > maxW) { w = maxW; h = w / ratio; }
        if (h > maxH) { h = maxH; w = h * ratio; }

        displayWidth = Math.round(w);
        displayHeight = Math.round(h);

        cropImage.style.width = displayWidth + "px";
        cropImage.style.height = displayHeight + "px";
        cropContainer.style.width = displayWidth + "px";
        cropContainer.style.height = displayHeight + "px";
    }

    /* ============================================================
       CROP BOX INITIALIZATION
       ============================================================ */
    function initializeCropBox() {
        // Initialize with a centered 80% crop
        const w = Math.round(displayWidth * 0.8);
        const h = aspectRatio > 0
            ? Math.round(w / aspectRatio)
            : Math.round(displayHeight * 0.8);

        // Ensure fits
        const finalH = Math.min(h, displayHeight);
        const x = Math.round((displayWidth - w) / 2);
        const y = Math.round((displayHeight - finalH) / 2);

        setCropRect(x, y, w, finalH);
    }

    function resetCropBoxForAspect() {
        if (aspectRatio === 0) {
            // Keep current box (just constrain)
            constrainCropRect();
            return;
        }
        // Fit largest box within image at target aspect
        const imgAspect = displayWidth / displayHeight;
        let w, h;
        if (aspectRatio > imgAspect) {
            w = displayWidth * 0.9;
            h = w / aspectRatio;
            if (h > displayHeight * 0.9) {
                h = displayHeight * 0.9;
                w = h * aspectRatio;
            }
        } else {
            h = displayHeight * 0.9;
            w = h * aspectRatio;
            if (w > displayWidth * 0.9) {
                w = displayWidth * 0.9;
                h = w / aspectRatio;
            }
        }
        const x = Math.round((displayWidth - w) / 2);
        const y = Math.round((displayHeight - h) / 2);
        setCropRect(x, y, Math.round(w), Math.round(h));
    }

    /* ============================================================
       CROP RECT SETTERS / GETTERS
       ============================================================ */
    function setCropRect(x, y, w, h) {
        // Constrain
        w = Math.max(20, Math.min(w, displayWidth));
        h = Math.max(20, Math.min(h, displayHeight));
        x = clamp(x, 0, displayWidth - w);
        y = clamp(y, 0, displayHeight - h);

        cropRect = { x, y, w, h };
        applyCropRectToDOM();
        updateCropInputs();
        updateCropSizeLabel();
        updateLivePreview();
    }

    function applyCropRectToDOM() {
        cropBox.style.left = cropRect.x + "px";
        cropBox.style.top = cropRect.y + "px";
        cropBox.style.width = cropRect.w + "px";
        cropBox.style.height = cropRect.h + "px";
    }

    function updateCropInputs() {
        // Convert display → image coords (account for rotation)
        const scale = currentImage.width / displayWidth;
        posX.value = Math.round(cropRect.x * scale);
        posY.value = Math.round(cropRect.y * scale);
        cropWidth.value = Math.round(cropRect.w * scale);
        cropHeight.value = Math.round(cropRect.h * scale);
    }

    function updateCropSizeLabel() {
        const scale = currentImage.width / displayWidth;
        const realW = Math.round(cropRect.w * scale);
        const realH = Math.round(cropRect.h * scale);
        cropSizeLabel.textContent = `${realW} × ${realH}`;
    }

    function constrainCropRect() {
        cropRect.x = clamp(cropRect.x, 0, displayWidth - cropRect.w);
        cropRect.y = clamp(cropRect.y, 0, displayHeight - cropRect.h);
        applyCropRectToDOM();
        updateCropInputs();
        updateCropSizeLabel();
    }

    /* ============================================================
       ASPECT RATIO BUTTONS
       ============================================================ */
    aspectBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            aspectBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const ratio = btn.dataset.aspect;
            currentAspect = ratio;
            if (ratio === "free") {
                aspectRatio = 0;
            } else {
                const [w, h] = ratio.split(":").map(Number);
                aspectRatio = w / h;
            }
            resetCropBoxForAspect();
        });
    });

    /* ============================================================
       INPUT FIELDS
       ============================================================ */
    function onInputChange() {
        if (!currentImage) return;
        const scale = currentImage.width / displayWidth;

        const x = parseFloat(posX.value) / scale;
        const y = parseFloat(posY.value) / scale;
        const w = parseFloat(cropWidth.value) / scale;
        const h = parseFloat(cropHeight.value) / scale;

        if ([x, y, w, h].some((v) => isNaN(v))) return;

        let newW = w;
        let newH = h;

        // Apply aspect ratio if constrained
        if (aspectRatio > 0) {
            // Prefer width, derive height
            newH = newW / aspectRatio;
        }

        setCropRect(x, y, newW, newH);
    }

    posX.addEventListener("change", onInputChange);
    posY.addEventListener("change", onInputChange);
    cropWidth.addEventListener("change", onInputChange);
    cropHeight.addEventListener("change", onInputChange);

    /* ============================================================
       DRAG HANDLING
       ============================================================ */
    function getPointerPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function startDrag(e, mode) {
        e.preventDefault();
        e.stopPropagation();
        if (!currentImage) return;
        isDragging = true;
        dragMode = mode;
        dragStart = {
            pointer: getPointerPos(e),
            rect: { ...cropRect },
        };
        cropBox.classList.add("dragging");
        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("mouseup", endDrag);
        document.addEventListener("touchmove", onDragMove, { passive: false });
        document.addEventListener("touchend", endDrag);
    }

    function onDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const p = getPointerPos(e);
        const dx = p.x - dragStart.pointer.x;
        const dy = p.y - dragStart.pointer.y;

        const r = dragStart.rect;
        let x = r.x;
        let y = r.y;
        let w = r.w;
        let h = r.h;

        if (dragMode === "move") {
            x = clamp(r.x + dx, 0, displayWidth - w);
            y = clamp(r.y + dy, 0, displayHeight - h);
        } else {
            // Handle resize — 8 handles
            // Right edge
            if (dragMode.includes("e")) {
                w = clamp(r.w + dx, 20, displayWidth - r.x);
            }
            // Left edge
            if (dragMode.includes("w")) {
                const newX = clamp(r.x + dx, 0, r.x + r.w - 20);
                w = r.w + (r.x - newX);
                x = newX;
            }
            // Bottom edge
            if (dragMode.includes("s")) {
                h = clamp(r.h + dy, 20, displayHeight - r.y);
            }
            // Top edge
            if (dragMode.includes("n")) {
                const newY = clamp(r.y + dy, 0, r.y + r.h - 20);
                h = r.h + (r.y - newY);
                y = newY;
            }

            // Apply aspect ratio
            if (aspectRatio > 0) {
                // Determine dominant axis
                const isCorner = dragMode.length === 2;
                if (isCorner) {
                    // Maintain ratio: prefer width, adjust height from center of fixed corner
                    h = w / aspectRatio;
                    // Re-check bounds
                    if (y + h > displayHeight) {
                        h = displayHeight - y;
                        w = h * aspectRatio;
                    }
                    if (dragMode.includes("w")) {
                        x = r.x + r.w - w;
                    }
                    if (dragMode.includes("n")) {
                        y = r.y + r.h - h;
                    }
                } else if (dragMode === "e" || dragMode === "w") {
                    h = w / aspectRatio;
                    // Adjust y if going out of bounds (keep centered)
                    y = clamp(y, 0, displayHeight - h);
                } else if (dragMode === "n" || dragMode === "s") {
                    w = h * aspectRatio;
                    x = clamp(x, 0, displayWidth - w);
                }
            }
        }

        // Final bounds check
        w = Math.max(20, Math.min(w, displayWidth));
        h = Math.max(20, Math.min(h, displayHeight));
        x = clamp(x, 0, displayWidth - w);
        y = clamp(y, 0, displayHeight - h);

        cropRect = { x, y, w, h };
        applyCropRectToDOM();
        updateCropInputs();
        updateCropSizeLabel();
        updateLivePreview();
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        dragMode = null;
        cropBox.classList.remove("dragging");
        document.removeEventListener("mousemove", onDragMove);
        document.removeEventListener("mouseup", endDrag);
        document.removeEventListener("touchmove", onDragMove);
        document.removeEventListener("touchend", endDrag);
    }

    // Attach to cropBox
    cropBox.addEventListener("mousedown", (e) => startDrag(e, "move"));
    cropBox.addEventListener("touchstart", (e) => startDrag(e, "move"), { passive: false });

    // Attach to handles
    cropBox.querySelectorAll(".crop-handle").forEach((h) => {
        h.addEventListener("mousedown", (e) => startDrag(e, h.dataset.handle));
        h.addEventListener("touchstart", (e) => startDrag(e, h.dataset.handle), { passive: false });
    });

    /* ============================================================
       TRANSFORM (ROTATE & FLIP)
       ============================================================ */
    function updateTransformInfo() {
        const flipText = [];
        if (flipH) flipText.push("H");
        if (flipV) flipText.push("V");
        transformInfo.textContent = `Rotation: ${rotation}° · Flip: ${flipText.length > 0 ? flipText.join("+") : "none"}`;
    }

    rotateLeftBtn.addEventListener("click", () => {
        rotation = (rotation - 90 + 360) % 360;
        updateTransformInfo();
        recomputeAfterTransform();
    });

    rotateRightBtn.addEventListener("click", () => {
        rotation = (rotation + 90) % 360;
        updateTransformInfo();
        recomputeAfterTransform();
    });

    flipHBtn.addEventListener("click", () => {
        flipH = !flipH;
        updateTransformInfo();
        updateLivePreview();
    });

    flipVBtn.addEventListener("click", () => {
        flipV = !flipV;
        updateTransformInfo();
        updateLivePreview();
    });

    resetTransformBtn.addEventListener("click", () => {
        rotation = 0;
        flipH = false;
        flipV = false;
        updateTransformInfo();
        recomputeAfterTransform();
    });

    function recomputeAfterTransform() {
        // Reset crop box after rotation (dimensions change visual)
        // Actually we keep the same crop rect but reapply for the new orientation
        // Since image is rotated visually via CSS transform, we need to reflect that
        setTimeout(() => {
            // Recompute display size based on rotation
            computeDisplaySizeWithRotation();
            constrainCropRect();
            updateLivePreview();
        }, 100);
    }

    function computeDisplaySizeWithRotation() {
        const maxW = canvasStage.clientWidth - 40;
        const maxH = canvasStage.clientHeight - 40;

        const imgW = cropImage.naturalWidth || cropImage.width;
        const imgH = cropImage.naturalHeight || cropImage.height;

        // Visual dimensions after rotation
        const rot = ((rotation % 360) + 360) % 360;
        const isRotated90or270 = (rot === 90 || rot === 270);
        const visualW = isRotated90or270 ? imgH : imgW;
        const visualH = isRotated90or270 ? imgW : imgH;

        const ratio = visualW / visualH;
        let w = visualW;
        let h = visualH;
        if (w > maxW) { w = maxW; h = w / ratio; }
        if (h > maxH) { h = maxH; w = h * ratio; }

        displayWidth = Math.round(w);
        displayHeight = Math.round(h);

        // Apply visual dimensions
        cropContainer.style.width = displayWidth + "px";
        cropContainer.style.height = displayHeight + "px";

        // Style the image with rotation
        const flipX = flipH ? -1 : 1;
        const flipY = flipV ? -1 : 1;

        cropImage.style.width = (isRotated90or270 ? displayHeight : displayWidth) + "px";
        cropImage.style.height = (isRotated90or270 ? displayWidth : displayHeight) + "px";
        cropImage.style.transform = `rotate(${rotation}deg) scale(${flipX}, ${flipY})`;
        cropImage.style.transformOrigin = "center center";
        cropImage.style.position = "absolute";
        cropImage.style.left = "50%";
        cropImage.style.top = "50%";
        cropImage.style.marginLeft = -(isRotated90or270 ? displayHeight : displayWidth) / 2 + "px";
        cropImage.style.marginTop  = -(isRotated90or270 ? displayWidth : displayHeight) / 2 + "px";
    }

    /* ============================================================
       LIVE PREVIEW (rendered crop)
       ============================================================ */
    function updateLivePreview() {
        if (!currentImage) return;

        const scale = currentImage.width / displayWidth;
        const sourceX = Math.round(cropRect.x * scale);
        const sourceY = Math.round(cropRect.y * scale);
        const sourceW = Math.round(cropRect.w * scale);
        const sourceH = Math.round(cropRect.h * scale);

        const rot = ((rotation % 360) + 360) % 360;

        // Output dimensions: swap if rotated 90/270
        const isRotated90or270 = (rot === 90 || rot === 270);
        const outW = isRotated90or270 ? sourceH : sourceW;
        const outH = isRotated90or270 ? sourceW : sourceH;

        // Set preview canvas dims to at most 320×220 (visual)
        const maxPV = 300;
        let pvW = outW;
        let pvH = outH;
        if (pvW > maxPV) { pvH = Math.round(pvH * (maxPV / pvW)); pvW = maxPV; }
        if (pvH > 220) { pvW = Math.round(pvW * (220 / pvH)); pvH = 220; }

        previewCanvas.width = outW;
        previewCanvas.height = outH;
        previewCanvas.style.width = pvW + "px";
        previewCanvas.style.height = pvH + "px";

        const ctx = previewCanvas.getContext("2d");

        // Clear
        ctx.clearRect(0, 0, outW, outH);

        // Compute source rect: for rotation we need the original rotated region
        // Strategy: render the FULL rotated image to an intermediate canvas,
        // then crop that intermediate.

        // Intermediate canvas — full rotated image at source resolution
        const fullCanvas = document.createElement("canvas");
        fullCanvas.width = isRotated90or270 ? currentImage.height : currentImage.width;
        fullCanvas.height = isRotated90or270 ? currentImage.width : currentImage.height;

        const fctx = fullCanvas.getContext("2d");
        fctx.save();
        fctx.translate(fullCanvas.width / 2, fullCanvas.height / 2);
        fctx.rotate((rot * Math.PI) / 180);
        fctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        fctx.drawImage(currentImage.img, -currentImage.width / 2, -currentImage.height / 2);
        fctx.restore();

        // Now crop from the intermediate — but the crop rect we have is in DISPLAY coords.
        // We need to map it to the rotated image coordinates.

        // Display → rotated image scale:
        const fullCanvasW = fullCanvas.width;
        const fullCanvasH = fullCanvas.height;
        const rotatedDisplayW = isRotated90or270 ? displayHeight : displayWidth;
        const rotatedDisplayH = isRotated90or270 ? displayWidth : displayHeight;

        // Wait — displayWidth corresponds to the ROTATED visual width
        // Since displayWidth is the "visual" width (after rotation), we need to use the full rotated image dimension.
        const rscale = fullCanvasW / displayWidth;

        const rx = Math.round(cropRect.x * rscale);
        const ry = Math.round(cropRect.y * rscale);
        const rw = Math.round(cropRect.w * rscale);
        const rh = Math.round(cropRect.h * rscale);

        try {
            ctx.drawImage(fullCanvas, rx, ry, rw, rh, 0, 0, outW, outH);
        } catch (e) {
            // Fallback: direct draw
            ctx.drawImage(currentImage.img, sourceX, sourceY, sourceW, sourceH, 0, 0, outW, outH);
        }
    }

    /* ============================================================
       FORMAT & QUALITY
       ============================================================ */
    formatPills.forEach((pill) => {
        pill.addEventListener("click", () => {
            formatPills.forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            currentFormat = pill.dataset.format;
            qualityBlock.style.display = (currentFormat === "jpeg" || currentFormat === "webp") ? "block" : "none";
        });
    });

    qualitySlider.addEventListener("input", () => {
        qualityValue.textContent = qualitySlider.value + "%";
    });

    /* ============================================================
       ACTIONS
       ============================================================ */
    function getMime() {
        switch (currentFormat) {
            case "jpeg": return "image/jpeg";
            case "webp": return "image/webp";
            default: return "image/png";
        }
    }

    function getExtension() {
        switch (currentFormat) {
            case "jpeg": return "jpg";
            case "webp": return "webp";
            default: return "png";
        }
    }

    function renderCropToCanvas() {
        return new Promise((resolve) => {
            const scale = currentImage.width / displayWidth;
            const sourceX = Math.round(cropRect.x * scale);
            const sourceY = Math.round(cropRect.y * scale);
            const sourceW = Math.round(cropRect.w * scale);
            const sourceH = Math.round(cropRect.h * scale);

            const rot = ((rotation % 360) + 360) % 360;
            const isRotated90or270 = (rot === 90 || rot === 270);
            const outW = isRotated90or270 ? sourceH : sourceW;
            const outH = isRotated90or270 ? sourceW : sourceH;

            const canvas = document.createElement("canvas");
            canvas.width = outW;
            canvas.height = outH;
            const ctx = canvas.getContext("2d");

            // Fill white for JPEG
            if (currentFormat === "jpeg") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, outW, outH);
            }

            // Render full rotated image
            const fullCanvas = document.createElement("canvas");
            fullCanvas.width = isRotated90or270 ? currentImage.height : currentImage.width;
            fullCanvas.height = isRotated90or270 ? currentImage.width : currentImage.height;

            const fctx = fullCanvas.getContext("2d");
            fctx.imageSmoothingEnabled = true;
            fctx.imageSmoothingQuality = "high";
            fctx.save();
            fctx.translate(fullCanvas.width / 2, fullCanvas.height / 2);
            fctx.rotate((rot * Math.PI) / 180);
            fctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
            fctx.drawImage(currentImage.img, -currentImage.width / 2, -currentImage.height / 2);
            fctx.restore();

            const fullCanvasW = fullCanvas.width;
            const rscale = fullCanvasW / displayWidth;
            const rx = Math.round(cropRect.x * rscale);
            const ry = Math.round(cropRect.y * rscale);
            const rw = Math.round(cropRect.w * rscale);
            const rh = Math.round(cropRect.h * rscale);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            try {
                ctx.drawImage(fullCanvas, rx, ry, rw, rh, 0, 0, outW, outH);
            } catch (e) {
                // Fallback to raw image
                ctx.drawImage(currentImage.img, sourceX, sourceY, sourceW, sourceH, 0, 0, outW, outH);
            }

            const quality = parseInt(qualitySlider.value, 10) / 100;
            canvas.toBlob((blob) => {
                resolve({ blob, canvas, outW, outH });
            }, getMime(), quality);
        });
    }

    cropBtn.addEventListener("click", async () => {
        if (!currentImage) return;
        cropBtn.disabled = true;
        const origHtml = cropBtn.innerHTML;
        cropBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cropping…';
        showProgress(30, "Rendering crop…");

        try {
            const { blob, outW, outH } = await renderCropToCanvas();
            showProgress(80, "Preparing download…");

            const url = URL.createObjectURL(blob);
            const baseName = currentImage.name.replace(/\.[^.]+$/, "");
            const filename = `${baseName}_crop_${outW}x${outH}.${getExtension()}`;

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);

            showProgress(100, "Done!");

            pushHistory({
                name: currentImage.name,
                from: `${currentImage.width}×${currentImage.height}`,
                to: `${outW}×${outH}`,
                format: getExtension().toUpperCase(),
                size: blob.size,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            if (typeof showToast === "function") showToast("✅ Cropped & downloaded");
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Crop failed: " + e.message, "error");
        }

        hideProgress();
        cropBtn.disabled = false;
        cropBtn.innerHTML = origHtml;
    });

    copyBtn.addEventListener("click", async () => {
        if (!currentImage) return;
        copyBtn.disabled = true;
        const origHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Copying…';

        try {
            const { blob } = await renderCropToCanvas();
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob }),
                ]);
                if (typeof showToast === "function") showToast("📋 Copied to clipboard!");
            } else {
                if (typeof showToast === "function") showToast("⚠️ Clipboard not supported", "error");
            }
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Copy failed: " + e.message, "error");
        }

        copyBtn.disabled = false;
        copyBtn.innerHTML = origHtml;
    });

    resetBtn.addEventListener("click", () => {
        resetAll();
    });

    undoBtn.addEventListener("click", () => {
        if (!currentImage) return;
        rotation = 0;
        flipH = false;
        flipV = false;
        updateTransformInfo();
        recomputeAfterTransform();
        setTimeout(() => {
            initializeCropBox();
        }, 150);
        if (typeof showToast === "function") showToast("🔄 Reset");
    });

    removeBtn.addEventListener("click", () => {
        if (!confirm("Remove current image?")) return;
        resetAll();
    });

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
        currentImage = null;
        cropRect = { x: 0, y: 0, w: 0, h: 0 };
        rotation = 0;
        flipH = false;
        flipV = false;
        currentAspect = "free";
        aspectRatio = 0;
        updateTransformInfo();

        editorArea.style.display = "none";
        uploadZone.style.display = "block";
        progressWrap.style.display = "none";

        cropImage.src = "";
        cropImage.style.transform = "";
        cropImage.style.position = "";
        cropImage.style.left = "";
        cropImage.style.top = "";
        cropImage.style.marginLeft = "";
        cropImage.style.marginTop = "";
        fileInput.value = "";

        aspectBtns.forEach((b) => b.classList.toggle("active", b.dataset.aspect === "free"));

        posX.value = 0;
        posY.value = 0;
        cropWidth.value = 0;
        cropHeight.value = 0;

        previewCanvas.width = 0;
        previewCanvas.height = 0;

        if (typeof showToast === "function") showToast("🔄 Cleared");
    }

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
            icHistoryList.innerHTML = '<div class="empty-history">No crops yet</div>';
            return;
        }
        icHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb"><i class="fa-solid fa-crop-simple"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.name)}</div>
                    <div class="hi-meta">${escapeHtml(h.from)} → ${escapeHtml(h.to)} · ${escapeHtml(h.format)}</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");
    }

    clearIcHistory.addEventListener("click", () => {
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
            if (currentImage) cropBtn.click();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && !typing) {
            if (currentImage) {
                // only intercept if no text is selected
                if (!window.getSelection().toString()) {
                    e.preventDefault();
                    copyBtn.click();
                }
            }
            return;
        }
        if (!typing && e.key === "Escape") {
            if (currentImage) resetAll();
            return;
        }
        if (!typing && currentImage && e.key.startsWith("Arrow")) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            if (e.key === "ArrowLeft")  setCropRect(cropRect.x - step, cropRect.y, cropRect.w, cropRect.h);
            if (e.key === "ArrowRight") setCropRect(cropRect.x + step, cropRect.y, cropRect.w, cropRect.h);
            if (e.key === "ArrowUp")    setCropRect(cropRect.x, cropRect.y - step, cropRect.w, cropRect.h);
            if (e.key === "ArrowDown")  setCropRect(cropRect.x, cropRect.y + step, cropRect.w, cropRect.h);
        }
    });

    /* ============================================================
       RESIZE HANDLING
       ============================================================ */
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        if (!currentImage) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            computeDisplaySizeWithRotation();
            constrainCropRect();
            updateLivePreview();
        }, 200);
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareImageCropper = function () {
        const shareData = {
            title: "Image Cropper - Tool Hub",
            text: "Crop images interactively with custom aspect ratios!",
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
        updateTransformInfo();
        renderHistory();
    }

    init();
})();