import './DashboardHeader.css';
import ThemeToggle from './ThemeToggle';

export default function DashboardHeader() {
    return (
        <section className="hero glass-effect animate-fade-in">
            <div className="hero-content">
                <p className="eyebrow">PostgreSQL Connected</p>
                <h1>Bollywood <span style={{ color: 'var(--accent)' }}>Manager</span></h1>
                <p className="hero-copy">
                    Manage your movie database with precision. Run dynamic queries and explore records instantly.
                </p>
            </div>
            <div className="hero-actions">
                <ThemeToggle />
            </div>
        </section>
    );
}