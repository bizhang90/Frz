-- FriendZones F&B Ops v2.5.0
-- HR + attendance production migration.
-- Run AFTER 001_fnb_core_schema.sql, 002_seed_friendzone_units.sql,
-- 003_views_reports.sql and 004_fix_nha_all_allnight.sql.
--
-- Main principles:
-- 1) Attendance is measured by actual working minutes, not shifts.
-- 2) There is NO automatic checkout. An open work session stays open until
--    the employee checks out or a manager approves a correction.
-- 3) Check-in and checkout identify the nearest authorised venue by GPS.
-- 4) A logged-in Supabase user is linked to exactly one staff profile.
-- 5) RLS is closed to anon and scoped by identity, unit, role and permission.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Units: official venue list + GPS configuration
-- ---------------------------------------------------------------------------

alter table public.fnb_units
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists attendance_radius_m integer not null default 150,
  add column if not exists max_gps_accuracy_m integer not null default 200,
  add column if not exists location_verified boolean not null default false,
  add column if not exists location_verified_at timestamptz,
  add column if not exists location_verified_by uuid,
  add column if not exists timezone text not null default 'Asia/Ho_Chi_Minh';

alter table public.fnb_units drop constraint if exists fnb_units_attendance_radius_check;
alter table public.fnb_units add constraint fnb_units_attendance_radius_check
  check (attendance_radius_m between 30 and 1000);
alter table public.fnb_units drop constraint if exists fnb_units_max_accuracy_check;
alter table public.fnb_units add constraint fnb_units_max_accuracy_check
  check (max_gps_accuracy_m between 20 and 1000);

insert into public.fnb_units(code,name,type,parent_code,address,manager_code,active)
values
  ('GROUP_ALL','FriendZones Group','GROUP',null,'Phan Thiết, Lâm Đồng','GROUP_ALL_QL',true),
  ('NHA_GROUP','Tất cả nhà hàng','RESTAURANT_GROUP','GROUP_ALL','Hệ thống nhà hàng FriendZones','NHA_GROUP_QL',true),
  ('NHA_ALL','All Night Food & Beer','RESTAURANT','NHA_GROUP','79 Lê Duẩn, Phan Thiết, Lâm Đồng','NHA_ALL_QL',true),
  ('NHA_SAIGONPHO','Sài Gòn Phố - Beer Garden & Karaoke','RESTAURANT','NHA_GROUP','N5-33 Mậu Thân, Phú Thuỷ, Lâm Đồng (Ocean Dunes Phan Thiết)','NHA_SAIGONPHO_QL',true),
  ('NHA_FRZ','Nhà hàng FriendZones','RESTAURANT','NHA_GROUP','130 Đỗ Hành, Phú Thuỷ, Phan Thiết, Lâm Đồng','NHA_FRZ_QL',true),
  ('NHA_THUNG','THÚNG View Hồ Tôm','RESTAURANT','NHA_GROUP','Đại lộ Hùng Vương, Phan Thiết, Lâm Đồng','NHA_THUNG_QL',true),
  ('NHA_CHAM','Nhà hàng Chấmmm','RESTAURANT','NHA_GROUP','L80-82 Tôn Đức Thắng, Phan Thiết, Lâm Đồng','NHA_CHAM_QL',true),
  ('NHA_PHAN_COFFEE','Phan Coffee','RESTAURANT','NHA_GROUP','C34 Lê Duẩn, Phan Thiết, Lâm Đồng','NHA_PHAN_COFFEE_QL',true),
  ('HOTEL_ALL','Tất cả lưu trú','HOTEL_GROUP','GROUP_ALL','Hệ thống lưu trú FriendZones','HOTEL_ALL_QL',true),
  ('HOTEL_VENUS','Venus Mũi Né Resort','HOTEL','HOTEL_ALL','Số 10 Hoà Bình, Mũi Né, Lâm Đồng','HOTEL_VENUS_QL',true),
  ('HOTEL_VOLGA','Volga Hotel & Apartment','HOTEL','HOTEL_ALL','219 Nguyễn Đình Chiểu, Mũi Né, Lâm Đồng','HOTEL_VOLGA_QL',true),
  ('HOTEL_A64','Love Hotel','HOTEL','HOTEL_ALL','A64 Hùng Vương, Phú Thuỷ, Lâm Đồng','HOTEL_A64_QL',true),
  ('HOTEL_FRZ','Friendzones Hotel','HOTEL','HOTEL_ALL','287 Thủ Khoa Huân, Phú Thuỷ, Lâm Đồng','HOTEL_FRZ_QL',true)
on conflict(code) do update set
  name=excluded.name,
  type=excluded.type,
  parent_code=excluded.parent_code,
  address=excluded.address,
  manager_code=excluded.manager_code,
  active=excluded.active,
  updated_at=now();

-- ---------------------------------------------------------------------------
-- 2. Staff profile and assignments
-- ---------------------------------------------------------------------------

alter table public.fnb_staff
  add column if not exists auth_user_id uuid,
  add column if not exists email text,
  add column if not exists employee_status text not null default 'active',
  add column if not exists work_mode text not null default 'hourly',
  add column if not exists expected_daily_minutes integer not null default 480,
  add column if not exists hourly_rate numeric not null default 0,
  add column if not exists joined_on date,
  add column if not exists left_on date,
  add column if not exists manager_code text,
  add column if not exists notes text;

alter table public.fnb_staff drop constraint if exists fnb_staff_employee_status_check;
alter table public.fnb_staff add constraint fnb_staff_employee_status_check
  check (employee_status in ('active','probation','suspended','left'));
alter table public.fnb_staff drop constraint if exists fnb_staff_work_mode_check;
alter table public.fnb_staff add constraint fnb_staff_work_mode_check
  check (work_mode in ('hourly','no_attendance'));
alter table public.fnb_staff drop constraint if exists fnb_staff_expected_minutes_check;
alter table public.fnb_staff add constraint fnb_staff_expected_minutes_check
  check (expected_daily_minutes between 0 and 1440);

create unique index if not exists uq_fnb_staff_auth_user
  on public.fnb_staff(auth_user_id) where auth_user_id is not null;
with duplicate_emails as (
  select code,row_number() over(partition by lower(email) order by created_at,code) rn
  from public.fnb_staff
  where email is not null and btrim(email)<>''
)
update public.fnb_staff s set email=null,updated_at=now()
from duplicate_emails d where d.code=s.code and d.rn>1;
create unique index if not exists uq_fnb_staff_email_lower
  on public.fnb_staff(lower(email)) where email is not null and btrim(email) <> '';

alter table public.fnb_staff_unit_assignments
  add column if not exists active boolean not null default true,
  add column if not exists effective_from date,
  add column if not exists effective_to date,
  add column if not exists note text;

insert into public.fnb_staff(code,name,unit_code,role,position,department,base_salary,permissions,work_mode,expected_daily_minutes,employee_status)
values
  ('NHA_THUNG_QL','Quản lý THÚNG View Hồ Tôm','NHA_THUNG','MANAGER','Quản lý cơ sở','Vận hành',0,array['dashboard','attendance','finance','customers','hr','kiot'],'hourly',480,'active'),
  ('NHA_CHAM_QL','Quản lý Nhà hàng Chấmmm','NHA_CHAM','MANAGER','Quản lý cơ sở','Vận hành',0,array['dashboard','attendance','finance','customers','hr','kiot'],'hourly',480,'active'),
  ('NHA_PHAN_COFFEE_QL','Quản lý Phan Coffee','NHA_PHAN_COFFEE','MANAGER','Quản lý cơ sở','Vận hành',0,array['dashboard','attendance','finance','customers','hr','kiot'],'hourly',480,'active')
on conflict(code) do update set
  name=excluded.name,
  unit_code=excluded.unit_code,
  role=excluded.role,
  position=excluded.position,
  department=excluded.department,
  permissions=excluded.permissions,
  employee_status='active',
  active=true,
  updated_at=now();

insert into public.fnb_staff_unit_assignments(staff_code,unit_code,is_primary,active,effective_from)
select s.code,s.unit_code,true,true,current_date
from public.fnb_staff s
where s.unit_code is not null
on conflict(staff_code,unit_code) do update set is_primary=true,active=true,effective_to=null;

-- Normalise legacy assignment data before production constraints.
update public.fnb_staff_unit_assignments a
set is_primary=false
from public.fnb_staff s
where a.staff_code=s.code
  and a.is_primary=true
  and a.unit_code is distinct from s.unit_code;

update public.fnb_staff_unit_assignments
set effective_to=null
where effective_from is not null and effective_to is not null and effective_to<effective_from;

alter table public.fnb_staff_unit_assignments drop constraint if exists fnb_staff_assignment_dates_check;
alter table public.fnb_staff_unit_assignments add constraint fnb_staff_assignment_dates_check
  check (effective_to is null or effective_from is null or effective_to>=effective_from);

create unique index if not exists uq_fnb_staff_one_active_primary_assignment
  on public.fnb_staff_unit_assignments(staff_code)
  where is_primary=true and active=true;
create index if not exists idx_fnb_staff_assignments_unit_active
  on public.fnb_staff_unit_assignments(unit_code,active,effective_from,effective_to);

-- ---------------------------------------------------------------------------
-- 3. Actual-hour attendance model
-- ---------------------------------------------------------------------------

alter table public.fnb_attendance_records
  add column if not exists auth_user_id uuid,
  add column if not exists check_in_latitude double precision,
  add column if not exists check_in_longitude double precision,
  add column if not exists check_in_accuracy_m double precision,
  add column if not exists check_in_distance_m double precision,
  add column if not exists check_out_latitude double precision,
  add column if not exists check_out_longitude double precision,
  add column if not exists check_out_accuracy_m double precision,
  add column if not exists check_out_distance_m double precision,
  add column if not exists device_id text,
  add column if not exists check_in_request_id uuid,
  add column if not exists check_out_request_id uuid,
  add column if not exists scheduled_unit_code text,
  add column if not exists schedule_exception boolean not null default false,
  add column if not exists correction_status text not null default 'none',
  add column if not exists corrected_by uuid,
  add column if not exists corrected_at timestamptz,
  add column if not exists correction_reason text;

-- Keep old columns compatible, but no longer use shift as a scheduling concept.
alter table public.fnb_attendance_records alter column shift set default 'hourly';
update public.fnb_attendance_records set shift='hourly' where shift is null or shift='';

update public.fnb_attendance_records
set status=case when status='off' then 'cancelled' else 'needs_review' end,
    note=concat_ws(' | ',nullif(note,''),'Migration v2.5.0: normalized legacy attendance status'),
    updated_at=now()
where status not in ('working','done','needs_review','cancelled');

alter table public.fnb_attendance_records drop constraint if exists fnb_attendance_status_check;
alter table public.fnb_attendance_records add constraint fnb_attendance_status_check
  check (status in ('working','done','needs_review','cancelled'));
alter table public.fnb_attendance_records drop constraint if exists fnb_attendance_correction_status_check;
alter table public.fnb_attendance_records add constraint fnb_attendance_correction_status_check
  check (correction_status in ('none','requested','approved','rejected'));

-- Resolve historic duplicate open sessions before enforcing the production rule.
with ranked as (
  select id,
         row_number() over(partition by staff_code order by check_in_at desc nulls last, created_at desc) as rn
  from public.fnb_attendance_records
  where check_out_at is null and status='working'
)
update public.fnb_attendance_records r
set status='needs_review',
    note=concat_ws(' | ',nullif(r.note,''),'Migration v2.5.0: duplicate open record requires manager review'),
    updated_at=now()
from ranked x
where r.id=x.id and x.rn>1;

create unique index if not exists uq_fnb_attendance_one_open_per_staff
  on public.fnb_attendance_records(staff_code)
  where check_out_at is null and status='working';
create unique index if not exists uq_fnb_attendance_checkin_request
  on public.fnb_attendance_records(check_in_request_id)
  where check_in_request_id is not null;
create unique index if not exists uq_fnb_attendance_checkout_request
  on public.fnb_attendance_records(check_out_request_id)
  where check_out_request_id is not null;
create index if not exists idx_fnb_attendance_staff_date
  on public.fnb_attendance_records(staff_code,work_date desc);

create table if not exists public.fnb_work_schedules (
  id uuid primary key default gen_random_uuid(),
  staff_code text not null references public.fnb_staff(code) on delete cascade,
  unit_code text not null references public.fnb_units(code),
  work_date date not null,
  expected_minutes integer not null default 480 check(expected_minutes between 0 and 1440),
  planned_start time,
  planned_end time,
  day_status text not null default 'work' check(day_status in ('work','off','leave','holiday')),
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(staff_code,work_date)
);
create index if not exists idx_fnb_work_schedules_unit_date
  on public.fnb_work_schedules(unit_code,work_date);

create table if not exists public.fnb_leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_code text not null references public.fnb_staff(code) on delete cascade,
  unit_code text not null references public.fnb_units(code),
  start_date date not null,
  end_date date not null,
  leave_type text not null default 'personal' check(leave_type in ('annual','sick','personal','unpaid','other')),
  reason text,
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(end_date >= start_date)
);
create index if not exists idx_fnb_leave_staff_dates on public.fnb_leave_requests(staff_code,start_date,end_date);

create table if not exists public.fnb_attendance_adjustments (
  id uuid primary key default gen_random_uuid(),
  attendance_id text references public.fnb_attendance_records(id) on delete set null,
  staff_code text not null references public.fnb_staff(code) on delete cascade,
  unit_code text not null references public.fnb_units(code),
  work_date date not null,
  requested_check_in_at timestamptz,
  requested_check_out_at timestamptz,
  reason text not null,
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  requested_by uuid not null,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fnb_adjustments_status_unit on public.fnb_attendance_adjustments(status,unit_code,created_at desc);

create table if not exists public.fnb_attendance_audit_logs (
  id uuid primary key default gen_random_uuid(),
  attendance_id text,
  staff_code text,
  unit_code text,
  action text not null,
  actor_user_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_fnb_attendance_audit_record on public.fnb_attendance_audit_logs(attendance_id,created_at desc);

create table if not exists public.fnb_unit_location_audit_logs (
  id uuid primary key default gen_random_uuid(),
  unit_code text not null references public.fnb_units(code),
  actor_user_id uuid,
  old_latitude double precision,
  old_longitude double precision,
  new_latitude double precision,
  new_longitude double precision,
  accuracy_m double precision,
  radius_m integer,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Security helper functions
-- ---------------------------------------------------------------------------

create or replace function public.fnb_distance_m(
  p_lat1 double precision,
  p_lon1 double precision,
  p_lat2 double precision,
  p_lon2 double precision
) returns double precision
language sql immutable parallel safe
as $$
  select 6371000.0 * 2.0 * asin(
    least(1.0, sqrt(
      power(sin(radians((p_lat2-p_lat1)/2.0)),2) +
      cos(radians(p_lat1))*cos(radians(p_lat2))*
      power(sin(radians((p_lon2-p_lon1)/2.0)),2)
    ))
  );
$$;

create or replace function public.fnb_current_staff_code()
returns text
language sql stable security definer
set search_path=public
as $$
  select s.code
  from public.fnb_staff s
  where s.auth_user_id=auth.uid()
    and s.active=true
    and s.employee_status in ('active','probation')
  limit 1;
$$;

create or replace function public.fnb_current_staff_role()
returns text
language sql stable security definer
set search_path=public
as $$
  select s.role from public.fnb_staff s where s.code=public.fnb_current_staff_code();
$$;

create or replace function public.fnb_can_access_unit(p_unit_code text)
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.fnb_staff s
    left join public.fnb_units target on target.code=p_unit_code
    where s.code=public.fnb_current_staff_code()
      and (
        upper(s.role)='ADMIN'
        or s.unit_code='GROUP_ALL'
        or s.unit_code=p_unit_code
        or (target.parent_code=s.unit_code)
        or exists(
          select 1 from public.fnb_staff_unit_assignments a
          left join public.fnb_units au on au.code=a.unit_code
          where a.staff_code=s.code and a.active=true
            and (a.effective_from is null or a.effective_from<=current_date)
            and (a.effective_to is null or a.effective_to>=current_date)
            and (a.unit_code=p_unit_code or target.parent_code=a.unit_code or a.unit_code='GROUP_ALL')
        )
      )
  );
$$;

create or replace function public.fnb_has_permission(p_permission text,p_unit_code text default null)
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists(
    select 1 from public.fnb_staff s
    where s.code=public.fnb_current_staff_code()
      and s.active=true
      and s.employee_status in ('active','probation')
      and (
        upper(s.role)='ADMIN'
        or p_permission=any(s.permissions)
      )
      and (p_unit_code is null or public.fnb_can_access_unit(p_unit_code))
  );
$$;

create or replace function public.fnb_is_manager_for_unit(p_unit_code text)
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists(
    select 1 from public.fnb_staff s
    where s.code=public.fnb_current_staff_code()
      and upper(s.role) in ('ADMIN','MANAGER')
      and public.fnb_can_access_unit(p_unit_code)
  );
$$;


create or replace function public.fnb_can_manage_staff(p_staff_code text)
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists(
    select 1 from public.fnb_staff target
    where target.code=p_staff_code
      and public.fnb_is_manager_for_unit(target.unit_code)
      and public.fnb_has_permission('hr',target.unit_code)
  );
$$;


create or replace function public.fnb_staff_can_work_unit(p_staff_code text,p_unit_code text)
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.fnb_staff s
    left join public.fnb_units target on target.code=p_unit_code
    where s.code=p_staff_code
      and s.active=true
      and s.employee_status in ('active','probation')
      and (
        s.unit_code='GROUP_ALL'
        or s.unit_code=p_unit_code
        or target.parent_code=s.unit_code
        or exists(
          select 1 from public.fnb_staff_unit_assignments a
          where a.staff_code=s.code and a.active=true
            and (a.effective_from is null or a.effective_from<=current_date)
            and (a.effective_to is null or a.effective_to>=current_date)
            and (a.unit_code=p_unit_code or a.unit_code='GROUP_ALL' or target.parent_code=a.unit_code)
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 5. Employee-facing RPCs
-- ---------------------------------------------------------------------------

create or replace function public.fnb_get_my_profile()
returns jsonb
language sql stable security definer
set search_path=public
as $$
  select jsonb_build_object(
    'code',s.code,
    'name',s.name,
    'email',s.email,
    'phone',s.phone,
    'unit_code',s.unit_code,
    'role',s.role,
    'position',s.position,
    'department',s.department,
    'work_mode',s.work_mode,
    'expected_daily_minutes',s.expected_daily_minutes,
    'permissions',s.permissions,
    'employee_status',s.employee_status,
    'assignments',coalesce((
      select jsonb_agg(jsonb_build_object('unit_code',a.unit_code,'is_primary',a.is_primary))
      from public.fnb_staff_unit_assignments a
      where a.staff_code=s.code and a.active=true
        and (a.effective_from is null or a.effective_from<=current_date)
        and (a.effective_to is null or a.effective_to>=current_date)
    ),'[]'::jsonb)
  )
  from public.fnb_staff s
  where s.code=public.fnb_current_staff_code();
$$;

create or replace function public.fnb_nearest_authorised_unit(
  p_latitude double precision,
  p_longitude double precision
) returns table(
  unit_code text,
  unit_name text,
  address text,
  distance_m double precision,
  attendance_radius_m integer,
  max_gps_accuracy_m integer
)
language sql stable security definer
set search_path=public
as $$
  select u.code,u.name,u.address,
         public.fnb_distance_m(p_latitude,p_longitude,u.latitude,u.longitude) as distance_m,
         u.attendance_radius_m,u.max_gps_accuracy_m
  from public.fnb_units u
  where u.active=true
    and u.type in ('RESTAURANT','HOTEL')
    and u.location_verified=true
    and u.latitude is not null and u.longitude is not null
    and public.fnb_can_access_unit(u.code)
  order by public.fnb_distance_m(p_latitude,p_longitude,u.latitude,u.longitude)
  limit 1;
$$;

create or replace function public.fnb_check_in(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision,
  p_device_id text,
  p_request_id uuid
) returns public.fnb_attendance_records
language plpgsql security definer
set search_path=public
as $$
declare
  v_staff public.fnb_staff%rowtype;
  v_unit record;
  v_existing public.fnb_attendance_records%rowtype;
  v_row public.fnb_attendance_records%rowtype;
  v_now timestamptz:=now();
  v_work_date date;
  v_schedule_unit text;
  v_schedule_status text;
begin
  select * into v_staff from public.fnb_staff where code=public.fnb_current_staff_code();
  if v_staff.code is null then raise exception 'Tài khoản chưa liên kết hồ sơ nhân sự'; end if;
  if v_staff.work_mode='no_attendance' then raise exception 'Nhân sự này được cấu hình không chấm công'; end if;

  if p_request_id is null then raise exception 'Thiếu mã yêu cầu chấm công'; end if;
  if p_latitude is null or p_longitude is null then raise exception 'Thiếu vị trí GPS'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'Tọa độ GPS không hợp lệ'; end if;
  if p_accuracy_m is null or p_accuracy_m<=0 then raise exception 'Không xác định được độ chính xác GPS'; end if;

  select * into v_existing
  from public.fnb_attendance_records
  where staff_code=v_staff.code and check_in_request_id=p_request_id
  limit 1;
  if v_existing.id is not null then return v_existing; end if;

  select * into v_existing
  from public.fnb_attendance_records
  where staff_code=v_staff.code and check_out_at is null and status='working'
  order by check_in_at desc limit 1;
  if v_existing.id is not null then
    raise exception 'Bạn đang có một phiên làm việc chưa checkout từ %',v_existing.check_in_at;
  end if;

  select * into v_unit from public.fnb_nearest_authorised_unit(p_latitude,p_longitude);
  if v_unit.unit_code is null then
    raise exception 'Không tìm thấy cơ sở được phép chấm công đã cấu hình GPS';
  end if;
  if p_accuracy_m>v_unit.max_gps_accuracy_m then
    raise exception 'GPS chưa đủ chính xác (% m). Di chuyển ra vị trí thoáng và thử lại',round(p_accuracy_m::numeric);
  end if;
  if v_unit.distance_m>v_unit.attendance_radius_m then
    raise exception 'Bạn cách % khoảng % m, ngoài bán kính % m',v_unit.unit_name,round(v_unit.distance_m::numeric),v_unit.attendance_radius_m;
  end if;

  v_work_date=(v_now at time zone 'Asia/Ho_Chi_Minh')::date;
  select unit_code,day_status into v_schedule_unit,v_schedule_status
  from public.fnb_work_schedules where staff_code=v_staff.code and work_date=v_work_date;

  insert into public.fnb_attendance_records(
    id,staff_code,auth_user_id,unit_code,work_date,shift,scheduled_unit_code,schedule_exception,
    check_in_at,status,checklist_done,
    latitude,longitude,check_in_latitude,check_in_longitude,
    check_in_accuracy_m,check_in_distance_m,device_id,check_in_request_id,raw
  ) values (
    'ATT-'||replace(gen_random_uuid()::text,'-',''),v_staff.code,auth.uid(),v_unit.unit_code,v_work_date,'hourly',v_schedule_unit,
    (v_schedule_unit is not null and (v_schedule_unit<>v_unit.unit_code or coalesce(v_schedule_status,'work')<>'work')),
    v_now,'working',false,
    p_latitude,p_longitude,p_latitude,p_longitude,
    p_accuracy_m,v_unit.distance_m,left(coalesce(p_device_id,''),200),p_request_id,
    jsonb_build_object('source','web-gps','timezone','Asia/Ho_Chi_Minh','scheduled_unit_code',v_schedule_unit,'scheduled_day_status',v_schedule_status)
  ) returning * into v_row;

  insert into public.fnb_attendance_audit_logs(attendance_id,staff_code,unit_code,action,actor_user_id,after_data)
  values(v_row.id,v_staff.code,v_unit.unit_code,'check_in',auth.uid(),to_jsonb(v_row));

  return v_row;
exception
  when unique_violation then
    raise exception 'Yêu cầu chấm công đã được ghi nhận hoặc đang có phiên làm việc mở';
end;
$$;

create or replace function public.fnb_check_out(
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision,
  p_device_id text,
  p_request_id uuid
) returns public.fnb_attendance_records
language plpgsql security definer
set search_path=public
as $$
declare
  v_staff_code text:=public.fnb_current_staff_code();
  v_rec public.fnb_attendance_records%rowtype;
  v_unit public.fnb_units%rowtype;
  v_before jsonb;
  v_distance double precision;
begin
  if v_staff_code is null then raise exception 'Tài khoản chưa liên kết hồ sơ nhân sự'; end if;
  if p_request_id is null then raise exception 'Thiếu mã yêu cầu checkout'; end if;
  if p_latitude is null or p_longitude is null then raise exception 'Thiếu vị trí GPS'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'Tọa độ GPS không hợp lệ'; end if;

  select * into v_rec from public.fnb_attendance_records
   where staff_code=v_staff_code and check_out_request_id=p_request_id
   limit 1;
  if v_rec.id is not null then return v_rec; end if;

  select * into v_rec from public.fnb_attendance_records
   where staff_code=v_staff_code and check_out_at is null and status='working'
   order by check_in_at desc limit 1 for update;
  if v_rec.id is null then raise exception 'Không có phiên làm việc đang mở'; end if;
  if now()-v_rec.check_in_at>interval '24 hours' then
    raise exception 'Phiên làm việc đã mở quá 24 giờ. Vui lòng gửi yêu cầu điều chỉnh để quản lý xác minh, hệ thống không tự checkout';
  end if;

  select * into v_unit from public.fnb_units where code=v_rec.unit_code;
  if v_unit.location_verified is not true or v_unit.latitude is null or v_unit.longitude is null then
    raise exception 'Cơ sở chưa cấu hình GPS';
  end if;
  if p_accuracy_m is null or p_accuracy_m>v_unit.max_gps_accuracy_m then
    raise exception 'GPS chưa đủ chính xác. Di chuyển ra vị trí thoáng và thử lại';
  end if;
  v_distance=public.fnb_distance_m(p_latitude,p_longitude,v_unit.latitude,v_unit.longitude);
  if v_distance>v_unit.attendance_radius_m then
    raise exception 'Checkout phải thực hiện tại %, hiện cách khoảng % m',v_unit.name,round(v_distance::numeric);
  end if;

  v_before=to_jsonb(v_rec);
  update public.fnb_attendance_records set
    check_out_at=now(),
    check_out_latitude=p_latitude,
    check_out_longitude=p_longitude,
    check_out_accuracy_m=p_accuracy_m,
    check_out_distance_m=v_distance,
    check_out_request_id=p_request_id,
    device_id=coalesce(nullif(left(p_device_id,200),''),device_id),
    status='done',
    updated_at=now()
  where id=v_rec.id
  returning * into v_rec;

  insert into public.fnb_attendance_audit_logs(attendance_id,staff_code,unit_code,action,actor_user_id,before_data,after_data)
  values(v_rec.id,v_rec.staff_code,v_rec.unit_code,'check_out',auth.uid(),v_before,to_jsonb(v_rec));
  return v_rec;
exception
  when unique_violation then
    raise exception 'Yêu cầu checkout này đã được xử lý';
end;
$$;

create or replace function public.fnb_save_unit_location(
  p_unit_code text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_m double precision,
  p_radius_m integer default 150,
  p_max_accuracy_m integer default 200
) returns public.fnb_units
language plpgsql security definer
set search_path=public
as $$
declare
  v_row public.fnb_units%rowtype;
  v_old public.fnb_units%rowtype;
begin
  if not (public.fnb_has_permission('settings',p_unit_code) or public.fnb_has_permission('hr',p_unit_code)) then
    raise exception 'Bạn không có quyền cấu hình vị trí cơ sở';
  end if;
  if p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'Tọa độ GPS cơ sở không hợp lệ';
  end if;
  if p_accuracy_m is null or p_accuracy_m>100 then
    raise exception 'Vị trí dùng để thiết lập cơ sở phải có độ chính xác 100 m trở xuống';
  end if;
  select * into v_old from public.fnb_units where code=p_unit_code;
  update public.fnb_units set
    latitude=p_latitude,
    longitude=p_longitude,
    attendance_radius_m=greatest(30,least(1000,p_radius_m)),
    max_gps_accuracy_m=greatest(20,least(1000,p_max_accuracy_m)),
    location_verified=true,
    location_verified_at=now(),
    location_verified_by=auth.uid(),
    updated_at=now()
  where code=p_unit_code and type in ('RESTAURANT','HOTEL')
  returning * into v_row;
  if v_row.code is null then raise exception 'Không tìm thấy cơ sở'; end if;
  insert into public.fnb_unit_location_audit_logs(unit_code,actor_user_id,old_latitude,old_longitude,new_latitude,new_longitude,accuracy_m,radius_m)
  values(v_row.code,auth.uid(),v_old.latitude,v_old.longitude,v_row.latitude,v_row.longitude,p_accuracy_m,v_row.attendance_radius_m);
  return v_row;
end;
$$;

create or replace function public.fnb_review_leave_request(
  p_request_id uuid,
  p_approve boolean,
  p_note text default null
) returns public.fnb_leave_requests
language plpgsql security definer
set search_path=public
as $$
declare v_row public.fnb_leave_requests%rowtype;
begin
  select * into v_row from public.fnb_leave_requests where id=p_request_id for update;
  if v_row.id is null then raise exception 'Không tìm thấy đơn nghỉ'; end if;
  if v_row.status<>'pending' then raise exception 'Đơn nghỉ đã được xử lý'; end if;
  if not public.fnb_is_manager_for_unit(v_row.unit_code)
     or not public.fnb_has_permission('hr',v_row.unit_code) then
    raise exception 'Không có quyền duyệt đơn';
  end if;
  update public.fnb_leave_requests set
    status=case when p_approve then 'approved' else 'rejected' end,
    reviewed_by=auth.uid(),reviewed_at=now(),review_note=p_note,updated_at=now()
  where id=p_request_id returning * into v_row;

  if p_approve then
    insert into public.fnb_work_schedules(staff_code,unit_code,work_date,expected_minutes,day_status,note,created_by)
    select v_row.staff_code,v_row.unit_code,d::date,0,'leave',concat('Đơn nghỉ: ',coalesce(v_row.reason,'')),auth.uid()
    from generate_series(v_row.start_date::timestamp,v_row.end_date::timestamp,interval '1 day') d
    on conflict(staff_code,work_date) do update set expected_minutes=0,day_status='leave',note=excluded.note,updated_at=now();
  end if;
  return v_row;
end;
$$;

create or replace function public.fnb_review_attendance_adjustment(
  p_adjustment_id uuid,
  p_approve boolean,
  p_note text default null
) returns public.fnb_attendance_adjustments
language plpgsql security definer
set search_path=public
as $$
declare
  v_adj public.fnb_attendance_adjustments%rowtype;
  v_rec public.fnb_attendance_records%rowtype;
  v_before jsonb;
begin
  select * into v_adj from public.fnb_attendance_adjustments where id=p_adjustment_id for update;
  if v_adj.id is null then raise exception 'Không tìm thấy yêu cầu điều chỉnh'; end if;
  if v_adj.status<>'pending' then raise exception 'Yêu cầu điều chỉnh đã được xử lý'; end if;
  if not public.fnb_is_manager_for_unit(v_adj.unit_code)
     or not public.fnb_has_permission('hr',v_adj.unit_code) then
    raise exception 'Không có quyền duyệt điều chỉnh';
  end if;

  if p_approve then
    if v_adj.requested_check_in_at is null then raise exception 'Thiếu giờ vào đề nghị'; end if;
    if (v_adj.requested_check_in_at at time zone 'Asia/Ho_Chi_Minh')::date<>v_adj.work_date then raise exception 'Giờ vào không thuộc ngày đề nghị'; end if;
    if v_adj.requested_check_out_at is not null and v_adj.requested_check_out_at<v_adj.requested_check_in_at then
      raise exception 'Giờ ra phải sau giờ vào';
    end if;
    if v_adj.requested_check_out_at is not null and v_adj.requested_check_out_at-v_adj.requested_check_in_at>interval '24 hours' then
      raise exception 'Một phiên điều chỉnh không được vượt quá 24 giờ';
    end if;

    if v_adj.attendance_id is not null then
      select * into v_rec from public.fnb_attendance_records where id=v_adj.attendance_id for update;
      if v_rec.id is null or v_rec.staff_code<>v_adj.staff_code or v_rec.unit_code<>v_adj.unit_code then raise exception 'Phiên chấm công không thuộc nhân sự/cơ sở đề nghị'; end if;
      v_before=to_jsonb(v_rec);
      update public.fnb_attendance_records set
        check_in_at=v_adj.requested_check_in_at,
        check_out_at=v_adj.requested_check_out_at,
        status=case when v_adj.requested_check_out_at is null then 'working' else 'done' end,
        correction_status='approved',corrected_by=auth.uid(),corrected_at=now(),
        correction_reason=v_adj.reason,updated_at=now()
      where id=v_adj.attendance_id returning * into v_rec;
    else
      insert into public.fnb_attendance_records(
        id,staff_code,unit_code,work_date,shift,check_in_at,check_out_at,status,
        correction_status,corrected_by,corrected_at,correction_reason,raw
      ) values (
        'ATT-'||replace(gen_random_uuid()::text,'-',''),v_adj.staff_code,v_adj.unit_code,v_adj.work_date,'hourly',
        v_adj.requested_check_in_at,v_adj.requested_check_out_at,
        case when v_adj.requested_check_out_at is null then 'working' else 'done' end,
        'approved',auth.uid(),now(),v_adj.reason,jsonb_build_object('source','manager-approved-adjustment')
      ) returning * into v_rec;
      v_adj.attendance_id=v_rec.id;
    end if;

    insert into public.fnb_attendance_audit_logs(attendance_id,staff_code,unit_code,action,actor_user_id,before_data,after_data,reason)
    values(v_rec.id,v_rec.staff_code,v_rec.unit_code,'manager_adjustment',auth.uid(),v_before,to_jsonb(v_rec),v_adj.reason);
  end if;

  update public.fnb_attendance_adjustments set
    attendance_id=coalesce(v_adj.attendance_id,attendance_id),
    status=case when p_approve then 'approved' else 'rejected' end,
    reviewed_by=auth.uid(),reviewed_at=now(),review_note=p_note,updated_at=now()
  where id=p_adjustment_id returning * into v_adj;
  return v_adj;
end;
$$;


create or replace function public.fnb_manager_record_attendance(
  p_attendance_id text,
  p_staff_code text,
  p_unit_code text,
  p_work_date date,
  p_check_in_at timestamptz,
  p_check_out_at timestamptz,
  p_reason text
) returns public.fnb_attendance_records
language plpgsql security definer
set search_path=public
as $$
declare
  v_rec public.fnb_attendance_records%rowtype;
  v_before jsonb;
begin
  if not public.fnb_is_manager_for_unit(p_unit_code)
     or not public.fnb_has_permission('hr',p_unit_code)
     or not public.fnb_staff_can_work_unit(p_staff_code,p_unit_code) then
    raise exception 'Không có quyền điều chỉnh nhân sự/cơ sở này';
  end if;
  if p_check_in_at is null or p_check_out_at is null then raise exception 'Quản lý phải nhập đủ giờ vào và giờ ra'; end if;
  if p_check_out_at<=p_check_in_at then raise exception 'Giờ ra phải sau giờ vào'; end if;
  if extract(epoch from (p_check_out_at-p_check_in_at))>86400 then raise exception 'Một phiên điều chỉnh không được vượt quá 24 giờ'; end if;
  if (p_check_in_at at time zone 'Asia/Ho_Chi_Minh')::date<>p_work_date then raise exception 'Giờ vào không thuộc ngày làm việc'; end if;
  if length(btrim(coalesce(p_reason,'')))<5 then raise exception 'Phải nhập lý do điều chỉnh rõ ràng'; end if;

  if nullif(p_attendance_id,'') is not null then
    select * into v_rec from public.fnb_attendance_records where id=p_attendance_id for update;
    if v_rec.id is null or v_rec.staff_code<>p_staff_code then raise exception 'Phiên chấm công không hợp lệ'; end if;
    if not public.fnb_is_manager_for_unit(v_rec.unit_code)
       or not public.fnb_has_permission('hr',v_rec.unit_code) then
      raise exception 'Không có quyền sửa phiên chấm công tại cơ sở gốc';
    end if;
    v_before=to_jsonb(v_rec);
    update public.fnb_attendance_records set
      unit_code=p_unit_code,work_date=p_work_date,check_in_at=p_check_in_at,check_out_at=p_check_out_at,
      status='done',correction_status='approved',corrected_by=auth.uid(),corrected_at=now(),
      correction_reason=p_reason,updated_at=now()
    where id=v_rec.id returning * into v_rec;
  else
    insert into public.fnb_attendance_records(
      id,staff_code,unit_code,work_date,shift,check_in_at,check_out_at,status,
      correction_status,corrected_by,corrected_at,correction_reason,raw
    ) values (
      'ATT-'||replace(gen_random_uuid()::text,'-',''),p_staff_code,p_unit_code,p_work_date,'hourly',
      p_check_in_at,p_check_out_at,'done','approved',auth.uid(),now(),p_reason,
      jsonb_build_object('source','manager-manual-record')
    ) returning * into v_rec;
  end if;
  insert into public.fnb_attendance_audit_logs(attendance_id,staff_code,unit_code,action,actor_user_id,before_data,after_data,reason)
  values(v_rec.id,v_rec.staff_code,v_rec.unit_code,'manager_manual_record',auth.uid(),v_before,to_jsonb(v_rec),p_reason);
  return v_rec;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Reports
-- ---------------------------------------------------------------------------

drop view if exists public.fnb_v_attendance_monthly;
drop view if exists public.fnb_v_attendance_daily;
create view public.fnb_v_attendance_daily
with (security_invoker=true)
as
with sessions as (
  select r.staff_code,min(r.unit_code) as unit_code,r.work_date,
         count(*) as session_count,
         sum(case when r.check_out_at is not null
                  then greatest(0,extract(epoch from (r.check_out_at-r.check_in_at))/60)
                  else 0 end)::integer as closed_minutes,
         bool_or(r.check_out_at is null and r.status='working') as has_open_session,
         bool_or(coalesce(r.schedule_exception,false)) as has_schedule_exception,
         count(*) filter(where coalesce(r.schedule_exception,false)) as exception_session_count,
         min(r.check_in_at) as first_check_in_at,
         max(r.check_out_at) as last_check_out_at
  from public.fnb_attendance_records r
  where r.status in ('working','done','needs_review')
  group by r.staff_code,r.work_date
), base as (
  select coalesce(sc.staff_code,se.staff_code) staff_code,
         coalesce(sc.unit_code,se.unit_code) unit_code,
         coalesce(sc.work_date,se.work_date) work_date,
         sc.expected_minutes,sc.planned_start,sc.planned_end,sc.day_status,
         se.session_count,se.closed_minutes,se.has_open_session,se.has_schedule_exception,se.exception_session_count,se.first_check_in_at,se.last_check_out_at
  from public.fnb_work_schedules sc
  full join sessions se on se.staff_code=sc.staff_code and se.work_date=sc.work_date
), calculated as (
  select b.*,s.name staff_name,s.position,s.department,s.expected_daily_minutes,
         u.name unit_name,coalesce(u.timezone,'Asia/Ho_Chi_Minh') unit_timezone,
         case when b.planned_start is not null
              then ((b.work_date+b.planned_start) at time zone coalesce(u.timezone,'Asia/Ho_Chi_Minh'))
              else null end planned_start_at,
         case when b.planned_end is not null
              then (((b.work_date+b.planned_end)
                    + case when b.planned_start is not null and b.planned_end<=b.planned_start then interval '1 day' else interval '0 day' end)
                    at time zone coalesce(u.timezone,'Asia/Ho_Chi_Minh'))
              else null end planned_end_at
  from base b
  join public.fnb_staff s on s.code=b.staff_code
  left join public.fnb_units u on u.code=b.unit_code
)
select c.staff_code,c.staff_name,c.position,c.department,c.unit_code,c.unit_name,c.work_date,
       coalesce(c.expected_minutes,case when coalesce(c.day_status,'work')='work' then c.expected_daily_minutes else 0 end) expected_minutes,
       coalesce(c.closed_minutes,0) actual_minutes,
       greatest(0,coalesce(c.expected_minutes,case when coalesce(c.day_status,'work')='work' then c.expected_daily_minutes else 0 end)-coalesce(c.closed_minutes,0)) missing_minutes,
       greatest(0,coalesce(c.closed_minutes,0)-coalesce(c.expected_minutes,case when coalesce(c.day_status,'work')='work' then c.expected_daily_minutes else 0 end)) overtime_minutes,
       case when coalesce(c.day_status,'work')='work' and c.planned_start_at is not null and c.first_check_in_at is not null
            then greatest(0,floor(extract(epoch from (c.first_check_in_at-c.planned_start_at))/60))::integer
            else 0 end late_minutes,
       case when coalesce(c.day_status,'work')='work' and c.planned_end_at is not null and c.last_check_out_at is not null and not coalesce(c.has_open_session,false)
            then greatest(0,floor(extract(epoch from (c.planned_end_at-c.last_check_out_at))/60))::integer
            else 0 end early_leave_minutes,
       coalesce(c.day_status,'work') day_status,
       coalesce(c.session_count,0) session_count,
       coalesce(c.has_open_session,false) has_open_session,
       coalesce(c.has_schedule_exception,false) has_schedule_exception,
       coalesce(c.exception_session_count,0) exception_session_count,
       c.planned_start,c.planned_end,c.planned_start_at,c.planned_end_at,
       c.first_check_in_at,c.last_check_out_at
from calculated c;

-- Existing report views must also execute with the caller's RLS context.
alter view if exists public.fnb_v_daily_revenue set (security_invoker=true);
alter view if exists public.fnb_v_product_sales set (security_invoker=true);
alter view if exists public.fnb_v_attendance_today set (security_invoker=true);
alter view if exists public.fnb_v_room_status set (security_invoker=true);

create or replace view public.fnb_v_attendance_monthly
with (security_invoker=true)
as
select staff_code,staff_name,unit_code,unit_name,date_trunc('month',work_date)::date month,
       sum(expected_minutes)::integer expected_minutes,
       sum(actual_minutes)::integer actual_minutes,
       sum(missing_minutes)::integer missing_minutes,
       sum(overtime_minutes)::integer overtime_minutes,
       sum(late_minutes)::integer late_minutes,
       sum(early_leave_minutes)::integer early_leave_minutes,
       count(*) filter(where day_status='work') work_days,
       count(*) filter(where day_status in ('off','leave','holiday')) non_work_days,
       count(*) filter(where has_open_session) open_session_days,
       count(*) filter(where has_schedule_exception) schedule_exception_days,
       sum(exception_session_count)::integer exception_session_count
from public.fnb_v_attendance_daily
group by staff_code,staff_name,unit_code,unit_name,date_trunc('month',work_date)::date;

-- ---------------------------------------------------------------------------
-- 7. Production RLS: remove all demo-open policies and rebuild
-- ---------------------------------------------------------------------------

do $$
declare r record; p record;
begin
  for r in select tablename from pg_tables where schemaname='public' and tablename like 'fnb_%' loop
    execute format('alter table public.%I enable row level security',r.tablename);
    for p in select policyname from pg_policies where schemaname='public' and tablename=r.tablename loop
      execute format('drop policy if exists %I on public.%I',p.policyname,r.tablename);
    end loop;
  end loop;
end $$;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;

grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage,select on all sequences in schema public to authenticated;

-- Units
create policy fnb_units_select_authenticated on public.fnb_units
for select to authenticated using (
  public.fnb_current_staff_code() is not null
  and (type in ('GROUP','RESTAURANT_GROUP','HOTEL_GROUP') or public.fnb_can_access_unit(code))
);

-- Staff and assignments
create policy fnb_staff_select_self_or_manager on public.fnb_staff
for select to authenticated using (
  code=public.fnb_current_staff_code()
  or public.fnb_is_manager_for_unit(unit_code)
  or exists(
    select 1 from public.fnb_staff_unit_assignments a
    where a.staff_code=code and a.active=true
      and (a.effective_from is null or a.effective_from<=current_date)
      and (a.effective_to is null or a.effective_to>=current_date)
      and public.fnb_is_manager_for_unit(a.unit_code)
  )
);

create policy fnb_assign_select_self_or_manager on public.fnb_staff_unit_assignments
for select to authenticated using (
  staff_code=public.fnb_current_staff_code() or public.fnb_is_manager_for_unit(unit_code)
);

-- Attendance: records are written through RPC, but readable by self/manager.
create policy fnb_attendance_select_self_or_manager on public.fnb_attendance_records
for select to authenticated using (
  staff_code=public.fnb_current_staff_code() or public.fnb_is_manager_for_unit(unit_code)
);
create policy fnb_checklist_select_self_or_manager on public.fnb_shift_checklists
for select to authenticated using (exists(
  select 1 from public.fnb_attendance_records r where r.id=attendance_id
    and (r.staff_code=public.fnb_current_staff_code() or public.fnb_is_manager_for_unit(r.unit_code))
));

create policy fnb_schedule_select_self_or_manager on public.fnb_work_schedules
for select to authenticated using (staff_code=public.fnb_current_staff_code() or public.fnb_is_manager_for_unit(unit_code));
create policy fnb_schedule_write_manager on public.fnb_work_schedules
for all to authenticated using (
  public.fnb_is_manager_for_unit(unit_code)
  and public.fnb_has_permission('hr',unit_code)
  and public.fnb_staff_can_work_unit(staff_code,unit_code)
)
with check (
  public.fnb_is_manager_for_unit(unit_code)
  and public.fnb_has_permission('hr',unit_code)
  and public.fnb_staff_can_work_unit(staff_code,unit_code)
);

create policy fnb_leave_select_self_or_manager on public.fnb_leave_requests
for select to authenticated using (staff_code=public.fnb_current_staff_code() or public.fnb_is_manager_for_unit(unit_code));
create policy fnb_leave_insert_self on public.fnb_leave_requests
for insert to authenticated with check (staff_code=public.fnb_current_staff_code() and public.fnb_can_access_unit(unit_code) and status='pending');
create policy fnb_leave_update_self_pending on public.fnb_leave_requests
for update to authenticated using (staff_code=public.fnb_current_staff_code() and status='pending')
with check (staff_code=public.fnb_current_staff_code() and status in ('pending','cancelled'));

-- requested_by is mandatory for adjustments and is populated by the client auth.uid().
create policy fnb_adjust_select_self_or_manager on public.fnb_attendance_adjustments
for select to authenticated using (staff_code=public.fnb_current_staff_code() or public.fnb_is_manager_for_unit(unit_code));
create policy fnb_adjust_insert_self on public.fnb_attendance_adjustments
for insert to authenticated with check (staff_code=public.fnb_current_staff_code() and requested_by=auth.uid() and status='pending' and public.fnb_can_access_unit(unit_code));
create policy fnb_adjust_update_self_pending on public.fnb_attendance_adjustments
for update to authenticated using (staff_code=public.fnb_current_staff_code() and status='pending')
with check (staff_code=public.fnb_current_staff_code() and status in ('pending','cancelled'));

create policy fnb_audit_select_manager on public.fnb_attendance_audit_logs
for select to authenticated using (public.fnb_is_manager_for_unit(unit_code));
create policy fnb_location_audit_select_manager on public.fnb_unit_location_audit_logs
for select to authenticated using (public.fnb_is_manager_for_unit(unit_code));

-- Permission-scoped operational tables.
create policy fnb_money_accounts_policy on public.fnb_money_accounts
for select to authenticated using (public.fnb_has_permission('finance',unit_code));
create policy fnb_finance_policy on public.fnb_finance_transactions
for all to authenticated using (public.fnb_has_permission('finance',unit_code)) with check (public.fnb_has_permission('finance',unit_code));
create policy fnb_cash_closing_policy on public.fnb_cash_closing_sessions
for all to authenticated using (public.fnb_has_permission('finance',unit_code)) with check (public.fnb_has_permission('finance',unit_code));

create policy fnb_customer_messages_policy on public.fnb_customer_messages
for all to authenticated using (public.fnb_has_permission('customers',unit_code)) with check (public.fnb_has_permission('customers',unit_code));
create policy fnb_customer_leads_policy on public.fnb_customer_leads
for all to authenticated using (public.fnb_has_permission('customers',unit_code)) with check (public.fnb_has_permission('customers',unit_code));
create policy fnb_ai_logs_policy on public.fnb_ai_consult_logs
for all to authenticated using (public.fnb_has_permission('customers',unit_code)) with check (public.fnb_has_permission('customers',unit_code));

create policy fnb_kiot_branches_policy on public.fnb_kiot_branches
for all to authenticated using (public.fnb_has_permission('kiot',unit_code)) with check (public.fnb_has_permission('kiot',unit_code));
create policy fnb_kiot_invoices_policy on public.fnb_kiot_invoices
for all to authenticated using (public.fnb_has_permission('kiot',unit_code) or public.fnb_has_permission('dashboard',unit_code))
with check (public.fnb_has_permission('kiot',unit_code));
create policy fnb_kiot_items_policy on public.fnb_kiot_invoice_items
for all to authenticated using (public.fnb_has_permission('kiot',unit_code) or public.fnb_has_permission('dashboard',unit_code))
with check (public.fnb_has_permission('kiot',unit_code));
create policy fnb_stock_policy on public.fnb_stock_movements
for all to authenticated using (public.fnb_has_permission('kiot',unit_code)) with check (public.fnb_has_permission('kiot',unit_code));
create policy fnb_ingredients_select on public.fnb_ingredients
for select to authenticated using (public.fnb_has_permission('kiot',null));
create policy fnb_ingredients_write on public.fnb_ingredients
for all to authenticated using (public.fnb_has_permission('kiot',null)) with check (public.fnb_has_permission('kiot',null));
create policy fnb_recipes_select on public.fnb_recipes
for select to authenticated using (public.fnb_has_permission('kiot',null));
create policy fnb_recipes_write on public.fnb_recipes
for all to authenticated using (public.fnb_has_permission('kiot',null)) with check (public.fnb_has_permission('kiot',null));

create policy fnb_rooms_policy on public.fnb_hotel_rooms
for all to authenticated using (public.fnb_has_permission('hotel',unit_code)) with check (public.fnb_has_permission('hotel',unit_code));
create policy fnb_reservations_policy on public.fnb_hotel_reservations
for all to authenticated using (public.fnb_has_permission('hotel',unit_code)) with check (public.fnb_has_permission('hotel',unit_code));
create policy fnb_housekeeping_policy on public.fnb_housekeeping_tasks
for all to authenticated using (public.fnb_has_permission('hotel',unit_code)) with check (public.fnb_has_permission('hotel',unit_code));

create policy fnb_notification_policy on public.fnb_notification_logs
for all to authenticated using (public.fnb_can_access_unit(unit_code)) with check (public.fnb_can_access_unit(unit_code));
create policy fnb_sync_logs_admin on public.fnb_sync_logs
for select to authenticated using (public.fnb_has_permission('settings',null));

-- Explicit function privileges. Remove PostgreSQL's default PUBLIC execute grant.
revoke execute on function public.fnb_distance_m(double precision,double precision,double precision,double precision) from public,anon;
revoke execute on function public.fnb_current_staff_code() from public,anon;
revoke execute on function public.fnb_current_staff_role() from public,anon;
revoke execute on function public.fnb_can_access_unit(text) from public,anon;
revoke execute on function public.fnb_has_permission(text,text) from public,anon;
revoke execute on function public.fnb_is_manager_for_unit(text) from public,anon;
revoke execute on function public.fnb_can_manage_staff(text) from public,anon;
revoke execute on function public.fnb_staff_can_work_unit(text,text) from public,anon;
revoke execute on function public.fnb_get_my_profile() from public,anon;
revoke execute on function public.fnb_nearest_authorised_unit(double precision,double precision) from public,anon;
revoke execute on function public.fnb_check_in(double precision,double precision,double precision,text,uuid) from public,anon;
revoke execute on function public.fnb_check_out(double precision,double precision,double precision,text,uuid) from public,anon;
revoke execute on function public.fnb_save_unit_location(text,double precision,double precision,double precision,integer,integer) from public,anon;
revoke execute on function public.fnb_review_leave_request(uuid,boolean,text) from public,anon;
revoke execute on function public.fnb_review_attendance_adjustment(uuid,boolean,text) from public,anon;
revoke execute on function public.fnb_manager_record_attendance(text,text,text,date,timestamptz,timestamptz,text) from public,anon;

grant execute on function public.fnb_distance_m(double precision,double precision,double precision,double precision) to authenticated;
grant execute on function public.fnb_current_staff_code() to authenticated;
grant execute on function public.fnb_current_staff_role() to authenticated;
grant execute on function public.fnb_can_access_unit(text) to authenticated;
grant execute on function public.fnb_has_permission(text,text) to authenticated;
grant execute on function public.fnb_is_manager_for_unit(text) to authenticated;
grant execute on function public.fnb_can_manage_staff(text) to authenticated;
grant execute on function public.fnb_staff_can_work_unit(text,text) to authenticated;
grant execute on function public.fnb_get_my_profile() to authenticated;
grant execute on function public.fnb_nearest_authorised_unit(double precision,double precision) to authenticated;
grant execute on function public.fnb_check_in(double precision,double precision,double precision,text,uuid) to authenticated;
grant execute on function public.fnb_check_out(double precision,double precision,double precision,text,uuid) to authenticated;
grant execute on function public.fnb_save_unit_location(text,double precision,double precision,double precision,integer,integer) to authenticated;
grant execute on function public.fnb_review_leave_request(uuid,boolean,text) to authenticated;
grant execute on function public.fnb_review_attendance_adjustment(uuid,boolean,text) to authenticated;
grant execute on function public.fnb_manager_record_attendance(text,text,text,date,timestamptz,timestamptz,text) to authenticated;

notify pgrst, 'reload schema';

commit;
