import { api } from '../../config/api.js';
import { Icons } from '../shared/Icons.js';
import { ServiceForm } from './ServiceForm.js';
import { ServiceCard } from './ServiceCard.js';

const { React } = window;
const { useState } = React;

export const ServiceManager = ({ services, onUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);

    const handleEdit = (service) => {
        setEditingService(service);
        setShowForm(true);
    };

    const handleDelete = async (serviceId) => {
        if (window.confirm('Möchten Sie diesen Service wirklich löschen?')) {
            try {
                await api.deleteService(serviceId);
                onUpdate();
                alert('Service gelöscht!');
            } catch (error) {
                alert('Fehler beim Löschen: ' + error.message);
            }
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingService(null);
    };

    return React.createElement('div', { className: "space-y-6" },
        React.createElement('div', { className: "bg-white rounded-lg shadow-lg p-6" },
            React.createElement('div', { className: "flex items-center justify-between mb-6" },
                React.createElement('h2', { className: "text-2xl font-semibold text-gray-800 flex items-center" },
                    React.createElement(Icons.Settings),
                    React.createElement('span', { className: "ml-2" }, 'Service-Verwaltung')
                ),
                React.createElement('button', {
                    onClick: () => setShowForm(true),
                    className: "bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                },
                    React.createElement(Icons.Plus),
                    React.createElement('span', null, 'Neuer Service')
                )
            ),

            showForm && React.createElement(ServiceForm, {
                service: editingService,
                onSave: () => {
                    onUpdate();
                    handleFormClose();
                },
                onCancel: handleFormClose
            }),

            React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
                services.map(service =>
                    React.createElement(ServiceCard, {
                        key: service.id,
                        service,
                        onEdit: () => handleEdit(service),
                        onDelete: () => handleDelete(service.id)
                    })
                )
            )
        )
    );
};
