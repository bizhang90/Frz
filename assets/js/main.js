const projects = [
  {
    id: 'venus',
    category: 'stay',
    categoryLabel: 'LƯU TRÚ · RESORT',
    name: 'Venus Mũi Né Resort',
    description: 'Kỳ nghỉ gần biển với hồ bơi hướng biển, phòng nghỉ, bữa sáng, BBQ, cơm đoàn và trải nghiệm Mũi Né.',
    image: 'assets/img/brands/venus-resort.webp',
    location: 'Mũi Né',
    status: 'Đã có trang riêng',
    href: 'du-an/venus-mui-ne-resort/'
  },
  {
    id: 'volga',
    category: 'stay',
    categoryLabel: 'LƯU TRÚ · HOTEL & APARTMENT',
    name: 'Volga Hotel & Apartment',
    description: 'Lựa chọn lưu trú theo mô hình khách sạn và căn hộ dành cho chuyến đi ngắn ngày hoặc kỳ nghỉ dài hơn.',
    image: 'assets/img/brands/volga-hotel-apartment.svg',
    location: 'Mũi Né',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'friendzones-hotel',
    category: 'stay',
    categoryLabel: 'LƯU TRÚ · HOTEL',
    name: 'FriendZones Hotel',
    description: 'Điểm lưu trú trong hệ thống FriendZones, phù hợp cho khách du lịch, công tác, cặp đôi và nhóm bạn.',
    image: 'assets/img/brands/friendzones-hotel.webp',
    location: 'Phan Thiết – Mũi Né',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'love-hotel',
    category: 'stay',
    categoryLabel: 'LƯU TRÚ · HOTEL',
    name: 'Love Hotel A64',
    description: 'Không gian lưu trú riêng tư với phong cách nhận diện đặc trưng dành cho những kỳ nghỉ ngắn tại Phan Thiết.',
    image: 'assets/img/brands/love-hotel-a64.webp',
    location: 'Phan Thiết',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'friendzones-restaurant',
    category: 'food',
    categoryLabel: 'ẨM THỰC · NHÀ HÀNG',
    name: 'FriendZones Restaurant',
    description: 'Nhà hàng của hệ thống dành cho bữa ăn gia đình, nhóm bạn, khách đoàn và những dịp gặp gỡ tại Phan Thiết.',
    image: 'assets/img/brands/friendzones-restaurant.webp',
    location: 'Phan Thiết',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'saigonpho',
    category: 'social',
    categoryLabel: 'ẨM THỰC · KARAOKE',
    name: 'Sài Gòn Phố – Beer Garden & Karaoke',
    description: 'Không gian sân vườn thoáng mát, phòng VIP Karaoke và view ngắm biển; phù hợp sinh nhật, gặp bạn bè hoặc tiếp khách.',
    image: 'assets/img/brands/sai-gon-pho.webp',
    location: 'Ocean Dunes, Phan Thiết',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'allnight',
    category: 'social',
    categoryLabel: 'ẨM THỰC · FOOD & BEER',
    name: 'All Night Food & Beer',
    description: 'Không gian ăn uống và gặp gỡ về đêm dành cho nhóm bạn, những buổi hội họp và trải nghiệm Food & Beer.',
    image: 'assets/img/brands/all-night-food-beer.webp',
    location: '79 Lê Duẩn, Phan Thiết',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'thung',
    category: 'food',
    categoryLabel: 'ẨM THỰC · VIEW HỒ',
    name: 'THÚNG View Hồ Tôm',
    description: 'Điểm ăn uống với hình ảnh chiếc thúng đặc trưng và không gian view hồ dành cho khách địa phương lẫn du khách.',
    image: 'assets/img/brands/thung-view-ho-tom.webp',
    location: 'Phan Thiết',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'chammm',
    category: 'food',
    categoryLabel: 'ẨM THỰC · MÓN ĐỊA PHƯƠNG',
    name: 'Chấmmm Phan Thiết',
    description: 'Thương hiệu ẩm thực mang tinh hoa gói trọn trong mỗi lần chấm, hướng đến trải nghiệm gần gũi và đậm vị.',
    image: 'assets/img/brands/chammm-phan-thiet.webp',
    location: 'Phan Thiết',
    status: 'Đang cập nhật',
    href: ''
  },
  {
    id: 'phan-coffee',
    category: 'food',
    categoryLabel: 'ẨM THỰC · CÀ PHÊ',
    name: 'Phan Coffee',
    description: 'Điểm hẹn cà phê trong hệ thống, phù hợp để gặp gỡ, làm việc hoặc bắt đầu một ngày tại Phan Thiết.',
    image: 'assets/img/brands/phan-coffee.webp',
    location: 'Phan Thiết',
    status: 'Đang cập nhật',
    href: ''
  }
];

const grid = document.querySelector('#project-grid');
const filters = [...document.querySelectorAll('[data-filter]')];

function renderProjects(filter = 'all') {
  const data = filter === 'all' ? projects : projects.filter(project => project.category === filter);
  grid.innerHTML = data.map(project => {
    const hasPage = Boolean(project.href);
    const link = hasPage
      ? `<a class="project-link" href="${project.href}">Khám phá →</a>`
      : `<span class="project-link disabled">Sắp có trang riêng</span>`;
    return `<article class="project-card" data-category="${project.category}">
      <div class="project-logo"><img src="${project.image}" alt="${project.name}" loading="lazy"></div>
      <div class="project-body">
        <div class="project-meta"><span class="project-category">${project.categoryLabel}</span><span class="project-status ${hasPage ? '' : 'updating'}">${project.status}</span></div>
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <div class="project-footer"><span class="project-location">📍 ${project.location}</span>${link}</div>
      </div>
    </article>`;
  }).join('');
}

filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  renderProjects(button.dataset.filter);
}));

document.querySelectorAll('[data-quick-filter]').forEach(link => link.addEventListener('click', () => {
  const target = filters.find(button => button.dataset.filter === link.dataset.quickFilter);
  if (target) target.click();
}));

const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30), { passive: true });
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

document.querySelector('#year').textContent = new Date().getFullYear();
renderProjects();
