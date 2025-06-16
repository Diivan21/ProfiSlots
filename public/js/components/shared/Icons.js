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
            d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25
