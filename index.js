const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const coachRoutes = require("./routes/coach");
const programRoutes = require("./routes/program");
const cors = require("cors");
const app = express();
const PORT = 5003;

// Middleware
app.use(bodyParser.json());

// Routes
app.use("/auth", authRoutes);
app.use("/coach", coachRoutes); // Add the coach routes
app.use("/programs", programRoutes); // Attach program routes
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.use(cors()); // Enable CORS
