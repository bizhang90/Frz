# Hướng dẫn vận hành Nhân sự & Chấm công FriendZones v2.5.0

## Nguyên tắc bắt buộc

- Mỗi nhân sự dùng một email và một tài khoản riêng.
- Công được tính bằng tổng số phút giữa các lần check-in và check-out thực tế.
- Không có ca chấm công và không có tự động checkout.
- Check-in/check-out phải thực hiện tại cơ sở được phân công và trong bán kính GPS.
- Phiên mở quá 24 giờ không được checkout trực tiếp; nhân sự phải gửi điều chỉnh để quản lý xác minh.
- Mọi sửa giờ và thay đổi vị trí cơ sở đều có audit log.

## Công việc của quản lý nhân sự

### Khi tiếp nhận nhân viên mới

1. Tạo hồ sơ và gửi email mời trong **Nhân sự**.
2. Cấp đúng cơ sở chính, chức danh, bộ phận, quản lý trực tiếp và quyền cần dùng.
3. Chọn chế độ `Theo giờ` hoặc `Không chấm công`.
4. Nhập hình thức lương, lương cơ bản/đơn giá ngày và đơn giá giờ để xuất bảng công đối soát.
5. Phân công thêm cơ sở nếu nhân viên có thể làm thay tại nơi khác.

### Trước mỗi tuần/tháng

1. Lập số giờ làm dự kiến theo ngày.
2. Đánh dấu OFF, nghỉ hoặc ngày lễ bằng lịch; hệ thống không tự suy đoán.
3. Có thể nhập giờ bắt đầu/kết thúc để theo dõi đi trễ/về sớm.
4. Với nhân sự làm cơ sở khác, phải tạo phân công có thời hạn trước khi chấm công.

### Hằng ngày

1. Theo dõi các phiên đang mở.
2. Duyệt hoặc từ chối đơn nghỉ và yêu cầu điều chỉnh.
3. Xem cảnh báo chấm khác lịch/cơ sở.
4. Báo cáo 21:35 chỉ nhắc trạng thái, không thay đổi dữ liệu chấm công.

### Cuối tháng

1. Kiểm tra phiên chưa checkout, yêu cầu điều chỉnh và ngày khác lịch.
2. Đối chiếu giờ dự kiến, thực tế, thiếu, tăng thêm, đi trễ và về sớm.
3. Bấm **Xuất CSV bảng công**.
4. CSV có dữ liệu lương nền nhưng không tự áp dụng phạt/thưởng hoặc hệ số tăng ca khi doanh nghiệp chưa cấu hình chính sách cụ thể.

## Quy trình của nhân viên

### Check-in

1. Mở website bằng điện thoại và cho phép vị trí chính xác.
2. Bấm **Kiểm tra vị trí** để xem cơ sở gần nhất.
3. Bấm **Check-in** một lần và chờ thông báo thành công.
4. Nếu nghỉ giữa giờ rồi quay lại, phải checkout trước và check-in phiên mới.

### Check-out

1. Bấm **Check-out** tại đúng cơ sở.
2. Không đóng trình duyệt cho đến khi có thông báo thành công.
3. Nếu quên checkout hoặc phiên đã mở quá 24 giờ, gửi **Yêu cầu điều chỉnh giờ**.

### Xin nghỉ và điều chỉnh

- Đơn đang chờ có thể tự hủy.
- Chỉ dữ liệu được quản lý duyệt mới thay đổi bảng công.
- Không nhờ người khác chấm công hộ; hệ thống gắn thao tác với tài khoản cá nhân.

## Xử lý sự cố

### GPS sai số lớn

- Ra gần cửa hoặc khu vực thoáng.
- Bật Wi-Fi, dữ liệu di động và độ chính xác vị trí.
- Tắt/bật lại quyền vị trí của trình duyệt.
- Không tăng bán kính cơ sở tùy tiện; quản lý chỉ điều chỉnh sau khi kiểm tra thực tế.

### Bấm hai lần

- Nút được khóa trong lúc gửi và database có mã chống trùng.
- Nếu mạng báo lỗi nhưng dữ liệu đã ghi, tải lại trang để kiểm tra; cùng mã yêu cầu không tạo bản ghi thứ hai.

### Nhân viên chuyển cơ sở

- Dùng **Cập nhật hồ sơ nhân sự → Cơ sở chính** nếu chuyển chính thức.
- Dùng **Phân công thêm cơ sở** nếu chỉ hỗ trợ tạm thời.
- Khi chuyển chính thức, phân công chính cũ bị ngừng; các phân công bổ sung khác vẫn giữ nguyên.

### Nhân viên nghỉ việc

- Chuyển trạng thái thành `Nghỉ việc` và nhập ngày nghỉ.
- RLS lập tức ngăn hồ sơ đó đọc dữ liệu/chấm công dù phiên đăng nhập cũ còn tồn tại.
