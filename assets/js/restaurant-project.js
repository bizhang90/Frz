(() => {
  'use strict';
  const qs=(s,c=document)=>c.querySelector(s), qsa=(s,c=document)=>[...c.querySelectorAll(s)];
  const body=document.body;
  const jsonUrl=body.dataset.restaurantJson;
  let data=null, galleryFilter='all', galleryLimit=8, menuLimit=12, dialogItems=[], dialogIndex=0;

  const menuToggle=qs('.menu-toggle'), localNav=qs('.local-nav');
  if(menuToggle&&localNav){menuToggle.addEventListener('click',()=>{const open=localNav.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));});qsa('a',localNav).forEach(a=>a.addEventListener('click',()=>{localNav.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');}));}
  const year=qs('#year'); if(year) year.textContent=new Date().getFullYear();

  const reveal=()=>{const els=qsa('[data-reveal]');if(!('IntersectionObserver'in window)){els.forEach(el=>el.classList.add('is-visible'));return;}const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -35px'});els.forEach(el=>io.observe(el));};
  reveal();

  const dialog=qs('[data-media-dialog]'), dialogContent=qs('[data-dialog-content]'), prev=qs('[data-dialog-prev]'), next=qs('[data-dialog-next]');
  function showDialogItem(index){if(!dialogItems.length)return;dialogIndex=(index+dialogItems.length)%dialogItems.length;const item=dialogItems[dialogIndex];dialogContent.replaceChildren();if(item.type==='video'){const video=document.createElement('video');video.controls=true;video.autoplay=true;video.playsInline=true;video.poster=item.poster||'';video.src=item.src;dialogContent.append(video);prev.hidden=next.hidden=true;}else{const img=new Image();img.src=item.src;img.alt=item.alt||'';dialogContent.append(img);prev.hidden=next.hidden=dialogItems.length<2;}if(!dialog.open)dialog.showModal();}
  function openImageCollection(items,index){dialogItems=items.map(x=>({type:'image',src:x.src,alt:x.alt}));showDialogItem(index);}
  qsa('[data-dialog-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
  if(dialog){dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{const v=qs('video',dialogContent);if(v){v.pause();v.removeAttribute('src');v.load();}});}
  if(prev)prev.addEventListener('click',()=>showDialogItem(dialogIndex-1)); if(next)next.addEventListener('click',()=>showDialogItem(dialogIndex+1));
  document.addEventListener('keydown',e=>{if(!dialog?.open)return;if(e.key==='ArrowLeft')showDialogItem(dialogIndex-1);if(e.key==='ArrowRight')showDialogItem(dialogIndex+1);});

  function currentGallery(){return data.gallery.filter(x=>galleryFilter==='all'||x.category===galleryFilter);}
  function renderGallery(){const grid=qs('[data-gallery-grid]'), more=qs('[data-gallery-more]');if(!grid)return;const items=currentGallery();grid.replaceChildren();items.slice(0,galleryLimit).forEach((item,index)=>{const b=document.createElement('button');b.className='gallery-item';b.type='button';b.innerHTML=`<img src="${item.thumb}" alt="${item.alt}" width="560" height="420" loading="lazy" decoding="async"><span>${item.alt}</span>`;b.addEventListener('click',()=>openImageCollection(items,index));grid.append(b);});more.hidden=items.length<=galleryLimit;}
  qsa('[data-gallery-filter]').forEach(btn=>btn.addEventListener('click',()=>{qsa('[data-gallery-filter]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false')});btn.classList.add('active');btn.setAttribute('aria-selected','true');galleryFilter=btn.dataset.galleryFilter;galleryLimit=8;renderGallery();}));
  qsa('[data-gallery-jump]').forEach(btn=>btn.addEventListener('click',()=>{const filter=qs(`[data-gallery-filter="${btn.dataset.galleryJump}"]`);filter?.click();qs('#hinh-anh')?.scrollIntoView({behavior:'smooth',block:'start'});}));
  const galleryMore=qs('[data-gallery-more]');if(galleryMore)galleryMore.addEventListener('click',()=>{galleryLimit+=8;renderGallery();});

  function renderMenu(){const grid=qs('[data-menu-grid]'), more=qs('[data-menu-more]'), status=qs('[data-menu-status]');if(!grid)return;grid.replaceChildren();data.menu.slice(0,menuLimit).forEach((item,index)=>{const b=document.createElement('button');b.type='button';b.className='menu-page';b.innerHTML=`<img src="${item.thumb}" alt="${item.alt}" width="360" height="480" loading="lazy" decoding="async"><span>Trang ${item.page}</span>`;b.addEventListener('click',()=>openImageCollection(data.menu,index));grid.append(b);});if(status)status.textContent=`Đang hiển thị ${Math.min(menuLimit,data.menu.length)}/${data.menu.length} trang`;more.hidden=data.menu.length<=menuLimit;}
  const menuBrowser=qs('[data-menu-browser]'), menuCopy=qs('.menu-copy'), menuPreview=qs('.menu-preview');
  const openMenu=()=>{menuBrowser.hidden=false;if(menuCopy)menuCopy.hidden=true;if(menuPreview)menuPreview.hidden=true;renderMenu();menuBrowser.scrollIntoView({behavior:'smooth',block:'start'});};
  const closeMenu=()=>{menuBrowser.hidden=true;if(menuCopy)menuCopy.hidden=false;if(menuPreview)menuPreview.hidden=false;qs('#thuc-don')?.scrollIntoView({behavior:'smooth',block:'start'});};
  qs('[data-menu-open]')?.addEventListener('click',openMenu);qs('[data-menu-close]')?.addEventListener('click',closeMenu);qs('[data-menu-more]')?.addEventListener('click',()=>{menuLimit+=12;renderMenu();});

  function renderGroupMenu(){const grid=qs('[data-group-menu-grid]');if(!grid||!data?.groupMenu?.length)return;grid.replaceChildren();data.groupMenu.slice(0,6).forEach((item,index)=>{const b=document.createElement('button');b.type='button';b.className='group-menu-card';b.innerHTML=`<img src="${item.thumb}" alt="${item.alt}" width="520" height="690" loading="lazy" decoding="async"><span>Trang ${item.page}</span>`;b.addEventListener('click',()=>openImageCollection(data.groupMenu,index));grid.append(b);});}
  qsa('[data-group-menu-open]').forEach(btn=>btn.addEventListener('click',()=>{if(data?.groupMenu?.length)openImageCollection(data.groupMenu,0);}));
  function bindVipPreviews(){const items=data?.gallery?.filter(x=>x.category==='vip')||[];qsa('[data-vip-preview]').forEach((btn,index)=>btn.addEventListener('click',()=>openImageCollection(items,Number(btn.dataset.vipPreview||index))));}

  function renderVideos(){if(!data.videos?.length)return;const section=qs('[data-video-section]'),grid=qs('[data-video-grid]');if(!section||!grid)return;section.hidden=false;data.videos.forEach(item=>{const b=document.createElement('button');b.className='video-card';b.type='button';b.innerHTML=`<figure><img src="${item.poster}" alt="Video ${item.label}" width="720" height="900" loading="lazy"></figure><b>${item.label}</b>`;b.addEventListener('click',()=>{dialogItems=[{type:'video',src:item.src,poster:item.poster}];showDialogItem(0)});grid.append(b);});}

  fetch(jsonUrl,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(json=>{data=json;renderGallery();renderVideos();renderGroupMenu();bindVipPreviews();const count=qs('[data-menu-count]');if(count)count.textContent=data.menu.length;}).catch(err=>{console.error('Không tải được dữ liệu nhà hàng',err);const grid=qs('[data-gallery-grid]');if(grid)grid.innerHTML='<p>Hình ảnh đang được cập nhật. Vui lòng liên hệ nhà hàng để được hỗ trợ.</p>';});
})();
