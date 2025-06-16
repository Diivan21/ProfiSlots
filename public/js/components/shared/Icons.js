// js/components/shared/Icons.js
// Modulare Icon-Komponenten für ProfiSlots

const { React } = window;

export const Icons = {
    // Calendar Icon
    Calendar: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            xmlns: "http://www.w3.org/2000/svg"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        }))
    ),

    // Clock Icon
    Clock: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        }))
    ),

    // User Icon
    User: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        }))
    ),

    // Users Icon
    Users: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        }))
    ),

    // Scissors Icon (for services)
    Scissors: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6.5-4a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0zM15 5v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5"
        }))
    ),

    // Heart Icon (for wellness services)
    Heart: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        }))
    ),

    // MessageSquare Icon (for consultation)
    MessageSquare: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        }))
    ),

    // Phone Icon
    Phone: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
        }))
    ),

    // Mail Icon
    Mail: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        }))
    ),

    // Plus Icon
    Plus: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
        }))
    ),

    // Edit Icon
    Edit: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        }))
    ),

    // Trash Icon
    Trash: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        }))
    ),

    // Check Icon
    Check: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M5 13l4 4L19 7"
        }))
    ),

    // X Icon
    X: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M6 18L18 6M6 6l12 12"
        }))
    ),

    // Settings Icon
    Settings: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        })),
        React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        })
    ),

    // Search Icon
    Search: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        }))
    ),

    // Euro Icon
    Euro: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M14.121 15.536c-1.171 1.952-3.31 1.952-4.242 0-1.172-2.46-1.172-7.072 0-9.532.932-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        }))
    ),

    // Loading Spinner
    Spinner: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className: `${className} animate-spin`,
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24"
        }, [
            React.createElement('circle', {
                key: 'circle',
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
            }),
            React.createElement('path', {
                key: 'path',
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            })
        ])
    ),

    // Alert Triangle
    AlertTriangle: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        }))
    ),

    // Eye Icon
    Eye: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        }), React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        }))
    ),

    // ChevronDown Icon
    ChevronDown: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }))
    ),

    // Star Icon
    Star: ({ className = "w-6 h-6", filled = false }) => (
        React.createElement('svg', {
            className,
            fill: filled ? "currentColor" : "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        }))
    )
};

// Helper function to get icon component by name
export const getIconComponent = (iconName) => {
    return Icons[iconName] || Icons.User;
};

// Icon name validation
export const isValidIconName = (iconName) => {
    return Object.keys(Icons).includes(iconName);
};

// Get all available icon names
export const getAvailableIcons = () => {
    return Object.keys(Icons).filter(name => 
        !['Spinner', 'AlertTriangle', 'Eye', 'ChevronDown', 'Star'].includes(name)
    );
};
