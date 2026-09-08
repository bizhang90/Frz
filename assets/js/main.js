const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
const dropdown = document.querySelector('.nav-dropdown');
const dropdownButton = document.querySelector('.nav-dropdown-toggle');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const projectCards = [...document.querySelectorAll('.project-card')];

function updateHeader() {
  header?.classList.toggle('scrolled', window.scrollY > 24);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

dropdownButton?.addEventListener('click', event => {
  event.stopPropagation();
  const open = dropdown?.classList.toggle('open');
  dropdownButton.setAttribute('aria-expanded', String(Boolean(open)));
});

document.addEventListener('click', event => {
  if (dropdown && !dropdown.contains(event.target)) {
    dropdown.classList.remove('open');
    dropdownButton?.setAttribute('aria-expanded', 'false');
  }
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  dropdown?.classList.remove('open');
  dropdownButton?.setAttribute('aria-expanded', 'false');
}));

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  nav?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  dropdown?.classList.remove('open');
  dropdownButton?.setAttribute('aria-expanded', 'false');
});

filterButtons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  filterButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  projectCards.forEach(card => {
    const visible = filter === 'all' || (card.dataset.category || '').split(/\s+/).includes(filter);
    card.classList.toggle('is-hidden', !visible);
  });
}));

document.documentElement.classList.add('reveal-ready');

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -42px' })
  : { observe(element) { element.classList.add('is-visible'); }, unobserve() {} };

const revealElements = [...document.querySelectorAll('[data-reveal]')];
revealElements.forEach(element => {
  element.style.setProperty('--reveal-delay', `${Number(element.dataset.delay || 0)}ms`);
  revealObserver.observe(element);
});
function revealInView() {
  revealElements.forEach(element => {
    if (element.classList.contains('is-visible')) return;
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) element.classList.add('is-visible');
  });
}
revealInView();
window.addEventListener('scroll', revealInView, { passive: true });
window.addEventListener('resize', revealInView);

// Safety net: if a browser/timing quirk ever prevents the opacity transition
// from completing, force full visibility so content is never stuck hidden.
setTimeout(() => {
  revealElements.forEach(element => {
    if (getComputedStyle(element).opacity === '0') {
      element.classList.add('is-visible');
      element.style.transition = 'none';
      element.style.opacity = '1';
      element.style.transform = 'none';
    }
  });
}, 1800);

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
