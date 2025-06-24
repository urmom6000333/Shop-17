const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public folder
app.use(express.static('public'));
app.use(express.json());

// Configure multer to save uploads into public/uploads
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

const productsPath = path.join(__dirname, 'products.json');
function loadProducts() {
  if (!fs.existsSync(productsPath)) return [];
  return JSON.parse(fs.readFileSync(productsPath));
}

function saveProducts(products) {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
}

// Upload endpoint (Admin only)
app.post('/upload', upload.single('image'), (req, res) => {
  const { title, price, description } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`;

  const product = {
    id: Date.now(),
    title,
    price,
    description,
    imageUrl,
    images: [], // Additional images will be added later
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  };

  const products = loadProducts();
  products.push(product);
  saveProducts(products);

  res.json({ success: true, product });
});

// Add additional image to product
app.post('/product/:id/image', upload.single('image'), (req, res) => {
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const newImage = `/uploads/${req.file.filename}`;
  if (!product.images) product.images = [];
  product.images.push(newImage); // Add new image to the product

  saveProducts(products);
  res.json({ success: true, images: product.images });
});

// Delete image from product (also delete file)
app.post('/product/:id/image/delete', express.json(), (req, res) => {
  const { imageUrl } = req.body;
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const imagePath = path.join(__dirname, 'public', imageUrl);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath); // Delete the file from the server
  }

  product.images = product.images.filter(img => img !== imageUrl); // Remove from product images list
  saveProducts(products);
  res.json({ success: true });
});

// Replace main product image (also delete old one)
app.post('/product/:id/image/replace', upload.single('image'), (req, res) => {
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const oldImagePath = path.join(__dirname, 'public', product.imageUrl);
  if (fs.existsSync(oldImagePath)) {
    fs.unlinkSync(oldImagePath); // Delete the old main image
  }

  const newImage = `/uploads/${req.file.filename}`;
  product.imageUrl = newImage; // Replace the main image

  saveProducts(products);
  res.json({ success: true, imageUrl: newImage });
});

// Update product details (title, price, description)
app.post('/product/:id/edit', express.json(), (req, res) => {
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

// Add or remove size
app.post('/product/:id/size', express.json(), (req, res) => {
  const { action, size } = req.body;
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (!product.sizes) product.sizes = [];
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

// Get one product
app.get('/product/:id', (req, res) => {
  const products = loadProducts();
  const product = products.find(p => p.id == req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
