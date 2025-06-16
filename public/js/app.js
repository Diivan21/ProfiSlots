// ProfiSlots Main App Component
// Hauptkomponente die alle anderen zusammenfügt und das Routing übernimmt

const { useState, useEffect } = React;

const App = () => {
  // Auth State
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    isAuthenticated: false
  });
  
  // App State
  const [currentView, setCurrentView] = useState('dashboard');
  const [appLoading, setAppLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('online');

  // Auth Hook - vereinfacht
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = ProfiSlots.Storage.get('token');
        const savedUser = ProfiSlots.Storage.get('user');
        
        if (token && savedUser) {
          setAuthState({
            user: savedUser,
            loading: false,
            isAuthenticated: true
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        ProfiSlots.Storage.remove('token');
        ProfiSlots.Storage.remove('user');
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      }
    };

    checkAuth();
  }, []);

  // Initial App Setup
  useEffect(() => {
    if (!authState.loading) {
      initializeApp();
    }
  }, [authState.loading]);

  // App Initialization
  const initializeApp = async () => {
    try {
      // Check system health
      await checkSystemHealth();
      
      console.log('✅ ProfiSlots App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      setSystemStatus('error');
    } finally {
      setAppLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      await ProfiSlots.API.system.getHealth();
      setSystemStatus('online');
    } catch (error) {
      console.warn('System health check failed:', error);
      setSystemStatus('offline');
    }
  };

  // View Management
  const isValidView = (view) => {
    const validViews = ['dashboard', 'booking', 'appointments', 'customers', 'services', 'staff'];
    return validViews.includes(view);
  };

  const handleViewChange = (newView) => {
    if (isValidView(newView)) {
      setCurrentView(newView);
      ProfiSlots.Storage.set('lastView', newView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log(`📍 View changed to: ${newView}`);
    } else {
      console.error('Invalid view:', newView);
    }
  };

  // Auth Handlers
  const handleLogin = (userData) => {
    setAuthState({
      user: userData,
      loading: false,
      isAuthenticated: true
    });
    setCurrentView('dashboard');
    if (window.showSuccess) {
      showSuccess(`Willkommen zurück, ${userData.salonName}!`);
    }
  };

  const handleLogout = () => {
    ProfiSlots.API.auth.logout();
    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false
    });
    setCurrentView('dashboard');
    ProfiSlots.Storage.remove('lastView');
    if (window.showSuccess) {
      showSuccess('Erfolgreich abgemeldet');
    }
  };

  // Render Current View Component
  const renderCurrentView = () => {
    if (!authState.isAuthenticated) {
      return React.createElement(ProfiSlots.AuthPage, {
        key: 'auth-page',
        onLogin: handleLogin
      });
    }

    const commonProps = {
      user: authState.user,
      onViewChange: handleViewChange
    };

    switch (currentView) {
      case 'dashboard':
        return React.createElement(ProfiSlots.Dashboard, {
          key: 'dashboard',
          ...commonProps
        });
      
      case 'booking':
        return React.createElement(ProfiSlots.BookingPage, {
          key: 'booking',
          ...commonProps
        });
      
      case 'appointments':
      case 'customers':
      case 'services':
      case 'staff':
        // Temporäre Platzhalter
        return React.createElement('div', {
          key: `placeholder-${currentView}`,
          className: "container-main py-8 text-center"
        }, [
          React.createElement('h1', {
            key: 'title',
            className: "text-2xl font-bold text-gray-800 mb-4"
          }, `${currentView.charAt(0).toUpperCase() + currentView.slice(1)} - Coming Soon`),
          React.createElement('p', {
            key: 'message',
            className: "text-gray-600 mb-6"
          }, 'Diese Seite wird gerade entwickelt.'),
          React.createElement('button', {
            key: 'back-button',
            onClick: () => handleViewChange('dashboard'),
            className: "btn-primary"
          }, 'Zurück zum Dashboard')
        ]);
      
      default:
        return React.createElement('div', {
          key: 'error-view',
          className: "container-main py-8 text-center"
        }, [
          React.createElement('h1', {
            key: 'error-title',
            className: "text-2xl font-bold text-gray-800 mb-4"
          }, '404 - Seite nicht gefunden'),
          React.createElement('p', {
            key: 'error-message',
            className: "text-gray-600 mb-6"
          }, `Die angeforderte Seite "${currentView}" existiert nicht.`),
          React.createElement('button', {
            key: 'back-button',
            onClick: () => handleViewChange('dashboard'),
            className: "btn-primary"
          }, 'Zurück zum Dashboard')
        ]);
    }
  };

  // Loading Screen
  if (appLoading || authState.loading) {
    return React.createElement('div', {
      key: 'loading-screen',
      className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
    }, [
      React.createElement('div', {
        key: 'loading-content',
        className: "text-center animate-fade-in"
      }, [
        React.createElement('div', {
          key: 'loading-logo',
          className: "w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mx-auto mb-6 flex items-center justify-center"
        }, [
          React.createElement(lucide.Calendar, {
            key: 'loading-icon',
            className: "w-12 h-12 text-white"
          })
        ]),
        React.createElement('h1', {
          key: 'loading-title',
          className: "text-3xl font-bold text-gray-800 mb-2"
        }, 'ProfiSlots'),
        React.createElement('div', {
          key: 'loading-spinner',
          className: "w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
        }),
        React.createElement('p', {
          key: 'loading-text',
          className: "text-gray-600"
        }, 'Terminbuchungssystem wird geladen...'),
        
        systemStatus !== 'online' && React.createElement('div', {
          key: 'system-status',
          className: `mt-4 p-3 rounded-lg ${
            systemStatus === 'offline' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }`
        }, [
          React.createElement('div', {
            key: 'status-content',
            className: "flex items-center justify-center"
          }, [
            React.createElement(lucide.AlertTriangle, {
              key: 'status-icon',
              className: "w-4 h-4 mr-2"
            }),
            React.createElement('span', {
              key: 'status-text',
              className: "text-sm"
            }, systemStatus === 'offline' 
              ? 'Verbindung zum Server wird hergestellt...' 
              : 'Systemfehler - Bitte versuchen Sie es später erneut'
            )
          ])
        ])
      ])
    ]);
  }

  // System Error Screen
  if (systemStatus === 'error') {
    return React.createElement('div', {
      key: 'error-screen',
      className: "min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4"
    }, [
      React.createElement('div', {
        key: 'error-content',
        className: "bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"
      }, [
        React.createElement('div', {
          key: 'error-icon',
          className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        }, [
          React.createElement(lucide.AlertCircle, {
            key: 'error-icon-svg',
            className: "w-8 h-8 text-red-600"
          })
        ]),
        React.createElement('h1', {
          key: 'error-title',
          className: "text-2xl font-bold text-gray-800 mb-4"
        }, 'Systemfehler'),
        React.createElement('p', {
          key: 'error-message',
          className: "text-gray-600 mb-6"
        }, 'Es gab ein Problem beim Laden von ProfiSlots. Bitte versuchen Sie es später erneut.'),
        React.createElement('button', {
          key: 'retry-button',
          onClick: () => window.location.reload(),
          className: "btn-primary w-full"
        }, 'Seite neu laden')
      ])
    ]);
  }

  // Main App Layout
  return React.createElement('div', {
    key: 'main-app',
    className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
  }, [
    // Header (nur wenn authentifiziert)
    authState.isAuthenticated && React.createElement(ProfiSlots.Header, {
      key: 'header',
      user: authState.user,
      onLogout: handleLogout,
      currentView,
      onViewChange: handleViewChange
    }),

    // Main Content
    React.createElement('main', {
      key: 'main-content',
      className: authState.isAuthenticated ? 'pb-8' : ''
    }, renderCurrentView()),

    // Footer (nur wenn authentifiziert)
    authState.isAuthenticated && React.createElement('footer', {
      key: 'footer',
      className: "bg-white border-t border-gray-200 py-6 mt-8"
    }, [
      React.createElement('div', {
        key: 'footer-content',
        className: "container-main"
      }, [
        React.createElement('div', {
          key: 'footer-inner',
          className: "flex flex-col md:flex-row items-center justify-between"
        }, [
          React.createElement('div', {
            key: 'footer-brand',
            className: "flex items-center space-x-2 mb-4 md:mb-0"
          }, [
            React.createElement('div', {
              key: 'footer-logo',
              className: "w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
            }, [
              React.createElement(lucide.Calendar, {
                key: 'footer-icon',
                className: "w-5 h-5 text-white"
              })
            ]),
            React.createElement('span', {
              key: 'footer-text',
              className: "text-gray-600 text-sm"
            }, `© 2024 ProfiSlots - ${authState.user?.salonName || 'Salon'}`)
          ]),
          React.createElement('div', {
            key: 'footer-status',
            className: "flex items-center space-x-4 text-sm text-gray-500"
          }, [
            React.createElement('div', {
              key: 'system-status-footer',
              className: "flex items-center space-x-2"
            }, [
              React.createElement('div', {
                key: 'status-dot',
                className: `w-2 h-2 rounded-full ${
                  systemStatus === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                }`
              }),
              React.createElement('span', {
                key: 'status-label'
              }, systemStatus === 'online' ? 'System Online' : 'Verbindung prüfen')
            ]),
            React.createElement('span', {
              key: 'version',
              className: "text-xs"
            }, 'v1.0.0')
          ])
        ])
      ])
    ])
  ]);
};

// ==================== ERROR BOUNDARY ====================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error('React Error Boundary caught an error:', error, errorInfo);
    if (window.ProfiSlots && window.ProfiSlots.ErrorHandler) {
      ProfiSlots.ErrorHandler.log(error, 'React Error Boundary');
    }
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        className: "min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4"
      }, [
        React.createElement('div', {
          key: 'error-boundary-content',
          className: "bg-white rounded-lg shadow-xl p-8 max-w-lg w-full"
        }, [
          React.createElement('div', {
            key: 'error-icon',
            className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          }, [
            React.createElement('div', {
              key: 'error-icon-text',
              className: "text-2xl"
            }, '⚠️')
          ]),
          React.createElement('h1', {
            key: 'error-title',
            className: "text-2xl font-bold text-gray-800 mb-4 text-center"
          }, 'Unerwarteter Fehler'),
          React.createElement('p', {
            key: 'error-message',
            className: "text-gray-600 mb-6 text-center"
          }, 'Es ist ein unerwarteter Fehler in der Anwendung aufgetreten.'),
          
          // Show error details in development
          this.state.error && React.createElement('details', {
            key: 'error-details',
            className: "mb-4 text-sm"
          }, [
            React.createElement('summary', {
              key: 'error-summary',
              className: "cursor-pointer text-gray-600 mb-2"
            }, 'Fehlerdetails anzeigen'),
            React.createElement('pre', {
              key: 'error-stack',
              className: "bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40"
            }, this.state.error.toString() + '\n\n' + (this.state.errorInfo?.componentStack || ''))
          ]),
          
          React.createElement('div', {
            key: 'error-actions',
            className: "flex space-x-3"
          }, [
            React.createElement('button', {
              key: 'reload-button',
              onClick: () => window.location.reload(),
              className: "flex-1 btn-primary"
            }, 'Seite neu laden'),
            React.createElement('button', {
              key: 'reset-button',
              onClick: () => {
                if (window.ProfiSlots && window.ProfiSlots.Storage) {
                  ProfiSlots.Storage.clear();
                }
                window.location.reload();
              },
              className: "flex-1 btn-secondary"
            }, 'App zurücksetzen')
          ])
        ])
      ]);
    }

    return this.props.children;
  }
}

// ==================== APP INITIALIZATION ====================
const initializeProfiSlots = () => {
  console.log('🔄 Starting ProfiSlots initialization...');
  
  // Check if React is available
  if (!window.React || !window.ReactDOM) {
    console.error('❌ React or ReactDOM not loaded');
    if (window.showError) {
      showError('React wurde nicht geladen. Bitte laden Sie die Seite neu.');
    }
    return;
  }
  
  console.log('✅ React loaded');
  
  // Check if lucide is available
  if (!window.lucide) {
    console.error('❌ Lucide icons not loaded');
    if (window.showError) {
      showError('Icons wurden nicht geladen. Bitte laden Sie die Seite neu.');
    }
    return;
  }
  
  console.log('✅ Lucide icons loaded');
  
  // Check if ProfiSlots namespace exists
  if (!window.ProfiSlots) {
    console.error('❌ ProfiSlots namespace not found');
    if (window.showError) {
      showError('ProfiSlots Module wurden nicht geladen. Bitte laden Sie die Seite neu.');
    }
    return;
  }
  
  console.log('✅ ProfiSlots namespace exists');
  
  // Check if all required components are loaded
  const requiredComponents = [
    'ProfiSlots.Header',
    'ProfiSlots.AuthPage', 
    'ProfiSlots.Dashboard',
    'ProfiSlots.BookingPage',
    'ProfiSlots.API'
  ];

  console.log('🔍 Checking required components...');
  
  const missingComponents = requiredComponents.filter(component => {
    const parts = component.split('.');
    let obj = window;
    
    for (const part of parts) {
      if (obj && typeof obj === 'object' && part in obj) {
        obj = obj[part];
      } else {
        console.log(`❌ Missing component: ${component} (failed at ${part})`);
        return true;
      }
    }
    
    const exists = typeof obj !== 'undefined';
    console.log(`${exists ? '✅' : '❌'} Component ${component}: ${exists ? 'found' : 'missing'}`);
    return !exists;
  });

  if (missingComponents.length > 0) {
    console.error('❌ Missing required components:', missingComponents);
    console.log('Available ProfiSlots components:', Object.keys(window.ProfiSlots || {}));
    
    if (window.showError) {
      showError('Fehler beim Laden der Anwendung. Fehlende Komponenten: ' + missingComponents.join(', '));
    }
    return;
  }

  console.log('🚀 All components loaded, starting ProfiSlots...');
  
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('❌ App container not found');
    if (window.showError) {
      showError('App Container nicht gefunden');
    }
    return;
  }

  console.log('✅ App container found');

  try {
    appContainer.innerHTML = '';
    console.log('🎨 Rendering React app...');

    // Use createRoot for React 18
    if (ReactDOM.createRoot) {
      const root = ReactDOM.createRoot(appContainer);
      root.render(
        React.createElement(ErrorBoundary, {}, 
          React.createElement(App, { key: 'main-app' })
        )
      );
    } else {
      // Fallback for older React versions
      ReactDOM.render(
        React.createElement(ErrorBoundary, {}, 
          React.createElement(App, { key: 'main-app' })
        ), 
        appContainer
      );
    }

    console.log('✅ ProfiSlots App started successfully');
  } catch (error) {
    console.error('❌ Error rendering app:', error);
    if (window.showError) {
      showError('Fehler beim Rendern der App: ' + error.message);
    }
  }
};

// ==================== STARTUP ====================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProfiSlots);
} else {
  // Add a small delay to ensure all scripts are loaded
  setTimeout(initializeProfiSlots, 100);
}

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (window.ProfiSlots && window.ProfiSlots.ErrorHandler) {
    ProfiSlots.ErrorHandler.log(event.reason, 'Unhandled Promise Rejection');
  }
  event.preventDefault();
  if (window.showError) {
    showError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (window.ProfiSlots && window.ProfiSlots.ErrorHandler) {
    ProfiSlots.ErrorHandler.log(event.error, 'Global Error Handler');
  }
  
  if (event.error && event.error.message && window.showError) {
    showError('Ein Systemfehler ist aufgetreten. Bitte laden Sie die Seite neu.');
  }
});

console.log('✅ ProfiSlots Main App loaded');
