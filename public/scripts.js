async function uploadProduct() {
  const image = document.getElementById('imageInput').files[0];
  const title = document.getElementById('titleInput').value;
  const price = document.getElementById('priceInput').value;
  const description = document.getElementById('descriptionInput').value;

  const formData = new FormData();
  formData.append('image', image);
  formData.append('title', title);
  formData.append('price', price);
  formData.append('description', description);

  const res = await fetch('/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (data.success) {
    alert('Product uploaded!');
    loadProducts();
  }
}

async function loadProducts() {
  const res = await fetch('/products');
  const products = await res.json();

  const container = document.getElementById('productsContainer');
  container.innerHTML = '';

  products.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="${p.imageUrl}" />
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <strong>$${p.price}</strong>
    `;
    container.appendChild(div);
  });
}

loadProducts();
