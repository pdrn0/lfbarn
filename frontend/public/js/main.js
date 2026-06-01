const API = '';
const WPP = '5544999769485';

// Get creative from URL param (for tracking)
const urlParams = new URLSearchParams(window.location.search);
const CREATIVE = urlParams.get('utm_creative') || urlParams.get('c') || null;

// Navbar scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.background =
    window.scrollY > 60 ? 'rgba(26,15,7,0.99)' : 'rgba(26,15,7,0.96)';
});

// Load products
let allProducts = [];
let currentCategory = '';

async function loadProducts(category = '') {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Carregando produtos...</p></div>`;
  try {
    const url = category ? `${API}/api/products?category=${encodeURIComponent(category)}` : `${API}/api/products`;
    const res = await fetch(url);
    allProducts = await res.json();
    renderProducts(allProducts);
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">Erro ao carregar produtos. Tente novamente.</div>`;
  }
}

function catEmoji(cat) {
  const map = { Outdoor: '🏕️', Ranch: '🐂', Fishing: '🎣', Lifestyle: '🇺🇸' };
  return map[cat] || '📦';
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!products.length) {
    grid.innerHTML = `<div class="empty-state">Nenhum produto encontrado nessa categoria.<br>Em breve novidades!</div>`;
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="prod-card" onclick="openProduct(${p.id})" data-id="${p.id}">
      <div class="prod-img-wrap">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${escHtml(p.name)}" loading="lazy">`
          : `<div class="prod-img-placeholder">${catEmoji(p.category)}</div>`}
        <div class="prod-cat-badge">${escHtml(p.category)}</div>
      </div>
      <div class="prod-info">
        <div class="prod-tag">${catEmoji(p.category)} ${escHtml(p.category)}</div>
        <div class="prod-name">${escHtml(p.name)}</div>
        ${p.description ? `<div class="prod-desc">${escHtml(p.description.substring(0, 70))}${p.description.length > 70 ? '...' : ''}</div>` : ''}
      </div>
      <div class="prod-footer">
        ${p.price ? `<span class="prod-price">R$ ${parseFloat(p.price).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>` : `<span class="prod-price consulte">Consulte</span>`}
        <a class="prod-order-btn" href="${p.whatsapp_link}" target="_blank" onclick="trackOrder(event,${p.id})">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.549 4.107 1.508 5.835L.057 23.529c-.044.175.005.358.132.49.093.097.218.15.346.15.054 0 .108-.009.16-.026l5.868-1.529A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.96 0-3.81-.54-5.395-1.475l-.387-.23-4.01 1.046 1.003-3.908-.252-.4A9.78 9.78 0 012.182 12C2.182 6.579 6.579 2.182 12 2.182S21.818 6.579 21.818 12 17.421 21.818 12 21.818z"/></svg>
          Pedir
        </a>
      </div>
    </div>
  `).join('');

  // Track views after render
  products.forEach(p => trackView(p.id));
}

function trackView(id) {
  fetch(`${API}/api/products/${id}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creative: CREATIVE })
  }).catch(() => {});
}

function trackOrder(e, id) {
  e.stopPropagation();
  fetch(`${API}/api/products/${id}/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creative: CREATIVE })
  }).catch(() => {});
}

// Modal
function openProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  trackView(p.id);
  const modal = document.getElementById('product-modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-wrap">
      <button class="modal-close" onclick="closeModal()">✕</button>
      ${p.image_url
        ? `<img class="modal-img" src="${p.image_url}" alt="${escHtml(p.name)}">`
        : `<div class="modal-img-placeholder">${catEmoji(p.category)}</div>`}
    </div>
    <div class="modal-body">
      <div class="modal-cat">${catEmoji(p.category)} ${escHtml(p.category)}</div>
      <div class="modal-name">${escHtml(p.name)}</div>
      ${p.description ? `<p class="modal-desc">${escHtml(p.description)}</p>` : ''}
      <div class="modal-price">${p.price ? `R$ ${parseFloat(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : 'Consulte o preço'}</div>
      <div class="modal-footer">
        <a class="btn-wpp" href="${p.whatsapp_link}" target="_blank" onclick="trackOrder(event,${p.id})">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.549 4.107 1.508 5.835L.057 23.529c-.044.175.005.358.132.49.093.097.218.15.346.15.054 0 .108-.009.16-.026l5.868-1.529A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-1.96 0-3.81-.54-5.395-1.475l-.387-.23-4.01 1.046 1.003-3.908-.252-.4A9.78 9.78 0 012.182 12C2.182 6.579 6.579 2.182 12 2.182S21.818 6.579 21.818 12 17.421 21.818 12 21.818z"/></svg>
          Pedir via WhatsApp
        </a>
        <button class="btn-primary" onclick="closeModal()">Fechar</button>
      </div>
    </div>
  `;
  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('product-modal').classList.remove('open');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    loadProducts(currentCategory);
  });
});

// Close modal on overlay click
document.getElementById('product-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// Escape key
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init
loadProducts();
