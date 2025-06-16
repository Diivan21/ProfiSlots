// ProfiSlots Utility Functions
// Diese Datei wird zuerst geladen und stellt grundlegende Funktionen bereit

// ==================== STORAGE UTILITIES ====================
const Storage = {
  // Local Storage Wrapper mit Fehlerbehandlung
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// ==================== DATE & TIME UTILITIES ====================
const DateUtils = {
  // Heutiges Datum im YYYY-MM-DD Format
  today() {
    return new Date().toISOString().split('T')[0];
  },

  // Datum formatieren für Deutsche Anzeige
  formatGerman(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  },

  // Datum und Zeit formatieren
  formatDateTime(dateString, timeString) {
    if (!dateString) return '';
    try {
      const formattedDate = this.formatGerman(dateString);
      return timeString ? `${formattedDate} um ${timeString}` : formattedDate;
    } catch (error) {
      return `${dateString} ${timeString || ''}`.trim();
    }
  },

  // Prüfen ob Datum in der Vergangenheit liegt
  isPast(dateString, timeString = null) {
    if (!dateString) return false;
    try {
      const checkDate = new Date(`${dateString}${timeString ? ` ${timeString}` : ''}`);
      return checkDate < new Date();
    } catch (error) {
      return false;
    }
  },

  // Prüfen ob Datum heute ist
  isToday(dateString) {
    return dateString === this.today();
  },

  // Datum für Input Field formatieren
  formatForInput(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  },

  // Zeitslots generieren
  generateTimeSlots(startHour = 8, endHour = 18, intervalMinutes = 30) {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        if (hour === endHour && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  }
};

// ==================== VALIDATION UTILITIES ====================
const Validation = {
  // E-Mail validieren
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  // Telefonnummer validieren (Deutsche Formate)
  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
    return phoneRegex.test(phone.trim());
  },

  // Passwort validieren
  isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 6;
  },

  // Name validieren
  isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    return name.trim().length >= 2;
  },

  // Service-Daten validieren
  isValidService(service) {
    return (
      service &&
      this.isValidName(service.name) &&
      service.duration > 0 &&
      service.price >= 0
    );
  },

  // Termin-Daten validieren
  isValidAppointment(appointment) {
    return (
      appointment &&
      appointment.date &&
      appointment.time &&
      appointment.serviceId &&
      appointment.staffId &&
      appointment.customerId
    );
  }
};

// ==================== STRING UTILITIES ====================
const StringUtils = {
  // Text kürzen mit Ellipsis
  truncate(text, maxLength = 50) {
    if (!text || typeof text !== 'string') return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
  },

  // Ersten Buchstaben groß schreiben
  capitalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Text für Suche normalisieren
  normalizeForSearch(text) {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().trim()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss');
  },

  // Initials generieren
  getInitials(name) {
    if (!name || typeof name !== 'string') return '';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },

  // Zufällige ID generieren
  generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`;
  }
};

// ==================== CURRENCY UTILITIES ====================
const CurrencyUtils = {
  // Preis formatieren
  format(amount, currency = 'EUR') {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Preis ohne Währungssymbol
  formatNumber(amount) {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // String zu Zahl konvertieren
  parse(amountString) {
    if (typeof amountString === 'number') return amountString;
    if (!amountString) return 0;
    
    // Deutsche Zahlenformate unterstützen
    const cleaned = amountString.toString()
      .replace(/[€\s]/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.');
    
    return parseFloat(cleaned) || 0;
  }
};

// ==================== ARRAY UTILITIES ====================
const ArrayUtils = {
  // Array sicher sortieren
  sortBy(array, key, direction = 'asc') {
    if (!Array.isArray(array)) return [];
    
    return [...array].sort((a, b) => {
      let aVal = typeof key === 'function' ? key(a) : a[key];
      let bVal = typeof key === 'function' ? key(b) : b[key];
      
      // Null/undefined Werte ans Ende
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      // String-Vergleich case-insensitive
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return direction === 'desc' ? -result : result;
    });
  },

  // Array gruppieren
  groupBy(array, key) {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((groups, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  },

  // Duplikate entfernen
  unique(array, key = null) {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const keyValue = typeof key === 'function' ? key(item) : item[key];
        if (seen.has(keyValue)) return false;
        seen.add(keyValue);
        return true;
      });
    }
    
    return [...new Set(array)];
  }
};

// ==================== DOM UTILITIES ====================
const DOMUtils = {
  // Element sicher finden
  $(selector) {
    return document.querySelector(selector);
  },

  // Mehrere Elemente finden
  $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  },

  // Event Listener mit Cleanup
  on(element, event, handler, options = {}) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (!element) return null;
    
    element.addEventListener(event, handler, options);
    
    // Cleanup-Funktion zurückgeben
    return () => element.removeEventListener(event, handler, options);
  },

  // CSS Klassen togglen
  toggleClass(element, className, force = null) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (!element) return false;
    
    if (force !== null) {
      element.classList.toggle(className, force);
    } else {
      element.classList.toggle(className);
    }
    
    return element.classList.contains(className);
  },

  // Element anzeigen/verstecken
  show(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) {
      element.classList.remove('hidden');
    }
  },

  hide(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) {
      element.classList.add('hidden');
    }
  }
};

// ==================== DEBOUNCE UTILITY ====================
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==================== ERROR HANDLING ====================
const ErrorHandler = {
  // Benutzerfreundliche Fehlermeldungen
  getMessage(error) {
    if (!error) return 'Ein unbekannter Fehler ist aufgetreten';
    
    if (typeof error === 'string') return error;
    
    // API Fehler
    if (error.message) {
      // Bekannte Fehlermeldungen übersetzen
      const translations = {
        'Network Error': 'Verbindungsfehler - Bitte prüfen Sie Ihre Internetverbindung',
        'Unauthorized': 'Nicht autorisiert - Bitte melden Sie sich erneut an',
        'Forbidden': 'Zugriff verweigert',
        'Not Found': 'Ressource nicht gefunden',
        'Internal Server Error': 'Serverfehler - Bitte versuchen Sie es später erneut'
      };
      
      return translations[error.message] || error.message;
    }
    
    return 'Ein unerwarteter Fehler ist aufgetreten';
  },

  // Fehler loggen
  log(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      error: error.toString(),
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('ProfiSlots Error:', errorInfo);
    
    // In Produktion könnte hier ein Error-Tracking Service aufgerufen werden
    // z.B. Sentry, LogRocket, etc.
  }
};

// ==================== GLOBAL VERFÜGBAR MACHEN ====================
window.ProfiSlots = window.ProfiSlots || {};
Object.assign(window.ProfiSlots, {
  Storage,
  DateUtils,
  Validation,
  StringUtils,
  CurrencyUtils,
  ArrayUtils,
  DOMUtils,
  ErrorHandler,
  debounce
});

// Shortcuts für häufig verwendete Funktionen
window.$ = DOMUtils.$;
window.$$ = DOMUtils.$$;

console.log('✅ ProfiSlots Utils loaded');
