-- FriendZones v2.5.0: kiểm tra sau triển khai HR/chấm công production.
-- File chỉ đọc dữ liệu, không sửa dữ liệu.

-- 1) Danh sách cơ sở và trạng thái GPS.
select code,name,type,address,location_verified,latitude,longitude,
       attendance_radius_m,max_gps_accuracy_m,location_verified_at
from public.fnb_units
where type in ('RESTAURANT','HOTEL')
order by type,code;

-- 2) Hồ sơ đang hoạt động nhưng chưa liên kết Supabase Auth.
select code,name,email,unit_code,role,employee_status,work_mode
from public.fnb_staff
where active=true
  and employee_status in ('active','probation')
  and auth_user_id is null
order by unit_code,code;

-- 3) Kiểm tra tài khoản Auth bị liên kết trùng (kết quả đúng là 0 dòng).
select auth_user_id,count(*) as profile_count,array_agg(code order by code) as staff_codes
from public.fnb_staff
where auth_user_id is not null
group by auth_user_id
having count(*)>1;

-- 4) Kiểm tra nhiều phiên đang mở của cùng nhân sự (kết quả đúng là 0 dòng).
select staff_code,count(*) as open_count,array_agg(id order by check_in_at) as attendance_ids
from public.fnb_attendance_records
where check_out_at is null and status='working'
group by staff_code
having count(*)>1;

-- 5) Phiên mở quá 24 giờ cần xử lý thủ công; hệ thống không tự checkout.
select r.id,r.staff_code,s.name,r.unit_code,u.name as unit_name,r.work_date,r.check_in_at,
       round(extract(epoch from (now()-r.check_in_at))/3600,2) as open_hours
from public.fnb_attendance_records r
left join public.fnb_staff s on s.code=r.staff_code
left join public.fnb_units u on u.code=r.unit_code
where r.check_out_at is null and r.status='working'
  and now()-r.check_in_at>interval '24 hours'
order by r.check_in_at;

-- 6) Policy production hiện có.
select tablename,policyname,cmd,roles,qual,with_check
from pg_policies
where schemaname='public' and tablename like 'fnb_%'
order by tablename,policyname;

-- 7) Không được còn policy demo mở hoàn toàn.
select tablename,policyname,cmd,qual,with_check
from pg_policies
where schemaname='public'
  and tablename like 'fnb_%'
  and (policyname ilike '%open%' or coalesce(qual,'')='true' or coalesce(with_check,'')='true');

-- 8) Quyền bảng của anon: kết quả đúng là 0 dòng.
select grantee,table_name,privilege_type
from information_schema.role_table_grants
where table_schema='public' and table_name like 'fnb_%' and grantee='anon'
order by table_name,privilege_type;

-- 9) Báo cáo công hôm nay để đối chiếu sau khi có lịch/chấm công.
select *
from public.fnb_v_attendance_daily
where work_date=(now() at time zone 'Asia/Ho_Chi_Minh')::date
order by unit_code,staff_name;

-- 10) Tổng hợp tháng hiện tại.
select *
from public.fnb_v_attendance_monthly
where month=date_trunc('month',(now() at time zone 'Asia/Ho_Chi_Minh')::date)::date
order by unit_code,staff_name;
