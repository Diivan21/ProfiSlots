import { api } from '../../config/api.js';
import { ICON_OPTIONS } from '../../config/constants.js';

const { React } = window;
const { useState } = React;

export const ServiceForm = ({ service, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: service?.name || '',
        duration: service?.duration?.toString() || '',
        price: service?.price?.toString() || '',
        icon: service?.icon || 'Scissors'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.duration || !formData.price) {
            alert('Bitte füllen Sie alle Felder aus.');
            return;
        }

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
        }
    };

    return React.createElement('div', { className: "mb-6 p-4 bg-gray-50 rounded-lg" },
        React.createElement('h3', { className: "text-lg font-medium mb-4" },
            service ? 'Service bearbeiten' : 'Neuen Service hinzufügen'
        ),
        React.createElement('form', { onSubmit: handleSubmit, className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
            // Form-Felder hier...
            React.createElement('div', { className: "md:col-span-2 flex space-x-3" },
                React.createElement('button', {
                    type: "submit",
                    className: "bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                }, service ? 'Aktualisieren' : 'Hinzufügen'),
                React.createElement('button', {
                    type: "button",
                    onClick: onCancel,
                    className: "bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                }, 'Abbrechen')
            )
        )
    );
};
