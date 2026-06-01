const API = '';
let TOKEN = localStorage.getItem('lfbarn_token') || '';

// Check auth on load
if (TOKEN) { showPanel(); } else { showLogin(); }

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
}

function showPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'grid';
  loadDashboard();
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!email || !pass) { errEl.textContent = 'Preencha e-mail e senha.'; errEl.style.display = 'block'; return; }
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Credenciais inválidas.'; errEl.style.display = 'block'; return; }
    TOKEN = data.token;
    localStorage.setItem('lfbarn_token', TOKEN);
    showPanel();
  } catch (e) {
    errEl.textContent = 'Erro de conexão. Tente novamente.'; errEl.style.display = 'block';
  }
}

function doLogout() {
  localStorage.removeItem('lfbarn_token');
  TOKEN = '';
  showLogin();
}

// Allow Enter key on login
document.getElementById('login-pass') && document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

// TAB NAVIGATION
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  const navMap = { dashboard: 0, products: 1, 'add-product': 2 };
  const navItems = document.querySelectorAll('.nav-item');
  if (navItems[navMap[tab]]) navItems[navMap[tab]].classList.add('active');

  if (tab === 'dashboard') loadDashboard();
  if (tab === 'products') loadAdminProducts();
  if (tab === 'add-product') {
    document.getElementById('product-form-title').textContent = 'Novo Produto';
    document.getElementById('active-field').style.display = 'none';
    clearForm();
  }
}

// DASHBOARD
async function loadDashboard() {
  document.getElementById('metrics-loading').style.display = 'block';
  document.getElementById('metrics-content').style.display = 'none';
  try {
    const res = await authFetch('/api/metrics');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const t = data.totals;
    document.getElementById('stats-row').innerHTML = `
      <div class="stat-card"><div class="stat-card-label">Produtos Ativos</div><div class="stat-card-val">${t.total_products || 0}</div></div>
      <div class="stat-card"><div class="stat-card-label">Total de Visualizações</div><div class="stat-card-val">${Number(t.total_views || 0).toLocaleString('pt-BR')}</div></div>
      <div class="stat-card"><div class="stat-card-label">Pedidos via WhatsApp</div><div class="stat-card-val">${Number(t.total_orders || 0).toLocaleString('pt-BR')}</div></div>
      <div class="stat-card"><div class="stat-card-label">Taxa de Conversão</div><div class="stat-card-val">${t.total_views > 0 ? ((t.total_orders / t.total_views) * 100).toFixed(1) + '%' : '—'}</div></div>
    `;

    const maxV = Math.max(...data.topViewed.map(p => p.views), 1);
    document.getElementById('top-viewed').innerHTML = data.topViewed.length
      ? data.topViewed.map(p => `
        <div class="metric-row">
          <span class="metric-name">${escHtml(p.name)}</span>
          <div class="metric-bar-wrap"><div class="metric-bar" style="width:${(p.views/maxV)*100}%"></div></div>
          <span class="metric-val">${p.views}</span>
        </div>`).join('')
      : '<p class="center-msg">Nenhum dado ainda</p>';

    const maxO = Math.max(...data.topOrdered.map(p => p.orders), 1);
    document.getElementById('top-ordered').innerHTML = data.topOrdered.length
      ? data.topOrdered.map(p => `
        <div class="metric-row">
          <span class="metric-name">${escHtml(p.name)}</span>
          <div class="metric-bar-wrap"><div class="metric-bar" style="width:${(p.orders/maxO)*100}%"></div></div>
          <span class="metric-val">${p.orders}</span>
        </div>`).join('')
      : '<p class="center-msg">Nenhum pedido ainda</p>';

    document.getElementById('by-category').innerHTML = data.byCategory.length
      ? `<table style="width:100%;font-size:0.82rem;border-collapse:collapse">
          <tr><th style="text-align:left;padding:0.4rem 0;color:var(--muted);font-size:0.68rem;letter-spacing:0.1em;border-bottom:1px solid var(--border)">Categoria</th><th style="text-align:right;padding:0.4rem 0;color:var(--muted);font-size:0.68rem;letter-spacing:0.1em;border-bottom:1px solid var(--border)">Views</th><th style="text-align:right;padding:0.4rem 0;color:var(--muted);font-size:0.68rem;letter-spacing:0.1em;border-bottom:1px solid var(--border)">Pedidos</th></tr>
          ${data.byCategory.map(c => `<tr><td style="padding:0.5rem 0;border-bottom:1px solid var(--border)">${escHtml(c.category)}</td><td style="text-align:right;padding:0.5rem 0;border-bottom:1px solid var(--border);color:var(--tan)">${c.views || 0}</td><td style="text-align:right;padding:0.5rem 0;border-bottom:1px solid var(--border);color:var(--gold);font-weight:700">${c.orders || 0}</td></tr>`).join('')}
        </table>`
      : '<p class="center-msg">Nenhum dado</p>';

    document.getElementById('by-creative').innerHTML = data.byCreative.length
      ? `<table style="width:100%;font-size:0.82rem;border-collapse:collapse">
          <tr><th style="text-align:left;padding:0.4rem 0;color:var(--muted);font-size:0.68rem;letter-spacing:0.1em;border-bottom:1px solid var(--border)">Criativo</th><th style="text-align:right;padding:0.4rem 0;color:var(--muted);font-size:0.68rem;letter-spacing:0.1em;border-bottom:1px solid var(--border)">Views</th><th style="text-align:right;padding:0.4rem 0;color:var(--muted);font-size:0.68rem;letter-spacing:0.1em;border-bottom:1px solid var(--border)">Pedidos</th></tr>
          ${data.byCreative.map(c => `<tr><td style="padding:0.5rem 0;border-bottom:1px solid var(--border)">${escHtml(c.creative)}</td><td style="text-align:right;padding:0.5rem 0;border-bottom:1px solid var(--border);color:var(--tan)">${c.views || 0}</td><td style="text-align:right;padding:0.5rem 0;border-bottom:1px solid var(--border);color:var(--gold);font-weight:700">${c.orders || 0}</td></tr>`).join('')}
        </table>`
      : '<p class="center-msg">Nenhum criativo rastreado ainda</p>';

    document.getElementById('metrics-loading').style.display = 'none';
    document.getElementById('metrics-content').style.display = 'block';
  } catch (e) {
    document.getElementById('metrics-loading').textContent = 'Erro ao carregar métricas.';
  }
}

// ADMIN PRODUCTS LIST
async function loadAdminProducts() {
  const el = document.getElementById('admin-products-list');
  el.innerHTML = '<div class="center-msg">Carregando...</div>';
  try {
    const res = await authFetch('/api/products/admin/all');
    const products = await res.json();
    if (!products.length) { el.innerHTML = '<div class="center-msg">Nenhum produto cadastrado ainda.</div>'; return; }
    el.innerHTML = `<table class="admin-prod-table">
      <thead><tr>
        <th>Foto</th><th>Nome</th><th>Categoria</th><th>Preço</th>
        <th>Views</th><th>Pedidos</th><th>Status</th><th>Ações</th>
      </tr></thead>
      <tbody>
        ${products.map(p => `<tr>
          <td>${p.image_url ? `<img class="prod-thumb" src="${p.image_url}" alt="">` : `<div class="prod-thumb-placeholder">${catEmoji(p.category)}</div>`}</td>
          <td style="font-weight:600;max-width:180px">${escHtml(p.name)}</td>
          <td>${escHtml(p.category)}</td>
          <td>${p.price ? `R$ ${parseFloat(p.price).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '—'}</td>
          <td style="color:var(--tan)">${p.views}</td>
          <td style="color:var(--gold);font-weight:700">${p.orders}</td>
          <td><span class="${p.active ? 'badge-active' : 'badge-inactive'}">${p.active ? 'ATIVO' : 'INATIVO'}</span></td>
          <td><div class="table-actions">
            <button class="btn-edit" onclick="editProduct(${p.id})">✏️ Editar</button>
            <button class="btn-del" onclick="deleteProduct(${p.id}, '${escHtml(p.name)}')">🗑️</button>
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  } catch (e) { el.innerHTML = '<div class="center-msg">Erro ao carregar produtos.</div>'; }
}

// EDIT
async function editProduct(id) {
  try {
    const res = await authFetch('/api/products/admin/all');
    const products = await res.json();
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('edit-id').value = p.id;
    document.getElementById('f-name').value = p.name;
    document.getElementById('f-desc').value = p.description || '';
    document.getElementById('f-price').value = p.price || '';
    document.getElementById('f-category').value = p.category;
    document.getElementById('f-creative').value = p.creative || '';
    document.getElementById('f-active').value = p.active ? 'true' : 'false';
    document.getElementById('active-field').style.display = 'block';
    if (p.image_url) {
      document.getElementById('preview-img').src = p.image_url;
      document.getElementById('img-preview').style.display = 'block';
    }
    document.getElementById('product-form-title').textContent = 'Editar Produto';
    showTab('add-product');
    document.getElementById('active-field').style.display = 'block';
  } catch (e) { alert('Erro ao carregar produto.'); }
}

// DELETE
async function deleteProduct(id, name) {
  if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
  try {
    const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) loadAdminProducts();
    else alert('Erro ao excluir produto.');
  } catch (e) { alert('Erro de conexão.'); }
}

// SUBMIT FORM
async function submitProduct() {
  const errEl = document.getElementById('form-error');
  errEl.style.display = 'none';
  const name = document.getElementById('f-name').value.trim();
  const category = document.getElementById('f-category').value;
  if (!name) { errEl.textContent = 'Nome é obrigatório.'; errEl.style.display = 'block'; return; }
  if (!category) { errEl.textContent = 'Selecione uma categoria.'; errEl.style.display = 'block'; return; }

  const editId = document.getElementById('edit-id').value;
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', document.getElementById('f-desc').value);
  formData.append('price', document.getElementById('f-price').value);
  formData.append('category', category);
  formData.append('creative', document.getElementById('f-creative').value);
  if (editId) formData.append('active', document.getElementById('f-active').value);
  const imgFile = document.getElementById('f-image').files[0];
  if (imgFile) formData.append('image', imgFile);

  try {
    const url = editId ? `/api/products/${editId}` : '/api/products';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(`${API}${url}`, {
      method,
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Erro ao salvar.'; errEl.style.display = 'block'; return; }
    clearForm();
    showTab('products');
  } catch (e) { errEl.textContent = 'Erro de conexão.'; errEl.style.display = 'block'; }
}

function clearForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('f-name').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('f-price').value = '';
  document.getElementById('f-category').value = '';
  document.getElementById('f-creative').value = '';
  document.getElementById('f-image').value = '';
  document.getElementById('img-preview').style.display = 'none';
  document.getElementById('form-error').style.display = 'none';
}

// Image preview
document.getElementById('f-image') && document.getElementById('f-image').addEventListener('change', function() {
  if (this.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('preview-img').src = e.target.result;
      document.getElementById('img-preview').style.display = 'block';
    };
    reader.readAsDataURL(this.files[0]);
  }
});

// Helpers
function authFetch(url, opts = {}) {
  return fetch(`${API}${url}`, { ...opts, headers: { ...opts.headers, 'Authorization': `Bearer ${TOKEN}` } });
}
function catEmoji(cat) {
  return { Outdoor: '🏕️', Ranch: '🐂', Fishing: '🎣', Lifestyle: '🇺🇸' }[cat] || '📦';
}
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
