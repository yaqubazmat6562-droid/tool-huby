/* ============================================================
   BASE64 ENCODER/DECODER - Advanced Logic
   Text · File · Image · URL-safe · Live · Hex view
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const b64Card        = document.getElementById("b64Card");
    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");

    const encodeInput    = document.getElementById("encodeInput");
    const decodeInput    = document.getElementById("decodeInput");
    const encCounter     = document.getElementById("encCounter");
    const decCounter     = document.getElementById("decCounter");

    const encUrlSafe     = document.getElementById("encUrlSafe");
    const encNoPadding   = document.getElementById("encNoPadding");
    const encAutoEncode  = document.getElementById("encAutoEncode");
    const decUrlSafe     = document.getElementById("decUrlSafe");
    const decAutoDecode  = document.getElementById("decAutoDecode");
    const decAsHex       = document.getElementById("decAsHex");

    const processBtn     = document.getElementById("processBtn");
    const processBtnLabel= document.getElementById("processBtnLabel");
    const swapBtn        = document.getElementById("swapBtn");
    const clearAllBtn    = document.getElementById("clearAllBtn");

    const encPaste       = document.getElementById("enc-paste");
    const encClear       = document.getElementById("enc-clear");
    const encSample      = document.getElementById("enc-sample");
    const decPaste       = document.getElementById("dec-paste");
    const decClear       = document.getElementById("dec-clear");
    const decSample      = document.getElementById("dec-sample");

    const outputArea     = document.getElementById("outputArea");
    const outputLabel    = document.getElementById("outputLabel");
    const outputContent  = document.getElementById("outputContent");
    const outputStats    = document.getElementById("outputStats");
    const outputPreview  = document.getElementById("outputPreview");
    const outputPreviewContent = document.getElementById("outputPreviewContent");
    const imgOutputWrap  = document.getElementById("imgOutputWrap");
    const imgOutput      = document.getElementById("imgOutput");

    const copyOutputBtn  = document.getElementById("copyOutputBtn");
    const downloadOutputBtn = document.getElementById("downloadOutputBtn");
    const sendToInputBtn = document.getElementById("sendToInputBtn");

    const b64Error       = document.getElementById("b64Error");

    const fileDropZone   = document.getElementById("fileDropZone");
    const fileInputReal  = document.getElementById("fileInputReal");
    const fileBrowseBtn  = document.getElementById("fileBrowseBtn");
    const fileInfo       = document.getElementById("fileInfo");

    const imageDropZone  = document.getElementById("imageDropZone");
    const imageInputReal = document.getElementById("imageInputReal");
    const imageBrowseBtn = document.getElementById("imageBrowseBtn");
    const imgPreviewWrap = document.getElementById("imgPreviewWrap");
    const imgPreview     = document.getElementById("imgPreview");
    const imgMeta        = document.getElementById("imgMeta");
    const clearImageBtn  = document.getElementById("clearImageBtn");

    const b64HistoryList = document.getElementById("b64HistoryList");
    const clearB64History= document.getElementById("clearB64History");

    /* ---------------- State ---------------- */
    let currentMode = "encode";   // encode | decode | file | image
    let lastResult  = null;       // { text, mode, size }
    let history     = loadHistory();
    let loadedFile  = null;       // { name, size, type, base64 }
    let loadedImage = null;       // { name, size, type, base64, dataUrl }
    let autoTimer   = null;

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_base64_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            localStorage.setItem("toolhub_base64_history", JSON.stringify(history.slice(0, 30)));
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
        if (b < 1024 * 1024) return (b / 1024).toFixed(2) + " KB";
        return (b / (1024 * 1024)).toFixed(2) + " MB";
    }

    function showError(msg) {
        b64Error.textContent = msg;
        b64Error.classList.add("show");
        b64Error.style.animation = "none";
        void b64Error.offsetWidth;
        b64Error.style.animation = "";
    }
    function hideError() {
        b64Error.classList.remove("show");
        b64Error.textContent = "";
    }

    /* ============================================================
       BASE64 CORE (Unicode safe)
       ============================================================ */
    function utf8ToBase64(str) {
        // Use TextEncoder for proper UTF-8 handling
        const bytes = new TextEncoder().encode(str);
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(binary);
    }

    function base64ToUtf8(b64) {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    }

    function toUrlSafe(b64) {
        return b64.replace(/\+/g, "-").replace(/\//g, "_");
    }

    function fromUrlSafe(s) {
        return s.replace(/-/g, "+").replace(/_/g, "/");
    }

    function removePadding(b64) {
        return b64.replace(/=+$/, "");
    }

    function addPadding(b64) {
        const mod = b64.length % 4;
        if (mod === 0) return b64;
        if (mod === 2) return b64 + "==";
        if (mod === 3) return b64 + "=";
        return b64; // mod 1 is invalid
    }

    function bytesToHex(b64) {
        try {
            const binary = atob(b64);
            let hex = "";
            for (let i = 0; i < binary.length; i++) {
                hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
                if ((i + 1) % 16 === 0) hex += "\n";
                else if (i !== binary.length - 1) hex += " ";
            }
            return hex.trim();
        } catch (e) {
            return "";
        }
    }

    function isProbablyBase64(str) {
        if (!str) return false;
        const cleaned = str.replace(/\s+/g, "");
        // Base64: A-Z a-z 0-9 + / = (or URL-safe - _)
        return /^[A-Za-z0-9+/=_-]+$/.test(cleaned) && cleaned.length >= 4;
    }

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
        modeContents.forEach((c) => c.classList.toggle("active", c.dataset.content === mode));
        hideError();

        // Update process button label
        const labels = {
            encode: "Encode",
            decode: "Decode",
            file: "Convert to Base64",
            image: "Convert to Base64",
        };
        processBtnLabel.textContent = labels[mode] || "Process";

        // Clear output when switching modes
        outputArea.style.display = "none";
        lastResult = null;

        // Focus first input
        const firstInput = document.querySelector(
            `.mode-content[data-content="${mode}"] textarea, .mode-content[data-content="${mode}"] input`
        );
        if (firstInput && firstInput.type !== "file") {
            setTimeout(() => firstInput.focus(), 80);
        }
    }

    /* ============================================================
       COUNTERS
       ============================================================ */
    function updateEncCounter() {
        const v = encodeInput.value;
        const bytes = new Blob([v]).size;
        encCounter.textContent = `${v.length.toLocaleString()} characters · ${bytes.toLocaleString()} bytes`;
    }
    function updateDecCounter() {
        const v = decodeInput.value.replace(/\s+/g, "");
        decCounter.textContent = `${v.length.toLocaleString()} characters`;
    }

    /* ============================================================
       ENCODE / DECODE
       ============================================================ */
    function doEncode() {
        hideError();
        const input = encodeInput.value;
        if (!input) {
            showError("⚠️ Please enter text to encode");
            return;
        }
        try {
            let out = utf8ToBase64(input);
            if (encUrlSafe.checked) out = toUrlSafe(out);
            if (encNoPadding.checked) out = removePadding(out);

            showOutput(out, "encode", input.length);
            pushHistory("encode", input, out);
            if (typeof showToast === "function") showToast("✅ Encoded");
        } catch (e) {
            showError("❌ Encoding failed: " + e.message);
        }
    }

    function doDecode() {
        hideError();
        let input = decodeInput.value.trim();
        if (!input) {
            showError("⚠️ Please enter Base64 string to decode");
            return;
        }
        // Remove whitespace
        input = input.replace(/\s+/g, "");

        // Handle URL-safe
        if (decUrlSafe.checked || /[-_]/.test(input)) {
            input = fromUrlSafe(input);
        }
        // Add padding
        input = addPadding(input);

        try {
            const text = base64ToUtf8(input);
            if (decAsHex.checked) {
                const hex = bytesToHex(input);
                showOutput(hex, "decode-hex", text.length, text);
            } else {
                showOutput(text, "decode", text.length);
            }
            pushHistory("decode", input.slice(0, 60), text.slice(0, 60));
            if (typeof showToast === "function") showToast("✅ Decoded");
        } catch (e) {
            showError("❌ Invalid Base64 string");
        }
    }

    function doFileConvert() {
        hideError();
        if (!loadedFile) {
            showError("⚠️ Please select a file first");
            return;
        }
        showOutput(loadedFile.base64, "file", loadedFile.size);
        pushHistory("file", loadedFile.name, loadedFile.base64.slice(0, 40));
        if (typeof showToast === "function") showToast("✅ File converted");
    }

    function doImageConvert() {
        hideError();
        if (!loadedImage) {
            showError("⚠️ Please select an image first");
            return;
        }
        showOutput(loadedImage.base64, "image", loadedImage.size);
        pushHistory("image", loadedImage.name, loadedImage.base64.slice(0, 40));
        if (typeof showToast === "function") showToast("✅ Image converted");
    }

    /* ============================================================
       SHOW OUTPUT
       ============================================================ */
    function showOutput(content, mode, inputSize, decodedPreview) {
        outputArea.style.display = "block";

        const modeLabels = {
            encode: "Base64 Output",
            decode: "Decoded Text",
            "decode-hex": "Decoded (Hex)",
            file: "File → Base64",
            image: "Image → Base64",
        };
        outputLabel.innerHTML = `<i class="fa-solid fa-arrow-right"></i> ${modeLabels[mode] || "Output"}`;

        outputContent.textContent = content;

        const outBytes = new Blob([content]).size;
        outputStats.textContent = `${content.length.toLocaleString()} chars · ${formatBytes(outBytes)}`;

        // Preview
        outputPreview.style.display = "none";
        imgOutputWrap.style.display = "none";

        if (decodedPreview !== undefined && decodedPreview !== null) {
            outputPreview.style.display = "block";
            outputPreviewContent.textContent = decodedPreview || "(empty)";
        } else if (mode === "decode") {
            // Show preview automatically for decode
            outputPreview.style.display = "block";
            outputPreviewContent.textContent = content.slice(0, 2000) || "(empty)";
        } else if (mode === "file" && loadedFile && loadedFile.isImage) {
            imgOutputWrap.style.display = "block";
            imgOutput.src = loadedFile.dataUrl;
        }

        lastResult = {
            text: content,
            mode,
            size: outBytes,
            filename: mode === "file" || mode === "image" ? "base64.txt" : null,
        };

        // Scroll to output
        setTimeout(() => {
            const rect = outputArea.getBoundingClientRect();
            if (rect.top > window.innerHeight - 100) {
                outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 80);
    }

    /* ============================================================
       PROCESS (main button)
       ============================================================ */
    function process() {
        switch (currentMode) {
            case "encode": doEncode(); break;
            case "decode": doDecode(); break;
            case "file":   doFileConvert(); break;
            case "image":  doImageConvert(); break;
        }
    }

    /* ============================================================
       SWAP
       ============================================================ */
    function swapDirection() {
        // Move output to input and switch mode
        if (lastResult && lastResult.text) {
            if (currentMode === "encode") {
                decodeInput.value = lastResult.text;
                updateDecCounter();
                setMode("decode");
                if (decAutoDecode.checked) setTimeout(doDecode, 150);
            } else if (currentMode === "decode") {
                encodeInput.value = lastResult.text;
                updateEncCounter();
                setMode("encode");
                if (encAutoEncode.checked) setTimeout(doEncode, 150);
            }
        } else {
            // Just toggle mode
            setMode(currentMode === "encode" ? "decode" : "encode");
        }
    }

    /* ============================================================
       CLEAR ALL
       ============================================================ */
    function clearAll() {
        if (!confirm("Clear all inputs and outputs?")) return;
        encodeInput.value = "";
        decodeInput.value = "";
        updateEncCounter();
        updateDecCounter();
        loadedFile = null;
        loadedImage = null;
        fileInfo.style.display = "none";
        imgPreviewWrap.style.display = "none";
        outputArea.style.display = "none";
        lastResult = null;
        hideError();
        if (typeof showToast === "function") showToast("🧹 Cleared");
    }

    /* ============================================================
       FILE HANDLING
       ============================================================ */
    function handleFile(file) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showError("⚠️ File too large (max 5 MB recommended)");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const base64 = dataUrl.split(",")[1] || "";
            loadedFile = {
                name: file.name,
                size: file.size,
                type: file.type || "unknown",
                base64,
                dataUrl,
                isImage: file.type.startsWith("image/"),
            };
            fileInfo.style.display = "block";
            fileInfo.innerHTML = `
                <div class="fi-name"><i class="fa-solid fa-file"></i> ${escapeHtml(file.name)}</div>
                <div class="fi-meta">
                    <span>${formatBytes(file.size)}</span>
                    <span>${escapeHtml(file.type || "unknown")}</span>
                    <span>Base64: ${formatBytes(base64.length)}</span>
                </div>
            `;
            hideError();
            if (typeof showToast === "function") showToast("📁 File loaded");
            // Auto-convert
            doFileConvert();
        };
        reader.readAsDataURL(file);
    }

    /* ============================================================
       IMAGE HANDLING
       ============================================================ */
    function handleImage(file) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            showError("⚠️ Please select a valid image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showError("⚠️ Image too large (max 5 MB recommended)");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const base64 = dataUrl.split(",")[1] || "";
            loadedImage = {
                name: file.name,
                size: file.size,
                type: file.type,
                base64,
                dataUrl,
            };

            // Show preview
            imgPreview.src = dataUrl;
            imgPreviewWrap.style.display = "block";

            // Get image dimensions
            const img = new Image();
            img.onload = () => {
                imgMeta.innerHTML = `
                    <div class="im-row"><span class="im-label">Name</span><span class="im-value">${escapeHtml(file.name)}</span></div>
                    <div class="im-row"><span class="im-label">Type</span><span class="im-value">${escapeHtml(file.type)}</span></div>
                    <div class="im-row"><span class="im-label">Dimensions</span><span class="im-value">${img.width} × ${img.height}</span></div>
                    <div class="im-row"><span class="im-label">Size</span><span class="im-value">${formatBytes(file.size)}</span></div>
                    <div class="im-row"><span class="im-label">Base64</span><span class="im-value">${formatBytes(base64.length)}</span></div>
                `;
            };
            img.src = dataUrl;

            hideError();
            if (typeof showToast === "function") showToast("🖼️ Image loaded");
            // Auto-convert
            doImageConvert();
        };
        reader.readAsDataURL(file);
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(mode, inputPreview, outputPreview) {
        history.unshift({
            mode,
            inputPreview: (inputPreview || "").replace(/\s+/g, " ").slice(0, 50),
            outputPreview: (outputPreview || "").replace(/\s+/g, " ").slice(0, 50),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 30) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            b64HistoryList.innerHTML = '<div class="empty-history">No conversions yet</div>';
            return;
        }
        b64HistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-left">
                    <span class="hi-time">
                        <span class="hi-mode-badge ${h.mode}">${h.mode}</span>
                        ${escapeHtml(h.time)}
                    </span>
                    <span class="hi-preview">${escapeHtml(h.inputPreview || "(empty)")}</span>
                </div>
                <span class="hi-size">→</span>
            </div>
        `).join("");

        b64HistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                // Load into appropriate mode
                if (h.mode === "encode") {
                    setMode("encode");
                    encodeInput.value = h.inputPreview;
                    updateEncCounter();
                    doEncode();
                } else if (h.mode === "decode") {
                    setMode("decode");
                    decodeInput.value = h.inputPreview;
                    updateDecCounter();
                    doDecode();
                }
            });
        });
    }

    /* ============================================================
       OUTPUT ACTIONS
       ============================================================ */
    copyOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(lastResult.text).then(() => {
                if (typeof showToast === "function") showToast("📋 Copied!");
            }).catch(() => fallbackCopy(lastResult.text));
        } else fallbackCopy(lastResult.text);
    });

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

    downloadOutputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        const blob = new Blob([lastResult.text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = lastResult.filename || "output.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === "function") showToast("📥 Downloaded");
    });

    sendToInputBtn.addEventListener("click", () => {
        if (!lastResult) return;
        if (currentMode === "encode") {
            decodeInput.value = lastResult.text;
            updateDecCounter();
            setMode("decode");
        } else {
            encodeInput.value = lastResult.text;
            updateEncCounter();
            setMode("encode");
        }
    });

    /* ============================================================
       PASTE / CLEAR / SAMPLE
       ============================================================ */
    async function pasteInto(el, counter) {
        try {
            const text = await navigator.clipboard.readText();
            el.value = text;
            if (counter) counter();
            return true;
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
            return false;
        }
    }

    encPaste.addEventListener("click", async () => {
        if (await pasteInto(encodeInput, updateEncCounter)) {
            if (encAutoEncode.checked) doEncode();
        }
    });

    decPaste.addEventListener("click", async () => {
        if (await pasteInto(decodeInput, updateDecCounter)) {
            if (decAutoDecode.checked) doDecode();
        }
    });

    encClear.addEventListener("click", () => {
        encodeInput.value = "";
        updateEncCounter();
    });
    decClear.addEventListener("click", () => {
        decodeInput.value = "";
        updateDecCounter();
    });

    encSample.addEventListener("click", () => {
        encodeInput.value = "Hello, Tool Hub! 🚀 This is a Unicode test — 日本語, हिन्दी, العربية";
        updateEncCounter();
        doEncode();
    });

    decSample.addEventListener("click", () => {
        decodeInput.value = "SGVsbG8sIFRvb2wgSHViISDwn5qAIFRoaXMgaXMgYSBVbmljb2RlIHRlc3Qg4oCUIOaXpeacrOiqniwg4KS54KS/4KSo4KWN4KSm4KWALCDYp9mE2LnYsdio2YrYqQ==";
        updateDecCounter();
        doDecode();
    });

    /* ============================================================
       EVENT LISTENERS
       ============================================================ */
    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    processBtn.addEventListener("click", process);
    swapBtn.addEventListener("click", swapDirection);
    clearAllBtn.addEventListener("click", clearAll);

    // Live encode
    encodeInput.addEventListener("input", () => {
        updateEncCounter();
        if (encAutoEncode.checked) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
                if (encodeInput.value) doEncode();
            }, 350);
        }
    });

    // Live decode
    decodeInput.addEventListener("input", () => {
        updateDecCounter();
        if (decAutoDecode.checked) {
            clearTimeout(autoTimer);
            autoTimer = setTimeout(() => {
                if (decodeInput.value.trim()) doDecode();
            }, 350);
        }
    });

    // Re-process on option change
    [encUrlSafe, encNoPadding, decUrlSafe, decAsHex].forEach((el) => {
        el.addEventListener("change", () => {
            if (currentMode === "encode" && encodeInput.value) doEncode();
            if (currentMode === "decode" && decodeInput.value) doDecode();
        });
    });

    // File upload
    fileBrowseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInputReal.click();
    });
    fileInputReal.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
        fileInputReal.value = "";
    });

    fileDropZone.addEventListener("click", () => fileInputReal.click());
    fileDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileDropZone.classList.add("dragover");
    });
    fileDropZone.addEventListener("dragleave", () => fileDropZone.classList.remove("dragover"));
    fileDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        fileDropZone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    // Image upload
    imageBrowseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        imageInputReal.click();
    });
    imageInputReal.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) handleImage(file);
        imageInputReal.value = "";
    });

    imageDropZone.addEventListener("click", () => imageInputReal.click());
    imageDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        imageDropZone.classList.add("dragover");
    });
    imageDropZone.addEventListener("dragleave", () => imageDropZone.classList.remove("dragover"));
    imageDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        imageDropZone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) handleImage(file);
    });

    clearImageBtn.addEventListener("click", () => {
        loadedImage = null;
        imgPreviewWrap.style.display = "none";
        outputArea.style.display = "none";
    });

    clearB64History.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select";

        // Ctrl+Enter process
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            process();
            return;
        }
        // Ctrl+Shift+X swap
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "x") {
            e.preventDefault();
            swapDirection();
            return;
        }
        if (!typing && e.key === "Escape") {
            e.preventDefault();
            clearAll();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareBase64 = function () {
        const shareData = {
            title: "Base64 Encoder/Decoder - Tool Hub",
            text: "Encode & decode text, files, and images to Base64!",
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
        setMode("encode");
        updateEncCounter();
        updateDecCounter();
        renderHistory();
    }

    init();
})();