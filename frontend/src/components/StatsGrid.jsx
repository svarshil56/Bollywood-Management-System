import './StatsGrid.css';

export default function StatsGrid({ rowCount, columnCount, sourceFile }) {
    return (
        <section className="stats-grid" aria-label="Summary">
            <article className="stat-card">
                <span className="stat-label">Rows returned</span>
                <strong className="stat-value">{rowCount}</strong>
            </article>
            <article className="stat-card">
                <span className="stat-label">Columns</span>
                <strong className="stat-value">{columnCount}</strong>
            </article>
            <article className="stat-card">
                <span className="stat-label">Query source</span>
                <strong className="stat-value">{sourceFile}</strong>
            </article>
        </section>
    );
}