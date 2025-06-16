// js/components/customers/CustomerManager.js
// Modulare Kunden-Verwaltungskomponente

import { api } from '../../config/api.js';
import { Icons } from '../shared/Icons.js';
import { formatDate, getToday } from '../../utils/formatters.js';

const { React } = window;
const { useState, useEffect } = React;

// Customer Form Komponente
const CustomerForm = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        email: customer?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name ist erforderlich';
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefonnummer ist erforderlich';
        } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
            newErrors.phone = 'Ungültige Telefonnummer';
        }
        
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Ungültige E-Mail-Adresse';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const customerData = {
                ...formData,
                total_visits: customer?.total_visits || 0,
                last_visit: customer?.last_visit || getToday()
            };

            if (customer) {
                await api.updateCustomer(customer.id, customerData);
            } else {
                await api.createCustomer(customerData);
            }
            
            onSave();
            alert('Kunde erfolgreich gespeichert!');
        } catch (error) {
            alert('Fehler beim Speichern: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return React.createElement('div', { 
        className: "mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200" 
    },
        React.createElement('h3', { 
            className: "text-lg font-medium mb-4 text-gray-800" 
        }, customer ? 'Kunde bearbeiten' : 'Neuen Kunden hinzufügen'),
        
        React.createElement('form', { 
            onSubmit: handleSubmit, 
            className: "grid grid-cols-1 md:grid-cols-2 gap-4" 
        },
            // Name Field
            React.createElement('div', null,
                React.createElement('label', { 
                    className: "block text-sm font-medium text-gray-700 mb-2" 
                }, 'Vollständiger Name *'),
                React.createElement('input', {
                    type: "text",
                    value: formData.name,
                    onChange: (e) => handleInputChange('name', e.target.value),
                    placeholder: "Max Mustermann",
                    className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                    }`,
                    required: true
                }),
                errors.name && React.createElement('p', { 
                    className: "mt-1 text-sm text-red-600" 
                }, errors.name)
            ),

            // Phone Field
            React.createElement('div', null,
                React.createElement('label', { 
                    className: "block text-sm font-medium text-gray-700 mb-2" 
                }, 'Telefonnummer *'),
                React.createElement('input', {
                    type: "tel",
                    value: formData.phone,
                    onChange: (e) => handleInputChange('phone', e.target.value),
                    placeholder: "0123-456789",
                    className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`,
                    required: true
                }),
                errors.phone && React.createElement('p', { 
                    className: "mt-1 text-sm text-red-600" 
                }, errors.phone)
            ),

            // Email Field
            React.createElement('div', { 
                className: "md:col-span-2" 
            },
                React.createElement('label', { 
                    className: "block text-sm font-medium text-gray-700 mb-2" 
                }, 'E-Mail (optional)'),
                React.createElement('input', {
                    type: "email",
                    value: formData.email,
                    onChange: (e) => handleInputChange('email', e.target.value),
                    placeholder: "max@beispiel.de",
                    className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                    }`
                }),
                errors.email && React.createElement('p', { 
                    className: "mt-1 text-sm text-red-600" 
                }, errors.email)
            ),

            // Buttons
            React.createElement('div', { 
                className: "md:col-span-2 flex space-x-3 pt-4" 
            },
                React.createElement('button', {
                    type: "submit",
                    disabled: loading,
                    className: "bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                },
                    loading && React.createElement('div', { 
                        className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" 
                    }),
                    customer ? 'Aktualisieren' : 'Hinzufügen'
                ),
                React.createElement('button', {
                    type: "button",
                    onClick: onCancel,
                    disabled: loading,
                    className: "bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                }, 'Abbrechen')
            )
        )
    );
};

// Customer Card Komponente
const CustomerCard = ({ customer, onEdit, onDelete }) => {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm(`Möchten Sie den Kunden "${customer.name}" wirklich löschen?`)) {
            return;
        }

        setDeleting(true);
        try {
            await onDelete();
        } finally {
            setDeleting(false);
        }
    };

    return React.createElement('div', { 
        className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white" 
    },
        // Header mit Avatar und Info
        React.createElement('div', { 
            className: "flex items-center space-x-3 mb-3" 
        },
            React.createElement('div', { 
                className: "w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center" 
            },
                React.createElement('span', { 
                    className: "text-lg font-semibold text-indigo-600" 
                }, customer.name.charAt(0).toUpperCase())
            ),
            React.createElement('div', { 
                className: "flex-1" 
            },
                React.createElement('div', { 
                    className: "font-medium text-gray-800" 
                }, customer.name),
                React.createElement('div', { 
                    className: "text-sm text-gray-500" 
                }, customer.phone)
            )
        ),
        
        // Customer Details
        React.createElement('div', { 
            className: "space-y-2 text-sm text-gray-600 mb-4" 
        },
            customer.email && React.createElement('div', { 
                className: "flex items-center" 
            },
                React.createElement(Icons.Mail, { className: "w-4 h-4 mr-2" }),
                React.createElement('span', null, customer.email)
            ),
            React.createElement('div', { 
                className: "flex items-center" 
            },
                React.createElement(Icons.Calendar, { className: "w-4 h-4 mr-2" }),
                React.createElement('span', null, `Letzter Besuch: ${formatDate(customer.last_visit || getToday())}`)
            ),
            React.createElement('div', { 
                className: "flex items-center" 
            },
                React.createElement(Icons.Clock, { className: "w-4 h-4 mr-2" }),
                React.createElement('span', null, `${customer.total_visits || 0} Termine insgesamt`)
            )
        ),
        
        // Customer Stats Badge
        React.createElement('div', { 
            className: "flex justify-between items-center mb-4" 
        },
            React.createElement('span', { 
                className: `px-2 py-1 rounded-full text-xs font-medium ${
                    (customer.total_visits || 0) >= 10 ? 'bg-gold-100 text-gold-800' :
                    (customer.total_visits || 0) >= 5 ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                }` 
            }, 
                (customer.total_visits || 0) >= 10 ? 'VIP-Kunde' :
                (customer.total_visits || 0) >= 5 ? 'Stammkunde' :
                'Neukunde'
            ),
            React.createElement('span', { 
                className: "text-sm font-medium text-gray-600" 
            }, `${customer.total_visits || 0} Besuche`)
        ),

        // Action Buttons
        React.createElement('div', { 
            className: "flex space-x-2" 
        },
            React.createElement('button', {
                onClick: onEdit,
                className: "flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            },
                React.createElement(Icons.Edit, { className: "w-4 h-4 mr-1" }),
                'Bearbeiten'
            ),
            React.createElement('button', {
                onClick: handleDelete,
                disabled: deleting,
                className: "flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            },
                deleting ? 
                    React.createElement('div', { 
                        className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" 
                    }) :
                    [
                        React.createElement(Icons.Trash, { key: 'icon', className: "w-4 h-4 mr-1" }),
                        'Löschen'
                    ]
            )
        )
    );
};

// Search Component
const CustomerSearch = ({ searchTerm, onSearchChange, onCreateFromSearch }) => {
    return React.createElement('div', { 
        className: "mb-6" 
    },
        React.createElement('div', { 
            className: "relative" 
        },
            React.createElement('div', { 
                className: "absolute left-3 top-3" 
            },
                React.createElement(Icons.Search, { className: "w-5 h-5 text-gray-400" })
            ),
            React.createElement('input', {
                type: "text",
                value: searchTerm,
                onChange: (e) => onSearchChange(e.target.value),
                placeholder: "Kunden suchen (Name oder Telefon)...",
                className: "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            })
        ),
        
        searchTerm && React.createElement('div', { 
            className: "mt-2 text-sm text-gray-600" 
        },
            React.createElement('span', null, `Suche nach: "${searchTerm}"`),
            React.createElement('button', {
                onClick: () => onCreateFromSearch(searchTerm),
                className: "ml-2 text-indigo-600 hover:text-indigo-700 font-medium"
            }, 'Als neuen Kunden anlegen')
        )
    );
};

// Haupt Customer Manager Komponente
export const CustomerManager = ({ customers, onUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setShowForm(true);
    };

    const handleDelete = async (customerId) => {
        setLoading(true);
        try {
            await api.deleteCustomer(customerId);
            onUpdate();
            alert('Kunde erfolgreich gelöscht!');
        } catch (error) {
            alert('Fehler beim Löschen: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSave = () => {
        onUpdate();
        setShowForm(false);
        setEditingCustomer(null);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingCustomer(null);
    };

    const handleAddNew = () => {
        setEditingCustomer(null);
        setShowForm(true);
    };

    const handleCreateFromSearch = (searchTerm) => {
        setEditingCustomer({ name: searchTerm });
        setShowForm(true);
        setSearchTerm('');
    };

    // Filter customers based on search
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
    );

    const displayCustomers = searchTerm ? filteredCustomers : customers;

    return React.createElement('div', { 
        className: "space-y-6" 
    },
        React.createElement('div', { 
            className: "bg-white rounded-lg shadow-lg p-6" 
        },
            // Header
            React.createElement('div', { 
                className: "flex items-center justify-between mb-6" 
            },
                React.createElement('h2', { 
                    className: "text-2xl font-semibold text-gray-800 flex items-center" 
                },
                    React.createElement(Icons.Users, { className: "w-8 h-8 text-indigo-600 mr-3" }),
                    'Kundenverwaltung'
                ),
                React.createElement('button', {
                    onClick: handleAddNew,
                    disabled: loading,
                    className: "bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                },
                    React.createElement(Icons.Plus, { className: "w-5 h-5" }),
                    React.createElement('span', null, 'Neuer Kunde')
                )
            ),

            // Search
            React.createElement(CustomerSearch, {
                searchTerm,
                onSearchChange: setSearchTerm,
                onCreateFromSearch: handleCreateFromSearch
            }),

            // Customer Form
            showForm && React.createElement(CustomerForm, {
                customer: editingCustomer,
                onSave: handleFormSave,
                onCancel: handleFormCancel
            }),

            // Customers Grid or Empty State
            displayCustomers.length === 0 ? 
                searchTerm ? 
                    React.createElement('div', { 
                        className: "text-center py-8" 
                    },
                        React.createElement(Icons.Search, { 
                            className: "w-12 h-12 text-gray-300 mx-auto mb-4" 
                        }),
                        React.createElement('p', { 
                            className: "text-gray-500" 
                        }, `Keine Kunden gefunden für "${searchTerm}"`),
                        React.createElement('button', {
                            onClick: () => handleCreateFromSearch(searchTerm),
                            className: "mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        }, 'Als neuen Kunden anlegen')
                    ) :
                    React.createElement('div', { 
                        className: "text-center py-12" 
                    },
                        React.createElement(Icons.Users, { 
                            className: "w-16 h-16 text-gray-300 mx-auto mb-4" 
                        }),
                        React.createElement('h3', { 
                            className: "text-lg font-medium text-gray-900 mb-2" 
                        }, 'Noch keine Kunden'),
                        React.createElement('p', { 
                            className: "text-gray-500 mb-4" 
                        }, 'Fügen Sie Ihren ersten Kunden hinzu, um Termine zu verwalten.'),
                        React.createElement('button', {
                            onClick: handleAddNew,
                            className: "bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        }, 'Ersten Kunden hinzufügen')
                    ) :
                React.createElement('div', { 
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                },
                    displayCustomers.map(customer =>
                        React.createElement(CustomerCard, {
                            key: customer.id,
                            customer,
                            onEdit: () => handleEdit(customer),
                            onDelete: () => handleDelete(customer.id)
                        })
                    )
                ),

            // Statistics
            customers.length > 0 && React.createElement('div', { 
                className: "mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200" 
            },
                React.createElement('div', { 
                    className: "bg-blue-50 p-4 rounded-lg" 
                },
                    React.createElement('div', { 
                        className: "flex items-center" 
                    },
                        React.createElement(Icons.Users, { 
                            className: "w-8 h-8 text-blue-600 mr-3" 
                        }),
                        React.createElement('div', null,
                            React.createElement('div', { 
                                className: "text-2xl font-bold text-blue-600" 
                            }, customers.length),
                            React.createElement('div', { 
                                className: "text-sm text-blue-700" 
                            }, 'Kunden gesamt')
                        )
                    )
                ),
                React.createElement('div', { 
                    className: "bg-green-50 p-4 rounded-lg" 
                },
                    React.createElement('div', { 
                        className: "flex items-center" 
                    },
                        React.createElement(Icons.Calendar, { 
                            className: "w-8 h-8 text-green-600 mr-3" 
                        }),
                        React.createElement('div', null,
                            React.createElement('div', { 
                                className: "text-2xl font-bold text-green-600" 
                            }, customers.reduce((sum, c) => sum + (c.total_visits || 0), 0)),
                            React.createElement('div', { 
                                className: "text-sm text-green-700" 
                            }, 'Termine gesamt')
                        )
                    )
                ),
                React.createElement('div', { 
                    className: "bg-purple-50 p-4 rounded-lg" 
                },
                    React.createElement('div', { 
                        className: "flex items-center" 
                    },
                        React.createElement(Icons.Heart, { 
                            className: "w-8 h-8 text-purple-600 mr-3" 
                        }),
                        React.createElement('div', null,
                            React.createElement('div', { 
                                className: "text-2xl font-bold text-purple-600" 
                            }, Math.round(customers.reduce((sum, c) => sum + (c.total_visits || 0), 0) / customers.length * 10) / 10 || 0),
                            React.createElement('div', { 
                                className: "text-sm text-purple-700" 
                            }, 'Ø Termine pro Kunde')
                        )
                    )
                )
            )
        )
    );
};
