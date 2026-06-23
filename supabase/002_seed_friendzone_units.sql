-- Seed cơ sở, nhân sự mẫu, tài khoản quỹ, phòng hotel, định lượng mẫu.

insert into public.fnb_units(code,name,type,parent_code,address,manager_code) values
('GROUP_ALL','Friendzone Group','GROUP',null,'Phan Thiết / Lâm Đồng','GROUP_ALL_QL'),
('NHA_ALL','Tất cả nhà hàng','RESTAURANT_GROUP','GROUP_ALL','Tổng hợp nhà hàng','NHA_ALL_QL'),
('NHA_SAIGONPHO','Sài Gòn Phố - Beer Garden & Karaoke','RESTAURANT','NHA_ALL','N5-33 Mậu Thân, Phú Thuỷ, Lâm Đồng - Ocean Dunes Phan Thiết','NHA_SAIGONPHO_QL'),
('NHA_FRZ','Friendzone Restaurant','RESTAURANT','NHA_ALL','Friendzone Restaurant','NHA_FRZ_QL'),
('HOTEL_ALL','Tất cả Hotel','HOTEL_GROUP','GROUP_ALL','Tổng hợp lưu trú','HOTEL_ALL_QL'),
('HOTEL_VENUS','Venus Resort / Hotel','HOTEL','HOTEL_ALL','Mũi Né / Phan Thiết','HOTEL_VENUS_QL'),
('HOTEL_VOLGA','Volga Hotel Apartment','HOTEL','HOTEL_ALL','Phan Thiết','HOTEL_VOLGA_QL'),
('HOTEL_A64','Hotel A64','HOTEL','HOTEL_ALL','Phan Thiết','HOTEL_A64_QL'),
('HOTEL_FRZ','Friendzone Hotel','HOTEL','HOTEL_ALL','Phan Thiết','HOTEL_FRZ_QL')
on conflict(code) do update set name=excluded.name,type=excluded.type,parent_code=excluded.parent_code,address=excluded.address,manager_code=excluded.manager_code;

insert into public.fnb_staff(code,name,unit_code,role,position,department,base_salary,permissions) values
('GROUP_ALL_QL','Admin Friendzone','GROUP_ALL','ADMIN','Chủ / Ban giám đốc','Điều hành',0,array['dashboard','attendance','finance','customers','hr','kiot','hotel','settings']),
('NHA_ALL_QL','Quản lý tổng nhà hàng','NHA_ALL','MANAGER','Quản lý vùng nhà hàng','Vận hành',15000000,array['dashboard','attendance','finance','customers','hr','kiot']),
('NHA_SAIGONPHO_QL','QL Sài Gòn Phố','NHA_SAIGONPHO','MANAGER','Quản lý cơ sở','Vận hành',12000000,array['dashboard','attendance','finance','customers','hr','kiot']),
('NHA_SAIGONPHO_01','Thu ngân SGP','NHA_SAIGONPHO','STAFF','Thu ngân','Thu ngân',7500000,array['attendance','finance','customers']),
('NHA_SAIGONPHO_02','Phục vụ SGP','NHA_SAIGONPHO','STAFF','Phục vụ','Phục vụ',6500000,array['attendance','customers']),
('NHA_SAIGONPHO_03','Bếp SGP','NHA_SAIGONPHO','STAFF','Bếp chính','Bếp',9500000,array['attendance','kiot']),
('NHA_FRZ_QL','QL Friendzone Restaurant','NHA_FRZ','MANAGER','Quản lý cơ sở','Vận hành',12000000,array['dashboard','attendance','finance','customers','hr','kiot']),
('NHA_FRZ_01','Phục vụ FRZ','NHA_FRZ','STAFF','Phục vụ','Phục vụ',6500000,array['attendance','customers']),
('HOTEL_ALL_QL','Quản lý tổng hotel','HOTEL_ALL','MANAGER','Quản lý vùng hotel','Lưu trú',15000000,array['dashboard','attendance','finance','customers','hr','hotel']),
('HOTEL_VENUS_QL','QL Venus','HOTEL_VENUS','MANAGER','Quản lý khách sạn','Lễ tân',12000000,array['dashboard','attendance','finance','customers','hr','hotel']),
('HOTEL_VENUS_01','Lễ tân Venus','HOTEL_VENUS','STAFF','Lễ tân','Lễ tân',7500000,array['attendance','customers','hotel']),
('HOTEL_VOLGA_QL','QL Volga','HOTEL_VOLGA','MANAGER','Quản lý khách sạn','Lưu trú',11000000,array['dashboard','attendance','finance','customers','hr','hotel']),
('HOTEL_A64_QL','QL A64','HOTEL_A64','MANAGER','Quản lý khách sạn','Lưu trú',10000000,array['dashboard','attendance','finance','customers','hr','hotel']),
('HOTEL_FRZ_QL','QL Friendzone Hotel','HOTEL_FRZ','MANAGER','Quản lý khách sạn','Lưu trú',11000000,array['dashboard','attendance','finance','customers','hr','hotel'])
on conflict(code) do update set name=excluded.name,unit_code=excluded.unit_code,role=excluded.role,position=excluded.position,department=excluded.department,base_salary=excluded.base_salary,permissions=excluded.permissions;

insert into public.fnb_money_accounts(code,unit_code,name,type,opening_balance) values
('TM_NHA_SAIGONPHO','NHA_SAIGONPHO','Tiền mặt Sài Gòn Phố','cash',0),
('CK_NHA_SAIGONPHO','NHA_SAIGONPHO','Chuyển khoản Sài Gòn Phố','bank',0),
('TM_NHA_FRZ','NHA_FRZ','Tiền mặt Friendzone Restaurant','cash',0),
('CK_NHA_FRZ','NHA_FRZ','Chuyển khoản Friendzone Restaurant','bank',0),
('TM_HOTEL_VENUS','HOTEL_VENUS','Tiền mặt Venus','cash',0),
('CK_HOTEL_VENUS','HOTEL_VENUS','Chuyển khoản Venus','bank',0),
('TM_HOTEL_VOLGA','HOTEL_VOLGA','Tiền mặt Volga','cash',0),
('CK_HOTEL_VOLGA','HOTEL_VOLGA','Chuyển khoản Volga','bank',0),
('TM_HOTEL_A64','HOTEL_A64','Tiền mặt A64','cash',0),
('CK_HOTEL_A64','HOTEL_A64','Chuyển khoản A64','bank',0),
('TM_HOTEL_FRZ','HOTEL_FRZ','Tiền mặt Friendzone Hotel','cash',0),
('CK_HOTEL_FRZ','HOTEL_FRZ','Chuyển khoản Friendzone Hotel','bank',0)
on conflict(code) do update set name=excluded.name,type=excluded.type;

insert into public.fnb_ingredients(code,name,unit,min_level,cost) values
('TOM','Tôm','kg',3,190000),
('MUC','Mực','kg',3,170000),
('RAU_LAU','Rau lẩu','phần',8,25000),
('BIA_TIGER','Bia Tiger','lon',48,18000),
('THIT_BBQ','Thịt BBQ','kg',5,130000),
('GAS','Gas/bếp','bình',1,420000)
on conflict(code) do update set name=excluded.name,unit=excluded.unit,min_level=excluded.min_level,cost=excluded.cost;

insert into public.fnb_recipes(product_code,product_name,ingredient_code,qty) values
('LAU_HAI_SAN','Lẩu hải sản','TOM',0.45),
('LAU_HAI_SAN','Lẩu hải sản','MUC',0.35),
('LAU_HAI_SAN','Lẩu hải sản','RAU_LAU',1),
('BIA_TIGER','Bia Tiger','BIA_TIGER',1),
('BBQ_SET','BBQ Set','THIT_BBQ',1.2),
('COMBO_NHAU','Combo nhậu 4 người','THIT_BBQ',0.8),
('COMBO_NHAU','Combo nhậu 4 người','RAU_LAU',1)
on conflict do nothing;

insert into public.fnb_hotel_rooms(id,unit_code,room_no,type,status,price) values
('VEN-101','HOTEL_VENUS','101','Standard','clean',850000),
('VEN-102','HOTEL_VENUS','102','Standard','clean',850000),
('VEN-201','HOTEL_VENUS','201','Deluxe','clean',1350000),
('VEN-202','HOTEL_VENUS','202','Deluxe','clean',1350000),
('VOL-A01','HOTEL_VOLGA','A01','Apartment','clean',1150000),
('VOL-A02','HOTEL_VOLGA','A02','Apartment','clean',1150000),
('A64-101','HOTEL_A64','101','Standard','clean',750000),
('FRZH-101','HOTEL_FRZ','101','Standard','clean',850000)
on conflict(id) do update set unit_code=excluded.unit_code,room_no=excluded.room_no,type=excluded.type,status=excluded.status,price=excluded.price;
