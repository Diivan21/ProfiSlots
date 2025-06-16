// public/js/services/APIClient.js
class APIClient {
    constructor(baseURL = '/api', options = {}) {
        this.baseURL = baseURL;
        this.options = {
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            ...options
        };
        this.token = this.getStoredToken();
    }

    // Token Management
    getStoredToken() {
        try {
            return localStorage.getItem('token') || null;
        } catch (error) {
            console.warn('LocalStorage not available:', error);
            return null;
        }
    }

    setToken(token) {
        this.token = token;
        try {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.warn('Could not store token:', error);
        }
    }

    clearToken() {
        this.setToken(null);
        try {
            localStorage.removeItem('user');
        } catch (error) {
            console.warn('Could not clear user data:', error);
        }
    }

    // Core HTTP Methods
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        let attempts = 0;
        
        while (attempts <= this.options.retries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

                const config = {
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.token && { Authorization: `Bearer ${this.token}` }),
                        ...options.headers
                    },
                    ...options
                };

                // Handle request body
                if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
                    config.body = JSON.stringify(config.body);
                }

                const response = await fetch(url, config);
                clearTimeout(timeoutId);

                // Handle different response types
                if (!response.ok) {
                    const errorData = await this.parseErrorResponse(response);
                    
                    // Handle specific error cases
                    if (response.status === 401) {
                        this.handleAuthError();
                        throw new APIError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.', 401);
                    }
                    
                    if (response.status === 403) {
                        throw new APIError('Zugriff verweigert.', 403);
                    }
                    
                    if (response.status === 404) {
                        throw new APIError('Ressource nicht gefunden.', 404);
                    }
                    
                    if (response.status >= 500) {
                        throw new APIError('Serverfehler. Bitte versuchen Sie es später erneut.', response.status);
                    }
                    
                    throw new APIError(errorData.error || `HTTP ${response.status}`, response.status);
                }

                return await this.parseResponse(response);

            } catch (error) {
                attempts++;
                
                // Don't retry on client errors or auth errors
                if (error instanceof APIError && error.status < 500) {
                    throw error;
                }
                
                // Don't retry on last attempt
                if (attempts > this.options.retries) {
                    if (error.name === 'AbortError') {
                        throw new APIError('Request timeout', 408);
                    }
                    throw error instanceof APIError ? error : new APIError(error.message || 'Netzwerkfehler');
                }
                
                // Wait before retry
                await this.delay(this.options.retryDelay * attempts);
            }
        }
    }

    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    }

    async parseErrorResponse(response) {
        try {
            return await response.json();
        } catch {
            return { error: `HTTP ${response.status}` };
        }
    }

    handleAuthError() {
        this.clearToken();
        // Emit custom event for auth error handling
        window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { message: 'Authentication failed' }
        }));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // HTTP Method Shortcuts
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams(params);
        const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: data
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Authentication Methods
    async login(email, password) {
        try {
            const response = await this.post('/login', { email, password });
            
            if (response.token) {
                this.setToken(response.token);
                
                // Store user data
                try {
                    localStorage.setItem('user', JSON.stringify(response.user));
                } catch (error) {
                    console.warn('Could not store user data:', error);
                }
            }
            
            return response;
        } catch (error) {
            throw new APIError(error.message || 'Login fehlgeschlagen');
        }
    }

    async register(email, password, salonName) {
        try {
            return await this.post('/register', { email, password, salonName });
        } catch (error) {
            throw new APIError(error.message || 'Registrierung fehlgeschlagen');
        }
    }

    async logout() {
        this.clearToken();
        // Optional: Call logout endpoint if it exists
        try {
            await this.post('/logout');
        } catch (error) {
            // Ignore logout endpoint errors
            console.warn('Logout endpoint error:', error);
        }
    }

    // Dashboard Methods
    async getDashboard() {
        return this.get('/dashboard');
    }

    // Service Methods
    async getServices() {
        return this.get('/services');
    }

    async createService(serviceData) {
        return this.post('/services', serviceData);
    }

    async updateService(serviceId, serviceData) {
        return this.put(`/services/${serviceId}`, serviceData);
    }

    async deleteService(serviceId) {
        return this.delete(`/services/${serviceId}`);
    }

    // Staff Methods
    async getStaff() {
        return this.get('/staff');
    }

    async createStaff(staffData) {
        return this.post('/staff', staffData);
    }

    async updateStaff(staffId, staffData) {
        return this.put(`/staff/${staffId}`, staffData);
    }

    async deleteStaff(staffId) {
        return this.delete(`/staff/${staffId}`);
    }

    // Customer Methods
    async getCustomers() {
        return this.get('/customers');
    }

    async createCustomer(customerData) {
        return this.post('/customers', customerData);
    }

    async updateCustomer(customerId, customerData) {
        return this.put(`/customers/${customerId}`, customerData);
    }

    async deleteCustomer(customerId) {
        return this.delete(`/customers/${customerId}`);
    }

    async searchCustomers(searchTerm) {
        return this.get('/customers/search', { q: searchTerm });
    }

    // Appointment Methods
    async getAppointments(filters = {}) {
        return this.get('/appointments', filters);
    }

    async createAppointment(appointmentData) {
        return this.post('/appointments', appointmentData);
    }

    async updateAppointment(appointmentId, appointmentData) {
        return this.put(`/appointments/${appointmentId}`, appointmentData);
    }

    async deleteAppointment(appointmentId) {
        return this.delete(`/appointments/${appointmentId}`);
    }

    async getAppointmentsByDate(date) {
        return this.get('/appointments', { date });
    }

    async getTodaysAppointments() {
        const today = new Date().toISOString().split('T')[0];
        return this.getAppointmentsByDate(today);
    }

    async getUpcomingAppointments(limit = 10) {
        return this.get('/appointments/upcoming', { limit });
    }

    async confirmAppointment(appointmentId) {
        return this.patch(`/appointments/${appointmentId}/confirm`);
    }

    async cancelAppointment(appointmentId) {
        return this.patch(`/appointments/${appointmentId}/cancel`);
    }

    // Availability Methods
    async checkAvailability(staffId, date, time) {
        return this.get('/availability/check', { staffId, date, time });
    }

    async getAvailableSlots(staffId, date) {
        return this.get('/availability/slots', { staffId, date });
    }

    // Statistics Methods
    async getStatistics(period = 'month') {
        return this.get('/statistics', { period });
    }

    async getCustomerStatistics(customerId) {
        return this.get(`/customers/${customerId}/statistics`);
    }

    async getStaffStatistics(staffId) {
        return this.get(`/staff/${staffId}/statistics`);
    }

    // Health Check
    async healthCheck() {
        return this.get('/health');
    }

    // Connection Test
    async testConnection() {
        try {
            const result = await this.healthCheck();
            return { 
                success: true, 
                status: result.status || 'connected',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Utility Methods
    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.warn('Could not parse user data:', error);
            return null;
        }
    }

    // File Upload (if needed for future features)
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type, let browser set it with boundary
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            }
        });
    }

    // Batch Operations
    async batchRequest(requests) {
        const results = await Promise.allSettled(
            requests.map(req => this.request(req.endpoint, req.options))
        );
        
        return results.map((result, index) => ({
            id: requests[index].id || index,
            success: result.status === 'fulfilled',
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }));
    }

    // Event Emitter for real-time updates (if WebSocket support is added later)
    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = {};
        }
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.eventListeners || !this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index > -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.eventListeners || !this.eventListeners[event]) return;
        
        this.eventListeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        });
    }
}

// Custom Error Class
class APIError extends Error {
    constructor(message, status = 500, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIClient, APIError };
} else if (typeof window !== 'undefined') {
    window.APIClient = APIClient;
    window.APIError = APIError;
}
