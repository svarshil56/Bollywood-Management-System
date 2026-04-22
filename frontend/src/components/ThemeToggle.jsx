import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState(
        typeof window !== 'undefined' ? localStorage.getItem('theme') || 'light' : 'light'
    );

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button 
            onClick={toggleTheme} 
            className="theme-toggle glass-effect"
            aria-label="Toggle Theme"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                padding: '0',
                borderRadius: '50%',
                fontSize: '1.2rem'
            }}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
}
