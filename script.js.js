/* ==========================================================================
   GAME NEST MORO — app.js
   Plain JavaScript, no libraries. Loaded with `defer` from index.html.

   ▶ TO CHANGE CONTACT DETAILS: edit the CONFIG block below. That is the only
     place you need to touch; the Contact section, footer and WhatsApp buttons
     all read from it.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIG — replace the placeholders (anything containing "X") with real
     details. Leave the number formats as shown.
     --------------------------------------------------------------------- */
  const CONFIG = {
    // WhatsApp number in international format: digits only, no "+" or spaces.
    // Example for 0300 1234567  ->  "923001234567"
    whatsappNumber: '923XXXXXXXXX',
    whatsappDisplay: '+92 3XX XXXXXXX',

    // Phone number used for tap-to-call, digits only. Example: "03001234567"
    phoneNumber: '03XXXXXXXXX',
    phoneDisplay: '03XX XXXXXXX',

    hours: 'Daily: XX:XX AM – XX:XX PM',
    address: 'Golden Market, Moro',

    // Used by the "Get Directions" button (opens Google Maps search)
    mapsQuery: 'Game Nest Golden Market Moro Sindh'
  };

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPlaceholder = (value) => /x/i.test(value);
  const whatsappReady = () => !isPlaceholder(CONFIG.whatsappNumber);

  const pad = (n) => String(n).padStart(2, '0');
  const localISODate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const nowHHMM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  const formatDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });

  const formatTime = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
  }

  /* ---------------------------------------------------------------------
     Contact details from CONFIG
     --------------------------------------------------------------------- */
  function whatsappUrl(text) {
    const base = `https://wa.me/${CONFIG.whatsappNumber}`;
    return text ? `${base}?text=${encodeURIComponent(text)}` : base;
  }

  function openWhatsApp(text) {
    if (!whatsappReady()) {
      showToast('WhatsApp number coming soon. (Site owner: set it in app.js → CONFIG.)');
      return;
    }
    window.open(whatsappUrl(text), '_blank', 'noopener');
  }

  function initContactDetails() {
    $$('[data-config]').forEach((el) => {
      const value = CONFIG[el.dataset.config];
      if (value) el.textContent = value;
    });

    $$('[data-link="whatsapp"]').forEach((a) => {
      if (whatsappReady()) {
        a.href = whatsappUrl('Hello Game Nest Moro!');
        a.target = '_blank';
        a.rel = 'noopener';
      } else {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          openWhatsApp();
        });
      }
    });

    $$('[data-link="phone"]').forEach((a) => {
      if (!isPlaceholder(CONFIG.phoneNumber)) {
        a.href = `tel:${CONFIG.phoneNumber}`;
      } else {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Phone number coming soon. (Site owner: set it in app.js → CONFIG.)');
        });
      }
    });

    $$('[data-link="maps"]').forEach((a) => {
      a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.mapsQuery)}`;
    });
  }

  /* ---------------------------------------------------------------------
     Mobile navigation + sticky header state
     --------------------------------------------------------------------- */
  function initNav() {
    const header = $('.site-header');
    const toggle = $('.nav-toggle');
    const menu = $('#nav-menu');
    if (!header || !toggle || !menu) return;

    const isOpen = () => menu.classList.contains('open');
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', (e) => { if (isOpen() && !header.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });

    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Smooth scrolling for in-page links
     --------------------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const hash = link.getAttribute('href');
      if (hash === '#') { e.preventDefault(); return; } // placeholder links do nothing

      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      try { history.pushState(null, '', hash); } catch (err) { /* ignore (e.g. some file:// setups) */ }
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll animations + active nav link
     --------------------------------------------------------------------- */
  function initScrollEffects() {
    const revealEls = $$('.reveal');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach((el) => revealObserver.observe(el));

      const links = $$('.nav-link');
      const sections = links
        .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
        .filter(Boolean);
      const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach((section) => navObserver.observe(section));
    } else {
      revealEls.forEach((el) => el.classList.add('in-view'));
    }
  }

  /* ---------------------------------------------------------------------
     Button interactions: click ripple
     --------------------------------------------------------------------- */
  function initButtons() {
    if (reduceMotion) return;
    $$('.btn').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  /* ---------------------------------------------------------------------
     Gallery lightbox
     --------------------------------------------------------------------- */
  function initLightbox() {
    const dialog = $('#lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const image = $('img', dialog);
    const caption = $('.lightbox-caption', dialog);

    $$('.gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        const thumb = $('img', item);
        image.src = thumb.getAttribute('src');
        image.alt = thumb.alt;
        caption.textContent = item.dataset.caption || '';
        dialog.showModal();
      });
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('.lightbox-close')) dialog.close();
    });
  }

  /* ---------------------------------------------------------------------
     Booking form
     --------------------------------------------------------------------- */
  function initBooking() {
    const form = $('#booking-form');
    const successPanel = $('#booking-success');
    if (!form || !successPanel) return;

    const el = {
      name: $('#b-name'),
      whatsapp: $('#b-whatsapp'),
      type: $('#b-type'),
      players: $('#b-players'),
      date: $('#b-date'),
      time: $('#b-time'),
      message: $('#b-message')
    };

    el.date.min = localISODate();

    /* ----- validation ----- */
    const isValidPhone = (raw) => {
      const value = raw.trim();
      const digits = value.replace(/\D/g, '');
      if (/^(92|0)?3\d{9}$/.test(digits)) return true;              // Pakistani mobile
      return value.startsWith('+') && digits.length >= 8 && digits.length <= 15; // other international
    };

    const validators = {
      'b-name': (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
      'b-whatsapp': (v) => (isValidPhone(v) ? '' : 'Enter a valid mobile number, e.g. 0300 1234567.'),
      'b-type': (v) => (v ? '' : 'Choose what you want to play.'),
      'b-players': (v) => (v ? '' : 'Select the number of players.'),
      'b-date': (v) => {
        if (!v) return 'Pick a date.';
        return v < localISODate() ? 'Pick today or a later date.' : '';
      },
      'b-time': (v) => {
        if (!v) return 'Pick a time.';
        if (el.date.value === localISODate() && v <= nowHHMM()) return 'Pick a time later than right now.';
        return '';
      }
    };

    const setError = (input, message) => {
      const field = input.closest('.field');
      const error = $(`#e-${input.id}`);
      field.classList.toggle('invalid', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message;
    };

    const validateField = (id) => {
      const input = document.getElementById(id);
      const message = validators[id](input.value);
      setError(input, message);
      return !message;
    };

    Object.keys(validators).forEach((id) => {
      const input = document.getElementById(id);
      input.addEventListener('blur', () => { if (input.value) validateField(id); });
      input.addEventListener('input', () => { if (input.closest('.field').classList.contains('invalid')) validateField(id); });
      input.addEventListener('change', () => { if (input.closest('.field').classList.contains('invalid')) validateField(id); });
    });
    el.date.addEventListener('change', () => { if (el.time.value) validateField('b-time'); });

    /* ----- data + WhatsApp message ----- */
    const getData = () => ({
      name: el.name.value.trim(),
      whatsapp: el.whatsapp.value.trim(),
      type: el.type.value,
      players: el.players.value,
      date: el.date.value,
      time: el.time.value,
      message: el.message.value.trim()
    });

    const buildMessage = (d) => {
      const lines = ["Hello Game Nest Moro! I'd like to book a gaming session."];
      if (d.name) lines.push(`Name: ${d.name}`);
      if (d.type) lines.push(`Game: ${d.type}`);
      if (d.players) lines.push(`Players: ${d.players}`);
      if (d.date) lines.push(`Date: ${formatDate(d.date)}`);
      if (d.time) lines.push(`Time: ${formatTime(d.time)}`);
      if (d.message) lines.push(`Note: ${d.message}`);
      return lines.join('\n');
    };

    /* ----- WhatsApp Booking buttons ----- */
    $$('[data-whatsapp-booking]').forEach((btn) => {
      btn.addEventListener('click', () => openWhatsApp(buildMessage(getData())));
    });

    /* ----- "Book Now" buttons pre-fill the form ----- */
    $$('[data-book]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const { type, players, package: pkg } = btn.dataset;
        if (type) { el.type.value = type; setError(el.type, ''); }
        if (players) { el.players.value = players; setError(el.players, ''); }
        if (pkg && (!el.message.value.trim() || el.message.value.startsWith('Package:'))) {
          el.message.value = `Package: ${pkg}`;
        }
      });
    });

    /* ----- submit ----- */
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let firstInvalid = null;
      Object.keys(validators).forEach((id) => {
        if (!validateField(id) && !firstInvalid) firstInvalid = document.getElementById(id);
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      const data = getData();

      // Optional: if the site is hosted on Netlify, the booking is also saved in
      // Netlify Forms. This fails silently anywhere else (e.g. opening the file locally).
      if (location.protocol.startsWith('http')) {
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        }).catch(() => {});
      }

      showSuccess(data);
    });

    function showSuccess(data) {
      $('#success-name').textContent = data.name.split(' ')[0];

      const summary = $('#success-summary');
      summary.textContent = '';
      [
        ['Game', data.type],
        ['Players', data.players],
        ['Date', formatDate(data.date)],
        ['Time', formatTime(data.time)],
        ['WhatsApp', data.whatsapp]
      ].forEach(([label, value]) => {
        const li = document.createElement('li');
        const a = document.createElement('span');
        const b = document.createElement('span');
        a.textContent = label;
        b.textContent = value;
        li.append(a, b);
        summary.appendChild(li);
      });

      $('#success-whatsapp').onclick = () => openWhatsApp(buildMessage(data));

      form.hidden = true;
      successPanel.hidden = false;
      successPanel.focus();
      successPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }

    $('#new-booking').addEventListener('click', () => {
      form.reset();
      Object.values(el).forEach((input) => { if (input !== el.message) setError(input, ''); });
      successPanel.hidden = true;
      form.hidden = false;
      el.name.focus();
    });
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  function init() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    initContactDetails();
    initNav();
    initSmoothScroll();
    initScrollEffects();
    initButtons();
    initLightbox();
    initBooking();
  }

  init();
})();
