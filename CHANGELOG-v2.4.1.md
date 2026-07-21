# FriendZones Unified v2.4.1 — Lodging media on Cloudflare R2

## Thay đổi

- Chuyển toàn bộ ảnh nội dung và video của Venus Mũi Né Resort sang `media.friendzonegroup.net/lodging/v1/venus/`.
- Chuyển toàn bộ ảnh Volga Hotel & Apartment sang `media.friendzonegroup.net/lodging/v1/volga/`.
- Chuyển ảnh Friendzones Hotel và Love Hotel sang hai vùng media riêng trên R2.
- Chuyển ảnh đại diện điều hướng của bốn thương hiệu lưu trú sang R2.
- Trang chủ, Open Graph, preload, gallery, lightbox, menu và video đã dùng URL R2.
- Giữ nguyên CSS, JavaScript hành vi, font, màu sắc và bố cục của Venus/Volga.
- Xóa media đã chuyển khỏi repository để giảm dung lượng deploy.

## Thứ tự triển khai

1. Upload bộ `friendzones-r2-media-v2-all-projects` lên bucket R2.
2. Chạy `verify-r2.bat` và kiểm tra các URL mẫu.
3. Deploy website v2.4.1 lên GitHub/Vercel.
