/* ============================================================
   IMAGE METADATA VIEWER - Advanced Logic
   EXIF · GPS · Camera · Histogram · Thumbnail · Raw JSON · Search
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const imCard         = document.getElementById("imCard");
    const uploadZone     = document.getElementById("uploadZone");
    const fileInput      = document.getElementById("fileInput");
    const browseBtn      = document.getElementById("browseBtn");

    const viewerArea     = document.getElementById("viewerArea");
    const imageName      = document.getElementById("imageName");
    const imageSize      = document.getElementById("imageSize");
    const copyAllBtn     = document.getElementById("copyAllBtn");
    const exportJsonBtn  = document.getElementById("exportJsonBtn");
    const removeBtn      = document.getElementById("removeBtn");

    const previewImg     = document.getElementById("previewImg");
    const quickStats     = document.getElementById("quickStats");

    const exifThumbWrap  = document.getElementById("exifThumbWrap");
    const exifThumb      = document.getElementById("exifThumb");

    const histogramWrap  = document.getElementById("histogramWrap");
    const histogramCanvas= document.getElementById("histogramCanvas");

    const gpsWrap        = document.getElementById("gpsWrap");
    const gpsBody        = document.getElementById("gpsBody");

    const metaTabs       = document.querySelectorAll(".mt-tab");
    const metaSearch     = document.getElementById("metaSearch");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    const metaList       = document.getElementById("metaList");

    const progressWrap   = document.getElementById("progressWrap");
    const progressLabel  = document.getElementById("progressLabel");
    const progressFill   = document.getElementById("progressFill");

    const infoBanner     = document.getElementById("infoBanner");

    const imHistoryList  = document.getElementById("imHistoryList");
    const clearImHistory = document.getElementById("clearImHistory");

    /* ---------------- State ---------------- */
    let currentImage     = null;    // { file, name, size, type, img, dataUrl }
    let currentMetadata  = null;    // { groups: [{ name, icon, items: [{key, value}] }], raw: {...} }
    let currentCategory  = "all";
    let currentSearch    = "";
    let history          = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_imgmetadata_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            const meta = history.slice(0, 12).map((h) => ({
                name: h.name,
                size: h.size,
                hasExif: h.hasExif,
                time: h.time,
            }));
            localStorage.setItem("toolhub_imgmetadata_history", JSON.stringify(meta));
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

    function formatValue(v) {
        if (v === undefined || v === null) return "—";
        if (typeof v === "number") {
            if (Number.isInteger(v)) return v.toString();
            return v.toFixed(4).replace(/\.?0+$/, "");
        }
        if (typeof v === "object") {
            try { return JSON.stringify(v); } catch (e) { return String(v); }
        }
        return String(v);
    }

    /* ============================================================
       EXIF PARSER (minimal, binary DataView)
       ============================================================ */
    function parseExif(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        const result = {};

        // Check JPEG SOI
        if (view.byteLength < 4) return null;
        if (view.getUint16(0) !== 0xFFD8) return null;

        let offset = 2;
        let exifData = null;

        while (offset < view.byteLength - 2) {
            const marker = view.getUint16(offset);
            offset += 2;

            if (marker === 0xFFE1) {
                // APP1 - could be EXIF
                const length = view.getUint16(offset);
                offset += 2;
                // Check "Exif\0\0"
                const exifHeader = view.getUint32(offset);
                if (exifHeader === 0x45786966) { // "Exif"
                    offset += 6; // skip "Exif\0\0"
                    exifData = parseTiff(view, offset, arrayBuffer);
                    break;
                } else {
                    offset += length - 2;
                }
            } else if ((marker & 0xFF00) === 0xFF00) {
                // Other marker with length
                if (marker === 0xFFDA) break; // SOS — image data starts
                if (marker === 0xFFD9) break; // EOI
                if (marker >= 0xFFD0 && marker <= 0xFFD7) continue; // RST
                const length = view.getUint16(offset);
                offset += length;
            } else {
                break;
            }
        }

        return exifData;
    }

    function parseTiff(view, start, arrayBuffer) {
        // Byte order: II = little-endian, MM = big-endian
        const byteOrderMark = view.getUint16(start);
        let littleEndian;
        if (byteOrderMark === 0x4949) littleEndian = true;
        else if (byteOrderMark === 0x4D4D) littleEndian = false;
        else return null;

        // TIFF magic (0x002A)
        const magic = view.getUint16(start + 2, littleEndian);
        if (magic !== 0x002A) return null;

        // IFD0 offset
        const ifd0Offset = view.getUint32(start + 4, littleEndian);
        const tags = {};

        readIFD(view, start, start + ifd0Offset, littleEndian, tags, arrayBuffer);
        return tags;
    }

    const EXIF_TAGS = {
        0x010E: "ImageDescription",
        0x010F: "Make",
        0x0110: "Model",
        0x0112: "Orientation",
        0x011A: "XResolution",
        0x011B: "YResolution",
        0x0128: "ResolutionUnit",
        0x0131: "Software",
        0x0132: "DateTime",
        0x013B: "Artist",
        0x013E: "WhitePoint",
        0x013F: "PrimaryChromaticities",
        0x0201: "ThumbnailOffset",
        0x0202: "ThumbnailLength",
        0x0211: "YCbCrCoefficients",
        0x0213: "YCbCrPositioning",
        0x0214: "ReferenceBlackWhite",
        0x8298: "Copyright",
        0x829A: "ExposureTime",
        0x829D: "FNumber",
        0x8769: "ExifIFDPointer",
        0x8822: "ExposureProgram",
        0x8824: "SpectralSensitivity",
        0x8825: "GPSInfoIFDPointer",
        0x8827: "ISOSpeedRatings",
        0x8828: "OECF",
        0x8830: "SensitivityType",
        0x9000: "ExifVersion",
        0x9003: "DateTimeOriginal",
        0x9004: "DateTimeDigitized",
        0x9101: "ComponentsConfiguration",
        0x9102: "CompressedBitsPerPixel",
        0x9201: "ShutterSpeedValue",
        0x9202: "ApertureValue",
        0x9203: "BrightnessValue",
        0x9204: "ExposureBiasValue",
        0x9205: "MaxApertureValue",
        0x9206: "SubjectDistance",
        0x9207: "MeteringMode",
        0x9208: "LightSource",
        0x9209: "Flash",
        0x920A: "FocalLength",
        0x927C: "MakerNote",
        0x9286: "UserComment",
        0x9290: "SubSecTime",
        0x9291: "SubSecTimeOriginal",
        0x9292: "SubSecTimeDigitized",
        0xA000: "FlashpixVersion",
        0xA001: "ColorSpace",
        0xA002: "PixelXDimension",
        0xA003: "PixelYDimension",
        0xA004: "RelatedSoundFile",
        0xA005: "InteroperabilityIFDPointer",
        0xA20E: "FocalPlaneXResolution",
        0xA20F: "FocalPlaneYResolution",
        0xA210: "FocalPlaneResolutionUnit",
        0xA217: "SensingMethod",
        0xA300: "FileSource",
        0xA301: "SceneType",
        0xA401: "CustomRendered",
        0xA402: "ExposureMode",
        0xA403: "WhiteBalance",
        0xA404: "DigitalZoomRatio",
        0xA405: "FocalLengthIn35mmFilm",
        0xA406: "SceneCaptureType",
        0xA407: "GainControl",
        0xA408: "Contrast",
        0xA409: "Saturation",
        0xA40A: "Sharpness",
        0xA40C: "SubjectDistanceRange",
        0xA420: "ImageUniqueID",
    };

    const GPS_TAGS = {
        0x0000: "GPSVersionID",
        0x0001: "GPSLatitudeRef",
        0x0002: "GPSLatitude",
        0x0003: "GPSLongitudeRef",
        0x0004: "GPSLongitude",
        0x0005: "GPSAltitudeRef",
        0x0006: "GPSAltitude",
        0x0007: "GPSTimeStamp",
        0x0008: "GPSSatellites",
        0x0009: "GPSStatus",
        0x000A: "GPSMeasureMode",
        0x000B: "GPSDOP",
        0x000C: "GPSSpeedRef",
        0x000D: "GPSSpeed",
        0x000E: "GPSTrackRef",
        0x000F: "GPSTrack",
        0x0010: "GPSImgDirectionRef",
        0x0011: "GPSImgDirection",
        0x0012: "GPSMapDatum",
        0x0013: "GPSDestLatitudeRef",
        0x0014: "GPSDestLatitude",
        0x0015: "GPSDestLongitudeRef",
        0x0016: "GPSDestLongitude",
        0x0017: "GPSDestBearingRef",
        0x0018: "GPSDestBearing",
        0x0019: "GPSDestDistanceRef",
        0x001A: "GPSDestDistance",
        0x001B: "GPSProcessingMethod",
        0x001C: "GPSAreaInformation",
        0x001D: "GPSDateStamp",
        0x001E: "GPSDifferential",
        0x001F: "GPSHPositioningError",
    };

    const ORIENTATION = {
        1: "Normal",
        2: "Flip Horizontal",
        3: "Rotate 180°",
        4: "Flip Vertical",
        5: "Transpose",
        6: "Rotate 90° CW",
        7: "Transverse",
        8: "Rotate 270° CW",
    };

    const EXPOSURE_PROGRAM = {
        0: "Not defined",
        1: "Manual",
        2: "Normal program",
        3: "Aperture priority",
        4: "Shutter priority",
        5: "Creative program",
        6: "Action program",
        7: "Portrait mode",
        8: "Landscape mode",
    };

    const METERING_MODE = {
        0: "Unknown",
        1: "Average",
        2: "Center-weighted average",
        3: "Spot",
        4: "Multi-spot",
        5: "Pattern",
        6: "Partial",
        255: "Other",
    };

    const FLASH = {
        0x00: "No flash",
        0x01: "Fired",
        0x05: "Fired, return not detected",
        0x07: "Fired, return detected",
        0x09: "On, not fired",
        0x0D: "On, return not detected",
        0x0F: "On, return detected",
        0x10: "Off, did not fire",
        0x18: "Off, did not fire, return not detected",
        0x20: "Auto, did not fire",
        0x30: "Auto, fired",
    };

    const WHITE_BALANCE = {
        0: "Auto",
        1: "Manual",
    };

    const LIGHT_SOURCE = {
        0: "Unknown",
        1: "Daylight",
        2: "Fluorescent",
        3: "Tungsten (incandescent)",
        4: "Flash",
        9: "Fine weather",
        10: "Cloudy weather",
        11: "Shade",
        12: "Daylight fluorescent",
        13: "Day white fluorescent",
        14: "Cool white fluorescent",
        15: "White fluorescent",
        17: "Standard light A",
        18: "Standard light B",
        19: "Standard light C",
        20: "D55",
        21: "D65",
        22: "D75",
        23: "D50",
        24: "ISO studio tungsten",
        255: "Other",
    };

    function readIFD(view, tiffStart, ifdOffset, littleEndian, out, arrayBuffer) {
        if (ifdOffset + 2 > view.byteLength) return;

        const entryCount = view.getUint16(ifdOffset, littleEndian);
        let entryOffset = ifdOffset + 2;

        for (let i = 0; i < entryCount && entryOffset + 12 <= view.byteLength; i++) {
            const tag = view.getUint16(entryOffset, littleEndian);
            const type = view.getUint16(entryOffset + 2, littleEndian);
            const count = view.getUint32(entryOffset + 4, littleEndian);
            const valueOffset = entryOffset + 8;

            try {
                const value = readTagValue(view, tiffStart, valueOffset, type, count, littleEndian, arrayBuffer);

                // Handle ExifIFDPointer
                if (tag === 0x8769 && typeof value === "number") {
                    readIFD(view, tiffStart, tiffStart + value, littleEndian, out, arrayBuffer);
                }
                // Handle GPSInfoIFDPointer
                else if (tag === 0x8825 && typeof value === "number") {
                    const gpsTags = {};
                    readIFD(view, tiffStart, tiffStart + value, littleEndian, gpsTags, arrayBuffer);
                    out.__GPS = gpsTags;
                }
                // Handle Interoperability pointer
                else if (tag === 0xA005 && typeof value === "number") {
                    readIFD(view, tiffStart, tiffStart + value, littleEndian, out, arrayBuffer);
                }
                else {
                    const tagName = EXIF_TAGS[tag] || `Tag0x${tag.toString(16).toUpperCase()}`;
                    out[tagName] = value;
                }
            } catch (e) {
                // Skip bad tags
            }

            entryOffset += 12;
        }
    }

    function readTagValue(view, tiffStart, valueOffset, type, count, littleEndian, arrayBuffer) {
        const TYPE_SIZES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
        const typeSize = TYPE_SIZES[type] || 1;
        const totalSize = count * typeSize;
        let dataOffset = totalSize > 4 ? tiffStart + view.getUint32(valueOffset, littleEndian) : valueOffset;

        switch (type) {
            case 1: // BYTE
                if (count === 1) return view.getUint8(dataOffset);
                return Array.from({length: count}, (_, i) => view.getUint8(dataOffset + i));

            case 2: // ASCII string
                let str = "";
                for (let i = 0; i < count; i++) {
                    const c = view.getUint8(dataOffset + i);
                    if (c === 0) break;
                    str += String.fromCharCode(c);
                }
                return str.trim();

            case 3: // SHORT
                if (count === 1) return view.getUint16(dataOffset, littleEndian);
                return Array.from({length: count}, (_, i) => view.getUint16(dataOffset + i * 2, littleEndian));

            case 4: // LONG
                if (count === 1) return view.getUint32(dataOffset, littleEndian);
                return Array.from({length: count}, (_, i) => view.getUint32(dataOffset + i * 4, littleEndian));

            case 5: // RATIONAL
                if (count === 1) {
                    const num = view.getUint32(dataOffset, littleEndian);
                    const den = view.getUint32(dataOffset + 4, littleEndian);
                    return den === 0 ? 0 : num / den;
                }
                return Array.from({length: count}, (_, i) => {
                    const num = view.getUint32(dataOffset + i * 8, littleEndian);
                    const den = view.getUint32(dataOffset + i * 8 + 4, littleEndian);
                    return den === 0 ? 0 : num / den;
                });

            case 7: // UNDEFINED
                if (count <= 8) {
                    let bytes = [];
                    for (let i = 0; i < count; i++) {
                        bytes.push(view.getUint8(valueOffset + i));
                    }
                    return bytes;
                }
                let out = [];
                for (let i = 0; i < Math.min(count, 32); i++) {
                    out.push(view.getUint8(dataOffset + i));
                }
                return out;

            case 9: // SLONG
                return view.getInt32(dataOffset, littleEndian);

            case 10: // SRATIONAL
                if (count === 1) {
                    const num = view.getInt32(dataOffset, littleEndian);
                    const den = view.getInt32(dataOffset + 4, littleEndian);
                    return den === 0 ? 0 : num / den;
                }
                return Array.from({length: count}, (_, i) => {
                    const num = view.getInt32(dataOffset + i * 8, littleEndian);
                    const den = view.getInt32(dataOffset + i * 8 + 4, littleEndian);
                    return den === 0 ? 0 : num / den;
                });

            default:
                return null;
        }
    }

    /* ============================================================
       FORMAT EXIF VALUE FOR DISPLAY
       ============================================================ */
    function formatExifValue(tag, value) {
        if (value === undefined || value === null) return "—";

        switch (tag) {
            case "Orientation":
                return ORIENTATION[value] || String(value);
            case "ExposureProgram":
                return EXPOSURE_PROGRAM[value] || String(value);
            case "MeteringMode":
                return METERING_MODE[value] || String(value);
            case "Flash":
                return FLASH[value] || String(value);
            case "WhiteBalance":
                return WHITE_BALANCE[value] || String(value);
            case "LightSource":
                return LIGHT_SOURCE[value] || String(value);
            case "ExposureTime": {
                if (value < 1) return `1/${Math.round(1 / value)} s`;
                return value + " s";
            }
            case "FNumber":
            case "ApertureValue":
                return `ƒ/${typeof value === "number" ? value.toFixed(1) : value}`;
            case "FocalLength":
                return `${typeof value === "number" ? value.toFixed(1) : value} mm`;
            case "ISOSpeedRatings":
                return `ISO ${Array.isArray(value) ? value[0] : value}`;
            case "XResolution":
            case "YResolution":
                return `${typeof value === "number" ? value.toFixed(0) : value} dpi`;
            case "ColorSpace":
                return value === 1 ? "sRGB" : value === 0xFFFF ? "Adobe RGB" : String(value);
            case "ResolutionUnit":
                return value === 2 ? "Inches" : value === 3 ? "Centimeters" : String(value);
        }

        if (typeof value === "number") {
            if (Number.isInteger(value)) return value.toString();
            return value.toFixed(4).replace(/\.?0+$/, "");
        }
        if (Array.isArray(value)) {
            if (value.length > 20) return `[${value.length} values]`;
            return value.map((v) => typeof v === "number" ? v.toFixed(2).replace(/\.?0+$/, "") : v).join(", ");
        }
        return String(value);
    }

    /* ============================================================
       GPS PARSING
       ============================================================ */
    function dmsToDecimal(dms, ref) {
        if (!Array.isArray(dms) || dms.length < 3) return null;
        let decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
        if (ref === "S" || ref === "W") decimal = -decimal;
        return decimal;
    }

    function parseGps(gpsData) {
        if (!gpsData) return null;

        const result = {};

        const latDms = gpsData.GPSLatitude;
        const latRef = gpsData.GPSLatitudeRef;
        const lonDms = gpsData.GPSLongitude;
        const lonRef = gpsData.GPSLongitudeRef;

        if (latDms && latRef) {
            result.latitude = dmsToDecimal(latDms, latRef);
            result.latitudeRef = latRef;
        }
        if (lonDms && lonRef) {
            result.longitude = dmsToDecimal(lonDms, lonRef);
            result.longitudeRef = lonRef;
        }
        if (gpsData.GPSAltitude !== undefined) {
            let alt = typeof gpsData.GPSAltitude === "number"
                ? gpsData.GPSAltitude
                : (Array.isArray(gpsData.GPSAltitude) ? gpsData.GPSAltitude[0] : 0);
            if (gpsData.GPSAltitudeRef === 1) alt = -alt;
            result.altitude = alt;
        }
        if (gpsData.GPSDateStamp) result.date = gpsData.GPSDateStamp;
        if (gpsData.GPSTimeStamp) {
            const t = gpsData.GPSTimeStamp;
            if (Array.isArray(t) && t.length >= 3) {
                result.time = `${Math.floor(t[0]).toString().padStart(2, "0")}:${Math.floor(t[1]).toString().padStart(2, "0")}:${Math.floor(t[2]).toString().padStart(2, "0")} UTC`;
            }
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    /* ============================================================
       FILE HANDLING
       ============================================================ */
    function handleFile(file) {
        if (!file || !file.type.startsWith("image/")) {
            if (typeof showToast === "function") showToast("⚠️ Please select an image file", "error");
            return;
        }
        if (file.size > 30 * 1024 * 1024) {
            if (typeof showToast === "function") showToast("⚠️ File exceeds 30 MB", "error");
            return;
        }

        showProgress(20, "Reading file…");

        const reader = new FileReader();

        // Read as data URL for preview
        reader.onload = (e) => {
            const dataUrl = e.target.result;

            // Read as ArrayBuffer for EXIF
            const abReader = new FileReader();
            abReader.onload = (ab) => {
                showProgress(60, "Parsing EXIF…");
                try {
                    const arrayBuffer = ab.target.result;
                    const exif = parseExif(arrayBuffer);

                    // Extract thumbnail if present
                    let thumbBlob = null;
                    if (exif && exif.ThumbnailOffset && exif.ThumbnailLength) {
                        try {
                            // Thumbnail is in JPEG APP1 segment — need to locate it
                            thumbBlob = extractThumbnail(arrayBuffer, exif.ThumbnailOffset, exif.ThumbnailLength);
                        } catch (e) {}
                    }

                    currentImage = {
                        file,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        dataUrl,
                        exif,
                        thumbBlob,
                    };

                    showProgress(100, "Building report…");
                    processMetadata();
                    renderViewer();

                    pushHistory({
                        name: file.name,
                        size: file.size,
                        hasExif: !!exif,
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    });

                    if (typeof showToast === "function") {
                        showToast(exif ? "📋 Metadata loaded" : "ℹ️ No EXIF found");
                    }
                } catch (e) {
                    if (typeof showToast === "function") showToast("❌ Parse error: " + e.message, "error");
                }
                hideProgress();
            };
            abReader.onerror = () => {
                hideProgress();
                if (typeof showToast === "function") showToast("❌ Failed to read file", "error");
            };
            abReader.readAsArrayBuffer(file);
        };

        reader.onerror = () => {
            hideProgress();
            if (typeof showToast === "function") showToast("❌ Failed to load image", "error");
        };

        reader.readAsDataURL(file);
    }

    function extractThumbnail(arrayBuffer, thumbOffset, thumbLength) {
        // Thumbnail is at offset relative to TIFF header.
        // We need to find the APP1 segment and add offset from TIFF start.
        // Simplified: skip. Many thumbnails are unreliable.
        // Let's just return null for now.
        return null;
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

    removeBtn.addEventListener("click", () => {
        if (!confirm("Close and clear current image?")) return;
        resetViewer();
    });

    /* ============================================================
       PROCESS METADATA
       ============================================================ */
    function processMetadata() {
        if (!currentImage) return;

        const groups = [];
        const raw = {};

        // ---- File Group ----
        const fileItems = [
            { key: "File Name", value: currentImage.name },
            { key: "File Size", value: formatBytes(currentImage.size) },
            { key: "File Type", value: currentImage.type },
            { key: "Last Modified", value: currentImage.file.lastModified ? new Date(currentImage.file.lastModified).toLocaleString() : "—" },
        ];
        groups.push({ name: "File", icon: "fa-file", items: fileItems, cat: "file" });

        // ---- Image Group (from <img> load) ----
        const img = new Image();
        img.onload = () => {
            const imageItems = [
                { key: "Width", value: `${img.naturalWidth} px` },
                { key: "Height", value: `${img.naturalHeight} px` },
                { key: "Aspect Ratio", value: (img.naturalWidth / img.naturalHeight).toFixed(3) + ":1" },
                { key: "Megapixels", value: ((img.naturalWidth * img.naturalHeight) / 1e6).toFixed(2) + " MP" },
            ];
            groups.splice(1, 0, { name: "Image", icon: "fa-image", items: imageItems, cat: "image" });

            // Update quick stats
            renderQuickStats(img, fileItems, imageItems);
            renderHistogram(img);
        };
        img.src = currentImage.dataUrl;

        // ---- EXIF Groups ----
        const exif = currentImage.exif;
        if (exif && Object.keys(exif).length > 0) {
            // Camera
            const cameraKeys = ["Make", "Model", "Software", "Artist", "Copyright", "LensModel", "LensMake"];
            const cameraItems = cameraKeys
                .filter((k) => exif[k] !== undefined)
                .map((k) => ({ key: k, value: formatValue(exif[k]) }));
            if (cameraItems.length > 0) {
                groups.push({ name: "Camera", icon: "fa-camera", items: cameraItems, cat: "camera" });
            }

            // Photo settings
            const photoKeys = ["ExposureTime", "FNumber", "ISOSpeedRatings", "FocalLength", "FocalLengthIn35mmFilm",
                "ExposureProgram", "MeteringMode", "Flash", "WhiteBalance", "LightSource", "ApertureValue",
                "ShutterSpeedValue", "BrightnessValue", "ExposureBiasValue", "MaxApertureValue", "SubjectDistance",
                "ExposureMode", "SceneCaptureType", "DigitalZoomRatio", "Contrast", "Saturation", "Sharpness"];
            const photoItems = photoKeys
                .filter((k) => exif[k] !== undefined)
                .map((k) => ({ key: k, value: formatExifValue(k, exif[k]) }));
            if (photoItems.length > 0) {
                groups.push({ name: "Photo Settings", icon: "fa-sliders", items: photoItems, cat: "exif" });
            }

            // Date & Time
            const dateKeys = ["DateTimeOriginal", "DateTimeDigitized", "DateTime", "SubSecTime", "SubSecTimeOriginal", "SubSecTimeDigitized"];
            const dateItems = dateKeys
                .filter((k) => exif[k] !== undefined)
                .map((k) => ({ key: k, value: formatValue(exif[k]) }));
            if (dateItems.length > 0) {
                groups.push({ name: "Date & Time", icon: "fa-calendar", items: dateItems, cat: "exif" });
            }

            // Image Details
            const detailKeys = ["Orientation", "XResolution", "YResolution", "ResolutionUnit", "ColorSpace",
                "PixelXDimension", "PixelYDimension", "ExifVersion", "FlashpixVersion", "ImageDescription",
                "UserComment", "ImageUniqueID", "SensingMethod", "FileSource", "SceneType"];
            const detailItems = detailKeys
                .filter((k) => exif[k] !== undefined && k !== "ThumbnailOffset" && k !== "ThumbnailLength")
                .map((k) => ({ key: k, value: formatExifValue(k, exif[k]) }));
            if (detailItems.length > 0) {
                groups.push({ name: "Image Details", icon: "fa-info-circle", items: detailItems, cat: "exif" });
            }

            // ---- GPS ----
            const gpsData = exif.__GPS;
            const gps = parseGps(gpsData);
            if (gps) {
                const gpsItems = [];
                if (gps.latitude !== undefined) gpsItems.push({ key: "Latitude", value: gps.latitude.toFixed(6) + "°", cls: "gps-coord" });
                if (gps.longitude !== undefined) gpsItems.push({ key: "Longitude", value: gps.longitude.toFixed(6) + "°", cls: "gps-coord" });
                if (gps.altitude !== undefined) gpsItems.push({ key: "Altitude", value: gps.altitude.toFixed(1) + " m" });
                if (gps.date) gpsItems.push({ key: "GPS Date", value: gps.date });
                if (gps.time) gpsItems.push({ key: "GPS Time", value: gps.time });
                if (gpsItems.length > 0) {
                    groups.push({ name: "GPS Location", icon: "fa-map-location-dot", items: gpsItems, cat: "gps" });
                }

                // Render GPS panel
                renderGpsPanel(gps);
            }
        }

        // Raw JSON
        raw.groups = groups;
        raw.exif = exif || {};
        raw.file = {
            name: currentImage.name,
            size: currentImage.size,
            type: currentImage.type,
        };

        currentMetadata = { groups, raw };

        // Show info banner if no EXIF
        infoBanner.style.display = (!exif || Object.keys(exif).length === 0) ? "flex" : "none";

        renderMetaList();
    }

    /* ============================================================
       RENDER
       ============================================================ */
    function renderViewer() {
        uploadZone.style.display = "none";
        viewerArea.style.display = "block";

        imageName.textContent = currentImage.name;
        imageSize.textContent = formatBytes(currentImage.size);

        previewImg.src = currentImage.dataUrl;

        // Reset EXIF thumb (unused for now)
        exifThumbWrap.style.display = "none";

        // GPS Wrap initially hidden
        gpsWrap.style.display = "none";
    }

    function renderQuickStats(img, fileItems, imageItems) {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const mp = (width * height / 1e6).toFixed(2);

        const exif = currentImage.exif || {};

        const stats = [
            { label: "Dimensions", value: `${width} × ${height}` },
            { label: "Megapixels", value: mp + " MP" },
            { label: "File Size", value: formatBytes(currentImage.size) },
            { label: "File Type", value: currentImage.type.replace("image/", "").toUpperCase() },
        ];

        if (exif.Make || exif.Model) {
            stats.push({ label: "Camera", value: `${exif.Make || ""} ${exif.Model || ""}`.trim() });
        }
        if (exif.DateTimeOriginal) {
            stats.push({ label: "Captured", value: exif.DateTimeOriginal });
        }
        if (exif.ISOSpeedRatings) {
            const iso = Array.isArray(exif.ISOSpeedRatings) ? exif.ISOSpeedRatings[0] : exif.ISOSpeedRatings;
            stats.push({ label: "ISO", value: "ISO " + iso });
        }
        if (exif.FNumber) {
            stats.push({ label: "Aperture", value: `ƒ/${exif.FNumber.toFixed(1)}` });
        }
        if (exif.ExposureTime) {
            const et = exif.ExposureTime < 1 ? `1/${Math.round(1 / exif.ExposureTime)}` : exif.ExposureTime;
            stats.push({ label: "Exposure", value: et + " s" });
        }
        if (exif.FocalLength) {
            stats.push({ label: "Focal Length", value: exif.FocalLength.toFixed(1) + " mm" });
        }

        quickStats.innerHTML = stats.map((s) => `
            <div class="qs-item">
                <div class="qs-label">${escapeHtml(s.label)}</div>
                <div class="qs-value">${escapeHtml(s.value)}</div>
            </div>
        `).join("");
    }

    function renderHistogram(img) {
        histogramWrap.style.display = "block";

        const maxSize = 800;
        const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
            histogramWrap.style.display = "none";
            return;
        }

        const data = imageData.data;
        const rHist = new Uint32Array(256);
        const gHist = new Uint32Array(256);
        const bHist = new Uint32Array(256);

        for (let i = 0; i < data.length; i += 4) {
            rHist[data[i]]++;
            gHist[data[i + 1]]++;
            bHist[data[i + 2]]++;
        }

        const outCtx = histogramCanvas.getContext("2d");
        const W = histogramCanvas.width = histogramCanvas.offsetWidth * window.devicePixelRatio;
        const H = histogramCanvas.height = 100 * window.devicePixelRatio;
        outCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const w = histogramCanvas.offsetWidth;
        const h = 100;

        outCtx.clearRect(0, 0, w, h);

        // Find max for normalization
        let maxVal = 0;
        for (let i = 0; i < 256; i++) {
            maxVal = Math.max(maxVal, rHist[i], gHist[i], bHist[i]);
        }
        if (maxVal === 0) return;

        // Draw RGB channels with additive blending
        outCtx.globalCompositeOperation = "source-over";

        function drawChannel(hist, color, alpha) {
            outCtx.beginPath();
            outCtx.moveTo(0, h);
            for (let i = 0; i < 256; i++) {
                const x = (i / 255) * w;
                const y = h - (hist[i] / maxVal) * h * 0.95;
                outCtx.lineTo(x, y);
            }
            outCtx.lineTo(w, h);
            outCtx.closePath();
            outCtx.fillStyle = color;
            outCtx.globalAlpha = alpha;
            outCtx.fill();
        }

        drawChannel(rHist, "#ef4444", 0.45);
        drawChannel(gHist, "#10b981", 0.45);
        drawChannel(bHist, "#3b82f6", 0.45);

        outCtx.globalAlpha = 1;
        outCtx.globalCompositeOperation = "source-over";
    }

    function renderGpsPanel(gps) {
        if (gps.latitude === undefined || gps.longitude === undefined) return;

        gpsWrap.style.display = "block";

        const lat = gps.latitude.toFixed(6);
        const lon = gps.longitude.toFixed(6);
        const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
        const gmapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

        gpsBody.innerHTML = `
            <div class="gps-row">
                <span class="gps-label">Latitude</span>
                <span class="gps-value">${lat}°</span>
            </div>
            <div class="gps-row">
                <span class="gps-label">Longitude</span>
                <span class="gps-value">${lon}°</span>
            </div>
            ${gps.altitude !== undefined ? `
            <div class="gps-row">
                <span class="gps-label">Altitude</span>
                <span class="gps-value">${gps.altitude.toFixed(1)} m</span>
            </div>` : ""}
            <a href="${gmapsUrl}" target="_blank" rel="noopener" class="gps-link">
                <i class="fa-solid fa-map-location-dot"></i> View on Google Maps
            </a>
        `;
    }

    /* ============================================================
       META LIST RENDERING
       ============================================================ */
    function renderMetaList() {
        if (!currentMetadata) return;

        let groups = currentMetadata.groups;

        // Filter by category
        if (currentCategory !== "all") {
            if (currentCategory === "raw") {
                renderRawJson();
                return;
            }
            groups = groups.filter((g) => g.cat === currentCategory);
        }

        // Apply search
        if (currentSearch.trim()) {
            const q = currentSearch.toLowerCase();
            groups = groups.map((g) => ({
                ...g,
                items: g.items.filter((it) =>
                    it.key.toLowerCase().includes(q) ||
                    String(it.value).toLowerCase().includes(q)
                ),
            })).filter((g) => g.items.length > 0);
        }

        if (groups.length === 0) {
            metaList.innerHTML = `
                <div class="meta-empty">
                    <i class="fa-solid fa-folder-open"></i>
                    <div>No metadata found for this category${currentSearch ? " matching your search" : ""}.</div>
                </div>
            `;
            return;
        }

        metaList.innerHTML = groups.map((group, gi) => `
            <div class="meta-group" style="animation-delay:${gi * 0.03}s">
                <div class="mg-header" data-group="${gi}">
                    <div class="mg-title">
                        <i class="fa-solid ${group.icon}"></i>
                        <span>${escapeHtml(group.name)}</span>
                    </div>
                    <span class="mg-count">${group.items.length}</span>
                    <i class="fa-solid fa-chevron-down chev"></i>
                </div>
                <div class="mg-body" data-body="${gi}">
                    ${group.items.map((it) => {
                        const value = escapeHtml(String(it.value));
                        const isLong = value.length > 60;
                        return `
                            <div class="meta-item">
                                <div class="meta-key">${escapeHtml(it.key)}</div>
                                <div class="meta-value ${isLong ? "long-text" : ""} ${it.cls || ""}">
                                    ${value}
                                    <button class="meta-copy" data-copy="${value}" title="Copy">
                                        <i class="fa-solid fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `).join("");

        // Collapse/expand
        metaList.querySelectorAll(".mg-header").forEach((h) => {
            h.addEventListener("click", () => {
                const idx = h.dataset.group;
                const body = metaList.querySelector(`.mg-body[data-body="${idx}"]`);
                const chev = h.querySelector(".chev");
                body.classList.toggle("collapsed");
                h.classList.toggle("collapsed");
            });
        });

        // Copy buttons
        metaList.querySelectorAll(".meta-copy").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.copy);
            });
        });
    }

    function renderRawJson() {
        if (!currentMetadata) return;
        const json = JSON.stringify(currentMetadata.raw, null, 2);
        metaList.innerHTML = `<pre class="raw-json">${escapeHtml(json)}</pre>`;
    }

    /* ============================================================
       TABS
       ============================================================ */
    metaTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            metaTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            currentCategory = tab.dataset.cat;
            renderMetaList();
        });
    });

    /* ============================================================
       SEARCH
       ============================================================ */
    metaSearch.addEventListener("input", () => {
        currentSearch = metaSearch.value;
        clearSearchBtn.style.display = currentSearch ? "flex" : "none";
        clearTimeout(metaSearch._t);
        metaSearch._t = setTimeout(renderMetaList, 200);
    });

    clearSearchBtn.addEventListener("click", () => {
        metaSearch.value = "";
        currentSearch = "";
        clearSearchBtn.style.display = "none";
        renderMetaList();
    });

    /* ============================================================
       COPY / EXPORT
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

    copyAllBtn.addEventListener("click", () => {
        if (!currentMetadata) return;
        const lines = [];
        currentMetadata.groups.forEach((g) => {
            lines.push(`── ${g.name} ──`);
            g.items.forEach((it) => lines.push(`${it.key}: ${it.value}`));
            lines.push("");
        });
        copyToClipboard(lines.join("\n"));
    });

    exportJsonBtn.addEventListener("click", () => {
        if (!currentMetadata) return;
        const json = JSON.stringify(currentMetadata.raw, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (currentImage.name.replace(/\.[^.]+$/, "") || "metadata") + "_metadata.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        if (typeof showToast === "function") showToast("📥 JSON downloaded");
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
    function resetViewer() {
        currentImage = null;
        currentMetadata = null;
        currentSearch = "";
        metaSearch.value = "";
        clearSearchBtn.style.display = "none";

        uploadZone.style.display = "block";
        viewerArea.style.display = "none";
        progressWrap.style.display = "none";
        infoBanner.style.display = "none";
        exifThumbWrap.style.display = "none";
        histogramWrap.style.display = "none";
        gpsWrap.style.display = "none";
        quickStats.innerHTML = "";
        metaList.innerHTML = "";
        previewImg.src = "";
        fileInput.value = "";

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
            imHistoryList.innerHTML = '<div class="empty-history">No scans yet</div>';
            return;
        }
        imHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb"><i class="fa-solid fa-file-circle-info"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.name)}</div>
                    <div class="hi-meta">${formatBytes(h.size)} · ${h.hasExif ? "EXIF ✓" : "No EXIF"}</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");
    }

    clearImHistory.addEventListener("click", () => {
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
        if (typing && e.key !== "Escape") return;

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && !window.getSelection().toString()) {
            if (currentMetadata) {
                e.preventDefault();
                copyAllBtn.click();
            }
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            if (currentMetadata) {
                e.preventDefault();
                exportJsonBtn.click();
            }
            return;
        }
        if (e.key === "Escape" && currentImage) {
            resetViewer();
        }
    });

    /* ============================================================
       SHARE PAGE
       ============================================================ */
    window.shareImgMetadata = function () {
        const shareData = {
            title: "Image Metadata Viewer - Tool Hub",
            text: "View EXIF, GPS & camera metadata hidden in your images — free & private!",
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
        viewerArea.style.display = "none";
        uploadZone.style.display = "block";
        progressWrap.style.display = "none";
        infoBanner.style.display = "none";
        renderHistory();
    }

    init();
})();