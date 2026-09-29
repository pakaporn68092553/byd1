document.addEventListener('DOMContentLoaded', () => {
  // Page 1: product.html Logic
  const productListEl = document.getElementById('product-list');
  if (productListEl) {
    initProductPage();
  }

  // Page 2: order.html Logic
  const orderFormEl = document.getElementById('orderForm');
  if (orderFormEl) {
    initOrderPage();
  }

  // Page 3: admin.html Logic
  const ordersTableEl = document.getElementById('ordersTable');
  if (ordersTableEl) {
    initAdminPage();
  }
});

/* Product Page Handling */
function initProductPage() {
  const productListEl = document.getElementById('product-list');
  const filterBarEl = document.getElementById('filter-bar');
  let allProducts = [];

  fetch('products.json')
    .then(res => res.json())
    .then(products => {
      allProducts = products;
      const urlParams = new URLSearchParams(window.location.search);
      const moodParam = urlParams.get('mood');
      
      if (moodParam) {
        filterAndRenderProducts(moodParam, filterBarEl, productListEl, allProducts);
      } else {
        renderProducts(allProducts, productListEl);
      }
    })
    .catch(err => {
      console.error('Error loading products:', err);
      productListEl.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">ไม่สามารถโหลดข้อมูลสินค้าได้</p>';
    });

  if (filterBarEl) {
    filterBarEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mood]');
      if (!btn) return;
      
      const selectedMood = btn.getAttribute('data-mood');
      filterAndRenderProducts(selectedMood, filterBarEl, productListEl, allProducts);
    });
  }
}

function filterAndRenderProducts(mood, filterBarEl, productListEl, products) {
  if (filterBarEl) {
    const buttons = filterBarEl.querySelectorAll('[data-mood]');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-mood') === mood) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  const filtered = (mood === 'all' || !mood) 
    ? products 
    : products.filter(p => p.mood.toLowerCase() === mood.toLowerCase());

  renderProducts(filtered, productListEl);
}

function renderProducts(products, container) {
  if (products.length === 0) {
    container.innerHTML = '<p class="no-products" style="text-align:center; grid-column: 1/-1;">ไม่พบสินค้าในหมวดหมู่นี้</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-card">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <h3 class="product-card-title">${product.name}</h3>
      <p class="product-card-desc">${product.description}</p>
      <div class="product-card-footer">
        <span class="product-price">฿${product.price}</span>
        <a href="order.html?item=${encodeURIComponent(product.name)}&price=${product.price}" class="btn btn-outline">สั่งซื้อ</a>
      </div>
    </div>
  `).join('');
}

/* Order Page Handling */
function initOrderPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item') || '';
  const priceParam = urlParams.get('price') || '';

  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');
  const orderForm = document.getElementById('orderForm');

  if (itemsInput) itemsInput.value = itemParam;
  if (totalInput) totalInput.value = priceParam;

  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const customerName = document.getElementById('customerName')?.value || '';
      const contact = document.getElementById('contact')?.value || '';
      const items = itemsInput?.value || '';
      const total = totalInput?.value || '';
      const note = document.getElementById('note')?.value || '';

      const payload = {
        customerName,
        contact,
        items,
        total,
        note,
        timestamp: new Date().toISOString()
      };

      try {
        const existingOrders = JSON.parse(localStorage.getItem('bodyScentOrders') || '[]');
        existingOrders.push(payload);
        localStorage.setItem('bodyScentOrders', JSON.stringify(existingOrders));
      } catch (err) {
        console.error('Failed to save order to localStorage:', err);
      }

      window.location.href = 'thankyou.html';
    });
  }
}

/* Admin Page Handling */
function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');
  if (!tbody) return;

  try {
    const rawOrders = localStorage.getItem('bodyScentOrders');
    const orders = rawOrders ? JSON.parse(rawOrders) : [];

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 3rem;">ยังไม่มีคำสั่งซื้อ</td></tr>';
      return;
    }

    orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    tbody.innerHTML = orders.map(order => {
      const dateStr = new Date(order.timestamp).toLocaleString('th-TH');
      return `
        <tr>
          <td>${dateStr}</td>
          <td>${escapeHtml(order.customerName)}</td>
          <td>${escapeHtml(order.contact)}</td>
          <td>${escapeHtml(order.items)}</td>
          <td>฿${escapeHtml(order.total)}</td>
          <td>${escapeHtml(order.note || '-')}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error loading admin orders:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}