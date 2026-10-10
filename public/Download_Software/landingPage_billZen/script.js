document.addEventListener('DOMContentLoaded', () => {

    /* ===== Navbar scroll + botón arriba ===== */
    const navbar = document.getElementById('navbar');
    const toTop = document.getElementById('toTop');
    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        toTop.classList.toggle('show', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    /* ===== Menú móvil ===== */
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

    /* ===== Carrusel ===== */
    const carousel = document.getElementById('carousel');
    const track = carousel.querySelector('.carousel-track');
    const slides = track.children;
    const dotsBox = carousel.querySelector('.carousel-dots');
    let index = 0, timer;

    [...slides].forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Ir a la imagen ${i + 1}`);
        dot.addEventListener('click', () => { goTo(i); restart(); });
        dotsBox.appendChild(dot);
    });
    const dots = dotsBox.children;

    function goTo(i) {
        index = (i + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        [...dots].forEach((d, k) => d.classList.toggle('active', k === index));
    }
    const restart = () => { clearInterval(timer); timer = setInterval(() => goTo(index + 1), 5000); };

    carousel.querySelector('.next').addEventListener('click', () => { goTo(index + 1); restart(); });
    carousel.querySelector('.prev').addEventListener('click', () => { goTo(index - 1); restart(); });
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', restart);

    // Swipe táctil
    let startX = 0;
    carousel.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
    carousel.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 50) { goTo(index + (diff < 0 ? 1 : -1)); restart(); }
    });
    restart();

    /* ===== Pestañas de módulos ===== */
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    /* ===== Animación de aparición + contadores ===== */
    const animateCounter = el => {
        const target = +el.dataset.target;
        const duration = 1800;
        const start = performance.now();
        const step = now => {
            const p = Math.min((now - start) / duration, 1);
            el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString('es');
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            const counter = entry.target.querySelector('.counter');
            if (counter) animateCounter(counter);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    /* ===== Toast ===== */
    const toast = document.getElementById('toast');
    const showToast = msg => {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    };

    document.querySelectorAll('.download-link').forEach(link => {
        link.addEventListener('click', () => showToast('✔ Tu descarga de Bill Zen ha comenzado. ¡Gracias!'));
    });

    document.getElementById('contactForm').addEventListener('submit', e => {
        e.preventDefault();
        e.target.reset();
        showToast('✉ ¡Gracias! Pronto te contactaremos.');
    });

    document.getElementById('year').textContent = new Date().getFullYear();
});
