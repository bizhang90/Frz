# FriendZones — Website + Employee Portal v1.4.0

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

## Trang Volga v1

- Sử dụng ảnh thực tế trong file ảnh Volga do chủ dự án cung cấp.
- Có 6 nhóm phòng cho 2–15 khách.
- Có lightbox hình ảnh, trang tiện ích, vị trí, Facebook, Google Maps và CTA gọi đặt phòng.
- Ảnh đã chuyển sang WebP và tối ưu kích thước.

## API giữ nguyên

- `/api/health`
- `/api/page-message`
- `/api/meta-webhook`
- `/api/kiotviet-sync`
- `/api/notify-test`

## Phiên bản

`v1.4.0-volga-project-page`
