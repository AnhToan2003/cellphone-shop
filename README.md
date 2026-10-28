## Cellphone Shop

Ứng dụng MERN mô phỏng trải nghiệm mua sắm tại CellphoneS. Hệ thống hỗ trợ quản lý hồ sơ cá nhân, phân hạng khách hàng theo chi tiêu, khuyến mãi linh hoạt và cho phép người mua chủ động huỷ đơn.

### Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Zod, JWT, bcrypt, Multer  
- **Frontend:** Vite, React, React Router, Tailwind CSS, Redux Toolkit, react-hot-toast  
- **Tooling:** Jest + Supertest, concurrently, Nodemon

### Yêu cầu

- Node.js 22.x
- MongoDB (local hoặc hosted)

### Cài đặt

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### Biến môi trường

Tạo `server/.env` (hoặc sao chép từ `server/.env.example`):

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cellphones-shop
JWT_SECRET=your-strong-secret
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://localhost:4173
```

Tùy chọn `client/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### Sử dụng

- Chạy song song API và client (http://localhost:5000):

  ```bash
  npm run dev
  ```

- Seed dữ liệu mẫu (tài khoản admin + 4 sản phẩm):

  ```bash
  npm run seed
  ```

- Kiểm tra backend bằng smoke test:

  ```bash
  npm run test
  ```

- Build gói production cho client:

  ```bash
  npm run build
  ```

- Chạy kiểm thử backend và giao diện (Playwright kiểm tra luồng mua cơ bản và các viewport từ 320px đến 1440px):

  ```bash
  npm run test:all
  ```

### Triển khai lên Vercel

Project đã có `vercel.json` cho Vite SPA và Express API. Trước khi deploy, tạo project MongoDB có thể truy cập từ Vercel và cấu hình các biến môi trường Production trong Vercel: `MONGODB_URI`, `JWT_SECRET` (chuỗi ngẫu nhiên dài ít nhất 32 ký tự), `CLIENT_URL` (domain production chính thức) và `BLOB_READ_WRITE_TOKEN` (Vercel Blob để lưu ảnh tải lên). Chỉ `VITE_*` mới được đưa vào bundle client; không đặt bí mật ở các biến này.

Đăng nhập Vercel CLI, liên kết project rồi triển khai:

```bash
npx vercel login
npx vercel link
npx vercel deploy --prod
```

Tạo tài khoản admin riêng bằng `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` và kết nối tới cùng `MONGODB_URI`, sau đó chạy `npm run seed:admin` một lần. Không dùng database local hoặc token mẫu cho production. Vercel CLI cần đăng nhập và các biến môi trường production phải được cấu hình trước khi ứng dụng có thể vận hành đầy đủ.

### Tạo tài khoản quản trị

Hệ thống không còn tự tạo tài khoản quản trị với mật khẩu mặc định. Sao chép `server/.env.example` thành `server/.env`, đặt `ADMIN_EMAIL`, `ADMIN_USERNAME` và một `ADMIN_PASSWORD` riêng có ít nhất 12 ký tự, sau đó chạy:

```bash
npm run seed:admin
```

Không dùng mật khẩu mẫu trong môi trường production.

### Cấu trúc thư mục

```
server/  Express API (controllers, routes, middleware, Mongoose models)
client/  Vite + React SPA xây dựng cùng Tailwind
```

### Tài liệu API chính

| Phương thức | Endpoint                 | Mô tả                                             |
|-------------|--------------------------|---------------------------------------------------|
| GET         | `/api/orders/me`         | Lấy danh sách đơn hàng của người dùng hiện tại    |
| PATCH       | `/api/orders/:id/cancel` | Huỷ đơn hàng khi vẫn ở trạng thái chờ xử lý       |
| GET         | `/api/products/:slug`    | Lấy chi tiết sản phẩm kèm giá theo biến thể       |
| GET         | `/api/products/:slug/reviews` | Lấy danh sách đánh giá kèm trạng thái `canReview` |
| POST        | `/api/products/:slug/reviews` | Gửi đánh giá sản phẩm đã mua                      |
| GET         | `/api/admin/products`    | Danh sách sản phẩm cho admin                      |
| POST        | `/api/admin/products`    | Tạo sản phẩm (kèm màu sắc, dung lượng, biến thể)  |
| PUT         | `/api/admin/products/:id`| Cập nhật sản phẩm                                 |
| DELETE      | `/api/admin/products/:id`| Xoá sản phẩm                                      |
| GET         | `/api/promotions`        | Danh sách khuyến mãi                              |
| POST        | `/api/promotions`        | Tạo chương trình khuyến mãi                       |
| PATCH       | `/api/promotions/:id`    | Cập nhật khuyến mãi (trạng thái, phạm vi, thời gian) |
| DELETE      | `/api/promotions/:id`    | Xoá khuyến mãi                                    |

Tất cả response tuân theo cấu trúc `{ success, message, data }`.

### Tính năng nổi bật

- Hồ sơ cá nhân: cập nhật tên, số điện thoại, địa chỉ; theo dõi hạng khách hàng và lý do phân hạng.
- Phân hạng khách hàng (Đồng, Bạc, Vàng, Kim cương) dựa trên tổng chi tiêu; thể hiện trên giao diện và API.
- Khuyến mãi linh hoạt: hỗ trợ áp dụng toàn cửa hàng, theo sản phẩm hoặc theo hạng khách hàng; giá ưu đãi được hiển thị xuyên suốt trang chi tiết và quá trình đặt hàng.
- Người mua có thể huỷ đơn khi đơn còn ở trạng thái chưa giao; hệ thống hoàn tồn kho và cập nhật trạng thái chi tiết.
- Admin panel quản lý người dùng, đơn hàng, sản phẩm, khuyến mãi, banner.

### Ghi chú

- Zod được sử dụng để kiểm tra payload trước khi ghi dữ liệu vào MongoDB.  
- React giao diện phong cách CellphoneS với grid responsive, skeleton loading và toast thông báo thân thiện.
