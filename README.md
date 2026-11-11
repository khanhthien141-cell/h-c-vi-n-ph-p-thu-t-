# MILA khanitta 2.1

Game học viện phép thuật, giao diện tiếng Việt. 12 nhân vật 3D, chơi thử với máy hoặc phòng trực tuyến 1 vs 1 / 5 vs 5 / giải 4 đội. Quản trò duyệt học sinh, mở chọn tướng 20 giây rồi bắt đầu trận. 400 câu Đúng/Sai, xuất kết quả Excel và in PDF.

## Chạy trên máy tính
1. Cài Node.js 24 LTS.
2. Giải nén, mở Terminal trong thư mục có `package.json`.
3. Chạy `npm ci`, rồi `npm run build`.
4. Sao chép `.env.example` thành `.env`. Mật khẩu MC ban đầu: `26092009`; nên đổi trong trang quản trò sau khi đăng nhập.
5. Chạy `npm start`. Mở `http://localhost:3000/player.html`; quản trò ở `/mc.html`; nút luyện tập trong trang người chơi dùng cùng hệ thống chiến đấu 3D.

Không mở file HTML bằng nhấp đúp: game cần máy chủ HTTP.

## Đưa lên GitHub và Render
1. Tạo repository GitHub. Đưa **toàn bộ cây thư mục** đã giải nén vào repository, giữ nguyên `public`, `shared`, `worker`, `server`, `scripts`, `drizzle`. Không đưa `.env`, `data`, `node_modules` lên GitHub.
2. Trong Render tạo **Web Service**, kết nối repository.
3. Build Command: `npm ci && npm run build`. Start Command: `npm start`.
4. Environment: `NODE_VERSION=24.11.0`, `HOST_PASSWORD` là mật khẩu riêng của bạn. Không ghi mật khẩu vào JavaScript công khai.
5. Deploy. Link người chơi: `https://TEN-DICH-VU.onrender.com/player.html`; MC: `/mc.html`; bản thử: `/trial/index.html`.
6. Muốn giữ phòng và kết quả qua lần triển khai/khởi động lại: gắn persistent disk, đặt `DATA_DIR=/var/data/arcana`, mount `/var/data`. Xem `render-persistent.yaml`. Render không có disk bền vững sẽ có nguy cơ mất dữ liệu khi thay máy/triển khai. Bản `render.yaml` chỉ phù hợp thử nghiệm.

GitHub lưu mã nguồn; GitHub Pages không chạy máy chủ nhiều người chơi này. Có thể dùng GitHub Desktop để đưa nguyên thư mục lên, tránh mất cấu trúc khi tải lẻ từng tệp.

## Cách chơi ngắn gọn
- MC đăng nhập → chọn thể thức → Tạo phòng → đặt tên đội → gửi mã/link.
- Học sinh nhập biệt danh và mã → Tìm đội → chọn đội → vào sảnh. Không cần tài khoản.
- MC duyệt học sinh → Mở chọn tướng. Học sinh chọn và chốt; giữ ảnh 3 giây để xem chiêu.
- MC bấm Bắt đầu trận khi hai đội sẵn sàng.
- Tay trái di chuyển; kéo sân bằng tay phải để nhìn quanh; bấm nút kiếm/chiêu để đánh. PC: WASD, kéo chuột, Space/Q/E/R.
- Hạ đối thủ để lên cấp. Khi lên cấp hoặc bị hạ: trả lời câu hỏi trong 10 giây. Sai không được thưởng. Đúng mở chiêu cuối. Hồi sinh sau 10 giây.
- Điểm cuối: 50% chiến đấu + 50% kiến thức. Câu hỏi xáo trộn và không lặp trong cùng trận; hết ngân hàng thì ngừng phát câu mới.

## Quản trò và trình chiếu
Chỉ phiên MC đã xác thực mới tạo/điều khiển phòng, chỉnh điểm, sửa/nhập câu hỏi hay xuất dữ liệu. Trong Câu hỏi · Cấu hình · Kết quả chọn Đổi mật khẩu MC. Các phiên cũ bị vô hiệu sau đổi mật khẩu. Mật khẩu mới được lưu dạng PBKDF2, không lưu nguyên văn.
Trình chiếu có toàn sân 3D, theo hai đội, góc mắt của từng học sinh, góc sau lưng từng học sinh và tự luân phiên người xem theo chu kỳ khoảng 5 giây. Đây là dựng lại góc nhìn từ trạng thái trận và hướng camera, không phải video chia sẻ màn hình điện thoại. Menu/câu hỏi riêng của học sinh không phát lên màn hình MC.

## Chỉnh nhân vật, hình ảnh và nhạc
- Mở `/trial/models.html`, chọn nhân vật → Tải nhân vật GLB.
- Blender: File → Import → glTF 2.0 → chọn `.glb`. Mô hình có bộ phận riêng, chưa có skeleton skinning. Sửa mô hình GLB không tự cập nhật game; bản này dựng mô hình từ `public/hero-models.js` và `public/trial/hero-models.js`.
- Màu, mặt, tóc, trang phục: hai file `hero-models.js` trên. Sân: `courtyard.js`. Chiêu: `spell-fx.js`. Giao diện: `mila.css`, `viewport.css`.
- Ảnh: `public/assets/mila`; nhạc: `public/assets/audio/sanh.ogg` và `chien-dau.ogg`. Giữ tên tệp để thay trực tiếp.
- Câu hỏi chính: `shared/questions.js`; bản thử: `public/trial/shared/questions.js`. MC cũng nhập Excel (CauHoi, DapAn TRUE/FALSE, Vong 0/1/2, DoKho, ChuDe).

## Điện thoại và giới hạn kiểm thử
Giao diện tự thích ứng theo hướng màn hình thật: có thể chơi **dọc hoặc ngang**, không xoay giả lập 90° và không yêu cầu khóa xoay thiết bị. Điện thoại dọc sử dụng HUD, joystick, nút chiêu và giao diện chọn tướng riêng; khi người chơi tự xoay ngang, giao diện tự bố trí lại. Nếu WebGL không khả dụng, chuyển sang bản đồ và nhân vật minh họa Canvas2D nhẹ hơn. Chế độ tương thích này không có chất lượng 3D hay góc nhìn thứ nhất như WebGL.
Không thể bảo đảm mọi đời điện thoại, mọi trình duyệt nhúng đều chạy giống nhau. Nếu trình duyệt trong Zalo hạn chế đồ họa, mở link bằng Safari/Chrome cập nhật. Nhạc chỉ phát sau thao tác người dùng theo giới hạn trình duyệt.
Mô hình được dựng lại theo màu sắc/đặc điểm ảnh 2D, chưa có đánh giá chứng minh độ giống 80–90%. Kiểm thử tự động không thay thế kiểm thử trên điện thoại thật.

## Dữ liệu và mã nguồn
Node/Render sử dụng SQLite tại `DATA_DIR/mila.sqlite`; bản hosted sử dụng D1 qua cùng API. Bản Node trước đây dùng `arcana.json` chưa có công cụ nhập lịch sử sang SQLite; giữ bản sao dữ liệu cũ trước nâng cấp. Phòng hosted cũ giữ dữ liệu nhưng phiên MC cũ không còn được tin cậy sau bật bảo vệ mật khẩu.
Chạy `npm test` để build và kiểm thử. Bản này dùng HTTP polling; không cần cấu hình Socket.IO riêng. Độ trễ Internet vẫn ảnh hưởng đồng bộ dù hình ảnh được nội suy.
