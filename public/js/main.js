// js/main.js
// Haupt-App-Modul für ProfiSlots

// Import all required modules
import { authApi, apiUtils } from './config/api.js';
import { Icons } from './components/shared/Icons.js';
import { LoginForm } from './components/auth/LoginForm.js';
import { Dashboard } from './components/dashboard/Dashboard.js';
import { LoadingSpinner } from './components/shared/LoadingSpinner.js';

const { React, ReactDOM } = window;
const { useState, useEffect } = React;

// =============================================================================
// Main App Component
// =============================================================================
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize app and check authentication
    useEffect(() => {
        const initializeApp = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check if user is authenticated
                if (authApi.isAuthenticated()) {
                    const savedUser = authApi.getCurrentUser();
                    
                    if (savedUser) {
                        setUser(savedUser);
                        console.log('User authenticated:', savedUser.email);
                    } else {
                        // Invalid user data, clear auth
                        authApi.logout();
                        console.log('Invalid user data, cleared auth');
                    }
                } else {
                    console.log('User not authenticated');
                }
            } catch (error) {
                console.error('App initialization error:', error);
                setError('Fehler beim Laden der Anwendung');
                authApi.logout(); // Clear any corrupted auth data
            } finally {
                setLoading(false);
            }
        };

        initializeApp();

        // Add global error handler
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        
        // Cleanup
        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // If it's an API error, handle it appropriately
        const errorMessage = apiUtils.handleError(event.reason);
        setError(errorMessage);
        
        // Prevent the default browser error handling
        event.preventDefault();
    };

    // Handle successful login
    const handleLogin = (userData) => {
        setUser(userData);
        setError(null);
        console.log('User logged in:', userData.email);
    };

    // Handle logout
    const handleLogout = () => {
        try {
            authApi.logout();
            setUser(null);
            setError(null);
            console.log('User logged out');
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if there's an error
            setUser(null);
            setError(null);
        }
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    // Render loading state
    if (loading) {
        return React.createElement('div', {
            className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
        },
            React.createElement('div', {
                className: "text-center"
            },
                React.createElement(LoadingSpinner, {
                    className: "w-16 h-16 text-indigo-600 mx-auto mb-4"
                }),
                React.createElement('h2', {
                    className: "text-xl font-semibold text-gray-800"
                }, 'ProfiSlots'),
                React.createElement('p', {
                    className: "text-gray-600 mt-2"
                }, 'Terminbuchungssystem wird geladen...')
            )
        );
    }

    // Render error state
    if (error) {
        return React.createElement('div', {
            className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
        },
            React.createElement('div', {
                className: "bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
            },
                React.createElement('div', {
                    className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                },
                    React.createElement(Icons.AlertTriangle, {
                        className: "w-8 h-8 text-red-600"
                    })
                ),
                React.createElement('h2', {
                    className: "text-xl font-semibold text-gray-800 mb-2"
                }, 'Fehler aufgetreten'),
                React.createElement('p', {
                    className: "text-gray-600 mb-6"
                }, error),
                React.createElement('div', {
                    className: "flex space-x-3"
                },
                    React.createElement('button', {
                        onClick: clearError,
                        className: "flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    }, 'Erneut versuchen'),
                    React.createElement('button', {
                        onClick: () => window.location.reload(),
                        className: "flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    }, 'Seite neu laden')
                )
            )
        );
    }

    // Render login or dashboard based on authentication
    if (!user) {
        return React.createElement(LoginForm, {
            onLogin: handleLogin,
            onError: setError
        });
    }

    return React.createElement(Dashboard, {
        user: user,
        onLogout: handleLogout,
        onError: setError
    });
};

// =============================================================================
// App Initialization
// =============================================================================
const initializeReactApp = () => {
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
        console.error('Root element not found! Make sure you have <div id="root"></div> in your HTML.');
        return;
    }

    // Check if React and ReactDOM are loaded
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        console.error('React or ReactDOM not loaded! Make sure you have included the React scripts.');
        return;
    }

    console.log('Initializing ProfiSlots App...');
    
    try {
        // Render the app
        ReactDOM.render(React.createElement(App), rootElement);
        console.log('ProfiSlots App initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        
        // Fallback error display
        rootElement.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">Anwendung konnte nicht gestartet werden</h2>
                    <p class="text-gray-600 mb-6">Es ist ein kritischer Fehler aufgetreten. Bitte laden Sie die Seite neu.</p>
                    <button onclick="window.location.reload()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        Seite neu laden
                    </button>
                    <details class="mt-4 text-left">
                        <summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700">Technische Details</summary>
                        <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">${error.stack || error.message}</pre>
                    </details>
                </div>
            </div>
        `;
    }
};

// =============================================================================
// Service Worker Registration (optional)
// =============================================================================
const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully:', registration);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
};

// =============================================================================
// DOM Ready Handler
// =============================================================================
const onDOMReady = (callback) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
};

// =============================================================================
// App Startup
// =============================================================================
onDOMReady(() => {
    console.log('DOM ready, starting ProfiSlots...');
    
    // Add global styles
    document.body.classList.add('bg-gray-50', 'font-sans', 'antialiased');
    
    // Set page title
    document.title = 'ProfiSlots - Terminbuchungssystem';
    
    // Initialize the React app
    initializeReactApp();
    
    // Register service worker for PWA functionality
    registerServiceWorker();
    
    // Add global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Ctrl/Cmd + K for quick search (future feature)
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            console.log('Quick search shortcut triggered');
            // TODO: Implement global search
        }
        
        // ESC to close modals (future feature)
        if (event.key === 'Escape') {
            console.log('Escape key pressed');
            // TODO: Close any open modals
        }
    });
    
    // Add performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('App Performance:', {
                    loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                    domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                    firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
                });
            }, 0);
        });
    }
});

// =============================================================================
// Global Error Handling
// =============================================================================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Don't break the app for non-critical errors
    if (event.error && event.error.name !== 'ChunkLoadError') {
        return;
    }
    
    // Handle chunk load errors (code splitting failures)
    if (event.error?.name === 'ChunkLoadError') {
        console.log('Chunk load error detected, reloading page...');
        window.location.reload();
    }
});

// =============================================================================
// Development Tools
// =============================================================================
if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    // Add development helpers to window
    window.ProfiSlots = {
        version: '1.0.0',
        api: () => import('./config/api.js'),
        components: {
            Icons: () => import('./components/shared/Icons.js'),
            Dashboard: () => import('./components/dashboard/Dashboard.js')
        },
        utils: {
            clearStorage: () => {
                localStorage.clear();
                sessionStorage.clear();
                console.log('Storage cleared');
            },
            getUser: () => authApi.getCurrentUser(),
            isAuth: () => authApi.isAuthenticated()
        }
    };
    
    console.log('Development mode enabled. Use window.ProfiSlots for debugging.');
}

// =============================================================================
// Export for module systems
// =============================================================================
export { App as default, initializeReactApp };

// =============================================================================
// Legacy browser support
// =============================================================================
if (!window.fetch) {
    console.error('Fetch API not supported. Please use a modern browser or include a polyfill.');
}

if (!window.Promise) {
    console.error('Promises not supported. Please use a modern browser or include a polyfill.');
}

// =============================================================================
// End of main.js
// =============================================================================
console.log('ProfiSlots main.js loaded successfully');
