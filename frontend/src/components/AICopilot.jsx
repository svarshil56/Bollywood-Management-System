import { useState, useRef, useEffect } from 'react';
import { executeSqlQuery } from '../services/movieService';
import { Send, Copy, Play, AlertTriangle, Cpu, Check, X } from 'lucide-react';

/**
 * ==========================================
 * CINEFLOW COMPONENT: AICopilot.jsx
 * ==========================================
 * Client-side NLP engine: detects intent first, then
 * extracts the entity name by stripping only the intent
 * trigger words — not domain-specific nouns.
 * ==========================================
 */

/* ── Intent detection helpers ── */
const is = (text, ...patterns) => patterns.some(p => p.test(text));

const extractEntity = (text, ...triggerWords) => {
    let t = text.toLowerCase();
    // Remove only the intent trigger words, not domain nouns
    triggerWords.forEach(w => { t = t.replace(w, ''); });
    // Strip generic filler
    t = t.replace(/\b(the|of|me|for|a|an|in|on|by|with|from|and|or)\b/g, ' ');
    return t.replace(/\s+/g, ' ').trim();
};

/* ══════════════════════════════════════════════════════════════
   MAIN NLP → SQL MAPPER
══════════════════════════════════════════════════════════════ */
const parseNaturalLanguageToSql = (prompt) => {
    const t = prompt.toLowerCase().trim();

    /* 1 ── Songs of a specific movie */
    if (is(t, /songs?\b/, /music\b/, /sing\b/)) {
        const entity = extractEntity(t, /songs?\b/, /music\b/, /sing\b/, /show\b/, /list\b/, /get\b/, /find\b/);
        if (entity.length > 1) {
            return `SET search_path TO movie_db;
SELECT s.title AS song_title, s.language, s.duration_seconds,
       a.album_title, m.title AS movie_title
FROM song s
JOIN album a ON s.album_id = a.album_id
JOIN movie m ON a.movie_id = m.movie_id
WHERE m.title ILIKE '%${entity}%'
   OR s.title ILIKE '%${entity}%'
ORDER BY m.title, s.title;`;
        }
        return `SET search_path TO movie_db;
SELECT s.title AS song_title, s.language, s.duration_seconds,
       a.album_title, m.title AS movie_title
FROM song s
JOIN album a ON s.album_id = a.album_id
JOIN movie m ON a.movie_id = m.movie_id
ORDER BY m.title
LIMIT 15;`;
    }

    /* 2 ── Box office / revenue / grossing */
    if (is(t, /box.?office/, /highest.?gross/, /top.?gross/, /most.?revenue/, /highest.?revenue/, /total.?collection/)) {
        return `SET search_path TO movie_db;
SELECT m.title, b.total_collection, b.opening_day_collection,
       b.overseas_collection
FROM movie m
JOIN box_office b ON m.movie_id = b.movie_id
ORDER BY b.total_collection DESC
LIMIT 10;`;
    }

    /* 3 ── Actor / person who starred in most movies */
    if (is(t, /actor.*most/, /most.*movies/, /most.*films/, /stars.*most/)) {
        return `SET search_path TO movie_db;
SELECT p.full_name, COUNT(DISTINCT cc.movie_id) AS movie_count
FROM person p
JOIN cast_crew cc ON p.person_id = cc.person_id
JOIN role r ON cc.role_id = r.role_id
WHERE r.role_name IN ('Actor', 'Actress')
GROUP BY p.full_name
ORDER BY movie_count DESC
LIMIT 10;`;
    }

    /* 4 ── Movies released after / before a year */
    const afterYear = t.match(/after\s+(\d{4})/i);
    const beforeYear = t.match(/before\s+(\d{4})/i);
    if (afterYear) {
        return `SET search_path TO movie_db;
SELECT title, release_date, runtime_minutes, age_rating
FROM movie
WHERE release_date > '${afterYear[1]}-01-01'
ORDER BY release_date ASC
LIMIT 15;`;
    }
    if (beforeYear) {
        return `SET search_path TO movie_db;
SELECT title, release_date, runtime_minutes, age_rating
FROM movie
WHERE release_date < '${beforeYear[1]}-01-01'
ORDER BY release_date DESC
LIMIT 15;`;
    }

    /* 5 ── Budget over / greater than */
    const budgetMatch = t.match(/budget\s+(?:greater\s+than|over|above)\s+([\d.]+)\s*(?:cr(?:ore)?)?/i);
    if (budgetMatch) {
        const crore = parseFloat(budgetMatch[1]) * 10_000_000;
        return `SET search_path TO movie_db;
SELECT m.title, m.budget, b.total_collection,
       ROUND((b.total_collection - m.budget)::numeric / m.budget * 100, 1) AS roi_pct
FROM movie m
JOIN box_office b ON m.movie_id = b.movie_id
WHERE m.budget > ${crore}
ORDER BY m.budget DESC;`;
    }

    /* 6 ── Censor / certificate / cuts */
    if (is(t, /censor/, /certificate/, /cuts\s+ordered/, /cbfc/)) {
        return `SET search_path TO movie_db;
SELECT m.title, c.certificate_type, c.cuts_ordered,
       c.issue_date, cb.authority_name
FROM movie m
JOIN censor_certificate c ON m.movie_id = c.movie_id
JOIN censor_board cb ON c.censor_id = cb.censor_id
ORDER BY c.cuts_ordered DESC
LIMIT 10;`;
    }

    /* 7 ── Reviews / ratings */
    if (is(t, /review/, /rating/, /sentiment/, /positive/, /negative/)) {
        const entity = extractEntity(t, /review/, /rating/, /sentiment/, /positive/, /negative/, /show\b/, /get\b/, /of\b/);
        if (entity.length > 1) {
            return `SET search_path TO movie_db;
SELECT m.title, r.rating, r.sentiment, r.review_type, r.published_on
FROM movie m
JOIN review r ON m.movie_id = r.movie_id
WHERE m.title ILIKE '%${entity}%'
ORDER BY r.rating DESC;`;
        }
        return `SET search_path TO movie_db;
SELECT m.title,
       ROUND(AVG(r.rating)::numeric, 1) AS avg_rating,
       COUNT(r.published_on) AS total_reviews
FROM movie m
JOIN review r ON m.movie_id = r.movie_id
GROUP BY m.title
ORDER BY avg_rating DESC
LIMIT 10;`;
    }

    /* 8 ── Directors */
    if (is(t, /director/, /directed\s+by/, /who\s+directed/)) {
        const entity = extractEntity(t, /director/, /directed\s+by/, /who\s+directed/, /show\b/, /list\b/);
        if (entity.length > 1) {
            return `SET search_path TO movie_db;
SELECT m.title, p.full_name AS director, m.release_date
FROM movie m
JOIN cast_crew cc ON m.movie_id = cc.movie_id
JOIN person p ON cc.person_id = p.person_id
JOIN role r ON cc.role_id = r.role_id
WHERE r.role_name = 'Director'
  AND (p.full_name ILIKE '%${entity}%' OR m.title ILIKE '%${entity}%')
ORDER BY m.release_date DESC;`;
        }
        return `SET search_path TO movie_db;
SELECT p.full_name AS director, COUNT(m.movie_id) AS movies_directed
FROM person p
JOIN cast_crew cc ON p.person_id = cc.person_id
JOIN movie m ON cc.movie_id = m.movie_id
JOIN role r ON cc.role_id = r.role_id
WHERE r.role_name = 'Director'
GROUP BY p.full_name
ORDER BY movies_directed DESC
LIMIT 10;`;
    }

    /* 9 ── Cast / actors of a specific movie */
    if (is(t, /cast\b/, /actor/, /starring/, /who.*in\b/)) {
        const entity = extractEntity(t, /cast\b/, /actor/, /starring/, /who.*in\b/, /show\b/, /list\b/, /find\b/);
        if (entity.length > 1) {
            return `SET search_path TO movie_db;
SELECT p.full_name, r.role_name
FROM person p
JOIN cast_crew cc ON p.person_id = cc.person_id
JOIN role r ON cc.role_id = r.role_id
JOIN movie m ON cc.movie_id = m.movie_id
WHERE m.title ILIKE '%${entity}%'
ORDER BY r.role_name;`;
        }
    }

    /* 10 ── Theatre / show schedule */
    if (is(t, /theatre/, /theater/, /show\s+schedule/, /screening/, /screen/)) {
        return `SET search_path TO movie_db;
SELECT m.title, t.name AS theatre_name, t.city, ss.show_datetime,
       ss.screen_format, ss.seats_sold
FROM show_schedule ss
JOIN movie m ON ss.movie_id = m.movie_id
JOIN theatre t ON ss.theatre_id = t.theatre_id
ORDER BY ss.show_datetime DESC
LIMIT 15;`;
    }

    /* 11 ── Contracts / salary */
    if (is(t, /contract/, /salary/, /payment/, /fee\b/)) {
        return `SET search_path TO movie_db;
SELECT p.full_name, c.contract_type, c.remuneration,
       ph.name AS production_house
FROM contract c
JOIN person p ON c.person_id = p.person_id
JOIN production_house ph ON c.production_id = ph.production_id
ORDER BY c.remuneration DESC
LIMIT 10;`;
    }

    /* 12 ── Awards / nominations */
    if (is(t, /award/, /nominat/, /won\b/, /winner/)) {
        const entity = extractEntity(t, /award/, /nominat/, /won\b/, /winner/, /show\b/, /list\b/, /get\b/);
        if (entity.length > 1) {
            return `SET search_path TO movie_db;
SELECT m.title, a.award_name, ac.category_name, an.ceremony_year, an.result
FROM award_nomination an
JOIN movie m ON an.movie_id = m.movie_id
JOIN award a ON an.award_id = a.award_id
JOIN award_category ac ON an.category_id = ac.category_id
WHERE m.title ILIKE '%${entity}%'
   OR a.award_name ILIKE '%${entity}%'
ORDER BY an.ceremony_year DESC;`;
        }
        return `SET search_path TO movie_db;
SELECT a.award_name, ac.category_name, an.ceremony_year,
       m.title AS movie_title, an.result
FROM award_nomination an
JOIN movie m ON an.movie_id = m.movie_id
JOIN award a ON an.award_id = a.award_id
JOIN award_category ac ON an.category_id = ac.category_id
WHERE an.result = 'Won'
ORDER BY an.ceremony_year DESC
LIMIT 10;`;
    }

    /* 13 ── Language filter */
    const langMatch = t.match(/\b(hindi|english|tamil|telugu|kannada|malayalam|punjabi|bengali)\b/i);
    if (langMatch) {
        return `SET search_path TO movie_db;
SELECT title, release_date, runtime_minutes, age_rating
FROM movie
WHERE title ILIKE '%${langMatch[1]}%'
ORDER BY release_date DESC
LIMIT 15;`;
    }

    /* 14 ── General name lookup (movie or person) */
    const genericEntity = extractEntity(t,
        /show\b/, /list\b/, /get\b/, /find\b/, /search\b/, /query\b/, /run\b/, /tell\b/, /give\b/
    );
    if (genericEntity.length > 2) {
        return `SET search_path TO movie_db;
SELECT 'movie'  AS entity_type, title       AS name, release_date::text AS detail
FROM movie  WHERE title     ILIKE '%${genericEntity}%'
UNION ALL
SELECT 'person' AS entity_type, full_name   AS name, birth_date::text  AS detail
FROM person WHERE full_name ILIKE '%${genericEntity}%'
LIMIT 12;`;
    }

    /* 15 ── Default: all movies */
    return `SET search_path TO movie_db;
SELECT title, release_date, runtime_minutes, budget
FROM movie
ORDER BY release_date DESC
LIMIT 10;`;
};

/* ── Query explanation ── */
const explainSqlQuery = (sql) => {
    const c = sql.toLowerCase();
    const tables = [];
    ['movie','box_office','person','cast_crew','review','censor_certificate',
     'contract','song','album','theatre','show_schedule','award_nomination','song_nomination']
        .forEach(t => { if (c.includes(t)) tables.push(`'${t}'`); });

    let text = `Targets the 'movie_db' schema.`;
    if (tables.length) text += ` Queries: ${tables.join(', ')}.`;
    if (c.includes('join'))     text += ` Uses PK→FK JOINs to correlate related rows across tables.`;
    if (c.includes('group by')) text += ` Aggregates rows with GROUP BY to compute summary statistics.`;
    if (c.includes('order by')) text += ` Sorts the result set for ranked output.`;
    if (c.includes('ilike'))    text += ` ILIKE performs case-insensitive pattern matching on text columns.`;
    if (c.includes('union'))    text += ` UNION ALL merges result sets from multiple SELECT statements.`;
    return text;
};

/* ── Optimization hints ── */
const generateOptimizationSuggestions = (sql) => {
    const c = sql.toLowerCase();
    const hints = [];
    if (c.includes('join'))     hints.push('Add B-Tree indexes on JOIN columns (e.g. movie_id, person_id) to enable hash joins instead of nested loops.');
    if (c.includes('ilike'))    hints.push('ILIKE pattern matches can be accelerated with a pg_trgm GIN index: CREATE INDEX ON movie USING gin(title gin_trgm_ops);');
    if (c.includes('order by') && c.includes('limit')) hints.push('An index on the ORDER BY column lets PostgreSQL avoid a full sort before applying LIMIT.');
    if (!hints.length)          hints.push('Run ANALYZE periodically so the query planner has up-to-date statistics for cost estimation.');
    return hints;
};

/* ── Danger detection ── */
const detectDangerousSQL = (sql) => {
    const c = sql.toUpperCase();
    const alerts = [];
    if (c.includes('DELETE') && !c.includes('WHERE')) alerts.push('DELETE without WHERE — this would erase every row in the table!');
    if (c.includes('UPDATE') && !c.includes('WHERE')) alerts.push('UPDATE without WHERE — this would overwrite every row!');
    if (c.includes('DROP TABLE'))  alerts.push('DROP TABLE detected — this permanently destroys the table and its data.');
    if (c.includes('TRUNCATE'))    alerts.push('TRUNCATE detected — all rows will be removed instantly.');
    return alerts;
};

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AICopilot({ onExecuteSql, setSqlText, onSwitchToPlayground, onClose }) {
    const [messages, setMessages] = useState([{
        sender: 'ai',
        text: 'Hello! I\'m your CineFlow Database Copilot.\n\nAsk me anything about movies, songs, box office, cast, directors, awards, theatre schedules, contracts, or reviews — I\'ll generate the SQL and explain it.',
        type: 'text'
    }]);
    const [input, setInput]           = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isThinking, setIsThinking]  = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isThinking) return;

        setMessages(prev => [...prev, { sender: 'user', text, type: 'text' }]);
        setInput('');
        setIsThinking(true);

        setTimeout(() => {
            const sql         = parseNaturalLanguageToSql(text);
            const explanation = explainSqlQuery(sql);
            const suggestions = generateOptimizationSuggestions(sql);
            const alerts      = detectDangerousSQL(sql);

            setIsThinking(false);
            setMessages(prev => [...prev, {
                sender: 'ai', type: 'code',
                sql, explanation, suggestions, alerts
            }]);
        }, 400);
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    const handleRunQuery = (sql) => {
        setSqlText(sql);
        onSwitchToPlayground();
        setTimeout(() => onExecuteSql(), 120);
    };

    const examples = [
        'Songs of Raazi',
        'Highest grossing movies',
        'Who directed Dangal?',
        'Cast of Pathaan',
        'Movies released after 2020',
        'Censor cuts ordered',
        'Show awards won',
        'Reviews of Jawan',
    ];

    return (
        <div className="flex flex-col h-full bg-bgCard border-l border-borderDark text-xs select-none">
            {/* Header */}
            <div className="p-4 border-b border-borderDark flex items-center justify-between bg-bgSecondary">
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-goldPrimary" />
                    <span className="font-serif text-sm font-semibold text-textPrimary tracking-wide uppercase">SQL Copilot</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-full bg-goldPrimary/10 text-goldPrimary text-[9px] font-mono border border-goldPrimary/20 hidden sm:inline-block">
                        ONLINE
                    </span>
                    <button 
                        onClick={onClose} 
                        className="lg:hidden p-1 -mr-1 text-textSecondary hover:text-textPrimary bg-bgDarkest border border-borderDark rounded"
                        title="Close Copilot"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex flex-col max-w-[90%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto'}`}
                    >
                        <div className={`p-3 rounded-lg leading-relaxed ${
                            msg.sender === 'user'
                                ? 'bg-goldPrimary text-bgDarkest font-medium rounded-br-none'
                                : 'bg-bgSecondary border border-borderDark text-textSecondary rounded-bl-none'
                        }`}>
                            {msg.type === 'code' ? (
                                <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-goldPrimary uppercase tracking-wider block">Generated Query</span>

                                    <pre className="font-mono bg-bgDarkest p-2.5 rounded text-[10px] overflow-x-auto text-textPrimary border border-borderDark leading-relaxed whitespace-pre">
                                        {msg.sql}
                                    </pre>

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            className="px-2 py-1 rounded bg-bgCard hover:bg-white/[0.04] border border-borderDark text-[10px] text-textPrimary flex items-center gap-1 font-mono uppercase"
                                            onClick={() => copyToClipboard(msg.sql, idx)}
                                        >
                                            {copiedIndex === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-goldPrimary" />}
                                            {copiedIndex === idx ? 'Copied' : 'Copy'}
                                        </button>
                                        <button
                                            className="px-2 py-1 rounded bg-goldPrimary/10 hover:bg-goldPrimary/20 border border-goldPrimary/20 text-[10px] text-goldPrimary flex items-center gap-1 font-mono uppercase"
                                            onClick={() => handleRunQuery(msg.sql)}
                                        >
                                            <Play className="w-3 h-3" /> Run
                                        </button>
                                    </div>

                                    {msg.alerts?.length > 0 && (
                                        <div className="p-2 rounded bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] flex gap-1.5 items-start">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5" />
                                            <span className="font-mono">{msg.alerts[0]}</span>
                                        </div>
                                    )}

                                    {msg.explanation && (
                                        <div className="border-t border-borderDark/50 pt-2.5 mt-1">
                                            <span className="text-[9px] font-bold text-textPrimary uppercase tracking-widest block mb-1">Query Plan</span>
                                            <p className="text-[11px] leading-relaxed text-textSecondary font-sans">{msg.explanation}</p>
                                        </div>
                                    )}

                                    {msg.suggestions?.length > 0 && (
                                        <div className="border-t border-borderDark/50 pt-2.5 mt-1">
                                            <span className="text-[9px] font-bold text-textPrimary uppercase tracking-widest block mb-1">Index Tip</span>
                                            <p className="text-[11px] leading-relaxed text-textSecondary font-sans italic">💡 {msg.suggestions[0]}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap font-sans text-[11px]">{msg.text}</p>
                            )}
                        </div>
                        <span className="text-[8px] text-textMuted mt-1 uppercase font-mono tracking-wider opacity-50">
                            {msg.sender === 'user' ? 'You' : 'Copilot'}
                        </span>
                    </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                    <div className="flex flex-col max-w-[90%] mr-auto">
                        <div className="p-3 rounded-lg bg-bgSecondary border border-borderDark rounded-bl-none">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-goldPrimary rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                                <span className="w-1.5 h-1.5 bg-goldPrimary rounded-full animate-bounce" style={{animationDelay:'120ms'}} />
                                <span className="w-1.5 h-1.5 bg-goldPrimary rounded-full animate-bounce" style={{animationDelay:'240ms'}} />
                                <span className="text-[10px] text-textMuted ml-1 font-mono">Generating SQL…</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Example prompts — only on fresh chat */}
            {messages.length === 1 && (
                <div className="px-4 pb-2">
                    <span className="text-[9px] font-bold text-textSecondary uppercase tracking-wider block mb-2">Try asking:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                        {examples.map((ex, i) => (
                            <button
                                key={i}
                                className="p-2 text-left bg-bgSecondary border border-borderDark rounded text-[10px] text-textSecondary hover:border-goldPrimary hover:text-textPrimary transition-all duration-200"
                                onClick={() => setInput(ex)}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-borderDark bg-bgSecondary flex gap-2">
                <input
                    type="text"
                    placeholder="e.g. Songs of Raazi, cast of Pathaan…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    className="flex-1 bg-bgDarkest border border-borderDark rounded px-3 py-2 text-xs text-textPrimary outline-none focus:border-goldPrimary placeholder-textSecondary/40 font-sans"
                />
                <button
                    onClick={handleSend}
                    disabled={isThinking}
                    className="px-3 py-2 bg-goldPrimary hover:bg-goldPrimary/90 disabled:opacity-40 text-bgDarkest rounded flex items-center justify-center transition-all"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
