# FriendZones Unified v2.2.0 — Venus Resort Redesign

## Phạm vi cập nhật

Bản này thiết kế lại trang `/du-an/venus-mui-ne-resort/` dựa trên bộ ảnh và video Venus thực tế, không thay đổi luồng đăng nhập, App nhân viên, API F&B/Hotel hoặc trang Volga.

## Venus Resort

- Hero điện ảnh với video loop nhẹ và ảnh fallback.
- Form kiểm tra phòng gửi nội dung ngày đi, ngày về, số khách và nhu cầu qua Zalo.
- Bổ sung các khu vực trải nghiệm: hồ bơi, biển, khuôn viên, nhà ăn, BBQ, khách đoàn, team building và gala.
- Hiển thị 5 hạng phòng với bộ lọc cặp đôi/gia đình/hướng biển/hướng vườn.
- Gallery masonry có bộ lọc và lightbox.
- Video tour cho các hạng phòng có media.
- Menu món ăn mở dạng modal.
- Timeline một ngày tại Venus, FAQ và CTA mobile gọi/Zalo/bản đồ.
- SEO mới: title, description, canonical, Open Graph, Resort schema và FAQ schema.
- Toàn bộ ảnh ngoại cảnh được đổi tên chuẩn SEO, nén WebP và lazy-load.
- Không phụ thuộc Google Fonts; tối ưu responsive từ mobile đến desktop.

## Media mới

- 24 ảnh WebP trải nghiệm thực tế.
- 01 ảnh Open Graph 1200×630.
- 01 video hero MP4 tối ưu từ ảnh Venus thực tế.
- Giữ nguyên thư viện ảnh/video phòng từ phiên bản trước.

## Kiểm tra

- Kiểm tra cú pháp JavaScript trang Venus.
- Kiểm tra JSON-LD.
- Kiểm tra trùng ID, cấu trúc heading và toàn bộ đường dẫn asset nội bộ.
- Chạy lint backend hiện có để bảo đảm phần vận hành không bị ảnh hưởng.
