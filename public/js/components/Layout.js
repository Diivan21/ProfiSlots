// public/js/components/Layout.js
class Layout {
    constructor(containerId, apiClient, router) {
        this.container = document.getElementById(containerId);
        this.api = apiClient;
        this.router = router;
        this.user = this.api.getUser();
        this.state = {
            isMobileMenuOpen: false,
            isUserMenuOpen: false,
            notifications: [],
            unreadNotifications: 0
        };
        
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadNotifications();
        
        // Listen for route changes to update navigation
        window.addEventListener('route-change', (event) => {
            this.updateActiveNavigation(event.detail.path);
        });

        // Listen for auth changes
        window.addEventListener('auth-error', () => {
            this.handleAuthError();
        });
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <!-- Header -->
                <header class="bg-white shadow-lg relative z-50">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center h-16">
                            <!-- Logo and Brand -->
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h1 class="text-xl font-bold text-gray-800">ProfiSlots</h1>
                                    <p class="text-xs text-gray-500">${this.user?.salonName || 'Terminbuchungssystem'}</p>
                                </div>
                            </div>

                            <!-- Desktop Navigation -->
                            <nav class="hidden md:flex space-x-2">
                                ${this.renderDesktopNavigation()}
                            </nav>

                            <!-- Right Side Actions -->
                            <div class="flex items-center space-x-4">
                                <!-- Notifications -->
                                <div class="relative">
                                    <button 
                                        id="notifications-btn"
                                        class="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg transition-colors"
                                        title="Benachrichtigungen"
                                    >
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                                        </svg>
                                        ${this.state.unreadNotifications > 0 ? `
                                            <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                ${this.state.unreadNotifications > 9 ? '9+' : this.state.unreadNotifications}
                                            </span>
                                        ` : ''}
                                    </button>
                                    
                                    <!-- Notifications Dropdown -->
                                    <div id="notifications-dropdown" class="hidden absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                                        <div class="p-4 border-b border-gray-200">
                                            <h3 class="text-lg font-semibold text-gray-800">Benachrichtigungen</h3>
                                        </div>
                                        <div id="notifications-list">
                                            ${this.renderNotifications()}
                                        </div>
                                    </div>
                                </div>

                                <!-- User Menu -->
                                <div class="relative">
                                    <button 
                                        id="user-menu-btn"
                                        class="flex items-center space-x-3 p-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg transition-colors"
                                    >
                                        <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                        </div>
                                        <div class="hidden sm:block text-left">
                                            <div class="text-sm font-medium text-gray-800">${this.user?.email || 'Benutzer'}</div>
                                            <div class="text-xs text-gray-500">${this.user?.role || 'Administrator'}</div>
                                        </div>
                                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </button>
                                    
                                    <!-- User Dropdown -->
                                    <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                                        <div class="py-1">
                                            <button data-route="/settings" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                </svg>
                                                Einstellungen
                                            </button>
                                            <button id="logout-btn" class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                                </svg>
                                                Abmelden
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Mobile menu button -->
                                <button 
                                    id="mobile-menu-btn"
                                    class="md:hidden p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg transition-colors"
                                >
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Navigation -->
                    <div id="mobile-menu" class="md:hidden ${this.state.isMobileMenuOpen ? '' : 'hidden'}">
                        <div class="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                            ${this.renderMobileNavigation()}
                        </div>
                    </div>
                </header>

                <!-- Main Content Area -->
                <main class="flex-1">
                    <div id="app-container" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <!-- Content will be injected here by router -->
                    </div>
                </main>

                <!-- Footer -->
                <footer class="bg-white border-t border-gray-200 mt-auto">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div class="flex flex-col sm:flex-row justify-between items-center">
                            <div class="flex items-center space-x-4 mb-4 sm:mb-0">
                                <p class="text-sm text-gray-500">
                                    © 2025 ProfiSlots. Terminbuchungssystem für Ihren Salon.
                                </p>
                            </div>
                            <div class="flex items-center space-x-4">
                                <button id="connection-status" class="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700">
                                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Online</span>
                                </button>
                                <span class="text-sm text-gray-400">v1.0.0</span>
                            </div>
                        </div>
                    </div>
                </footer>

                <!-- Loading Overlay -->
                <div id="global-loading" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span class="text-gray-800">Wird geladen...</span>
                    </div>
                </div>

                <!-- Toast Container -->
                <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2">
                    <!-- Toasts will be inserted here -->
                </div>
            </div>
        `;
    }

    renderDesktopNavigation() {
        const routes = this.router.getNavigationRoutes();
        const currentPath = this.router.getCurrentRoute()?.path;

        return routes.map(route => {
            const isActive = currentPath === route.path;
            return `
                <button
                    data-route="${route.path}"
                    class="px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        isActive 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                    }"
                    title="${route.title}"
                >
                    ${route.icon ? this.router.getIcon(route.icon) : ''}
                    <span class="hidden lg:inline">${route.title}</span>
                </button>
            `;
        }).join('');
    }

    renderMobileNavigation() {
        const routes = this.router.getNavigationRoutes();
        const currentPath = this.router.getCurrentRoute()?.path;

        return routes.map(route => {
            const isActive = currentPath === route.path;
            return `
                <button
                    data-route="${route.path}"
                    class="w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-3 ${
                        isActive 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                    }"
                >
                    ${route.icon ? this.router.getIcon(route.icon) : ''}
                    <span>${route.title}</span>
                </button>
            `;
        }).join('');
    }

    renderNotifications() {
        if (this.state.notifications.length === 0) {
            return `
                <div class="p-4 text-center text-gray-500">
                    <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <p class="text-sm">Keine Benachrichtigungen</p>
                </div>
            `;
        }

        return this.state.notifications.map(notification => `
            <div class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${notification.read ? '' : 'bg-blue-50'}">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        ${this.getNotificationIcon(notification.type)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800">${notification.title}</p>
                        <p class="text-sm text-gray-600">${notification.message}</p>
                        <p class="text-xs text-gray-400 mt-1">${this.formatRelativeTime(notification.createdAt)}</p>
                    </div>
                    ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'appointment': '<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>',
            'customer': '<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>',
            'system': '<div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>',
            'warning': '<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>'
        };
        
        return icons[type] || icons['system'];
    }

    attachEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = this.container.querySelector('#mobile-menu-btn');
        const mobileMenu = this.container.querySelector('#mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                this.state.isMobileMenuOpen = !this.state.isMobileMenuOpen;
                mobileMenu.classList.toggle('hidden', !this.state.isMobileMenuOpen);
            });
        }

        // User menu toggle
        const userMenuBtn = this.container.querySelector('#user-menu-btn');
        const userDropdown = this.container.querySelector('#user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.state.isUserMenuOpen = !this.state.isUserMenuOpen;
                userDropdown.classList.toggle('hidden', !this.state.isUserMenuOpen);
            });
        }

        // Notifications toggle
        const notificationsBtn = this.container.querySelector('#notifications-btn');
        const notificationsDropdown = this.container.querySelector('#notifications-dropdown');
        
        if (notificationsBtn && notificationsDropdown) {
            notificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = notificationsDropdown.classList.contains('hidden');
                notificationsDropdown.classList.toggle('hidden', !isHidden);
                
                if (isHidden) {
                    this.markNotificationsAsRead();
                }
            });
        }

        // Logout button
        const logoutBtn = this.container.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
                userDropdown.classList.add('hidden');
                this.state.isUserMenuOpen = false;
            }
            
            if (notificationsDropdown && !notificationsDropdown.contains(e.target) && !notificationsBtn.contains(e.target)) {
                notificationsDropdown.classList.add('hidden');
            }
        });

        // Connection status check
        this.startConnectionMonitoring();
    }

    updateActiveNavigation(currentPath) {
        // Update desktop navigation
        this.container.querySelectorAll('[data-route]').forEach(link => {
            const linkPath = link.getAttribute('data-route');
            const isActive = linkPath === currentPath;
            
            link.classList.toggle('bg-indigo-600', isActive);
            link.classList.toggle('text-white', isActive);
            link.classList.toggle('text-gray-700', !isActive);
            link.classList.toggle('hover:bg-gray-100', !isActive);
        });

        // Close mobile menu after navigation
        const mobileMenu = this.container.querySelector('#mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
            this.state.isMobileMenuOpen = false;
        }
    }

    async loadNotifications() {
        try {
            // Mock notifications for now - replace with API call
            this.state.notifications = [
                {
                    id: 1,
                    type: 'appointment',
                    title: 'Neuer Termin',
                    message: 'Maria Schmidt hat einen Termin für morgen gebucht',
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    read: false
                },
                {
                    id: 2,
                    type: 'customer',
                    title: 'Neuer Kunde',
                    message: 'Hans Müller wurde als neuer Kunde angelegt',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                    read: true
                }
            ];
            
            this.state.unreadNotifications = this.state.notifications.filter(n => !n.read).length;
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    updateNotificationBadge() {
        const badge = this.container.querySelector('#notifications-btn span');
        if (badge) {
            if (this.state.unreadNotifications > 0) {
                badge.textContent = this.state.unreadNotifications > 9 ? '9+' : this.state.unreadNotifications;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    markNotificationsAsRead() {
        this.state.notifications.forEach(notification => {
            notification.read = true;
        });
        this.state.unreadNotifications = 0;
        this.updateNotificationBadge();
    }

    async handleLogout() {
        if (confirm('Möchten Sie sich wirklich abmelden?')) {
            try {
                await this.api.logout();
                this.router.navigate('/login');
            } catch (error) {
                console.error('Logout error:', error);
                // Force logout even if API call fails
                this.api.clearToken();
                this.router.navigate('/login');
            }
        }
    }

    handleAuthError() {
        this.showToast('Sitzung abgelaufen. Bitte melden Sie sich erneut an.', 'warning');
    }

    startConnectionMonitoring() {
        const statusBtn = this.container.querySelector('#connection-status');
        
        const checkConnection = async () => {
            try {
                const result = await this.api.testConnection();
                const statusDot = statusBtn.querySelector('div');
                const statusText = statusBtn.querySelector('span');
                
                if (result.success) {
                    statusDot.className = 'w-2 h-2 bg-green-500 rounded-full';
                    statusText.textContent = 'Online';
                } else {
                    statusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
                    statusText.textContent = 'Offline';
                }
            } catch (error) {
                const statusDot = statusBtn.querySelector('div');
                const statusText = statusBtn.querySelector('span');
                statusDot.className = 'w-2 h-2 bg-red-500 rounded-full';
                statusText.textContent = 'Offline';
            }
        };

        // Check connection every 30 seconds
        checkConnection();
        setInterval(checkConnection, 30000);
    }

    showGlobalLoading(show = true) {
        const loadingOverlay = this.container.querySelector('#global-loading');
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('hidden', !show);
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = this.container.querySelector('#toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `transform transition-all duration-300 translate-x-full max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border-l-4 ${this.getToastColor(type)}`;
        
        toast.innerHTML = `
            <div class="p-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        ${this.getToastIcon(type)}
                    </div>
                    <div class="ml-3 w-0 flex-1">
                        <p class="text-sm font-medium text-gray-900">${message}</p>
                    </div>
                    <div class="ml-4 flex-shrink-0 flex">
                        <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
            toast.classList.add('translate-x-0');
        }, 100);

        // Add close functionality
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Auto remove
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }

    removeToast(toast) {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getToastColor(type) {
        const colors = {
            'success': 'border-green-400',
            'error': 'border-red-400',
            'warning': 'border-yellow-400',
            'info': 'border-blue-400'
        };
        return colors[type] || colors['info'];
    }

    getToastIcon(type) {
        const icons = {
            'success': '<svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
            'error': '<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
            'warning': '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
            'info': '<svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
        };
        return icons[type] || icons['info'];
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) {
            return 'Gerade eben';
        } else if (minutes < 60) {
            return `vor ${minutes} Min`;
        } else if (hours < 24) {
            return `vor ${hours} Std`;
        } else if (days < 7) {
            return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
        } else {
            return new Date(date).toLocaleDateString('de-DE');
        }
    }

    // Public methods for external components to use
    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            createdAt: new Date(),
            read: false
        };

        this.state.notifications.unshift(newNotification);
        this.state.unreadNotifications++;
        
        // Update UI
        this.updateNotificationBadge();
        const notificationsList = this.container.querySelector('#notifications-list');
        if (notificationsList) {
            notificationsList.innerHTML = this.renderNotifications();
        }

        // Show toast for new notification
        this.showToast(notification.message, notification.type || 'info');
    }

    updateUser(userData) {
        this.user = userData;
        // Update user display in header
        const userEmail = this.container.querySelector('#user-menu-btn .text-sm');
        if (userEmail) {
            userEmail.textContent = userData.email;
        }
        
        const salonName = this.container.querySelector('header p');
        if (salonName) {
            salonName.textContent = userData.salonName || 'Terminbuchungssystem';
        }
    }

    setTitle(title) {
        document.title = `${title} - ProfiSlots`;
    }

    // Theme switching (for future feature)
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    // Responsive helpers
    isMobile() {
        return window.innerWidth < 768;
    }

    isTablet() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    }

    isDesktop() {
        return window.innerWidth >= 1024;
    }

    // Keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Key combinations
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.router.navigate('/dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.router.navigate('/booking');
                        break;
                    case '3':
                        e.preventDefault();
                        this.router.navigate('/appointments');
                        break;
                    case '4':
                        e.preventDefault();
                        this.router.navigate('/customers');
                        break;
                    case 'k':
                        e.preventDefault();
                        // Focus search if available
                        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="suchen"]');
                        if (searchInput) {
                            searchInput.focus();
                        }
                        break;
                }
            }

            // Escape key to close dropdowns
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });
    }

    closeAllDropdowns() {
        const userDropdown = this.container.querySelector('#user-dropdown');
        const notificationsDropdown = this.container.querySelector('#notifications-dropdown');
        const mobileMenu = this.container.querySelector('#mobile-menu');

        if (userDropdown) userDropdown.classList.add('hidden');
        if (notificationsDropdown) notificationsDropdown.classList.add('hidden');
        if (mobileMenu) mobileMenu.classList.add('hidden');

        this.state.isUserMenuOpen = false;
        this.state.isMobileMenuOpen = false;
    }

    // Accessibility improvements
    initAccessibility() {
        // Add keyboard navigation for dropdowns
        const userMenuBtn = this.container.querySelector('#user-menu-btn');
        const notificationsBtn = this.container.querySelector('#notifications-btn');

        if (userMenuBtn) {
            userMenuBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    userMenuBtn.click();
                }
            });
        }

        if (notificationsBtn) {
            notificationsBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    notificationsBtn.click();
                }
            });
        }

        // Add ARIA labels and states
        this.updateAriaStates();
    }

    updateAriaStates() {
        const userDropdown = this.container.querySelector('#user-dropdown');
        const userMenuBtn = this.container.querySelector('#user-menu-btn');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.setAttribute('aria-expanded', !userDropdown.classList.contains('hidden'));
            userMenuBtn.setAttribute('aria-haspopup', 'true');
        }

        const notificationsDropdown = this.container.querySelector('#notifications-dropdown');
        const notificationsBtn = this.container.querySelector('#notifications-btn');
        
        if (notificationsBtn && notificationsDropdown) {
            notificationsBtn.setAttribute('aria-expanded', !notificationsDropdown.classList.contains('hidden'));
            notificationsBtn.setAttribute('aria-haspopup', 'true');
        }
    }

    // Performance monitoring
    initPerformanceMonitoring() {
        // Monitor layout shifts and paint times
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.hadRecentInput) {
                        // Ignore shifts that are user-initiated
                        continue;
                    }
                    
                    // Log significant layout shifts
                    if (entry.value > 0.1) {
                        console.warn('Layout shift detected:', entry.value);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }

    // Cleanup method
    destroy() {
        // Remove event listeners
        document.removeEventListener('click', this.handleDocumentClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clear intervals
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    // Initialize all features
    initializeFeatures() {
        this.initKeyboardShortcuts();
        this.initAccessibility();
        this.initPerformanceMonitoring();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Layout;
} else if (typeof window !== 'undefined') {
    window.Layout = Layout;
}
