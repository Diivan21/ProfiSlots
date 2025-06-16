// public/js/components/Dashboard.js
class Dashboard {
    constructor(containerId, apiClient) {
        this.container = document.getElementById(containerId);
        this.api = apiClient;
        this.user = this.api.getUser();
        this.refreshInterval = null;
        this.chartInstances = {};
        this.state = {
            isLoading: true,
            stats: {
                todayAppointments: 0,
                totalCustomers: 0,
                totalServices: 0,
                monthlyRevenue: 0,
                pendingAppointments: 0,
                completedAppointments: 0
            },
            todayAppointments: [],
            recentCustomers: [],
            upcomingAppointments: [],
            popularServices: [],
            monthlyStats: [],
            quickActions: [
                {
                    title: 'Neuen Termin buchen',
                    icon: 'calendar-plus',
                    route: '/booking',
                    color: 'indigo',
                    description: 'Schnell einen neuen Termin erstellen'
                },
                {
                    title: 'Kunde hinzufügen',
                    icon: 'user-plus',
                    route: '/customers',
                    color: 'green',
                    description: 'Neuen Kunden registrieren'
                },
                {
                    title: 'Termine verwalten',
                    icon: 'calendar',
                    route: '/appointments',
                    color: 'blue',
                    description: 'Alle Termine anzeigen und bearbeiten'
                },
                {
                    title: 'Statistiken',
                    icon: 'chart-bar',
                    route: '/statistics',
                    color: 'purple',
                    description: 'Detaillierte Berichte und Analysen'
                }
            ]
        };
        
        this.init();
    }

    async init() {
        try {
            this.render();
            await this.loadDashboardData();
            this.attachEventListeners();
            this.startAutoRefresh();
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError('Fehler beim Laden des Dashboards: ' + error.message);
        }
    }

    async loadDashboardData() {
        try {
            this.setState({ isLoading: true });
            
            // Load all dashboard data in parallel
            const [
                dashboardStats,
                todayAppointments,
                recentCustomers,
                upcomingAppointments,
                popularServices,
                monthlyStats
            ] = await Promise.all([
                this.api.getDashboard(),
                this.api.getTodaysAppointments(),
                this.loadRecentCustomers(),
                this.api.getUpcomingAppointments(5),
                this.loadPopularServices(),
                this.loadMonthlyStats()
            ]);

            this.setState({
                stats: {
                    ...this.state.stats,
                    ...dashboardStats
                },
                todayAppointments: todayAppointments || [],
                recentCustomers: recentCustomers || [],
                upcomingAppointments: upcomingAppointments || [],
                popularServices: popularServices || [],
                monthlyStats: monthlyStats || []
            });

            this.updateUI();

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Fehler beim Laden der Dashboard-Daten');
        } finally {
            this.setState({ isLoading: false });
        }
    }

    async loadRecentCustomers() {
        try {
            const customers = await this.api.getCustomers();
            return customers
                .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
                .slice(0, 5);
        } catch (error) {
            console.error('Error loading recent customers:', error);
            return [];
        }
    }

    async loadPopularServices() {
        try {
            // This would typically come from a specific API endpoint
            // For now, we'll simulate with mock data
            return [
                { name: 'Haarschnitt', count: 45, revenue: 2025 },
                { name: 'Färbung', count: 23, revenue: 1840 },
                { name: 'Massage', count: 18, revenue: 1170 },
                { name: 'Styling', count: 12, revenue: 480 }
            ];
        } catch (error) {
            console.error('Error loading popular services:', error);
            return [];
        }
    }

    async loadMonthlyStats() {
        try {
            // Mock data for monthly statistics
            const currentDate = new Date();
            const monthlyData = [];
            
            for (let i = 11; i >= 0; i--) {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                monthlyData.push({
                    month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
                    appointments: Math.floor(Math.random() * 100) + 50,
                    revenue: Math.floor(Math.random() * 5000) + 2000,
                    customers: Math.floor(Math.random() * 30) + 10
                });
            }
            
            return monthlyData;
        } catch (error) {
            console.error('Error loading monthly stats:', error);
            return [];
        }
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="dashboard">
                <!-- Welcome Header -->
                <div class="mb-8">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-900">
                                Willkommen zurück, ${this.getFirstName()}!
                            </h1>
                            <p class="mt-2 text-gray-600">
                                Hier ist eine Übersicht über Ihr ${this.user?.salonName || 'Salon'} heute.
                            </p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <div class="text-right">
                                <div class="text-sm text-gray-500">Heute</div>
                                <div class="text-lg font-semibold text-gray-900">
                                    ${new Date().toLocaleDateString('de-DE', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${this.renderStatsCards()}
                </div>

                <!-- Quick Actions -->
                <div class="mb-8">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        ${this.renderQuickActions()}
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <!-- Today's Appointments -->
                    <div class="lg:col-span-2">
                        <div class="bg-white rounded-lg shadow-lg p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    Termine heute
                                </h3>
                                <button data-route="/appointments" class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                                    Alle anzeigen →
                                </button>
                            </div>
                            <div id="todays-appointments">
                                ${this.renderTodaysAppointments()}
                            </div>
                        </div>
                    </div>

                    <!-- Quick Overview -->
                    <div class="space-y-6">
                        <!-- Recent Customers -->
                        <div class="bg-white rounded-lg shadow-lg p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    Neue Kunden
                                </h3>
                                <button data-route="/customers" class="text-green-600 hover:text-green-700 text-sm font-medium">
                                    Alle →
                                </button>
                            </div>
                            <div id="recent-customers">
                                ${this.renderRecentCustomers()}
                            </div>
                        </div>

                        <!-- Popular Services -->
                        <div class="bg-white rounded-lg shadow-lg p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                                    <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                    </svg>
                                    Beliebte Services
                                </h3>
                                <button data-route="/services" class="text-purple-600 hover:text-purple-700 text-sm font-medium">
                                    Verwalten →
                                </button>
                            </div>
                            <div id="popular-services">
                                ${this.renderPopularServices()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Monthly Chart -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-semibold text-gray-900">Monatsübersicht</h3>
                        <div class="flex space-x-2">
                            <button id="chart-appointments" class="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                Termine
                            </button>
                            <button id="chart-revenue" class="px-3 py-1 text-sm rounded-full text-gray-600 hover:bg-gray-100">
                                Umsatz
                            </button>
                            <button id="chart-customers" class="px-3 py-1 text-sm rounded-full text-gray-600 hover:bg-gray-100">
                                Kunden
                            </button>
                        </div>
                    </div>
                    <div class="h-64">
                        <canvas id="monthly-chart"></canvas>
                    </div>
                </div>

                <!-- Loading Overlay -->
                ${this.state.isLoading ? this.renderLoadingOverlay() : ''}
            </div>
        `;
    }

    renderStatsCards() {
        const stats = [
            {
                title: 'Termine heute',
                value: this.state.stats.todayAppointments,
                icon: 'calendar',
                color: 'blue',
                change: '+12%',
                changeType: 'positive'
            },
            {
                title: 'Kunden gesamt',
                value: this.state.stats.totalCustomers,
                icon: 'users',
                color: 'green',
                change: '+8%',
                changeType: 'positive'
            },
            {
                title: 'Services',
                value: this.state.stats.totalServices,
                icon: 'settings',
                color: 'purple',
                change: '0%',
                changeType: 'neutral'
            },
            {
                title: 'Monatsumsatz',
                value: `${this.state.stats.monthlyRevenue || 0}€`,
                icon: 'currency',
                color: 'yellow',
                change: '+24%',
                changeType: 'positive'
            }
        ];

        return stats.map(stat => `
            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center">
                            ${this.getStatIcon(stat.icon, stat.color)}
                        </div>
                    </div>
                    <div class="ml-4 flex-1">
                        <div class="text-sm font-medium text-gray-500">${stat.title}</div>
                        <div class="text-2xl font-bold text-gray-900">${stat.value}</div>
                        <div class="flex items-center mt-1">
                            <span class="text-sm ${
                                stat.changeType === 'positive' ? 'text-green-600' : 
                                stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                            }">
                                ${stat.change} vs. letzten Monat
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderQuickActions() {
        return this.state.quickActions.map(action => `
            <button
                data-route="${action.route}"
                class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all group border-l-4 border-${action.color}-500"
            >
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center group-hover:bg-${action.color}-200 transition-colors">
                            ${this.getActionIcon(action.icon, action.color)}
                        </div>
                    </div>
                    <div class="ml-4 text-left">
                        <div class="text-sm font-semibold text-gray-900 group-hover:text-${action.color}-700">
                            ${action.title}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            ${action.description}
                        </div>
                    </div>
                </div>
            </button>
        `).join('');
    }

    renderTodaysAppointments() {
        if (this.state.isLoading) {
            return this.renderSkeletonAppointments();
        }

        if (this.state.todayAppointments.length === 0) {
            return `
                <div class="text-center py-8">
                    <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p class="text-gray-500">Keine Termine für heute</p>
                    <button data-route="/booking" class="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        Ersten Termin buchen
                    </button>
                </div>
            `;
        }

        return this.state.todayAppointments.map(appointment => `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3 hover:bg-gray-50 transition-colors">
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span class="text-sm font-semibold text-indigo-600">
                                ${appointment.appointment_time || appointment.time}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">
                            ${appointment.customer_name || appointment.customer?.name}
                        </div>
                        <div class="text-sm text-gray-500">
                            ${appointment.service_name || appointment.service?.name} • ${appointment.staff_name || appointment.staffName}
                        </div>
                        <div class="text-xs text-gray-400">
                            ${appointment.customer_phone || appointment.customer?.phone}
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getStatusColor(appointment.status)}">
                        ${this.getStatusText(appointment.status)}
                    </span>
                    <div class="text-sm font-semibold text-gray-900">
                        ${appointment.service_price || appointment.service?.price}€
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderRecentCustomers() {
        if (this.state.isLoading) {
            return this.renderSkeletonList();
        }

        if (this.state.recentCustomers.length === 0) {
            return `
                <div class="text-center py-4">
                    <p class="text-gray-500 text-sm">Keine neuen Kunden</p>
                </div>
            `;
        }

        return this.state.recentCustomers.map(customer => `
            <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">${customer.name}</p>
                    <p class="text-xs text-gray-500">${customer.phone}</p>
                </div>
                <div class="text-xs text-gray-400">
                    ${this.formatRelativeTime(customer.created_at || customer.createdAt)}
                </div>
            </div>
        `).join('');
    }

    renderPopularServices() {
        if (this.state.isLoading) {
            return this.renderSkeletonList();
        }

        if (this.state.popularServices.length === 0) {
            return `
                <div class="text-center py-4">
                    <p class="text-gray-500 text-sm">Keine Daten verfügbar</p>
                </div>
            `;
        }

        return this.state.popularServices.map((service, index) => `
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span class="text-xs font-bold text-purple-600">${index + 1}</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${service.name}</p>
                        <p class="text-xs text-gray-500">${service.count} Termine</p>
                    </div>
                </div>
                <div class="text-sm font-semibold text-gray-900">
                    ${service.revenue}€
                </div>
            </div>
        `).join('');
    }

    renderSkeletonAppointments() {
        return Array.from({ length: 3 }, () => `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-3 animate-pulse">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div>
                        <div class="w-32 h-4 bg-gray-200 rounded mb-2"></div>
                        <div class="w-48 h-3 bg-gray-200 rounded mb-1"></div>
                        <div class="w-24 h-3 bg-gray-200 rounded"></div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
                    <div class="w-12 h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        `).join('');
    }

    renderSkeletonList() {
        return Array.from({ length: 3 }, () => `
            <div class="flex items-center space-x-3 p-3 animate-pulse">
                <div class="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div class="flex-1">
                    <div class="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                    <div class="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
                <div class="w-12 h-3 bg-gray-200 rounded"></div>
            </div>
        `).join('');
    }

    renderLoadingOverlay() {
        return `
            <div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div class="text-center">
                    <div class="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p class="mt-2 text-gray-600">Dashboard wird geladen...</p>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Quick action buttons
        this.container.querySelectorAll('[data-route]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const route = button.getAttribute('data-route');
                if (window.router) {
                    window.router.navigate(route);
                }
            });
        });

        // Chart type switching
        const chartButtons = this.container.querySelectorAll('[id^="chart-"]');
        chartButtons.forEach(button => {
            button.addEventListener('click', () => {
                const chartType = button.id.replace('chart-', '');
                this.switchChartType(chartType, button);
            });
        });

        // Auto-refresh toggle
        this.setupAutoRefresh();
    }

    updateUI() {
        // Update appointments section
        const appointmentsContainer = this.container.querySelector('#todays-appointments');
        if (appointmentsContainer) {
            appointmentsContainer.innerHTML = this.renderTodaysAppointments();
        }

        // Update customers section
        const customersContainer = this.container.querySelector('#recent-customers');
        if (customersContainer) {
            customersContainer.innerHTML = this.renderRecentCustomers();
        }

        // Update services section
        const servicesContainer = this.container.querySelector('#popular-services');
        if (servicesContainer) {
            servicesContainer.innerHTML = this.renderPopularServices();
        }

        // Update chart
        this.renderChart();

        // Re-attach event listeners for updated content
        this.attachEventListeners();
    }

    renderChart() {
        const canvas = this.container.querySelector('#monthly-chart');
        if (!canvas || !this.state.monthlyStats.length) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.chartInstances.monthly) {
            this.chartInstances.monthly.destroy();
        }

        // Simple chart implementation (replace with Chart.js if available)
        this.drawSimpleChart(ctx, canvas);
    }

    drawSimpleChart(ctx, canvas) {
        const data = this.state.monthlyStats;
        const width = canvas.width = canvas.offsetWidth * 2; // For retina displays
        const height = canvas.height = canvas.offsetHeight * 2;
        canvas.style.width = canvas.offsetWidth + 'px';
        canvas.style.height = canvas.offsetHeight + 'px';

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        ctx.scale(2, 2); // For retina

        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= 12; i++) {
            const x = padding + (i * chartWidth / 12);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i * chartHeight / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw data line
        if (data.length > 0) {
            const maxValue = Math.max(...data.map(d => d.appointments));
            
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            data.forEach((point, index) => {
                const x = padding + (index * chartWidth / (data.length - 1));
                const y = height - padding - (point.appointments / maxValue * chartHeight);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();

            // Draw points
            ctx.fillStyle = '#4f46e5';
            data.forEach((point, index) => {
                const x = padding + (index * chartWidth / (data.length - 1));
                const y = height - padding - (point.appointments / maxValue * chartHeight);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        
        data.forEach((point, index) => {
            const x = padding + (index * chartWidth / (data.length - 1));
            ctx.fillText(point.month, x, height - 10);
        });
    }

    switchChartType(type, button) {
        // Update button states
        this.container.querySelectorAll('[id^="chart-"]').forEach(btn => {
            btn.classList.remove('bg-indigo-100', 'text-indigo-700');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        });
        
        button.classList.add('bg-indigo-100', 'text-indigo-700');
        button.classList.remove('text-gray-600', 'hover:bg-gray-100');

        // Update chart data based on type
        this.currentChartType = type;
        this.renderChart();
    }

    setupAutoRefresh() {
        // Refresh dashboard data every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    startAutoRefresh() {
        this.setupAutoRefresh();
        
        // Add visibility change listener to pause/resume refresh
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                    this.refreshInterval = null;
                }
            } else {
                if (!this.refreshInterval) {
                    this.setupAutoRefresh();
                    // Refresh immediately when page becomes visible
                    this.loadDashboardData();
                }
            }
        });
    }

    // Helper methods
    getFirstName() {
        if (!this.user?.email) return 'Benutzer';
        
        const emailPart = this.user.email.split('@')[0];
        return emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
    }

    getStatIcon(iconName, color) {
        const icons = {
            'calendar': `<svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`,
            'users': `<svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg>`,
            'settings': `<svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
            'currency': `<svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
        };
        return icons[iconName] || icons['settings'];
    }

    getActionIcon(iconName, color) {
        const icons = {
            'calendar-plus': `<svg class="w-5 h-5 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v6m3-3H9"></path></svg>`,
            'user-plus': `<svg class="w-5 h-5 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>`,
            'calendar': `<svg class="w-5 h-5 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`,
            'chart-bar': `<svg class="w-5 h-5 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>`
        };
        return icons[iconName] || icons['calendar'];
    }

    getStatusColor(status) {
        const colors = {
            'confirmed': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'cancelled': 'bg-red-100 text-red-800',
            'completed': 'bg-blue-100 text-blue-800'
        };
        return colors[status] || colors['pending'];
    }

    getStatusText(status) {
        const texts = {
            'confirmed': 'Bestätigt',
            'pending': 'Ausstehend',
            'cancelled': 'Storniert',
            'completed': 'Abgeschlossen'
        };
        return texts[status] || status;
    }

    formatRelativeTime(dateString) {
        if (!dateString) return 'Unbekannt';
        
        const now = new Date();
        const date = new Date(dateString);
        const diff = now - date;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) {
            return 'Gerade eben';
        } else if (minutes < 60) {
            return `vor ${minutes} Min`;
        } else if (hours < 24) {
            return `vor ${hours} Std`;
        } else if (days < 7) {
            return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
        } else {
            return date.toLocaleDateString('de-DE');
        }
    }

    showError(message) {
        if (this.container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
            errorDiv.innerHTML = `
                <div class="flex">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                    <span>${message}</span>
                </div>
            `;
            this.container.insertBefore(errorDiv, this.container.firstChild);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    // Public methods for external access
    refresh() {
        return this.loadDashboardData();
    }

    addQuickAction(action) {
        this.state.quickActions.push(action);
        this.updateUI();
    }

    removeQuickAction(title) {
        this.state.quickActions = this.state.quickActions.filter(action => action.title !== title);
        this.updateUI();
    }

    updateStats(newStats) {
        this.setState({
            stats: { ...this.state.stats, ...newStats }
        });
        this.updateUI();
    }

    // Analytics helpers
    getTodayStats() {
        return {
            appointments: this.state.todayAppointments.length,
            revenue: this.state.todayAppointments.reduce((sum, apt) => 
                sum + (apt.service_price || apt.service?.price || 0), 0
            ),
            customers: new Set(this.state.todayAppointments.map(apt => 
                apt.customer_id || apt.customer?.id
            )).size
        };
    }

    getMonthlyGrowth() {
        if (this.state.monthlyStats.length < 2) return 0;
        
        const current = this.state.monthlyStats[this.state.monthlyStats.length - 1];
        const previous = this.state.monthlyStats[this.state.monthlyStats.length - 2];
        
        if (!previous.appointments) return 0;
        
        return Math.round(((current.appointments - previous.appointments) / previous.appointments) * 100);
    }

    // Export data functionality
    exportDashboardData() {
        const data = {
            stats: this.state.stats,
            todayAppointments: this.state.todayAppointments,
            recentCustomers: this.state.recentCustomers,
            popularServices: this.state.popularServices,
            monthlyStats: this.state.monthlyStats,
            exportDate: new Date().toISOString(),
            salonName: this.user?.salonName
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Performance tracking
    trackPagePerformance() {
        if ('performance' in window) {
            const navigationTiming = performance.getEntriesByType('navigation')[0];
            const loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
            
            console.log('Dashboard load time:', loadTime + 'ms');
            
            // Track to analytics if available
            if (window.analytics) {
                window.analytics.track('Dashboard Loaded', {
                    loadTime: loadTime,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    // Cleanup method
    destroy() {
        // Clear intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Destroy chart instances
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.chartInstances = {};

        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Track cleanup
        this.trackPagePerformance();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
} else if (typeof window !== 'undefined') {
    window.Dashboard = Dashboard;
}
