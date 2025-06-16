// ProfiSlots Booking Component
// Terminbuchung mit Service-Auswahl, Mitarbeiter, Datum/Zeit und Kunden

const { useState, useEffect } = React;

const BookingPage = ({ user, onViewChange }) => {
  // Form State
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Data State
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  
  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load available time slots when staff and date change
  useEffect(() => {
    if (selectedStaff && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedStaff, selectedDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [servicesData, staffData, customersData] = await Promise.all([
        ProfiSlots.API.services.getAll(),
        ProfiSlots.API.staff.getAll(),
        ProfiSlots.API.customers.getAll()
      ]);
      
      setServices(servicesData);
      setStaff(staffData);
      setCustomers(customersData);
      
      // Set today as default date
      setSelectedDate(ProfiSlots.DateUtils.today());
      
    } catch (error) {
      showError('Fehler beim Laden der Daten: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      // Generate all possible time slots
      const allSlots = ProfiSlots.DateUtils.generateTimeSlots(8, 18, 30);
      
      // Get existing appointments for this staff member and date
      const appointments = await ProfiSlots.API.appointments.getByDate(selectedDate);
      const staffAppointments = appointments.filter(apt => 
        apt.staff_id === selectedStaff.id && apt.status !== 'cancelled'
      );
      
      // Filter out booked slots
      const available = allSlots.filter(slot => {
        return !staffAppointments.some(apt => apt.appointment_time === slot);
      });
      
      // Filter out past slots for today
      const now = new Date();
      const isToday = ProfiSlots.DateUtils.isToday(selectedDate);
      
      const filteredSlots = available.filter(slot => {
        if (!isToday) return true;
        
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        
        return slotTime > now;
      });
      
      setAvailableSlots(filteredSlots);
      
      // Clear selected time if it's no longer available
      if (selectedTime && !filteredSlots.includes(selectedTime)) {
        setSelectedTime('');
      }
      
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    }
  };

  // Service icon helper
  const getServiceIcon = (iconName) => {
    const icons = {
      'Scissors': lucide.Scissors,
      'Heart': lucide.Heart,
      'MessageSquare': lucide.MessageSquare,
      'User': lucide.User,
      'Settings': lucide.Settings
    };
    return icons[iconName] || lucide.Scissors;
  };

  // Customer search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm)
  );

  // Handle new customer creation
  const handleCreateCustomer = async () => {
    try {
      if (!ProfiSlots.Validation.isValidName(newCustomer.name)) {
        throw new Error('Gültiger Name ist erforderlich');
      }
      if (!ProfiSlots.Validation.isValidPhone(newCustomer.phone)) {
        throw new Error('Gültige Telefonnummer ist erforderlich');
      }
      if (newCustomer.email && !ProfiSlots.Validation.isValidEmail(newCustomer.email)) {
        throw new Error('Gültige E-Mail-Adresse eingeben');
      }

      const createdCustomer = await ProfiSlots.API.customers.create(newCustomer);
      
      // Add to customers list and select
      setCustomers(prev => [...prev, createdCustomer]);
      setSelectedCustomer(createdCustomer);
      
      // Reset form
      setNewCustomer({ name: '', phone: '', email: '' });
      setShowNewCustomerForm(false);
      setShowCustomerModal(false);
      setCustomerSearchTerm('');
      
      showSuccess('Kunde erfolgreich erstellt!');
    } catch (error) {
      showError(error.message);
    }
  };

  // Handle appointment booking
  const handleBookAppointment = async () => {
    try {
      // Validation
      if (!selectedService) {
        throw new Error('Bitte wählen Sie einen Service aus');
      }
      if (!selectedStaff) {
        throw new Error('Bitte wählen Sie einen Mitarbeiter aus');
      }
      if (!selectedDate) {
        throw new Error('Bitte wählen Sie ein Datum aus');
      }
      if (!selectedTime) {
        throw new Error('Bitte wählen Sie eine Uhrzeit aus');
      }
      if (!selectedCustomer) {
        throw new Error('Bitte wählen Sie einen Kunden aus');
      }

      setSubmitting(true);

      const appointmentData = {
        customerId: selectedCustomer.id,
        staffId: selectedStaff.id,
        serviceId: selectedService.id,
        date: selectedDate,
        time: selectedTime
      };

      await ProfiSlots.API.appointments.create(appointmentData);
      
      showSuccess('Termin erfolgreich gebucht!');
      
      // Reset form
      resetForm();
      
      // Optionally redirect to appointments view
      setTimeout(() => {
        onViewChange('appointments');
      }, 1500);
      
    } catch (error) {
      showError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(ProfiSlots.DateUtils.today());
    setSelectedTime('');
    setSelectedCustomer(null);
    setCustomerSearchTerm('');
    setShowNewCustomerForm(false);
    setShowCustomerModal(false);
    setNewCustomer({ name: '', phone: '', email: '' });
  };

  // Loading screen
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
        }, 'Buchungsdaten werden geladen...')
      ])
    ]);
  }

  return React.createElement('div', {
    className: "container-main py-6 space-y-6"
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: "bg-white rounded-lg shadow-lg p-6"
    }, [
      React.createElement('div', {
        key: 'header-content',
        className: "flex items-center justify-between"
      }, [
        React.createElement('div', {
          key: 'title-section'
        }, [
          React.createElement('h1', {
            key: 'title',
            className: "text-2xl font-bold text-gray-800 mb-2 flex items-center"
          }, [
            React.createElement(lucide.CalendarPlus, {
              key: 'title-icon',
              className: "w-6 h-6 mr-2 text-blue-600"
            }),
            'Neuen Termin buchen'
          ]),
          React.createElement('p', {
            key: 'subtitle',
            className: "text-gray-600"
          }, 'Erstellen Sie schnell und einfach einen neuen Termin')
        ]),
        React.createElement('button', {
          key: 'reset-button',
          onClick: resetForm,
          className: "btn-secondary flex items-center space-x-2",
          title: "Formular zurücksetzen"
        }, [
          React.createElement(lucide.RotateCcw, {
            key: 'reset-icon',
            className: "w-4 h-4"
          }),
          React.createElement('span', {
            key: 'reset-text',
            className: "hidden sm:inline"
          }, 'Zurücksetzen')
        ])
      ])
    ]),

    // Main Booking Form
    React.createElement('div', {
      key: 'booking-form',
      className: "grid grid-cols-1 lg:grid-cols-3 gap-6"
    }, [
      // Left Column - Service & Staff Selection
      React.createElement('div', {
        key: 'left-column',
        className: "lg:col-span-2 space-y-6"
      }, [
        // Service Selection
        React.createElement('div', {
          key: 'service-selection',
          className: "bg-white rounded-lg shadow-lg p-6"
        }, [
          React.createElement('h2', {
            key: 'service-title',
            className: "text-xl font-semibold text-gray-800 mb-4 flex items-center"
          }, [
            React.createElement(lucide.Scissors, {
              key: 'service-icon',
              className: "w-5 h-5 mr-2 text-blue-600"
            }),
            'Service auswählen',
            React.createElement('span', {
              key: 'service-required',
              className: "text-red-500 ml-1"
            }, '*')
          ]),
          React.createElement('div', {
            key: 'service-grid',
            className: "grid grid-cols-1 md:grid-cols-2 gap-4"
          }, services.map(service => {
            const IconComponent = getServiceIcon(service.icon);
            return React.createElement('button', {
              key: service.id,
              onClick: () => setSelectedService(service),
              className: `service-card ${
                selectedService?.id === service.id ? 'service-card-selected' : 'service-card-available'
              }`
            }, [
              React.createElement('div', {
                key: 'service-header',
                className: "flex items-center justify-between mb-3"
              }, [
                React.createElement('div', {
                  key: 'service-info',
                  className: "flex items-center space-x-3"
                }, [
                  React.createElement(IconComponent, {
                    key: 'service-icon-comp',
                    className: "w-6 h-6 text-blue-600"
                  }),
                  React.createElement('div', {
                    key: 'service-details'
                  }, [
                    React.createElement('div', {
                      key: 'service-name',
                      className: "font-medium text-gray-800"
                    }, service.name),
                    React.createElement('div', {
                      key: 'service-duration',
                      className: "text-sm text-gray-500"
                    }, `${service.duration} Min`)
                  ])
                ]),
                React.createElement('div', {
                  key: 'service-price',
                  className: "text-lg font-semibold text-blue-600"
                }, ProfiSlots.CurrencyUtils.format(service.price))
              ])
            ]);
          }))
        ]),

        // Staff Selection
        React.createElement('div', {
          key: 'staff-selection',
          className: "bg-white rounded-lg shadow-lg p-6"
        }, [
          React.createElement('h2', {
            key: 'staff-title',
            className: "text-xl font-semibold text-gray-800 mb-4 flex items-center"
          }, [
            React.createElement(lucide.UserCheck, {
              key: 'staff-icon',
              className: "w-5 h-5 mr-2 text-blue-600"
            }),
            'Mitarbeiter auswählen',
            React.createElement('span', {
              key: 'staff-required',
              className: "text-red-500 ml-1"
            }, '*')
          ]),
          React.createElement('div', {
            key: 'staff-grid',
            className: "grid grid-cols-1 md:grid-cols-2 gap-4"
          }, staff.map(staffMember => 
            React.createElement('button', {
              key: staffMember.id,
              onClick: () => setSelectedStaff(staffMember),
              className: `staff-card ${
                selectedStaff?.id === staffMember.id ? 'staff-card-selected' : 'staff-card-available'
              }`
            }, [
              React.createElement('div', {
                key: 'staff-content',
                className: "flex items-center space-x-3"
              }, [
                React.createElement('div', {
                  key: 'staff-avatar',
                  className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                }, [
                  React.createElement(lucide.User, {
                    key: 'staff-avatar-icon',
                    className: "w-6 h-6 text-blue-600"
                  })
                ]),
                React.createElement('div', {
                  key: 'staff-info',
                  className: "text-left"
                }, [
                  React.createElement('div', {
                    key: 'staff-name',
                    className: "font-medium text-gray-800"
                  }, staffMember.name),
                  React.createElement('div', {
                    key: 'staff-specialty',
                    className: "text-sm text-gray-500"
                  }, staffMember.specialty)
                ])
              ])
            ])
          ))
        ]),

        // Date & Time Selection
        React.createElement('div', {
          key: 'datetime-selection',
          className: "bg-white rounded-lg shadow-lg p-6"
        }, [
          React.createElement('h2', {
            key: 'datetime-title',
            className: "text-xl font-semibold text-gray-800 mb-4 flex items-center"
          }, [
            React.createElement(lucide.Calendar, {
              key: 'datetime-icon',
              className: "w-5 h-5 mr-2 text-blue-600"
            }),
            'Datum & Uhrzeit',
            React.createElement('span', {
              key: 'datetime-required',
              className: "text-red-500 ml-1"
            }, '*')
          ]),
          
          // Date Selection
          React.createElement('div', {
            key: 'date-section',
            className: "mb-6"
          }, [
            React.createElement('label', {
              key: 'date-label',
              className: "block text-sm font-medium text-gray-700 mb-2"
            }, 'Datum auswählen'),
            React.createElement('input', {
              key: 'date-input',
              type: 'date',
              value: selectedDate,
              onChange: (e) => setSelectedDate(e.target.value),
              min: ProfiSlots.DateUtils.today(),
              className: "input-field"
            })
          ]),

          // Time Selection
          selectedStaff && selectedDate && React.createElement('div', {
            key: 'time-section'
          }, [
            React.createElement('label', {
              key: 'time-label',
              className: "block text-sm font-medium text-gray-700 mb-3"
            }, 'Verfügbare Zeiten'),
            availableSlots.length === 0 ? 
              React.createElement('div', {
                key: 'no-slots',
                className: "text-center py-8"
              }, [
                React.createElement(lucide.Clock, {
                  key: 'no-slots-icon',
                  className: "w-12 h-12 text-gray-300 mx-auto mb-4"
                }),
                React.createElement('p', {
                  key: 'no-slots-text',
                  className: "text-gray-500"
                }, 'Keine freien Zeiten verfügbar')
              ]) :
              React.createElement('div', {
                key: 'time-slots',
                className: "time-slots-grid"
              }, availableSlots.map(slot =>
                React.createElement('button', {
                  key: slot,
                  onClick: () => setSelectedTime(slot),
                  className: `time-slot ${
                    selectedTime === slot ? 'time-slot-selected' : 'time-slot-available'
                  }`
                }, slot)
              ))
          ])
        ])
      ]),

      // Right Column - Customer Selection & Summary
      React.createElement('div', {
        key: 'right-column',
        className: "space-y-6"
      }, [
        // Customer Selection
        React.createElement('div', {
          key: 'customer-selection',
          className: "bg-white rounded-lg shadow-lg p-6"
        }, [
          React.createElement('h2', {
            key: 'customer-title',
            className: "text-xl font-semibold text-gray-800 mb-4 flex items-center"
          }, [
            React.createElement(lucide.User, {
              key: 'customer-icon',
              className: "w-5 h-5 mr-2 text-blue-600"
            }),
            'Kunde auswählen',
            React.createElement('span', {
              key: 'customer-required',
              className: "text-red-500 ml-1"
            }, '*')
          ]),

          selectedCustomer ? 
            // Selected Customer Display
            React.createElement('div', {
              key: 'selected-customer',
              className: "p-4 bg-blue-50 rounded-lg border border-blue-200"
            }, [
              React.createElement('div', {
                key: 'customer-info',
                className: "flex items-center justify-between"
              }, [
                React.createElement('div', {
                  key: 'customer-details',
                  className: "flex items-center space-x-3"
                }, [
                  React.createElement('div', {
                    key: 'customer-avatar',
                    className: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
                  }, [
                    React.createElement(lucide.User, {
                      key: 'customer-avatar-icon',
                      className: "w-6 h-6 text-blue-600"
                    })
                  ]),
                  React.createElement('div', {
                    key: 'customer-data'
                  }, [
                    React.createElement('div', {
                      key: 'customer-name',
                      className: "font-medium text-gray-800"
                    }, selectedCustomer.name),
                    React.createElement('div', {
                      key: 'customer-phone',
                      className: "text-sm text-gray-600"
                    }, selectedCustomer.phone),
                    selectedCustomer.total_visits > 0 && React.createElement('div', {
                      key: 'customer-visits',
                      className: "text-xs text-gray-500"
                    }, `${selectedCustomer.total_visits} Termine`)
                  ])
                ]),
                React.createElement('button', {
                  key: 'change-customer',
                  onClick: () => setSelectedCustomer(null),
                  className: "text-gray-500 hover:text-gray-700"
                }, [
                  React.createElement(lucide.X, {
                    key: 'remove-icon',
                    className: "w-5 h-5"
                  })
                ])
              ])
            ]) :
            // Customer Search & Selection
            React.createElement('div', {
              key: 'customer-search',
              className: "space-y-4"
            }, [
              React.createElement('button', {
                key: 'select-customer-button',
                onClick: () => setShowCustomerModal(true),
                className: "w-full btn-secondary flex items-center justify-center space-x-2"
              }, [
                React.createElement(lucide.Search, {
                  key: 'search-icon',
                  className: "w-4 h-4"
                }),
                React.createElement('span', {
                  key: 'search-text'
                }, 'Kunde suchen oder neu anlegen')
              ])
            ])
        ]),

        // Booking Summary
        React.createElement('div', {
          key: 'booking-summary',
          className: "bg-white rounded-lg shadow-lg p-6"
        }, [
          React.createElement('h2', {
            key: 'summary-title',
            className: "text-xl font-semibold text-gray-800 mb-4 flex items-center"
          }, [
            React.createElement(lucide.FileText, {
              key: 'summary-icon',
              className: "w-5 h-5 mr-2 text-blue-600"
            }),
            'Zusammenfassung'
          ]),
          
          React.createElement('div', {
            key: 'summary-content',
            className: "space-y-3"
          }, [
            // Service Summary
            selectedService && React.createElement('div', {
              key: 'service-summary',
              className: "flex items-center justify-between py-2 border-b border-gray-100"
            }, [
              React.createElement('span', {
                key: 'service-label',
                className: "text-gray-600"
              }, 'Service:'),
              React.createElement('div', {
                key: 'service-value',
                className: "text-right"
              }, [
                React.createElement('div', {
                  key: 'service-name-summary',
                  className: "font-medium"
                }, selectedService.name),
                React.createElement('div', {
                  key: 'service-price-summary',
                  className: "text-sm text-gray-500"
                }, ProfiSlots.CurrencyUtils.format(selectedService.price))
              ])
            ]),

            // Staff Summary
            selectedStaff && React.createElement('div', {
              key: 'staff-summary',
              className: "flex items-center justify-between py-2 border-b border-gray-100"
            }, [
              React.createElement('span', {
                key: 'staff-label',
                className: "text-gray-600"
              }, 'Mitarbeiter:'),
              React.createElement('span', {
                key: 'staff-value',
                className: "font-medium"
              }, selectedStaff.name)
            ]),

            // Date Summary
            selectedDate && React.createElement('div', {
              key: 'date-summary',
              className: "flex items-center justify-between py-2 border-b border-gray-100"
            }, [
              React.createElement('span', {
                key: 'date-label',
                className: "text-gray-600"
              }, 'Datum:'),
              React.createElement('span', {
                key: 'date-value',
                className: "font-medium"
              }, ProfiSlots.DateUtils.formatGerman(selectedDate))
            ]),

            // Time Summary
            selectedTime && React.createElement('div', {
              key: 'time-summary',
              className: "flex items-center justify-between py-2 border-b border-gray-100"
            }, [
              React.createElement('span', {
                key: 'time-label',
                className: "text-gray-600"
              }, 'Uhrzeit:'),
              React.createElement('span', {
                key: 'time-value',
                className: "font-medium"
              }, selectedTime)
            ]),

            // Customer Summary
            selectedCustomer && React.createElement('div', {
              key: 'customer-summary',
              className: "flex items-center justify-between py-2"
            }, [
              React.createElement('span', {
                key: 'customer-label',
                className: "text-gray-600"
              }, 'Kunde:'),
              React.createElement('span', {
                key: 'customer-value',
                className: "font-medium"
              }, selectedCustomer.name)
            ])
          ]),

          // Book Button
          React.createElement('button', {
            key: 'book-button',
            onClick: handleBookAppointment,
            disabled: !selectedService || !selectedStaff || !selectedDate || !selectedTime || !selectedCustomer || submitting,
            className: "w-full mt-6 btn-primary disabled:btn-disabled py-3 text-lg font-semibold"
          }, submitting ? [
            React.createElement('div', {
              key: 'book-spinner',
              className: "loading-spinner mr-2"
            }),
            'Wird gebucht...'
          ] : 'Termin buchen')
        ])
      ])
    ]),

    // Customer Selection Modal
    React.createElement(ProfiSlots.BaseModal, {
      key: 'customer-modal',
      isOpen: showCustomerModal,
      onClose: () => setShowCustomerModal(false),
      title: 'Kunde auswählen',
      size: 'lg'
    }, [
      React.createElement('div', {
        key: 'customer-modal-content',
        className: "space-y-4"
      }, [
        // Search Input
        React.createElement('div', {
          key: 'search-input'
        }, [
          React.createElement('div', {
            key: 'search-container',
            className: "relative"
          }, [
            React.createElement('div', {
              key: 'search-icon-container',
              className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            }, [
              React.createElement(lucide.Search, {
                key: 'search-icon-modal',
                className: "w-5 h-5 text-gray-400"
              })
            ]),
            React.createElement('input', {
              key: 'search-input-field',
              type: 'text',
              value: customerSearchTerm,
              onChange: (e) => setCustomerSearchTerm(e.target.value),
              placeholder: 'Kunde suchen (Name oder Telefon)...',
              className: "input-field pl-10"
            })
          ])
        ]),

        // Customer List
        customerSearchTerm && filteredCustomers.length > 0 && React.createElement('div', {
          key: 'customer-list',
          className: "max-h-60 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg"
        }, filteredCustomers.map(customer =>
          React.createElement('button', {
            key: customer.id,
            onClick: () => {
              setSelectedCustomer(customer);
              setShowCustomerModal(false);
              setCustomerSearchTerm('');
            },
            className: "customer-search-result w-full"
          }, [
            React.createElement('div', {
              key: 'customer-item',
              className: "flex items-center justify-between"
            }, [
              React.createElement('div', {
                key: 'customer-info-modal'
              }, [
                React.createElement('div', {
                  key: 'customer-name-modal',
                  className: "font-medium text-gray-800"
                }, customer.name),
                React.createElement('div', {
                  key: 'customer-phone-modal',
                  className: "text-sm text-gray-500"
                }, customer.phone)
              ]),
              customer.total_visits > 0 && React.createElement('div', {
                key: 'customer-visits-modal',
                className: "text-xs text-gray-400"
              }, `${customer.total_visits} Termine`)
            ])
          ])
        )),

        // No Results
        customerSearchTerm && filteredCustomers.length === 0 && React.createElement('div', {
          key: 'no-results',
          className: "text-center py-8"
        }, [
          React.createElement(lucide.UserX, {
            key: 'no-results-icon',
            className: "w-12 h-12 text-gray-300 mx-auto mb-4"
          }),
          React.createElement('p', {
            key: 'no-results-text',
            className: "text-gray-500 mb-3"
          }, `Kein Kunde gefunden für "${customerSearchTerm}"`),
          React.createElement('button', {
            key: 'create-from-search',
            onClick: () => {
              setNewCustomer(prev => ({ ...prev, name: customerSearchTerm }));
              setShowNewCustomerForm(true);
              setCustomerSearchTerm('');
            },
            className: "btn-primary"
          }, 'Als neuen Kunden anlegen')
        ]),

        // Divider
        React.createElement('div', {
          key: 'divider',
          className: "flex items-center"
        }, [
          React.createElement('div', {
            key: 'divider-line',
            className: "flex-1 border-t border-gray-200"
          }),
          React.createElement('span', {
            key: 'divider-text',
            className: "px-3 text-sm text-gray-500"
          }, 'oder'),
          React.createElement('div', {
            key: 'divider-line-2',
            className: "flex-1 border-t border-gray-200"
          })
        ]),

        // New Customer Button
        React.createElement('button', {
          key: 'new-customer-button',
          onClick: () => setShowNewCustomerForm(true),
          className: "w-full btn-success flex items-center justify-center space-x-2"
        }, [
          React.createElement(lucide.UserPlus, {
            key: 'new-customer-icon',
            className: "w-4 h-4"
          }),
          React.createElement('span', {
            key: 'new-customer-text'
          }, 'Neuen Kunden anlegen')
        ]),

        // New Customer Form
        showNewCustomerForm && React.createElement('div', {
          key: 'new-customer-form',
          className: "p-4 bg-green-50 rounded-lg border border-green-200 space-y-4"
        }, [
          React.createElement('h4', {
            key: 'new-customer-title',
            className: "font-medium text-gray-800"
          }, 'Neuen Kunden anlegen'),
          
          React.createElement('input', {
            key: 'new-name',
            type: 'text',
            value: newCustomer.name,
            onChange: (e) => setNewCustomer(prev => ({ ...prev, name: e.target.value })),
            placeholder: 'Vollständiger Name *',
            className: "input-field"
          }),
          
          React.createElement('input', {
            key: 'new-phone',
            type: 'tel',
            value: newCustomer.phone,
            onChange: (e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value })),
            placeholder: 'Telefonnummer *',
            className: "input-field"
          }),
          
          React.createElement('input', {
            key: 'new-email',
            type: 'email',
            value: newCustomer.email,
            onChange: (e) => setNewCustomer(prev => ({ ...prev, email: e.target.value })),
            placeholder: 'E-Mail (optional)',
            className: "input-field"
          }),
          
          React.createElement('div', {
            key: 'new-customer-buttons',
            className: "flex space-x-2"
          }, [
            React.createElement('button', {
              key: 'save-customer',
              onClick: handleCreateCustomer,
              className: "flex-1 btn-success"
            }, 'Kunde erstellen'),
            React.createElement('button', {
              key: 'cancel-customer',
              onClick: () => {
                setShowNewCustomerForm(false);
                setNewCustomer({ name: '', phone: '', email: '' });
              },
              className: "flex-1 btn-secondary"
            }, 'Abbrechen')
          ])
        ])
      ])
    ])
  ]);
};

// ==================== GLOBAL VERFÜGBAR MACHEN ====================
window.ProfiSlots = window.ProfiSlots || {};
window.ProfiSlots.BookingPage = BookingPage;

console.log('✅ ProfiSlots Booking Component loaded');
