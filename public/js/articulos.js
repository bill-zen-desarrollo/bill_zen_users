// Reading progress bar
const bar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const total = document.body.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  bar.style.width = Math.min(pct, 100) + '%';
});

// Scroll fade-up
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

// Nav shadow on scroll
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

// Share copy link
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