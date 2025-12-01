import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return saved === 'true';
        }
        // Fallback to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    useEffect(() => {
        console.log('🌓 Dark mode effect triggered. darkMode:', darkMode);
        const root = document.documentElement;
        if (darkMode) {
            console.log('🌙 Activating dark mode...');
            root.classList.add('dark');
            document.body.style.backgroundColor = '#1e293b'; // Slate-900/950 equivalent
            localStorage.setItem('darkMode', 'true');
            console.log('✅ Dark mode activated. Has dark class:', root.classList.contains('dark'));
        }
        else {
            console.log('☀️ De activating dark mode...');
            root.classList.remove('dark');
            document.body.style.backgroundColor = '#f8fafc'; // Slate-50
            localStorage.setItem('darkMode', 'false');
            console.log('✅ Dark mode deactivated. Has dark class:', root.classList.contains('dark'));
        }
    }, [darkMode]);
    const toggleDarkMode = () => {
        console.log('🌓 Toggling dark mode from:', darkMode, 'to:', !darkMode);
        setDarkMode((prev) => !prev);
    };
    return (_jsx(ThemeContext.Provider, { value: { darkMode, toggleDarkMode }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
//# sourceMappingURL=ThemeContext.js.map