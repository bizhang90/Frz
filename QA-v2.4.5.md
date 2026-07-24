# QA v2.4.5

## THÚNG menu
- `menu`: 35 trang thực đơn gọi món.
- `groupMenu`: 14 trang menu cơm đoàn.
- Hai nhóm được mở trong cùng `menu-browser`.
- Nút ở khu Khách đoàn chuyển thẳng sang tab Cơm đoàn trong mục Thực đơn.
- Click từng trang dùng chung lightbox đã hoạt động ổn định với thực đơn gọi món.

## Cache
- CSS và JavaScript trang nhà hàng dùng query `?v=2.4.5`.
- `fetch()` JSON dùng `cache: no-store`.
- Vercel không còn đặt toàn bộ `/assets/*` ở chế độ immutable.
- Ảnh và font vẫn giữ cache dài; JS, CSS và JSON được revalidate.

## Bảo toàn
- Không thay media R2.
- Không thay CSS/JS riêng của Venus hoặc Volga.
- Không chứa `.env`, Access Key hay Secret Key.
