// Main Page: Upload & Replace Main Image
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

// Product Detail Page: Add new image
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

// Product Detail Page: Delete an image
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

// Upload new product
async function uploadProduct() {
  const imageInput = document.getElementById('imageInput');
  const titleInput = document.getElementById('titleInput');
  const priceInput = document.getElementById('priceInput');
  const descriptionInput = document.getElementById('descriptionInput');

  const file = imageInput.files[0];
  const title = titleInput.value.trim();
  const price = parseFloat(priceInput.value.trim());
  const description = descriptionInput.value.trim();

  if (!file || !title || isNaN(price) || !description) {
    alert('Please fill in all fields and select an image.');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);
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
    div.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.title}" />
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <strong>$${p.price}</strong>
      <button onclick="location.href='product.html?id=${p.id}'">Check Me Out</button>
      ${isAdmin ? ` 
        <div class="admin-tools">
          <input type="file" id="editImage-${p.id}" />
          <button onclick="replaceMainImage(${p.id})">Replace Image</button>
        </div>
      ` : ''}
    `;
    container.appendChild(div);
  });
}

// Fetch single product
async function fetchProduct(productId) {
  const res = await fetch(`/product/${productId}`);
  const product = await res.json();
  renderProductDetail(product);
}

// Render product details
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

// Cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  document.getElementById('cartCount').innerText = `🛒 ${cart.length}`;

  document.getElementById('checkoutContainer').style.display = cart.length > 0 ? 'block' : 'none';
}

// Add to cart
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

// Checkout
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

// Reset cart
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

// Init
loadProducts();
updateCartCount();
setupResetCartButton();
