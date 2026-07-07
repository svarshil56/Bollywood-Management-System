-- =========================
-- SCHEMA SETUP
-- =========================
DROP SCHEMA IF EXISTS movie_db CASCADE;
CREATE SCHEMA IF NOT EXISTS movie_db;
SET search_path TO movie_db;

-- =========================
-- MASTER TABLES
-- =========================

CREATE TABLE PRODUCTION_HOUSE (
    production_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    founder VARCHAR(150),
    established_year SMALLINT,
    headquarter_city VARCHAR(100)
);

CREATE TABLE FRANCHISE (
    franchise_id SERIAL PRIMARY KEY,
    franchise_name VARCHAR(200) NOT NULL,
    cumulative_box_office NUMERIC(18,2),
    total_installments SMALLINT
);

CREATE TABLE ROLE (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE PERSON (
    person_id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    gender VARCHAR(30),
    nationality VARCHAR(100),
    debut_year SMALLINT,
    birth_date DATE,
    screen_time INTERVAL
);

CREATE TABLE MUSIC_LABEL (
    label_id SERIAL PRIMARY KEY,
    label_name VARCHAR(200) NOT NULL,
    parent_company VARCHAR(200)
);

CREATE TABLE AWARD (
    award_id SERIAL PRIMARY KEY,
    award_name VARCHAR(200) NOT NULL,
    awarding_body VARCHAR(200),
    prestige_tier SMALLINT CHECK (prestige_tier BETWEEN 1 AND 5)
);

CREATE TABLE AWARD_CATEGORY (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(200) NOT NULL
);

CREATE TABLE GUIDE_CATEGORY (
    guide_category_id SERIAL PRIMARY KEY,
    guide_category_name VARCHAR(150) NOT NULL
);

CREATE TABLE THEATRE (
    theatre_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    has_imax BOOLEAN DEFAULT FALSE,
    screen_count SMALLINT,
    seating_capacity INTEGER
);

CREATE TABLE CENSOR_BOARD (
    censor_id SERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL,
    authority_name VARCHAR(200) NOT NULL
);

CREATE TABLE DISTRIBUTOR (
    distributor_id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    distribution_type VARCHAR(80)
);

-- =========================
-- CORE TABLE
-- =========================

CREATE TABLE MOVIE (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    age_rating VARCHAR(20),
    runtime_minutes SMALLINT,
    release_date DATE,
    release_status VARCHAR(50),
    budget NUMERIC(18,2),
    production_id INTEGER REFERENCES PRODUCTION_HOUSE(production_id) ON DELETE SET NULL,
    franchise_id INTEGER REFERENCES FRANCHISE(franchise_id) ON DELETE SET NULL
);

-- =========================
-- RELATION TABLES
-- =========================

CREATE TABLE CAST_CREW (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES PERSON(person_id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES ROLE(role_id) ON DELETE RESTRICT,
    PRIMARY KEY (movie_id, person_id, role_id)
);

CREATE TABLE ALBUM (
    album_id SERIAL PRIMARY KEY,
    album_title VARCHAR(300) NOT NULL,
    release_date DATE,
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE SET NULL,
    label_id INTEGER REFERENCES MUSIC_LABEL(label_id) ON DELETE SET NULL
);

CREATE TABLE SONG (
    song_id SERIAL PRIMARY KEY,
    isrc_code CHAR(12) UNIQUE,
    title VARCHAR(300) NOT NULL,
    track_number SMALLINT,
    language VARCHAR(80),
    duration_seconds INTEGER,
    album_id INTEGER REFERENCES ALBUM(album_id) ON DELETE SET NULL
);

CREATE TABLE CONTRACT (
    contract_id INTEGER,
    person_id INTEGER REFERENCES PERSON(person_id) ON DELETE CASCADE,
    production_id INTEGER REFERENCES PRODUCTION_HOUSE(production_id) ON DELETE CASCADE,
    advance_paid NUMERIC(18,2),
    profit_share NUMERIC(5,2),
    remuneration NUMERIC(18,2),
    contract_type VARCHAR(80),
    status VARCHAR(50),
    PRIMARY KEY (contract_id, person_id, production_id)
);

CREATE TABLE LEGAL_DISPUTE (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    contract_id INTEGER,
    plaintiff VARCHAR(200),
    dispute_type VARCHAR(100),
    PRIMARY KEY (movie_id, contract_id)
);

CREATE TABLE REVIEW (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    published_on DATE,
    rating NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 10),
    review_type VARCHAR(50),
    sentiment VARCHAR(20),
    PRIMARY KEY (movie_id, published_on, review_type)
);

CREATE TABLE GENRE (
    genre_id SERIAL PRIMARY KEY,
    genre_name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    weight NUMERIC(5,2),
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE
);

-- =========================
-- NORMALIZED AWARD SYSTEM
-- =========================

CREATE TABLE AWARD_NOMINATION (
    award_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    person_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    ceremony_year SMALLINT NOT NULL,
    result VARCHAR(20)
        CHECK (result IN ('Won', 'Nominated', 'N/A')),

    PRIMARY KEY (award_id, category_id, person_id, movie_id, ceremony_year),

    FOREIGN KEY (award_id) REFERENCES AWARD(award_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES AWARD_CATEGORY(category_id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES PERSON(person_id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES MOVIE(movie_id) ON DELETE CASCADE
);

CREATE TABLE SONG_NOMINATION (
    award_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    person_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    ceremony_year SMALLINT NOT NULL,
    song_id INTEGER NOT NULL,

    PRIMARY KEY (award_id, category_id, person_id, movie_id, ceremony_year, song_id),

    FOREIGN KEY (award_id, category_id, person_id, movie_id, ceremony_year)
        REFERENCES AWARD_NOMINATION
        ON DELETE CASCADE,

    FOREIGN KEY (song_id) REFERENCES SONG(song_id) ON DELETE CASCADE
);

CREATE TABLE MOVIE_PARENTAL_GUIDE (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    guide_category_id INTEGER REFERENCES GUIDE_CATEGORY(guide_category_id) ON DELETE CASCADE,
    level VARCHAR(30),
    PRIMARY KEY (movie_id, guide_category_id)
);

-- =========================
-- BOX OFFICE
-- =========================

CREATE TABLE BOX_OFFICE (
    box_office_id SERIAL PRIMARY KEY,
    opening_day_collection NUMERIC(18,2),
    net_collection NUMERIC(18,2),
    gross_collection NUMERIC(18,2),
    total_collection NUMERIC(18,2),
    satellite_collection NUMERIC(18,2),
    ott_collection NUMERIC(18,2),
    overseas_collection NUMERIC(18,2),
    movie_id INTEGER UNIQUE REFERENCES MOVIE(movie_id) ON DELETE CASCADE
);

CREATE TABLE DAY_ENTRY (
    box_office_id INTEGER REFERENCES BOX_OFFICE(box_office_id) ON DELETE CASCADE,
    day_no SMALLINT,
    date DATE,
    collection NUMERIC(18,2),
    PRIMARY KEY (box_office_id, day_no)
);

-- =========================
-- SHOWS & DISTRIBUTION
-- =========================

CREATE TABLE SHOW_SCHEDULE (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    theatre_id INTEGER REFERENCES THEATRE(theatre_id) ON DELETE CASCADE,
    show_datetime TIMESTAMP,
    screen_no SMALLINT,
    seats_sold INTEGER,
    screen_format VARCHAR(50),
    PRIMARY KEY (movie_id, theatre_id, show_datetime, screen_no)
);

CREATE TABLE CENSOR_CERTIFICATE (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    censor_id INTEGER REFERENCES CENSOR_BOARD(censor_id) ON DELETE CASCADE,
    issue_date DATE,
    cuts_ordered SMALLINT DEFAULT 0,
    certificate_type VARCHAR(20),
    PRIMARY KEY (movie_id, censor_id)
);

CREATE TABLE DISTRIBUTION_RIGHT (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    distributor_id INTEGER REFERENCES DISTRIBUTOR(distributor_id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    territory VARCHAR(150),
    dead_status BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (movie_id, distributor_id, territory)
);

CREATE TABLE VIEWERSHIP_ANALYTICS (
    movie_id INTEGER REFERENCES MOVIE(movie_id) ON DELETE CASCADE,
    distributor_id INTEGER REFERENCES DISTRIBUTOR(distributor_id) ON DELETE CASCADE,
    recorded_date DATE,
    revenue_generator VARCHAR(100),
    view_count BIGINT,
    region VARCHAR(100),
    PRIMARY KEY (movie_id, distributor_id, recorded_date, region)
);