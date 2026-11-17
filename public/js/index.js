// Configuración de API (usa js/config.js si está cargado, o detecta entorno automáticamente)
const BZ_API_URL = (typeof API_BASE_URL !== 'undefined')
  ? API_BASE_URL
  : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:8000/api'
      : '/api');

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

const sections = document.querySelectorAll('section[id], .stats-bar');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id || '';
  });
  navLinks.forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.startsWith('#')) {
      a.classList.toggle('active', href === '#' + current);
    }
  });
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.style.boxShadow =
      window.scrollY > 20 ? '0 2px 20px rgba(15,17,23,0.08)' : 'none';
  }
});

// Hamburger (mobile)
const hamburger = document.getElementById('hamburger');
const navLinksMenu = document.querySelector('.nav-links');
if (hamburger && navLinksMenu) {
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinksMenu.classList.toggle('open');
  });

  navLinksMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinksMenu.classList.remove('open');
    });
  });
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('nav')) {
    const nl = document.querySelector('.nav-links');
    if (nl) nl.classList.remove('open');
  }
});

// ==========================================================
// AUTENTICACIÓN TEMPORAL & MATRIZ OFICIAL DE PLANES BILLZEN
// ==========================================================
const SESSION_DURATION_MS = 15 * 60 * 1000;

localStorage.removeItem('bz_empresa_nit');
localStorage.removeItem('bz_empresa_nombre');
localStorage.removeItem('bz_empresa_token');

function normalizePlanCode(raw) {
  const val = (raw || '').trim().toLowerCase();
  if (val === 'standard' || val === 'standart' || val === 'plus') return 'standart';
  if (val === 'ultra' || val === 'pro' || val === 'premium') return 'ultra';
  if (val === 'basico' || val === 'básico' || val === 'free') return 'basico';
  return '';
}

const PLAN_META = {
  basico: {
    code: 'basico',
    name: 'Plan Básico',
    shortName: 'BÁSICO',
    priceNum: 49900,
    priceLabel: '$49.900 COP / mes',
    buttonLabel: 'Adquirir Plan Básico ($49.900)',
    desc: 'POS de escritorio (tirilla local sin DIAN), Productos, Inventario y 1 usuario Cajero (aparte del Admin).',
    bullets: [
      '✓ Facturación POS local, Productos e Inventario',
      '✓ 1 usuario Cajero activo (además del Administrador)',
      '✕ Sin Facturación Electrónica DIAN',
      '✕ Sin Contabilidad (P&G) ni Reportes Analíticos',
      '✕ Sin Auditoría Remota Móvil (QR)'
    ]
  },
  standart: {
    code: 'standart',
    name: 'Plan Standard',
    shortName: 'STANDARD',
    priceNum: 119900,
    priceLabel: '$119.900 COP / mes',
    buttonLabel: 'Adquirir Plan Standard ($119.900)',
    desc: 'Stack completo de escritorio: Facturación Electrónica DIAN (CUFE), Contabilidad (P&G), Reportes y Cajeros ilimitados (sin Auditoría Móvil).',
    bullets: [
      '✓ Facturación Electrónica DIAN Certificada (CUFE)',
      '✓ Contabilidad (Gastos y Estado de Resultados P&G)',
      '✓ Reportes Analíticos + Exportación CSV / Excel',
      '✓ Usuarios Cajeros Ilimitados (aparte del Admin)',
      '✕ Sin Auditoría Remota Móvil (QR)'
    ]
  },
  ultra: {
    code: 'ultra',
    name: 'Plan Ultra',
    shortName: 'ULTRA',
    priceNum: 199900,
    priceLabel: '$199.900 COP / mes',
    buttonLabel: 'Adquirir Plan Ultra ($199.900)',
    desc: '100% Todo Incluido: Stack completo de escritorio + Facturación Electrónica DIAN + Auditoría Remota Móvil en Vivo (QR + App Kotlin).',
    bullets: [
      '✓ 100% del Ecosistema BillZen Desbloqueado',
      '✓ Auditoría Remota Móvil en Vivo (QR + App Kotlin)',
      '✓ Facturación Electrónica DIAN Certificada (CUFE)',
      '✓ Contabilidad (P&G), Reportes y Cajeros Ilimitados',
      '✓ Soporte Prioritario 24/7'
    ]
  }
};

function isSessionValid() {
  const nit = sessionStorage.getItem('bz_empresa_nit');
  if (!nit) return false;

  const expiresAt = parseInt(sessionStorage.getItem('bz_session_expires') || '0', 10);
  if (!expiresAt || Date.now() > expiresAt) {
    handleLogout();
    return false;
  }
  return true;
}

function getCurrentPlan() {
  if (!isSessionValid()) return '';
  return normalizePlanCode(sessionStorage.getItem('bz_empresa_plan') || '');
}

function renewSessionActivity() {
  if (sessionStorage.getItem('bz_empresa_nit')) {
    sessionStorage.setItem('bz_session_expires', String(Date.now() + SESSION_DURATION_MS));
  }
}

function getInitials(name, nit) {
  if (name && typeof name === 'string' && name.trim()) {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase();
  }
  if (nit && typeof nit === 'string') {
    return nit.trim().substring(0, 2).toUpperCase();
  }
  return 'CL';
}

function initAuth() {
  const ctaGuest = document.getElementById('nav-cta-guest');
  const ctaUser = document.getElementById('nav-cta-user');

  if (isSessionValid()) {
    const nit = sessionStorage.getItem('bz_empresa_nit');
    const nombre = sessionStorage.getItem('bz_empresa_nombre');
    const plan = getCurrentPlan();
    const initials = getInitials(nombre, nit);
    const displayName = nombre || `Empresa ${nit}`;
    const planTag = plan && PLAN_META[plan] ? ` · PLAN ${PLAN_META[plan].shortName}` : ' · Sin plan';
    const displayNit = `NIT ${nit}${planTag}`;

    if (ctaGuest) ctaGuest.style.display = 'none';
    if (ctaUser) {
      ctaUser.style.display = 'flex';
      const elAvatar = document.getElementById('nav-user-avatar');
      const elName = document.getElementById('nav-user-name');
      const elNit = document.getElementById('nav-user-nit');
      if (elAvatar) elAvatar.textContent = initials;
      if (elName) {
        elName.textContent = displayName;
        elName.title = displayName;
      }
      if (elNit) elNit.textContent = displayNit;
    }
  } else {
    if (ctaGuest) ctaGuest.style.display = 'flex';
    if (ctaUser) ctaUser.style.display = 'none';
  }
  renderPlanStates();
}

function handleLogout() {
  sessionStorage.removeItem('bz_empresa_nit');
  sessionStorage.removeItem('bz_empresa_nombre');
  sessionStorage.removeItem('bz_empresa_plan');
  sessionStorage.removeItem('bz_empresa_token');
  sessionStorage.removeItem('bz_session_expires');
  localStorage.removeItem('bz_empresa_nit');
  localStorage.removeItem('bz_empresa_nombre');
  localStorage.removeItem('bz_empresa_token');

  const ctaGuest = document.getElementById('nav-cta-guest');
  const ctaUser = document.getElementById('nav-cta-user');
  if (ctaGuest) ctaGuest.style.display = 'flex';
  if (ctaUser) ctaUser.style.display = 'none';
  renderPlanStates();
}

const btnLogout = document.getElementById('nav-btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', handleLogout);
}

['click', 'keydown'].forEach(evt => {
  document.addEventListener(evt, () => {
    if (isSessionValid()) renewSessionActivity();
  }, { passive: true });
});
setInterval(initAuth, 30000);

// ==========================================================
// MODALES INFORMATIVOS Y PASARELA DE PAGO SIMULADA (DEMO)
// ==========================================================
function injectCheckoutStyles() {
  if (document.getElementById('bz-checkout-styles')) return;
  const st = document.createElement('style');
  st.id = 'bz-checkout-styles';
  st.textContent = `
    .bz-overlay { position:fixed; inset:0; background:rgba(15,17,23,0.68); backdrop-filter:blur(6px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; opacity:0; transition:opacity .2s ease; }
    .bz-overlay.show { opacity:1; }
    .bz-checkout-box { background:#ffffff; color:#0f1117; width:100%; max-width:500px; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,0.28); overflow:hidden; font-family:'Sora',sans-serif; transform:translateY(12px); transition:transform .22s ease; max-height:92vh; overflow-y:auto; }
    .bz-overlay.show .bz-checkout-box { transform:translateY(0); }
    .bz-chk-head { background:#123829; color:#ffffff; padding:18px 22px; display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #c9a646; }
    .bz-chk-head h3 { font-family:'Fraunces',serif; font-size:18px; font-weight:600; margin:0; }
    .bz-chk-badge { background:rgba(201,166,70,0.22); color:#f5dc92; font-size:11px; padding:4px 10px; border-radius:99px; font-weight:600; }
    .bz-chk-body { padding:22px; }
    .bz-chk-summary { background:#f5efe3; border:1px solid #e8dcc4; border-radius:10px; padding:14px 16px; margin-bottom:16px; }
    .bz-chk-summary-row { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:#5a5f72; margin-bottom:4px; }
    .bz-chk-bullets { margin:8px 0; padding-left:0; list-style:none; font-size:12px; color:#2b2b2b; }
    .bz-chk-bullets li { padding:2px 0; }
    .bz-chk-summary-total { display:flex; justify-content:space-between; align-items:center; font-size:16px; font-weight:600; color:#123829; margin-top:8px; padding-top:8px; border-top:1px solid #e8dcc4; }
    .bz-pay-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
    .bz-pay-tab { padding:9px 8px; border:1px solid rgba(15,17,23,0.14); border-radius:8px; background:#fff; font-size:12px; font-weight:600; cursor:pointer; text-align:center; color:#5a5f72; transition:all .15s; }
    .bz-pay-tab.active { border-color:#0a6f52; background:#d6f0e8; color:#0a6f52; }
    .bz-field { margin-bottom:12px; }
    .bz-field label { display:block; font-size:12px; font-weight:600; color:#123829; margin-bottom:4px; }
    .bz-field input, .bz-field select { width:100%; padding:10px 12px; border:1px solid rgba(15,17,23,0.16); border-radius:8px; font-size:13px; font-family:inherit; }
    .bz-field-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .bz-demo-fill { background:#fef3d0; color:#8c6d1f; border:1px dashed #c9a646; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; width:100%; margin-bottom:12px; text-align:center; }
    .bz-demo-fill:hover { background:#fae6a8; }
    .bz-chk-actions { display:flex; gap:10px; margin-top:16px; }
    .bz-btn-cancel { flex:1; padding:11px; border:1px solid rgba(15,17,23,0.16); background:#fff; color:#5a5f72; border-radius:8px; font-weight:600; cursor:pointer; }
    .bz-btn-pay { flex:2; padding:11px; border:none; background:#0a6f52; color:#fff; border-radius:8px; font-weight:600; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; }
    .bz-btn-pay:hover { background:#123829; }
    .bz-btn-pay:disabled { opacity:0.65; cursor:wait; }
    .plan-card.plan-active-card { outline:3px solid #0a6f52; position:relative; }
    .plan-selected-badge { display:inline-flex; align-items:center; gap:6px; background:#0a6f52; color:#ffffff; font-size:11px; font-weight:600; padding:4px 12px; border-radius:99px; margin-bottom:10px; }
    .plan-card.featured .plan-selected-badge { background:#4AE8A4; color:#0f1117; }
  `;
  document.head.appendChild(st);
}

function showSimpleAlert({ title, message, buttonText = 'Entendido', onConfirm = null }) {
  injectCheckoutStyles();
  const prev = document.getElementById('bz-custom-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.id = 'bz-custom-overlay';
  overlay.className = 'bz-overlay';
  overlay.innerHTML = `
    <div class="bz-checkout-box" style="max-width:420px;">
      <div class="bz-chk-head">
        <h3>${title}</h3>
        <span class="bz-chk-badge">BillZen ERP</span>
      </div>
      <div class="bz-chk-body" style="text-align:center;">
        <p style="font-size:14px;color:#5a5f72;line-height:1.55;margin-bottom:20px;">${message}</p>
        <button type="button" class="bz-btn-pay" style="width:100%;" id="bz-alert-ok">${buttonText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.querySelector('#bz-alert-ok').addEventListener('click', () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 180);
    if (typeof onConfirm === 'function') onConfirm();
  });
}

function openCheckoutModal(planKey) {
  injectCheckoutStyles();
  const normKey = normalizePlanCode(planKey) || 'basico';
  const meta = PLAN_META[normKey] || PLAN_META.basico;
  const nit = sessionStorage.getItem('bz_empresa_nit') || '';
  const empresa = sessionStorage.getItem('bz_empresa_nombre') || `NIT ${nit}`;

  const prev = document.getElementById('bz-custom-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.id = 'bz-custom-overlay';
  overlay.className = 'bz-overlay';

  const bulletsHtml = meta.bullets.map(b => `<li>${b}</li>`).join('');

  overlay.innerHTML = `
    <div class="bz-checkout-box">
      <div class="bz-chk-head">
        <h3>Pasarela de Pago · ${meta.name}</h3>
        <span class="bz-chk-badge">Modo Demo Seguro</span>
      </div>
      <div class="bz-chk-body">
        <div class="bz-chk-summary">
          <div class="bz-chk-summary-row"><span>Empresa:</span><strong>${empresa}</strong></div>
          <div class="bz-chk-summary-row"><span>NIT:</span><strong>${nit}</strong></div>
          <div class="bz-chk-summary-row"><span>Plan a activar en ERP y Nube:</span><strong>${meta.name} (★ PLAN ${meta.shortName})</strong></div>
          <ul class="bz-chk-bullets">${bulletsHtml}</ul>
          <div class="bz-chk-summary-total">
            <span>Total a pagar:</span>
            <span>${meta.priceLabel}</span>
          </div>
        </div>

        <div class="bz-pay-tabs">
          <button type="button" class="bz-pay-tab active" data-method="tarjeta">💳 Tarjeta</button>
          <button type="button" class="bz-pay-tab" data-method="pse">PSE</button>
          <button type="button" class="bz-pay-tab" data-method="nequi">Nequi</button>
        </div>

        <button type="button" class="bz-demo-fill" id="btn-autofill-demo">
          ⚡ Autocompletar datos de tarjeta de demostración
        </button>

        <div id="pay-form-tarjeta">
          <div class="bz-field">
            <label>Número de tarjeta</label>
            <input type="text" id="chk-card-num" placeholder="4532 •••• •••• 8891" maxlength="19" value="4532 8910 4421 8891" />
          </div>
          <div class="bz-field">
            <label>Nombre en la tarjeta</label>
            <input type="text" id="chk-card-name" placeholder="Nombre del titular" value="${empresa.toUpperCase()}" />
          </div>
          <div class="bz-field-row">
            <div class="bz-field">
              <label>Vencimiento (MM/AA)</label>
              <input type="text" id="chk-card-exp" placeholder="12/28" maxlength="5" value="12/28" />
            </div>
            <div class="bz-field">
              <label>CVV</label>
              <input type="password" id="chk-card-cvv" placeholder="•••" maxlength="4" value="842" />
            </div>
          </div>
        </div>

        <div id="pay-form-pse" style="display:none;">
          <div class="bz-field">
            <label>Selecciona tu Banco (PSE Colombia)</label>
            <select id="chk-pse-bank">
              <option value="Bancolombia">Bancolombia</option>
              <option value="Banco de Bogotá">Banco de Bogotá</option>
              <option value="Davivienda">Davivienda</option>
              <option value="BBVA Colombia">BBVA Colombia</option>
              <option value="Nequi / Daviplata">Nequi / Daviplata</option>
            </select>
          </div>
          <div class="bz-field">
            <label>Tipo de persona</label>
            <select><option>Persona Jurídica (Empresa)</option><option>Persona Natural</option></select>
          </div>
        </div>

        <div id="pay-form-nequi" style="display:none;">
          <div class="bz-field">
            <label>Número de celular Nequi</label>
            <input type="text" id="chk-nequi-tel" placeholder="300 123 4567" value="300 555 8910" />
          </div>
        </div>

        <div id="chk-error-msg" style="display:none;color:#c94040;font-size:12px;font-weight:600;margin-top:6px;"></div>

        <div class="bz-chk-actions">
          <button type="button" class="bz-btn-cancel" id="btn-chk-cancel">Cancelar</button>
          <button type="button" class="bz-btn-pay" id="btn-chk-confirm">
            🔒 Pagar ${meta.priceLabel} y Activar ${meta.name}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  let metodoElegido = 'tarjeta';

  overlay.querySelectorAll('.bz-pay-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.bz-pay-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      metodoElegido = tab.getAttribute('data-method');
      ['tarjeta', 'pse', 'nequi'].forEach(m => {
        const el = overlay.querySelector('#pay-form-' + m);
        if (el) el.style.display = (m === metodoElegido) ? 'block' : 'none';
      });
    });
  });

  const btnAutofill = overlay.querySelector('#btn-autofill-demo');
  if (btnAutofill) {
    btnAutofill.addEventListener('click', () => {
      const n = overlay.querySelector('#chk-card-num');
      const nm = overlay.querySelector('#chk-card-name');
      const ex = overlay.querySelector('#chk-card-exp');
      const cv = overlay.querySelector('#chk-card-cvv');
      if (n) n.value = '4532 8910 4421 8891';
      if (nm) nm.value = empresa.toUpperCase();
      if (ex) ex.value = '12/28';
      if (cv) cv.value = '842';
    });
  }

  const closeModal = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 180);
  };

  overlay.querySelector('#btn-chk-cancel').addEventListener('click', closeModal);

  const btnConfirm = overlay.querySelector('#btn-chk-confirm');
  btnConfirm.addEventListener('click', async () => {
    const errEl = overlay.querySelector('#chk-error-msg');
    errEl.style.display = 'none';
    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Procesando pago y activando ' + meta.name + '...';

    try {
      const refPago = 'BZ-DEMO-' + Math.floor(100000 + Math.random() * 900000);
      const res = await fetch(`${BZ_API_URL}/plan/seleccionar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nit: nit,
          plan: meta.code,
          metodo_pago: metodoElegido,
          referencia_pago: refPago
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'No se pudo registrar el plan en la base de datos.');
      }

      const data = await res.json();
      const planGuardado = normalizePlanCode(data.plan || meta.code) || meta.code;
      sessionStorage.setItem('bz_empresa_plan', planGuardado);
      renewSessionActivity();
      initAuth();

      btnConfirm.style.background = '#059669';
      btnConfirm.textContent = '✓ ¡' + meta.name + ' Activado! Redirigiendo a descarga...';

      setTimeout(() => {
        closeModal();
        const dlSection = document.getElementById('descargar');
        if (dlSection) {
          dlSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 900);
    } catch (err) {
      btnConfirm.disabled = false;
      btnConfirm.textContent = 'Pagar ' + meta.priceLabel + ' y Activar ' + meta.name;
      errEl.textContent = err.message || 'Error de conexión con el servidor.';
      errEl.style.display = 'block';
    }
  });
}

// ==========================================================
// VINCULACIÓN DE TARJETAS DE PLANES Y SECCIÓN DE DESCARGA
// ==========================================================
function setupPlanCardsAndBanner() {
  injectCheckoutStyles();
  const cards = document.querySelectorAll('#planes .plan-card');
  const mapping = ['basico', 'standart', 'ultra'];

  const cardConfigs = {
    basico: {
      title: 'Plan Básico',
      priceHtml: '<span>$</span>49.9K',
      period: 'COP / mes &bull; 1 Admin + 1 Cajero',
      features: [
        { ok: true, text: 'Facturación POS Local (Tirilla de venta)' },
        { ok: true, text: 'Catálogo de Productos e Inventario' },
        { ok: true, text: '1 Usuario Cajero activo (+ Administrador)' },
        { ok: false, text: 'Sin Facturación Electrónica DIAN' },
        { ok: false, text: 'Sin Contabilidad, Reportes ni Auditoría Móvil' }
      ]
    },
    standart: {
      title: 'Plan Standard',
      priceHtml: '<span>$</span>119.9K',
      period: 'COP / mes &bull; Cajeros ilimitados',
      features: [
        { ok: true, text: 'Facturación Electrónica DIAN Certificada (CUFE)', featured: true },
        { ok: true, text: 'Contabilidad (Gastos y Estado de Resultados P&G)', featured: true },
        { ok: true, text: 'Reportes Analíticos + Exportación CSV / Excel', featured: true },
        { ok: true, text: 'Usuarios Cajeros Ilimitados (+ Administrador)', featured: true },
        { ok: false, text: 'Sin Auditoría Remota Móvil (QR)', featured: true }
      ]
    },
    ultra: {
      title: 'Plan Ultra',
      priceHtml: '<span>$</span>199.9K',
      period: 'COP / mes &bull; Todo incluido sin límites',
      features: [
        { ok: true, text: '100% del Stack Completo Desbloqueado' },
        { ok: true, text: '📱 Auditoría Remota Móvil en Vivo (QR + App Kotlin)' },
        { ok: true, text: 'Facturación Electrónica DIAN Certificada (CUFE)' },
        { ok: true, text: 'Contabilidad (P&G), Reportes y Cajeros Ilimitados' },
        { ok: true, text: 'Soporte Prioritario 24/7' }
      ]
    }
  };

  cards.forEach((card, idx) => {
    const planKey = mapping[idx] || 'basico';
    const cfg = cardConfigs[planKey];
    card.setAttribute('data-plan-key', planKey);

    const nameEl = card.querySelector('.plan-name');
    const priceEl = card.querySelector('.plan-price');
    const periodEl = card.querySelector('.plan-period');
    const ulEl = card.querySelector('.plan-features');

    if (nameEl) nameEl.textContent = cfg.title;
    if (priceEl) priceEl.innerHTML = cfg.priceHtml;
    if (periodEl) periodEl.innerHTML = cfg.period;
    if (ulEl) {
      ulEl.innerHTML = cfg.features.map(f => {
        if (f.ok) {
          const checkStyle = f.featured ? 'style="background:rgba(74,232,164,0.15)"' : '';
          const strokeCol = f.featured ? '#4AE8A4' : 'var(--accent)';
          return `<li class="plan-feature"><div class="plan-feature-check" ${checkStyle}><svg viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="${strokeCol}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>${f.text}</li>`;
        } else {
          const crossStyle = f.featured ? 'style="background:rgba(255,255,255,0.06)"' : '';
          const strokeCol = f.featured ? 'rgba(255,255,255,0.35)' : 'var(--text3)';
          return `<li class="plan-feature"><div class="plan-feature-check feat-cross" ${crossStyle}><svg viewBox="0 0 10 10" fill="none"><path d="M3 3l4 4M7 3l-4 4" stroke="${strokeCol}" stroke-width="1.5" stroke-linecap="round"/></svg></div>${f.text}</li>`;
        }
      }).join('');
    }

    let badge = card.querySelector('.plan-selected-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'plan-selected-badge';
      badge.style.display = 'none';
      badge.innerHTML = '&#x2713; Plan Seleccionado';
      card.insertBefore(badge, card.firstChild);
    }

    const btn = card.querySelector('a.btn, button.btn');
    if (btn) {
      btn.setAttribute('data-plan', planKey);
      btn.setAttribute('href', '#planes');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isSessionValid()) {
          window.location.href = `login.html?redirect=planes&plan=${planKey}#register`;
          return;
        }
        openCheckoutModal(planKey);
      });
    }
  });

  const dlHead = document.querySelector('#descargar .section-head');
  if (dlHead && !document.getElementById('dl-plan-banner')) {
    const banner = document.createElement('div');
    banner.id = 'dl-plan-banner';
    banner.style.cssText = 'max-width:580px;margin:18px auto 0;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:500;display:none;';
    dlHead.appendChild(banner);
  }

  renderPlanStates();
}

function renderPlanStates() {
  const planActual = getCurrentPlan();
  const logged = isSessionValid();
  const cards = document.querySelectorAll('#planes .plan-card');

  cards.forEach(card => {
    const key = card.getAttribute('data-plan-key');
    const badge = card.querySelector('.plan-selected-badge');
    const btn = card.querySelector('a.btn, button.btn');
    const esSeleccionado = logged && planActual && key === planActual;
    const meta = PLAN_META[key] || PLAN_META.basico;

    card.classList.toggle('plan-active-card', Boolean(esSeleccionado));
    if (badge) {
      badge.style.display = esSeleccionado ? 'inline-flex' : 'none';
    }
    if (btn) {
      if (esSeleccionado) {
        btn.textContent = '✓ Plan Seleccionado · Ir a Descargar';
      } else {
        btn.textContent = meta.buttonLabel;
      }
    }
  });

  const banner = document.getElementById('dl-plan-banner');
  if (banner) {
    if (!logged) {
      banner.style.display = 'block';
      banner.style.background = '#fef3d0';
      banner.style.color = '#8c6d1f';
      banner.style.border = '1px solid #c9a646';
      banner.innerHTML = 'Para descargar <strong>BillZen ERP</strong> primero debes <a href="login.html?redirect=planes#register" style="color:#0a6f52;font-weight:700;text-decoration:underline;">iniciar sesión o registrarte</a> y seleccionar un plan.';
    } else if (!planActual || !PLAN_META[planActual]) {
      banner.style.display = 'block';
      banner.style.background = '#fef3d0';
      banner.style.color = '#8c6d1f';
      banner.style.border = '1px solid #c9a646';
      banner.innerHTML = 'Aún no has seleccionado ningún plan para tu empresa. <a href="#planes" style="color:#0a6f52;font-weight:700;text-decoration:underline;">Haz clic aquí para elegir tu plan</a> antes de descargar.';
    } else {
      const m = PLAN_META[planActual];
      banner.style.display = 'block';
      banner.style.background = '#d6f0e8';
      banner.style.color = '#0a6f52';
      banner.style.border = '1px solid #0a6f52';
      banner.innerHTML = `&#x2713; <strong>${m.name} (★ PLAN ${m.shortName}) Seleccionado</strong> — Tu licencia está activa en Neon.tech. Ya puedes descargar el instalador abajo.`;
    }
  }
}

async function syncPlanFromBackend() {
  if (!isSessionValid()) return;
  const nit = sessionStorage.getItem('bz_empresa_nit');
  if (!nit) return;
  try {
    const r = await fetch(`${BZ_API_URL}/plan/estado?nit=${encodeURIComponent(nit)}`);
    if (r.ok) {
      const d = await r.json();
      sessionStorage.setItem('bz_empresa_plan', normalizePlanCode(d.plan || ''));
      initAuth();
    }
  } catch (_e) {
    // Silencioso si el servidor no responde aún
  }
}

setupPlanCardsAndBanner();
initAuth();
syncPlanFromBackend().then(() => {
  const params = new URLSearchParams(window.location.search);
  const checkoutPlan = normalizePlanCode(params.get('checkout') || '');
  const aviso = params.get('aviso');
  if (isSessionValid() && checkoutPlan && PLAN_META[checkoutPlan]) {
    openCheckoutModal(checkoutPlan);
    window.history.replaceState({}, document.title, window.location.pathname + '#planes');
  } else if (aviso === 'sin_plan') {
    showSimpleAlert({
      title: 'Elige tu plan para continuar',
      message: 'Selecciona uno de nuestros planes (Plan Básico, Plan Standard o Plan Ultra) para activar tu licencia y habilitar la descarga de BillZen ERP.',
      buttonText: 'Ver Planes',
      onConfirm: () => {
        const el = document.getElementById('planes');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
    window.history.replaceState({}, document.title, window.location.pathname + '#planes');
  }
});

// ==========================================================
// DESCARGAS (BLOQUEADO SI NO HAY SESIÓN O SI NO HA ELEGIDO PLAN)
// ==========================================================
(function initDownloads() {
  const section = document.getElementById('descargar');
  if (!section) return;

  const baseUrl = 'https://github.com/bill-zen-desarrollo/bill_zen_users/releases/download/1.0/';

  const btnWindows = document.getElementById('dl-btn-windows');
  const btnAndroid = document.getElementById('dl-btn-android');

  function handleDownloadClick(e, file) {
    e.preventDefault();
    if (!isSessionValid()) {
      window.location.href = 'login.html?redirect=descargar#register';
      return;
    }

    const planElegido = getCurrentPlan();
    if (!planElegido || !PLAN_META[planElegido]) {
      showSimpleAlert({
        title: 'Selecciona un plan antes de descargar',
        message: 'Para descargar BillZen ERP primero debes elegir el plan para tu empresa (Plan Básico, Plan Standard o Plan Ultra). Te llevaremos a la sección de planes.',
        buttonText: 'Ir a seleccionar mi plan',
        onConfirm: () => {
          const secPlanes = document.getElementById('planes');
          if (secPlanes) secPlanes.scrollIntoView({ behavior: 'smooth' });
        }
      });
      return;
    }

    renewSessionActivity();
    window.location.href = baseUrl + file;
  }

  if (btnWindows) {
    btnWindows.addEventListener('click', (e) => handleDownloadClick(e, 'BillZen.exe'));
  }
  if (btnAndroid) {
    btnAndroid.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'proximamente.html';
    });
  }
})();
