// ProfiSlots Header Component
// Navigation, Logo und User Menu

const { useState, useEffect } = React;

const Header = ({ user, onLogout, currentView, onViewChange }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (!event.target.closest('.mobile-menu-container')) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Navigation Items
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: React.createElement(lucide.LayoutDashboard, { className: "w-5 h-5" }),
      description: 'Übersicht und Statistiken'
    },
    {
      id: 'booking',
      label: 'Termine buchen',
      icon: React.createElement(lucide.CalendarPlus, { className: "w-5 h-5" }),
      description: 'Neue Termine erstellen'
    },
    {
      id: 'appointments',
      label: 'Terminverwaltung',
      icon: React.createElement(lucide.Calendar, { className: "w-5 h-5" }),
      description: 'Alle Termine verwalten'
    },
    {
      id: 'customers',
      label: 'Kunden',
      icon: React.createElement(lucide.Users, { className: "w-5 h-5" }),
      description: 'Kundenverwaltung'
    },
    {
      id: 'services',
      label: 'Services',
      icon: React.createElement(lucide.Scissors, { className: "w-5 h-5" }),
      description: 'Service-Verwaltung'
    },
    {
      id: 'staff',
      label: 'Mitarbeiter',
      icon: React.createElement(lucide.UserCheck, { className: "w-5 h-5" }),
      description: 'Mitarbeiter-Verwaltung'
    }
  ];

  const handleNavigation = (viewId) => {
    onViewChange(viewId);
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    if (window.confirm('Möchten Sie sich wirklich abmelden?')) {
      onLogout();
    }
  };

  const getUserInitials = (user) => {
    if (!user) return 'U';
    if (user.salonName) {
      return ProfiSlots.StringUtils.getInitials(user.salonName);
    }
    return ProfiSlots.StringUtils.getInitials(user.email);
  };

  return React.createElement('div', {
    className: "bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40"
  }, [
    // Main Header Container
    React.createElement('div', {
      key: 'header-container',
      className: "container-main"
    }, [
      React.createElement('div', {
        key: 'header-content',
        className: "flex items-center justify-between h-16"
      }, [
        // Logo and Brand
        React.createElement('div', {
          key: 'brand',
          className: "flex items-center space-x-3"
        }, [
          React.createElement('div', {
            key: 'logo',
            className: "w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
          }, [
            React.createElement(lucide.Calendar, {
              key: 'logo-icon',
              className: "w-6 h-6 text-white"
            })
          ]),
          React.createElement('div', {
            key: 'brand-text',
            className: "hidden sm:block"
          }, [
            React.createElement('h1', {
              key: 'app-name',
              className: "text-xl font-bold text-gray-800"
            }, 'ProfiSlots'),
            user && React.createElement('p', {
              key: 'salon-name',
              className: "text-sm text-gray-600"
            }, user.salonName)
          ])
        ]),

        // Desktop Navigation
        React.createElement('nav', {
          key: 'desktop-nav',
          className: "hidden lg:flex items-center space-x-1"
        }, navigationItems.map(item => 
          React.createElement('button', {
            key: item.id,
            onClick: () => handleNavigation(item.id),
            className: `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
              currentView === item.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`,
            title: item.description
          }, [
            React.createElement('span', { key: 'icon' }, item.icon),
            React.createElement('span', { 
              key: 'label',
              className: "hidden xl:inline"
            }, item.label)
          ])
        )),

        // Right Side - User Menu and Mobile Menu Button
        React.createElement('div', {
          key: 'right-side',
          className: "flex items-center space-x-3"
        }, [
          // User Menu
          React.createElement('div', {
            key: 'user-menu',
            className: "user-menu-container relative"
          }, [
            React.createElement('button', {
              key: 'user-button',
              onClick: () => setShowUserMenu(!showUserMenu),
              className: "flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            }, [
              React.createElement('div', {
                key: 'avatar',
                className: "w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium"
              }, getUserInitials(user)),
              React.createElement('div', {
                key: 'user-info',
                className: "hidden sm:block text-left"
              }, [
                React.createElement('div', {
                  key: 'email',
                  className: "text-sm font-medium text-gray-800"
                }, user?.email || 'User'),
                React.createElement('div', {
                  key: 'role',
                  className: "text-xs text-gray-500"
                }, 'Salon-Besitzer')
              ]),
              React.createElement(lucide.ChevronDown, {
                key: 'chevron',
                className: `w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  showUserMenu ? 'rotate-180' : ''
                }`
              })
            ]),

            // User Dropdown Menu
            showUserMenu && React.createElement('div', {
              key: 'user-dropdown',
              className: "absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 animate-fade-in"
            }, [
              // User Info Header
              React.createElement('div', {
                key: 'user-header',
                className: "px-4 py-3 border-b border-gray-100"
              }, [
                React.createElement('div', {
                  key: 'user-details',
                  className: "flex items-center space-x-3"
                }, [
                  React.createElement('div', {
                    key: 'avatar-large',
                    className: "w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium"
                  }, getUserInitials(user)),
                  React.createElement('div', {
                    key: 'user-text'
                  }, [
                    React.createElement('div', {
                      key: 'email-display',
                      className: "font-medium text-gray-800 truncate"
                    }, user?.email),
                    React.createElement('div', {
                      key: 'salon-display',
                      className: "text-sm text-gray-500 truncate"
                    }, user?.salonName)
                  ])
                ])
              ]),

              // Menu Items
              React.createElement('div', {
                key: 'menu-items',
                className: "py-2"
              }, [
                React.createElement('button', {
                  key: 'profile',
                  className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3",
                  onClick: () => {
                    setShowUserMenu(false);
                    // TODO: Profil-Einstellungen öffnen
                    showSuccess('Profil-Einstellungen coming soon!');
                  }
                }, [
                  React.createElement(lucide.User, {
                    key: 'profile-icon',
                    className: "w-4 h-4 text-gray-500"
                  }),
                  React.createElement('span', {
                    key: 'profile-text'
                  }, 'Profil-Einstellungen')
                ]),

                React.createElement('button', {
                  key: 'settings',
                  className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3",
                  onClick: () => {
                    setShowUserMenu(false);
                    // TODO: Einstellungen öffnen
                    showSuccess('Einstellungen coming soon!');
                  }
                }, [
                  React.createElement(lucide.Settings, {
                    key: 'settings-icon',
                    className: "w-4 h-4 text-gray-500"
                  }),
                  React.createElement('span', {
                    key: 'settings-text'
                  }, 'Einstellungen')
                ]),

                React.createElement('div', {
                  key: 'divider',
                  className: "border-t border-gray-100 my-2"
                }),

                React.createElement('button', {
                  key: 'logout',
                  onClick: handleLogout,
                  className: "w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                }, [
                  React.createElement(lucide.LogOut, {
                    key: 'logout-icon',
                    className: "w-4 h-4 text-red-500"
                  }),
                  React.createElement('span', {
                    key: 'logout-text'
                  }, 'Abmelden')
                ])
              ])
            ])
          ]),

          // Mobile Menu Button
          React.createElement('button', {
            key: 'mobile-menu-button',
            onClick: () => setShowMobileMenu(!showMobileMenu),
            className: "lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 mobile-menu-container"
          }, [
            React.createElement(lucide.Menu, {
              key: 'menu-icon',
              className: "w-5 h-5 text-gray-600"
            })
          ])
        ])
      ])
    ]),

    // Mobile Navigation Menu
    showMobileMenu && React.createElement('div', {
      key: 'mobile-menu',
      className: "lg:hidden bg-white border-t border-gray-200 animate-slide-up mobile-menu-container"
    }, [
      React.createElement('nav', {
        key: 'mobile-nav',
        className: "px-4 py-4 space-y-2"
      }, navigationItems.map(item =>
        React.createElement('button', {
          key: item.id,
          onClick: () => handleNavigation(item.id),
          className: `w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors duration-200 ${
            currentView === item.id
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`
        }, [
          React.createElement('span', { key: 'icon' }, item.icon),
          React.createElement('div', { key: 'content' }, [
            React.createElement('div', {
              key: 'label',
              className: "font-medium"
            }, item.label),
            React.createElement('div', {
              key: 'description',
              className: "text-xs text-gray-500"
            }, item.description)
          ])
        ])
      ))
    ])
  ]);
};

// Global verfügbar machen
window.ProfiSlots = window.ProfiSlots || {};
window.ProfiSlots.Header = Header;

console.log('✅ ProfiSlots Header Component loaded');
