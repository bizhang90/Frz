# FriendZones Group — Unified Website + Employee Portal v1.1.0

Bản hợp nhất website công khai FriendZones Group và App vận hành F&B/Hotel trong cùng một project Vercel.

## Luồng sử dụng

- Khách hàng truy cập `/` để xem hệ sinh thái và các dự án.
- Nhân viên chọn **Đăng nhập** để vào `/login/`.
- Sau khi đăng nhập, hệ thống mở `/nhan-vien/`.
- Venus Resort nằm tại `/du-an/venus-mui-ne-resort/`.
- API cũ được giữ nguyên dưới `/api/*`.

## Cấu trúc chính

```text
/
├── index.html                      Website chính
├── assets/                         Ảnh, CSS, JS website
├── du-an/venus-mui-ne-resort/      Trang Venus Resort
├── login/                          Màn hình đăng nhập nhân viên
├── nhan-vien/                      App F&B + Hotel hiện tại
├── api/                            Vercel Functions
├── api_src/                        Backend source
├── supabase/                       SQL schema/seed
├── docs/                           Thông tin cơ sở
├── package.json
└── vercel.json
```

## Deploy Vercel

1. Đưa toàn bộ nội dung trong thư mục này vào root repository.
2. Vercel Framework Preset: **Other**.
3. Root Directory: `./`.
4. Build Command và Output Directory: để trống.
5. Thêm các Environment Variables backend theo `SETUP-FNB.md`.
6. Cấu hình đăng nhập theo `AUTH-SETUP.md`.

## Không làm thay đổi route API

Các endpoint như sau vẫn giữ nguyên:

- `/api/health`
- `/api/page-message`
- `/api/meta-webhook`
- `/api/kiotviet-sync`
- `/api/notify-test`

## Phiên bản

`v1.1.0-unified-home-login-employee-portal`
