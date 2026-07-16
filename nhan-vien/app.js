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
    {code:'GROUP_ALL', name:'Friendzone Group', type:'GROUP', parent_code:null, address:'Phan Thiết / Lâm Đồng', manager_code:'GROUP_ALL_QL'},
    {code:'NHA_GROUP', name:'Tất cả nhà hàng', type:'RESTAURANT_GROUP', parent_code:'GROUP_ALL', address:'Tổng hợp nhà hàng', manager_code:'NHA_GROUP_QL'},
    {code:'NHA_ALL', name:'All Night Food & Beer', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'All Night Food & Beer', manager_code:'NHA_ALL_QL'},
    {code:'NHA_SAIGONPHO', name:'Sài Gòn Phố - Beer Garden & Karaoke', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'N5-33 Mậu Thân, Phú Thuỷ, Lâm Đồng - Ocean Dunes Phan Thiết', manager_code:'NHA_SAIGONPHO_QL'},
    {code:'NHA_FRZ', name:'Friendzone Restaurant', type:'RESTAURANT', parent_code:'NHA_GROUP', address:'Friendzone Restaurant', manager_code:'NHA_FRZ_QL'},
    {code:'HOTEL_ALL', name:'Tất cả Hotel', type:'HOTEL_GROUP', parent_code:'GROUP_ALL', address:'Tổng hợp lưu trú', manager_code:'HOTEL_ALL_QL'},
    {code:'HOTEL_VENUS', name:'Venus Resort / Hotel', type:'HOTEL', parent_code:'HOTEL_ALL', address:'Mũi Né / Phan Thiết', manager_code:'HOTEL_VENUS_QL'},
    {code:'HOTEL_VOLGA', name:'Volga Hotel Apartment', type:'HOTEL', parent_code:'HOTEL_ALL', address:'Phan Thiết', manager_code:'HOTEL_VOLGA_QL'},
    {code:'HOTEL_A64', name:'Hotel A64', type:'HOTEL', parent_code:'HOTEL_ALL', address:'Phan Thiết', manager_code:'HOTEL_A64_QL'},
    {code:'HOTEL_FRZ', name:'Friendzone Hotel', type:'HOTEL', parent_code:'HOTEL_ALL', address:'Phan Thiết', manager_code:'HOTEL_FRZ_QL'}
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
  const today = () => new Date().toISOString().slice(0,10);
  const nowISO = () => new Date().toISOString();
  const uid = p => `${p}-${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`;
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const phoneRe = /(?:\+?84|0)(?:\d[\s.-]?){8,10}\d/g;
  const maskPhone = text => String(text || '').replace(phoneRe, m => {
    const d = m.replace(/\D/g,'');
    if (d.length < 8) return '***';
    return d.slice(0,3) + '****' + d.slice(-2);
  });

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

  function loadLocal(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw){
        const data = JSON.parse(raw);
        data.units = data.units?.length ? data.units : UNIT_SEED;
        return data;
      }
    }catch(e){ console.warn(e); }
    return demoData();
  }
  function saveLocal(){
    state.settings = state.settings || {};
    state.settings.selectedUnit = ui.unit;
    state.settings.updatedAt = nowISO();
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  async function loadSupabase(){
    if(!sb) return;
    try{
      const map = [
        ['fnb_units','units'], ['fnb_staff','staff'], ['fnb_attendance_records','attendanceRecords'],
        ['fnb_finance_transactions','financeTransactions'], ['fnb_cash_closing_sessions','cashClosings'],
        ['fnb_customer_messages','pageMessages'], ['fnb_customer_leads','customerLeads'],
        ['fnb_notification_logs','notifications'], ['fnb_kiot_invoices','kiotInvoices'], ['fnb_kiot_invoice_items','kiotInvoiceItems'],
        ['fnb_ingredients','ingredients'], ['fnb_recipes','recipes'], ['fnb_stock_movements','stockMovements'],
        ['fnb_hotel_rooms','hotelRooms'], ['fnb_hotel_reservations','reservations'], ['fnb_housekeeping_tasks','housekeeping']
      ];
      const results = await Promise.all(map.map(([table]) => sb.from(table).select('*').limit(3000)));
      results.forEach((res, idx) => {
        if(!res.error && Array.isArray(res.data) && res.data.length) state[map[idx][1]] = res.data;
      });
      toast('Đã tải dữ liệu Supabase'); saveLocal(); render();
    }catch(e){ console.warn(e); toast('Không tải được Supabase, đang dùng dữ liệu local'); }
  }

  async function supaInsert(table, row){
    if(!sb) return null;
    try{ const {error} = await sb.from(table).insert(row); if(error) throw error; return true; }catch(e){ console.warn(table, e); toast('Lưu local OK, Supabase lỗi: '+(e.message||e)); return false; }
  }

  function unitBy(code){ return state.units.find(u=>u.code===code) || UNIT_SEED.find(u=>u.code===code) || {code, name:code, type:''}; }
  function staffBy(code){ return state.staff.find(s=>s.code===code) || {code, name:code, position:''}; }
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
    const map={new:'red',working:'blue',done:'green',paid:'green',checked_in:'blue',clean:'green',dirty:'red',occupied:'blue',maintenance:'amber',todo:'amber',confirmed:'green',lost:'red'};
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
    const page = PAGES.find(p=>p[0]===ui.page) || PAGES[0];
    const employee = employeeSession();
    root.innerHTML = `
      <div class="app">
        <aside class="sidebar ${ui.mobile?'open':''}">
          <div class="brand"><img src="logo.png" alt="FriendZones"><div><h1>FriendZones<br>Nhân viên</h1><p>F&B + Hotel Operations</p></div></div>
          <nav class="nav">${PAGES.map(p=>`<button class="${ui.page===p[0]?'active':''}" data-action="nav" data-page="${p[0]}"><span>${p[1]}</span><span>${p[2]}</span></button>`).join('')}</nav>
          <div class="sidefoot">Bản tích hợp v1.1.0 · Website công khai + cổng nhân viên.<br>NHA_ALL = All Night Food & Beer.<br><span class="code">${sb?'Supabase':'Demo/local'}</span></div>
        </aside>
        <main class="main">
          <div class="topbar">
            <div class="title"><h2>${page[1]} ${page[2]}</h2><p>${subtitle()}</p></div>
            <div class="toolbar">
              <button class="btn mobile-toggle" data-action="toggle-menu">☰ Menu</button>
              <select class="pill" data-action="unit-select">${state.units.map(u=>`<option value="${u.code}" ${ui.unit===u.code?'selected':''}>${u.code}</option>`).join('')}</select>
              <span class="pill">👤 ${esc(employee.displayName || employee.identity || 'Nhân viên')}</span>
              <span class="pill">${new Date().toLocaleDateString('vi-VN')}</span>
              <a class="btn" href="/">Website</a>
              <button class="btn" data-action="save-demo">Lưu</button>
              <button class="btn dark" data-action="logout">Đăng xuất</button>
            </div>
          </div>
          ${renderPage()}
        </main>
      </div>`;
  }

  function subtitle(){
    const map = {
      dashboard:'Bức tranh vận hành theo cơ sở: doanh thu, khách hàng, nhân sự, kho, hotel.',
      attendance:'Check-in/out, ca làm, checklist cuối ca và cảnh báo chưa bàn giao.',
      finance:'Quỹ từng cơ sở, thu chi nội bộ, kết ca, lệch tiền so với KiotViet.',
      customers:'Tin nhắn Page, AI tư vấn, phân loại nhu cầu và thông báo nhóm không lộ SĐT.',
      hr:'Thêm/bớt nhân sự, mã cơ sở, chức danh, phân quyền, lương.',
      kiot:'Doanh thu KiotViet, phân tích món, tồn kho ước lượng theo định lượng.',
      hotel:'Phòng, booking, housekeeping, sự cố phòng và liên kết doanh thu nhà hàng.',
      settings:'Seed cơ sở, môi trường, kết nối Supabase, Meta, KiotViet, Zalo/Telegram.'
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
    const att = state.attendanceRecords.filter(x=>x.work_date===today() && inUnit(x) && x.check_in_at && !x.check_out_at).length;
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
        ${stat('Nhân sự đang làm', att+' người', 'Check-in chưa checkout')}
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
    const staff = state.staff.filter(s=>s.active && (ui.unit==='GROUP_ALL' || unitCodes().includes(s.unit_code)));
    const records = state.attendanceRecords.filter(x=>inUnit(x)).sort((a,b)=>String(b.check_in_at).localeCompare(String(a.check_in_at))).slice(0,80);
    const currentStaff = staffBy(state.activeStaffCode || staff[0]?.code);
    const currentUnit = unitBy(currentStaff.unit_code || ui.unit);
    const checklist = isHotelUnit(currentUnit.code) ? DEFAULT_CHECKLISTS.HOTEL : DEFAULT_CHECKLISTS.RESTAURANT;
    return `
      <div class="grid cols-3">
        <div class="card"><h3>Check-in / Check-out</h3>
          <div class="field"><label>Nhân sự</label><select id="activeStaffSelect">${staff.map(s=>`<option value="${s.code}" ${state.activeStaffCode===s.code?'selected':''}>${s.code} · ${esc(s.name)}</option>`).join('')}</select></div>
          <div class="row" style="margin-top:10px"><button class="btn primary" data-action="checkin">Check-in</button><button class="btn dark" data-action="checkout">Check-out</button></div>
          <p class="muted">Checkout sẽ nhắc hoàn thành checklist cuối ca nếu chưa tick đủ.</p>
        </div>
        <div class="card"><h3>Checklist cuối ca</h3><div class="checklist">
          ${checklist.map((x,i)=>`<label class="checkitem"><input type="checkbox" class="shift-check" value="${i}"> ${esc(x)}</label>`).join('')}
        </div></div>
        <div class="card"><h3>Quy tắc ca</h3><div class="notice">Nhà hàng: ca trưa, ca tối, ca full, tăng cường tiệc. Hotel: ca sáng, chiều, đêm. Nhân sự không chấm công cả ngày có thể đánh OFF theo cấu hình cron 17:50.</div></div>
      </div>
      <div class="section-title"><h3>Lịch sử chấm công</h3><button class="btn small" data-action="auto-off-demo">Ghi OFF demo hôm nay</button></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Ngày</th><th>Nhân sự</th><th>Cơ sở</th><th>Ca</th><th>Vào</th><th>Ra</th><th>Checklist</th><th>Trạng thái</th></tr></thead><tbody>
        ${records.map(r=>`<tr><td>${esc(r.work_date)}</td><td><b>${esc(staffBy(r.staff_code).name)}</b><br><span class="code">${esc(r.staff_code)}</span></td><td>${esc(unitBy(r.unit_code).name)}</td><td>${esc(r.shift)}</td><td>${fmtTime(r.check_in_at)}</td><td>${fmtTime(r.check_out_at)}</td><td>${r.checklist_done?'✅':'—'}</td><td>${statusBadge(r.status)}</td></tr>`).join('')}
      </tbody></table></div>`;
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
    const staff = state.staff.filter(s=>ui.unit==='GROUP_ALL' || unitCodes().includes(s.unit_code));
    return `<div class="split"><div class="card"><h3>Thêm nhân sự</h3><form id="staffForm" class="grid cols-2">
      ${unitSelectField('unit_code','Cơ sở', realUnits().map(u=>u.code))}
      <div class="field"><label>Loại mã</label><select name="role"><option value="STAFF">Nhân sự _01, _02...</option><option value="MANAGER">Quản lý _QL</option></select></div>
      <div class="field"><label>Họ tên</label><input name="name" placeholder="Tên nhân sự"></div>
      <div class="field"><label>Chức danh</label><input name="position" placeholder="Phục vụ / Thu ngân / Bếp / Lễ tân"></div>
      <div class="field"><label>Bộ phận</label><input name="department" placeholder="Bếp / Bar / Lễ tân / Buồng phòng"></div>
      <div class="field"><label>Lương cơ bản</label><input name="base_salary" type="number" step="1000"></div>
      <div class="field" style="grid-column:1/-1"><label>Quyền</label><input name="permissions" value="attendance" placeholder="attendance,customers,finance"></div>
      <div><button class="btn primary">Tạo nhân sự</button></div>
    </form></div><div class="card"><h3>Quy tắc mã nhân sự</h3><div class="ok">Quản lý: <span class="code">MÃCƠSỞ_QL</span>. Nhân sự: <span class="code">MÃCƠSỞ_01</span>, <span class="code">MÃCƠSỞ_02</span>... Nếu có nhiều quản lý dùng <span class="code">_QL01</span>, <span class="code">_QL02</span>.</div></div></div>
    <div class="section-title"><h3>Danh sách nhân sự</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Họ tên</th><th>Cơ sở</th><th>Chức danh</th><th>Bộ phận</th><th>Lương</th><th>Quyền</th></tr></thead><tbody>
    ${staff.map(s=>`<tr><td><span class="code">${esc(s.code)}</span></td><td><b>${esc(s.name)}</b></td><td>${esc(unitBy(s.unit_code).name)}</td><td>${esc(s.position)}</td><td>${esc(s.department)}</td><td>${money(s.base_salary)}</td><td>${(s.permissions||[]).map(p=>`<span class="badge">${esc(p)}</span>`).join(' ')}</td></tr>`).join('')}
    </tbody></table></div>`;
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
    return `<div class="grid cols-2"><div class="card"><h3>Nhận diện app</h3><img class="logo-preview" src="logo.png" alt="Friendzone"><p><b>Friendzone F&B Ops</b></p><p class="muted">Bản này đã tách riêng database/table prefix <span class="code">fnb_</span>, không dùng bảng học viên/hạng bằng của app lái xe.</p><button class="btn soft" data-action="reset-demo">Reset demo data</button></div>
    <div class="card"><h3>Trạng thái kết nối</h3><p>Frontend Supabase: ${sb?'<span class="badge green">Đã cấu hình</span>':'<span class="badge amber">Chưa cấu hình</span>'}</p><p>API backend: <span class="code">/api/health</span></p><p class="muted">Chạy SQL trong thư mục <span class="code">supabase/</span>, sau đó copy <span class="code">config.example.js</span> thành <span class="code">config.js</span>.</p></div></div>
    <div class="section-title"><h3>Cơ sở đã seed</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th>Quản lý</th><th>Địa chỉ</th></tr></thead><tbody>${state.units.map(u=>`<tr><td><span class="code">${esc(u.code)}</span></td><td><b>${esc(u.name)}</b></td><td>${esc(u.type)}</td><td><span class="code">${esc(u.manager_code||'')}</span></td><td>${esc(u.address)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function unitSelectField(name, label, codes){ return `<div class="field"><label>${esc(label)}</label><select name="${esc(name)}">${codes.map(c=>`<option value="${c}" ${ui.unit===c?'selected':''}>${c} · ${esc(unitBy(c).name)}</option>`).join('')}</select></div>`; }

  document.addEventListener('click', async e=>{
    const btn = e.target.closest('[data-action]'); if(!btn) return;
    const a = btn.dataset.action;
    if(a==='nav'){ ui.page=btn.dataset.page; ui.mobile=false; render(); return; }
    if(a==='toggle-menu'){ ui.mobile=!ui.mobile; render(); return; }
    if(a==='save-demo'){ saveLocal(); toast('Đã lưu dữ liệu local'); return; }
    if(a==='logout'){ await logoutEmployee(); return; }
    if(a==='reset-demo'){ if(confirm('Reset dữ liệu demo?')){ state=demoData(); ui.unit='GROUP_ALL'; saveLocal(); render(); toast('Đã reset demo'); } return; }
    if(a==='checkin'){ await checkIn(); return; }
    if(a==='checkout'){ await checkOut(); return; }
    if(a==='auto-off-demo'){ autoOffDemo(); return; }
    if(a==='customer-tab'){ ui.customerTab=btn.dataset.tab; render(); return; }
    if(a==='kiot-tab'){ ui.kiotTab=btn.dataset.tab; render(); return; }
    if(a==='notify-message'){ notifyMessage(btn.dataset.id); return; }
    if(a==='mark-all-read'){ state.pageMessages.filter(x=>inUnit(x)).forEach(x=>x.status='done'); saveLocal(); render(); toast('Đã đánh dấu xử lý'); return; }
    if(a==='room-status'){ updateRoomStatus(btn.dataset.id, btn.dataset.status); return; }
    if(a==='kiot-sync'){ await syncKiot(); return; }
  });
  document.addEventListener('change', e=>{
    if(e.target.matches('[data-action="unit-select"]')){ ui.unit=e.target.value; saveLocal(); render(); }
    if(e.target.id==='activeStaffSelect'){ state.activeStaffCode=e.target.value; saveLocal(); render(); }
  });
  document.addEventListener('submit', async e=>{
    e.preventDefault();
    const id=e.target.id; const fd=Object.fromEntries(new FormData(e.target).entries());
    if(id==='financeForm') return addFinance(fd);
    if(id==='cashCloseForm') return addCashClose(fd);
    if(id==='messageForm') return addMessage(fd);
    if(id==='staffForm') return addStaff(fd);
    if(id==='recipeForm') return addRecipe(fd);
    if(id==='bookingForm') return addBooking(fd);
  });

  async function checkIn(){
    const s = staffBy(state.activeStaffCode); if(!s.code){ toast('Chọn nhân sự trước'); return; }
    const exists = state.attendanceRecords.find(r=>r.staff_code===s.code && r.work_date===today() && !r.check_out_at && r.status==='working');
    if(exists){ toast('Nhân sự này đang trong ca'); return; }
    const row = {id:uid('ATT'), staff_code:s.code, unit_code:s.unit_code, work_date:today(), shift:guessShift(), check_in_at:nowISO(), check_out_at:'', status:'working', checklist_done:false};
    state.attendanceRecords.unshift(row); saveLocal(); render(); toast('Đã check-in '+s.name); await supaInsert('fnb_attendance_records', row);
  }
  async function checkOut(){
    const s = staffBy(state.activeStaffCode);
    const rec = state.attendanceRecords.find(r=>r.staff_code===s.code && r.work_date===today() && !r.check_out_at && r.status==='working');
    if(!rec){ toast('Chưa có ca đang mở'); return; }
    const checks = [...document.querySelectorAll('.shift-check')];
    const allDone = checks.length && checks.every(x=>x.checked);
    if(!allDone && !confirm('Checklist cuối ca chưa hoàn thành. Vẫn checkout?')) return;
    rec.check_out_at = nowISO(); rec.status='done'; rec.checklist_done=!!allDone; saveLocal(); render(); toast('Đã checkout '+s.name);
  }
  function guessShift(){ const h=new Date().getHours(); if(h<12)return 'morning'; if(h<17)return 'afternoon'; return 'evening'; }
  function autoOffDemo(){
    const present = new Set(state.attendanceRecords.filter(r=>r.work_date===today()).map(r=>r.staff_code));
    state.staff.filter(s=>s.active && inUnit(s) && !present.has(s.code)).slice(0,10).forEach(s=>state.attendanceRecords.push({id:uid('OFF'), staff_code:s.code, unit_code:s.unit_code, work_date:today(), shift:'all_day', check_in_at:'', check_out_at:'', status:'off', checklist_done:false, note:'Auto OFF demo 17:50'}));
    saveLocal(); render(); toast('Đã ghi OFF demo cho nhân sự chưa chấm công');
  }
  async function addFinance(fd){ const row={id:uid('TXN'), unit_code:fd.unit_code, date:fd.date||today(), type:fd.type, account:fd.account||('TM_'+fd.unit_code), category:fd.category, amount:num(fd.amount), note:fd.note||'', created_at:nowISO()}; state.financeTransactions.unshift(row); saveLocal(); render(); toast('Đã lưu phiếu'); await supaInsert('fnb_finance_transactions', row); }
  async function addCashClose(fd){ const row={id:uid('CASH'), unit_code:fd.unit_code, date:fd.date||today(), kiot_cash:num(fd.kiot_cash), actual_cash:num(fd.actual_cash), cash_diff:num(fd.actual_cash)-num(fd.kiot_cash), kiot_bank:num(fd.kiot_bank), actual_bank:num(fd.actual_bank), bank_diff:num(fd.actual_bank)-num(fd.kiot_bank), note:fd.note||'', created_at:nowISO()}; state.cashClosings.unshift(row); saveLocal(); render(); toast('Đã chốt kết ca'); await supaInsert('fnb_cash_closing_sessions', row); }
  async function addMessage(fd){ const c=classifyMessage(fd.text); const msg={id:uid('MSG'), page:unitBy(fd.unit_code).name, unit_code:fd.unit_code, customer_name:fd.customer_name||'Khách inbox', text:fd.text, created_at:nowISO(), intent:c.intent, status:'new'}; state.pageMessages.unshift(msg); const lead={id:uid('LEAD'), customer_name:maskPhone(fd.customer_name||'Khách inbox'), unit_code:fd.unit_code, need:c.intent, source:'Facebook Page', status:'new', no_phone_public:true, note:'AI: '+c.next+' Trả lời gợi ý: '+aiReplyFor(fd.text, fd.unit_code)}; state.customerLeads.unshift(lead); state.notifications.unshift({id:uid('NOTI'), channel:'group', unit_code:fd.unit_code, content:buildGroupNotice(msg), created_at:nowISO()}); saveLocal(); ui.customerTab='inbox'; render(); toast('Đã tạo inbox, lead và thông báo nhóm'); await supaInsert('fnb_customer_messages', msg); await supaInsert('fnb_customer_leads', lead); }
  async function addStaff(fd){ const code = nextStaffCode(fd.unit_code, fd.role); const row={code, name:fd.name||code, unit_code:fd.unit_code, role:fd.role, position:fd.position||'', department:fd.department||'', salary_type:'monthly', base_salary:num(fd.base_salary), active:true, permissions:String(fd.permissions||'attendance').split(',').map(x=>x.trim()).filter(Boolean), created_at:nowISO()}; state.staff.push(row); saveLocal(); render(); toast('Đã tạo nhân sự '+code); await supaInsert('fnb_staff', row); }
  function nextStaffCode(unitCode, role){ if(role==='MANAGER'){ if(!state.staff.some(s=>s.code===unitCode+'_QL')) return unitCode+'_QL'; const qls=state.staff.filter(s=>s.code.startsWith(unitCode+'_QL')).length+1; return unitCode+'_QL'+String(qls).padStart(2,'0'); } const nums=state.staff.filter(s=>s.code.startsWith(unitCode+'_')).map(s=>Number((s.code.match(/_(\d+)$/)||[])[1]||0)); const next=Math.max(0,...nums)+1; return unitCode+'_'+String(next).padStart(2,'0'); }
  async function addRecipe(fd){ const row={id:uid('RCP'), product_code:fd.product_code, product_name:fd.product_name, ingredient_code:fd.ingredient_code, qty:num(fd.qty), created_at:nowISO()}; state.recipes.push(row); saveLocal(); render(); toast('Đã lưu định lượng'); await supaInsert('fnb_recipes', row); }
  async function addBooking(fd){ const row={id:uid('RES'), unit_code:fd.unit_code, room_id:fd.room_id, customer_name:fd.customer_name||'Khách', checkin:fd.checkin, checkout:fd.checkout, source:fd.source, status:'confirmed', total:num(fd.total), created_at:nowISO()}; state.reservations.unshift(row); const room=state.hotelRooms.find(r=>r.id===fd.room_id); if(room) room.status='occupied'; saveLocal(); render(); toast('Đã tạo booking'); await supaInsert('fnb_hotel_reservations', row); }
  function notifyMessage(id){ const msg=state.pageMessages.find(m=>m.id===id); if(!msg) return; const content=buildGroupNotice(msg); state.notifications.unshift({id:uid('NOTI'), channel:'group', unit_code:msg.unit_code, content, created_at:nowISO()}); msg.status='working'; saveLocal(); render(); toast('Đã tạo thông báo nhóm nội bộ'); navigator.clipboard?.writeText(content).catch(()=>{}); }
  function updateRoomStatus(id,status){ const r=state.hotelRooms.find(x=>x.id===id); if(!r)return; r.status=status; if(status==='dirty') state.housekeeping.unshift({id:uid('HSK'), unit_code:r.unit_code, room_id:r.id, task:'Dọn phòng '+r.room_no, status:'todo', due_date:today()}); saveLocal(); render(); toast('Đã cập nhật phòng '+r.room_no); }
  async function syncKiot(){
    try{ const res=await fetch((CONFIG.API_BASE||'/api')+'/kiotviet-sync',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({unit:ui.unit})}); const js=await res.json(); toast(js.message || 'Đã gọi sync KiotViet'); }
    catch(e){ toast('Chưa kết nối API KiotViet, đang dùng demo'); }
  }

  function init(){ render(); if(sb) loadSupabase(); }
  init();
})();
