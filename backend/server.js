require("dotenv").config();
const express = require("express");
const cors = require("cors");
const movieRoutes = require("./routes/movieRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/", movieRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

