# Cấu hình đăng nhập nhân viên

## Cấu trúc

- `/` — website công khai FriendZones Group.
- `/login/` — màn hình đăng nhập nhân viên.
- `/nhan-vien/` — App vận hành F&B + Hotel.
- `/api/*` — API backend hiện có.

## Chạy thử giao diện

Mặc định `nhan-vien/config.js` đang để:

```js
APP_ENV: 'demo'
```

Ở chế độ này, trang đăng nhập hiển thị nút **Vào bản demo nội bộ**. Chế độ demo chỉ dùng kiểm thử giao diện và không phải lớp bảo mật production.

## Bật Supabase Auth

1. Mở Supabase → Authentication → Providers → bật Email.
2. Tạo tài khoản nhân viên trong Authentication → Users.
3. Cập nhật `nhan-vien/config.js`:

```js
window.FNB_CONFIG = {
  APP_NAME: 'FriendZones Group · Màn hình nhân viên',
  APP_ENV: 'production',
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
  DEFAULT_UNIT: 'GROUP_ALL',
  GROUP_NAME: 'Friendzone Group',
  PRIVACY_HIDE_PHONE_IN_GROUP: true,
  API_BASE: '/api'
};
```

4. Deploy lại Vercel.
5. Truy cập `/login/` và đăng nhập bằng email/mật khẩu nhân viên.

## Cảnh báo bảo mật cần xử lý trước khi dùng thật

Schema hiện tại trong `supabase/001_fnb_core_schema.sql` còn policy mở cho `anon/authenticated` vì đây là bản nội bộ demo. Màn hình đăng nhập phía trước không thay thế bảo mật database.

Trước khi đưa dữ liệu tài chính, nhân sự và khách hàng thật lên production, cần:

- Liên kết `auth.users.id` với hồ sơ nhân viên.
- Siết RLS theo cơ sở, vai trò và quyền của nhân viên.
- Chặn anon đọc/ghi các bảng `fnb_*`.
- Kiểm tra quyền API server-side thay vì chỉ dựa vào giao diện.
