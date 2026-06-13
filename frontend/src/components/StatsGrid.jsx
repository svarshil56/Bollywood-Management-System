import { useMemo } from 'react';
import './StatsGrid.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: StatsGrid.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Dynamically gauges RDBMS query performance using execution latency thresholds.
 * - Computes circular needle rotation angles (from -90deg to +90deg) using a linear scale bounded at 150ms.
 * - Leverages semantic status metrics to suggest indexing recommendations (Seq Scan warnings vs. Index Scan confirmations).
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Binds input properties (rowCount, columnCount, sourceFile, latency).
 * - Maps ranges to color classifications: Ultra Fast (<30ms), Fast (30-100ms), and Slow (>100ms).
 * ==========================================
 */

export default function StatsGrid({ rowCount, columnCount, sourceFile, latency = 0 }) {
    
    // Categorize performance thresholds
    // Note: Neon serverless adds ~50-150ms network overhead on top of raw query time
    const speedStatus = useMemo(() => {
        if (latency <= 80)  return { class: 'ultra-fast', text: 'Ultra Fast',        tip: 'Query resolved via indexed scan or plan cache. PostgreSQL found rows without a full table scan.' };
        if (latency <= 300) return { class: 'normal',     text: 'Normal',            tip: 'Execution within expected range for a cloud serverless PostgreSQL connection (includes ~50–150ms Neon network overhead).' };
        return                     { class: 'slow',       text: 'Slow Query',        tip: 'Possible sequential scan detected. Consider adding B-Tree indexes on JOIN keys and WHERE filter columns.' };
    }, [latency]);

    return (
        <section className="stats-grid" aria-label="Query Profiler Dashboard">
            {/* Execution Latency Card */}
            <article className="latency-dial-card">
                <div className="flex justify-between items-center w-full mb-3">
                    <span className="stat-label">Execution Latency</span>
                    <span className={`latency-status-pill ${speedStatus.class}`} style={{ marginTop: 0 }}>
                        {speedStatus.text}
                    </span>
                </div>
                
                <div className="latency-value" style={{ fontSize: '2rem', textAlign: 'left', width: '100%', color: 'var(--text-primary)', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {latency} <span className="text-xs text-textSecondary font-sans font-normal lowercase">ms</span>
                </div>

                <div className="diagnostics-box font-mono" style={{ width: '100%', marginTop: '1rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>⚡ DB DIAGNOSTIC: </span>
                    {speedStatus.tip}
                </div>
            </article>

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