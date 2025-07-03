// Upload new product
async function uploadProduct() {
  const imageInput = document.getElementById('imageInput');
  const videoInput = document.getElementById('videoInput');
  const titleInput = document.getElementById('titleInput');
  const priceInput = document.getElementById('priceInput');
  const descriptionInput = document.getElementById('descriptionInput');

  const imageFile = imageInput.files[0];
  const videoFile = videoInput?.files[0]; // optional
  const title = titleInput.value.trim();
  const price = parseFloat(priceInput.value.trim());
  const description = descriptionInput.value.trim();

  if (!imageFile || !title || isNaN(price) || !description) {
    alert('Please fill in all fields and select an image.');
    return;
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  if (videoFile) formData.append('video', videoFile);
  formData.append('title', title);
  formData.append('price', price);
  formData.append('description', description);

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      alert('Product uploaded successfully!');
      imageInput.value = '';
      if (videoInput) videoInput.value = '';
      titleInput.value = '';
      priceInput.value = '';
      descriptionInput.value = '';
      loadProducts();
    } else {
      alert('Error uploading product.');
    }
  } catch (err) {
    console.error('Upload failed:', err);
    alert('Failed to upload product.');
  }
}

// Load products
async function loadProducts() {
  const res = await fetch('/products');
  const products = await res.json();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const container = document.getElementById('productsContainer');
  container.innerHTML = '';

  products.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'product';

    let mediaHTML = '';
    if (p.video) {
      mediaHTML = `<video src="${p.video}" autoplay muted loop playsinline class="product-video"></video>`;
    } else {
      mediaHTML = `<img src="${p.imageUrl}" alt="${p.title}" />`;
    }

    div.innerHTML = `
      ${mediaHTML}
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <strong>$${p.price}</strong>
      <button onclick="location.href='product.html?id=${p.id}'">Check Me Out</button>
      ${isAdmin ? ` 
        <div class="admin-tools">
          <input type="file" id="editImage-${p.id}" />
          <button onclick="replaceMainImage(${p.id})">Replace Image</button>
          <button onclick="deleteProduct(${p.id})" style="background-color:red;color:white;margin-top:5px;">Delete Product</button>
        </div>
      ` : ''}
    `;
    container.appendChild(div);
  });
}

// Replace main image
async function replaceMainImage(productId) {
  const input = document.getElementById(`editImage-${productId}`);
  const file = input.files[0];
  if (!file) return alert('Please select an image.');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`/product/${productId}/image/replace`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (data.success) {
    alert('Main product image updated!');
    loadProducts();
  } else {
    alert('Error updating image.');
  }
}

// Add new image to product detail page
async function addNewImage(productId) {
  const input = document.getElementById('newImageInput');
  const file = input.files[0];
  if (!file) return alert('Please select an image to upload.');

  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`/product/${productId}/image`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (data.success) {
    alert('New image added!');
    fetchProduct(productId);
  } else {
    alert('Error adding image.');
  }
}

// Delete extra image from product detail page
async function deleteImage(productId, imageUrl) {
  const res = await fetch(`/product/${productId}/image/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });

  const data = await res.json();
  if (data.success) {
    alert('Image deleted!');
    fetchProduct(productId);
  } else {
    alert('Error deleting image.');
  }
}

// Fetch single product for detail page
async function fetchProduct(productId) {
  const res = await fetch(`/product/${productId}`);
  const product = await res.json();
  renderProductDetail(product);
}

// Render the product detail page
function renderProductDetail(product) {
  const container = document.getElementById('productDetailContainer');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  container.innerHTML = `
    <div class="product-detail">
      <img src="${product.imageUrl}" alt="${product.title}" />
      <h2>${product.title}</h2>
      <p>${product.description}</p>
      <strong>$${product.price}</strong>

      <h4>Images:</h4>
      <div class="extra-images">
        ${product.images.map(img => `
          <div class="extra-img-wrapper">
            <img src="${img}" class="extra-img" />
            ${isAdmin ? `<button onclick="deleteImage(${product.id}, '${img}')">🗑️</button>` : ''}
          </div>
        `).join('')}
      </div>

      ${isAdmin ? `
        <input type="file" id="newImageInput" />
        <button onclick="addNewImage(${product.id})">Add New Image</button>
      ` : ''}
    </div>
  `;
}

// Delete entire product from the main page (admin only)
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const res = await fetch(`/product/${productId}/delete`, {
      method: 'POST'
    });

    const data = await res.json();
    if (data.success) {
      alert('Product deleted!');
      loadProducts();
    } else {
      alert('Failed to delete product.');
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    alert('An error occurred while deleting the product.');
  }
}

// Cart display
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  document.getElementById('cartCount').innerText = `🛒 ${cart.length}`;
  document.getElementById('checkoutContainer').style.display = cart.length > 0 ? 'block' : 'none';
}

// Add product to cart
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

// Start Stripe checkout
function proceedToCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const lineItems = cart.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: 1,
  }));

  fetch('/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items: lineItems })
  })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initiate checkout');
      }
    })
    .catch(err => {
      console.error('Checkout error:', err);
      alert('Something went wrong!');
    });
}

// Cart reset button setup
function setupResetCartButton() {
  const resetBtn = document.getElementById('resetCartBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset your cart?')) {
        localStorage.removeItem('cart');
        updateCartCount();
      }
    });
  }
}

// Toggle Return & Refund Policy dropdown (run immediately)
const toggleBtn = document.querySelector('.return-policy-toggle');
const content = document.querySelector('.return-policy-content');

if (toggleBtn && content) {
  toggleBtn.addEventListener('click', () => {
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
    toggleBtn.innerHTML = content.style.display === 'block'
      ? 'Return & Refund Policy ⮝'
      : 'Return & Refund Policy ⮟';
  });
}

// Init
loadProducts();
updateCartCount();
setupResetCartButton();
