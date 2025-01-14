const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database', 'database.sqlite'),
});

sequelize.authenticate().then(() => {
  console.log('Database connected...');
}).catch((err) => {
  console.error('Error connecting to database:', err);
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

const coachRoutes = require('./routes/coachRoutes');
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
app.use('/coach', coachRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
