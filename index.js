const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { Sequelize } = require("sequelize");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database/database.sqlite",
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected...");
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

// Routes
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Import routes
const authRoutes = require("./routes/auth"); // Example route
app.use("/auth", authRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
