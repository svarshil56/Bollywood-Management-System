import { useEffect, useState, useMemo } from 'react';
import { executeSqlQuery } from '../services/movieService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import './AnalyticsDashboard.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: AnalyticsDashboard.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Employs Recharts charts rendering database metrics inside responsive overlays.
 * - Triggers parallel API gathers using standard JavaScript Promise pools to optimize loading.
 * - Features client-side currency filters translating large SQL figures into localized Crores counts.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Binds metrics states and coordinates line shapes, bar values, pie charts, and count increments.
 * ==========================================
 */

function Counter({ value, prefix = '', suffix = '' }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const target = parseFloat(value);
        if (isNaN(target)) {
            setCount(value);
            return;
        }

        let start = 0;
        const steps = 30;
        const time = 30;
        const increment = target / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                clearInterval(timer);
                setCount(target);
            } else {
                setCount(start);
            }
        }, time);

        return () => clearInterval(timer);
    }, [value]);

    const formatted = typeof count === 'number'
        ? (count % 1 === 0 ? count.toLocaleString() : count.toFixed(1))
        : count;

    return <>{prefix}{formatted}{suffix}</>;
}

export default function AnalyticsDashboard() {
    const [kpis, setKpis] = useState({
        totalRevenue: 0,
        totalMovies: 0,
        avgRating: 0
    });
    const [productionData, setProductionData] = useState([]);
    const [sentimentData, setSentimentData] = useState([]);
    const [timelineData, setTimelineData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadAnalytics() {
            try {
                setLoading(true);
                setError('');

                const [revRes, countRes, ratingRes, prodRes, sentRes, timelineRes] = await Promise.all([
                    executeSqlQuery('SET search_path TO movie_db; SELECT SUM(total_collection) as val FROM box_office;'),
                    executeSqlQuery('SET search_path TO movie_db; SELECT COUNT(*) as val FROM movie;'),
                    executeSqlQuery('SET search_path TO movie_db; SELECT AVG(rating) as val FROM review;'),
                    executeSqlQuery(`
                        SET search_path TO movie_db; 
                        SELECT ph.name, SUM(b.total_collection) as revenue, SUM(m.budget) as budget
                        FROM production_house ph
                        JOIN movie m ON ph.production_id = m.production_id
                        JOIN box_office b ON m.movie_id = b.movie_id
                        GROUP BY ph.name
                        ORDER BY revenue DESC
                        LIMIT 5;
                    `),
                    executeSqlQuery(`
                        SET search_path TO movie_db;
                        SELECT sentiment, COUNT(*) as count 
                        FROM review 
                        WHERE sentiment IS NOT NULL AND sentiment != ''
                        GROUP BY sentiment;
                    `),
                    executeSqlQuery(`
                        SET search_path TO movie_db;
                        SELECT m.title, b.total_collection as collection
                        FROM movie m
                        JOIN box_office b ON m.movie_id = b.movie_id
                        ORDER BY b.total_collection DESC LIMIT 8;
                    `)
                ]);

                setKpis({
                    totalRevenue: parseFloat(revRes.rows?.[0]?.val || 0),
                    totalMovies: parseInt(countRes.rows?.[0]?.val || 0, 10),
                    avgRating: parseFloat(ratingRes.rows?.[0]?.val || 0).toFixed(1)
                });

                // Format Production Data for Recharts comparison
                setProductionData((prodRes.rows || []).map(row => ({
                    name: row.name.substring(0, 12),
                    Revenue: parseFloat(row.revenue || 0) / 10000000,
                    Budget: parseFloat(row.budget || 0) / 10000000
                })));

                // Format Sentiment Data for PieChart
                setSentimentData((sentRes.rows || []).map(row => ({
                    name: row.sentiment,
                    value: parseInt(row.count || 0, 10)
                })));

                // Format Timeline Data for AreaChart
                setTimelineData((timelineRes.rows || []).map(row => ({
                    name: row.title.substring(0, 10),
                    Collection: parseFloat(row.collection || 0) / 10000000
                })));

            } catch (err) {
                setError(err.message || "Failed to load database analytics graphs");
            } finally {
                setLoading(false);
            }
        }
        loadAnalytics();
    }, []);

    const sentimentColors = {
        Positive: "#22C55E",
        Neutral: "#F59E0B",
        Negative: "#EF4444"
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 rounded-full border-4 border-goldPrimary border-t-transparent animate-spin"></div>
                <p className="mt-4 text-xs font-mono text-textSecondary uppercase tracking-widest">
                    Compiling visual charts...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="panel max-w-xl mx-auto mt-12 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)] animate-fade-in">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
                        <Shield className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif text-textPrimary tracking-wide">METRICS ENGINE ERROR</h3>
                        <p className="text-[11px] text-textSecondary mt-1">CineFlow analytics engine failed to fetch metric curves from Postgres.</p>
                    </div>
                    <div className="w-full bg-bgDarkest border border-borderDark p-4 rounded text-left font-mono text-[11px] text-red-400 overflow-x-auto select-text leading-relaxed">
                        {error}
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] text-red-400 font-mono tracking-wider rounded uppercase transition-all"
                    >
                        🔄 Retry Analytics Query
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard animate-fade-in">
            {/* KPI Cards Row */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-label">Cumulative Theatrical Revenue</div>
                    <div className="kpi-value text-gold-kpi">
                        <Counter value={kpis.totalRevenue / 10000000} prefix="₹" suffix=" Cr" />
                    </div>
                    <div className="kpi-sub">Total across all catalog records</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Cinematic Catalog Size</div>
                    <div className="kpi-value text-gold-kpi">
                        <Counter value={kpis.totalMovies} suffix=" Titles" />
                    </div>
                    <div className="kpi-sub">Active movies tracked in directory</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-label">Average Critic Score</div>
                    <div className="kpi-value text-gold-kpi">
                        <Counter value={kpis.avgRating} suffix=" / 10" />
                    </div>
                    <div className="kpi-sub">Calculated rating averages</div>
                </div>
            </div>

            {/* Recharts Grid */}
            <div className="analytics-charts-grid">
                {/* Cumulative collection Area Chart */}
                <div className="chart-panel">
                    <div className="chart-panel-header">
                        <h3>REVENUE PROGRESSION WAVE</h3>
                        <p>Cumulative gross box office collections (INR Crores)</p>
                    </div>
                    <div className="chart-container-div">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                                <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px" }}
                                    labelStyle={{ color: "#F4C430", fontWeight: "bold" }}
                                />
                                <defs>
                                    <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F4C430" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#F4C430" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="Collection" stroke="#F4C430" strokeWidth={2} fillOpacity={1} fill="url(#colorColl)" name="Gross (Cr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Production house Bar Chart */}
                <div className="chart-panel">
                    <div className="chart-panel-header">
                        <h3>PRODUCTION HOUSES COMPARATIVE</h3>
                        <p>Revenue earnings vs budgets allocated (INR Crores)</p>
                    </div>
                    <div className="chart-container-div">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                                <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px" }}
                                    labelStyle={{ color: "#F4C430", fontWeight: "bold" }}
                                />
                                <Bar dataKey="Revenue" fill="#F4C430" name="Revenue" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Budget" fill="#E76F51" name="Budget" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Critic review Pie Chart */}
                <div className="chart-panel chart-panel-wide">
                    <div className="chart-panel-header">
                        <h3>CRITICS SENTIMENT SUMMARY</h3>
                        <p>Aggregated rating categories polarity distribution</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-around">
                        <div className="w-64 h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sentimentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {sentimentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={sentimentColors[entry.name] || "#a1a1aa"} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px" }}
                                        labelStyle={{ color: "#F4C430" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest block border-b border-borderDark pb-2 mb-2">
                                POLARITY COUNTS
                            </span>
                            {sentimentData.map((item) => (
                                <div key={item.name} className="flex items-center gap-12 justify-between font-mono text-xs">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sentimentColors[item.name] }}></span>
                                        <span className="text-textPrimary font-sans">{item.name} reviews:</span>
                                    </span>
                                    <span className="font-bold text-textPrimary">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
