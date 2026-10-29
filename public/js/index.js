// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Nav highlight on scroll
const sections = document.querySelectorAll('section[id], .stats-bar');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 100) current = s.id || '';
  });
  navLinks.forEach(a => {
    const href = a.getAttribute('href');
    // Solo marcar activo los links internos (#seccion), nunca los externos
    if (href && href.startsWith('#')) {
      a.classList.toggle('active', href === '#' + current);
    }
  });
  // Nav shadow on scroll
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.style.boxShadow =
      window.scrollY > 20 ? '0 2px 20px rgba(15,17,23,0.08)' : 'none';
  }
});

// Period buttons (pricing toggle demo)
document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.period-selector').querySelectorAll('.period-btn')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Form submit
function handleSubmit(btn) {
  btn.textContent = 'Enviando...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Solicitud enviada con éxito';
    btn.style.background = '#085e45';
  }, 1200);
}

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
// AUTENTICACIÓN & VISTA DE CLIENTE EN NAVBAR
// ==========================================================
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
  const nit = sessionStorage.getItem('bz_empresa_nit') || localStorage.getItem('bz_empresa_nit');
  const nombre = sessionStorage.getItem('bz_empresa_nombre') || localStorage.getItem('bz_empresa_nombre');

  const ctaGuest = document.getElementById('nav-cta-guest');
  const ctaUser = document.getElementById('nav-cta-user');

  if (nit) {
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
  localStorage.removeItem('bz_empresa_nit');
  localStorage.removeItem('bz_empresa_nombre');
  localStorage.removeItem('bz_empresa_token');

  initAuth();
}

// Listener para cerrar sesión
const btnLogout = document.getElementById('nav-btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', handleLogout);
}

// Inicializar estado de autenticación al cargar
initAuth();

// ==========================================================
// DESCARGAS
// ==========================================================
(function initDownloads() {
  const section = document.getElementById('descargar');
  if (!section) return;

  const baseUrl = 'https://github.com/bill-zen-desarrollo/bill_zen_users/releases/download/1.0/';
  
  const btnWindows = document.getElementById('dl-btn-windows');
  const btnAndroid = document.getElementById('dl-btn-android');
  
  function handleDownloadClick(e, file) {
    const nit = sessionStorage.getItem('bz_empresa_nit') || localStorage.getItem('bz_empresa_nit') || sessionStorage.getItem('bz_empresa_token');
    
    if (!nit) {
      e.preventDefault();
      // Redirigir al registro/login con parámetro de retorno a descargas
      window.location.href = 'login.html?redirect=descargar#register';
    } else {
      e.preventDefault();
      window.location.href = baseUrl + file;
    }
  }

  if (btnWindows) {
    btnWindows.addEventListener('click', (e) => handleDownloadClick(e, 'BillZen.exe'));
  }
  if (btnAndroid) {
    btnAndroid.addEventListener('click', (e) => handleDownloadClick(e, 'billzenERP.apk'));
  }
})();
