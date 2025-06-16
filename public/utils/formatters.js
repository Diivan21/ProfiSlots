export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('de-DE');
};

export const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

export const getStatusColor = (status) => {
    const colors = {
        confirmed: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};
