(() => {
  const header=document.querySelector('.site-header');
  const toggle=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.primary-nav');
  const back=document.querySelector('.back-to-top');
  const links=[...document.querySelectorAll('.primary-nav a')];
  const sections=[...document.querySelectorAll('main section[id]')];
  const closeMenu=()=>{toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Mở menu');nav?.classList.remove('open');document.body.classList.remove('menu-open')};
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));toggle.setAttribute('aria-label',open?'Mở menu':'Đóng menu');nav?.classList.toggle('open',!open);document.body.classList.toggle('menu-open',!open)});
  links.forEach(a=>a.addEventListener('click',closeMenu));
  const onScroll=()=>{const y=scrollY;header?.classList.toggle('scrolled',y>15);back?.classList.toggle('visible',y>650);let id='';sections.forEach(s=>{if(y>=s.offsetTop-160)id=s.id});links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${id}`))};
  addEventListener('scroll',onScroll,{passive:true});onScroll();back?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

  document.documentElement.classList.add('reveal-ready');
  const reveals=document.querySelectorAll('[data-reveal]');reveals.forEach(el=>el.style.setProperty('--delay',`${Number(el.dataset.delay||0)}ms`));
  if('IntersectionObserver'in window){const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');obs.unobserve(e.target)}}),{threshold:.1,rootMargin:'0px 0px -30px'});reveals.forEach(el=>obs.observe(el))}else reveals.forEach(el=>el.classList.add('revealed'));
  const revealInView=()=>reveals.forEach(el=>{if(el.classList.contains('revealed'))return;const r=el.getBoundingClientRect();if(r.top<innerHeight*.9&&r.bottom>0)el.classList.add('revealed')});revealInView();addEventListener('scroll',revealInView,{passive:true});addEventListener('resize',revealInView);

  document.querySelectorAll('.accordion details').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)document.querySelectorAll('.accordion details').forEach(other=>{if(other!==item)other.open=false})}));

  const dialog=document.getElementById('media-dialog');const dialogImg=document.getElementById('dialog-image');const dialogCaption=document.getElementById('dialog-caption');const dialogTitle=document.getElementById('dialog-title');
  const openDialog=(src,title='Hình ảnh Venus Mũi Né Resort')=>{if(!dialog||!dialogImg)return;dialogImg.src=src;dialogImg.alt=title;dialogTitle.textContent=title;dialogCaption.textContent=title;dialog.showModal()};
  document.querySelectorAll('[data-lightbox]').forEach(btn=>btn.addEventListener('click',()=>openDialog(btn.dataset.lightbox,btn.getAttribute('aria-label')?.replace('Xem ảnh ','')||'Hình ảnh Venus')));
  document.querySelectorAll('[data-menu]').forEach(btn=>btn.addEventListener('click',()=>openDialog(btn.dataset.menu,btn.dataset.title||'Menu Venus')));
  dialog?.querySelector('.dialog-close')?.addEventListener('click',()=>dialog.close());dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});

  const form=document.getElementById('booking-form');const status=document.getElementById('form-status');const checkin=form?.elements.checkin;const checkout=form?.elements.checkout;
  const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());const todayStr=today.toISOString().split('T')[0];if(checkin){checkin.min=todayStr;checkin.value=todayStr}if(checkout){const next=new Date(today);next.setDate(next.getDate()+1);checkout.min=next.toISOString().split('T')[0];checkout.value=next.toISOString().split('T')[0]}
  checkin?.addEventListener('change',()=>{const d=new Date(checkin.value+'T00:00:00');d.setDate(d.getDate()+1);const min=d.toISOString().split('T')[0];checkout.min=min;if(!checkout.value||checkout.value<min)checkout.value=min});
  form?.addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(form);const message=`Xin chào Venus Mũi Né Resort, tôi muốn kiểm tra phòng:\n- Họ tên: ${d.get('name')}\n- SĐT: ${d.get('phone')}\n- Nhận phòng: ${d.get('checkin')}\n- Trả phòng: ${d.get('checkout')}\n- Khách: ${d.get('adults')} người lớn, ${d.get('children')} trẻ em\n- Loại phòng: ${d.get('room')}\n- Yêu cầu thêm: ${d.get('note')||'Không có'}`;try{await navigator.clipboard.writeText(message);status.textContent='Đã sao chép nội dung yêu cầu. Đang mở Zalo, bạn chỉ cần dán và gửi cho lễ tân.'}catch{status.textContent='Đang mở Zalo. Vui lòng gửi thông tin vừa điền cho lễ tân.'}setTimeout(()=>window.open('https://zalo.me/0819081111','_blank','noopener'),250)});

  const copyStatus=document.getElementById('copy-status');
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',async()=>{const value=btn.dataset.copy||'';try{await navigator.clipboard.writeText(value);if(copyStatus)copyStatus.textContent=`Đã sao chép: ${value}`;const old=btn.textContent;btn.textContent='Đã chép';setTimeout(()=>btn.textContent=old,1400)}catch{if(copyStatus)copyStatus.textContent='Không thể tự sao chép. Vui lòng nhấn giữ để sao chép thủ công.'}}));
  const year=document.getElementById('current-year');if(year)year.textContent=new Date().getFullYear();
})();
