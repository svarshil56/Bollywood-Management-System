import './MovieTable.css';

function formatCellValue(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

export default function MovieTable({ rows, columns }) {
    return (
        <section className="panel">
            <div className="panel-header">
                <h2>Query Result</h2>
                <span className="panel-subtitle">Returned from backend read-only SQL execution</span>
            </div>

            {rows.length === 0 ? (
                <p className="state-message">Query executed, but no rows were returned.</p>
            ) : (
                <div className="table-wrap">
                    <table className="movie-table">
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th key={column}>{column}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr key={`row-${index}`}>
                                    {columns.map((column) => (
                                        <td key={`${column}-${index}`}>{formatCellValue(row[column])}</td>
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