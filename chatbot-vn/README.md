## Chatbot Viet Nam - Tro ly Cellphone Shop

Router Express san dung de gan vao ung dung hien co. Toan bo hoi thoai bang tieng Viet (khong dau), chay qua Ollama (mac dinh `http://localhost:11434` voi model `qwen2.5:3b`). Khong can OpenAI hay dich vu dam may.
Chatbot luon hien gia cuoi va % giam neu co (khong tu tinh neu tool khong tra ve).

### Cai dat
1. Sao chep file moi truong:
   ```bash
   cp chatbot-vn/.env.example chatbot-vn/.env
   ```
2. Cap nhat `chatbot-vn/.env` (xem cac bien ben duoi).
3. Dam bao app da cai `express`, `node-fetch`, `cors`, `dotenv`, `express-rate-limit`. Khoi dong Ollama voi `ollama serve` va tai model mong muon.

### Bien moi truong chinh
- `OLLAMA_URL` (mac dinh `http://localhost:11434`)
- `OLLAMA_MODEL` (mac dinh `qwen2.5:3b`)
- `OLLAMA_TEMPERATURE` (mac dinh `0.2`, giam de bam sat du lieu)
- `OLLAMA_TOP_P` (mac dinh `0.85`)
- `OLLAMA_TOP_K` (mac dinh `40`)
- `OLLAMA_NUM_PREDICT` (mac dinh `300`, gioi han do dai tra loi cho nhanh)
- `OLLAMA_TIMEOUT_MS` (mac dinh `15000`, huy request neu Ollama qua cham)

### Gan router vao server Express
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

Router bao gom:
- `GET /health` - kiem tra ket noi Ollama.
- `POST /api/chat` - goi Ollama voi tool calling (searchProducts, checkOrder).
- `POST /api/chat/test` - ping nhanh toi Ollama.

### Kiem tra nhanh (sau khi server chay cong 5000)
```bash
curl http://localhost:5000/health

curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Toi muon mua Samsung tam 20 trieu"}'

curl -X POST http://localhost:5000/api/chat/test
```

### Thay mock provider bang du lieu that
- `productsProvider.search(params)` tra toi da 3 san pham phu hop. Tra ve `sku`, `name`, `brand`, `price`, `ram_gb`, `storage_gb`, `url`... Ban co the map truc tiep tu DB/API noi bo mien giu nguyen cau truc.
- `orderProvider.lookup(params)` nhan `order_id`, `phone_number` va tra trang thai giao hang.

Chi can thay `providers.mock.js` bang phan lay du lieu thuc te, router se hoat dong ma khong phai sua them logic.
