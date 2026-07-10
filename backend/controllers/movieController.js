const movieModel = require("../models/movieModel");

const getMovies = async (req, res) => {
  try {
    const movies = await movieModel.getMoviesWithProduction();
    res.json(movies);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getQueryFileResult = async (req, res) => {
  try {
    const result = await movieModel.runSqlFromFile();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const runAdHocQuery = async (req, res) => {
  const { sql } = req.body || {};

  if (typeof sql !== "string" || !sql.trim()) {
    return res.status(400).json({
      error: "Request body must include a non-empty 'sql' string.",
    });
  }

  // Prevent destructive queries
  const forbiddenRegex = /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|UPDATE|INSERT|REPLACE|GRANT|REVOKE)\b/i;
  if (forbiddenRegex.test(sql)) {
    return res.status(403).json({
      error: "Destructive operations are not allowed. Only read queries are permitted.",
    });
  }

  try {
    const result = await movieModel.runSqlFromText(sql);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDatabaseSchema = async (req, res) => {
  try {
    const schema = await movieModel.getDatabaseSchemaMetadata();
    res.json(schema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMovies, getQueryFileResult, runAdHocQuery, getDatabaseSchema };

