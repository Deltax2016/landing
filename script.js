/* ============================================
   СУТКИ. — interactions
   ============================================ */

(() => {
  const isTouch = matchMedia('(hover: none)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- INTRO LOADER ---------- */
  const intro = document.querySelector('.intro');
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (intro) intro.classList.add('is-out');
      document.body.classList.add('intro-done');
      setTimeout(() => {
        initialReveal();
        startObservers();
      }, 200);
    }, 950);
  });

  /* ---------- MAGNETIC BUTTONS ---------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      let rect;
      const strength = el.classList.contains('btn') ? 0.28 : 0.18;
      el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2)  * strength;
        const y = (e.clientY - rect.top  - rect.height / 2) * strength;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  /* ---------- SERVICE CARD MOUSE GLOW ---------- */
  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- TEXT REVEAL + STAGGER ---------- */
  function initialReveal() {
    const heroLines = document.querySelectorAll('.hero .reveal-line');
    heroLines.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 90);
    });

    const heroStagger = document.querySelectorAll('.hero-meta-item, .hero-pill');
    heroStagger.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1)';
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 700 + i * 80);
    });
  }

  let io;
  function startObservers() {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;

        if (el.classList.contains('reveal-line')) {
          const parent = el.parentElement;
          const siblings = parent ? parent.querySelectorAll(':scope > .reveal-line') : [el];
          const idx = Array.from(siblings).indexOf(el);
          setTimeout(() => el.classList.add('visible'), idx * 100);
        }

        if (el.hasAttribute('data-stagger')) {
          const parent = el.parentElement;
          const sibs = parent ? parent.querySelectorAll(':scope > [data-stagger]') : [el];
          const idx = Array.from(sibs).indexOf(el);
          setTimeout(() => el.classList.add('visible'), idx * 90);
        }

        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('main .reveal-line, [data-stagger]').forEach((el) => {
      if (el.closest('.hero')) return;
      io.observe(el);
    });
  }

  /* ---------- COUNTERS ---------- */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.counter, 10);
      const suffix = el.dataset.suffix || '';
      const format = el.dataset.format;
      const duration = 1600;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.floor(target * eased);
        const formatted = format === 'space'
          ? value.toLocaleString('ru-RU').replace(/,/g, ' ')
          : value;
        el.textContent = formatted + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = (format === 'space'
          ? target.toLocaleString('ru-RU').replace(/,/g, ' ')
          : target) + suffix;
      }
      requestAnimationFrame(step);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('[data-counter]').forEach((el) => counterIO.observe(el));

  /* ---------- PARALLAX LAYERS (desktop only) ---------- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (!reduceMotion && !isTouch && parallaxEls.length) {
    function update() {
      const scrollY = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0;
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + scrollY - window.innerHeight) * speed;
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ---------- CONTACT FORM ---------- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      const fd = new FormData(form);
      const payload = {
        name:    (fd.get('name')    || '').toString().trim(),
        contact: (fd.get('contact') || '').toString().trim(),
        service: (fd.get('service') || '').toString().trim(),
        comment: (fd.get('comment') || '').toString().trim(),
      };

      if (!payload.contact) {
        status.className = 'form-status error';
        status.textContent = 'укажите телефон, telegram или email — нам нужно как-то ответить.';
        return;
      }

      const submitBtn = form.querySelector('.submit-btn');
      const oldText = submitBtn.querySelector('.bt-text').textContent;
      submitBtn.querySelector('.bt-text').textContent = 'отправляем…';
      submitBtn.disabled = true;

      try {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'не получилось отправить');
        }

        status.className = 'form-status success';
        status.textContent = 'заявка отправлена! отвечу в течение часа в рабочее время.';
        form.reset();
      } catch (err) {
        status.className = 'form-status error';
        status.textContent = 'что-то пошло не так. напишите напрямую в telegram @mirabell или на +7 999 111 08 66.';
      } finally {
        submitBtn.querySelector('.bt-text').textContent = oldText;
        submitBtn.disabled = false;
      }
    });
  }
})();
