-- View báo cáo nhanh cho dashboard / BI.
create or replace view public.fnb_v_daily_revenue as
select unit_code, date,
       count(*) as invoice_count,
       sum(total) as revenue,
       sum(cash) as cash,
       sum(bank) as bank
from public.fnb_kiot_invoices
group by unit_code, date;

create or replace view public.fnb_v_product_sales as
select unit_code, product_code, product_name,
       sum(qty) as qty,
       sum(qty * price) as revenue,
       sum(cost_estimate) as cost_estimate,
       sum(qty * price) - sum(cost_estimate) as gross_profit
from public.fnb_kiot_invoice_items
group by unit_code, product_code, product_name;

create or replace view public.fnb_v_attendance_today as
select r.*, s.name as staff_name, s.position, u.name as unit_name
from public.fnb_attendance_records r
left join public.fnb_staff s on s.code = r.staff_code
left join public.fnb_units u on u.code = r.unit_code
where r.work_date = current_date;

create or replace view public.fnb_v_room_status as
select unit_code,
       count(*) as total_rooms,
       count(*) filter (where status='occupied') as occupied_rooms,
       count(*) filter (where status='dirty') as dirty_rooms,
       count(*) filter (where status='maintenance') as maintenance_rooms,
       round((count(*) filter (where status='occupied')::numeric / nullif(count(*),0))*100, 2) as occupancy_rate
from public.fnb_hotel_rooms
group by unit_code;
