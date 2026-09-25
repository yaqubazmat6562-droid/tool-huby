/* ============================================================
   LOREM IPSUM GENERATOR - Tool Hub
   Standalone JavaScript Logic
   ============================================================ */

// ============ WORD BANKS ============
const WORD_BANKS = {
    classic: `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum`.split(' '),

    modern: `algorithm interface framework database function component render async promise callback module export import library syntax variable constant object array method route server client responsive design pattern state props hook effect context reducer dispatch store query mutation cache stream buffer thread process kernel terminal commit branch merge deploy container cluster pipeline`.split(' '),

    hipster: `artisan banjo biodiesel cardigan chia cold-pressed craft beer ethical flannel gluten-free heirloom kale kickstarter kombucha letterpress locavore meggings microdosing mixtape mustache narwhal organic paleo pickled pour-over retro sartorial seitan shabby chic skateboard slow-carb small batch street art sustainable tattooed taxidermy tofu tumblr typewriter vinyl wayfarers whatever williamsburg yr`.split(' '),

    pirate: `ahoy matey scallywag plunder doubloons booty galleon cutlass hornswaggle jolly roger keelhaul marooned parley poop deck shiver timbers swab squiffy starboard topmast treasure trove walk plank yardarm bilge rat buccaneer crow nest davy jones dead men flogging gangplank grog hardtack hearties heave ho landlubber longboat man o war mutiny peg leg privateer salmagundi scurvy sea dog shipmate six pounders sloop spyglass three sheets to the wind`.split(' '),

    space: `galaxy nebula cosmos asteroid meteor comet orbit satellite planet star universe black hole supernova gravity light-year quantum telescope astronaut spaceship mission launch trajectory docking module vacuum solar system mars jupiter saturn neptune pluto andromeda milky way supercluster dark matter redshift cosmic ray solar wind eclipse constellation exoplanet warp drive hyperspace.`.split(' '),

    business: `synergy leverage stakeholder deliverable benchmark streamline optimize scalable paradigm disruptive innovation vertical integrate holistic proactive bandwidth alignment synergy roadmap actionable metrics ROI KPI pivot growth hack ecosystem best practice value add low hanging fruit circle back touch base move the needle drill down deep dive game changer thought leader leverage core competency strategic initiative empower utilize facilitate incentivize monetize`.split(' ')
};

// ============ STATE ============
let currentType = 'paragraphs';
let currentOutput = '';
let currentHtml = '';

// ============ DOM ELEMENTS ============
const amountSlider = document.getElementById('amount-slider');
const amountValue = document.getElementById('amount-value');
const amountLabel = document.getElementById('amount-label');
const flavorSelect = document.getElementById('flavor-select');
const wordsPerSentence = document.getElementById('words-per-sentence');
const sentencesPerPara = document.getElementById('sentences-per-para');
const startWith = document.getElementById('start-with');
const customStartRow = document.getElementById('custom-start-row');
const customStartInput = document.getElementById('custom-start-input');
const optNoWrap = document.getElementById('opt-no-wrap');
const optNoPunct = document.getElementById('opt-no-punct');
const optAutoGenerate = document.getElementById('opt-auto-generate');
const outputContent = document.getElementById('output-content');
const outputBadge = document.getElementById('output-badge');

// Stats
const statParas = document.getElementById('stat-paras');
const statWords = document.getElementById('stat-words');
const statChars = document.getElementById('stat-chars');
const statReadTime = document.getElementById('stat-readtime');
const footerWords = document.getElementById('footer-words');
const footerChars = document.getElementById('footer-chars');
const footerParas = document.getElementById('footer-paras');

// ============ SET TYPE ============
function setType(type) {
    currentType = type;

    document.querySelectorAll('.type-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });

    // Update slider label & max
    const config = {
        paragraphs: { label: 'Paragraphs', max: 20, defaultVal: 3 },
        sentences: { label: 'Sentences', max: 50, defaultVal: 5 },
        words: { label: 'Words', max: 500, defaultVal: 50 },
        list: { label: 'List Items', max: 30, defaultVal: 10 }
    };

    const cfg = config[type];
    amountLabel.innerText = cfg.label;
    amountSlider.max = cfg.max;

    // Adjust if current value exceeds max
    if (parseInt(amountSlider.value) > cfg.max) {
        amountSlider.value = cfg.defaultVal;
    }
    amountValue.innerText = amountSlider.value;

    outputBadge.innerText = type.toUpperCase();

    if (optAutoGenerate.checked) generate();
}

// ============ SLIDER CHANGE ============
amountSlider.addEventListener('input', () => {
    amountValue.innerText = amountSlider.value;
    if (optAutoGenerate.checked) generate();
});

// ============ OTHER SELECT CHANGES ============
[flavorSelect, wordsPerSentence, sentencesPerPara].forEach(el => {
    el.addEventListener('change', () => {
        if (optAutoGenerate.checked) generate();
    });
});

startWith.addEventListener('change', () => {
    customStartRow.style.display = startWith.value === 'custom' ? 'block' : 'none';
    if (optAutoGenerate.checked) generate();
});

customStartInput.addEventListener('input', () => {
    if (optAutoGenerate.checked && startWith.value === 'custom') generate();
});

// ============ RANDOM UTILITIES ============
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ============ GET WORDS PER SENTENCE RANGE ============
function getWordsRange() {
    switch (wordsPerSentence.value) {
        case 'short': return [5, 10];
        case 'medium': return [10, 18];
        case 'long': return [18, 30];
        case 'mixed': {
            const ranges = [[5, 10], [10, 18], [18, 30]];
            return randomPick(ranges);
        }
    }
    return [10, 18];
}

// ============ GET SENTENCES PER PARA RANGE ============
function getSentencesRange() {
    switch (sentencesPerPara.value) {
        case 'short': return [2, 4];
        case 'medium': return [4, 7];
        case 'long': return [7, 12];
        case 'mixed': {
            const ranges = [[2, 4], [4, 7], [7, 12]];
            return randomPick(ranges);
        }
    }
    return [4, 7];
}

// ============ GENERATE SENTENCE ============
function generateSentence(wordBank, capitalize = true) {
    const [minWords, maxWords] = getWordsRange();
    const wordCount = randomInt(minWords, maxWords);
    const words = [];

    for (let i = 0; i < wordCount; i++) {
        words.push(randomPick(wordBank));
    }

    let sentence = words.join(' ');

    if (capitalize) {
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }

    if (!optNoPunct.checked) {
        sentence += '.';
    }

    return sentence;
}

// ============ GENERATE PARAGRAPH ============
function generateParagraph(wordBank, isFirst = false) {
    const [minSent, maxSent] = getSentencesRange();
    const sentenceCount = randomInt(minSent, maxSent);
    const sentences = [];

    for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence(wordBank, true));
    }

    let paragraph = sentences.join(' ');

    // Custom start
    if (isFirst) {
        if (startWith.value === 'lorem') {
            const startText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
            paragraph = startText + ' ' + paragraph;
        } else if (startWith.value === 'custom' && customStartInput.value.trim()) {
            const startText = customStartInput.value.trim();
            const punctuated = startText.endsWith('.') || startText.endsWith('!') || startText.endsWith('?')
                ? startText
                : startText + '.';
            paragraph = punctuated + ' ' + paragraph;
        }
    }

    return paragraph;
}

// ============ GENERATE ============
function generate() {
    const wordBank = WORD_BANKS[flavorSelect.value] || WORD_BANKS.classic;
    const amount = parseInt(amountSlider.value) || 3;
    const htmlMode = document.querySelector('input[name="html-mode"]:checked')?.value || 'none';

    let rawOutput = '';
    let htmlOutput = '';

    switch (currentType) {
        case 'paragraphs': {
            const paragraphs = [];
            for (let i = 0; i < amount; i++) {
                paragraphs.push(generateParagraph(wordBank, i === 0));
            }
            rawOutput = paragraphs.join('\n\n');

            if (htmlMode === 'p') {
                htmlOutput = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');
            } else if (htmlMode === 'div') {
                htmlOutput = paragraphs.map(p => `<div>${escapeHtml(p)}</div>`).join('\n');
            } else if (htmlMode === 'list') {
                htmlOutput = '<ul>\n' + paragraphs.map(p => `  <li>${escapeHtml(p)}</li>`).join('\n') + '\n</ul>';
            } else {
                htmlOutput = escapeHtml(rawOutput);
            }
            break;
        }

        case 'sentences': {
            const sentences = [];
            for (let i = 0; i < amount; i++) {
                sentences.push(generateSentence(wordBank, true));
            }
            rawOutput = sentences.join(' ');

            if (htmlMode === 'p') {
                htmlOutput = `<p>${escapeHtml(rawOutput)}</p>`;
            } else if (htmlMode === 'div') {
                htmlOutput = `<div>${escapeHtml(rawOutput)}</div>`;
            } else if (htmlMode === 'list') {
                htmlOutput = '<ul>\n' + sentences.map(s => `  <li>${escapeHtml(s)}</li>`).join('\n') + '\n</ul>';
            } else {
                htmlOutput = escapeHtml(rawOutput);
            }
            break;
        }

        case 'words': {
            const words = [];
            for (let i = 0; i < amount; i++) {
                words.push(randomPick(wordBank));
            }
            rawOutput = words.join(' ');

            if (htmlMode === 'p') {
                htmlOutput = `<p>${escapeHtml(rawOutput)}</p>`;
            } else if (htmlMode === 'div') {
                htmlOutput = `<div>${escapeHtml(rawOutput)}</div>`;
            } else if (htmlMode === 'list') {
                htmlOutput = '<ul>\n' + words.map(w => `  <li>${escapeHtml(w)}</li>`).join('\n') + '\n</ul>';
            } else {
                htmlOutput = escapeHtml(rawOutput);
            }
            break;
        }

        case 'list': {
            const items = [];
            for (let i = 0; i < amount; i++) {
                // Each list item is a short sentence
                const [minW, maxW] = [4, 10];
                const wc = randomInt(minW, maxW);
                const ws = [];
                for (let j = 0; j < wc; j++) {
                    ws.push(randomPick(wordBank));
                }
                let item = ws.join(' ');
                item = item.charAt(0).toUpperCase() + item.slice(1);
                if (!optNoPunct.checked) item += '.';
                items.push(item);
            }
            rawOutput = items.map(i => '• ' + i).join('\n');

            if (htmlMode === 'list' || htmlMode === 'none') {
                htmlOutput = '<ul>\n' + items.map(i => `  <li>${escapeHtml(i)}</li>`).join('\n') + '\n</ul>';
            } else if (htmlMode === 'p') {
                htmlOutput = items.map(i => `<p>${escapeHtml(i)}</p>`).join('\n');
            } else if (htmlMode === 'div') {
                htmlOutput = items.map(i => `<div>${escapeHtml(i)}</div>`).join('\n');
            }
            break;
        }
    }

    // If "no wrap" option → make single line
    if (optNoWrap.checked && currentType === 'paragraphs') {
        rawOutput = rawOutput.replace(/\n\n/g, ' ');
        htmlOutput = escapeHtml(rawOutput);
    }

    currentOutput = rawOutput;
    currentHtml = htmlOutput;

    renderOutput();
}

// ============ RENDER OUTPUT ============
function renderOutput() {
    if (currentType === 'paragraphs' && !currentOutput) {
        generate();
        return;
    }

    if (!currentOutput) {
        outputContent.innerHTML = `
            <div class="empty-output">
                <i class="fa-solid fa-paragraph"></i>
                <p>Click <b>Generate</b> to create Lorem Ipsum text</p>
            </div>
        `;
        updateStats('', '');
        return;
    }

    const htmlMode = document.querySelector('input[name="html-mode"]:checked')?.value || 'none';

    if (htmlMode === 'none' || currentType === 'words' || currentType === 'sentences') {
        // Show as plain text
        outputContent.innerHTML = `<p style="white-space: pre-wrap;">${escapeHtml(currentOutput)}</p>`;
    } else if (htmlMode === 'list' || (currentType === 'list' && htmlMode === 'none')) {
        // Render HTML
        outputContent.innerHTML = currentHtml;
    } else {
        // Show as code block for HTML output
        outputContent.innerHTML = `<code>${escapeHtml(currentHtml)}</code>`;
    }

    updateStats(currentOutput, currentHtml);
}

// ============ UPDATE STATS ============
function updateStats(text, html) {
    if (!text) {
        statParas.innerText = '0';
        statWords.innerText = '0';
        statChars.innerText = '0';
        statReadTime.innerText = '0s';
        footerWords.innerText = '0';
        footerChars.innerText = '0';
        footerParas.innerText = '0';
        return;
    }

    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length || 1;

    // Reading time (200 WPM)
    const minutes = words / 200;
    let readTime;
    if (words === 0) readTime = '0s';
    else if (minutes < 1) readTime = Math.ceil(minutes * 60) + 's';
    else readTime = Math.ceil(minutes) + 'm';

    statParas.innerText = paragraphs.toLocaleString();
    statWords.innerText = words.toLocaleString();
    statChars.innerText = chars.toLocaleString();
    statReadTime.innerText = readTime;

    footerWords.innerText = words.toLocaleString();
    footerChars.innerText = chars.toLocaleString();
    footerParas.innerText = paragraphs.toLocaleString();
}

// ============ RANDOMIZE OPTIONS ============
function randomizeOptions() {
    // Random flavor
    const flavors = ['classic', 'modern', 'hipster', 'pirate', 'space', 'business'];
    flavorSelect.value = randomPick(flavors);

    // Random amounts
    const config = {
        paragraphs: 20,
        sentences: 50,
        words: 500,
        list: 30
    };
    amountSlider.value = randomInt(1, Math.min(config[currentType], 15));
    amountValue.innerText = amountSlider.value;

    // Random words per sentence
    wordsPerSentence.value = randomPick(['short', 'medium', 'long', 'mixed']);

    // Random sentences per para
    sentencesPerPara.value = randomPick(['short', 'medium', 'long', 'mixed']);

    // Random start
    startWith.value = randomPick(['none', 'lorem']);
    customStartRow.style.display = startWith.value === 'custom' ? 'block' : 'none';

    generate();
    showToast('🎲 Randomized settings!');
}

// ============ APPLY PRESET ============
function applyPreset(name) {
    // Reset start-with
    startWith.value = 'none';
    customStartRow.style.display = 'none';

    switch (name) {
        case 'short':
            setType('paragraphs');
            amountSlider.value = 1;
            wordsPerSentence.value = 'short';
            sentencesPerPara.value = 'short';
            flavorSelect.value = 'classic';
            break;

        case 'medium':
            setType('paragraphs');
            amountSlider.value = 3;
            wordsPerSentence.value = 'medium';
            sentencesPerPara.value = 'medium';
            flavorSelect.value = 'classic';
            break;

        case 'long':
            setType('paragraphs');
            amountSlider.value = 8;
            wordsPerSentence.value = 'long';
            sentencesPerPara.value = 'long';
            flavorSelect.value = 'classic';
            break;

        case 'web':
            setType('paragraphs');
            amountSlider.value = 3;
            wordsPerSentence.value = 'medium';
            sentencesPerPara.value = 'medium';
            document.querySelector('input[name="html-mode"][value="p"]').checked = true;
            break;

        case 'list':
            setType('list');
            amountSlider.value = 10;
            document.querySelector('input[name="html-mode"][value="list"]').checked = true;
            break;

        case 'words':
            setType('words');
            amountSlider.value = 50;
            break;
    }

    amountValue.innerText = amountSlider.value;
    outputBadge.innerText = currentType.toUpperCase();
    generate();
    showToast(`⚡ Preset applied: ${name}`);
}

// ============ COPY OUTPUT ============
function copyOutput() {
    const textToCopy = currentOutput;
    if (!textToCopy) return showToast('❌ Nothing to copy!', 'error');

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('📋 Copied to clipboard!');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('📋 Copied!');
    });
}

// ============ DOWNLOAD TXT ============
function downloadTxt() {
    if (!currentOutput) return showToast('❌ Nothing to download!', 'error');

    const blob = new Blob([currentOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `lorem-ipsum-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 TXT downloaded!');
}

// ============ DOWNLOAD HTML ============
function downloadHtml() {
    if (!currentOutput) return showToast('❌ Nothing to download!', 'error');

    const htmlMode = document.querySelector('input[name="html-mode"]:checked')?.value || 'none';
    let bodyContent = currentHtml;

    if (htmlMode === 'none') {
        bodyContent = escapeHtml(currentOutput).replace(/\n\n/g, '</p>\n<p>');
        bodyContent = `<p>${bodyContent}</p>`;
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lorem Ipsum - Generated by Tool Hub</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.7; color: #1e293b; }
        h1 { color: #2563eb; margin-bottom: 24px; }
        p, li { margin-bottom: 16px; text-align: justify; }
        ul { padding-left: 24px; }
    </style>
</head>
<body>
    <h1>Lorem Ipsum Content</h1>
    ${bodyContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `lorem-ipsum-${timestamp}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 HTML downloaded!');
}

// ============ PRINT OUTPUT ============
function printOutput() {
    if (!currentOutput) return showToast('❌ Nothing to print!', 'error');

    const htmlMode = document.querySelector('input[name="html-mode"]:checked')?.value || 'none';
    let bodyContent = currentHtml;

    if (htmlMode === 'none') {
        bodyContent = escapeHtml(currentOutput).replace(/\n\n/g, '</p>\n<p>');
        bodyContent = `<p>${bodyContent}</p>`;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <title>Lorem Ipsum - Print</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #1e293b; }
        h1 { color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        p, li { margin-bottom: 16px; text-align: justify; }
        ul { padding-left: 24px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>Lorem Ipsum Content</h1>
    ${bodyContent}
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 300);
    showToast('🖨️ Print dialog opened!');
}

// ============ CLEAR OUTPUT ============
function clearOutput() {
    if (!currentOutput) return showToast('❌ Already empty!', 'error');
    if (!confirm('Kya aap output clear karna chahte hain?')) return;

    currentOutput = '';
    currentHtml = '';
    outputContent.innerHTML = `
        <div class="empty-output">
            <i class="fa-solid fa-paragraph"></i>
            <p>Click <b>Generate</b> to create Lorem Ipsum text</p>
        </div>
    `;
    updateStats('', '');
    showToast('🧹 Output cleared!');
}

// ============ HELPERS ============
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============ SHARE ============
function shareTool() {
    const shareData = {
        title: 'Lorem Ipsum Generator - Tool Hub',
        text: 'Check out this free Lorem Ipsum Generator!',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('🔗 Link copied!');
        }).catch(() => {
            showToast('❌ Could not copy!', 'error');
        });
    }
}

// ============ TOAST ============
let toastTimeout;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');

    toastMsg.innerText = message;
    toast.classList.remove('error');

    if (type === 'error') {
        toast.classList.add('error');
        toastIcon.className = 'fa-solid fa-circle-exclamation';
    } else {
        toastIcon.className = 'fa-solid fa-circle-check';
    }

    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// ============ DARK MODE ============
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        document.body.classList.remove('dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('toolhub_theme', newTheme);
});

applyTheme(localStorage.getItem('toolhub_theme') || 'light');

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter → Generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generate();
        showToast('✅ Generated new text!');
    }
    // Ctrl/Cmd + Shift + C → Copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyOutput();
    }
    // Ctrl/Cmd + Shift + S → Download TXT
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        downloadTxt();
    }
    // Space (when not in input) → Regenerate
    if (e.key === ' ' && !e.target.matches('input, textarea, select, button')) {
        e.preventDefault();
        generate();
    }
});

// ============ INITIALIZE ============
generate();
amountValue.innerText = amountSlider.value;