import { useMemo } from 'react';
import './StatsGrid.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: StatsGrid.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Provides immediate metadata on executed queries including row counts and data origin.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Binds input properties (rowCount, columnCount, sourceFile).
 * ==========================================
 */

export default function StatsGrid({ rowCount, columnCount, sourceFile }) {
    
    return (
        <section className="stats-grid" aria-label="Query Profiler Dashboard">
            {/* KPI grid counts */}
            <div className="stats-grid-cards">
                <article className="stat-card">
                    <span className="stat-label">Rows Yielded</span>
                    <strong className="stat-value">{rowCount.toLocaleString()}</strong>
                </article>
                <article className="stat-card">
                    <span className="stat-label">Columns</span>
                    <strong className="stat-value">{columnCount}</strong>
                </article>
                <article className="stat-card" style={{ gridColumn: 'span 2' }}>
                    <span className="stat-label">Query Source</span>
                    <strong className="stat-value" style={{ fontSize: '0.78rem' }}>{sourceFile}</strong>
                </article>
            </div>
        </section>
    );
}