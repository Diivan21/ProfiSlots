import { Dashboard } from './components/dashboard/Dashboard.js';
import { LoginForm } from './components/auth/LoginForm.js';

const { React, ReactDOM } = window;
const { useState, useEffect } = React;

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Invalid user data:', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (loading) {
        return React.createElement('div', { 
            className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" 
        }, 'Laden...');
    }

    if (!user) {
        return React.createElement(LoginForm, { onLogin: handleLogin });
    }

    return React.createElement(Dashboard, { user, onLogout: handleLogout });
};

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.render(React.createElement(App), rootElement);
}
