/**
 * ==========================================
 * CINEFLOW UTILS: exportUtils.js
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Dynamically constructs in-memory Blobs (using standard UTF-8 encoders) to bypass server-side export loads.
 * - Programmatically simulates browser DOM download events (`document.createElement('a')` click trigger) for client-side download execution.
 * - Handles CSV escaping rules (wrapping strings in double quotes and escaping inner quotes) to avoid CSV injection.
 * ==========================================
 */

/**
 * Export results list to a CSV file.
 * Automatically handles string escaping for quotes, commas, and newlines.
 */
export function exportToCsv(rows, columns, filename = 'export.csv') {
    if (!rows || !rows.length || !columns || !columns.length) return;
    
    const header = columns.join(',');
    const body = rows.map(row => 
        columns.map(col => {
            let val = row[col];
            if (val === null || val === undefined) {
                return '';
            }
            const strVal = String(val);
            // Escape quotes, commas, and newlines
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        }).join(',')
    ).join('\n');

    const csvContent = `${header}\n${body}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up memory allocation
}

/**
 * Export rows array to a formatted JSON file.
 */
export function exportToJson(rows, filename = 'export.json') {
    if (!rows) return;
    const jsonContent = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up memory allocation
}
