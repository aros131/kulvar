const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { Sequelize } = require("sequelize");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5003;


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "database", "database.sqlite"),
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected...");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

// Test Route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Import and Use Routes
const authRoutes = require("./routes/auth"); // Authentication routes
app.use("/auth", authRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app; // For testing or importing in other files
const userRoutes = require('./routes/userRoutes');
const coachRoutes = require('./routes/coachRoutes');

app.use('/auth', authRoutes); // Authentication routes
app.use('/users', userRoutes); // User-specific routes
app.use('/coaches', coachRoutes); // Coach-specific routes

// Default route
app.get('/', (req, res) => res.send('Server is running!'));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));