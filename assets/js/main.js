const projects = [
  {
    id: 'venus', category: 'stay', theme: 'stay', categoryLabel: 'Resort gần biển',
    name: 'Venus Mũi Né Resort',
    description: 'Phòng view biển và view vườn, hồ bơi hướng biển, bữa sáng, BBQ và trải nghiệm dành cho gia đình, nhóm bạn, khách đoàn.',
    image: '/assets/img/brands/venus-resort.webp', location: 'Mũi Né', href: '/du-an/venus-mui-ne-resort/'
  },
  {
    id: 'volga', category: 'stay', theme: 'stay', categoryLabel: 'Hotel & Apartment',
    name: 'Volga Hotel & Apartment',
    description: 'Không gian lưu trú kết hợp khách sạn và căn hộ, phù hợp cho chuyến đi ngắn ngày, công tác hoặc kỳ nghỉ dài hơn.',
    image: '/assets/img/brands/volga-hotel-apartment.webp', location: 'Mũi Né', href: ''
  },
  {
    id: 'friendzones-hotel', category: 'stay', theme: 'stay', categoryLabel: 'Khách sạn',
    name: 'FriendZones Hotel',
    description: 'Điểm lưu trú thuận tiện dành cho khách du lịch, người đi công tác, cặp đôi và nhóm bạn tại Phan Thiết – Mũi Né.',
    image: '/assets/img/brands/friendzones-hotel.webp', location: 'Phan Thiết – Mũi Né', href: ''
  },
  {
    id: 'love-hotel', category: 'stay', theme: 'stay', categoryLabel: 'Khách sạn',
    name: 'Love Hotel A64',
    description: 'Không gian lưu trú riêng tư với phong cách nhận diện đặc trưng, phù hợp cho những kỳ nghỉ ngắn tại Phan Thiết.',
    image: '/assets/img/brands/love-hotel-a64.webp', location: 'Phan Thiết', href: ''
  },
  {
    id: 'friendzones-restaurant', category: 'food', theme: 'food', categoryLabel: 'Nhà hàng',
    name: 'FriendZones Restaurant',
    description: 'Không gian dùng bữa dành cho gia đình, nhóm bạn, khách đoàn và những dịp gặp gỡ tại Phan Thiết.',
    image: '/assets/img/brands/friendzones-restaurant.webp', location: 'Phan Thiết', href: ''
  },
  {
    id: 'saigonpho', category: 'social', theme: 'social', categoryLabel: 'Beer Garden & Karaoke',
    name: 'Sài Gòn Phố',
    description: 'Sân vườn thoáng mát, phòng VIP Karaoke và view ngắm biển; phù hợp cho sinh nhật, gặp gỡ bạn bè hoặc tiếp khách.',
    image: '/assets/img/brands/sai-gon-pho.webp', location: 'Ocean Dunes, Phan Thiết', href: ''
  },
  {
    id: 'allnight', category: 'social', theme: 'social', categoryLabel: 'Food & Beer',
    name: 'All Night Food & Beer',
    description: 'Không gian ăn uống và gặp gỡ về đêm dành cho nhóm bạn, những buổi hội họp và trải nghiệm Food & Beer.',
    image: '/assets/img/brands/all-night-food-beer.webp', location: '79 Lê Duẩn, Phan Thiết', href: ''
  },
  {
    id: 'thung', category: 'food', theme: 'food', categoryLabel: 'Ẩm thực view hồ',
    name: 'THÚNG View Hồ Tôm',
    description: 'Điểm ăn uống với không gian view hồ, phù hợp cho những bữa ăn thư giãn cùng gia đình và bạn bè.',
    image: '/assets/img/brands/thung-view-ho-tom.webp', location: 'Phan Thiết', href: ''
  },
  {
    id: 'chammm', category: 'food', theme: 'food', categoryLabel: 'Ẩm thực địa phương',
    name: 'Chấmmm Phan Thiết',
    description: 'Hương vị gần gũi và đậm chất địa phương, mang tinh hoa gói trọn trong mỗi lần chấm.',
    image: '/assets/img/brands/chammm-phan-thiet.webp', location: 'Phan Thiết', href: ''
  },
  {
    id: 'phan-coffee', category: 'food', theme: 'food', categoryLabel: 'Cà phê',
    name: 'Phan Coffee',
    description: 'Điểm hẹn cà phê phù hợp để gặp gỡ, làm việc hoặc bắt đầu một ngày mới tại Phan Thiết.',
    image: '/assets/img/brands/phan-coffee.webp', location: 'Phan Thiết', href: ''
  }
];

const grid = document.querySelector('#project-grid');
const filters = [...document.querySelectorAll('[data-filter]')];

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -45px' })
  : { observe(element) { element.classList.add('is-visible'); }, unobserve() {} };

function observeRevealElements(root = document) {
  root.querySelectorAll('[data-reveal]:not(.is-observed)').forEach(element => {
    element.classList.add('is-observed');
    element.style.setProperty('--reveal-delay', `${Number(element.dataset.delay || 0)}ms`);
    revealObserver.observe(element);
  });
}

function renderProjects(filter = 'all') {
  const data = filter === 'all' ? projects : projects.filter(project => project.category === filter);
  grid.innerHTML = data.map((project, index) => {
    const action = project.href
      ? `<a class="project-link" href="${project.href}" aria-label="Khám phá ${project.name}">Khám phá <span>↗</span></a>`
      : '';
    return `<article class="project-card theme-${project.theme}" data-category="${project.category}" data-reveal data-delay="${Math.min(index * 55, 275)}">
      <div class="project-logo"><img src="${project.image}" alt="${project.name}" loading="lazy"></div>
      <div class="project-body">
        <span class="project-category">${project.categoryLabel}</span>
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <div class="project-footer"><span>${project.location}</span>${action}</div>
      </div>
    </article>`;
  }).join('');
  observeRevealElements(grid);
}

function activateFilter(filter, shouldScroll = false) {
  const target = filters.find(button => button.dataset.filter === filter) || filters[0];
  filters.forEach(button => {
    const active = button === target;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  renderProjects(target.dataset.filter);
  if (shouldScroll) document.querySelector('#dia-diem')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

filters.forEach(button => button.addEventListener('click', () => activateFilter(button.dataset.filter)));
document.querySelectorAll('[data-quick-filter]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  activateFilter(link.dataset.quickFilter, true);
}));

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 28);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
});

document.querySelector('#year').textContent = new Date().getFullYear();
renderProjects();
observeRevealElements();
