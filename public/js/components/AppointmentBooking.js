// public/js/components/AppointmentBooking.js
class AppointmentBooking {
    constructor(containerId, apiClient) {
        this.container = document.getElementById(containerId);
        this.api = apiClient;
        this.state = {
            services: [],
            staff: [],
            customers: [],
            appointments: [],
            selectedService: null,
            selectedStaff: null,
            selectedCustomer: null,
            selectedDate: '',
            selectedTime: '',
            isLoading: false
        };
        this.timeSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
            '17:00', '17:30', '18:00'
        ];
        this.init();
    }

    async init() {
        try {
            this.setState({ isLoading: true });
            await this.loadData();
            this.render();
            this.attachEventListeners();
        } catch (error) {
            this.showError('Fehler beim Laden der Daten: ' + error.message);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    async loadData() {
        try {
            const [services, staff, customers, appointments] = await Promise.all([
                this.api.getServices(),
                this.api.getStaff(),
                this.api.getCustomers(),
                this.api.getAppointments()
            ]);

            this.setState({
                services: services,
                staff: staff,
                customers: customers,
                appointments: appointments
            });
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="appointment-booking">
                ${this.state.isLoading ? this.renderLoading() : ''}
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Buchungsformular -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h2 class="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                            <svg class="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Neuen Termin buchen
                        </h2>

                        <!-- Service Selection -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">
                                Service auswählen *
                            </label>
                            <div id="service-selection" class="space-y-3">
                                ${this.renderServices()}
                            </div>
                        </div>

                        <!-- Staff Selection -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">
                                Mitarbeiter auswählen *
                            </label>
                            <div id="staff-selection" class="space-y-3">
                                ${this.renderStaff()}
                            </div>
                        </div>

                        <!-- Date Selection -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Datum auswählen *
                            </label>
                            <input
                                type="date"
                                id="appointment-date"
                                min="${new Date().toISOString().split('T')[0]}"
                                value="${this.state.selectedDate}"
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <!-- Time Selection -->
                        ${this.state.selectedDate && this.state.selectedStaff ? `
                            <div class="mb-6">
                                <label class="block text-sm font-medium text-gray-700 mb-3">
                                    Uhrzeit auswählen *
                                </label>
                                <div id="time-selection" class="grid grid-cols-4 gap-2">
                                    ${this.renderTimeSlots()}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Customer Selection -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">
                                Kunde auswählen oder neu anlegen *
                            </label>
                            <div id="customer-section">
                                ${this.renderCustomerSelection()}
                            </div>
                        </div>

                        <!-- Book Button -->
                        <button
                            id="book-appointment-btn"
                            ${!this.isBookingValid() ? 'disabled' : ''}
                            class="w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                                this.isBookingValid() 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>Termin buchen</span>
                        </button>
                    </div>

                    <!-- Upcoming Appointments -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Nächste Termine
                        </h3>
                        <div id="upcoming-appointments">
                            ${this.renderUpcomingAppointments()}
                        </div>
                    </div>
                </div>

                <!-- Error/Success Messages -->
                <div id="message-container" class="fixed top-4 right-4 z-50"></div>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span>Wird geladen...</span>
                </div>
            </div>
        `;
    }

    renderServices() {
        return this.state.services.map(service => `
            <button
                data-service-id="${service.id}"
                class="service-btn w-full p-4 rounded-lg border-2 transition-all text-left ${
                    this.state.selectedService?.id === service.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                }"
            >
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <div>
                            <div class="font-medium text-gray-800">${service.name}</div>
                            <div class="text-sm text-gray-500">${service.duration} Min</div>
                        </div>
                    </div>
                    <div class="text-lg font-semibold text-indigo-600">
                        ${service.price}€
                    </div>
                </div>
            </button>
        `).join('');
    }

    renderStaff() {
        return this.state.staff.map(staffMember => `
            <button
                data-staff-id="${staffMember.id}"
                class="staff-btn w-full p-4 rounded-lg border-2 transition-all text-left ${
                    this.state.selectedStaff === staffMember.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                }"
            >
                <div class="flex items-center space-x-3">
                    <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <div>
                        <div class="font-medium text-gray-800">${staffMember.name}</div>
                        <div class="text-sm text-gray-500">${staffMember.specialty}</div>
                    </div>
                </div>
            </button>
        `).join('');
    }

    renderTimeSlots() {
        return this.timeSlots.map(time => {
            const isAvailable = this.isTimeSlotAvailable(this.state.selectedDate, time, this.state.selectedStaff);
            const isSelected = this.state.selectedTime === time;
            
            return `
                <button
                    data-time="${time}"
                    ${!isAvailable ? 'disabled' : ''}
                    class="time-btn p-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                            ? 'bg-indigo-600 text-white'
                            : isAvailable
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }"
                >
                    ${time}
                </button>
            `;
        }).join('');
    }

    renderCustomerSelection() {
        if (this.state.selectedCustomer) {
            return `
                <div class="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <div>
                                <div class="font-medium text-gray-800">${this.state.selectedCustomer.name}</div>
                                <div class="text-sm text-gray-600">${this.state.selectedCustomer.phone}</div>
                            </div>
                        </div>
                        <button id="clear-customer-btn" class="text-gray-500 hover:text-gray-700 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="space-y-4">
                <div class="relative">
                    <svg class="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <input
                        type="text"
                        id="customer-search"
                        placeholder="Kunde suchen (Name oder Telefon)..."
                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div id="customer-search-results" class="hidden border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    <!-- Search results will be populated here -->
                </div>

                <div class="flex items-center justify-center">
                    <span class="text-gray-500 text-sm mr-2">oder</span>
                    <button
                        id="new-customer-btn"
                        class="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <span>Neuen Kunden anlegen</span>
                    </button>
                </div>
            </div>
        `;
    }

    renderUpcomingAppointments() {
        const upcoming = this.getUpcomingAppointments();
        
        if (upcoming.length === 0) {
            return '<p class="text-gray-500">Keine bevorstehenden Termine</p>';
        }

        return upcoming.slice(0, 5).map(apt => `
            <div class="border border-gray-200 rounded-lg p-4 mb-3 last:mb-0">
                <div class="flex items-center justify-between mb-2">
                    <div class="font-medium text-gray-800">${apt.customer_name}</div>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getStatusColor(apt.status)}">
                        ${this.getStatusText(apt.status)}
                    </span>
                </div>
                <div class="text-sm text-gray-600 space-y-1">
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        ${new Date(apt.appointment_date).toLocaleDateString('de-DE')} um ${apt.appointment_time}
                    </div>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        ${apt.staff_name}
                    </div>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        ${apt.service_name} (${apt.service_price}€)
                    </div>
                </div>
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Service selection
        this.container.querySelectorAll('.service-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const serviceId = btn.dataset.serviceId;
                const service = this.state.services.find(s => s.id == serviceId);
                this.setState({ selectedService: service });
                this.updateUI();
            });
        });

        // Staff selection
        this.container.querySelectorAll('.staff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const staffId = btn.dataset.staffId;
                this.setState({ selectedStaff: staffId });
                this.updateUI();
            });
        });

        // Date selection
        const dateInput = this.container.querySelector('#appointment-date');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.setState({ 
                    selectedDate: e.target.value,
                    selectedTime: '' // Reset time when date changes
                });
                this.updateUI();
            });
        }

        // Time selection
        this.container.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const time = btn.dataset.time;
                this.setState({ selectedTime: time });
                this.updateUI();
            });
        });

        // Customer search
        const customerSearch = this.container.querySelector('#customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', (e) => {
                this.handleCustomerSearch(e.target.value);
            });
        }

        // New customer button
        const newCustomerBtn = this.container.querySelector('#new-customer-btn');
        if (newCustomerBtn) {
            newCustomerBtn.addEventListener('click', () => {
                this.showNewCustomerModal();
            });
        }

        // Clear customer button
        const clearCustomerBtn = this.container.querySelector('#clear-customer-btn');
        if (clearCustomerBtn) {
            clearCustomerBtn.addEventListener('click', () => {
                this.setState({ selectedCustomer: null });
                this.updateUI();
            });
        }

        // Book appointment button
        const bookBtn = this.container.querySelector('#book-appointment-btn');
        if (bookBtn) {
            bookBtn.addEventListener('click', () => {
                this.bookAppointment();
            });
        }
    }

    updateUI() {
        // Re-render specific sections that need updates
        const serviceSection = this.container.querySelector('#service-selection');
        if (serviceSection) {
            serviceSection.innerHTML = this.renderServices();
        }

        const staffSection = this.container.querySelector('#staff-selection');
        if (staffSection) {
            staffSection.innerHTML = this.renderStaff();
        }

        const timeSection = this.container.querySelector('#time-selection');
        if (timeSection && this.state.selectedDate && this.state.selectedStaff) {
            timeSection.innerHTML = this.renderTimeSlots();
        }

        const customerSection = this.container.querySelector('#customer-section');
        if (customerSection) {
            customerSection.innerHTML = this.renderCustomerSelection();
        }

        // Update book button state
        const bookBtn = this.container.querySelector('#book-appointment-btn');
        if (bookBtn) {
            const isValid = this.isBookingValid();
            bookBtn.disabled = !isValid;
            bookBtn.className = `w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                isValid 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`;
        }

        // Re-attach event listeners for updated elements
        this.attachEventListeners();
    }

    // Helper methods
    isTimeSlotAvailable(date, time, staffId) {
        return !this.state.appointments.some(apt => 
            apt.appointment_date === date && 
            apt.appointment_time === time && 
            apt.staff_id == staffId && 
            apt.status !== 'cancelled'
        );
    }

    isBookingValid() {
        return this.state.selectedService && 
               this.state.selectedStaff && 
               this.state.selectedDate && 
               this.state.selectedTime && 
               this.state.selectedCustomer;
    }

    getUpcomingAppointments() {
        const now = new Date();
        return this.state.appointments
            .filter(apt => {
                const aptDate = new Date(apt.appointment_date + ' ' + apt.appointment_time);
                return aptDate >= now && apt.status !== 'cancelled';
            })
            .sort((a, b) => {
                const dateA = new Date(a.appointment_date + ' ' + a.appointment_time);
                const dateB = new Date(b.appointment_date + ' ' + b.appointment_time);
                return dateA - dateB;
            });
    }

    getStatusColor(status) {
        switch(status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusText(status) {
        switch(status) {
            case 'confirmed': return 'Bestätigt';
            case 'pending': return 'Ausstehend';
            case 'cancelled': return 'Storniert';
            default: return status;
        }
    }

    handleCustomerSearch(searchTerm) {
        const resultsContainer = this.container.querySelector('#customer-search-results');
        
        if (!searchTerm.trim()) {
            resultsContainer.classList.add('hidden');
            return;
        }

        const filteredCustomers = this.state.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm)
        );

        if (filteredCustomers.length > 0) {
            resultsContainer.innerHTML = filteredCustomers.slice(0, 5).map(customer => `
                <button
                    data-customer-id="${customer.id}"
                    class="customer-select-btn w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium text-gray-800">${customer.name}</div>
                            <div class="text-sm text-gray-500">${customer.phone}</div>
                        </div>
                        <div class="text-xs text-gray-400">
                            ${customer.total_visits || 0} Termine
                        </div>
                    </div>
                </button>
            `).join('');
            
            // Add event listeners for customer selection
            resultsContainer.querySelectorAll('.customer-select-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const customerId = btn.dataset.customerId;
                    const customer = this.state.customers.find(c => c.id == customerId);
                    this.setState({ selectedCustomer: customer });
                    this.updateUI();
                });
            });
            
            resultsContainer.classList.remove('hidden');
        } else {
            resultsContainer.innerHTML = `
                <div class="p-3 text-center text-gray-500">
                    Keine Kunden gefunden für "${searchTerm}"
                    <button class="block w-full mt-2 text-indigo-600 hover:text-indigo-700 font-medium">
                        Als neuen Kunden anlegen
                    </button>
                </div>
            `;
            resultsContainer.classList.remove('hidden');
        }
    }

    async bookAppointment() {
        if (!this.isBookingValid()) {
            this.showError('Bitte füllen Sie alle Felder aus.');
            return;
        }

        try {
            this.setState({ isLoading: true });
            
            const appointmentData = {
                serviceId: this.state.selectedService.id,
                staffId: this.state.selectedStaff,
                customerId: this.state.selectedCustomer.id,
                appointmentDate: this.state.selectedDate,
                appointmentTime: this.state.selectedTime,
                status: 'confirmed'
            };

            await this.api.createAppointment(appointmentData);
            
            this.showSuccess('Termin erfolgreich gebucht!');
            
            // Reset form
            this.setState({
                selectedService: null,
                selectedStaff: null,
                selectedCustomer: null,
                selectedDate: '',
                selectedTime: ''
            });
            
            // Reload data to show new appointment
            await this.loadData();
            this.render();
            this.attachEventListeners();
            
        } catch (error) {
            this.showError('Fehler beim Buchen des Termins: ' + error.message);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    showNewCustomerModal() {
        // This will be implemented with a modal component
        // For now, we'll use a simple prompt
        const name = prompt('Name des neuen Kunden:');
        const phone = prompt('Telefonnummer:');
        const email = prompt('E-Mail (optional):') || '';
        
        if (name && phone) {
            const newCustomer = {
                name: name,
                phone: phone,
                email: email,
                total_visits: 0
            };
            
            this.setState({ selectedCustomer: newCustomer });
            this.updateUI();
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const container = this.container.querySelector('#message-container');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `mb-3 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${
            type === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
        }`;
        
        messageEl.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    ${type === 'success' 
                        ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />'
                        : '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />'
                    }
                </svg>
                <span>${message}</span>
                <button class="ml-auto text-current opacity-70 hover:opacity-100">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        `;

        container.appendChild(messageEl);

        // Animate in
        setTimeout(() => {
            messageEl.classList.remove('translate-x-full');
            messageEl.classList.add('translate-x-0');
        }, 100);

        // Add close functionality
        const closeBtn = messageEl.querySelector('button');
        closeBtn.addEventListener('click', () => {
            messageEl.classList.add('translate-x-full');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.classList.add('translate-x-full');
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, 5000);
    }

    // Public methods for external access
    refresh() {
        this.init();
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppointmentBooking;
}
