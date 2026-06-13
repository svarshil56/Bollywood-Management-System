import { useEffect, useRef, useState } from 'react';
import { executeSqlQuery, fetchDatabaseSchema } from '../services/movieService';
import './TerminalConsole.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: TerminalConsole.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Implements an in-browser database shell client utilizing raw REST queries under the hood.
 * - Programmatically formats query JSON response matrices to tabular monospace ASCII grids (ASCII tables).
 * - Leverages scroll anchors (useRef scrollIntoView) to automatically scroll to the bottom of the shell output on command submissions.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Listens for Enter key codes to parse commands.
 * - Implements custom command targets (help, clear, show movies, show actors, schema [table]).
 * ==========================================
 */

export default function TerminalConsole({ isOpen, onClose }) {
    const [history, setHistory] = useState([
        { type: 'output', text: 'Welcome to CineFlow Interactive DBMS Shell CLI (v1.0.0).' },
        { type: 'output', text: 'Connected to Neon compute engine. Type "help" to list shell options.' }
    ]);
    const [inputVal, setInputVal] = useState('');
    const consoleEndRef = useRef(null);
    const inputRef = useRef(null);

    // Keep console scrolled to the bottom on new outputs
    useEffect(() => {
        if (isOpen) {
            consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            inputRef.current?.focus();
        }
    }, [history, isOpen]);

    if (!isOpen) return null;

    const handleCommand = async (e) => {
        if (e.key !== 'Enter') return;
        const cmd = inputVal.trim();
        setInputVal('');

        if (!cmd) return;

        // Log input command to console log list
        setHistory(prev => [...prev, { type: 'command', text: `cineflow > ${cmd}` }]);

        const parts = cmd.split(' ');
        const mainCmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ').toLowerCase();

        switch (mainCmd) {
            case 'help':
                setHistory(prev => [...prev, {
                    type: 'output',
                    text: 'Available DBMS commands:\n  show movies         - Fetch list of top 8 movies\n  show actors         - Fetch list of top 8 actors\n  schema [table_name] - Show introspected column details\n  clear               - Clear terminal output history\n  exit                - Close the terminal console drawer'
                }]);
                break;
            case 'clear':
                setHistory([]);
                break;
            case 'exit':
                onClose();
                break;
            case 'show':
                if (arg === 'movies') {
                    try {
                        const res = await executeSqlQuery("SET search_path TO movie_db; SELECT title, age_rating, runtime_minutes FROM movie LIMIT 8;");
                        const tableText = formatTextTable(res.rows, ['title', 'age_rating', 'runtime_minutes']);
                        setHistory(prev => [...prev, { type: 'output', text: tableText }]);
                    } catch (err) {
                        setHistory(prev => [...prev, { type: 'error', text: `Query Error: ${err.message}` }]);
                    }
                } else if (arg === 'actors') {
                    try {
                        const res = await executeSqlQuery("SET search_path TO movie_db; SELECT full_name, gender, debut_year FROM person WHERE gender IS NOT NULL LIMIT 8;");
                        const tableText = formatTextTable(res.rows, ['full_name', 'gender', 'debut_year']);
                        setHistory(prev => [...prev, { type: 'output', text: tableText }]);
                    } catch (err) {
                        setHistory(prev => [...prev, { type: 'error', text: `Query Error: ${err.message}` }]);
                    }
                } else {
                    setHistory(prev => [...prev, { type: 'error', text: 'Target not recognized. Target: "show movies" or "show actors".' }]);
                }
                break;
            case 'schema':
                if (!arg) {
                    setHistory(prev => [...prev, { type: 'error', text: 'Error: please input a table name. Example: "schema movie"' }]);
                } else {
                    try {
                        const schemaData = await fetchDatabaseSchema();
                        const table = schemaData.find(t => t.tableName.toLowerCase() === arg);
                        if (!table) {
                            setHistory(prev => [...prev, { type: 'error', text: `Table matching name "${arg}" not found in local catalogs.` }]);
                        } else {
                            let summary = `Table Catalog: ${table.tableName.toUpperCase()}\nFields List:\n`;
                            table.columns.forEach(col => {
                                const isPk = table.primaryKeys.includes(col.name) ? ' [PRIMARY KEY]' : '';
                                summary += `  * ${col.name} (${col.type})${isPk}\n`;
                            });
                            setHistory(prev => [...prev, { type: 'output', text: summary }]);
                        }
                    } catch (err) {
                        setHistory(prev => [...prev, { type: 'error', text: `Failed to fetch schema details: ${err.message}` }]);
                    }
                }
                break;
            default:
                setHistory(prev => [...prev, { type: 'error', text: `Unknown command "${mainCmd}". Type "help" to list valid options.` }]);
        }
    };

    // Formats result array to fixed-width ASCII block table
    function formatTextTable(rows, columns) {
        if (!rows || rows.length === 0) return 'No records yielded.';
        
        const widths = {};
        columns.forEach(col => {
            widths[col] = Math.max(col.length, ...rows.map(r => String(r[col] || '').length));
        });

        const separator = '+' + columns.map(col => '-'.repeat(widths[col] + 2)).join('+') + '+';
        const header = '|' + columns.map(col => ` ${col.toUpperCase().padEnd(widths[col])} `).join('|') + '|';
        const dataLines = rows.map(row => 
            '|' + columns.map(col => ` ${String(row[col] || '').padEnd(widths[col])} `).join('|') + '|'
        );

        return [separator, header, separator, ...dataLines, separator].join('\n');
    }

    return (
        <div className="terminal-drawer" onClick={() => inputRef.current?.focus()}>
            <div className="terminal-header">
                <span className="terminal-title">🖥️ CineFlow Developer CLI Shell</span>
                <div className="terminal-actions">
                    <span className="close-tip">Press ~ or ` to close</span>
                    <button className="terminal-close-btn" onClick={onClose}>×</button>
                </div>
            </div>
            <div className="terminal-body font-mono">
                {history.map((line, i) => (
                    <div key={i} className={`terminal-line ${line.type}`}>
                        {line.text}
                    </div>
                ))}
                <div className="terminal-input-row">
                    <span className="terminal-prompt">cineflow &gt;</span>
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={handleCommand}
                        placeholder="Type console command..."
                    />
                </div>
                <div ref={consoleEndRef} />
            </div>
        </div>
    );
}
