/**
 * BillZen Dashboard — dashboard.js
 * El usuario ya se autenticó como empresa en login.html.
 * Aquí se restaura la sesión y se carga el inventario directamente.
 *
 * Servidor: http://172.20.10.8:8000
 */

// ─── Configuración ───────────────────────────────────────────────
const API = 'http://172.20.10.8:8000';

// ─── Estado global ───────────────────────────────────────────────
const state = {
  nit:    '',
  token:  null,
  nombre: '',
  productos: [],
  filteredProductos: [],
  editingId: null,
};

// ─── Inicialización: restaurar sesión desde sessionStorage ────────
(function init() {
  const nit    = sessionStorage.getItem('bz_empresa_nit');
  const token  = sessionStorage.getItem('bz_empresa_token');
  const nombre = sessionStorage.getItem('bz_empresa_nombre');

  if (!nit) {
    // Sin sesión → redirigir al login
    window.location.href = '../login.html';
    return;
  }

  state.nit    = nit;
  state.token  = token || null;
  state.nombre = nombre || `NIT ${nit}`;

  // Actualizar UI con datos de la empresa
  const initiales = nit.substring(0, 2).toUpperCase();
  document.getElementById('sidebar-avatar').textContent   = initiales;
  document.getElementById('sidebar-username').textContent = state.nombre;
  document.getElementById('sidebar-userrole').textContent = `NIT ${nit}`;
  document.getElementById('topbar-nit').textContent       = `NIT ${nit}`;

  // Cargar catálogo de inmediato
  cargarProductos();
})();

// ─── Headers de autenticación ────────────────────────────────────
function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (state.token) h['Authorization'] = `Bearer ${state.token}`;
  return h;
}

// ─── Logout ──────────────────────────────────────────────────────
document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('bz_empresa_nit');
  sessionStorage.removeItem('bz_empresa_token');
  sessionStorage.removeItem('bz_empresa_nombre');
  window.location.href = '../login.html';
});

// ═══════════════════════════════════════════════════════════════════
// HELPERS DE UI
// ═══════════════════════════════════════════════════════════════════

function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Cerrar con botón data-close
document.querySelectorAll('[data-close]').forEach(btn =>
  btn.addEventListener('click', () => closeModal(btn.dataset.close))
);
// Cerrar con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
});
// Cerrar al clic en backdrop
document.querySelectorAll('.modal-backdrop').forEach(backdrop =>
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  })
);

/** Toast notifications */
function showToast(msg, type = 'success') {
  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4AE8A4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warn:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast-icon-wrap">${icons[type]}</div><div class="toast-text">${msg}</div>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/** Botón con estado de carga */
function setLoading(btn, yes) {
  btn.disabled = yes;
  yes ? btn.classList.add('loading') : btn.classList.remove('loading');
}

/** Mostrar/limpiar error en modal */
function showModalError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
}
function clearModalError(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.classList.remove('visible'); }
}

/** Formatea precio COP */
function formatCOP(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

/** Pill de stock */
function stockPill(stock) {
  if (stock === 0) return `<span class="stock-pill out">&#9679; Sin stock</span>`;
  if (stock < 10)  return `<span class="stock-pill low">&#9651; ${stock}</span>`;
  return `<span class="stock-pill ok">&#9679; ${stock}</span>`;
}

// ═══════════════════════════════════════════════════════════════════
// INVENTARIO — CRUD
// ═══════════════════════════════════════════════════════════════════

// ── GET /productos/ ───────────────────────────────────────────────
async function cargarProductos() {
  renderLoadingRows();
  try {
    const res = await fetch(`${API}/productos/`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    state.productos = Array.isArray(data) ? data : [];
    filtrarYRenderizar();
    actualizarKPIs();
  } catch (err) {
    console.error('[cargarProductos]', err);
    const isNetwork = err instanceof TypeError;
    document.getElementById('products-tbody').innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5c6585" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p>${isNetwork ? `No se puede alcanzar el servidor (${API})` : `Error: ${err.message}`}.<br>
          <strong style="color:var(--accent);cursor:pointer;" onclick="cargarProductos()">Reintentar</strong></p>
        </div>
      </td></tr>`;
    showToast(isNetwork ? 'Sin conexión con el servidor.' : `Error: ${err.message}`, 'error');
  }
}

function renderLoadingRows() {
  document.getElementById('products-tbody').innerHTML =
    Array.from({ length: 5 }).map(() => `<tr>
      ${Array.from({ length: 7 }).map(() =>
        `<td><div class="skeleton" style="width:${55 + Math.random() * 40}%;"></div></td>`
      ).join('')}
    </tr>`).join('');
}

function filtrarYRenderizar() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  state.filteredProductos = q
    ? state.productos.filter(p =>
        (p.descripcion   || '').toLowerCase().includes(q) ||
        (p.codigo_barras || '').toLowerCase().includes(q) ||
        (p.categoria     || '').toLowerCase().includes(q)
      )
    : [...state.productos];
  renderTabla();
}

function renderTabla() {
  const tbody = document.getElementById('products-tbody');
  const lista = state.filteredProductos;

  document.getElementById('table-count-label').textContent =
    `${lista.length} producto${lista.length !== 1 ? 's' : ''} en catálogo`;

  if (!lista.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5c6585" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <p>No hay productos. <strong style="color:var(--accent);cursor:pointer;" onclick="document.getElementById('btn-nuevo-producto').click()">Crear el primero</strong></p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => `
    <tr>
      <td class="td-mono">#${p.id_producto}</td>
      <td class="td-mono">${p.codigo_barras || '—'}</td>
      <td><strong>${p.descripcion || '—'}</strong></td>
      <td><strong>${formatCOP(p.precio)}</strong></td>
      <td>${stockPill(p.stock ?? 0)}</td>
      <td><span class="cat-pill">${p.categoria || '—'}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn icon-warn"  title="Actualizar precio"   onclick="abrirModalPrecio(${p.id_producto})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </button>
          <button class="icon-btn icon-blue"  title="Ingresar stock"      onclick="abrirModalIngreso(${p.id_producto})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </button>
          <button class="icon-btn danger"      title="Eliminar producto"   onclick="abrirConfirmDelete(${p.id_producto})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function actualizarKPIs() {
  const ps = state.productos;
  document.getElementById('kpi-total').textContent = ps.length;
  const totalStock = ps.reduce((s, p) => s + (p.stock ?? 0), 0);
  document.getElementById('kpi-stock').textContent = totalStock.toLocaleString('es-CO');
  const low = ps.filter(p => (p.stock ?? 0) < 10).length;
  document.getElementById('kpi-low').textContent   = low;
  const valor = ps.reduce((s, p) => s + (p.precio ?? 0) * (p.stock ?? 0), 0);
  document.getElementById('kpi-valor').textContent = formatCOP(valor);
}

// Búsqueda y recargar
document.getElementById('search-input').addEventListener('input', filtrarYRenderizar);
document.getElementById('btn-refresh').addEventListener('click', cargarProductos);
document.getElementById('btn-refresh-top').addEventListener('click', cargarProductos);

// ── POST /productos/ — Crear producto ─────────────────────────────
document.getElementById('btn-nuevo-producto').addEventListener('click', () => {
  clearModalError('modal-producto-error');
  ['input-barras','input-desc','input-precio','input-stock','input-categoria']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('modal-producto-title').textContent = 'Nuevo Producto';
  openModal('modal-producto');
});

document.getElementById('btn-guardar-producto').addEventListener('click', async () => {
  clearModalError('modal-producto-error');
  const codigo_barras = document.getElementById('input-barras').value.trim();
  const descripcion   = document.getElementById('input-desc').value.trim();
  const precio        = parseFloat(document.getElementById('input-precio').value);
  const stock         = parseInt(document.getElementById('input-stock').value, 10);
  const id_categoria  = parseInt(document.getElementById('input-categoria').value, 10);

  if (!codigo_barras || !descripcion || isNaN(precio) || isNaN(stock) || isNaN(id_categoria)) {
    showModalError('modal-producto-error', 'Completa todos los campos correctamente.');
    return;
  }

  const btn = document.getElementById('btn-guardar-producto');
  setLoading(btn, true);
  try {
    const res = await fetch(`${API}/productos/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ codigo_barras, descripcion, precio, stock, id_categoria }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showModalError('modal-producto-error', data.detail || data.mensaje || `Error ${res.status}`); return; }
    closeModal('modal-producto');
    showToast(`Producto "${descripcion}" creado exitosamente.`);
    cargarProductos();
  } catch (err) {
    showModalError('modal-producto-error', `Error de conexión: ${err.message}`);
  } finally {
    setLoading(btn, false);
  }
});

// ── PUT /productos/{id}/precio — Actualizar precio ────────────────
function abrirModalPrecio(id) {
  const p = state.productos.find(x => x.id_producto === id);
  if (!p) return;
  state.editingId = id;
  clearModalError('modal-precio-error');
  document.getElementById('modal-precio-desc').textContent =
    `${p.descripcion} — precio actual: ${formatCOP(p.precio)}`;
  document.getElementById('input-nuevo-precio').value = '';
  openModal('modal-precio');
}

document.getElementById('btn-guardar-precio').addEventListener('click', async () => {
  clearModalError('modal-precio-error');
  const precio = parseFloat(document.getElementById('input-nuevo-precio').value);
  if (isNaN(precio) || precio < 0) { showModalError('modal-precio-error', 'Ingresa un precio válido.'); return; }

  const btn = document.getElementById('btn-guardar-precio');
  setLoading(btn, true);
  try {
    const res = await fetch(`${API}/productos/${state.editingId}/precio`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ precio }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showModalError('modal-precio-error', data.detail || data.mensaje || `Error ${res.status}`); return; }
    closeModal('modal-precio');
    showToast('Precio actualizado correctamente.');
    cargarProductos();
  } catch (err) {
    showModalError('modal-precio-error', `Error de conexión: ${err.message}`);
  } finally {
    setLoading(btn, false);
  }
});

// ── PUT /productos/{id}/ingreso — Ingresar mercancía ──────────────
function abrirModalIngreso(id) {
  const p = state.productos.find(x => x.id_producto === id);
  if (!p) return;
  state.editingId = id;
  clearModalError('modal-ingreso-error');
  document.getElementById('modal-ingreso-desc').textContent =
    `${p.descripcion} — stock actual: ${p.stock ?? 0} unidades`;
  document.getElementById('input-cantidad-ingreso').value = '';
  openModal('modal-ingreso');
}

document.getElementById('btn-confirmar-ingreso').addEventListener('click', async () => {
  clearModalError('modal-ingreso-error');
  const cantidad_ingreso = parseInt(document.getElementById('input-cantidad-ingreso').value, 10);
  if (isNaN(cantidad_ingreso) || cantidad_ingreso < 1) {
    showModalError('modal-ingreso-error', 'Ingresa una cantidad válida (mínimo 1).');
    return;
  }

  const btn = document.getElementById('btn-confirmar-ingreso');
  setLoading(btn, true);
  try {
    const res = await fetch(`${API}/productos/${state.editingId}/ingreso`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ cantidad_ingreso }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { showModalError('modal-ingreso-error', data.detail || data.mensaje || `Error ${res.status}`); return; }
    closeModal('modal-ingreso');
    showToast(`Ingreso de ${cantidad_ingreso} unidades registrado.`);
    cargarProductos();
  } catch (err) {
    showModalError('modal-ingreso-error', `Error de conexión: ${err.message}`);
  } finally {
    setLoading(btn, false);
  }
});

// ── DELETE /productos/{id} — Eliminar producto ────────────────────
function abrirConfirmDelete(id) {
  const p = state.productos.find(x => x.id_producto === id);
  if (!p) return;
  state.editingId = id;
  document.getElementById('confirm-delete-msg').textContent =
    `¿Estás seguro de que deseas eliminar "${p.descripcion}"? Esta acción no se puede deshacer.`;
  openModal('modal-confirm-delete');
}

document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
  const btn = document.getElementById('btn-confirm-delete');
  setLoading(btn, true);
  try {
    const res = await fetch(`${API}/productos/${state.editingId}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    closeModal('modal-confirm-delete');
    if (!res.ok) { showToast(data.detail || data.mensaje || `Error ${res.status}`, 'error'); return; }
    showToast(data.mensaje || 'Producto eliminado exitosamente.');
    cargarProductos();
  } catch (err) {
    closeModal('modal-confirm-delete');
    showToast(`Error de conexión: ${err.message}`, 'error');
  } finally {
    setLoading(btn, false);
  }
});
