# FriendZones — Website + Employee Portal v2.2.1

Dự án hợp nhất website FriendZones, các trang địa điểm lưu trú và App vận hành F&B/Hotel trong cùng một project Vercel.

## Luồng sử dụng

- Khách hàng truy cập `/` để xem các địa điểm lưu trú, ẩm thực và vui chơi.
- Nhân viên chọn **Nhân viên** để vào `/login/` rồi mở `/nhan-vien/` sau khi đăng nhập.
- Venus Mũi Né Resort: `/du-an/venus-mui-ne-resort/`.
- Volga Hotel & Apartment: `/du-an/volga-hotel-apartment/`.
- API vận hành tiếp tục hoạt động dưới `/api/*`.

## Cấu trúc chính

```text
/
├── index.html                         Website chính
├── assets/                            Ảnh, CSS, JS website
├── du-an/venus-mui-ne-resort/         Trang Venus Resort
├── du-an/volga-hotel-apartment/       Trang Volga Hotel & Apartment
├── login/                             Màn hình đăng nhập nhân viên
├── nhan-vien/                         App F&B + Hotel hiện tại
├── api/                               Vercel Functions
├── api_src/                           Backend source
├── supabase/                          SQL schema/seed
├── sitemap.xml
├── package.json
└── vercel.json
```

## Deploy Vercel

1. Đưa toàn bộ nội dung trong thư mục này vào root repository.
2. Vercel Framework Preset: **Other**.
3. Root Directory: `./`.
4. Build Command và Output Directory: để trống.
5. Thêm Environment Variables backend theo `SETUP-FNB.md`.
6. Cấu hình đăng nhập theo `AUTH-SETUP.md`.
7. Redeploy Production và kiểm tra các đường dẫn `/`, `/du-an/venus-mui-ne-resort/`, `/du-an/volga-hotel-apartment/`, `/login/` và `/nhan-vien/`.

## Website công khai v2.2

- Trang chủ giới thiệu chung toàn bộ FriendZones.
- Menu con **Các dự án** chứa Venus Mũi Né Resort và Volga Hotel & Apartment.
- Hotline/Zalo chung: `0877 706 677`.
- Venus sử dụng hotline riêng `0819 08 1111`.
- Volga sử dụng hotline riêng `088 846 47 77`.
- Ảnh hero độ phân giải cao, logo thương hiệu, gradient và hiệu ứng chuyển động đã được bổ sung.
- Không phụ thuộc Google Fonts; sử dụng font hệ thống hỗ trợ tiếng Việt.
- Trang Venus v2.2 sử dụng ảnh/video thực tế, hero cinematic, gallery lọc theo chủ đề, video tour, form kiểm tra phòng và CTA mobile.

## API giữ nguyên

- `/api/health`
- `/api/page-message`
- `/api/meta-webhook`
- `/api/kiotviet-sync`
- `/api/notify-test`

## Phiên bản

`v2.2.1-project-menu-restored`
