# FriendZones Group — Website + Employee Portal v1.2.0

Dự án hợp nhất website FriendZones Group, trang Venus Mũi Né Resort và App vận hành F&B/Hotel trong cùng một project Vercel.

## Luồng sử dụng

- Khách hàng truy cập `/` để xem các địa điểm lưu trú, ẩm thực và vui chơi.
- Nhân viên chọn **Nhân viên** để vào `/login/`.
- Sau khi đăng nhập, hệ thống mở `/nhan-vien/`.
- Venus Resort nằm tại `/du-an/venus-mui-ne-resort/`.
- API vận hành tiếp tục hoạt động dưới `/api/*`.

## Cấu trúc chính

```text
/
├── index.html                      Website chính
├── assets/                         Ảnh, CSS, JS website
├── du-an/venus-mui-ne-resort/      Trang Venus Resort + đầy đủ assets
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
7. Redeploy Production, sau đó kiểm tra cả `/` và `/du-an/venus-mui-ne-resort`.

## Lưu ý quan trọng về trang Venus

Toàn bộ đường dẫn CSS, JavaScript và hình ảnh của Venus đã chuyển sang đường dẫn tuyệt đối. Vì vậy trang vẫn hiển thị đúng khi Vercel tự bỏ dấu `/` cuối URL.

## API giữ nguyên

- `/api/health`
- `/api/page-message`
- `/api/meta-webhook`
- `/api/kiotviet-sync`
- `/api/notify-test`

## Phiên bản

`v1.2.0-customer-facing-home-venus-assets-volga-animation`
