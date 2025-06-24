// server.js
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

// Upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  const { title, price, description } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`;

  const product = {
    id: Date.now(),
    title,
    price,
    description,
    imageUrl,
  };

  const productsPath = path.join(__dirname, 'products.json');
  let products = [];

  if (fs.existsSync(productsPath)) {
    products = JSON.parse(fs.readFileSync(productsPath));
  }

  products.push(product);
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

  res.json({ success: true, product });
});

// Get all products
app.get('/products', (req, res) => {
  const productsPath = path.join(__dirname, 'products.json');
  let products = [];

  if (fs.existsSync(productsPath)) {
    products = JSON.parse(fs.readFileSync(productsPath));
  }

  res.json(products);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
