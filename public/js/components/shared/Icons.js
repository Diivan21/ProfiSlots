const { React } = window;

export const Icons = {
    Calendar: ({ className = "w-6 h-6" }) => (
        React.createElement('svg', {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
        }, React.createElement('path', {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        }))
    ),

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

    // Weitere Icons...
};

export const getIconComponent = (iconName) => {
    return Icons[iconName] || Icons.User;
};
