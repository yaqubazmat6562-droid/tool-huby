/* ============================================================
   IMAGE TO BASE64 - Advanced Logic
   Batch · Multiple formats · Copy · Download · ZIP · History
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const ib64Card       = document.getElementById("ib64Card");
    const uploadZone     = document.getElementById("uploadZone");
    const fileInput      = document.getElementById("fileInput");
    const browseBtn      = document.getElementById("browseBtn");

    const editorArea     = document.getElementById("editorArea");
    const queueCount     = document.getElementById("queueCount");
    const totalSize      = document.getElementById("totalSize");
    const totalB64       = document.getElementById("totalB64");
    const addMoreBtn     = document.getElementById("addMoreBtn");
    const copyAllB64Btn  = document.getElementById("copyAllB64Btn");
    const clearAllBtn    = document.getElementById("clearAllBtn");

    const activeName     = document.getElementById("activeName");
    const previewImg     = document.getElementById("previewImg");
    const copyB64Btn     = document.getElementById("copyB64Btn");
    const downloadB64Btn = document.getElementById("downloadB64Btn");
    const openImageBtn   = document.getElementById("openImageBtn");

    const piFile         = document.getElementById("piFile");
    const piDims         = document.getElementById("piDims");
    const piSize         = document.getElementById("piSize");
    const piB64Size      = document.getElementById("piB64Size");
    const piOverhead     = document.getElementById("piOverhead");
    const piMime         = document.getElementById("piMime");

    const fmtBtns        = document.querySelectorAll(".fmt-btn");
    const wrapLinesChk   = document.getElementById("wrapLines");
    const includeNameChk = document.getElementById("includeName");
    const optimizeJpgChk = document.getElementById("optimizeJpg");

    const warningBlock   = document.getElementById("warningBlock");
    const outputPre      = document.getElementById("outputPre");
    const copyOutputBtn  = document.getElementById("copyOutputBtn");
    const downloadOutputBtn = document.getElementById("downloadOutputBtn");

    const downloadCurrentBtn = document.getElementById("downloadCurrentBtn");
    const downloadAllBtn = document.getElementById("downloadAllBtn");
    const batchCount     = document.getElementById("batchCount");
    const downloadZipBtn = document.getElementById("downloadZipBtn");

    const thumbnailsStrip= document.getElementById("thumbnailsStrip");
    const queueCount2    = document.getElementById("queueCount2");
    const tsList         = document.getElementById("tsList");

    const progressWrap   = document.getElementById("progressWrap");
    const progressLabel  = document.getElementById("progressLabel");
    const progressFill   = document.getElementById("progressFill");

    const ib64HistoryList= document.getElementById("ib64HistoryList");
    const clearIb64History = document.getElementById("clearIb64History");

    /* ---------------- State ---------------- */
    let images           = [];       // { id, file, name, img, dataUrl, base64, width, height, size, type }
    let activeIndex      = 0;
    let currentFormat    = "datauri";
    let lastResults      = [];
    let history          = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_imgtobase64_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            const meta = history.slice(0, 15).map((h) => ({
                name: h.name,
                size: h.size,
                b64Size: h.b64Size,
                count: h.count,
                time: h.time,
            }));
            localStorage.setItem("toolhub_imgtobase64_history", JSON.stringify(meta));
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

    function shortMime(mime) {
        return (mime || "image/png").replace("image/", "").toUpperCase();
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

        // Size check
        const tooBig = valid.filter((f) => f.size > 10 * 1024 * 1024);
        if (tooBig.length > 0) {
            if (typeof showToast === "function") showToast(`⚠️ ${tooBig.length} file(s) exceed 10 MB`, "error");
        }

        let loaded = 0;
        valid.forEach((file) => {
            if (file.size > 10 * 1024 * 1024) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const base64 = dataUrl.split(",")[1] || "";
                const img = new Image();
                img.onload = () => {
                    images.push({
                        id: Date.now() + Math.random(),
                        file,
                        name: file.name,
                        img,
                        dataUrl,
                        base64,
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

        piFile.textContent = item.name;
        piDims.textContent = `${item.width} × ${item.height}`;
        piSize.textContent = formatBytes(item.size);
        piB64Size.textContent = formatBytes(item.base64.length);

        const overhead = ((item.base64.length - item.size) / item.size) * 100;
        piOverhead.textContent = `+${overhead.toFixed(0)}%`;
        piOverhead.className = "pi-value orange";

        piMime.textContent = item.type.replace("image/", "").toUpperCase();

        // Warning for large files
        warningBlock.style.display = item.size > 100 * 1024 ? "flex" : "none";

        updateOutput();

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
        const b64Total = images.reduce((sum, i) => sum + i.base64.length, 0);
        totalSize.textContent = formatBytes(total);
        totalB64.textContent = formatBytes(b64Total);
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
       FORMAT
       ============================================================ */
    fmtBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            fmtBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentFormat = btn.dataset.format;
            updateOutput();
        });
    });

    wrapLinesChk.addEventListener("change", updateOutput);
    includeNameChk.addEventListener("change", updateOutput);
    optimizeJpgChk.addEventListener("change", updateOutput);

    /* ============================================================
       BUILD OUTPUT STRING
       ============================================================ */
    function buildOutputForItem(item) {
        const dataUri = item.dataUrl; // e.g. data:image/png;base64,xxxx
        const mime = item.type || "image/png";
        const raw = item.base64;

        let out = "";
        switch (currentFormat) {
            case "datauri":
                out = dataUri;
                break;
            case "raw":
                out = raw;
                break;
            case "css":
                out = `.image {\n  background-image: url("${dataUri}");\n  background-size: cover;\n  background-position: center;\n}`;
                break;
            case "html":
                out = `<img src="${dataUri}" alt="${includeNameChk.checked ? escapeHtml(item.name) : "image"}" />`;
                break;
            case "js":
                if (includeNameChk.checked) {
                    const varName = item.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_$]/g, "_");
                    out = `const ${varName} = "${dataUri}";`;
                } else {
                    out = `const imageData = "${dataUri}";`;
                }
                break;
            case "json":
                out = JSON.stringify({
                    name: includeNameChk.checked ? item.name : undefined,
                    type: mime,
                    width: item.width,
                    height: item.height,
                    size: item.size,
                    data: dataUri,
                }, null, 2);
                break;
            default:
                out = dataUri;
        }

        if (wrapLinesChk.checked && currentFormat !== "json" && currentFormat !== "css") {
            out = wrapText(out, 76);
        }

        return out;
    }

    function wrapText(str, width) {
        // Only wrap base64 chunks (avoid breaking URIs by inserting newlines)
        // Insert "\n" every `width` chars
        return str.replace(new RegExp(`(.{${width}})`, "g"), "$1\n");
    }

    function updateOutput() {
        const item = images[activeIndex];
        if (!item) {
            outputPre.textContent = "Select an image to see Base64…";
            return;
        }
        const out = buildOutputForItem(item);
        outputPre.textContent = out;
    }

    /* ============================================================
       COPY
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

    copyOutputBtn.addEventListener("click", () => {
        copyToClipboard(outputPre.textContent);
    });

    copyB64Btn.addEventListener("click", () => {
        const item = images[activeIndex];
        if (!item) return;
        copyToClipboard(item.base64);
    });

    copyAllB64Btn.addEventListener("click", () => {
        if (images.length === 0) return;
        const allText = images.map((item) => {
            const out = buildOutputForItem(item);
            return includeNameChk.checked
                ? `/* ${item.name} */\n${out}`
                : out;
        }).join("\n\n");
        copyToClipboard(allText);
    });

    /* ============================================================
       DOWNLOAD
       ============================================================ */
    function getExtensionForFormat() {
        switch (currentFormat) {
            case "css": return "css";
            case "html": return "html";
            case "js": return "js";
            case "json": return "json";
            default: return "txt";
        }
    }

    function downloadTextFile(content, filename) {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    }

    downloadOutputBtn.addEventListener("click", () => {
        const item = images[activeIndex];
        if (!item) return;
        const content = outputPre.textContent;
        const baseName = item.name.replace(/\.[^.]+$/, "");
        downloadTextFile(content, `${baseName}_base64.${getExtensionForFormat()}`);
        if (typeof showToast === "function") showToast("📥 Downloaded");
    });

    downloadB64Btn.addEventListener("click", () => {
        const item = images[activeIndex];
        if (!item) return;
        const baseName = item.name.replace(/\.[^.]+$/, "");
        downloadTextFile(item.base64, `${baseName}_base64.txt`);
        if (typeof showToast === "function") showToast("📥 Downloaded");
    });

    downloadCurrentBtn.addEventListener("click", () => {
        const item = images[activeIndex];
        if (!item) return;
        const content = outputPre.textContent;
        const baseName = item.name.replace(/\.[^.]+$/, "");
        downloadTextFile(content, `${baseName}_base64.${getExtensionForFormat()}`);

        // History
        pushHistory({
            name: item.name,
            size: item.size,
            b64Size: item.base64.length,
            count: 1,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        if (typeof showToast === "function") showToast("📥 Downloaded");
    });

    downloadAllBtn.addEventListener("click", async () => {
        if (images.length === 0) return;
        if (!confirm(`Download Base64 for all ${images.length} images?`)) return;

        showProgress(0, `Downloading 0/${images.length}`);

        let done = 0;
        for (const item of images) {
            const content = buildOutputForItem(item);
            const baseName = item.name.replace(/\.[^.]+$/, "");
            downloadTextFile(content, `${baseName}_base64.${getExtensionForFormat()}`);
            done++;
            updateProgress((done / images.length) * 100, `Downloading ${done}/${images.length}`);
            await new Promise((r) => setTimeout(r, 250));
        }

        pushHistory({
            name: `${images.length} images`,
            size: images.reduce((s, i) => s + i.size, 0),
            b64Size: images.reduce((s, i) => s + i.base64.length, 0),
            count: images.length,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        hideProgress();
        if (typeof showToast === "function") showToast(`📥 Downloaded ${images.length} files`);
    });

    /* ============================================================
       ZIP DOWNLOAD
       ============================================================ */
    downloadZipBtn.addEventListener("click", async () => {
        if (images.length === 0) return;
        if (!confirm(`Bundle all ${images.length} Base64 files into a ZIP?`)) return;

        showProgress(0, "Preparing ZIP…");

        try {
            const files = images.map((item) => ({
                name: `${item.name.replace(/\.[^.]+$/, "")}_base64.${getExtensionForFormat()}`,
                blob: new Blob([buildOutputForItem(item)], { type: "text/plain" }),
            }));

            const zipBlob = await createZip(files);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `base64-bundle-${Date.now()}.zip`;
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
       OPEN IMAGE IN NEW TAB
       ============================================================ */
    openImageBtn.addEventListener("click", () => {
        const item = images[activeIndex];
        if (!item) return;
        const w = window.open("");
        if (w) {
            w.document.write(`<html><head><title>${escapeHtml(item.name)}</title></head><body style="margin:0;background:#1e293b;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${item.dataUrl}" style="max-width:100%;max-height:100vh;" /></body></html>`);
            w.document.close();
        } else {
            if (typeof showToast === "function") showToast("⚠️ Popup blocked", "error");
        }
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
        images = [];
        activeIndex = 0;
        lastResults = [];
        editorArea.style.display = "none";
        uploadZone.style.display = "block";
        thumbnailsStrip.style.display = "none";
        progressWrap.style.display = "none";

        previewImg.src = "";
        fileInput.value = "";
        outputPre.textContent = "Select an image to see Base64…";

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
            ib64HistoryList.innerHTML = '<div class="empty-history">No conversions yet</div>';
            return;
        }
        ib64HistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb"><i class="fa-solid fa-code"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.name)}</div>
                    <div class="hi-meta">${h.count || 1} file${(h.count || 1) !== 1 ? "s" : ""} · ${formatBytes(h.size)} → ${formatBytes(h.b64Size)} B64</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");
    }

    clearIb64History.addEventListener("click", () => {
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
        if (typing) return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && !window.getSelection().toString()) {
            if (images.length > 0) {
                e.preventDefault();
                copyB64Btn.click();
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            if (images.length > 0) {
                e.preventDefault();
                downloadCurrentBtn.click();
            }
            return;
        }
        if (e.key === "Escape" && images.length > 0) {
            clearAllBtn.click();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareImgToBase64 = function () {
        const shareData = {
            title: "Image to Base64 Converter - Tool Hub",
            text: "Convert images to Base64 data URIs instantly — free & private!",
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