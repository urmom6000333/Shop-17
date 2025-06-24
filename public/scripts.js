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
    loadProducts(); // Reload product list to reflect the new image
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
    fetchProduct(productId); // Reload the product details page to show the new image
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
    fetchProduct(productId); // Reload the product details page to remove the image
  } else {
    alert('Error deleting image.');
  }
}

// Function to load products on the main page
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

// Function to fetch and display product details on the product detail page
async function fetchProduct(productId) {
  const res = await fetch(`/product/${productId}`);
  const product = await res.json();
  renderProductDetail(product);
}

// Render product detail with options to add and delete images
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

loadProducts(); // Initialize the products on the main page
updateCartCount(); // Update cart count if needed
