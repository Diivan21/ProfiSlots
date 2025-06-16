export const API_URL = '/api';

export const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(API_URL + endpoint, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
    },

    // Auth
    login: (email, password) => api.request('/login', {
        method: 'POST',
        body: { email, password }
    }),

    register: (email, password, salonName) => api.request('/register', {
        method: 'POST',
        body: { email, password, salonName }
    }),

    // Data
    getDashboard: () => api.request('/dashboard'),
    getServices: () => api.request('/services'),
    getStaff: () => api.request('/staff'),
    getCustomers: () => api.request('/customers'),
    getAppointments: () => api.request('/appointments'),

    // CRUD
    createService: (data) => api.request('/services', { method: 'POST', body: data }),
    updateService: (id, data) => api.request(`/services/${id}`, { method: 'PUT', body: data }),
    deleteService: (id) => api.request(`/services/${id}`, { method: 'DELETE' }),

    createStaff: (data) => api.request('/staff', { method: 'POST', body: data }),
    updateStaff: (id, data) => api.request(`/staff/${id}`, { method: 'PUT', body: data }),
    deleteStaff: (id) => api.request(`/staff/${id}`, { method: 'DELETE' }),

    createCustomer: (data) => api.request('/customers', { method: 'POST', body: data }),
    updateCustomer: (id, data) => api.request(`/customers/${id}`, { method: 'PUT', body: data }),
    deleteCustomer: (id) => api.request(`/customers/${id}`, { method: 'DELETE' }),

    createAppointment: (data) => api.request('/appointments', { method: 'POST', body: data }),
    updateAppointment: (id, data) => api.request(`/appointments/${id}`, { method: 'PUT', body: data }),
    cancelAppointment: (id) => api.request(`/appointments/${id}/cancel`, { method: 'PUT' })
};
