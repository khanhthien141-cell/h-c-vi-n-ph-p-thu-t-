# Chạy MILA bằng hai dịch vụ Render

Dùng cùng một repo GitHub cho cả hai dịch vụ. Static Site tải trang học sinh, trang quản trò, ảnh, âm thanh và mô hình 3D từ CDN. Web Service xử lý đăng nhập, mã phòng, thi đấu, câu hỏi và kết quả. Hai trang dùng chung Web Service nên học sinh vào đúng phòng do quản trò tạo. Chế độ luyện tập với máy chạy trong trình duyệt.

## 1. Tạo Static Site để lấy địa chỉ

Trong Render chọn **New → Static Site** và chọn repo game. Đặt tên, chẳng hạn `mila-game`. Ghi lại URL chính xác mà Render cấp. Có thể cấu hình máy chủ trước khi triển khai thành công phần này.

| Mục | Giá trị |
| --- | --- |
| Build Command | `npm ci && npm run build:frontend` |
| Publish Directory | `dist` |
| Environment | `NODE_VERSION=24.11.0` |
| Environment | `API_ORIGIN` là URL gốc của Web Service ở bước 2 |

## 2. Cấu hình Web Service giữ phòng

Nếu đã có Web Service chạy game, có thể dùng lại chính dịch vụ đó. Giữ nguyên `HOST_PASSWORD`, `DATA_DIR` và ổ đĩa nếu đã cấu hình để tiếp tục dùng cùng cơ sở dữ liệu. Khi tạo dịch vụ mới, đặt mật khẩu riêng trong Render.

| Mục | Giá trị |
| --- | --- |
| Build Command | `npm ci && npm run build:api` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Environment | `NODE_VERSION=24.11.0` |
| Environment | `HOST_PASSWORD` là mật khẩu quản trò |
| Environment | `FRONTEND_ORIGIN` là URL gốc của Static Site ở bước 1 |

Ví dụ `FRONTEND_ORIGIN=https://mila-game.onrender.com`. Dùng URL thực tế của bạn, với HTTPS, chỉ đến tên miền.

## 3. Nối hai dịch vụ và thử phòng

Sau khi Web Service chạy, điền URL của nó vào `API_ORIGIN` trên Static Site, lưu và triển khai lại Static Site để bản build nhận URL mới. Mở `/mc.html` trên **Static Site** để tạo phòng và dùng `/player.html` trên **cùng Static Site** để nhập mã. Link mời và QR cũng dẫn về trang học sinh trên đó. Nếu trước đây đã lưu tên hoặc phiên đăng nhập ở miền của Web Service, nhập lại trên miền mới.

Tách CDN giúp phần tải game và mô hình nhẹ cho máy chủ trận đấu. Nếu trận chạy khựng dù đã tải xong, kiểm tra ping và FPS. Mỗi phòng dùng một SQLite trên Web Service của nó. Giữ một Web Service cho cùng nhóm phòng để tránh dữ liệu phòng bị chia giữa nhiều máy. Xem `README.md` về cấu hình ổ đĩa bền vững nếu cần lưu phòng qua lần khởi động lại.
