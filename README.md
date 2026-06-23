# Friendzone F&B Ops v1.0.1

App vận hành riêng cho Friendzone Group: nhà hàng + hotel. Bản này được tách khỏi app Đào Tạo Lái Xe và dùng prefix database `fnb_`.

## Phân hệ đã có trong bản v1

1. **Tổng quan điều hành**
   - Doanh thu hôm nay theo cơ sở.
   - Nhân sự đang làm.
   - Tin nhắn Page mới.
   - Cảnh báo tồn kho.
   - Công suất hotel.

2. **Chấm công**
   - Chọn nhân sự.
   - Check-in / Check-out.
   - Checklist cuối ca cho Nhà hàng và Hotel.
   - Ghi OFF demo cho nhân sự không chấm công.

3. **Kế toán nội bộ**
   - Phiếu thu/chi/chuyển quỹ.
   - Kết ca.
   - Đối soát tiền mặt/CK so với KiotViet.
   - Quỹ theo từng cơ sở.

4. **Khách hàng & AI**
   - Nhận/tạo tin nhắn Page.
   - AI rule-based phân loại nhu cầu: đặt bàn, karaoke, tiệc, hotel, khiếu nại.
   - Tạo Lead/Booking.
   - Tạo thông báo nhóm và tự che số điện thoại.

5. **Quản lý nhân sự**
   - Tạo mã quản lý `_QL`.
   - Tạo mã nhân sự `_01`, `_02`...
   - Chức danh, bộ phận, lương, quyền.

6. **KiotViet & Kho**
   - Dashboard doanh thu / món bán.
   - Định lượng món.
   - Tồn kho ước lượng = nhập/tồn đầu - bán ra theo định lượng.
   - Endpoint `/api/kiotviet-sync` để nối API KiotViet.

7. **Hotel**
   - Sơ đồ phòng.
   - Trạng thái sạch/bẩn/có khách/bảo trì.
   - Booking nhanh.
   - Housekeeping task.

## Cơ sở đã setup

- `GROUP_ALL`
- `NHA_GROUP` — Tất cả nhà hàng / nhóm tổng hợp
- `NHA_ALL` — All Night Food & Beer
- `NHA_SAIGONPHO` — Sài Gòn Phố - Beer Garden & Karaoke
- `NHA_FRZ`
- `HOTEL_ALL`
- `HOTEL_VENUS`
- `HOTEL_VOLGA`
- `HOTEL_A64`
- `HOTEL_FRZ`

Ghi chú: từ v1.0.1, `NHA_ALL` là cơ sở **All Night Food & Beer**. Mã tổng hợp toàn bộ nhà hàng đổi thành `NHA_GROUP`.

## Chạy thử local

Mở trực tiếp `index.html` bằng Live Server hoặc deploy lên Vercel. Nếu chưa cấu hình Supabase, app chạy bằng demo data trong `localStorage`.

## Deploy Vercel

1. Upload toàn bộ thư mục này lên GitHub.
2. Import repo vào Vercel.
3. Tạo Supabase project riêng cho F&B.
4. Chạy SQL:
   - `supabase/001_fnb_core_schema.sql`
   - `supabase/002_seed_friendzone_units.sql`
   - `supabase/003_views_reports.sql`
   - `supabase/004_fix_nha_all_allnight.sql` nếu đã từng chạy bản v1.0 trước đó
5. Copy `config.example.js` thành `config.js`, điền:

```js
window.FNB_CONFIG = {
  APP_NAME: 'Friendzone F&B Ops',
  APP_ENV: 'production',
  SUPABASE_URL: 'https://xxx.supabase.co',
  SUPABASE_ANON_KEY: 'xxx',
  DEFAULT_UNIT: 'GROUP_ALL',
  GROUP_NAME: 'Friendzone Group',
  PRIVACY_HIDE_PHONE_IN_GROUP: true,
  API_BASE: '/api'
};
```

6. Trên Vercel đặt Environment Variables:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
KIOTVIET_RETAILER=
KIOTVIET_CLIENT_ID=
KIOTVIET_CLIENT_SECRET=
KIOTVIET_WEBHOOK_SECRET=
META_VERIFY_TOKEN=
ZALO_GATEWAY_URL=
ZALO_GATEWAY_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID_FNB=
```

## API có sẵn

- `GET /api/health`
- `POST /api/ai-consult`
- `POST /api/page-message`
- `POST /api/notify-test`
- `POST /api/kiotviet-sync`
- `GET/POST /api/meta-webhook`
- `POST /api/kiot-webhook`

## Ghi chú bảo mật

- Bản v1 đang có RLS policy mở để test nội bộ nhanh.
- Khi go-live thật cần siết lại theo user/role/cơ sở.
- Thông báo nhóm đã có hàm che số điện thoại trước khi gửi.
- Không lưu Service Role Key trong `config.js`, chỉ đặt trong Vercel Environment Variables.

## Vòng tiếp theo nên làm

- Đăng nhập user thật bằng Supabase Auth.
- Phân quyền theo cơ sở và chức danh.
- Sync đầy đủ invoice/items/stock từ KiotViet.
- Webhook Facebook Page chính thức.
- AI tư vấn nối OpenAI/Gemini với thư viện câu trả lời riêng cho từng cơ sở.
- Payroll: lương, tăng ca, tạm ứng, thưởng/phạt.
