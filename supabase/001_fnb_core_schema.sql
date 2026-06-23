-- Friendzone F&B Ops v1 - Core schema
-- Chạy trên Supabase SQL Editor của project F&B riêng.
-- Prefix tất cả bảng bằng fnb_ để tách khỏi app đào tạo lái xe.

create extension if not exists pgcrypto;

create table if not exists public.fnb_units (
  code text primary key,
  name text not null,
  type text not null check (type in ('GROUP','RESTAURANT_GROUP','RESTAURANT','HOTEL_GROUP','HOTEL')),
  parent_code text references public.fnb_units(code),
  address text,
  manager_code text,
  active boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fnb_staff (
  code text primary key,
  name text not null,
  unit_code text references public.fnb_units(code),
  role text not null default 'STAFF',
  position text,
  department text,
  phone text,
  salary_type text default 'monthly',
  base_salary numeric default 0,
  active boolean not null default true,
  permissions text[] not null default array['attendance'],
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fnb_staff_unit_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_code text references public.fnb_staff(code) on delete cascade,
  unit_code text references public.fnb_units(code) on delete cascade,
  is_primary boolean default false,
  created_at timestamptz not null default now(),
  unique(staff_code, unit_code)
);

create table if not exists public.fnb_attendance_records (
  id text primary key,
  staff_code text references public.fnb_staff(code),
  unit_code text references public.fnb_units(code),
  work_date date not null,
  shift text not null default 'full',
  check_in_at timestamptz,
  check_out_at timestamptz,
  status text not null default 'working',
  checklist_done boolean not null default false,
  latitude numeric,
  longitude numeric,
  note text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fnb_attendance_date_unit on public.fnb_attendance_records(work_date, unit_code);

create table if not exists public.fnb_shift_checklists (
  id uuid primary key default gen_random_uuid(),
  attendance_id text references public.fnb_attendance_records(id) on delete cascade,
  item text not null,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fnb_money_accounts (
  code text primary key,
  unit_code text references public.fnb_units(code),
  name text not null,
  type text not null default 'cash',
  opening_balance numeric not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fnb_finance_transactions (
  id text primary key,
  unit_code text references public.fnb_units(code),
  date date not null,
  type text not null check (type in ('income','expense','transfer')),
  account text,
  category text,
  amount numeric not null default 0,
  note text,
  evidence text,
  raw jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_fnb_finance_unit_date on public.fnb_finance_transactions(unit_code, date);

create table if not exists public.fnb_cash_closing_sessions (
  id text primary key,
  unit_code text references public.fnb_units(code),
  date date not null,
  kiot_cash numeric default 0,
  actual_cash numeric default 0,
  cash_diff numeric generated always as (coalesce(actual_cash,0)-coalesce(kiot_cash,0)) stored,
  kiot_bank numeric default 0,
  actual_bank numeric default 0,
  bank_diff numeric generated always as (coalesce(actual_bank,0)-coalesce(kiot_bank,0)) stored,
  note text,
  closed_by text,
  created_at timestamptz not null default now(),
  unique(unit_code, date)
);

create table if not exists public.fnb_customer_messages (
  id text primary key default ('MSG-' || substr(gen_random_uuid()::text,1,12)),
  unit_code text references public.fnb_units(code),
  page text,
  customer_name text,
  psid text,
  text text,
  intent text,
  status text not null default 'new',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fnb_customer_messages_unit_status on public.fnb_customer_messages(unit_code, status, created_at desc);

create table if not exists public.fnb_customer_leads (
  id text primary key default ('LEAD-' || substr(gen_random_uuid()::text,1,12)),
  unit_code text references public.fnb_units(code),
  customer_name text,
  phone text,
  need text,
  source text,
  status text not null default 'new',
  no_phone_public boolean not null default true,
  note text,
  assigned_to text,
  booking_date timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fnb_ai_consult_logs (
  id uuid primary key default gen_random_uuid(),
  message_id text,
  unit_code text,
  intent text,
  reply text,
  provider text default 'rule',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.fnb_kiot_branches (
  kiot_id text primary key,
  unit_code text references public.fnb_units(code),
  name text,
  address text,
  raw jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.fnb_kiot_invoices (
  id text primary key,
  unit_code text references public.fnb_units(code),
  date date not null,
  source text default 'KiotViet',
  code text,
  total numeric default 0,
  cash numeric default 0,
  bank numeric default 0,
  status text default 'paid',
  customer text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_fnb_kiot_invoices_unit_date on public.fnb_kiot_invoices(unit_code, date);

create table if not exists public.fnb_kiot_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id text references public.fnb_kiot_invoices(id) on delete cascade,
  unit_code text references public.fnb_units(code),
  product_code text,
  product_name text,
  qty numeric default 0,
  price numeric default 0,
  cost_estimate numeric default 0,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_fnb_kiot_invoice_items_product on public.fnb_kiot_invoice_items(unit_code, product_code);

create table if not exists public.fnb_ingredients (
  code text primary key,
  name text not null,
  unit text,
  min_level numeric default 0,
  cost numeric default 0,
  active boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fnb_recipes (
  id text primary key default ('RCP-' || substr(gen_random_uuid()::text,1,12)),
  product_code text not null,
  product_name text,
  ingredient_code text references public.fnb_ingredients(code),
  qty numeric not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_fnb_recipes_product on public.fnb_recipes(product_code);

create table if not exists public.fnb_stock_movements (
  id text primary key default ('STK-' || substr(gen_random_uuid()::text,1,12)),
  unit_code text references public.fnb_units(code),
  date date not null,
  ingredient_code text references public.fnb_ingredients(code),
  type text not null check (type in ('in','out','waste','transfer','count_adjust')),
  qty numeric not null default 0,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_fnb_stock_movements_unit_date on public.fnb_stock_movements(unit_code, date);

create table if not exists public.fnb_hotel_rooms (
  id text primary key,
  unit_code text references public.fnb_units(code),
  room_no text not null,
  type text,
  status text not null default 'clean',
  price numeric default 0,
  note text,
  updated_at timestamptz not null default now(),
  unique(unit_code, room_no)
);

create table if not exists public.fnb_hotel_reservations (
  id text primary key,
  unit_code text references public.fnb_units(code),
  room_id text references public.fnb_hotel_rooms(id),
  customer_name text,
  phone text,
  checkin date,
  checkout date,
  source text,
  status text not null default 'confirmed',
  total numeric default 0,
  note text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fnb_housekeeping_tasks (
  id text primary key default ('HSK-' || substr(gen_random_uuid()::text,1,12)),
  unit_code text references public.fnb_units(code),
  room_id text references public.fnb_hotel_rooms(id),
  task text not null,
  status text not null default 'todo',
  due_date date,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fnb_notification_logs (
  id text primary key default ('NOTI-' || substr(gen_random_uuid()::text,1,12)),
  channel text,
  unit_code text references public.fnb_units(code),
  content text,
  status text default 'created',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.fnb_sync_logs (
  id uuid primary key default gen_random_uuid(),
  type text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS: bản nội bộ demo cho frontend trực tiếp. Khi lên production nên siết theo auth/role.
alter table public.fnb_units enable row level security;
alter table public.fnb_staff enable row level security;
alter table public.fnb_staff_unit_assignments enable row level security;
alter table public.fnb_attendance_records enable row level security;
alter table public.fnb_shift_checklists enable row level security;
alter table public.fnb_money_accounts enable row level security;
alter table public.fnb_finance_transactions enable row level security;
alter table public.fnb_cash_closing_sessions enable row level security;
alter table public.fnb_customer_messages enable row level security;
alter table public.fnb_customer_leads enable row level security;
alter table public.fnb_ai_consult_logs enable row level security;
alter table public.fnb_kiot_branches enable row level security;
alter table public.fnb_kiot_invoices enable row level security;
alter table public.fnb_kiot_invoice_items enable row level security;
alter table public.fnb_ingredients enable row level security;
alter table public.fnb_recipes enable row level security;
alter table public.fnb_stock_movements enable row level security;
alter table public.fnb_hotel_rooms enable row level security;
alter table public.fnb_hotel_reservations enable row level security;
alter table public.fnb_housekeeping_tasks enable row level security;
alter table public.fnb_notification_logs enable row level security;
alter table public.fnb_sync_logs enable row level security;

-- Cho phép anon/auth dùng ở bản nội bộ. Production nên thay bằng policy theo auth.uid/role.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname='public' and tablename like 'fnb_%' loop
    execute format('drop policy if exists "fnb_internal_open_select" on public.%I', r.tablename);
    execute format('drop policy if exists "fnb_internal_open_insert" on public.%I', r.tablename);
    execute format('drop policy if exists "fnb_internal_open_update" on public.%I', r.tablename);
    execute format('create policy "fnb_internal_open_select" on public.%I for select using (true)', r.tablename);
    execute format('create policy "fnb_internal_open_insert" on public.%I for insert with check (true)', r.tablename);
    execute format('create policy "fnb_internal_open_update" on public.%I for update using (true) with check (true)', r.tablename);
  end loop;
end $$;
