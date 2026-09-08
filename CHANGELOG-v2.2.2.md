# FriendZones Unified v2.2.2 — Audit giao diện & tối ưu hình ảnh

Audit toàn bộ trang chủ + 2 trang dự án (Venus Mũi Né Resort, Volga Hotel & Apartment).

## 🔤 Font (nguyên nhân chính của "font chữ bị lỗi")
- Phát hiện: `DESIGN.md` yêu cầu font **Lora** (tiêu đề) + **Be Vietnam Pro** (nội dung), nhưng không có file font nào được nạp trong toàn bộ dự án — cả 3 trang tự rơi về font hệ thống (Georgia/Times New Roman, Segoe UI Variable/Aptos/Arial), hiển thị khác nhau và không nhất quán tuỳ máy/trình duyệt.
- Đã tự host Lora (400/500/600/700) + Be Vietnam Pro (400–900), đầy đủ subset tiếng Việt lẫn Latin, tại `assets/css/fonts.css` — không phụ thuộc Google Fonts CDN (đúng chủ trương ban đầu của README), có `font-display:swap` và preload 2 weight hay dùng nhất.
- Cập nhật biến `--display`/`--body` ở `styles.css`, `venus-v2.css`, `volga styles.css`, `group-project-nav.css` để đồng bộ toàn hệ thống.

## 🎬 Hiệu ứng "hiện dần khi cuộn" (data-reveal)
- Phát hiện bug: trang chủ và Volga thêm class `reveal-ready` **sau** khi trang đã có frame vẽ đầu tiên (qua script hoãn `main.js`), khiến CSS transition không khởi động đúng trên một số trình duyệt — nội dung có lúc bị kẹt vĩnh viễn ở `opacity:0` (ẩn) hoặc `opacity:1` (không có hiệu ứng).
- Sửa: chuyển việc gắn class `reveal-ready` lên script inline chạy ngay đầu `<head>` (giống cách trang Venus đã làm đúng từ đầu).
- Thêm lưới an toàn (safety-net timeout 1.8s) ở cả 3 trang: nếu vì lý do gì đó hiệu ứng không chạy, nội dung vẫn tự động hiện đầy đủ — đảm bảo không bao giờ mất nội dung vì lỗi animation.

## 🖼 Hình ảnh
- Tăng nhẹ độ sáng/tương phản/độ nét cho 100 ảnh chụp thật (loại trừ toàn bộ logo/icon thương hiệu) ở cả 3 trang: trung bình sáng +4.4%, bão hoà màu +12% — có giới hạn thích ứng để ảnh vốn đã rực (ảnh đêm, đèn tiệc) không bị tăng quá tay.
- Nén lại ở chất lượng tối ưu hơn: tổng dung lượng 100 ảnh **giảm 5.4%** dù đã tăng chất lượng hình ảnh — tải nhanh hơn trên di động.
- Xoá `du-an/venus-mui-ne-resort/assets/` (thư mục ảnh/JS bản cũ, không còn được tham chiếu ở đâu — xác nhận bằng rà soát toàn bộ HTML/CSS/JS) — giảm **12MB** dung lượng gói không cần thiết.
- Sửa `du-an/venus-mui-ne-resort/site.webmanifest`: icon PWA trỏ sai đường dẫn (404 âm thầm) → trỏ đúng file favicon hiện có.

## Không thay đổi
- Cấu trúc HTML, layout, nội dung, giá phòng, thông tin liên hệ — giữ nguyên 100%.
- `login/`, `nhan-vien/`, `api/`, `supabase/` — không đụng tới (ngoài phạm vi "giao diện website khách hàng").
