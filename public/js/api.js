// ProfiSlots API Client
// Kommunikation mit dem Backend (/api/index.js)

const API = (() => {
  const BASE_URL = '/api';
  
  // ==================== PRIVATE FUNCTIONS ====================
  
  // Auth Token abrufen
  const getAuthToken = () => {
    return ProfiSlots.Storage.get('token');
  };

  // Auth Headers erstellen
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // HTTP Request Wrapper
  const request = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    
    const config = {
      headers: getAuthHeaders(),
      ...options
    };

    // Body zu JSON konvertieren wenn es ein Object ist
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Response Status prüfen
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Spezielle Behandlung für 401 (Unauthorized)
        if (response.status === 401) {
          // Token ist ungültig, User ausloggen
          ProfiSlots.Storage.remove('token');
          ProfiSlots.Storage.remove('user');
          
          // Event für Logout triggern
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          throw new Error('Sitzung abgelaufen - Bitte melden Sie sich erneut an');
        }
        
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Response: ${config.method || 'GET'} ${url}`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${config.method || 'GET'} ${url}`, error);
      ProfiSlots.ErrorHandler.log(error, `API Request: ${url}`);
      throw error;
    }
  };

  // ==================== AUTH METHODS ====================
  
  const auth = {
    // Benutzer registrieren
    async register(email, password, salonName) {
      if (!ProfiSlots.Validation.isValidEmail(email)) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      }
      
      if (!ProfiSlots.Validation.isValidPassword(password)) {
        throw new Error('Das Passwort muss mindestens 6 Zeichen lang sein');
      }
      
      if (!ProfiSlots.Validation.isValidName(salonName)) {
        throw new Error('Bitte geben Sie einen gültigen Salon-Namen ein');
      }

      const response = await request('/register', {
        method: 'POST',
        body: { email: email.trim(), password, salonName: salonName.trim() }
      });

      return response;
    },

    // Benutzer anmelden
    async login(email, password) {
      if (!email || !password) {
        throw new Error('E-Mail und Passwort sind erforderlich');
      }

      const response = await request('/login', {
        method: 'POST',
        body: { email: email.trim(), password }
      });

      // Token und User-Daten speichern
      if (response.token && response.user) {
        ProfiSlots.Storage.set('token', response.token);
        ProfiSlots.Storage.set('user', response.user);
        
        // Event für erfolgreichen Login triggern
        window.dispatchEvent(new CustomEvent('auth:login', { 
          detail: response.user 
        }));
      }

      return response;
    },

    // Benutzer abmelden
    logout() {
      ProfiSlots.Storage.remove('token');
      ProfiSlots.Storage.remove('user');
      
      // Event für Logout triggern
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      console.log('🚪 User logged out');
    },

    // Aktuellen User abrufen
    getCurrentUser() {
      return ProfiSlots.Storage.get('user');
    },

    // Prüfen ob User eingeloggt ist
    isAuthenticated() {
      const token = getAuthToken();
      const user = this.getCurrentUser();
      return !!(token && user);
    }
  };

  // ==================== DASHBOARD METHODS ====================
  
  const dashboard = {
    // Dashboard-Statistiken abrufen
    async getStats() {
      return await request('/dashboard');
    }
  };

  // ==================== SERVICES METHODS ====================
  
  const services = {
    // Alle Services abrufen
    async getAll() {
      return await request('/services');
    },

    // Service erstellen
    async create(serviceData) {
      if (!ProfiSlots.Validation.isValidService(serviceData)) {
        throw new Error('Ungültige Service-Daten');
      }

      return await request('/services', {
        method: 'POST',
        body: {
          name: serviceData.name.trim(),
          duration: parseInt(serviceData.duration),
          price: parseFloat(serviceData.price),
          icon: serviceData.icon || 'Scissors'
        }
      });
    },

    // Service aktualisieren
    async update(serviceId, serviceData) {
      if (!serviceId) {
        throw new Error('Service-ID ist erforderlich');
      }

      if (!ProfiSlots.Validation.isValidService(serviceData)) {
        throw new Error('Ungültige Service-Daten');
      }

      return await request(`/services/${serviceId}`, {
        method: 'PUT',
        body: {
          name: serviceData.name.trim(),
          duration: parseInt(serviceData.duration),
          price: parseFloat(serviceData.price),
          icon: serviceData.icon || 'Scissors'
        }
      });
    },

    // Service löschen
    async delete(serviceId) {
      if (!serviceId) {
        throw new Error('Service-ID ist erforderlich');
      }

      return await request(`/services/${serviceId}`, {
        method: 'DELETE'
      });
    }
  };

  // ==================== STAFF METHODS ====================
  
  const staff = {
    // Alle Mitarbeiter abrufen
    async getAll() {
      return await request('/staff');
    },

    // Mitarbeiter erstellen
    async create(staffData) {
      if (!ProfiSlots.Validation.isValidName(staffData.name)) {
        throw new Error('Name ist erforderlich');
      }

      return await request('/staff', {
        method: 'POST',
        body: {
          name: staffData.name.trim(),
          specialty: staffData.specialty?.trim() || '',
          email: staffData.email?.trim() || '',
          phone: staffData.phone?.trim() || ''
        }
      });
    },

    // Mitarbeiter aktualisieren
    async update(staffId, staffData) {
      if (!staffId) {
        throw new Error('Mitarbeiter-ID ist erforderlich');
      }

      if (!ProfiSlots.Validation.isValidName(staffData.name)) {
        throw new Error('Name ist erforderlich');
      }

      return await request(`/staff/${staffId}`, {
        method: 'PUT',
        body: {
          name: staffData.name.trim(),
          specialty: staffData.specialty?.trim() || '',
          email: staffData.email?.trim() || '',
          phone: staffData.phone?.trim() || ''
        }
      });
    },

    // Mitarbeiter löschen
    async delete(staffId) {
      if (!staffId) {
        throw new Error('Mitarbeiter-ID ist erforderlich');
      }

      return await request(`/staff/${staffId}`, {
        method: 'DELETE'
      });
    }
  };

  // ==================== CUSTOMERS METHODS ====================
  
  const customers = {
    // Alle Kunden abrufen
    async getAll() {
      return await request('/customers');
    },

    // Kunde erstellen
    async create(customerData) {
      if (!ProfiSlots.Validation.isValidName(customerData.name)) {
        throw new Error('Kundenname ist erforderlich');
      }

      if (!ProfiSlots.Validation.isValidPhone(customerData.phone)) {
        throw new Error('Gültige Telefonnummer ist erforderlich');
      }

      const data = {
        name: customerData.name.trim(),
        phone: customerData.phone.trim(),
        email: customerData.email?.trim() || '',
        total_visits: 0,
        last_visit: null
      };

      if (data.email && !ProfiSlots.Validation.isValidEmail(data.email)) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      }

      return await request('/customers', {
        method: 'POST',
        body: data
      });
    },

    // Kunde aktualisieren
    async update(customerId, customerData) {
      if (!customerId) {
        throw new Error('Kunden-ID ist erforderlich');
      }

      if (!ProfiSlots.Validation.isValidName(customerData.name)) {
        throw new Error('Kundenname ist erforderlich');
      }

      if (!ProfiSlots.Validation.isValidPhone(customerData.phone)) {
        throw new Error('Gültige Telefonnummer ist erforderlich');
      }

      const data = {
        name: customerData.name.trim(),
        phone: customerData.phone.trim(),
        email: customerData.email?.trim() || ''
      };

      if (data.email && !ProfiSlots.Validation.isValidEmail(data.email)) {
        throw new Error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      }

      return await request(`/customers/${customerId}`, {
        method: 'PUT',
        body: data
      });
    },

    // Kunde löschen
    async delete(customerId) {
      if (!customerId) {
        throw new Error('Kunden-ID ist erforderlich');
      }

      return await request(`/customers/${customerId}`, {
        method: 'DELETE'
      });
    },

    // Kunden suchen
    async search(searchTerm) {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      return await request(`/customers/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // ==================== APPOINTMENTS METHODS ====================
  
  const appointments = {
    // Alle Termine abrufen
    async getAll() {
      return await request('/appointments');
    },

    // Termine für einen bestimmten Tag abrufen
    async getByDate(date) {
      if (!date) {
        throw new Error('Datum ist erforderlich');
      }

      return await request(`/appointments/date/${date}`);
    },

    // Termin erstellen
    async create(appointmentData) {
      if (!ProfiSlots.Validation.isValidAppointment(appointmentData)) {
        throw new Error('Ungültige Termin-Daten');
      }

      return await request('/appointments', {
        method: 'POST',
        body: {
          customer_id: appointmentData.customerId,
          staff_id: appointmentData.staffId,
          service_id: appointmentData.serviceId,
          appointment_date: appointmentData.date,
          appointment_time: appointmentData.time,
          status: 'confirmed'
        }
      });
    },

    // Termin aktualisieren
    async update(appointmentId, appointmentData) {
      if (!appointmentId) {
        throw new Error('Termin-ID ist erforderlich');
      }

      return await request(`/appointments/${appointmentId}`, {
        method: 'PUT',
        body: appointmentData
      });
    },

    // Termin stornieren
    async cancel(appointmentId) {
      if (!appointmentId) {
        throw new Error('Termin-ID ist erforderlich');
      }

      return await request(`/appointments/${appointmentId}/cancel`, {
        method: 'PUT'
      });
    },

    // Termin bestätigen
    async confirm(appointmentId) {
      if (!appointmentId) {
        throw new Error('Termin-ID ist erforderlich');
      }

      return await request(`/appointments/${appointmentId}/confirm`, {
        method: 'PUT'
      });
    },

    // Verfügbare Zeitslots prüfen
    async getAvailableSlots(staffId, date) {
      if (!staffId || !date) {
        throw new Error('Mitarbeiter-ID und Datum sind erforderlich');
      }

      return await request(`/appointments/available-slots?staff_id=${staffId}&date=${date}`);
    }
  };

  // ==================== SYSTEM METHODS ====================
  
  const system = {
    // System-Status prüfen
    async getHealth() {
      return await request('/health');
    },

    // API-Info abrufen
    async getInfo() {
      return await request('/');
    }
  };

  // ==================== PUBLIC API ====================
  
  return {
    auth,
    dashboard,
    services,
    staff,
    customers,
    appointments,
    system,
    
    // Direkte Request-Funktion für spezielle Fälle
    request,
    
    // Helper Functions
    isAuthenticated: () => auth.isAuthenticated(),
    getCurrentUser: () => auth.getCurrentUser(),
    logout: () => auth.logout()
  };
})();

// ==================== GLOBAL VERFÜGBAR MACHEN ====================
window.ProfiSlots = window.ProfiSlots || {};
window.ProfiSlots.API = API;

// Event Listener für automatisches Logout bei Token-Ablauf
window.addEventListener('auth:logout', () => {
  console.log('🚪 Auth logout event triggered');
  // Hier könnte eine Redirect zur Login-Seite erfolgen
});

window.addEventListener('auth:login', (event) => {
  console.log('✅ Auth login event triggered', event.detail);
  // Hier könnte eine Redirect zum Dashboard erfolgen
});

console.log('✅ ProfiSlots API Client loaded');
