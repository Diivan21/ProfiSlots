// ProfiSlots Authentication Component
// Login und Registrierung

const { useState, useEffect } = React;

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    salonName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form zurücksetzen beim Wechsel zwischen Login/Register
  useEffect(() => {
    setFormData({
      email: '',
      password: '',
      salonName: ''
    });
    setError('');
  }, [isLogin]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!ProfiSlots.Validation.isValidEmail(formData.email)) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      }

      if (!ProfiSlots.Validation.isValidPassword(formData.password)) {
        throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein');
      }

      if (!isLogin && !ProfiSlots.Validation.isValidName(formData.salonName)) {
        throw new Error('Bitte geben Sie einen gültigen Salon-Namen ein');
      }

      if (isLogin) {
        // Login
        const response = await ProfiSlots.API.auth.login(formData.email, formData.password);
        onLogin(response.user);
        if (window.showSuccess) {
          showSuccess('Erfolgreich angemeldet!');
        }
      } else {
        // Registration
        await ProfiSlots.API.auth.register(formData.email, formData.password, formData.salonName);
        if (window.showSuccess) {
          showSuccess('Account erfolgreich erstellt! Bitte loggen Sie sich ein.');
        }
        
        // Switch to login form and keep email
        setIsLogin(true);
        setFormData(prev => ({
          email: prev.email,
          password: '',
          salonName: ''
        }));
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = ProfiSlots.ErrorHandler ? 
        ProfiSlots.ErrorHandler.getMessage(error) : 
        (error.message || 'Ein Fehler ist aufgetreten');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return React.createElement('div', {
    className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
  }, [
    React.createElement('div', {
      key: 'auth-container',
      className: "bg-white rounded-lg shadow-xl p-8 w-full max-w-md animate-fade-in"
    }, [
      // Header with Logo
      React.createElement('div', {
        key: 'header',
        className: "text-center mb-8"
      }, [
        React.createElement('div', {
          key: 'logo',
          className: "w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center"
        }, [
          React.createElement(lucide.Calendar, {
            key: 'logo-icon',
            className: "w-10 h-10 text-white"
          })
        ]),
        React.createElement('h1', {
          key: 'title',
          className: "text-3xl font-bold text-gray-800 mb-2"
        }, 'ProfiSlots'),
        React.createElement('p', {
          key: 'subtitle',
          className: "text-gray-600"
        }, isLogin 
          ? 'Bei Ihrem Account anmelden' 
          : 'Neuen Account erstellen'
        )
      ]),

      // Error Message
      error && React.createElement('div', {
        key: 'error',
        className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-up"
      }, [
        React.createElement('div', {
          key: 'error-content',
          className: "flex items-center"
        }, [
          React.createElement(lucide.AlertCircle, {
            key: 'error-icon',
            className: "w-5 h-5 text-red-500 mr-3 flex-shrink-0"
          }),
          React.createElement('span', {
            key: 'error-text',
            className: "text-red-700 text-sm"
          }, error)
        ])
      ]),

      // Auth Form
      React.createElement('form', {
        key: 'form',
        onSubmit: handleSubmit,
        className: "space-y-6"
      }, [
        // Email Field
        React.createElement('div', {
          key: 'email-field'
        }, [
          React.createElement('label', {
            key: 'email-label',
            className: "block text-sm font-medium text-gray-700 mb-2"
          }, 'E-Mail-Adresse'),
          React.createElement('div', {
            key: 'email-input-container',
            className: "relative"
          }, [
            React.createElement('div', {
              key: 'email-icon',
              className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            }, [
              React.createElement(lucide.Mail, {
                key: 'email-icon-svg',
                className: "w-5 h-5 text-gray-400"
              })
            ]),
            React.createElement('input', {
              key: 'email-input',
              type: 'email',
              value: formData.email,
              onChange: (e) => handleInputChange('email', e.target.value),
              className: "input-field pl-10",
              placeholder: 'ihre@email.de',
              required: true,
              autoComplete: 'email'
            })
          ])
        ]),

        // Password Field
        React.createElement('div', {
          key: 'password-field'
        }, [
          React.createElement('label', {
            key: 'password-label',
            className: "block text-sm font-medium text-gray-700 mb-2"
          }, 'Passwort'),
          React.createElement('div', {
            key: 'password-input-container',
            className: "relative"
          }, [
            React.createElement('div', {
              key: 'password-icon',
              className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            }, [
              React.createElement(lucide.Lock, {
                key: 'password-icon-svg',
                className: "w-5 h-5 text-gray-400"
              })
            ]),
            React.createElement('input', {
              key: 'password-input',
              type: showPassword ? 'text' : 'password',
              value: formData.password,
              onChange: (e) => handleInputChange('password', e.target.value),
              className: "input-field pl-10 pr-10",
              placeholder: 'Mindestens 6 Zeichen',
              required: true,
              minLength: 6,
              autoComplete: isLogin ? 'current-password' : 'new-password'
            }),
            React.createElement('button', {
              key: 'toggle-password',
              type: 'button',
              onClick: () => setShowPassword(!showPassword),
              className: "absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
            }, [
              React.createElement(showPassword ? lucide.EyeOff : lucide.Eye, {
                key: 'toggle-icon',
                className: "w-5 h-5 text-gray-400"
              })
            ])
          ])
        ]),

        // Salon Name Field (nur bei Registrierung)
        !isLogin && React.createElement('div', {
          key: 'salon-field'
        }, [
          React.createElement('label', {
            key: 'salon-label',
            className: "block text-sm font-medium text-gray-700 mb-2"
          }, 'Salon / Firma'),
          React.createElement('div', {
            key: 'salon-input-container',
            className: "relative"
          }, [
            React.createElement('div', {
              key: 'salon-icon',
              className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            }, [
              React.createElement(lucide.Building, {
                key: 'salon-icon-svg',
                className: "w-5 h-5 text-gray-400"
              })
            ]),
            React.createElement('input', {
              key: 'salon-input',
              type: 'text',
              value: formData.salonName,
              onChange: (e) => handleInputChange('salonName', e.target.value),
              className: "input-field pl-10",
              placeholder: 'z.B. Salon Müller',
              required: !isLogin,
              autoComplete: 'organization'
            })
          ])
        ]),

        // Submit Button
        React.createElement('button', {
          key: 'submit-button',
          type: 'submit',
          disabled: loading,
          className: "w-full btn-primary disabled:btn-disabled py-3 text-lg font-semibold"
        }, loading ? [
          React.createElement('div', {
            key: 'spinner',
            className: "loading-spinner mr-2"
          }),
          React.createElement('span', {
            key: 'loading-text'
          }, 'Wird verarbeitet...')
        ] : [
          React.createElement('span', {
            key: 'auth-text'
          }, isLogin ? 'Anmelden' : 'Account erstellen')
        ])
      ]),

      // Toggle Auth Mode
      React.createElement('div', {
        key: 'toggle',
        className: "mt-8 text-center"
      }, [
        React.createElement('button', {
          key: 'toggle-button',
          type: 'button',
          onClick: toggleAuthMode,
          disabled: loading,
          className: "text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 disabled:opacity-50"
        }, React.createElement('span', {
          key: 'toggle-text'
        }, isLogin 
          ? '🆕 Noch kein Account? Jetzt registrieren' 
          : '🔑 Bereits registriert? Hier anmelden'
        ))
      ]),

      // Features Info
      React.createElement('div', {
        key: 'features',
        className: "mt-8 p-4 bg-gray-50 rounded-lg"
      }, [
        React.createElement('h4', {
          key: 'features-title',
          className: "font-medium text-gray-800 mb-3 flex items-center"
        }, [
          React.createElement(lucide.Star, {
            key: 'star-icon',
            className: "w-4 h-4 text-yellow-500 mr-2"
          }),
          React.createElement('span', {
            key: 'features-text'
          }, 'ProfiSlots Features')
        ]),
        React.createElement('ul', {
          key: 'features-list',
          className: "text-sm text-gray-600 space-y-1"
        }, [
          React.createElement('li', {
            key: 'feature-1',
            className: "flex items-center"
          }, [
            React.createElement(lucide.Check, {
              key: 'check-1',
              className: "w-4 h-4 text-green-500 mr-2 flex-shrink-0"
            }),
            React.createElement('span', {
              key: 'feature-1-text'
            }, 'Terminbuchung & Verwaltung')
          ]),
          React.createElement('li', {
            key: 'feature-2',
            className: "flex items-center"
          }, [
            React.createElement(lucide.Check, {
              key: 'check-2',
              className: "w-4 h-4 text-green-500 mr-2 flex-shrink-0"
            }),
            React.createElement('span', {
              key: 'feature-2-text'
            }, 'Kunden- & Mitarbeiterverwaltung')
          ]),
          React.createElement('li', {
            key: 'feature-3',
            className: "flex items-center"
          }, [
            React.createElement(lucide.Check, {
              key: 'check-3',
              className: "w-4 h-4 text-green-500 mr-2 flex-shrink-0"
            }),
            React.createElement('span', {
              key: 'feature-3-text'
            }, 'Service-Management')
          ]),
          React.createElement('li', {
            key: 'feature-4',
            className: "flex items-center"
          }, [
            React.createElement(lucide.Check, {
              key: 'check-4',
              className: "w-4 h-4 text-green-500 mr-2 flex-shrink-0"
            }),
            React.createElement('span', {
              key: 'feature-4-text'
            }, 'Dashboard & Statistiken')
          ])
        ])
      ])
    ])
  ]);
};

// ==================== GLOBAL VERFÜGBAR MACHEN ====================
window.ProfiSlots = window.ProfiSlots || {};
Object.assign(window.ProfiSlots, {
  AuthPage
});

console.log('✅ ProfiSlots Auth Component loaded');
