/* ============================================================
   BARCODE GENERATOR - Advanced Logic
   Uses JsBarcode library · 15+ formats · Batch · SVG/PNG export
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const bcCard         = document.getElementById("bcCard");
    const modeTabs       = document.querySelectorAll(".mode-tab");
    const modeContents   = document.querySelectorAll(".mode-content");

    const singleInput    = document.getElementById("singleInput");
    const pasteSingleBtn = document.getElementById("pasteSingleBtn");
    const randomBtn      = document.getElementById("randomBtn");
    const clearSingleBtn = document.getElementById("clearSingleBtn");
    const singleHint     = document.getElementById("singleHint");
    const singleHintText = document.getElementById("singleHintText");

    const batchInput     = document.getElementById("batchInput");
    const pasteBatchBtn  = document.getElementById("pasteBatchBtn");
    const sampleBatchBtn = document.getElementById("sampleBatchBtn");
    const clearBatchBtn  = document.getElementById("clearBatchBtn");

    const bcError        = document.getElementById("bcError");
    const bcError2       = document.getElementById("bcError2");

    const formatGrid     = document.getElementById("formatGrid");
    const formatInfo     = document.getElementById("formatInfo");
    const fiName         = document.getElementById("fiName");
    const fiDesc         = document.getElementById("fiDesc");
    const fiExample      = document.getElementById("fiExample");
    const fiCharset      = document.getElementById("fiCharset");

    const showText       = document.getElementById("showText");
    const showBorder     = document.getElementById("showBorder");
    const includeCheck   = document.getElementById("includeCheck");
    const highDensity    = document.getElementById("highDensity");

    const widthSlider    = document.getElementById("widthSlider");
    const widthValue     = document.getElementById("widthValue");
    const heightSlider   = document.getElementById("heightSlider");
    const heightValue    = document.getElementById("heightValue");
    const fontSizeSlider = document.getElementById("fontSizeSlider");
    const fontSizeValue  = document.getElementById("fontSizeValue");
    const barColor       = document.getElementById("barColor");
    const bgColor        = document.getElementById("bgColor");
    const textColor      = document.getElementById("textColor");

    const generateBtn    = document.getElementById("generateBtn");
    const processBtnLabel= document.getElementById("processBtnLabel");
    const clearAllBtn    = document.getElementById("clearAllBtn");

    const outputArea     = document.getElementById("outputArea");
    const outputLabel    = document.getElementById("outputLabel");
    const barcodeSvg     = document.getElementById("barcodeSvg");
    const barcodeViewWrap= document.getElementById("barcodeViewWrap");
    const outputInfo     = document.getElementById("outputInfo");
    const oiFormat       = document.getElementById("oiFormat");
    const oiValue        = document.getElementById("oiValue");
    const oiEncoding     = document.getElementById("oiEncoding");
    const oiCheck        = document.getElementById("oiCheck");

    const copySvgBtn     = document.getElementById("copySvgBtn");
    const downloadPngBtn = document.getElementById("downloadPngBtn");
    const downloadSvgBtn = document.getElementById("downloadSvgBtn");
    const printBtn       = document.getElementById("printBtn");

    const batchResults   = document.getElementById("batchResults");
    const batchCount     = document.getElementById("batchCount");
    const brGrid         = document.getElementById("brGrid");
    const downloadZipBtn = document.getElementById("downloadZipBtn");
    const printAllBtn    = document.getElementById("printAllBtn");

    const bcHistoryList  = document.getElementById("bcHistoryList");
    const clearBcHistory = document.getElementById("clearBcHistory");

    /* ---------------- State ---------------- */
    let currentMode      = "single";
    let currentFormat    = "CODE128";
    let lastResults      = [];       // { value, svg, format }
    let history          = loadHistory();

    /* ---------------- Constants ---------------- */
    const FORMATS = [
        { id: "CODE128",  name: "CODE 128",  icon: "fa-barcode",      desc: "High-density, all ASCII characters. Used for shipping & packaging.", example: "ABC-12345", charset: "ASCII (0-127)" },
        { id: "CODE128A", name: "CODE 128A", icon: "fa-barcode",      desc: "Code 128 subset A — uppercase letters, digits, and control chars.",   example: "HELLO123",  charset: "Uppercase + digits + control" },
        { id: "CODE128B", name: "CODE 128B", icon: "fa-barcode",      desc: "Code 128 subset B — uppercase, lowercase, digits, punctuation.",      example: "Hello-123", charset: "Full ASCII printable" },
        { id: "CODE128C", name: "CODE 128C", icon: "fa-barcode",      desc: "Code 128 subset C — numeric pairs only, very compact.",               example: "12345678",  charset: "Even-length numeric" },
        { id: "CODE39",   name: "CODE 39",   icon: "fa-barcode",      desc: "Alphanumeric self-checking. Common in automotive & defense.",          example: "CODE39",    charset: "A-Z, 0-9, -, ., space, $, /, +, %" },
        { id: "CODE93",   name: "CODE 93",   icon: "fa-barcode",      desc: "Compact alphanumeric, similar to Code 39 but denser.",                 example: "CODE93",    charset: "A-Z, 0-9, punctuation" },
        { id: "EAN13",    name: "EAN-13",    icon: "fa-barcode",      desc: "13-digit standard for retail products worldwide.",                     example: "1234567890128", charset: "12-13 digits" },
        { id: "EAN8",     name: "EAN-8",     icon: "fa-barcode",      desc: "8-digit compact version of EAN-13 for small packages.",                example: "12345670",  charset: "7-8 digits" },
        { id: "EAN5",     name: "EAN-5",     icon: "fa-barcode",      desc: "5-digit supplement used for ISBN prices.",                            example: "12345",     charset: "5 digits" },
        { id: "EAN2",     name: "EAN-2",     icon: "fa-barcode",      desc: "2-digit supplement for magazines & periodicals.",                      example: "12",        charset: "2 digits" },
        { id: "UPC",      name: "UPC-A",     icon: "fa-barcode",      desc: "Universal Product Code — 12 digits, used in US/Canada retail.",         example: "123456789012", charset: "11-12 digits" },
        { id: "UPCE",     name: "UPC-E",     icon: "fa-barcode",      desc: "Compact 6-digit UPC for small retail packages.",                       example: "123456",    charset: "6-8 digits" },
        { id: "ITF14",    name: "ITF-14",    icon: "fa-barcode",      desc: "14-digit Interleaved 2 of 5 for cartons & shipping.",                  example: "12345678901234", charset: "14 digits" },
        { id: "ITF",      name: "ITF",       icon: "fa-barcode",      desc: "Interleaved 2 of 5 — numeric pairs, compact.",                         example: "123456",    charset: "Even-length numeric" },
        { id: "MSI",      name: "MSI",       icon: "fa-barcode",      desc: "Numeric barcode used for inventory & retail shelves.",                 example: "1234567",   charset: "Numeric" },
        { id: "pharmacode", name: "Pharmacode", icon: "fa-prescription", desc: "Pharmaceutical industry barcode — numeric 3 to 131070.",            example: "1234",      charset: "3-131070 numeric" },
        { id: "codabar",  name: "Codabar",   icon: "fa-barcode",      desc: "Used by libraries, blood banks & FedEx.",                              example: "A123456B",  charset: "Numeric + ABCD prefix/suffix" },
    ];

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_barcode_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            const meta = history.slice(0, 12).map((h) => ({
                value: h.value,
                format: h.format,
                time: h.time,
            }));
            localStorage.setItem("toolhub_barcode_history", JSON.stringify(meta));
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

    function showError(msg, which) {
        const el = which === "options" ? bcError2 : bcError;
        el.textContent = msg;
        el.classList.add("show");
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
    }
    function hideError(which) {
        const el = which === "options" ? bcError2 : bcError;
        el.classList.remove("show");
        el.textContent = "";
    }
    function hideAllErrors() {
        hideError();
        hideError("options");
    }

    /* ============================================================
       VALIDATION
       ============================================================ */
    function validateValueForFormat(value, format) {
        if (!value) return "⚠️ Value cannot be empty";

        switch (format) {
            case "EAN13":
                if (!/^\d{12,13}$/.test(value)) return "⚠️ EAN-13 requires 12 or 13 digits";
                break;
            case "EAN8":
                if (!/^\d{7,8}$/.test(value)) return "⚠️ EAN-8 requires 7 or 8 digits";
                break;
            case "EAN5":
                if (!/^\d{5}$/.test(value)) return "⚠️ EAN-5 requires exactly 5 digits";
                break;
            case "EAN2":
                if (!/^\d{2}$/.test(value)) return "⚠️ EAN-2 requires exactly 2 digits";
                break;
            case "UPC":
                if (!/^\d{11,12}$/.test(value)) return "⚠️ UPC-A requires 11 or 12 digits";
                break;
            case "UPCE":
                if (!/^\d{6,8}$/.test(value)) return "⚠️ UPC-E requires 6 to 8 digits";
                break;
            case "ITF14":
                if (!/^\d{13,14}$/.test(value)) return "⚠️ ITF-14 requires 13 or 14 digits";
                break;
            case "ITF":
                if (!/^\d+$/.test(value) || value.length % 2 !== 0) return "⚠️ ITF requires even-length numeric";
                break;
            case "MSI":
                if (!/^\d+$/.test(value)) return "⚠️ MSI requires numeric only";
                break;
            case "pharmacode":
                const n = parseInt(value, 10);
                if (isNaN(n) || n < 3 || n > 131070) return "⚠️ Pharmacode must be numeric between 3 and 131070";
                break;
            case "CODE39":
            case "CODE93":
                if (!/^[A-Z0-9\-. $/+%]+$/i.test(value)) return `⚠️ ${format} supports A-Z, 0-9, and - . space $ / + %`;
                break;
        }

        // Check max length
        if (value.length > 80) return "⚠️ Value too long (max 80 characters)";
        return null;
    }

    /* ============================================================
       FORMAT SELECTION UI
       ============================================================ */
    function renderFormatGrid() {
        formatGrid.innerHTML = FORMATS.map((f) => `
            <button class="format-item ${f.id === currentFormat ? "active" : ""}" data-format="${f.id}">
                <i class="fa-solid ${f.icon}"></i>
                <span>${escapeHtml(f.name)}</span>
                <small>${escapeHtml(f.charset)}</small>
            </button>
        `).join("");

        formatGrid.querySelectorAll(".format-item").forEach((btn) => {
            btn.addEventListener("click", () => {
                formatGrid.querySelectorAll(".format-item").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                currentFormat = btn.dataset.format;
                updateFormatInfo();
                hideAllErrors();

                // Auto-fill example if input empty
                if (currentMode === "single" && !singleInput.value.trim()) {
                    const f = FORMATS.find((x) => x.id === currentFormat);
                    if (f) singleInput.placeholder = `e.g. ${f.example}`;
                }
            });
        });
    }

    function updateFormatInfo() {
        const f = FORMATS.find((x) => x.id === currentFormat);
        if (!f) return;
        fiName.textContent = f.name;
        fiDesc.textContent = f.desc;
        fiExample.textContent = f.example;
        fiCharset.textContent = f.charset;
    }

    /* ============================================================
       MODE SWITCHING
       ============================================================ */
    function setMode(mode) {
        currentMode = mode;
        modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
        modeContents.forEach((c) => c.classList.toggle("active", c.dataset.content === mode));
        hideAllErrors();

        processBtnLabel.textContent = mode === "batch" ? "Generate Batch" : "Generate Barcode";
        outputArea.style.display = "none";

        const firstInput = mode === "single" ? singleInput : batchInput;
        if (firstInput) setTimeout(() => firstInput.focus(), 80);
    }

    modeTabs.forEach((tab) => {
        tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });

    /* ============================================================
       OPTIONS
       ============================================================ */
    function getRenderOptions() {
        return {
            format: currentFormat,
            width: parseFloat(widthSlider.value),
            height: parseInt(heightSlider.value, 10),
            displayValue: showText.checked,
            fontSize: parseInt(fontSizeSlider.value, 10),
            lineColor: barColor.value,
            background: bgColor.value,
            textColor: textColor.value,
            margin: showBorder.checked ? 10 : 0,
        };
    }

    widthSlider.addEventListener("input", () => {
        widthValue.textContent = widthSlider.value;
    });
    heightSlider.addEventListener("input", () => {
        heightValue.textContent = heightSlider.value;
    });
    fontSizeSlider.addEventListener("input", () => {
        fontSizeValue.textContent = fontSizeSlider.value;
    });

    /* ============================================================
       GENERATE
       ============================================================ */
    async function generateSingle(value) {
        const err = validateValueForFormat(value, currentFormat);
        if (err) {
            showError(err);
            return null;
        }
        hideError();

        // Clear & render SVG
        barcodeSvg.innerHTML = "";

        try {
            // Use JsBarcode library
            JsBarcode(barcodeSvg, value, {
                format: currentFormat,
                width: parseFloat(widthSlider.value),
                height: parseInt(heightSlider.value, 10),
                displayValue: showText.checked,
                fontSize: parseInt(fontSizeSlider.value, 10),
                lineColor: barColor.value,
                background: bgColor.value,
                textColor: textColor.value,
                margin: showBorder.checked ? 10 : 0,
                valid: function (valid) {
                    if (!valid) {
                        throw new Error("Invalid value for " + currentFormat);
                    }
                }
            });

            // Get SVG outer HTML
            const svgHTML = barcodeSvg.outerHTML;

            return {
                value,
                svg: svgHTML,
                format: currentFormat,
            };
        } catch (e) {
            showError("❌ " + (e.message || "Failed to generate barcode"));
            return null;
        }
    }

    async function generateBarcode() {
        hideAllErrors();

        if (currentMode === "single") {
            const value = singleInput.value.trim();
            if (!value) {
                showError("⚠️ Please enter a value");
                singleInput.focus();
                return;
            }

            const result = await generateSingle(value);
            if (!result) return;

            // Show output
            outputArea.style.display = "block";
            outputLabel.innerHTML = `<i class="fa-solid fa-barcode"></i> Generated Barcode`;
            barcodeViewWrap.style.display = "flex";
            outputInfo.style.display = "grid";
            batchResults.style.display = "none";

            // Update info
            oiFormat.textContent = FORMATS.find((f) => f.id === currentFormat)?.name || currentFormat;
            oiValue.textContent = value;
            oiEncoding.textContent = FORMATS.find((f) => f.id === currentFormat)?.charset || "—";
            oiCheck.textContent = hasCheckDigit(currentFormat, value) ? "Included" : "None";

            lastResults = [result];

            // History
            pushHistory({
                value,
                format: currentFormat,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            if (typeof showToast === "function") showToast("✅ Barcode generated");

            // Scroll
            setTimeout(() => {
                const r = outputArea.getBoundingClientRect();
                if (r.top > window.innerHeight - 100) {
                    outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }, 100);

        } else {
            // Batch
            const raw = batchInput.value.trim();
            if (!raw) {
                showError("⚠️ Please enter values (one per line)");
                batchInput.focus();
                return;
            }

            let lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
            if (lines.length > 100) {
                lines = lines.slice(0, 100);
                if (typeof showToast === "function") showToast("⚠️ Limited to 100 barcodes", "error");
            }

            if (lines.length === 0) {
                showError("⚠️ No valid values found");
                return;
            }

            showProgressBatch(lines.length, 0);

            lastResults = [];
            let failed = 0;

            for (let i = 0; i < lines.length; i++) {
                const result = await generateSingle(lines[i]);
                if (result) {
                    lastResults.push(result);
                } else {
                    failed++;
                }
                updateProgressBatch(i + 1, lines.length);
                if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
            }

            hideProgressBatch();

            if (lastResults.length === 0) {
                showError("❌ No barcodes could be generated. Check your values.");
                return;
            }

            // Show output
            outputArea.style.display = "block";
            outputLabel.innerHTML = `<i class="fa-solid fa-layer-group"></i> Batch Barcodes`;
            barcodeViewWrap.style.display = "none";
            outputInfo.style.display = "none";
            batchResults.style.display = "block";

            renderBatchResults();

            // History
            pushHistory({
                value: `${lastResults.length} barcodes`,
                format: currentFormat,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            if (typeof showToast === "function") {
                showToast(`✅ Generated ${lastResults.length} barcodes${failed ? ` (${failed} failed)` : ""}`);
            }

            // Scroll
            setTimeout(() => {
                const r = outputArea.getBoundingClientRect();
                if (r.top > window.innerHeight - 100) {
                    outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }, 100);
        }
    }

    function hasCheckDigit(format, value) {
        if (format === "EAN13") return value.length === 12 ? "Auto-added" : "Yes";
        if (format === "UPC") return value.length === 11 ? "Auto-added" : "Yes";
        if (format === "EAN8") return value.length === 7 ? "Auto-added" : "Yes";
        if (format === "ITF14") return value.length === 13 ? "Auto-added" : "Yes";
        return false;
    }

    function renderBatchResults() {
        batchCount.textContent = lastResults.length;
        brGrid.innerHTML = lastResults.map((r, i) => `
            <div class="br-item" style="animation-delay:${Math.min(i, 20) * 0.02}s">
                <div class="br-item-label">${escapeHtml(r.value.length > 30 ? r.value.slice(0, 30) + "…" : r.value)}</div>
                ${r.svg}
                <div class="br-item-actions">
                    <button class="br-mini-btn" data-action="png" data-idx="${i}">
                        <i class="fa-solid fa-download"></i> PNG
                    </button>
                    <button class="br-mini-btn" data-action="svg" data-idx="${i}">
                        <i class="fa-solid fa-file-code"></i> SVG
                    </button>
                </div>
            </div>
        `).join("");

        brGrid.querySelectorAll(".br-mini-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.dataset.idx, 10);
                const action = btn.dataset.action;
                const r = lastResults[idx];
                if (!r) return;
                if (action === "svg") {
                    downloadSvgFromString(r.svg, r.value);
                } else {
                    downloadPngFromSvg(r.svg, r.value);
                }
            });
        });
    }

    /* ============================================================
       PROGRESS (batch)
       ============================================================ */
    let progressEls = null;
    function showProgressBatch(total, current) {
        if (!progressEls) {
            progressEls = {
                wrap: document.createElement("div"),
                label: document.createElement("div"),
                bar: document.createElement("div"),
                fill: document.createElement("div"),
            };
            progressEls.wrap.className = "progress-wrap";
            progressEls.label.className = "progress-label";
            progressEls.bar.className = "progress-bar";
            progressEls.fill.className = "progress-fill";
            progressEls.bar.appendChild(progressEls.fill);
            progressEls.wrap.appendChild(progressEls.label);
            progressEls.wrap.appendChild(progressEls.bar);
            progressEls.wrap.style.display = "block";
            progressEls.wrap.style.marginTop = "16px";
            progressEls.wrap.style.padding = "14px 16px";
            progressEls.wrap.style.background = "var(--bg-color)";
            progressEls.wrap.style.border = "1px solid var(--border)";
            progressEls.wrap.style.borderRadius = "14px";
            progressEls.label.style.fontSize = "0.78rem";
            progressEls.label.style.fontWeight = "800";
            progressEls.label.style.color = "#7c3aed";
            progressEls.label.style.marginBottom = "10px";
            progressEls.label.style.textTransform = "uppercase";
            progressEls.label.style.letterSpacing = "0.5px";
            progressEls.bar.style.width = "100%";
            progressEls.bar.style.height = "10px";
            progressEls.bar.style.background = "var(--card-bg)";
            progressEls.bar.style.borderRadius = "10px";
            progressEls.bar.style.overflow = "hidden";
            progressEls.fill.style.height = "100%";
            progressEls.fill.style.background = "linear-gradient(90deg, #8b5cf6, #7c3aed)";
            progressEls.fill.style.borderRadius = "10px";
            progressEls.fill.style.transition = "width 0.3s ease";
            // Insert after action-row
            const actionRow = document.querySelector(".action-row");
            if (actionRow && actionRow.parentNode) {
                actionRow.parentNode.insertBefore(progressEls.wrap, actionRow.nextSibling);
            }
        }
        updateProgressBatch(current, total);
    }

    function updateProgressBatch(current, total) {
        if (!progressEls) return;
        progressEls.label.textContent = `Generating ${current}/${total}…`;
        progressEls.fill.style.width = ((current / total) * 100) + "%";
    }

    function hideProgressBatch() {
        if (!progressEls) return;
        progressEls.fill.style.width = "100%";
        setTimeout(() => {
            if (progressEls && progressEls.wrap) {
                progressEls.wrap.style.display = "none";
            }
        }, 500);
    }

    /* ============================================================
       COPY / DOWNLOAD
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

    function downloadSvgFromString(svgString, value) {
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `barcode_${sanitizeFilename(value)}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    }

    function downloadPngFromSvg(svgString, value) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (!svg) return;

        const w = svg.getAttribute("width") || 300;
        const h = svg.getAttribute("height") || 150;

        // Scale up for high-res PNG
        const scale = 3;
        const canvas = document.createElement("canvas");
        canvas.width = (parseFloat(w) || 300) * scale;
        canvas.height = (parseFloat(h) || 150) * scale;
        const ctx = canvas.getContext("2d");

        // Fill background
        ctx.fillStyle = bgColor.value || "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
                const dlUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = dlUrl;
                a.download = `barcode_${sanitizeFilename(value)}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(dlUrl), 3000);
                if (typeof showToast === "function") showToast("📥 PNG downloaded");
            }, "image/png");
        };
        img.onerror = () => {
            if (typeof showToast === "function") showToast("❌ PNG conversion failed", "error");
        };
        img.src = url;
    }

    function sanitizeFilename(s) {
        return String(s).replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 30) || "barcode";
    }

    copySvgBtn.addEventListener("click", () => {
        if (lastResults.length === 0) return;
        copyToClipboard(lastResults[0].svg);
    });

    downloadSvgBtn.addEventListener("click", () => {
        if (lastResults.length === 0) return;
        downloadSvgFromString(lastResults[0].svg, lastResults[0].value);
        if (typeof showToast === "function") showToast("📥 SVG downloaded");
    });

    downloadPngBtn.addEventListener("click", () => {
        if (lastResults.length === 0) return;
        downloadPngFromSvg(lastResults[0].svg, lastResults[0].value);
    });

    printBtn.addEventListener("click", () => {
        if (lastResults.length === 0) return;
        printSvg(lastResults[0].svg, lastResults[0].value);
    });

    printAllBtn.addEventListener("click", () => {
        if (lastResults.length === 0) return;
        const content = lastResults.map((r) => `
            <div style="page-break-inside: avoid; margin-bottom: 24px; text-align: center;">
                <div style="font-family: monospace; font-size: 12px; margin-bottom: 6px;">${escapeHtml(r.value)}</div>
                ${r.svg}
            </div>
        `).join("");
        printHtml(`<div style="padding: 20px;">${content}</div>`);
    });

    function printSvg(svgString, value) {
        printHtml(`<div style="text-align: center; padding: 40px;">
            <div style="font-family: monospace; font-size: 14px; margin-bottom: 10px;">${escapeHtml(value)}</div>
            ${svgString}
        </div>`);
    }

    function printHtml(innerHtml) {
        const w = window.open("", "_blank", "width=800,height=600");
        if (!w) {
            if (typeof showToast === "function") showToast("⚠️ Popup blocked", "error");
            return;
        }
        w.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Barcode Print</title>
                <style>
                    body { margin: 0; font-family: system-ui, sans-serif; background: #fff; }
                    svg { max-width: 100%; height: auto; }
                    @media print { @page { margin: 12mm; } }
                </style>
            </head>
            <body>${innerHtml}</body>
            </html>
        `);
        w.document.close();
        w.onload = () => {
            setTimeout(() => w.print(), 300);
        };
    }

    /* ============================================================
       ZIP DOWNLOAD
       ============================================================ */
    downloadZipBtn.addEventListener("click", async () => {
        if (lastResults.length === 0) return;
        if (typeof showToast === "function") showToast("📦 Building ZIP…");

        try {
            const files = [];
            for (let i = 0; i < lastResults.length; i++) {
                const r = lastResults[i];
                const name = `barcode_${String(i + 1).padStart(3, "0")}_${sanitizeFilename(r.value)}.svg`;
                files.push({
                    name,
                    blob: new Blob([r.svg], { type: "image/svg+xml" }),
                });
            }

            const zipBlob = await createZip(files);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `barcodes-${Date.now()}.zip`;
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
       CLEAR
       ============================================================ */
    function clearAll() {
        singleInput.value = "";
        batchInput.value = "";
        outputArea.style.display = "none";
        barcodeSvg.innerHTML = "";
        brGrid.innerHTML = "";
        hideAllErrors();
        lastResults = [];
        if (typeof showToast === "function") showToast("🧹 Cleared");
    }

    clearAllBtn.addEventListener("click", clearAll);

    clearSingleBtn.addEventListener("click", () => {
        singleInput.value = "";
        hideError();
        singleInput.focus();
    });

    clearBatchBtn.addEventListener("click", () => {
        batchInput.value = "";
        hideError();
    });

    pasteSingleBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            singleInput.value = text.trim();
            hideError();
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    pasteBatchBtn.addEventListener("click", async () => {
        try {
            const text = await navigator.clipboard.readText();
            batchInput.value = text;
        } catch (e) {
            if (typeof showToast === "function") showToast("❌ Paste failed", "error");
        }
    });

    randomBtn.addEventListener("click", () => {
        const len = currentFormat === "EAN13" ? 12
            : currentFormat === "UPC" ? 11
            : currentFormat === "EAN8" ? 7
            : currentFormat === "EAN5" ? 5
            : currentFormat === "EAN2" ? 2
            : currentFormat === "ITF14" ? 14
            : currentFormat === "ITF" ? 8
            : currentFormat === "MSI" ? 10
            : 12;
        let val = "";
        for (let i = 0; i < len; i++) val += Math.floor(Math.random() * 10);
        singleInput.value = val;
    });

    sampleBatchBtn.addEventListener("click", () => {
        const sample = [];
        for (let i = 0; i < 6; i++) {
            let v = "";
            for (let j = 0; j < 12; j++) v += Math.floor(Math.random() * 10);
            sample.push(v);
        }
        batchInput.value = sample.join("\n");
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
            bcHistoryList.innerHTML = '<div class="empty-history">No barcodes yet</div>';
            return;
        }

        // For history, we need to regenerate SVGs — but since we don't store them,
        // we'll show placeholder + value. Clicking reloads the input.
        bcHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="hi-thumb"><i class="fa-solid fa-barcode" style="color:#8b5cf6;font-size:1.1rem;"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.value)}</div>
                    <div class="hi-meta">${escapeHtml(h.format)}</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");

        bcHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                setMode("single");
                singleInput.value = h.value;
                // Find and set format
                const fmt = FORMATS.find((f) => f.id === h.format);
                if (fmt) {
                    currentFormat = fmt.id;
                    formatGrid.querySelectorAll(".format-item").forEach((b) => {
                        b.classList.toggle("active", b.dataset.format === fmt.id);
                    });
                    updateFormatInfo();
                }
                // Auto-generate
                generateBarcode();
            });
        });
    }

    clearBcHistory.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* ============================================================
       EVENTS
       ============================================================ */
    generateBtn.addEventListener("click", generateBarcode);

    // Auto-generate on Enter in single input
    singleInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            generateBarcode();
        }
    });

    batchInput.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            generateBarcode();
        }
    });

    // Live regen on option changes if already generated
    [showText, showBorder, highDensity].forEach((el) => {
        el.addEventListener("change", () => {
            if (outputArea.style.display === "block" && currentMode === "single" && singleInput.value.trim()) {
                generateBarcode();
            }
        });
    });

    [widthSlider, heightSlider, fontSizeSlider, barColor, bgColor, textColor].forEach((el) => {
        el.addEventListener("change", () => {
            if (outputArea.style.display === "block" && currentMode === "single" && singleInput.value.trim()) {
                generateBarcode();
            }
        });
    });

    /* ============================================================
       KEYBOARD SHORTCUTS
       ============================================================ */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        const typing = tag === "input" || tag === "textarea" || tag === "select";

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            generateBarcode();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            if (lastResults.length > 0) {
                e.preventDefault();
                downloadSvgBtn.click();
            }
            return;
        }
        if (!typing && e.key === "Escape") {
            clearAll();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareBarcodeGenerator = function () {
        const shareData = {
            title: "Barcode Generator - Tool Hub",
            text: "Generate barcodes in 15+ formats — CODE128, EAN, UPC, CODE39 & more!",
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
        renderFormatGrid();
        updateFormatInfo();
        setMode("single");
        renderHistory();

        // Check JsBarcode loaded
        if (typeof JsBarcode === "undefined") {
            showError("⚠️ Barcode library failed to load. Check your internet connection.");
        }
    }

    init();
})();