const header=document.querySelector('.site-header');
const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.primary-nav');
function updateHeader(){header?.classList.toggle('scrolled',window.scrollY>24)}
updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('open',!open);document.body.classList.toggle('menu-open',!open)});
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){nav?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')}});
const filterButtons=[...document.querySelectorAll('[data-room-filter]')];
const rooms=[...document.querySelectorAll('.room-card')];
function setFilter(filter){filterButtons.forEach(button=>{const active=button.dataset.roomFilter===filter;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});rooms.forEach(room=>room.classList.toggle('is-hidden',filter!=='all'&&room.dataset.hotel!==filter))}
filterButtons.forEach(button=>button.addEventListener('click',()=>setFilter(button.dataset.roomFilter)));
document.querySelectorAll('[data-jump-filter]').forEach(link=>link.addEventListener('click',()=>setFilter(link.dataset.jumpFilter)));
const lightbox=document.querySelector('#lightbox');const lightboxImage=lightbox?.querySelector('img');
document.querySelectorAll('[data-lightbox]').forEach(button=>button.addEventListener('click',()=>{if(!lightbox||!lightboxImage)return;const source=button.dataset.lightbox;lightboxImage.src=`/du-an/khach-san-phan-thiet/assets/img/${source}`;lightboxImage.alt=button.querySelector('img')?.alt||'Ảnh khách sạn';lightbox.showModal()}));
lightbox?.querySelector('.lightbox-close')?.addEventListener('click',()=>lightbox.close());
lightbox?.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close()});
const revealElements=[...document.querySelectorAll('[data-reveal]')];
const revealObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)})},{threshold:.1,rootMargin:'0px 0px -40px'}):{observe(element){element.classList.add('is-visible')}};
revealElements.forEach(element=>{element.style.setProperty('--reveal-delay',`${Number(element.dataset.delay||0)}ms`);revealObserver.observe(element)});
setTimeout(()=>revealElements.forEach(element=>element.classList.add('is-visible')),1800);
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
