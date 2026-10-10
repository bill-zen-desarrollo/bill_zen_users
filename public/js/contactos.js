// Scroll fade-up
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

// Nav shadow
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.boxShadow =
    window.scrollY > 20 ? '0 2px 20px rgba(15,17,23,0.08)' : 'none';
});

// Hamburger (mobile)
const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
  document.getElementById('nav-links-menu').classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('nav')) {
    document.getElementById('nav-links-menu').classList.remove('open');
  }
});

// Tabs
function switchTab(btn, type) {
  document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const placeholders = {
    demo: 'Cuentanos sobre tu empresa y te agendamos una demo...',
    soporte: 'Describe el problema tecnico que estas experimentando...',
    ventas: 'Cuentanos sobre tu empresa y lo que necesitas...'
  };
  document.getElementById('mensaje').placeholder = placeholders[type];
}

// Plan selector
function selectPlan(el) {
  document.querySelectorAll('.plan-opt').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

// FAQ toggle
function toggleFaq(question) {
  const item = question.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// Form submit
function handleSubmit() {
  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const mensaje = document.getElementById('mensaje').value.trim();

  if (!nombre || !correo || !mensaje) {
    const empties = [];
    if (!nombre) empties.push('nombre');
    if (!correo) empties.push('correo');
    if (!mensaje) empties.push('mensaje');
    empties.forEach(id => {
      const el = document.getElementById(id);
      el.style.borderColor = '#c94040';
      el.addEventListener('input', () => el.style.borderColor = '', { once: true });
    });
    return;
  }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = 'Enviando...';
  setTimeout(() => {
    document.getElementById('form-content').style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
  }, 1400);
}