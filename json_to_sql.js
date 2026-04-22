const fs = require("fs");

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error("Usage: node json_to_sql.js <input.json> <output.sql>");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8");
const data = JSON.parse(raw);

const prestigeTierMap = {
  "A+": 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

function escapeSqlString(value) {
  return value.replace(/'/g, "''");
}

function toSqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "string") return `'${escapeSqlString(value)}'`;

  return `'${escapeSqlString(JSON.stringify(value))}'`;
}

function normalizeResult(result) {
  if (result === "Won" || result === "Nominated" || result === "N/A")
    return result;
  return "N/A";
}

function pushInsertBlock(lines, tableName, columns, rows) {
  if (!rows.length) return;

  lines.push(`-- Table: ${tableName}`);
  for (const row of rows) {
    const values = columns.map((col) => toSqlValue(row[col]));
    lines.push(
      `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});`,
    );
  }
  lines.push("");
}

function dedupeByKey(rows, keyFn) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = keyFn(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

const lines = [];
lines.push("-- Auto-generated from dbms.json");
lines.push("-- Generated at: " + new Date().toISOString());
lines.push("SET search_path TO movie_db;");
lines.push("");

const movies = Array.isArray(data.movies) ? data.movies : [];
const distributors = Array.isArray(data.distributors) ? data.distributors : [];
const distributionRights = Array.isArray(data.distribution_rights)
  ? data.distribution_rights
  : [];
const songs = Array.isArray(data.songs) ? data.songs : [];

const movieById = new Map(movies.map((m) => [m.movie_id, m]));
const distributorById = new Map(distributors.map((d) => [d.distributor_id, d]));

const rightsByMovie = new Map();
for (const right of distributionRights) {
  if (!rightsByMovie.has(right.movie_id)) rightsByMovie.set(right.movie_id, []);
  rightsByMovie.get(right.movie_id).push(right);
}

const rightsByMovieRegion = new Map();
for (const right of distributionRights) {
  const key = `${right.movie_id}::${String(right.territory || "").toLowerCase()}`;
  if (!rightsByMovieRegion.has(key)) {
    rightsByMovieRegion.set(key, right.distributor_id);
  }
}

const songsByMovie = new Map();
for (const s of songs) {
  if (!songsByMovie.has(s.movie_id)) songsByMovie.set(s.movie_id, []);
  songsByMovie.get(s.movie_id).push(s);
}

pushInsertBlock(
  lines,
  "role",
  ["role_id", "role_name"],
  (data.roles || []).map((r) => ({
    role_id: r.role_id,
    role_name: r.role_name,
  })),
);

pushInsertBlock(
  lines,
  "production_house",
  ["production_id", "name", "founder", "established_year", "headquarter_city"],
  (data.production_houses || []).map((r) => ({
    production_id: r.production_id,
    name: r.name,
    founder: r.founder,
    established_year: r.established_year,
    headquarter_city: r.headquarter_city,
  })),
);

pushInsertBlock(
  lines,
  "franchise",
  [
    "franchise_id",
    "franchise_name",
    "cumulative_box_office",
    "total_installments",
  ],
  (data.franchises || []).map((r) => ({
    franchise_id: r.franchise_id,
    franchise_name: r.franchise_name,
    cumulative_box_office: r.cumulative_box_office,
    total_installments: r.total_installments,
  })),
);

pushInsertBlock(
  lines,
  "person",
  [
    "person_id",
    "full_name",
    "gender",
    "nationality",
    "debut_year",
    "birth_date",
    "screen_time",
  ],
  (data.persons || []).map((r) => ({
    person_id: r.person_id,
    full_name: r.full_name,
    gender: r.gender,
    nationality: r.nationality,
    debut_year: r.debut_year,
    birth_date: r.birth_date,
    screen_time: Number.isFinite(r.experience) ? `${r.experience} years` : null,
  })),
);

pushInsertBlock(
  lines,
  "music_label",
  ["label_id", "label_name", "parent_company"],
  (data.music_labels || []).map((r) => ({
    label_id: r.label_id,
    label_name: r.label_name,
    parent_company: r.parent_company,
  })),
);

pushInsertBlock(
  lines,
  "award",
  ["award_id", "award_name", "awarding_body", "prestige_tier"],
  (data.awards || []).map((r) => ({
    award_id: r.award_id,
    award_name: r.award_name,
    awarding_body: r.awarding_body,
    prestige_tier: prestigeTierMap[r.prestige_tier] || 1,
  })),
);

pushInsertBlock(
  lines,
  "award_category",
  ["category_id", "category_name"],
  (data.award_categories || []).map((r) => ({
    category_id: r.category_id,
    category_name: r.category_name,
  })),
);

pushInsertBlock(
  lines,
  "guide_category",
  ["guide_category_id", "guide_category_name"],
  (data.guide_categories || []).map((r) => ({
    guide_category_id: r.guide_category_id,
    guide_category_name: r.guide_category_name,
  })),
);

pushInsertBlock(
  lines,
  "theatre",
  [
    "theatre_id",
    "name",
    "city",
    "state",
    "has_imax",
    "screen_count",
    "seating_capacity",
  ],
  (data.theatres || []).map((r) => ({
    theatre_id: r.theatre_id,
    name: r.name,
    city: r.city,
    state: r.state,
    has_imax: r.has_imax,
    screen_count: r.screen_count,
    seating_capacity: r.seating_capacity,
  })),
);

pushInsertBlock(
  lines,
  "censor_board",
  ["censor_id", "country", "authority_name"],
  (data.censor_boards || []).map((r) => ({
    censor_id: r.board_id,
    country: r.country,
    authority_name: r.authority_name,
  })),
);

pushInsertBlock(
  lines,
  "distributor",
  ["distributor_id", "company_name", "distribution_type"],
  distributors.map((r) => ({
    distributor_id: r.distributor_id,
    company_name: r.company_name,
    distribution_type: r.distribution_type,
  })),
);

pushInsertBlock(
  lines,
  "movie",
  [
    "movie_id",
    "title",
    "age_rating",
    "runtime_minutes",
    "release_date",
    "release_status",
    "budget",
    "production_id",
    "franchise_id",
  ],
  movies.map((r) => ({
    movie_id: r.movie_id,
    title: r.title,
    age_rating: r.age_rating,
    runtime_minutes: r.runtime_minutes,
    release_date: r.release_date,
    release_status: r.release_status,
    budget: r.budget,
    production_id: r.production_id,
    franchise_id: r.franchise_id,
  })),
);

pushInsertBlock(
  lines,
  "cast_crew",
  ["movie_id", "person_id", "role_id"],
  dedupeByKey(
    (data.cast_crews || []).map((r) => ({
      movie_id: r.movie_id,
      person_id: r.person_id,
      role_id: r.role_id,
    })),
    (r) => `${r.movie_id}-${r.person_id}-${r.role_id}`,
  ),
);

pushInsertBlock(
  lines,
  "album",
  ["album_id", "album_title", "release_date", "movie_id", "label_id"],
  (data.albums || []).map((r) => ({
    album_id: r.album_id,
    album_title: r.album_title,
    release_date: r.release_date,
    movie_id: r.movie_id,
    label_id: r.label_id,
  })),
);

pushInsertBlock(
  lines,
  "song",
  [
    "song_id",
    "isrc_code",
    "title",
    "track_number",
    "language",
    "duration_seconds",
    "album_id",
  ],
  (data.songs || []).map((r) => ({
    song_id: r.song_id,
    isrc_code: r.isrc_code,
    title: r.title,
    track_number: r.track_number,
    language: r.language,
    duration_seconds: r.duration_seconds,
    album_id: r.album_id,
  })),
);

pushInsertBlock(
  lines,
  "contract",
  [
    "contract_id",
    "person_id",
    "production_id",
    "advance_paid",
    "profit_share",
    "remuneration",
    "contract_type",
    "status",
  ],
  (data.contracts || [])
    .map((r) => {
      const movie = movieById.get(r.movie_id);
      return {
        contract_id: r.contract_id,
        person_id: r.person_id,
        production_id: movie ? movie.production_id : null,
        advance_paid: r.advance_paid,
        profit_share: r.profit_share,
        remuneration: r.remuneration,
        contract_type: r.contract_type,
        status: r.status,
      };
    })
    .filter((r) => r.production_id !== null && r.production_id !== undefined),
);

pushInsertBlock(
  lines,
  "legal_dispute",
  ["movie_id", "contract_id", "plaintiff", "dispute_type"],
  (data.legal_disputes || []).map((r) => ({
    movie_id: r.movie_id,
    contract_id: r.contract_id,
    plaintiff: r.plaintiff,
    dispute_type: r.dispute_type,
  })),
);

pushInsertBlock(
  lines,
  "review",
  ["movie_id", "published_on", "rating", "review_type", "sentiment"],
  dedupeByKey(
    (data.reviews || []).map((r) => ({
      movie_id: r.movie_id,
      published_on: r.published_on,
      rating: r.rating,
      review_type: r.review_type,
      sentiment: r.sentiment,
    })),
    (r) => `${r.movie_id}-${r.published_on}-${r.review_type}`,
  ),
);

const genreById = new Map((data.genres || []).map((g) => [g.genre_id, g]));
pushInsertBlock(
  lines,
  "genre",
  ["genre_id", "genre_name", "is_primary", "weight", "movie_id"],
  (data.movie_genres || []).map((r) => {
    const g = genreById.get(r.genre_id);
    return {
      genre_id: r.mg_id,
      genre_name: g ? g.genre_name : `Genre ${r.genre_id}`,
      is_primary: r.is_primary,
      weight: r.weight_pct,
      movie_id: r.movie_id,
    };
  }),
);

pushInsertBlock(
  lines,
  "award_nomination",
  [
    "award_id",
    "category_id",
    "person_id",
    "movie_id",
    "ceremony_year",
    "result",
  ],
  dedupeByKey(
    (data.award_nominations || []).map((r) => ({
      award_id: r.award_id,
      category_id: r.category_id,
      person_id: r.person_id,
      movie_id: r.movie_id,
      ceremony_year: r.ceremony_year,
      result: normalizeResult(r.result),
    })),
    (r) =>
      `${r.award_id}-${r.category_id}-${r.person_id}-${r.movie_id}-${r.ceremony_year}`,
  ),
);

const songNominations = dedupeByKey(
  (data.award_nominations || [])
    .filter((r) => Number(r.category_id) === 15)
    .flatMap((r) => {
      const movieSongs = songsByMovie.get(r.movie_id) || [];
      if (!movieSongs.length) return [];

      // Pick one representative song per song-category nomination.
      const song = movieSongs[0];
      return [
        {
          award_id: r.award_id,
          category_id: r.category_id,
          person_id: r.person_id,
          movie_id: r.movie_id,
          ceremony_year: r.ceremony_year,
          song_id: song.song_id,
        },
      ];
    }),
  (r) =>
    `${r.award_id}-${r.category_id}-${r.person_id}-${r.movie_id}-${r.ceremony_year}-${r.song_id}`,
);

pushInsertBlock(
  lines,
  "song_nomination",
  [
    "award_id",
    "category_id",
    "person_id",
    "movie_id",
    "ceremony_year",
    "song_id",
  ],
  songNominations,
);

pushInsertBlock(
  lines,
  "movie_parental_guide",
  ["movie_id", "guide_category_id", "level"],
  dedupeByKey(
    (data.movie_parental_guide || []).map((r) => ({
      movie_id: r.movie_id,
      guide_category_id: r.guide_category_id,
      level: r.level,
    })),
    (r) => `${r.movie_id}-${r.guide_category_id}`,
  ),
);

pushInsertBlock(
  lines,
  "box_office",
  [
    "box_office_id",
    "opening_day_collection",
    "net_collection",
    "gross_collection",
    "total_collection",
    "satellite_collection",
    "ott_collection",
    "overseas_collection",
    "movie_id",
  ],
  (data.box_offices || []).map((r) => ({
    box_office_id: r.box_office_id,
    opening_day_collection: r.opening_day_collection,
    net_collection: r.net_collection,
    gross_collection: r.gross_collection,
    total_collection: r.total_collection,
    satellite_collection: r.satellite_collection,
    ott_collection: r.ott_collection,
    overseas_collection: r.overseas_collection,
    movie_id: r.movie_id,
  })),
);

pushInsertBlock(
  lines,
  "day_entry",
  ["box_office_id", "day_no", "date", "collection"],
  dedupeByKey(
    (data.day_entries || []).map((r) => ({
      box_office_id: r.box_office_id,
      day_no: r.day_no,
      date: r.date,
      collection: r.collection,
    })),
    (r) => `${r.box_office_id}-${r.day_no}`,
  ),
);

pushInsertBlock(
  lines,
  "show_schedule",
  [
    "movie_id",
    "theatre_id",
    "show_datetime",
    "screen_no",
    "seats_sold",
    "screen_format",
  ],
  dedupeByKey(
    (data.show_schedules || []).map((r) => ({
      movie_id: r.movie_id,
      theatre_id: r.theatre_id,
      show_datetime: r.show_datetime,
      screen_no: r.screen_no,
      seats_sold: r.seats_sold,
      screen_format: r.screen_format,
    })),
    (r) => `${r.movie_id}-${r.theatre_id}-${r.show_datetime}-${r.screen_no}`,
  ),
);

pushInsertBlock(
  lines,
  "censor_certificate",
  ["movie_id", "censor_id", "issue_date", "cuts_ordered", "certificate_type"],
  dedupeByKey(
    (data.censor_certificates || []).map((r) => ({
      movie_id: r.movie_id,
      censor_id: r.board_id,
      issue_date: r.issue_date,
      cuts_ordered: r.cuts_ordered,
      certificate_type: r.certificate_type,
    })),
    (r) => `${r.movie_id}-${r.censor_id}`,
  ),
);

pushInsertBlock(
  lines,
  "distribution_right",
  [
    "movie_id",
    "distributor_id",
    "start_date",
    "end_date",
    "territory",
    "dead_status",
  ],
  dedupeByKey(
    distributionRights.map((r) => ({
      movie_id: r.movie_id,
      distributor_id: r.distributor_id,
      start_date: r.start_date,
      end_date: r.end_date,
      territory: r.territory,
      dead_status: distributorById.get(r.distributor_id)?.dead_status ?? false,
    })),
    (r) => `${r.movie_id}-${r.distributor_id}-${r.territory}`,
  ),
);

pushInsertBlock(
  lines,
  "viewership_analytics",
  [
    "movie_id",
    "distributor_id",
    "recorded_date",
    "revenue_generator",
    "view_count",
    "region",
  ],
  dedupeByKey(
    (data.viewership_analytics || [])
      .map((r) => {
        const byRegion = rightsByMovieRegion.get(
          `${r.movie_id}::${String(r.region || "").toLowerCase()}`,
        );
        const firstRight = rightsByMovie.get(r.movie_id)?.[0]?.distributor_id;
        const distributorId = byRegion || firstRight || null;

        return {
          movie_id: r.movie_id,
          distributor_id: distributorId,
          recorded_date: r.recorded_date,
          revenue_generator: r.ott_platform,
          view_count: r.view_count,
          region: r.region,
        };
      })
      .filter((r) => r.distributor_id !== null),
    (r) => `${r.movie_id}-${r.distributor_id}-${r.recorded_date}-${r.region}`,
  ),
);

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(`SQL file created: ${outputPath}`);
