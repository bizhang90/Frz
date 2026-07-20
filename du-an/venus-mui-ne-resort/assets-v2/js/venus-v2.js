const base='/du-an/venus-mui-ne-resort/assets-v2/';
const rooms=[
 {slug:'don-bien',kicker:'CHO CẶP ĐÔI',name:'Đơn hướng biển',desc:'Phòng dành cho hai người với cửa kính lớn, ban công và góc nhìn hướng hồ bơi – biển.',tags:['1 giường đôi','2 khách','Hướng biển'],count:6,video:'video/don-bien.mp4'},
 {slug:'don-vuon',kicker:'YÊN TĨNH & THOÁNG',name:'Đơn hướng vườn',desc:'Không gian sáng, gần cây xanh và phù hợp cho kỳ nghỉ nhẹ nhàng của cặp đôi.',tags:['1 giường đôi','2 khách','Hướng vườn'],count:5},
 {slug:'doi-vuon',kicker:'GIA ĐÌNH & NHÓM NHỎ',name:'Đôi hướng vườn',desc:'Bố trí hai giường, thuận tiện cho gia đình hoặc nhóm bạn cùng nghỉ trong một phòng.',tags:['2 giường','3–4 khách','Hướng vườn'],count:5,video:'video/doi-vuon.mp4'},
 {slug:'doi-vip-bien',kicker:'VIEW BIỂN RỘNG',name:'Đôi VIP hướng biển',desc:'Phòng nhiều ánh sáng, ban công rộng và góc nhìn gần hồ bơi – biển dành cho nhóm hoặc gia đình.',tags:['2 giường','3–4 khách','Hướng biển'],count:5,video:'video/doi-vip-bien.mp4'},
 {slug:'doi-vip-vuon',kicker:'RỘNG RÃI HƠN',name:'Đôi VIP hướng vườn',desc:'Không gian thoáng với hai giường, phù hợp khi cả nhóm muốn ở cùng nhau và cần sự tiện nghi hơn.',tags:['2 giường','3–4 khách','Hướng vườn'],count:4,video:'video/doi-vip-vuon.mp4'}
];
const roomGrid=document.querySelector('#room-grid');
roomGrid.innerHTML=rooms.map((r,i)=>`<article class="room-card" data-reveal data-delay="${i*55}"><button class="room-image" type="button" data-room="${r.slug}"><img src="${base}img/rooms/${r.slug}-1.webp" alt="${r.name}" loading="lazy"><span class="room-count">${r.count} ảnh${r.video?' · video':''}</span></button><div class="room-body"><span class="room-kicker">${r.kicker}</span><h3>${r.name}</h3><p>${r.desc}</p><div class="room-tags">${r.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="room-links"><a href="tel:0819081111">Kiểm tra phòng trống ↗</a>${r.video?`<button type="button" data-video="${r.video}" data-caption="Video ${r.name}">Xem video</button>`:''}</div></div></article>`).join('');

const gallery=[
 ['img/pool-wide.webp','Hồ bơi hướng biển','wide'],['img/building.webp','Khu phòng nghỉ','tall'],['img/team-building.webp','Team building',''],['img/dining.webp','Ẩm thực',''],['img/family.webp','Gia đình bên hồ','wide'],['img/sunset.webp','Hoàng hôn Mũi Né',''],['img/rooms/don-bien-3.webp','Phòng hướng biển',''],['img/rooms/doi-vip-bien-2.webp','Đôi VIP hướng biển','wide']
];
document.querySelector('#gallery-grid').innerHTML=gallery.map(([src,label,cls])=>`<button class="gallery-item ${cls}" type="button" data-single="${src}" data-caption="${label}"><img src="${base}${src}" alt="${label}" loading="lazy"><span>${label}</span></button>`).join('');

const revealObserver='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -45px'}):{observe:e=>e.classList.add('visible')};
document.querySelectorAll('[data-reveal]').forEach(el=>{el.style.setProperty('--delay',`${Number(el.dataset.delay||0)}ms`);revealObserver.observe(el)});

const header=document.querySelector('.site-header'),menuBtn=document.querySelector('.menu-toggle'),nav=document.querySelector('.primary-nav');
function updateHeader(){header.classList.toggle('scrolled',scrollY>35)}updateHeader();addEventListener('scroll',updateHeader,{passive:true});
menuBtn.addEventListener('click',()=>{const open=menuBtn.getAttribute('aria-expanded')==='true';menuBtn.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open);document.body.classList.toggle('menu-open',!open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')}));

const lb=document.querySelector('#lightbox'),lbImg=document.querySelector('#lightbox-image'),lbVid=document.querySelector('#lightbox-video'),lbCap=document.querySelector('#lightbox-caption');let items=[],idx=0;
function show(i){if(!items.length)return;idx=(i+items.length)%items.length;const it=items[idx];lbImg.classList.remove('active');lbVid.classList.remove('active');lbVid.pause();lbVid.removeAttribute('src');if(it.type==='video'){lbVid.src=base+it.src;lbVid.classList.add('active')}else{lbImg.src=base+it.src;lbImg.alt=it.caption||'Ảnh Venus';lbImg.classList.add('active')}lbCap.textContent=it.caption||`${idx+1}/${items.length}`;lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');lbVid.pause();document.body.classList.remove('modal-open')}
document.querySelectorAll('[data-room]').forEach(btn=>btn.addEventListener('click',()=>{const r=rooms.find(x=>x.slug===btn.dataset.room);items=Array.from({length:r.count},(_,i)=>({type:'image',src:`img/rooms/${r.slug}-${i+1}.webp`,caption:`${r.name} · ${i+1}/${r.count}`}));if(r.video)items.push({type:'video',src:r.video,caption:`Video ${r.name}`});show(0)}));
document.querySelectorAll('[data-video]').forEach(btn=>btn.addEventListener('click',()=>{items=[{type:'video',src:btn.dataset.video,caption:btn.dataset.caption}];show(0)}));
document.querySelectorAll('[data-single]').forEach(btn=>btn.addEventListener('click',()=>{items=[{type:'image',src:btn.dataset.single,caption:btn.dataset.caption}];show(0)}));
document.querySelector('.lightbox-close').addEventListener('click',close);document.querySelector('.lightbox-prev').addEventListener('click',()=>show(idx-1));document.querySelector('.lightbox-next').addEventListener('click',()=>show(idx+1));lb.addEventListener('click',e=>{if(e.target===lb)close()});

const menuModal=document.querySelector('#menu-modal');document.querySelector('#menu-modal-grid').innerHTML=Array.from({length:8},(_,i)=>`<img src="${base}img/menu/menu-${i+1}.webp" alt="Thực đơn Venus ${i+1}" loading="lazy" data-menu-image="img/menu/menu-${i+1}.webp">`).join('');
document.querySelector('[data-menu-open]').addEventListener('click',()=>{menuModal.classList.add('open');menuModal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')});document.querySelector('.menu-modal-close').addEventListener('click',()=>{menuModal.classList.remove('open');document.body.classList.remove('modal-open')});document.querySelectorAll('[data-menu-image]').forEach(img=>img.addEventListener('click',()=>{menuModal.classList.remove('open');items=[{type:'image',src:img.dataset.menuImage,caption:img.alt}];show(0)}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();menuModal.classList.remove('open');nav.classList.remove('open');document.body.classList.remove('menu-open','modal-open')}if(lb.classList.contains('open')&&e.key==='ArrowLeft')show(idx-1);if(lb.classList.contains('open')&&e.key==='ArrowRight')show(idx+1)});
document.querySelector('#year').textContent=new Date().getFullYear();
