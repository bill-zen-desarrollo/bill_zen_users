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
if (hamburger) {
  hamburger.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
  });
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('nav')) {
    const nl = document.querySelector('.nav-links');
    if (nl) nl.classList.remove('open');
  }
});

// ==========================================================
// DESCARGAS
// ==========================================================
(function initDownloads() {
  const section = document.getElementById('descargar');
  if (!section) return;

  const baseUrl = 'https://github.com/JuanCaRojas-18/JuanCaRojas-18.github.io/releases/latest/download/';
  
  const btnWindows = document.getElementById('dl-btn-windows');
  const btnAndroid = document.getElementById('dl-btn-android');
  
  function handleDownloadClick(e, file) {
    const token = sessionStorage.getItem('bz_empresa_token') || sessionStorage.getItem('bz_empresa_nit');
    
    if (!token) {
      e.preventDefault();
      window.location.href = 'login.html#register';
    } else {
      e.preventDefault();
      window.location.href = baseUrl + file;
    }
  }

  if (btnWindows) {
    btnWindows.addEventListener('click', (e) => handleDownloadClick(e, 'billzenERP.exe'));
  }
  if (btnAndroid) {
    btnAndroid.addEventListener('click', (e) => handleDownloadClick(e, 'billzenERP.apk'));
  }
})();
