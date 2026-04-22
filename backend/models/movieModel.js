const pool = require("../db");
const fs = require("fs/promises");
const path = require("path");

const SQL_FILE_PATH = path.resolve(__dirname, "../../DATA/user_query.sql");

const removeLeadingComments = (queryText) =>
  queryText.replace(/^(\s*(--.*(?:\r?\n|$)|\/\*[\s\S]*?\*\/))*/, "");

const normalizeSqlInput = (queryText) => {
  let sql = removeLeadingComments(queryText).trim();

  // Allow one optional, controlled search_path statement at the top of the file.
  sql = sql.replace(/^set\s+search_path\s+to\s+movie_db\s*;\s*/i, "");

  return sql.trim();
};

const isReadOnlyQuery = (queryText) => {
  const normalized = normalizeSqlInput(queryText);

  return /^(select|with)\b/i.test(normalized);
};

const executeReadOnlyQuery = async (queryToRun) => {
  const client = await pool.connect();

  let result;
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL search_path TO movie_db");
    result = await client.query(queryToRun);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return result;
};

const getMoviesWithProduction = async () => {
  const result = await pool.query(`
    SELECT m.title, m.release_date, p.name AS production_house
    FROM movie_db.movie m
    JOIN movie_db.production_house p
    ON m.production_id = p.production_id
  `);

  return result.rows;
};

const runSqlFromFile = async () => {
  const sqlText = await fs.readFile(SQL_FILE_PATH, "utf8");

  if (!sqlText.trim()) {
    throw new Error(
      "SQL file is empty. Please add a SELECT query in DATA/user_query.sql.",
    );
  }

  if (!isReadOnlyQuery(sqlText)) {
    throw new Error(
      "Only SELECT/WITH queries are allowed in DATA/user_query.sql (optional: SET search_path TO movie_db; at top).",
    );
  }

  const queryToRun = normalizeSqlInput(sqlText);
  const result = await executeReadOnlyQuery(queryToRun);

  return {
    source: "DATA/user_query.sql",
    rowCount: result.rowCount,
    columns: result.fields.map((field) => field.name),
    rows: result.rows,
  };
};

const runSqlFromText = async (sqlText) => {
  if (!sqlText.trim()) {
    throw new Error(
      "SQL text is empty. Write a SELECT/WITH query and try again.",
    );
  }

  if (!isReadOnlyQuery(sqlText)) {
    throw new Error(
      "Only SELECT/WITH queries are allowed (optional: SET search_path TO movie_db; at top).",
    );
  }

  const queryToRun = normalizeSqlInput(sqlText);
  const result = await executeReadOnlyQuery(queryToRun);

  return {
    source: "frontend SQL editor",
    rowCount: result.rowCount,
    columns: result.fields.map((field) => field.name),
    rows: result.rows,
  };
};

module.exports = { getMoviesWithProduction, runSqlFromFile, runSqlFromText };
