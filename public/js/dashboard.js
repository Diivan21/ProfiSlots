// ProfiSlots Dashboard Component
// Übersicht, Statistiken und Quick Actions

const { useState, useEffect } = React;

const Dashboard = ({ user, onViewChange }) => {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalCustomers: 0,
    totalServices: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard Daten laden
  const loadDashboardData = async (showRefreshingIndicator = false) => {
    try {
      if (showRefreshingIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Parallel API Calls für bessere Performance
      const [statsResponse, appointmentsResponse] = await Promise.all([
        ProfiSlots.API.dashboard.getStats(),
        ProfiSlots.API.appointments.getAll()
      ]);

      setStats(statsResponse);

      // Termine filtern und sortieren
      const today = ProfiSlots.DateUtils.today();
      const now = new Date();

      // Heutige Termine
      const todayAppts = appointmentsResponse
        .filter(apt => apt.appointment_date === today && apt.status !== 'cancelled')
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

      // Kommende Termine (nächsten 7 Tage)
      const upcomingAppts = appointmentsResponse
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date + ' ' + apt.appointment_time);
          const isUpcoming = aptDate >= now && apt.status !== 'cancelled';
          const isWithinWeek = new Date(apt.appointment_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          return isUpcoming && isWithinWeek;
        })
        .sort((a, b) => {
          const dateA = new Date(a.appointment_date + ' ' + a.appointment_time);
          const dateB = new Date(b.appointment_date + ' ' + b.appointment_time);
          return dateA - dateB;
        })
        .slice(0, 5); // Nur die nächsten 5

      setTodayAppointments(todayAppts);
      setUpcomingAppointments(upcomingAppts);

    } catch (error) {
      console.error('Dashboard loading error:', error);
      showError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh alle 30 Sekunden
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // Quick Actions
  const quickActions = [
    {
      id: 'new-appointment',
      title: 'Neuen Termin buchen',
      description: 'Schnell einen neuen Termin erstellen',
      icon: lucide.CalendarPlus,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => onViewChange('booking')
    },
    {
      id: 'new-customer',
      title: 'Neuen Kunden anlegen',
      description: 'Kundendaten erfassen',
      icon: lucide.UserPlus,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => onViewChange('customers')
    },
    {
      id: 'view-appointments',
      title: 'Alle Termine',
      description: 'Terminübersicht und Verwaltung',
      icon: lucide.Calendar,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => onViewChange('appointments')
    },
    {
      id: 'manage-services',
      title: 'Services verwalten',
      description: 'Angebote und Preise bearbeiten',
      icon: lucide.Settings,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => onViewChange('services')
    }
  ];

  // Status Badge für Termine
  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { color: 'bg-green-100 text-green-800', label: 'Bestätigt' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Ausstehend' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Storniert' }
    };
    
    const config = statusConfig[status] || statusConfig.confirmed;
    
    return React.createElement('span', {
      className: `px-2 py-1 rounded-full text-xs font-medium ${config.color}`
    }, config.label);
  };

  // Loading Screen
  if (loading) {
    return React.createElement('div', {
      className: "container-main py-8"
    }, [
      React.createElement('div', {
        key: 'loading',
        className: "text-center"
      }, [
        React.createElement('div', {
          key: 'spinner',
          className: "loading-spinner w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
        }),
        React.createElement('p', {
          key: 'text',
          className: "text-gray-600"
        }, 'Dashboard wird geladen...')
      ])
    ]);
  }

  return React.createElement('div', {
    className: "container-main py-6 space-y-6"
  }, [
    // Welcome Header
    React.createElement('div', {
      key: 'welcome-header',
      className: "bg-white rounded-lg shadow-lg p-6"
    }, [
      React.createElement('div', {
        key: 'welcome-content',
        className: "flex items-center justify-between"
      }, [
        React.createElement('div', {
          key: 'welcome-text'
        }, [
          React.createElement('h1', {
            key: 'title',
            className: "text-2xl font-bold text-gray-800 mb-2"
          }, `Willkommen zurück, ${user.salonName}!`),
          React.createElement('p', {
            key: 'subtitle',
            className: "text-gray-600"
          }, `Heute ist ${ProfiSlots.DateUtils.formatGerman(ProfiSlots.DateUtils.today())} - Hier ist Ihre Übersicht`)
        ]),
        React.createElement('button', {
          key: 'refresh-button',
          onClick: handleRefresh,
          disabled: refreshing,
          className: "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50",
          title: "Dashboard aktualisieren"
        }, [
          React.createElement(lucide.RefreshCw, {
            key: 'refresh-icon',
            className: `w-5 h-5 ${refreshing ? 'animate-spin' : ''}`
          })
        ])
      ])
    ]),

    // Statistics Cards
    React.createElement('div', {
      key: 'stats-grid',
      className: "grid grid-cols-1 md:grid-cols-3 gap-6"
    }, [
      // Today's Appointments
      React.createElement('div', {
        key: 'today-stat',
        className: "bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white card-hover cursor-pointer",
        onClick: () => onViewChange('appointments')
      }, [
        React.createElement('div', {
          key: 'today-content',
          className: "flex items-center"
        }, [
          React.createElement(lucide.Calendar, {
            key: 'today-icon',
            className: "w-8 h-8 mr-4"
          }),
          React.createElement('div', {
            key: 'today-info'
          }, [
            React.createElement('h3', {
              key: 'today-title',
              className: "text-lg font-medium opacity-90"
            }, 'Termine heute'),
            React.createElement('p', {
              key: 'today-number',
              className: "text-3xl font-bold"
            }, stats.todayAppointments),
            React.createElement('p', {
              key: 'today-subtitle',
              className: "text-sm opacity-75"
            }, 'Bestätigte Termine')
          ])
        ])
      ]),

      // Total Customers
      React.createElement('div', {
        key: 'customers-stat',
        className: "bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white card-hover cursor-pointer",
        onClick: () => onViewChange('customers')
      }, [
        React.createElement('div', {
          key: 'customers-content',
          className: "flex items-center"
        }, [
          React.createElement(lucide.Users, {
            key: 'customers-icon',
            className: "w-8 h-8 mr-4"
          }),
          React.createElement('div', {
            key: 'customers-info'
          }, [
            React.createElement('h3', {
              key: 'customers-title',
              className: "text-lg font-medium opacity-90"
            }, 'Kunden'),
            React.createElement('p', {
              key: 'customers-number',
              className: "text-3xl font-bold"
            }, stats.totalCustomers),
            React.createElement('p', {
              key: 'customers-subtitle',
              className: "text-sm opacity-75"
            }, 'Registrierte Kunden')
          ])
        ])
      ]),

      // Total Services
      React.createElement('div', {
        key: 'services-stat',
        className: "bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white card-hover cursor-pointer",
        onClick: () => onViewChange('services')
      }, [
        React.createElement('div', {
          key: 'services-content',
          className: "flex items-center"
        }, [
          React.createElement(lucide.Scissors, {
            key: 'services-icon',
            className: "w-8 h-8 mr-4"
          }),
          React.createElement('div', {
            key: 'services-info'
          }, [
            React.createElement('h3', {
              key: 'services-title',
              className: "text-lg font-medium opacity-90"
            }, 'Services'),
            React.createElement('p', {
              key: 'services-number',
              className: "text-3xl font-bold"
            }, stats.totalServices),
            React.createElement('p', {
              key: 'services-subtitle',
              className: "text-sm opacity-75"
            }, 'Verfügbare Angebote')
          ])
        ])
      ])
    ]),

    // Quick Actions
    React.createElement('div', {
      key: 'quick-actions',
      className: "bg-white rounded-lg shadow-lg p-6"
    }, [
      React.createElement('h2', {
        key: 'actions-title',
        className: "text-xl font-semibold text-gray-800 mb-4 flex items-center"
      }, [
        React.createElement(lucide.Zap, {
          key: 'actions-icon',
          className: "w-5 h-5 mr-2 text-yellow-500"
        }),
        'Schnellaktionen'
      ]),
      React.createElement('div', {
        key: 'actions-grid',
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      }, quickActions.map(action => 
        React.createElement('button', {
          key: action.id,
          onClick: action.action,
          className: `${action.color} text-white p-4 rounded-lg transition-colors duration-200 text-left group`
        }, [
          React.createElement('div', {
            key: 'action-header',
            className: "flex items-center mb-3"
          }, [
            React.createElement(action.icon, {
              key: 'action-icon',
              className: "w-6 h-6 mr-3"
            }),
            React.createElement('span', {
              key: 'action-arrow',
              className: "ml-auto transform group-hover:translate-x-1 transition-transform duration-200"
            }, [
              React.createElement(lucide.ArrowRight, {
                key: 'arrow-icon',
                className: "w-4 h-4"
              })
            ])
          ]),
          React.createElement('h3', {
            key: 'action-title',
            className: "font-medium mb-1"
          }, action.title),
          React.createElement('p', {
            key: 'action-description',
            className: "text-sm opacity-90"
          }, action.description)
        ])
      ))
    ]),

    // Today's Appointments and Upcoming
    React.createElement('div', {
      key: 'appointments-section',
      className: "grid grid-cols-1 lg:grid-cols-2 gap-6"
    }, [
      // Today's Appointments
      React.createElement('div', {
        key: 'today-appointments',
        className: "bg-white rounded-lg shadow-lg p-6"
      }, [
        React.createElement('div', {
          key: 'today-header',
          className: "flex items-center justify-between mb-4"
        }, [
          React.createElement('h2', {
            key: 'today-appointments-title',
            className: "text-xl font-semibold text-gray-800 flex items-center"
          }, [
            React.createElement(lucide.Clock, {
              key: 'today-clock-icon',
              className: "w-5 h-5 mr-2 text-blue-600"
            }),
            'Heute'
          ]),
          React.createElement('span', {
            key: 'today-count',
            className: "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium"
          }, `${todayAppointments.length} Termine`)
        ]),
        
        todayAppointments.length === 0 ? 
          React.createElement('div', {
            key: 'no-today-appointments',
            className: "text-center py-8"
          }, [
            React.createElement(lucide.Calendar, {
              key: 'no-appointments-icon',
              className: "w-12 h-12 text-gray-300 mx-auto mb-4"
            }),
            React.createElement('p', {
              key: 'no-appointments-text',
              className: "text-gray-500"
            }, 'Keine Termine für heute')
          ]) :
          React.createElement('div', {
            key: 'today-appointments-list',
            className: "space-y-3 max-h-64 overflow-y-auto custom-scrollbar"
          }, todayAppointments.map(apt => 
            React.createElement('div', {
              key: apt.id,
              className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            }, [
              React.createElement('div', {
                key: 'apt-header',
                className: "flex items-center justify-between mb-2"
              }, [
                React.createElement('div', {
                  key: 'apt-time',
                  className: "font-semibold text-gray-800"
                }, apt.appointment_time),
                getStatusBadge(apt.status)
              ]),
              React.createElement('div', {
                key: 'apt-details',
                className: "text-sm text-gray-600 space-y-1"
              }, [
                React.createElement('div', {
                  key: 'customer',
                  className: "flex items-center"
                }, [
                  React.createElement(lucide.User, {
                    key: 'customer-icon',
                    className: "w-4 h-4 mr-2"
                  }),
                  apt.customer_name
                ]),
                React.createElement('div', {
                  key: 'service',
                  className: "flex items-center"
                }, [
                  React.createElement(lucide.Scissors, {
                    key: 'service-icon',
                    className: "w-4 h-4 mr-2"
                  }),
                  `${apt.service_name} (${ProfiSlots.CurrencyUtils.format(apt.service_price)})`
                ]),
                React.createElement('div', {
                  key: 'staff',
                  className: "flex items-center"
                }, [
                  React.createElement(lucide.UserCheck, {
                    key: 'staff-icon',
                    className: "w-4 h-4 mr-2"
                  }),
                  apt.staff_name
                ])
              ])
            ])
          ))
      ]),

      // Upcoming Appointments
      React.createElement('div', {
        key: 'upcoming-appointments',
        className: "bg-white rounded-lg shadow-lg p-6"
      }, [
        React.createElement('div', {
          key: 'upcoming-header',
          className: "flex items-center justify-between mb-4"
        }, [
          React.createElement('h2', {
            key: 'upcoming-title',
            className: "text-xl font-semibold text-gray-800 flex items-center"
          }, [
            React.createElement(lucide.CalendarDays, {
              key: 'upcoming-icon',
              className: "w-5 h-5 mr-2 text-green-600"
            }),
            'Nächste Termine'
          ]),
          React.createElement('button', {
            key: 'view-all-button',
            onClick: () => onViewChange('appointments'),
            className: "text-blue-600 hover:text-blue-700 text-sm font-medium"
          }, 'Alle anzeigen →')
        ]),
        
        upcomingAppointments.length === 0 ? 
          React.createElement('div', {
            key: 'no-upcoming',
            className: "text-center py-8"
          }, [
            React.createElement(lucide.CalendarX, {
              key: 'no-upcoming-icon',
              className: "w-12 h-12 text-gray-300 mx-auto mb-4"
            }),
            React.createElement('p', {
              key: 'no-upcoming-text',
              className: "text-gray-500 mb-3"
            }, 'Keine bevorstehenden Termine'),
            React.createElement('button', {
              key: 'book-appointment-button',
              onClick: () => onViewChange('booking'),
              className: "btn-primary"
            }, 'Termin buchen')
          ]) :
          React.createElement('div', {
            key: 'upcoming-list',
            className: "space-y-3 max-h-64 overflow-y-auto custom-scrollbar"
          }, upcomingAppointments.map(apt => 
            React.createElement('div', {
              key: apt.id,
              className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            }, [
              React.createElement('div', {
                key: 'upcoming-apt-header',
                className: "flex items-center justify-between mb-2"
              }, [
                React.createElement('div', {
                  key: 'upcoming-datetime',
                  className: "font-semibold text-gray-800"
                }, ProfiSlots.DateUtils.formatDateTime(apt.appointment_date, apt.appointment_time)),
                getStatusBadge(apt.status)
              ]),
              React.createElement('div', {
                key: 'upcoming-apt-details',
                className: "text-sm text-gray-600 space-y-1"
              }, [
                React.createElement('div', {
                  key: 'upcoming-customer',
                  className: "flex items-center"
                }, [
                  React.createElement(lucide.User, {
                    key: 'upcoming-customer-icon',
                    className: "w-4 h-4 mr-2"
                  }),
                  apt.customer_name
                ]),
                React.createElement('div', {
                  key: 'upcoming-service',
                  className: "flex items-center"
                }, [
                  React.createElement(lucide.Scissors, {
                    key: 'upcoming-service-icon',
                    className: "w-4 h-4 mr-2"
                  }),
                  apt.service_name
                ])
              ])
            ])
          ))
      ])
    ])
  ]);
};

// ==================== GLOBAL VERFÜGBAR MACHEN ====================
window.ProfiSlots = window.ProfiSlots || {};
window.ProfiSlots.Dashboard = Dashboard;

console.log('✅ ProfiSlots Dashboard Component loaded');
