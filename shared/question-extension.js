// Additional non-current-events questions for the official knowledge bank.
// Each statement has an unambiguous true/false answer.
const statements=[
 ['“She is a student” là câu tiếng Anh ở thì hiện tại đơn.',true,'Tiếng Anh'],
 ['“They is happy” là cách chia động từ to be chuẩn.',false,'Tiếng Anh'],
 ['“Children” là dạng số nhiều của “child”.',true,'Tiếng Anh'],
 ['“Mouses” là dạng số nhiều thông dụng của “mouse” khi chỉ con chuột.',false,'Tiếng Anh'],
 ['“Beautiful” là một tính từ trong tiếng Anh.',true,'Tiếng Anh'],
 ['“Quickly” luôn là một danh từ.',false,'Tiếng Anh'],
 ['“Yesterday” thường dùng để nói về thời gian quá khứ.',true,'Tiếng Anh'],
 ['“Tomorrow” dùng để chỉ ngày hôm qua.',false,'Tiếng Anh'],
 ['“An apple” dùng an vì apple bắt đầu bằng âm nguyên âm.',true,'Tiếng Anh'],
 ['“A hour” là cách viết đúng vì hour bắt đầu bằng chữ h.',false,'Tiếng Anh'],
 ['“Went” là dạng quá khứ của “go”.',true,'Tiếng Anh'],
 ['“Eated” là dạng quá khứ chuẩn của “eat”.',false,'Tiếng Anh'],
 ['“Better” có thể là dạng so sánh hơn của “good”.',true,'Tiếng Anh'],
 ['“More tall” là dạng so sánh hơn thông dụng của “tall”.',false,'Tiếng Anh'],
 ['“I have lived here for two years” dùng thì hiện tại hoàn thành.',true,'Tiếng Anh'],
 ['“He don’t like tea” là câu chia trợ động từ chuẩn ở hiện tại đơn.',false,'Tiếng Anh'],
 ['“There are three books” dùng are vì chủ ngữ số nhiều.',true,'Tiếng Anh'],
 ['“Much apples” thường dùng để nói số lượng táo đếm được.',false,'Tiếng Anh'],
 ['“Can” thường đi với động từ nguyên mẫu không to.',true,'Tiếng Anh'],
 ['“Must to go” là cấu trúc chuẩn sau động từ khuyết thiếu must.',false,'Tiếng Anh'],
 ['“Unhappy” có tiền tố un- mang nghĩa phủ định.',true,'Tiếng Anh'],
 ['“Sing” là một trạng từ chỉ cách thức.',false,'Tiếng Anh'],
 ['“Careful” có thể là tính từ chỉ sự cẩn thận.',true,'Tiếng Anh'],
 ['“Than” dùng để chỉ thời điểm sau khi.',false,'Tiếng Anh'],
 ['“Where” có thể dùng để hỏi về địa điểm.',true,'Tiếng Anh'],
 ['“Who” chỉ dùng để hỏi thời gian.',false,'Tiếng Anh'],
 ['“At 7 o’clock” là cụm chỉ thời gian.',true,'Tiếng Anh'],
 ['“In Monday” là giới từ thời gian chuẩn cho thứ Hai.',false,'Tiếng Anh'],
 ['“How many” thường hỏi số lượng danh từ đếm được.',true,'Tiếng Anh'],
 ['“How much” luôn dùng với mọi danh từ số nhiều đếm được.',false,'Tiếng Anh'],
 ['Trong nhịp 6/8, mỗi ô nhịp có tổng độ dài bằng sáu nốt móc đơn.',true,'Âm nhạc'],
 ['Dấu thăng làm nốt nhạc thấp xuống nửa cung.',false,'Âm nhạc'],
 ['Ký hiệu giáng thường làm giảm cao độ một nửa cung.',true,'Âm nhạc'],
 ['Dấu hóa bất thường luôn có hiệu lực cho mọi bản nhạc tiếp theo.',false,'Âm nhạc'],
 ['Hợp âm ba cơ bản gồm ba âm khác tên nốt.',true,'Âm nhạc'],
 ['Âm sắc và cao độ là một khái niệm hoàn toàn giống nhau.',false,'Âm nhạc'],
 ['Một nốt trắng thông thường dài bằng hai nốt đen.',true,'Âm nhạc'],
 ['Một nốt tròn ngắn bằng một nốt móc đơn.',false,'Âm nhạc'],
 ['Vibrato là sự dao động nhỏ, có tính chu kỳ của cao độ.',true,'Âm nhạc'],
 ['Staccato là chỉ dẫn ngân dài và nối liền mọi nốt.',false,'Âm nhạc'],
 ['Nhạc đa âm cho phép nhiều tuyến giai điệu cùng xuất hiện.',true,'Âm nhạc'],
 ['Nhạc đơn âm bắt buộc phải có ít nhất ba bè độc lập.',false,'Âm nhạc'],
 ['Nhịp trưởng giúp người biểu diễn định hướng chu kỳ phách.',true,'Âm nhạc'],
 ['Dấu luyến luôn mang nghĩa phải phát âm thêm một nốt mới.',false,'Âm nhạc'],
 ['Khoảng cách từ Đô đến Mi trong âm giai Đô trưởng là quãng ba trưởng.',true,'Âm nhạc'],
 ['Khoảng cách giữa Đô và Đô cao hơn một quãng tám là quãng năm.',false,'Âm nhạc'],
 ['Từ trường có thể tác dụng lực lên nam châm.',true,'Khoa học'],
 ['Không khí hoàn toàn không có khối lượng.',false,'Khoa học'],
 ['Ánh sáng trắng có thể tách thành nhiều màu qua lăng kính.',true,'Khoa học'],
 ['Truyền nhiệt chỉ có thể diễn ra trong chân không.',false,'Khoa học'],
 ['Chất rắn có thể nở ra khi được nung nóng.',true,'Khoa học'],
 ['Nước đóng băng ở 100°C dưới áp suất khí quyển tiêu chuẩn.',false,'Khoa học'],
 ['Tia sáng có thể phản xạ khi gặp gương.',true,'Khoa học'],
 ['Mọi vật liệu đều dẫn điện tốt như đồng.',false,'Khoa học'],
 ['Rễ cây có thể hấp thụ nước và muối khoáng.',true,'Khoa học'],
 ['Lá cây không bao giờ trao đổi khí với môi trường.',false,'Khoa học'],
 ['Giải thích đáp án bằng lập luận giúp người nghe kiểm tra kết luận.',true,'Tư duy'],
 ['Một ý kiến được nhiều người thích thì chắc chắn là sự thật.',false,'Tư duy'],
 ['Kiểm tra dữ liệu đầu vào là một phần của phát triển phần mềm.',true,'Tin học'],
 ['Đặt mật khẩu giống nhau cho mọi tài khoản luôn an toàn hơn.',false,'An toàn số']
];
export const extendedQuestions=statements.map(([text,answer,topic],i)=>({
 id:'extension-'+i,text,answer,topic,difficulty:i%5===0?'Khó':'Trung bình',round:i%3
}));
for(let i=0;i<40;i++){
 const n=i+12,kind=i%4,answer=i%2===0;
 const value=kind===0?n*(i%7+3):kind===1?3*n:kind===2?4*n+4:n;
 const shown=value+(answer?0:1+(i%3));
 const text=kind===0?'Tích của '+n+' và '+(i%7+3)+' bằng '+shown+'.':
   kind===1?'Lấy '+(4*n)+' trừ '+n+' được '+shown+'.':
   kind===2?'Hình chữ nhật rộng '+n+' cm, dài '+(n+2)+' cm có chu vi '+shown+' cm.':
   '25% của '+(4*n)+' bằng '+shown+'.';
 extendedQuestions.push({id:'extension-math-'+i,text,answer,topic:'Toán ứng dụng',difficulty:i%3?'Trung bình':'Dễ',round:i%3});
}
