import { LayoutDashboard, Code, Cpu, Layers, Swords, TrendingUp, Sparkles, Terminal, Settings } from 'lucide-react';
import './Sidebar.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: Sidebar.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Implements a glassmorphic sidebar layout using CSS backdrop blurs for a premium Vercel/Linear feel.
 * - Imports lightweight vector icons from Lucide, ensuring clean lines and responsive scalability.
 * - Manages active indicators and integrates click handles triggering showcase overlays and side Copilot drawers.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Maps menu buttons to upstream tab router states in App.jsx.
 * - Connects custom hooks that toggle drawers programmatically.
 * ==========================================
 */

export const PRESET_QUERIES = [
    {
        id: 'box-office-vs-critics',
        category: 'Relational Aggregation',
        label: 'Financial Performance',
        sublabel: 'Box Office vs Critics',
        description: 'Correlates total theatrical revenue with average critic ratings to evaluate commercial success against artistic reception.',
        concepts: 'INNER JOINs, AVG Aggregation, Grouping, Order By.',
        sql: `SET search_path TO movie_db;

SELECT 
    m.title, 
    b.total_collection, 
    ROUND(AVG(r.rating), 1) as avg_rating,
    COUNT(r.review_type) as review_count
FROM movie m
JOIN box_office b ON m.movie_id = b.movie_id
JOIN review r ON m.movie_id = r.movie_id
GROUP BY m.title, b.total_collection
ORDER BY b.total_collection DESC
LIMIT 10;`
    },
    {
        id: 'star-power',
        category: 'Advanced Joins',
        label: 'Industrial Pedigree',
        sublabel: 'Production & Awards',
        description: 'Examines which actors have won the most awards while working for specific production houses to measure industry influence.',
        concepts: 'Multi-table join (4 tables), WHERE filter, Counts.',
        sql: `SET search_path TO movie_db;

SELECT 
    ph.name as production_house, 
    p.full_name as star, 
    COUNT(an.result) as award_wins
FROM production_house ph
JOIN movie m ON ph.production_id = m.production_id
JOIN cast_crew cc ON m.movie_id = cc.movie_id
JOIN person p ON cc.person_id = p.person_id
JOIN award_nomination an ON p.person_id = an.person_id
WHERE an.result = 'Won'
GROUP BY ph.name, p.full_name
ORDER BY award_wins DESC
LIMIT 10;`
    },
    {
        id: 'box-office-progression',
        category: 'Analytical Windowing',
        label: 'Revenue Progression',
        sublabel: 'Cumulative Window Sums',
        description: 'Plots the day-by-day theatrical collections for movies and calculates the cumulative box office running totals.',
        concepts: 'SQL Window Functions (SUM OVER PARTITION BY ORDER BY).',
        sql: `SET search_path TO movie_db;

SELECT 
    m.title,
    de.day_no,
    de.date,
    de.collection as day_collection,
    SUM(de.collection) OVER (PARTITION BY m.movie_id ORDER BY de.day_no) as cumulative_collection
FROM movie m
JOIN box_office b ON m.movie_id = b.movie_id
JOIN day_entry de ON b.box_office_id = de.box_office_id
ORDER BY m.title, de.day_no
LIMIT 15;`
    }
];

export default function Sidebar({ 
    activeTab, 
    setActiveTab, 
    activeQueryId, 
    onSelectQuery,
    isCopilotOpen,
    onToggleCopilot
}) {
    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-header">
                <div className="logo cinematic-text">
                    CINE<span className="logo-accent">FLOW</span>
                </div>
            </div>

            {/* Navigation links */}
            <nav className="sidebar-nav">
                <div className="nav-group">
                    <span className="nav-label">Core Systems</span>
                    <button 
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard className="w-4 h-4 text-textSecondary" />
                        <span className="query-name">Dashboard</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
                        onClick={() => setActiveTab('playground')}
                    >
                        <Code className="w-4 h-4 text-textSecondary" />
                        <span className="query-name">SQL Playground</span>
                    </button>
                    <button 
                        className={`nav-item ${isCopilotOpen ? 'selected border-goldPrimary' : ''}`}
                        onClick={() => onToggleCopilot()}
                    >
                        <Cpu className="w-4 h-4 text-goldPrimary" />
                        <span className="query-name font-semibold text-goldPrimary">AI Copilot</span>
                    </button>
                </div>

                <div className="nav-group">
                    <span className="nav-label">Introspection</span>
                    <button 
                        className={`nav-item ${activeTab === 'schema' ? 'active' : ''}`}
                        onClick={() => setActiveTab('schema')}
                    >
                        <Layers className="w-4 h-4 text-textSecondary" />
                        <span className="query-name">Schema Explorer</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'battle' ? 'active' : ''}`}
                        onClick={() => setActiveTab('battle')}
                    >
                        <Swords className="w-4 h-4 text-textSecondary" />
                        <span className="query-name">Query Battle Arena</span>
                    </button>
                    <button 
                        className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <TrendingUp className="w-4 h-4 text-textSecondary" />
                        <span className="query-name">Analytics</span>
                    </button>
                </div>

                {/* Show curated query presets when playground is open */}
                {activeTab === 'playground' && (
                    <div className="nav-group animate-stagger-2">
                        <span className="nav-label">Query Presets</span>
                        {PRESET_QUERIES.map((q) => (
                            <button 
                                key={q.id}
                                className={`nav-item ${activeQueryId === q.id ? 'selected' : ''}`}
                                onClick={() => onSelectQuery(q.sql, q.id)}
                            >
                                <span className="query-name text-[11px] truncate w-full">{q.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="nav-group mt-auto">
                    <button 
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings className="w-4 h-4 text-textSecondary" />
                        <span className="query-name">Settings</span>
                    </button>
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="session-info">
                    <span className="status-dot"></span>
                    PostgreSQL Online
                </div>
            </div>
        </aside>
    );
}
