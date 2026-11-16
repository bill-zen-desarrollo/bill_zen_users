const bar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const total = document.body.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  bar.style.width = Math.min(pct, 100) + '%';
});


const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));


window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.boxShadow =
    window.scrollY > 20 ? '0 2px 20px rgba(15,17,23,0.08)' : 'none';
});

// Hamburger (mobile)
const hamburger = document.getElementById('hamburger');
const navLinksMenu = document.getElementById('nav-links-menu');
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
    if (navLinksMenu) navLinksMenu.classList.remove('open');
  }
});

// ==========================================================
// AUTENTICACIÓN TEMPORAL & EXPIRACIÓN DE SESIÓN (BLOG)
// ==========================================================
const SESSION_DURATION_MS = 15 * 60 * 1000;

localStorage.removeItem('bz_empresa_nit');
localStorage.removeItem('bz_empresa_nombre');
localStorage.removeItem('bz_empresa_token');

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
    const initials = getInitials(nombre, nit);
    const displayName = nombre || `Empresa ${nit}`;
    const displayNit = `NIT ${nit}`;

    // Vista de cliente autenticado
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
    // Vista de visitante no autenticado
    if (ctaGuest) ctaGuest.style.display = 'flex';
    if (ctaUser) ctaUser.style.display = 'none';
  }
}

function handleLogout() {
  sessionStorage.removeItem('bz_empresa_nit');
  sessionStorage.removeItem('bz_empresa_nombre');
  sessionStorage.removeItem('bz_empresa_token');
  sessionStorage.removeItem('bz_session_expires');
  localStorage.removeItem('bz_empresa_nit');
  localStorage.removeItem('bz_empresa_nombre');
  localStorage.removeItem('bz_empresa_token');

  const ctaGuest = document.getElementById('nav-cta-guest');
  const ctaUser = document.getElementById('nav-cta-user');
  if (ctaGuest) ctaGuest.style.display = 'flex';
  if (ctaUser) ctaUser.style.display = 'none';
}

// Listener para cerrar sesión
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

// Inicializar estado de autenticación al cargar blog.html
initAuth();

document.querySelectorAll('.share-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (btn.title === 'Copiar enlace') {
      e.preventDefault();
      navigator.clipboard.writeText(window.location.href).then(() => {
        btn.textContent = '\u2713';
        setTimeout(() => btn.textContent = '\uD83D\uDCCB', 1500);
      });
    }
  });
});
