# FriendZones Unified v2.4.6 — Audit toàn bộ giao diện (9 trang dự án)

Audit lại toàn bộ trang chủ + 9 trang dự án (Venus, Volga, Khách Sạn Tại Phan Thiết,
Nhà hàng FriendZones, Sài Gòn Phố, All Night Food & Beer, THÚNG View Hồ Tôm, Chấmmm,
Phan Coffee) sau khi media chuyển sang R2 (`media.friendzonegroup.net`).

## ✅ Xác nhận không hồi quy
- Font tự host (Lora + Be Vietnam Pro) và hiệu ứng reveal + safety-net từ bản v2.2.2
  vẫn nguyên vẹn trên toàn bộ trang mới.
- Bug "menu cơm đoàn THÚNG không mở" (đã sửa ở v2.4.5) — test lại: hoạt động đúng.

## 🐛 Lỗi tìm thấy và đã sửa

### SEO — canonical/og:url sai trên 6 trang nhà hàng
`chammm`, `all-night-food-beer`, `sai-gon-pho`, `phan-coffee`, `nha-hang-friendzones`,
`thung-view-ho-tom` tự khai canonical URL có dấu `/` cuối, mâu thuẫn với `sitemap.xml`
và chính sách `trailingSlash:false` trong `vercel.json` → nguy cơ Google hiểu nhầm là
2 URL khác nhau (duplicate content). Đã sửa cả 6 trang.

### 148 link nội bộ không đồng nhất dấu `/` cuối
Trang chủ, Venus, Volga, Khách Sạn Tại Phan Thiết trỏ link theo cả 2 kiểu (có và không
có `/` cuối) trong khi 6 trang nhà hàng chỉ dùng kiểu có `/` — đã chuẩn hoá toàn bộ về
dạng canonical (không `/` cuối) theo đúng `vercel.json`.

### File CSS/JS trùng lặp gây rối
`assets/css/styles-v2.4.0.css` + `assets/js/main-v2.4.0.js` đang được dùng thật, trong
khi `assets/css/styles.css` + `assets/js/main.js` (không hậu tố) là bản cũ mồ côi,
không còn nơi nào gọi tới — dễ gây nhầm lẫn cho người sửa sau. Đã xoá bản mồ côi, đổi
tên bản đang dùng về tên chuẩn (`styles.css`, `main.js`) và chuyển sang cache-busting
bằng query string (`?v=2.4.6`) để tránh lặp lại kiểu đặt tên gắn số bản vào file ở các
lần cập nhật sau.

### `restaurant-project.js` thiếu lưới an toàn cho hiệu ứng reveal
5 file JS khác trong hệ thống đều có safety-net (ép hiện nội dung sau 1.8s nếu
transition không chạy đúng), riêng file dùng chung cho 6 trang nhà hàng thì chưa có.
Đã bổ sung cho đồng bộ.

## ✅ Đã verify bằng script tự động (toàn bộ 10 trang: trang chủ + 9 dự án)
- 0 lỗi console JS
- 0 link nội bộ hỏng (404)
- 0 lỗi tràn ngang ở mobile 375px
- Nav mobile (hamburger) hoạt động trên cả 10 trang
- Toàn bộ ảnh tĩnh có `alt`, title/meta description mỗi trang duy nhất, không trùng
- Gallery lightbox và menu tab (Gọi món / Cơm đoàn) hoạt động đúng

## Đã kiểm tra, không phải lỗi
- "Phan Thiết, Lâm Đồng" trong mô tả All Night Food & Beer và Phan Coffee — **đúng**,
  Bình Thuận sáp nhập vào tỉnh Lâm Đồng từ 1/7/2025 (Nghị quyết 202/2025/QH15). 8 trang
  còn lại chỉ ghi "Phan Thiết"/"Mũi Né" không sai, chỉ khác mức độ chi tiết — không sửa
  vì đây là lựa chọn nội dung, không phải lỗi kỹ thuật.

## Không thay đổi
- Ảnh trên R2 (`media.friendzonegroup.net`) không thể truy cập trực tiếp từ môi trường
  audit này (ngoài whitelist mạng) nên không tự ý chỉnh sửa ảnh lần này — chỉ audit
  code, layout và hành vi JS.
- `login/`, `nhan-vien/`, `api/`, `supabase/` — không đụng tới.
