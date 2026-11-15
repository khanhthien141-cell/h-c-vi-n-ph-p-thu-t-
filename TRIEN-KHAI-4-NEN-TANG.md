# MILA trên GitHub, Render, Cloudflare Pages và Netlify

Cập nhật một repo GitHub bằng mã trong gói này. Cả ba dịch vụ bên dưới đều kết nối **cùng repo, cùng nhánh**. GitHub giữ mã nguồn. Quản trò và học sinh mở cùng địa chỉ Cloudflare Pages. Trang đó lấy hình, nhạc và mô hình từ Netlify và gửi yêu cầu phòng, thi đấu tới Render.

## 1. Netlify phục vụ tài nguyên

Tạo dự án từ GitHub và chọn repo game.

- Build command `npm run build:assets`
- Publish directory `dist-assets`
- Node `24.11.0` qua biến môi trường `NODE_VERSION`

Sau khi deploy, thử mở `/assets/mila/academy-map.webp` trên địa chỉ Netlify. Giữ URL gốc của dự án để điền ở bước 3.

## 2. Render giữ phòng và xử lý trận

Dùng Web Service hiện tại nếu có. Giữ cấu hình `HOST_PASSWORD`, `DATA_DIR` và disk theo dịch vụ hiện tại. Khi tạo mới, đặt mật khẩu quản trò trong Environment.

- Build command `npm ci && npm run build:api`
- Start command `npm start`
- Health check `/api/health`
- Node `24.11.0` qua biến môi trường `NODE_VERSION`

Giữ URL gốc của Render để điền ở bước 3. Nếu đang có người chơi qua link Render cũ, giữ build command `npm ci && npm run build` trong lúc tạo và thử trang Cloudflare Pages, rồi đổi sang build chỉ chạy API sau khi chuyển người chơi sang trang mới.

## 3. Cloudflare Pages phục vụ trang chơi

Tạo dự án Pages qua Git integration và chọn repo game.

- Build command `npm run build:frontend`
- Build output directory `dist`
- `NODE_VERSION` là `24.11.0`
- `API_ORIGIN` là URL gốc HTTPS của Render
- `ASSET_ORIGIN` là URL gốc HTTPS của Netlify

Khi Cloudflare Pages cấp địa chỉ, vào **Environment** của Render. Đặt **`FRONTEND_ORIGIN` bằng URL gốc chính xác của Cloudflare Pages**, rồi triển khai lại Render. Cả ba biến URL chỉ nhận tên miền gốc, không có đường dẫn như `/api` hay `/assets`. Nếu chưa thiết lập Netlify, có thể để trống `ASSET_ORIGIN` để Pages tự phục vụ tệp game.

## 4. Thử cùng phòng

- Quản trò mở `/mc.html` trên Cloudflare Pages và tạo phòng.
- Học sinh mở `/player.html` trên Cloudflare Pages và nhập mã, hoặc dùng QR tạo từ trang quản trò.
- Thử một trận và đo xem phần còn chậm là tải tệp, FPS hay phản hồi mạng. Netlify phục vụ tệp đồ họa, còn đồng bộ trận vẫn do Render xử lý.
