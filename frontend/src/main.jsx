import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

/**
 * ==========================================
 * CINEFLOW ENTRY POINT: main.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Bootstraps the React SPA using ReactDOM Client `createRoot` for React 18+ concurrent rendering.
 * - Wraps the application root inside `StrictMode` to help detect side effects, deprecated API usage, and state issues early in the development lifecycle.
 * ==========================================
 */

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);