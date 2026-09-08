# Go-live checklist v2.5.0

Không mở hệ thống cho toàn bộ nhân viên khi còn bất kỳ mục bắt buộc nào chưa hoàn tất.

## Database và bảo mật

- [ ] Đã backup Supabase.
- [ ] Migration `005_hr_attendance_production.sql` chạy thành công.
- [ ] ADMIN đầu tiên đã liên kết bằng `006_bootstrap_first_admin_template.sql`.
- [ ] Chạy `007_post_deploy_verification.sql`; không còn policy demo hoặc quyền bảng cho anon.
- [ ] Kiểm tra ADMIN, MANAGER, STAFF và trình duyệt chưa đăng nhập.

## Vercel và xác thực

- [ ] Đã cấu hình `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FNB_AUTH_REDIRECT_URL`, `CRON_SECRET`.
- [ ] SMTP Supabase gửi được email mời và đặt lại mật khẩu.
- [ ] `/login/`, `/nhan-vien/`, `/api/health` hoạt động trên HTTPS.
- [ ] Báo cáo cron 21:35 gửi đúng nhóm thử nghiệm.

## GPS

- [ ] Đã đứng tại từng cơ sở để lưu vị trí thật.
- [ ] Kiểm tra chấm công trong bán kính thành công.
- [ ] Kiểm tra ngoài bán kính bị từ chối.
- [ ] Kiểm tra GPS sai số lớn bị từ chối.
- [ ] Bán kính không bị đặt quá rộng.

## Dữ liệu nhân sự

- [ ] Mỗi nhân viên có email riêng và hồ sơ Auth liên kết.
- [ ] Đúng cơ sở chính, cơ sở bổ sung, chức danh, bộ phận, quản lý trực tiếp.
- [ ] Đúng chế độ chấm công và số giờ dự kiến.
- [ ] Đúng quyền; nhân viên thường không thấy Nhân sự/Kế toán/Cấu hình.
- [ ] Hồ sơ đã nghỉ việc không đăng nhập được.

## Luồng chấm công

- [ ] Check-in và checkout lưu Supabase trên hai điện thoại khác nhau.
- [ ] Bấm hai lần không tạo trùng.
- [ ] Có thể có nhiều phiên trong một ngày.
- [ ] Không checkout thì phiên vẫn mở qua ngày.
- [ ] Phiên quá 24 giờ buộc dùng điều chỉnh, không tự đóng.
- [ ] Điều chỉnh, nghỉ phép và sửa giờ có audit/người duyệt.
- [ ] Chấm tại cơ sở khác lịch được gắn cảnh báo.

## Báo cáo

- [ ] Đã lập lịch giờ dự kiến/đánh OFF cho tháng thử nghiệm.
- [ ] Báo cáo đủ/thiếu phút đúng với dữ liệu mẫu.
- [ ] Đi trễ/về sớm đúng khi có giờ dự kiến.
- [ ] Xuất CSV mở đúng tiếng Việt và đủ cột đối soát.
