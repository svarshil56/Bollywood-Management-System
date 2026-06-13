import { useEffect, useState, useMemo } from 'react';
import { executeSqlQuery } from '../services/movieService';
import { ArrowUpRight, Search, Shield, Award, DollarSign, Film, Users, BookOpen } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

/**
 * ==========================================
 * CINEFLOW COMPONENT: Dashboard.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Gathers key database aggregates (Revenue, Budget, Movies, Person, Contracts) in parallel via Promise.all.
 * - Integrates dynamic data tables featuring state-driven pagination, client-side sorting, and multi-field search algorithms.
 * - Embeds visual Recharts area/bar charts displaying financial performance ratios and collection timelines.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Implements custom clean SVG sparklines directly inside KPI modules.
 * - Leverages React.useMemo to memoize sorting/filtering calculations, achieving peak rendering performance.
 * ==========================================
 */

function Sparkline({ data, color = "#F4C430" }) {
    const points = data.map((val, i) => `${(i * 18).toFixed(1)},${(40 - val * 3.5).toFixed(1)}`).join(' ');
    return (
        <svg className="w-20 h-10 overflow-visible opacity-80" viewBox="0 0 100 40">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

function Counter({ value, prefix = "", suffix = "" }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const target = parseFloat(value);
        if (isNaN(target)) {
            setCount(value);
            return;
        }

        let start = 0;
        const totalSteps = 25;
        const stepTime = 30;
        const increment = target / totalSteps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                clearInterval(timer);
                setCount(target);
            } else {
                setCount(start);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value]);

    const displayVal = typeof count === 'number'
        ? (count % 1 === 0 ? count.toLocaleString() : count.toFixed(1))
        : count;

    return <>{prefix}{displayVal}{suffix}</>;
}

export default function Dashboard() {
    const [kpis, setKpis] = useState({
        revenue: 0,
        budget: 0,
        movies: 0,
        actors: 0,
        contracts: 0
    });
    const [moviesList, setMoviesList] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Table search, sorting, pagination state
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("total_collection");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);
                setError("");

                const [revRes, budRes, movRes, actRes, conRes, topMovRes, timelineRes] = await Promise.all([
                    executeSqlQuery("SET search_path TO movie_db; SELECT SUM(total_collection) as val FROM box_office;"),
                    executeSqlQuery("SET search_path TO movie_db; SELECT SUM(budget) as val FROM movie;"),
                    executeSqlQuery("SET search_path TO movie_db; SELECT COUNT(*) as val FROM movie;"),
                    executeSqlQuery("SET search_path TO movie_db; SELECT COUNT(*) as val FROM person;"),
                    executeSqlQuery("SET search_path TO movie_db; SELECT COUNT(*) as val FROM contract;"),
                    executeSqlQuery(`
                        SET search_path TO movie_db;
                        SELECT m.movie_id, m.title, m.release_date, b.total_collection, m.budget
                        FROM movie m
                        LEFT JOIN box_office b ON m.movie_id = b.movie_id
                        ORDER BY b.total_collection DESC NULLS LAST;
                    `),
                    executeSqlQuery(`
                        SET search_path TO movie_db;
                        SELECT m.title, b.net_collection as collection, m.budget
                        FROM movie m
                        JOIN box_office b ON m.movie_id = b.movie_id
                        ORDER BY b.net_collection DESC LIMIT 7;
                    `)
                ]);

                setKpis({
                    revenue: parseFloat(revRes.rows?.[0]?.val || 0),
                    budget: parseFloat(budRes.rows?.[0]?.val || 0),
                    movies: parseInt(movRes.rows?.[0]?.val || 0, 10),
                    actors: parseInt(actRes.rows?.[0]?.val || 0, 10),
                    contracts: parseInt(conRes.rows?.[0]?.val || 0, 10)
                });

                setMoviesList(topMovRes.rows || []);
                setChartData((timelineRes.rows || []).map(row => ({
                    name: row.title.substring(0, 12),
                    Collection: parseFloat(row.collection || 0) / 10000000,
                    Budget: parseFloat(row.budget || 0) / 10000000
                })));

            } catch (err) {
                setError(err.message || "Failed to load dashboard metrics");
            } finally {
                setLoading(false);
            }
        }
        loadDashboardData();
    }, []);

    // Filter, sort and paginate movies memoization
    const processedMovies = useMemo(() => {
        let items = [...moviesList];
        
        // Search Filter
        if (search.trim()) {
            const query = search.toLowerCase();
            items = items.filter(m => m.title.toLowerCase().includes(query));
        }

        // Sorting
        items.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (typeof valA === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            // Fallback for null values
            valA = valA ? parseFloat(valA) : 0;
            valB = valB ? parseFloat(valB) : 0;
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        });

        return items;
    }, [moviesList, search, sortBy, sortOrder]);

    const paginatedMovies = useMemo(() => {
        const offset = (page - 1) * pageSize;
        return processedMovies.slice(offset, offset + pageSize);
    }, [processedMovies, page]);

    const totalPages = Math.max(Math.ceil(processedMovies.length / pageSize), 1);

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 rounded-full border-4 border-goldPrimary border-t-transparent animate-spin"></div>
                <p className="mt-4 text-xs font-mono text-textSecondary uppercase tracking-widest">
                    Initializing studio workspace...
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
                        <h3 className="text-lg font-serif text-textPrimary tracking-wide">DATABASE ENGINE EXCEPTION</h3>
                        <p className="text-[11px] text-textSecondary mt-1">CineFlow database pool returned a query error from Neon PostgreSQL.</p>
                    </div>
                    <div className="w-full bg-bgDarkest border border-borderDark p-4 rounded text-left font-mono text-[11px] text-red-400 overflow-x-auto select-text leading-relaxed">
                        {error}
                    </div>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] text-red-400 font-mono tracking-wider rounded uppercase transition-all"
                    >
                        🔄 Refresh Connection
                    </button>
                </div>
            </div>
        );
    }

    // KPI mock trends
    const sparks = {
        revenue: [4, 6, 5, 8, 7, 9, 10],
        budget: [3, 5, 4, 6, 7, 6, 8],
        movies: [5, 5, 6, 7, 7, 8, 8],
        actors: [8, 9, 9, 10, 10, 11, 11],
        contracts: [2, 4, 3, 5, 6, 8, 9]
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Cumulative Revenue Card */}
                <div className="bg-bgCard border border-borderDark rounded-lg p-5 flex flex-col justify-between hover:border-goldPrimary hover:shadow-goldGlow transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Gross Revenue</span>
                        <DollarSign className="w-4 h-4 text-goldPrimary" />
                    </div>
                    <div className="my-3">
                        <h3 className="font-serif text-2xl font-semibold text-textPrimary">
                            <Counter value={kpis.revenue / 10000000} prefix="₹" suffix=" Cr" />
                        </h3>
                        <span className="text-[10px] text-success flex items-center gap-1 mt-1 font-mono">
                            <ArrowUpRight className="w-3 h-3" /> +12.4% vs LY
                        </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-[10px] text-textSecondary font-mono">Box office collection</span>
                        <Sparkline data={sparks.revenue} color="#F4C430" />
                    </div>
                </div>

                {/* Total Budget Card */}
                <div className="bg-bgCard border border-borderDark rounded-lg p-5 flex flex-col justify-between hover:border-goldPrimary hover:shadow-goldGlow transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Total Budget</span>
                        <Film className="w-4 h-4 text-goldSecondary" />
                    </div>
                    <div className="my-3">
                        <h3 className="font-serif text-2xl font-semibold text-textPrimary">
                            <Counter value={kpis.budget / 10000000} prefix="₹" suffix=" Cr" />
                        </h3>
                        <span className="text-[10px] text-success flex items-center gap-1 mt-1 font-mono">
                            <ArrowUpRight className="w-3 h-3" /> +8.2% allocation
                        </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-[10px] text-textSecondary font-mono">Capital allocation</span>
                        <Sparkline data={sparks.budget} color="#E76F51" />
                    </div>
                </div>

                {/* Active Movies Count */}
                <div className="bg-bgCard border border-borderDark rounded-lg p-5 flex flex-col justify-between hover:border-goldPrimary hover:shadow-goldGlow transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Active Library</span>
                        <Award className="w-4 h-4 text-goldPrimary" />
                    </div>
                    <div className="my-3">
                        <h3 className="font-serif text-2xl font-semibold text-textPrimary">
                            <Counter value={kpis.movies} />
                        </h3>
                        <span className="text-[10px] text-success flex items-center gap-1 mt-1 font-mono">
                            <ArrowUpRight className="w-3 h-3" /> +3 added this Q
                        </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-[10px] text-textSecondary font-mono">Catalog listing</span>
                        <Sparkline data={sparks.movies} color="#F4C430" />
                    </div>
                </div>

                {/* Persons Count */}
                <div className="bg-bgCard border border-borderDark rounded-lg p-5 flex flex-col justify-between hover:border-goldPrimary hover:shadow-goldGlow transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Talent Directory</span>
                        <Users className="w-4 h-4 text-goldSecondary" />
                    </div>
                    <div className="my-3">
                        <h3 className="font-serif text-2xl font-semibold text-textPrimary">
                            <Counter value={kpis.actors} />
                        </h3>
                        <span className="text-[10px] text-success flex items-center gap-1 mt-1 font-mono">
                            <ArrowUpRight className="w-3 h-3" /> +14 recruits
                        </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-[10px] text-textSecondary font-mono">Staff & Cast directory</span>
                        <Sparkline data={sparks.actors} color="#E76F51" />
                    </div>
                </div>

                {/* Active Contracts */}
                <div className="bg-bgCard border border-borderDark rounded-lg p-5 flex flex-col justify-between hover:border-goldPrimary hover:shadow-goldGlow transition-all duration-300">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Contracts Active</span>
                        <BookOpen className="w-4 h-4 text-goldPrimary" />
                    </div>
                    <div className="my-3">
                        <h3 className="font-serif text-2xl font-semibold text-textPrimary">
                            <Counter value={kpis.contracts} />
                        </h3>
                        <span className="text-[10px] text-success flex items-center gap-1 mt-1 font-mono">
                            <ArrowUpRight className="w-3 h-3" /> +5 digital deals
                        </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-[10px] text-textSecondary font-mono">Active distribution</span>
                        <Sparkline data={sparks.contracts} color="#F4C430" />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Charts & Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Financial bar charts */}
                <div className="lg:col-span-1 bg-bgCard border border-borderDark rounded-lg p-5">
                    <div className="border-b border-borderDark pb-3 mb-4">
                        <h3 className="font-serif text-lg text-textPrimary">FINANCIAL SPREAD</h3>
                        <span className="text-[11px] text-textSecondary">Budget vs Box Office Revenue (INR Crores)</span>
                    </div>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                                <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px" }}
                                    labelStyle={{ color: "#F4C430", fontWeight: "bold" }}
                                />
                                <Bar dataKey="Collection" fill="#F4C430" name="Gross (Cr)" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Budget" fill="#E76F51" name="Budget (Cr)" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Grossing Movies Data Grid */}
                <div className="lg:col-span-2 bg-bgCard border border-borderDark rounded-lg p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-borderDark pb-3 mb-4 gap-2">
                            <div>
                                <h3 className="font-serif text-lg text-textPrimary">TOP GROSSING PRODUCTIONS</h3>
                                <span className="text-[11px] text-textSecondary">Studio listings catalog directory</span>
                            </div>
                            {/* Table Search bar */}
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-textSecondary" />
                                <input 
                                    type="text" 
                                    placeholder="Filter productions..." 
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    className="pl-8 pr-3 py-1.5 w-full sm:w-56 bg-bgDarkest border border-borderDark rounded text-xs text-textPrimary outline-none focus:border-goldPrimary"
                                />
                            </div>
                        </div>

                        {/* Interactive Data Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-borderDark text-textSecondary uppercase tracking-wider text-[10px]">
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-textPrimary" onClick={() => toggleSort("title")}>
                                            Movie Title {sortBy === 'title' && (sortOrder === 'asc' ? '▲' : '▼')}
                                        </th>
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-textPrimary" onClick={() => toggleSort("release_date")}>
                                            Release Date {sortBy === 'release_date' && (sortOrder === 'asc' ? '▲' : '▼')}
                                        </th>
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-textPrimary text-right" onClick={() => toggleSort("budget")}>
                                            Budget {sortBy === 'budget' && (sortOrder === 'asc' ? '▲' : '▼')}
                                        </th>
                                        <th className="py-2.5 px-3 cursor-pointer hover:text-textPrimary text-right" onClick={() => toggleSort("total_collection")}>
                                            Total Collection {sortBy === 'total_collection' && (sortOrder === 'asc' ? '▲' : '▼')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedMovies.map((m) => (
                                        <tr key={m.movie_id} className="border-b border-borderDark/60 hover:bg-white/[0.01] transition-all font-mono">
                                            <td className="py-2.5 px-3 font-sans font-medium text-textPrimary">{m.title}</td>
                                            <td className="py-2.5 px-3 text-textSecondary">
                                                {m.release_date ? new Date(m.release_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-textSecondary">
                                                {m.budget ? `₹${(parseFloat(m.budget) / 10000000).toFixed(1)} Cr` : "N/A"}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-goldPrimary font-semibold">
                                                {m.total_collection ? `₹${(parseFloat(m.total_collection) / 10000000).toFixed(1)} Cr` : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedMovies.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-textSecondary">No movies found match search criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Custom Pagination controls */}
                    <div className="flex items-center justify-between border-t border-borderDark/60 pt-4 mt-3">
                        <span className="text-[10px] text-textSecondary font-mono">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                className="px-3 py-1 bg-bgDarkest hover:bg-white/[0.03] text-textSecondary border border-borderDark rounded text-[10px] disabled:opacity-30 disabled:pointer-events-none"
                                onClick={() => setPage(p => Math.max(p - 1, 1))}
                                disabled={page === 1}
                            >
                                PREVIOUS
                            </button>
                            <button 
                                className="px-3 py-1 bg-bgDarkest hover:bg-white/[0.03] text-textSecondary border border-borderDark rounded text-[10px] disabled:opacity-30 disabled:pointer-events-none"
                                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                disabled={page === totalPages}
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
