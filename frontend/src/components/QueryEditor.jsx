import { useEffect, useState, useMemo, useRef } from 'react';
import { fetchDatabaseSchema } from '../services/movieService';
import { HelpCircle, ChevronRight, ChevronDown, Table, Key } from 'lucide-react';
import './QueryEditor.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: QueryEditor.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Mounts a Schema Helper Sidebar parsing table columns and key mappings dynamically.
 * - Handles cursor selection indices using native HTML `selectionStart/selectionEnd` offsets, inserting selected items exactly at the cursor in the SQL area.
 * - Provides keyboard shortcut overrides to execute statements (`Ctrl+Enter` or `Cmd+Enter`).
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Maintains collapsible states for catalog tables.
 * - Auto-scrolls line counter gutters using standard value memoizations.
 * ==========================================
 */

export default function QueryEditor({ sqlText, onSqlTextChange, onRunQuery, loading }) {
    const [schema, setSchema] = useState([]);
    const [collapsed, setCollapsed] = useState({});
    const inputRef = useRef(null);

    // Fetch schema details for helper panel
    useEffect(() => {
        async function loadHelperSchema() {
            try {
                const data = await fetchDatabaseSchema();
                if (data && data.length > 0) {
                    setSchema(data);
                    // Collapse all by default
                    const initialCollapse = {};
                    data.forEach(t => { initialCollapse[t.tableName] = true; });
                    setCollapsed(initialCollapse);
                }
            } catch (err) {
                console.error("Failed to load schema helper details", err);
            }
        }
        loadHelperSchema();
    }, []);

    // Insert schema token exactly at the cursor position
    const insertToken = (token) => {
        const textarea = inputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const updatedText = sqlText.substring(0, start) + token + sqlText.substring(end);
        
        onSqlTextChange(updatedText);

        // Reposition cursor after inserted token
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + token.length, start + token.length);
        }, 30);
    };

    const toggleCollapse = (tableName) => {
        setCollapsed(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
    };

    const onKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            onRunQuery();
        }
    };

    // Calculate line counts for gutter display
    const lineNumbers = useMemo(() => {
        const lines = sqlText.split('\n').length;
        return Array.from({ length: Math.max(lines, 8) }, (_, i) => i + 1);
    }, [sqlText]);

    return (
        <section className="query-editor panel">
            <div className="panel-header" style={{ marginBottom: '1.2rem' }}>
                <h2>SQL PLAYGROUND</h2>
                <span className="panel-subtitle">Compose query statements directly against introspected catalog structures.</span>
            </div>

            <div className="query-editor-wrapper">
                {/* Main SQL Console input */}
                <div className="editor-main-panel">
                    <div className="editor-window">
                        <div className="editor-header-bar">
                            <div className="window-controls">
                                <span className="control-dot dot-red"></span>
                                <span className="control-dot dot-yellow"></span>
                                <span className="control-dot dot-green"></span>
                            </div>
                            <span className="window-title">CINEFLOW_SHELL.SQL</span>
                        </div>

                        <div className="editor-container">
                            <div className="line-numbers">
                                {lineNumbers.map(num => (
                                    <div key={num}>{num}</div>
                                ))}
                            </div>

                            <textarea
                                ref={inputRef}
                                id="sql-editor-input"
                                className="query-input"
                                value={sqlText}
                                onChange={(event) => onSqlTextChange(event.target.value)}
                                onKeyDown={onKeyDown}
                                spellCheck={false}
                                placeholder="SELECT * FROM movie;"
                                rows={10}
                            />
                        </div>
                    </div>

                    <div className="query-actions">
                        <button className="run-btn" onClick={onRunQuery} type="button" disabled={loading}>
                            {loading ? '⚡ Running...' : '🚀 EXECUTE QUERY'}
                        </button>
                        <span className="hint-text">💡 Press <code>Ctrl + Enter</code> to run instantly</span>
                    </div>
                </div>

                {/* Schema Helper Sidebar */}
                <aside className="schema-helper-sidebar">
                    <span className="schema-helper-title">
                        <HelpCircle className="w-3.5 h-3.5 text-goldPrimary" /> Schema Helper
                    </span>
                    <div className="helper-list">
                        {schema.map(t => {
                            const isCollapsed = collapsed[t.tableName];
                            return (
                                <div key={t.tableName} className="helper-table-group">
                                    <button 
                                        className="helper-table-btn" 
                                        onClick={() => toggleCollapse(t.tableName)}
                                        onDoubleClick={() => insertToken(t.tableName)}
                                        title="Click to toggle columns, Double click to insert table name"
                                    >
                                        <span className="flex items-center gap-1 truncate max-w-[85%]">
                                            <Table className="w-3 h-3 text-textSecondary shrink-0" />
                                            <span className="truncate">{t.tableName}</span>
                                        </span>
                                        {isCollapsed ? <ChevronRight className="w-3 h-3 text-textMuted" /> : <ChevronDown className="w-3 h-3 text-goldPrimary" />}
                                    </button>

                                    {!isCollapsed && (
                                        <div className="helper-columns-collapse">
                                            {t.columns.map(col => {
                                                const isPk = t.primaryKeys.includes(col.name);
                                                return (
                                                    <button 
                                                        key={col.name} 
                                                        className="helper-col-btn"
                                                        onClick={() => insertToken(col.name)}
                                                        title={`Click to insert column: ${col.name}`}
                                                    >
                                                        <span className="flex items-center gap-1 truncate">
                                                            {isPk ? <Key className="w-2.5 h-2.5 text-goldPrimary shrink-0" /> : <span className="w-2.5 h-2.5 inline-block"></span>}
                                                            <span className="truncate">{col.name}</span>
                                                        </span>
                                                        <span className="text-[7px] text-textMuted uppercase font-mono">{col.type}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </section>
    );
}
