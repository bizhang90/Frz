-- Patch v1.0.1: NHA_ALL là nhà hàng All Night Food & Beer, không phải nhóm tổng nhà hàng.
-- Nếu đã chạy bản v1.0 trước đó, chạy file này sau 001/002/003 để sửa dữ liệu seed.

insert into public.fnb_units(code,name,type,parent_code,address,manager_code) values
('NHA_GROUP','Tất cả nhà hàng','RESTAURANT_GROUP','GROUP_ALL','Tổng hợp nhà hàng','NHA_GROUP_QL')
on conflict(code) do update set name=excluded.name,type=excluded.type,parent_code=excluded.parent_code,address=excluded.address,manager_code=excluded.manager_code;

update public.fnb_units
set name='All Night Food & Beer',
    type='RESTAURANT',
    parent_code='NHA_GROUP',
    address='All Night Food & Beer',
    manager_code='NHA_ALL_QL'
where code='NHA_ALL';

update public.fnb_units
set parent_code='NHA_GROUP'
where code in ('NHA_SAIGONPHO','NHA_FRZ');

insert into public.fnb_staff(code,name,unit_code,role,position,department,base_salary,permissions) values
('NHA_GROUP_QL','Quản lý tổng nhà hàng','NHA_GROUP','MANAGER','Quản lý vùng nhà hàng','Vận hành',15000000,array['dashboard','attendance','finance','customers','hr','kiot']),
('NHA_ALL_QL','QL All Night Food & Beer','NHA_ALL','MANAGER','Quản lý cơ sở','Vận hành',12000000,array['dashboard','attendance','finance','customers','hr','kiot']),
('NHA_ALL_01','Thu ngân All Night','NHA_ALL','STAFF','Thu ngân','Thu ngân',7500000,array['attendance','finance','customers']),
('NHA_ALL_02','Phục vụ All Night','NHA_ALL','STAFF','Phục vụ','Phục vụ',6500000,array['attendance','customers'])
on conflict(code) do update set name=excluded.name,unit_code=excluded.unit_code,role=excluded.role,position=excluded.position,department=excluded.department,base_salary=excluded.base_salary,permissions=excluded.permissions;

insert into public.fnb_money_accounts(code,unit_code,name,type,opening_balance) values
('TM_NHA_ALL','NHA_ALL','Tiền mặt All Night Food & Beer','cash',0),
('CK_NHA_ALL','NHA_ALL','Chuyển khoản All Night Food & Beer','bank',0)
on conflict(code) do update set unit_code=excluded.unit_code,name=excluded.name,type=excluded.type;
