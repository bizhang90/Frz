# Xác thực nhân viên v2.5.0

Bản này đã chuyển sang mô hình production: Supabase Auth + hồ sơ `fnb_staff.auth_user_id` + RLS theo vai trò, quyền và cơ sở.

Không còn dùng đăng nhập demo khi `APP_ENV=production`.

Thực hiện toàn bộ hướng dẫn tại [`SETUP-HR-ATTENDANCE-PRODUCTION.md`](SETUP-HR-ATTENDANCE-PRODUCTION.md), đặc biệt các bước migration 005, bootstrap ADMIN đầu tiên và cấu hình Service Role Key trên Vercel.

Tuyệt đối không đưa `SUPABASE_SERVICE_ROLE_KEY` vào `nhan-vien/config.js` hoặc GitHub.
