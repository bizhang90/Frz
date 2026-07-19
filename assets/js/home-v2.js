(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  const dropdown = document.querySelector('.nav-dropdown');
  const dropdownButton = document.querySelector('.nav-dropdown-toggle');
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const locationCards = [...document.querySelectorAll('.location-card')];
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];

  const setHeaderState = () => {
    header?.classList.toggle('scrolled', window.scrollY > 20);
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const closeMenu = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    dropdown?.classList.remove('open');
    dropdownButton?.setAttribute('aria-expanded', 'false');
  };

  menuButton?.addEventListener('click', () => {
    const shouldOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(shouldOpen));
    nav?.classList.toggle('open', shouldOpen);
    document.body.classList.toggle('menu-open', shouldOpen);
  });

  dropdownButton?.addEventListener('click', event => {
    event.stopPropagation();
    const shouldOpen = !dropdown?.classList.contains('open');
    dropdown?.classList.toggle('open', shouldOpen);
    dropdownButton.setAttribute('aria-expanded', String(shouldOpen));
  });

  document.addEventListener('click', event => {
    if (dropdown && !dropdown.contains(event.target)) {
      dropdown.classList.remove('open');
      dropdownButton?.setAttribute('aria-expanded', 'false');
    }
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.filter || 'all';
      filterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      locationCards.forEach(card => {
        const visible = selected === 'all' || card.dataset.category === selected;
        card.classList.toggle('is-hidden', !visible);
      });
    });
  });

  document.documentElement.classList.add('reveal-ready');
  const revealElements = [...document.querySelectorAll('[data-reveal]')];
  revealElements.forEach(element => {
    element.style.setProperty('--reveal-delay', `${Number(element.dataset.delay || 0)}ms`);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -45px' });
    revealElements.forEach(element => observer.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add('is-visible'));
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion && parallaxItems.length) {
    let rafId = 0;
    const updateParallax = () => {
      rafId = 0;
      const viewport = window.innerHeight || 800;
      parallaxItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewport) return;
        const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
        const amount = Number(item.dataset.parallax || 0);
        const baseRotate = item.classList.contains('hero-photo-volga') ? 2.5 : item.classList.contains('hero-photo-night') ? -2 : 0;
        item.style.transform = `translate3d(0, ${progress * amount}px, 0) rotate(${baseRotate}deg)`;
      });
    };
    const requestUpdate = () => {
      if (!rafId) rafId = requestAnimationFrame(updateParallax);
    };
    updateParallax();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
