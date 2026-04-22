require("dotenv").config();
const express = require("express");
const movieRoutes = require("./routes/movieRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", movieRoutes);

app.listen(PORT, () => {
  console.log(`Server running on address http://localhost:${PORT}`);
});
