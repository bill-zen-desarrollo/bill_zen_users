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
        
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const target = urlParams.get('redirect') === 'descargar' ? '#descargar' : '';
          window.location.href = `index.html${target}`; 
        }, 800);

      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.mensaje || 'Credenciales incorrectas');
      }

    } catch (error) {
      console.error('Error de autenticación:', error);
      alert(`Error: ${error.message}`);
      
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

function socialAuth(provider) {
  alert('Integración con ' + provider + ' estará disponible próximamente.');
}

function forgotPw(e) {
  e.preventDefault();
  const val = document.getElementById('lg-email').value.trim();
  if (val) {
    alert('Se enviará un enlace de recuperación para el NIT: ' + val);
  } else {
    document.getElementById('lg-email').focus();
    alert('Ingresa tu NIT primero.');
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
  const termsCheckbox = document.getElementById('rg-terms');

  if (!emailInput.value.trim() || !pwInput.value || !nitInput.value.trim() || !termsCheckbox.checked) {
    alert("Por favor completa los campos requeridos y acepta los términos.");
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

          setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const target = urlParams.get('redirect') === 'descargar' ? '#descargar' : '';
            window.location.href = `index.html${target}`;
          }, 800);
          return;
        }
      } catch (autoErr) {
        console.warn('Auto-login post-registro no pudo completarse:', autoErr);
      }

      // Si falla el auto-login por alguna anomalía de red, fallback a pestaña de login
      alert("Registro exitoso. Por favor ingresa tu contraseña para iniciar sesión.");
      switchTab('login');
      document.getElementById('lg-email').value = nitInput.value.trim();
      document.getElementById('rg-form').reset();
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error en el registro');
    }
  } catch (error) {
    console.error('Error de registro:', error);
    alert(`Error: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnText;
  }
}

if(window.location.hash === '#register') { setTimeout(() => switchTab('register'), 100); }

