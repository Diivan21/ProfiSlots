// ProfiSlots Modal Components
// Wiederverwendbare Modal-Komponenten für verschiedene Zwecke

const { useState, useEffect } = React;

// ==================== BASE MODAL COMPONENT ====================
const BaseModal = ({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }) => {
  // ESC Key zum Schließen
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  return React.createElement('div', {
    className: "modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }
  }, [
    React.createElement('div', {
      key: 'modal-content',
      className: `modal-content bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto custom-scrollbar`,
      onClick: (e) => e.stopPropagation()
    }, [
      // Header
      React.createElement('div', {
        key: 'header',
        className: "flex items-center justify-between p-6 border-b border-gray-200"
      }, [
        React.createElement('h2', {
          key: 'title',
          className: "text-xl font-semibold text-gray-800"
        }, title),
        showCloseButton && React.createElement('button', {
          key: 'close-button',
          onClick: onClose,
          className: "p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        }, [
          React.createElement(lucide.X, {
            key: 'close-icon',
            className: "w-5 h-5 text-gray-500"
          })
        ])
      ]),

      // Content
      React.createElement('div', {
        key: 'content',
        className: "p-6"
      }, children)
    ])
  ]);
};

// ==================== CONFIRMATION MODAL ====================
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Bestätigen', cancelText = 'Abbrechen', type = 'danger' }) => {
  const typeStyles = {
    danger: {
      icon: lucide.AlertTriangle,
      iconColor: 'text-red-500',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: lucide.AlertCircle,
      iconColor: 'text-yellow-500',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    },
    info: {
      icon: lucide.Info,
      iconColor: 'text-blue-500',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  };

  const style = typeStyles[type];
  const IconComponent = style.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return React.createElement(BaseModal, {
    isOpen,
    onClose,
    title,
    size: 'sm'
  }, [
    React.createElement('div', {
      key: 'content',
      className: "text-center"
    }, [
      React.createElement('div', {
        key: 'icon',
        className: "mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4"
      }, [
        React.createElement(IconComponent, {
          key: 'icon-component',
          className: `w-6 h-6 ${style.iconColor}`
        })
      ]),

      React.createElement('p', {
        key: 'message',
        className: "text-gray-600 mb-6"
      }, message),

      React.createElement('div', {
        key: 'buttons',
        className: "flex space-x-3 justify-center"
      }, [
        React.createElement('button', {
          key: 'cancel',
          onClick: onClose,
          className: "px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
        }, cancelText),
        React.createElement('button', {
          key: 'confirm',
          onClick: handleConfirm,
          className: `px-4 py-2 text-white rounded-lg transition-colors duration-200 ${style.buttonColor}`
        }, confirmText)
      ])
    ])
  ]);
};

// ==================== LOADING MODAL ====================
const LoadingModal = ({ isOpen, message = 'Wird geladen...' }) => {
  return React.createElement(BaseModal, {
    isOpen,
    onClose: () => {}, // Cannot be closed
    title: '',
    showCloseButton: false,
    size: 'sm'
  }, [
    React.createElement('div', {
      key: 'loading-content',
      className: "text-center py-4"
    }, [
      React.createElement('div', {
        key: 'spinner',
        className: "loading-spinner w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
      }),
      React.createElement('p', {
        key: 'message',
        className: "text-gray-600"
      }, message)
    ])
  ]);
};

// ==================== SERVICE FORM MODAL ====================
const ServiceFormModal = ({ isOpen, onClose, onSave, service = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: '',
    icon: 'Scissors'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!service;
  const title = isEditing ? 'Service bearbeiten' : 'Neuen Service hinzufügen';

  // Form mit Service-Daten füllen
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        duration: service.duration?.toString() || '',
        price: service.price?.toString() || '',
        icon: service.icon || 'Scissors'
      });
    } else {
      setFormData({
        name: '',
        duration: '',
        price: '',
        icon: 'Scissors'
      });
    }
    setErrors({});
  }, [service, isOpen]);

  const iconOptions = [
    { value: 'Scissors', label: 'Schere', icon: lucide.Scissors },
    { value: 'Heart', label: 'Herz', icon: lucide.Heart },
    { value: 'MessageSquare', label: 'Nachricht', icon: lucide.MessageSquare },
    { value: 'User', label: 'Person', icon: lucide.User },
    { value: 'Settings', label: 'Einstellungen', icon: lucide.Settings }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service-Name ist erforderlich';
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Gültige Dauer ist erforderlich';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Gültiger Preis ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const serviceData = {
        name: formData.name.trim(),
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        icon: formData.icon
      };

      await onSave(serviceData);
      onClose();
      showSuccess(isEditing ? 'Service erfolgreich aktualisiert!' : 'Service erfolgreich erstellt!');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return React.createElement(BaseModal, {
    isOpen,
    onClose,
    title,
    size: 'md'
  }, [
    React.createElement('form', {
      key: 'form',
      onSubmit: handleSubmit,
      className: "space-y-4"
    }, [
      // Service Name
      React.createElement('div', {
        key: 'name-field'
      }, [
        React.createElement('label', {
          key: 'name-label',
          className: "block text-sm font-medium text-gray-700 mb-2"
        }, 'Service-Name *'),
        React.createElement('input', {
          key: 'name-input',
          type: 'text',
          value: formData.name,
          onChange: (e) => handleInputChange('name', e.target.value),
          className: `input-field ${errors.name ? 'input-error' : ''}`,
          placeholder: 'z.B. Haarschnitt'
        }),
        errors.name && React.createElement('p', {
          key: 'name-error',
          className: "text-red-500 text-sm mt-1"
        }, errors.name)
      ]),

      // Duration and Price Row
      React.createElement('div', {
        key: 'duration-price-row',
        className: "grid grid-cols-1 md:grid-cols-2 gap-4"
      }, [
        // Duration
        React.createElement('div', {
          key: 'duration-field'
        }, [
          React.createElement('label', {
            key: 'duration-label',
            className: "block text-sm font-medium text-gray-700 mb-2"
          }, 'Dauer (Minuten) *'),
          React.createElement('input', {
            key: 'duration-input',
            type: 'number',
            value: formData.duration,
            onChange: (e) => handleInputChange('duration', e.target.value),
            className: `input-field ${errors.duration ? 'input-error' : ''}`,
            placeholder: '60',
            min: '1',
            max: '480'
          }),
          errors.duration && React.createElement('p', {
            key: 'duration-error',
            className: "text-red-500 text-sm mt-1"
          }, errors.duration)
        ]),

        // Price
        React.createElement('div', {
          key: 'price-field'
        }, [
          React.createElement('label', {
            key: 'price-label',
            className: "block text-sm font-medium text-gray-700 mb-2"
          }, 'Preis (€) *'),
          React.createElement('input', {
            key: 'price-input',
            type: 'number',
            value: formData.price,
            onChange: (e) => handleInputChange('price', e.target.value),
            className: `input-field ${errors.price ? 'input-error' : ''}`,
            placeholder: '45.00',
            min: '0',
            step: '0.50'
          }),
          errors.price && React.createElement('p', {
            key: 'price-error',
            className: "text-red-500 text-sm mt-1"
          }, errors.price)
        ])
      ]),

      // Icon Selection
      React.createElement('div', {
        key: 'icon-field'
      }, [
        React.createElement('label', {
          key: 'icon-label',
          className: "block text-sm font-medium text-gray-700 mb-2"
        }, 'Icon'),
        React.createElement('div', {
          key: 'icon-options',
          className: "grid grid-cols-5 gap-2"
        }, iconOptions.map(option => {
          const IconComponent = option.icon;
          return React.createElement('button', {
            key: option.value,
            type: 'button',
            onClick: () => handleInputChange('icon', option.value),
            className: `p-3 border-2 rounded-lg transition-all duration-200 flex flex-col items-center space-y-1 ${
              formData.icon === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`
          }, [
            React.createElement(IconComponent, {
              key: 'icon',
              className: `w-5 h-5 ${formData.icon === option.value ? 'text-blue-600' : 'text-gray-500'}`
            }),
            React.createElement('span', {
              key: 'label',
              className: `text-xs ${formData.icon === option.value ? 'text-blue-600' : 'text-gray-500'}`
            }, option.label)
          ]);
        }))
      ]),

      // Form Buttons
      React.createElement('div', {
        key: 'form-buttons',
        className: "flex space-x-3 pt-4 border-t border-gray-200"
      }, [
        React.createElement('button', {
          key: 'cancel',
          type: 'button',
          onClick: onClose,
          className: "flex-1 btn-secondary",
          disabled: loading
        }, 'Abbrechen'),
        React.createElement('button', {
          key: 'submit',
          type: 'submit',
          className: "flex-1 btn-primary",
          disabled: loading
        }, loading ? [
          React.createElement('div', {
            key: 'spinner',
            className: "loading-spinner mr-2"
          }),
          React.createElement('span', {
            key: 'loading-text-service'
          }, 'Wird gespeichert...')
        ] : [
          React.createElement('span', {
            key: 'submit-text-service'
          }, isEditing ? 'Aktualisieren' : 'Erstellen')
        ])
      ])
    ])
  ]);
};

// ==================== CUSTOMER FORM MODAL ====================
const CustomerFormModal = ({ isOpen, onClose, onSave, customer = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditing = !!customer;
  const title = isEditing ? 'Kunde bearbeiten' : 'Neuen Kunden hinzufügen';

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: ''
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!ProfiSlots.Validation.isValidName(formData.name)) {
      newErrors.name = 'Gültiger Name ist erforderlich';
    }

    if (!ProfiSlots.Validation.isValidPhone(formData.phone)) {
      newErrors.phone = 'Gültige Telefonnummer ist erforderlich';
    }

    if (formData.email && !ProfiSlots.Validation.isValidEmail(formData.email)) {
      newErrors.email = 'Gültige E-Mail-Adresse eingeben';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      showSuccess(isEditing ? 'Kunde erfolgreich aktualisiert!' : 'Kunde erfolgreich erstellt!');
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return React.createElement(BaseModal, {
    isOpen,
    onClose,
    title,
    size: 'md'
  }, [
    React.createElement('form', {
      key: 'form',
      onSubmit: handleSubmit,
      className: "space-y-4"
    }, [
      // Name
      React.createElement('div', {
        key: 'name-field'
      }, [
        React.createElement('label', {
          key: 'name-label',
          className: "block text-sm font-medium text-gray-700 mb-2"
        }, 'Name *'),
        React.createElement('input', {
          key: 'name-input',
          type: 'text',
          value: formData.name,
          onChange: (e) => handleInputChange('name', e.target.value),
          className: `input-field ${errors.name ? 'input-error' : ''}`,
          placeholder: 'Vollständiger Name'
        }),
        errors.name && React.createElement('p', {
          key: 'name-error',
          className: "text-red-500 text-sm mt-1"
        }, errors.name)
      ]),

      // Phone
      React.createElement('div', {
        key: 'phone-field'
      }, [
        React.createElement('label', {
          key: 'phone-label',
          className: "block text-sm font-medium text-gray-700 mb-2"
        }, 'Telefon *'),
        React.createElement('input', {
          key: 'phone-input',
          type: 'tel',
          value: formData.phone,
          onChange: (e) => handleInputChange('phone', e.target.value),
          className: `input-field ${errors.phone ? 'input-error' : ''}`,
          placeholder: '0123-456789'
        }),
        errors.phone && React.createElement('p', {
          key: 'phone-error',
          className: "text-red-500 text-sm mt-1"
        }, errors.phone)
      ]),

      // Email
      React.createElement('div', {
        key: 'email-field'
      }, [
        React.createElement('label', {
          key: 'email-label',
          className: "block text-sm font-medium text-gray-700 mb-2"
        }, 'E-Mail (optional)'),
        React.createElement('input', {
          key: 'email-input',
          type: 'email',
          value: formData.email,
          onChange: (e) => handleInputChange('email', e.target.value),
          className: `input-field ${errors.email ? 'input-error' : ''}`,
          placeholder: 'email@beispiel.de'
        }),
        errors.email && React.createElement('p', {
          key: 'email-error',
          className: "text-red-500 text-sm mt-1"
        }, errors.email)
      ]),

      // Form Buttons
      React.createElement('div', {
        key: 'form-buttons',
        className: "flex space-x-3 pt-4 border-t border-gray-200"
      }, [
        React.createElement('button', {
          key: 'cancel',
          type: 'button',
          onClick: onClose,
          className: "flex-1 btn-secondary",
          disabled: loading
        }, 'Abbrechen'),
        React.createElement('button', {
          key: 'submit',
          type: 'submit',
          className: "flex-1 btn-primary",
          disabled: loading
        }, loading ? [
          React.createElement('div', {
            key: 'spinner',
            className: "loading-spinner mr-2"
          }),
          React.createElement('span', {
            key: 'loading-text-customer'
          }, 'Wird gespeichert...')
        ] : [
          React.createElement('span', {
            key: 'submit-text-customer'
          }, isEditing ? 'Aktualisieren' : 'Erstellen')
        ])
      ])
    ])
  ]);
};

// ==================== GLOBAL VERFÜGBAR MACHEN ====================
window.ProfiSlots = window.ProfiSlots || {};
Object.assign(window.ProfiSlots, {
  BaseModal,
  ConfirmationModal,
  LoadingModal,
  ServiceFormModal,
  CustomerFormModal
});

console.log('✅ ProfiSlots Modal Components loaded');
