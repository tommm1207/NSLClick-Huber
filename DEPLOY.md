# Hướng dẫn Deploy NSL Portal

Dự án này là một ứng dụng Express.js. Dưới đây là hướng dẫn để deploy lên **Vercel** và quản lý trên **GitHub**.

## 1. Chuẩn bị (GitHub)
- Bạn đã có file `.gitignore` để tránh đẩy `node_modules` và `.env` lên GitHub.
- Đảm bảo bạn đã khởi tạo git và push code lên một repository trên GitHub.

## 2. Deploy lên Vercel
Vercel là nền tảng tốt nhất để deploy ứng dụng này nhanh chóng.

### Các bước thực hiện:
1. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2. Nhấn **Add New** -> **Project**.
3. Chọn repository của bạn từ danh sách GitHub.
4. Trong phần **Environment Variables**, hãy thêm tất cả các biến có trong file `.env` của bạn (ví dụ: `SESSION_SECRET`, `ADMIN_PASSWORD`, v.v.).
5. Nhấn **Deploy**.

### Lưu ý quan trọng khi dùng Vercel:
- **Hệ thống file (Read-only):** Vercel sử dụng Serverless Functions, nên folder `uploads/` sẽ không hoạt động để lưu file lâu dài. Khi server restart, các file đã upload sẽ bị mất. 
    - *Giải pháp:* Bạn nên sử dụng các dịch vụ lưu trữ bên ngoài như **Cloudinary** hoặc **AWS S3** cho phần upload ảnh/video.
- **Dữ liệu Mock:** Biến `MOCK_DATA` trong `server.js` sẽ bị reset mỗi khi server nghỉ (idle). 
    - *Giải pháp:* Để giữ dữ liệu, hãy kết nối với Database (như MongoDB, Supabase) hoặc dùng đúng SharePoint API như code đã chuẩn bị.

## 3. Cấu hình file đã tạo
- `vercel.json`: Cấu hình để Vercel hiểu đây là một ứng dụng Node.js/Express.
- `package.json`: Đã thêm script `"start": "node server.js"`.
- `.gitignore`: Loại bỏ các file rác và file chứa thông tin bảo mật.

## 4. Deploy lên các nền tảng khác (Render/Railway)
Nếu bạn muốn lưu file trực tiếp trên host (mặc dù không khuyến khích cho production), bạn có thể dùng **Render.com** hoặc **Railway.app** vì chúng hỗ trợ "Persistent Disk".
