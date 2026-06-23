function classifyMessage(text=''){
  const t = String(text).toLowerCase();
  if(/khiếu|phàn nàn|tệ|dở|chậm|bực|complain/.test(t)) return { intent:'Khiếu nại', priority:'high', next:'Xin lỗi khách, xin bill/thời gian/cơ sở và chuyển quản lý xử lý ngay.' };
  if(/phòng|hotel|khách sạn|check ?in|nghỉ|resort/.test(t)) return { intent:'Đặt phòng Hotel', priority:'medium', next:'Hỏi ngày nhận/trả phòng, số người, loại phòng, ngân sách.' };
  if(/karaoke|vip|sinh nhật|tiệc|party|bàn|đặt/.test(t)) return { intent:'Đặt bàn/tiệc/Karaoke', priority:'high', next:'Hỏi ngày giờ đến, số khách, khu vực mong muốn, ngân sách/người.' };
  if(/giá|menu|món|combo|beer|bia/.test(t)) return { intent:'Hỏi giá/Menu', priority:'medium', next:'Gửi menu ngắn, hỏi số khách và thời gian đến để giữ bàn.' };
  return { intent:'Khách hỏi chung', priority:'normal', next:'Chào khách, hỏi nhu cầu chính: đặt bàn, đặt tiệc, karaoke hay đặt phòng.' };
}
function ruleReply(text='', unitName='Friendzone'){
  const c = classifyMessage(text);
  if(c.intent==='Đặt bàn/tiệc/Karaoke') return `Dạ em chào anh/chị. ${unitName} có hỗ trợ đặt bàn, tiệc sinh nhật và phòng VIP Karaoke. Anh/chị cho em xin ngày giờ đến, số lượng khách và muốn ngồi sân vườn hay phòng riêng để em kiểm tra chỗ phù hợp ạ.`;
  if(c.intent==='Đặt phòng Hotel') return `Dạ em chào anh/chị. Anh/chị cho em xin ngày nhận phòng, ngày trả phòng, số lượng người và loại phòng mong muốn để em kiểm tra phòng trống ạ.`;
  if(c.intent==='Khiếu nại') return `Dạ em rất xin lỗi vì trải nghiệm chưa tốt. Anh/chị cho em xin thời gian sử dụng dịch vụ và nội dung cụ thể, quản lý sẽ kiểm tra và phản hồi ngay ạ.`;
  if(c.intent==='Hỏi giá/Menu') return `Dạ bên em có nhiều món/combos tuỳ số lượng khách. Anh/chị đi khoảng bao nhiêu người và muốn dùng bữa, nhậu nhẹ hay đặt tiệc để em tư vấn menu phù hợp ạ.`;
  return `Dạ em chào anh/chị. Anh/chị đang cần đặt bàn, đặt tiệc, phòng VIP Karaoke hay đặt phòng khách sạn ạ? Em sẽ tư vấn nhanh cho mình.`;
}
async function aiReply({ text, unitName }){
  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  if(!apiKey) return { provider:'rule', reply: ruleReply(text, unitName), classify: classifyMessage(text) };
  // Bản nền ưu tiên rule-based để chạy ổn. Có thể thay bằng OpenAI/Gemini trong vòng sau.
  return { provider:'rule', reply: ruleReply(text, unitName), classify: classifyMessage(text) };
}
module.exports = { classifyMessage, ruleReply, aiReply };
