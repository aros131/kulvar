require('dotenv').config(); // This loads the environment variables from the .env file
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },  // Added rating field
  image_url: { type: String, required: true },  // Added image URL field
  category: { type: String, required: true },  // Added category field
  brand: { type: String, required: true }  // Added brand field
});

const Product = mongoose.model('Product', productSchema);

// Routes
// GET all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();  // Fetch all products from MongoDB
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new product
app.post('/api/products', async (req, res) => {
  const { name, rating, image_url, category, brand } = req.body;

  const newProduct = new Product({
    name,
    rating,
    image_url,
    category,
    brand
  });

  try {
    await newProduct.save();  // Save the product to the database
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT (update) an existing product
app.put('/api/products/:id', async (req, res) => {
  const { name, rating, image_url, category, brand } = req.body;
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, rating, image_url, category, brand },
      { new: true }
    );
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// PUT (update) a product
app.put('/api/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } // returns the updated product
        );
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id); // Delete the product by ID
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
