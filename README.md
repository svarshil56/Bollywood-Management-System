# 🎬 CineFlow DBMS — Bollywood Database Management System

A full-stack relational database management platform built on a **27-table normalized PostgreSQL schema** hosted on Neon Serverless. Designed as a 2nd-year DBMS project demonstrating real-world database concepts through an interactive visual dashboard.

---

## 🗂️ Project Structure

```
Bollywood Management System/
├── backend/                   # Node.js + Express API server
│   ├── controllers/           # Route handler logic
│   ├── models/movieModel.js   # SQL queries & schema introspection
│   ├── routes/movieRoutes.js  # API endpoint definitions
│   ├── db.js                  # PostgreSQL connection pool (Neon)
│   └── server.js              # Express entry point
├── frontend/                  # React + Vite dashboard
│   └── src/
│       ├── components/        # UI components
│       ├── services/          # API service layer
│       ├── styles.css         # Global design system
│       └── App.jsx            # Root app with tab routing
├── DATA/
│   ├── schema.sql             # Full 27-table DDL
│   ├── dbms_inserts.sql       # Seed data
│   └── indexes.sql            # B-Tree performance indexes
├── database/                  # Database utility scripts
│   ├── json_to_sql.js         # Script to generate SQL inserts from JSON
│   └── seed_neon.js           # One-time Neon cloud seeder script
```

---

## 🚀 Features

### 1. SQL Playground
- Monaco-style query editor with syntax-aware execution
- Supports `SET search_path TO movie_db;` at the top of any query
- Only `SELECT` / `WITH` statements allowed (read-only enforcement)
- **Execution Latency Profiler** — classifies queries as Ultra Fast / Normal / Slow
- Query history saved to `localStorage` (last 6 runs)

### 2. Schema Explorer (Full-Screen ERD)
- **3-panel layout**: table list sidebar · interactive ERD diagram · column inspector
- React Flow ERD with zoom, pan, and drag — nodes dim/highlight based on selection
- FK relationships shown as animated gold edges when a table is selected
- Column inspector shows each column's name, type, PK/FK key badges
- Clickable FK references navigate between related tables

### 3. AI SQL Copilot
- Natural language → SQL converter (client-side rule-based NLP)
- Supports 15+ intent patterns: songs, box office, cast, directors, reviews, awards, contracts, theatre schedules, censor certificates, and more
- Typed prompts like *"Songs of Razzi"* or *"Cast of Pathaan"* generate the correct JOIN query
- "Run" button loads the generated SQL into the Playground and executes it
- Animated thinking indicator while generating

### 4. Analytics Dashboard & Stats Grid
- Pre-built charts showing revenue trends, genre distribution, and viewership metrics.
- Built with Recharts — bar, area, and pie charts.
- **Dynamic Stats Grid**: Real-time KPI cards fetching actual database metrics (total revenue, active movies, etc.).
- **Premium Aesthetics**: Glassmorphism UI, gradient borders, and animated micro-interactions for a polished experience.

### 5. Command Palette (`Ctrl + K`)
- Fuzzy search across pages and preset queries
- Instantly loads and runs selected queries in the Playground

---

## 🗃️ Database Schema

27 tables across 4 domains:

```
[ PRODUCTION_HOUSE ] <--- [ CONTRACT ] ---> [ PERSON ]
        |                                       ^
        v                                       |
[ FRANCHISE ] ---> [ MOVIE ] <---------- [ CAST_CREW ]
                      |
          +-----------+-----------+
          |           |           |
     [BOX_OFFICE] [ALBUM]    [REVIEW]
                    |
                 [SONG]
          [CENSOR_CERTIFICATE]
          [DISTRIBUTION_RIGHT] --> [DISTRIBUTOR]
          [VIEWERSHIP_ANALYTICS]
          [SHOW_SCHEDULE] --> [THEATRE]
          [AWARD_NOMINATION] <--> [SONG_NOMINATION]
```

### Core Tables
| Table | Purpose |
|---|---|
| `movie` | Central hub — title, budget, release date, language |
| `person` | Actors, directors, crew — demographics and debut |
| `cast_crew` | Ternary bridge — person × role × movie |
| `production_house` | Studio metadata |
| `franchise` | Movie series groupings |

### Financial
| Table | Purpose |
|---|---|
| `box_office` | Total, opening week, OTT, overseas collections |
| `day_entry` | Day-by-day revenue log |
| `contract` | Salary, advance, profit share per person per movie |
| `show_schedule` | Theatre screening times, format, seats sold |

### Content & Certification
| Table | Purpose |
|---|---|
| `album` / `song` | Soundtracks, duration, label, language |
| `review` | Rating, sentiment, source |
| `censor_certificate` | Certificate type, cuts ordered, issuing authority |
| `award_nomination` / `song_nomination` | Ceremony year, result (Won/Nominated) |

---

## ⚡ Performance Tuning

Indexes defined in `DATA/indexes.sql`:

```sql
-- Foreign key join columns (PostgreSQL doesn't index FK by default)
CREATE INDEX idx_cast_crew_person_id   ON movie_db.cast_crew(person_id);
CREATE INDEX idx_album_movie_id        ON movie_db.album(movie_id);
CREATE INDEX idx_review_movie_id       ON movie_db.review(movie_id);

-- Composite index for day-by-day range lookups
CREATE INDEX idx_day_entry_composite   ON movie_db.day_entry(box_office_id, day_no);
```

**Latency thresholds** (Neon serverless):
- `≤ 80ms` → Ultra Fast (index hit)
- `81–300ms` → Normal (expected cloud overhead)
- `> 300ms` → Slow Query (likely sequential scan)

---

## 🛠️ Local Setup

### Prerequisites
- Node.js v18+
- A [Neon.tech](https://neon.tech) free database **or** local PostgreSQL v14+

### 1. Clone & Install
```bash
git clone https://github.com/svarshil56/bollywood-management-system.git
cd bollywood-management-system
npm install        # root (backend)
cd frontend
npm install
```

### 2. Configure Environment

Root `.env`:
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
PORT=3000
```

`frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Initialize Database

In your Neon SQL Editor (or psql), run in order:
```
DATA/schema.sql       → creates all 27 tables in movie_db schema
DATA/dbms_inserts.sql → inserts seed data
DATA/indexes.sql      → creates B-Tree performance indexes
```

Or use the seeder script:
```bash
node database/seed_neon.js
```

### 4. Run

```bash
# Terminal 1 — Backend (port 3000)
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173**

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 16 via Neon Serverless |
| Backend | Node.js · Express · node-postgres (pg) |
| Frontend | React 18 · Vite · Tailwind CSS |
| Charts | Recharts |
| ERD Diagram | @xyflow/react (React Flow) |
| Animations | Framer Motion |
| Icons | Lucide React |

---

## 📌 DBMS Concepts Demonstrated

- **Normalization** — Schema is in BCNF across all 27 tables
- **Foreign Keys** — Enforced referential integrity across all joins
- **Indexes** — B-Tree indexes on FK and filter columns
- **Transactions** — Read-only query isolation
- **Schema Introspection** — Live metadata read from `information_schema`
- **Aggregation** — `GROUP BY`, `HAVING`, window functions in preset queries
- **UNION / SUBQUERIES** — Used in analytics and copilot-generated SQL
