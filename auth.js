/* ============================================================
   AUTH SYSTEM - Tool Hub
   Fully Advanced Login/Signup with LocalStorage + Hashing
   ============================================================ */

const AuthSystem = (() => {
    // ============ CONFIG ============
    const STORAGE_USERS = 'toolhub_users';
    const STORAGE_SESSION = 'toolhub_session';
    const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // ============ STATE ============
    let currentUser = null;
    let modalEl = null;

    // ============ PASSWORD HASHING (SHA-256) ============
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'toolhub_salt_2025');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ============ USER STORAGE ============
    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_USERS)) || [];
        } catch {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
    }

    function findUser(email) {
        return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    // ============ SESSION ============
    function createSession(user, remember = false) {
        const session = {
            userId: user.id,
            email: user.email,
            name: user.name,
            loginAt: Date.now(),
            expiresAt: Date.now() + (remember ? SESSION_DURATION : 24 * 60 * 60 * 1000)
        };
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
    }

    function getSession() {
        try {
            const session = JSON.parse(localStorage.getItem(STORAGE_SESSION));
            if (!session) return null;
            if (Date.now() > session.expiresAt) {
                localStorage.removeItem(STORAGE_SESSION);
                return null;
            }
            return session;
        } catch {
            return null;
        }
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_SESSION);
    }

    // ============ CURRENT USER ============
    function getCurrentUser() {
        const session = getSession();
        if (!session) return null;
        return getUsers().find(u => u.id === session.userId) || null;
    }

    function isLoggedIn() {
        return getCurrentUser() !== null;
    }

    // ============ VALIDATION ============
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password) {
        return {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    }

    function getPasswordStrength(password) {
        const v = validatePassword(password);
        const score = Object.values(v).filter(Boolean).length;
        if (score <= 2) return { level: 'weak', text: 'Weak', score };
        if (score === 3) return { level: 'fair', text: 'Fair', score };
        if (score === 4) return { level: 'good', text: 'Good', score };
        return { level: 'strong', text: 'Strong', score };
    }

    // ============ SIGNUP ============
    async function signup(name, email, password, securityQ, securityA) {
        // Validation
        if (!name.trim() || name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        if (!validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        const v = validatePassword(password);
        if (!v.upper || !v.lower || !v.number) {
            throw new Error('Password must contain uppercase, lowercase & number');
        }
        if (findUser(email)) {
            throw new Error('An account with this email already exists');
        }
        if (!securityQ || !securityA.trim()) {
            throw new Error('Please set a security question & answer');
        }

        // Create user
        const hashedPassword = await hashPassword(password);
        const hashedAnswer = await hashPassword(securityA.toLowerCase().trim());
        
        const user = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            securityQuestion: securityQ,
            securityAnswer: hashedAnswer,
            createdAt: Date.now(),
            favorites: [],
            history: [],
            avatar: null
        };

        const users = getUsers();
        users.push(user);
        saveUsers(users);

        // Auto login
        createSession(user, true);
        currentUser = user;

        return user;
    }

    // ============ LOGIN ============
    async function login(email, password, remember = false) {
        if (!validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        const user = findUser(email);
        if (!user) {
            throw new Error('No account found with this email');
        }

        const hashedPassword = await hashPassword(password);
        if (hashedPassword !== user.password) {
            throw new Error('Incorrect password. Please try again.');
        }

        createSession(user, remember);
        currentUser = user;
        return user;
    }

    // ============ LOGOUT ============
    function logout() {
        clearSession();
        currentUser = null;
        
        // Update UI
        updateAuthUI();
        
        // Reload page for fresh state
        setTimeout(() => window.location.reload(), 300);
    }

    // ============ FORGOT PASSWORD ============
    function getSecurityQuestion(email) {
        const user = findUser(email);
        if (!user) throw new Error('No account found with this email');
        return user.securityQuestion;
    }

    async function verifySecurityAnswer(email, answer) {
        const user = findUser(email);
        if (!user) throw new Error('User not found');
        
        const hashedAnswer = await hashPassword(answer.toLowerCase().trim());
        return hashedAnswer === user.securityAnswer;
    }

    async function resetPassword(email, answer, newPassword) {
        const user = findUser(email);
        if (!user) throw new Error('User not found');
        
        const isValid = await verifySecurityAnswer(email, answer);
        if (!isValid) throw new Error('Incorrect answer');
        
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        const users = getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        users[idx].password = await hashPassword(newPassword);
        saveUsers(users);
        
        return true;
    }

    // ============ UPDATE PROFILE ============
    async function updateProfile(updates) {
        const user = getCurrentUser();
        if (!user) throw new Error('Not logged in');

        const users = getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        
        if (updates.name) {
            if (updates.name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters');
            }
            users[idx].name = updates.name.trim();
        }
        
        if (updates.password) {
            if (updates.password.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }
            users[idx].password = await hashPassword(updates.password);
        }

        saveUsers(users);
        currentUser = users[idx];
        
        // Update session
        const session = getSession();
        if (session) {
            session.name = users[idx].name;
            localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
        }
        
        return currentUser;
    }

    // ============ INITIALS ============
    function getInitials(name) {
        if (!name) return '?';
        return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    }

    // ============ RENDER UI ============
    function updateAuthUI() {
        const loginBox = document.querySelector('.login-box');
        const navActions = document.querySelector('.nav-actions');
        const user = getCurrentUser();

        // ===== SIDEBAR LOGIN BOX =====
        if (loginBox) {
            if (user) {
                loginBox.innerHTML = `
                    <div class="user-sidebar-card" style="text-align:center;">
                        <div class="user-avatar" style="margin: 0 auto 10px; width: 52px; height: 52px; font-size: 1.2rem;">
                            ${getInitials(user.name)}
                        </div>
                        <p style="font-weight:700; font-size:0.9rem; color: var(--text-color); margin-bottom:4px;">
                            ${escapeHtml(user.name)}
                        </p>
                        <p style="font-size:0.75rem; color: var(--text-muted); margin-bottom:10px; word-break:break-all;">
                            ${escapeHtml(user.email)}
                        </p>
                        <button onclick="window.location.href='profile-index.html'" 
                                style="width:100%; padding:8px; margin-bottom:6px; background: var(--primary); color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem;">
                            <i class="fa-solid fa-user"></i> My Profile
                        </button>
                        <button onclick="AuthSystem.logout()" 
                                style="width:100%; padding:8px; background: transparent; color: #ef4444; border:1px solid #ef4444; border-radius:6px; cursor:pointer; font-weight:600; font-size:0.8rem;">
                            <i class="fa-solid fa-right-from-bracket"></i> Logout
                        </button>
                    </div>
                `;
            } else {
                loginBox.innerHTML = `
                    <i class="fa-solid fa-crown" style="color: var(--primary); font-size:1.2rem;"></i>
                    <p style="margin: 8px 0; font-size:0.85rem; color: var(--text-color); font-weight:600;">
                        Save Your Favorite Tools
                    </p>
                    <p style="font-size:0.75rem; color: var(--text-muted); margin-bottom:10px;">
                        Sign up free to sync across devices
                    </p>
                    <button onclick="AuthSystem.openModal('login')" 
                            style="width:100%; padding:10px; background: var(--primary); color:white; border:none; border-radius:8px; cursor:pointer; font-weight:700; font-size:0.85rem;">
                        <i class="fa-solid fa-right-to-bracket"></i> Login / Sign Up
                    </button>
                `;
            }
        }

        // ===== NAVBAR USER MENU =====
        if (navActions) {
            // Remove existing user menu
            const existingMenu = navActions.querySelector('.user-menu');
            if (existingMenu) existingMenu.remove();
            
            if (user) {
                const userMenu = document.createElement('div');
                userMenu.className = 'user-menu';
                userMenu.innerHTML = `
                    <div class="user-avatar" onclick="AuthSystem.toggleUserDropdown(event)">
                        ${getInitials(user.name)}
                    </div>
                    <div class="user-dropdown" id="user-dropdown">
                        <div class="user-dropdown-header">
                            <div class="avatar-lg">${getInitials(user.name)}</div>
                            <div class="user-info">
                                <div class="user-name">${escapeHtml(user.name)}</div>
                                <div class="user-email">${escapeHtml(user.email)}</div>
                            </div>
                        </div>
                        <div class="user-dropdown-menu">
                            <a href="profile-index.html">
                                <i class="fa-solid fa-user"></i> My Profile
                            </a>
                            <a href="favorites-index.html">
                                <i class="fa-solid fa-heart"></i> Favorites
                            </a>
                            <a href="history-index.html">
                                <i class="fa-solid fa-clock-rotate-left"></i> History
                            </a>
                            <div class="user-dropdown-divider"></div>
                            <button onclick="AuthSystem.logout()" class="danger">
                                <i class="fa-solid fa-right-from-bracket"></i> Logout
                            </button>
                        </div>
                    </div>
                `;
                navActions.insertBefore(userMenu, navActions.firstChild);
            }
        }
    }

    function toggleUserDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;
    
    const isOpen = dropdown.classList.contains('show');
    
    if (isOpen) {
        dropdown.classList.remove('show');
        // Restore body scroll
        document.body.style.overflow = '';
    } else {
        dropdown.classList.add('show');
        // Prevent body scroll on mobile
        if (window.innerWidth <= 480) {
            document.body.style.overflow = 'hidden';
        }
    }
}
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown && !e.target.closest('.user-menu')) {
            dropdown.classList.remove('show');
        }
    });

    function createModal() {
    if (document.getElementById('auth-overlay')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-overlay';
    modal.className = 'auth-overlay';
    modal.innerHTML = `
        <div class="auth-modal" onclick="event.stopPropagation()">
            <button class="auth-close" onclick="AuthSystem.closeModal()" aria-label="Close">
                <i class="fa-solid fa-times"></i>
            </button>

            <div class="auth-header">
                <div class="auth-logo-icon">
                    <i class="fa-solid fa-wrench"></i>
                </div>
                <h2 id="auth-title">Welcome Back</h2>
                <p id="auth-subtitle">Login to sync your favorites</p>
            </div>

            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login" onclick="AuthSystem.switchTab('login')">
                    <i class="fa-solid fa-right-to-bracket"></i> Login
                </button>
                <button class="auth-tab" data-tab="signup" onclick="AuthSystem.switchTab('signup')">
                    <i class="fa-solid fa-user-plus"></i> Sign Up
                </button>
            </div>

            <div class="auth-body">
                <!-- ALERT -->
                <div class="auth-alert" id="auth-alert">
                    <i class="fa-solid fa-circle-info"></i>
                    <span id="auth-alert-text"></span>
                </div>

                <!-- LOGIN FORM -->
                <form class="auth-form active" id="login-form" onsubmit="AuthSystem.handleLogin(event)" autocomplete="on">
                    <div class="form-field">
                        <label>Email Address</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-envelope field-icon"></i>
                            <input type="email" class="form-input" id="login-email" 
                                   placeholder="you@example.com" required 
                                   autocomplete="email" inputmode="email">
                        </div>
                    </div>

                    <div class="form-field">
                        <label>Password</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-lock field-icon"></i>
                            <input type="password" class="form-input" id="login-password" 
                                   placeholder="Enter your password" required 
                                   autocomplete="current-password" style="padding-right: 52px;">
                            <button type="button" class="password-toggle" 
                                    onclick="AuthSystem.togglePassword('login-password', this)"
                                    aria-label="Toggle password visibility">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-options">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" id="remember-me">
                            <span class="checkbox-box">
                                <i class="fa-solid fa-check"></i>
                            </span>
                            Remember me
                        </label>
                        <button type="button" class="forgot-link" onclick="AuthSystem.showForgotPassword()">
                            Forgot Password?
                        </button>
                    </div>

                    <button type="submit" class="auth-submit" id="login-submit">
                        <span class="spinner"></span>
                        <span class="btn-text">
                            <i class="fa-solid fa-right-to-bracket"></i> Login
                        </span>
                    </button>

                    <div class="auth-switch">
                        Don't have an account? 
                        <button type="button" onclick="AuthSystem.switchTab('signup')">Sign Up Free</button>
                    </div>
                </form>

                <!-- SIGNUP FORM -->
                <form class="auth-form" id="signup-form" onsubmit="AuthSystem.handleSignup(event)" autocomplete="on">
                    <div class="form-field">
                        <label>Full Name</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-user field-icon"></i>
                            <input type="text" class="form-input" id="signup-name" 
                                   placeholder="John Doe" required 
                                   autocomplete="name" minlength="2">
                        </div>
                    </div>

                    <div class="form-field">
                        <label>Email Address</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-envelope field-icon"></i>
                            <input type="email" class="form-input" id="signup-email" 
                                   placeholder="you@example.com" required 
                                   autocomplete="email" inputmode="email">
                        </div>
                    </div>

                    <div class="form-field">
                        <label>Password</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-lock field-icon"></i>
                            <input type="password" class="form-input" id="signup-password" 
                                   placeholder="Create a strong password" required 
                                   autocomplete="new-password" minlength="8"
                                   oninput="AuthSystem.checkPasswordStrength(this.value)"
                                   style="padding-right: 52px;">
                            <button type="button" class="password-toggle" 
                                    onclick="AuthSystem.togglePassword('signup-password', this)"
                                    aria-label="Toggle password visibility">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                        <div class="password-strength" id="strength-meter">
                            <div class="strength-bar">
                                <div class="strength-fill" id="strength-fill"></div>
                            </div>
                            <div class="strength-text">
                                <span>Password Strength</span>
                                <span id="strength-label">—</span>
                            </div>
                        </div>
                        <div class="password-requirements" id="password-reqs">
                            <ul>
                                <li data-req="length"><i class="fa-solid fa-circle"></i> 8+ characters</li>
                                <li data-req="upper"><i class="fa-solid fa-circle"></i> Uppercase</li>
                                <li data-req="lower"><i class="fa-solid fa-circle"></i> Lowercase</li>
                                <li data-req="number"><i class="fa-solid fa-circle"></i> Number</li>
                            </ul>
                        </div>
                    </div>

                    <div class="form-field">
                        <label>Security Question</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-shield-halved field-icon"></i>
                            <select class="form-input" id="signup-security-q" required>
                                <option value="">Select a question...</option>
                                <option value="What is your mother's maiden name?">Mother's maiden name?</option>
                                <option value="What was your first pet's name?">First pet's name?</option>
                                <option value="What city were you born in?">Birth city?</option>
                                <option value="What is your favorite book?">Favorite book?</option>
                                <option value="What was your first car?">First car?</option>
                                <option value="What is your favorite color?">Favorite color?</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-field">
                        <label>Your Answer</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-key field-icon"></i>
                            <input type="text" class="form-input" id="signup-security-a" 
                                   placeholder="Your answer (case-insensitive)" required
                                   autocomplete="off">
                        </div>
                    </div>

                    <button type="submit" class="auth-submit" id="signup-submit">
                        <span class="spinner"></span>
                        <span class="btn-text">
                            <i class="fa-solid fa-user-plus"></i> Create Account
                        </span>
                    </button>

                    <div class="auth-switch">
                        Already have an account? 
                        <button type="button" onclick="AuthSystem.switchTab('login')">Login</button>
                    </div>
                </form>

                <!-- FORGOT PASSWORD FORM -->
                <form class="auth-form" id="forgot-form" onsubmit="AuthSystem.handleResetPassword(event)">
                    <div class="form-field">
                        <label>Email Address</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-envelope field-icon"></i>
                            <input type="email" class="form-input" id="forgot-email" 
                                   placeholder="you@example.com" required 
                                   autocomplete="email" inputmode="email">
                        </div>
                    </div>

                    <div class="form-field" id="security-q-field" style="display: none;">
                        <label>Security Question</label>
                        <div class="security-question-box">
                            <div class="question-label">Your Question</div>
                            <div class="question-text" id="security-q-text">—</div>
                        </div>
                    </div>

                    <div class="form-field" id="security-a-field" style="display: none;">
                        <label>Your Answer</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-key field-icon"></i>
                            <input type="text" class="form-input" id="forgot-answer" 
                                   placeholder="Your answer" autocomplete="off">
                        </div>
                    </div>

                    <div class="form-field" id="new-password-field" style="display: none;">
                        <label>New Password</label>
                        <div class="form-input-wrapper">
                            <i class="fa-solid fa-lock field-icon"></i>
                            <input type="password" class="form-input" id="forgot-new-password" 
                                   placeholder="New password" minlength="8" 
                                   style="padding-right: 52px;"
                                   autocomplete="new-password">
                            <button type="button" class="password-toggle" 
                                    onclick="AuthSystem.togglePassword('forgot-new-password', this)"
                                    aria-label="Toggle password visibility">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="auth-submit" id="forgot-submit">
                        <span class="spinner"></span>
                        <span class="btn-text" id="forgot-btn-text">
                            <i class="fa-solid fa-search"></i> Find Account
                        </span>
                    </button>

                    <div class="auth-switch">
                        Remember your password? 
                        <button type="button" onclick="AuthSystem.switchTab('login')">Back to Login</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // ===== MOBILE: Handle keyboard visibility =====
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            if (!modal.classList.contains('show')) return;
            // Auto-scroll focused input into view when keyboard opens
            const focused = document.activeElement;
            if (focused && focused.classList.contains('form-input')) {
                setTimeout(() => {
                    focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });
    }

    // ===== MOBILE: Prevent body scroll while modal open =====
    modal.addEventListener('touchmove', (e) => {
        // Allow scroll inside modal
        if (e.target.closest('.auth-modal')) return;
        e.preventDefault();
    }, { passive: false });

    // ===== MOBILE: Focus handler for inputs =====
    modal.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', () => {
            // Small delay for keyboard animation
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });

    modalEl = modal;
}

    function openModal(tab = 'login') {
    createModal();
    switchTab(tab);
    
    // Prevent body scroll (mobile-friendly)
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    setTimeout(() => modalEl.classList.add('show'), 10);
    
    // Focus first input — but only on desktop to avoid auto-keyboard on mobile
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
        setTimeout(() => {
            const input = modalEl.querySelector('.auth-form.active .form-input');
            if (input) input.focus();
        }, 400);
    }
}

function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('show');
    
    // Restore body scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    
    // Blur active input to close mobile keyboard
    if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
    }
    
    setTimeout(() => {
        hideAlert();
        const forms = modalEl.querySelectorAll('.auth-form');
        forms.forEach(f => {
            if (f.id !== 'login-form') {
                f.reset();
            }
        });
        
        // Reset forgot password steps
        const sqField = document.getElementById('security-q-field');
        const saField = document.getElementById('security-a-field');
        const npField = document.getElementById('new-password-field');
        const btnText = document.getElementById('forgot-btn-text');
        
        if (sqField) sqField.style.display = 'none';
        if (saField) saField.style.display = 'none';
        if (npField) npField.style.display = 'none';
        if (btnText) btnText.innerHTML = '<i class="fa-solid fa-search"></i> Find Account';
        
        if (modalEl._forgotEmail) modalEl._forgotEmail = null;
    }, 300);
}

    function switchTab(tab) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // Update forms
        document.querySelectorAll('.auth-form').forEach(f => {
            f.classList.toggle('active', f.id === `${tab}-form`);
        });

        // Update header
        const titles = {
            login: { title: 'Welcome Back', subtitle: 'Login to sync your favorites' },
            signup: { title: 'Create Account', subtitle: 'Join Tool Hub — it\'s free!' },
            forgot: { title: 'Reset Password', subtitle: 'Recover your account access' }
        };
        
        if (titles[tab]) {
            document.getElementById('auth-title').innerText = titles[tab].title;
            document.getElementById('auth-subtitle').innerText = titles[tab].subtitle;
        }

        // Hide alerts
        hideAlert();
    }

    function togglePassword(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon = btn.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    // ============ ALERTS ============
    function showAlert(message, type = 'error') {
        const alert = document.getElementById('auth-alert');
        const text = document.getElementById('auth-alert-text');
        const icon = alert.querySelector('i');

        alert.className = `auth-alert ${type} show`;
        text.innerText = message;

        const icons = {
            error: 'fa-circle-exclamation',
            success: 'fa-circle-check',
            info: 'fa-circle-info'
        };
        
        icon.className = `fa-solid ${icons[type] || 'fa-circle-info'}`;

        // Auto-hide success/info after 4s
        if (type !== 'error') {
            clearTimeout(alert._timeout);
            alert._timeout = setTimeout(hideAlert, 4000);
        }

        // Shake modal on error
        if (type === 'error') {
            const modal = document.querySelector('.auth-modal');
            modal.classList.remove('shake');
            void modal.offsetWidth;
            modal.classList.add('shake');
        }
    }

    function hideAlert() {
        const alert = document.getElementById('auth-alert');
        if (alert) alert.classList.remove('show');
    }

    // ============ PASSWORD STRENGTH ============
    function checkPasswordStrength(password) {
        const meter = document.getElementById('strength-meter');
        const fill = document.getElementById('strength-fill');
        const label = document.getElementById('strength-label');
        const reqs = document.getElementById('password-reqs');

        if (!password) {
            meter.classList.remove('show');
            reqs.classList.remove('show');
            return;
        }

        meter.classList.add('show');
        reqs.classList.add('show');

        // Update requirements
        const v = validatePassword(password);
        reqs.querySelectorAll('li').forEach(li => {
            const req = li.dataset.req;
            li.classList.toggle('met', v[req]);
        });

        // Update strength bar
        const strength = getPasswordStrength(password);
        fill.className = `strength-fill ${strength.level}`;
        
        const labels = {
            weak: '<span class="label-weak">Weak</span>',
            fair: '<span class="label-fair">Fair</span>',
            good: '<span class="label-good">Good</span>',
            strong: '<span class="label-strong">Strong 💪</span>'
        };
        label.innerHTML = labels[strength.level];
    }

    // ============ HANDLERS ============
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember-me').checked;
        const btn = document.getElementById('login-submit');

        btn.classList.add('loading');
        btn.disabled = true;
        hideAlert();

        try {
            await new Promise(r => setTimeout(r, 500)); // Smooth UX
            const user = await login(email, password, remember);
            
            showAlert(`Welcome back, ${user.name}! 🎉`, 'success');
            
            setTimeout(() => {
                closeModal();
                updateAuthUI();
                showToast(`👋 Welcome back, ${user.name}!`);
                
                // Reload to refresh favorites/history
                setTimeout(() => window.location.reload(), 800);
            }, 800);
        } catch (err) {
            showAlert(err.message, 'error');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    async function handleSignup(e) {
        e.preventDefault();

        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const securityQ = document.getElementById('signup-security-q').value;
        const securityA = document.getElementById('signup-security-a').value;
        const btn = document.getElementById('signup-submit');

        btn.classList.add('loading');
        btn.disabled = true;
        hideAlert();

        try {
            await new Promise(r => setTimeout(r, 600));
            const user = await signup(name, email, password, securityQ, securityA);
            
            showAlert(`Account created! Welcome, ${user.name}! 🎊`, 'success');
            fireConfetti();
            
            setTimeout(() => {
                closeModal();
                updateAuthUI();
                showToast(`🎉 Account created successfully!`);
                setTimeout(() => window.location.reload(), 800);
            }, 1200);
        } catch (err) {
            showAlert(err.message, 'error');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    // ============ FORGOT PASSWORD FLOW ============
    let forgotStep = 1;
    let forgotEmail = null;

    function showForgotPassword() {
        forgotStep = 1;
        forgotEmail = null;
        switchTab('forgot');
        document.getElementById('security-q-field').style.display = 'none';
        document.getElementById('security-a-field').style.display = 'none';
        document.getElementById('new-password-field').style.display = 'none';
        document.getElementById('forgot-btn-text').innerHTML = '<i class="fa-solid fa-search"></i> Find Account';
        document.getElementById('forgot-email').disabled = false;
        document.getElementById('forgot-form').reset();
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        const btn = document.getElementById('forgot-submit');
        btn.classList.add('loading');
        btn.disabled = true;
        hideAlert();

        try {
            await new Promise(r => setTimeout(r, 500));

            if (forgotStep === 1) {
                // Step 1: Find account & show security question
                const email = document.getElementById('forgot-email').value.trim();
                const question = getSecurityQuestion(email);
                
                forgotEmail = email;
                document.getElementById('security-q-text').innerText = question;
                document.getElementById('security-q-field').style.display = 'block';
                document.getElementById('security-a-field').style.display = 'block';
                document.getElementById('forgot-email').disabled = true;
                
                document.getElementById('forgot-btn-text').innerHTML = '<i class="fa-solid fa-shield-halved"></i> Verify Answer';
                forgotStep = 2;
                showAlert('Answer your security question to continue', 'info');
                
            } else if (forgotStep === 2) {
                // Step 2: Verify answer
                const answer = document.getElementById('forgot-answer').value.trim();
                const isValid = await verifySecurityAnswer(forgotEmail, answer);
                
                if (!isValid) {
                    showAlert('Incorrect answer. Please try again.', 'error');
                } else {
                    document.getElementById('new-password-field').style.display = 'block';
                    document.getElementById('security-a-field').style.display = 'none';
                    document.getElementById('forgot-btn-text').innerHTML = '<i class="fa-solid fa-key"></i> Reset Password';
                    forgotStep = 3;
                    showAlert('Answer verified! Set your new password.', 'success');
                }
                
            } else if (forgotStep === 3) {
                // Step 3: Reset password
                const newPassword = document.getElementById('forgot-new-password').value;
                
                if (newPassword.length < 8) {
                    throw new Error('Password must be at least 8 characters');
                }
                
                const answer = document.getElementById('forgot-answer').value.trim();
                await resetPassword(forgotEmail, answer, newPassword);
                
                showAlert('Password reset successfully! 🎉', 'success');
                
                setTimeout(() => {
                    showForgotPassword();
                    switchTab('login');
                    document.getElementById('login-email').value = forgotEmail;
                    document.getElementById('login-password').focus();
                }, 1500);
            }
        } catch (err) {
            showAlert(err.message, 'error');
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    // ============ CONFETTI ============
    function fireConfetti() {
        const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.6 + 's';
            piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            piece.style.width = (6 + Math.random() * 8) + 'px';
            piece.style.height = (6 + Math.random() * 8) + 'px';
            container.appendChild(piece);
        }

        setTimeout(() => container.remove(), 4000);
    }

    // ============ HELPERS ============
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(msg) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg);
        } else {
            // Fallback toast
            const t = document.createElement('div');
            t.style.cssText = `
                position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
                background: #10b981; color: white; padding: 14px 24px; border-radius: 12px;
                font-weight: 600; z-index: 99999; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: slideUp 0.4s ease;
            `;
            t.innerText = msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3000);
        }
    }

    // ============ INIT ============
    function init() {
        currentUser = getCurrentUser();
        updateAuthUI();
        
        // Update sidebar login box on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateAuthUI);
        } else {
            updateAuthUI();
        }
    }

    // ============ PUBLIC API ============
    return {
        init,
        openModal,
        closeModal,
        switchTab,
        togglePassword,
        checkPasswordStrength,
        handleLogin,
        handleSignup,
        showForgotPassword,
        handleResetPassword,
        toggleUserDropdown,
        logout,
        isLoggedIn,
        getCurrentUser,
        getInitials,
        updateAuthUI,
        updateProfile,
        // Expose for profile page
        getUsers,
        verifySecurityAnswer
    };
})();

// ============ AUTO INIT ============
AuthSystem.init();

// Global helper
window.AuthSystem = AuthSystem;