/* ============================================================
   RANDOM NAME GENERATOR - Advanced Logic
   6 Name Types · 15 Nationalities · Batch · Export · History
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const rnCard         = document.getElementById("rnCard");
    const typeTabs       = document.querySelectorAll(".type-tab");

    const genderChips    = document.querySelectorAll(".gender-chip");
    const nationalitySelect = document.getElementById("nationalitySelect");
    const quantityInput  = document.getElementById("quantityInput");
    const qtyDecrease    = document.getElementById("qtyDecrease");
    const qtyIncrease    = document.getElementById("qtyIncrease");
    const qtyPresets     = document.querySelectorAll(".qty-preset");

    const includeMiddle  = document.getElementById("includeMiddle");
    const includeTitle   = document.getElementById("includeTitle");
    const includeSuffix  = document.getElementById("includeSuffix");
    const numbered       = document.getElementById("numbered");

    const rnError        = document.getElementById("rnError");
    const generateBtn    = document.getElementById("generateBtn");
    const clearBtn       = document.getElementById("clearBtn");

    const outputArea     = document.getElementById("outputArea");
    const nameCount      = document.getElementById("nameCount");
    const namesGrid      = document.getElementById("namesGrid");

    const copyAllBtn     = document.getElementById("copyAllBtn");
    const downloadTxtBtn = document.getElementById("downloadTxtBtn");
    const downloadCsvBtn = document.getElementById("downloadCsvBtn");
    const downloadJsonBtn= document.getElementById("downloadJsonBtn");
    const printBtn       = document.getElementById("printBtn");

    const rnHistoryList  = document.getElementById("rnHistoryList");
    const clearRnHistory = document.getElementById("clearRnHistory");

    /* ---------------- State ---------------- */
    let currentType      = "full";
    let currentGender    = "any";
    let lastNames        = [];
    let history          = loadHistory();

    /* ============================================================
       NAME DATABASE
       ============================================================ */

    // First names by nationality + gender
    const FIRST_NAMES = {
        english: {
            male: ["James","Oliver","William","Harry","Jack","George","Thomas","Charlie","Jacob","Alfred","Arthur","Edward","Henry","Freddie","Oscar","Archie","Leo","Joshua","Frederick","Albert"],
            female: ["Olivia","Amelia","Isla","Ava","Emily","Sophia","Grace","Poppy","Ella","Charlotte","Lily","Alice","Florence","Freya","Evie","Mia","Ruby","Rosie","Isabella","Jessica"],
        },
        american: {
            male: ["Liam","Noah","Ethan","Mason","Logan","Lucas","Jackson","Aiden","Elijah","James","Benjamin","Carter","Wyatt","Grayson","Leo","Jack","Owen","Luke","Henry","Caleb"],
            female: ["Emma","Olivia","Ava","Isabella","Sophia","Mia","Charlotte","Amelia","Harper","Evelyn","Abigail","Emily","Elizabeth","Mila","Ella","Avery","Sofia","Camila","Aria","Scarlett"],
        },
        indian: {
            male: ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Reyansh","Muhammad","Sai","Arnav","Ayaan","Krishna","Ishaan","Shaurya","Atharv","Advik","Pranav","Advaith","Aaryan","Dhruv","Kabir"],
            female: ["Saanvi","Aanya","Aadhya","Aaradhya","Ananya","Pari","Anika","Navya","Diya","Avni","Myra","Sara","Ira","Aahana","Anvi","Prisha","Riya","Aarohi","Anaya","Kavya"],
        },
        japanese: {
            male: ["Hiroto","Ren","Yuto","Sota","Yuki","Hayato","Haruto","Sota","Riku","Kaito","Takumi","Itsuki","Ryusei","Kazuki","Daiki","Shota","Taiga","Yuma","Sosuke","Keita"],
            female: ["Yui","Aoi","Sakura","Hina","Rin","Mei","Yuna","Akari","Himari","Hina","Saki","Miu","Yui","Riko","Ichika","Mio","Honoka","Kokona","Ayaka","Yuzuki"],
        },
        chinese: {
            male: ["Wei","Jun","Hao","Ming","Feng","Lei","Bo","Jian","Yong","Xin","Chen","Peng","Qiang","Tao","Yan","Zhi","Gang","Long","Kai","Bin"],
            female: ["Mei","Ling","Xiu","Yan","Fang","Jing","Li","Ping","Hui","Yun","Xia","Qing","Lan","Rui","Na","Ying","Xue","Zhen","Juan","Min"],
        },
        korean: {
            male: ["Min-jun","Seo-jun","Do-yun","Ji-ho","Ha-jun","Eun-woo","Si-woo","Jun-seo","Ye-jun","Ji-hu","Woo-jin","Hyun-woo","Seung-min","Jun-ho","Tae-yang","Ji-hoon","Min-jae","Sung-min","Jae-hyun","Yu-jun"],
            female: ["Seo-yeon","Ji-woo","Ha-eun","Seo-yun","Min-seo","Ji-yoo","Ye-eun","Soo-ah","Ji-min","Hye-jin","Eun-ji","Ye-rin","Ha-yun","Yu-na","Na-eun","Chae-won","A-yeong","Ju-won","Hae-in","Da-eun"],
        },
        arabic: {
            male: ["Ahmed","Mohammed","Omar","Ali","Hassan","Khalid","Yusuf","Ibrahim","Abdullah","Saeed","Faisal","Salem","Rashid","Hamdan","Zayed","Mansour","Tariq","Karim","Adel","Nasser"],
            female: ["Fatima","Aisha","Maryam","Zainab","Layla","Noura","Hind","Amal","Sara","Hessa","Latifa","Shamma","Moza","Noora","Rania","Yasmin","Salama","Alya","Reem","Maitha"],
        },
        french: {
            male: ["Gabriel","Louis","Raphaël","Jules","Adam","Maël","Lucas","Hugo","Arthur","Nathan","Théo","Paul","Tom","Éthan","Noah","Léo","Sacha","Aaron","Marius","Aaron"],
            female: ["Emma","Jade","Louise","Alice","Chloé","Léa","Lina","Rose","Anna","Mila","Ambre","Inès","Julia","Romane","Zoé","Juliette","Léna","Manon","Camille","Clara"],
        },
        german: {
            male: ["Leon","Finn","Paul","Elias","Louis","Felix","Noah","Ben","Emil","Lukas","Maximilian","Henry","Jonas","Oskar","Anton","Karl","Johann","Friedrich","Wilhelm","Hans"],
            female: ["Emma","Mia","Hannah","Sofia","Lina","Emilia","Marie","Lena","Anna","Lea","Leni","Amelie","Clara","Sophie","Ella","Johanna","Frieda","Greta","Elise","Charlotte"],
        },
        spanish: {
            male: ["Hugo","Mateo","Martín","Lucas","Leo","Daniel","Alejandro","Pablo","Manuel","Álvaro","Adrián","Enzo","Diego","David","Mario","Marcos","Javier","Antonio","Carlos","Miguel"],
            female: ["Lucía","Sofía","Martina","María","Julia","Paula","Emma","Daniela","Valeria","Alba","Carmen","Sara","Vega","Adriana","Olivia","Alejandra","Isabella","Elena","Ángela","Irene"],
        },
        italian: {
            male: ["Leonardo","Francesco","Alessandro","Lorenzo","Matteo","Andrea","Gabriele","Riccardo","Tommaso","Edoardo","Giuseppe","Antonio","Marco","Luca","Giovanni","Roberto","Salvatore","Nicola","Federico","Daniele"],
            female: ["Sofia","Giulia","Aurora","Alice","Ginevra","Emma","Giorgia","Greta","Beatrice","Anna","Chiara","Vittoria","Matilde","Ludovica","Sara","Nicole","Martina","Camilla","Alessia","Bianca"],
        },
        russian: {
            male: ["Aleksandr","Dmitri","Ivan","Maksim","Sergei","Andrei","Nikolai","Mikhail","Vladimir","Aleksei","Artyom","Kirill","Yegor","Matvey","Roman","Timur","Fyodor","Boris","Viktor","Pavel"],
            female: ["Anastasia","Maria","Daria","Anna","Viktoria","Polina","Elizaveta","Sofia","Ksenia","Alisa","Ekaterina","Alexandra","Milana","Valeria","Varvara","Arina","Yulia","Natalia","Olga","Tatiana"],
        },
        brazilian: {
            male: ["Miguel","Arthur","Gabriel","Pedro","Lucas","Matheus","Rafael","Enzo","Guilherme","Gustavo","Felipe","João","Davi","Bruno","Thiago","Vitor","Caio","Leonardo","Bernardo","Heitor"],
            female: ["Alice","Sophia","Helena","Valentina","Laura","Isabella","Manuela","Júlia","Heloísa","Luiza","Lorena","Beatriz","Cecília","Maria","Alice","Ana","Lívia","Emanuelly","Mariana","Yasmin"],
        },
        nigerian: {
            male: ["Chinedu","Emeka","Ifeanyi","Obinna","Chukwuemeka","Adebayo","Oluwaseun","Babajide","Kelechi","Tochukwu","Nnamdi","Ikenna","Onyeka","Uche","Chidi","Uchenna","Azubuike","Olamide","Tunde","Femi"],
            female: ["Adaeze","Chioma","Ngozi","Amarachi","Chiamaka","Oluwakemi","Yetunde","Folake","Bukola","Titilayo","Nkechi","Ifeoma","Chidinma","Amaka","Ada","Ebere","Chinaza","Yemisi","Abiodun","Rashidat"],
        },
        pakistani: {
            male: ["Muhammad","Ahmed","Ali","Hassan","Hussain","Usman","Abdullah","Bilal","Hamza","Saad","Umar","Zain","Fahad","Talha","Ibrahim","Yusuf","Ayan","Rehan","Danish","Faizan"],
            female: ["Fatima","Ayesha","Zainab","Maryam","Hafsa","Khadija","Aisha","Sana","Hira","Areeba","Eman","Iqra","Mahnoor","Laiba","Anaya","Hoorain","Zara","Amna","Eshal","Noor"],
        },
    };

    // Last names by nationality
    const LAST_NAMES = {
        english: ["Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Robinson","Wright","Thompson","Evans","Walker","White","Roberts","Green","Hall","Wood","Jackson","Clarke"],
        american: ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin"],
        indian: ["Sharma","Verma","Patel","Kumar","Singh","Gupta","Reddy","Rao","Nair","Iyer","Joshi","Mehta","Shah","Desai","Chopra","Kapoor","Malhotra","Bhat","Menon","Pillai"],
        japanese: ["Sato","Suzuki","Takahashi","Tanaka","Watanabe","Ito","Yamamoto","Nakamura","Kobayashi","Kato","Yoshida","Yamada","Sasaki","Yamaguchi","Matsumoto","Inoue","Kimura","Hayashi","Shimizu","Saito"],
        chinese: ["Wang","Li","Zhang","Liu","Chen","Yang","Huang","Zhao","Wu","Zhou","Xu","Sun","Ma","Zhu","Hu","Guo","Lin","He","Gao","Luo"],
        korean: ["Kim","Lee","Park","Choi","Jung","Kang","Cho","Yoon","Jang","Lim","Han","Oh","Seo","Shin","Kwon","Hwang","Ahn","Song","Yoo","Hong"],
        arabic: ["Al-Sayed","Al-Ahmad","Al-Hassan","Al-Ali","Al-Mansour","Al-Khalifa","Al-Rashid","Al-Farsi","Al-Nasser","Al-Hashimi","Al-Saud","Al-Otaibi","Al-Qahtani","Al-Dosari","Al-Mutairi","Al-Shammari","Al-Zahrani","Al-Ghamdi","Al-Amri","Al-Harbi"],
        french: ["Martin","Bernard","Dubois","Thomas","Robert","Richard","Petit","Durand","Leroy","Moreau","Simon","Laurent","Lefebvre","Michel","Garcia","David","Bertrand","Roux","Vincent","Fournier"],
        german: ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Schäfer","Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Zimmermann"],
        spanish: ["García","Rodríguez","González","Fernández","López","Martínez","Sánchez","Pérez","Gómez","Martín","Jiménez","Ruiz","Hernández","Díaz","Moreno","Muñoz","Álvarez","Romero","Alonso","Gutiérrez"],
        italian: ["Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Mancini","Costa","Giordano","Rizzo","Lombardi","Moretti"],
        russian: ["Ivanov","Smirnov","Kuznetsov","Popov","Vasiliev","Petrov","Sokolov","Mikhailov","Novikov","Fedorov","Morozov","Volkov","Alekseev","Lebedev","Semenov","Egorov","Pavlov","Kozlov","Stepanov","Nikolaev"],
        brazilian: ["Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Alves","Pereira","Lima","Gomes","Costa","Ribeiro","Martins","Carvalho","Almeida","Lopes","Soares","Fernandes","Vieira","Barbosa"],
        nigerian: ["Adebayo","Okafor","Okonkwo","Eze","Nwosu","Adeyemi","Ojo","Balogun","Okoro","Ibrahim","Chukwu","Afolabi","Obi","Ezeh","Adeleke","Onyeka","Nwachukwu","Adegbite","Bello","Uche"],
        pakistani: ["Khan","Ahmed","Ali","Hussain","Malik","Sheikh","Butt","Chaudhry","Qureshi","Siddiqui","Raza","Syed","Baig","Awan","Hashmi","Farooq","Iqbal","Aslam","Akhtar","Nawaz"],
    };

    // Usernames wordlist
    const USERNAME_ADJ = ["swift","happy","cool","bright","brave","silent","clever","epic","cosmic","neon","shadow","storm","thunder","fire","ice","lucky","wild","dark","golden","silver","mystic","cyber","ultra","alpha","omega","turbo","hyper","mega","ninja","star"];
    const USERNAME_NOUN = ["wolf","hawk","fox","dragon","tiger","lion","bear","eagle","panther","cobra","raven","phoenix","falcon","shark","leopard","jaguar","lynx","viper","orca","python","knight","samurai","wizard","master","hunter","rider","ninja","sniper","gamer","coder"];

    // Business
    const BUSINESS_PREFIX = ["Global","Apex","Prime","Nova","Bright","Stellar","Elite","Premier","Prime","Ace","Zenith","Peak","Fusion","Vertex","Quantum","Vanguard","Ascend","Pinnacle","Summit","Echo"];
    const BUSINESS_NOUN = ["Solutions","Systems","Technologies","Industries","Ventures","Labs","Dynamics","Group","Enterprises","Analytics","Innovations","Partners","Consulting","Networks","Digital","Software","Studios","Media","Logistics","Capital"];
    const BUSINESS_SUFFIX = ["Inc","LLC","Corp","Co","Ltd","Group","Holdings","Enterprises","Global","International"];

    // Fantasy
    const FANTASY_PREFIX = ["Ael","Thal","Vor","Drak","Syl","Zeph","Kor","Mir","Nyx","Ser","Fen","Bel","Cal","Dun","El","Fae","Gor","Hal","Ith","Jor","Kel","Lor","Mor","Nor","Or","Per","Quel","Rav","Sil","Tar"];
    const FANTASY_SUFFIX = ["rion","driel","mir","thas","gorn","wyn","iel","thar","lorn","ven","neth","reth","dorn","vir","kar","mar","thiel","rond","vyn","nor","dun","thir","reth","ion","dral","vian","andor","lith","mir","don"];

    // Titles
    const TITLES_MALE = ["Mr.","Dr.","Prof.","Sir","Lord"];
    const TITLES_FEMALE = ["Ms.","Mrs.","Dr.","Prof.","Lady"];
    const SUFFIXES = ["Jr.","Sr.","II","III","IV"];

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_randomname_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }
    function saveHistory() {
        try {
            const meta = history.slice(0, 12).map((h) => ({
                type: h.type,
                count: h.count,
                preview: h.preview,
                time: h.time,
            }));
            localStorage.setItem("toolhub_randomname_history", JSON.stringify(meta));
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

    function rand(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function capitalize(s) {
        if (!s) return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function pickNames(dataset, gender) {
        // If gender is "any", pick either male or female randomly
        let effGender = gender;
        if (effGender === "any") {
            effGender = Math.random() < 0.5 ? "male" : "female";
        }
        const list = dataset[effGender] || dataset.male || [];
        return list;
    }

    function showError(msg) {
        rnError.textContent = msg;
        rnError.classList.add("show");
        rnError.style.animation = "none";
        void rnError.offsetWidth;
        rnError.style.animation = "";
    }
    function hideError() {
        rnError.classList.remove("show");
        rnError.textContent = "";
    }

    /* ============================================================
       NAME GENERATORS
       ============================================================ */
    function getRandomNationality() {
        const keys = Object.keys(FIRST_NAMES);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    function generateFullName(gender, nationality, opts) {
        const nat = nationality === "all" ? getRandomNationality() : nationality;
        const firstList = pickNames(FIRST_NAMES[nat] || FIRST_NAMES.english, gender);
        const lastList = LAST_NAMES[nat] || LAST_NAMES.english;

        const firstName = rand(firstList);
        const lastName = rand(lastList);

        // Determine effective gender for title
        let effGender = gender;
        if (effGender === "any") effGender = Math.random() < 0.5 ? "male" : "female";

        let parts = [];

        if (opts.title) {
            const titleList = effGender === "female" ? TITLES_FEMALE : TITLES_MALE;
            parts.push(rand(titleList));
        }

        parts.push(firstName);

        if (opts.middle) {
            const middleList = pickNames(FIRST_NAMES[nat] || FIRST_NAMES.english, effGender);
            parts.push(rand(middleList));
        }

        parts.push(lastName);

        if (opts.suffix) {
            parts.push(rand(SUFFIXES));
        }

        return parts.join(" ");
    }

    function generateFirstName(gender, nationality) {
        const nat = nationality === "all" ? getRandomNationality() : nationality;
        const list = pickNames(FIRST_NAMES[nat] || FIRST_NAMES.english, gender);
        return rand(list);
    }

    function generateLastName(nationality) {
        const nat = nationality === "all" ? getRandomNationality() : nationality;
        const list = LAST_NAMES[nat] || LAST_NAMES.english;
        return rand(list);
    }

    function generateUsername() {
        const adj = rand(USERNAME_ADJ);
        const noun = rand(USERNAME_NOUN);
        const num = Math.floor(Math.random() * 999) + 1;

        const patterns = [
            () => `${adj}_${noun}`,
            () => `${adj}${noun}`,
            () => `${adj}_${noun}_${num}`,
            () => `${adj}${num}`,
            () => `${noun}_${adj}`,
            () => `${adj}${capitalize(noun)}${num}`,
            () => `${adj}${num}${noun}`,
        ];

        return rand(patterns)();
    }

    function generateBusinessName() {
        const patterns = [
            () => `${rand(BUSINESS_PREFIX)} ${rand(BUSINESS_NOUN)}`,
            () => `${rand(BUSINESS_PREFIX)} ${rand(BUSINESS_NOUN)} ${rand(BUSINESS_SUFFIX)}`,
            () => `${rand(BUSINESS_NOUN)} ${rand(BUSINESS_SUFFIX)}`,
            () => `${rand(BUSINESS_PREFIX)}${rand(BUSINESS_NOUN)}`,
        ];
        return rand(patterns)();
    }

    function generateFantasyName() {
        const patterns = [
            () => `${rand(FANTASY_PREFIX)}${rand(FANTASY_SUFFIX)}`,
            () => `${rand(FANTASY_PREFIX)}${rand(FANTASY_SUFFIX)}${rand(FANTASY_SUFFIX)}`,
            () => `${rand(FANTASY_PREFIX)}${rand(FANTASY_SUFFIX)} ${rand(FANTASY_PREFIX)}${rand(FANTASY_SUFFIX)}`,
        ];
        return capitalize(rand(patterns)());
    }

    /* ============================================================
       GENERATION
       ============================================================ */
    function generate() {
        hideError();

        let qty = parseInt(quantityInput.value, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        if (qty > 200) qty = 200;
        quantityInput.value = qty;

        const nationality = nationalitySelect.value;
        const opts = {
            middle: includeMiddle.checked,
            title: includeTitle.checked,
            suffix: includeSuffix.checked,
        };

        const names = [];
        const seen = new Set();
        const maxAttempts = qty * 5;
        let attempts = 0;

        while (names.length < qty && attempts < maxAttempts) {
            let name;
            switch (currentType) {
                case "full":     name = generateFullName(currentGender, nationality, opts); break;
                case "first":    name = generateFirstName(currentGender, nationality); break;
                case "last":     name = generateLastName(nationality); break;
                case "username": name = generateUsername(); break;
                case "business": name = generateBusinessName(); break;
                case "fantasy":  name = generateFantasyName(); break;
                default:         name = generateFullName(currentGender, nationality, opts);
            }

            // Dedupe (for large quantities, uniqueness may be impossible for some types)
            if (!seen.has(name)) {
                seen.add(name);
                names.push(name);
            } else {
                // Try different variant
                if (currentType === "username" || currentType === "fantasy" || currentType === "business") {
                    // Accept duplicates for these types if cannot find unique
                    names.push(name);
                } else {
                    // Retry
                }
            }
            attempts++;
        }

        if (names.length === 0) {
            showError("⚠️ Could not generate names. Try increasing quantity.");
            return;
        }

        lastNames = names;
        renderNames(names);
        outputArea.style.display = "block";

        // History
        pushHistory({
            type: currentType,
            count: names.length,
            preview: names.slice(0, 2).join(", ") + (names.length > 2 ? "…" : ""),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });

        if (typeof showToast === "function") {
            showToast(`✨ Generated ${names.length} name${names.length !== 1 ? "s" : ""}`);
        }

        // Scroll
        setTimeout(() => {
            const r = outputArea.getBoundingClientRect();
            if (r.top > window.innerHeight - 100) {
                outputArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }, 100);
    }

    /* ============================================================
       RENDER NAMES
       ============================================================ */
    function renderNames(names) {
        nameCount.textContent = names.length;
        namesGrid.innerHTML = names.map((name, i) => `
            <div class="name-item" data-idx="${i}" style="animation-delay:${Math.min(i, 20) * 0.02}s">
                <span class="name-num">${numbered.checked ? "#" + (i + 1) : ""}</span>
                <span class="name-value">${escapeHtml(name)}</span>
                <button class="name-copy" data-copy="${escapeHtml(name)}" title="Copy">
                    <i class="fa-solid fa-copy"></i>
                </button>
            </div>
        `).join("");

        // Copy handlers
        namesGrid.querySelectorAll(".name-copy").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                copyToClipboard(btn.dataset.copy);
            });
        });

        // Click on item also copies
        namesGrid.querySelectorAll(".name-item").forEach((el) => {
            el.addEventListener("click", (e) => {
                if (e.target.closest(".name-copy")) return;
                const name = el.querySelector(".name-value").textContent;
                copyToClipboard(name);
            });
        });
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

    function getFormattedList(separator) {
        return lastNames.map((n, i) => numbered.checked ? `${i + 1}${separator}${n}` : n).join("\n");
    }

    copyAllBtn.addEventListener("click", () => {
        if (lastNames.length === 0) return;
        copyToClipboard(lastNames.join("\n"));
    });

    downloadTxtBtn.addEventListener("click", () => {
        if (lastNames.length === 0) return;
        const text = lastNames.join("\n");
        downloadFile(text, "random-names.txt", "text/plain");
    });

    downloadCsvBtn.addEventListener("click", () => {
        if (lastNames.length === 0) return;
        let csv = "Index,Name\n";
        csv += lastNames.map((n, i) => `${i + 1},"${n.replace(/"/g, '""')}"`).join("\n");
        downloadFile(csv, "random-names.csv", "text/csv");
    });

    downloadJsonBtn.addEventListener("click", () => {
        if (lastNames.length === 0) return;
        const json = JSON.stringify({
            type: currentType,
            gender: currentGender,
            nationality: nationalitySelect.value,
            count: lastNames.length,
            generated: new Date().toISOString(),
            names: lastNames,
        }, null, 2);
        downloadFile(json, "random-names.json", "application/json");
    });

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        if (typeof showToast === "function") showToast("📥 Downloaded");
    }

    printBtn.addEventListener("click", () => {
        if (lastNames.length === 0) return;
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
                <title>Random Names</title>
                <style>
                    body { font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; }
                    h1 { font-size: 1.4rem; margin-bottom: 16px; }
                    ol { font-size: 1rem; line-height: 1.8; padding-left: 24px; }
                    @media print { @page { margin: 16mm; } }
                </style>
            </head>
            <body>
                <h1>Random Names (${lastNames.length})</h1>
                <ol>${lastNames.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ol>
            </body>
            </html>
        `);
        w.document.close();
        w.onload = () => setTimeout(() => w.print(), 300);
    });

    /* ============================================================
       CLEAR
       ============================================================ */
    function clearAll() {
        lastNames = [];
        outputArea.style.display = "none";
        namesGrid.innerHTML = "";
        hideError();
        if (typeof showToast === "function") showToast("🧹 Cleared");
    }

    clearBtn.addEventListener("click", clearAll);

    /* ============================================================
       TYPE TABS
       ============================================================ */
    typeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            typeTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            currentType = tab.dataset.type;
            hideError();

            // Hide irrelevant options for certain types
            const fullOnlyRow = document.getElementById("fullNameOnlyOptions");
            const genderBlock = document.querySelector('[data-block="gender"]');

            // Show/hide gender (not relevant for business / fantasy / username)
            const showGender = ["full", "first"].includes(currentType);
            document.querySelectorAll(".opt-block")[0].style.display = showGender ? "flex" : "none";

            // Hide nationality for business / fantasy / username
            const showNat = ["full", "first", "last"].includes(currentType);
            document.querySelectorAll(".opt-block")[1].style.display = showNat ? "flex" : "none";

            // Hide middle/title/suffix for non-full types
            const fmtOptions = document.querySelectorAll(".format-options .fmt-chip");
            fmtOptions.forEach((opt, idx) => {
                if (idx < 3) {
                    opt.style.display = currentType === "full" ? "flex" : "none";
                }
            });
        });
    });

    /* ============================================================
       GENDER CHIPS
       ============================================================ */
    genderChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            genderChips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            currentGender = chip.dataset.gender;
        });
    });

    /* ============================================================
       QUANTITY
       ============================================================ */
    qtyDecrease.addEventListener("click", () => {
        let v = parseInt(quantityInput.value, 10) || 1;
        v = Math.max(1, v - 1);
        quantityInput.value = v;
        updateQtyPresets();
    });

    qtyIncrease.addEventListener("click", () => {
        let v = parseInt(quantityInput.value, 10) || 1;
        v = Math.min(200, v + 1);
        quantityInput.value = v;
        updateQtyPresets();
    });

    quantityInput.addEventListener("input", updateQtyPresets);

    function updateQtyPresets() {
        const val = parseInt(quantityInput.value, 10);
        qtyPresets.forEach((p) => {
            p.classList.toggle("active", parseInt(p.dataset.qty, 10) === val);
        });
    }

    qtyPresets.forEach((btn) => {
        btn.addEventListener("click", () => {
            quantityInput.value = btn.dataset.qty;
            updateQtyPresets();
        });
    });

    /* ============================================================
       GENERATE
       ============================================================ */
    generateBtn.addEventListener("click", generate);

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
            rnHistoryList.innerHTML = '<div class="empty-history">No generations yet</div>';
            return;
        }
        rnHistoryList.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}" style="animation-delay:${i * 0.03}s">
                <div class="hi-thumb"><i class="fa-solid fa-user"></i></div>
                <div class="hi-info">
                    <div class="hi-name">${escapeHtml(h.preview)}</div>
                    <div class="hi-meta">${escapeHtml(h.type)} · ${h.count} name${h.count !== 1 ? "s" : ""}</div>
                </div>
                <div class="hi-time">${escapeHtml(h.time)}</div>
            </div>
        `).join("");

        rnHistoryList.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (!h) return;
                // Reset to that type
                const tab = Array.from(typeTabs).find((t) => t.dataset.type === h.type);
                if (tab) tab.click();
                quantityInput.value = Math.min(h.count, 200);
                updateQtyPresets();
                generate();
            });
        });
    }

    clearRnHistory.addEventListener("click", () => {
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
            generate();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && !typing && !window.getSelection().toString()) {
            if (lastNames.length > 0) {
                e.preventDefault();
                copyAllBtn.click();
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
    window.shareRandomName = function () {
        const shareData = {
            title: "Random Name Generator - Tool Hub",
            text: "Generate realistic random names for testing, games & creative writing!",
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
        updateQtyPresets();
        renderHistory();
        // Auto-generate a few names on load
        setTimeout(() => {
            if (lastNames.length === 0) {
                quantityInput.value = 10;
                updateQtyPresets();
                generate();
            }
        }, 400);
    }

    init();
})();