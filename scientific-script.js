/* ============================================================
   SCIENTIFIC CALCULATOR - Advanced Logic
   Tokenizer + Parser (Shunting-yard) → RPN Evaluator
   ============================================================ */

(function () {
    "use strict";

    /* ---------------- DOM ---------------- */
    const sciCard        = document.getElementById("sciCard");
    const expressionEl   = document.getElementById("expression");
    const previewEl      = document.getElementById("previewResult");
    const memoryInd      = document.getElementById("memoryIndicator");
    const historyToggle  = document.getElementById("historyToggle");
    const historyPanel   = document.getElementById("historyPanel");
    const historyItems   = document.getElementById("historyItems");
    const clearHistoryBtn= document.getElementById("clearHistoryBtn");
    const angleBtns      = document.querySelectorAll(".angle-btn");

    /* ---------------- State ---------------- */
    let expression  = "";
    let angleMode   = "deg"; // deg | rad | grad
    let memory      = 0;
    let lastAnswer  = 0;
    let history     = loadHistory();

    /* ============================================================
       STORAGE
       ============================================================ */
    function loadHistory() {
        try {
            const raw = localStorage.getItem("toolhub_scicalc_history");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return [];
    }

    function saveHistory() {
        try {
            localStorage.setItem("toolhub_scicalc_history", JSON.stringify(history.slice(0, 30)));
        } catch (e) {}
    }

    /* ============================================================
       DISPLAY
       ============================================================ */
    function renderDisplay() {
        // Show expression (or 0 if empty)
        let shown = expression || "0";
        // Nicer visual: replace * with ×, / with ÷, pi symbol
        shown = shown
            .replace(/\*/g, "×")
            .replace(/\//g, "÷")
            .replace(/Math\.PI/g, "π")
            .replace(/Math\.E/g, "e");

        expressionEl.textContent = shown;

        // Live preview
        if (!expression) {
            previewEl.textContent = "";
            previewEl.classList.remove("error");
            return;
        }

        const preview = safeEvaluate(expression, { silent: true });
        if (preview !== null && isFinite(preview)) {
            previewEl.textContent = "= " + formatNumber(preview);
            previewEl.classList.remove("error");
        } else {
            previewEl.textContent = "";
            previewEl.classList.remove("error");
        }
    }

    function formatNumber(n) {
        if (!isFinite(n)) return "Error";
        if (Math.abs(n) < 1e-10 && n !== 0) return n.toExponential(6);
        if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-4 && n !== 0)) {
            return n.toExponential(8).replace(/\.?0+e/, "e");
        }
        // Round to avoid float errors
        const rounded = Math.round(n * 1e10) / 1e10;
        return rounded.toString();
    }

    /* ============================================================
       TOKENIZER + EVALUATOR (Shunting-yard)
       Supports: + - * / % ^ mod, unary -, parentheses, functions
       Functions: sin cos tan asin acos atan ln log log2 exp sqrt cbrt
                  abs fact (n!) pi e
       ============================================================ */

    // Convert degrees/rad/grad to radians for trig
    function toRadians(v) {
        if (angleMode === "deg") return v * Math.PI / 180;
        if (angleMode === "grad") return v * Math.PI / 200;
        return v;
    }
    function fromRadians(v) {
        if (angleMode === "deg") return v * 180 / Math.PI;
        if (angleMode === "grad") return v * 200 / Math.PI;
        return v;
    }

    // Pre-process expression string: replace visual symbols & tokens
    function normalizeExpression(expr) {
        return expr
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .replace(/−/g, "-")
            .replace(/π/g, "pi")
            .replace(/\^/g, "^")
            .replace(/\s+/g, "");
    }

    // Tokenizer
    function tokenize(str) {
        const tokens = [];
        let i = 0;
        const isDigit = (c) => /[0-9.]/.test(c);
        const isLetter = (c) => /[a-zA-Z]/.test(c);

        while (i < str.length) {
            const c = str[i];

            if (/\s/.test(c)) { i++; continue; }

            if (isDigit(c)) {
                let num = "";
                while (i < str.length && /[0-9.]/.test(str[i])) {
                    num += str[i++];
                }
                // Scientific notation e+
                if ((str[i] === "e" || str[i] === "E") &&
                    (str[i+1] === "+" || str[i+1] === "-" || /[0-9]/.test(str[i+1] || ""))) {
                    num += "e";
                    i++;
                    if (str[i] === "+" || str[i] === "-") num += str[i++];
                    while (i < str.length && /[0-9]/.test(str[i])) num += str[i++];
                }
                tokens.push({ type: "num", value: parseFloat(num) });
                continue;
            }

            if (isLetter(c)) {
                let word = "";
                while (i < str.length && isLetter(str[i])) word += str[i++];
                tokens.push({ type: "func", value: word.toLowerCase() });
                continue;
            }

            // Operators & parens
            if ("+-*/%^()!".includes(c)) {
                if (c === "!" && tokens.length > 0) {
                    // Postfix factorial
                    tokens.push({ type: "op", value: "!" });
                } else {
                    tokens.push({ type: "op", value: c });
                }
                i++;
                continue;
            }

            // Unknown
            i++;
        }
        return tokens;
    }

    // Shunting-yard → RPN
    const PRECEDENCE = {
        "+": 1, "-": 1,
        "*": 2, "/": 2, "%": 2,
        "u-": 4, // unary minus
        "^": 5,
        "mod": 2,
        "!": 6,
    };

    const RIGHT_ASSOC = { "^": true, "u-": true };
    const FUNCTIONS = new Set([
        "sin","cos","tan","asin","acos","atan",
        "ln","log","log2","exp","sqrt","cbrt","abs",
    ]);

    function toRPN(tokens) {
        const output = [];
        const opStack = [];
        let prevType = null; // to detect unary

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];

            if (t.type === "num") {
                output.push(t);
                prevType = "num";
                continue;
            }

            if (t.type === "func") {
                // Constant?
                if (t.value === "pi") {
                    output.push({ type: "num", value: Math.PI });
                    prevType = "num";
                } else if (t.value === "e") {
                    output.push({ type: "num", value: Math.E });
                    prevType = "num";
                } else if (t.value === "ans") {
                    output.push({ type: "num", value: lastAnswer });
                    prevType = "num";
                } else if (FUNCTIONS.has(t.value)) {
                    opStack.push({ type: "func", value: t.value });
                    prevType = "func";
                } else {
                    throw new Error("Unknown function: " + t.value);
                }
                continue;
            }

            if (t.type === "op") {
                const op = t.value;

                // Detect unary minus
                if (op === "-" && (prevType === null || prevType === "op" || prevType === "func")) {
                    // It's unary
                    opStack.push({ type: "op", value: "u-", prec: PRECEDENCE["u-"] });
                    prevType = "op";
                    continue;
                }

                if (op === "(") {
                    opStack.push(t);
                    prevType = "op";
                    continue;
                }

                if (op === ")") {
                    while (opStack.length && opStack[opStack.length - 1].value !== "(") {
                        output.push(opStack.pop());
                    }
                    if (!opStack.length) throw new Error("Mismatched parentheses");
                    opStack.pop(); // remove (
                    // If top of stack is a function, pop it now
                    if (opStack.length && opStack[opStack.length - 1].type === "func") {
                        output.push(opStack.pop());
                    }
                    prevType = "num";
                    continue;
                }

                // Normal binary operator
                const prec = PRECEDENCE[op];
                if (prec === undefined) throw new Error("Unknown operator: " + op);

                while (
                    opStack.length &&
                    opStack[opStack.length - 1].type !== "func" &&
                    opStack[opStack.length - 1].value !== "(" &&
                    (
                        PRECEDENCE[opStack[opStack.length - 1].value] > prec ||
                        (PRECEDENCE[opStack[opStack.length - 1].value] === prec && !RIGHT_ASSOC[op])
                    )
                ) {
                    output.push(opStack.pop());
                }
                opStack.push({ type: "op", value: op, prec });
                prevType = "op";
                continue;
            }
        }

        while (opStack.length) {
            const top = opStack.pop();
            if (top.value === "(") throw new Error("Mismatched parentheses");
            output.push(top);
        }
        return output;
    }

    // Factorial helper
    function factorial(n) {
        if (n < 0) throw new Error("Factorial of negative");
        if (!Number.isInteger(n)) throw new Error("Factorial requires integer");
        if (n > 170) return Infinity;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }

    // Evaluate RPN
    function evalRPN(rpn) {
        const stack = [];
        for (const t of rpn) {
            if (t.type === "num") {
                stack.push(t.value);
                continue;
            }
            if (t.type === "func") {
                if (stack.length < 1) throw new Error("Missing operand");
                const a = stack.pop();
                let res;
                switch (t.value) {
                    case "sin": res = Math.sin(toRadians(a)); break;
                    case "cos": res = Math.cos(toRadians(a)); break;
                    case "tan":
                        // Check for undefined tan
                        {
                            const rad = toRadians(a);
                            const c = Math.cos(rad);
                            if (Math.abs(c) < 1e-12) throw new Error("tan undefined");
                            res = Math.tan(rad);
                        }
                        break;
                    case "asin":
                        if (a < -1 || a > 1) throw new Error("asin domain [-1,1]");
                        res = fromRadians(Math.asin(a)); break;
                    case "acos":
                        if (a < -1 || a > 1) throw new Error("acos domain [-1,1]");
                        res = fromRadians(Math.acos(a)); break;
                    case "atan": res = fromRadians(Math.atan(a)); break;
                    case "ln":
                        if (a <= 0) throw new Error("ln domain > 0");
                        res = Math.log(a); break;
                    case "log":
                        if (a <= 0) throw new Error("log domain > 0");
                        res = Math.log10(a); break;
                    case "log2":
                        if (a <= 0) throw new Error("log₂ domain > 0");
                        res = Math.log2(a); break;
                    case "exp": res = Math.exp(a); break;
                    case "sqrt":
                        if (a < 0) throw new Error("√ of negative");
                        res = Math.sqrt(a); break;
                    case "cbrt": res = Math.cbrt(a); break;
                    case "abs": res = Math.abs(a); break;
                    default: throw new Error("Unknown fn");
                }
                stack.push(res);
                continue;
            }
            if (t.type === "op") {
                if (t.value === "u-") {
                    if (stack.length < 1) throw new Error("Missing operand");
                    stack.push(-stack.pop());
                    continue;
                }
                if (t.value === "!") {
                    if (stack.length < 1) throw new Error("Missing operand");
                    stack.push(factorial(stack.pop()));
                    continue;
                }
                if (stack.length < 2) throw new Error("Missing operands");
                const b = stack.pop();
                const a = stack.pop();
                let res;
                switch (t.value) {
                    case "+": res = a + b; break;
                    case "-": res = a - b; break;
                    case "*": res = a * b; break;
                    case "/":
                        if (b === 0) throw new Error("Division by zero");
                        res = a / b;
                        break;
                    case "%": res = a % b; break;
                    case "^": res = Math.pow(a, b); break;
                    default: throw new Error("Unknown op");
                }
                stack.push(res);
                continue;
            }
        }
        if (stack.length !== 1) throw new Error("Invalid expression");
        return stack[0];
    }

    function safeEvaluate(expr, opts = {}) {
        try {
            const norm = normalizeExpression(expr);
            const tokens = tokenize(norm);
            // Auto-close unclosed parens
            let openCount = 0;
            for (const t of tokens) {
                if (t.value === "(") openCount++;
                else if (t.value === ")") openCount--;
            }
            let finalTokens = tokens.slice();
            for (let i = 0; i < openCount; i++) finalTokens.push({ type: "op", value: ")" });

            const rpn = toRPN(finalTokens);
            const result = evalRPN(rpn);
            if (!isFinite(result) && !opts.silent) throw new Error("Math error");
            return result;
        } catch (e) {
            if (opts.silent) return null;
            throw e;
        }
    }

    /* ============================================================
       EXPRESSION BUILDING
       ============================================================ */
    function appendToken(str) {
        expression += str;
        renderDisplay();
    }

    function appendNumber(num) {
        expression += num;
        renderDisplay();
    }

    function handleFunction(fn) {
        switch (fn) {
            case "sin":  expression += "sin("; break;
            case "cos":  expression += "cos("; break;
            case "tan":  expression += "tan("; break;
            case "asin": expression += "asin("; break;
            case "acos": expression += "acos("; break;
            case "atan": expression += "atan("; break;
            case "ln":   expression += "ln("; break;
            case "log":  expression += "log("; break;
            case "log2": expression += "log2("; break;
            case "exp":  expression += "exp("; break;
            case "tenPow": expression += "10^("; break;
            case "pow":  expression += "^"; break;
            case "sqrt": expression += "sqrt("; break;
            case "cbrt": expression += "cbrt("; break;
            case "sq":   expression += "^2"; break;
            case "cube": expression += "^3"; break;
            case "fact": expression += "!"; break;
            case "inv":  expression += "1/("; break;
            case "pi":   expression += "pi"; break;
            case "e":    expression += "e"; break;
            case "abs":  expression += "abs("; break;
            case "mod":  expression += "mod"; break;   // can handle in tokenizer? Add
            case "rand": expression += Math.random().toFixed(10); break;
            case "ans":  expression += "ans"; break;
        }
        renderDisplay();
    }

    function handleAction(action) {
        switch (action) {
            case "clear":
                expression = "";
                break;
            case "backspace":
                expression = expression.slice(0, -1);
                break;
            case "percent":
                // Convert last number to percentage
                expression += "/100";
                break;
            case "divide":   expression += "/"; break;
            case "multiply": expression += "*"; break;
            case "subtract": expression += "-"; break;
            case "add":      expression += "+"; break;
            case "negate":
                // Wrap expression with (-...)
                if (expression.startsWith("-")) expression = expression.slice(1);
                else expression = "-" + expression;
                break;
            case "equals":
                doEquals();
                return;
        }
        renderDisplay();
    }

    function doEquals() {
        if (!expression) return;
        try {
            const result = safeEvaluate(expression);
            if (!isFinite(result)) throw new Error("Math error");
            lastAnswer = result;
            const answer = formatNumber(result);

            // Push to history
            pushHistory(expression, answer);

            // Show result
            expressionEl.textContent = expression
                .replace(/\*/g, "×").replace(/\//g, "÷");
            previewEl.textContent = "= " + answer;
            previewEl.classList.remove("error");

            // Replace expression with the answer for chaining
            expression = answer;
            // But keep display showing original, then next input replaces
            setTimeout(() => {
                // After brief delay, keep the answer as new expression
                renderDisplay();
            }, 50);

            if (typeof showToast === "function") {
                // quietly
            }
        } catch (e) {
            previewEl.textContent = "Error: " + e.message;
            previewEl.classList.add("error");
            if (typeof showToast === "function") {
                showToast("⚠️ " + e.message, "error");
            }
            // Vibrate on error (mobile)
            if (navigator.vibrate) navigator.vibrate(60);
        }
    }

    /* ============================================================
       HISTORY
       ============================================================ */
    function pushHistory(expr, answer) {
        history.unshift({
            expr,
            answer,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        if (history.length > 30) history.pop();
        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyItems.innerHTML = '<div class="empty-history">No calculations yet</div>';
            return;
        }
        historyItems.innerHTML = history.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <div class="h-expr">${escapeHtml(h.expr.replace(/\*/g, "×").replace(/\//g, "÷"))}</div>
                <div class="h-res">= ${escapeHtml(h.answer)}</div>
            </div>
        `).join("");

        historyItems.querySelectorAll(".history-item").forEach((el) => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.dataset.index, 10);
                const h = history[idx];
                if (h) {
                    expression = h.answer;
                    renderDisplay();
                    if (typeof showToast === "function") {
                        showToast("📋 Loaded from history");
                    }
                }
            });
        });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /* ============================================================
       MEMORY FUNCTIONS
       ============================================================ */
    function updateMemIndicator() {
        memoryInd.style.display = memory !== 0 ? "flex" : "none";
    }

    function handleMemory(cmd) {
        const val = safeEvaluate(expression || "0", { silent: true }) ?? 0;
        switch (cmd) {
            case "mc":
                memory = 0;
                if (typeof showToast === "function") showToast("🧹 Memory cleared");
                break;
            case "mr":
                if (memory !== 0) expression += formatNumber(memory);
                else if (typeof showToast === "function") showToast("💾 Memory empty");
                break;
            case "m-plus":
                memory += val;
                if (typeof showToast === "function") showToast(`💾 M+ = ${formatNumber(memory)}`);
                break;
            case "m-minus":
                memory -= val;
                if (typeof showToast === "function") showToast(`💾 M− = ${formatNumber(memory)}`);
                break;
            case "ms":
                memory = val;
                if (typeof showToast === "function") showToast(`💾 Stored ${formatNumber(memory)}`);
                break;
        }
        updateMemIndicator();
        renderDisplay();
    }

    /* ============================================================
       EVENT LISTENERS
       ============================================================ */
    // Number keys
    document.querySelectorAll(".key.num").forEach((btn) => {
        btn.addEventListener("click", () => appendNumber(btn.dataset.num));
    });

    // Function action keys
    document.querySelectorAll(".key.fn-action").forEach((btn) => {
        btn.addEventListener("click", () => handleAction(btn.dataset.action));
    });

    // Scientific function buttons
    document.querySelectorAll(".fn-btn").forEach((btn) => {
        btn.addEventListener("click", () => handleFunction(btn.dataset.fn));
    });

    // Memory buttons
    document.querySelectorAll(".mem-btn").forEach((btn) => {
        btn.addEventListener("click", () => handleMemory(btn.dataset.mem));
    });

    // Angle mode
    angleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            angleMode = btn.dataset.angle;
            angleBtns.forEach((b) => b.classList.toggle("active", b === btn));
            renderDisplay();
        });
    });

    // History toggle
    historyToggle.addEventListener("click", () => {
        historyPanel.classList.toggle("open");
        historyToggle.classList.toggle("active");
    });

    clearHistoryBtn.addEventListener("click", () => {
        if (history.length === 0) return;
        if (!confirm("Clear all history?")) return;
        history = [];
        saveHistory();
        renderHistory();
        if (typeof showToast === "function") showToast("🗑️ History cleared");
    });

    /* Prevent context menu on long press */
    document.querySelectorAll(".key, .fn-btn, .mem-btn").forEach((b) =>
        b.addEventListener("contextmenu", (e) => e.preventDefault())
    );

    /* ============================================================
       KEYBOARD SUPPORT
       ============================================================ */
    window.addEventListener("keydown", (e) => {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target.isContentEditable) return;

        const k = e.key;

        // Numbers & dot
        if (/^[0-9.]$/.test(k)) {
            e.preventDefault();
            appendNumber(k);
            return;
        }

        // Operators
        if (["+", "-", "*", "/"].includes(k)) {
            e.preventDefault();
            expression += k;
            renderDisplay();
            return;
        }
        if (k === "^") {
            e.preventDefault();
            expression += "^";
            renderDisplay();
            return;
        }
        if (k === "%") {
            e.preventDefault();
            expression += "%";
            renderDisplay();
            return;
        }
        if (k === "(" || k === ")") {
            e.preventDefault();
            expression += k;
            renderDisplay();
            return;
        }

        // Enter → equals
        if (k === "Enter" || k === "=") {
            e.preventDefault();
            doEquals();
            return;
        }

        // Backspace
        if (k === "Backspace") {
            e.preventDefault();
            expression = expression.slice(0, -1);
            renderDisplay();
            return;
        }

        // Escape → clear
        if (k === "Escape") {
            e.preventDefault();
            expression = "";
            previewEl.textContent = "";
            previewEl.classList.remove("error");
            renderDisplay();
            return;
        }

        // Letters for functions: s c t l etc. — only if followed by a pattern? Skip for simplicity
        if (k === "p") { // pi shortcut
            e.preventDefault();
            expression += "pi";
            renderDisplay();
        }
        if (k === "e") {
            // Only if not forming a number's exponent
            e.preventDefault();
            expression += "e";
            renderDisplay();
        }
    });

    /* ============================================================
       SHARE
       ============================================================ */
    window.shareSciCalc = function () {
        const shareData = {
            title: "Scientific Calculator - Tool Hub",
            text: "Powerful scientific calculator with trig, log & more!",
            url: window.location.href,
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (typeof showToast === "function") showToast("🔗 Link copied!");
            }).catch(() => {});
        }
    };

    /* ============================================================
       INIT
       ============================================================ */
    function init() {
        renderDisplay();
        renderHistory();
        updateMemIndicator();
    }

    init();
})();