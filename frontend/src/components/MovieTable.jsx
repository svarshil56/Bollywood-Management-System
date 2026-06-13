import './MovieTable.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: MovieTable.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Sanitizes database records cleanly, converting complex JSON, arrays, and null cells to readable formats.
 * - Wraps data inside responsive overflows, protecting grid layout bounds.
 * - Uses key mapping strategies (`${column}-${rowIndex}`) to ensure React reconciles tabular rows efficiently.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Checks for null/undefined variables, replacing them with a custom styled italicized `<span className="null-cell">NULL</span>`.
 * - Map routines iterate columns and rows programmatically to compile HTML structures.
 * ==========================================
 */

export default function MovieTable({ rows = [], columns = [] }) {
    
    // Safely structure and render cells
    const formatCellValue = (value) => {
        if (value === null || value === undefined) {
            return <span className="null-cell">NULL</span>;
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
    };

    return (
        <section className="panel" style={{ marginTop: '1.5rem' }}>
            <div className="panel-header" style={{ marginBottom: '1.2rem' }}>
                <h2>QUERY RESULTS</h2>
                <span className="panel-subtitle">ReadOnly cursor returned <strong>{rows.length} rows</strong>.</span>
            </div>

            {rows.length === 0 ? (
                <p className="state-message font-mono">⚡ SQL execution successful, but query returned 0 rows.</p>
            ) : (
                <div className="table-wrap">
                    <table className="movie-table">
                        <thead>
                            <tr>
                                {columns.map((col) => (
                                    <th key={col}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={`row-${rowIndex}`}>
                                    {columns.map((col, colIndex) => (
                                        <td key={`${col}-${rowIndex}-${colIndex}`}>
                                            {formatCellValue(row[col])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}