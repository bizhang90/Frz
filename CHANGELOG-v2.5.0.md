# FriendZones Unified v2.5.0 — HR & Attendance Production

## Chấm công

- Chấm công theo **thời gian làm việc thực tế**, không dùng khái niệm ca để tính công.
- Cho phép nhiều phiên check-in/check-out trong một ngày.
- **Không tự động checkout** dưới bất kỳ hình thức nào.
- Check-in và checkout đều xác thực GPS tại cơ sở.
- Hệ thống tự nhận diện cơ sở gần nhất trong danh sách nhân sự được phân công.
- Chặn bấm trùng ở cấp database bằng partial unique index và mã yêu cầu idempotent; retry mạng không tạo bản ghi thứ hai.
- Ghi độ chính xác GPS, khoảng cách tới cơ sở, thiết bị và audit log.
- Quên checkout phải gửi yêu cầu điều chỉnh và quản lý duyệt.

## Nhân sự

- Liên kết một `auth.users.id` với đúng một hồ sơ nhân viên.
- Nhân viên không còn được chọn tên người khác để chấm công.
- Tạo nhân viên bằng email mời Supabase Auth qua API server có xác thực.
- Hỗ trợ nhân viên làm nhiều cơ sở, chuyển cơ sở chính và phân công hỗ trợ có thời hạn.
- Hỗ trợ trạng thái đang làm, thử việc, tạm nghỉ, nghỉ việc.
- Hỗ trợ chấm công theo giờ hoặc không chấm công.
- Phân quyền giao diện và dữ liệu theo vai trò/quyền/cơ sở.

## Lịch và báo cáo

- Lập số giờ dự kiến theo từng ngày hoặc nhiều ngày.
- OFF, nghỉ phép, ngày lễ không được tạo tự động.
- Đơn nghỉ và điều chỉnh giờ có quy trình chờ duyệt.
- Báo cáo ngày/tháng: dự kiến, thực tế, thiếu, tăng thêm, đi trễ, về sớm, khác lịch/cơ sở và chưa checkout.
- Xuất CSV bảng công có dữ liệu lương nền để đối soát.
- Phân trang dữ liệu và chỉ tải khoảng thời gian vận hành cần thiết để không chạm giới hạn 5.000 dòng.

## Bảo mật

- Xóa toàn bộ policy demo mở cho anon/authenticated.
- RLS production theo `auth.uid()`, hồ sơ nhân viên, cơ sở, vai trò và quyền.
- Thao tác nhạy cảm dùng RPC `security definer` hoặc API service-role đã xác thực.
- Thêm audit log cho chấm công và thay đổi GPS cơ sở.
- Bật `Permissions-Policy: geolocation=(self)`.

## Hoàn thiện vận hành

- Hồ sơ nhân sự đầy đủ: quản lý trực tiếp, trạng thái, ngày vào/nghỉ, lương, ghi chú, vai trò và quyền.
- Nhân sự có thể tự hủy đơn nghỉ/yêu cầu điều chỉnh khi còn chờ duyệt.
- Phiên mở quá 24 giờ buộc xử lý qua điều chỉnh có xác minh; vẫn không tự checkout.
- Cảnh báo khi chấm công khác cơ sở hoặc trạng thái ngày trong lịch dự kiến.
- Tự đồng bộ dữ liệu khi quay lại tab và định kỳ 2 phút nếu người dùng không nhập biểu mẫu.
- Có SQL kiểm tra sau triển khai và checklist go-live.

## Hardening trước đóng gói

- Production chỉ lưu lựa chọn cơ sở trong `localStorage`; không lưu lại hồ sơ, lương, tài chính, khách hàng hoặc lịch chấm công trên thiết bị dùng chung.
- Bổ sung vòng đời phân công cơ sở phụ: tạo có thời hạn và kết thúc phân công có kiểm tra quyền.
- Chuẩn hóa chỉ một phân công cơ sở chính đang hoạt động cho mỗi nhân sự.
- Duyệt nghỉ phép và điều chỉnh giờ bắt buộc đồng thời có vai trò quản lý và quyền `hr` tại đúng cơ sở.
- Khi sửa bản ghi công cũ, quản lý phải có quyền tại cả cơ sở gốc của bản ghi.
- Cố định phiên bản Supabase JS dùng ở frontend/backend để giảm thay đổi ngoài ý muốn giữa các lần deploy.
