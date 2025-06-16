// js/config/api.js
// Modulare API-Konfiguration für ProfiSlots

export const API_URL = '/api';

// API Error Class
export class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// Base API request function
const request = async (endpoint, options = {}) => {
    try {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            ...options
        };

        // Convert body to JSON if it's an object
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        console.log(`API Request: ${options.method || 'GET'} ${API_URL}${endpoint}`);
        
        const response = await fetch(API_URL + endpoint, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData
            );
        }

        const data = await response.json();
        console.log(`API Response: ${response.status}`, data);
        return data;
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Re-throw ApiError as-is
        if (error instanceof ApiError) {
            throw error;
        }
        
        // Network or other errors
        throw new ApiError(
            error.message || 'Netzwerkfehler - Bitte versuchen Sie es später erneut',
            0
        );
    }
};

// Authentication API
export const authApi = {
    async login(email, password) {
        const response = await request('/login', {
            method: 'POST',
            body: { email, password }
        });
        
        // Store auth data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return response;
    },

    async register(email, password, salonName) {
        return await request('/register', {
            method: 'POST',
            body: { email, password, salonName }
        });
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};

// Dashboard API
export const dashboardApi = {
    async getStats() {
        return await request('/dashboard');
    }
};

// Services API
export const servicesApi = {
    async getAll() {
        return await request('/services');
    },

    async create(serviceData) {
        return await request('/services', {
            method: 'POST',
            body: serviceData
        });
    },

    async update(id, serviceData) {
        return await request(`/services/${id}`, {
            method: 'PUT',
            body: serviceData
        });
    },

    async delete(id) {
        return await request(`/services/${id}`, {
            method: 'DELETE'
        });
    }
};

// Staff API
export const staffApi = {
    async getAll() {
        return await request('/staff');
    },

    async create(staffData) {
        return await request('/staff', {
            method: 'POST',
            body: staffData
        });
    },

    async update(id, staffData) {
        return await request(`/staff/${id}`, {
            method: 'PUT',
            body: staffData
        });
    },

    async delete(id) {
        return await request(`/staff/${id}`, {
            method: 'DELETE'
        });
    }
};

// Customers API
export const customersApi = {
    async getAll() {
        return await request('/customers');
    },

    async create(customerData) {
        return await request('/customers', {
            method: 'POST',
            body: customerData
        });
    },

    async update(id, customerData) {
        return await request(`/customers/${id}`, {
            method: 'PUT',
            body: customerData
        });
    },

    async delete(id) {
        return await request(`/customers/${id}`, {
            method: 'DELETE'
        });
    }
};

// Appointments API
export const appointmentsApi = {
    async getAll() {
        return await request('/appointments');
    },

    async create(appointmentData) {
        return await request('/appointments', {
            method: 'POST',
            body: appointmentData
        });
    },

    async update(id, appointmentData) {
        return await request(`/appointments/${id}`, {
            method: 'PUT',
            body: appointmentData
        });
    },

    async cancel(id) {
        return await request(`/appointments/${id}/cancel`, {
            method: 'PUT'
        });
    },

    async delete(id) {
        return await request(`/appointments/${id}`, {
            method: 'DELETE'
        });
    }
};

// Combined API object (for backward compatibility)
export const api = {
    // Auth
    login: authApi.login,
    register: authApi.register,
    logout: authApi.logout,

    // Dashboard
    getDashboard: dashboardApi.getStats,

    // Services
    getServices: servicesApi.getAll,
    createService: servicesApi.create,
    updateService: servicesApi.update,
    deleteService: servicesApi.delete,

    // Staff
    getStaff: staffApi.getAll,
    createStaff: staffApi.create,
    updateStaff: staffApi.update,
    deleteStaff: staffApi.delete,

    // Customers
    getCustomers: customersApi.getAll,
    createCustomer: customersApi.create,
    updateCustomer: customersApi.update,
    deleteCustomer: customersApi.delete,

    // Appointments
    getAppointments: appointmentsApi.getAll,
    createAppointment: appointmentsApi.create,
    updateAppointment: appointmentsApi.update,
    cancelAppointment: appointmentsApi.cancel,
    deleteAppointment: appointmentsApi.delete
};

// API utility functions
export const apiUtils = {
    // Handle API errors with user-friendly messages
    handleError(error) {
        if (error instanceof ApiError) {
            switch (error.status) {
                case 401:
                    authApi.logout();
                    window.location.reload();
                    return 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.';
                case 403:
                    return 'Keine Berechtigung für diese Aktion.';
                case 404:
                    return 'Die angeforderte Ressource wurde nicht gefunden.';
                case 422:
                    return 'Ungültige Eingabedaten. Bitte überprüfen Sie Ihre Eingaben.';
                case 500:
                    return 'Serverfehler. Bitte versuchen Sie es später erneut.';
                default:
                    return error.message;
            }
        }
        return 'Ein unerwarteter Fehler ist aufgetreten.';
    },

    // Retry API call with exponential backoff
    async retryRequest(apiCall, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await apiCall();
            } catch (error) {
                lastError = error;
                
                // Don't retry client errors (4xx)
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                    throw error;
                }
                
                // Wait before retrying (exponential backoff)
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
            }
        }
        
        throw lastError;
    },

    // Batch API calls
    async batchRequests(requests) {
        const promises = requests.map(request => {
            if (typeof request === 'function') {
                return request();
            }
            return request;
        });
        
        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error('Batch request failed:', error);
            throw error;
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        return authApi.isAuthenticated();
    },

    // Get current user
    getCurrentUser() {
        return authApi.getCurrentUser();
    }
};

// Export default API
export default api;
