## Chatbot Việt Nam – Trợ lý Cellphone Shop

Module này cung cấp một router Express sẵn dùng để gắn vào ứng dụng hiện có. Toàn bộ hội thoại đều bằng tiếng Việt và được xử lý thông qua Ollama (mặc định `http://localhost:11434` với model `qwen2.5:3b`). Không cần OpenAI hay bất kỳ dịch vụ đám mây nào khác.

### Cách cài đặt

1. Sao chép file môi trường:

   ```bash
   cp chatbot-vn/.env.example chatbot-vn/.env
   ```

2. Cập nhật `chatbot-vn/.env`:

   ```
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5:3b
   ```

3. Đảm bảo dự án đã cài `express`, `node-fetch`, `cors`, `dotenv`, `express-rate-limit`. Trước khi chạy cần khởi động Ollama bằng `ollama serve` và tải model mong muốn.

### Gắn router vào server Express

Trong file server chính, thêm:

```js
import makeChatRouter from "./chatbot-vn/chat.router.js";
import * as providers from "./chatbot-vn/providers.mock.js";

app.use(
  makeChatRouter({
    productsProvider: providers.productsProvider,
    orderProvider: providers.orderProvider,
  })
);
```

Router bao gồm:

- `GET /health` → kiểm tra kết nối Ollama.
- `POST /api/chat` → gọi Ollama với tool calling (searchProducts, checkOrder).
- `POST /api/chat/test` → ping nhanh tới Ollama.

### Kiểm tra nhanh (sau khi server chạy ở cổng 5000)

```bash
curl http://localhost:5000/health

curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Tôi muốn mua Samsung tầm 20 triệu"}'

curl -X POST http://localhost:5000/api/chat/test
```

### Thay thế mock provider bằng dữ liệu thật

- `productsProvider.search(params)` trả tối đa 3 sản phẩm phù hợp. Trả về `sku`, `name`, `brand`, `price`, `ram_gb`, `storage_gb`, `url`… Bạn có thể map trực tiếp từ DB/API nội bộ miễn giữ nguyên cấu trúc.
- `orderProvider.lookup(params)` nhận `order_id`, `phone_number` và trả trạng thái giao hàng.

Chỉ cần thay `providers.mock.js` bằng phần lấy dữ liệu thực tế, router sẽ hoạt động mà không cần sửa thêm logic.
