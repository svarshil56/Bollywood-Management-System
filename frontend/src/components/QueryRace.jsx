import { useState } from 'react';
import { executeSqlQuery } from '../services/movieService';
import './QueryRace.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: QueryRace.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Gamifies index performance tuning by contrasting query latencies head-to-head.
 * - Simulates asynchronous execution speeds visually: translates query response times to car translation offsets dynamically.
 * - Teaches PostgreSQL query plan execution strategies: unindexed full-table scans (O(N) Seq Scan) vs. indexed tree lookups (O(log N) Index Scan).
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Executes two query promises sequentially.
 * - Computes speed multipliers and handles interval intervals using state hooks.
 * ==========================================
 */

const DEFAULT_QUERY_A = `SET search_path TO movie_db;
-- Query A: Unindexed Review Sentiment Aggregation
SELECT m.title, COUNT(r.rating) as reviews_count, AVG(r.rating) as avg_rating
FROM movie m
JOIN review r ON m.movie_id = r.movie_id
GROUP BY m.title
LIMIT 5;`;

const DEFAULT_QUERY_B = `SET search_path TO movie_db;
-- Query B: Optimized Primary Key Box Office Join
SELECT m.title, b.net_collection
FROM movie m
JOIN box_office b ON m.movie_id = b.movie_id
ORDER BY b.net_collection DESC
LIMIT 5;`;

export default function QueryRace() {
    const [queryA, setQueryA] = useState(DEFAULT_QUERY_A);
    const [queryB, setQueryB] = useState(DEFAULT_QUERY_B);
    const [racing, setRacing] = useState(false);
    const [results, setResults] = useState(null);
    const [progressA, setProgressA] = useState(0);
    const [progressB, setProgressB] = useState(0);

    const runRace = async () => {
        if (racing) return;
        setRacing(true);
        setResults(null);
        setProgressA(0);
        setProgressB(0);

        try {
            // Run both queries in parallel to speed up execution and starting immediately
            const startA = performance.now();
            const promiseA = executeSqlQuery(queryA).then(res => ({
                res,
                latency: parseFloat((performance.now() - startA).toFixed(1))
            }));

            const startB = performance.now();
            const promiseB = executeSqlQuery(queryB).then(res => ({
                res,
                latency: parseFloat((performance.now() - startB).toFixed(1))
            }));

            const [resultA, resultB] = await Promise.all([promiseA, promiseB]);
            const latencyA = resultA.latency;
            const latencyB = resultB.latency;
            const resA = resultA.res;
            const resB = resultB.res;

            // Determine speed limits and multipliers
            const maxLatency = Math.max(latencyA, latencyB);
            const minLatency = Math.min(latencyA, latencyB);
            const speedRatio = maxLatency / (minLatency || 1);

            // Cap the visual speed difference at 3.0x so the slower car still moves visibly
            const visualRatio = Math.min(speedRatio, 3.0);

            let pA = 0;
            let pB = 0;
            const duration = 2200; // Animation runs for 2.2 seconds
            const intervalTime = 30;
            const totalSteps = duration / intervalTime;

            // Speed calculation: slower car moves slower, winner moves full speed
            const incrementA = 100 / totalSteps / (latencyA > latencyB ? visualRatio : 1);
            const incrementB = 100 / totalSteps / (latencyB > latencyA ? visualRatio : 1);

            const timer = setInterval(() => {
                pA = Math.min(pA + incrementA, 100);
                pB = Math.min(pB + incrementB, 100);
                
                setProgressA(pA);
                setProgressB(pB);

                if (pA >= 100 || pB >= 100) {
                    clearInterval(timer);
                    setRacing(false);
                    setResults({
                        latencyA,
                        latencyB,
                        winner: latencyA < latencyB ? 'A' : 'B',
                        ratio: speedRatio.toFixed(1),
                        rowsA: resA.rowCount || resA.rows?.length || 0,
                        rowsB: resB.rowCount || resB.rows?.length || 0
                    });
                }
            }, intervalTime);

        } catch (err) {
            setRacing(false);
            alert("SQL execution failed: " + err.message);
        }
    };

    return (
        <div className="query-race panel animate-fade-in">
            <div className="race-header">
                <h2>QUERY BATTLE SANDBOX (🏎️ SQL Race)</h2>
                <p>Run two SELECT queries side-by-side to benchmark execution planning, join algorithms, and indexed reads.</p>
            </div>

            <div className="race-editors-grid">
                <div className="editor-card">
                    <div className="card-lbl label-red">🏎️ RUNNER A (Unindexed Join)</div>
                    <textarea 
                        value={queryA} 
                        onChange={e => setQueryA(e.target.value)} 
                        disabled={racing}
                        className="font-mono"
                        spellCheck={false}
                    />
                </div>
                <div className="editor-card">
                    <div className="card-lbl label-gold">🏎️ RUNNER B (Indexed Primary Key Join)</div>
                    <textarea 
                        value={queryB} 
                        onChange={e => setQueryB(e.target.value)} 
                        disabled={racing}
                        className="font-mono"
                        spellCheck={false}
                    />
                </div>
            </div>

            <div className="race-action-panel">
                <button 
                    className="race-btn" 
                    onClick={runRace} 
                    disabled={racing}
                >
                    {racing ? '🏎️ Benching Queries...' : '🚦 START SPEED BATTLE'}
                </button>
            </div>

            {/* Neon Custom Race Track */}
            <div className="race-track-container">
                <div className="track-lane">
                    <div className="lane-label">A</div>
                    <div className="lane-strip">
                        <div className="car-wrapper red-car" style={{ left: `calc(${progressA}% - ${progressA * 0.9}px)` }}>
                            <span className="vector-car">🏎️</span>
                            <div className="underglow"></div>
                        </div>
                        <div className="finish-line-banner"></div>
                    </div>
                </div>
                <div className="track-lane border-t-dashed">
                    <div className="lane-label">B</div>
                    <div className="lane-strip">
                        <div className="car-wrapper gold-car" style={{ left: `calc(${progressB}% - ${progressB * 0.9}px)` }}>
                            <span className="vector-car">🏎️</span>
                            <div className="underglow"></div>
                        </div>
                        <div className="finish-line-banner"></div>
                    </div>
                </div>
            </div>

            {/* Battle results layout */}
            {results && (
                <div className="race-results panel animate-fade-in">
                    <div className="podium-header">
                        <h3>🏆 SQL Winner: Runner {results.winner}</h3>
                        <p>Runner {results.winner} finished the disk-access sequence in <strong>{results.winner === 'A' ? results.latencyA : results.latencyB} ms</strong>.</p>
                    </div>

                    <div className="results-metrics">
                        <div className="metric-box">
                            <span className="metric-title">Runner A Latency</span>
                            <strong className="metric-val color-red-val">{results.latencyA} ms</strong>
                            <span className="metric-sub">{results.rowsA} rows retrieved</span>
                        </div>
                        <div className="metric-box border-x-line">
                            <span className="metric-title">Runner B Latency</span>
                            <strong className="metric-val color-gold-val">{results.latencyB} ms</strong>
                            <span className="metric-sub">{results.rowsB} rows retrieved</span>
                        </div>
                        <div className="metric-box">
                            <span className="metric-title">Tuning Speedup Factor</span>
                            <strong className="metric-val color-gold-val">{results.ratio}x</strong>
                            <span className="metric-sub">faster response yield</span>
                        </div>
                    </div>

                    <div className="profiler-analysis-card">
                        <h4>🎓 INTERVIEW PROFILING NOTES</h4>
                        <div className="analysis-text font-mono">
                            {results.winner === 'B' ? (
                                <>
                                    <p>
                                        <strong>Runner B emerged victorious</strong> because it queries keys on indexed fields (like `movie_id` on the box office records). 
                                        This enables the PostgreSQL query planner to perform an <code>Index Scan</code> (which scales logarithmically: O(log N)).
                                    </p>
                                    <p>
                                        In contrast, <strong>Runner A</strong> did not leverage index fields. Without active indexes, the engine is forced to scan every block on disk (<code>Sequential Scan</code>, O(N) complexity) to compute aggregations, creating bottlenecks as the dataset grows.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p>
                                        <strong>Runner A took the lead!</strong> This query structure triggered a lightweight query plan cache hit or read from highly optimized indexes instead of processing a heavy unindexed relation.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
