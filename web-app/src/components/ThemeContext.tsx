import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
    darkMode: boolean;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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
            console.log('✅ Dark mode activated. Root classes:', root.className);
        } else {
            console.log('☀️ Deactivating dark mode...');
            root.classList.remove('dark');
            document.body.style.backgroundColor = '#f8fafc'; // Slate-50
            localStorage.setItem('darkMode', 'false');
            console.log('✅ Dark mode deactivated. Root classes:', root.className);
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        console.log('🌓 Toggling dark mode from:', darkMode, 'to:', !darkMode);
        setDarkMode((prev) => !prev);
    };

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
