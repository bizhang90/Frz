(function(){
  'use strict';

  const CONFIG = window.FNB_CONFIG || {};
  const STORE_KEY = 'FRIENDZONE_FNB_OPS_V1_1_0';
  const SESSION_KEY = 'FZ_EMPLOYEE_SESSION';
  const root = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  let sb = null;
  if (window.supabase && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }

  const UNIT_SEED = [
    {code:'GROUP_ALL', name:'FriendZones Group', type:'GROUP', parent_code:null, address:'Phan Thiết, Lâm Đồng', manager_code:'GROUP_ALL_QL'},
    {code:'NHA_GROUP', name:'Tất cả nhà hàng', type:'RESTAURANT_GROUP', parent_code:'GROUP_ALL', address:'Hệ thống nhà hàng FriendZones', manager_code:'NHA_GROUP_QL'},
    {code:'NHA_ALL', name:'All Night Food & Beer', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'79 Lê Duẩn, Phan Thiết, Lâm Đồng', manager_code:'NHA_ALL_QL'},
    {code:'NHA_SAIGONPHO', name:'Sài Gòn Phố - Beer Garden & Karaoke', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'N5-33 Mậu Thân, Phú Thuỷ, Lâm Đồng', manager_code:'NHA_SAIGONPHO_QL'},
    {code:'NHA_FRZ', name:'Nhà hàng FriendZones', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'130 Đỗ Hành, Phú Thuỷ, Phan Thiết, Lâm Đồng', manager_code:'NHA_FRZ_QL'},
    {code:'NHA_THUNG', name:'THÚNG View Hồ Tôm', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'Đại lộ Hùng Vương, Phan Thiết, Lâm Đồng', manager_code:'NHA_THUNG_QL'},
    {code:'NHA_CHAM', name:'Nhà hàng Chấmmm', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'L80-82 Tôn Đức Thắng, Phan Thiết, Lâm Đồng', manager_code:'NHA_CHAM_QL'},
    {code:'NHA_PHAN_COFFEE', name:'Phan Coffee', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'C34 Lê Duẩn, Phan Thiết, Lâm Đồng', manager_code:'NHA_PHAN_COFFEE_QL'},
    {code:'HOTEL_ALL', name:'Tất cả lưu trú', type:'HOTEL_GROUP', parent_code:'GROUP_ALL', address:'Hệ thống lưu trú FriendZones', manager_code:'HOTEL_ALL_QL'},
    {code:'HOTEL_VENUS', name:'Venus Mũi Né Resort', type:'HOTEL', parent_code:'HOTEL_ALL', address:'Số 10 Hoà Bình, Mũi Né, Lâm Đồng', manager_code:'HOTEL_VENUS_QL'},
    {code:'HOTEL_VOLGA', name:'Volga Hotel & Apartment', type:'HOTEL', parent_code:'HOTEL_ALL', address:'219 Nguyễn Đình Chiểu, Mũi Né, Lâm Đồng', manager_code:'HOTEL_VOLGA_QL'},
    {code:'HOTEL_A64', name:'Love Hotel', type:'HOTEL', parent_code:'HOTEL_ALL', address:'A64 Hùng Vương, Phú Thuỷ, Lâm Đồng', manager_code:'HOTEL_A64_QL'},
    {code:'HOTEL_FRZ', name:'Friendzones Hotel', type:'HOTEL', parent_code:'HOTEL_ALL', address:'287 Thủ Khoa Huân, Phú Thuỷ, Lâm Đồng', manager_code:'HOTEL_FRZ_QL'}
  ];

  const PAGES = [
    ['dashboard','🏠','Tổng quan'], ['attendance','🕘','Chấm công'], ['finance','💰','Kế toán nội bộ'],
    ['customers','💬','Khách hàng & AI'], ['hr','👥','Nhân sự'], ['kiot','📦','KiotViet & Kho'],
    ['hotel','🏨','Hotel'], ['settings','⚙️','Cấu hình']
  ];

  const DEFAULT_CHECKLISTS = {
    RESTAURANT: ['Đối soát bill KiotViet', 'Kiểm tiền mặt cuối ca', 'Chụp tồn tủ/kho chính', 'Ghi nhận món hết/hủy', 'Dọn khu vực bàn/phòng VIP', 'Bàn giao ca sau'],
    HOTEL: ['Kiểm phòng check-out', 'Cập nhật phòng bẩn/sạch', 'Ghi nhận minibar/phụ thu', 'Kiểm booking ngày mai', 'Ghi nhận sự cố phòng', 'Bàn giao ca sau']
  };

  const PERMISSIONS = ['dashboard','attendance','finance','customers','hr','kiot','hotel','settings'];
  const money = v => new Intl.NumberFormat('vi-VN').format(Math.round(Number(v || 0))) + 'đ';
  const num = v => Number(v || 0);
  const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
  const nowISO = () => new Date().toISOString();
  const randomUUID = () => (window.crypto&&crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
  const DEVICE_KEY = 'FZ_DEVICE_ID_V1';
  const deviceId = (()=>{ let v=localStorage.getItem(DEVICE_KEY); if(!v){ v='web-'+randomUUID(); localStorage.setItem(DEVICE_KEY,v); } return v; })();
  let currentProfile = null;
  let lastGeo = null;
  let busyAction = '';
  let sessionTimer = null;
  const uid = p => `${p}-${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`;
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const phoneRe = /(?:\+?84|0)(?:\d[\s.-]?){8,10}\d/g;
  const maskPhone = text => String(text || '').replace(phoneRe, m => {
    const d = m.replace(/\D/g,'');
    if (d.length < 8) return '***';
    return d.slice(0,3) + '****' + d.slice(-2);
  });


  function csvCell(value){
    const text=String(value??'');
    return /[",\n\r]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
  }
  function exportAttendanceCsv(){
    const month=today().slice(0,7)+'-01';
    const rows=state.attendanceMonthly.filter(x=>x.month===month&&inUnit(x));
    if(!rows.length){toast('Chưa có dữ liệu bảng công để xuất');return;}
    const headers=['Tháng','Mã nhân sự','Họ tên','Cơ sở','Ngày làm','Ngày nghỉ','Giờ dự kiến','Giờ thực tế','Thiếu phút','Tăng thêm phút','Đi trễ phút','Về sớm phút','Ngày chấm khác lịch/cơ sở','Số phiên khác lịch/cơ sở','Ngày còn phiên mở','Lương cơ bản','Đơn giá giờ'];
    const body=rows.map(r=>{
      const staff=staffBy(r.staff_code)||{};
      return [r.month,r.staff_code,r.staff_name,r.unit_name||r.unit_code,r.work_days||0,r.non_work_days||0,
        Math.round(num(r.expected_minutes)/60*100)/100,Math.round(num(r.actual_minutes)/60*100)/100,
        num(r.missing_minutes),num(r.overtime_minutes),num(r.late_minutes),num(r.early_leave_minutes),num(r.schedule_exception_days),num(r.exception_session_count),num(r.open_session_days),
        num(staff.base_salary),num(staff.hourly_rate)].map(csvCell).join(',');
    });
    const csv='\uFEFF'+[headers.map(csvCell).join(','),...body].join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download=`bang-cong-${today().slice(0,7)}.csv`;document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Đã xuất CSV bảng công');
  }

  function toast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(()=>toastEl.classList.remove('show'), 2600);
  }

  function demoData(){
    const d = today();
    const staff = [
      {code:'GROUP_ALL_QL', name:'Admin Friendzone', unit_code:'GROUP_ALL', role:'ADMIN', position:'Chủ / Ban giám đốc', department:'Điều hành', salary_type:'monthly', base_salary:0, active:true, permissions:PERMISSIONS},
      {code:'NHA_GROUP_QL', name:'Quản lý tổng nhà hàng', unit_code:'NHA_GROUP', role:'MANAGER', position:'Quản lý vùng nhà hàng', department:'Vận hành', salary_type:'monthly', base_salary:15000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','kiot']},
      {code:'NHA_ALL_QL', name:'QL All Night Food & Beer', unit_code:'NHA_ALL', role:'MANAGER', position:'Quản lý cơ sở', department:'Vận hành', salary_type:'monthly', base_salary:12000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','kiot']},
      {code:'NHA_ALL_01', name:'Thu ngân All Night', unit_code:'NHA_ALL', role:'STAFF', position:'Thu ngân', department:'Thu ngân', salary_type:'monthly', base_salary:7500000, active:true, permissions:['attendance','finance','customers']},
      {code:'NHA_ALL_02', name:'Phục vụ All Night', unit_code:'NHA_ALL', role:'STAFF', position:'Phục vụ', department:'Phục vụ', salary_type:'shift', base_salary:250000, active:true, permissions:['attendance','customers']},
      {code:'NHA_SAIGONPHO_QL', name:'QL Sài Gòn Phố', unit_code:'NHA_SAIGONPHO', role:'MANAGER', position:'Quản lý cơ sở', department:'Vận hành', salary_type:'monthly', base_salary:12000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','kiot']},
      {code:'NHA_SAIGONPHO_01', name:'Thu ngân SGP', unit_code:'NHA_SAIGONPHO', role:'STAFF', position:'Thu ngân', department:'Thu ngân', salary_type:'monthly', base_salary:7500000, active:true, permissions:['attendance','finance','customers']},
      {code:'NHA_SAIGONPHO_02', name:'Phục vụ SGP', unit_code:'NHA_SAIGONPHO', role:'STAFF', position:'Phục vụ', department:'Phục vụ', salary_type:'shift', base_salary:250000, active:true, permissions:['attendance','customers']},
      {code:'NHA_SAIGONPHO_03', name:'Bếp SGP', unit_code:'NHA_SAIGONPHO', role:'STAFF', position:'Bếp chính', department:'Bếp', salary_type:'monthly', base_salary:9500000, active:true, permissions:['attendance','kiot']},
      {code:'NHA_FRZ_QL', name:'QL Friendzone Restaurant', unit_code:'NHA_FRZ', role:'MANAGER', position:'Quản lý cơ sở', department:'Vận hành', salary_type:'monthly', base_salary:12000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','kiot']},
      {code:'NHA_FRZ_01', name:'Phục vụ FRZ', unit_code:'NHA_FRZ', role:'STAFF', position:'Phục vụ', department:'Phục vụ', salary_type:'shift', base_salary:250000, active:true, permissions:['attendance','customers']},
      {code:'HOTEL_ALL_QL', name:'Quản lý tổng hotel', unit_code:'HOTEL_ALL', role:'MANAGER', position:'Quản lý vùng hotel', department:'Lưu trú', salary_type:'monthly', base_salary:15000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','hotel']},
      {code:'HOTEL_VENUS_QL', name:'QL Venus', unit_code:'HOTEL_VENUS', role:'MANAGER', position:'Quản lý khách sạn', department:'Lễ tân', salary_type:'monthly', base_salary:12000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','hotel']},
      {code:'HOTEL_VENUS_01', name:'Lễ tân Venus', unit_code:'HOTEL_VENUS', role:'STAFF', position:'Lễ tân', department:'Lễ tân', salary_type:'monthly', base_salary:7500000, active:true, permissions:['attendance','customers','hotel']},
      {code:'HOTEL_VOLGA_QL', name:'QL Volga', unit_code:'HOTEL_VOLGA', role:'MANAGER', position:'Quản lý khách sạn', department:'Lưu trú', salary_type:'monthly', base_salary:11000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','hotel']},
      {code:'HOTEL_A64_QL', name:'QL A64', unit_code:'HOTEL_A64', role:'MANAGER', position:'Quản lý khách sạn', department:'Lưu trú', salary_type:'monthly', base_salary:10000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','hotel']},
      {code:'HOTEL_FRZ_QL', name:'QL Friendzone Hotel', unit_code:'HOTEL_FRZ', role:'MANAGER', position:'Quản lý khách sạn', department:'Lưu trú', salary_type:'monthly', base_salary:11000000, active:true, permissions:['dashboard','attendance','finance','customers','hr','hotel']}
    ];
    const invoices = [
      {id:'INV-000', unit_code:'NHA_ALL', date:d, source:'KiotViet', code:'KV-ALLNIGHT-0901', total:2860000, cash:860000, bank:2000000, status:'paid', customer:'Khách All Night Food & Beer'},
      {id:'INV-001', unit_code:'NHA_SAIGONPHO', date:d, source:'KiotViet', code:'KV-SGP-1001', total:3280000, cash:1280000, bank:2000000, status:'paid', customer:'Khách tiệc sinh nhật'},
      {id:'INV-002', unit_code:'NHA_SAIGONPHO', date:d, source:'KiotViet', code:'KV-SGP-1002', total:1560000, cash:1560000, bank:0, status:'paid', customer:'Khách walk-in'},
      {id:'INV-003', unit_code:'NHA_FRZ', date:d, source:'KiotViet', code:'KV-FRZ-2011', total:2420000, cash:420000, bank:2000000, status:'paid', customer:'Khách đặt bàn'},
      {id:'INV-004', unit_code:'HOTEL_VENUS', date:d, source:'KiotViet Hotel', code:'KV-VENUS-3301', total:1850000, cash:0, bank:1850000, status:'paid', customer:'Khách lưu trú'}
    ];
    const invoiceItems = [
      {invoice_id:'INV-000', unit_code:'NHA_ALL', product_code:'COMBO_NHAU', product_name:'Combo nhậu 4 người', qty:2, price:980000, cost_estimate:1040000},
      {invoice_id:'INV-000', unit_code:'NHA_ALL', product_code:'BIA_TIGER', product_name:'Bia Tiger', qty:30, price:30000, cost_estimate:540000},
      {invoice_id:'INV-001', unit_code:'NHA_SAIGONPHO', product_code:'LAU_HAI_SAN', product_name:'Lẩu hải sản', qty:2, price:680000, cost_estimate:720000},
      {invoice_id:'INV-001', unit_code:'NHA_SAIGONPHO', product_code:'BIA_TIGER', product_name:'Bia Tiger', qty:24, price:30000, cost_estimate:432000},
      {invoice_id:'INV-001', unit_code:'NHA_SAIGONPHO', product_code:'KARAOKE_VIP', product_name:'Phòng VIP Karaoke', qty:2, price:600000, cost_estimate:120000},
      {invoice_id:'INV-002', unit_code:'NHA_SAIGONPHO', product_code:'COMBO_NHAU', product_name:'Combo nhậu 4 người', qty:1, price:980000, cost_estimate:520000},
      {invoice_id:'INV-002', unit_code:'NHA_SAIGONPHO', product_code:'BIA_TIGER', product_name:'Bia Tiger', qty:12, price:30000, cost_estimate:216000},
      {invoice_id:'INV-003', unit_code:'NHA_FRZ', product_code:'BBQ_SET', product_name:'BBQ Set', qty:2, price:780000, cost_estimate:840000},
      {invoice_id:'INV-004', unit_code:'HOTEL_VENUS', product_code:'ROOM_DELUXE', product_name:'Phòng Deluxe', qty:1, price:1850000, cost_estimate:350000}
    ];
    const ingredients = [
      {code:'TOM', name:'Tôm', unit:'kg', min_level:3, cost:190000},
      {code:'MUC', name:'Mực', unit:'kg', min_level:3, cost:170000},
      {code:'RAU_LAU', name:'Rau lẩu', unit:'phần', min_level:8, cost:25000},
      {code:'BIA_TIGER', name:'Bia Tiger', unit:'lon', min_level:48, cost:18000},
      {code:'THIT_BBQ', name:'Thịt BBQ', unit:'kg', min_level:5, cost:130000},
      {code:'GAS', name:'Gas/bếp', unit:'bình', min_level:1, cost:420000}
    ];
    const recipes = [
      {product_code:'LAU_HAI_SAN', product_name:'Lẩu hải sản', ingredient_code:'TOM', qty:0.45},
      {product_code:'LAU_HAI_SAN', product_name:'Lẩu hải sản', ingredient_code:'MUC', qty:0.35},
      {product_code:'LAU_HAI_SAN', product_name:'Lẩu hải sản', ingredient_code:'RAU_LAU', qty:1.0},
      {product_code:'BIA_TIGER', product_name:'Bia Tiger', ingredient_code:'BIA_TIGER', qty:1},
      {product_code:'BBQ_SET', product_name:'BBQ Set', ingredient_code:'THIT_BBQ', qty:1.2},
      {product_code:'COMBO_NHAU', product_name:'Combo nhậu 4 người', ingredient_code:'THIT_BBQ', qty:0.8},
      {product_code:'COMBO_NHAU', product_name:'Combo nhậu 4 người', ingredient_code:'RAU_LAU', qty:1}
    ];
    const stockMovements = [
      {id:'STK-0A', unit_code:'NHA_ALL', date:d, ingredient_code:'THIT_BBQ', type:'in', qty:10, note:'Tồn đầu All Night'},
      {id:'STK-0B', unit_code:'NHA_ALL', date:d, ingredient_code:'RAU_LAU', type:'in', qty:15, note:'Tồn đầu All Night'},
      {id:'STK-0C', unit_code:'NHA_ALL', date:d, ingredient_code:'BIA_TIGER', type:'in', qty:120, note:'Tồn bia All Night'},
      {id:'STK-1', unit_code:'NHA_SAIGONPHO', date:d, ingredient_code:'TOM', type:'in', qty:8, note:'Tồn đầu/ngày'},
      {id:'STK-2', unit_code:'NHA_SAIGONPHO', date:d, ingredient_code:'MUC', type:'in', qty:7, note:'Tồn đầu/ngày'},
      {id:'STK-3', unit_code:'NHA_SAIGONPHO', date:d, ingredient_code:'RAU_LAU', type:'in', qty:18, note:'Tồn đầu/ngày'},
      {id:'STK-4', unit_code:'NHA_SAIGONPHO', date:d, ingredient_code:'BIA_TIGER', type:'in', qty:84, note:'Nhập bia'},
      {id:'STK-5', unit_code:'NHA_FRZ', date:d, ingredient_code:'THIT_BBQ', type:'in', qty:9, note:'Tồn đầu/ngày'},
      {id:'STK-6', unit_code:'NHA_FRZ', date:d, ingredient_code:'RAU_LAU', type:'in', qty:12, note:'Tồn đầu/ngày'}
    ];
    const rooms = ['101','102','103','201','202','203','301','302'].map((r,i)=>({id:'VEN-'+r, unit_code:'HOTEL_VENUS', room_no:r, type:i<3?'Standard':'Deluxe', status:i===0?'occupied':i===1?'dirty':i===2?'maintenance':'clean', price:i<3?850000:1350000}));
    rooms.push(...['A01','A02','A03','A04'].map((r,i)=>({id:'VOL-'+r, unit_code:'HOTEL_VOLGA', room_no:r, type:'Apartment', status:i===0?'occupied':'clean', price:1150000})));
    return {
      units: UNIT_SEED,
      staff,
      activeStaffCode:'GROUP_ALL_QL',
      attendanceRecords:[
        {id:'ATT-0', staff_code:'NHA_ALL_01', unit_code:'NHA_ALL', work_date:d, shift:'evening', check_in_at:d+'T16:00:00', check_out_at:'', status:'working', checklist_done:false},
        {id:'ATT-1', staff_code:'NHA_SAIGONPHO_01', unit_code:'NHA_SAIGONPHO', work_date:d, shift:'full', check_in_at:d+'T09:58:00', check_out_at:'', status:'working', checklist_done:false},
        {id:'ATT-2', staff_code:'NHA_SAIGONPHO_02', unit_code:'NHA_SAIGONPHO', work_date:d, shift:'evening', check_in_at:d+'T15:45:00', check_out_at:'', status:'working', checklist_done:false},
        {id:'ATT-3', staff_code:'HOTEL_VENUS_01', unit_code:'HOTEL_VENUS', work_date:d, shift:'morning', check_in_at:d+'T06:58:00', check_out_at:'', status:'working', checklist_done:false}
      ],
      financeTransactions:[
        {id:'TXN-0', unit_code:'NHA_ALL', date:d, type:'expense', account:'TM_NHA_ALL', category:'Mua hàng bếp', amount:650000, note:'Mua nguyên liệu All Night', evidence:''},
        {id:'TXN-1', unit_code:'NHA_SAIGONPHO', date:d, type:'expense', account:'TM_NHA_SAIGONPHO', category:'Mua hàng bếp', amount:980000, note:'Mua hải sản đầu ngày', evidence:''},
        {id:'TXN-2', unit_code:'HOTEL_VENUS', date:d, type:'expense', account:'TM_HOTEL_VENUS', category:'Sửa chữa', amount:250000, note:'Sửa nước phòng 102', evidence:''}
      ],
      cashClosings:[],
      pageMessages:[
        {id:'MSG-1', page:'Sài Gòn Phố', unit_code:'NHA_SAIGONPHO', customer_name:'Khách inbox ẩn danh', text:'Tối nay còn phòng VIP karaoke cho sinh nhật 12 người không? SĐT 0912345678', created_at:nowISO(), intent:'Đặt tiệc/Karaoke', status:'new'}
      ],
      customerLeads:[
        {id:'LEAD-1', customer_name:'Khách inbox ẩn danh', unit_code:'NHA_SAIGONPHO', need:'Đặt sinh nhật + phòng VIP Karaoke', source:'Facebook Page', status:'new', no_phone_public:true, note:'AI cần hỏi giờ đến, số khách chính xác, ngân sách/người.'}
      ],
      notifications:[],
      kiotInvoices: invoices,
      kiotInvoiceItems: invoiceItems,
      ingredients,
      recipes,
      stockMovements,
      hotelRooms: rooms,
      reservations:[
        {id:'RES-1', unit_code:'HOTEL_VENUS', room_id:'VEN-101', customer_name:'Khách Venus', checkin:d, checkout:addDays(d,1), source:'Facebook', status:'checked_in', total:1850000}
      ],
      housekeeping:[
        {id:'HSK-1', unit_code:'HOTEL_VENUS', room_id:'VEN-102', task:'Dọn phòng sau check-out', status:'todo', due_date:d}
      ],
      settings:{selectedUnit:'GROUP_ALL', loadedAt:nowISO(), appName:'Friendzone F&B Ops'}
    };
  }

  function addDays(date, days){ const dt = new Date(date+'T12:00:00'); dt.setDate(dt.getDate()+days); return dt.toISOString().slice(0,10); }

  let state = loadLocal();
  let ui = {page:'dashboard', unit: state.settings?.selectedUnit || CONFIG.DEFAULT_UNIT || 'GROUP_ALL', mobile:false, kiotTab:'sales', customerTab:'inbox'};

  function normalizeState(data){
    const base=data || {};
    const arrays=['units','staff','attendanceRecords','workSchedules','leaveRequests','attendanceAdjustments','attendanceDaily','attendanceMonthly','staffAssignments','financeTransactions','cashClosings','pageMessages','customerLeads','notifications','kiotInvoices','kiotInvoiceItems','ingredients','recipes','stockMovements','hotelRooms','reservations','housekeeping'];
    arrays.forEach(k=>{ if(!Array.isArray(base[k])) base[k]=[]; });
    if(!base.units.length) base.units=UNIT_SEED;
    base.settings=base.settings||{};
    return base;
  }

  function loadLocal(){
    try{
      const raw=localStorage.getItem(STORE_KEY);
      if(CONFIG.APP_ENV==='production'){
        const saved=raw?JSON.parse(raw):{};
        const selectedUnit=saved?.settings?.selectedUnit||CONFIG.DEFAULT_UNIT||'GROUP_ALL';
        // Production never restores operational, salary or attendance data from localStorage.
        const minimal=normalizeState({settings:{selectedUnit}});
        localStorage.setItem(STORE_KEY,JSON.stringify({settings:minimal.settings}));
        return minimal;
      }
      if(raw) return normalizeState(JSON.parse(raw));
    }catch(e){ console.warn(e); }
    return normalizeState(demoData());
  }
  function saveLocal(){
    state.settings = state.settings || {};
    state.settings.selectedUnit = ui.unit;
    state.settings.updatedAt = nowISO();
    if(CONFIG.APP_ENV==='production'){
      // Avoid persisting HR, payroll, finance and customer data on shared devices.
      localStorage.setItem(STORE_KEY,JSON.stringify({settings:{selectedUnit:ui.unit,updatedAt:state.settings.updatedAt}}));
      return;
    }
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  async function loadSupabase(){
    if(!sb) return;
    try{
      const {data:sessionData}=await sb.auth.getSession();
      if(!sessionData?.session) throw new Error('Phiên đăng nhập đã hết hạn');
      const {data:profile,error:profileError}=await sb.rpc('fnb_get_my_profile');
      if(profileError) throw profileError;
      if(!profile?.code) throw new Error('Tài khoản chưa liên kết hồ sơ nhân sự');
      currentProfile=profile;
      localStorage.setItem(SESSION_KEY,JSON.stringify({mode:'supabase',identity:sessionData.session.user.email,userId:sessionData.session.user.id,displayName:profile.name,staffCode:profile.code,loginAt:nowISO()}));
      const monthStart=today().slice(0,7)+'-01';
      const recentStart=addDays(today(),-90);
      const yearStart=today().slice(0,4)+'-01-01';
      const specs=[
        ['fnb_units','units'],['fnb_staff','staff'],['fnb_staff_unit_assignments','staffAssignments'],
        ['fnb_attendance_records','attendanceRecords',q=>q.gte('work_date',recentStart).order('check_in_at',{ascending:false})],
        ['fnb_work_schedules','workSchedules',q=>q.gte('work_date',monthStart).lte('work_date',addDays(today(),90)).order('work_date')],
        ['fnb_leave_requests','leaveRequests',q=>q.gte('end_date',yearStart).order('created_at',{ascending:false})],
        ['fnb_attendance_adjustments','attendanceAdjustments',q=>q.gte('work_date',yearStart).order('created_at',{ascending:false})],
        ['fnb_v_attendance_daily','attendanceDaily',q=>q.gte('work_date',monthStart).order('work_date',{ascending:false})],
        ['fnb_v_attendance_monthly','attendanceMonthly',q=>q.gte('month',yearStart).order('month',{ascending:false})],
        ['fnb_finance_transactions','financeTransactions'],['fnb_cash_closing_sessions','cashClosings'],
        ['fnb_customer_messages','pageMessages'],['fnb_customer_leads','customerLeads'],
        ['fnb_notification_logs','notifications'],['fnb_kiot_invoices','kiotInvoices'],['fnb_kiot_invoice_items','kiotInvoiceItems'],
        ['fnb_ingredients','ingredients'],['fnb_recipes','recipes'],['fnb_stock_movements','stockMovements'],
        ['fnb_hotel_rooms','hotelRooms'],['fnb_hotel_reservations','reservations'],['fnb_housekeeping_tasks','housekeeping']
      ];
      async function fetchPaged(table,configure,maxPages=20,pageSize=1000){
        const rows=[];
        for(let page=0;page<maxPages;page++){
          let query=sb.from(table).select('*');
          if(configure) query=configure(query);
          const {data,error}=await query.range(page*pageSize,(page+1)*pageSize-1);
          if(error) return {data:rows,error};
          rows.push(...(data||[]));
          if(!data||data.length<pageSize) break;
        }
        return {data:rows,error:null};
      }
      const results=await Promise.all(specs.map(([table,,configure])=>fetchPaged(table,configure)));
      results.forEach((res,idx)=>{
        if(!res.error && Array.isArray(res.data)) state[specs[idx][1]]=res.data;
        else if(res.error) console.warn(specs[idx][0],res.error.message);
      });
      const openResult=await fetchPaged('fnb_attendance_records',q=>q.is('check_out_at',null).eq('status','working').order('check_in_at',{ascending:false}),5,1000);
      if(!openResult.error){
        const byId=new Map((state.attendanceRecords||[]).map(x=>[x.id,x]));
        (openResult.data||[]).forEach(x=>byId.set(x.id,x));
        state.attendanceRecords=[...byId.values()].sort((x,y)=>String(y.check_in_at).localeCompare(String(x.check_in_at)));
      }
      state=normalizeState(state);
      const allowed=accessibleUnits().map(u=>u.code);
      if(!allowed.includes(ui.unit)) ui.unit=currentProfile.unit_code || allowed[0] || 'GROUP_ALL';
      if(!canPage(ui.page)) ui.page='attendance';
      saveLocal(); render();
      toast('Dữ liệu nhân sự đã đồng bộ');
    }catch(e){
      console.warn(e);
      toast(e.message||'Không tải được dữ liệu');
      if(CONFIG.APP_ENV==='production') setTimeout(()=>location.replace('/login/?error=profile'),1200);
    }
  }

  async function supaInsert(table,row){
    if(!sb) return null;
    const {data,error}=await sb.from(table).insert(row).select();
    if(error) throw error;
    return data;
  }
  async function supaUpsert(table,rows,onConflict){
    if(!sb) return null;
    const {data,error}=await sb.from(table).upsert(rows,{onConflict}).select();
    if(error) throw error;
    return data;
  }
  async function authenticatedFetch(path,options={}){
    const {data}=await sb.auth.getSession();
    const token=data?.session?.access_token;
    if(!token) throw new Error('Phiên đăng nhập đã hết hạn');
    const res=await fetch((CONFIG.API_BASE||'/api')+'/'+path,{...options,headers:{'content-type':'application/json','authorization':'Bearer '+token,...(options.headers||{})}});
    const js=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(js.error||'API lỗi');
    return js;
  }

  function unitBy(code){ return state.units.find(u=>u.code===code) || UNIT_SEED.find(u=>u.code===code) || {code, name:code, type:''}; }
  function staffBy(code){ return state.staff.find(s=>s.code===code) || {code, name:code, position:''}; }
  function profileRole(){ return String(currentProfile?.role||'').toUpperCase(); }
  function isAdmin(){ return profileRole()==='ADMIN'; }
  function isManager(){ return ['ADMIN','MANAGER'].includes(profileRole()); }
  function hasPermission(p){ return isAdmin() || (currentProfile?.permissions||[]).includes(p); }
  function canPage(page){ return page==='attendance' ? !!currentProfile : hasPermission(page); }
  function accessibleUnits(){
    if(!currentProfile) return state.units.filter(u=>u.code===ui.unit);
    if(isAdmin() || currentProfile.unit_code==='GROUP_ALL') return state.units;
    const assigned=new Set([currentProfile.unit_code,...(currentProfile.assignments||[]).map(a=>a.unit_code)]);
    return state.units.filter(u=>assigned.has(u.code) || assigned.has(u.parent_code));
  }
  function visiblePages(){ return PAGES.filter(p=>canPage(p[0])); }
  function canManageUnit(code){ return isManager() && accessibleUnits().some(u=>u.code===code); }
  function minsLabel(v){ const m=Math.max(0,Math.round(Number(v)||0)); const h=Math.floor(m/60),r=m%60; return h?`${h} giờ ${r?`${r} phút`:''}`:`${r} phút`; }
  function durationMinutes(start,end){ if(!start) return 0; return Math.max(0,Math.round((new Date(end||Date.now())-new Date(start))/60000)); }
  function toLocalInput(value){ const d=value instanceof Date?value:new Date(value); if(Number.isNaN(d.getTime()))return ''; const z=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`; }

  function isHotelUnit(code){ const u=unitBy(code); return u.type && u.type.includes('HOTEL'); }
  function unitCodes(filter=ui.unit){
    if(filter==='GROUP_ALL') return state.units.map(u=>u.code);
    if(filter==='NHA_GROUP') return state.units.filter(u=>u.code==='NHA_GROUP' || u.parent_code==='NHA_GROUP' || u.type==='RESTAURANT').map(u=>u.code);
    if(filter==='HOTEL_ALL') return state.units.filter(u=>u.code==='HOTEL_ALL' || u.parent_code==='HOTEL_ALL' || u.code.startsWith('HOTEL_')).map(u=>u.code);
    return [filter];
  }
  function inUnit(row, filter=ui.unit){ return unitCodes(filter).includes(row.unit_code); }
  function realUnits(){ return state.units.filter(u => !['GROUP_ALL','NHA_GROUP','HOTEL_ALL'].includes(u.code)); }
  function restaurantUnits(){ return realUnits().filter(u => u.type === 'RESTAURANT'); }
  function hotelUnits(){ return realUnits().filter(u => u.type === 'HOTEL'); }

  function todayInvoices(){ return state.kiotInvoices.filter(x=>x.date===today() && inUnit(x)); }
  function todayItems(){ const ids = new Set(todayInvoices().map(i=>i.id)); return state.kiotInvoiceItems.filter(x=>ids.has(x.invoice_id)); }
  function sum(arr, fn){ return arr.reduce((s,x)=>s+num(fn(x)),0); }
  function grossProfitItems(items){ return sum(items, x => num(x.price)*num(x.qty) - num(x.cost_estimate)); }
  function statusBadge(status){
    const map={new:'red',working:'blue',done:'green',paid:'green',checked_in:'blue',clean:'green',dirty:'red',occupied:'blue',maintenance:'amber',todo:'amber',confirmed:'green',lost:'red',active:'green',probation:'blue',suspended:'amber',left:'red',pending:'amber',approved:'green',rejected:'red',off:'black',leave:'blue',holiday:'blue',work:'green',needs_review:'amber',cancelled:'red'};
    return `<span class="badge ${map[status]||''}">${esc(status||'')}</span>`;
  }

  function estimateStock(){
    const inBy = {};
    state.stockMovements.filter(x=>inUnit(x)).forEach(m=>{
      const k = m.unit_code+'|'+m.ingredient_code;
      inBy[k] = (inBy[k] || 0) + (m.type==='in' ? num(m.qty) : -num(m.qty));
    });
    const recipesByProduct = {};
    state.recipes.forEach(r=>{ (recipesByProduct[r.product_code] ||= []).push(r); });
    const consumption = {};
    state.kiotInvoiceItems.filter(x=>inUnit(x)).forEach(item=>{
      (recipesByProduct[item.product_code] || []).forEach(r=>{
        const k = item.unit_code+'|'+r.ingredient_code;
        consumption[k] = (consumption[k] || 0) + num(item.qty)*num(r.qty);
      });
    });
    const rows = [];
    const keys = new Set([...Object.keys(inBy), ...Object.keys(consumption)]);
    keys.forEach(k=>{
      const [unit_code, ingredient_code] = k.split('|');
      const ing = state.ingredients.find(i=>i.code===ingredient_code) || {code:ingredient_code,name:ingredient_code,unit:'',min_level:0};
      const onHand = num(inBy[k]) - num(consumption[k]);
      rows.push({unit_code, ingredient_code, name:ing.name, unit:ing.unit, min_level:num(ing.min_level), onHand, consumed:num(consumption[k]), stockIn:num(inBy[k])});
    });
    return rows.sort((a,b)=>a.onHand-b.onHand);
  }

  function classifyMessage(text){
    const t = String(text||'').toLowerCase();
    if(/khiếu|phàn nàn|tệ|dở|chậm|bực|complain/.test(t)) return {intent:'Khiếu nại', priority:'high', next:'Xin lỗi khách, xin bill/thời gian/cơ sở và chuyển quản lý xử lý ngay.'};
    if(/phòng|hotel|khách sạn|check ?in|nghỉ|resort/.test(t)) return {intent:'Đặt phòng Hotel', priority:'medium', next:'Hỏi ngày nhận/trả phòng, số người, loại phòng, ngân sách.'};
    if(/karaoke|vip|sinh nhật|tiệc|party|bàn|đặt/.test(t)) return {intent:'Đặt bàn/tiệc/Karaoke', priority:'high', next:'Hỏi ngày giờ đến, số khách, khu vực mong muốn, ngân sách/người.'};
    if(/giá|menu|món|combo|beer|bia/.test(t)) return {intent:'Hỏi giá/Menu', priority:'medium', next:'Gửi menu ngắn, hỏi số khách và thời gian đến để giữ bàn.'};
    return {intent:'Khách hỏi chung', priority:'normal', next:'Chào khách, hỏi nhu cầu chính: đặt bàn, đặt tiệc, karaoke hay đặt phòng.'};
  }
  function aiReplyFor(text, unitCode){
    const c = classifyMessage(text);
    const unit = unitBy(unitCode);
    if(c.intent==='Đặt bàn/tiệc/Karaoke') return `Dạ em chào anh/chị. ${unit.name} có hỗ trợ đặt bàn, tiệc sinh nhật và phòng VIP Karaoke. Anh/chị cho em xin ngày giờ đến, số lượng khách và muốn ngồi sân vườn hay phòng riêng để em kiểm tra chỗ phù hợp ạ.`;
    if(c.intent==='Đặt phòng Hotel') return `Dạ em chào anh/chị. Anh/chị cho em xin ngày nhận phòng, ngày trả phòng, số lượng người và loại phòng mong muốn để em kiểm tra phòng trống ạ.`;
    if(c.intent==='Khiếu nại') return `Dạ em rất xin lỗi vì trải nghiệm chưa tốt. Anh/chị cho em xin thời gian sử dụng dịch vụ và nội dung cụ thể, quản lý sẽ kiểm tra và phản hồi ngay ạ.`;
    if(c.intent==='Hỏi giá/Menu') return `Dạ bên em có nhiều món/combos tuỳ số lượng khách. Anh/chị đi khoảng bao nhiêu người và muốn dùng bữa, nhậu nhẹ hay đặt tiệc để em tư vấn menu phù hợp ạ.`;
    return `Dạ em chào anh/chị. Anh/chị đang cần đặt bàn, đặt tiệc, phòng VIP Karaoke hay đặt phòng khách sạn ạ? Em sẽ tư vấn nhanh cho mình.`;
  }

  function buildGroupNotice(msg){
    const c = classifyMessage(msg.text);
    return `💬 KHÁCH F&B/HOTEL MỚI\nKhách: ${maskPhone(msg.customer_name || 'Khách inbox')}\nNhu cầu: ${c.intent}\nCơ sở: ${unitBy(msg.unit_code).name}\nƯu tiên: ${c.priority}\nNội dung: ${maskPhone(msg.text)}\nAI đã tư vấn: ${c.next}\nTrạng thái: Cần nhân sự xác nhận. Không public số điện thoại trong nhóm.`;
  }

  function employeeSession(){
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}'); } catch(_){ return {}; }
  }

  async function logoutEmployee(){
    try {
      if(sb) await sb.auth.signOut();
    } catch(_) {}
    localStorage.removeItem(SESSION_KEY);
    location.replace('/login/');
  }

  function render(){
    const pages=visiblePages();
    if(!pages.some(p=>p[0]===ui.page)) ui.page=pages[0]?.[0]||'attendance';
    const page=pages.find(p=>p[0]===ui.page)||PAGES.find(p=>p[0]==='attendance');
    const employee=currentProfile||employeeSession();
    const selectable=accessibleUnits();
    clearInterval(sessionTimer);
    root.innerHTML=`
      <div class="app">
        <aside class="sidebar ${ui.mobile?'open':''}">
          <div class="brand"><img src="logo.png" alt="FriendZones"><div><h1>FriendZones<br>Nhân viên</h1><p>F&B + Hotel Operations</p></div></div>
          <nav class="nav">${pages.map(p=>`<button class="${ui.page===p[0]?'active':''}" data-action="nav" data-page="${p[0]}"><span>${p[1]}</span><span>${p[2]}</span></button>`).join('')}</nav>
          <div class="sidefoot">Vận hành production v2.5.0<br>Chấm công theo giờ thực tế · GPS cơ sở · Không tự checkout.<br><span class="code">${sb?'Supabase/RLS':'Chưa cấu hình Supabase'}</span></div>
        </aside>
        <main class="main">
          <div class="topbar">
            <div class="title"><h2>${page[1]} ${page[2]}</h2><p>${subtitle()}</p></div>
            <div class="toolbar">
              <button class="btn mobile-toggle" data-action="toggle-menu">☰ Menu</button>
              ${selectable.length>1?`<select class="pill" data-action="unit-select">${selectable.map(u=>`<option value="${u.code}" ${ui.unit===u.code?'selected':''}>${esc(u.name)}</option>`).join('')}</select>`:`<span class="pill">📍 ${esc(unitBy(ui.unit).name)}</span>`}
              <span class="pill">👤 ${esc(employee.name||employee.displayName||employee.identity||'Nhân viên')}</span>
              <span class="pill">${new Date().toLocaleDateString('vi-VN')}</span>
              <a class="btn" href="/">Website</a>
              ${CONFIG.APP_ENV!=='production'?'<button class="btn" data-action="save-demo">Lưu demo</button>':''}
              <button class="btn dark" data-action="logout">Đăng xuất</button>
            </div>
          </div>
          ${renderPage()}
        </main>
      </div>`;
    sessionTimer=setInterval(()=>{ const el=document.querySelector('[data-live-duration]'); if(el){ const start=el.dataset.liveDuration; el.textContent=minsLabel(durationMinutes(start)); } },30000);
  }

  function subtitle(){
    const map = {
      dashboard:'Bức tranh vận hành theo cơ sở: doanh thu, khách hàng, nhân sự, kho, hotel.',
      attendance:'Ghi nhận giờ làm thực tế tại đúng cơ sở bằng GPS; không tự checkout.',
      finance:'Quỹ từng cơ sở, thu chi nội bộ, kết ca, lệch tiền so với KiotViet.',
      customers:'Tin nhắn Page, AI tư vấn, phân loại nhu cầu và thông báo nhóm không lộ SĐT.',
      hr:'Tài khoản nhân sự, phân công cơ sở, lịch giờ làm, nghỉ phép và duyệt điều chỉnh.',
      kiot:'Doanh thu KiotViet, phân tích món, tồn kho ước lượng theo định lượng.',
      hotel:'Phòng, booking, housekeeping, sự cố phòng và liên kết doanh thu nhà hàng.',
      settings:'Thiết lập GPS cơ sở, bán kính chấm công và kết nối hệ thống.'
    };
    return map[ui.page] || '';
  }
  function renderPage(){
    return ({dashboard:renderDashboard, attendance:renderAttendance, finance:renderFinance, customers:renderCustomers, hr:renderHR, kiot:renderKiot, hotel:renderHotel, settings:renderSettings}[ui.page] || renderDashboard)();
  }

  function renderDashboard(){
    const inv = todayInvoices(); const items = todayItems();
    const revenue = sum(inv, x=>x.total); const bills = inv.length;
    const gp = grossProfitItems(items);
    const att = state.attendanceRecords.filter(x=>inUnit(x) && x.check_in_at && !x.check_out_at && x.status==='working').length;
    const newMsgs = state.pageMessages.filter(x=>inUnit(x) && x.status==='new').length;
    const stockAlerts = estimateStock().filter(x=>x.onHand < x.min_level).length;
    const rooms = state.hotelRooms.filter(x=>inUnit(x)); const occ = rooms.filter(r=>r.status==='occupied').length;
    const occupancy = rooms.length ? Math.round(occ/rooms.length*100) : 0;
    const topItems = Object.values(items.reduce((m,x)=>{ const k=x.product_code; m[k] ||= {name:x.product_name, qty:0, revenue:0, cost:0}; m[k].qty += num(x.qty); m[k].revenue += num(x.qty)*num(x.price); m[k].cost += num(x.cost_estimate); return m; },{})).sort((a,b)=>b.revenue-a.revenue).slice(0,6);
    const cash = sum(inv, x=>x.cash); const bank=sum(inv,x=>x.bank);
    return `
      <div class="grid cols-4">
        ${stat('Doanh thu hôm nay', money(revenue), `${bills} bill · Tiền mặt ${money(cash)} · CK ${money(bank)}`)}
        ${stat('Lợi nhuận gộp ước tính', money(gp), 'Tính theo cost/định lượng món', gp>=0?'profit-pos':'profit-neg')}
        ${stat('Nhân sự đang làm', att+' người', 'Tất cả phiên đang mở, kể cả ngày trước')}
        ${stat('Khách Page mới', newMsgs+' tin', 'Cần xác nhận / nhận tư vấn')}
      </div>
      <div class="grid cols-4" style="margin-top:14px">
        ${stat('Cảnh báo tồn kho', stockAlerts+' mục', 'Thấp hơn mức tối thiểu')}
        ${stat('Công suất hotel', occupancy+'%', `${occ}/${rooms.length || 0} phòng đang có khách`)}
        ${stat('Cơ sở đang xem', unitBy(ui.unit).name, ui.unit)}
        ${stat('Nguồn dữ liệu', sb?'Supabase online':'Demo/localStorage', sb?'Đã có config Supabase':'Chưa cấu hình Supabase')}
      </div>
      <div class="split" style="margin-top:16px">
        <div class="card">
          <div class="section-title"><h3>Món / dịch vụ đang kéo doanh thu</h3><button class="btn small" data-action="nav" data-page="kiot">Xem kho</button></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>Món/Dịch vụ</th><th>SL</th><th>Doanh thu</th><th>Lãi gộp ước tính</th></tr></thead><tbody>
            ${topItems.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${x.qty}</td><td>${money(x.revenue)}</td><td class="${x.revenue-x.cost>=0?'profit-pos':'profit-neg'}">${money(x.revenue-x.cost)}</td></tr>`).join('') || `<tr><td colspan="4" class="muted">Chưa có dữ liệu</td></tr>`}
          </tbody></table></div>
        </div>
        <div class="card">
          <div class="section-title"><h3>Cảnh báo vận hành</h3><button class="btn small" data-action="nav" data-page="customers">Xử lý khách</button></div>
          <div class="timeline">
            ${newMsgs ? `<div class="event"><b>💬 ${newMsgs} tin nhắn Page chưa xử lý</b><span class="muted">Nên phản hồi trong 5 phút đầu để giữ khách.</span></div>` : `<div class="event"><b>✅ Page ổn</b><span class="muted">Không có tin mới đang chờ.</span></div>`}
            ${stockAlerts ? `<div class="event"><b>📦 ${stockAlerts} nguyên liệu dưới ngưỡng</b><span class="muted">Kiểm tra trước ca tối / cuối tuần.</span></div>` : `<div class="event"><b>✅ Kho chưa có cảnh báo lớn</b><span class="muted">Vẫn cần kiểm thực tế cuối ngày.</span></div>`}
            ${state.cashClosings.filter(x=>x.date===today() && inUnit(x)).length ? `<div class="event"><b>💰 Đã có kết ca hôm nay</b><span class="muted">Xem Kế toán nội bộ để đối soát lệch tiền.</span></div>` : `<div class="event"><b>⚠️ Chưa kết ca</b><span class="muted">Cuối ngày quản lý cần chốt tiền mặt/CK/bill hủy.</span></div>`}
          </div>
        </div>
      </div>`;
  }
  function stat(k,v,s,cls=''){ return `<div class="card stat"><div class="k">${esc(k)}</div><div class="v ${cls}">${esc(v)}</div><div class="s">${esc(s||'')}</div></div>`; }

  function renderAttendance(){
    if(!currentProfile) return `<div class="card"><h3>Đang xác minh hồ sơ nhân sự…</h3><p class="muted">Hệ thống chỉ cho phép chấm công đúng tài khoản đã liên kết.</p></div>`;
    const records=state.attendanceRecords.filter(r=>r.staff_code===currentProfile.code).sort((a,b)=>String(b.check_in_at).localeCompare(String(a.check_in_at))).slice(0,60);
    const open=records.find(r=>!r.check_out_at&&r.status==='working');
    const todayRows=records.filter(r=>r.work_date===today());
    const closedMinutes=sum(todayRows.filter(r=>r.check_out_at),r=>durationMinutes(r.check_in_at,r.check_out_at));
    const liveMinutes=closedMinutes+(open&&open.work_date===today()?durationMinutes(open.check_in_at):0);
    const schedule=state.workSchedules.find(x=>x.staff_code===currentProfile.code&&x.work_date===today());
    const expected=schedule ? Number(schedule.expected_minutes||0) : Number(currentProfile.expected_daily_minutes||0);
    const diff=liveMinutes-expected;
    const myLeaves=state.leaveRequests.filter(x=>x.staff_code===currentProfile.code).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,8);
    const myAdj=state.attendanceAdjustments.filter(x=>x.staff_code===currentProfile.code).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,8);
    const managerRecords=isManager()?state.attendanceDaily.filter(x=>inUnit(x)).sort((a,b)=>String(b.work_date).localeCompare(String(a.work_date))).slice(0,100):[];
    return `
      <div class="grid cols-4">
        ${stat('Giờ đã làm hôm nay',minsLabel(liveMinutes),open?(open.work_date===today()?'Đang tiếp tục tính thời gian':'Có phiên ngày trước đang mở; chưa cộng vào hôm nay'):'Tổng các lần vào/ra đã hoàn tất')}
        ${stat('Giờ dự kiến',minsLabel(expected),schedule?`Lịch: ${schedule.day_status}`:'Theo hồ sơ nhân sự')}
        ${stat(diff>=0?'Vượt giờ dự kiến':'Còn thiếu',minsLabel(Math.abs(diff)),diff>=0?'Tính theo giờ thực tế':'Chưa đủ thời lượng dự kiến',diff>=0?'profit-pos':'profit-neg')}
        ${stat('Trạng thái',open?'Đang làm việc':'Chưa có phiên mở',open?unitBy(open.unit_code).name:'Không tự động checkout')}
      </div>
      <div class="split" style="margin-top:14px">
        <div class="card attendance-action">
          <div class="section-title"><h3>Chấm công của tôi</h3><span class="badge ${open?'green':'black'}">${open?'ĐANG LÀM':'SẴN SÀNG'}</span></div>
          <div class="employee-card"><b>${esc(currentProfile.name)}</b><span>${esc(currentProfile.code)} · ${esc(currentProfile.position||'Nhân sự')}</span></div>
          ${open?`<div class="open-session"><span>Bắt đầu${open.work_date!==today()?' · PHIÊN TỪ NGÀY '+esc(open.work_date):''}</span><b>${fmtTime(open.check_in_at)}</b><span>Thời gian đang làm</span><strong data-live-duration="${esc(open.check_in_at)}">${minsLabel(durationMinutes(open.check_in_at))}</strong><small>${esc(unitBy(open.unit_code).name)}</small></div>`:''}
          <div class="geo-status ${lastGeo?.ok?'okbox':''}">
            <b>📍 ${lastGeo?.unit_name?esc(lastGeo.unit_name):'Chưa xác định cơ sở gần nhất'}</b>
            <span>${lastGeo?.distance_m!=null?`Cách điểm chấm công khoảng ${Math.round(lastGeo.distance_m)} m · GPS ±${Math.round(lastGeo.accuracy||0)} m`:'Bấm “Kiểm tra vị trí” hoặc chấm công để hệ thống nhận diện cơ sở.'}</span>
          </div>
          <div class="row" style="margin-top:12px">
            <button class="btn" data-action="locate" ${busyAction?'disabled':''}>Kiểm tra vị trí</button>
            <button class="btn primary grow" data-action="checkin" ${open||busyAction||currentProfile.work_mode==='no_attendance'?'disabled':''}>${busyAction==='checkin'?'Đang ghi nhận…':'Check-in'}</button>
            <button class="btn dark grow" data-action="checkout" ${!open||busyAction?'disabled':''}>${busyAction==='checkout'?'Đang ghi nhận…':'Check-out'}</button>
          </div>
          <div class="notice" style="margin-top:12px"><b>Không tự checkout.</b> Phiên làm việc vẫn mở cho đến khi anh/chị bấm Check-out. Nếu quên, gửi yêu cầu điều chỉnh để quản lý duyệt; hệ thống không tự đặt giờ ra.</div>
        </div>
        <div class="card">
          <h3>Xin nghỉ / điều chỉnh giờ</h3>
          <form id="leaveForm" class="grid cols-2 compact-form">
            <div class="field"><label>Từ ngày</label><input name="start_date" type="date" value="${today()}" required></div>
            <div class="field"><label>Đến ngày</label><input name="end_date" type="date" value="${today()}" required></div>
            <div class="field"><label>Loại nghỉ</label><select name="leave_type"><option value="personal">Việc riêng</option><option value="annual">Phép năm</option><option value="sick">Nghỉ bệnh</option><option value="unpaid">Không lương</option><option value="other">Khác</option></select></div>
            <div class="field"><label>Lý do</label><input name="reason" required></div>
            <div><button class="btn soft">Gửi đơn nghỉ</button></div>
          </form>
          <hr class="sep">
          <form id="adjustmentForm" class="grid cols-2 compact-form">
            <div class="field"><label>Ngày cần sửa</label><input name="work_date" type="date" value="${today()}" required></div>
            <div class="field"><label>Phiên đã ghi nhận</label><select name="attendance_id"><option value="">Tạo bổ sung / không chọn</option>${records.slice(0,20).map(r=>`<option value="${r.id}">${r.work_date} · ${new Date(r.check_in_at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</option>`).join('')}</select></div>
            <div class="field"><label>Giờ vào đề nghị</label><input name="requested_check_in_at" type="datetime-local" required></div>
            <div class="field"><label>Giờ ra đề nghị</label><input name="requested_check_out_at" type="datetime-local"></div>
            <div class="field" style="grid-column:1/-1"><label>Lý do điều chỉnh</label><input name="reason" placeholder="Quên checkout / mất GPS / quản lý xác nhận…" required></div>
            <div><button class="btn soft">Gửi điều chỉnh</button></div>
          </form>
        </div>
      </div>
      <div class="section-title"><h3>Lịch sử giờ làm của tôi</h3><span class="muted">Có thể có nhiều phiên trong một ngày</span></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Ngày</th><th>Cơ sở</th><th>Vào</th><th>Ra</th><th>Thời lượng</th><th>GPS</th><th>Trạng thái</th></tr></thead><tbody>
        ${records.map(r=>`<tr><td>${esc(r.work_date)}</td><td>${esc(unitBy(r.unit_code).name)}</td><td>${fmtTime(r.check_in_at)}</td><td>${fmtTime(r.check_out_at)}</td><td><b>${r.check_out_at?minsLabel(durationMinutes(r.check_in_at,r.check_out_at)):'Đang tính'}</b></td><td>${r.check_in_distance_m!=null?`${Math.round(r.check_in_distance_m)} m`:'—'}</td><td>${statusBadge(r.status)} ${r.schedule_exception?'<span class="badge amber">Khác lịch</span>':''}</td></tr>`).join('')||'<tr><td colspan="7" class="muted">Chưa có dữ liệu chấm công.</td></tr>'}
      </tbody></table></div>
      <div class="grid cols-2" style="margin-top:14px">
        <div class="card"><h3>Đơn nghỉ gần đây</h3>${myLeaves.map(x=>`<div class="event"><b>${x.start_date} → ${x.end_date}</b><span>${esc(x.leave_type)} · ${statusBadge(x.status)}</span><small>${esc(x.reason||'')}</small>${x.status==='pending'?`<button class="btn small" data-action="cancel-leave" data-id="${x.id}">Hủy đơn</button>`:''}</div>`).join('')||'<p class="muted">Chưa có đơn nghỉ.</p>'}</div>
        <div class="card"><h3>Yêu cầu điều chỉnh</h3>${myAdj.map(x=>`<div class="event"><b>${x.work_date}</b><span>${statusBadge(x.status)}</span><small>${esc(x.reason)}</small>${x.status==='pending'?`<button class="btn small" data-action="cancel-adjustment" data-id="${x.id}">Hủy yêu cầu</button>`:''}</div>`).join('')||'<p class="muted">Chưa có yêu cầu.</p>'}</div>
      </div>
      ${isManager()?`<div class="section-title"><h3>Theo dõi đủ/thiếu giờ tại cơ sở</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Ngày</th><th>Nhân sự</th><th>Cơ sở</th><th>Dự kiến</th><th>Thực tế</th><th>Thiếu</th><th>Tăng thêm</th><th>Đi trễ</th><th>Về sớm</th><th>Cảnh báo</th></tr></thead><tbody>${managerRecords.map(r=>`<tr><td>${r.work_date}</td><td><b>${esc(r.staff_name)}</b></td><td>${esc(r.unit_name||r.unit_code)}</td><td>${minsLabel(r.expected_minutes)}</td><td>${minsLabel(r.actual_minutes)}</td><td class="${r.missing_minutes>0?'danger-text':''}">${minsLabel(r.missing_minutes)}</td><td>${minsLabel(r.overtime_minutes)}</td><td class="${num(r.late_minutes)>0?'danger-text':''}">${minsLabel(r.late_minutes)}</td><td class="${num(r.early_leave_minutes)>0?'danger-text':''}">${minsLabel(r.early_leave_minutes)}</td><td>${r.has_open_session?'<span class="badge amber">Chưa checkout</span>':statusBadge(r.day_status)} ${r.has_schedule_exception?'<span class="badge amber">Khác lịch/cơ sở</span>':''}</td></tr>`).join('')||'<tr><td colspan="10" class="muted">Chưa có báo cáo.</td></tr>'}</tbody></table></div>`:''}`;
  }

  function fmtTime(v){ if(!v) return '—'; try{return new Date(v).toLocaleString('vi-VN');}catch(e){return v;} }

  function renderFinance(){
    const inv = todayInvoices(); const kvCash=sum(inv,x=>x.cash), kvBank=sum(inv,x=>x.bank), kvTotal=sum(inv,x=>x.total);
    const expenses = state.financeTransactions.filter(x=>x.type==='expense' && x.date===today() && inUnit(x));
    const closings = state.cashClosings.filter(x=>inUnit(x)).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,50);
    const txns = state.financeTransactions.filter(x=>inUnit(x)).sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,80);
    return `
      <div class="grid cols-4">
        ${stat('Doanh thu Kiot hôm nay', money(kvTotal), `${inv.length} bill`)}
        ${stat('Tiền mặt theo Kiot', money(kvCash), 'Để đối soát két')}
        ${stat('Chuyển khoản theo Kiot', money(kvBank), 'Đối soát sao kê')}
        ${stat('Chi nội bộ hôm nay', money(sum(expenses,x=>x.amount)), `${expenses.length} phiếu chi`)}
      </div>
      <div class="split" style="margin-top:14px">
        <div class="card"><h3>Thêm phiếu thu/chi nội bộ</h3>
          <form id="financeForm" class="grid cols-2">
            ${unitSelectField('unit_code','Cơ sở', realUnits().map(u=>u.code))}
            <div class="field"><label>Ngày</label><input name="date" type="date" value="${today()}"></div>
            <div class="field"><label>Loại</label><select name="type"><option value="expense">Chi</option><option value="income">Thu</option><option value="transfer">Chuyển quỹ</option></select></div>
            <div class="field"><label>Tài khoản</label><input name="account" placeholder="TM_NHA_SAIGONPHO"></div>
            <div class="field"><label>Danh mục</label><input name="category" placeholder="Mua hàng bếp / Sửa chữa / Tạm ứng"></div>
            <div class="field"><label>Số tiền</label><input name="amount" type="number" min="0" step="1000"></div>
            <div class="field" style="grid-column:1/-1"><label>Ghi chú</label><textarea name="note"></textarea></div>
            <div><button class="btn primary">Lưu phiếu</button></div>
          </form>
        </div>
        <div class="card"><h3>Kết ca / Đối soát tiền</h3>
          <form id="cashCloseForm" class="grid cols-2">
            ${unitSelectField('unit_code','Cơ sở', realUnits().map(u=>u.code))}
            <div class="field"><label>Ngày</label><input name="date" type="date" value="${today()}"></div>
            <div class="field"><label>Tiền mặt Kiot</label><input name="kiot_cash" type="number" value="${kvCash}"></div>
            <div class="field"><label>Tiền mặt thực tế</label><input name="actual_cash" type="number" placeholder="Nhập tiền đếm thực tế"></div>
            <div class="field"><label>CK Kiot</label><input name="kiot_bank" type="number" value="${kvBank}"></div>
            <div class="field"><label>CK sao kê</label><input name="actual_bank" type="number" placeholder="Nhập CK đối soát"></div>
            <div class="field" style="grid-column:1/-1"><label>Giải trình lệch / bill hủy / giảm giá</label><textarea name="note"></textarea></div>
            <div><button class="btn dark">Chốt kết ca</button></div>
          </form>
        </div>
      </div>
      <div class="section-title"><h3>Phiếu thu/chi</h3></div>${tableFinance(txns)}
      <div class="section-title"><h3>Lịch sử kết ca</h3></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Ngày</th><th>Cơ sở</th><th>Lệch TM</th><th>Lệch CK</th><th>Ghi chú</th></tr></thead><tbody>
      ${closings.map(c=>`<tr><td>${esc(c.date)}</td><td>${esc(unitBy(c.unit_code).name)}</td><td class="${num(c.cash_diff)===0?'':'danger-text'}">${money(c.cash_diff)}</td><td class="${num(c.bank_diff)===0?'':'danger-text'}">${money(c.bank_diff)}</td><td>${esc(c.note)}</td></tr>`).join('') || `<tr><td colspan="5" class="muted">Chưa có kết ca</td></tr>`}
      </tbody></table></div>`;
  }
  function tableFinance(rows){
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Ngày</th><th>Cơ sở</th><th>Loại</th><th>Tài khoản</th><th>Danh mục</th><th>Số tiền</th><th>Ghi chú</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(unitBy(t.unit_code).name)}</td><td>${statusBadge(t.type)}</td><td><span class="code">${esc(t.account)}</span></td><td>${esc(t.category)}</td><td>${money(t.amount)}</td><td>${esc(t.note)}</td></tr>`).join('') || `<tr><td colspan="7" class="muted">Chưa có phiếu</td></tr>`}</tbody></table></div>`;
  }

  function renderCustomers(){
    const msgs = state.pageMessages.filter(x=>inUnit(x)).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
    const leads = state.customerLeads.filter(x=>inUnit(x));
    const first = msgs[0];
    return `
      <div class="tabs"><button class="${ui.customerTab==='inbox'?'active':''}" data-action="customer-tab" data-tab="inbox">Inbox Page</button><button class="${ui.customerTab==='leads'?'active':''}" data-action="customer-tab" data-tab="leads">Lead/Booking</button><button class="${ui.customerTab==='simulate'?'active':''}" data-action="customer-tab" data-tab="simulate">Test AI</button></div>
      ${ui.customerTab==='leads' ? renderLeads(leads) : ui.customerTab==='simulate' ? renderCustomerSim() : renderInbox(msgs, first)}`;
  }
  function renderInbox(msgs, first){
    return `<div class="split"><div class="card"><div class="section-title"><h3>Tin nhắn Page</h3><button class="btn small" data-action="mark-all-read">Đánh dấu đã xử lý</button></div>
    <div class="timeline">${msgs.map(m=>{ const c=classifyMessage(m.text); return `<div class="event"><b>${esc(m.customer_name||'Khách inbox')} · ${statusBadge(m.status)}</b><div class="muted">${esc(unitBy(m.unit_code).name)} · ${new Date(m.created_at).toLocaleString('vi-VN')}</div><p>${esc(maskPhone(m.text))}</p><span class="badge ${c.priority==='high'?'red':c.priority==='medium'?'amber':'blue'}">${esc(c.intent)}</span> <button class="btn small soft" data-action="notify-message" data-id="${m.id}">Đẩy nhóm</button></div>`}).join('') || '<div class="muted">Chưa có inbox</div>'}</div></div>
    <div class="card"><h3>Preview thông báo nhóm</h3>${first?`<div class="pre">${esc(buildGroupNotice(first))}</div><p class="muted">Số điện thoại đã được ẩn trước khi đưa lên nhóm.</p>`:'<div class="muted">Chưa có tin nhắn.</div>'}</div></div>`;
  }
  function renderLeads(leads){
    return `<div class="card"><div class="section-title"><h3>Lead / Booking từ Page</h3><button class="btn small" data-action="nav" data-page="hotel">Xem Hotel</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Khách</th><th>Nhu cầu</th><th>Cơ sở</th><th>Nguồn</th><th>Trạng thái</th><th>Ghi chú AI</th></tr></thead><tbody>
    ${leads.map(l=>`<tr><td><b>${esc(l.customer_name)}</b></td><td>${esc(l.need)}</td><td>${esc(unitBy(l.unit_code).name)}</td><td>${esc(l.source)}</td><td>${statusBadge(l.status)}</td><td>${esc(l.note)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Chưa có lead</td></tr>'}
    </tbody></table></div></div>`;
  }
  function renderCustomerSim(){
    return `<div class="split"><div class="card"><h3>Test AI tư vấn Page</h3><form id="messageForm" class="grid cols-2">
      ${unitSelectField('unit_code','Cơ sở', realUnits().map(u=>u.code))}
      <div class="field"><label>Tên khách</label><input name="customer_name" value="Khách inbox"></div>
      <div class="field" style="grid-column:1/-1"><label>Nội dung khách nhắn</label><textarea name="text">Tối mai đặt tiệc sinh nhật 15 người, có phòng karaoke không? 0909123456</textarea></div>
      <div><button class="btn primary">Tạo inbox + AI tư vấn</button></div>
    </form></div><div class="card"><h3>Quy tắc bảo mật</h3><div class="notice">Tin nhắn có số điện thoại vẫn lưu trong CRM, nhưng thông báo nhóm chỉ hiển thị nội dung đã che số. AI không được public SĐT lên group.</div></div></div>`;
  }

  function renderHR(){
    if(!hasPermission('hr')) return `<div class="fatal"><h2>Không có quyền Nhân sự</h2></div>`;
    const scopeUnits=new Set(unitCodes());
    const assignedStaff=new Set(state.staffAssignments.filter(x=>x.active!==false&&scopeUnits.has(x.unit_code)).map(x=>x.staff_code));
    const staff=state.staff.filter(s=>ui.unit==='GROUP_ALL'||scopeUnits.has(s.unit_code)||assignedStaff.has(s.code));
    const pendingLeaves=state.leaveRequests.filter(x=>x.status==='pending'&&inUnit(x));
    const pendingAdj=state.attendanceAdjustments.filter(x=>x.status==='pending'&&inUnit(x));
    const month=today().slice(0,7)+'-01';
    const reports=state.attendanceMonthly.filter(x=>x.month===month&&inUnit(x));
    const unitOptions=realUnits().filter(u=>accessibleUnits().some(a=>a.code===u.code));
    const profileUnitOptions=accessibleUnits().filter(u=>u.active!==false);
    const profileStaff=staff.filter(s=>canManageUnit(s.unit_code));
    const manageableStaffCodes=new Set(profileStaff.map(s=>s.code));
    const activeExtraAssignments=state.staffAssignments.filter(a=>a.active!==false&&!a.is_primary&&manageableStaffCodes.has(a.staff_code)&&accessibleUnits().some(u=>u.code===a.unit_code));
    const editStaff=profileStaff[0]||{};
    return `
      <div class="grid cols-4">
        ${stat('Nhân sự đang hoạt động',staff.filter(s=>s.active&&['active','probation'].includes(s.employee_status||'active')).length+' người','Theo phạm vi được phân quyền')}
        ${stat('Đơn nghỉ chờ duyệt',pendingLeaves.length+' đơn','Cần quản lý xử lý')}
        ${stat('Điều chỉnh chờ duyệt',pendingAdj.length+' yêu cầu','Không tự sửa giờ chấm công')}
        ${stat('Phiên chưa checkout',state.attendanceRecords.filter(r=>inUnit(r)&&!r.check_out_at&&r.status==='working').length+' phiên','Cần nhân sự checkout hoặc gửi điều chỉnh')}
      </div>
      <div class="split" style="margin-top:14px">
        <div class="card"><h3>Tạo tài khoản nhân sự</h3><form id="staffInviteForm" class="grid cols-2">
          ${unitSelectField('unit_code','Cơ sở chính',unitOptions.map(u=>u.code))}
          <div class="field"><label>Vai trò</label><select name="role"><option value="STAFF">Nhân viên</option><option value="MANAGER">Quản lý</option>${isAdmin()?'<option value="ADMIN">Admin</option>':''}</select></div>
          <div class="field"><label>Họ tên</label><input name="name" required></div>
          <div class="field"><label>Email đăng nhập</label><input name="email" type="email" required></div>
          <div class="field"><label>Số điện thoại</label><input name="phone"></div>
          <div class="field"><label>Ngày vào làm</label><input name="joined_on" type="date" value="${today()}"></div>
          <div class="field"><label>Chức danh</label><input name="position" placeholder="Phục vụ / Bếp / Thu ngân / Lễ tân"></div>
          <div class="field"><label>Bộ phận</label><input name="department"></div>
          <div class="field"><label>Hình thức</label><select name="work_mode"><option value="hourly">Chấm công theo giờ</option><option value="no_attendance">Không chấm công</option></select></div>
          <div class="field"><label>Giờ dự kiến/ngày</label><input name="expected_hours" type="number" min="0" max="24" step="0.25" value="8"></div>
          <div class="field"><label>Lương cơ bản</label><input name="base_salary" type="number" min="0"></div>
          <div class="field"><label>Đơn giá giờ</label><input name="hourly_rate" type="number" min="0"></div>
          <div class="field" style="grid-column:1/-1"><label>Quyền</label><input name="permissions" value="attendance" placeholder="attendance,customers,finance"></div>
          <div><button class="btn primary">Tạo & gửi email mời</button></div>
        </form><p class="muted">Mỗi tài khoản Supabase Auth liên kết duy nhất với một mã nhân viên. Nhân viên không thể chọn tên người khác để chấm công.</p></div>
        <div class="card"><h3>Lập giờ làm dự kiến</h3><form id="scheduleForm" class="grid cols-2">
          <div class="field" style="grid-column:1/-1"><label>Nhân sự</label><select name="staff_code">${staff.filter(s=>s.work_mode!=='no_attendance').map(s=>`<option value="${s.code}">${s.code} · ${esc(s.name)}</option>`).join('')}</select></div>
          ${unitSelectField('unit_code','Cơ sở làm việc',unitOptions.map(u=>u.code))}
          <div class="field"><label>Trạng thái ngày</label><select name="day_status"><option value="work">Làm việc</option><option value="off">OFF</option><option value="holiday">Ngày lễ</option><option value="leave">Nghỉ đã duyệt</option></select></div>
          <div class="field"><label>Từ ngày</label><input name="date_from" type="date" value="${today()}" required></div>
          <div class="field"><label>Đến ngày</label><input name="date_to" type="date" value="${today()}" required></div>
          <div class="field"><label>Số giờ dự kiến/ngày</label><input name="expected_hours" type="number" min="0" max="24" step="0.25" value="8"></div>
          <div class="field"><label>Giờ bắt đầu dự kiến (tính đi trễ)</label><input name="planned_start" type="time"></div>
          <div class="field"><label>Giờ kết thúc dự kiến (tính về sớm)</label><input name="planned_end" type="time"></div>
          <div class="field"><label>Ghi chú</label><input name="note"></div>
          <div><button class="btn dark">Lưu lịch (tối đa 31 ngày)</button></div>
        </form><div class="notice" style="margin-top:12px">Số giờ dự kiến dùng để tính đủ/thiếu. Giờ bắt đầu/kết thúc là tùy chọn để tính đi trễ/về sớm; hệ thống vẫn cộng thời gian vào–ra thực tế, không khóa theo ca và không tự checkout.</div></div>
      </div>
      <div class="split" style="margin-top:14px">
        <div class="card"><h3>Phân công thêm cơ sở</h3><form id="assignmentForm" class="grid cols-2"><div class="field"><label>Nhân sự</label><select name="staff_code">${profileStaff.map(s=>`<option value="${s.code}">${s.code} · ${esc(s.name)}</option>`).join('')}</select></div>${unitSelectField('unit_code','Cơ sở bổ sung',unitOptions.map(u=>u.code))}<div class="field"><label>Hiệu lực từ</label><input name="effective_from" type="date" value="${today()}"></div><div class="field"><label>Đến ngày</label><input name="effective_to" type="date"></div><div><button class="btn">Phân công</button></div></form></div>
        <div class="card"><h3>Cập nhật hồ sơ nhân sự</h3><form id="staffUpdateForm" class="grid cols-2">
          <div class="field" style="grid-column:1/-1"><label>Nhân sự</label><select name="code" data-action="staff-edit-select">${profileStaff.map(s=>`<option value="${s.code}">${s.code} · ${esc(s.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Họ tên</label><input name="name" value="${esc(editStaff.name||'')}"></div>
          <div class="field"><label>Số điện thoại</label><input name="phone" value="${esc(editStaff.phone||'')}"></div>
          <div class="field"><label>Cơ sở chính</label><select name="unit_code">${profileUnitOptions.map(u=>`<option value="${u.code}" ${editStaff.unit_code===u.code?'selected':''}>${u.code} · ${esc(u.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Vai trò</label><select name="role"><option value="STAFF" ${String(editStaff.role).toUpperCase()==='STAFF'?'selected':''}>Nhân viên</option><option value="MANAGER" ${String(editStaff.role).toUpperCase()==='MANAGER'?'selected':''}>Quản lý</option>${isAdmin()?`<option value="ADMIN" ${String(editStaff.role).toUpperCase()==='ADMIN'?'selected':''}>Admin</option>`:''}</select></div>
          <div class="field"><label>Chức danh</label><input name="position" value="${esc(editStaff.position||'')}"></div>
          <div class="field"><label>Bộ phận</label><input name="department" value="${esc(editStaff.department||'')}"></div>
          <div class="field"><label>Quản lý trực tiếp</label><select name="manager_code"><option value="">Chưa gán</option>${staff.filter(s=>['ADMIN','MANAGER'].includes(String(s.role).toUpperCase())).map(s=>`<option value="${s.code}" ${editStaff.manager_code===s.code?'selected':''}>${s.code} · ${esc(s.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Trạng thái</label><select name="employee_status"><option value="active" ${editStaff.employee_status==='active'?'selected':''}>Đang làm</option><option value="probation" ${editStaff.employee_status==='probation'?'selected':''}>Thử việc</option><option value="suspended" ${editStaff.employee_status==='suspended'?'selected':''}>Tạm nghỉ</option><option value="left" ${editStaff.employee_status==='left'?'selected':''}>Nghỉ việc</option></select></div>
          <div class="field"><label>Chấm công</label><select name="work_mode"><option value="hourly" ${editStaff.work_mode!=='no_attendance'?'selected':''}>Theo giờ</option><option value="no_attendance" ${editStaff.work_mode==='no_attendance'?'selected':''}>Không chấm công</option></select></div>
          <div class="field"><label>Giờ dự kiến/ngày</label><input name="expected_hours" type="number" min="0" max="24" step="0.25" value="${num(editStaff.expected_daily_minutes||480)/60}"></div>
          <div class="field"><label>Hình thức lương</label><select name="salary_type"><option value="monthly" ${editStaff.salary_type==='monthly'?'selected':''}>Theo tháng</option><option value="hourly" ${editStaff.salary_type==='hourly'?'selected':''}>Theo giờ</option><option value="daily" ${editStaff.salary_type==='daily'?'selected':''}>Theo ngày</option></select></div>
          <div class="field"><label>Lương cơ bản / đơn giá ngày</label><input name="base_salary" type="number" min="0" value="${num(editStaff.base_salary)}"></div>
          <div class="field"><label>Đơn giá giờ</label><input name="hourly_rate" type="number" min="0" value="${num(editStaff.hourly_rate)}"></div>
          <div class="field"><label>Ngày vào làm</label><input name="joined_on" type="date" value="${esc(editStaff.joined_on||'')}"></div>
          <div class="field"><label>Ngày nghỉ việc</label><input name="left_on" type="date" value="${esc(editStaff.left_on||'')}"></div>
          <div class="field" style="grid-column:1/-1"><label>Quyền</label><input name="permissions" value="${esc((editStaff.permissions||['attendance']).join(','))}"></div>
          <div class="field" style="grid-column:1/-1"><label>Ghi chú nhân sự</label><textarea name="notes">${esc(editStaff.notes||'')}</textarea></div>
          <div><button class="btn">Cập nhật hồ sơ</button></div>
        </form><p class="muted">Chuyển cơ sở chính sẽ ngừng phân công chính cũ; các cơ sở bổ sung khác vẫn giữ nguyên.</p></div>
      </div>
      <div class="section-title"><h3>Phân công cơ sở bổ sung đang hiệu lực</h3><span class="muted">Kết thúc phân công không thay đổi cơ sở chính</span></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Nhân sự</th><th>Cơ sở bổ sung</th><th>Hiệu lực</th><th>Ghi chú</th><th>Xử lý</th></tr></thead><tbody>
        ${activeExtraAssignments.map(a=>`<tr><td><b>${esc(staffBy(a.staff_code).name)}</b><br><span class="code">${esc(a.staff_code)}</span></td><td>${esc(unitBy(a.unit_code).name)}</td><td>${esc(a.effective_from||'Không giới hạn')} → ${esc(a.effective_to||'Không giới hạn')}</td><td>${esc(a.note||'')}</td><td><button class="btn small" data-action="deactivate-assignment" data-id="${a.id}">Kết thúc</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">Không có phân công cơ sở bổ sung đang hiệu lực.</td></tr>'}
      </tbody></table></div>
      <div class="card" style="margin-top:14px"><h3>Quản lý bổ sung / chốt giờ có xác nhận</h3><form id="managerAttendanceForm" class="grid cols-3">
        <div class="field"><label>Nhân sự</label><select name="staff_code">${staff.filter(x=>x.work_mode!=='no_attendance').map(x=>`<option value="${x.code}">${x.code} · ${esc(x.name)}</option>`).join('')}</select></div>
        ${unitSelectField('unit_code','Cơ sở',unitOptions.map(u=>u.code))}
        <div class="field"><label>Phiên đang mở cần chốt</label><select name="attendance_id"><option value="">Tạo bản ghi bổ sung</option>${state.attendanceRecords.filter(r=>inUnit(r)&&!r.check_out_at&&r.status==='working').map(r=>`<option value="${r.id}">${staffBy(r.staff_code).name} · ${fmtTime(r.check_in_at)}</option>`).join('')}</select></div>
        <div class="field"><label>Ngày làm việc</label><input name="work_date" type="date" value="${today()}" required></div>
        <div class="field"><label>Giờ vào đã xác minh</label><input name="check_in_at" type="datetime-local" required></div>
        <div class="field"><label>Giờ ra đã xác minh</label><input name="check_out_at" type="datetime-local" required></div>
        <div class="field" style="grid-column:1/-1"><label>Lý do / căn cứ xác nhận</label><input name="reason" placeholder="Camera, quản lý trực tiếp xác nhận, lỗi thiết bị…" required minlength="5"></div>
        <div><button class="btn soft">Lưu điều chỉnh có audit</button></div>
      </form><p class="muted">Chức năng này không phải checkout tự động. Mọi bản ghi do quản lý thêm hoặc sửa đều lưu người thực hiện, thời gian và lý do.</p></div>
      <div class="section-title"><h3>Đơn nghỉ chờ duyệt</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Nhân sự</th><th>Thời gian</th><th>Loại</th><th>Lý do</th><th>Xử lý</th></tr></thead><tbody>${pendingLeaves.map(x=>`<tr><td><b>${esc(staffBy(x.staff_code).name)}</b></td><td>${x.start_date} → ${x.end_date}</td><td>${esc(x.leave_type)}</td><td>${esc(x.reason||'')}</td><td><button class="btn small primary" data-action="review-leave" data-id="${x.id}" data-approve="1">Duyệt</button> <button class="btn small" data-action="review-leave" data-id="${x.id}" data-approve="0">Từ chối</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">Không có đơn chờ duyệt.</td></tr>'}</tbody></table></div>
      <div class="section-title"><h3>Điều chỉnh giờ chờ duyệt</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Nhân sự</th><th>Ngày</th><th>Giờ đề nghị</th><th>Lý do</th><th>Xử lý</th></tr></thead><tbody>${pendingAdj.map(x=>`<tr><td><b>${esc(staffBy(x.staff_code).name)}</b></td><td>${x.work_date}</td><td>${fmtTime(x.requested_check_in_at)} → ${fmtTime(x.requested_check_out_at)}</td><td>${esc(x.reason)}</td><td><button class="btn small primary" data-action="review-adjustment" data-id="${x.id}" data-approve="1">Duyệt</button> <button class="btn small" data-action="review-adjustment" data-id="${x.id}" data-approve="0">Từ chối</button></td></tr>`).join('')||'<tr><td colspan="5" class="muted">Không có yêu cầu chờ duyệt.</td></tr>'}</tbody></table></div>
      <div class="section-title"><h3>Tổng hợp công tháng ${today().slice(0,7)}</h3><button class="btn small" data-action="export-attendance">Xuất CSV bảng công</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Nhân sự</th><th>Cơ sở</th><th>Giờ dự kiến</th><th>Giờ thực tế</th><th>Thiếu</th><th>Tăng thêm</th><th>Đi trễ</th><th>Về sớm</th><th>Khác lịch</th><th>Chưa checkout</th></tr></thead><tbody>${reports.map(r=>`<tr><td><b>${esc(r.staff_name)}</b><br><span class="code">${r.staff_code}</span></td><td>${esc(r.unit_name||r.unit_code)}</td><td>${minsLabel(r.expected_minutes)}</td><td>${minsLabel(r.actual_minutes)}</td><td class="${r.missing_minutes>0?'danger-text':''}">${minsLabel(r.missing_minutes)}</td><td>${minsLabel(r.overtime_minutes)}</td><td class="${num(r.late_minutes)>0?'danger-text':''}">${minsLabel(r.late_minutes)}</td><td class="${num(r.early_leave_minutes)>0?'danger-text':''}">${minsLabel(r.early_leave_minutes)}</td><td>${r.schedule_exception_days||0}</td><td>${r.open_session_days||0}</td></tr>`).join('')||'<tr><td colspan="10" class="muted">Chưa có dữ liệu tháng.</td></tr>'}</tbody></table></div>
      <div class="section-title"><h3>Danh sách nhân sự</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Họ tên</th><th>Tài khoản</th><th>Cơ sở</th><th>Chức danh</th><th>Chế độ</th><th>Trạng thái</th><th>Quyền</th></tr></thead><tbody>${staff.map(s=>`<tr><td><span class="code">${esc(s.code)}</span></td><td><b>${esc(s.name)}</b><br><span class="muted">${esc(s.phone||'')}</span></td><td>${s.auth_user_id?'<span class="badge green">Đã liên kết</span>':'<span class="badge amber">Chưa có Auth</span>'}<br><small>${esc(s.email||'')}</small></td><td>${esc(unitBy(s.unit_code).name)}</td><td>${esc(s.position||'')}</td><td>${s.work_mode==='no_attendance'?'Không chấm công':`${minsLabel(s.expected_daily_minutes)}/ngày`}</td><td>${statusBadge(s.employee_status||'active')}</td><td>${(s.permissions||[]).map(p=>`<span class="badge">${esc(p)}</span>`).join(' ')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function renderKiot(){
    const inv = state.kiotInvoices.filter(x=>inUnit(x)); const items=state.kiotInvoiceItems.filter(x=>inUnit(x)); const stock=estimateStock();
    const productRows = Object.values(items.reduce((m,x)=>{ const k=x.product_code; m[k] ||= {code:k,name:x.product_name,qty:0,revenue:0,cost:0}; m[k].qty += num(x.qty); m[k].revenue += num(x.qty)*num(x.price); m[k].cost += num(x.cost_estimate); return m; },{})).sort((a,b)=>b.revenue-a.revenue);
    return `<div class="tabs"><button class="${ui.kiotTab==='sales'?'active':''}" data-action="kiot-tab" data-tab="sales">Doanh thu</button><button class="${ui.kiotTab==='stock'?'active':''}" data-action="kiot-tab" data-tab="stock">Tồn kho ước lượng</button><button class="${ui.kiotTab==='recipes'?'active':''}" data-action="kiot-tab" data-tab="recipes">Định lượng món</button><button class="${ui.kiotTab==='sync'?'active':''}" data-action="kiot-tab" data-tab="sync">Kết nối API</button></div>
    ${ui.kiotTab==='stock'?renderStock(stock):ui.kiotTab==='recipes'?renderRecipes():ui.kiotTab==='sync'?renderKiotSync():renderSales(inv, productRows)}`;
  }
  function renderSales(inv, productRows){
    return `<div class="grid cols-4">${stat('Tổng doanh thu', money(sum(inv,x=>x.total)), `${inv.length} hóa đơn`)}${stat('Tiền mặt', money(sum(inv,x=>x.cash)), 'Theo Kiot')}${stat('Chuyển khoản', money(sum(inv,x=>x.bank)), 'Theo Kiot')}${stat('Lãi gộp món', money(sum(productRows,x=>x.revenue-x.cost)), 'Ước tính')}</div>
    <div class="section-title"><h3>Phân tích món/dịch vụ</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Món/Dịch vụ</th><th>Số lượng</th><th>Doanh thu</th><th>Cost ước tính</th><th>Lãi gộp</th><th>Biên</th></tr></thead><tbody>
    ${productRows.map(p=>{ const gp=p.revenue-p.cost; return `<tr><td><span class="code">${esc(p.code)}</span></td><td><b>${esc(p.name)}</b></td><td>${p.qty}</td><td>${money(p.revenue)}</td><td>${money(p.cost)}</td><td class="${gp>=0?'profit-pos':'profit-neg'}">${money(gp)}</td><td>${p.revenue?Math.round(gp/p.revenue*100):0}%</td></tr>`}).join('') || '<tr><td colspan="7" class="muted">Chưa có dữ liệu</td></tr>'}
    </tbody></table></div>`;
  }
  function renderStock(stock){
    return `<div class="notice">Tồn kho ở đây là <b>ước lượng</b>: tồn đầu/nhập - bán ra theo định lượng - xuất hủy/chuyển kho. Cần kiểm kho thực tế để ra chênh lệch.</div><div class="section-title"><h3>Tồn kho ước lượng theo cơ sở</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Cơ sở</th><th>Nguyên liệu</th><th>Tồn nhập</th><th>Đã dùng theo bill</th><th>Tồn ước lượng</th><th>Ngưỡng</th><th>Cảnh báo</th></tr></thead><tbody>
    ${stock.map(s=>`<tr><td>${esc(unitBy(s.unit_code).name)}</td><td><b>${esc(s.name)}</b><br><span class="code">${esc(s.ingredient_code)}</span></td><td>${round(s.stockIn)} ${esc(s.unit)}</td><td>${round(s.consumed)} ${esc(s.unit)}</td><td class="${s.onHand<s.min_level?'danger-text':''}">${round(s.onHand)} ${esc(s.unit)}</td><td>${round(s.min_level)} ${esc(s.unit)}</td><td>${s.onHand<s.min_level?'<span class="badge red">Sắp hết</span>':'<span class="badge green">Ổn</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
  }
  function round(v){ return Math.round(num(v)*100)/100; }
  function renderRecipes(){
    return `<div class="split"><div class="card"><h3>Thêm định lượng món</h3><form id="recipeForm" class="grid cols-2"><div class="field"><label>Mã món Kiot</label><input name="product_code" placeholder="LAU_HAI_SAN"></div><div class="field"><label>Tên món</label><input name="product_name" placeholder="Lẩu hải sản"></div><div class="field"><label>Nguyên liệu</label><select name="ingredient_code">${state.ingredients.map(i=>`<option value="${i.code}">${i.code} · ${esc(i.name)}</option>`).join('')}</select></div><div class="field"><label>Định lượng/món</label><input name="qty" type="number" step="0.01"></div><div><button class="btn primary">Lưu định lượng</button></div></form></div><div class="card"><h3>Gợi ý vận hành</h3><div class="ok">Món bán càng nhiều càng cần định lượng chuẩn. Nên ưu tiên: lẩu, hải sản, BBQ, bia, combo tiệc, món tặng, phòng VIP/Karaoke.</div></div></div>
    <div class="section-title"><h3>Bảng định lượng hiện tại</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Mã món</th><th>Tên món</th><th>Nguyên liệu</th><th>Định lượng</th></tr></thead><tbody>${state.recipes.map(r=>{ const ing=state.ingredients.find(i=>i.code===r.ingredient_code)||{}; return `<tr><td><span class="code">${esc(r.product_code)}</span></td><td>${esc(r.product_name)}</td><td>${esc(ing.name||r.ingredient_code)}</td><td>${round(r.qty)} ${esc(ing.unit||'')}</td></tr>`}).join('')}</tbody></table></div>`;
  }
  function renderKiotSync(){
    return `<div class="grid cols-2"><div class="card"><h3>Kết nối KiotViet</h3><p class="muted">Bản v1 đã có endpoint <span class="code">/api/kiotviet-sync</span>. Khi có Client ID/Secret và Retailer, đặt biến môi trường trên Vercel rồi bấm Sync.</p><button class="btn primary" data-action="kiot-sync">Sync thử</button><div style="margin-top:12px" class="notice">Không nhập secret trực tiếp vào giao diện. Chỉ đặt trên Vercel Environment Variables.</div></div><div class="card"><h3>Biến môi trường cần có</h3><div class="pre">KIOTVIET_RETAILER=...\nKIOTVIET_CLIENT_ID=...\nKIOTVIET_CLIENT_SECRET=...\nKIOTVIET_WEBHOOK_SECRET=...\nSUPABASE_URL=...\nSUPABASE_SERVICE_ROLE_KEY=...</div></div></div>`;
  }

  function renderHotel(){
    const rooms = state.hotelRooms.filter(x=>inUnit(x)); const reservations=state.reservations.filter(x=>inUnit(x)); const tasks=state.housekeeping.filter(x=>inUnit(x));
    return `<div class="grid cols-4">${stat('Tổng phòng', rooms.length, 'Theo cơ sở đang xem')}${stat('Đang có khách', rooms.filter(r=>r.status==='occupied').length, 'Occupied')}${stat('Cần dọn', rooms.filter(r=>r.status==='dirty').length, 'Dirty')}${stat('Bảo trì', rooms.filter(r=>r.status==='maintenance').length, 'Maintenance')}</div>
    <div class="split" style="margin-top:14px"><div class="card"><div class="section-title"><h3>Sơ đồ phòng</h3></div><div class="room-grid">${rooms.map(r=>`<div class="room ${esc(r.status)}"><div class="num">${esc(r.room_no)}</div><div>${esc(unitBy(r.unit_code).name)}</div><div class="muted">${esc(r.type)} · ${money(r.price)}</div>${statusBadge(r.status)}<div class="row" style="margin-top:8px"><button class="btn small" data-action="room-status" data-id="${r.id}" data-status="clean">Sạch</button><button class="btn small" data-action="room-status" data-id="${r.id}" data-status="dirty">Bẩn</button><button class="btn small" data-action="room-status" data-id="${r.id}" data-status="occupied">Có khách</button></div></div>`).join('') || '<div class="muted">Chưa có phòng</div>'}</div></div>
    <div class="card"><h3>Tạo booking nhanh</h3><form id="bookingForm" class="grid cols-2">${unitSelectField('unit_code','Hotel', hotelUnits().map(u=>u.code))}<div class="field"><label>Phòng</label><select name="room_id">${rooms.map(r=>`<option value="${r.id}">${r.room_no} · ${unitBy(r.unit_code).code}</option>`).join('')}</select></div><div class="field"><label>Khách</label><input name="customer_name" placeholder="Tên khách"></div><div class="field"><label>Nguồn</label><select name="source"><option>Facebook</option><option>OTA</option><option>Walk-in</option><option>Khách quen</option></select></div><div class="field"><label>Check-in</label><input name="checkin" type="date" value="${today()}"></div><div class="field"><label>Check-out</label><input name="checkout" type="date" value="${addDays(today(),1)}"></div><div class="field"><label>Tổng tiền</label><input name="total" type="number" step="1000"></div><div><button class="btn primary">Lưu booking</button></div></form></div></div>
    <div class="section-title"><h3>Booking & Housekeeping</h3></div><div class="grid cols-2"><div class="table-wrap"><table class="table"><thead><tr><th>Khách</th><th>Phòng</th><th>Ngày</th><th>Nguồn</th><th>Trạng thái</th><th>Tổng</th></tr></thead><tbody>${reservations.map(r=>`<tr><td><b>${esc(r.customer_name)}</b></td><td>${esc((state.hotelRooms.find(x=>x.id===r.room_id)||{}).room_no||r.room_id)}</td><td>${esc(r.checkin)} → ${esc(r.checkout)}</td><td>${esc(r.source)}</td><td>${statusBadge(r.status)}</td><td>${money(r.total)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Chưa có booking</td></tr>'}</tbody></table></div><div class="table-wrap"><table class="table"><thead><tr><th>Phòng</th><th>Việc</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>${tasks.map(t=>`<tr><td>${esc((state.hotelRooms.find(x=>x.id===t.room_id)||{}).room_no||t.room_id)}</td><td>${esc(t.task)}</td><td>${esc(t.due_date)}</td><td>${statusBadge(t.status)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Không có việc buồng phòng</td></tr>'}</tbody></table></div></div>`;
  }

  function renderSettings(){
    const configured=realUnits().filter(u=>u.location_verified).length;
    const units=realUnits().filter(u=>accessibleUnits().some(a=>a.code===u.code));
    return `<div class="grid cols-3">
      ${stat('GPS cơ sở',`${configured}/${realUnits().length}`,'Cơ sở đã xác minh vị trí')}
      ${stat('Môi trường',CONFIG.APP_ENV||'demo',sb?'Supabase Auth đang kết nối':'Chưa cấu hình Supabase')}
      ${stat('Bảo mật','RLS production','Tài khoản gắn đúng hồ sơ nhân sự')}
    </div>
    <div class="split" style="margin-top:14px"><div class="card"><h3>Thiết lập vị trí chấm công</h3><form id="unitLocationForm" class="grid cols-2">${unitSelectField('unit_code','Cơ sở',units.map(u=>u.code))}<div class="field"><label>Bán kính cho phép (m)</label><input name="radius_m" type="number" min="30" max="1000" value="150"></div><div class="field"><label>Độ chính xác GPS tối đa (m)</label><input name="max_accuracy_m" type="number" min="20" max="1000" value="200"></div><div style="grid-column:1/-1"><button class="btn primary">📍 Lấy vị trí hiện tại và xác minh cơ sở</button></div></form><div class="notice" style="margin-top:12px">Quản lý phải đứng tại đúng cơ sở, bật GPS và thực hiện bước này một lần. Chỉ cơ sở đã xác minh mới được dùng để chấm công.</div></div><div class="card"><h3>Nguyên tắc vận hành chính thức</h3><div class="timeline"><div class="event"><b>1. Tài khoản cá nhân</b><span>Mỗi nhân sự dùng email riêng, không dùng chung tài khoản.</span></div><div class="event"><b>2. GPS cả lúc vào và ra</b><span>Hệ thống nhận diện cơ sở gần nhất trong danh sách được phân công.</span></div><div class="event"><b>3. Không tự checkout</b><span>Quên checkout phải gửi điều chỉnh và được quản lý duyệt.</span></div><div class="event"><b>4. Đủ/thiếu giờ</b><span>So sánh tổng phút thực tế với lịch giờ dự kiến.</span></div></div></div></div>
    <div class="section-title"><h3>Vị trí các cơ sở</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Cơ sở</th><th>Địa chỉ</th><th>GPS</th><th>Bán kính</th><th>Xác minh</th></tr></thead><tbody>${units.map(u=>`<tr><td><b>${esc(u.name)}</b><br><span class="code">${u.code}</span></td><td>${esc(u.address||'')}</td><td>${u.latitude!=null?`${Number(u.latitude).toFixed(6)}, ${Number(u.longitude).toFixed(6)}`:'Chưa cấu hình'}</td><td>${u.attendance_radius_m||150} m</td><td>${u.location_verified?'<span class="badge green">Đã xác minh</span>':'<span class="badge amber">Chưa xác minh</span>'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function unitSelectField(name, label, codes){ return `<div class="field"><label>${esc(label)}</label><select name="${esc(name)}">${codes.map(c=>`<option value="${c}" ${ui.unit===c?'selected':''}>${c} · ${esc(unitBy(c).name)}</option>`).join('')}</select></div>`; }
  function populateStaffUpdateForm(form,staff){
    if(!form||!staff)return;
    const set=(name,value)=>{const el=form.elements[name];if(el)el.value=value??'';};
    set('name',staff.name);set('phone',staff.phone);set('unit_code',staff.unit_code);set('role',String(staff.role||'STAFF').toUpperCase());
    set('position',staff.position);set('department',staff.department);set('manager_code',staff.manager_code);set('employee_status',staff.employee_status||'active');
    set('work_mode',staff.work_mode||'hourly');set('expected_hours',num(staff.expected_daily_minutes||480)/60);set('salary_type',staff.salary_type||'monthly');
    set('base_salary',num(staff.base_salary));set('hourly_rate',num(staff.hourly_rate));set('joined_on',staff.joined_on);set('left_on',staff.left_on);
    set('permissions',(staff.permissions||['attendance']).join(','));set('notes',staff.notes);
  }

  document.addEventListener('click',async e=>{
    const btn=e.target.closest('[data-action]'); if(!btn) return;
    const a=btn.dataset.action;
    if(a==='nav'){ui.page=btn.dataset.page;ui.mobile=false;render();return;}
    if(a==='toggle-menu'){ui.mobile=!ui.mobile;render();return;}
    if(a==='save-demo'){saveLocal();toast('Đã lưu dữ liệu demo');return;}
    if(a==='logout'){await logoutEmployee();return;}
    if(a==='checkin'){await checkIn();return;}
    if(a==='checkout'){await checkOut();return;}
    if(a==='locate'){await locateMe(true);return;}
    if(a==='review-leave'){await reviewLeave(btn.dataset.id,btn.dataset.approve==='1');return;}
    if(a==='review-adjustment'){await reviewAdjustment(btn.dataset.id,btn.dataset.approve==='1');return;}
    if(a==='cancel-leave'){await cancelOwnRequest('fnb_leave_requests',btn.dataset.id,'Đã hủy đơn nghỉ');return;}
    if(a==='cancel-adjustment'){await cancelOwnRequest('fnb_attendance_adjustments',btn.dataset.id,'Đã hủy yêu cầu điều chỉnh');return;}
    if(a==='deactivate-assignment'){await deactivateAssignment(btn.dataset.id);return;}
    if(a==='export-attendance'){exportAttendanceCsv();return;}
    if(a==='customer-tab'){ui.customerTab=btn.dataset.tab;render();return;}
    if(a==='kiot-tab'){ui.kiotTab=btn.dataset.tab;render();return;}
    if(a==='notify-message'){notifyMessage(btn.dataset.id);return;}
    if(a==='mark-all-read'){state.pageMessages.filter(x=>inUnit(x)).forEach(x=>x.status='done');saveLocal();render();toast('Đã đánh dấu xử lý');return;}
    if(a==='room-status'){updateRoomStatus(btn.dataset.id,btn.dataset.status);return;}
    if(a==='kiot-sync'){await syncKiot();return;}
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-action="unit-select"]')){const allowed=accessibleUnits().map(u=>u.code);if(allowed.includes(e.target.value)){ui.unit=e.target.value;saveLocal();render();}}
    if(e.target.matches('[data-action="staff-edit-select"]')){populateStaffUpdateForm(e.target.form,state.staff.find(s=>s.code===e.target.value));}
    if(e.target.name==='attendance_id'&&e.target.closest('#managerAttendanceForm')){
      const rec=state.attendanceRecords.find(r=>r.id===e.target.value);const form=e.target.form;
      if(rec&&form){form.elements.staff_code.value=rec.staff_code;form.elements.unit_code.value=rec.unit_code;form.elements.work_date.value=rec.work_date;form.elements.check_in_at.value=toLocalInput(rec.check_in_at);form.elements.check_out_at.value=toLocalInput(new Date());}
    }
  });
  document.addEventListener('submit',async e=>{
    e.preventDefault();
    const id=e.target.id; const fd=Object.fromEntries(new FormData(e.target).entries());
    try{
      if(id==='financeForm'){await addFinance(fd);return;}
      if(id==='cashCloseForm'){await addCashClose(fd);return;}
      if(id==='messageForm'){await addMessage(fd);return;}
      if(id==='staffInviteForm'){await inviteStaff(fd);return;}
      if(id==='scheduleForm'){await addScheduleRange(fd);return;}
      if(id==='assignmentForm'){await addAssignment(fd);return;}
      if(id==='staffUpdateForm'){await updateStaff(fd);return;}
      if(id==='leaveForm'){await submitLeave(fd);return;}
      if(id==='adjustmentForm'){await submitAdjustment(fd);return;}
      if(id==='unitLocationForm'){await saveUnitLocation(fd);return;}
      if(id==='managerAttendanceForm'){await managerRecordAttendance(fd);return;}
      if(id==='recipeForm'){await addRecipe(fd);return;}
      if(id==='bookingForm'){await addBooking(fd);return;}
    }catch(err){console.warn(err);toast(err.message||'Không thể lưu dữ liệu');}
  });

  function getPosition(){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation) return reject(new Error('Thiết bị không hỗ trợ GPS'));
      navigator.geolocation.getCurrentPosition(pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,timestamp:pos.timestamp}),err=>{
        const map={1:'Bạn chưa cho phép truy cập vị trí',2:'Không xác định được vị trí',3:'GPS phản hồi quá lâu'};
        reject(new Error(map[err.code]||err.message||'Lỗi GPS'));
      },{enableHighAccuracy:true,timeout:20000,maximumAge:0});
    });
  }
  async function locateMe(showToast=false){
    if(!sb) throw new Error('Chưa kết nối Supabase');
    busyAction='locate';render();
    try{
      const geo=await getPosition();
      const {data,error}=await sb.rpc('fnb_nearest_authorised_unit',{p_latitude:geo.latitude,p_longitude:geo.longitude});
      if(error) throw error;
      const nearest=Array.isArray(data)?data[0]:data;
      lastGeo={...geo,...(nearest||{}),ok:!!nearest&&nearest.distance_m<=nearest.attendance_radius_m};
      if(showToast) toast(nearest?`Gần nhất: ${nearest.unit_name} · ${Math.round(nearest.distance_m)} m`:'Không tìm thấy cơ sở được phân công đã cấu hình GPS');
      return {geo,nearest};
    }finally{busyAction='';render();}
  }
  async function checkIn(){
    if(busyAction) return; busyAction='checkin';render();
    try{
      const geo=await getPosition();
      const {data,error}=await sb.rpc('fnb_check_in',{p_latitude:geo.latitude,p_longitude:geo.longitude,p_accuracy_m:geo.accuracy,p_device_id:deviceId,p_request_id:randomUUID()});
      if(error) throw error;
      toast(`Check-in thành công tại ${unitBy(data.unit_code).name}`);
      await loadSupabase();
    }catch(e){toast(e.message||'Check-in thất bại');}
    finally{busyAction='';render();}
  }
  async function checkOut(){
    if(busyAction) return; busyAction='checkout';render();
    try{
      const geo=await getPosition();
      const {data,error}=await sb.rpc('fnb_check_out',{p_latitude:geo.latitude,p_longitude:geo.longitude,p_accuracy_m:geo.accuracy,p_device_id:deviceId,p_request_id:randomUUID()});
      if(error) throw error;
      toast(`Checkout thành công · ${minsLabel(durationMinutes(data.check_in_at,data.check_out_at))}`);
      await loadSupabase();
    }catch(e){toast(e.message||'Checkout thất bại');}
    finally{busyAction='';render();}
  }
  async function submitLeave(fd){
    const row={staff_code:currentProfile.code,unit_code:currentProfile.unit_code,start_date:fd.start_date,end_date:fd.end_date,leave_type:fd.leave_type,reason:fd.reason,status:'pending'};
    await supaInsert('fnb_leave_requests',row);toast('Đã gửi đơn nghỉ');await loadSupabase();
  }
  async function submitAdjustment(fd){
    const {data:session}=await sb.auth.getSession();
    const toIso=v=>v?new Date(v).toISOString():null;
    const selected=state.attendanceRecords.find(r=>r.id===fd.attendance_id);
    const row={attendance_id:fd.attendance_id||null,staff_code:currentProfile.code,unit_code:selected?.unit_code||currentProfile.unit_code,work_date:fd.work_date,requested_check_in_at:toIso(fd.requested_check_in_at),requested_check_out_at:toIso(fd.requested_check_out_at),reason:fd.reason,status:'pending',requested_by:session.session.user.id};
    await supaInsert('fnb_attendance_adjustments',row);toast('Đã gửi yêu cầu điều chỉnh');await loadSupabase();
  }
  async function reviewLeave(id,approve){
    const note=prompt(approve?'Ghi chú duyệt (có thể để trống):':'Lý do từ chối:')||'';
    const {error}=await sb.rpc('fnb_review_leave_request',{p_request_id:id,p_approve:approve,p_note:note});if(error)throw error;toast(approve?'Đã duyệt đơn nghỉ':'Đã từ chối đơn');await loadSupabase();
  }
  async function reviewAdjustment(id,approve){
    const note=prompt(approve?'Ghi chú duyệt (có thể để trống):':'Lý do từ chối:')||'';
    const {error}=await sb.rpc('fnb_review_attendance_adjustment',{p_adjustment_id:id,p_approve:approve,p_note:note});if(error)throw error;toast(approve?'Đã duyệt điều chỉnh':'Đã từ chối điều chỉnh');await loadSupabase();
  }
  async function cancelOwnRequest(table,id,message){
    if(!confirm('Xác nhận hủy yêu cầu đang chờ duyệt?'))return;
    const {error}=await sb.from(table).update({status:'cancelled',updated_at:nowISO()}).eq('id',id).eq('status','pending');
    if(error)throw error;toast(message);await loadSupabase();
  }
  async function inviteStaff(fd){
    const body={...fd,expected_daily_minutes:Math.round(Number(fd.expected_hours||8)*60),permissions:String(fd.permissions||'attendance').split(',').map(x=>x.trim()).filter(Boolean)};
    const out=await authenticatedFetch('staff-invite',{method:'POST',body:JSON.stringify(body)});toast(out.message||'Đã tạo nhân sự');await loadSupabase();
  }
  async function addScheduleRange(fd){
    const from=new Date(fd.date_from+'T12:00:00'),to=new Date(fd.date_to+'T12:00:00');
    const days=Math.round((to-from)/86400000)+1;if(days<1||days>31)throw new Error('Khoảng lịch phải từ 1 đến 31 ngày');
    const {data:session}=await sb.auth.getSession();
    const expected=fd.day_status==='work'?Math.round(Number(fd.expected_hours||0)*60):0;
    const rows=[];for(let i=0;i<days;i++){const d=new Date(from);d.setDate(d.getDate()+i);rows.push({staff_code:fd.staff_code,unit_code:fd.unit_code,work_date:d.toISOString().slice(0,10),expected_minutes:expected,planned_start:fd.planned_start||null,planned_end:fd.planned_end||null,day_status:fd.day_status,note:fd.note||null,created_by:session.session.user.id,updated_at:nowISO()});}
    await supaUpsert('fnb_work_schedules',rows,'staff_code,work_date');toast(`Đã lưu lịch ${days} ngày`);await loadSupabase();
  }
  async function addAssignment(fd){
    const out=await authenticatedFetch('staff-assignment',{method:'POST',body:JSON.stringify(fd)});toast(out.message||'Đã phân công thêm cơ sở');await loadSupabase();
  }
  async function deactivateAssignment(id){
    if(!confirm('Kết thúc phân công cơ sở bổ sung này?'))return;
    const out=await authenticatedFetch('staff-assignment',{method:'POST',body:JSON.stringify({action:'deactivate',assignment_id:id,effective_to:today()})});
    toast(out.message||'Đã kết thúc phân công');await loadSupabase();
  }
  async function updateStaff(fd){
    const row=state.staff.find(s=>s.code===fd.code);if(!row)throw new Error('Không tìm thấy nhân sự');
    const body={...fd,expected_daily_minutes:Math.round(Number(fd.expected_hours||0)*60),permissions:String(fd.permissions||'attendance').split(',').map(x=>x.trim()).filter(Boolean)};
    const out=await authenticatedFetch('staff-update',{method:'POST',body:JSON.stringify(body)});toast(out.message||'Đã cập nhật hồ sơ');await loadSupabase();
  }
  async function managerRecordAttendance(fd){
    const toIso=v=>v?new Date(v).toISOString():null;
    const {error}=await sb.rpc('fnb_manager_record_attendance',{p_attendance_id:fd.attendance_id||null,p_staff_code:fd.staff_code,p_unit_code:fd.unit_code,p_work_date:fd.work_date,p_check_in_at:toIso(fd.check_in_at),p_check_out_at:toIso(fd.check_out_at),p_reason:fd.reason});
    if(error)throw error;toast('Đã lưu bản ghi công có xác nhận quản lý');await loadSupabase();
  }
  async function saveUnitLocation(fd){
    const geo=await getPosition();
    const {error}=await sb.rpc('fnb_save_unit_location',{p_unit_code:fd.unit_code,p_latitude:geo.latitude,p_longitude:geo.longitude,p_accuracy_m:geo.accuracy,p_radius_m:Number(fd.radius_m||150),p_max_accuracy_m:Number(fd.max_accuracy_m||200)});if(error)throw error;toast('Đã xác minh vị trí '+unitBy(fd.unit_code).name);await loadSupabase();
  }

  async function addFinance(fd){ const row={id:uid('TXN'), unit_code:fd.unit_code, date:fd.date||today(), type:fd.type, account:fd.account||('TM_'+fd.unit_code), category:fd.category, amount:num(fd.amount), note:fd.note||'', created_at:nowISO()}; state.financeTransactions.unshift(row); saveLocal(); render(); toast('Đã lưu phiếu'); await supaInsert('fnb_finance_transactions', row); }
  async function addCashClose(fd){ const row={id:uid('CASH'), unit_code:fd.unit_code, date:fd.date||today(), kiot_cash:num(fd.kiot_cash), actual_cash:num(fd.actual_cash), cash_diff:num(fd.actual_cash)-num(fd.kiot_cash), kiot_bank:num(fd.kiot_bank), actual_bank:num(fd.actual_bank), bank_diff:num(fd.actual_bank)-num(fd.kiot_bank), note:fd.note||'', created_at:nowISO()}; state.cashClosings.unshift(row); saveLocal(); render(); toast('Đã chốt kết ca'); await supaInsert('fnb_cash_closing_sessions', row); }
  async function addMessage(fd){ const c=classifyMessage(fd.text); const msg={id:uid('MSG'), page:unitBy(fd.unit_code).name, unit_code:fd.unit_code, customer_name:fd.customer_name||'Khách inbox', text:fd.text, created_at:nowISO(), intent:c.intent, status:'new'}; state.pageMessages.unshift(msg); const lead={id:uid('LEAD'), customer_name:maskPhone(fd.customer_name||'Khách inbox'), unit_code:fd.unit_code, need:c.intent, source:'Facebook Page', status:'new', no_phone_public:true, note:'AI: '+c.next+' Trả lời gợi ý: '+aiReplyFor(fd.text, fd.unit_code)}; state.customerLeads.unshift(lead); state.notifications.unshift({id:uid('NOTI'), channel:'group', unit_code:fd.unit_code, content:buildGroupNotice(msg), created_at:nowISO()}); saveLocal(); ui.customerTab='inbox'; render(); toast('Đã tạo inbox, lead và thông báo nhóm'); await supaInsert('fnb_customer_messages', msg); await supaInsert('fnb_customer_leads', lead); }
  async function addRecipe(fd){ const row={id:uid('RCP'), product_code:fd.product_code, product_name:fd.product_name, ingredient_code:fd.ingredient_code, qty:num(fd.qty), created_at:nowISO()}; state.recipes.push(row); saveLocal(); render(); toast('Đã lưu định lượng'); await supaInsert('fnb_recipes', row); }
  async function addBooking(fd){ const row={id:uid('RES'), unit_code:fd.unit_code, room_id:fd.room_id, customer_name:fd.customer_name||'Khách', checkin:fd.checkin, checkout:fd.checkout, source:fd.source, status:'confirmed', total:num(fd.total), created_at:nowISO()}; state.reservations.unshift(row); const room=state.hotelRooms.find(r=>r.id===fd.room_id); if(room) room.status='occupied'; saveLocal(); render(); toast('Đã tạo booking'); await supaInsert('fnb_hotel_reservations', row); }
  function notifyMessage(id){ const msg=state.pageMessages.find(m=>m.id===id); if(!msg) return; const content=buildGroupNotice(msg); state.notifications.unshift({id:uid('NOTI'), channel:'group', unit_code:msg.unit_code, content, created_at:nowISO()}); msg.status='working'; saveLocal(); render(); toast('Đã tạo thông báo nhóm nội bộ'); navigator.clipboard?.writeText(content).catch(()=>{}); }
  function updateRoomStatus(id,status){ const r=state.hotelRooms.find(x=>x.id===id); if(!r)return; r.status=status; if(status==='dirty') state.housekeeping.unshift({id:uid('HSK'), unit_code:r.unit_code, room_id:r.id, task:'Dọn phòng '+r.room_no, status:'todo', due_date:today()}); saveLocal(); render(); toast('Đã cập nhật phòng '+r.room_no); }
  async function syncKiot(){
    try{ const js=await authenticatedFetch('kiotviet-sync',{method:'POST',body:JSON.stringify({unit:ui.unit})}); toast(js.message || 'Đã gọi sync KiotViet'); }
    catch(e){ toast(e.message||'Chưa kết nối API KiotViet'); }
  }

  window.addEventListener('unhandledrejection',e=>{console.warn(e.reason);toast(e.reason?.message||'Có lỗi khi xử lý yêu cầu');});
  document.addEventListener('visibilitychange',()=>{
    if(sb&&document.visibilityState==='visible'&&!busyAction&&!document.querySelector('input:focus,textarea:focus,select:focus')) loadSupabase();
  });
  setInterval(()=>{
    if(sb&&document.visibilityState==='visible'&&!busyAction&&!document.querySelector('input:focus,textarea:focus,select:focus')) loadSupabase();
  },120000);
  function init(){ render(); if(sb) loadSupabase(); else if(CONFIG.APP_ENV==='production') toast('Chưa cấu hình Supabase production'); }
  init();
})();
