# Khôi phục sau lỗi SQL v2.5.0

Ba lỗi `month`, `location_verified` và `auth_user_id` có cùng một nguyên nhân: migration 005 dừng tại câu tạo view tháng, vì vậy transaction bị rollback và các cột mới không được tạo.

## Thứ tự chạy

1. Chạy lại toàn bộ `supabase/005_hr_attendance_production.sql` của bản v2.5.1.
2. Chỉ khi bước 1 báo thành công, tạo user Admin trong Supabase Authentication.
3. Sửa email trong `supabase/006_bootstrap_first_admin_template.sql`, rồi chạy file 006.
4. Chạy `supabase/007_post_deploy_verification.sql`.

Không chạy riêng câu alias hoặc chạy 006/007 trước khi migration 005 thành công.
