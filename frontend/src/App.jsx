import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHeader from './components/DashboardHeader';
import QueryEditor from './components/QueryEditor';
import StatsGrid from './components/StatsGrid';
import StatusMessage from './components/StatusMessage';
import ResultVisualizer from './components/ResultVisualizer';
import Sidebar, { PRESET_QUERIES } from './components/Sidebar';
import SchemaExplorer from './components/SchemaExplorer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CommandPalette from './components/CommandPalette';
import Dashboard from './components/Dashboard';
import AICopilot from './components/AICopilot';
import { executeSqlQuery } from './services/movieService';

/**
 * ==========================================
 * CINEFLOW COMPONENT: App.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Directs app routing using Framer Motion `AnimatePresence` for transition keyframes.
 * - Integrates split layouts programmatically to mount the AI Copilot chat panel on the right side.
 * - Binds shortcuts (`Ctrl+K` and tilde console drawer) to toggle modals.
 * - Launches a guided manual showcase mode overlay automating route selections.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Tracks routes, overlays, history caches, loader indicators, and showcase positions.
 * ==========================================
 */

const DEFAULT_SQL = `SET search_path TO movie_db;

SELECT *
FROM movie
LIMIT 20;`;

export default function App() {
    // Current router tab state
    const [activeTab, setActiveTab] = useState('dashboard');
    
    // Database query result state
    const [queryResult, setQueryResult] = useState({
        source: 'frontend SQL editor',
        rowCount: 0,
        columns: [],
        rows: [],
    });
    
    const [sqlText, setSqlText] = useState(DEFAULT_SQL);
    const [activeQueryId, setActiveQueryId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Overlay visibility states
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isCopilotOpen, setIsCopilotOpen] = useState(false);

    // Showcase mode states removed

    // SQL execution history loaded from local storage
    const [history, setHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('bms_query_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Keyboard bindings for global command palette and console tilde
    useEffect(() => {
        const handleGlobalKeys = (e) => {
            // Command Palette: Ctrl + K or Cmd + K
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, []);

    // Helper to log user query runs into history
    const addQueryToHistory = (sql) => {
        const trimmed = sql.trim();
        if (!trimmed || trimmed === DEFAULT_SQL.trim()) return;
        setHistory(prev => {
            const filtered = prev.filter(item => item.trim() !== trimmed);
            const newHistory = [sql, ...filtered].slice(0, 6);
            localStorage.setItem('bms_query_history', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearHistory = () => {
        localStorage.removeItem('bms_query_history');
        setHistory([]);
    };

    // Execute standard SQL query runner
    async function runEditorQuery() {
        try {
            setLoading(true);
            setError('');

            const startTime = performance.now();
            const data = await executeSqlQuery(sqlText);
            const latency = parseFloat((performance.now() - startTime).toFixed(1));
            
            setQueryResult({
                ...data,
                latency: data.latency !== undefined ? data.latency : latency
            });
            addQueryToHistory(sqlText);
        } catch (fetchError) {
            setError(fetchError.message || 'Failed to execute SQL query');
        } finally {
            setLoading(false);
        }
    }

    const handleSelectQuery = (sql, id) => {
        setSqlText(sql);
        setActiveQueryId(id);
    };

    // Auto-run default query on initial application load
    useEffect(() => {
        runEditorQuery();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rowCount = queryResult.rows.length;
    const columnCount = useMemo(() => queryResult.columns.length, [queryResult.columns]);

    // Active SQL metadata block for playground explanations
    const activePreset = useMemo(() => {
        if (!activeQueryId) return null;
        return PRESET_QUERIES.find(q => q.id === activeQueryId);
    }, [activeQueryId]);

    return (
        <>
            <div className="grain-overlay" />

            {/* Ctrl + K command palette search overlay */}
            <CommandPalette 
                isOpen={isPaletteOpen}
                onClose={() => setIsPaletteOpen(false)}
                setActiveTab={setActiveTab}
                setSqlText={setSqlText}
                onRunQuery={runEditorQuery}
            />

            <div className="dashboard-container">
                <Sidebar 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    activeQueryId={activeQueryId}
                    onSelectQuery={handleSelectQuery}
                    isCopilotOpen={isCopilotOpen}
                    onToggleCopilot={() => setIsCopilotOpen(prev => !prev)}
                />
                
                {/* Main layout frame: splits workspace if AI copilot side drawer is open */}
                <main className="main-content" style={{ 
                    width: `calc(100% - 280px - ${isCopilotOpen ? '320px' : '0px'})`,
                    marginRight: isCopilotOpen ? '320px' : '0px' 
                }}>
                    <div className="app-shell">
                        <DashboardHeader />
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22, ease: "easeInOut" }}
                            >
                                {activeTab === 'dashboard' && <Dashboard />}

                                {activeTab === 'playground' && (
                                    <>
                                        <div className={`playground-layout ${isCopilotOpen ? 'copilot-open' : ''}`}>
                                            <div className="editor-side">
                                                <QueryEditor 
                                                    sqlText={sqlText} 
                                                    onSqlTextChange={setSqlText} 
                                                    onRunQuery={runEditorQuery} 
                                                    loading={loading} 
                                                />

                                                {/* Query History Ticker */}
                                                {history.length > 0 && (
                                                    <div className="history-panel glass-effect animate-fade-in">
                                                        <div className="history-header">
                                                            <span className="history-label">⚡ Recent Execution History</span>
                                                            <button className="clear-history-btn" onClick={clearHistory}>
                                                                Flush History
                                                            </button>
                                                        </div>
                                                        <div className="history-list">
                                                            {history.map((h, i) => (
                                                                <button 
                                                                    key={i} 
                                                                    className="history-pill font-mono"
                                                                    onClick={() => {
                                                                        setSqlText(h);
                                                                        setActiveQueryId(null);
                                                                    }}
                                                                    title={h}
                                                                >
                                                                    {h.replace(/\s+/g, ' ').substring(0, 32)}...
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="profiler-side">
                                                <StatsGrid 
                                                    rowCount={rowCount} 
                                                    columnCount={columnCount} 
                                                    sourceFile={queryResult.source} 
                                                    latency={queryResult.latency}
                                                />

                                                {activePreset && (
                                                    <div className="preset-explanation panel glass-effect animate-fade-in">
                                                        <h4>💡 INTERVIEWER PROFILE NOTES</h4>
                                                        <p className="explanation-desc">{activePreset.description}</p>
                                                        <div className="explanation-tech">
                                                            <strong>SQL Target Concepts:</strong> <code>{activePreset.concepts}</code>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <StatusMessage loading={loading} error={error} />
                                        
                                        {!loading && !error && (
                                            <ResultVisualizer 
                                                rows={queryResult.rows} 
                                                columns={queryResult.columns} 
                                            />
                                        )}
                                    </>
                                )}

                                {activeTab === 'analytics' && <AnalyticsDashboard />}

                                {activeTab === 'schema' && (
                                    <div className="schema-fullbleed">
                                        <SchemaExplorer />
                                    </div>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="panel space-y-6">
                                        <div className="border-b border-borderDark pb-3 mb-4">
                                            <h2>SYSTEM SETTINGS</h2>
                                            <span className="text-[11px] text-textSecondary">Manage CineFlow engine properties and credentials</span>
                                        </div>
                                        <div className="space-y-3 max-w-xl font-mono text-xs">
                                            <div className="p-3 bg-bgSecondary border border-borderDark rounded flex justify-between items-center">
                                                <span className="text-textSecondary font-sans">Database Driver:</span>
                                                <span className="text-goldPrimary">PostgreSQL Serverless (pg-pool)</span>
                                            </div>
                                            <div className="p-3 bg-bgSecondary border border-borderDark rounded flex justify-between items-center">
                                                <span className="text-textSecondary font-sans">Connection SSL Mode:</span>
                                                <span className="text-goldPrimary">require (Neon Security)</span>
                                            </div>
                                            <div className="p-3 bg-bgSecondary border border-borderDark rounded flex justify-between items-center">
                                                <span className="text-textSecondary font-sans">Query Profiler Cache:</span>
                                                <span className="text-goldPrimary">Bypass / Live Introspection</span>
                                            </div>
                                            <div className="p-3 bg-bgSecondary border border-borderDark rounded flex justify-between items-center">
                                                <span className="text-textSecondary font-sans">CineFlow Version:</span>
                                                <span className="text-goldPrimary">v1.1.0-Premium</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                {/* ChatGPT-style side drawer panel */}
                <div 
                    className="fixed right-0 top-0 h-screen bg-bgCard border-l border-borderDark shadow-lg transition-transform duration-300 z-50"
                    style={{ 
                        width: '320px', 
                        transform: isCopilotOpen ? 'translateX(0)' : 'translateX(100%)' 
                    }}
                >
                    <AICopilot 
                        onExecuteSql={runEditorQuery}
                        setSqlText={setSqlText}
                        onSwitchToPlayground={() => setActiveTab('playground')}
                    />
                </div>

                {/* Showcase Guided tour overlay removed */}
            </div>
        </>
    );
}