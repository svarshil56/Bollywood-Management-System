import { useState } from 'react';
import MovieTable from './MovieTable';
import { exportToCsv, exportToJson } from '../utils/exportUtils';
import './ResultVisualizer.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: ResultVisualizer.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Dynamically probes result sets to assess if they contain chartable data (looks for at least one string label column and one numeric column).
 * - Offloads data export formatting to standalone utility scripts (`exportUtils.js`), separating concerns.
 * - Integrates view toggles (Tabular Grid vs CSS Bar Chart) for comprehensive analytics.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Analyzes first-row cell value types to identify chart axes variables.
 * - Truncates charts at 10 items to prevent grid pollution.
 * ==========================================
 */

export default function ResultVisualizer({ rows = [], columns = [] }) {
    const [view, setView] = useState('table');

    // Helper to evaluate if a cell represents a chartable number
    const isNumeric = (val) => {
        if (typeof val === 'number') return true;
        if (typeof val !== 'string') return false;
        return !isNaN(parseFloat(val)) && isFinite(val);
    };

    // Auto-detect columns suitable for visualization
    const numericCols = columns.filter(col => rows.length > 0 && isNumeric(rows[0]?.[col]));
    const labelCols = columns.filter(col => rows.length > 0 && typeof rows[0]?.[col] === 'string');
    
    const canVisualize = numericCols.length > 0 && labelCols.length > 0;

    return (
        <div className="result-visualizer animate-fade-in">
            {/* View Actions and Data Export triggers */}
            <div className="visualizer-tabs-container">
                <div className="visualizer-tabs">
                    <button 
                        className={`tab-btn ${view === 'table' ? 'active' : ''}`}
                        onClick={() => setView('table')}
                    >
                        📋 Table View
                    </button>
                    {canVisualize && (
                        <button 
                            className={`tab-btn ${view === 'chart' ? 'active' : ''}`}
                            onClick={() => setView('chart')}
                        >
                            📊 Visual Chart
                        </button>
                    )}
                </div>

                <div className="export-actions">
                    <button 
                        className="export-btn"
                        onClick={() => exportToCsv(rows, columns, 'cineflow_export.csv')}
                        disabled={!rows || rows.length === 0}
                    >
                        📥 CSV Export
                    </button>
                    <button 
                        className="export-btn"
                        onClick={() => exportToJson(rows, 'cineflow_export.json')}
                        disabled={!rows || rows.length === 0}
                    >
                        📥 JSON Export
                    </button>
                </div>
            </div>

            {/* Display View Content */}
            <div className="visualizer-content">
                {view === 'table' ? (
                    <MovieTable rows={rows} columns={columns} />
                ) : (
                    <div className="chart-container">
                        <div className="chart-header">
                            <h3>Query Data Visualization</h3>
                            <p>Plotting metric <strong>{numericCols[0]}</strong> against label <strong>{labelCols[0]}</strong> (top 10 rows)</p>
                        </div>
                        <div className="bar-chart">
                            {(() => {
                                const data = rows.slice(0, 10).map(row => ({
                                    label: row[labelCols[0]],
                                    value: parseFloat(row[numericCols[0]]) || 0
                                }));
                                const maxVal = Math.max(...data.map(d => d.value), 1);

                                return data.map((item, i) => {
                                    const percentage = (item.value / maxVal) * 100;

                                    return (
                                        <div key={i} className="bar-row animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                            <div className="bar-label" title={item.label}>
                                                {item.label || 'NULL'}
                                            </div>
                                            <div className="bar-wrapper">
                                                <div 
                                                    className="bar-fill" 
                                                    style={{ width: `${percentage}%` }}
                                                >
                                                    <span className="bar-value">
                                                        {item.value % 1 === 0 ? item.value.toLocaleString() : item.value.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
