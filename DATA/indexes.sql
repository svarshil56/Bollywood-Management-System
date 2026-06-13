-- ====================================================================
-- BOLLYWOOD MANAGEMENT SYSTEM (BMS) - INDEXING & PERFORMANCE TUNING
-- ====================================================================
-- This script contains the indexing strategy designed to optimize the 
-- complex multi-table joins, aggregations, and window functions used 
-- in the Bollywood Studio System dashboard.
--
-- Why manually index?
-- 1. PostgreSQL automatically creates indexes ONLY for Primary Keys and Unique constraints.
-- 2. Foreign key columns are NOT indexed by default. Joining on unindexed columns 
--    forces the query planner to execute expensive Sequential Scans (Seq Scan), 
--    which scale O(N) with table size.
-- 3. B-Tree indexes reduce lookup time to O(log N), transforming joins into 
--    efficient Index Scans or Index Only Scans.
-- ====================================================================

SET search_path TO movie_db;

-- --------------------------------------------------------------------
-- 1. CAST & CREW INDEXES
-- Optimizes: Star Power & industrial Pedigree, Movie Cast Density
-- --------------------------------------------------------------------
-- Indexing individual columns of the composite primary key (movie_id, person_id, role_id)
-- is crucial. The PK index automatically covers lookups matching (movie_id) or (movie_id, person_id).
-- But queries searching by person_id alone (e.g., actor lookup) cannot use the PK index.
CREATE INDEX IF NOT EXISTS idx_cast_crew_person_id 
ON CAST_CREW(person_id);

CREATE INDEX IF NOT EXISTS idx_cast_crew_role_id 
ON CAST_CREW(role_id);


-- --------------------------------------------------------------------
-- 2. MUSIC & STREAMING INDEXES
-- Optimizes: Digital Resonance (Movie -> Album -> Song -> Viewership)
-- --------------------------------------------------------------------
-- Speeds up joining ALBUM with MOVIE on movie_id.
CREATE INDEX IF NOT EXISTS idx_album_movie_id 
ON ALBUM(movie_id);

-- Speeds up joining SONG with ALBUM on album_id.
CREATE INDEX IF NOT EXISTS idx_song_album_id 
ON SONG(album_id);


-- --------------------------------------------------------------------
-- 3. REVENUE & ANALYTICS INDEXES
-- Optimizes: Cumulative Box Office, Financial Performance
-- --------------------------------------------------------------------
-- Speeds up joining DAY_ENTRY with BOX_OFFICE on box_office_id.
-- Since we partition by movie/box_office and sort by day_no, a composite index 
-- on (box_office_id, day_no) enables Index Only Scans for time-series progressions.
CREATE INDEX IF NOT EXISTS idx_day_entry_lookup 
ON DAY_ENTRY(box_office_id, day_no);

-- Speeds up joining VIEWERSHIP_ANALYTICS on movie_id.
CREATE INDEX IF NOT EXISTS idx_viewership_movie_id 
ON VIEWERSHIP_ANALYTICS(movie_id);


-- --------------------------------------------------------------------
-- 4. AWARD SYSTEM INDEXES
-- Optimizes: Industrial Pedigree, Award Wins by Star
-- --------------------------------------------------------------------
-- Award nomination joins are highly complex. Indexing these columns eliminates 
-- nested loop slowdowns.
CREATE INDEX IF NOT EXISTS idx_award_nom_movie_id 
ON AWARD_NOMINATION(movie_id);

CREATE INDEX IF NOT EXISTS idx_award_nom_person_id 
ON AWARD_NOMINATION(person_id);

CREATE INDEX IF NOT EXISTS idx_award_nom_award_id 
ON AWARD_NOMINATION(award_id);


-- --------------------------------------------------------------------
-- 5. CONTENT & CENSOR INDEXES
-- Optimizes: Censor Certificate vs Critics review score
-- --------------------------------------------------------------------
-- Speeds up sentiment correlations.
CREATE INDEX IF NOT EXISTS idx_review_movie_id 
ON REVIEW(movie_id);

CREATE INDEX IF NOT EXISTS idx_genre_movie_id 
ON GENRE(movie_id);


-- ====================================================================
-- HOW TO VERIFY INDEX EFFECTIVENESS (RESUME STUDY GUIDE)
-- ====================================================================
-- To analyze query plans in PostgreSQL, prepend your query with EXPLAIN ANALYZE:
--
-- EXPLAIN ANALYZE
-- SELECT m.title, b.total_collection, AVG(r.rating)
-- FROM movie m
-- JOIN box_office b ON m.movie_id = b.movie_id
-- JOIN review r ON m.movie_id = r.movie_id
-- GROUP BY m.title, b.total_collection;
--
-- Key Indicators in Output:
-- 1. "Seq Scan on review" -> Changed to "Index Scan using idx_review_movie_id" 
--    indicates the optimizer successfully skipped scanning the entire table.
-- 2. "Execution Time" -> Compare before (e.g., 42ms) and after (e.g., 1.8ms) 
--    indexing to measure real-world performance multipliers.
-- ====================================================================
