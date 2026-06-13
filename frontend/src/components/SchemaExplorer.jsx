import { useEffect, useState, useMemo } from 'react';
import { fetchDatabaseSchema } from '../services/movieService';
import { ReactFlow, Background, Controls, MarkerType, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './SchemaExplorer.css';

/* ──────────────────────────────────────────────────────────────
   ERD INNER — needs ReactFlowProvider context for fitView hook
────────────────────────────────────────────────────────────── */
function ERDCanvas({ nodes, edges }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
        const t = setTimeout(() => fitView({ padding: 0.18, duration: 400 }), 50);
        return () => clearTimeout(t);
    }, [nodes, fitView]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            nodesDraggable
            panOnDrag
            zoomOnScroll
            minZoom={0.25}
            maxZoom={2}
        >
            <Background color="#2a2a35" gap={20} size={1} />
            <Controls />
        </ReactFlow>
    );
}

/* ──────────────────────────────────────────────────────────────
   MAIN EXPORT
────────────────────────────────────────────────────────────── */
export default function SchemaExplorer() {
    const [schema, setSchema]               = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const [selectedTable, setSelectedTable] = useState(null);
    const [searchQuery, setSearchQuery]     = useState('');
    const [activeView, setActiveView]       = useState('erd'); // 'erd' | 'table'

    /* ── Load schema on mount ── */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await fetchDatabaseSchema();
                if (data && data.length > 0) {
                    const sorted = [...data].sort((a, b) => a.tableName.localeCompare(b.tableName));
                    setSchema(sorted);
                    setSelectedTable(sorted[0].tableName);
                }
            } catch (err) {
                setError(err.message || 'Failed to load schema');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── Sidebar filter ── */
    const filteredTables = useMemo(
        () => schema.filter(t => t.tableName.toLowerCase().includes(searchQuery.toLowerCase())),
        [schema, searchQuery]
    );

    /* ── Selected table object ── */
    const selectedTableObj = useMemo(
        () => schema.find(t => t.tableName === selectedTable) || null,
        [schema, selectedTable]
    );

    /* ── Connected tables (for ERD highlight) ── */
    const connectedSet = useMemo(() => {
        if (!selectedTable || !schema.length) return new Set();
        const s = new Set([selectedTable]);
        schema.forEach(tbl => {
            if (tbl.tableName === selectedTable) {
                tbl.foreignKeys.forEach(fk => s.add(fk.foreignTable));
            }
            tbl.foreignKeys.forEach(fk => {
                if (fk.foreignTable === selectedTable) s.add(tbl.tableName);
            });
        });
        return s;
    }, [selectedTable, schema]);

    /* ── Build React Flow nodes ── */
    const nodes = useMemo(() => {
        if (!schema.length) return [];
        const COLS = 4;
        const SX = 310, SY = 220;
        return schema.map((tbl, idx) => {
            const r = Math.floor(idx / COLS);
            const c = idx % COLS;
            const isSelected  = tbl.tableName === selectedTable;
            const isConnected = connectedSet.has(tbl.tableName);
            const hasSelection = selectedTable !== null;

            let border = '1px solid rgba(255,255,255,0.07)';
            let bg     = 'rgba(16,16,20,0.95)';
            let opacity = 1;
            let shadow = 'none';

            if (hasSelection) {
                if (isSelected) {
                    border = '2px solid #d4af37';
                    bg     = 'rgba(212,175,55,0.06)';
                    shadow = '0 0 22px rgba(212,175,55,0.2)';
                } else if (isConnected) {
                    border = '1.5px solid rgba(212,175,55,0.35)';
                } else {
                    opacity = 0.28;
                }
            }

            return {
                id: tbl.tableName,
                type: 'default',
                position: { x: c * SX + 30, y: r * SY + 30 },
                style: {
                    background: bg,
                    border,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#f4f4f5',
                    width: 260,
                    opacity,
                    boxShadow: shadow,
                    transition: 'all 0.25s ease',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                },
                data: {
                    label: (
                        <div onClick={() => setSelectedTable(tbl.tableName)}>
                            {/* Node header */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.07)',
                                paddingBottom: '6px', marginBottom: '7px'
                            }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: 700,
                                    letterSpacing: '0.07em', textTransform: 'uppercase',
                                    color: isSelected ? '#d4af37' : '#f4f4f5'
                                }}>
                                    {tbl.tableName}
                                </span>
                                <span style={{
                                    fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.05)', color: '#a1a1aa'
                                }}>
                                    {tbl.columns.length} cols
                                </span>
                            </div>
                            {/* Column preview */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {tbl.columns.slice(0, 4).map(col => {
                                    const isPk = tbl.primaryKeys.includes(col.name);
                                    const isFk = tbl.foreignKeys.some(f => f.column === col.name);
                                    return (
                                        <div key={col.name} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            fontSize: '9px', fontFamily: 'monospace'
                                        }}>
                                            <span style={{ color: isPk ? '#d4af37' : isFk ? '#38bdf8' : '#a1a1aa', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {isPk ? '🔑 ' : isFk ? '🔗 ' : '▸ '}{col.name}
                                            </span>
                                            <span style={{ color: '#52525b', fontSize: '8px', textTransform: 'uppercase' }}>{col.type.split('(')[0]}</span>
                                        </div>
                                    );
                                })}
                                {tbl.columns.length > 4 && (
                                    <div style={{ fontSize: '8px', color: '#52525b', fontStyle: 'italic', textAlign: 'center', paddingTop: '2px' }}>
                                        +{tbl.columns.length - 4} more
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            };
        });
    }, [schema, selectedTable, connectedSet]);

    /* ── Build React Flow edges ── */
    const edges = useMemo(() => {
        const list = [];
        schema.forEach(tbl => {
            tbl.foreignKeys.forEach((fk, i) => {
                const isHighlit = tbl.tableName === selectedTable || fk.foreignTable === selectedTable;
                const hasSelection = selectedTable !== null;
                const stroke = hasSelection
                    ? (isHighlit ? '#d4af37' : 'rgba(255,255,255,0.04)')
                    : 'rgba(255,255,255,0.12)';
                const sw = hasSelection ? (isHighlit ? 2 : 0.8) : 1.5;
                list.push({
                    id: `e-${tbl.tableName}-${fk.column}-${i}`,
                    source: tbl.tableName,
                    target: fk.foreignTable,
                    type: 'bezier',
                    animated: isHighlit && hasSelection,
                    style: { stroke, strokeWidth: sw },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 12, height: 12, color: stroke
                    }
                });
            });
        });
        return list;
    }, [schema, selectedTable]);

    /* ── Loading / Error states ── */
    if (loading) {
        return (
            <div className="se-fullscreen se-center">
                <div className="se-spinner" />
                <p className="se-loading-text">Introspecting PostgreSQL catalog…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="se-fullscreen se-center">
                <div className="se-error-box">
                    <span className="se-error-icon">⚠</span>
                    <h3>Schema Catalog Error</h3>
                    <pre>{error}</pre>
                    <button onClick={() => window.location.reload()} className="se-retry-btn">↺ Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="se-root">
            {/* ── LEFT SIDEBAR: table list ── */}
            <aside className="se-sidebar">
                <div className="se-sidebar-header">
                    <span className="se-sidebar-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                        </svg>
                        movie_db
                    </span>
                    <span className="se-table-count">{schema.length} tables</span>
                </div>

                <div className="se-search-wrap">
                    <svg className="se-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        className="se-search"
                        type="text"
                        placeholder="Filter tables…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="se-table-list">
                    {filteredTables.map(t => {
                        const pkCount = t.primaryKeys.length;
                        const fkCount = t.foreignKeys.length;
                        return (
                            <button
                                key={t.tableName}
                                className={`se-table-btn ${selectedTable === t.tableName ? 'active' : ''}`}
                                onClick={() => setSelectedTable(t.tableName)}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="se-table-icon">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
                                </svg>
                                <div className="se-table-info">
                                    <span className="se-table-name">{t.tableName}</span>
                                    <span className="se-table-meta">{t.columns.length}c · {pkCount}pk · {fkCount}fk</span>
                                </div>
                                <span className="se-col-badge">{t.columns.length}</span>
                            </button>
                        );
                    })}
                    {filteredTables.length === 0 && (
                        <p className="se-no-results">No tables match "{searchQuery}"</p>
                    )}
                </div>
            </aside>

            {/* ── CENTER: ERD diagram ── */}
            <section className="se-erd-section">
                <div className="se-section-header">
                    <div>
                        <h2 className="se-section-title">Entity-Relationship Diagram</h2>
                        <p className="se-section-sub">Click any node to highlight relationships · Drag to reposition · Scroll to zoom</p>
                    </div>
                    <div className="se-legend">
                        <span className="se-legend-item"><span className="se-dot se-dot-pk"/>Primary Key</span>
                        <span className="se-legend-item"><span className="se-dot se-dot-fk"/>Foreign Key</span>
                        <span className="se-legend-item"><span className="se-dot se-dot-col"/>Column</span>
                    </div>
                </div>

                <div className="se-erd-canvas">
                    <ReactFlowProvider>
                        <ERDCanvas nodes={nodes} edges={edges} />
                    </ReactFlowProvider>
                </div>
            </section>

            {/* ── RIGHT PANEL: column inspector ── */}
            <aside className="se-inspector">
                {selectedTableObj ? (
                    <>
                        <div className="se-inspector-header">
                            <div>
                                <h3 className="se-inspector-title">{selectedTableObj.tableName}</h3>
                                <p className="se-inspector-sub">Table Inspector</p>
                            </div>
                            <div className="se-stats-row">
                                <div className="se-stat">
                                    <span className="se-stat-val">{selectedTableObj.columns.length}</span>
                                    <span className="se-stat-label">Cols</span>
                                </div>
                                <div className="se-stat">
                                    <span className="se-stat-val se-stat-pk">{selectedTableObj.primaryKeys.length}</span>
                                    <span className="se-stat-label">PK</span>
                                </div>
                                <div className="se-stat">
                                    <span className="se-stat-val se-stat-fk">{selectedTableObj.foreignKeys.length}</span>
                                    <span className="se-stat-label">FK</span>
                                </div>
                            </div>
                        </div>

                        {/* Columns table */}
                        <div className="se-col-table-wrap">
                            <table className="se-col-table">
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Type</th>
                                        <th>Key</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTableObj.columns.map(col => {
                                        const isPk = selectedTableObj.primaryKeys.includes(col.name);
                                        const fk = selectedTableObj.foreignKeys.find(f => f.column === col.name);
                                        return (
                                            <tr key={col.name} className={isPk ? 'se-row-pk' : fk ? 'se-row-fk' : ''}>
                                                <td className="se-col-name">
                                                    {isPk && <span className="se-icon-pk">🔑</span>}
                                                    {fk && !isPk && <span className="se-icon-fk">🔗</span>}
                                                    {col.name}
                                                </td>
                                                <td className="se-col-type">{col.type}</td>
                                                <td className="se-col-keys">
                                                    {isPk && <span className="se-badge se-badge-pk">PK</span>}
                                                    {fk && (
                                                        <span
                                                            className="se-badge se-badge-fk"
                                                            title={`→ ${fk.foreignTable}(${fk.foreignColumn})`}
                                                        >
                                                            FK→{fk.foreignTable}
                                                        </span>
                                                    )}
                                                    {!isPk && !fk && <span className="se-badge-none">—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* FK relationships list */}
                        {selectedTableObj.foreignKeys.length > 0 && (
                            <div className="se-fk-section">
                                <h4 className="se-fk-title">Foreign Key References</h4>
                                <div className="se-fk-list">
                                    {selectedTableObj.foreignKeys.map((fk, i) => (
                                        <div key={i} className="se-fk-row">
                                            <span className="se-fk-col">{fk.column}</span>
                                            <span className="se-fk-arrow">→</span>
                                            <button
                                                className="se-fk-target"
                                                onClick={() => setSelectedTable(fk.foreignTable)}
                                            >
                                                {fk.foreignTable}({fk.foreignColumn})
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tables that reference THIS table */}
                        {(() => {
                            const refs = schema.filter(t =>
                                t.tableName !== selectedTable &&
                                t.foreignKeys.some(fk => fk.foreignTable === selectedTable)
                            );
                            if (!refs.length) return null;
                            return (
                                <div className="se-fk-section">
                                    <h4 className="se-fk-title">Referenced By</h4>
                                    <div className="se-fk-list">
                                        {refs.map(t => {
                                            const relFks = t.foreignKeys.filter(fk => fk.foreignTable === selectedTable);
                                            return relFks.map((fk, i) => (
                                                <div key={`${t.tableName}-${i}`} className="se-fk-row">
                                                    <button className="se-fk-target" onClick={() => setSelectedTable(t.tableName)}>
                                                        {t.tableName}
                                                    </button>
                                                    <span className="se-fk-arrow">→</span>
                                                    <span className="se-fk-col">{fk.column}</span>
                                                </div>
                                            ));
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                ) : (
                    <div className="se-inspector-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
                        </svg>
                        <p>Select a table to inspect its columns and relationships</p>
                    </div>
                )}
            </aside>
        </div>
    );
}
