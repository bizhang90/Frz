const base = '/du-an/volga-hotel-apartment/assets/img/';
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');

function updateHeader(){ header.classList.toggle('scrolled', window.scrollY > 35); }
updateHeader();
window.addEventListener('scroll', updateHeader, {passive:true});

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded','false');
  document.body.classList.remove('menu-open');
}));

document.documentElement.classList.add('reveal-ready');

const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
},{threshold:.12,rootMargin:'0px 0px -45px'}) : {observe(el){el.classList.add('is-visible')}};
const revealElements = [...document.querySelectorAll('[data-reveal]')];
revealElements.forEach(el => {
  el.style.setProperty('--reveal-delay', `${Number(el.dataset.delay || 0)}ms`);
  observer.observe(el);
});
function revealInView(){
  revealElements.forEach(el => {
    if(el.classList.contains('is-visible')) return;
    const rect=el.getBoundingClientRect();
    if(rect.top < window.innerHeight * .9 && rect.bottom > 0) el.classList.add('is-visible');
  });
}
revealInView();
window.addEventListener('scroll', revealInView, {passive:true});
window.addEventListener('resize', revealInView);

// Safety net: if a browser/timing quirk ever prevents the opacity transition
// from completing, force full visibility so content is never stuck hidden.
setTimeout(() => {
  revealElements.forEach(el => {
    if (getComputedStyle(el).opacity === '0') {
      el.classList.add('is-visible');
      el.style.transition = 'none';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }
  });
}, 1800);

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
let lightboxItems = [];
let lightboxIndex = 0;

function showLightbox(index){
  if (!lightboxItems.length) return;
  lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
  const item = lightboxItems[lightboxIndex];
  lightboxImage.src = base + item.src;
  lightboxImage.alt = item.alt || 'Hình ảnh Volga Hotel & Apartment';
  lightboxCaption.textContent = item.caption || `${lightboxIndex + 1} / ${lightboxItems.length}`;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.classList.add('lightbox-open');
}
function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('lightbox-open');
}

document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
  const names = button.dataset.gallery.split(',').map(s => s.trim()).filter(Boolean);
  const title = button.closest('.room-card')?.querySelector('h3')?.textContent || 'Phòng nghỉ Volga';
  lightboxItems = names.map((src,i) => ({src,alt:`${title} - ảnh ${i+1}`,caption:`${title} · ${i+1}/${names.length}`}));
  showLightbox(0);
}));

document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  const buttons = [...document.querySelectorAll('[data-image]')];
  lightboxItems = buttons.map((el,i) => ({src:el.dataset.image,alt:el.querySelector('img')?.alt || 'Hình ảnh Volga',caption:el.querySelector('span')?.textContent || `${i+1}/${buttons.length}`}));
  showLightbox(buttons.indexOf(button));
}));

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-prev').addEventListener('click', () => showLightbox(lightboxIndex - 1));
document.querySelector('.lightbox-next').addEventListener('click', () => showLightbox(lightboxIndex + 1));
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeLightbox(); nav.classList.remove('open'); document.body.classList.remove('menu-open'); }
  if (!lightbox.classList.contains('open')) return;
  if (event.key === 'ArrowLeft') showLightbox(lightboxIndex - 1);
  if (event.key === 'ArrowRight') showLightbox(lightboxIndex + 1);
});

document.querySelector('#year').textContent = new Date().getFullYear();
