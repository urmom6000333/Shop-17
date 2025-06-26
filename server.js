require('dotenv').config(); // For loading STRIPE_SECRET_KEY from .env
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// JSON products file
const productsPath = path.join(__dirname, 'products.json');
function loadProducts() {
  if (!fs.existsSync(productsPath)) return [];
  return JSON.parse(fs.readFileSync(productsPath));
}
function saveProducts(products) {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
}

// Upload new product
app.post('/upload', upload.single('image'), (req, res) => {
  const { title, price, description } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`;
  const product = {
    id: Date.now(),
    title,
    price,
    description,
    imageUrl,
    images: [],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  };
  const products = loadProducts();
  products.push(product);
  saveProducts(products);
  res.json({ success: true, product });
});

// Add image to product
app.post('/product/:id/image', upload.single('image'), (req, res) => {
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const newImage = `/uploads/${req.file.filename}`;
  product.images.push(newImage);
  saveProducts(products);
  res.json({ success: true, images: product.images });
});

// Delete product image
app.post('/product/:id/image/delete', (req, res) => {
  const { imageUrl } = req.body;
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const imagePath = path.join(__dirname, 'public', imageUrl);
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  product.images = product.images.filter(img => img !== imageUrl);
  saveProducts(products);
  res.json({ success: true });
});

// Replace main image
app.post('/product/:id/image/replace', upload.single('image'), (req, res) => {
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const oldImagePath = path.join(__dirname, 'public', product.imageUrl);
  if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
  const newImage = `/uploads/${req.file.filename}`;
  product.imageUrl = newImage;
  saveProducts(products);
  res.json({ success: true, imageUrl: newImage });
});

// Edit product info
app.post('/product/:id/edit', (req, res) => {
  const { title, price, description } = req.body;
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  product.title = title;
  product.price = price;
  product.description = description;
  saveProducts(products);
  res.json({ success: true, product });
});

// Add/remove size
app.post('/product/:id/size', (req, res) => {
  const { action, size } = req.body;
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (action === 'add' && !product.sizes.includes(size)) {
    product.sizes.push(size);
  } else if (action === 'remove') {
    product.sizes = product.sizes.filter(s => s !== size);
  }
  saveProducts(products);
  res.json({ success: true, sizes: product.sizes });
});

// Get all products
app.get('/products', (req, res) => {
  const products = loadProducts();
  res.json(products);
});

// Get a single product
app.get('/product/:id', (req, res) => {
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Stripe Checkout: collect shipping address, charge $0 for shipping
app.post('/create-checkout-session', async (req, res) => {
  try {
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ error: 'No items in the cart.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      line_items: req.body.items,
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
