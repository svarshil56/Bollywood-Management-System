import { useEffect, useRef, useState, useMemo } from 'react';
import { executeSqlQuery } from '../services/movieService';
import './CommandPalette.css';

/**
 * ==========================================
 * CINEFLOW COMPONENT: CommandPalette.jsx
 * ==========================================
 * 🎯 INTERVIEW TALKING POINTS:
 * - Implements a fully accessible Command Palette (Ctrl+K style) featuring keyboard-only navigation.
 * - Manages active selections using an integer index matching lists, catching ArrowUp, ArrowDown, and Enter.
 * - Pre-loads database entries from SQL catalogs on modal mount, caching records to enable instant filtering.
 * - Handles focus resets using React Refs, ensuring inputs are targeted on toggle.
 * 
 * 🔧 TECHNICAL BREAKDOWN:
 * - Uses keydown event listeners.
 * - Combines static navigation commands with dynamic database indexes (movies & people).
 * ==========================================
 */

export default function CommandPalette({ isOpen, onClose, setActiveTab, setSqlText, onRunQuery }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [databaseItems, setDatabaseItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef(null);

    // Preload database index tags on palette trigger
    useEffect(() => {
        if (!isOpen) return;
        
        async function preloadSearchData() {
            try {
                setLoading(true);
                const [moviesRes, peopleRes] = await Promise.all([
                    executeSqlQuery("SET search_path TO movie_db; SELECT movie_id, title FROM movie LIMIT 60;"),
                    executeSqlQuery("SET search_path TO movie_db; SELECT person_id, full_name FROM person LIMIT 60;")
                ]);

                const formattedMovies = (moviesRes.rows || []).map(m => ({
                    id: `movie-${m.movie_id}`,
                    name: m.title,
                    type: 'movie',
                    icon: '🎬',
                    desc: 'Auto-run search query for this movie',
                    sql: `SET search_path TO movie_db;\n\nSELECT * FROM movie WHERE movie_id = ${m.movie_id};`
                }));

                const formattedPeople = (peopleRes.rows || []).map(p => ({
                    id: `person-${p.person_id}`,
                    name: p.full_name,
                    type: 'person',
                    icon: '👤',
                    desc: 'Auto-run search query for this cast/crew member',
                    sql: `SET search_path TO movie_db;\n\nSELECT * FROM person WHERE person_id = ${p.person_id};`
                }));

                setDatabaseItems([...formattedMovies, ...formattedPeople]);
            } catch (err) {
                console.error("Failed to preload catalog indexes into search palette", err);
            } finally {
                setLoading(false);
            }
        }

        preloadSearchData();
        setHighlightedIndex(0);
        setSearchQuery('');
        
        // Auto focus search input on mount
        setTimeout(() => {
            inputRef.current?.focus();
        }, 60);

    }, [isOpen]);

    // Define option lists based on search context
    const navItems = useMemo(() => [
        { id: 'nav-playground', name: 'Open SQL Playground', icon: '💻', desc: 'Execute queries, edit commands, and profile performance', type: 'tab', actionVal: 'playground' },
        { id: 'nav-battle', name: 'SQL Battle Mode', icon: '🏎️', desc: 'Compare latency speeds of two queries in a head-to-head race', type: 'tab', actionVal: 'battle' },
        { id: 'nav-schema', name: 'Explore Database Schema', icon: '📂', desc: 'Introspect indexes, constraint columns, and foreign keys', type: 'tab', actionVal: 'schema' },
        { id: 'nav-analytics', name: 'View Insights Dashboard', icon: '📊', desc: 'Aggregated cumulative financial charts and score distributions', type: 'tab', actionVal: 'analytics' }
    ], []);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return databaseItems.filter(item => 
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5);
    }, [searchQuery, databaseItems]);

    const currentOptions = useMemo(() => {
        return searchQuery.trim() === '' ? navItems : searchResults;
    }, [searchQuery, navItems, searchResults]);

    // Handle selection execution
    const handleAction = (item) => {
        if (!item) return;

        if (item.type === 'tab') {
            setActiveTab(item.actionVal);
        } else {
            setSqlText(item.sql);
            setActiveTab('playground');
            setTimeout(() => {
                onRunQuery();
            }, 100);
        }
        onClose();
        setSearchQuery('');
    };

    // Keyboard bindings for Arrow navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeys = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % Math.max(currentOptions.length, 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + currentOptions.length) % Math.max(currentOptions.length, 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentOptions[highlightedIndex]) {
                    handleAction(currentOptions[highlightedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, highlightedIndex, currentOptions, onClose]);

    // Reset selection index when query changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="palette-backdrop" onClick={onClose}>
            <div className="palette-modal animate-fade-in" onClick={e => e.stopPropagation()}>
                
                {/* Search Bar Input */}
                <div className="palette-search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search workspace navigation or catalog records..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <kbd className="close-kbd">ESC</kbd>
                </div>

                {/* Option list container */}
                <div className="palette-results">
                    {searchQuery === '' ? (
                        <>
                            <div className="palette-section-label">Workspace Navigation</div>
                            {navItems.map((item, idx) => (
                                <button 
                                    key={item.id} 
                                    className={`palette-item ${highlightedIndex === idx ? 'highlighted' : ''}`}
                                    onClick={() => handleAction(item)}
                                >
                                    <span className="item-icon">{item.icon}</span>
                                    <div className="item-details">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-desc">{item.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="palette-section-label">
                                Schema Search Results ({loading ? 'Loading...' : searchResults.length})
                            </div>
                            {searchResults.map((item, idx) => (
                                <button 
                                    key={item.id} 
                                    className={`palette-item ${highlightedIndex === idx ? 'highlighted' : ''}`}
                                    onClick={() => handleAction(item)}
                                >
                                    <span className="item-icon">{item.icon}</span>
                                    <div className="item-details">
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-desc">{item.desc}</div>
                                    </div>
                                </button>
                            ))}
                            {searchResults.length === 0 && !loading && (
                                <div className="no-palette-results font-mono">No matching records found.</div>
                            )}
                        </>
                    )}
                </div>

                <div className="palette-footer font-mono">
                    <span>↑↓ to navigate</span>
                    <span>⏎ to execute</span>
                    <span>esc to close</span>
                </div>
            </div>
        </div>
    );
}
