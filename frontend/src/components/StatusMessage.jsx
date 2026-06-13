/**
 * ==========================================
 * CINEFLOW COMPONENT: StatusMessage.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Serves as a feedback indicator managing query execution states.
 * - Fits with standard UX design principles by providing clear loading feedback and diagnostic errors.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Checks parent-provided load/error statuses.
 * - Integrates standard spinner tags mapping classes in `styles.css`.
 * ==========================================
 */

export default function StatusMessage({ loading, error }) {
    if (loading) {
        return (
            <div className="loader-panel animate-fade-in">
                <div className="film-reel-loader">
                    <div className="reel-spoke"></div>
                    <div className="reel-spoke"></div>
                    <div className="reel-spoke"></div>
                    <div className="reel-spoke"></div>
                </div>
                <p className="state-message font-mono" style={{ color: 'var(--text-secondary)' }}>
                    Synchronizing database connection...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container panel animate-fade-in" style={{ borderLeft: '3px solid var(--color-error)' }}>
                <p className="state-message error font-mono" style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>
                    ⚠️ SQL EXECUTION FAILURE
                </p>
                <p className="font-mono" style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                    {error}
                </p>
            </div>
        );
    }

    return null;
}