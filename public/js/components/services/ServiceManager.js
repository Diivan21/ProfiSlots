// js/components/services/ServiceManager.js
// Modulare Service-Verwaltungskomponente

import { api } from '../../config/api.js';
import { Icons } from '../shared/Icons.js';
import { ICON_OPTIONS } from '../../config/constants.js';

const { React } = window;
const { useState } = React;

// Service Form Komponente
const ServiceForm = ({ service, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: service?.name || '',
        duration: service?.duration?.toString() || '',
        price: service?.price?.toString() || '',
        icon: service?.icon || 'Scissors'
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.duration || !formData.price) {
            alert('Bitte füllen Sie alle Felder aus.');
            return;
        }

        setLoading(true);
        try {
            const serviceData = {
                name: formData.name,
                duration: parseInt(formData.duration),
                price: parseFloat(formData.price),
                icon: formData.icon
            };

            if (service) {
                await api.updateService(service.id, serviceData);
            } else {
                await api.createService(serviceData);
            }
            
            onSave();
            alert('Service erfolgreich gespeichert!');
        } catch (error) {
            alert('Fehler beim Speichern: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return React.createElement('div', { 
        className: "mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200" 
    },
        React.createElement('h3', { 
            className: "text-lg font-medium mb-4 text-gray-800" 
        }, service ? 'Service bearbeiten' : 'Neuen Service hinzufügen'),
        
        React.createElement('form', { 
            onSubmit: handleSubmit, 
            className: "grid grid-cols-1 md:grid-cols-2 gap-4" 
        },
            // Service Name
            React.createElement('div', null,
                React.createElement('label', { 
                    className: "block text-sm font-medium text-gray-700 mb-2" 
                }, 'Service Name *'),
                React.createElement('input', {
                    type: "text",
                    value: formData.name,
                    onChange: (e) => handleInputChange('name', e.target.value),
                    placeholder: "z.B. Haarschnitt",
                    className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                    required: true
                })
            ),

            // Duration
            React.createElement('div', null,
                React.createElement('label', { 
                    className: "block text-sm font-medium text-gray-700 mb-2" 
                }, 'Dauer (Minuten) *'),
                React.createElement('input', {
                    type: "number",
                    value: formData.duration,
                    onChange: (e) => handleInputChange('duration', e.target.value),
                    placeholder: "60",
                    min: "15",
                    max: "300",
                    className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                    required: true
                })
            ),

            // Price
            React.createElement('div', null,
                React.createElement('label', { 
                    className: "block text-sm font-medium text-gray-700 mb-2" 
                }, 'Preis (€) *'),
                React.createElement('input', {
                    type: "number",
                    value: formData.price,
                    onChange: (e) => handleInputChange('price', e.target.value),
                    placeholder: "45.00",
                    min: "0",
                    step: "0.50",
                    className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                    required: true
                })
            ),

            // Icon Selection
            React.createElement('div', null,
                React.createElement('label', { 
                    className: "block text-sm font-medium text-gray-700 mb-2" 
                }, 'Icon'),
                React.createElement('select', {
                    value: formData.icon,
                    onChange: (e) => handleInputChange('icon', e.target.value),
                    className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                },
                    ICON_OPTIONS.map(icon =>
                        React.createElement('option', { key: icon, value: icon }, icon)
                    )
                )
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
                    service ? 'Aktualisieren' : 'Hinzufügen'
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

// Service Card Komponente
const ServiceCard = ({ service, onEdit, onDelete }) => {
    const [deleting, setDeleting] = useState(false);
    const IconComponent = Icons[service.icon] || Icons.Scissors;

    const handleDelete = async () => {
        if (!window.confirm(`Möchten Sie den Service "${service.name}" wirklich löschen?`)) {
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
        // Header mit Icon und Info
        React.createElement('div', { 
            className: "flex items-center justify-between mb-4" 
        },
            React.createElement('div', { 
                className: "flex items-center space-x-3" 
            },
                React.createElement('div', { 
                    className: "w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600" 
                },
                    React.createElement(IconComponent, { className: "w-6 h-6" })
                ),
                React.createElement('div', null,
                    React.createElement('div', { 
                        className: "font-medium text-gray-800" 
                    }, service.name),
                    React.createElement('div', { 
                        className: "text-sm text-gray-500" 
                    }, `${service.duration} Minuten`)
                )
            ),
            React.createElement('div', { 
                className: "text-lg font-semibold text-indigo-600" 
            }, `${service.price}€`)
        ),

        // Service Details
        React.createElement('div', { 
            className: "text-sm text-gray-600 mb-4 space-y-1" 
        },
            React.createElement('div', null, `Dauer: ${service.duration} Minuten`),
            React.createElement('div', null, `Preis: ${service.price}€`),
            React.createElement('div', null, `Icon: ${service.icon}`)
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

// Haupt Service Manager Komponente
export const ServiceManager = ({ services, onUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleEdit = (service) => {
        setEditingService(service);
        setShowForm(true);
    };

    const handleDelete = async (serviceId) => {
        setLoading(true);
        try {
            await api.deleteService(serviceId);
            onUpdate();
            alert('Service erfolgreich gelöscht!');
        } catch (error) {
            alert('Fehler beim Löschen: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSave = () => {
        onUpdate();
        setShowForm(false);
        setEditingService(null);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingService(null);
    };

    const handleAddNew = () => {
        setEditingService(null);
        setShowForm(true);
    };

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
                    React.createElement(Icons.Settings, { className: "w-8 h-8 text-indigo-600 mr-3" }),
                    'Service-Verwaltung'
                ),
                React.createElement('button', {
                    onClick: handleAddNew,
                    disabled: loading,
                    className: "bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                },
                    React.createElement(Icons.Plus, { className: "w-5 h-5" }),
                    React.createElement('span', null, 'Neuer Service')
                )
            ),

            // Service Form (conditionally
