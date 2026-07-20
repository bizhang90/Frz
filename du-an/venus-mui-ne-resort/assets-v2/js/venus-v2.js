(() => {
  'use strict';

  const base = '/du-an/venus-mui-ne-resort/assets-v2/';
  const phone = '0819081111';
  const zaloUrl = `https://zalo.me/${phone}`;

  const rooms = [
    {
      slug: 'don-bien',
      categories: ['couple', 'sea'],
      kicker: 'CẶP ĐÔI · HƯỚNG BIỂN',
      name: 'Đơn hướng biển',
      desc: 'Phòng dành cho hai người, có cửa kính lớn, ban công và góc nhìn hướng hồ bơi – biển.',
      tags: ['1 giường đôi', '2 khách', 'Ban công', 'Hướng biển'],
      count: 6,
      video: 'video/don-bien.mp4'
    },
    {
      slug: 'don-vuon',
      categories: ['couple', 'garden'],
      kicker: 'CẶP ĐÔI · HƯỚNG VƯỜN',
      name: 'Đơn hướng vườn',
      desc: 'Không gian sáng, gần cây xanh và phù hợp cho kỳ nghỉ nhẹ nhàng của hai người.',
      tags: ['1 giường đôi', '2 khách', 'Ban công', 'Hướng vườn'],
      count: 5
    },
    {
      slug: 'doi-vuon',
      categories: ['family', 'garden'],
      kicker: 'GIA ĐÌNH · NHÓM NHỎ',
      name: 'Đôi hướng vườn',
      desc: 'Bố trí hai giường, thuận tiện cho gia đình hoặc nhóm bạn cùng nghỉ trong một phòng.',
      tags: ['2 giường', '3–4 khách', 'Ban công', 'Hướng vườn'],
      count: 5,
      video: 'video/doi-vuon.mp4'
    },
    {
      slug: 'doi-vip-bien',
      categories: ['family', 'sea'],
      kicker: 'PHÒNG RỘNG · HƯỚNG BIỂN',
      name: 'Đôi VIP hướng biển',
      desc: 'Phòng nhiều ánh sáng, ban công rộng và góc nhìn gần hồ bơi – biển cho gia đình hoặc nhóm.',
      tags: ['2 giường', '3–4 khách', 'Phòng rộng', 'Hướng biển'],
      count: 5,
      video: 'video/doi-vip-bien.mp4'
    },
    {
      slug: 'doi-vip-vuon',
      categories: ['family', 'garden'],
      kicker: 'PHÒNG RỘNG · HƯỚNG VƯỜN',
      name: 'Đôi VIP hướng vườn',
      desc: 'Không gian thoáng với hai giường, phù hợp khi cả nhóm muốn ở cùng nhau và cần sự rộng rãi hơn.',
      tags: ['2 giường', '3–4 khách', 'Phòng rộng', 'Hướng vườn'],
      count: 4,
      video: 'video/doi-vip-vuon.mp4'
    }
  ];

  const gallery = [
    { src: 'img/experience/about-pool-ocean.webp', label: 'Khuôn viên hồ bơi gần biển', category: 'pool', cls: 'wide' },
    { src: 'img/experience/pool-aerial.webp', label: 'Hồ bơi nhìn từ trên cao', category: 'pool', cls: 'tall' },
    { src: 'img/experience/beach-promenade.webp', label: 'Lối dạo ven biển', category: 'beach' },
    { src: 'img/experience/restaurant-pool.webp', label: 'Nhà ăn bên hồ bơi', category: 'dining' },
    { src: 'img/experience/pool-night.webp', label: 'Hồ bơi Venus về đêm', category: 'pool', cls: 'wide' },
    { src: 'img/experience/beach-cabana.webp', label: 'Không gian thư giãn gần biển', category: 'beach' },
    { src: 'img/experience/bbq-feast.webp', label: 'BBQ cho nhóm khách', category: 'dining' },
    { src: 'img/experience/team-building.webp', label: 'Hoạt động khách đoàn', category: 'event', cls: 'wide' },
    { src: 'img/experience/gala-dinner.webp', label: 'Tiệc và gala nhóm', category: 'event' },
    { src: 'img/experience/sunset-beach.webp', label: 'Hoàng hôn Mũi Né', category: 'beach' },
    { src: 'img/experience/garden-loungers.webp', label: 'Ghế nghỉ trong khuôn viên', category: 'beach' },
    { src: 'img/experience/breakfast-by-pool.webp', label: 'Bữa ăn bên hồ bơi', category: 'dining', cls: 'wide' },
    { src: 'img/experience/family-pool.webp', label: 'Gia đình vui chơi bên hồ', category: 'pool' },
    { src: 'img/experience/property-night.webp', label: 'Toàn cảnh Venus buổi tối', category: 'beach', cls: 'wide' },
    { src: 'img/rooms/don-bien-3.webp', label: 'Phòng đơn hướng biển', category: 'room' },
    { src: 'img/rooms/doi-vip-bien-2.webp', label: 'Phòng đôi VIP hướng biển', category: 'room', cls: 'wide' },
    { src: 'img/rooms/doi-vuon-2.webp', label: 'Phòng đôi hướng vườn', category: 'room' },
    { src: 'img/experience/balcony-pool-view.webp', label: 'Góc nhìn từ ban công', category: 'beach' }
  ];

  const videoTours = [
    { video: 'video/don-bien.mp4', poster: 'img/rooms/don-bien-1.webp', name: 'Đơn hướng biển', kicker: 'VIDEO PHÒNG' },
    { video: 'video/doi-vuon.mp4', poster: 'img/rooms/doi-vuon-1.webp', name: 'Đôi hướng vườn', kicker: 'VIDEO PHÒNG' },
    { video: 'video/doi-vip-bien.mp4', poster: 'img/rooms/doi-vip-bien-1.webp', name: 'Đôi VIP hướng biển', kicker: 'VIDEO PHÒNG' },
    { video: 'video/doi-vip-vuon.mp4', poster: 'img/rooms/doi-vip-vuon-1.webp', name: 'Đôi VIP hướng vườn', kicker: 'VIDEO PHÒNG' }
  ];

  const roomGrid = document.querySelector('#room-grid');
  roomGrid.innerHTML = rooms.map((room, index) => `
    <article class="room-card" data-room-card data-categories="${room.categories.join(' ')}" data-reveal data-delay="${index * 55}">
      <button class="room-image" type="button" data-room="${room.slug}" aria-label="Xem ảnh ${room.name}">
        <img src="${base}img/rooms/${room.slug}-1.webp" alt="${room.name} tại Venus Mũi Né Resort" loading="lazy">
        <span class="room-count">${room.count} ảnh${room.video ? ' · 1 video' : ''}</span>
      </button>
      <div class="room-body">
        <span class="room-kicker">${room.kicker}</span>
        <h3>${room.name}</h3>
        <p>${room.desc}</p>
        <div class="room-tags">${room.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
        <div class="room-links">
          <a href="tel:${phone}">Kiểm tra phòng trống ↗</a>
          ${room.video ? `<button type="button" data-video="${room.video}" data-caption="Video ${room.name}">Xem video</button>` : ''}
        </div>
      </div>
    </article>`).join('');

  const galleryGrid = document.querySelector('#gallery-grid');
  galleryGrid.innerHTML = gallery.map((item, index) => `
    <button class="gallery-item ${item.cls || ''}" type="button" data-gallery-index="${index}" data-category="${item.category}" aria-label="Xem ảnh ${item.label}">
      <img src="${base}${item.src}" alt="${item.label} tại Venus Mũi Né Resort" loading="lazy">
      <span>${item.label}</span>
    </button>`).join('');

  const videoRail = document.querySelector('#video-rail');
  videoRail.innerHTML = videoTours.map((item, index) => `
    <button class="video-card" type="button" data-video="${item.video}" data-caption="Video ${item.name}" data-reveal data-delay="${index * 65}">
      <img src="${base}${item.poster}" alt="Xem video ${item.name}" loading="lazy">
      <div class="video-card-content"><i class="play" aria-hidden="true">▶</i><span>${item.kicker}</span><h3>${item.name}</h3></div>
    </button>`).join('');

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      }), { threshold: 0.1, rootMargin: '0px 0px -40px' })
    : { observe: element => element.classList.add('visible') };

  document.querySelectorAll('[data-reveal]').forEach(element => {
    element.style.setProperty('--delay', `${Number(element.dataset.delay || 0)}ms`);
    revealObserver.observe(element);
  });

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-nav');
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 35);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }));

  const roomFilterButtons = [...document.querySelectorAll('[data-room-filter]')];
  roomFilterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.roomFilter;
    roomFilterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-room-card]').forEach(card => {
      const show = filter === 'all' || card.dataset.categories.split(' ').includes(filter);
      card.classList.toggle('hidden', !show);
    });
  }));

  let activeGalleryFilter = 'all';
  const galleryFilterButtons = [...document.querySelectorAll('[data-gallery-filter]')];
  galleryFilterButtons.forEach(button => button.addEventListener('click', () => {
    activeGalleryFilter = button.dataset.galleryFilter;
    galleryFilterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-gallery-index]').forEach(card => {
      const show = activeGalleryFilter === 'all' || card.dataset.category === activeGalleryFilter;
      card.classList.toggle('hidden', !show);
    });
  }));

  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  const lightboxVideo = document.querySelector('#lightbox-video');
  const lightboxCaption = document.querySelector('#lightbox-caption');
  const previousButton = document.querySelector('.lightbox-prev');
  const nextButton = document.querySelector('.lightbox-next');
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lastFocusedElement = null;

  const showLightboxItem = index => {
    if (!lightboxItems.length) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    const item = lightboxItems[lightboxIndex];

    lightboxImage.classList.remove('active');
    lightboxVideo.classList.remove('active');
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');

    if (item.type === 'video') {
      lightboxVideo.src = base + item.src;
      lightboxVideo.classList.add('active');
      lightboxVideo.play().catch(() => {});
    } else {
      lightboxImage.src = base + item.src;
      lightboxImage.alt = item.caption || 'Hình ảnh Venus Mũi Né Resort';
      lightboxImage.classList.add('active');
    }

    lightboxCaption.textContent = item.caption || `${lightboxIndex + 1}/${lightboxItems.length}`;
    previousButton.hidden = lightboxItems.length < 2;
    nextButton.hidden = lightboxItems.length < 2;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.querySelector('.lightbox-close').focus({ preventScroll: true });
  };

  const openLightbox = (items, index = 0, trigger = null) => {
    lastFocusedElement = trigger || document.activeElement;
    lightboxItems = items;
    showLightboxItem(index);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    document.body.classList.remove('modal-open');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus({ preventScroll: true });
  };

  document.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', () => {
    const room = rooms.find(item => item.slug === button.dataset.room);
    const items = Array.from({ length: room.count }, (_, index) => ({
      type: 'image',
      src: `img/rooms/${room.slug}-${index + 1}.webp`,
      caption: `${room.name} · ${index + 1}/${room.count}`
    }));
    if (room.video) items.push({ type: 'video', src: room.video, caption: `Video ${room.name}` });
    openLightbox(items, 0, button);
  }));

  document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', () => {
    openLightbox([{ type: 'video', src: button.dataset.video, caption: button.dataset.caption }], 0, button);
  }));

  document.querySelectorAll('[data-gallery-index]').forEach(button => button.addEventListener('click', () => {
    const visibleItems = gallery
      .map((item, index) => ({ ...item, originalIndex: index }))
      .filter(item => activeGalleryFilter === 'all' || item.category === activeGalleryFilter);
    const selectedOriginalIndex = Number(button.dataset.galleryIndex);
    const selectedIndex = visibleItems.findIndex(item => item.originalIndex === selectedOriginalIndex);
    openLightbox(visibleItems.map(item => ({ type: 'image', src: item.src, caption: item.label })), selectedIndex, button);
  }));

  document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  previousButton.addEventListener('click', () => showLightboxItem(lightboxIndex - 1));
  nextButton.addEventListener('click', () => showLightboxItem(lightboxIndex + 1));
  lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });

  const menuModal = document.querySelector('#menu-modal');
  const menuGrid = document.querySelector('#menu-modal-grid');
  menuGrid.innerHTML = Array.from({ length: 8 }, (_, index) => `
    <img src="${base}img/menu/menu-${index + 1}.webp" alt="Thực đơn Venus ${index + 1}" loading="lazy" data-menu-image="img/menu/menu-${index + 1}.webp">`).join('');

  const closeMenu = () => {
    menuModal.classList.remove('open');
    menuModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  document.querySelector('[data-menu-open]').addEventListener('click', event => {
    lastFocusedElement = event.currentTarget;
    menuModal.classList.add('open');
    menuModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.querySelector('.menu-modal-close').focus({ preventScroll: true });
  });
  document.querySelector('.menu-modal-close').addEventListener('click', closeMenu);
  document.querySelectorAll('[data-menu-image]').forEach(image => image.addEventListener('click', () => {
    closeMenu();
    openLightbox([{ type: 'image', src: image.dataset.menuImage, caption: image.alt }], 0, image);
  }));

  const heroVideo = document.querySelector('.hero-video');
  const heroToggle = document.querySelector('.hero-media-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    heroVideo.pause();
    heroVideo.hidden = true;
    heroToggle.hidden = true;
  } else {
    heroVideo.play().catch(() => {
      heroToggle.classList.add('paused');
      heroToggle.setAttribute('aria-pressed', 'true');
      heroToggle.setAttribute('aria-label', 'Phát video nền');
    });
    heroToggle.addEventListener('click', () => {
      if (heroVideo.paused) {
        heroVideo.play().catch(() => {});
        heroToggle.classList.remove('paused');
        heroToggle.setAttribute('aria-pressed', 'false');
        heroToggle.setAttribute('aria-label', 'Tạm dừng video nền');
      } else {
        heroVideo.pause();
        heroToggle.classList.add('paused');
        heroToggle.setAttribute('aria-pressed', 'true');
        heroToggle.setAttribute('aria-label', 'Phát video nền');
      }
    });
  }

  const bookingForm = document.querySelector('#booking-form');
  const bookingStatus = document.querySelector('#booking-status');
  const checkinInput = bookingForm.elements.checkin;
  const checkoutInput = bookingForm.elements.checkout;
  const toISODate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const nextDay = new Date(today); nextDay.setDate(today.getDate() + 2);
  checkinInput.min = toISODate(today);
  checkoutInput.min = toISODate(tomorrow);
  checkinInput.value = toISODate(tomorrow);
  checkoutInput.value = toISODate(nextDay);
  checkinInput.addEventListener('change', () => {
    const selected = new Date(`${checkinInput.value}T12:00:00`);
    selected.setDate(selected.getDate() + 1);
    checkoutInput.min = toISODate(selected);
    if (!checkoutInput.value || checkoutInput.value <= checkinInput.value) checkoutInput.value = toISODate(selected);
  });

  bookingForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    const data = new FormData(bookingForm);
    const message = [
      'Xin chào Venus Mũi Né Resort, tôi muốn kiểm tra phòng:',
      `- Nhận phòng: ${data.get('checkin')}`,
      `- Trả phòng: ${data.get('checkout')}`,
      `- Số khách: ${data.get('guests')}`,
      `- Nhu cầu: ${data.get('room')}`
    ].join('\n');

    const popup = window.open(zaloUrl, '_blank');
    if (popup) popup.opener = null;
    navigator.clipboard?.writeText(message).then(() => {
      bookingStatus.textContent = 'Đã sao chép yêu cầu. Khi Zalo mở, bạn chỉ cần dán nội dung và gửi cho lễ tân Venus.';
      bookingStatus.classList.add('show');
    }).catch(() => {
      bookingStatus.textContent = 'Zalo đang được mở. Vui lòng gửi ngày đi, số khách và nhu cầu phòng cho lễ tân Venus.';
      bookingStatus.classList.add('show');
    });
    if (!popup) window.location.href = zaloUrl;
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (lightbox.classList.contains('open')) closeLightbox();
      if (menuModal.classList.contains('open')) closeMenu();
      navigation.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
    if (lightbox.classList.contains('open') && event.key === 'ArrowLeft') showLightboxItem(lightboxIndex - 1);
    if (lightbox.classList.contains('open') && event.key === 'ArrowRight') showLightboxItem(lightboxIndex + 1);
  });

  document.querySelector('#year').textContent = new Date().getFullYear();
})();
