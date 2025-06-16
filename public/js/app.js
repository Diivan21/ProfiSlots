// ProfiSlots Main App Component
// Hauptkomponente die alle anderen zusammenfügt und das Routing übernimmt

const { useState, useEffect } = React;

const App = () => {
  // Auth State
  const { user, loading: authLoading, login, logout, isAuthenticated } = ProfiSlots.useAuth();
  
  // App State
  const [currentView, setCurrentView] = useState('dashboard');
  const [appLoading, setAppLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('online');

  // Initial App Setup
  useEffect(() => {
    initializeApp();
  }, []);

  // Check auth status changes
  useEffect(() => {
    if (!authLoading) {
      setAppLoading(false);
    }
  }, [authLoading]);

  // App Initialization
  const initializeApp = async () => {
    try {
      // Check system health
      await checkSystemHealth();
      
      // Load any global settings
      await loadAppSettings();
      
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

  const loadAppSettings = async () => {
    // Load any global app settings from localStorage or API
    const savedView = ProfiSlots.Storage.get('lastView');
    if (savedView && isValidView(savedView)) {
      setCurrentView(savedView);
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
      
      // Scroll to top on view change
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      console.log(`📍 View changed to: ${newView}`);
    } else {
      console.error('Invalid view:', newView);
    }
  };

  // Auth Handlers
  const handleLogin = (userData) => {
    login(userData);
    setCurrentView('dashboard');
    showSuccess(`Willkommen zurück, ${userData.salonName}!`);
  };

  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
    ProfiSlots.Storage.remove('lastView');
    showSuccess('Erfolgreich abgemeldet');
  };

  // Render Current View Component
  const renderCurrentView = () => {
    if (!isAuthenticated) {
      return React.createElement(ProfiSlots.AuthPage, {
        onLogin: handleLogin
      });
    }

    const commonProps = {
      user,
      onViewChange: handleViewChange
    };

    switch (currentView) {
      case 'dashboard':
        return React.createElement(ProfiSlots.Dashboard, commonProps);
      
      case 'booking':
        return React.createElement(ProfiSlots.BookingPage, commonProps);
      
      case 'appointments':
        // Temporärer Platzhalter - wird durch echte Komponente ersetzt
        return React.createElement('div', {
          className: "container-main py-8 text-center"
        }, [
          React.createElement('h1', {
            key: 'title',
            className: "text-2xl font-bold text-gray-800 mb-4"
          }, '📅 Terminverwaltung'),
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
      
      case 'customers':
        // Temporärer Platzhalter
        return React.createElement('div', {
          className: "container-main py-8 text-center"
        }, [
          React.createElement('h1', {
            key: 'title',
            className: "text-2xl font-bold text-gray-800 mb-4"
          }, '👥 Kundenverwaltung'),
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
      
      case 'services':
        // Temporärer Platzhalter
        return React.createElement('div', {
          className: "container-main py-8 text-center"
        }, [
          React.createElement('h1', {
            key: 'title',
            className: "text-2xl font-bold text-gray-800 mb-4"
          }, '⚙️ Service-Verwaltung'),
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
      
      case 'staff':
        // Temporärer Platzhalter
        return React.createElement('div', {
          className: "container-main py-8 text-center"
        }, [
          React.createElement('h1', {
            key: 'title',
            className: "text-2xl font-bold text-gray-800 mb-4"
          }, '👨‍💼 Mitarbeiter-Verwaltung'),
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
        console.error('Unknown view:', currentView);
        return React.createElement('div', {
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
  if (appLoading || authLoading) {
    return React.createElement('div', {
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
        
        // System Status Indicator
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
        }, 'Es gab ein Problem beim Laden von ProfiSlots. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.'),
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
    className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
  }, [
    // Header (nur wenn authentifiziert)
    isAuthenticated && React.createElement(ProfiSlots.Header, {
      key: 'header',
      user,
      onLogout: handleLogout,
      currentView,
      onViewChange: handleViewChange
    }),

    // Main Content
    React.createElement('main', {
      key: 'main-content',
      className: isAuthenticated ? 'pb-8' : ''
    }, [
      renderCurrentView()
    ]),

    // Footer (nur wenn authentifiziert)
    isAuthenticated && React.createElement('footer', {
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
            }, `© 2024 ProfiSlots - ${user?.salonName}`)
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
    
    // Log error to console and error tracking service
    console.error('React Error Boundary caught an error:', error, errorInfo);
    ProfiSlots.ErrorHandler.log(error, 'React Error Boundary');
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
            React.createElement(lucide.AlertTriangle, {
              key: 'error-icon-svg',
              className: "w-8 h-8 text-red-600"
            })
          ]),
          React.createElement('h1', {
            key: 'error-title',
            className: "text-2xl font-bold text-gray-800 mb-4 text-center"
          }, 'Unerwarteter Fehler'),
          React.createElement('p', {
            key: 'error-message',
            className: "text-gray-600 mb-6 text-center"
          }, 'Es ist ein unerwarteter Fehler in der Anwendung aufgetreten. Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.'),
          
          // Error Details (nur in Development)
          typeof window !== 'undefined' && window.location.hostname === 'localhost' && React.createElement('details', {
            key: 'error-details',
            className: "mb-6 p-4 bg-gray-50 rounded-lg"
          }, [
            React.createElement('summary', {
              key: 'error-summary',
              className: "cursor-pointer font-medium text-gray-700 mb-2"
            }, 'Fehlerdetails (Development)'),
            React.createElement('pre', {
              key: 'error-stack',
              className: "text-xs text-gray-600 overflow-auto"
            }, this.state.error ? this.state.error.toString() : 'No error details'),
            React.createElement('pre', {
              key: 'error-component-stack',
              className: "text-xs text-gray-600 overflow-auto mt-2"
            }, this.state.errorInfo ? this.state.errorInfo.componentStack : 'No component stack')
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
                ProfiSlots.Storage.clear();
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
  // Check if all required components are loaded
  const requiredComponents = [
    'ProfiSlots.Header',
    'ProfiSlots.AuthPage', 
    'ProfiSlots.Dashboard',
    'ProfiSlots.BookingPage',
    'ProfiSlots.useAuth',
    'ProfiSlots.API'
  ];

  const missingComponents = requiredComponents.filter(component => {
    // Sicherer Check für verfügbare Komponenten
    const parts = component.split('.');
    let obj = window;
    
    for (const part of parts) {
      if (obj && typeof obj === 'object' && part in obj) {
        obj = obj[part];
      } else {
        return true; // Component missing
      }
    }
    
    return typeof obj === 'undefined';
  });

  if (missingComponents.length > 0) {
    console.error('❌ Missing required components:', missingComponents);
    showError('Fehler beim Laden der Anwendung. Bitte laden Sie die Seite neu.');
    return;
  }

  // All components loaded, render the app
  console.log('🚀 All components loaded, starting ProfiSlots...');
  
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('❌ App container not found');
    return;
  }

  // Clear loading screen
  appContainer.innerHTML = '';

  // Render app with error boundary
  ReactDOM.render(
    React.createElement(ErrorBoundary, {}, [
      React.createElement(App, { key: 'app' })
    ]), 
    appContainer
  );

  console.log('✅ ProfiSlots App started successfully');
};

// ==================== STARTUP ====================
// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProfiSlots);
} else {
  // DOM is already ready
  initializeProfiSlots();
}

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  ProfiSlots.ErrorHandler.log(event.reason, 'Unhandled Promise Rejection');
  
  // Prevent the default browser behavior
  event.preventDefault();
  
  // Show user-friendly error message
  showError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  ProfiSlots.ErrorHandler.log(event.error, 'Global Error Handler');
  
  // Show user-friendly error message for critical errors
  if (event.error && event.error.message) {
    showError('Ein Systemfehler ist aufgetreten. Bitte laden Sie die Seite neu.');
  }
});

console.log('✅ ProfiSlots Main App loaded');
