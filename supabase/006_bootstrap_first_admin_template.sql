-- CHỈ CHẠY MỘT LẦN để liên kết tài khoản Supabase Auth đầu tiên với ADMIN.
-- 1) Tạo user email trong Supabase > Authentication > Users.
-- 2) Thay email bên dưới.
-- 3) Chạy đoạn SQL này sau migration 005.

update public.fnb_staff s
set auth_user_id=u.id,
    email=lower(u.email),
    role='ADMIN',
    active=true,
    employee_status='active',
    permissions=array['dashboard','attendance','finance','customers','hr','kiot','hotel','settings'],
    updated_at=now()
from auth.users u
where lower(u.email)=lower('THAY_EMAIL_ADMIN@DOMAIN.COM')
  and s.code='GROUP_ALL_QL';

-- Kết quả phải trả về đúng 1 dòng.
select code,name,email,auth_user_id,role,permissions
from public.fnb_staff
where code='GROUP_ALL_QL';
