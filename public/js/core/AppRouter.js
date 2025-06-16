// public/js/core/AppRouter.js
class AppRouter {
    constructor(containerId, apiClient) {
        this.container = document.getElementById(containerId);
        this.api = apiClient;
        this.routes = new Map();
        this.currentRoute = null;
        this.currentComponent = null;
        this.middleware = [];
        this.defaultRoute = '/dashboard';
        this.authRequiredRoutes = new Set();
        
        // History management
        this.isNavigating = false;
        
        this.init();
    }

    init() {
        this.setupRoutes();
        this.attachEventListeners();
        this.handleInitialRoute();
    }

    setupRoutes() {
        // Define all application routes
        this.addRoute('/', {
            component: 'Dashboard',
            title: 'Dashboard',
            requiresAuth: true,
            icon: 'dashboard'
        });

        this.addRoute('/dashboard', {
            component: 'Dashboard',
            title: 'Dashboard',
            requiresAuth: true,
            icon: 'dashboard'
        });

        this.addRoute('/booking', {
            component: 'AppointmentBooking',
            title: 'Termin buchen',
            requiresAuth: true,
            icon: 'calendar-plus'
        });

        this.addRoute('/appointments', {
            component: 'AppointmentManagement',
            title: 'Terminverwaltung',
            requiresAuth: true,
            icon: 'calendar'
        });

        this.addRoute('/customers', {
            component: 'CustomerManagement',
            title: 'Kundenverwaltung',
            requiresAuth: true,
            icon: 'users'
        });

        this.addRoute('/services', {
            component: 'ServiceManagement',
            title: 'Service-Verwaltung',
            requiresAuth: true,
            icon: 'settings'
        });

        this.addRoute('/staff', {
            component: 'StaffManagement',
            title: 'Mitarbeiter-Verwaltung',
            requiresAuth: true,
            icon: 'user-group'
        });

        this.addRoute('/statistics', {
            component: 'Statistics',
            title: 'Statistiken',
            requiresAuth: true,
            icon: 'chart-bar'
        });

        this.addRoute('/settings', {
            component: 'Settings',
            title: 'Einstellungen',
            requiresAuth: true,
            icon: 'cog'
        });

        this.addRoute('/login', {
            component: 'Login',
            title: 'Anmelden',
            requiresAuth: false,
            hideFromNav: true
        });

        this.addRoute('/register', {
            component: 'Register',
            title: 'Registrieren',
            requiresAuth: false,
            hideFromNav: true
        });

        // 404 route
        this.addRoute('/404', {
            component: 'NotFound',
            title: 'Seite nicht gefunden',
            requiresAuth: false,
            hideFromNav: true
        });
    }

    addRoute(path, config) {
        this.routes.set(path, {
            path,
            component: config.component,
            title: config.title || 'ProfiSlots',
            requiresAuth: config.requiresAuth || false,
            hideFromNav: config.hideFromNav || false,
            icon: config.icon || null,
            middleware: config.middleware || [],
            meta: config.meta || {}
        });

        if (config.requiresAuth) {
            this.authRequiredRoutes.add(path);
        }
    }

    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    attachEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (!this.isNavigating) {
                const path = event.state?.path || window.location.pathname;
                this.navigate(path, false);
            }
        });

        // Handle link clicks
        document.addEventListener('click', (event) => {
            const link = event.target.closest('[data-route]');
            if (link) {
                event.preventDefault();
                const path = link.getAttribute('data-route');
                this.navigate(path);
            }
        });

        // Handle auth state changes
        window.addEventListener('auth-error', () => {
            this.navigate('/login');
        });

        window.addEventListener('auth-success', () => {
            this.navigate(this.defaultRoute);
        });
    }

    async navigate(path, updateHistory = true) {
        try {
            this.isNavigating = true;

            // Normalize path
            path = this.normalizePath(path);

            // Check if route exists
            const route = this.routes.get(path);
            if (!route) {
                return this.navigate('/404', updateHistory);
            }

            // Run middleware
            const middlewareResult = await this.runMiddleware(route);
            if (!middlewareResult.allowed) {
                if (middlewareResult.redirect) {
                    return this.navigate(middlewareResult.redirect, updateHistory);
                }
                return;
            }

            // Check authentication
            if (route.requiresAuth && !this.api.isAuthenticated()) {
                return this.navigate('/login', updateHistory);
            }

            // Prevent navigation to auth pages when already authenticated
            if ((path === '/login' || path === '/register') && this.api.isAuthenticated()) {
                return this.navigate(this.defaultRoute, updateHistory);
            }

            // Cleanup current component
            if (this.currentComponent && typeof this.currentComponent.destroy === 'function') {
                this.currentComponent.destroy();
            }

            // Show loading state
            this.showLoadingState();

            // Load and initialize component
            const component = await this.loadComponent(route.component);
            if (!component) {
                throw new Error(`Component ${route.component} could not be loaded`);
            }

            // Update browser history
            if (updateHistory) {
                this.updateHistory(path, route.title);
            }

            // Update current route
            this.currentRoute = route;
            this.currentComponent = component;

            // Update page title
            document.title = `${route.title} - ProfiSlots`;

            // Update navigation UI
            this.updateNavigationUI(path);

            // Emit route change event
            this.emitRouteChange(route, path);

        } catch (error) {
            console.error('Navigation error:', error);
            this.showError('Fehler beim Laden der Seite: ' + error.message);
        } finally {
            this.isNavigating = false;
        }
    }

    async runMiddleware(route) {
        const allMiddleware = [...this.middleware, ...route.middleware];
        
        for (const middleware of allMiddleware) {
            const result = await middleware(route, this.api);
            if (!result.allowed) {
                return result;
            }
        }
        
        return { allowed: true };
    }

    async loadComponent(componentName) {
        try {
            // Check if component class exists
            const ComponentClass = window[componentName];
            if (!ComponentClass) {
                throw new Error(`Component class ${componentName} not found`);
            }

            // Special handling for auth components
            if (componentName === 'Login' || componentName === 'Register') {
                return new ComponentClass('app-container', this.api, this);
            }

            // Create component instance
            const component = new ComponentClass('app-container', this.api);
            return component;

        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            throw error;
        }
    }

    updateHistory(path, title) {
        const state = { path, title, timestamp: Date.now() };
        
        if (window.location.pathname !== path) {
            window.history.pushState(state, title, path);
        }
    }

    updateNavigationUI(currentPath) {
        // Update active navigation items
        document.querySelectorAll('[data-route]').forEach(link => {
            const linkPath = link.getAttribute('data-route');
            const isActive = linkPath === currentPath;
            
            link.classList.toggle('active', isActive);
            link.classList.toggle('bg-indigo-600', isActive);
            link.classList.toggle('text-white', isActive);
            link.classList.toggle('bg-gray-200', !isActive);
            link.classList.toggle('text-gray-700', !isActive);
        });

        // Update mobile menu if exists
        const mobileMenu = document.querySelector('#mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }
    }

    showLoadingState() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="flex items-center justify-center min-h-screen">
                    <div class="text-center">
                        <div class="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p class="mt-4 text-gray-600">Wird geladen...</p>
                    </div>
                </div>
            `;
        }
    }

    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="flex items-center justify-center min-h-screen">
                    <div class="text-center max-w-md mx-auto p-6">
                        <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-gray-800 mb-2">Fehler</h2>
                        <p class="text-gray-600 mb-4">${message}</p>
                        <button 
                            onclick="window.location.reload()" 
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Seite neu laden
                        </button>
                    </div>
                </div>
            `;
        }
    }

    handleInitialRoute() {
        const path = window.location.pathname;
        this.navigate(path, false);
    }

    normalizePath(path) {
        // Remove trailing slash except for root
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        // Ensure path starts with slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return path;
    }

    // Public API methods
    getCurrentRoute() {
        return this.currentRoute;
    }

    getRoutes() {
        return Array.from(this.routes.values());
    }

    getNavigationRoutes() {
        return Array.from(this.routes.values()).filter(route => !route.hideFromNav);
    }

    isCurrentRoute(path) {
        return this.currentRoute?.path === this.normalizePath(path);
    }

    // Navigation helpers
    back() {
        window.history.back();
    }

    forward() {
        window.history.forward();
    }

    replace(path) {
        this.navigate(path, false);
        window.history.replaceState(
            { path, timestamp: Date.now() }, 
            this.routes.get(path)?.title || 'ProfiSlots', 
            path
        );
    }

    // Route generation
    generateNavigation() {
        const navRoutes = this.getNavigationRoutes();
        
        return navRoutes.map(route => {
            const isActive = this.isCurrentRoute(route.path);
            return `
                <button
                    data-route="${route.path}"
                    class="w-full text-left px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        isActive 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }"
                >
                    ${route.icon ? this.getIcon(route.icon) : ''}
                    <span>${route.title}</span>
                </button>
            `;
        }).join('');
    }

    getIcon(iconName) {
        const icons = {
            'dashboard': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"></path></svg>',
            'calendar': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
            'calendar-plus': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v6m3-3H9"></path></svg>',
            'users': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg>',
            'settings': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
            'user-group': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
            'chart-bar': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>',
            'cog': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>'
        };
        
        return icons[iconName] || '';
    }

    // Event system
    emitRouteChange(route, path) {
        window.dispatchEvent(new CustomEvent('route-change', {
            detail: { route, path, timestamp: Date.now() }
        }));
    }

    // Lifecycle methods
    destroy() {
        if (this.currentComponent && typeof this.currentComponent.destroy === 'function') {
            this.currentComponent.destroy();
        }
        
        // Remove event listeners
        window.removeEventListener('popstate', this.handlePopState);
        document.removeEventListener('click', this.handleLinkClick);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppRouter;
} else if (typeof window !== 'undefined') {
    window.AppRouter = AppRouter;
}
