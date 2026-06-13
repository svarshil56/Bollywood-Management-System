const express = require("express");
const router = express.Router();
const {
  getMovies,
  getQueryFileResult,
  runAdHocQuery,
  getDatabaseSchema,
} = require("../controllers/movieController");

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    message: "Bollywood Studio System API is active.",
    endpoints: ["GET /movies", "GET /query-file", "POST /query", "GET /schema"]
  });
});

router.get("/movies", getMovies);
router.get("/query-file", getQueryFileResult);
router.post("/query", runAdHocQuery);
router.get("/schema", getDatabaseSchema);


module.exports = router;

