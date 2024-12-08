require('dotenv').config(); // To load environment variables
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // Parse incoming request bodies as JSON

// MongoDB connection
mongoose.connect('mongodb+srv://arenkaraseki:azxazx3@productreviewcluster.hfgko.mongodb.net/?retryWrites=true&w=majority', 
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  brand: String,
  image_url: String
});

const Product = mongoose.model('Product', productSchema);

// Routes

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find(); // Get all products
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new product
app.post('/api/products', async (req, res) => {
  const { name, description, price, brand, image_url } = req.body;

  const product = new Product({
    name,
    description,
    price,
    brand,
    image_url
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct); // Return the newly added product
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (update) a product by id
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a product by id
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
