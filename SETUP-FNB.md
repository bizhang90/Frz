# Hướng dẫn setup Friendzone F&B Ops

## 1. Tạo Supabase riêng

Không dùng chung Supabase với app Đào Tạo Lái Xe. Tạo project mới, ví dụ:

`friendzone-fnb-ops`

Sau đó vào SQL Editor chạy lần lượt:

1. `supabase/001_fnb_core_schema.sql`
2. `supabase/002_seed_friendzone_units.sql`
3. `supabase/003_views_reports.sql`
4. Nếu đã chạy bản v1.0 cũ: `supabase/004_fix_nha_all_allnight.sql`

## 2. Cấu hình frontend

Copy:

`config.example.js` → `config.js`

Điền URL và anon key của Supabase.

## 3. Cấu hình Vercel Environment Variables

Tối thiểu cần:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Nếu dùng thông báo:

```text
ZALO_GATEWAY_URL=
ZALO_GATEWAY_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID_FNB=
```

Nếu dùng KiotViet:

```text
KIOTVIET_RETAILER=
KIOTVIET_CLIENT_ID=
KIOTVIET_CLIENT_SECRET=
KIOTVIET_WEBHOOK_SECRET=
```

Nếu dùng Meta Messenger:

```text
META_VERIFY_TOKEN=
META_PAGE_ACCESS_TOKEN=
```

## 4. Quy tắc mã cơ sở / nhân sự

Quản lý:

```text
NHA_GROUP_QL
NHA_ALL_QL
NHA_SAIGONPHO_QL
NHA_FRZ_QL
HOTEL_VENUS_QL
HOTEL_VOLGA_QL
HOTEL_A64_QL
HOTEL_FRZ_QL
```

Nhân sự:

```text
NHA_ALL_01
NHA_ALL_02
NHA_SAIGONPHO_01
NHA_SAIGONPHO_02
NHA_FRZ_01
HOTEL_VENUS_01
```

Nếu nhiều quản lý một cơ sở:

```text
NHA_SAIGONPHO_QL01
NHA_SAIGONPHO_QL02
```


Lưu ý mã cơ sở:

```text
NHA_GROUP = nhóm tổng hợp tất cả nhà hàng
NHA_ALL = All Night Food & Beer
```

## 5. KiotViet vận hành đúng

- KiotViet vẫn là POS chính.
- App Friendzone F&B Ops không thay POS.
- App này làm lớp điều hành: phân tích, báo cáo, cảnh báo, đối soát, AI khách hàng.

Luồng chuẩn:

```text
KiotViet bán hàng
→ API kéo hóa đơn/items/tồn kho
→ App phân tích doanh thu/món bán
→ App trừ tồn kho ước lượng theo định lượng món
→ Cuối ca đối soát tiền mặt/CK
→ Báo cáo quản lý/chủ
```

## 6. Checklist go-live thật

- Tạo tài khoản quản lý từng cơ sở.
- Nhập danh sách nhân sự thật.
- Nhập danh mục quỹ tiền mặt/CK thật.
- Nhập định lượng 20 món bán chạy đầu tiên.
- Kết nối KiotViet branch mapping.
- Kết nối Page Messenger.
- Test thông báo nhóm không lộ số điện thoại.
- Test kết ca lệch tiền.
- Test booking hotel và housekeeping.
