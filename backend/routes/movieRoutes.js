const express = require("express");
const router = express.Router();
const {
  getMovies,
  getQueryFileResult,
  runAdHocQuery,
} = require("../controllers/movieController");

router.get("/movies", getMovies);
router.get("/query-file", getQueryFileResult);
router.post("/query", runAdHocQuery);

module.exports = router;
