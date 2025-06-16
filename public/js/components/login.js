// public/js/components/Login.js
class Login {
    constructor(containerId, apiClient, router) {
        this.container = document.getElementById(containerId);
        this.api = apiClient;
        this.router = router;
        this.state = {
            isLogin: true,
            isLoading: false,
            error: '',
            success: '',
            formData: {
                email: '',
                password: '',
                confirmPassword: '',
                salonName: ''
            },
            showPassword: false,
            showConfirmPassword: false,
            rememberMe: false,
            passwordStrength: {
                score: 0,
                feedback: ''
            }
        };
        
        this.init();
    }

    init() {
        this.loadSavedCredentials();
        this.render();
        this.attachEventListeners();
        this.focusEmailInput();
    }

    loadSavedCredentials() {
        try {
            const savedEmail = localStorage.getItem('rememberedEmail');
            const rememberMe = localStorage.getItem('rememberMe') === 'true';
            
            if (savedEmail && rememberMe) {
                this.state.formData.email = savedEmail;
                this.state.rememberMe = rememberMe;
            }
        } catch (error) {
            console.warn('Could not load saved credentials:', error);
        }
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div class="max-w-md w-full">
                    <!-- Main Card -->
                    <div class="bg-white rounded-lg shadow-xl overflow-hidden">
                        <!-- Header with animated background -->
                        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-center relative overflow-hidden">
                            <div class="absolute inset-0 bg-black opacity-10"></div>
                            <div class="relative z-10">
                                <div class="w-16 h-16 bg-white bg-opacity-20 rounded-xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <h1 class="text-3xl font-bold text-white">ProfiSlots</h1>
                                <p class="text-indigo-100 mt-2">
                                    ${this.state.isLogin ? 'Bei Ihrem Account anmelden' : 'Neuen Account erstellen'}
                                </p>
                            </div>
                            <!-- Animated shapes -->
                            <div class="absolute top-0 left-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-x-10 -translate-y-10"></div>
                            <div class="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full translate-x-16 translate-y-16"></div>
                        </div>

                        <!-- Form Container -->
                        <div class="px-8 py-6">
                            <!-- Tab Navigation -->
                            <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
                                <button 
                                    id="login-tab"
                                    class="flex-1 text-center py-2 rounded-md font-medium transition-all ${
                                        this.state.isLogin 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-800'
                                    }"
                                >
                                    Anmelden
                                </button>
                                <button 
                                    id="register-tab"
                                    class="flex-1 text-center py-2 rounded-md font-medium transition-all ${
                                        !this.state.isLogin 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-800'
                                    }"
                                >
                                    Registrieren
                                </button>
                            </div>

                            <!-- Error/Success Messages -->
                            ${this.renderMessages()}

                            <!-- Form -->
                            <form id="auth-form" class="space-y-4">
                                <!-- Email Field -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        E-Mail Adresse *
                                    </label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            id="email-input"
                                            value="${this.state.formData.email}"
                                            placeholder="ihre@email.de"
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                <!-- Password Field -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        Passwort *
                                    </label>
                                    <div class="relative">
                                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                            </svg>
                                        </div>
                                        <input
                                            type="${this.state.showPassword ? 'text' : 'password'}"
                                            id="password-input"
                                            value="${this.state.formData.password}"
                                            placeholder="Mindestens 6 Zeichen"
                                            class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            required
                                            minlength="6"
                                        />
                                        <button
                                            type="button"
                                            id="toggle-password"
                                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            ${this.state.showPassword ? this.getEyeOffIcon() : this.getEyeIcon()}
                                        </button>
                                    </div>
                                    ${!this.state.isLogin ? this.renderPasswordStrength() : ''}
                                </div>

                                <!-- Confirm Password Field (Register only) -->
                                ${!this.state.isLogin ? `
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Passwort bestätigen *
                                        </label>
                                        <div class="relative">
                                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                            </div>
                                            <input
                                                type="${this.state.showConfirmPassword ? 'text' : 'password'}"
                                                id="confirm-password-input"
                                                value="${this.state.formData.confirmPassword}"
                                                placeholder="Passwort wiederholen"
                                                class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                            <button
                                                type="button"
                                                id="toggle-confirm-password"
                                                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                ${this.state.showConfirmPassword ? this.getEyeOffIcon() : this.getEyeIcon()}
                                            </button>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Salon Name Field (Register only) -->
                                ${!this.state.isLogin ? `
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            Salon Name *
                                        </label>
                                        <div class="relative">
                                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                id="salon-name-input"
                                                value="${this.state.formData.salonName}"
                                                placeholder="z.B. Salon Müller"
                                                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Remember Me (Login only) -->
                                ${this.state.isLogin ? `
                                    <div class="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="remember-me"
                                            ${this.state.rememberMe ? 'checked' : ''}
                                            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <label for="remember-me" class="ml-2 text-sm text-gray-600">
                                            Angemeldet bleiben
                                        </label>
                                    </div>
                                ` : ''}

                                <!-- Submit Button -->
                                <button
                                    type="submit"
                                    id="submit-btn"
                                    class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                                    ${this.state.isLoading ? 'disabled' : ''}
                                >
                                    ${this.state.isLoading ? this.renderLoadingButton() : (this.state.isLogin ? 'Anmelden' : 'Account erstellen')}
                                </button>
                            </form>

                            <!-- Additional Links -->
                            <div class="mt-6 text-center space-y-3">
                                ${this.state.isLogin ? `
                                    <button id="forgot-password" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                        Passwort vergessen?
                                    </button>
                                ` : ''}
                                
                                <div class="text-sm text-gray-500">
                                    ${this.state.isLogin ? 'Noch kein Account?' : 'Bereits registriert?'}
                                    <button id="switch-mode" class="text-indigo-600 hover:text-indigo-700 font-medium ml-1">
                                        ${this.state.isLogin ? 'Jetzt registrieren' : 'Hier anmelden'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Demo Info -->
                    <div class="mt-8 bg-white bg-opacity-80 backdrop-blur-sm rounded-lg p-6 text-center">
                        <h4 class="font-medium text-gray-800 mb-2 flex items-center justify-center">
                            <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            ProfiSlots Demo
                        </h4>
                        <p class="text-sm text-gray-600 leading-relaxed">
                            Ihr professionelles Terminbuchungssystem für Salons, Praxen und Dienstleister. 
                            Einfach zu bedienen, vollständig anpassbar und datenschutzkonform.
                        </p>
                        <div class="flex justify-center items-center mt-4 space-x-4 text-xs text-gray-500">
                            <span class="flex items-center">
                                <svg class="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                </svg>
                                DSGVO-konform
                            </span>
                            <span class="flex items-center">
                                <svg class="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                                </svg>
                                SSL-verschlüsselt
                            </span>
                            <span class="flex items-center">
                                <svg class="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"></path>
                                </svg>
                                Cloud-basiert
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMessages() {
        let html = '';
        
        if (this.state.error) {
            html += `
                <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-red-700 text-sm">${this.state.error}</span>
                    </div>
                </div>
            `;
        }
        
        if (this.state.success) {
            html += `
                <div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-green-700 text-sm">${this.state.success}</span>
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    renderPasswordStrength() {
        const strength = this.state.passwordStrength;
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
        const labels = ['Schwach', 'Mäßig', 'Gut', 'Stark'];
        
        return `
            <div class="mt-2">
                <div class="flex space-x-1 mb-1">
                    ${Array.from({ length: 4 }, (_, i) => `
                        <div class="flex-1 h-2 rounded-full ${
                            i < strength.score ? colors[strength.score - 1] : 'bg-gray-200'
                        }"></div>
                    `).join('')}
                </div>
                <p class="text-xs text-gray-500">
                    ${strength.score > 0 ? labels[strength.score - 1] : 'Passwort eingeben'} 
                    ${strength.feedback ? '• ' + strength.feedback : ''}
                </p>
            </div>
        `;
    }

    renderLoadingButton() {
        return `
            <div class="flex items-center justify-center">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ${this.state.isLogin ? 'Anmeldung läuft...' : 'Account wird erstellt...'}
            </div>
        `;
    }

    attachEventListeners() {
        // Tab switching
        const loginTab = this.container.querySelector('#login-tab');
        const registerTab = this.container.querySelector('#register-tab');
        
        if (loginTab) {
            loginTab.addEventListener('click', () => this.switchMode(true));
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', () => this.switchMode(false));
        }

        // Form submission
        const form = this.container.querySelector('#auth-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Input handlers
        this.attachInputListeners();

        // Password toggle
        this.attachPasswordToggleListeners();

        // Mode switch button
        const switchModeBtn = this.container.querySelector('#switch-mode');
        if (switchModeBtn) {
            switchModeBtn.addEventListener('click', () => this.switchMode(!this.state.isLogin));
        }

        // Forgot password
        const forgotPasswordBtn = this.container.querySelector('#forgot-password');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', () => this.handleForgotPassword());
        }

        // Keyboard shortcuts
        this.attachKeyboardListeners();
    }

    attachInputListeners() {
        const inputs = {
            'email-input': 'email',
            'password-input': 'password',
            'confirm-password-input': 'confirmPassword',
            'salon-name-input': 'salonName'
        };

        Object.entries(inputs).forEach(([id, field]) => {
            const input = this.container.querySelector(`#${id}`);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.updateFormData(field, e.target.value);
                    this.clearError();
                    
                    // Password strength check
                    if (field === 'password' && !this.state.isLogin) {
                        this.checkPasswordStrength(e.target.value);
                    }
                    
                    // Real-time validation
                    this.validateField(field, e.target.value);
                });

                input.addEventListener('blur', (e) => {
                    this.validateField(field, e.target.value);
                });
            }
        });

        // Remember me checkbox
        const rememberMeInput = this.container.querySelector('#remember-me');
        if (rememberMeInput) {
            rememberMeInput.addEventListener('change', (e) => {
                this.setState({ rememberMe: e.target.checked });
            });
        }
    }

    attachPasswordToggleListeners() {
        const togglePassword = this.container.querySelector('#toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                this.setState({ showPassword: !this.state.showPassword });
                this.updatePasswordVisibility('password-input', this.state.showPassword);
                this.updatePasswordToggleIcon('toggle-password', this.state.showPassword);
            });
        }

        const toggleConfirmPassword = this.container.querySelector('#toggle-confirm-password');
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener('click', () => {
                this.setState({ showConfirmPassword: !this.state.showConfirmPassword });
                this.updatePasswordVisibility('confirm-password-input', this.state.showConfirmPassword);
                this.updatePasswordToggleIcon('toggle-confirm-password', this.state.showConfirmPassword);
            });
        }
    }

    attachKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            // Enter key for form submission
            if (e.key === 'Enter' && !e.shiftKey) {
                const form = this.container.querySelector('#auth-form');
                if (form && document.activeElement && form.contains(document.activeElement)) {
                    e.preventDefault();
                    this.handleSubmit(e);
                }
            }
            
            // Escape to clear errors
            if (e.key === 'Escape') {
                this.clearError();
                this.clearSuccess();
            }
        });
    }

    updateFormData(field, value) {
        this.setState({
            formData: {
                ...this.state.formData,
                [field]: value
            }
        });
    }

    updatePasswordVisibility(inputId, show) {
        const input = this.container.querySelector(`#${inputId}`);
        if (input) {
            input.type = show ? 'text' : 'password';
        }
    }

    updatePasswordToggleIcon(buttonId, show) {
        const button = this.container.querySelector(`#${buttonId}`);
        if (button) {
            button.innerHTML = show ? this.getEyeOffIcon() : this.getEyeIcon();
        }
    }

    checkPasswordStrength(password) {
        let score = 0;
        let feedback = '';

        if (password.length === 0) {
            this.setState({
                passwordStrength: { score: 0, feedback: '' }
            });
            return;
        }

        // Length check
        if (password.length >= 8) score++;
        else feedback = 'Mindestens 8 Zeichen verwenden';

        // Character variety checks
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        else if (!feedback) feedback = 'Groß- und Kleinbuchstaben verwenden';

        if (/\d/.test(password)) score++;
        else if (!feedback) feedback = 'Mindestens eine Zahl hinzufügen';

        if (/[^a-zA-Z\d]/.test(password)) score++;
        else if (!feedback) feedback = 'Sonderzeichen hinzufügen';

        this.setState({
            passwordStrength: { score, feedback }
        });

        // Update UI
        const strengthContainer = this.container.querySelector('.mt-2');
        if (strengthContainer) {
            strengthContainer.innerHTML = this.renderPasswordStrength().replace('<div class="mt-2">', '').replace('</div>', '');
        }
    }

    validateField(field, value) {
        const input = this.container.querySelector(`#${field}-input`);
        if (!input) return;

        let isValid = true;
        let message = '';

        switch (field) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                message = isValid ? '' : 'Gültige E-Mail Adresse eingeben';
                break;
                
            case 'password':
                isValid = value.length >= 6;
                message = isValid ? '' : 'Mindestens 6 Zeichen erforderlich';
                break;
                
            case 'confirmPassword':
                isValid = value === this.state.formData.password;
                message = isValid ? '' : 'Passwörter stimmen nicht überein';
                break;
                
            case 'salonName':
                isValid = value.trim().length >= 2;
                message = isValid ? '' : 'Salon Name zu kurz';
                break;
        }

        // Update input styling
        if (value.length > 0) {
            input.classList.toggle('border-red-500', !isValid);
            input.classList.toggle('border-green-500', isValid);
            input.classList.toggle('border-gray-300', false);
        } else {
            input.classList.remove('border-red-500', 'border-green-500');
            input.classList.add('border-gray-300');
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.state.isLoading) return;

        // Validate all fields
        const isValid = this.validateForm();
        if (!isValid) return;

        this.setState({ isLoading: true, error: '', success: '' });
        this.updateSubmitButton();

        try {
            if (this.state.isLogin) {
                await this.handleLogin();
            } else {
                await this.handleRegister();
            }
        } catch (error) {
            this.setState({ error: error.message || 'Ein Fehler ist aufgetreten' });
            this.updateMessages();
        } finally {
            this.setState({ isLoading: false });
            this.updateSubmitButton();
        }
    }

    async handleLogin() {
        const { email, password } = this.state.formData;
        
        const result = await this.api.login(email, password);
        
        if (result.token) {
            // Save credentials if remember me is checked
            if (this.state.rememberMe) {
                try {
                    localStorage.setItem('rememberedEmail', email);
                    localStorage.setItem('rememberMe', 'true');
                } catch (error) {
                    console.warn('Could not save credentials:', error);
                }
            } else {
                try {
                    localStorage.removeItem('rememberedEmail');
                    localStorage.removeItem('rememberMe');
                } catch (error) {
                    console.warn('Could not clear saved credentials:', error);
                }
            }

            // Show success message briefly
            this.setState({ success: 'Erfolgreich angemeldet! Weiterleitung...' });
            this.updateMessages();

            // Trigger auth success event
            window.dispatchEvent(new CustomEvent('auth-success', {
                detail: { user: result.user }
            }));

            // Navigate to dashboard after short delay
            setTimeout(() => {
                this.router.navigate('/dashboard');
            }, 1000);
        }
    }

    async handleRegister() {
        const { email, password, salonName } = this.state.formData;
        
        await this.api.register(email, password, salonName);
        
        // Show success and switch to login
        this.setState({ 
            success: 'Account erfolgreich erstellt! Sie können sich jetzt anmelden.',
            isLogin: true,
            formData: {
                ...this.state.formData,
                password: '',
                confirmPassword: '',
                salonName: ''
            }
        });
        
        this.render();
        this.attachEventListeners();
        this.focusEmailInput();
    }

    validateForm() {
        const { email, password, confirmPassword, salonName } = this.state.formData;
        
        // Email validation
        if (!this.validateField('email', email)) {
            this.setState({ error: 'Bitte geben Sie eine gültige E-Mail Adresse ein.' });
            this.updateMessages();
            this.focusField('email-input');
            return false;
        }

        // Password validation
        if (!this.validateField('password', password)) {
            this.setState({ error: 'Passwort muss mindestens 6 Zeichen haben.' });
            this.updateMessages();
            this.focusField('password-input');
            return false;
        }

        // Registration specific validations
        if (!this.state.isLogin) {
            // Confirm password
            if (password !== confirmPassword) {
                this.setState({ error: 'Passwörter stimmen nicht überein.' });
                this.updateMessages();
                this.focusField('confirm-password-input');
                return false;
            }

            // Password strength
            if (this.state.passwordStrength.score < 2) {
                this.setState({ error: 'Passwort ist zu schwach. Bitte verwenden Sie ein stärkeres Passwort.' });
                this.updateMessages();
                this.focusField('password-input');
                return false;
            }

            // Salon name
            if (!this.validateField('salonName', salonName)) {
                this.setState({ error: 'Bitte geben Sie einen Salon Namen ein.' });
                this.updateMessages();
                this.focusField('salon-name-input');
                return false;
            }
        }

        return true;
    }

    switchMode(isLogin) {
        if (this.state.isLogin === isLogin) return;

        this.setState({ 
            isLogin,
            error: '',
            success: '',
            formData: {
                email: this.state.formData.email, // Keep email
                password: '',
                confirmPassword: '',
                salonName: ''
            },
            passwordStrength: { score: 0, feedback: '' }
        });

        this.render();
        this.attachEventListeners();
        this.focusEmailInput();
    }

    handleForgotPassword() {
        const email = this.state.formData.email;
        
        if (!email) {
            this.setState({ error: 'Bitte geben Sie zuerst Ihre E-Mail Adresse ein.' });
            this.updateMessages();
            this.focusField('email-input');
            return;
        }

        if (!this.validateField('email', email)) {
            this.setState({ error: 'Bitte geben Sie eine gültige E-Mail Adresse ein.' });
            this.updateMessages();
            this.focusField('email-input');
            return;
        }

        // Show info modal (for now just an alert)
        alert(`Passwort-Reset für ${email} würde gesendet werden.\n\nDiese Funktion ist in der Demo noch nicht implementiert.`);
    }

    // UI Helper Methods
    updateMessages() {
        const form = this.container.querySelector('#auth-form');
        if (form) {
            const messagesHtml = this.renderMessages();
            
            // Remove existing messages
            const existingMessages = form.parentNode.querySelectorAll('.mb-4.p-4');
            existingMessages.forEach(msg => {
                if (msg.classList.contains('bg-red-50') || msg.classList.contains('bg-green-50')) {
                    msg.remove();
                }
            });
            
            // Insert new messages
            if (messagesHtml) {
                form.insertAdjacentHTML('beforebegin', messagesHtml);
            }
        }
    }

    updateSubmitButton() {
        const submitBtn = this.container.querySelector('#submit-btn');
        if (submitBtn) {
            submitBtn.disabled = this.state.isLoading;
            submitBtn.innerHTML = this.state.isLoading ? 
                this.renderLoadingButton() : 
                (this.state.isLogin ? 'Anmelden' : 'Account erstellen');
        }
    }

    focusEmailInput() {
        setTimeout(() => {
            const emailInput = this.container.querySelector('#email-input');
            if (emailInput) {
                emailInput.focus();
                if (emailInput.value) {
                    emailInput.setSelectionRange(emailInput.value.length, emailInput.value.length);
                }
            }
        }, 100);
    }

    focusField(fieldId) {
        const field = this.container.querySelector(`#${fieldId}`);
        if (field) {
            field.focus();
        }
    }

    clearError() {
        if (this.state.error) {
            this.setState({ error: '' });
            this.updateMessages();
        }
    }

    clearSuccess() {
        if (this.state.success) {
            this.setState({ success: '' });
            this.updateMessages();
        }
    }

    // Icon Helper Methods
    getEyeIcon() {
        return `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
        `;
    }

    getEyeOffIcon() {
        return `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
            </svg>
        `;
    }

    // Accessibility improvements
    initAccessibility() {
        // Add proper ARIA labels
        const inputs = this.container.querySelectorAll('input');
        inputs.forEach(input => {
            const label = this.container.querySelector(`label[for="${input.id}"]`);
            if (!label) {
                const previousLabel = input.parentElement.previousElementSibling;
                if (previousLabel && previousLabel.tagName === 'LABEL') {
                    input.setAttribute('aria-label', previousLabel.textContent.trim());
                }
            }
        });

        // Add role attributes
        const form = this.container.querySelector('#auth-form');
        if (form) {
            form.setAttribute('role', 'form');
            form.setAttribute('aria-label', this.state.isLogin ? 'Anmeldeformular' : 'Registrierungsformular');
        }

        // Add live region for error messages
        const errorContainer = this.container.querySelector('.bg-red-50');
        if (errorContainer) {
            errorContainer.setAttribute('role', 'alert');
            errorContainer.setAttribute('aria-live', 'polite');
        }
    }

    // Security helpers
    sanitizeInput(input) {
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    validateEmailFormat(email) {
        // More comprehensive email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    // Rate limiting simulation
    checkRateLimit() {
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
        const lastAttempt = parseInt(localStorage.getItem('lastLoginAttempt') || '0');
        const now = Date.now();

        // Reset counter after 15 minutes
        if (now - lastAttempt > 15 * 60 * 1000) {
            localStorage.setItem('loginAttempts', '0');
            return true;
        }

        // Block after 5 attempts
        if (attempts >= 5) {
            const waitTime = Math.ceil((15 * 60 * 1000 - (now - lastAttempt)) / 1000 / 60);
            throw new Error(`Zu viele Anmeldeversuche. Bitte warten Sie ${waitTime} Minuten.`);
        }

        return true;
    }

    recordLoginAttempt() {
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0') + 1;
        localStorage.setItem('loginAttempts', attempts.toString());
        localStorage.setItem('lastLoginAttempt', Date.now().toString());
    }

    // Analytics tracking
    trackEvent(eventName, properties = {}) {
        if (window.analytics) {
            window.analytics.track(eventName, {
                ...properties,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
        }
    }

    // Cleanup method
    destroy() {
        // Remove global event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clear any timeouts
        if (this.redirectTimeout) {
            clearTimeout(this.redirectTimeout);
        }

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Track page exit
        this.trackEvent('Auth Page Exit', {
            mode: this.state.isLogin ? 'login' : 'register',
            duration: Date.now() - this.startTime
        });
    }

    // Initialize all features
    initializeFeatures() {
        this.startTime = Date.now();
        this.initAccessibility();
        
        // Track page load
        this.trackEvent('Auth Page Loaded', {
            mode: this.state.isLogin ? 'login' : 'register'
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Login;
} else if (typeof window !== 'undefined') {
    window.Login = Login;
}
