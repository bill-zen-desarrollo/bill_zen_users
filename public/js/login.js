// ==========================================
// CONFIGURACIÓN DE RED
// ==========================================
// Utiliza la constante API_BASE_URL provista por js/config.js
const API_URL = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://127.0.0.1:8000/api';

/* ---- Tab switching ---- */
function switchTab(tab) {
  ['login','register'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === tab);
    document.getElementById('tab-' + t).setAttribute('aria-selected', t === tab);
    document.getElementById('panel-' + t).classList.toggle('active', t === tab);
  });
  const hint = document.getElementById('switch-hint');
  if (tab === 'login') {
    hint.innerHTML = '¿No tienes cuenta? <a href="#" onclick="switchTab(\'register\');return false;" id="switch-link">Regístrate gratis</a>';
  } else {
    hint.innerHTML = '¿Ya tienes cuenta? <a href="#" onclick="switchTab(\'login\');return false;" id="switch-link">Inicia sesión</a>';
  }
  const card = document.getElementById('auth-card');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'fadeSlideUp 0.38s cubic-bezier(0.22,1,0.36,1) both';
}

/* ---- Password visibility ---- */
function toggleEye(inputId, btn) {
  const el = document.getElementById(inputId);
  const isText = el.type === 'text';
  el.type = isText ? 'password' : 'text';
  btn.style.color = isText ? '' : 'var(--accent)';
}

/* ---- Password strength ---- */
function updateStrength(val) {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const cls = score <= 1 ? 'level-1' : score === 2 ? 'level-2' : score === 3 ? 'level-3' : 'level-4';
  [1,2,3,4].forEach(i => {
    const bar = document.getElementById('pb' + i);
    bar.className = 'pw-bar' + (i <= score ? ' ' + cls : '');
  });
}

// ==========================================
// INTEGRACIÓN CON BACKEND: LOGIN
// ==========================================
async function handleLogin(e) {
  e.preventDefault();
  let ok = true;
  
  const nitInput = document.getElementById('lg-email'); // Usado para el NIT en el HTML
  const pwInput = document.getElementById('lg-pw');
  const btn = document.getElementById('lg-btn');

  clearErr('lg-email-grp'); clearErr('lg-pw-grp');
  
  if (!nitInput.value.trim()) { setErr('lg-email-grp'); ok = false; }
  if (!pwInput.value) { setErr('lg-pw-grp'); ok = false; }

  if (ok) {
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Conectando...';

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nit: nitInput.value.trim(),
          password: pwInput.value
        })
      });

      if (response.ok) {
        const data = await response.json();
        const nitVal = nitInput.value.trim();
        const nombreVal = data.nombre_empresa || `NIT ${nitVal}`;
        
        sessionStorage.setItem('bz_empresa_nit', nitVal);
        sessionStorage.setItem('bz_empresa_nombre', nombreVal);
        localStorage.setItem('bz_empresa_nit', nitVal);
        localStorage.setItem('bz_empresa_nombre', nombreVal);
        
        btn.style.background = '#059669';
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Acceso concedido';
        
        showModal({
          type: 'success',
          title: 'Inicio de sesión exitoso',
          message: `Bienvenido, ${nombreVal}. Te estamos redirigiendo.`,
          confirmText: 'Continuar',
          autoCloseMs: 1800,
          onClose: () => {
            const urlParams = new URLSearchParams(window.location.search);
            const target = urlParams.get('redirect') === 'descargar' ? '#descargar' : '';
            window.location.href = `index.html${target}`;
          }
        });

      } else {
        // No se propaga el detalle del backend (p. ej. "contraseña inválida"):
        // un mensaje genérico evita revelar si el NIT existe o no.
        const err = new Error('Credenciales incorrectas');
        err.status = response.status;
        throw err;
      }

    } catch (error) {
      console.error('Error de autenticación:', error);

      if (error instanceof TypeError) {
        showModal({
          type: 'error',
          title: 'Sin conexión con el servidor',
          message: 'No fue posible conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
        });
      } else if (error.status >= 500) {
        showModal({
          type: 'error',
          title: 'Error del servidor',
          message: 'Ocurrió un problema de nuestro lado. Intenta nuevamente en unos minutos.'
        });
      } else {
        showModal({
          type: 'error',
          title: 'Credenciales incorrectas',
          message: 'El NIT o la contraseña no coinciden. Verifica tus datos e intenta de nuevo.'
        });
      }
      
      btn.disabled = false;
      btn.style.background = 'var(--accent)';
      btn.innerHTML = originalBtnText;
      setErr('lg-email-grp'); 
      setErr('lg-pw-grp');
    }
  }
}

/* ---- Manejadores de interfaz adicionales ---- */
function setErr(grpId) { document.getElementById(grpId).classList.add('has-err'); }
function clearErr(grpId) { document.getElementById(grpId).classList.remove('has-err'); }

/* ---- Modal de información (reemplaza alert() nativo) ----
   type: 'success' | 'error' | 'warning' | 'info'
   autoCloseMs: cierra solo tras N ms (útil en éxito + redirección)
   onClose: se ejecuta UNA sola vez al cerrar (botón, Esc, fondo o auto-cierre) */
const MODAL_ICONS = {
  success: '<polyline points="20 6 9 17 4 12"/>',
  error:   '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  warning: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
  info:    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
};

function showModal({ type = 'info', title = '', message = '', confirmText = 'Aceptar', autoCloseMs = 0, onClose = null }) {
  // Solo un modal a la vez
  const prev = document.getElementById('bz-modal');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.id = 'bz-modal';
  overlay.className = 'bz-modal-overlay';
  overlay.innerHTML =
    '<div class="bz-modal bz-modal--' + type + '" role="dialog" aria-modal="true" aria-labelledby="bz-modal-title" aria-describedby="bz-modal-msg">' +
      '<div class="bz-modal-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (MODAL_ICONS[type] || MODAL_ICONS.info) + '</svg></div>' +
      '<h3 class="bz-modal-title" id="bz-modal-title"></h3>' +
      '<p class="bz-modal-msg" id="bz-modal-msg"></p>' +
      '<button type="button" class="bz-modal-btn"></button>' +
      (autoCloseMs > 0 ? '<div class="bz-modal-progress"><span style="animation-duration:' + autoCloseMs + 'ms"></span></div>' : '') +
    '</div>';

  // textContent evita inyección de HTML con mensajes que vienen del servidor
  overlay.querySelector('#bz-modal-title').textContent = title;
  overlay.querySelector('#bz-modal-msg').textContent = message;
  const btn = overlay.querySelector('.bz-modal-btn');
  btn.textContent = confirmText;

  let closed = false;
  let timer = null;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 180);
    if (typeof onClose === 'function') onClose();
  };
  const onKey = (ev) => { if (ev.key === 'Escape' || ev.key === 'Enter') { ev.preventDefault(); close(); } };

  btn.addEventListener('click', close);
  overlay.addEventListener('click', (ev) => { if (ev.target === overlay) close(); });
  document.addEventListener('keydown', onKey);

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  btn.focus();
  if (autoCloseMs > 0) timer = setTimeout(close, autoCloseMs);
}

function socialAuth(provider) {
  showModal({
    type: 'info',
    title: 'Próximamente',
    message: 'El acceso con ' + provider + ' estará disponible muy pronto.'
  });
}

function forgotPw(e) {
  e.preventDefault();
  const val = document.getElementById('lg-email').value.trim();
  if (val) {
    showModal({
      type: 'info',
      title: 'Recuperación de contraseña',
      message: 'Se enviará un enlace de recuperación para el NIT ' + val + '.'
    });
  } else {
    showModal({
      type: 'warning',
      title: 'NIT requerido',
      message: 'Ingresa el NIT de tu empresa para recuperar tu contraseña.',
      onClose: () => document.getElementById('lg-email').focus()
    });
  }
}

// ==========================================
// INTEGRACIÓN CON BACKEND: REGISTRO
// ==========================================
async function handleRegister(e) {
  e.preventDefault();
  let ok = true;

  const razonSocialInput = document.getElementById('rg-co');
  const nitInput = document.getElementById('rg-nit');
  const nombresInput = document.getElementById('rg-fn');
  const apellidosInput = document.getElementById('rg-ln');
  const emailInput = document.getElementById('rg-em');
  const pwInput = document.getElementById('rg-pw');
  const btn = document.getElementById('rg-btn');

  if (!emailInput.value.trim() || !pwInput.value || !nitInput.value.trim()) {
    showModal({
      type: 'warning',
      title: 'Datos incompletos',
      message: 'Completa los campos obligatorios (NIT, correo y contraseña) para continuar.'
    });
    return;
  }

  const originalBtnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Registrando...';

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razon_social: razonSocialInput.value.trim(),
        nit: nitInput.value.trim(),
        nombres_admin: nombresInput.value.trim(),
        apellidos_admin: apellidosInput.value.trim(),
        email: emailInput.value.trim(),
        password: pwInput.value
      })
    });

    if (response.ok) {
      btn.style.background = '#059669';
      btn.innerHTML = '<div class="spinner"></div> Conectando...';

      // Intentar inicio de sesión automático tras registro
      try {
        const loginRes = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nit: nitInput.value.trim(),
            password: pwInput.value
          })
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          const nitVal = nitInput.value.trim();
          const nombreVal = loginData.nombre_empresa || razonSocialInput.value.trim() || `NIT ${nitVal}`;

          sessionStorage.setItem('bz_empresa_nit', nitVal);
          sessionStorage.setItem('bz_empresa_nombre', nombreVal);
          localStorage.setItem('bz_empresa_nit', nitVal);
          localStorage.setItem('bz_empresa_nombre', nombreVal);

          btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ¡Registro exitoso!';

          const redirectAfterRegister = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const target = urlParams.get('redirect') === 'descargar' ? '#descargar' : '';
            window.location.href = `index.html${target}`;
          };
          showModal({
            type: 'success',
            title: 'Registro exitoso',
            message: `Tu cuenta para ${nombreVal} fue creada correctamente. Te estamos redirigiendo.`,
            confirmText: 'Continuar',
            autoCloseMs: 2200,
            onClose: redirectAfterRegister
          });
          return;
        }
      } catch (autoErr) {
        console.warn('Auto-login post-registro no pudo completarse:', autoErr);
      }

      // Si falla el auto-login por alguna anomalía de red, fallback a pestaña de login
      const fallbackNit = nitInput.value.trim();
      showModal({
        type: 'success',
        title: 'Registro exitoso',
        message: 'Tu cuenta fue creada. Ingresa tu contraseña para iniciar sesión.',
        confirmText: 'Iniciar sesión',
        onClose: () => {
          switchTab('login');
          document.getElementById('lg-email').value = fallbackNit;
        }
      });
      document.getElementById('rg-form').reset();
    } else {
      const errorData = await response.json().catch(() => ({}));
      // FastAPI devuelve 'detail' como string (errores de negocio) o lista (validación 422)
      const detail = typeof errorData.detail === 'string' ? errorData.detail : '';
      const err = new Error(detail || 'Verifica los datos ingresados e intenta nuevamente.');
      err.status = response.status;
      throw err;
    }
  } catch (error) {
    console.error('Error de registro:', error);
    showModal({
      type: 'error',
      title: 'No se pudo completar el registro',
      message: error instanceof TypeError
        ? 'No fue posible conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
        : error.message
    });
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnText;
  }
}

if(window.location.hash === '#register') { setTimeout(() => switchTab('register'), 100); }

