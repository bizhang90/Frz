# Triển khai Nhân sự & Chấm công production v2.5.0

> Thực hiện đúng thứ tự. Không deploy giao diện production trước khi chạy migration và liên kết tài khoản ADMIN đầu tiên.

## 1. Sao lưu Supabase

Trước khi chạy SQL:

- Supabase → Database → Backups.
- Tạo backup hoặc xác nhận Point-in-time Recovery đang hoạt động.
- Xuất riêng các bảng `fnb_staff`, `fnb_units`, `fnb_attendance_records` nếu đang có dữ liệu thật.

## 2. Chạy migration

Trong Supabase SQL Editor, chạy toàn bộ:

```text
supabase/005_hr_attendance_production.sql
```

Migration chạy trong transaction. Nếu có lỗi, transaction sẽ rollback và không áp dụng dở dang.

Migration này:

- Thêm các cơ sở THÚNG, Chấmmm, Phan Coffee.
- Thêm GPS và bán kính chấm công.
- Thêm tài khoản liên kết hồ sơ nhân sự.
- Thêm lịch giờ làm, nghỉ phép, điều chỉnh, cảnh báo khác lịch/cơ sở và audit.
- Tạo RPC check-in/check-out.
- Xóa policy demo mở và bật RLS production.

## 3. Tạo và liên kết ADMIN đầu tiên

1. Supabase → Authentication → Users → Add user.
2. Tạo email quản trị thật.
3. Mở:

```text
supabase/006_bootstrap_first_admin_template.sql
```

4. Thay `THAY_EMAIL_ADMIN@DOMAIN.COM` bằng email vừa tạo.
5. Chạy SQL.
6. Dòng `GROUP_ALL_QL` phải có `auth_user_id` và role `ADMIN`.

Không cho nhân viên truy cập trước khi hoàn tất bước này.

## 4. Cấu hình frontend

Sửa `nhan-vien/config.js`:

```js
window.FNB_CONFIG = {
  APP_NAME: 'FriendZones Group · Màn hình nhân viên',
  APP_ENV: 'production',
  SUPABASE_URL: 'https://PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'ANON_KEY',
  DEFAULT_UNIT: 'GROUP_ALL',
  GROUP_NAME: 'FriendZones Group',
  PRIVACY_HIDE_PHONE_IN_GROUP: true,
  API_BASE: '/api'
};
```

`SUPABASE_ANON_KEY` có thể nằm trong frontend; an toàn dữ liệu phụ thuộc RLS. Tuyệt đối không đặt Service Role Key trong file này.

## 5. Cấu hình Vercel Environment Variables

Thêm vào project Vercel:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
FNB_AUTH_REDIRECT_URL=https://friendzonegroup.net/login/?setup=1
CRON_SECRET=TAO_CHUOI_BI_MAT_DAI_NGAU_NHIEN
```

Các biến tích hợp cũ như Meta, KiotViet, Zalo/Telegram giữ nguyên. `CRON_SECRET` bảo vệ báo cáo chấm công tự động lúc 21:35 (giờ Việt Nam).

Sau khi thêm biến, Redeploy.

## 6. Cấu hình email Supabase

Supabase → Authentication:

- Bật Email provider.
- Cấu hình Site URL: `https://friendzonegroup.net`.
- Thêm Redirect URL: `https://friendzonegroup.net/login/?setup=1` (và có thể thêm `https://friendzonegroup.net/login/`).
- Nên cấu hình SMTP riêng để email mời/đặt lại mật khẩu gửi ổn định.

## 7. Xác minh GPS từng cơ sở

Thực hiện tại **chính địa điểm cơ sở**, bằng điện thoại có GPS:

1. Đăng nhập tài khoản ADMIN hoặc quản lý có quyền `settings`/`hr`.
2. Mở **Cấu hình → Thiết lập vị trí chấm công**.
3. Chọn đúng cơ sở.
4. Đứng ở khu vực nhân viên thường chấm công.
5. Chọn bán kính, mặc định 150 m.
6. Bấm **Lấy vị trí hiện tại và xác minh cơ sở**.
7. Chỉ lưu khi độ chính xác GPS ≤ 100 m.

Phải làm cho từng địa điểm. Không nhập tọa độ ước lượng từ địa chỉ vì có thể khiến nhân viên không chấm công được hoặc chấm công sai nơi.

## 8. Tạo nhân viên

Trong **Nhân sự → Tạo tài khoản nhân sự**:

- Chọn cơ sở chính.
- Nhập email riêng của nhân viên.
- Chọn chế độ “Chấm công theo giờ” hoặc “Không chấm công”.
- Nhập số giờ dự kiến/ngày.
- Chỉ cấp đúng quyền cần dùng.

Hệ thống gửi email mời Supabase. Nhân viên đặt mật khẩu rồi đăng nhập.

Không chia sẻ tài khoản. Một tài khoản chỉ gắn với một mã nhân viên.

Dữ liệu vận hành không được lưu lâu dài trong `localStorage` ở chế độ production; trình duyệt chỉ nhớ cơ sở đang xem. Dù vậy, thiết bị dùng chung vẫn phải đăng xuất sau khi làm việc.

## 9. Lập giờ làm dự kiến

Quản lý lập lịch theo ngày hoặc tối đa 31 ngày/lần:

- `Làm việc`: có số giờ dự kiến.
- `OFF`, `Nghỉ`, `Ngày lễ`: dự kiến 0 phút.
- Giờ bắt đầu/kết thúc là tùy chọn; nếu nhập, hệ thống dùng để tính đi trễ/về sớm.

Hệ thống tính công bằng tổng thời gian check-in → checkout thực tế, không ép theo ca.

## 10. Quy trình nhân viên

### Check-in

- Bật GPS và cho phép trình duyệt dùng vị trí.
- Hệ thống nhận diện cơ sở gần nhất được phân công.
- Chỉ ghi nhận khi trong bán kính và GPS đủ chính xác.

### Check-out

- Nhân viên phải tự bấm checkout tại cùng cơ sở.
- Không có cron hoặc cơ chế tự checkout.
- Có thể check-in lại trong ngày sau khi đã checkout, phù hợp nghỉ giữa giờ/đi làm lại.

### Quên checkout

- Nhân viên gửi **Yêu cầu điều chỉnh giờ**.
- Quản lý xem lý do, xác nhận thực tế rồi duyệt/từ chối.
- Mọi sửa đổi được lưu audit log.

## 11. Kiểm thử bắt buộc trước khi dùng thật

Dùng một tài khoản ADMIN và một tài khoản STAFF thử nghiệm:

1. STAFF không nhìn thấy menu tài chính/nhân sự nếu không có quyền.
2. STAFF không chọn được tên người khác để chấm công.
3. Chấm công ngoài bán kính bị từ chối.
4. Chấm công tại cơ sở được phân công thành công.
5. Bấm check-in/check-out hai lần hoặc retry do mạng vẫn chỉ ghi một kết quả.
6. Không checkout: phiên vẫn mở qua ngày, không tự đóng.
7. Checkout tại sai cơ sở bị từ chối.
8. Nhiều lần vào/ra trong ngày được cộng đủ phút.
9. OFF/nghỉ phép không tạo tự động.
10. Yêu cầu điều chỉnh chỉ có hiệu lực sau khi quản lý duyệt.
11. Nhân viên nghỉ việc không đăng nhập/đọc dữ liệu được.
12. Anon key không thể đọc bảng `fnb_staff` hay `fnb_attendance_records` khi chưa đăng nhập.
13. Chấm ở cơ sở khác lịch vẫn ghi nhận giờ thật nhưng có cảnh báo để quản lý kiểm tra.
14. Xuất CSV bảng công mở đúng tiếng Việt và đủ cột đi trễ/về sớm/khác lịch.

## 12. Lưu ý GPS

Chấm công bằng trình duyệt cần HTTPS. Website Vercel/custom domain đã có HTTPS.

GPS trên điện thoại có thể sai số khi ở trong nhà. Nên:

- Chấm tại cửa/khu vực thoáng.
- Bật Wi-Fi và Location Accuracy.
- Bán kính khởi đầu 150 m; chỉ tăng khi đã kiểm tra thực tế.
- Không đặt bán kính quá lớn chỉ để “dễ chấm”, vì làm giảm khả năng kiểm soát.


## 13. Báo cáo chấm công 21:35

`vercel.json` đã cấu hình cron lúc `14:35 UTC`, tương ứng `21:35 Asia/Ho_Chi_Minh`.

Báo cáo gửi qua cấu hình Zalo Gateway/Telegram hiện có, gồm:

- Nhân sự OFF/nghỉ: chỉ nêu tên.
- Nhân sự đã chấm: đủ giờ hoặc thiếu bao nhiêu phút.
- Phiên còn mở: cảnh báo chưa checkout.

Cron **chỉ báo cáo**, tuyệt đối không tự checkout hay thay đổi thời gian của nhân viên.


## 14. Kiểm tra sau migration

Sau khi hoàn tất cấu hình, chạy file chỉ đọc:

```text
supabase/007_post_deploy_verification.sql
```

Kết quả cần chú ý:

- Không có `auth_user_id` trùng.
- Không có nhân sự có hơn một phiên đang mở.
- Không còn policy demo hoặc quyền bảng cấp cho `anon`.
- Danh sách cơ sở phải được xác minh GPS trước khi mở chấm công.

## 15. Tài liệu vận hành

- `HUONG-DAN-VAN-HANH-NHAN-SU-CHAM-CONG.md`: quy trình cho quản lý và nhân viên.
- `GO-LIVE-CHECKLIST-v2.5.0.md`: danh sách bắt buộc trước khi dùng thật.

CSV bảng công có lương cơ bản/đơn giá giờ để đối soát, nhưng không tự áp dụng phạt, thưởng hoặc hệ số tăng ca khi doanh nghiệp chưa ban hành công thức lương cụ thể.
